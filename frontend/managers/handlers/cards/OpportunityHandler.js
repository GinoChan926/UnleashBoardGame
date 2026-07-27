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

        // ✅ Flow-layer investment: skip purchase modal, auto-confirm for free
        if (message.activationOnly || message.freeReveal || message.card?.activationOnly) {
            client.connection.send({ type: 'purchase_card' });
            return;
        }

        client.cardModal.showPurchaseConfirm(message.card, message.canAfford);
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
                message.activationOnly || false
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
            // On buy
            (shares) => {
                client.connection.send({
                    type: 'execute_card',
                    execute: true,
                    stockAction: 'buy',
                    shares: shares
                });
                client.modalManager.closeModal('stockMenuModal');
            },
            // On sell
            (shares) => {
                client.connection.send({
                    type: 'execute_card',
                    execute: true,
                    stockAction: 'sell',
                    shares: shares
                });
                client.modalManager.closeModal('stockMenuModal');
            },
            // On cancel
            () => {
                client.connection.send({
                    type: 'execute_card',
                    execute: false
                });
                client.modalManager.closeModal('stockMenuModal');
                client.logManager.addLog('❌ 已取消股票交易', 'warning');
            }
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
            }
        );
    }

    async handleFoodDeliveryMenu(message) {
        const { client } = this;
        const { StockCryptoMenuTemplate } = await import('../../cards/templates/StockCryptoMenuTemplate.js');

        const old = document.getElementById('foodDeliveryModal');
        if (old) old.remove();

        client.modalManager.createModal('foodDeliveryModal', StockCryptoMenuTemplate.buildFoodDeliveryMenu(message));
        client.modalManager.openModal('foodDeliveryModal');

        StockCryptoMenuTemplate.bindFoodDeliveryButtons(
            () => {
                client.connection.send({
                    type: 'execute_card',
                    execute: true,
                    userAction: 'invest'
                });
                client.modalManager.closeModal('foodDeliveryModal');
            },
            () => {
                const units = parseInt(prompt(`要兌換幾次精力？(每次 $${message.exchangeCost} = ${message.exchangeEnergy} 精力)`, '1'));
                if (units && units > 0) {
                    client.connection.send({
                        type: 'execute_card',
                        execute: true,
                        userAction: 'exchange',
                        units: units
                    });
                    client.modalManager.closeModal('foodDeliveryModal');
                }
            },
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
}