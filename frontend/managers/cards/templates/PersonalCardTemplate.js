"use strict";

export class PersonalCardTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 480px;
                 background: linear-gradient(135deg, #4a2a5a, #2a1a3a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ba68c8;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 22px; color: #ce93d8; font-weight: bold;">
                        📜 個人錦囊卡
                    </div>
                    <div style="font-size: 11px; color: #b39ddb; margin-top: 4px;">
                        只有你能看到這張卡片
                    </div>
                </div>

                <div id="personalCardImage" style="text-align: center; margin: 12px 0;">
                    <img id="personalCardImg" src=""
                         style="max-width: 70%; max-height: 180px;
                                border-radius: 12px;
                                box-shadow: 0 6px 16px rgba(186,104,200,0.4);
                                border: 3px solid #ba68c8;">
                </div>

                <div style="background: rgba(186,104,200,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;">
                    <div style="text-align: center;">
                        <div id="personalCardName"
                             style="font-size: 18px; color: #ffd966;
                                    font-weight: bold; margin-bottom: 6px;">
                        </div>
                        <div id="personalCardDesc"
                             style="font-size: 13px; color: #e1bee7;
                                    line-height: 1.6;">
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button id="personalCardDeclineBtn"
                            style="flex: 1; background: #9e9e9e; color: white;
                                   padding: 12px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;">
                        ❌ 不執行
                    </button>
                    <button id="personalCardExecuteBtn"
                            style="flex: 1; background: linear-gradient(135deg, #ba68c8, #8e24aa);
                                   color: white; padding: 12px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;
                                   box-shadow: 0 4px 12px rgba(186,104,200,0.3);">
                        ✅ 執行
                    </button>
                </div>

                <div style="text-align: center; font-size: 11px; color: #b39ddb; margin-top: 10px;">
                    💡 不執行的話 500 元購買費不退還
                </div>
            </div>
        `;
    }

    static populate(card, escapeHtml) {
        const nameEl = document.getElementById('personalCardName');
        const descEl = document.getElementById('personalCardDesc');
        const imgEl  = document.getElementById('personalCardImg');

        if (nameEl) nameEl.textContent = card.name || '';
        if (descEl) descEl.textContent = card.description || '';

        if (imgEl && card.image) {
            let url = card.image;
            if (url && !url.startsWith('http') && !url.startsWith('/')) {
                url = '/' + url;
            }
            imgEl.src = url;
            imgEl.onerror = () => { imgEl.style.display = 'none'; };
        }
    }

    static bindButtons(onExecute, onDecline) {
        const execBtn = document.getElementById('personalCardExecuteBtn');
        const declineBtn = document.getElementById('personalCardDeclineBtn');

        if (execBtn) {
            execBtn.onclick = () => onExecute();
            execBtn.onmouseenter = () => {
                execBtn.style.transform = 'scale(1.03)';
                execBtn.style.boxShadow = '0 6px 18px rgba(186,104,200,0.5)';
            };
            execBtn.onmouseleave = () => {
                execBtn.style.transform = 'scale(1)';
                execBtn.style.boxShadow = '0 4px 12px rgba(186,104,200,0.3)';
            };
        }

        if (declineBtn) {
            declineBtn.onclick = () => onDecline();
            declineBtn.onmouseenter = () => { declineBtn.style.transform = 'scale(1.03)'; };
            declineBtn.onmouseleave = () => { declineBtn.style.transform = 'scale(1)'; };
        }
    }
}