"use strict";

// ── Themes for win/loss ───────────────────────────────────────────────────────

const THEMES = {
    win: {
        color:         '#4caf50',
        gradientBg:    'linear-gradient(135deg, #1a3a1a, #2e7d32)',
        icon:          '🎉',
        titleText:     '大獎！',
        buttonText:    '🎊 太好了！',
        animation:     'bounce',
        boxShadow:     'rgba(76,175,80,0.4)',
        boxShadowHover:'rgba(76,175,80,0.6)'
    },
    loss: {
        color:         '#f44336',
        gradientBg:    'linear-gradient(135deg, #3a1a1a, #7f0000)',
        icon:          '😰',
        titleText:     '失敗！',
        buttonText:    '💪 下次再來',
        animation:     'shake',
        boxShadow:     'rgba(244,67,54,0.4)',
        boxShadowHover:'rgba(244,67,54,0.6)'
    }
};

// ── Template class ────────────────────────────────────────────────────────────

export class GambleResultTemplate {

    /**
     * Build the gamble result modal HTML.
     * @param {object} message - the gamble_result payload
     * @param {string} resultText - user-facing description of the outcome
     */
    static buildModal(message, resultText = '') {
        const won   = !!message.won;
        const theme = won ? THEMES.win : THEMES.loss;

        const imgUrl = this._resolveImageUrl(message.cardImage);

        return `
            <div class="modal-content" style="max-width: 480px;
                 background: ${theme.gradientBg};
                 border-radius: 24px; padding: 24px;
                 border: 3px solid ${theme.color};
                 text-align: center;">

                <!-- Icon -->
                <div style="font-size: 60px; margin-bottom: 8px;
                            animation: gamble${theme.animation === 'bounce' ? 'Bounce' : 'Shake'} 0.6s ease;">
                    ${theme.icon}
                </div>

                <!-- Title -->
                <div style="font-size: 26px; color: ${theme.color};
                            font-weight: bold; margin-bottom: 8px;
                            text-shadow: 0 2px 8px rgba(0,0,0,0.5);">
                    ${theme.titleText}
                </div>

                <!-- Card name -->
                <div style="font-size: 14px; color: #fff; margin-bottom: 14px;">
                    ${message.cardName || ''}
                </div>

                ${this._buildImageSection(imgUrl, message.cardName, theme, won)}

                <!-- Dice + results box -->
                <div style="background: rgba(0,0,0,0.4); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;
                            text-align: left; color: #fff; font-size: 14px;">
                    ${this._buildDiceSection(message, theme)}
                    ${this._buildResultsGrid(message, won)}
                </div>

                <!-- Result text -->
                ${resultText ? `
                    <div style="color: ${theme.color}; font-size: 13px;
                                margin-bottom: 14px; font-weight: bold;">
                        ${resultText}
                    </div>
                ` : ''}

                <!-- Close button -->
                <button id="gambleResultCloseBtn"
                        style="background: ${theme.color}; color: white;
                               padding: 12px 40px; border: none;
                               border-radius: 24px; cursor: pointer;
                               font-size: 15px; font-weight: bold;
                               box-shadow: 0 4px 14px ${theme.boxShadow};
                               transition: all 0.2s ease;"
                        data-shadow="${theme.boxShadow}"
                        data-shadow-hover="${theme.boxShadowHover}">
                    ${theme.buttonText}
                </button>
            </div>

            ${this._buildAnimations()}
        `;
    }

    /**
     * Bind the close button.
     */
    static bindClose(onClose) {
        const btn = document.getElementById('gambleResultCloseBtn');
        if (!btn) return;

        const shadow      = btn.dataset.shadow      || 'rgba(0,0,0,0.4)';
        const shadowHover = btn.dataset.shadowHover || 'rgba(0,0,0,0.6)';

        btn.onclick = () => onClose();
        btn.onmouseenter = () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = `0 6px 20px ${shadowHover}`;
        };
        btn.onmouseleave = () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = `0 4px 14px ${shadow}`;
        };
    }

    // ==================== Private helpers ====================

    static _resolveImageUrl(raw) {
        if (!raw) return '';
        let url = raw;
        if (!url.startsWith('http')) {
            url = url.replace(/^(\.\.\/)+/, '/');
            if (!url.startsWith('/')) url = '/' + url;
        }
        return url;
    }

    static _buildImageSection(imgUrl, cardName, theme, won) {
        if (!imgUrl) return '';

        return `
            <div style="margin-bottom: 14px;">
                <img src="${imgUrl}" alt="${cardName || ''}"
                     style="max-width: 70%; max-height: 160px;
                            border-radius: 12px;
                            border: 2px solid ${theme.color};
                            box-shadow: 0 6px 16px rgba(0,0,0,0.4);
                            ${won ? '' : 'filter: grayscale(50%);'}"
                     onerror="this.style.display='none';">
            </div>
        `;
    }

    static _buildDiceSection(message, theme) {
        const conditionText = message.successNumber
            ? `(需要點數 = ${message.successNumber} 才能贏)`
            : (message.multiplier
                ? `(點數 × $${message.multiplier.toLocaleString()})`
                : '');

        return `
            <div style="text-align: center; font-size: 42px;
                        color: ${theme.color}; font-weight: bold;
                        margin-bottom: 10px;">
                🎲 ${message.diceRoll}
            </div>
            ${conditionText ? `
                <div style="text-align: center; font-size: 12px;
                            color: #b0bec5; margin-bottom: 12px;">
                    ${conditionText}
                </div>
            ` : ''}
        `;
    }

    static _buildResultsGrid(message, won) {
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr;
                        gap: 6px; padding-top: 10px;
                        border-top: 1px solid rgba(255,255,255,0.15);">

                <div>💰 投入:</div>
                <div style="text-align: right; color: #ff9800;">
                    -$${(message.cost || 0).toLocaleString()}
                </div>

                ${won && message.winAmount > 0 ? `
                    <div>🎁 獲得:</div>
                    <div style="text-align: right; color: #4caf50;">
                        +$${message.winAmount.toLocaleString()}
                    </div>
                ` : ''}

                <div style="padding-top: 6px;
                            border-top: 1px solid rgba(255,255,255,0.15);">
                    📊 淨結果:
                </div>
                <div style="text-align: right; padding-top: 6px;
                            border-top: 1px solid rgba(255,255,255,0.15);
                            color: ${message.netProfit >= 0 ? '#4caf50' : '#ff5252'};
                            font-weight: bold;">
                    ${message.netProfit >= 0 ? '+' : ''}$${(message.netProfit || 0).toLocaleString()}
                </div>
            </div>
        `;
    }

    static _buildAnimations() {
        return `
            <style>
                @keyframes gambleBounce {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-20px); }
                }
                @keyframes gambleShake {
                    0%, 100% { transform: translateX(0); }
                    20%      { transform: translateX(-8px); }
                    40%      { transform: translateX(8px); }
                    60%      { transform: translateX(-6px); }
                    80%      { transform: translateX(6px); }
                }
            </style>
        `;
    }
}