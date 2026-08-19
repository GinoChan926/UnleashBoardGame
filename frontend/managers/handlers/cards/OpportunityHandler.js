"use strict";

export class OpportunityHandler {
    constructor(client) {
        this.client = client;
    }

    handleCardTypeSelection(message) {
        this.client.cardModal.showCardTypeSelection(
            message.cardTypes || [],
            message.canAfford || false
        );
    }

    handleOpportunityCardDraw(message) {
        const { client } = this;
        if (!message.card) return;

        // ✅ Flow-layer investment/dream: skip purchase modal entirely
        // Auto-confirm to get the effect preview, then show single combined modal
        if (message.activationOnly || message.freeReveal || message.card?.activationOnly) {
            // Even if not affordable, still auto-purchase to get effect preview
            // The showEffectConfirm can display "can't afford" state
            client.connection.send({ type: 'purchase_card' });
            return;
        }

        // Regular chance/opportunity card flow (streamline layer) — keep 2-modal flow
        client.cardModal.showPurchaseConfirm(
            message.card,
            message.canAfford,
            message.blockedReasons || []
        );
    }

    handleCardPurchased(message) {
        const { client } = this;

        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        if (message.card && message.effectPreview) {
            // ✅ Pass activationOnly flag through to showEffectConfirm
            client.cardModal.showEffectConfirm(
                message.card,
                message.effectPreview,
                message.activationOnly || false,
                {
                    canAfford:      message.canAfford !== false,    // ✅ NEW
                    blockedReasons: message.blockedReasons || [],   // ✅ NEW
                    tileName:       message.tileName || ''          // ✅ NEW
                }
            );
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
    async handleStockMenu(message) {
        const { client } = this;
        const { StockCryptoMenuTemplate } = await import('../../cards/templates/StockCryptoMenuTemplate.js');

        const old = document.getElementById('stockMenuModal');
        if (old) old.remove();

        client.modalManager.createModal('stockMenuModal', StockCryptoMenuTemplate.buildStockMenu(message));
        client.modalManager.openModal('stockMenuModal');

        StockCryptoMenuTemplate.bindStockButtons(
            message.cardId,
            message.currentPrice,
            message.minShares,
            message.shareMultiple,
            (shares) => {
                client.connection.send({
                    type: 'execute_card',
                    execute: true,
                    stockAction: 'buy',
                    shares: shares
                });
                client.modalManager.closeModal('stockMenuModal');
            },
            (shares) => {
                client.connection.send({
                    type: 'execute_card',
                    execute: true,
                    stockAction: 'sell',
                    shares: shares
                });
                client.modalManager.closeModal('stockMenuModal');
            },
            () => {
                client.connection.send({
                    type: 'execute_card',
                    execute: false
                });
                client.modalManager.closeModal('stockMenuModal');
                client.logManager.addLog('❌ 已取消股票交易', 'warning');
            },
            message.currentCash || 0,       // ✅ cash
            message.holding || null          // ✅ holding info
        );
    }

    async handleCryptoMenu(message) {
        const { client } = this;
        const { StockCryptoMenuTemplate } = await import('../../cards/templates/StockCryptoMenuTemplate.js');

        const old = document.getElementById('cryptoMenuModal');
        if (old) old.remove();

        client.modalManager.createModal('cryptoMenuModal', StockCryptoMenuTemplate.buildCryptoMenu(message));
        client.modalManager.openModal('cryptoMenuModal');

        StockCryptoMenuTemplate.bindCryptoButtons(
            message.cardId,
            message.currentPrice,
            message.minUnits,
            (units) => {
                client.connection.send({
                    type: 'execute_card',
                    execute: true,
                    cryptoAction: 'buy',
                    units: units
                });
                client.modalManager.closeModal('cryptoMenuModal');
            },
            (units) => {
                client.connection.send({
                    type: 'execute_card',
                    execute: true,
                    cryptoAction: 'sell',
                    units: units
                });
                client.modalManager.closeModal('cryptoMenuModal');
            },
            () => {
                client.connection.send({
                    type: 'execute_card',
                    execute: false
                });
                client.modalManager.closeModal('cryptoMenuModal');
                client.logManager.addLog('❌ 已取消加密貨幣交易', 'warning');
            },
            message.currentCash || 0,       // ✅ cash
            message.holding || null          // ✅ holding info
        );
    }

    async handleFoodDeliveryMenu(message) {
        const { client } = this;
        const { FoodDeliveryTemplate } = await import('../../cards/templates/FoodDeliveryTemplate.js');

        const old = document.getElementById('foodDeliveryModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'foodDeliveryModal',
            FoodDeliveryTemplate.buildModal(message)
        );
        client.modalManager.openModal('foodDeliveryModal');

        FoodDeliveryTemplate.bind(
            message,
            // onConfirm — receives { invest, exchange }
            (choice) => {
                client.connection.send({
                    type: 'execute_card',
                    execute: true,
                    userAction: {
                        invest:   choice.invest,
                        exchange: choice.exchange
                    }
                });
                client.modalManager.closeModal('foodDeliveryModal');

                const parts = [];
                if (choice.invest)   parts.push('開店');
                if (choice.exchange) parts.push('兌換精力');
                client.logManager.addLog(
                    `🍜 執行外賣店: ${parts.join(' + ')}`,
                    'success'
                );
            },
            // onCancel
            () => {
                client.connection.send({
                    type: 'execute_card',
                    execute: false
                });
                client.modalManager.closeModal('foodDeliveryModal');
                client.logManager.addLog('❌ 已取消外賣店操作', 'warning');
            }
        );
    }

    async handleGroupInvestmentPrompt(message) {
        const { client } = this;
        const { GroupInvestmentTemplate } = await import('../../cards/templates/GroupInvestmentTemplate.js');

        const old = document.getElementById('groupInvestmentModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'groupInvestmentModal',
            GroupInvestmentTemplate.buildModal()
        );

        client.modalManager.openModal('groupInvestmentModal');
        GroupInvestmentTemplate.populate(message, client.escapeHtml.bind(client));

        const timerId = GroupInvestmentTemplate.startCountdown(
            message.timeout || 60,
            () => {
                GroupInvestmentTemplate.disableSubmit();
                // Auto-submit 0 units on timeout
                client.connection.send({
                    type: 'group_investment_response',
                    groupId: message.groupId,
                    units: 0
                });
                client.modalManager.closeModal('groupInvestmentModal');
                client.logManager.addLog('🏗️ 投資超時，自動放棄', 'warning');
            }
        );

        GroupInvestmentTemplate.bindSubmit(
            message.groupId,
            message.unitPrice,
            message.playerCash,
            message.playerEnergy,
            message.energyCostToJoin,
            message.isInitiator,
            (units) => {
                if (timerId) clearInterval(timerId);
                GroupInvestmentTemplate.disableSubmit();
                client.connection.send({
                    type: 'group_investment_response',
                    groupId: message.groupId,
                    units
                });
                client.modalManager.closeModal('groupInvestmentModal');

                if (units > 0) {
                    client.logManager.addLog(
                        `🏗️ 你投資了 ${units} 份「${message.card.name}」`,
                        'success'
                    );
                } else {
                    client.logManager.addLog('🏗️ 你選擇不參與投資', 'info');
                }
            }
        );

        client.logManager.addLog(message.message, 'event');
    }

    async handleBusinessUnitMenu(message) {
        const { client } = this;
        const { BusinessUnitTemplate } = await import('../../cards/templates/BusinessUnitTemplate.js');

        const old = document.getElementById('businessUnitModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'businessUnitModal',
            BusinessUnitTemplate.buildModal(message)
        );
        client.modalManager.openModal('businessUnitModal');

        BusinessUnitTemplate.bind(
            message,
            // onConfirm — receives units count
            (units) => {
                client.connection.send({
                    type:    'execute_card',
                    execute: true,
                    units
                });
                client.modalManager.closeModal('businessUnitModal');
                client.logManager.addLog(
                    `🏢 購買 ${units} 部「${message.cardName}」`,
                    'success'
                );
            },
            // onCancel
            () => {
                client.connection.send({
                    type:    'execute_card',
                    execute: false
                });
                client.modalManager.closeModal('businessUnitModal');
                client.logManager.addLog(`❌ 已取消購買「${message.cardName}」`, 'warning');
            }
        );
    }

    handleGroupInvestmentResult(message) {
        const { client } = this;
        client.logManager.addLog(message.message, 'event');
        client.logManager.showNotification(
            `🏗️ 投資「${message.cardName}」完成！`,
            'success'
        );
    }
    async handleGroupFinancePrompt(message) {
        const { client } = this;
        const { GroupFinanceTemplate } = await import('../../cards/templates/GroupFinanceTemplate.js');

        const old = document.getElementById('groupFinanceModal');
        if (old) old.remove();

        client.modalManager.createModal('groupFinanceModal', GroupFinanceTemplate.buildModal());
        client.modalManager.openModal('groupFinanceModal');
        GroupFinanceTemplate.populate(message, client.escapeHtml.bind(client));

        const timerId = GroupFinanceTemplate.startCountdown(
            message.timeout || 60,
            () => {
                GroupFinanceTemplate.disableSubmit();
                client.connection.send({
                    type: 'group_finance_response',
                    groupId: message.groupId,
                    units: 0
                });
                client.modalManager.closeModal('groupFinanceModal');
            }
        );

        GroupFinanceTemplate.bindSubmit(message, (units) => {
            if (timerId) clearInterval(timerId);
            GroupFinanceTemplate.disableSubmit();
            client.connection.send({
                type: 'group_finance_response',
                groupId: message.groupId,
                units
            });
            client.modalManager.closeModal('groupFinanceModal');
            client.logManager.addLog(
                units > 0
                    ? `📊 團購 ${units} ${message.unit}「${message.cardName}」`
                    : '📊 不參與團購',
                units > 0 ? 'success' : 'info'
            );
        });
    }

    handleGroupFinanceResult(message) {
        const { client } = this;
        client.logManager.addLog(message.message, 'event');
        client.logManager.showNotification(`📊 團購「${message.cardName}」完成`, 'success');
    }

    async handleFundMenu(message) {
        const { client } = this;
        const { BusinessUnitTemplate } = await import(
            '../../cards/templates/BusinessUnitTemplate.js'
            );

        const old = document.getElementById('fundMenuModal');
        if (old) old.remove();

        const stepSize = message.stepSize || 1;

        const modalMessage = {
            cardId:               message.cardId,
            cardName:             message.cardName,
            cardImage:            '',
            cardDescription:      `每份 $${message.pricePerUnit.toLocaleString()} | 月回報 +$${message.monthlyReturn.toLocaleString()}/份`,
            pricePerUnit:         message.pricePerUnit,
            monthlyReturnPerUnit: message.monthlyReturn,
            energyCostPerUnit:    0,
            minUnits:             message.minUnits || 1,
            maxUnits:             message.maxUnits || 1,
            existingUnits:        0,
            remainingSlots:       message.maxUnits || 999,
            currentCash:          message.currentCash,
            currentEnergy:        999,
            maxEnergy:            999,
            stepSize              // ✅ pass through
        };

        client.modalManager.createModal(
            'fundMenuModal',
            BusinessUnitTemplate.buildModal(modalMessage)
        );
        client.modalManager.openModal('fundMenuModal');

        // ✅ Override the input step attribute for P2P
        const input = document.getElementById('buSelectorInput');
        if (input && stepSize > 1) {
            input.step = stepSize;
            input.min  = message.minUnits || stepSize;
        }

        BusinessUnitTemplate.bind(
            modalMessage,
            (units) => {
                // ✅ Validate step size before sending
                if (stepSize > 1 && units % stepSize !== 0) {
                    alert(`購買數量必須是 ${stepSize} 的倍數`);
                    return;
                }
                client.connection.send({
                    type:    'execute_card',
                    execute: true,
                    units
                });
                client.modalManager.closeModal('fundMenuModal');
                client.logManager.addLog(
                    `📊 購買 ${units} 份「${message.cardName}」`,
                    'success'
                );
            },
            () => {
                client.connection.send({
                    type:    'execute_card',
                    execute: false
                });
                client.modalManager.closeModal('fundMenuModal');
                client.logManager.addLog(`❌ 已取消購買「${message.cardName}」`, 'warning');
            }
        );
    }
}