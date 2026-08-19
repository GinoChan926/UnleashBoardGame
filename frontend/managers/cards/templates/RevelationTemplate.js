"use strict";

import { CardVisibility } from './CardVisibility.js';

// ── Type configuration ────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    market_news: { name: '市場消息卡', icon: '📊', color: '#2196f3', image: '../cards/revelation/market/back.png' },
    tip:         { name: '錦囊卡',     icon: '🎁', color: '#9c27b0', image: '../cards/revelation/tip/back.png'   }
};

// ── Template class ────────────────────────────────────────────────────────────

export class RevelationTemplate {

    // ==================== Modal Shells ====================

    static buildTypeModal() {
        return `
            <div class="modal-content" style="max-width: 560px;
                 background: linear-gradient(135deg, #4a2a1a, #3a1a0a);
                 border-radius: 28px; padding: 20px; border: 2px solid #ff9800;">

                <div class="modal-title" style="text-align: center; color: #ff9800;
                     font-size: 22px; margin-bottom: 16px;">
                    🧘 察覺卡
                </div>

                <div class="modal-body" style="text-align: center;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr);
                                gap: 20px; padding: 8px;" id="revelationTypeButtons">
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.5); padding: 10px;
                            border-radius: 12px; margin: 12px 8px; text-align: center;">
                    <span style="color: #ff9800; font-size: 13px;">
                        💰 執行察覺卡需要花費 500 元
                    </span>
                </div>

                <div class="modal-buttons" style="justify-content: center;
                     margin: 10px 0 5px 0;">
                    <button id="cancelRevelationTypeBtn"
                            style="background: #9e9e9e; padding: 10px 32px;
                                   border-radius: 30px; cursor: pointer;
                                   border: none; color: white; font-size: 14px;
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
             background: linear-gradient(135deg, #4a2a1a, #3a1a0a);
             border-radius: 24px; text-align: center;
             border: 2px solid #ff9800; padding: 24px;">

            <div class="modal-title" style="color: #ff9800; font-size: 24px;
                 margin-bottom: 12px;">
                🧘 察覺卡
            </div>

            <div style="text-align: center; margin: 15px 0;">
                <img id="revelationPurchaseImg" src="" alt="察覺卡"
                     style="max-width: 100%; border-radius: 16px;
                            border: 3px solid #ff9800;
                            box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
            </div>

            <div class="modal-body" id="revelationPurchaseBody"
                 style="font-size: 14px; line-height: 1.5; color: #ffefc0;">
            </div>

            <!-- ✅ Dynamic cost display -->
            <div id="revelationCostDisplay"
                 style="background: rgba(255,152,0,0.15); padding: 12px;
                        border-radius: 12px; margin: 15px 0;
                        border: 1px solid rgba(255,152,0,0.3);">
            </div>

            <div class="modal-buttons" style="display: flex; gap: 15px;
                 justify-content: center;">
                <button id="cancelRevelationPurchaseBtn"
                        style="background: #9e9e9e; padding: 12px 24px;
                               border-radius: 30px; cursor: pointer;
                               border: none; color: white; font-size: 15px;
                               transition: all 0.2s ease;">
                    ❌ 放棄購買
                </button>
                <button id="confirmRevelationPurchaseBtn"
                        style="background: linear-gradient(135deg, #ff9800, #f57c00);
                               padding: 12px 24px; border-radius: 30px; cursor: pointer;
                               border: none; color: white; font-size: 15px;
                               transition: all 0.2s ease;
                               box-shadow: 0 4px 12px rgba(255,152,0,0.3);">
                    💰 支付購買
                </button>
            </div>
        </div>
    `;
    }

