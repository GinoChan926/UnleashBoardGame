"use strict";

export class TeamCardTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 500px;
                 background: linear-gradient(135deg, #1a3a5a, #0d2b47);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #42a5f5;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 22px; color: #4fc3f7; font-weight: bold;">
                        👥 團隊錦囊卡
                    </div>
                    <div id="teamCardInitiator"
                         style="font-size: 12px; color: #b3e5fc; margin-top: 4px;">
                    </div>
                </div>

                <div id="teamCardImage" style="text-align: center; margin: 12px 0;">
                    <img id="teamCardImg" src=""
                         style="max-width: 70%; max-height: 180px;
                                border-radius: 12px;
                                box-shadow: 0 6px 16px rgba(66,165,245,0.4);
                                border: 3px solid #42a5f5;">
                </div>

                <div style="background: rgba(66,165,245,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;">
                    <div style="text-align: center;">
                        <div id="teamCardName"
                             style="font-size: 18px; color: #ffd966;
                                    font-weight: bold; margin-bottom: 6px;">
                        </div>
                        <div id="teamCardDesc"
                             style="font-size: 13px; color: #b3e5fc;
                                    line-height: 1.6;">
                        </div>
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.4); padding: 8px;
                            border-radius: 8px; margin-bottom: 14px; text-align: center;">
                    <span style="color: #ffab00; font-size: 12px;">
                        ⏰ 剩餘時間: <span id="teamCardCountdown">30</span> 秒
                    </span>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button id="teamCardDeclineBtn"
                            style="flex: 1; background: #9e9e9e; color: white;
                                   padding: 12px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;">
                        ❌ 不參與
                    </button>
                    <button id="teamCardParticipateBtn"
                            style="flex: 1; background: linear-gradient(135deg, #42a5f5, #1e88e5);
                                   color: white; padding: 12px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;
                                   box-shadow: 0 4px 12px rgba(66,165,245,0.3);">
                        ✅ 參與
                    </button>
                </div>
            </div>
        `;
    }

    static populate(message, escapeHtml) {
        const nameEl        = document.getElementById('teamCardName');
        const descEl        = document.getElementById('teamCardDesc');
        const imgEl         = document.getElementById('teamCardImg');
        const initiatorEl   = document.getElementById('teamCardInitiator');

        const card = message.card;
        if (nameEl) nameEl.textContent = card.name || '';
        if (descEl) descEl.textContent = card.description || '';
        if (initiatorEl) {
            initiatorEl.textContent = message.isInitiator
                ? '你發起了此團隊錦囊'
                : `發起人: ${message.initiator}`;
        }

        if (imgEl && card.image) {
            let url = card.image;
            if (url && !url.startsWith('http') && !url.startsWith('/')) {
                url = '/' + url;
            }
            imgEl.src = url;
            imgEl.onerror = () => { imgEl.style.display = 'none'; };
        }
    }

    static bindButtons(onParticipate, onDecline) {
        const partBtn = document.getElementById('teamCardParticipateBtn');
        const declBtn = document.getElementById('teamCardDeclineBtn');

        if (partBtn) {
            partBtn.onclick = () => onParticipate();
            partBtn.onmouseenter = () => {
                partBtn.style.transform = 'scale(1.03)';
                partBtn.style.boxShadow = '0 6px 18px rgba(66,165,245,0.5)';
            };
            partBtn.onmouseleave = () => {
                partBtn.style.transform = 'scale(1)';
                partBtn.style.boxShadow = '0 4px 12px rgba(66,165,245,0.3)';
            };
        }

        if (declBtn) {
            declBtn.onclick = () => onDecline();
            declBtn.onmouseenter = () => { declBtn.style.transform = 'scale(1.03)'; };
            declBtn.onmouseleave = () => { declBtn.style.transform = 'scale(1)'; };
        }
    }

    static startCountdown(seconds, onExpire) {
        const el = document.getElementById('teamCardCountdown');
        if (!el) return null;

        let remaining = seconds;
        el.textContent = remaining;

        return setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                if (onExpire) onExpire();
                return;
            }
            if (el) el.textContent = remaining;
        }, 1000);
    }

    static disableButtons() {
        ['teamCardParticipateBtn', 'teamCardDeclineBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        });
    }
}