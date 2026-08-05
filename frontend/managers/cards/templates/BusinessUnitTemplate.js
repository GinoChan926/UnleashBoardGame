"use strict";

export class BusinessUnitTemplate {

    static buildModal(message) {
        const cardName       = message.cardName       || '商業投資';
        const cardImage      = message.cardImage      || '';
        const pricePerUnit   = message.pricePerUnit   || 0;
        const monthlyReturn  = message.monthlyReturnPerUnit || 0;
        const energyCost     = message.energyCostPerUnit    || 0;
        const minUnits       = message.minUnits       || 1;
        const maxUnits       = message.maxUnits       || 1;
        const existingUnits  = message.existingUnits  || 0;
        const remainingSlots = message.remainingSlots || 0;
        const currentCash    = message.currentCash    || 0;
        const currentEnergy  = message.currentEnergy  || 0;
        const maxEnergy      = message.maxEnergy      || 10;

        // Resolve image path
        let imgUrl = cardImage;
        if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
            imgUrl = imgUrl.replace(/^(\.\.\/)+/, '/');
            if (!imgUrl.startsWith('/')) imgUrl = '/' + imgUrl;
        }

        return `
            <div class="modal-content" style="max-width: 500px;
                 background: linear-gradient(135deg, #2a4a5a, #1a2a3a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ff9800; text-align: center;">

                <div style="font-size: 22px; color: #ffb74d;
                            font-weight: bold; margin-bottom: 6px;">
                    🏢 ${cardName}
                </div>
                <div style="font-size: 12px; color: #ffcc80; margin-bottom: 14px;">
                    請選擇購買數量
                </div>

                ${imgUrl ? `
                    <div style="text-align: center; margin-bottom: 14px;">
                        <img src="${imgUrl}" alt="${cardName}"
                             style="max-width: 60%; max-height: 140px;
                                    border-radius: 12px;
                                    border: 3px solid #ff9800;
                                    box-shadow: 0 6px 16px rgba(255,152,0,0.4);"
                             onerror="this.style.display='none';">
                    </div>
                ` : ''}

                <!-- Current status -->
                <div style="background: rgba(0,0,0,0.4); padding: 10px;
                            border-radius: 10px; margin-bottom: 14px;
                            text-align: left; font-size: 13px;
                            display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    <div>💵 可用資金:</div>
                    <div style="text-align: right; color: #4caf50;">
                        <strong>$${currentCash.toLocaleString()}</strong>
                    </div>
                    <div>⚡ 目前精力:</div>
                    <div style="text-align: right; color: #4fc3f7;">
                        <strong>${currentEnergy}/${maxEnergy}</strong>
                    </div>
                    <div>📊 已持有:</div>
                    <div style="text-align: right;">
                        <strong>${existingUnits}/${maxUnits} 部</strong>
                    </div>
                    <div>📦 尚可投資:</div>
                    <div style="text-align: right; color: #ffd966;">
                        <strong>${remainingSlots} 部</strong>
                    </div>
                </div>

                <!-- Per-unit info -->
                <div style="background: rgba(255,152,0,0.15); padding: 12px;
                            border-radius: 10px; margin-bottom: 14px;
                            border: 1px solid rgba(255,152,0,0.3);
                            text-align: left; font-size: 12px; color: #ffe0b2;">
                    <div style="text-align: center; color: #ffb74d;
                                font-weight: bold; margin-bottom: 6px;">
                        每部規格
                    </div>
                    <div>💰 單價: $${pricePerUnit.toLocaleString()}</div>
                    <div>⚡ 精力: -${energyCost}</div>
                    <div>📈 月收入: +$${monthlyReturn.toLocaleString()}</div>
                </div>

                ${remainingSlots > 0 ? `
                    <!-- Unit selector -->
                    <div style="margin-bottom: 14px; text-align: left;">
                        <label style="color: #ffd966; font-size: 13px;
                                      display: block; margin-bottom: 6px;">
                            🏢 購買數量
                        </label>
                        <input type="number" id="buSelectorInput"
                               min="${minUnits}" max="${remainingSlots}"
                               step="1" value="${minUnits}"
                               inputmode="numeric"
                               style="width: 100%; padding: 12px;
                                      border-radius: 8px; border: 2px solid #ff9800;
                                      background: rgba(0,0,0,0.5); color: #fff;
                                      font-size: 18px; text-align: center;
                                      box-sizing: border-box;">

                        <!-- Quick buttons -->
                        <div style="display: flex; gap: 6px; margin-top: 8px;">
                            ${this._buildQuickButtons(remainingSlots)}
                        </div>
                    </div>

                    <!-- Live preview -->
                    <div id="buPreview"
                         style="background: rgba(76,175,80,0.15);
                                border: 1px solid rgba(76,175,80,0.4);
                                border-radius: 10px; padding: 12px;
                                margin-bottom: 14px; text-align: left;
                                font-size: 13px; color: #a5d6a7;
                                display: none;">
                    </div>
                ` : `
                    <div style="background: rgba(244,67,54,0.15);
                                border: 1px solid rgba(244,67,54,0.4);
                                border-radius: 10px; padding: 14px;
                                margin-bottom: 14px; color: #ff8a80;
                                font-weight: bold;">
                        ⚠️ 已達最大投資數量 (${maxUnits} 部)
                    </div>
                `}

                <div style="display: flex; gap: 10px;">
                    <button id="buCancelBtn"
                            style="flex: 1; background: #9e9e9e; color: white;
                                   padding: 10px; border: none;
                                   border-radius: 20px; cursor: pointer;
                                   font-size: 14px;">
                        取消
                    </button>
                    ${remainingSlots > 0 ? `
                        <button id="buConfirmBtn"
                                style="flex: 2; background: linear-gradient(135deg, #ff9800, #e65100);
                                       color: white; padding: 10px; border: none;
                                       border-radius: 20px; cursor: pointer;
                                       font-size: 14px; font-weight: bold;">
                            ✅ 確認購買
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    static _buildQuickButtons(maxRemaining) {
        const buttons = [];

        if (maxRemaining >= 1) {
            buttons.push({ label: '1 部', value: 1 });
        }
        if (maxRemaining >= 2) {
            buttons.push({ label: '2 部', value: 2 });
        }
        if (maxRemaining >= 3) {
            buttons.push({ label: '3 部', value: 3 });
        }
        // Always add "全部"
        buttons.push({ label: `全部 (${maxRemaining})`, value: maxRemaining });

        return buttons.map(b => `
            <button class="bu-quick-btn" data-value="${b.value}"
                    style="flex: 1; padding: 6px; font-size: 12px;
                           background: #455a64; border: none;
                           color: white; border-radius: 8px;
                           cursor: pointer; transition: all 0.2s ease;">
                ${b.label}
            </button>
        `).join('');
    }

