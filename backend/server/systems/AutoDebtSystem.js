"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

/**
 * Auto-debt system: when a player owes money they cannot pay,
 * the debt is queued and automatically deducted from future income.
 */

// ── Add a new debt ────────────────────────────────────────────────────────────

function chargePlayer(player, amount, options = {}) {
    const {
        source          = 'unknown',
        creditor        = 'bank',
        creditorName    = '銀行',
        room            = null,
        roomId          = null,
        broadcastToRoom = null,
        ws              = null
    } = options;

    const state = player.gameState;
    let paidNow    = 0;
    let debtAmount = 0;
    let debtId     = null;

    if (state.cash >= amount) {
        state.cash -= amount;
        paidNow = amount;

        if (creditor !== 'bank' && room) {
            _payCreditor(creditor, amount, room, broadcastToRoom, roomId);
        }
    } else {
        paidNow    = state.cash;
        debtAmount = amount - paidNow;
        state.cash = 0;

        if (paidNow > 0 && creditor !== 'bank' && room) {
            _payCreditor(creditor, paidNow, room, broadcastToRoom, roomId);
        }

        debtId = `debt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        state.pendingDebts = state.pendingDebts || [];
        state.pendingDebts.push({
            id:           debtId,
            amount:       debtAmount,
            source,
            creditor,
            creditorName,
            createdAt:    Date.now()
        });

        console.log(`💸 ${player.playerName} 產生自動債務 $${debtAmount} → ${creditorName} (${source})`);

        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({
                type:    'notification',
                message: `💸 現金不足！剩餘 $${debtAmount.toLocaleString()} 將由未來收入自動償還給 ${creditorName}`
            }));
        }
    }

    return {
        paid:        paidNow,
        debtCreated: debtAmount > 0,
        debtAmount,
        debtId
    };
}

// ── Process debt collection on income events ──────────────────────────────────

function processDebtCollection(player, room, roomId, broadcastToRoom) {
    const state = player.gameState;
    if (!state.pendingDebts || state.pendingDebts.length === 0) return [];
    if (state.cash <= 0) return [];

    const clearedDebts    = [];
    const partialPayments = [];

    for (let i = 0; i < state.pendingDebts.length; i++) {
        if (state.cash <= 0) break;

        const debt    = state.pendingDebts[i];
        const payment = Math.min(state.cash, debt.amount);

        state.cash  -= payment;
        debt.amount -= payment;

        if (debt.creditor !== 'bank' && room) {
            _payCreditor(debt.creditor, payment, room, broadcastToRoom, roomId);
        }

        if (debt.amount === 0) {
            clearedDebts.push({
                source:       debt.source,
                creditorName: debt.creditorName,
                paidAmount:   payment,
                originalDebt: payment
            });
        } else {
            partialPayments.push({
                source:       debt.source,
                creditorName: debt.creditorName,
                paidAmount:   payment,
                remaining:    debt.amount
            });
        }
    }

    state.pendingDebts = state.pendingDebts.filter(d => d.amount > 0);

    clearedDebts.forEach(d => {
        addTransactionRecord(
            player.playerName,
            { name: `自動償還 - ${d.source}`, type: 'system', id: 'AUTO_DEBT_PAID' },
            '自動償還債務',
            -d.paidAmount,
            `自動償還 ${d.creditorName} 債務 $${d.paidAmount.toLocaleString()}（已還清）`,
            null,
            state
        );
        console.log(`✅ ${player.playerName} 償還債務 $${d.paidAmount} → ${d.creditorName}`);
    });

    partialPayments.forEach(d => {
        addTransactionRecord(
            player.playerName,
            { name: `自動償還 (部分) - ${d.source}`, type: 'system', id: 'AUTO_DEBT_PARTIAL' },
            '自動償還債務',
            -d.paidAmount,
            `自動償還 ${d.creditorName} 債務 $${d.paidAmount.toLocaleString()}（剩餘 $${d.remaining.toLocaleString()}）`,
            null,
            state
        );
        console.log(`⚙️ ${player.playerName} 部分償還 $${d.paidAmount} → ${d.creditorName}（剩 $${d.remaining}）`);
    });

    return [...clearedDebts, ...partialPayments];
}

// ── Query: get total pending debt ─────────────────────────────────────────────

function getTotalPendingDebt(state) {
    if (!state.pendingDebts) return 0;
    return state.pendingDebts.reduce((sum, d) => sum + d.amount, 0);
}

// ── ✅ NEW: Manual repay ─────────────────────────────────────────────────────

/**
 * Manually pay off debts (called from player action).
 * @param {object} player
 * @param {object} room
 * @param {string} roomId
 * @param {Function} broadcastToRoom
 * @param {number} amount - amount player wants to pay
 * @param {string|null} debtId - specific debt to pay, or null for FIFO
 */
function payDebtManually(player, room, roomId, broadcastToRoom, amount, debtId = null) {
    const state = player.gameState;

    if (!state.pendingDebts || state.pendingDebts.length === 0) {
        return { success: false, message: '你沒有待償還債務' };
    }

    if (state.cash <= 0) {
        return { success: false, message: '現金不足，無法償還' };
    }

    let payment = Math.min(amount, state.cash);
    if (payment <= 0) {
        return { success: false, message: '償還金額必須大於 0' };
    }

    const clearedDebts    = [];
    const partialPayments = [];

    if (debtId) {
        // Pay a specific debt
        const debt = state.pendingDebts.find(d => d.id === debtId);
        if (!debt) {
            return { success: false, message: '找不到指定的債務' };
        }

        const actual = Math.min(payment, debt.amount);
        state.cash  -= actual;
        debt.amount -= actual;

        if (debt.creditor !== 'bank' && room) {
            _payCreditor(debt.creditor, actual, room, broadcastToRoom, roomId);
        }

        if (debt.amount === 0) {
            clearedDebts.push({
                source:       debt.source,
                creditorName: debt.creditorName,
                paidAmount:   actual
            });
        } else {
            partialPayments.push({
                source:       debt.source,
                creditorName: debt.creditorName,
                paidAmount:   actual,
                remaining:    debt.amount
            });
        }
    } else {
        // FIFO — pay debts in order
        for (const debt of state.pendingDebts) {
            if (payment <= 0) break;

            const actual = Math.min(payment, debt.amount);
            state.cash  -= actual;
            debt.amount -= actual;
            payment     -= actual;

            if (debt.creditor !== 'bank' && room) {
                _payCreditor(debt.creditor, actual, room, broadcastToRoom, roomId);
            }

            if (debt.amount === 0) {
                clearedDebts.push({
                    source:       debt.source,
                    creditorName: debt.creditorName,
                    paidAmount:   actual
                });
            } else {
                partialPayments.push({
                    source:       debt.source,
                    creditorName: debt.creditorName,
                    paidAmount:   actual,
                    remaining:    debt.amount
                });
            }
        }
    }

    state.pendingDebts = state.pendingDebts.filter(d => d.amount > 0);

    clearedDebts.forEach(d => {
        addTransactionRecord(
            player.playerName,
            { name: `手動償還 - ${d.source}`, type: 'system', id: 'MANUAL_DEBT_PAID' },
            '手動償還債務',
            -d.paidAmount,
            `手動償還 ${d.creditorName} $${d.paidAmount.toLocaleString()}（已還清）`,
            null,
            state
        );
    });

    partialPayments.forEach(d => {
        addTransactionRecord(
            player.playerName,
            { name: `手動償還 (部分) - ${d.source}`, type: 'system', id: 'MANUAL_DEBT_PARTIAL' },
            '手動償還債務',
            -d.paidAmount,
            `手動償還 ${d.creditorName} $${d.paidAmount.toLocaleString()}（剩餘 $${d.remaining.toLocaleString()}）`,
            null,
            state
        );
    });

    const totalPaid = [...clearedDebts, ...partialPayments]
        .reduce((sum, d) => sum + d.paidAmount, 0);

    return {
        success:        true,
        totalPaid,
        clearedDebts,
        partialPayments,
        remainingDebts: state.pendingDebts,
        message:        `✅ 已償還 $${totalPaid.toLocaleString()}`
    };
}

// ── ✅ NEW: Universal credit helper (auto-repays after receiving) ────────────

/**
 * Call whenever a player receives money.
 * Adds cash first, then auto-repays pending debts.
 */
function creditPlayer(player, amount, options = {}) {
    const {
        room            = null,
        roomId          = null,
        broadcastToRoom = null,
        source          = 'income'
    } = options;

    const state = player.gameState;

    if (amount <= 0) {
        return { received: 0, autoRepaid: 0, remainingCash: state.cash };
    }

    state.cash += amount;

    let autoRepaid = 0;
    if (state.pendingDebts && state.pendingDebts.length > 0 && state.cash > 0) {
        const paidDebts = processDebtCollection(player, room, roomId, broadcastToRoom);
        autoRepaid = paidDebts.reduce((sum, d) => sum + d.paidAmount, 0);

        if (autoRepaid > 0) {
            console.log(
                `💸 ${player.playerName} 收到 $${amount.toLocaleString()} → 自動償還 $${autoRepaid.toLocaleString()} 債務 (${source})`
            );
        }
    }

    return {
        received:      amount,
        autoRepaid,
        remainingCash: state.cash
    };
}

// ── Private ───────────────────────────────────────────────────────────────────

function _payCreditor(creditorId, amount, room, broadcastToRoom, roomId) {
    for (const [pWs, p] of room.players) {
        if (p.playerId === creditorId) {
            // ✅ Use creditPlayer so creditor's own debts auto-repay
            const result = creditPlayer(p, amount, {
                room, roomId, broadcastToRoom,
                source: '收到償還款'
            });

            addTransactionRecord(
                p.playerName,
                { name: '接收償還款', type: 'system', id: 'DEBT_REPAY_RECEIVED' },
                '接收償還',
                amount,
                `收到自動償還款 $${amount.toLocaleString()}` +
                (result.autoRepaid > 0
                    ? ` (其中 $${result.autoRepaid.toLocaleString()} 自動用於償還自己的債務)`
                    : ''),
                null,
                p.gameState
            );

            if (pWs && pWs.readyState === 1) {
                let msg = `💰 收到自動償還款 $${amount.toLocaleString()} 元`;
                if (result.autoRepaid > 0) {
                    msg += `\n💸 其中 $${result.autoRepaid.toLocaleString()} 已自動償還你的債務`;
                }
                pWs.send(JSON.stringify({ type: 'notification', message: msg }));
            }

            if (broadcastToRoom && roomId) {
                broadcastToRoom(roomId, {
                    type:      'state_updated',
                    playerId:  p.playerId,
                    gameState: p.gameState
                });
            }
            return;
        }
    }
}

module.exports = {
    chargePlayer,
    processDebtCollection,
    getTotalPendingDebt,
    payDebtManually,
    creditPlayer
};