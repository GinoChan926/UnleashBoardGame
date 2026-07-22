"use strict";

export class LierHandler {
    constructor(client) {
        this.client = client;
    }

    async handleLierCardAutoExecute(message) {
        const { client } = this;

        this._applyState(message);

        client.logManager.addLog(
            `🎭 ${message.message || '騙子卡自動執行'}`,
            'warning'
        );

        if (message.card) {
            const { CardRevealTemplate } = await import('../../cards/templates/CardRevealTemplate.js');

            const old = document.getElementById('cardRevealModal');
            if (old) old.remove();

            const modalHtml = CardRevealTemplate.buildModal({
                title:        '🎭 騙子卡',
                subtitle:     '小心！可能是騙局或詐騙',
                primaryColor: '#dc143c',
                accentColor:  '#f8bbd0',
                confirmText:  '😱 認命接受',
                hint:         '💡 這張卡片的效果已經生效，點擊繼續遊戲'
            });

            client.modalManager.createModal('cardRevealModal', modalHtml);
            client.modalManager.openModal('cardRevealModal');

            // ✅ Use effectMessage as the description
            const displayCard = {
                ...message.card,
                description: message.effectMessage || message.message || message.card.description
            };

            CardRevealTemplate.populate(
                displayCard,
                null,
                client.escapeHtml.bind(client)
            );

            CardRevealTemplate.bindConfirm(() => {
                client.modalManager.closeModal('cardRevealModal');
            });
        }
    }

    async handleLierCardDraw(message) {
        const { client } = this;

        if (message.card) {
            const { CardRevealTemplate } = await import('../../cards/templates/CardRevealTemplate.js');

            const old = document.getElementById('cardRevealModal');
            if (old) old.remove();

            const modalHtml = CardRevealTemplate.buildModal({
                title:        '🎭 騙子卡',
                subtitle:     '小心！可能是騙局或詐騙',
                primaryColor: '#dc143c',
                accentColor:  '#f8bbd0',
                confirmText:  '😱 認命接受',
                hint:         '💡 這張卡片的效果將在你點擊後生效'
            });

            client.modalManager.createModal('cardRevealModal', modalHtml);
            client.modalManager.openModal('cardRevealModal');

            CardRevealTemplate.populate(
                message.card,
                message.effectMessage || '騙子卡',
                client.escapeHtml.bind(client)
            );

            CardRevealTemplate.bindConfirm(() => {
                client.modalManager.closeModal('cardRevealModal');
                // If server needs an explicit "execute" trigger, send it here
                client.connection.send({ type: 'execute_lier_card' });
            });
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