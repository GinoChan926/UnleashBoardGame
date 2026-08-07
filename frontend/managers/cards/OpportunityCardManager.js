"use strict";

import { BaseCardManager }         from './BaseCardManager.js';
import { OpportunityCardTemplate } from './templates/OpportunityCardTemplate.js';

export class OpportunityCardManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this._ensureModals();
    }

    // ==================== Card Type Selection ====================

    showCardTypeSelection(cardTypes, canAfford) {
        this._ensureModals();
        this.modalManager.openModal('cardTypeModal');

        const container = document.getElementById('cardTypeButtons');

        OpportunityCardTemplate.bindCardTypeButtons(
            container,
            cardTypes,
            canAfford,
            // On type selected
            (typeId) => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'card_type_choice', cardType: typeId });
                }
                this.modalManager.closeModal('cardTypeModal');
            },
            // On cancel
            () => {
                this.modalManager.closeModal('cardTypeModal');
                this.ui.addLog('已取消選擇機會卡', 'warning');
            }
        );
    }

    // ==================== Purchase Confirm ====================

    showPurchaseConfirm(card, canAfford, blockedReasons = []) {
        this._ensureModals();
        this.modalManager.openModal('purchaseConfirmModal');

        // Set title
        const titleEl = document.querySelector('#purchaseConfirmModal .modal-title');
        if (titleEl) titleEl.textContent = OpportunityCardTemplate.buildPurchaseTitle(card.cardType);

        // Set type badge
        OpportunityCardTemplate.applyTypeBadge(
            document.getElementById('purchaseCardTypeSpan'), card
        );

        // Set body
        const body = document.getElementById('purchaseModalBody');
        if (body) body.innerHTML = OpportunityCardTemplate.buildPurchaseBody(
            card, this.ui.escapeHtml.bind(this.ui)
        );

        // Set image
        OpportunityCardTemplate.applyPurchaseCardImage(
            document.getElementById('purchaseCardImg'), card
        );

        // Set purchase cost
        const multiplier = this.gameState?.cardCostMultiplier || 1;
        OpportunityCardTemplate.updatePurchaseCost(multiplier, canAfford);

        // ✅ Show blocked reasons if any
        this._showBlockedReasons(blockedReasons, canAfford);

        // ✅ Bind buttons — different behavior for blocked
        if (!canAfford && blockedReasons.length > 0) {
            // Dream tile (or similar) — player can view but not buy
            OpportunityCardTemplate.bindPurchaseButtons(
                false,   // disable purchase button
                null,    // no purchase callback
                () => {
                    this.modalManager.closeModal('purchaseConfirmModal');
                    this.ui.addLog(`👀 觀看了「${card.name}」，但條件不足`, 'info');
                }
            );
        } else {
            OpportunityCardTemplate.bindPurchaseButtons(
                canAfford,
                () => {
                    if (this.ws && this.ws.isReady()) {
                        this.ws.send({ type: 'purchase_card' });
                    }
                    this.modalManager.closeModal('purchaseConfirmModal');
                },
                () => {
                    this.modalManager.closeModal('purchaseConfirmModal');
                    this.ui.addLog('已放棄購買', 'warning');
                }
            );
        }
    }

    _showBlockedReasons(reasons, canAfford) {
        // Find or create the reasons container
        let reasonsEl = document.getElementById('purchaseBlockedReasons');

        if (!canAfford && reasons.length > 0) {
            if (!reasonsEl) {
                reasonsEl = document.createElement('div');
                reasonsEl.id = 'purchaseBlockedReasons';
                reasonsEl.style.cssText = `
                background: rgba(244,67,54,0.15);
                border: 1px solid rgba(244,67,54,0.4);
                border-radius: 10px;
                padding: 12px;
                margin: 12px 0;
                text-align: left;
                color: #ff8a80;
                font-size: 13px;
            `;

                const body = document.getElementById('purchaseModalBody');
                if (body) body.parentNode.insertBefore(reasonsEl, body.nextSibling);
            }

            reasonsEl.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 6px; color: #ffcdd2;">
                ⚠️ 你目前無法購買此卡：
            </div>
            ${reasons.map(r => `<div style="margin: 4px 0; padding-left: 12px;">${r}</div>`).join('')}
            <div style="margin-top: 8px; font-size: 11px; color: #ffab91;">
                💡 但你可以先觀看，等條件足夠再觸發
            </div>
        `;
            reasonsEl.style.display = 'block';
        } else if (reasonsEl) {
            reasonsEl.style.display = 'none';
        }
    }

    // ==================== Effect Confirm ====================

    showEffectConfirm(card, effectPreview, activationOnly = false) {
        // Finance cards with units use prompt() flow
        if (card.type === 'finance' && card.pricePerUnit && card.monthlyReturn > 0 && card.id !== 'F06') {
            this._handleFinanceCardUnits(card);
            return;
        }
        if (card.id === 'F05' && card.type === 'finance' && card.pricePerUnit) {
            this._handleP2PCardUnits(card);
            return;
        }
        this._showStandardEffectConfirm(card, effectPreview, activationOnly);
    }

    // ==================== Private ====================

    _showStandardEffectConfirm(card, effectPreview, activationOnly = false) {
        this._ensureModals(activationOnly);
        this.modalManager.openModal('effectConfirmModal');

        // Set type badge
        OpportunityCardTemplate.applyTypeBadge(
            document.getElementById('effectCardTypeSpan'), card
        );

        // Set body
        const body = document.getElementById('effectModalBody');
        if (body) body.innerHTML = OpportunityCardTemplate.buildEffectBody(
            card, this.ui.escapeHtml.bind(this.ui)
        );

        // Set image
        this._setupCardImage(document.getElementById('effectCardImg'), card);

        // Set changes list
        const changesList = document.getElementById('effectChangesList');
        if (changesList) {
            changesList.innerHTML = OpportunityCardTemplate.buildChangesList(
                effectPreview?.changes
            );
        }

        // ✅ Bind buttons with activationOnly-aware labels
        OpportunityCardTemplate.bindEffectButtons(
            () => {
                this._sendExecuteCard(true);
                this.modalManager.closeModal('effectConfirmModal');
                this.ui.addLog(
                    activationOnly
                        ? `🚀 啟動投資「${card.name}」`
                        : `✅ 執行「${card.name}」`,
                    'success'
                );
            },
            () => {
                this._sendExecuteCard(false);
                this.modalManager.closeModal('effectConfirmModal');
                this.ui.addLog(
                    activationOnly
                        ? `❌ 放棄啟動「${card.name}」`
                        : `❌ 不執行「${card.name}」`,
                    'warning'
                );
            }
        );
    }

    _handleFinanceCardUnits(card) {
        const maxUnitsByCash = Math.floor((this.gameState?.cash || 0) / card.pricePerUnit);
        const maxUnits = card.maxUnits === null
            ? maxUnitsByCash
            : Math.min(card.maxUnits, maxUnitsByCash);

        if (maxUnits === 0) {
            this.ui.showNotification(
                `現金不足，無法購買任何份額。需要至少 ${card.pricePerUnit.toLocaleString()} 元`, 'error'
            );
            this._sendExecuteCard(false);
            return;
        }

        const units = parseInt(prompt(
            `📊 ${card.name}\n\n` +
            `基金代碼: ${card.code || card.id}\n` +
            `今日價格: ${card.pricePerUnit.toLocaleString()} 元/份\n` +
            `每月利息: +${card.monthlyReturn.toLocaleString()} 元/份\n` +
            `可購買份數: ${card.maxUnits === null ? '不限' : card.maxUnits} 份\n` +
            `最大可購買份數 (按現金): ${maxUnits} 份\n\n` +
            `請輸入購買份數 (1-${maxUnits}):`
        ) || '0');

        if (units > 0 && units <= maxUnits) {
            const totalCost = units * card.pricePerUnit;
            if (confirm(
                `確認購買 ${units} 份 ${card.name}？\n` +
                `總花費: ${totalCost.toLocaleString()} 元\n` +
                `每月被動收入增加: +${(units * card.monthlyReturn).toLocaleString()} 元\n\n` +
                `確認執行嗎？`
            )) {
                this._sendExecuteCardWithUnits(true, units);
            } else {
                this._sendExecuteCard(false);
            }
        } else {
            this.ui.addLog(`❌ 無效的購買數量`, 'error');
            this._sendExecuteCard(false);
        }
    }

    _handleP2PCardUnits(card) {
        const maxUnits   = Math.min(1000, Math.floor((this.gameState?.cash || 0) / card.pricePerUnit));
        const maxAllowed = Math.min(1000, Math.floor(maxUnits / 100) * 100);

        if (maxAllowed === 0) {
            this.ui.showNotification(
                `現金不足，無法購買。需要至少 ${card.pricePerUnit * 100} 元`, 'error'
            );
            this._sendExecuteCard(false);
            return;
        }

        const units = parseInt(prompt(
            `📊 ${card.name}\n\n` +
            `今日價格: ${card.pricePerUnit} 元/股\n` +
            `可購買股數: 100-1000 股 (100的倍數)\n` +
            `最大可購買: ${maxAllowed} 股\n\n` +
            `請輸入購買股數 (100, 200, 300... 最大 ${maxAllowed}):`
        ) || '0');

        if (units >= 100 && units <= 1000 && units % 100 === 0 && units <= maxAllowed) {
            const totalCost = units * card.pricePerUnit;
            if (confirm(
                `確認購買 ${units} 股 ${card.name}？\n` +
                `總花費: ${totalCost.toLocaleString()} 元\n` +
                `確認執行嗎？`
            )) {
                this._sendExecuteCardWithUnits(true, units);
            } else {
                this._sendExecuteCard(false);
            }
        } else {
            this.ui.addLog(
                `❌ 無效的購買數量，必須是100的倍數且不超過 ${maxAllowed}`, 'error'
            );
            this._sendExecuteCard(false);
        }
    }

    _ensureModals(activationOnly = false) {
        if (!document.getElementById('cardTypeModal')) {
            this.modalManager.createModal('cardTypeModal',
                OpportunityCardTemplate.buildCardTypeModal());
        }
        if (!document.getElementById('purchaseConfirmModal')) {
            this.modalManager.createModal('purchaseConfirmModal',
                OpportunityCardTemplate.buildPurchaseModal());
        }

        // ✅ Always rebuild effectConfirmModal so buttons/text reflect activationOnly
        const existing = document.getElementById('effectConfirmModal');
        if (existing) existing.remove();

        this.modalManager.createModal('effectConfirmModal',
            OpportunityCardTemplate.buildEffectModal(activationOnly));
    }
}