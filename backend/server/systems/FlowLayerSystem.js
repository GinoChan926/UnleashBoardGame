"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

// ── Entry condition check ─────────────────────────────────────────────────────

function canEnterFlowLayer(state, ws, sendMessage = true) {
    const totalExpense = _totalExpense(state);

    if (state.energy <= 0) {
        if (sendMessage) ws.send(JSON.stringify({
            type: 'notification',
            message: `❌ 无法进入顺流层！精力不足 (当前 ${state.energy})`
        }));
        return false;
    }
    if (state.loanAmount > 0) {
        if (sendMessage) ws.send(JSON.stringify({
            type: 'notification',
            message: `❌ 无法进入顺流层！还有贷款 ${state.loanAmount.toLocaleString()} 元未还清`
        }));
        return false;
    }
    if (state.passiveIncome < totalExpense) {
        if (sendMessage) ws.send(JSON.stringify({
            type: 'notification',
            message: `❌ 无法进入顺流层！被動收入 ${state.passiveIncome.toLocaleString()} < 总支出 ${totalExpense.toLocaleString()}`
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
    if (state.passiveIncomeBeforeFlow !== undefined) {
        state.passiveIncome               = state.passiveIncomeBeforeFlow;
        state.passiveIncomeBeforeFlow     = undefined;
        state.flowPassiveIncome           = undefined;
        state.passiveIncomeFlowMultiplier = undefined;
    }
}

// ── Monthly cash flow (flow layer) ────────────────────────────────────────────

function calculateFlowMonthlyCashFlow(state) {
    let effectivePassive = state.flowPassiveIncome || state.passiveIncome;
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
        ws.send(JSON.stringify({ type: 'error', message: '没有待处理的顺流层选择' }));
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
            message: `🎉 你选择进入顺流层！被動收入 × 100 倍！原: ${incomeBoost.original.toLocaleString()} → ${incomeBoost.multiplied.toLocaleString()} 元/月`
        }));
        broadcastToRoom(roomId, {
            type: 'notification',
            message: `🎉 ${player.playerName} 进入顺流层！被動收入放大100倍！`
        }, ws);
        broadcastToRoom(roomId, {
            type: 'state_updated', playerId: player.playerId, gameState: state
        });

        addTransactionRecord(player.playerName,
            { name: "进入顺流层", type: "flow", id: "FLOW_ENTER" },
            "进入顺流层", 0,
            `被動收入从 ${incomeBoost.original.toLocaleString()} 放大到 ${incomeBoost.multiplied.toLocaleString()} 元/月`,
            stateBefore, state);
    } else {
        ws.send(JSON.stringify({
            type: 'notification',
            message: `📌 你选择留在平流层继续积累。`
        }));
        broadcastToRoom(roomId, {
            type: 'notification',
            message: `📌 ${player.playerName} 选择暂时留在平流层。`
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