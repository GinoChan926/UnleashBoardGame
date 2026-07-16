"use strict";

export class AIStoreHandler {
    constructor(client) {
        this.client = client;
    }

    handleAIStoreDrawStart(message) {
        this.client.logManager.addLog(
            `🏪 ${message.initiator} 開設 AI無人便利店，將抽 ${message.totalCards} 張卡分配給 ${message.players.length} 位玩家！`,
            'event'
        );
        this.client.logManager.showNotification(
            `🏪 抽卡順序: ${message.players.join(' → ')}`, 'info'
        );
    }

    async handleAIStorePickPrompt(message) {
        const { client } = this;
        const { AIStoreTemplate } = await import('../../cards/templates/AIStoreTemplate.js');

        const old = document.getElementById('aiStorePickModal');
        if (old) old.remove();

        client.modalManager.createModal('aiStorePickModal', AIStoreTemplate.buildPickModal());
        client.modalManager.openModal('aiStorePickModal');

        const msgEl = document.getElementById('aiStoreMessage');
        if (msgEl) msgEl.textContent = message.message || '請選 1 張卡';

        const container = document.getElementById('aiStoreCards');
        AIStoreTemplate.populateGrid(
            container,
            message.availableCards,
            client.escapeHtml.bind(client),
            (cardIndex) => {
                client.connection.send({ type: 'ai_store_pick', cardIndex });
                client.modalManager.closeModal('aiStorePickModal');
            }
        );
    }

    handleAIStoreCardTaken(message) {
        const { client } = this;
        client.logManager.addLog(
            `🏪 你抽到了「${message.card.name}」！${message.effectMessage}`,
            'success'
        );
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }

    handleAIStoreDrawEnd(message) {
        this.client.logManager.addLog(message.message, 'event');
        this.client.logManager.showNotification(message.message, 'success');
    }
}