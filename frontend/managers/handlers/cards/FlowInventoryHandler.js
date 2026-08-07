"use strict";

export class FlowInventoryHandler {
    constructor(client) {
        this.client = client;
    }

    async handleFlowInventorySnapshot(message) {
        const { client } = this;
        const { FlowInventoryTemplate } = await import(
            '../../cards/templates/FlowInventoryTemplate.js'
            );

        const old = document.getElementById('flowInventoryModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'flowInventoryModal',
            FlowInventoryTemplate.buildModal()
        );
        client.modalManager.openModal('flowInventoryModal');

        FlowInventoryTemplate.populate(
            message,
            client.escapeHtml.bind(client),
            () => client.modalManager.closeModal('flowInventoryModal')
        );
    }
}