    /**
     * Bind events. Returns callbacks are:
     * - onConfirm(units) — called with chosen units
     * - onCancel()
     */
    static bind(message, onConfirm, onCancel) {
        const input      = document.getElementById('buSelectorInput');
        const previewEl  = document.getElementById('buPreview');
        const confirmBtn = document.getElementById('buConfirmBtn');
        const cancelBtn  = document.getElementById('buCancelBtn');

        const pricePerUnit  = message.pricePerUnit || 0;
        const monthlyReturn = message.monthlyReturnPerUnit || 0;
        const energyCost    = message.energyCostPerUnit    || 0;
        const currentCash   = message.currentCash    || 0;
        const currentEnergy = message.currentEnergy  || 0;
        const remainingSlots = message.remainingSlots || 0;
        const minUnits      = message.minUnits || 1;

        const updatePreview = () => {
            if (!input || !previewEl) return;

            let units = parseInt(input.value, 10);
            if (isNaN(units) || units < minUnits) units = minUnits;
            if (units > remainingSlots) units = remainingSlots;

            const totalCost   = units * pricePerUnit;
            const totalEnergy = units * energyCost;
            const totalReturn = units * monthlyReturn;

            const canAffordCash   = currentCash   >= totalCost;
            const canAffordEnergy = currentEnergy >= totalEnergy;
            const canConfirm      = canAffordCash && canAffordEnergy && units > 0;

            previewEl.style.display = 'block';
            previewEl.style.background = canConfirm
                ? 'rgba(76,175,80,0.15)'
                : 'rgba(244,67,54,0.15)';
            previewEl.style.borderColor = canConfirm
                ? 'rgba(76,175,80,0.4)'
                : 'rgba(244,67,54,0.4)';

            let html = `
                <div style="text-align: center; font-weight: bold;
                            color: ${canConfirm ? '#a5d6a7' : '#ff8a80'};
                            margin-bottom: 6px;">
                    購買 ${units} 部預覽
                </div>
                <div>💰 總花費: <strong>$${totalCost.toLocaleString()}</strong></div>
                <div>⚡ 總精力消耗: <strong>-${totalEnergy}</strong>
                    (剩 ${Math.max(0, currentEnergy - totalEnergy)})</div>
                <div>📈 總月收入增加: <strong>+$${totalReturn.toLocaleString()}/月</strong></div>
                <div style="margin-top: 6px; padding-top: 6px;
                            border-top: 1px solid rgba(255,255,255,0.1);
                            font-size: 11px; color: #90a4ae;">
                    回本期: 約 ${Math.ceil(pricePerUnit / monthlyReturn)} 個月
                </div>
            `;

            if (!canAffordCash) {
                html += `<div style="color: #ff6b6b; margin-top: 6px;
                                     font-weight: bold;">
                    ⚠️ 資金不足！你只有 $${currentCash.toLocaleString()}
                </div>`;
            }
            if (!canAffordEnergy) {
                html += `<div style="color: #ff6b6b; margin-top: 6px;
                                     font-weight: bold;">
                    ⚠️ 精力不足！你只有 ${currentEnergy}
                </div>`;
            }

            previewEl.innerHTML = html;

            if (confirmBtn) {
                confirmBtn.disabled      = !canConfirm;
                confirmBtn.style.opacity = canConfirm ? '1' : '0.4';
                confirmBtn.style.cursor  = canConfirm ? 'pointer' : 'not-allowed';
                confirmBtn.textContent   = canConfirm
                    ? `✅ 購買 ${units} 部 ($${totalCost.toLocaleString()})`
                    : '❌ 條件不足';
            }
        };

        if (input) {
            input.addEventListener('input', updatePreview);
            input.addEventListener('change', () => {
                // Clamp value
                let v = parseInt(input.value, 10);
                if (isNaN(v) || v < minUnits) v = minUnits;
                if (v > remainingSlots) v = remainingSlots;
                input.value = v;
                updatePreview();
            });
        }

        // Quick buttons
        document.querySelectorAll('.bu-quick-btn').forEach(btn => {
            btn.onclick = () => {
                if (!input) return;
                input.value = btn.dataset.value;
                updatePreview();
            };
            btn.onmouseenter = () => { btn.style.background = '#546e7a'; };
            btn.onmouseleave = () => { btn.style.background = '#455a64'; };
        });

        // Confirm
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (confirmBtn.disabled) return;
                const units = parseInt(input?.value, 10);
                if (!units || units <= 0) { alert('請輸入購買數量'); return; }
                onConfirm(units);
            };
        }

        // Cancel
        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
        }

        // Initial preview
        updatePreview();
    }
}