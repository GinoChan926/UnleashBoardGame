"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const { canAffordInvestment, spendForInvestment } = require('./WalletSystem.js');

const pendingChoices = new Map();

// ==================== Choice flow ====================

function startPropertyChoice(ws, roomId, player, card, broadcastToRoom) {
    const discount = _getDiscount(player.gameState);
    const finalDownPayment = _applyDiscount(card.investmentCost || 0, discount);

    pendingChoices.set(player.playerId, { card, discount, finalDownPayment });

    ws.send(JSON.stringify({
        type: 'property_choice_prompt',
        card: {
            id:          card.id,
            name:        card.name,
            description: card.description,
            image:       card.image
        },
        details: {
            totalPrice:     card.totalPrice || card.investmentCost,
            downPayment:    finalDownPayment,
            originalDown:   card.investmentCost,
            discount:       discount,
            monthlyPayment: card.monthlyPayment || 0,
            monthlyRent:    card.monthlyReturn || 0,
            mortgageAmount: (card.totalPrice || card.investmentCost) - finalDownPayment,
            currentCash:    player.gameState.cash,
            canAfford:      player.gameState.cash >= finalDownPayment
        }
    }));

    console.log(`🏠 ${player.playerName} 面對房產選擇: ${card.name}`);
}

function handlePropertyChoice(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = pendingChoices.get(player.playerId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的房產選擇' }));
        return;
    }

    const { card, discount, finalDownPayment } = pending;
    const choice = data.choice;
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));
    let resultMessage = '';

    switch (choice) {
        case 'skip':
            resultMessage = `❌ 你放棄了「${card.name}」的購買`;
            break;
        case 'self_use':
            resultMessage = _handleSelfUse(player, card, discount, finalDownPayment);
            break;
        case 'rent_out':
            resultMessage = _handleRentOut(player, card, discount, finalDownPayment);
            break;
        default:
            ws.send(JSON.stringify({ type: 'error', message: '無效的選擇' }));
            return;
    }

    addTransactionRecord(
        player.playerName, card,
        choice === 'skip' ? '放棄房產' : (choice === 'self_use' ? '自用房產' : '出租房產'),
        player.gameState.cash - stateBefore.cash,
        resultMessage,
        stateBefore,
        player.gameState
    );

    ws.send(JSON.stringify({
        type: 'property_choice_result',
        choice,
        message: resultMessage,
        gameState: player.gameState
    }));

    if (choice !== 'skip') {
        broadcastToRoom(roomId, {
            type: 'notification',
            message: `🏠 ${player.playerName} ${choice === 'self_use' ? '自用' : '出租'}了「${card.name}」`
        }, ws);
    }

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });

    pendingChoices.delete(player.playerId);
    console.log(`✅ ${player.playerName} 房產選擇: ${choice} for ${card.name}`);
}

// ==================== Purchase handlers ====================

function _handleSelfUse(player, card, discount, finalDownPayment) {
    return _purchaseProperty(player, card, discount, finalDownPayment, 'self_use');
}

function _handleRentOut(player, card, discount, finalDownPayment) {
    return _purchaseProperty(player, card, discount, finalDownPayment, 'rent_out');
}

