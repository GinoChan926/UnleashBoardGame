"use strict";

/**
 * Shared template for revealing dangerous/impactful cards with a confirmation step.
 * Used for lier cards (騙子卡) and hardship cards (逆境自強卡).
 * User must click a button to acknowledge the effect and continue.
 */
export class CardRevealTemplate {

    /**
     * @param {object} config
     *   - title: modal header (e.g. "🎭 逆境自強卡")
     *   - subtitle: brief description
     *   - primaryColor: e.g. '#f44336' for danger, '#dc143c' for lier
     *   - accentColor: light version for hover effects
     */
    static buildModal(config) {
        const {
            title = '⚠️ 卡片揭曉',
            subtitle = '',
            primaryColor = '#f44336',
            accentColor = '#ffcdd2'
        } = config;

        return `
            <div class="modal-content" style="max-width: 480px;
                 background: linear-gradient(135deg, #1a0a0a, #2a0d0d);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid ${primaryColor};
                 text-align: center;">

                <div style="margin-bottom: 12px;">
                    <div style="font-size: 24px; color: ${primaryColor};
                                font-weight: bold; margin-bottom: 4px;">
                        ${title}
                    </div>
                    <div style="font-size: 12px; color: ${accentColor};">
                        ${subtitle}
                    </div>
                </div>

                <div id="cardRevealImage" style="margin: 16px 0;">
                    <img id="cardRevealImg" src="" alt="卡片"
                         style="max-width: 80%; max-height: 220px;
                                border-radius: 16px;
                                border: 3px solid ${primaryColor};
                                box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                                animation: cardShake 0.5s ease-out;">
                </div>

                <style>
                    @keyframes cardShake {
                        0%, 100% { transform: translateX(0) rotate(0); }
                        25%      { transform: translateX(-8px) rotate(-2deg); }
                        75%      { transform: translateX(8px) rotate(2deg); }
                    }
                </style>

                <div style="background: rgba(0,0,0,0.5); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;
                            border: 1px solid ${primaryColor};">
                    <div id="cardRevealName"
                         style="color: ${primaryColor}; font-size: 20px;
                                font-weight: bold; margin-bottom: 8px;">
                    </div>
                    <div id="cardRevealDesc"
                         style="color: #fff; font-size: 13px;
                                line-height: 1.6; margin-bottom: 10px;">
                    </div>
                    <div id="cardRevealEffect"
                         style="color: #ffd966; font-size: 13px;
                                padding-top: 10px;
                                border-top: 1px solid rgba(255,255,255,0.1);">
                    </div>
                </div>

                <button id="cardRevealConfirmBtn"
                        style="background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd);
                               color: white; padding: 14px 40px; border: none;
                               border-radius: 30px; cursor: pointer;
                               font-size: 16px; font-weight: bold;
                               transition: all 0.2s ease;
                               box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                    ${config.confirmText || '💪 接受命運'}
                </button>

                <div style="margin-top: 10px; font-size: 11px; color: #90a4ae;">
                    ${config.hint || '💡 這張卡片的效果已經生效，點擊繼續遊戲'}
                </div>
            </div>
        `;
    }

    /**
     * Populate the modal with card data.
     */
    static populate(card, effectMessage, escapeHtml) {
        const imgEl = document.getElementById('cardRevealImg');
        const nameEl = document.getElementById('cardRevealName');
        const descEl = document.getElementById('cardRevealDesc');
        const effectEl = document.getElementById('cardRevealEffect');

        if (imgEl && card.image) {
            let url = card.image;
            if (url && !url.startsWith('http') && !url.startsWith('/')) {
                url = '/' + url;
            }
            imgEl.src = url;
            imgEl.onerror = () => {
                imgEl.style.display = 'none';
            };
        }

        if (nameEl) nameEl.textContent = card.name || '';

        // ✅ Show description (which is now the actual effect result)
        if (descEl) {
            // Replace \n with <br> for multi-line effect messages
            const descText = card.description || '';
            descEl.innerHTML = escapeHtml(descText).replace(/\n/g, '<br>');
        }

        // ✅ Only show separate effect box if effectMessage is different from description
        if (effectEl) {
            if (effectMessage && effectMessage !== card.description) {
                effectEl.innerHTML = `📌 ${escapeHtml(effectMessage).replace(/\n/g, '<br>')}`;
                effectEl.style.display = 'block';
            } else {
                effectEl.style.display = 'none';
            }
        }
    }

