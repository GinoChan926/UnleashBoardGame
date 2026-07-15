"use strict";

export class FinanceHandler {
    constructor(client) {
        this.client = client;
    }

    handleLoanApproved(message) {
        this._applyMyState(message);
        this.client.logManager.addLog(`🏦 貸款批准: ${message.message}`, 'success');
    }

    handleLoanRepaid(message) {
        this._applyMyState(message);
        this.client.logManager.addLog('💰 貸款已償還', 'success');
    }

    handleLoanRejected(message) {
        this.client.logManager.addLog(`❌ 貸款被拒: ${message.reason}`, 'error');
    }

    handleForcedRepayment(message) {
        this._applyMyState(message);
        this.client.logManager.addLog(`⚠️ 強制還款: ${message.message}`, 'warning');
    }

    handleSettlementReminder(message) {
        this.client.logManager.addLog(`📅 ${message.message}`, 'info');
    }

    handleSettlement(message) {
        const { client } = this;

        // Apply state update if for me
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        const isMe        = message.playerId === client.playerId;
        const playerLabel = isMe ? '你' : (message.playerName || '玩家');
        const income      = (message.totalIncome  || 0).toLocaleString();
        const expense     = (message.totalExpense || 0).toLocaleString();
        const reduction   = message.expenseReductionMessage || '';
        const teaFee      = message.teaRestaurantMessage    || '';   // ← NEW
        const exactHint   = message.isExactLanding ? '（正好踩中，額外一次擲骰）' : '';

        // Build log message
        let logMsg = `🏁 ${playerLabel} 結算日：收入 ${income} 元，支出 ${expense} 元${reduction}${exactHint}`;
        if (teaFee) logMsg += ` | ${teaFee}`;

        client.logManager.addLog(logMsg, 'event');

        // Show notification only for own settlement
        if (isMe) {
            let notifMsg = `💰 結算日！收入 ${income} 元，支出 ${expense} 元${reduction}`;
            if (teaFee) notifMsg += `\n${teaFee}`;
            client.logManager.showNotification(notifMsg, 'success');
        }
    }
    // ── Private ───────────────────────────────────────────────────────────

    _applyMyState(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }
}