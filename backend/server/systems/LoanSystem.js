"use strict";

const { getEffectivePassiveIncome } = require('../utils/helpers.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPlayerLoan(player) {
    if (!player.loanRecord) {
        player.loanRecord = {
            principal:            0,
            interestRate:         0.10,
            accruedInterest:      0,
            settlementCount:      0,
            lastSettlementMonth:  0
        };
    }
    return player.loanRecord;
}

function calculateMonthlyCashflow(state) {
    const income  = (state.salary || 0) + (state.sideIncome || 0) + getEffectivePassiveIncome(state);
    const expense = (state.livingExpense || 0) + (state.tax || 0)
        + (state.childExpense || 0);
    return income - expense;
}

function calculateMonthlyIncome(state) {
    return (state.salary || 0) + (state.sideIncome || 0) + getEffectivePassiveIncome(state);
}

function calculateMaxLoan(state) {
    const multiplier = state.loanMultiplier || 10;
    const cashflow   = calculateMonthlyCashflow(state);

    if (cashflow < 0) return 0;
    return Math.max(0, Math.round(cashflow * multiplier));
}

function getLoanRate(state) {
    const pct = state.permanentLoanRate ?? 10;
    return pct / 100;
}

function calculateMonthlyInterest(loanAmount, monthlyRate) {
    return Math.round(loanAmount * monthlyRate);
}

function calculateTotalOwed(loanRecord) {
    return loanRecord.principal + (loanRecord.accruedInterest || 0);
}

// ── Loan application ──────────────────────────────────────────────────────────

function handleLoan(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state      = player.gameState;
    const loanRecord = getPlayerLoan(player);

    if (loanRecord.principal > 0) {
        ws.send(JSON.stringify({
            type:   'loan_rejected',
            reason: `❌ 你還有 $${loanRecord.principal.toLocaleString()} 元貸款未還清，請先還清再申請！`
        }));
        return;
    }

    const amount      = parseInt(data.data?.amount || data.amount || 0);
    const maxLoan     = calculateMaxLoan(state);
    const monthlyRate = getLoanRate(state);
    const rateName    = (monthlyRate * 100).toFixed(1) + '%';

    if (!amount || amount <= 0) {
        ws.send(JSON.stringify({
            type:   'loan_rejected',
            reason: '❌ 貸款金額必須大於 0'
        }));
        return;
    }

    if (maxLoan <= 0) {
        ws.send(JSON.stringify({
            type:   'loan_rejected',
            reason: '❌ 你的月現金流為負數，無法申請貸款！請先增加收入或減少支出'
        }));
        return;
    }

    if (amount > maxLoan) {
        ws.send(JSON.stringify({
            type:   'loan_rejected',
            reason: `❌ 超出貸款上限！最多可貸 $${maxLoan.toLocaleString()}（月現金流 × ${state.loanMultiplier || 10}）`
        }));
        return;
    }

    const newMonthlyInterest = calculateMonthlyInterest(amount, monthlyRate);
    const currentCashflow    = calculateMonthlyCashflow(state);
    const cashflowAfterLoan  = currentCashflow - newMonthlyInterest;

    if (cashflowAfterLoan < 0) {
        ws.send(JSON.stringify({
            type:   'loan_rejected',
            reason: `❌ 貸款後你的現金流無法覆蓋月利息！\n` +
                `📊 目前現金流: $${currentCashflow.toLocaleString()}\n` +
                `💸 每月利息: $${newMonthlyInterest.toLocaleString()}\n` +
                `⚠️ 累積利息將無法償還，請減少貸款金額`
        }));
        return;
    }

    // ── Approve loan ──────────────────────────────────────────────────────────
    loanRecord.principal           = amount;
    loanRecord.interestRate        = monthlyRate;
    loanRecord.accruedInterest     = 0;
    loanRecord.settlementCount     = 0;
    loanRecord.lastSettlementMonth = state.totalSettlementCount || 0;

    // ✅ Mirror to gameState (grouped for clarity)
    state.accruedInterest = 0;
    state.loanAmount      = amount;
    state.loanInterest    = newMonthlyInterest;

    const { receiveLoanCash } = require('./WalletSystem.js');
    receiveLoanCash(state, amount);

    const result = {
        type:            'loan_approved',
        playerId:        player.playerId,
        playerName:      player.playerName,
        loanAmount:      amount,
        monthlyInterest: newMonthlyInterest,
        monthlyRate,
        maxLoan,
        cashflowAfter:   cashflowAfterLoan,
        gameState:       state
    };
    ws.send(JSON.stringify(result));
    broadcastToRoom(roomId, result, ws);

    console.log(`🏦 ${player.playerName} 貸款 $${amount.toLocaleString()} @ ${rateName}/月`);
}

// ── Loan repayment ────────────────────────────────────────────────────────────

