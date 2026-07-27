"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function handleSettlementRoll(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state = player.gameState;

    // ✅ Verify player has a pending settlement roll
    if (!state.pendingSettlementRoll) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '目前沒有待擲骰的結算日'
        }));
        return;
    }

    // Clear the pending flag
    state.pendingSettlementRoll = false;

    // Roll a 6-sided die
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const before   = state.energy;
    state.energy   = Math.min(state.maxEnergy, state.energy + diceRoll);
    const gained   = state.energy - before;

    // Log transaction
    addTransactionRecord(
        player.playerName,
        { name: '結算日精力擲骰', type: 'settlement', id: 'SETTLE_ROLL' },
        '精力獲得',
        0,
        `結算日擲骰得 ${diceRoll} 點，精力 +${gained}`,
        null,
        state
    );

    // Notify player
    ws.send(JSON.stringify({
        type:          'settlement_roll_result',
        playerId:      player.playerId,
        playerName:    player.playerName,
        diceRoll,
        energyGained:  gained,
        gameState:     state
    }));

    // Broadcast to others
    broadcastToRoom(roomId, {
        type:         'settlement_roll_result',
        playerId:     player.playerId,
        playerName:   player.playerName,
        diceRoll,
        energyGained: gained,
        gameState:    state
    }, ws);

    broadcastToRoom(roomId, {
        type:      'state_updated',
        playerId:  player.playerId,
        gameState: state
    });

    console.log(`⚡ ${player.playerName} 結算日擲骰: ${diceRoll} 點，精力 +${gained}`);
}

module.exports = { handleSettlementRoll };