    /**
     * Bind the confirm button.
     */
    static bindConfirm(onConfirm) {
        const btn = document.getElementById('cardRevealConfirmBtn');
        if (btn) {
            btn.onclick = () => onConfirm();
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.03)';
                btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.6)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            };
        }
    }
    /**
     * Build a choice modal for hardship cards that offer optional actions (S19 etc).
     */
    static buildChoiceModal(cardName, baseEffect, choices, escapeHtml) {
        let choiceButtonsHtml = '';

        choices.forEach(c => {
            const disabled = !c.canAfford;
            const isSkip   = c.id === 'skip';

            const bgColor = isSkip
                ? '#9e9e9e'
                : disabled
                    ? '#666'
                    : 'linear-gradient(135deg, #4caf50, #388e3c)';

            choiceButtonsHtml += `
            <button class="hardship-choice-btn"
                    data-choice="${c.id}"
                    ${disabled ? 'disabled' : ''}
                    style="width: 100%;
                           background: ${bgColor};
                           color: white; padding: 14px; border: none;
                           border-radius: 12px;
                           cursor: ${disabled ? 'not-allowed' : 'pointer'};
                           opacity: ${disabled ? '0.5' : '1'};
                           font-size: 14px; font-weight: bold;
                           transition: all 0.2s ease;
                           text-align: left; margin-bottom: 8px;">
                <div style="font-size: 16px; margin-bottom: 4px;">
                    ${c.label}
                </div>
                <div style="font-size: 11px; opacity: 0.9;">
                    ${c.description}
                </div>
                ${!c.canAfford && c.cost > 0 ? `
                    <div style="font-size: 11px; color: #ff8a80; margin-top: 4px;">
                        ⚠️ 現金不足
                    </div>
                ` : ''}
            </button>
        `;
        });

        return `
        <div class="modal-content" style="max-width: 450px;
             background: linear-gradient(135deg, #1a0a0a, #2a0d0d);
             border-radius: 24px; padding: 24px;
             border: 2px solid #ff9800; text-align: center;">

            <div style="font-size: 22px; color: #ff9800; font-weight: bold;
                        margin-bottom: 8px;">
                ⚖️ ${escapeHtml(cardName)}
            </div>

            <div style="background: rgba(255,152,0,0.15); padding: 12px;
                        border-radius: 12px; margin-bottom: 14px;
                        color: #ffe0b2; font-size: 13px; line-height: 1.6;
                        border: 1px solid rgba(255,152,0,0.3);">
                ${escapeHtml(baseEffect)}
            </div>

            <div style="color: #ffd966; font-size: 14px; font-weight: bold;
                        margin-bottom: 12px;">
                📌 你可以選擇：
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${choiceButtonsHtml}
            </div>

            <div style="margin-top: 12px; font-size: 11px; color: #90a4ae;">
                💡 選擇後立即生效
            </div>
        </div>
    `;
    }

    /**
     * Bind choice buttons in the hardship choice modal.
     * @param {Function} onChoice - called with choice id string
     */
    static bindChoiceButtons(onChoice) {
        document.querySelectorAll('.hardship-choice-btn').forEach(btn => {
            if (btn.disabled) return;

            btn.onclick = () => onChoice(btn.dataset.choice);
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.02)';
                btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = 'none';
            };
        });
    }
}