function handleRepayLoan(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state      = player.gameState;
    const loanRecord = getPlayerLoan(player);
    const principal  = loanRecord.principal;
    const accrued    = loanRecord.accruedInterest || 0;
    const totalOwed  = principal + accrued;
    const loanCash   = state.loanCash || 0;

    if (principal === 0 && accrued === 0) {
        ws.send(JSON.stringify({ type: 'error', message: '💰 沒有未償還的貸款' }));
        return;
    }

    const requestedAmount = parseInt(data.amount || data.data?.amount || totalOwed);
    const actualPayment   = Math.min(requestedAmount, totalOwed);

    if (actualPayment <= 0) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '請輸入有效的還款金額'
        }));
        return;
    }

    // ✅ Determine if this payment will fully repay the loan
    const willBeFullyPaid = actualPayment >= totalOwed;

    // ✅ Option C: On full repay, apply unused loanCash to reduce the amount from regular cash
    let loanCashReturned = 0;
    let cashRequired     = actualPayment;

    if (willBeFullyPaid && loanCash > 0) {
        // Unused loan cash gets returned — reduces regular cash needed
        // But loanCash can only cancel out principal (not interest)
        loanCashReturned = Math.min(loanCash, principal);
        cashRequired     = actualPayment - loanCashReturned;
    }

    // ✅ Check regular cash affordability
    const { spendForNonInvestment } = require('./WalletSystem.js');

    if (cashRequired > 0) {
        const spendResult = spendForNonInvestment(state, cashRequired);
        if (!spendResult.success) {
            ws.send(JSON.stringify({
                type:    'error',
                message: `${spendResult.message}\n需要 $${cashRequired.toLocaleString()} 現金` +
                    (loanCashReturned > 0
                        ? ` (已扣除返還貸款金 $${loanCashReturned.toLocaleString()})`
                        : '')
            }));
            return;
        }
    }

    // ✅ Deduct the returned loan cash from loanCash
    if (loanCashReturned > 0) {
        state.loanCash = loanCash - loanCashReturned;
    }

    // ✅ Apply payment: accrued interest first, then principal
    const paidInterest  = Math.min(actualPayment, accrued);
    const paidPrincipal = actualPayment - paidInterest;

    loanRecord.accruedInterest = accrued - paidInterest;
    loanRecord.principal       = principal - paidPrincipal;

    const isFullyPaid = loanRecord.principal <= 0 && loanRecord.accruedInterest <= 0;

    if (isFullyPaid) {
        loanRecord.principal          = 0;
        loanRecord.accruedInterest    = 0;
        loanRecord.settlementCount    = 0;
        state.loanAmount              = 0;
        state.loanInterest            = 0;
    } else {
        state.loanAmount   = loanRecord.principal;
        state.loanInterest = calculateMonthlyInterest(
            loanRecord.principal, loanRecord.interestRate
        );
    }

    // Always mirror accruedInterest
    state.accruedInterest = loanRecord.accruedInterest;

    const result = {
        type:               'loan_repaid',
        playerId:           player.playerId,
        playerName:         player.playerName,
        repaidPrincipal:    paidPrincipal,
        repaidInterest:     paidInterest,
        totalRepaid:        actualPayment,
        cashPaid:           cashRequired,           // ✅ NEW — actual cash spent
        loanCashReturned,                            // ✅ NEW — returned amount
        remainingPrincipal: loanRecord.principal,
        remainingInterest:  loanRecord.accruedInterest,
        isFullyPaid,
        gameState:          state
    };
    ws.send(JSON.stringify(result));
    broadcastToRoom(roomId, result, ws);

    console.log(
        `💰 ${player.playerName} 還款 $${actualPayment.toLocaleString()} ` +
        `(利息 $${paidInterest.toLocaleString()} + 本金 $${paidPrincipal.toLocaleString()})` +
        (loanCashReturned > 0
            ? ` [返還貸款金 $${loanCashReturned.toLocaleString()}, 實付現金 $${cashRequired.toLocaleString()}]`
            : '') +
        (isFullyPaid
            ? '（已還清）'
            : `，剩餘本金 $${loanRecord.principal.toLocaleString()}，累積利息 $${loanRecord.accruedInterest.toLocaleString()}`)
    );
}

// ── Settlement-based interest accrual + forced repayment ─────────────────────

