"use strict";

import { CardVisibility } from './CardVisibility.js';
// ── Type configuration ────────────────────────────────────────────────────────

const TYPE_COLORS = {
    part_time:  '#4caf50',
    finance:    '#2196f3',
    business:   '#ff9800',
    property:   '#9c27b0',
    investment: '#ff6f00',
    dream:      '#d4a017',
    social:     '#2e7d32'
};

const TYPE_IMAGES = {
    part_time: '../cards/cover/part_time.png',
    finance:   '../cards/cover/finance.png',
    business:  '../cards/cover/business.png',
    property:  '../cards/cover/property.png'
};

const ORDERED_TYPES = [
    { id: 'part_time', name: '兼職類', icon: '💼', color: '#4caf50' },
    { id: 'finance',   name: '財務類', icon: '📈', color: '#2196f3' },
    { id: 'business',  name: '創業類', icon: '🚀', color: '#ff9800' },
    { id: 'property',  name: '地產類', icon: '🏠', color: '#9c27b0' }
];

// ── Template class ────────────────────────────────────────────────────────────

export class OpportunityCardTemplate {

    // ==================== Modal Shells ====================

    static buildCardTypeModal() {
        return `
            <div class="modal-content" style="max-width: 560px;
                 background: linear-gradient(135deg, #1a472a, #0d2b1a);
                 border-radius: 28px; padding: 20px;">

                <div class="modal-title" style="text-align: center; color: #ffd966;
                     font-size: 22px; margin-bottom: 16px;">
                    🎴 選擇機會卡類型
                </div>

                <div class="modal-body" style="text-align: center;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr);
                                gap: 14px; padding: 8px;" id="cardTypeButtons">
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.5); padding: 10px;
                            border-radius: 12px; margin: 12px 8px; text-align: center;">
                    <span style="color: #ffd966; font-size: 13px;">
                        💰 執行機會卡需要花費 500 元，部分機會卡還需消耗精力 ⚡
                    </span>
                </div>

                <div class="modal-buttons" style="justify-content: center;
                     margin: 10px 0 5px 0;">
                    <button id="cancelCardTypeBtn"
                            style="background: #9e9e9e; padding: 10px 32px;
                                   border-radius: 30px; cursor: pointer;
                                   font-size: 14px; border: none; color: white;
                                   transition: all 0.2s ease;">
                        取消
                    </button>
                </div>
            </div>
        `;
    }

    static buildPurchaseModal() {
        return `
        <div class="modal-content" style="max-width: 500px;
             background: linear-gradient(135deg, #fff9e6, #fff3d6);
             border-radius: 20px; padding: 24px;">

            <div class="modal-title" style="text-align: center; color: #ff9800;
                 font-size: 24px; margin-bottom: 12px;">
                💰 購買機會卡
            </div>

            <div id="purchaseCardImage" style="text-align: center; margin: 15px 0;">
                <img id="purchaseCardImg" src="" alt="機會卡"
                     style="max-width: 100%; border-radius: 16px;
                            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                            border: 3px solid #ffb347;">
            </div>

            <div class="modal-body" id="purchaseModalBody"
                 style="font-size: 16px; line-height: 1.5;">
            </div>

            <div id="purchaseCardTypeBadge" style="text-align: center; margin: 10px 0;">
                <span id="purchaseCardTypeSpan"
                      style="display: inline-block; padding: 5px 12px;
                             border-radius: 20px; font-size: 12px; color: white;">
                </span>
            </div>

            <!-- ✅ Cost display - now has an ID so we can update it dynamically -->
            <div id="purchaseCostDisplay" style="background: #ffecb3; padding: 12px;
                        border-radius: 12px; margin: 15px 0; text-align: center;">
            </div>

            <div class="modal-buttons" style="display: flex; gap: 15px; justify-content: center;">
                <button id="cancelPurchaseBtn"
                        style="background: #9e9e9e; padding: 12px 24px; font-size: 16px;
                               border-radius: 30px; cursor: pointer; border: none; color: white;
                               transition: all 0.2s ease;">
                    ❌ 放棄購買
                </button>
                <button id="confirmPurchaseBtn"
                        style="background: #ff9800; padding: 12px 24px; font-size: 16px;
                               border-radius: 30px; cursor: pointer; border: none; color: white;
                               transition: all 0.2s ease;
                               box-shadow: 0 4px 12px rgba(255,152,0,0.3);">
                    💰 支付購買
                </button>
            </div>
        </div>
    `;
    }