function _purchaseProperty(player, card, discount, finalDownPayment, usage) {
    const state = player.gameState;

    // ✅ Use wallet system for down payment (investment)
    const { canAffordInvestment, spendForInvestment } = require('./WalletSystem.js');

    if (!canAffordInvestment(state, finalDownPayment)) {
        return `❌ 資金不足 $${finalDownPayment.toLocaleString()}，無法支付首期（現金 + 貸款金）`;
    }

    const totalPrice     = card.totalPrice || finalDownPayment;
    const mortgageAmount = totalPrice - finalDownPayment;
    const monthlyPayment = card.monthlyPayment || 0;
    const monthlyRent    = card.monthlyReturn  || 0;

    // ✅ Deduct via wallet (loanCash first)
    const spendResult = spendForInvestment(state, finalDownPayment);

    state.totalAssets += totalPrice;

    // ── Mortgage payment: track separately as INVESTMENT expense ─────────────
    if (monthlyPayment > 0) {
        state.livingExpense = (state.livingExpense || 0) + monthlyPayment;
        state.propertyMortgageExpense =
            (state.propertyMortgageExpense || 0) + monthlyPayment;   // ✅ track investment portion
    }

    if (usage === 'rent_out' && monthlyRent > 0) {
        state.passiveIncome = (state.passiveIncome || 0) + monthlyRent;
    }

    // ── Property record ──────────────────────────────────────────────────────
    state.propertyInvestments = state.propertyInvestments || [];
    const propertyRecord = {
        instanceId:       `${card.id}_${Date.now()}`,
        id:               card.id,
        name:             card.name,
        image:            card.image,
        totalPrice,
        downPayment:      finalDownPayment,
        mortgageAmount,
        remainingBalance: mortgageAmount,
        monthlyPayment,
        monthlyReturn:    usage === 'rent_out' ? monthlyRent : 0,
        originalRent:     monthlyRent,
        monthsPaid:       0,
        totalPaid:        finalDownPayment,
        usage,
        paidOff:          mortgageAmount === 0,
        hasDiscount:      discount > 0,
        purchasedAt:      Date.now()
    };

    state.propertyInvestments.push(propertyRecord);
    state.residentialCount = (state.residentialCount || 0) + 1;
    state.hasPropertySkill = true;

    // ── Return message ───────────────────────────────────────────────────────
    const discountMsg = discount > 0 ? ` (折扣 ${discount}%)` : '';
    const usageLabel  = usage === 'self_use' ? '自用' : '出租';
    const rentIncome  = usage === 'rent_out' ? monthlyRent : 0;
    const walletMsg   = spendResult.spentLoan > 0
        ? `\n   ${spendResult.message}`
        : '';

    if (monthlyPayment > 0) {
        const netMonthly = rentIncome - monthlyPayment;
        const netStr = netMonthly >= 0
            ? `+$${netMonthly.toLocaleString()}`
            : `-$${Math.abs(netMonthly).toLocaleString()}`;

        return [
            `✅ ${usageLabel}「${card.name}」！`,
            `   💰 首期: $${finalDownPayment.toLocaleString()}${discountMsg}${walletMsg}`,
            `   🏦 貸款: $${mortgageAmount.toLocaleString()}`,
            `   📅 月供: -$${monthlyPayment.toLocaleString()} (投資支出)`,
            `   🏠 租金: +$${rentIncome.toLocaleString()}/月`,
            `   📊 淨月現金流: ${netStr}/月`
        ].join('\n');
    }

    return [
        `✅ ${usageLabel}「${card.name}」！`,
        `   💰 支付: $${finalDownPayment.toLocaleString()}${discountMsg}${walletMsg}`,
        `   🏠 租金: +$${rentIncome.toLocaleString()}/月`
    ].join('\n');
}

// ==================== Settlement processing ====================

/**
 * Called from settlement handler.
 * Deducts monthlyPayment from each active mortgage.
 * When remainingBalance hits 0, removes the mortgage from livingExpense.
 */
