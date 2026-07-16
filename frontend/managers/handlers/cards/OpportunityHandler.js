"use strict";

export class OpportunityHandler {
    constructor(client) {
        this.client = client;
    }

    handleCardTypeSelection(message) {
        this.client.cardModal.showCardTypeSelection(
            message.cardTypes || [],
            message.canAfford || false
        );
    }

    handleOpportunityCardDraw(message) {
        if (message.card) {
            this.client.cardModal.showPurchaseConfirm(message.card, message.canAfford);
        }
    }

    handleCardPurchased(message) {
        if (message.card && message.effectPreview) {
            this.client.cardModal.showEffectConfirm(message.card, message.effectPreview);
        }
    }

    handleCardDecisionResult(message) {
        const { client } = this;
        const logType = message.execute ? 'success' : 'warning';
        const prefix  = message.execute ? '✅' : '⚠️';
        client.logManager.addLog(`${prefix} ${message.message}`, logType);

        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }

    handleCardExecuted(message) {
        const { client } = this;
        client.logManager.addLog(`✨ ${message.message || '卡片執行成功'}`, 'success');
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }

    handleCardSkipped(message) {
        this.client.logManager.addLog(`⏭️ ${message.message || '已跳過卡片'}`, 'warning');
    }

    handlePurchaseFailed(message) {
        this.client.logManager.addLog(`❌ ${message.message}`, 'error');
    }
}