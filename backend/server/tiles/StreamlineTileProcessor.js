"use strict";

const { addTransactionRecord }      = require('../records/TransactionRecorder.js');
const { calculateReducedExpense }   = require('../utils/helpers.js');
const { processHealthInvestment, processHealthSupplementInvestment } = require('../systems/HealthSystem.js');
const { processSettlementRepayment } = require('../systems/LoanSystem.js');
const { processTeaRestaurantFees }  = require('../systems/TeaRestaurantSystem.js');
const {
    spendForInvestment,
    spendForNonInvestment,
    canAffordInvestment,
    canAffordNonInvestment
} = require('../systems/WalletSystem.js');
const { chargePlayer } = require('../systems/AutoDebtSystem.js');
const { getEffectivePassiveIncome } = require('../utils/helpers.js');


function processStreamlineTile(state, tile, ws, roomId, player, isExactLanding,
                               { broadcastToRoom, showCardTypeSelection, showRevelationCardTypeSelection,
                                   drawAndExecuteLierCard, drawVolunteerCard, drawPoliceCard,
                                   drawHardshipCard, rooms }) {

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
            return `🌀 你抽到了一張逆境自強卡！`;

        case 'reverse_exit':
            if (state.inReverse) {
                state.inReverse  = false;
                state.reversePos = 0;
                return `🌀 你踩中逆流層出口，成功脫離逆流層！`;
            }
            return `🌀 逆流層出口（目前不在逆流層中）`;

        case 'settlement':
            // ✅ Use the destructured `rooms` variable (not `deps`)
            return _processSettlement(
                state, tile, ws, roomId, player, isExactLanding,
                broadcastToRoom, rooms?.get(roomId)
            );

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

function _processSettlement(state, tile, ws, roomId, player, isExactLanding, broadcastToRoom, room) {
    let totalIncome  = 0;
    let incomeMessage = '';

    if (!state.inReverse) {
        if (state.skipSettlementIncome) {
            incomeMessage = `⚠️ 因通貨膨脹影響，本次結算日沒有收入！`;
            state.skipSettlementIncome = false;
        } else if (state.nextSettlementHalfIncome) {
            const reducibleIncome = Math.floor((state.salary + state.sideIncome) / 2);
            const passiveIncome   = getEffectivePassiveIncome(state);
            totalIncome           = reducibleIncome + passiveIncome;
            state.cash           += totalIncome;
            state.totalAssets    += Math.floor(totalIncome * 0.2);
            incomeMessage         = `📉 公司減薪！月薪+副業減半 $${reducibleIncome.toLocaleString()}，被動收入 $${passiveIncome.toLocaleString()}，合計 $${totalIncome.toLocaleString()}`;
            state.nextSettlementHalfIncome = false;
        } else {
            const reducibleIncome = state.salary + state.sideIncome;
            const passiveIncome   = getEffectivePassiveIncome(state);
            totalIncome           = reducibleIncome + passiveIncome;
            state.cash           += totalIncome;
            state.totalAssets    += Math.floor(totalIncome * 0.2);
            incomeMessage         = `獲得 $${totalIncome.toLocaleString()} 元 (月薪+副業 $${reducibleIncome.toLocaleString()} + 被動收入 $${passiveIncome.toLocaleString()})`;
        }

        if (room) {
            const { processDebtCollection } = require('../systems/AutoDebtSystem.js');
            const paidDebts = processDebtCollection(player, room, roomId, broadcastToRoom);
            if (paidDebts.length > 0) {
                const totalPaid = paidDebts.reduce((s, d) => s + d.paidAmount, 0);
                incomeMessage += ` | 💸 自動償還債務 $${totalPaid.toLocaleString()}`;
            }
        }
    } else {
        incomeMessage = `⚠️ 你身處逆流層，本次結算日沒有收入！`;
    }

    const { totalExpense, savedAmount, reductionPercent } = calculateReducedExpense(state);

    if (!state.inReverse && totalExpense > 0) {
        const mortgageExpense    = state.propertyMortgageExpense || 0;
        const nonInvestExpense   = Math.max(0, totalExpense - mortgageExpense);

        // ── Mortgage portion: investment (can use loanCash) ──────────────
        if (mortgageExpense > 0) {
            if (canAffordInvestment(state, mortgageExpense)) {
                spendForInvestment(state, mortgageExpense);
            } else {
                // Fallback to debt
                chargePlayer(player, mortgageExpense, {
                    source:       '房貸月供',
                    creditor:     'bank',
                    creditorName: '銀行',
                    room, roomId, broadcastToRoom, ws
                });
            }
        }

        // ── Other expenses: non-investment (regular cash only) ───────────
        if (nonInvestExpense > 0) {
            if (canAffordNonInvestment(state, nonInvestExpense)) {
                spendForNonInvestment(state, nonInvestExpense);
            } else {
                chargePlayer(player, nonInvestExpense, {
                    source:       '結算日支出',
                    creditor:     'bank',
                    creditorName: '銀行',
                    room, roomId, broadcastToRoom, ws
                });
            }
        }

        incomeMessage += `，支出 ${totalExpense.toLocaleString()} 元`;
        if (mortgageExpense > 0) {
            incomeMessage += ` (含房貸 ${mortgageExpense.toLocaleString()} 元，可用貸款金)`;
        }
    }

    let expenseReductionMessage = reductionPercent > 0
        ? ` (支出減少 ${reductionPercent}%，節省 ${savedAmount.toLocaleString()} 元)`
        : '';

    // ✅ Mark pending settlement roll — player will roll manually
    if (isExactLanding && !state.inReverse) {
        state.pendingSettlementRoll = true;
    }

    if (state.bakeryCount > 0) {
        state.energy    = Math.min(state.maxEnergy, state.energy + state.bakeryCount);
        incomeMessage  += ` 🍞 麵包店精力 +${state.bakeryCount}！`;
    }

    processHealthInvestment(state, player, ws);
    processHealthSupplementInvestment(state, player, ws);

    let teaRestaurantMessage = '';
    if (room && !state.inReverse) {
        const { processTeaRestaurantFees } = require('../systems/TeaRestaurantSystem.js');
        processTeaRestaurantFees(player, room, roomId, broadcastToRoom);
        if (player._pendingTeaRestaurantMessage) {
            teaRestaurantMessage = player._pendingTeaRestaurantMessage;
            incomeMessage       += ` | ${teaRestaurantMessage}`;
            delete player._pendingTeaRestaurantMessage;
        }
    }

    if (!state.inReverse && state.loanSharkDebts) {
        state.loanSharkDebts.forEach(debt => {
            if (!debt.active) return;
            debt.remainingAmount -= debt.monthlyPayment;
            debt.totalPaid       += debt.monthlyPayment;
            if (debt.remainingAmount <= 0) {
                debt.remainingAmount = 0;
                debt.active          = false;
                state.livingExpense  = Math.max(0, state.livingExpense - debt.monthlyPayment);
                incomeMessage       += ` | 🦈 高利貸還清！月支出 -$${debt.monthlyPayment.toLocaleString()}`;
            }
        });
        state.loanSharkDebts = state.loanSharkDebts.filter(d => d.active);
    }

    if (!state.inReverse) {
        const { processPropertyMortgages } = require('../systems/PropertyChoiceSystem.js');
        const paidOff = processPropertyMortgages(player, ws, broadcastToRoom, roomId);
        if (paidOff.length > 0) {
            const names = paidOff.map(p => p.name).join('、');
            incomeMessage += ` | 🎉 房貸還清: ${names}`;
        }
    }

    const repaymentResult = processSettlementRepayment(player, ws, roomId, broadcastToRoom);
    if (repaymentResult) {
        ws.send(JSON.stringify(repaymentResult));
        broadcastToRoom(roomId, repaymentResult, ws);
    }

    const settlementMsg = {
        type:                     'settlement',
        playerId:                 player.playerId,
        playerName:               player.playerName,
        salary:                   state.salary,
        sideIncome:               state.sideIncome,
        totalIncome,
        totalExpense,
        expenseReductionMessage,
        teaRestaurantMessage,
        isExactLanding,
        pendingSettlementRoll:    state.pendingSettlementRoll || false,   // ✅ NEW
        gameState:                state
    };
    ws.send(JSON.stringify(settlementMsg));
    broadcastToRoom(roomId, settlementMsg, ws);

    return isExactLanding
        ? `💰 結算日！正好踩中！${incomeMessage}${expenseReductionMessage} - 請擲骰獲取精力！`
        : `💰 結算日！${incomeMessage}${expenseReductionMessage}`;
}

module.exports = { processStreamlineTile };