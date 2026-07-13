"use strict";

import { AuxiliaryPoliceTemplate } from '../cards/templates/AuxiliaryPoliceTemplate.js';

export class CardHandler {
    constructor(client) {
        this.client = client;
    }

    // ── Opportunity cards ─────────────────────────────────────────────────

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

    // ── Revelation cards ──────────────────────────────────────────────────

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
        if (message.card) {
            this.client.cardModal.showRevelationEffectModal(message.card);
        }
    }

    // ── Volunteer cards ───────────────────────────────────────────────────

    handleVolunteerCardExecute(message) {
        if (message.card) {
            this.client.cardModal.showVolunteerCardModal(
                message.card,
                message.effectMessage || ''
            );
        }
    }

    handleVolunteerCardDraw(message) {
        if (message.card) {
            this.client.cardModal.showVolunteerDonationModal(message.card);
        }
    }

    handleVolunteerCardChoice(message) {
        if (message.card) {
            this.client.cardModal.showVolunteerChoiceModal(message.card);
        }
    }

    // ── Special cards (lier / police / hardship) ──────────────────────────

    handleLierCardAutoExecute(message) {
        const { client } = this;
        client.logManager.addLog(`🎭 ${message.message || '騙子卡自動執行'}`, 'warning');
        client.logManager.showNotification(message.message || '騙子卡觸發', 'warning');
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
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
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }

    handlePoliceCardExecute(message) {
        const { client } = this;
        client.logManager.addLog(`👮 ${message.message || '警察卡執行'}`, 'success');
        client.logManager.showNotification(message.message || '警察卡觸發', 'success');
        if (message.card) {
            client.cardModal.showPoliceCardModal(
                message.card,
                message.effectMessage || message.message || '警察卡'
            );
        }
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }

    handleHardshipCardExecute(message) {
        const { client } = this;
        client.logManager.addLog(`🎭 ${message.message || '逆境自強卡'}`, 'error');
        client.logManager.showNotification(message.message || '逆境自強卡觸發', 'error');
        if (message.card) {
            client.cardModal.showHardshipCardModal(
                message.card,
                message.effectMessage || message.message || '逆境自強卡'
            );
        }
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }

    // ── Flow / social ─────────────────────────────────────────────────────

    handleFlowLayerChoice(message) {
        this.client.cardModal.showFlowLayerChoiceModal(message);
    }

    handleSocialServicePrompt(message) {
        this.client.cardModal.showSocialServiceModal(message);
    }

    // ── Part-time ─────────────────────────────────────────────────────
    handleAuxiliaryPoliceChoice(message) {
        const { client } = this;

        const card         = message.card;
        const otherPlayers = message.otherPlayers || [];

        // ── Build and show modal ──────────────────────────────────────────
        const modalHtml = AuxiliaryPoliceTemplate.build(
            card,
            otherPlayers,
            client.escapeHtml.bind(client)
        );

        // Remove old modal if exists
        const oldModal = document.getElementById('auxPoliceModal');
        if (oldModal) oldModal.remove();

        client.modalManager.createModal('auxPoliceModal', modalHtml);
        client.modalManager.openModal('auxPoliceModal');

        // ── Bind events (logic only, no HTML) ─────────────────────────────
        setTimeout(() => {
            AuxiliaryPoliceTemplate.bindEvents(
                // On self use
                () => {
                    client.connection.send({
                        type: 'auxiliary_police_choice',
                        choice: 'self'
                    });
                    client.modalManager.closeModal('auxPoliceModal');
                    client.logManager.addLog('👮 選擇自己使用警察卡', 'success');
                },

                // On give to other player
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
}