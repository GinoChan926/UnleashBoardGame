"use strict";

export class PoliceFineTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 480px;
                 background: linear-gradient(135deg, #3a1a1a, #2a0d0d);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #f44336;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #ff8a80; font-weight: bold;">
                        👮 舉報違法
                    </div>
                    <div id="policeFineHint"
                         style="font-size: 12px; color: #ffcdd2; margin-top: 4px;">
                    </div>
                </div>

                <div style="background: rgba(244,67,54,0.15); padding: 12px;
                            border-radius: 12px; margin-bottom: 14px; text-align: center;
                            border: 1px solid rgba(244,67,54,0.3);">
                    <div style="color: #fff; font-size: 13px;">選擇要舉報的玩家</div>
                    <div style="color: #ff8a80; font-size: 20px; font-weight: bold;
                                margin-top: 6px;">
                        💰 罰款 $<span id="policeFineAmount">5,000</span>
                    </div>
                </div>

                <div id="policeFinePlayerList"
                     style="display: flex; flex-direction: column; gap: 10px;
                            margin-bottom: 16px;">
                </div>

                <div style="text-align: center;">
                    <button id="policeFineCancelBtn"
                            style="background: #9e9e9e; color: white; padding: 10px 30px;
                                   border: none; border-radius: 24px; cursor: pointer;
                                   font-size: 14px;">
                        取消
                    </button>
                </div>
            </div>
        `;
    }

    static populate(message, escapeHtml) {
        const hintEl = document.getElementById('policeFineHint');
        if (hintEl) hintEl.textContent = '選擇一位玩家舉報';

        const amountEl = document.getElementById('policeFineAmount');
        if (amountEl) amountEl.textContent = (message.amount || 5000).toLocaleString();

        const listEl = document.getElementById('policeFinePlayerList');
        if (!listEl) return;
        listEl.innerHTML = '';

        if (!message.otherPlayers || message.otherPlayers.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; color: #ffcdd2; padding: 20px;">
                    無其他玩家可以舉報
                </div>
            `;
            return;
        }

        message.otherPlayers.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'police-fine-player-btn';
            btn.dataset.playerId = p.playerId;
            btn.dataset.playerName = p.playerName;

            const cashColor = p.cash >= (message.amount || 5000) ? '#81c784' : '#ffab00';

            btn.style.cssText = `
                background: linear-gradient(135deg, #3a2a2a, #2a1a1a);
                color: white; padding: 12px; border: 2px solid #f44336;
                border-radius: 12px; cursor: pointer; font-size: 14px;
                transition: all 0.2s ease;
                display: flex; justify-content: space-between; align-items: center;
            `;
            btn.innerHTML = `
                <span>👤 ${escapeHtml(p.playerName)}</span>
                <span style="font-size: 11px; color: ${cashColor};">
                    💵 $${p.cash.toLocaleString()}
                </span>
            `;

            listEl.appendChild(btn);
        });
    }

    static bindPlayerSelect(onSelect) {
        document.querySelectorAll('.police-fine-player-btn').forEach(btn => {
            btn.onclick = () => {
                const playerId   = btn.dataset.playerId;
                const playerName = btn.dataset.playerName;
                if (confirm(`確認舉報 ${playerName} 嗎？對方將被罰款！`)) {
                    onSelect(playerId, playerName);
                }
            };
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.02)';
                btn.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
                btn.style.borderColor = '#ff8a80';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.background = 'linear-gradient(135deg, #3a2a2a, #2a1a1a)';
                btn.style.borderColor = '#f44336';
            };
        });
    }

    static bindCancel(onCancel) {
        const btn = document.getElementById('policeFineCancelBtn');
        if (btn) {
            btn.onclick = () => onCancel();
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.02)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        }
    }
}