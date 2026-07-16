"use strict";

export class PropertyHandler {
    constructor(client) {
        this.client = client;
    }

    async handlePropertyChoicePrompt(message) {
        const { client } = this;
        const { PropertyChoiceTemplate } = await import('../../cards/templates/PropertyChoiceTemplate.js');

        const old = document.getElementById('propertyChoiceModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'propertyChoiceModal',
            PropertyChoiceTemplate.buildModal()
        );

        client.modalManager.openModal('propertyChoiceModal');
        PropertyChoiceTemplate.populate(message);

        PropertyChoiceTemplate.bindButtons(
            () => {
                client.connection.send({ type: 'property_choice', choice: 'self_use' });
                client.modalManager.closeModal('propertyChoiceModal');
            },
            () => {
                client.connection.send({ type: 'property_choice', choice: 'rent_out' });
                client.modalManager.closeModal('propertyChoiceModal');
            },
            () => {
                client.connection.send({ type: 'property_choice', choice: 'skip' });
                client.modalManager.closeModal('propertyChoiceModal');
            }
        );

        client.logManager.addLog(`🏠 房產選擇：${message.card.name}`, 'event');
    }

    handlePropertyChoiceResult(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        const logType = message.choice === 'skip' ? 'warning' : 'success';
        client.logManager.addLog(message.message, logType);

        if (message.choice !== 'skip') {
            client.logManager.showNotification(message.message, 'success');
        }
    }

    async handlePropertyList(message) {
        const { client } = this;
        const { PropertyPanelTemplate } = await import('../../cards/templates/PropertyPanelTemplate.js');

        const old = document.getElementById('propertyPanelModal');
        if (old) old.remove();

        client.modalManager.createModal(
            'propertyPanelModal',
            PropertyPanelTemplate.buildModal()
        );

        client.modalManager.openModal('propertyPanelModal');
        PropertyPanelTemplate.populate(message.properties, message.currentCash);

        PropertyPanelTemplate.bindPayoffButtons((instanceId) => {
            client.connection.send({
                type: 'property_early_payoff',
                instanceId
            });
        });

        PropertyPanelTemplate.bindClose(() => {
            client.modalManager.closeModal('propertyPanelModal');
        });
    }

    handlePropertyPaidOff(message) {
        const { client } = this;
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        client.logManager.addLog(message.message, 'success');
        client.logManager.showNotification(message.message, 'success');

        const modal = document.getElementById('propertyPanelModal');
        if (modal && modal.classList.contains('show')) {
            client.connection.send({ type: 'get_property_list' });
        }
    }
}