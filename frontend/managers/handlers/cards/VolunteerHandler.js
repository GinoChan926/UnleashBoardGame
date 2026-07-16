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
}