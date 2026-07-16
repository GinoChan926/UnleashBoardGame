"use strict";

export class LierHandler {
    constructor(client) {
        this.client = client;
    }

    handleLierCardAutoExecute(message) {
        const { client } = this;
        client.logManager.addLog(`🎭 ${message.message || '騙子卡自動執行'}`, 'warning');
        client.logManager.showNotification(message.message || '騙子卡觸發', 'warning');
        this._applyState(message);
    }

    handleLierCardDraw(message) {
        if (message.card) {
            this.client.cardModal.showLierCardModal(
                message.card,
                message.effectMessage || '騙子卡'
            );
        }
    }

    handleLierCardResult(message) {
        const { client } = this;
        client.logManager.addLog(`🎭 ${message.message || '騙子卡結果'}`, 'warning');
        this._applyState(message);
    }

    _applyState(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }
}