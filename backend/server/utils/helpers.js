"use strict";

// ── 現金流助手 ─────────────────────────────────────────────────────────

function calculateMonthlyCashFlow(state) {
    const totalIncome  = (state.salary || 0) + (state.sideIncome || 0) + (state.passiveIncome || 0);
    let   totalExpense = _rawExpense(state);

    if (state.expenseReduction > 0) {
        totalExpense -= Math.floor(totalExpense * state.expenseReduction / 100);
    }
    return totalIncome - totalExpense;
}

function calculateReducedExpense(state) {
    let totalExpense    = _rawExpense(state);
    let savedAmount     = 0;
    let reductionPercent = state.expenseReduction || 0;

    if (reductionPercent > 0) {
        savedAmount   = Math.floor(totalExpense * reductionPercent / 100);
        totalExpense -= savedAmount;
    }
    return { totalExpense, savedAmount, reductionPercent };
}

// ── 房間助手 ──────────────────────────────────────────────────────────────

function broadcastToRoom(rooms, roomId, message, excludeWs = null) {
    const WebSocket = require('ws');
    const room = rooms.get(roomId);
    if (!room) return;

    const payload = JSON.stringify(message);
    room.players.forEach((player, ws) => {
        if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    });
}

function getWsByPlayerId(room, playerId) {
    for (const [ws, player] of room.players) {
        if (player.playerId === playerId) return ws;
    }
    return null;
}

function getOrCreateRoom(rooms, roomId, streamlineTiles, reverseTiles, flowTiles) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            players:            new Map(),
            currentTurnPlayer:  null,
            streamlineTiles,
            reverseTiles,
            flowTiles
        });
        console.log(`📦 創建房間: ${roomId}`);
    }
    return rooms.get(roomId);
}

// ── 私有 ───────────────────────────────────────────────────────────────────

function _rawExpense(state) {
    return (state.livingExpense || 0)
        + (state.tax || 0)
        + (state.childExpense || 0);
}

function getEffectivePassiveIncome(state) {
    if (state.inFlow && state.flowPassiveIncome !== undefined && state.flowPassiveIncome !== null) {
        return state.flowPassiveIncome;
    }
    return state.passiveIncome || 0;
}
module.exports = {
    calculateMonthlyCashFlow,
    calculateReducedExpense,
    broadcastToRoom,
    getWsByPlayerId,
    getOrCreateRoom,
    getEffectivePassiveIncome,
};