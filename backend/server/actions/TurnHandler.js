"use strict";

function handleEndTurn(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    // ✅ Only the current turn player can end their turn
    if (!player.gameState.isMyTurn) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '不是你的回合，無法結束'
        }));
        return;
    }

    // ✅ Prevent double end-turn
    if (player.gameState._endingTurn) {
        return;  // silently ignore
    }
    player.gameState._endingTurn = true;

    // ── Reset roll flag ───────────────────────────────────────────────────
    player.gameState.hasRolledThisTurn = false;

    // ── Restore energy ────────────────────────────────────────────────────
    player.gameState.energy = Math.min(
        player.gameState.maxEnergy,
        player.gameState.energy + 1
    );

    // ── Cycle to next player ──────────────────────────────────────────────
    const playersArray = Array.from(room.players.values());
    const currentIndex = playersArray.findIndex(p => p.playerId === player.playerId);
    const nextPlayer   = playersArray[(currentIndex + 1) % playersArray.length];

    player.gameState.isMyTurn     = false;
    player.gameState._endingTurn  = false;  // ✅ Reset for next time
    nextPlayer.gameState.isMyTurn = true;
    room.currentTurnPlayer        = nextPlayer.playerName;

    // ── Broadcast turn change ─────────────────────────────────────────────
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