function processSettlementRepayment(player, ws, roomId, broadcastToRoom) {
    const loanRecord = getPlayerLoan(player);
    if (loanRecord.principal === 0 && (loanRecord.accruedInterest || 0) === 0) return null;

    loanRecord.settlementCount++;
    player.gameState.totalSettlementCount = (player.gameState.totalSettlementCount || 0) + 1;

    const monthlyInterest = Math.round(loanRecord.principal * loanRecord.interestRate);
    loanRecord.accruedInterest = (loanRecord.accruedInterest || 0) + monthlyInterest;

    // ✅ Mirror to gameState
    player.gameState.accruedInterest = loanRecord.accruedInterest;
    player.gameState.loanInterest    = monthlyInterest;

    const totalOwed = loanRecord.principal + loanRecord.accruedInterest;

    // ── Forced full repayment after 12 settlements ────────────────────────────
    if (loanRecord.settlementCount >= 12) {
        const { spendForNonInvestment, canAffordNonInvestment } = require('./WalletSystem.js');

        if (canAffordNonInvestment(player.gameState, totalOwed)) {
            // ✅ Apply loanCash refund to reduce cash needed
            const loanCash         = player.gameState.loanCash || 0;
            const loanCashReturned = Math.min(loanCash, loanRecord.principal);
            const cashRequired     = totalOwed - loanCashReturned;

            if (loanCashReturned > 0) {
                player.gameState.loanCash = loanCash - loanCashReturned;
            }

            if (cashRequired > 0) {
                spendForNonInvestment(player.gameState, cashRequired);
            }

            const result = {
                type:            'forced_repayment',
                playerId:        player.playerId,
                playerName:      player.playerName,
                message:         `⚠️ 12個月到期！強制還款！` +
                    `扣除 $${totalOwed.toLocaleString()}（本金 $${loanRecord.principal.toLocaleString()} + 累積利息 $${loanRecord.accruedInterest.toLocaleString()}）` +
                    (loanCashReturned > 0
                        ? `\n💡 返還未用貸款金 $${loanCashReturned.toLocaleString()}，實付現金 $${cashRequired.toLocaleString()}`
                        : ''),
                deductedAmount:  totalOwed,
                cashPaid:        cashRequired,
                loanCashReturned,
                principal:       loanRecord.principal,
                accruedInterest: loanRecord.accruedInterest,
                remainingCash:   player.gameState.cash,
                gameState:       player.gameState
            };

            loanRecord.principal             = 0;
            loanRecord.accruedInterest       = 0;
            loanRecord.settlementCount       = 0;
            player.gameState.loanAmount      = 0;
            player.gameState.loanInterest    = 0;
            player.gameState.accruedInterest = 0;

            return result;
        } else {
            const deducted      = player.gameState.cash || 0;
            const remainingDebt = totalOwed - deducted;
            player.gameState.cash = 0;

            loanRecord.principal       = remainingDebt;
            loanRecord.accruedInterest = 0;
            loanRecord.settlementCount = 12;

            player.gameState.loanAmount      = remainingDebt;
            player.gameState.loanInterest    = Math.round(remainingDebt * loanRecord.interestRate);
            player.gameState.accruedInterest = 0;   // ✅ ADD

            return {
                type:           'forced_repayment_partial',
                playerId:       player.playerId,
                playerName:     player.playerName,
                message:        `⚠️ 12個月到期！強制部分還款！扣除 $${deducted.toLocaleString()}，剩餘欠款 $${remainingDebt.toLocaleString()}`,
                deductedAmount: deducted,
                remainingDebt,
                remainingCash:  0,
                gameState:      player.gameState
            };
        }
    }

    return {
        type:                 'settlement_reminder',
        playerId:             player.playerId,
        playerName:           player.playerName,
        message:              `⚠️ 貸款利息累積！本金 $${loanRecord.principal.toLocaleString()}，本月利息 +$${monthlyInterest.toLocaleString()}，累積利息 $${loanRecord.accruedInterest.toLocaleString()}，本利和 $${totalOwed.toLocaleString()}（已過 ${loanRecord.settlementCount}/12 次結算日）`,
        principal:            loanRecord.principal,
        monthlyInterest,
        accruedInterest:      loanRecord.accruedInterest,
        totalOwed,
        settlementCount:      loanRecord.settlementCount,
        remainingSettlements: 12 - loanRecord.settlementCount,
        gameState:            player.gameState
    };
}

// ── Query helper for frontend ─────────────────────────────────────────────────

function handleGetLoanInfo(ws, data, roomId, rooms) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state = player.gameState;
    const loanRecord = getPlayerLoan(player);
    const totalOwed = loanRecord.principal + (loanRecord.accruedInterest || 0);

    ws.send(JSON.stringify({
        type:            'loan_info',
        cash:            state.cash,
        loanCash:        state.loanCash || 0,
        currentLoan:     loanRecord.principal,
        accruedInterest: loanRecord.accruedInterest || 0,
        totalOwed,
        monthlyInterest: state.loanInterest,
        monthlyRate:     getLoanRate(state),
        capMultiplier:   state.loanMultiplier || 10,
        monthlyCashflow: calculateMonthlyCashflow(state),
        monthlyIncome:   calculateMonthlyIncome(state),
        maxLoan:         calculateMaxLoan(state),
        settlementCount: loanRecord.settlementCount,
        totalToRepay:    totalOwed
    }));
}

module.exports = {
    getPlayerLoan,
    calculateTotalOwed,
    calculateMonthlyCashflow,
    calculateMonthlyIncome,
    calculateMaxLoan,
    calculateMonthlyInterest,
    getLoanRate,
    handleLoan,
    handleRepayLoan,
    processSettlementRepayment,
    handleGetLoanInfo
};