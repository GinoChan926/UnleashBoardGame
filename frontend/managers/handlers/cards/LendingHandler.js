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

        client.modalManager.createModal(
            'lendingModal',
            LendingTemplate.buildModal()
        );

        client.modalManager.openModal('lendingModal');

        LendingTemplate.populate(
            message,
            client.escapeHtml.bind(client),
            {
                onLend: (targetPlayerId, amount, note) => {
                    client.connection.send({
                        type: 'lend_money',
                        targetPlayerId,
                        amount,
                        note
                    });
                    // Refresh after transaction
                    setTimeout(() => {
                        client.connection.send({ type: 'get_lending_summary' });
                    }, 500);
                },
                onRepay: (debtId, amount) => {
                    client.connection.send({
                        type: 'repay_debt',
                        debtId,
                        amount
                    });
                    // Refresh after transaction
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
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(`💸 ${message.message}`, 'success');
        client.logManager.showNotification(message.message, 'success');
    }

    handleLendingReceived(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(`💰 ${message.message}`, 'success');
        client.logManager.showNotification(message.message, 'success');
    }

    handleRepaySuccess(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(message.message, 'success');
        client.logManager.showNotification(message.message, 'success');
    }

    handleRepayReceived(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(message.message, 'success');
        client.logManager.showNotification(message.message, 'success');
    }
}