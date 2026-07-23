"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function processHealthInvestment(state, player, ws) {
    if (!state.healthInvestment?.active) return false;

    const { monthlyCost, energyBonus } = state.healthInvestment;

    if (state.cash >= monthlyCost) {
        state.cash   -= monthlyCost;
        state.energy  = Math.min(state.maxEnergy, state.energy + energyBonus);

        addTransactionRecord(
            player.playerName,
            { name: "健康投資月費", type: "tip", id: "IN01" },
            "健康投資扣款",
            -monthlyCost,
            `健康投資月費 $${monthlyCost.toLocaleString()} 元，精力 +${energyBonus}`,
            null,
            state
        );

        ws?.send(JSON.stringify({
            type:    'notification',
            message: `💪 健康投資月費已扣除 $${monthlyCost.toLocaleString()} 元，精力 +${energyBonus}！`
        }));

        return true;

    } else {
        state.healthInvestment.active = false;

        // ✅ Remove from livingExpense when deactivated
        state.livingExpense = Math.max(
            0,
            (state.livingExpense || 0) - monthlyCost
        );

        ws?.send(JSON.stringify({
            type:    'notification',
            message: `⚠️ 現金不足，健康投資已暫停！月支出 -$${monthlyCost.toLocaleString()}`
        }));

        return false;
    }
}

function processHealthSupplementInvestment(state, player, ws) {
    if (!state.healthSupplementInvestment?.active) return false;

    const { monthlyCost, energyBonus } = state.healthSupplementInvestment;

    if (state.cash >= monthlyCost) {
        state.cash   -= monthlyCost;
        state.energy  = Math.min(state.maxEnergy, state.energy + energyBonus);

        addTransactionRecord(
            player.playerName,
            { name: "保健品投資月費", type: "tip", id: "IN04" },
            "保健品扣款",
            -monthlyCost,
            `保健品投資月費 $${monthlyCost.toLocaleString()} 元，精力 +${energyBonus}`,
            null,
            state
        );

        ws?.send(JSON.stringify({
            type:    'notification',
            message: `💊 保健品月費已扣除 $${monthlyCost.toLocaleString()} 元，精力 +${energyBonus}！`
        }));

        return true;

    } else {
        state.healthSupplementInvestment.active = false;

        // ✅ Remove from livingExpense when deactivated
        state.livingExpense = Math.max(
            0,
            (state.livingExpense || 0) - monthlyCost
        );

        ws?.send(JSON.stringify({
            type:    'notification',
            message: `⚠️ 現金不足，保健品投資已暫停！月支出 -$${monthlyCost.toLocaleString()}`
        }));

        return false;
    }
}

module.exports = { processHealthInvestment, processHealthSupplementInvestment };