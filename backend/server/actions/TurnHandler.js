"use strict";

function handleEndTurn(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const forceSkip = data?.forceSkip === true;

    if (!player.gameState.isMyTurn) return;

    if (!forceSkip && !player.gameState.hasRolledThisTurn) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '請先擲骰子再結束回合'
        }));
        return;
    }

    // Reset roll flag
    player.gameState.hasRolledThisTurn = false;

    // ✅ Extra turn only applies on a real completed turn, not forced skip
    if (!forceSkip && player.gameState.extraTurn) {
        player.gameState.extraTurn = false;

        console.log(`⏰ ${player.playerName} 獲得額外回合！`);

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

    player.gameState.isMyTurn = false;

    let nextIndex  = (currentIndex + 1) % playersArray.length;
    let nextPlayer = playersArray[nextIndex];
    let safety     = 0;

    // ✅ Auto-skip any skipped players before selecting the real next player
    while (nextPlayer && nextPlayer.gameState.skipNextTurn && safety < playersArray.length) {
        nextPlayer.gameState.skipNextTurn = false;
        nextPlayer.gameState.hasRolledThisTurn = false;
        nextPlayer.gameState.isMyTurn = false;

        let skippedWs = null;
        for (const [pWs, p] of room.players) {
            if (p.playerId === nextPlayer.playerId) {
                skippedWs = pWs;
                break;
            }
        }

        const skipPayload = {
            type: 'turn_skipped',
            playerId: nextPlayer.playerId,
            skippedPlayerId: nextPlayer.playerId,
            skippedPlayerName: nextPlayer.playerName,
            gameState: nextPlayer.gameState,
            message: `⏸️ ${nextPlayer.playerName} 被暫停一回合，本回合已自動跳過`
        };

        if (skippedWs && skippedWs.readyState === 1) {
            skippedWs.send(JSON.stringify(skipPayload));
            skippedWs.send(JSON.stringify({
                type: 'notification',
                message: '⏸️ 你被暫停一回合，本回合已自動跳過'
            }));
        }

        broadcastToRoom(roomId, skipPayload, skippedWs);
        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: nextPlayer.playerId,
            gameState: nextPlayer.gameState
        });

        nextIndex = (nextIndex + 1) % playersArray.length;
        nextPlayer = playersArray[nextIndex];
        safety++;
    }

    if (!nextPlayer) return;

    nextPlayer.gameState.isMyTurn = true;
    room.currentTurnPlayer = nextPlayer.playerName;

    room.players.forEach(p => {
        p.gameState.currentTurnPlayer = nextPlayer.playerName;
    });

    broadcastToRoom(roomId, {
        type: 'turn_ended',
        playerId: player.playerId,
        gameState: player.gameState
    });

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: nextPlayer.playerId,
        gameState: nextPlayer.gameState
    });

    broadcastToRoom(roomId, {
        type: 'turn_status',
        currentTurnPlayer: nextPlayer.playerName,
        currentTurnPlayerId: nextPlayer.playerId,
        previousPlayer: player.playerName
    });

    console.log(`⏭️ 回合結束: ${player.playerName} → ${nextPlayer.playerName}`);
}

// ── Helper ────────────────────────────────────────────────────────────────────

function _broadcastTurnState(room, roomId, currentTurnPlayerName, broadcastToRoom) {
    room.players.forEach(p => {
        p.gameState.currentTurnPlayer = currentTurnPlayerName;
    });

    room.players.forEach(p => {
        if (p.playerName === currentTurnPlayerName) {
            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: p.playerId,
                gameState: p.gameState
            });
        }
    });

    broadcastToRoom(roomId, {
        type: 'turn_status',
        currentTurnPlayer: currentTurnPlayerName
    });
}

module.exports = { handleEndTurn };