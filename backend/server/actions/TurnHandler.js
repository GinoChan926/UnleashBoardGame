"use strict";

function handleEndTurn(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    if (!player.gameState.isMyTurn) return;

    if (!player.gameState.hasRolledThisTurn) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '請先擲骰子再結束回合'
        }));
        return;
    }

    // Reset roll flag
    player.gameState.hasRolledThisTurn = false;

    // Restore energy
    // player.gameState.energy = Math.min(
        // player.gameState.maxEnergy,
        // player.gameState.energy + 1
    // );

    // ✅ Check for extra turn (IN12 時間管理)
    if (player.gameState.extraTurn) {
        player.gameState.extraTurn = false;

        console.log(`⏰ ${player.playerName} 獲得額外回合！`);

        // Broadcast the extra turn — player stays as current
        _broadcastTurnState(room, roomId, player.playerName, broadcastToRoom);

        ws.send(JSON.stringify({
            type: 'notification',
            message: '⏰ 時間管理生效！你獲得一個額外回合！'
        }));

        broadcastToRoom(roomId, {
            type: 'notification',
            message: `⏰ ${player.playerName} 獲得額外回合！`
        }, ws);

        return;
    }

    // ── Normal turn cycle ─────────────────────────────────────────────────
    const playersArray = Array.from(room.players.values());
    const currentIndex = playersArray.findIndex(p => p.playerId === player.playerId);
    const nextPlayer   = playersArray[(currentIndex + 1) % playersArray.length];

    player.gameState.isMyTurn     = false;
    nextPlayer.gameState.isMyTurn = true;
    room.currentTurnPlayer        = nextPlayer.playerName;

    // ✅ Update ALL players' currentTurnPlayer so their UI shows the same thing
    room.players.forEach(p => {
        p.gameState.currentTurnPlayer = nextPlayer.playerName;
    });

    // Notify the player whose turn just ended
    broadcastToRoom(roomId, {
        type:     'turn_ended',
        playerId: player.playerId,
        gameState: player.gameState
    });

    // ✅ Broadcast state for BOTH players (previous + next)
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

    // ✅ Broadcast dedicated turn_status message everyone can listen to
    broadcastToRoom(roomId, {
        type:              'turn_status',
        currentTurnPlayer: nextPlayer.playerName,
        currentTurnPlayerId: nextPlayer.playerId,
        previousPlayer:    player.playerName
    });

    console.log(`⏭️ 回合結束: ${player.playerName} → ${nextPlayer.playerName}`);
}

// ── Helper ────────────────────────────────────────────────────────────────────

function _broadcastTurnState(room, roomId, currentTurnPlayerName, broadcastToRoom) {
    // Sync currentTurnPlayer across all players
    room.players.forEach(p => {
        p.gameState.currentTurnPlayer = currentTurnPlayerName;
    });

    // Broadcast state update for the current turn player
    room.players.forEach(p => {
        if (p.playerName === currentTurnPlayerName) {
            broadcastToRoom(roomId, {
                type:      'state_updated',
                playerId:  p.playerId,
                gameState: p.gameState
            });
        }
    });

    // Broadcast dedicated turn_status message
    broadcastToRoom(roomId, {
        type:              'turn_status',
        currentTurnPlayer: currentTurnPlayerName
    });
}

module.exports = { handleEndTurn };