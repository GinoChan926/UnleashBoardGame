"use strict";

export class PortfolioHandler {
    constructor(client) {
        this.client = client;
    }

    async handlePortfolioSnapshot(message) {
        const { client } = this;
        const { PortfolioTemplate } = await import('../../cards/templates/PortfolioTemplate.js');

        const old = document.getElementById('portfolioModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'portfolioModal',
            PortfolioTemplate.buildModal()
        );

        client.modalManager.openModal('portfolioModal');

        PortfolioTemplate.populate(
            message,
            client.escapeHtml.bind(client),
            () => client.modalManager.closeModal('portfolioModal')
        );
    }
}