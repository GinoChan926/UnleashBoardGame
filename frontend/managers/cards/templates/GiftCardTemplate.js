"use strict";

export class GiftCardTemplate {

    static buildModal(otherPlayers, escapeHtml) {
        let playerButtonsHtml = '';

        otherPlayers.forEach(p => {
            playerButtonsHtml += `
                <button class="gift-player-btn"
                        data-player-id="${p.playerId}"
                        data-player-name="${escapeHtml(p.playerName)}"
                        style="width: 100%;
                               background: linear-gradient(135deg, #ff9800, #f57c00);
                               color: white; padding: 14px; border: none;
                               border-radius: 12px; cursor: pointer;
                               font-size: 15px; font-weight: bold;
                               transition: all 0.2s ease;
                               margin-bottom: 8px;
                               box-shadow: 0 4px 12px rgba(255,152,0,0.3);
                               display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">👤</span>
                    <span>${escapeHtml(p.playerName)}</span>
                </button>
            `;
        });

        return `
            <div class="modal-content" style="max-width: 420px;
                 background: linear-gradient(135deg, #4a2a1a, #2a1510);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ff9800;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #ff9800; font-weight: bold;">
                        🌹 贈人玫瑰
                    </div>
                    <div style="font-size: 12px; color: #ffe0b2; margin-top: 4px;">
                        選擇要贈送機會卡的玩家
                    </div>
                </div>

                <div style="background: rgba(255,152,0,0.15); padding: 12px;
                            border-radius: 12px; margin-bottom: 16px;
                            text-align: center; color: #ffe0b2; font-size: 13px;
                            border: 1px solid rgba(255,152,0,0.3);">
                    🎁 你將贈送一張機會卡給選中的玩家
                </div>

                <div id="giftPlayerList" style="display: flex; flex-direction: column;
                     gap: 8px; margin-bottom: 16px;">
                    ${playerButtonsHtml}
                </div>

                <div style="text-align: center;">
                    <button id="giftCardCancelBtn"
                            style="background: #9e9e9e; color: white;
                                   padding: 10px 30px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 14px; transition: all 0.2s ease;">
                        取消
                    </button>
                </div>
            </div>
        `;
    }

    static bindButtons(onSelect, onCancel) {
        document.querySelectorAll('.gift-player-btn').forEach(btn => {
            btn.onclick = () => onSelect(btn.dataset.playerId, btn.dataset.playerName);
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.02)';
                btn.style.boxShadow = '0 6px 18px rgba(255,152,0,0.5)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 12px rgba(255,152,0,0.3)';
            };
        });

        const cancelBtn = document.getElementById('giftCardCancelBtn');
        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
            cancelBtn.onmouseenter = () => { cancelBtn.style.transform = 'scale(1.02)'; };
            cancelBtn.onmouseleave = () => { cancelBtn.style.transform = 'scale(1)'; };
        }
    }
}