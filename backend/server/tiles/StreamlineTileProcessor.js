"use strict";

const { addTransactionRecord }      = require('../records/TransactionRecorder.js');
const { calculateReducedExpense }   = require('../utils/helpers.js');
const { processHealthInvestment, processHealthSupplementInvestment } = require('../systems/HealthSystem.js');
const { processSettlementRepayment } = require('../systems/LoanSystem.js');

function processStreamlineTile(state, tile, ws, roomId, player, isExactLanding,
                               { broadcastToRoom, showCardTypeSelection, showRevelationCardTypeSelection,
                                   drawAndExecuteLierCard, drawVolunteerCard, drawPoliceCard, drawHardshipCard, rooms }) {

    switch (tile.type) {
        case 'lucky_star':
            state.luckyStarCount = (state.luckyStarCount || 0) + 1;
            return `⭐ 獲得幸運星！當前共有 ${state.luckyStarCount} 顆！`;

        case 'four_leaf_clover':
            state.fourLeafClover = (state.fourLeafClover || 0) + 1;
            return `🍀 獲得四葉草！下次擲骰步數 x2 倍！`;

        case 'lier':
            drawAndExecuteLierCard(ws, state, roomId, player);
            return null;

        case 'awareness':
            showRevelationCardTypeSelection(ws, state, roomId, player);
            return null;

        case 'reverse_entry':
            state.inReverse = true;
            state.inFlow    = false;
            state.reversePos = 0;
            drawHardshipCard(ws, state, roomId, player);
            return `🌀 你進入了逆流層！並抽到了一張逆境自強卡！`;

        case 'reverse_exit':
            if (state.inReverse) {
                state.inReverse  = false;
                state.reversePos = 0;
                return `🌀 你踩中逆流層出口，成功脫離逆流層！`;
            }
            return `🌀 逆流層出口（目前不在逆流層中）`;

        case 'settlement':
            return _processSettlement(state, tile, ws, roomId, player, isExactLanding, broadcastToRoom);

        case 'volunteer':
            drawVolunteerCard(ws, state, roomId, player, isExactLanding);
            return null;

        case 'opportunity':
            showCardTypeSelection(ws, state, roomId, player);
            return null;

        case 'police':
            drawPoliceCard(ws, state, roomId, player);
            return null;

        default:
            return null;
    }
}

function _processSettlement(state, tile, ws, roomId, player, isExactLanding, broadcastToRoom) {
    let totalIncome  = 0;
    let incomeMessage = '';

    if (!state.inReverse) {
        totalIncome   = state.salary + state.sideIncome;
        state.cash   += totalIncome;
        state.totalAssets += Math.floor(totalIncome * 0.2);
        incomeMessage = `獲得 ${totalIncome.toLocaleString()} 元現金流`;
    } else {
        incomeMessage = `⚠️ 你身處逆流層，本次結算日沒有收入！`;
    }

    const { totalExpense, savedAmount, reductionPercent } = calculateReducedExpense(state);
    let expenseReductionMessage = reductionPercent > 0
        ? ` (支出減少 ${reductionPercent}%，節省 ${savedAmount.toLocaleString()} 元)`
        : '';

    if (state.bakeryCount > 0) {
        state.energy = Math.min(state.maxEnergy, state.energy + state.bakeryCount);
        incomeMessage += ` 🍞 麵包店精力 +${state.bakeryCount}！`;
    }

    processHealthInvestment(state, player, ws);
    processHealthSupplementInvestment(state, player, ws);

    const repaymentResult = processSettlementRepayment(player, ws, roomId, broadcastToRoom);
    if (repaymentResult) {
        ws.send(JSON.stringify(repaymentResult));
        broadcastToRoom(roomId, repaymentResult, ws);
    }

    const settlementMsg = {
        type: 'settlement', playerId: player.playerId, playerName: player.playerName,
        salary: state.salary, sideIncome: state.sideIncome,
        totalIncome, totalExpense, expenseReductionMessage, isExactLanding, gameState: state
    };
    ws.send(JSON.stringify(settlementMsg));
    broadcastToRoom(roomId, settlementMsg, ws);

    return isExactLanding
        ? `💰 結算日！正好踩中！${incomeMessage}${expenseReductionMessage}，額外獲得一次擲骰機會！`
        : `💰 結算日！${incomeMessage}${expenseReductionMessage}`;
}

module.exports = { processStreamlineTile };