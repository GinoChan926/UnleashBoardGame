"use strict";

const RECONNECT_GRACE_MS = 60000;   // 1 minute to reconnect
const TURN_AUTO_END_MS   = 30000;   // Auto-end turn 30s after disconnect

const disconnectTimers = new Map();  // playerId → timerId

/**
 * Called when a player's WebSocket closes.
 * If it was their turn, we may auto-end after a delay to keep the game moving.
 */
function handlePlayerDisconnect(ws, roomId, rooms, broadcastToRoom) {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(ws);
    if (!player) return;

    console.log(`👋 玩家斷線: ${player.playerName} (room: ${roomId})`);

    // Mark as disconnected but don't remove yet
    player.disconnected      = true;
    player.disconnectedAt    = Date.now();
    player.disconnectedWs    = ws;  // save reference in case of reconnect

    // Notify other players
    broadcastToRoom(roomId, {
        type:       'player_temp_disconnected',
        playerId:   player.playerId,
        playerName: player.playerName,
        message:    `⚠️ ${player.playerName} 暫時斷線，等待重連中... (60秒)`,
        graceMs:    RECONNECT_GRACE_MS
    });

    broadcastToRoom(roomId, {
        type:    'notification',
        message: `⚠️ ${player.playerName} 暫時斷線，等待重連中...`
    });

    // ── If it was their turn, schedule auto-end ─────────────────────────
    if (player.gameState.isMyTurn) {
        console.log(`⏰ ${player.playerName} 斷線時輪到他，${TURN_AUTO_END_MS/1000}秒後自動結束回合`);

        broadcastToRoom(roomId, {
            type:    'notification',
            message: `⏰ ${player.playerName} 回合將在 ${TURN_AUTO_END_MS/1000} 秒後自動結束`
        });

        const autoEndTimer = setTimeout(() => {
            _autoEndTurn(player, roomId, rooms, broadcastToRoom);
        }, TURN_AUTO_END_MS);

        disconnectTimers.set(`${player.playerId}_turn`, autoEndTimer);
    }

    // ── Schedule full removal after grace period ────────────────────────
    const removeTimer = setTimeout(() => {
        _removePlayerPermanently(player, roomId, rooms, broadcastToRoom);
    }, RECONNECT_GRACE_MS);

    disconnectTimers.set(`${player.playerId}_remove`, removeTimer);
}

/**
 * Called from JoinHandler when a player reconnects.
 * Cancels the removal timer and restores the player.
 */
function handlePlayerReconnect(ws, roomId, rooms, existingPlayer, broadcastToRoom) {
    const room = rooms.get(roomId);
    if (!room) return false;

    // Cancel any pending removal / auto-end
    const removeKey = `${existingPlayer.playerId}_remove`;
    const turnKey   = `${existingPlayer.playerId}_turn`;

    if (disconnectTimers.has(removeKey)) {
        clearTimeout(disconnectTimers.get(removeKey));
        disconnectTimers.delete(removeKey);
    }
    if (disconnectTimers.has(turnKey)) {
        clearTimeout(disconnectTimers.get(turnKey));
        disconnectTimers.delete(turnKey);
    }

    // Update the WS reference
    if (existingPlayer.disconnectedWs) {
        room.players.delete(existingPlayer.disconnectedWs);
    }
    room.players.set(ws, existingPlayer);

    // Clear disconnect flags
    existingPlayer.disconnected   = false;
    existingPlayer.disconnectedAt = null;
    existingPlayer.disconnectedWs = null;

    console.log(`🔌 玩家重連: ${existingPlayer.playerName}`);

    broadcastToRoom(roomId, {
        type:       'player_reconnected',
        playerId:   existingPlayer.playerId,
        playerName: existingPlayer.playerName,
        message:    `✅ ${existingPlayer.playerName} 已重新連接！`
    });

    broadcastToRoom(roomId, {
        type:    'notification',
        message: `✅ ${existingPlayer.playerName} 已重新連接！`
    });

    return true;
}

// ==================== Private ====================

