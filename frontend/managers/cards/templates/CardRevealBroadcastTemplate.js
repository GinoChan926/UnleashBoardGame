"use strict";

/**
 * Read-only modal shown to OTHER players when someone draws a card.
 * Auto-closes after 15 seconds or on click.
 */
export class CardRevealBroadcastTemplate {

    static CARD_STYLES = {
        opportunity:  { color: '#aa00ff', icon: '🎴', title: '機會卡',   subtitle: '購買了機會卡' },
        investment:   { color: '#ff6f00', icon: '🏗️', title: '投資卡',   subtitle: '啟動了投資項目' },
        dream:        { color: '#8e24aa', icon: '🌟', title: '夢想卡',   subtitle: '追逐夢想' },
        hardship:     { color: '#7f0000', icon: '💥', title: '逆境自強卡', subtitle: '面對逆境' },
        lier:         { color: '#dc143c', icon: '🎭', title: '騙子卡',   subtitle: '被騙子盯上了' },
        volunteer:    { color: '#4caf50', icon: '🤝', title: '義工卡',   subtitle: '參與義工活動' },
        police:       { color: '#2e7d32', icon: '👮', title: '警察卡',   subtitle: '收到警察卡' },
        awareness:    { color: '#ff9800', icon: '🧘', title: '察覺卡',   subtitle: '獲得察覺' },
        tip:          { color: '#00acc1', icon: '🎁', title: '錦囊卡',   subtitle: '獲得錦囊' },
        market_news:  { color: '#e91e63', icon: '📰', title: '市場消息', subtitle: '市場動態' },
        default:      { color: '#607d8b', icon: '📇', title: '卡片',     subtitle: '抽卡' }
    };

    /**
     * @param {object} data
     *   - playerName: who drew the card
     *   - card: { name, description, image, cardType, cardTypeName }
     *   - action: '抽到' | '購買了' | '啟動了' etc.
     *   - effectMessage: optional what happened
     */
    static buildModal(data) {
        const { playerName, card, action, effectMessage } = data;
        const style = this.CARD_STYLES[card?.cardType] || this.CARD_STYLES.default;

        return `
            <div class="modal-content" style="
                max-width: 460px;
                background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
                border-radius: 24px;
                padding: 24px;
                color: white;
                border: 3px solid ${style.color};
                box-shadow: 0 12px 32px ${style.color}66;
                text-align: center;
            ">
                <!-- Header -->
                <div style="font-size: 11px; color: ${style.color};
                            font-weight: bold; letter-spacing: 1px;
                            text-transform: uppercase; margin-bottom: 4px;">
                    👀 觀戰模式
                </div>

                <div style="font-size: 16px; color: #ffd966;
                            font-weight: bold; margin-bottom: 4px;">
                    ${this._escape(playerName)}
                </div>

                <div style="font-size: 12px; color: #b0bec5;
                            margin-bottom: 14px;">
                    ${action || style.subtitle}
                </div>

                <!-- Card image -->
                ${card.image ? `
                <div style="margin: 12px 0;">
                    <img src="${this._normalizeImg(card.image)}"
                         alt="${this._escape(card.name || '')}"
                         style="max-width: 100%; max-height: 200px;
                                border-radius: 14px;
                                border: 2px solid ${style.color};
                                box-shadow: 0 6px 18px rgba(0,0,0,0.4);"
                         onerror="this.style.display='none';">
                </div>
                ` : `
                <div style="font-size: 60px; margin: 12px 0;
                            filter: drop-shadow(0 4px 12px ${style.color}88);">
                    ${style.icon}
                </div>
                `}

                <!-- Card type badge -->
                <div style="display: inline-block; padding: 4px 12px;
                            border-radius: 20px;
                            background: ${style.color};
                            color: white;
                            font-size: 11px;
                            font-weight: bold;
                            margin-bottom: 10px;">
                    ${style.icon} ${style.title}
                </div>

                <!-- Card name -->
                <div style="font-size: 20px; font-weight: bold;
                            color: white; margin-bottom: 10px;
                            text-shadow: 0 2px 6px rgba(0,0,0,0.5);">
                    ${this._escape(card.name || '未知卡片')}
                </div>

                <!-- Description -->
                ${card.description ? `
                <div style="background: rgba(0,0,0,0.35);
                            padding: 12px;
                            border-radius: 12px;
                            font-size: 13px;
                            color: #e2e8f0;
                            line-height: 1.6;
                            margin-bottom: 12px;
                            border: 1px solid ${style.color}44;
                            white-space: pre-wrap;
                            text-align: left;">
                    ${this._escape(card.description)}
                </div>
                ` : ''}

                <!-- Effect message -->
                ${effectMessage ? `
                <div style="background: rgba(255,193,7,0.15);
                            padding: 10px;
                            border-radius: 10px;
                            font-size: 12px;
                            color: #ffd966;
                            margin-bottom: 12px;
                            border: 1px solid rgba(255,193,7,0.3);
                            white-space: pre-wrap;">
                    📌 ${this._escape(effectMessage)}
                </div>
                ` : ''}

                <button id="cardRevealBroadcastCloseBtn" style="
                    padding: 10px 24px;
                    background: linear-gradient(135deg, ${style.color}, ${style.color}dd);
                    border: none;
                    border-radius: 24px;
                    color: white;
                    font-weight: bold;
                    font-size: 13px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px ${style.color}66;
                ">
                    👍 收到
                </button>

                <div style="margin-top: 10px;
                            font-size: 11px;
                            color: #94a3b8;">
                    ⏰ <span id="cardRevealBroadcastCountdown">45</span> 秒後自動關閉
                </div>
            </div>
        `;
    }

    static bindEvents(onClose) {
        const btn = document.getElementById('cardRevealBroadcastCloseBtn');
        if (btn) btn.onclick = () => onClose();

        let remaining = 45;
        const countdownEl = document.getElementById('cardRevealBroadcastCountdown');

        const timerId = setInterval(() => {
            remaining--;
            if (countdownEl) countdownEl.textContent = remaining;
            if (remaining <= 0) {
                clearInterval(timerId);
                onClose();
            }
        }, 1000);

        return timerId;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    static _escape(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#39;');
    }

    static _normalizeImg(url) {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('/')) return url;
        return '/' + url;
    }
}