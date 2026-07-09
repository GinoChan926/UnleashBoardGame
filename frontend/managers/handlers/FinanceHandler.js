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
        this._applyMyState(message);
        this.client.logManager.addLog(`🏁 結算日: ${message.message}`, 'event');
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