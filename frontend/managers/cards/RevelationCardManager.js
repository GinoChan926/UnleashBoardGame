"use strict";

import { BaseCardManager }    from './BaseCardManager.js';
import { RevelationTemplate } from './templates/RevelationTemplate.js';

export class RevelationCardManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this._ensureModals();
    }

    // ==================== Type Selection ====================

    showRevelationTypeSelection(cardTypes, canAfford) {
        this._ensureModals();
        this.modalManager.openModal('revelationTypeModal');

        RevelationTemplate.bindTypeButtons(
            cardTypes,
            canAfford,
            // On type selected
            (typeId) => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'revelation_type_choice', cardType: typeId });
                }
                this.modalManager.closeModal('revelationTypeModal');
            },
            // On cancel
            () => {
                this.modalManager.closeModal('revelationTypeModal');
            }
        );
    }

    // ==================== Purchase Modal ====================

    showRevelationPurchaseModal(card, canAfford) {
        this._ensureModals();
        this.modalManager.openModal('revelationPurchaseModal');

        // Set image
        RevelationTemplate.applyCardImage(
            document.getElementById('revelationPurchaseImg'), card
        );

        // Set body
        const body = document.getElementById('revelationPurchaseBody');
        if (body) body.innerHTML = RevelationTemplate.buildCardBody(
            card, this.ui.escapeHtml.bind(this.ui)
        );

        // Bind buttons
        RevelationTemplate.bindPurchaseButtons(
            canAfford,
            // On confirm
            () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'purchase_revelation_card' });
                }
                this.modalManager.closeModal('revelationPurchaseModal');
            },
            // On cancel
            () => {
                this.modalManager.closeModal('revelationPurchaseModal');
                this.ui.addLog('已放棄購買察覺卡', 'warning');
            }
        );
    }

    // ==================== Effect Modal ====================

    showRevelationEffectModal(card) {
        this._ensureModals();
        this.modalManager.openModal('revelationEffectModal');

        // Set image
        RevelationTemplate.applyCardImage(
            document.getElementById('revelationEffectImg'), card
        );

        // Set body
        const body = document.getElementById('revelationEffectBody');
        if (body) body.innerHTML = RevelationTemplate.buildCardBody(
            card, this.ui.escapeHtml.bind(this.ui)
        );

        // Bind buttons
        RevelationTemplate.bindEffectButtons(
            // On confirm execute
            () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'execute_revelation_card', execute: true });
                }
                this.modalManager.closeModal('revelationEffectModal');
            },
            // On decline
            () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'execute_revelation_card', execute: false });
                }
                this.modalManager.closeModal('revelationEffectModal');
            }
        );
    }

    // ==================== Private ====================

    _ensureModals() {
        if (!document.getElementById('revelationTypeModal')) {
            this.modalManager.createModal('revelationTypeModal',
                RevelationTemplate.buildTypeModal());
        }
        if (!document.getElementById('revelationPurchaseModal')) {
            this.modalManager.createModal('revelationPurchaseModal',
                RevelationTemplate.buildPurchaseModal());
        }
        if (!document.getElementById('revelationEffectModal')) {
            this.modalManager.createModal('revelationEffectModal',
                RevelationTemplate.buildEffectModal());
        }
    }
}