"use strict";

export class AuxiliaryPoliceTemplate {

    /**
     * Build the full modal HTML for the auxiliary police choice.
     * @param {object} card          - the police card data
     * @param {Array}  otherPlayers  - [{playerId, playerName}, ...]
     * @param {Function} escapeHtml  - string sanitiser
     * @returns {string} modal inner HTML
     */
    static build(card, otherPlayers, escapeHtml) {
        return `
            <div class="modal-content" style="max-width: 480px;
                 background: linear-gradient(135deg, #0d1b2a, #1a2a3a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #1565c0;">

                ${this._buildTitle()}
                ${this._buildCardImage(card)}
                ${this._buildCardInfo(card, escapeHtml)}
                ${this._buildChoiceSection(otherPlayers, escapeHtml)}
                ${this._buildHint()}
            </div>
        `;
    }

    // ── Private sections ──────────────────────────────────────────────────

    static _buildTitle() {
        return `
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 24px; color: #42a5f5; font-weight: bold;">
                    👮 輔警 - 警察卡選擇
                </div>
                <div style="font-size: 12px; color: #888; margin-top: 4px;">
                    你的輔警身份讓你獲得了一張警察卡
                </div>
            </div>
        `;
    }

    static _buildCardImage(card) {
        if (!card.image) return '';

        let imageUrl = card.image;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = '/' + imageUrl;
        }

        return `
            <div style="text-align: center; margin: 15px 0;">
                <img src="${imageUrl}" alt="警察卡"
                     style="max-width: 80%; max-height: 200px; border-radius: 16px;
                            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                            border: 3px solid #1565c0;"
                     onerror="this.style.display='none';">
            </div>
        `;
    }

    static _buildCardInfo(card, escapeHtml) {
        return `
            <div style="background: rgba(21,101,192,0.15); padding: 16px;
                        border-radius: 16px; border: 1px solid rgba(21,101,192,0.3);
                        margin-bottom: 16px;">
                <div style="text-align: center;">
                    <div style="font-size: 20px; color: #42a5f5; font-weight: bold;
                                margin-bottom: 8px;">
                        ${escapeHtml(card.name)}
                    </div>
                    <div style="font-size: 13px; color: #b0bec5; line-height: 1.6;">
                        ${escapeHtml(card.description || '')}
                    </div>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <span style="display: inline-block; padding: 4px 14px;
                                 border-radius: 20px; font-size: 12px;
                                 background: #1565c0; color: white;">
                        👮 警察卡
                    </span>
                </div>
            </div>
        `;
    }

    static _buildChoiceSection(otherPlayers, escapeHtml) {
        return `
            <div style="background: rgba(0,0,0,0.3); padding: 16px;
                        border-radius: 16px; margin-bottom: 16px;">
                <div style="text-align: center; color: #ffd966; font-size: 15px;
                            font-weight: bold; margin-bottom: 14px;">
                    📌 請選擇使用方式：
                </div>

                ${this._buildSelfButton()}
                ${this._buildDivider()}
                ${this._buildOtherPlayersButtons(otherPlayers, escapeHtml)}
            </div>
        `;
    }

    static _buildSelfButton() {
        return `
            <button id="auxPoliceSelfBtn"
                    style="width: 100%; background: linear-gradient(135deg, #4caf50, #388e3c);
                           color: white; padding: 14px 20px; border: none;
                           border-radius: 12px; font-size: 16px; cursor: pointer;
                           transition: all 0.2s ease;
                           box-shadow: 0 4px 12px rgba(76,175,80,0.3);
                           display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span style="font-size: 20px;">✅</span>
                <span>自己使用此警察卡</span>
            </button>
        `;
    }

    static _buildDivider() {
        return `
            <div style="display: flex; align-items: center; gap: 10px; margin: 14px 0;">
                <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
                <span style="color: #666; font-size: 12px;">或</span>
                <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
            </div>
        `;
    }

    static _buildOtherPlayersButtons(otherPlayers, escapeHtml) {
        if (otherPlayers.length === 0) {
            return `
                <div style="text-align: center; color: #888; font-size: 13px; margin-top: 10px;">
                    目前沒有其他玩家在線，只能自己使用
                </div>
            `;
        }

        let html = `
            <div style="margin-top: 12px;">
                <div style="text-align: center; color: #ff9800; font-size: 14px; margin-bottom: 10px;">
                    🎯 或選擇強制給予其他玩家：
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;

        otherPlayers.forEach(p => {
            html += `
                <button class="aux-police-give-btn"
                        data-player-id="${p.playerId}"
                        data-player-name="${escapeHtml(p.playerName)}"
                        style="background: linear-gradient(135deg, #ff9800, #f57c00);
                               color: white; padding: 12px 20px; border: none;
                               border-radius: 12px; font-size: 15px; cursor: pointer;
                               transition: all 0.2s ease;
                               box-shadow: 0 4px 12px rgba(255,152,0,0.3);">
                    🎯 強制給予 ${escapeHtml(p.playerName)}
                </button>
            `;
        });

        html += `</div></div>`;
        return html;
    }

    static _buildHint() {
        return `
            <div style="text-align: center; font-size: 11px; color: #666;">
                💡 自己使用可獲得警察卡效果；強制給予其他玩家則由對方獲得效果
            </div>
        `;
    }

    // ── Event binding ─────────────────────────────────────────────────────

    /**
     * Bind click events to the modal buttons.
     * @param {Function} onSelf       - called when player chooses self
     * @param {Function} onGive       - called with (playerId, playerName) when giving
     */
    static bindEvents(onSelf, onGive) {
        const selfBtn = document.getElementById('auxPoliceSelfBtn');
        if (selfBtn) {
            selfBtn.onmouseenter = () => {
                selfBtn.style.transform = 'scale(1.02)';
                selfBtn.style.boxShadow = '0 6px 20px rgba(76,175,80,0.4)';
            };
            selfBtn.onmouseleave = () => {
                selfBtn.style.transform = 'scale(1)';
                selfBtn.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)';
            };
            selfBtn.onclick = () => onSelf();
        }

        document.querySelectorAll('.aux-police-give-btn').forEach(btn => {
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.02)';
                btn.style.boxShadow = '0 6px 20px rgba(255,152,0,0.4)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 12px rgba(255,152,0,0.3)';
            };
            btn.onclick = () => {
                onGive(btn.dataset.playerId, btn.dataset.playerName);
            };
        });
    }
}