"use strict";

import { BaseCardManager }   from './BaseCardManager.js';
import { VolunteerTemplate } from './templates/VolunteerTemplate.js';

export class VolunteerCardManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this._ensureModals();
    }

    // ==================== Basic Volunteer Card ====================

    showVolunteerCardModal(card, effectMessage) {
        this._ensureModals();
        this.modalManager.openModal('volunteerCardModal');

        // Set image
        VolunteerTemplate.applyCardImage(
            document.getElementById('volunteerCardImg'), card
        );

        // Set body
        const body = document.getElementById('volunteerCardBody');
        if (body) body.innerHTML = VolunteerTemplate.buildCardBody(
            card, effectMessage, this.ui.escapeHtml.bind(this.ui)
        );

        // Set effect message
        const effectSpan = document.getElementById('volunteerCardEffect');
        if (effectSpan) {
            effectSpan.innerHTML = `📌 ${this.ui.escapeHtml(effectMessage)}`;
        }

        // Bind buttons
        VolunteerTemplate.bindCardButtons(
            () => this.modalManager.closeModal('volunteerCardModal')
        );
    }

    // ==================== Donation Modal ====================

    showVolunteerDonationModal(card) {
        this._ensureModals();
        this.modalManager.openModal('volunteerDonationModal');

        // Set image
        VolunteerTemplate.applyCardImage(
            document.getElementById('donationCardImg'), card
        );

        // Set body
        const body = document.getElementById('donationModalBody');
        if (body) body.innerHTML = VolunteerTemplate.buildDonationBody(
            card, this.ui.escapeHtml.bind(this.ui)
        );

        // Bind buttons
        VolunteerTemplate.bindDonationButtons(
            // On confirm
            () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'volunteer_card_confirm' });
                }
                this.modalManager.closeModal('volunteerDonationModal');
            },
            // On cancel
            () => {
                this.modalManager.closeModal('volunteerDonationModal');
                this.ui.addLog('已取消執行義工卡', 'warning');
            }
        );
    }

    // ==================== Choice Modal ====================

    showVolunteerChoiceModal(card) {
        this._ensureModals();
        this.modalManager.openModal('volunteerChoiceModal');

        // Set image
        VolunteerTemplate.applyCardImage(
            document.getElementById('choiceCardImg'), card
        );

        // Set body
        const body = document.getElementById('choiceModalBody');
        if (body) body.innerHTML = VolunteerTemplate.buildChoiceBody(
            card, this.ui.escapeHtml.bind(this.ui)
        );

        // Bind buttons
        VolunteerTemplate.bindChoiceButtons(
            // On choice selected
            (choice) => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'volunteer_card_choice_confirm', choice });
                }
                this.modalManager.closeModal('volunteerChoiceModal');
            },
            // On cancel
            () => {
                this.modalManager.closeModal('volunteerChoiceModal');
                this.ui.addLog('已取消選擇', 'warning');
            }
        );
    }

    // ==================== Private ====================

    _ensureModals() {
        if (!document.getElementById('volunteerCardModal')) {
            this.modalManager.createModal('volunteerCardModal',
                VolunteerTemplate.buildCardModal());
        }
        if (!document.getElementById('volunteerDonationModal')) {
            this.modalManager.createModal('volunteerDonationModal',
                VolunteerTemplate.buildDonationModal());
        }
        if (!document.getElementById('volunteerChoiceModal')) {
            this.modalManager.createModal('volunteerChoiceModal',
                VolunteerTemplate.buildChoiceModal());
        }
    }
}