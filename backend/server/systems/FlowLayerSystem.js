"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const { getEffectivePassiveIncome } = require('../utils/helpers.js');

// ── Entry condition check ─────────────────────────────────────────────────────

function canEnterFlowLayer(state, ws, sendMessage = true) {
    const totalExpense = _totalExpense(state);

    if (state.energy <= 0) {
        if (sendMessage) ws.send(JSON.stringify({
            type: 'notification',
            message: `❌ 無法進入順流層！精力不足 (當前 ${state.energy})`
        }));
        return false;
    }
    if (state.loanAmount > 0) {
        if (sendMessage) ws.send(JSON.stringify({
            type: 'notification',
            message: `❌ 無法進入順流層！還有貸款 ${state.loanAmount.toLocaleString()} 元未還清`
        }));
        return false;
    }
    if (state.passiveIncome < totalExpense) {
        if (sendMessage) ws.send(JSON.stringify({
            type: 'notification',
            message: `❌ 無法進入順流層！被動收入 ${state.passiveIncome.toLocaleString()} < 總支出 ${totalExpense.toLocaleString()}`
        }));
        return false;
    }
    return true;
}

// ── Income boost ──────────────────────────────────────────────────────────────

function applyFlowLayerIncomeBoost(state) {
    const currentCash           = state.cash;
    const originalPassiveIncome = state.passiveIncome;

    state.passiveIncomeFlowMultiplier = 100;
    state.passiveIncomeBeforeFlow     = originalPassiveIncome;
    state.flowPassiveIncome           = originalPassiveIncome * 100;
    state.cash                        = currentCash; // never touch cash

    console.log(`📈 被動收入: ${originalPassiveIncome.toLocaleString()} → ${state.flowPassiveIncome.toLocaleString()} 元/月`);

    return { original: originalPassiveIncome, multiplied: state.flowPassiveIncome, multiplier: 100, cash: currentCash };
}

function revertFlowLayerIncomeBoost(state) {
    if (state.passiveIncomeBeforeFlow === undefined) return;

    const multiplier   = state.passiveIncomeFlowMultiplier || 100;
    const originalBase = state.passiveIncomeBeforeFlow     || 0;
    const flowCurrent  = state.flowPassiveIncome           || 0;

    // Calculate additions made during flow (at 1× rate)
    // flowCurrent = (originalBase × multiplier) + additions
    const additions = Math.max(0, flowCurrent - (originalBase * multiplier));

    // Restore passiveIncome = original base + additions (all at 1× rate)
    state.passiveIncome = originalBase + additions;

    state.passiveIncomeBeforeFlow     = undefined;
    state.flowPassiveIncome           = undefined;
    state.passiveIncomeFlowMultiplier = undefined;
}

// ── Monthly cash flow (flow layer) ────────────────────────────────────────────

function calculateFlowMonthlyCashFlow(state) {
    let effectivePassive = getEffectivePassiveIncome(state);
    if (state.passiveIncomeBonus > 0) {
        effectivePassive = Math.floor(effectivePassive * (1 + state.passiveIncomeBonus / 100));
    }
    const totalIncome  = (state.salary || 0) + (state.sideIncome || 0) + effectivePassive;
    let   totalExpense = _totalExpense(state);
    if (state.expenseReduction > 0) {
        totalExpense -= Math.floor(totalExpense * state.expenseReduction / 100);
    }
    return totalIncome - totalExpense;
}

// ── Flow layer choice handler ─────────────────────────────────────────────────

function handleFlowLayerChoice(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingChoice = room.pendingFlowChoices?.get(ws);
    if (!pendingChoice) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的順流層選擇' }));
        return;
    }

    const state = player.gameState;

    if (data.willEnter) {
        if (!canEnterFlowLayer(state, ws, true)) {
            room.pendingFlowChoices.delete(ws);
            return;
        }

        const cashBefore   = state.cash;
        const stateBefore  = JSON.parse(JSON.stringify(state));
        const incomeBoost  = applyFlowLayerIncomeBoost(state);
        state.inFlow       = true;
        state.flowPos      = 0;
        state.cash         = cashBefore; // guard

        const newMonthlyCF = calculateFlowMonthlyCashFlow(state);

        ws.send(JSON.stringify({
            type: 'notification',
            message: `🎉 你選擇進入順流層！被動收入 × 100 倍！原: ${incomeBoost.original.toLocaleString()} → ${incomeBoost.multiplied.toLocaleString()} 元/月`
        }));
        broadcastToRoom(roomId, {
            type: 'notification',
            message: `🎉 ${player.playerName} 進入順流層！被動收入放大100倍！`
        }, ws);
        broadcastToRoom(roomId, {
            type: 'state_updated', playerId: player.playerId, gameState: state
        });

        addTransactionRecord(player.playerName,
            { name: "進入順流層", type: "flow", id: "FLOW_ENTER" },
            "進入順流層", 0,
            `被動收入從 ${incomeBoost.original.toLocaleString()} 放大到 ${incomeBoost.multiplied.toLocaleString()} 元/月`,
            stateBefore, state);
    } else {
        ws.send(JSON.stringify({
            type: 'notification',
            message: `📌 你選擇留在平流層繼續積累。`
        }));
        broadcastToRoom(roomId, {
            type: 'notification',
            message: `📌 ${player.playerName} 選擇暫時留在平流層。`
        }, ws);
    }

    room.pendingFlowChoices.delete(ws);
}

// ── Private ───────────────────────────────────────────────────────────────────

function _totalExpense(state) {
    return (state.livingExpense || 0) + (state.tax || 0)
        + (state.loanInterest  || 0) + (state.childExpense || 0);
}

module.exports = {
    canEnterFlowLayer,
    applyFlowLayerIncomeBoost,
    revertFlowLayerIncomeBoost,
    calculateFlowMonthlyCashFlow,
    handleFlowLayerChoice
};