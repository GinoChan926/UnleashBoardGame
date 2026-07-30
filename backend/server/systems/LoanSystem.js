"use strict";

const { receiveLoanCash } = require('./WalletSystem.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPlayerLoan(player) {
    if (!player.loanRecord) {
        player.loanRecord = {
            principal:            0,
            interestRate:         0.10,
            settlementCount:      0,
            lastSettlementMonth:  0
        };
    }
    return player.loanRecord;
}

/**
 * ✅ Monthly cashflow (net after all expenses + interest).
 */
function calculateMonthlyCashflow(state) {
    const income  = (state.salary || 0) + (state.sideIncome || 0) + (state.passiveIncome || 0);
    const expense = (state.livingExpense || 0) + (state.tax || 0)
        + (state.loanInterest || 0) + (state.childExpense || 0);
    return income - expense;
}

function calculateMonthlyIncome(state) {
    return (state.salary || 0) + (state.sideIncome || 0) + (state.passiveIncome || 0);
}

/**
 * ✅ Max loan = cashflow × multiplier.
 * Multiplier upgraded by IN02 from 10 → 40.
 * If cashflow is negative → cap = 0.
 */
function calculateMaxLoan(state) {
    const multiplier = state.loanMultiplier || 10;
    const cashflow   = calculateMonthlyCashflow(state);

    if (cashflow <= 0) return 0;
    return Math.max(0, Math.round(cashflow * multiplier));
}

/**
 * ✅ Get current monthly loan rate as decimal (0.10 or 0.02).
 * permanentLoanRate is stored as a percentage number.
 */
function getLoanRate(state) {
    const pct = state.permanentLoanRate ?? 10;
    return pct / 100;
}

function calculateMonthlyInterest(loanAmount, monthlyRate) {
    return Math.round(loanAmount * monthlyRate);
}

function calculateTotalRepay(principal, interestRate = 0.10) {
    return principal + Math.round(principal * interestRate);
}

// ── Loan application ──────────────────────────────────────────────────────────

function handleLoan(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state       = player.gameState;
    const loanRecord  = getPlayerLoan(player);

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

    // Rule 1: cap check
    if (maxLoan <= 0) {
        ws.send(JSON.stringify({
            type:   'loan_rejected',
            reason: '❌ 你的月現金流為 0 或負數，無法申請貸款！請先增加收入或減少支出'
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

    // Rule 4: cashflow positivity check
    const newMonthlyInterest = calculateMonthlyInterest(amount, monthlyRate);
    const currentCashflow    = calculateMonthlyCashflow(state);
    const cashflowAfterLoan  = currentCashflow - newMonthlyInterest;

    if (cashflowAfterLoan <= 0) {
        ws.send(JSON.stringify({
            type:   'loan_rejected',
            reason: `❌ 貸款後月現金流將為 $${cashflowAfterLoan.toLocaleString()}（≤ 0），不允許貸款！\n` +
                `📊 目前現金流: $${currentCashflow.toLocaleString()}\n` +
                `💸 新增月利息: $${newMonthlyInterest.toLocaleString()}\n` +
                `💡 請減少貸款金額`
        }));
        return;
    }

    // ── Approve loan ──────────────────────────────────────────────────────────

    loanRecord.principal           = amount;
    loanRecord.interestRate        = monthlyRate;
    loanRecord.settlementCount     = 0;
    loanRecord.lastSettlementMonth = state.totalSettlementCount || 0;

    receiveLoanCash(state, amount);
    state.loanAmount   = amount;
    state.loanInterest = newMonthlyInterest;

    const totalToRepay = amount + newMonthlyInterest;

    const result = {
        type:           'loan_approved',
        playerId:       player.playerId,
        playerName:     player.playerName,
        loanAmount:     amount,
        interestAmount: newMonthlyInterest,
        totalToRepay,
        monthlyRate,
        maxLoan,
        cashflowAfter:  cashflowAfterLoan,
        gameState:      state
    };
    ws.send(JSON.stringify(result));
    broadcastToRoom(roomId, result, ws);

    console.log(`🏦 ${player.playerName} 貸款 $${amount.toLocaleString()} @ ${rateName}/月，貸款後現金流: $${cashflowAfterLoan.toLocaleString()}`);
}

// ── Loan repayment ────────────────────────────────────────────────────────────

function handleRepayLoan(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const loanRecord = getPlayerLoan(player);
    const principal  = loanRecord.principal;

    if (principal === 0) {
        ws.send(JSON.stringify({ type: 'error', message: '💰 沒有未償還的貸款' }));
        return;
    }

    const totalToRepay = calculateTotalRepay(principal, loanRecord.interestRate);
    const interest     = totalToRepay - principal;

    // ✅ Support partial repayment
    const requestedAmount = parseInt(data.amount || data.data?.amount || totalToRepay);
    const actualPayment   = Math.min(requestedAmount, totalToRepay);

    if (actualPayment <= 0) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '請輸入有效的還款金額'
        }));
        return;
    }

    // ✅ Non-investment: use regular cash only
    const { spendForNonInvestment } = require('./WalletSystem.js');
    const spendResult = spendForNonInvestment(player.gameState, actualPayment);

    if (!spendResult.success) {
        ws.send(JSON.stringify({
            type:    'error',
            message: `${spendResult.message}\n還款需要 $${actualPayment.toLocaleString()} 現金 (本利和共 $${totalToRepay.toLocaleString()})`
        }));
        return;
    }

    // ✅ Apply payment — interest first, then principal
    const interestPortion  = Math.min(actualPayment, interest);
    const principalPortion = actualPayment - interestPortion;

    loanRecord.principal -= principalPortion;

    // If loan is fully paid off
    const isFullyPaid = loanRecord.principal <= 0;

    if (isFullyPaid) {
        loanRecord.principal          = 0;
        loanRecord.settlementCount    = 0;
        player.gameState.loanAmount   = 0;
        player.gameState.loanInterest = 0;
    } else {
        // Update loanAmount + recalculate monthly interest based on remaining principal
        player.gameState.loanAmount   = loanRecord.principal;
        player.gameState.loanInterest = Math.round(loanRecord.principal * loanRecord.interestRate);
    }

    const result = {
        type:              'loan_repaid',
        playerId:          player.playerId,
        playerName:        player.playerName,
        repaidAmount:      principalPortion,
        interestAmount:    interestPortion,
        totalRepaid:       actualPayment,
        remainingPrincipal: loanRecord.principal,
        isFullyPaid,
        gameState:         player.gameState
    };
    ws.send(JSON.stringify(result));
    broadcastToRoom(roomId, result, ws);

    console.log(
        `💰 ${player.playerName} 還款 $${actualPayment.toLocaleString()} ` +
        `(本金 $${principalPortion.toLocaleString()} + 利息 $${interestPortion.toLocaleString()})` +
        (isFullyPaid ? '（已還清）' : `，剩餘本金 $${loanRecord.principal.toLocaleString()}`)
    );
}

