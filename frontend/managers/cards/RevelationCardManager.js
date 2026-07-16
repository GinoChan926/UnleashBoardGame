"use strict";

import { BaseCardManager }    from './BaseCardManager.js';
import { RevelationTemplate } from './templates/RevelationTemplate.js';
import { CardVisibility } from './templates/CardVisibility.js';

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

        const cardType = card.cardType || card.type;
        const isBlind = CardVisibility.isBlindCard(card);

        // Set image (blind or real)
        const imgEl = document.getElementById('revelationPurchaseImg');
        if (imgEl) {
            if (isBlind) {
                imgEl.src = CardVisibility.getBlindImage(cardType);
                imgEl.style.filter = 'brightness(0.85)';
                imgEl.style.border = '3px dashed #ff9800';
                imgEl.onerror = () => {
                    imgEl.style.display = 'none';
                    const container = imgEl.parentElement;
                    if (container) {
                        container.innerHTML = `
                        <div style="height: 200px; display: flex;
                                    align-items: center; justify-content: center;
                                    background: linear-gradient(135deg, #4a2a1a, #3a1a0a);
                                    border-radius: 16px; border: 3px dashed #ff9800;">
                            <div style="text-align: center; color: white;">
                                <div style="font-size: 60px;">🔒</div>
                                <div style="font-size: 14px; margin-top: 8px;">
                                    ${CardVisibility.getBlindLabel(cardType)}
                                </div>
                            </div>
                        </div>
                    `;
                    }
                };
            } else {
                RevelationTemplate.applyCardImage(imgEl, card);
            }
        }

        // Set body (blind or full)
        const body = document.getElementById('revelationPurchaseBody');
        if (body) {
            if (isBlind) {
                const label = CardVisibility.getBlindLabel(cardType);
                const desc  = CardVisibility.getBlindDescription(cardType);
                body.innerHTML = `
                <div style="text-align: center;">
                    <h3 style="color: #ff9800; margin-bottom: 10px; font-size: 22px;">
                        ${label}
                    </h3>
                    <p style="color: #ffefc0; font-size: 14px; line-height: 1.6;">
                        ${this.ui.escapeHtml(desc)}
                    </p>
                    <div style="background: rgba(255,152,0,0.15); padding: 10px;
                                border-radius: 8px; margin-top: 12px;
                                border: 2px dashed #ff9800;">
                        <span style="color: #ff9800; font-size: 13px;">
                            🔒 內容未揭曉 - 支付 500 元後才能查看詳情
                        </span>
                    </div>
                </div>
            `;
            } else {
                body.innerHTML = RevelationTemplate.buildCardBody(
                    card, this.ui.escapeHtml.bind(this.ui)
                );
            }
        }

        // Bind buttons (unchanged)
        RevelationTemplate.bindPurchaseButtons(
            canAfford,
            () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'purchase_revelation_card' });
                }
                this.modalManager.closeModal('revelationPurchaseModal');
            },
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