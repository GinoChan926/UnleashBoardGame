"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function handleSettlementRoll(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state = player.gameState;

    if (!state.pendingSettlementRoll) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '目前沒有待擲骰的結算日'
        }));
        return;
    }

    state.pendingSettlementRoll = false;

    // ✅ Roll N dice (default 1, flow layer sets 2)
    const diceCount  = state.settlementRollDiceCount || 1;
    const diceValues = [];
    for (let i = 0; i < diceCount; i++) {
        diceValues.push(Math.floor(Math.random() * 6) + 1);
    }
    const totalRoll = diceValues.reduce((a, b) => a + b, 0);

    // Clear the dice count flag
    state.settlementRollDiceCount = 1;

    const before  = state.energy;
    state.energy  = Math.min(state.maxEnergy, state.energy + totalRoll);
    const gained  = state.energy - before;

    const layerLabel = state.inFlow ? '順流層' : '平流層';
    const diceDetail = diceCount > 1
        ? ` (${diceValues.join(' + ')} = ${totalRoll})`
        : ` (${totalRoll})`;

    addTransactionRecord(
        player.playerName,
        { name: '結算日精力擲骰', type: 'settlement', id: 'SETTLE_ROLL' },
        '精力獲得',
        0,
        `${layerLabel}結算日擲 ${diceCount} 骰得 ${totalRoll} 點${diceDetail}，精力 +${gained}`,
        null,
        state
    );

    const payload = {
        type:         'settlement_roll_result',
        playerId:     player.playerId,
        playerName:   player.playerName,
        diceRoll:     totalRoll,     // total for backwards compat
        diceValues,                  // ✅ NEW — individual dice values
        diceCount,                   // ✅ NEW
        energyGained: gained,
        gameState:    state
    };

    ws.send(JSON.stringify(payload));
    broadcastToRoom(roomId, payload, ws);

    broadcastToRoom(roomId, {
        type:      'state_updated',
        playerId:  player.playerId,
        gameState: state
    });

    console.log(`⚡ ${player.playerName} ${layerLabel}結算日擲 ${diceCount} 骰: ${diceValues.join(', ')} = ${totalRoll}，精力 +${gained}`);
}

module.exports = { handleSettlementRoll };