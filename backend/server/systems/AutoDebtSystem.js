"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

/**
 * Auto-debt system: when a player owes money they cannot pay,
 * the debt is queued and automatically deducted from future income.
 *
 * Debt structure on gameState:
 *   state.pendingDebts = [
 *     { id, amount, source, creditor, createdAt }
 *   ]
 *
 * "creditor" can be:
 *   - 'bank'                (game fines, taxes, etc)
 *   - <playerId>            (player-to-player debt, gets paid back to them)
 */

// ── Add a new debt ────────────────────────────────────────────────────────────

/**
 * Try to charge a player. If they can't fully pay, queue remainder as debt.
 * @param {object} player - the player being charged
 * @param {number} amount - total amount to charge
 * @param {object} options - { source, creditor, creditorName, room, roomId, broadcastToRoom, ws }
 * @returns {object} { paid, debtCreated, debtId }
 */
function chargePlayer(player, amount, options = {}) {
    const {
        source = 'unknown',
        creditor = 'bank',
        creditorName = '銀行',
        room = null,
        roomId = null,
        broadcastToRoom = null,
        ws = null
    } = options;

    const state = player.gameState;
    let paidNow = 0;
    let debtAmount = 0;
    let debtId = null;

    if (state.cash >= amount) {
        // Full payment
        state.cash -= amount;
        paidNow = amount;

        // If creditor is another player, transfer money to them
        if (creditor !== 'bank' && room) {
            _payCreditor(creditor, amount, room, broadcastToRoom, roomId);
        }
    } else {
        // Partial - take all cash, queue rest as debt
        paidNow = state.cash;
        debtAmount = amount - paidNow;
        state.cash = 0;

        // Immediate payment to creditor (if any)
        if (paidNow > 0 && creditor !== 'bank' && room) {
            _payCreditor(creditor, paidNow, room, broadcastToRoom, roomId);
        }

        // Queue the remainder
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

        // Notify player of the debt
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({
                type: 'notification',
                message: `💸 現金不足！剩餘 $${debtAmount.toLocaleString()} 將由未來收入自動償還給 ${creditorName}`
            }));
        }
    }

    return {
        paid:         paidNow,
        debtCreated:  debtAmount > 0,
        debtAmount,
        debtId
    };
}

// ── Process debt collection on income events ──────────────────────────────────

/**
 * Call this whenever a player receives money (settlement, card income, sales).
 * Deducts as much as possible from their cash to pay off pending debts.
 * @returns {Array} list of debts fully repaid this round
 */
function processDebtCollection(player, room, roomId, broadcastToRoom) {
    const state = player.gameState;
    if (!state.pendingDebts || state.pendingDebts.length === 0) return [];
    if (state.cash <= 0) return [];

    const clearedDebts = [];
    const partialPayments = [];

    // Iterate through debts (FIFO - oldest first)
    for (let i = 0; i < state.pendingDebts.length; i++) {
        if (state.cash <= 0) break;

        const debt = state.pendingDebts[i];
        const payment = Math.min(state.cash, debt.amount);

        state.cash -= payment;
        debt.amount -= payment;

        // If creditor is another player, transfer money to them
        if (debt.creditor !== 'bank' && room) {
            _payCreditor(debt.creditor, payment, room, broadcastToRoom, roomId);
        }

        if (debt.amount === 0) {
            clearedDebts.push({
                source:         debt.source,
                creditorName:   debt.creditorName,
                paidAmount:     payment,
                originalDebt:   payment  // full clearance in one shot
            });
        } else {
            partialPayments.push({
                source:         debt.source,
                creditorName:   debt.creditorName,
                paidAmount:     payment,
                remaining:      debt.amount
            });
        }
    }

    // Remove cleared debts
    state.pendingDebts = state.pendingDebts.filter(d => d.amount > 0);

    // Record transactions and notify
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

// ── Private ───────────────────────────────────────────────────────────────────

function _payCreditor(creditorId, amount, room, broadcastToRoom, roomId) {
    // Find creditor in room
    for (const [pWs, p] of room.players) {
        if (p.playerId === creditorId) {
            p.gameState.cash += amount;

            addTransactionRecord(
                p.playerName,
                { name: '接收償還款', type: 'system', id: 'DEBT_REPAY_RECEIVED' },
                '接收償還',
                amount,
                `收到自動償還款 $${amount.toLocaleString()}`,
                null,
                p.gameState
            );

            // Notify creditor
            if (pWs && pWs.readyState === 1) {
                pWs.send(JSON.stringify({
                    type: 'notification',
                    message: `💰 收到自動償還款 $${amount.toLocaleString()} 元`
                }));
            }

            // Broadcast state update
            if (broadcastToRoom && roomId) {
                broadcastToRoom(roomId, {
                    type: 'state_updated',
                    playerId: p.playerId,
                    gameState: p.gameState
                });
            }
            return;
        }
    }
}

module.exports = { chargePlayer, processDebtCollection, getTotalPendingDebt };