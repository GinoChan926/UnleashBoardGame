"use strict";

export class HardshipHandler {
    constructor(client) {
        this.client = client;
    }

    // ==================== Card execute ====================

    async handleHardshipCardExecute(message) {
        const { client } = this;
        const { CardRevealTemplate } = await import('../../cards/templates/CardRevealTemplate.js');

        // Apply state
        this._applyState(message);

        // Log
        client.logManager.addLog(
            `🎭 ${message.effectMessage || message.message || '逆境自強卡'}`,
            'error'
        );

        // ✅ Always show modal - don't depend on message.card existing
        const old = document.getElementById('cardRevealModal');
        if (old) old.remove();

        const modalHtml = CardRevealTemplate.buildModal({
            title:        '🎭 逆境自強卡',
            subtitle:     '人生總有起伏，勇敢面對逆境',
            primaryColor: '#f44336',
            accentColor:  '#ffcdd2',
            confirmText:  '💪 接受命運',
            hint:         '💡 這張卡片的效果已經生效，點擊繼續遊戲'
        });

        client.modalManager.createModal('cardRevealModal', modalHtml);
        client.modalManager.openModal('cardRevealModal');

        // Build display card - works with or without message.card
        const displayCard = message.card
            ? {
                ...message.card,
                description: message.effectMessage || message.message || message.card.description
            }
            : {
                name:        '逆境自強卡',
                description: message.effectMessage || message.message || '逆境自強卡效果',
                image:       null
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

    // ==================== Shield blocked ====================

    async handleHardshipCardShielded(message) {
        const { client } = this;
        const { CardRevealTemplate } = await import('../../cards/templates/CardRevealTemplate.js');

        this._applyState(message);

        client.logManager.addLog(`🛡️ ${message.shieldMessage}`, 'success');
        client.logManager.showNotification(message.shieldMessage, 'success');

        // Show shield modal using template
        const old = document.getElementById('hardshipShieldModal');
        if (old) old.remove();

        const modalHtml = CardRevealTemplate.buildModal({
            title:        '🛡️ 家族辦公室 - 抵擋成功！',
            subtitle:     '你的專業團隊成功抵擋了逆境卡',
            primaryColor: '#4fc3f7',
            accentColor:  '#b3e5fc',
            confirmText:  '太好了！',
            hint:         `🛡️ 剩餘抵擋機會: ${message.remainingShield} 次`
        });

        client.modalManager.createModal('hardshipShieldModal', modalHtml);
        client.modalManager.openModal('hardshipShieldModal');

        if (message.card) {
            const displayCard = {
                ...message.card,
                description: `❌ 已被抵擋 - 效果無效\n\n原本效果: ${message.card.description || ''}`
            };
            CardRevealTemplate.populate(
                displayCard,
                null,
                client.escapeHtml.bind(client)
            );
        }

        CardRevealTemplate.bindConfirm(() => {
            client.modalManager.closeModal('hardshipShieldModal');
        });

        // Auto-close after 30 seconds
        setTimeout(() => {
            client.modalManager.closeModal('hardshipShieldModal');
        }, 30000);
    }

    // ==================== Choice cards (S19 etc) ====================

    async handleHardshipChoicePrompt(message) {
        const { client } = this;
        const { CardRevealTemplate } = await import('../../cards/templates/CardRevealTemplate.js');

        const old = document.getElementById('hardshipChoiceModal');
        if (old) old.remove();

        const modalHtml = CardRevealTemplate.buildChoiceModal(
            message.cardName,
            message.baseEffect,
            message.choices,
            client.escapeHtml.bind(client)
        );

        client.modalManager.createModal('hardshipChoiceModal', modalHtml);
        client.modalManager.openModal('hardshipChoiceModal');

        setTimeout(() => {
            CardRevealTemplate.bindChoiceButtons((choice) => {
                client.connection.send({
                    type: 'hardship_choice',
                    choice
                });
                client.modalManager.closeModal('hardshipChoiceModal');
            });
        }, 100);
    }

    handleHardshipChoiceResult(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(message.message, 'success');
        client.logManager.showNotification(message.message, 'success');
    }

    // ==================== Private ====================

    _applyState(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }
}