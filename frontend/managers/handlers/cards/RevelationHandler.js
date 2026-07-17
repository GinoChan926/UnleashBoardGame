"use strict";

export class RevelationHandler {
    constructor(client) {
        this.client = client;
    }

    handleRevelationTypeSelection(message) {
        this.client.cardModal.showRevelationTypeSelection(
            message.cardTypes || [],
            message.canAfford || false
        );
    }

    handleRevelationCardDraw(message) {
        if (message.card) {
            this.client.cardModal.showRevelationPurchaseModal(message.card, message.canAfford);
        }
    }

    handleRevelationCardPurchased(message) {
        const { client } = this;

        // ✅ Apply the state update (cash was deducted)
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        if (message.card) {
            client.cardModal.showRevelationEffectModal(message.card);
        }
    }

    // ==================== Personal card ====================

    async handlePersonalCardPrompt(message) {
        const { client } = this;
        const { PersonalCardTemplate } = await import('../../cards/templates/PersonalCardTemplate.js');

        const old = document.getElementById('personalCardModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'personalCardModal',
            PersonalCardTemplate.buildModal()
        );

        client.modalManager.openModal('personalCardModal');
        PersonalCardTemplate.populate(message.card, client.escapeHtml.bind(client));

        PersonalCardTemplate.bindButtons(
            () => {
                client.connection.send({
                    type: 'personal_card_response',
                    execute: true
                });
                client.modalManager.closeModal('personalCardModal');
            },
            () => {
                client.connection.send({
                    type: 'personal_card_response',
                    execute: false
                });
                client.modalManager.closeModal('personalCardModal');
                client.logManager.addLog('📜 放棄執行個人錦囊', 'warning');
            }
        );
    }

    handlePersonalCardResult(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        const logType = message.executed ? 'success' : 'warning';
        client.logManager.addLog(message.message, logType);
        if (message.executed) {
            client.logManager.showNotification(message.message, 'success');
        }
    }

    // ==================== Team card ====================

    async handleTeamCardPrompt(message) {
        const { client } = this;
        const { TeamCardTemplate } = await import('../../cards/templates/TeamCardTemplate.js');

        const old = document.getElementById('teamCardModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'teamCardModal',
            TeamCardTemplate.buildModal()
        );

        client.modalManager.openModal('teamCardModal');
        TeamCardTemplate.populate(message, client.escapeHtml.bind(client));

        const timerId = TeamCardTemplate.startCountdown(
            message.timeout || 30,
            () => {
                TeamCardTemplate.disableButtons();
                client.modalManager.closeModal('teamCardModal');
            }
        );

        TeamCardTemplate.bindButtons(
            () => {
                if (timerId) clearInterval(timerId);
                TeamCardTemplate.disableButtons();
                client.connection.send({
                    type: 'team_card_response',
                    teamId: message.teamId,
                    participate: true
                });
                client.modalManager.closeModal('teamCardModal');
                client.logManager.addLog(`👥 你選擇參與「${message.card.name}」`, 'success');
            },
            () => {
                if (timerId) clearInterval(timerId);
                TeamCardTemplate.disableButtons();
                client.connection.send({
                    type: 'team_card_response',
                    teamId: message.teamId,
                    participate: false
                });
                client.modalManager.closeModal('teamCardModal');
                client.logManager.addLog(`👥 你選擇不參與「${message.card.name}」`, 'warning');
            }
        );
    }

    handleTeamCardResult(message) {
        const { client } = this;
        client.logManager.addLog(message.message, 'event');
        client.logManager.showNotification(
            `👥 團隊錦囊「${message.card.name}」完成！`,
            'success'
        );
    }
    async handleAssetChoicePrompt(message) {
        const { client } = this;
        const { AssetChoiceTemplate } = await import('../../cards/templates/AssetChoiceTemplate.js');

        const old = document.getElementById('assetChoiceModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'assetChoiceModal',
            AssetChoiceTemplate.buildModal()
        );

        client.modalManager.openModal('assetChoiceModal');
        AssetChoiceTemplate.populate(message, client.escapeHtml.bind(client));

        const timerId = AssetChoiceTemplate.startCountdown(
            message.timeout || 30,
            () => {
                AssetChoiceTemplate.disableButtons();
                client.modalManager.closeModal('assetChoiceModal');
            }
        );

        AssetChoiceTemplate.bindButtons(
            () => {
                if (timerId) clearInterval(timerId);
                AssetChoiceTemplate.disableButtons();
                client.connection.send({
                    type: 'asset_choice_response',
                    choiceId: message.choiceId,
                    participate: true
                });
                client.modalManager.closeModal('assetChoiceModal');
                client.logManager.addLog(`📊 你選擇參與「${message.card.name}」`, 'success');
            },
            () => {
                if (timerId) clearInterval(timerId);
                AssetChoiceTemplate.disableButtons();
                client.connection.send({
                    type: 'asset_choice_response',
                    choiceId: message.choiceId,
                    participate: false
                });
                client.modalManager.closeModal('assetChoiceModal');
                client.logManager.addLog(`📊 你選擇不參與「${message.card.name}」`, 'warning');
            }
        );
    }

    handleMarketNewsResult(message) {
        const { client } = this;
        client.logManager.addLog(
            `📰 ${message.initiator} 觸發「${message.cardName}」: ${message.message}`,
            'event'
        );
        client.logManager.showNotification(
            `📰 ${message.cardName} 完成`,
            'info'
        );
    }
}