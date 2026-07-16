"use strict";

export class SocialFlowHandler {
    constructor(client) {
        this.client = client;
    }

    handleFlowLayerChoice(message) {
        this.client.cardModal.showFlowLayerChoiceModal(message);
    }

    handleSocialServicePrompt(message) {
        this.client.cardModal.showSocialServiceModal(message);
    }
}