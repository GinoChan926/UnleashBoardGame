"use strict";

export class MarketHandler {
    constructor(client) {
        this.client = client;
    }

    showMarketNewsChoices(message) {
        // Delegate to the revelation card manager which handles market news UI
        const { client } = this;
        client.logManager.addLog(`📰 ${message.message || '市場消息'}`, 'event');
        // TODO: wire up dedicated market news UI when server sends this
    }

    showPropertySellChoices(message) {
        const { client } = this;
        const { playersToAsk, cardId, cardName } = message;

        const mine = playersToAsk
            ? playersToAsk.find(p => p.playerName === client.gameState?.playerName)
            : null;

        if (!mine) {
            client.logManager.addLog(
                `🏠 ${cardName}：你沒有持有香港中西區住宅物業`, 'info'
            );
            client.connection.send({
                type: 'market_news_response',
                playerChoices: {},
                cardId
            });
            return;
        }

        const userChoice = confirm(`🏠 ${cardName}\n市場正在求購...\n\n確定出售？`);
        client.connection.send({
            type: 'market_news_response',
            playerChoices: { [client.gameState.playerName]: userChoice },
            cardId
        });
    }

    handleMarketNewsResult(message) {
        const { client } = this;
        client.logManager.addLog(`📰 ${message.message || '市場消息結果'}`, 'event');
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }

    handleAuctionStart(message) {
        this.client.cardModal.showAuctionModal(message);
    }

    handleAuctionUpdate(message) {
        this.client.cardModal.auction.updateAuctionModal(message);
    }

    handleAuctionEnd(message) {
        this.client.cardModal.auction.handleAuctionEnd(message);
        if (message.gameState && message.playerId === this.client.playerId) {
            this.client.gameState = message.gameState;
            this.client.updateUI();
        }
    }
}