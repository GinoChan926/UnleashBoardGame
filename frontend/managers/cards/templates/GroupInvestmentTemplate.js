"use strict";

export class GroupInvestmentTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 520px;
                 background: linear-gradient(135deg, #1a3a2b, #0d2b1a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ff6f00;">

                <div style="text-align: center; margin-bottom: 14px;">
                    <div style="font-size: 22px; color: #ff9800; font-weight: bold;">
                        🏗️ 團購投資
                    </div>
                    <div id="groupInvInitiator"
                         style="font-size: 12px; color: #ffcc80; margin-top: 4px;">
                    </div>
                </div>

                <div id="groupInvCardImage" style="text-align: center; margin: 10px 0;">
                    <img id="groupInvImg" src=""
                         style="max-width: 60%; max-height: 140px;
                                border-radius: 12px;
                                border: 3px solid #ff6f00;">
                </div>

                <div style="background: rgba(255,111,0,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;
                            border: 1px solid rgba(255,111,0,0.3);">
                    <div id="groupInvCardName"
                         style="color: #ffd966; font-size: 18px;
                                font-weight: bold; text-align: center;
                                margin-bottom: 8px;">
                    </div>
                    <div id="groupInvCardDesc"
                         style="color: #ffe0b2; font-size: 12px;
                                line-height: 1.6; text-align: center;">
                    </div>

                    <div id="groupInvStats"
                         style="display: grid; grid-template-columns: 1fr 1fr;
                                gap: 6px; margin-top: 10px; font-size: 12px;
                                color: #b0bec5;">
                    </div>
                </div>

                <div id="groupInvEnergyNotice"
                     style="display: none; background: rgba(255,152,0,0.15);
                            padding: 8px; border-radius: 8px;
                            margin-bottom: 12px; text-align: center;
                            color: #ffab00; font-size: 12px;
                            border: 1px solid rgba(255,152,0,0.3);">
                </div>

                <div style="margin-bottom: 14px;">
                    <label style="color: #ffe0b2; font-size: 13px;
                                  display: block; margin-bottom: 6px;">
                        📊 你要投資幾份？(0 = 不參與)
                    </label>
                    <input type="number" id="groupInvUnitsInput"
                           min="0" value="0"
                           style="width: 100%; padding: 12px;
                                  border-radius: 10px; border: 2px solid #ff6f00;
                                  background: rgba(0,0,0,0.4); color: #fff;
                                  font-size: 18px; text-align: center;
                                  box-sizing: border-box;">
                </div>

                <div id="groupInvCostDisplay"
                     style="text-align: center; color: #ffd966; font-size: 14px;
                            margin-bottom: 12px;">
                </div>

                <div style="background: rgba(0,0,0,0.4); padding: 8px;
                            border-radius: 8px; margin-bottom: 14px; text-align: center;">
                    <span style="color: #ffab00; font-size: 12px;">
                        ⏰ 剩餘時間: <span id="groupInvCountdown">45</span> 秒
                    </span>
                </div>

                <button id="groupInvSubmitBtn"
                        style="width: 100%; background: linear-gradient(135deg, #ff6f00, #e65100);
                               color: white; padding: 14px; border: none;
                               border-radius: 24px; cursor: pointer;
                               font-size: 16px; font-weight: bold;
                               box-shadow: 0 4px 12px rgba(255,111,0,0.3);">
                    ✅ 確認
                </button>
            </div>
        `;
    }

    static populate(message, escapeHtml) {
        const card = message.card;

        // Initiator label
        const initEl = document.getElementById('groupInvInitiator');
        if (initEl) {
            initEl.textContent = message.isInitiator
                ? '你發起了此投資'
                : `發起人: ${message.initiatorName}`;
        }

        // Image
        const imgEl = document.getElementById('groupInvImg');
        if (imgEl && card.image) {
            let url = card.image;
            if (url && !url.startsWith('http') && !url.startsWith('/')) url = '/' + url;
            imgEl.src = url;
            imgEl.onerror = () => { imgEl.style.display = 'none'; };
        }

        // Name + desc
        const nameEl = document.getElementById('groupInvCardName');
        const descEl = document.getElementById('groupInvCardDesc');
        if (nameEl) nameEl.textContent = card.name || '';
        if (descEl) descEl.textContent = card.description || '';

        // Stats grid
        const statsEl = document.getElementById('groupInvStats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div>💰 每份價格: <span style="color: #ffd966;">$${message.unitPrice.toLocaleString()}</span></div>
                <div>📈 每份月回報: <span style="color: #81c784;">$${message.unitReturn.toLocaleString()}</span></div>
                <div>💵 你的現金: <span style="color: #fff;">$${message.playerCash.toLocaleString()}</span></div>
                <div>⚡ 你的精力: <span style="color: #fff;">${message.playerEnergy}</span></div>
            `;
        }

        // Energy notice for non-initiators
        if (!message.isInitiator && message.energyCostToJoin > 0) {
            const noticeEl = document.getElementById('groupInvEnergyNotice');
            if (noticeEl) {
                noticeEl.style.display = 'block';
                noticeEl.innerHTML = `⚡ 參與需額外支付 ${message.energyCostToJoin} 精力給發起人 ${escapeHtml(message.initiatorName)}`;
            }
        }

        // Cost display update on input change
        const input   = document.getElementById('groupInvUnitsInput');
        const costEl  = document.getElementById('groupInvCostDisplay');

        const updateCost = () => {
            const units = parseInt(input?.value) || 0;
            const total = units * message.unitPrice;
            if (costEl) {
                if (units === 0) {
                    costEl.textContent = '不參與投資';
                    costEl.style.color = '#90a4ae';
                } else {
                    costEl.innerHTML = `總花費: <strong>$${total.toLocaleString()}</strong>`;
                    costEl.style.color = total > message.playerCash ? '#ff5252' : '#ffd966';
                }
            }
        };

        if (input) {
            input.oninput = updateCost;
            updateCost();  // initial display
        }
    }

    static bindSubmit(groupId, unitPrice, playerCash, playerEnergy, energyCostToJoin, isInitiator, onSubmit) {
        const btn   = document.getElementById('groupInvSubmitBtn');
        const input = document.getElementById('groupInvUnitsInput');

        if (btn) {
            btn.onclick = () => {
                const units = parseInt(input?.value) || 0;

                if (units > 0) {
                    const totalCost = units * unitPrice;
                    if (totalCost > playerCash) {
                        alert(`現金不足！需要 $${totalCost.toLocaleString()}，你只有 $${playerCash.toLocaleString()}`);
                        return;
                    }
                    if (!isInitiator && playerEnergy < energyCostToJoin) {
                        alert(`精力不足！需要 ${energyCostToJoin} 精力支付給發起人`);
                        return;
                    }
                }

                onSubmit(units);
            };

            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.02)';
                btn.style.boxShadow = '0 6px 18px rgba(255,111,0,0.5)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 12px rgba(255,111,0,0.3)';
            };
        }
    }

    static startCountdown(seconds, onExpire) {
        const el = document.getElementById('groupInvCountdown');
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

    static disableSubmit() {
        const btn = document.getElementById('groupInvSubmitBtn');
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    }
}