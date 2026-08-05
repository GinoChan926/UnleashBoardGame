"use strict";

/**
 * Wallet system: manages regular cash + loan cash separately.
 *
 * Rules:
 *   - Investment purchases use loanCash FIRST, then regular cash
 *   - Non-investment purchases use regular cash ONLY (loanCash doesn't count)
 *   - Loan repayments use regular cash only
 *   - Income (settlement, cards, gifts, sales) goes to regular cash
 */

function getRegularCash(state) {
    return state.cash || 0;
}

function getLoanCash(state) {
    return state.loanCash || 0;
}

function totalSpendable(state) {
    return getRegularCash(state) + getLoanCash(state);
}

function canAffordInvestment(state, amount) {
    return totalSpendable(state) >= amount;
}

function canAffordNonInvestment(state, amount) {
    return getRegularCash(state) >= amount;
}

/**
 * ✅ For INVESTMENT purchases: deduct loanCash first, then regular cash.
 */
function spendForInvestment(state, amount) {
    if (amount <= 0) {
        return { success: true, spentLoan: 0, spentRegular: 0, message: '' };
    }

    if (!canAffordInvestment(state, amount)) {
        return {
            success:      false,
            spentLoan:    0,
            spentRegular: 0,
            message: `❌ 資金不足！投資需要 $${amount.toLocaleString()}，` +
                `你只有 $${totalSpendable(state).toLocaleString()} ` +
                `(現金 $${getRegularCash(state).toLocaleString()} + ` +
                `貸款金 $${getLoanCash(state).toLocaleString()})`
        };
    }

    const loanCash     = getLoanCash(state);
    const spentLoan    = Math.min(loanCash, amount);
    const spentRegular = amount - spentLoan;

    state.loanCash = loanCash - spentLoan;
    state.cash     = (state.cash || 0) - spentRegular;

    let msg = '';
    if (spentLoan > 0 && spentRegular > 0) {
        msg = `💰 使用貸款金 $${spentLoan.toLocaleString()} + 現金 $${spentRegular.toLocaleString()}`;
    } else if (spentLoan > 0) {
        msg = `🏦 使用貸款金 $${spentLoan.toLocaleString()}`;
    } else {
        msg = `💵 使用現金 $${spentRegular.toLocaleString()}`;
    }

    return { success: true, spentLoan, spentRegular, message: msg };
}

/**
 * ✅ For NON-INVESTMENT expenses: deduct regular cash only.
 */
function spendForNonInvestment(state, amount) {
    if (amount <= 0) {
        return { success: true, spentRegular: 0, message: '' };
    }

    if (!canAffordNonInvestment(state, amount)) {
        return {
            success:      false,
            spentRegular: 0,
            message: `❌ 現金不足！此項需要 $${amount.toLocaleString()} 現金 ` +
                `(你只有 $${getRegularCash(state).toLocaleString()} 現金，貸款金不可用於此)`
        };
    }

    state.cash -= amount;
    return {
        success:      true,
        spentRegular: amount,
        message:      `💵 現金 -$${amount.toLocaleString()}`
    };
}

function receiveCash(state, amount) {
    if (amount <= 0) return { received: 0 };
    state.cash = (state.cash || 0) + amount;
    return { received: amount };
}

function receiveLoanCash(state, amount) {
    if (amount <= 0) return { received: 0 };
    state.loanCash = (state.loanCash || 0) + amount;
    return { received: amount };
}

module.exports = {
    getRegularCash,
    getLoanCash,
    totalSpendable,
    canAffordInvestment,
    canAffordNonInvestment,
    spendForInvestment,
    spendForNonInvestment,
    receiveCash,
    receiveLoanCash
};