function _autoEndTurn(player, roomId, rooms, broadcastToRoom) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Player might have reconnected in the meantime
    if (!player.disconnected) {
        console.log(`⏰ ${player.playerName} 已重連，取消自動結束回合`);
        return;
    }

    if (!player.gameState.isMyTurn) return;  // no longer their turn

    console.log(`⏰ 自動結束 ${player.playerName} 的回合`);

    // Mark as rolled so end-turn doesn't complain
    player.gameState.hasRolledThisTurn = true;

    // Advance turn to next connected player
    const playersArray = Array.from(room.players.values());
    const currentIndex = playersArray.findIndex(p => p.playerId === player.playerId);

    // Find next NON-disconnected player
    let nextPlayer = null;
    for (let i = 1; i <= playersArray.length; i++) {
        const candidate = playersArray[(currentIndex + i) % playersArray.length];
        if (!candidate.disconnected) {
            nextPlayer = candidate;
            break;
        }
    }

    if (!nextPlayer) {
        console.log(`⏸️ 沒有其他線上玩家，遊戲暫停`);
        broadcastToRoom(roomId, {
            type:    'notification',
            message: `⏸️ 所有玩家離線，等待重連...`
        });
        return;
    }

    player.gameState.isMyTurn     = false;
    nextPlayer.gameState.isMyTurn = true;
    room.currentTurnPlayer        = nextPlayer.playerName;

    // Sync currentTurnPlayer across all players
    room.players.forEach(p => {
        p.gameState.currentTurnPlayer = nextPlayer.playerName;
    });

    broadcastToRoom(roomId, {
        type:      'turn_ended',
        playerId:  player.playerId,
        gameState: player.gameState
    });

    broadcastToRoom(roomId, {
        type:      'state_updated',
        playerId:  player.playerId,
        gameState: player.gameState
    });

    broadcastToRoom(roomId, {
        type:      'state_updated',
        playerId:  nextPlayer.playerId,
        gameState: nextPlayer.gameState
    });

    broadcastToRoom(roomId, {
        type:              'turn_status',
        currentTurnPlayer: nextPlayer.playerName
    });

    broadcastToRoom(roomId, {
        type:    'notification',
        message: `⏰ ${player.playerName} 因斷線自動結束回合 → 輪到 ${nextPlayer.playerName}`
    });
}

function _removePlayerPermanently(player, roomId, rooms, broadcastToRoom) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Player might have reconnected
    if (!player.disconnected) {
        console.log(`✅ ${player.playerName} 已重連，取消永久移除`);
        return;
    }

    console.log(`🗑️ 永久移除玩家: ${player.playerName} (grace period expired)`);

    // Remove from room
    if (player.disconnectedWs) {
        room.players.delete(player.disconnectedWs);
    }

    // If it was still their turn somehow, advance
    if (player.gameState.isMyTurn) {
        const playersArray = Array.from(room.players.values());
        if (playersArray.length > 0) {
            const nextPlayer = playersArray[0];
            nextPlayer.gameState.isMyTurn = true;
            room.currentTurnPlayer        = nextPlayer.playerName;

            broadcastToRoom(roomId, {
                type:      'state_updated',
                playerId:  nextPlayer.playerId,
                gameState: nextPlayer.gameState
            });

            broadcastToRoom(roomId, {
                type:              'turn_status',
                currentTurnPlayer: nextPlayer.playerName
            });
        }
    }

    // Clean up any pending state on the room
    if (room.pendingEvents)             room.pendingEvents.delete(player.disconnectedWs);
    if (room.pendingTypeSelections)     room.pendingTypeSelections.delete(player.disconnectedWs);
    if (room.pendingHardshipChoices)    room.pendingHardshipChoices.delete(player.disconnectedWs);
    if (room.pendingLierQueue)          room.pendingLierQueue.delete(player.disconnectedWs);
    if (room.pendingFlowChoices)        room.pendingFlowChoices.delete(player.disconnectedWs);
    if (room.pendingRevelationEvents)   room.pendingRevelationEvents.delete(player.disconnectedWs);

    // Notify remaining players
    broadcastToRoom(roomId, {
        type:       'player_disconnected',
        playerId:   player.playerId,
        playerName: player.playerName,
        message:    `👋 ${player.playerName} 已離開遊戲`
    });

    broadcastToRoom(roomId, {
        type:    'notification',
        message: `👋 ${player.playerName} 未在時限內重連，已離開遊戲`
    });

    // Clean up empty room
    if (room.players.size === 0) {
        rooms.delete(roomId);
        console.log(`🗑️ 房間已刪除: ${roomId}`);
    }
}

module.exports = {
    handlePlayerDisconnect,
    handlePlayerReconnect
};