"use strict";

export class VolunteerHandler {
    constructor(client) {
        this.client = client;
    }

    handleVolunteerCardExecute(message) {
        if (message.card) {
            this.client.cardModal.showVolunteerCardModal(
                message.card,
                message.effectMessage || ''
            );
        }
    }

    handleVolunteerCardDraw(message) {
        if (message.card) {
            this.client.cardModal.showVolunteerDonationModal(message.card);
        }
    }

    handleVolunteerCardChoice(message) {
        if (message.card) {
            this.client.cardModal.showVolunteerChoiceModal(message.card);
        }
    }
    handleVolunteerDonationPrompt(message) {
        const { client } = this;

        const donationType = message.donationType || 'cash';
        const unit = donationType === 'energy' ? '精力' : '元';
        const confirmText = `確認捐贈 ${message.donationAmount} ${unit}`;

        // Use a simple confirm approach via CardRevealTemplate
        const userChoice = confirm(
            `${message.message}\n\n` +
            `捐贈者將獲得幸運值 +1 獎勵！\n\n` +
            `你是否願意捐贈？`
        );

        client.connection.send({
            type: 'volunteer_donation_response',
            cardId: message.cardId,
            willDonate: userChoice
        });

        if (userChoice) {
            client.logManager.addLog(`🤝 你同意捐贈 ${message.donationAmount} ${unit}`, 'success');
        } else {
            client.logManager.addLog(`🤝 你選擇不捐贈`, 'info');
        }
    }
}