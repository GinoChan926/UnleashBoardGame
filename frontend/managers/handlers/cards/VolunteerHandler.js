"use strict";

export class VolunteerHandler {
    constructor(client) {
        this.client = client;
    }

    // ✅ Always use volunteerCardModal, not cardModal
    get _modal() {
        return this.client.volunteerCardModal;
    }

    handleVolunteerCardExecute(message) {
        if (!message.card) return;
        this._modal.showVolunteerCardModal(
            message.card,
            message.effectMessage || ''
        );
    }

    handleVolunteerCardDraw(message) {
        if (!message.card) return;
        this._modal.showVolunteerDonationModal(message.card);
    }

    handleVolunteerCardChoice(message) {
        if (!message.card) return;
        this._modal.showVolunteerChoiceModal(message.card);
    }

    handleVolunteerDonationPrompt(message) {
        // ✅ This now correctly calls VolunteerCardManager method
        this._modal.showVolunteerDonationPromptModal(message);
    }
}