"use strict";

export class GroupFinanceTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 480px;
                 background: linear-gradient(135deg, #1a3a5c, #0d2b47);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #2196f3;">

                <div style="text-align: center; margin-bottom: 14px;">
                    <div style="font-size: 22px; color: #4fc3f7; font-weight: bold;">
                        📊 團購金融
                    </div>
                    <div id="groupFinInitiator"
                         style="font-size: 12px; color: #b3e5fc; margin-top: 4px;">
                    </div>
                    <div id="groupFinInitiatorStatus"
                         style="font-size: 12px; margin-top: 4px;">
                    </div>
                </div>

                <div style="background: rgba(66,165,245,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;
                            border: 1px solid rgba(66,165,245,0.3);">
                    <div id="groupFinCardName"
                         style="color: #ffd966; font-size: 18px;
                                font-weight: bold; text-align: center;
                                margin-bottom: 8px;">
                    </div>
                    <div id="groupFinStats"
                         style="display: grid; grid-template-columns: 1fr 1fr;
                                gap: 6px; font-size: 12px; color: #b0bec5;">
                    </div>
                </div>

                <div style="background: rgba(255,152,0,0.15); padding: 8px;
                            border-radius: 8px; margin-bottom: 12px;
                            text-align: center; color: #ffab00; font-size: 12px;
                            border: 1px solid rgba(255,152,0,0.3);">
                    ⚡ 參與需支付 1 精力給發起人
                </div>

                <div style="margin-bottom: 14px;">
                    <label id="groupFinTradeHint"
                           style="color: #b3e5fc; font-size: 13px;
                                  display: block; margin-bottom: 6px;">
                        買入數量 (0 = 不參與)
                    </label>
                    <input type="number" id="groupFinUnitsInput"
                           min="0" value="0"
                           style="width: 100%; padding: 12px;
                                  border-radius: 10px; border: 2px solid #2196f3;
                                  background: rgba(0,0,0,0.4); color: #fff;
                                  font-size: 18px; text-align: center;
                                  box-sizing: border-box;">
                </div>

                <div id="groupFinCostDisplay"
                     style="text-align: center; color: #ffd966; font-size: 14px;
                            margin-bottom: 12px;">
                </div>

                <div style="background: rgba(0,0,0,0.4); padding: 8px;
                            border-radius: 8px; margin-bottom: 14px; text-align: center;">
                    <span style="color: #ffab00; font-size: 12px;">
                        ⏰ 剩餘時間: <span id="groupFinCountdown">45</span> 秒
                    </span>
                </div>

                <button id="groupFinSubmitBtn"
                        style="width: 100%; background: linear-gradient(135deg, #2196f3, #1565c0);
                               color: white; padding: 14px; border: none;
                               border-radius: 24px; cursor: pointer;
                               font-size: 16px; font-weight: bold;
                               box-shadow: 0 4px 12px rgba(33,150,243,0.3);">
                    ✅ 確認
                </button>
            </div>
        `;
    }

    static populate(message, escapeHtml) {
        const initEl = document.getElementById('groupFinInitiator');
        if (initEl) initEl.textContent = `發起人: ${message.initiatorName}`;

        // Show whether initiator bought or not
        const statusEl = document.getElementById('groupFinInitiatorStatus');
        if (statusEl) {
            if (message.initiatorBought) {
                statusEl.textContent = `✅ ${message.initiatorName} 已買入`;
                statusEl.style.color = '#4caf50';
            } else {
                statusEl.textContent = `⏭️ ${message.initiatorName} 選擇不買`;
                statusEl.style.color = '#ff9800';
            }
        }

        const nameEl = document.getElementById('groupFinCardName');
        if (nameEl) nameEl.textContent = `${message.cardName} (${message.cardCode})`;

        const statsEl = document.getElementById('groupFinStats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div>💰 價格: <span style="color: #ffd966;">$${message.currentPrice}/${message.unit}</span></div>
                <div>📊 最小: <span style="color: #fff;">${message.minTrade} ${message.unit}</span></div>
                <div>💵 你的現金: <span style="color: #fff;">$${message.playerCash.toLocaleString()}</span></div>
                <div>⚡ 你的精力: <span style="color: #fff;">${message.playerEnergy}</span></div>
            `;
        }

        const input  = document.getElementById('groupFinUnitsInput');
        const costEl = document.getElementById('groupFinCostDisplay');

        if (input) {
            const multiple = message.multiple || 1;
            const minTrade = message.minTrade || multiple;

            input.min   = 0;
            input.step  = multiple;
            input.value = 0;

            // Update trade hint label
            const hintEl = document.getElementById('groupFinTradeHint');
            if (hintEl) {
                hintEl.textContent = `買入數量（${multiple} ${message.unit}的倍數，最少 ${minTrade} ${message.unit}，0 = 不參與）`;
            }

            input.oninput = () => {
                let units = parseInt(input.value) || 0;

                // Enforce multiple rule (snap to nearest valid multiple)
                if (units > 0) {
                    if (units < minTrade) {
                        units = minTrade;
                        input.value = units;
                    }
                    if (units % multiple !== 0) {
                        units = Math.round(units / multiple) * multiple;
                        if (units < minTrade) units = minTrade;
                        input.value = units;
                    }
                }

                const total = units * message.currentPrice;
                if (costEl) {
                    if (units === 0) {
                        costEl.textContent = '不參與';
                        costEl.style.color = '#ffd966';
                    } else {
                        costEl.textContent = `總花費: $${total.toLocaleString()} + 1 精力`;
                        costEl.style.color = total > message.playerCash ? '#ff5252' : '#ffd966';
                    }
                }
            };
            input.oninput();
        }
    }

    static bindSubmit(message, onSubmit) {
        const btn   = document.getElementById('groupFinSubmitBtn');
        const input = document.getElementById('groupFinUnitsInput');

        if (btn) {
            btn.onclick = () => {
                const units    = parseInt(input?.value) || 0;
                const multiple = message.multiple || 1;
                const minTrade = message.minTrade || multiple;

                if (units > 0) {
                    if (units < minTrade) {
                        alert(`最少需要買入 ${minTrade} ${message.unit}！`);
                        return;
                    }
                    if (units % multiple !== 0) {
                        alert(`買入數量必須是 ${multiple} ${message.unit} 的倍數！`);
                        return;
                    }

                    const totalCost = units * message.currentPrice;
                    if (totalCost > message.playerCash) {
                        alert(`現金不足！需要 $${totalCost.toLocaleString()}`);
                        return;
                    }
                    if (message.playerEnergy < 1) {
                        alert('精力不足 1 點！');
                        return;
                    }
                }

                onSubmit(units);
            };
        }
    }

    static startCountdown(seconds, onExpire) {
        const el = document.getElementById('groupFinCountdown');
        if (!el) return null;
        let remaining = seconds;
        el.textContent = remaining;
        return setInterval(() => {
            remaining--;
            if (remaining <= 0) { if (onExpire) onExpire(); return; }
            if (el) el.textContent = remaining;
        }, 1000);
    }

    static disableSubmit() {
        const btn = document.getElementById('groupFinSubmitBtn');
        if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
    }
}