    static buildEffectModal() {
        return `
            <div class="modal-content" style="max-width: 550px;
                 background: linear-gradient(135deg, #4a2a1a, #3a1a0a);
                 border-radius: 24px; text-align: center;
                 border: 2px solid #ff9800; padding: 24px;">

                <div class="modal-title" style="color: #ff9800; font-size: 24px;
                     margin-bottom: 12px;">
                    🧘 察覺卡
                </div>

                <div style="text-align: center; margin: 15px 0;">
                    <img id="revelationEffectImg" src="" alt="察覺卡"
                         style="max-width: 100%; border-radius: 16px;
                                border: 3px solid #ff9800;
                                box-shadow: 0 8px 20px rgba(0,0,0,0.3);">
                </div>

                <div class="modal-body" id="revelationEffectBody"
                     style="font-size: 14px; line-height: 1.5; color: #ffefc0;">
                </div>

                <div style="background: rgba(255,152,0,0.15); padding: 12px;
                            border-radius: 12px; margin: 15px 0;
                            border: 1px solid rgba(255,152,0,0.3);">
                    <span style="font-size: 16px; font-weight: bold; color: #ff9800;">
                        ⚠️ 執行後無法撤銷！
                    </span>
                </div>

                <div class="modal-buttons" style="display: flex; gap: 15px;
                     justify-content: center;">
                    <button id="declineRevelationBtn"
                            style="background: #9e9e9e; padding: 12px 24px;
                                   border-radius: 30px; cursor: pointer;
                                   border: none; color: white; font-size: 15px;
                                   transition: all 0.2s ease;">
                        ❌ 不執行
                    </button>
                    <button id="confirmRevelationBtn"
                            style="background: linear-gradient(135deg, #ff9800, #f57c00);
                                   padding: 12px 24px; border-radius: 30px; cursor: pointer;
                                   border: none; color: white; font-size: 15px;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 4px 12px rgba(255,152,0,0.3);">
                        ✅ 確認執行
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== Type Button ====================

    /**
     * Build one revelation type button element.
     * @param {object}  type      - { id, name, icon, color, image }
     * @param {boolean} canAfford
     * @returns {HTMLElement}
     */
    static buildTypeButton(type, canAfford) {
        const cfg = TYPE_CONFIG[type.id] || {
            name: type.name, icon: '🎴',
            color: '#ff9800', image: ''
        };

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

        if (!canAfford) btn.title = '現金不足500元，無法執行察覺卡';

        // Image
        const img = document.createElement('img');
        img.src = cfg.image;
        img.alt = cfg.name;
        img.style.cssText = `
            width: 100%; max-width: 180px; height: auto; aspect-ratio: 1 / 1;
            object-fit: contain; display: block; margin: 0 auto; padding: 16px;
            background: rgba(30, 25, 20, 0.6); border-radius: 12px; box-sizing: border-box;
        `;
        img.onerror = () => {
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.style.cssText = `
                width: 100%; max-width: 180px; margin: 0 auto; aspect-ratio: 1 / 1;
                display: flex; align-items: center; justify-content: center;
                font-size: 48px; background: ${cfg.color}; border-radius: 12px;
            `;
            fallback.textContent = cfg.icon;
            btn.insertBefore(fallback, img);
        };

        // Label
        const label = document.createElement('div');
        label.style.cssText = `
            padding: 10px 6px; font-size: 14px; font-weight: bold;
            color: #ffd966; background: rgba(0,0,0,0.75); text-align: center;
        `;
        label.textContent = `${cfg.icon} ${cfg.name}`;

        btn.appendChild(img);
        btn.appendChild(label);

        if (canAfford) {
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        }

        return btn;
    }

    // ==================== Card Body Content ====================

    /**
     * Build the body HTML shared by both purchase and effect modals.
     * @param {object}   card       - card data from server
     * @param {Function} escapeHtml - string sanitiser
     * @returns {string} HTML
     */
    static buildCardBody(card, escapeHtml) {
        return `
            <h3 style="color: #ff9800; margin-bottom: 10px; font-size: 18px;">
                ${escapeHtml(card.name || '')}
            </h3>
            <p style="color: #ffefc0; font-size: 14px; line-height: 1.6;">
                ${escapeHtml(card.description || '')}
            </p>
            ${card.scope === 'team' ? `
                <div style="background: rgba(255,152,0,0.15); padding: 10px;
                            border-radius: 10px; margin-top: 12px;
                            color: #ff9800; font-size: 13px;">
                    🌟 團隊錦囊 - 所有玩家可參與
                </div>
            ` : ''}
        `;
    }

    // ==================== Image Setter ====================

    /**
     * Set card image src with fallback on error.
     * @param {HTMLImageElement} imgEl
     * @param {object}           card
     */
    static applyCardImage(imgEl, card) {
        if (!imgEl || !card.image) return;

        let url = card.image;
        if (url && !url.startsWith('http') && !url.startsWith('/')) {
            url = '/' + url;
        }

        imgEl.src = url;
        imgEl.onerror = () => { imgEl.style.display = 'none'; };
    }

    // ==================== Event Binding ====================

    /**
     * Bind type selection buttons.
     * @param {Array}    cardTypes  - [{id, ...}]
     * @param {boolean}  canAfford
     * @param {Function} onSelect   - called with typeId
     * @param {Function} onCancel
     */
    static bindTypeButtons(cardTypes, canAfford, onSelect, onCancel) {
        const container = document.getElementById('revelationTypeButtons');
        if (!container) return;

        container.innerHTML = '';

        cardTypes.forEach(type => {
            const btn = this.buildTypeButton(type, canAfford);
            if (canAfford) btn.onclick = () => onSelect(type.id);
            container.appendChild(btn);
        });

        const cancelBtn = document.getElementById('cancelRevelationTypeBtn');
        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
            cancelBtn.onmouseenter = () => { cancelBtn.style.transform = 'scale(1.02)'; };
            cancelBtn.onmouseleave = () => { cancelBtn.style.transform = 'scale(1)'; };
        }
    }

    /**
     * Bind purchase modal buttons.
     * @param {boolean}  canAfford
     * @param {Function} onConfirm
     * @param {Function} onCancel
     */
    static bindPurchaseButtons(canAfford, onConfirm, onCancel) {
        const confirmBtn = document.getElementById('confirmRevelationPurchaseBtn');
        const cancelBtn  = document.getElementById('cancelRevelationPurchaseBtn');

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
            cancelBtn.onclick       = () => onCancel();
            cancelBtn.onmouseenter  = () => { cancelBtn.style.transform = 'scale(1.02)'; };
            cancelBtn.onmouseleave  = () => { cancelBtn.style.transform = 'scale(1)'; };
        }
    }

    /**
     * Bind effect modal buttons.
     * @param {Function} onConfirm
     * @param {Function} onDecline
     */
    static bindEffectButtons(onConfirm, onDecline) {
        const confirmBtn = document.getElementById('confirmRevelationBtn');
        const declineBtn = document.getElementById('declineRevelationBtn');

        if (confirmBtn) {
            confirmBtn.onclick      = () => onConfirm();
            confirmBtn.onmouseenter = () => {
                confirmBtn.style.transform = 'scale(1.02)';
                confirmBtn.style.boxShadow = '0 6px 20px rgba(255,152,0,0.4)';
            };
            confirmBtn.onmouseleave = () => {
                confirmBtn.style.transform = 'scale(1)';
                confirmBtn.style.boxShadow = '0 4px 12px rgba(255,152,0,0.3)';
            };
        }

        if (declineBtn) {
            declineBtn.onclick      = () => onDecline();
            declineBtn.onmouseenter = () => { declineBtn.style.transform = 'scale(1.02)'; };
            declineBtn.onmouseleave = () => { declineBtn.style.transform = 'scale(1)'; };
        }
    }

    /**
     * Update the revelation purchase cost display based on card cost multiplier.
     * @param {number} multiplier - 1 for normal, 2 for doubled (S08)
     * @param {boolean} canAfford - whether player can afford
     */
    static updatePurchaseCost(multiplier, canAfford) {
        const costDisplay = document.getElementById('revelationCostDisplay');
        const confirmBtn  = document.getElementById('confirmRevelationPurchaseBtn');

        if (!costDisplay) return;

        const baseCost   = 500;
        const actualCost = baseCost * multiplier;

        if (multiplier > 1) {
            costDisplay.innerHTML = `
            <span style="font-size: 18px; font-weight: bold; color: #ff9800;">
                💰 購買費用:
                <s style="color: #999; font-size: 14px;">$${baseCost}</s>
                <span style="color: #f44336; font-size: 20px;">$${actualCost.toLocaleString()}</span> 元
            </span>
            <div style="font-size: 12px; color: #ffab00; margin-top: 4px;">
                ⚔️ 因中東禁運，費用翻倍
            </div>
        `;
        } else {
            costDisplay.innerHTML = `
            <span style="font-size: 18px; font-weight: bold; color: #ff9800;">
                💰 購買費用: $${baseCost} 元
            </span>
        `;
        }

        // Update button text
        if (confirmBtn) {
            confirmBtn.textContent = `💰 支付$${actualCost.toLocaleString()}購買`;
            confirmBtn.disabled      = !canAfford;
            confirmBtn.style.opacity = canAfford ? '1' : '0.5';
            confirmBtn.style.cursor  = canAfford ? 'pointer' : 'not-allowed';
        }
    }

    /**
     * Build body HTML for blind cards (content hidden before purchase).
     */
    static buildBlindBody(cardType, escapeHtml) {
        const label = CardVisibility.getBlindLabel(cardType);
        const desc  = CardVisibility.getBlindDescription(cardType);

        return `
        <div style="text-align: center;">
            <div style="font-size: 60px; margin-bottom: 12px;">🔒</div>
            <h3 style="color: #ff9800; margin-bottom: 10px; font-size: 22px;">
                ${label}
            </h3>
            <p style="color: #ffefc0; font-size: 14px; line-height: 1.6;">
                ${escapeHtml(desc)}
            </p>
            <div style="background: rgba(255,152,0,0.15); padding: 10px;
                        border-radius: 8px; margin-top: 12px;
                        border: 2px dashed #ff9800;">
                <span style="color: #ff9800; font-size: 13px;">
                    🔒 內容未揭曉 - 支付後才能查看詳情
                </span>
            </div>
        </div>
    `;
    }

    /**
     * Apply card image with blind card handling for revelation cards.
     */
    static applyBlindCardImage(imgEl, card) {
        if (!imgEl) return;

        const cardType = card.cardType || card.type;
        imgEl.src = CardVisibility.getBlindImage(cardType);
        imgEl.style.filter = 'brightness(0.85)';
        imgEl.style.border = '3px dashed #ff9800';
        imgEl.onerror = () => { imgEl.style.display = 'none'; };
    }
    /**
     * Build the IN03 (慢活) reward choice modal.
     * Shows the dice value prominently so player knows why they got this choice.
     */
    static buildIN03RewardModal(diceRoll, options) {
        const diceFaces = {
            1: '⚀', 2: '⚁', 3: '⚂',
            4: '⚃', 5: '⚄', 6: '⚅'
        };
        const diceFace = diceFaces[diceRoll] || '🎲';

        const optionButtons = options.map(opt => {
            const gradient = opt.id === 'cash'
                ? '#ff9800, #f57c00'
                : '#4caf50, #388e3c';

            return `
            <button class="in03-choice-btn"
                    data-choice="${opt.id}"
                    style="background: linear-gradient(135deg, ${gradient});
                           color: white; padding: 16px; border: none;
                           border-radius: 16px; cursor: pointer;
                           font-size: 14px; font-weight: bold;
                           transition: all 0.2s ease;">
                <div style="font-size: 18px; margin-bottom: 4px;">
                    ${opt.label}
                </div>
                <div style="font-size: 11px; opacity: 0.9;">
                    ${opt.description}
                </div>
            </button>
        `;
        }).join('');

        return `
        <div class="modal-content" style="max-width: 420px;
             background: linear-gradient(135deg, #2a4a5a, #1a2a3a);
             border-radius: 24px; padding: 24px;
             border: 2px solid #4fc3f7; text-align: center;">

            <div style="font-size: 22px; color: #4fc3f7;
                        font-weight: bold; margin-bottom: 8px;">
                🧘 慢活 - 選擇獎勵
            </div>

            <!-- ✅ Big dice display -->
            <div style="background: rgba(79,195,247,0.15);
                        padding: 16px; border-radius: 16px;
                        margin: 12px 0 16px 0;
                        border: 1px solid rgba(79,195,247,0.4);">
                <div style="font-size: 12px; color: #b3e5fc; margin-bottom: 4px;">
                    🎲 系統為你擲出的點數
                </div>
                <div style="font-size: 80px; line-height: 1;
                            color: #ffd966;
                            text-shadow: 0 4px 12px rgba(0,0,0,0.5);
                            animation: diceRoll 0.6s ease-out;">
                    ${diceFace}
                </div>
                <div style="font-size: 32px; color: #4fc3f7;
                            font-weight: bold; margin-top: 4px;">
                    ${diceRoll} 點
                </div>
            </div>

            <style>
                @keyframes diceRoll {
                    0%   { transform: rotate(0deg) scale(0.5); opacity: 0; }
                    50%  { transform: rotate(360deg) scale(1.2); opacity: 1; }
                    100% { transform: rotate(720deg) scale(1); opacity: 1; }
                }
            </style>

            <div style="font-size: 13px; color: #b3e5fc; margin-bottom: 12px;">
                🎉 擲到 5-6 點！請選擇你的獎勵：
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr;
                        gap: 12px; margin: 16px 0;">
                ${optionButtons}
            </div>

            <div style="margin-top: 10px; font-size: 11px; color: #90a4ae;">
                💡 只能選擇一個獎勵
            </div>
        </div>
    `;
    }

    // ==================== IN03 Reward Choice Modal ====================

// ✅ ADD THIS:
    static bindIN03RewardButtons(onChoice) {
        document.querySelectorAll('.in03-choice-btn').forEach(btn => {
            btn.onclick = () => {
                const choice = btn.dataset.choice;
                onChoice(choice);
            };
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = 'none';
            };
        });
    }

    // ==================== Move Forward Choice Modal (IN14-17 黑馬思維) ====================

    /**
     * Build the move-forward step chooser modal.
     * @param {string} cardName - display name of the card
     * @param {string} message  - prompt shown to the player
     * @param {Array<number>} steps - allowed step values, e.g. [1, 2, 3]
     */
    static buildMoveForwardModal(cardName, message, steps = [1, 2, 3]) {
        const stepButtons = steps.map(n => `
        <button class="move-forward-step-btn"
                data-steps="${n}"
                style="flex: 1; background: linear-gradient(135deg, #4fc3f7, #1976d2);
                       color: white; padding: 20px 12px; border: none;
                       border-radius: 16px; cursor: pointer;
                       font-size: 20px; font-weight: bold;
                       transition: all 0.2s ease;
                       box-shadow: 0 4px 12px rgba(79,195,247,0.4);">
            ${n} 格
        </button>
    `).join('');

        return `
        <div class="modal-content" style="max-width: 440px;
             background: linear-gradient(135deg, #2a4a5a, #1a2a3a);
             border-radius: 24px; padding: 24px;
             border: 2px solid #4fc3f7; text-align: center;">

            <div style="font-size: 22px; color: #4fc3f7;
                        font-weight: bold; margin-bottom: 8px;">
                🐴 ${cardName}
            </div>
            <div style="font-size: 13px; color: #b3e5fc; margin-bottom: 16px;">
                ${message}
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 14px;">
                ${stepButtons}
            </div>

            <div style="font-size: 11px; color: #90a4ae; margin-bottom: 14px;">
                💡 選擇後立即前進，經過結算日會獲得收入
            </div>

            <button id="moveForwardCancelBtn"
                    style="background: #9e9e9e; color: white;
                           padding: 10px 28px; border: none;
                           border-radius: 20px; cursor: pointer;
                           font-size: 13px;">
                稍後決定
            </button>
        </div>
    `;
    }

    /**
     * Bind the step buttons + cancel button.
     * @param {Function} onChoice - called with chosen step count (number)
     * @param {Function} onCancel - called when player clicks cancel
     */
    static bindMoveForwardButtons(onChoice, onCancel) {
        document.querySelectorAll('.move-forward-step-btn').forEach(btn => {
            btn.onclick = () => {
                const steps = parseInt(btn.dataset.steps, 10);
                onChoice(steps);
            };
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = '0 6px 18px rgba(79,195,247,0.6)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 12px rgba(79,195,247,0.4)';
            };
        });

        const cancelBtn = document.getElementById('moveForwardCancelBtn');
        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
        }
    }
}