"use strict";

export class EnergyTradeHandler {
    constructor(client) {
        this.client = client;
    }

    // ==================== Seller sets price ====================

    async handleEnergyTradePricePrompt(message) {
        const { client } = this;
        const { EnergyTradeTemplate } = await import('../../cards/templates/EnergyTradeTemplate.js');

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
            client.logManager.addLog(
                `💚 已開價 $${price.toLocaleString()} 出售 ${message.energyAmount} 精力`,
                'event'
            );
        });
    }

    handleEnergyTradeStartedSeller(message) {
        const { client } = this;
        client.logManager.addLog(message.message, 'event');
        client.logManager.showNotification(message.message, 'info');
    }

    // ==================== Buyer sees offer ====================

    async handleEnergyTradeOffer(message) {
        const { client } = this;
        const { EnergyTradeTemplate } = await import('../../cards/templates/EnergyTradeTemplate.js');

        if (!document.getElementById('energyOfferModal')) {
            client.modalManager.createModal(
                'energyOfferModal',
                EnergyTradeTemplate.buildOfferModal()
            );
        }

        client.modalManager.openModal('energyOfferModal');
        EnergyTradeTemplate.populateOffer(message);

        const timerId = EnergyTradeTemplate.startCountdown(
            message.timeout || 30,
            () => client.modalManager.closeModal('energyOfferModal')
        );

        EnergyTradeTemplate.bindOfferButtons(
            () => {
                if (timerId) clearInterval(timerId);
                EnergyTradeTemplate.disableButtons();
                client.connection.send({
                    type: 'energy_trade_buy',
                    tradeId: message.tradeId
                });
                client.modalManager.closeModal('energyOfferModal');
            },
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

    // ==================== Trade results ====================

    handleEnergyTradeSold(message) {
        this._applyStateWithLog(message, `💰 ${message.message}`, 'success');
    }

    handleEnergyTradeBought(message) {
        this._applyStateWithLog(message, `💚 ${message.message}`, 'success');
    }

    handleEnergyTradeExpired(message) {
        this._applyStateWithLog(message, `💚 ${message.message}`, 'info');
    }

    handleEnergyTradeClosed(message) {
        const modal = document.getElementById('energyOfferModal');
        if (modal && modal.classList.contains('show')) {
            this.client.modalManager.closeModal('energyOfferModal');
        }
        this.client.logManager.addLog(message.message, 'info');
    }

    // ==================== Seller decides self-buy or cancel ====================

    async handleEnergyTradeSellerDecide(message) {
        const { client } = this;
        const { EnergyTradeTemplate } = await import('../../cards/templates/EnergyTradeTemplate.js');

        const old = document.getElementById('sellerDecideModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'sellerDecideModal',
            EnergyTradeTemplate.buildSellerDecideModal()
        );

        client.modalManager.openModal('sellerDecideModal');
        EnergyTradeTemplate.populateSellerDecide(message);

        EnergyTradeTemplate.bindSellerDecideButtons(
            () => {
                client.connection.send({
                    type: 'energy_trade_seller_decide',
                    tradeId: message.tradeId,
                    willBuy: true
                });
                client.modalManager.closeModal('sellerDecideModal');
            },
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
        this._applyStateWithLog(message, `💚 ${message.message}`, 'success');
    }

    handleEnergyTradeCancelled(message) {
        this._applyStateWithLog(message, `💚 ${message.message}`, 'info');
    }

    // ==================== Private ====================

    _applyStateWithLog(message, logMsg, logType) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(logMsg, logType);
        if (logType === 'success' || logType === 'info') {
            client.logManager.showNotification(message.message, logType);
        }
    }
}