// ── Settlement-based auto-repayment ───────────────────────────────────────────

function processSettlementRepayment(player, ws, roomId, broadcastToRoom) {
    const loanRecord = getPlayerLoan(player);
    if (loanRecord.principal === 0) return null;

    loanRecord.settlementCount++;
    player.gameState.totalSettlementCount = (player.gameState.totalSettlementCount || 0) + 1;

    const interestRate = loanRecord.interestRate || 0.10;
    const totalToRepay = loanRecord.principal + Math.round(loanRecord.principal * interestRate);
    const interest     = totalToRepay - loanRecord.principal;

    if (loanRecord.settlementCount >= 12) {
        if (player.gameState.cash >= totalToRepay) {
            player.gameState.cash -= totalToRepay;
            const result = {
                type:           'forced_repayment',
                playerId:       player.playerId,
                playerName:     player.playerName,
                message:        `⚠️ 強制還款！扣除 $${totalToRepay.toLocaleString()}`,
                deductedAmount: totalToRepay,
                remainingCash:  player.gameState.cash,
                gameState:      player.gameState
            };
            player.gameState.loanAmount   = 0;
            player.gameState.loanInterest = 0;
            loanRecord.principal          = 0;
            loanRecord.settlementCount    = 0;
            return result;
        } else {
            const deducted      = player.gameState.cash;
            const remainingDebt = totalToRepay - deducted;
            player.gameState.cash         = 0;
            loanRecord.principal          = remainingDebt;
            loanRecord.settlementCount    = 12;
            player.gameState.loanAmount   = remainingDebt;
            player.gameState.loanInterest = Math.round(remainingDebt * interestRate);

            return {
                type:           'forced_repayment_partial',
                playerId:       player.playerId,
                playerName:     player.playerName,
                message:        `⚠️ 強制部分還款！扣除 $${deducted.toLocaleString()}，剩餘欠款 $${remainingDebt.toLocaleString()}`,
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
        message:              `⚠️ 貸款提醒！本金 $${loanRecord.principal.toLocaleString()}，已過 ${loanRecord.settlementCount}/12 次結算日`,
        principal:            loanRecord.principal,
        totalToRepay,
        interest,
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

    ws.send(JSON.stringify({
        type:            'loan_info',
        cash:            state.cash,
        loanCash:        state.loanCash || 0,
        currentLoan:     loanRecord.principal,
        monthlyInterest: state.loanInterest,
        monthlyRate:     getLoanRate(state),
        capMultiplier:   state.loanMultiplier || 10,
        monthlyCashflow: calculateMonthlyCashflow(state),
        monthlyIncome:   calculateMonthlyIncome(state),
        maxLoan:         calculateMaxLoan(state),
        settlementCount: loanRecord.settlementCount,
        totalToRepay:    loanRecord.principal > 0
            ? calculateTotalRepay(loanRecord.principal, loanRecord.interestRate)
            : 0
    }));
}

module.exports = {
    getPlayerLoan,
    calculateTotalRepay,
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