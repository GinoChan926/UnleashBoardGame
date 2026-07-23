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
    player.gameState.energy = Math.min(
        player.gameState.maxEnergy,
        player.gameState.energy + 1
    );

    // ✅ Check for extra turn (IN12 時間管理)
    if (player.gameState.extraTurn) {
        player.gameState.extraTurn = false;

        console.log(`⏰ ${player.playerName} 獲得額外回合！`);

        // Don't cycle to next player - keep current player's turn
        // Just reset their roll flag so they can roll again
        broadcastToRoom(roomId, {
            type: 'turn_ended',
            playerId: player.playerId,
            gameState: player.gameState
        });

        // Send state update so frontend re-enables roll button
        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: player.playerId,
            gameState: player.gameState
        });

        // Notify
        ws.send(JSON.stringify({
            type: 'notification',
            message: '⏰ 時間管理生效！你獲得一個額外回合！'
        }));

        broadcastToRoom(roomId, {
            type: 'notification',
            message: `⏰ ${player.playerName} 獲得額外回合！`
        }, ws);

        return;  // ← skip normal turn cycle
    }

    // ── Normal turn cycle ─────────────────────────────────────────────────
    const playersArray = Array.from(room.players.values());
    const currentIndex = playersArray.findIndex(p => p.playerId === player.playerId);
    const nextPlayer   = playersArray[(currentIndex + 1) % playersArray.length];

    player.gameState.isMyTurn     = false;
    nextPlayer.gameState.isMyTurn = true;
    room.currentTurnPlayer        = nextPlayer.playerName;

    broadcastToRoom(roomId, {
        type: 'turn_ended',
        playerId: player.playerId,
        gameState: player.gameState
    });
    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: nextPlayer.playerId,
        gameState: nextPlayer.gameState
    });

    console.log(`⏭️ 回合結束: ${player.playerName} → ${nextPlayer.playerName}`);
}

module.exports = { handleEndTurn };