    static buildEffectModal(activationOnly = false) {
        const titleText   = activationOnly ? '🏗️ 項目投資 - 是否啟動？' : '✨ 卡片效果預覽';
        const titleColor  = activationOnly ? '#ff6f00' : '#2e7d32';
        const bgGradient  = activationOnly
            ? 'linear-gradient(135deg, #fff3e0, #ffe0b2)'
            : 'linear-gradient(135deg, #e8f5e9, #c8e6c9)';
        const confirmText = activationOnly ? '🚀 啟動投資'  : '✅ 確認執行';
        const declineText = activationOnly ? '❌ 不啟動'    : '❌ 不執行';
        const footerText  = activationOnly
            ? '💡 順流層投資項目，免費查看，不啟動無需支付任何費用'
            : '(已支付 500 元，不執行費用不退還)';
        const footerColor = activationOnly ? '#ff6f00' : '#666';
        const confirmBg   = activationOnly ? '#ff6f00' : '#4caf50';
        const confirmShadow = activationOnly
            ? 'rgba(255,111,0,0.3)'
            : 'rgba(76,175,80,0.3)';
        const imgBorder   = activationOnly ? '#ff6f00' : '#4caf50';

        return `
        <div class="modal-content" style="max-width: 550px;
             background: ${bgGradient};
             border-radius: 20px; padding: 24px;">

            <div class="modal-title" style="text-align: center; color: ${titleColor};
                 font-size: 24px; margin-bottom: 12px;">
                ${titleText}
            </div>

            <div id="effectCardImage" style="text-align: center; margin: 15px 0;">
                <img id="effectCardImg" src="" alt="機會卡"
                     style="max-width: 100%; border-radius: 16px;
                            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                            border: 3px solid ${imgBorder};">
            </div>

            <div id="effectCardTypeBadge" style="text-align: center; margin: 10px 0;">
                <span id="effectCardTypeSpan"
                      style="display: inline-block; padding: 5px 12px;
                             border-radius: 20px; font-size: 12px; color: white;">
                </span>
            </div>

            <div class="modal-body" id="effectModalBody"
                 style="font-size: 16px; line-height: 1.5;">
            </div>

            <div id="effectChanges" style="background: #ffffff; padding: 15px;
                 border-radius: 12px; margin: 15px 0; font-size: 14px;">
                <strong>📊 效果預覽:</strong>
                <div id="effectChangesList"></div>
            </div>

            ${!activationOnly ? `
            <div style="background: #fff3e0; padding: 12px; border-radius: 12px;
                        margin: 15px 0; text-align: center;">
                <span style="font-size: 16px; font-weight: bold;">
                    ⚠️ 注意：執行後無法撤銷！
                </span>
            </div>
            ` : ''}

            <div class="modal-buttons"
                 style="display: flex; gap: 15px; justify-content: center;">
                <button id="declineExecuteBtn"
                        style="background: #9e9e9e; padding: 12px 24px;
                               font-size: 16px; border-radius: 30px;
                               cursor: pointer; border: none; color: white;
                               transition: all 0.2s ease;">
                    ${declineText}
                </button>
                <button id="confirmExecuteBtn"
                        style="background: ${confirmBg}; padding: 12px 24px;
                               font-size: 16px; border-radius: 30px;
                               cursor: pointer; border: none; color: white;
                               transition: all 0.2s ease;
                               box-shadow: 0 4px 12px ${confirmShadow};">
                    ${confirmText}
                </button>
            </div>

            <div style="text-align: center; margin-top: 10px;
                        font-size: 12px; color: ${footerColor};">
                ${footerText}
            </div>
        </div>
    `;
    }

    // ==================== Card Type Grid ====================

