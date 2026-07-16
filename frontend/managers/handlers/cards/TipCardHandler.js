"use strict";

export class TipCardHandler {
    constructor(client) {
        this.client = client;
    }

    // ==================== Tip card pick (draw N, pick M) ====================

    async handleTipCardPickPrompt(message) {
        const { client } = this;
        const { TipCardPickTemplate } = await import('../../cards/templates/TipCardPickTemplate.js');

        if (!document.getElementById('tipCardPickModal')) {
            client.modalManager.createModal(
                'tipCardPickModal',
                TipCardPickTemplate.buildPickModal()
            );
        }

        client.modalManager.openModal('tipCardPickModal');

        const msgEl = document.getElementById('tipCardMessage');
        if (msgEl) msgEl.textContent = message.message || '請選擇錦囊卡';

        TipCardPickTemplate.updateProgress(message.pickCount);

        const container = document.getElementById('tipCardGrid');
        TipCardPickTemplate.populateGrid(
            container,
            message.availableCards,
            client.escapeHtml.bind(client),
            (cardIndex) => {
                client.connection.send({ type: 'tip_card_pick', cardIndex });
            }
        );

        TipCardPickTemplate.bindCancel(() => {
            client.connection.send({ type: 'tip_card_cancel' });
            client.modalManager.closeModal('tipCardPickModal');
            client.logManager.addLog('🎁 已放棄錦囊卡選取', 'warning');
        });
    }

    handleTipCardTaken(message) {
        const { client } = this;
        client.logManager.addLog(
            `🎁 你選了「${message.card.name}」！${message.effectMessage}`,
            'success'
        );
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }

    handleTipCardDrawEnd(message) {
        const { client } = this;
        client.modalManager.closeModal('tipCardPickModal');
        client.logManager.addLog(message.message, 'event');
        client.logManager.showNotification(message.message, 'success');
    }

    // ==================== Auto tip draw (C17 - see-and-next) ====================

    async handleAutoTipCardShow(message) {
        const { client } = this;
        const { AutoTipCardTemplate } = await import('../../cards/templates/AutoTipCardTemplate.js');

        if (!document.getElementById('autoTipCardModal')) {
            client.modalManager.createModal(
                'autoTipCardModal',
                AutoTipCardTemplate.buildModal()
            );
        }

        client.modalManager.openModal('autoTipCardModal');

        AutoTipCardTemplate.showCard(
            message.card,
            message.cardIndex,
            message.totalCards,
            client.escapeHtml.bind(client)
        );

        AutoTipCardTemplate.enableButton();
        AutoTipCardTemplate.bindNextButton(() => {
            AutoTipCardTemplate.disableButton();
            client.connection.send({ type: 'auto_tip_draw_next' });
        });

        client.logManager.addLog(
            `🎁 錦囊卡 ${message.cardIndex}/${message.totalCards}: ${message.card.name}`,
            'event'
        );
    }

    async handleAutoTipCardExecuted(message) {
        const { client } = this;
        const { AutoTipCardTemplate } = await import('../../cards/templates/AutoTipCardTemplate.js');

        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        AutoTipCardTemplate.showResult(
            message.effectMessage,
            message.cardIndex,
            message.totalCards,
            client.escapeHtml.bind(client)
        );

        client.logManager.addLog(
            `✨ 錦囊卡 (${message.cardIndex}/${message.totalCards}) 「${message.card.name}」: ${message.effectMessage}`,
            'success'
        );
    }

    handleAutoTipDrawEnd(message) {
        const { client } = this;
        client.modalManager.closeModal('autoTipCardModal');
        client.logManager.addLog(message.message, 'event');
        client.logManager.showNotification(message.message, 'success');
    }
}