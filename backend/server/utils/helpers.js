"use strict";

// ── Config ─────────────────────────────────────────────────────────────────

const MAX_PLAYERS_PER_ROOM = 8;   // ✅ NEW

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
            flowTiles,
            hostId:             null,
            createdAt:          Date.now(),        // ✅ NEW
            timer: {
                running:    false,
                paused:     false,
                duration:   0,
                remaining:  0,
                endAt:      0,
                intervalId: null
            }
        });
        console.log(`📦 創建房間: ${roomId}`);
    }
    return rooms.get(roomId);
}

// ✅ NEW: Check if room is full (only counts active, non-disconnected players)
function isRoomFull(rooms, roomId) {
    const room = rooms.get(roomId);
    if (!room) return false;

    let activeCount = 0;
    room.players.forEach(p => {
        if (!p.disconnected) activeCount++;
    });

    return activeCount >= MAX_PLAYERS_PER_ROOM;
}

// ✅ NEW: Get a list of all rooms for the room selection modal
function getRoomList(rooms) {
    const list = [];
    rooms.forEach((room, id) => {
        const players = [];
        room.players.forEach(p => {
            if (!p.disconnected) {
                players.push({
                    playerId:   p.playerId,
                    playerName: p.playerName
                });
            }
        });

        list.push({
            roomId:      id,
            playerCount: players.length,
            maxPlayers:  MAX_PLAYERS_PER_ROOM,
            players,
            createdAt:   room.createdAt || 0,
            isFull:      players.length >= MAX_PLAYERS_PER_ROOM
        });
    });

    // Sort: non-full rooms first, then by creation time (newest first)
    list.sort((a, b) => {
        if (a.isFull !== b.isFull) return a.isFull ? 1 : -1;
        return b.createdAt - a.createdAt;
    });

    return list;
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

function refreshFlowPassiveIncome(state) {
    if (!state.inFlow) return;
    const multiplier = state.passiveIncomeFlowMultiplier || 100;
    state.flowPassiveIncome       = (state.passiveIncome || 0) * multiplier;
    state.passiveIncomeBeforeFlow = state.passiveIncome || 0;
}

module.exports = {
    calculateMonthlyCashFlow,
    calculateReducedExpense,
    broadcastToRoom,
    getWsByPlayerId,
    getOrCreateRoom,
    isRoomFull,                    // ✅ NEW
    getRoomList,                   // ✅ NEW
    MAX_PLAYERS_PER_ROOM,          // ✅ NEW
    getEffectivePassiveIncome,
    refreshFlowPassiveIncome
};