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
        if (message.card) {
            this.client.cardModal.showRevelationEffectModal(message.card);
        }
    }
}