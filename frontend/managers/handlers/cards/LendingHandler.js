"use strict";

export class LendingHandler {
    constructor(client) {
        this.client = client;
    }

    async handleLendingSummary(message) {
        const { client } = this;
        const { LendingTemplate } = await import('../../cards/templates/LendingTemplate.js');

        const old = document.getElementById('lendingModal');
        if (old) old.remove();

        client.modalManager.createModal('lendingModal', LendingTemplate.buildModal());
        client.modalManager.openModal('lendingModal');

        LendingTemplate.populate(
            message,
            client.escapeHtml.bind(client),
            {
                onLend: (targetPlayerId, amount, note, interestRate) => {
                    client.connection.send({
                        type: 'lend_money',
                        targetPlayerId, amount, note, interestRate
                    });
                    setTimeout(() => {
                        client.connection.send({ type: 'get_lending_summary' });
                    }, 500);
                },
                onRepay: (debtId, amount) => {
                    client.connection.send({
                        type: 'repay_debt',
                        debtId, amount
                    });
                    setTimeout(() => {
                        client.connection.send({ type: 'get_lending_summary' });
                    }, 500);
                },
                // ✅ NEW: bank debt repay callback
                onPayBankDebt: (debtId, amount) => {
                    client.connection.send({
                        type: 'pay_bank_debt',
                        debtId, amount
                    });
                    setTimeout(() => {
                        client.connection.send({ type: 'get_lending_summary' });
                    }, 500);
                },
                onClose: () => {
                    client.modalManager.closeModal('lendingModal');
                }
            }
        );
    }

    handleLendingSuccess(message) {
        this._applyAndLog(message, 'success');
    }

    handleLendingReceived(message) {
        this._applyAndLog(message, 'success');
    }

    handleRepaySuccess(message) {
        this._applyAndLog(message, 'success');
    }

    handleRepayReceived(message) {
        this._applyAndLog(message, 'success');
    }

    // ✅ NEW
    handleBankDebtRepaySuccess(message) {
        this._applyAndLog(message, 'success');
    }

    _applyAndLog(message, type) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(message.message, type);
        client.logManager.showNotification(message.message, type);
    }
}