    /**
     * Build one card type button and append to container.
     * Returns the button container element.
     */
    static buildTypeButton(type, count, canAfford) {
        const btn = document.createElement('div');
        btn.style.cssText = `
            cursor: ${canAfford ? 'pointer' : 'not-allowed'};
            opacity: ${canAfford ? '1' : '0.55'};
            transition: all 0.3s ease;
            text-align: center;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 6px 14px rgba(0,0,0,0.3);
            background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2));
        `;

        if (!canAfford) btn.title = '現金不足500元，無法執行機會卡';

        // Image
        const img = document.createElement('img');
        img.src = TYPE_IMAGES[type.id] || '';
        img.alt = type.name;
        img.style.cssText = `
            width: 100%; max-width: 140px; height: auto; aspect-ratio: 1 / 1;
            object-fit: contain; display: block; margin: 0 auto; padding: 8px;
            background: rgba(30, 25, 20, 0.6); border-radius: 12px; box-sizing: border-box;
        `;
        img.onerror = () => {
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.style.cssText = `
                width: 100%; max-width: 140px; margin: 0 auto; aspect-ratio: 1 / 1;
                display: flex; align-items: center; justify-content: center;
                font-size: 48px; background: ${type.color}; border-radius: 12px;
            `;
            fallback.textContent = type.icon;
            btn.insertBefore(fallback, img);
        };

        // Label
        const label = document.createElement('div');
        label.style.cssText = `
            padding: 10px 6px; font-size: 14px; font-weight: bold;
            color: #ffd966; background: rgba(0,0,0,0.75); text-align: center;
        `;
        label.innerHTML = `
            ${type.icon} ${type.name}
            <span style="font-size: 10px; margin-left: 6px; color: #ffaa66;">
                ${count}張
            </span>
        `;

        btn.appendChild(img);
        btn.appendChild(label);

        if (canAfford) {
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        }

        return btn;
    }

    // ==================== Purchase Modal Body ====================

    /**
     * Build the body content for the purchase confirm modal.
     */
    static buildPurchaseBody(card, escapeHtml) {
        const isBlind = CardVisibility.isBlindCard(card);

        if (isBlind) {
            // Hide actual content, show only card type teaser
            const label = CardVisibility.getBlindLabel(card.cardType || card.type);
            const desc  = CardVisibility.getBlindDescription(card.cardType || card.type);

            return `
            <div style="text-align: center;">
                <div style="font-size: 60px; margin-bottom: 12px;">🎴</div>
                <h3 style="color: #ff6f00; margin-bottom: 10px; font-size: 22px;">
                    ${label}
                </h3>
                <p style="color: #555; font-size: 14px; line-height: 1.6;">
                    ${escapeHtml(desc)}
                </p>
                <div style="background: #fff3e0; padding: 10px;
                            border-radius: 8px; margin-top: 12px;
                            border: 2px dashed #ff9800;">
                    <span style="color: #e65100; font-size: 13px;">
                        🔒 內容未揭曉 - 需支付 500 元購買後才能查看詳情
                    </span>
                </div>
            </div>
        `;
        }

        // Non-blind cards - show full content as before
        return `
        <div style="text-align: center;">
            <h3 style="color: #ff6f00; margin-bottom: 10px; font-size: 20px;">
                ${escapeHtml(card.name || '機會卡')}
            </h3>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
                ${escapeHtml(card.description || '')}
            </p>
            ${card.investmentCost ? `
                <div style="background: #e8f5e9; padding: 8px; border-radius: 8px; margin-top: 10px;">
                    <span style="color: #2e7d32;">
                        💰 需要投資: ${card.investmentCost.toLocaleString()} 元
                    </span>
                </div>
            ` : ''}
            <div style="background: #e3f2fd; padding: 10px; border-radius: 8px; margin-top: 10px;">
                <span style="color: #1565c0;">
                    💡 支付 500 元購買後，可查看詳細效果並決定是否執行
                </span>
            </div>
        </div>
    `;
    }

    /**
     * Build the title text for the purchase modal based on card type.
     */
    static buildPurchaseTitle(cardType) {
        const titles = {
            investment: '🏗️ 投資項目',
            dream:      '🌟 實現夢想',
            social:     '🤝 貢獻社會'
        };
        return titles[cardType] || '💰 購買機會卡';
    }

    // ==================== Effect Modal Body ====================

