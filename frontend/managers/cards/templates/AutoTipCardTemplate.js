"use strict";

export class AutoTipCardTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 500px;
                 background: linear-gradient(135deg, #4a2a5a, #2a1a3a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ba68c8;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #ce93d8; font-weight: bold;">
                        🎁 大學飯堂 - 錦囊卡
                    </div>
                    <div style="font-size: 12px; color: #e1bee7; margin-top: 4px;"
                         id="autoTipProgress">
                        <!-- filled dynamically -->
                    </div>
                </div>

                <div id="autoTipCardImage" style="text-align: center; margin: 15px 0;">
                    <img id="autoTipCardImg" src="" alt="錦囊卡"
                         style="max-width: 80%; max-height: 200px;
                                border-radius: 16px;
                                box-shadow: 0 8px 20px rgba(186,104,200,0.4);
                                border: 3px solid #ba68c8;">
                </div>

                <div style="background: rgba(186,104,200,0.15); padding: 16px;
                            border-radius: 14px; border: 1px solid rgba(186,104,200,0.3);
                            margin-bottom: 16px;">
                    <div style="text-align: center;">
                        <div id="autoTipCardName"
                             style="font-size: 20px; color: #ffd966; font-weight: bold;
                                    margin-bottom: 8px;">
                        </div>
                        <div id="autoTipCardDesc"
                             style="font-size: 13px; color: #e1bee7; line-height: 1.6;">
                        </div>
                        <div id="autoTipScopeBadge" style="margin-top: 10px;"></div>
                    </div>
                </div>

                <div id="autoTipResultBox" style="display: none;
                     background: rgba(76,175,80,0.15); padding: 12px;
                     border-radius: 12px; border: 1px solid rgba(76,175,80,0.3);
                     margin-bottom: 16px;">
                    <div style="text-align: center; color: #a5d6a7;
                                font-size: 13px; font-weight: bold;">
                        ✨ 執行結果
                    </div>
                    <div id="autoTipResultText"
                         style="color: #fff; font-size: 13px;
                                margin-top: 6px; text-align: center;">
                    </div>
                </div>

                <div style="text-align: center;">
                    <button id="autoTipNextBtn"
                            style="background: linear-gradient(135deg, #ba68c8, #8e24aa);
                                   color: white; padding: 14px 40px; border: none;
                                   border-radius: 30px; cursor: pointer;
                                   font-size: 16px; font-weight: bold;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 4px 12px rgba(186,104,200,0.4);
                                   display: inline-flex; align-items: center; gap: 8px;">
                        <span id="autoTipBtnText">🎁 執行並繼續</span>
                        <span style="font-size: 20px;">▶</span>
                    </button>
                </div>

                <div style="text-align: center; margin-top: 10px;
                            font-size: 11px; color: #b39ddb;">
                    💡 點擊按鈕執行此錦囊卡並查看下一張
                </div>
            </div>
        `;
    }

    /**
     * Show a card in the modal (before execution).
     */
    static showCard(card, cardIndex, totalCards, escapeHtml) {
        // Progress
        const progressEl = document.getElementById('autoTipProgress');
        if (progressEl) {
            progressEl.textContent = `第 ${cardIndex} 張，共 ${totalCards} 張`;
        }

        // Image
        const imgEl = document.getElementById('autoTipCardImg');
        if (imgEl) {
            let url = card.image || '';
            if (url && !url.startsWith('http') && !url.startsWith('/')) {
                url = '/' + url;
            }
            imgEl.src = url;
            imgEl.style.display = url ? 'inline-block' : 'none';
            imgEl.onerror = () => { imgEl.style.display = 'none'; };
        }

        // Name
        const nameEl = document.getElementById('autoTipCardName');
        if (nameEl) nameEl.textContent = card.name || '';

        // Description
        const descEl = document.getElementById('autoTipCardDesc');
        if (descEl) descEl.textContent = card.description || '';

        // Scope badge
        const badgeEl = document.getElementById('autoTipScopeBadge');
        if (badgeEl) {
            badgeEl.innerHTML = card.scope === 'team'
                ? '<span style="display: inline-block; padding: 4px 12px; background: #ff9800; color: white; border-radius: 12px; font-size: 11px;">🌟 團隊錦囊</span>'
                : '';
        }

        // Hide result box (this is the show-card phase)
        const resultBox = document.getElementById('autoTipResultBox');
        if (resultBox) resultBox.style.display = 'none';

        // Reset button text
        const btnText = document.getElementById('autoTipBtnText');
        if (btnText) {
            btnText.textContent = cardIndex < totalCards
                ? '🎁 執行並繼續'
                : '🎁 執行並完成';
        }
    }

    /**
     * Show execution result inside the modal (after execution).
     */
    static showResult(effectMessage, cardIndex, totalCards, escapeHtml) {
        const resultBox = document.getElementById('autoTipResultBox');
        const resultText = document.getElementById('autoTipResultText');

        if (resultBox) resultBox.style.display = 'block';
        if (resultText) resultText.textContent = effectMessage || '執行完成';

        // Update button
        const btnText = document.getElementById('autoTipBtnText');
        if (btnText) {
            btnText.textContent = cardIndex < totalCards
                ? '▶ 下一張'
                : '✅ 完成';
        }
    }

    static bindNextButton(onNext) {
        const btn = document.getElementById('autoTipNextBtn');
        if (btn) {
            btn.onclick = () => onNext();
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.03)';
                btn.style.boxShadow = '0 6px 18px rgba(186,104,200,0.6)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 12px rgba(186,104,200,0.4)';
            };
        }
    }

    static disableButton() {
        const btn = document.getElementById('autoTipNextBtn');
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    }

    static enableButton() {
        const btn = document.getElementById('autoTipNextBtn');
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    }
}