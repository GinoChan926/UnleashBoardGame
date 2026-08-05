"use strict";

import { BaseCardManager }   from './BaseCardManager.js';
import { VolunteerTemplate } from './templates/VolunteerTemplate.js';

export class VolunteerCardManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this._ensureModals();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    _send(obj) {
        const conn = this.ws;
        if (conn && conn.isReady()) {
            conn.send(obj);
        } else {
            console.error('❌ WebSocket not ready:', obj);
        }
    }

    _escape(str) {
        return this.gameClient.escapeHtml(str);
    }

    _log(msg, type = 'info') {
        this.gameClient.logManager.addLog(msg, type);
    }

    // ==================== Basic Volunteer Card ====================

    showVolunteerCardModal(card, effectMessage) {
        this._ensureModals();
        this.modalManager.openModal('volunteerCardModal');

        VolunteerTemplate.applyCardImage(
            document.getElementById('volunteerCardImg'), card
        );

        const body = document.getElementById('volunteerCardBody');
        if (body) body.innerHTML = VolunteerTemplate.buildCardBody(
            card, effectMessage, this._escape.bind(this)
        );

        const effectSpan = document.getElementById('volunteerCardEffect');
        if (effectSpan) {
            effectSpan.innerHTML = `📌 ${this._escape(effectMessage || '')}`;
        }

        VolunteerTemplate.bindCardButtons(
            () => this.modalManager.closeModal('volunteerCardModal')
        );
    }

    // ==================== Donation Modal (INITIATOR) ====================

    showVolunteerDonationModal(card) {
        this._ensureModals();

        // ✅ All DOM manipulation delegated to template
        VolunteerTemplate.setModalTitle('volunteerDonationModal', `🤝 ${card.name}`);
        VolunteerTemplate.setImageVisible(document.getElementById('donationCardImg'), true);
        VolunteerTemplate.applyCardImage(document.getElementById('donationCardImg'), card);
        VolunteerTemplate.setDonationButtonLabels('✅ 執行義工', '❌ 取消');

        const body = document.getElementById('donationModalBody');
        if (body) body.innerHTML = VolunteerTemplate.buildDonationBody(
            card, this._escape.bind(this)
        );

        this.modalManager.openModal('volunteerDonationModal');

        const self = this;
        VolunteerTemplate.bindDonationButtons(
            () => {
                self._send({ type: 'volunteer_card_confirm' });
                self.modalManager.closeModal('volunteerDonationModal');
            },
            () => {
                self.modalManager.closeModal('volunteerDonationModal');
                self._log('已取消執行義工卡', 'warning');
            }
        );
    }

    // ==================== Donation Prompt Modal (OTHER players) ====================

    showVolunteerDonationPromptModal(message) {
        this._ensureModals();

        const donationType = message.donationType || 'cash';
        const unit         = donationType === 'energy' ? '精力' : '元';
        const imgEl        = document.getElementById('donationCardImg');
        const canAfford    = message.canAfford !== false;

        VolunteerTemplate.setModalTitle(
            'volunteerDonationModal',
            `🤝 ${message.cardName || '義工捐款'}`
        );
        VolunteerTemplate.setImageVisible(imgEl, false);
        VolunteerTemplate.setDonationButtonLabels('✅ 願意捐贈', '❌ 不捐贈');

        // ✅ Disable confirm button if player can't afford
        const confirmBtn = document.getElementById('confirmDonationBtn');
        if (confirmBtn) {
            confirmBtn.disabled = !canAfford;
            confirmBtn.style.opacity = canAfford ? '1' : '0.4';
            confirmBtn.style.cursor  = canAfford ? 'pointer' : 'not-allowed';
        }

        const body = document.getElementById('donationModalBody');
        if (body) body.innerHTML = VolunteerTemplate.buildDonationPromptBody(
            message, this._escape.bind(this)
        );

        this.modalManager.openModal('volunteerDonationModal');

        const self   = this;
        const cardId = message.cardId;

        VolunteerTemplate.bindDonationButtons(
            // Willing to donate
            () => {
                // ✅ Double-check affordability
                if (!canAfford) {
                    self._log(`❌ 你的${unit}不足，無法捐贈`, 'error');
                    return;
                }
                self._send({
                    type: 'volunteer_donation_response',
                    cardId,
                    willDonate: true
                });
                VolunteerTemplate.setImageVisible(imgEl, true);
                self.modalManager.closeModal('volunteerDonationModal');
                self._log(`🤝 你同意捐贈 ${message.donationAmount} ${unit}`, 'success');
            },
            // Decline
            () => {
                self._send({
                    type: 'volunteer_donation_response',
                    cardId,
                    willDonate: false
                });
                VolunteerTemplate.setImageVisible(imgEl, true);
                self.modalManager.closeModal('volunteerDonationModal');
                self._log('🤝 你選擇不捐贈', 'info');
            }
        );
    }

    // ==================== Choice Modal ====================

    showVolunteerChoiceModal(card) {
        this._ensureModals();
        this.modalManager.openModal('volunteerChoiceModal');

        VolunteerTemplate.applyCardImage(
            document.getElementById('choiceCardImg'), card
        );

        const body = document.getElementById('choiceModalBody');
        if (body) body.innerHTML = VolunteerTemplate.buildChoiceBody(
            card, this._escape.bind(this)
        );

        const self = this;
        VolunteerTemplate.bindChoiceButtons(
            (choice) => {
                self._send({
                    type: 'volunteer_card_choice_confirm',
                    choice
                });
                self.modalManager.closeModal('volunteerChoiceModal');
            },
            () => {
                self.modalManager.closeModal('volunteerChoiceModal');
                self._log('已取消選擇', 'warning');
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