    /**
     * Build the body content for the effect confirm modal.
     */
    static buildEffectBody(card, escapeHtml) {
        return `
            <div style="text-align: center;">
                <h3 style="color: #2e7d32; margin-bottom: 10px; font-size: 20px;">
                    ${escapeHtml(card.name)}
                </h3>
                <p style="color: #555; font-size: 14px;">
                    ${escapeHtml(card.description || '')}
                </p>
                ${card.energyCost ? `
                    <div style="background: #fff3e0; padding: 8px; border-radius: 8px; margin-top: 10px;">
                        <span style="color: #e65100;">⚡ 執行需要精力: ${card.energyCost}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Build the changes list HTML from effectPreview.changes.
     */
    static buildChangesList(changes) {
        if (!changes) return '<div>無數據變化</div>';

        const rows = [
            { key: 'cashChange',          icon: '💰', label: '現金',    unit: '元' },
            { key: 'sideIncomeChange',    icon: '💪', label: '副業收入', unit: '元/月' },
            { key: 'passiveIncomeChange', icon: '📈', label: '被動收入', unit: '元/月' },
            { key: 'salaryChange',        icon: '💼', label: '月薪',    unit: '元/月' },
            { key: 'energyChange',        icon: '⚡', label: '精力',    unit: '' }
        ];

        let html = '';
        rows.forEach(({ key, icon, label, unit }) => {
            const val = changes[key];
            if (val === undefined || val === 0) return;
            const sign = val > 0 ? '+' : '';
            const formatted = typeof val === 'number' && Math.abs(val) >= 1000
                ? val.toLocaleString()
                : val;
            html += `
                <div style="display: flex; justify-content: space-between;
                            padding: 4px 0; border-bottom: 1px solid #e0e0e0;">
                    <span>${icon} ${label}</span>
                    <span style="color: ${val > 0 ? '#2e7d32' : '#c62828'}; font-weight: bold;">
                        ${sign}${formatted} ${unit}
                    </span>
                </div>
            `;
        });

        return html || '<div>無數據變化</div>';
    }

    // ==================== Type Badge ====================

    /**
     * Set the type badge span content and colour.
     */
    static applyTypeBadge(spanEl, card) {
        if (!spanEl || !card.cardTypeName) return;
        spanEl.style.backgroundColor = TYPE_COLORS[card.cardType] || '#ffb347';
        spanEl.innerHTML = `${card.cardTypeIcon || '🎴'} ${card.cardTypeName}`;
    }

    // ==================== Event Binding ====================

    static bindCardTypeButtons(container, cardTypes, canAfford, onSelect, onCancel) {
        if (!container) return;
        container.innerHTML = '';

        ORDERED_TYPES.forEach(type => {
            const cardType = cardTypes.find(t => t.id === type.id);
            const count    = cardType ? cardType.count : '?';
            const btn      = this.buildTypeButton(type, count, canAfford);

            if (canAfford) {
                btn.onclick = () => onSelect(type.id);
            }

            container.appendChild(btn);
        });

        const cancelBtn = document.getElementById('cancelCardTypeBtn');
        if (cancelBtn) cancelBtn.onclick = () => onCancel();
    }

    static bindPurchaseButtons(canAfford, onConfirm, onCancel) {
        const confirmBtn = document.getElementById('confirmPurchaseBtn');
        const cancelBtn  = document.getElementById('cancelPurchaseBtn');

        if (confirmBtn) {
            confirmBtn.disabled      = !canAfford;
            confirmBtn.style.opacity = canAfford ? '1' : '0.5';
            confirmBtn.style.cursor  = canAfford ? 'pointer' : 'not-allowed';
            confirmBtn.onclick       = () => onConfirm();

            confirmBtn.onmouseenter = () => {
                if (!canAfford) return;
                confirmBtn.style.transform = 'scale(1.02)';
                confirmBtn.style.boxShadow = '0 6px 20px rgba(255,152,0,0.4)';
            };
            confirmBtn.onmouseleave = () => {
                confirmBtn.style.transform = 'scale(1)';
                confirmBtn.style.boxShadow = '0 4px 12px rgba(255,152,0,0.3)';
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
            cancelBtn.onmouseenter = () => { cancelBtn.style.transform = 'scale(1.02)'; };
            cancelBtn.onmouseleave = () => { cancelBtn.style.transform = 'scale(1)'; };
        }
    }

    static bindEffectButtons(onConfirm, onDecline) {
        const confirmBtn = document.getElementById('confirmExecuteBtn');
        const declineBtn = document.getElementById('declineExecuteBtn');

        if (confirmBtn) {
            confirmBtn.onclick = () => onConfirm();
            confirmBtn.onmouseenter = () => {
                confirmBtn.style.transform = 'scale(1.02)';
                confirmBtn.style.boxShadow = '0 6px 20px rgba(76,175,80,0.4)';
            };
            confirmBtn.onmouseleave = () => {
                confirmBtn.style.transform = 'scale(1)';
                confirmBtn.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)';
            };
        }

        if (declineBtn) {
            declineBtn.onclick = () => onDecline();
            declineBtn.onmouseenter = () => { declineBtn.style.transform = 'scale(1.02)'; };
            declineBtn.onmouseleave = () => { declineBtn.style.transform = 'scale(1)'; };
        }
    }

    /**
     * Apply card image with blind card handling.
     * For blind cards, shows back cover; for open cards, shows real image.
     */
    static applyPurchaseCardImage(imgEl, card) {
        if (!imgEl) return;

        if (CardVisibility.isBlindCard(card)) {
            // Show back-of-card image
            imgEl.src = CardVisibility.getBlindImage(card.cardType || card.type);
            imgEl.style.filter = 'brightness(0.85)';
            imgEl.style.border = '3px dashed #ff9800';
            imgEl.onerror = () => {
                // If no back image exists, hide the image and show a lock icon
                imgEl.style.display = 'none';
                const container = imgEl.parentElement;
                if (container) {
                    container.innerHTML = `
                    <div style="height: 200px; display: flex;
                                align-items: center; justify-content: center;
                                background: linear-gradient(135deg, #ffb347, #ff9800);
                                border-radius: 16px; border: 3px dashed #e65100;">
                        <div style="text-align: center; color: white;">
                            <div style="font-size: 60px;">🔒</div>
                            <div style="font-size: 14px; margin-top: 8px;">
                                內容未揭曉
                            </div>
                        </div>
                    </div>
                `;
                }
            };
            return;
        }

        // Non-blind cards - show real image
        if (card.image) {
            let url = card.image;
            if (url && !url.startsWith('http') && !url.startsWith('/')) {
                url = '/' + url;
            }
            imgEl.src = url;
            imgEl.style.filter = 'none';
            imgEl.style.border = '3px solid #ffb347';
            imgEl.onerror = () => { imgEl.style.display = 'none'; };
        }
    }

    /**
     * Update the purchase cost display based on card cost multiplier.
     * @param {number} multiplier - 1 for normal, 2 for doubled (S08)
     * @param {boolean} canAfford - whether player can afford
     */
    static updatePurchaseCost(multiplier, canAfford) {
        const costDisplay = document.getElementById('purchaseCostDisplay');
        const confirmBtn  = document.getElementById('confirmPurchaseBtn');

        if (!costDisplay) return;

        const baseCost   = 500;
        const actualCost = baseCost * multiplier;

        if (multiplier > 1) {
            costDisplay.innerHTML = `
            <span style="font-size: 18px; font-weight: bold;">
                💰 購買費用:
                <s style="color: #999; font-size: 14px;">$${baseCost}</s>
                <span style="color: #f44336; font-size: 20px;">$${actualCost.toLocaleString()}</span> 元
            </span>
            <div style="font-size: 12px; color: #e65100; margin-top: 4px;">
                ⚔️ 因中東禁運，費用翻倍
            </div>
            <span id="purchaseAffordWarning"
                  style="color: #d32f2f; display: ${canAfford ? 'none' : 'inline'};">
                (現金不足)
            </span>
        `;
        } else {
            costDisplay.innerHTML = `
            <span style="font-size: 18px; font-weight: bold;">
                💰 購買費用: $${baseCost} 元
            </span>
            <span id="purchaseAffordWarning"
                  style="color: #d32f2f; display: ${canAfford ? 'none' : 'inline'}; margin-left: 10px;">
                (現金不足)
            </span>
        `;
        }

        // Update confirm button text
        if (confirmBtn) {
            confirmBtn.textContent = `💰 支付$${actualCost.toLocaleString()}購買`;
        }
    }
}