function processPropertyMortgages(player, ws, broadcastToRoom, roomId) {
    if (!player.gameState.propertyInvestments) return [];

    const state = player.gameState;
    const paidOffThisRound = [];

    state.propertyInvestments.forEach(prop => {
        if (prop.paidOff || prop.monthlyPayment <= 0) return;

        // Deduct payment from remaining balance
        prop.remainingBalance -= prop.monthlyPayment;
        prop.monthsPaid       += 1;
        prop.totalPaid        += prop.monthlyPayment;

        // Check if paid off
        if (prop.remainingBalance <= 0) {
            prop.remainingBalance = 0;
            prop.paidOff = true;
            state.livingExpense = Math.max(0, (state.livingExpense || 0) - prop.monthlyPayment);
            state.propertyMortgageExpense = Math.max(0,
                (state.propertyMortgageExpense || 0) - prop.monthlyPayment
            );

            // Remove mortgage from livingExpense
            state.livingExpense = Math.max(0, (state.livingExpense || 0) - prop.monthlyPayment);

            paidOffThisRound.push({
                name: prop.name,
                monthlyPayment: prop.monthlyPayment,
                totalPaid: prop.totalPaid,
                months: prop.monthsPaid
            });

            addTransactionRecord(
                player.playerName,
                { name: `房貸還清 - ${prop.name}`, type: 'property', id: 'MORTGAGE_PAID' },
                '房貸還清',
                0,
                `「${prop.name}」貸款已完全還清！共支付 ${prop.monthsPaid} 個月，總計 $${prop.totalPaid.toLocaleString()}`,
                null,
                state
            );
        }
    });

    // Notify player of any paid-off properties
    if (paidOffThisRound.length > 0 && ws && ws.readyState === 1) {
        paidOffThisRound.forEach(p => {
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🎉 「${p.name}」貸款還清！月供 $${p.monthlyPayment.toLocaleString()} 停止扣款！`
            }));
        });
    }

    return paidOffThisRound;
}

// ==================== Early payoff ====================

/**
 * Player requests list of their properties (for the management panel).
 */
function handleGetPropertyList(ws, data, roomId, rooms) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const properties = (player.gameState.propertyInvestments || []).map(p => ({
        instanceId:       p.instanceId,
        id:               p.id,
        name:             p.name,
        image:            p.image,
        usage:            p.usage,
        totalPrice:       p.totalPrice,
        mortgageAmount:   p.mortgageAmount,
        remainingBalance: p.remainingBalance,
        monthlyPayment:   p.monthlyPayment,
        monthlyReturn:    p.monthlyReturn,
        monthsPaid:       p.monthsPaid,
        totalPaid:        p.totalPaid,
        paidOff:          p.paidOff
    }));

    ws.send(JSON.stringify({
        type: 'property_list',
        properties,
        currentCash: player.gameState.cash
    }));
}

/**
 * Player pays remaining balance in one shot.
 * Removes monthlyPayment from livingExpense.
 */
function handleEarlyPayoff(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const instanceId = data.instanceId;
    const state = player.gameState;
    const prop = (state.propertyInvestments || []).find(p => p.instanceId === instanceId);

    if (!prop) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到此物業' }));
        return;
    }

    if (prop.paidOff) {
        ws.send(JSON.stringify({ type: 'error', message: '此物業已還清貸款' }));
        return;
    }

    const remaining = prop.remainingBalance;
    if (!canAffordInvestment(state, remaining)) {
        ws.send(JSON.stringify({
            type:    'notification',
            message: `❌ 資金不足 $${remaining.toLocaleString()}，無法一次付清（現金 + 貸款金）`
        }));
        return;
    }

    const stateBefore = JSON.parse(JSON.stringify(state));
    const spendResult = spendForInvestment(state, remaining);
    prop.totalPaid += remaining;
    prop.remainingBalance = 0;
    prop.paidOff = true;
    state.livingExpense = Math.max(0, (state.livingExpense || 0) - prop.monthlyPayment);
    state.propertyMortgageExpense = Math.max(0,
        (state.propertyMortgageExpense || 0) - prop.monthlyPayment
    );

    // Remove monthly payment from expenses
    state.livingExpense = Math.max(0, (state.livingExpense || 0) - prop.monthlyPayment);

    addTransactionRecord(
        player.playerName,
        { name: `早期還清 - ${prop.name}`, type: 'property', id: 'EARLY_PAYOFF' },
        '早期還清房貸',
        -remaining,
        `一次付清「${prop.name}」剩餘貸款 $${remaining.toLocaleString()}，總計已付 $${prop.totalPaid.toLocaleString()}`,
        stateBefore,
        state
    );

    ws.send(JSON.stringify({
        type: 'property_paid_off',
        instanceId,
        propertyName: prop.name,
        amountPaid: remaining,
        totalPaid: prop.totalPaid,
        message: `🎉 「${prop.name}」貸款一次付清！支付 $${remaining.toLocaleString()}，月供 $${prop.monthlyPayment.toLocaleString()} 停止扣款！`,
        gameState: state
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🎉 ${player.playerName} 一次付清「${prop.name}」的房貸！`
    }, ws);

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: state
    });

    console.log(`💰 ${player.playerName} 一次付清 ${prop.name} 剩餘 $${remaining}`);
}

// ==================== Helpers ====================

function _getDiscount(state) {
    let discount = 0;
    if (state.businessCostDiscount) discount = state.businessCostDiscount;
    if (state.hasBusinessDiscount)  discount = Math.max(discount, state.businessCostDiscount || 0);
    return discount;
}

function _applyDiscount(amount, discount) {
    if (discount <= 0) return amount;
    const saved = Math.round(amount * discount / 100);
    return amount - saved;
}

module.exports = {
    startPropertyChoice,
    handlePropertyChoice,
    processPropertyMortgages,
    handleGetPropertyList,
    handleEarlyPayoff
};