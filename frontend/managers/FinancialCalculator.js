export class FinancialCalculator {
    static calculateMonthlyCashFlow(gameState) {
        if (!gameState) return 0;

        const rawTotalExp = gameState.livingExpense + gameState.tax + gameState.loanInterest + (gameState.childExpense || 0);
        let totalExp = rawTotalExp;

        const expenseReductionPercent = gameState.expenseReduction || 0;
        if (expenseReductionPercent > 0) {
            const savedAmount = Math.floor(rawTotalExp * expenseReductionPercent / 100);
            totalExp = rawTotalExp - savedAmount;
        }

        let effectivePassiveIncome = gameState.passiveIncome;
        if (gameState.inFlow && gameState.flowPassiveIncome) {
            effectivePassiveIncome = gameState.flowPassiveIncome;
        }

        return (gameState.salary + gameState.sideIncome + effectivePassiveIncome) - totalExp;
    }

    static getExpenseReductionInfo(gameState) {
        const rawTotalExp = gameState.livingExpense + gameState.tax + gameState.loanInterest + (gameState.childExpense || 0);
        const percent = gameState.expenseReduction || 0;

        if (percent > 0) {
            const savedAmount = Math.floor(rawTotalExp * percent / 100);
            const totalExp = rawTotalExp - savedAmount;
            return { rawTotalExp, totalExp, savedAmount, percent, message: ` (已減免 ${percent}%)` };
        }

        return { rawTotalExp, totalExp: rawTotalExp, savedAmount: 0, percent: 0, message: '' };
    }

    static getEffectivePassiveIncome(gameState) {
        if (gameState.inFlow && gameState.flowPassiveIncome) {
            return gameState.flowPassiveIncome;
        }
        return gameState.passiveIncome;
    }

    static getTotalLoanRepay(gameState) {
        return gameState.loanAmount + Math.round(gameState.loanAmount * 0.1);
    }

    static getLayerText(gameState) {
        if (gameState.inFlow) return '顺流层';
        if (gameState.inReverse) return '逆流层';
        return '平流层';
    }

    static canAfford(cash, cost) {
        return cash >= cost;
    }

    static calculateMaxUnits(cash, pricePerUnit) {
        return Math.floor(cash / pricePerUnit);
    }

    static formatCurrency(amount) {
        return amount.toLocaleString();
    }

    static formatCashFlow(amount) {
        return (amount >= 0 ? '+' : '') + amount.toLocaleString();
    }
}