"use strict";

import { AuxiliaryPoliceTemplate } from '../../cards/templates/AuxiliaryPoliceTemplate.js';

export class PoliceHandler {
    constructor(client) {
        this.client = client;
    }

    // ==================== Base police card ====================

    handlePoliceCardExecute(message) {
        const { client } = this;

        // ✅ Modal handles its own log + notification internally
        if (message.card) {
            client.cardModal.showPoliceCardModal(
                message.card,
                message.effectMessage || message.message || '警察卡'
            );
        } else {
            // Fallback if no card object
            client.logManager.addLog(
                `👮 ${message.effectMessage || message.message || '警察卡執行'}`,
                'success'
            );
            client.logManager.showNotification(
                message.effectMessage || message.message || '警察卡觸發',
                'success'
            );
        }

        this._applyState(message);
    }

    // ==================== Auxiliary Police (Z15) ====================

    handleAuxiliaryPoliceChoice(message) {
        const { client } = this;
        const card         = message.card;
        const otherPlayers = message.otherPlayers || [];

        const modalHtml = AuxiliaryPoliceTemplate.build(
            card, otherPlayers, client.escapeHtml.bind(client)
        );

        const oldModal = document.getElementById('auxPoliceModal');
        if (oldModal) oldModal.remove();

        client.modalManager.createModal('auxPoliceModal', modalHtml);
        client.modalManager.openModal('auxPoliceModal');

        setTimeout(() => {
            AuxiliaryPoliceTemplate.bindEvents(
                () => {
                    client.connection.send({ type: 'auxiliary_police_choice', choice: 'self' });
                    client.modalManager.closeModal('auxPoliceModal');
                    client.logManager.addLog('👮 選擇自己使用警察卡', 'success');
                },
                (playerId, playerName) => {
                    client.connection.send({
                        type: 'auxiliary_police_choice',
                        choice: 'give',
                        targetPlayerId: playerId
                    });
                    client.modalManager.closeModal('auxPoliceModal');
                    client.logManager.addLog(`👮 將警察卡強制給予 ${playerName}`, 'event');
                }
            );
        }, 100);
    }

    // ==================== P05 - Move other player ====================

    async handlePoliceMovePrompt(message) {
        const { client } = this;
        const { PoliceMoveTemplate } = await import('../../cards/templates/PoliceMoveTemplate.js');

        const old = document.getElementById('policeMoveModal');
        if (old) old.remove();

        client.modalManager.createModal('policeMoveModal', PoliceMoveTemplate.buildModal());
        client.modalManager.openModal('policeMoveModal');
        PoliceMoveTemplate.populate(message, client.escapeHtml.bind(client));

        let selectedPlayerId   = null;
        let selectedPlayerName = null;

        PoliceMoveTemplate.bindPlayerSelect((playerId, playerName) => {
            selectedPlayerId   = playerId;
            selectedPlayerName = playerName;
            PoliceMoveTemplate.showDirectionButtons(playerName, (direction) => {
                client.connection.send({
                    type: 'police_move_target',
                    targetPlayerId: selectedPlayerId,
                    direction
                });
                client.modalManager.closeModal('policeMoveModal');
                client.logManager.addLog(
                    `👮 你選擇${direction === 'forward' ? '向前' : '向後'}移動 ${playerName} 3 格`,
                    'event'
                );
            });
        });

        PoliceMoveTemplate.bindCancel(() => {
            client.modalManager.closeModal('policeMoveModal');
            client.logManager.addLog('👮 已取消警察卡效果', 'warning');
        });
    }

    handlePoliceMoveExecuted(message) {
        const { client } = this;
        client.logManager.addLog(message.message, 'success');
        client.logManager.showNotification(message.message, 'success');
    }

    handlePoliceMoveReceived(message) {
        const { client } = this;
        this._applyState(message);
        client.logManager.addLog(message.message, 'warning');
        client.logManager.showNotification(message.message, 'warning');
    }

    // ==================== P06 - Fine other player ====================

    async handlePoliceFinePrompt(message) {
        const { client } = this;
        const { PoliceFineTemplate } = await import('../../cards/templates/PoliceFineTemplate.js');

        const old = document.getElementById('policeFineModal');
        if (old) old.remove();

        client.modalManager.createModal('policeFineModal', PoliceFineTemplate.buildModal());
        client.modalManager.openModal('policeFineModal');
        PoliceFineTemplate.populate(message, client.escapeHtml.bind(client));

        PoliceFineTemplate.bindPlayerSelect((playerId, playerName) => {
            client.connection.send({
                type: 'police_fine_target',
                targetPlayerId: playerId
            });
            client.modalManager.closeModal('policeFineModal');
            client.logManager.addLog(`👮 你舉報了 ${playerName}`, 'event');
        });

        PoliceFineTemplate.bindCancel(() => {
            client.modalManager.closeModal('policeFineModal');
            client.logManager.addLog('👮 已取消舉報', 'warning');
        });
    }

    handlePoliceFineExecuted(message) {
        const { client } = this;
        this._applyState(message);
        client.logManager.addLog(message.message, 'success');
        client.logManager.showNotification(message.message, 'success');
    }

    handlePoliceFineReceived(message) {
        const { client } = this;
        this._applyState(message);
        client.logManager.addLog(message.message, 'error');
        client.logManager.showNotification(message.message, 'error');
    }

    // ==================== P08 - Good citizen ====================

    async handleGoodCitizenChoicePrompt(message) {
        const { client } = this;
        const { GoodCitizenTemplate } = await import('../../cards/templates/GoodCitizenTemplate.js');

        const old = document.getElementById('goodCitizenModal');
        if (old) old.remove();

        client.modalManager.createModal('goodCitizenModal', GoodCitizenTemplate.buildModal());
        client.modalManager.openModal('goodCitizenModal');

        GoodCitizenTemplate.bindButtons(
            () => {
                client.connection.send({ type: 'good_citizen_choice', choice: 'volunteer' });
                client.modalManager.closeModal('goodCitizenModal');
                client.logManager.addLog('🏆 選擇獲得 2 次義工資格', 'success');
            },
            () => {
                client.connection.send({ type: 'good_citizen_choice', choice: 'tip_card' });
                client.modalManager.closeModal('goodCitizenModal');
                client.logManager.addLog('🏆 選擇抽取 1 張錦囊卡', 'event');
            }
        );

        client.logManager.addLog(message.message, 'event');
    }

    handleGoodCitizenResult(message) {
        const { client } = this;
        this._applyState(message);
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