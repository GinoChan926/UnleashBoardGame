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
        if (message.card) {
            this.client.cardModal.showPurchaseConfirm(message.card, message.canAfford);
        }
    }

    handleCardPurchased(message) {
        const { client } = this;

        // ✅ Apply state update
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        if (message.card && message.effectPreview) {
            client.cardModal.showEffectConfirm(message.card, message.effectPreview);
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
}