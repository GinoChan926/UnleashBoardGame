"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function processReverseTile(state, tile, ws, roomId, player, streamlineTiles, broadcastToRoom, drawHardshipCard) {
    switch (tile.type) {
        case 'hardship':
            drawHardshipCard(ws, state, roomId, player);
            return null;

        case 'awareness': {
            const luckBonus   = Math.floor(Math.random() * 3) + 2;
            const energyBonus = Math.floor(Math.random() * 3) + 2;
            state.luck   = Math.min(state.maxLuck   || 10, state.luck   + luckBonus);
            state.energy = Math.min(state.maxEnergy,       state.energy + energyBonus);
            return `🧘 覺察卡（逆流）！幸運值 +${luckBonus}，精力 +${energyBonus}`;
        }

        case 'business_failure': {
            const loss         = Math.floor(state.cash / 2);
            const originalCash = state.cash;
            state.cash  = Math.max(0, state.cash - loss);
            state.luck  = Math.max(0, state.luck - 2);
            addTransactionRecord(player.playerName,
                { name: "生意失敗", type: "hardship" }, "生意失敗", -loss,
                `損失 ${loss.toLocaleString()} 元，幸運值 -2`, null, state);
            return `💼 生意失敗！損失 ${loss.toLocaleString()} 元，幸運值 -2`;
        }

        case 'miracle': {
            const available = streamlineTiles
                .map((t, i) => ({ t, i }))
                .filter(({ t }) => t.type !== 'settlement');
            const target    = available[Math.floor(Math.random() * available.length)];
            state.inReverse     = false;
            state.streamlinePos = target.i;
            return `🌟 奇蹟發生！移動到平流層「${target.t.name}」格子！`;
        }

        case 'unemployment': {
            const monthlyIncome     = state.salary + state.sideIncome;
            const unemploymentLoss  = Math.min(state.cash, monthlyIncome);
            state.cash   = Math.max(0, state.cash - unemploymentLoss);
            state.salary = 0;
            state.energy = Math.min(state.maxEnergy, state.energy + 6);
            addTransactionRecord(player.playerName,
                { name: "失業", type: "hardship" }, "失業", -unemploymentLoss,
                `失業！損失 ${unemploymentLoss.toLocaleString()} 元，月薪歸零，精力 +6`, null, state);
            return `⚠️ 失業！損失 ${unemploymentLoss.toLocaleString()} 元，月薪歸零，精力 +6`;
        }

        default:
            return `📌 逆流層格子：${tile.name}`;
    }
}

module.exports = { processReverseTile };