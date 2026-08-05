"use strict";

export class HardshipHandler {
    constructor(client) {
        this.client = client;
    }

    // ==================== Card execute ====================

    async handleHardshipCardExecute(message) {
        const { client } = this;
        const { CardRevealTemplate } = await import('../../cards/templates/CardRevealTemplate.js');

        this._applyState(message);

        client.logManager.addLog(
            `🎭 ${message.effectMessage || message.message || '逆境自強卡'}`,
            'error'
        );

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

    // ==================== Reverse tile reveal ====================
    // ✅ NEW — separate handler for non-hardship reverse tiles (awareness, miracle, etc)

    async handleReverseTileReveal(message) {
        const { client } = this;
        const { CardRevealTemplate } = await import('../../cards/templates/CardRevealTemplate.js');

        this._applyState(message);

        const card = message.card || {};
        const themeMap = {
            awareness: {
                title:        '🧘 覺察卡',
                subtitle:     '在逆境中覺察自我，提升精力',
                primaryColor: '#ff9800',
                accentColor:  '#ffe0b2',
                confirmText:  '✨ 繼續',
                hint:         '💡 精力已恢復，繼續遊戲'
            },
            miracle: {
                title:        '🌟 奇蹟',
                subtitle:     '奇蹟降臨！你脫離了逆流層',
                primaryColor: '#4caf50',
                accentColor:  '#c8e6c9',
                confirmText:  '🎉 太好了！',
                hint:         '💡 你回到了平流層，繼續遊戲'
            },
            hardship: {
                title:        `🌀 ${card.cardTypeName || '逆流事件'}`,
                subtitle:     '逆流層的挑戰',
                primaryColor: '#f44336',
                accentColor:  '#ffcdd2',
                confirmText:  '💪 接受命運',
                hint:         '💡 這張卡片的效果已經生效'
            }
        };

        const theme = themeMap[card.cardType] || themeMap.hardship;

        client.logManager.addLog(
            `${card.cardTypeIcon || '🌀'} ${message.effectMessage || card.name}`,
            card.cardType === 'miracle' || card.cardType === 'awareness' ? 'success' : 'error'
        );

        const old = document.getElementById('cardRevealModal');
        if (old) old.remove();

        const modalHtml = CardRevealTemplate.buildModal(theme);
        client.modalManager.createModal('cardRevealModal', modalHtml);
        client.modalManager.openModal('cardRevealModal');

        const displayCard = {
            ...card,
            description: message.effectMessage || card.description
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