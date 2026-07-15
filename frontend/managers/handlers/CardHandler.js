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
        const { AIStoreTemplate } = await import('../cards/templates/AIStoreTemplate.js');

        // Remove old modal if exists
        const old = document.getElementById('aiStorePickModal');
        if (old) old.remove();

        // Create modal
        client.modalManager.createModal('aiStorePickModal', AIStoreTemplate.buildPickModal());
        client.modalManager.openModal('aiStorePickModal');

        // Set message
        const msgEl = document.getElementById('aiStoreMessage');
        if (msgEl) msgEl.textContent = message.message || '請選 1 張卡';

        // Populate grid
        const container = document.getElementById('aiStoreCards');
        AIStoreTemplate.populateGrid(
            container,
            message.availableCards,
            client.escapeHtml.bind(client),
            (cardIndex) => {
                client.connection.send({
                    type:      'ai_store_pick',
                    cardIndex: cardIndex
                });
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

    async handleTipCardPickPrompt(message) {
        const { client } = this;
        const { TipCardPickTemplate } = await import('../cards/templates/TipCardPickTemplate.js');

        // Ensure modal exists
        if (!document.getElementById('tipCardPickModal')) {
            client.modalManager.createModal(
                'tipCardPickModal',
                TipCardPickTemplate.buildPickModal()
            );
        }

        client.modalManager.openModal('tipCardPickModal');

        // Set header message
        const msgEl = document.getElementById('tipCardMessage');
        if (msgEl) msgEl.textContent = message.message || '請選擇錦囊卡';

        // Set progress
        TipCardPickTemplate.updateProgress(message.pickCount);

        // Populate grid
        const container = document.getElementById('tipCardGrid');
        TipCardPickTemplate.populateGrid(
            container,
            message.availableCards,
            client.escapeHtml.bind(client),
            (cardIndex) => {
                client.connection.send({
                    type:      'tip_card_pick',
                    cardIndex: cardIndex
                });
                // Do NOT close modal - server will send new prompt if more picks needed
            }
        );

        // Bind cancel
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

    handleHardshipCardShielded(message) {
        const { client } = this;

        // Update state
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        // Show notification and log
        client.logManager.addLog(
            `🛡️ ${message.shieldMessage}`,
            'success'
        );

        client.logManager.showNotification(
            message.shieldMessage,
            'success'
        );

        // Optional: show a small modal to celebrate the block
        this._showShieldBlockedModal(message.card, message.remainingShield);
    }

    _showShieldBlockedModal(card, remainingShield) {
        const { client } = this;

        // Remove old modal if exists
        const old = document.getElementById('hardshipShieldModal');
        if (old) old.remove();

        const cardImage = card.image
            ? (card.image.startsWith('/') || card.image.startsWith('http') ? card.image : '/' + card.image)
            : '';

        const modalHtml = `
        <div class="modal-content" style="max-width: 450px;
             background: linear-gradient(135deg, #1a3a5c, #0d2b47);
             border-radius: 24px; padding: 24px;
             border: 2px solid #4fc3f7; text-align: center;">

            <div class="modal-title" style="color: #4fc3f7; font-size: 22px;
                 margin-bottom: 14px;">
                🛡️ 家族辦公室 - 抵擋成功！
            </div>

            <div style="background: rgba(79,195,247,0.15); padding: 14px;
                        border-radius: 12px; margin-bottom: 16px;">
                <div style="color: #b3e5fc; font-size: 14px; margin-bottom: 10px;">
                    你的家族辦公室專業團隊抵擋了以下逆境卡：
                </div>
                ${cardImage ? `
                    <img src="${cardImage}" alt="${client.escapeHtml(card.name)}"
                         style="max-width: 80%; max-height: 150px;
                                border-radius: 12px; opacity: 0.6;
                                filter: grayscale(50%);
                                border: 2px dashed #ff5252;">
                ` : ''}
                <div style="color: #fff; font-size: 16px; font-weight: bold;
                            margin-top: 10px;">
                    ${client.escapeHtml(card.name)}
                </div>
                <div style="color: #ff5252; font-size: 12px; margin-top: 6px;">
                    ❌ 已被抵擋 - 效果無效
                </div>
            </div>

            <div style="background: rgba(0,0,0,0.3); padding: 10px;
                        border-radius: 10px; margin-bottom: 16px;
                        color: #ffd966; font-size: 13px;">
                🛡️ 剩餘抵擋機會: <strong style="color: #4fc3f7; font-size: 16px;">
                ${remainingShield}</strong> 次
            </div>

            <button id="closeShieldModalBtn"
                    style="background: linear-gradient(135deg, #4fc3f7, #039be5);
                           color: white; padding: 10px 30px; border: none;
                           border-radius: 30px; cursor: pointer; font-size: 15px;
                           transition: all 0.2s ease;
                           box-shadow: 0 4px 12px rgba(79,195,247,0.3);">
                太好了！
            </button>
        </div>
    `;

        client.modalManager.createModal('hardshipShieldModal', modalHtml);
        client.modalManager.openModal('hardshipShieldModal');

        setTimeout(() => {
            const btn = document.getElementById('closeShieldModalBtn');
            if (btn) {
                btn.onclick = () => client.modalManager.closeModal('hardshipShieldModal');
                btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; };
                btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
            }
        }, 100);

        // Auto-close after 5 seconds
        setTimeout(() => {
            client.modalManager.closeModal('hardshipShieldModal');
        }, 30000);
    }

    async handleAutoTipCardShow(message) {
        const { client } = this;
        const { AutoTipCardTemplate } = await import('../cards/templates/AutoTipCardTemplate.js');

        // Ensure modal exists
        if (!document.getElementById('autoTipCardModal')) {
            client.modalManager.createModal(
                'autoTipCardModal',
                AutoTipCardTemplate.buildModal()
            );
        }

        // Show modal
        client.modalManager.openModal('autoTipCardModal');

        // Populate card
        AutoTipCardTemplate.showCard(
            message.card,
            message.cardIndex,
            message.totalCards,
            client.escapeHtml.bind(client)
        );

        // Enable button and bind
        AutoTipCardTemplate.enableButton();
        AutoTipCardTemplate.bindNextButton(() => {
            // Disable immediately to prevent double-click
            AutoTipCardTemplate.disableButton();

            // Send execute request
            client.connection.send({ type: 'auto_tip_draw_next' });
        });

        // Log to panel
        client.logManager.addLog(
            `🎁 錦囊卡 ${message.cardIndex}/${message.totalCards}: ${message.card.name}`,
            'event'
        );
    }

    async handleAutoTipCardExecuted(message) {
        const { client } = this;
        const { AutoTipCardTemplate } = await import('../cards/templates/AutoTipCardTemplate.js');

        // Update state
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        // Show result inside the modal
        AutoTipCardTemplate.showResult(
            message.effectMessage,
            message.cardIndex,
            message.totalCards,
            client.escapeHtml.bind(client)
        );

        // Log to panel
        client.logManager.addLog(
            `✨ 錦囊卡 (${message.cardIndex}/${message.totalCards}) 「${message.card.name}」: ${message.effectMessage}`,
            'success'
        );
    }

    handleAutoTipDrawEnd(message) {
        const { client } = this;

        // Close modal
        client.modalManager.closeModal('autoTipCardModal');

        // Final log and notification
        client.logManager.addLog(message.message, 'event');
        client.logManager.showNotification(message.message, 'success');
    }

    // ==================== Energy Trade (C20) ====================

    async handleEnergyTradePricePrompt(message) {
        const { client } = this;
        const { EnergyTradeTemplate } = await import('../cards/templates/EnergyTradeTemplate.js');

        // Create modal if needed
        if (!document.getElementById('energyPricePromptModal')) {
            client.modalManager.createModal(
                'energyPricePromptModal',
                EnergyTradeTemplate.buildPricePromptModal()
            );
        }

        client.modalManager.openModal('energyPricePromptModal');

        EnergyTradeTemplate.bindPricePrompt(message.energyAmount, (price) => {
            client.connection.send({
                type: 'energy_trade_set_price',
                price,
                energyAmount: message.energyAmount
            });
            client.modalManager.closeModal('energyPricePromptModal');
            client.logManager.addLog(`💚 已開價 $${price.toLocaleString()} 出售 ${message.energyAmount} 精力`, 'event');
        });
    }

    handleEnergyTradeStartedSeller(message) {
        const { client } = this;
        client.logManager.addLog(message.message, 'event');
        client.logManager.showNotification(message.message, 'info');
    }

    async handleEnergyTradeOffer(message) {
        const { client } = this;
        const { EnergyTradeTemplate } = await import('../cards/templates/EnergyTradeTemplate.js');

        // Create modal if needed
        if (!document.getElementById('energyOfferModal')) {
            client.modalManager.createModal(
                'energyOfferModal',
                EnergyTradeTemplate.buildOfferModal()
            );
        }

        client.modalManager.openModal('energyOfferModal');
        EnergyTradeTemplate.populateOffer(message);

        // Start countdown
        const timerId = EnergyTradeTemplate.startCountdown(
            message.timeout || 30,
            () => {
                client.modalManager.closeModal('energyOfferModal');
            }
        );

        // Bind buttons
        EnergyTradeTemplate.bindOfferButtons(
            // On Buy
            () => {
                if (timerId) clearInterval(timerId);
                EnergyTradeTemplate.disableButtons();
                client.connection.send({
                    type: 'energy_trade_buy',
                    tradeId: message.tradeId
                });
                client.modalManager.closeModal('energyOfferModal');
            },
            // On Pass
            () => {
                if (timerId) clearInterval(timerId);
                EnergyTradeTemplate.disableButtons();
                client.connection.send({
                    type: 'energy_trade_pass',
                    tradeId: message.tradeId
                });
                client.modalManager.closeModal('energyOfferModal');
                client.logManager.addLog('💚 已拒絕購買精力', 'warning');
            }
        );

        client.logManager.addLog(message.message, 'event');
    }

    handleEnergyTradeSold(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(`💰 ${message.message}`, 'success');
        client.logManager.showNotification(message.message, 'success');
    }

    handleEnergyTradeBought(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(`💚 ${message.message}`, 'success');
        client.logManager.showNotification(message.message, 'success');
    }

    handleEnergyTradeExpired(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(`💚 ${message.message}`, 'info');
        client.logManager.showNotification(message.message, 'info');
    }

    handleEnergyTradeClosed(message) {
        // Close any open trade offer modals for observers
        const modal = document.getElementById('energyOfferModal');
        if (modal && modal.classList.contains('show')) {
            this.client.modalManager.closeModal('energyOfferModal');
        }
        this.client.logManager.addLog(message.message, 'info');
    }

    async handleEnergyTradeSellerDecide(message) {
        const { client } = this;
        const { EnergyTradeTemplate } = await import('../cards/templates/EnergyTradeTemplate.js');

        // Remove any old modal
        const old = document.getElementById('sellerDecideModal');
        if (old) old.remove();

        // Create fresh modal
        client.modalManager.createModal(
            'sellerDecideModal',
            EnergyTradeTemplate.buildSellerDecideModal()
        );

        client.modalManager.openModal('sellerDecideModal');
        EnergyTradeTemplate.populateSellerDecide(message);

        EnergyTradeTemplate.bindSellerDecideButtons(
            // On Buy
            () => {
                client.connection.send({
                    type: 'energy_trade_seller_decide',
                    tradeId: message.tradeId,
                    willBuy: true
                });
                client.modalManager.closeModal('sellerDecideModal');
            },
            // On Cancel
            () => {
                client.connection.send({
                    type: 'energy_trade_seller_decide',
                    tradeId: message.tradeId,
                    willBuy: false
                });
                client.modalManager.closeModal('sellerDecideModal');
                client.logManager.addLog('💚 已取消精力交易', 'warning');
            }
        );

        client.logManager.addLog(message.message, 'event');
    }

    handleEnergyTradeSelfBought(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(`💚 ${message.message}`, 'success');
        client.logManager.showNotification(message.message, 'success');
    }

    handleEnergyTradeCancelled(message) {
        const { client } = this;
        client.logManager.addLog(`💚 ${message.message}`, 'info');
        client.logManager.showNotification(message.message, 'info');
    }
}