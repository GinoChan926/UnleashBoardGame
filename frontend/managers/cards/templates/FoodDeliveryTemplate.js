"use strict";

export class FoodDeliveryTemplate {

    static buildModal(message) {
        const cardName       = message.cardName       || '外賣店';
        const investmentCost = message.investmentCost || 100000;
        const monthlyReturn  = message.monthlyReturn  || 8000;
        const energyCost     = message.energyCost     || 3;
        const exchangeCost   = message.exchangeCost   || 50000;
        const exchangeEnergy = message.exchangeEnergy || 10;
        const currentCash    = message.currentCash    || 0;
        const currentEnergy  = message.currentEnergy  || 0;
        const maxEnergy      = message.maxEnergy      || 10;

        return `
            <div class="modal-content" style="max-width: 500px;
                 background: linear-gradient(135deg, #4a2c1a, #2a1810);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ff9800; text-align: center;">

                <div style="font-size: 22px; color: #ffb74d;
                            font-weight: bold; margin-bottom: 6px;">
                    🍜 ${cardName}
                </div>
                <div style="font-size: 12px; color: #ffcc80; margin-bottom: 16px;">
                    可以選擇兩者、只選其中一個，或都不選
                </div>

                <!-- ✅ Current resource display -->
                <div style="background: rgba(0,0,0,0.4); padding: 10px;
                            border-radius: 10px; margin-bottom: 14px;
                            display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
                            text-align: left; font-size: 13px;">
                    <div>💵 目前現金:</div>
                    <div style="text-align: right; color: #4caf50;">
                        <strong>$${currentCash.toLocaleString()}</strong>
                    </div>
                    <div>⚡ 目前精力:</div>
                    <div style="text-align: right; color: #4fc3f7;">
                        <strong>${currentEnergy}/${maxEnergy}</strong>
                    </div>
                </div>

                <!-- ✅ Option 1: Invest -->
                <label id="fdInvestOption"
                       style="display: block; background: rgba(76,175,80,0.15);
                              border: 2px solid rgba(76,175,80,0.4);
                              padding: 14px; border-radius: 12px;
                              margin-bottom: 10px; cursor: pointer;
                              text-align: left; transition: all 0.2s ease;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="fdInvestCheckbox"
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <div style="flex: 1;">
                            <div style="color: #a5d6a7; font-weight: bold; font-size: 15px;">
                                🍜 開設外賣店
                            </div>
                            <div style="color: #c8e6c9; font-size: 12px; margin-top: 4px;">
                                投資: <strong>$${investmentCost.toLocaleString()}</strong>
                                (可用貸款金)<br>
                                精力: <strong>-${energyCost}</strong><br>
                                📈 被動收入: <strong>+$${monthlyReturn.toLocaleString()}/月</strong>
                            </div>
                        </div>
                    </div>
                </label>

                <!-- ✅ Option 2: Exchange energy -->
                <label id="fdExchangeOption"
                       style="display: block; background: rgba(66,165,245,0.15);
                              border: 2px solid rgba(66,165,245,0.4);
                              padding: 14px; border-radius: 12px;
                              margin-bottom: 14px; cursor: pointer;
                              text-align: left; transition: all 0.2s ease;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="fdExchangeCheckbox"
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <div style="flex: 1;">
                            <div style="color: #90caf9; font-weight: bold; font-size: 15px;">
                                ⚡ 兌換 ${exchangeEnergy} 精力
                            </div>
                            <div style="color: #bbdefb; font-size: 12px; margin-top: 4px;">
                                花費: <strong>$${exchangeCost.toLocaleString()}</strong>
                                (僅現金)<br>
                                ⚡ 精力: <strong>+${exchangeEnergy}</strong>
                            </div>
                        </div>
                    </div>
                </label>

                <!-- ✅ Live preview -->
                <div id="fdPreview"
                     style="background: rgba(255,193,7,0.1);
                            border: 1px solid rgba(255,193,7,0.3);
                            border-radius: 10px; padding: 10px;
                            margin-bottom: 14px; text-align: left;
                            font-size: 13px; color: #ffe082;
                            min-height: 40px;">
                    <div style="color: #90a4ae;">
                        請勾選你想執行的選項
                    </div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button id="fdCancelBtn"
                            style="flex: 1; background: #9e9e9e; color: white;
                                   padding: 10px; border: none;
                                   border-radius: 20px; cursor: pointer;
                                   font-size: 14px;">
                        取消
                    </button>
                    <button id="fdConfirmBtn"
                            style="flex: 2; background: linear-gradient(135deg, #ff9800, #e65100);
                                   color: white; padding: 10px; border: none;
                                   border-radius: 20px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;
                                   opacity: 0.4;"
                            disabled>
                        確認
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Bind the checkboxes + confirm/cancel.
     * @param {object} message - the food_delivery_menu message
     * @param {Function} onConfirm - called with { invest: bool, exchange: bool }
     * @param {Function} onCancel
     */
    static bind(message, onConfirm, onCancel) {
        const investBox   = document.getElementById('fdInvestCheckbox');
        const exchangeBox = document.getElementById('fdExchangeCheckbox');
        const investOpt   = document.getElementById('fdInvestOption');
        const exchangeOpt = document.getElementById('fdExchangeOption');
        const previewEl   = document.getElementById('fdPreview');
        const confirmBtn  = document.getElementById('fdConfirmBtn');
        const cancelBtn   = document.getElementById('fdCancelBtn');

        const investCost   = message.investmentCost || 100000;
        const energyCost   = message.energyCost     || 3;
        const monthlyRet   = message.monthlyReturn  || 8000;
        const exchangeCost = message.exchangeCost   || 50000;
        const exchangeEng  = message.exchangeEnergy || 10;
        const currentCash  = message.currentCash    || 0;
        const currentEnrg  = message.currentEnergy  || 0;
        const maxEnrg      = message.maxEnergy      || 10;

        const updatePreview = () => {
            const invest   = investBox.checked;
            const exchange = exchangeBox.checked;

            // Highlight selected options
            investOpt.style.borderColor = invest
                ? '#4caf50'
                : 'rgba(76,175,80,0.4)';
            investOpt.style.background  = invest
                ? 'rgba(76,175,80,0.25)'
                : 'rgba(76,175,80,0.15)';

            exchangeOpt.style.borderColor = exchange
                ? '#42a5f5'
                : 'rgba(66,165,245,0.4)';
            exchangeOpt.style.background  = exchange
                ? 'rgba(66,165,245,0.25)'
                : 'rgba(66,165,245,0.15)';

            // Nothing selected
            if (!invest && !exchange) {
                previewEl.innerHTML = `
                    <div style="color: #90a4ae;">
                        請勾選你想執行的選項
                    </div>
                `;
                confirmBtn.disabled      = true;
                confirmBtn.style.opacity = '0.4';
                confirmBtn.textContent   = '確認';
                return;
            }

            // Build preview
            const investSpend   = invest   ? investCost   : 0;
            const exchangeSpend = exchange ? exchangeCost : 0;
            const totalSpend    = investSpend + exchangeSpend;

            const netEnergy = (invest ? -energyCost : 0)
                + (exchange ? exchangeEng : 0);
            const finalEnergy = Math.min(maxEnrg, Math.max(0, currentEnrg + netEnergy));

            const passiveGain = invest ? monthlyRet : 0;

            // Affordability check
            // Investment uses cash + loanCash; exchange uses regular cash only.
            // Since currentCash from message is cash + loanCash, we can check total.
            const canAffordTotal = currentCash >= totalSpend;

            let html = `
                <div>💰 總花費: <strong style="color: #ffd966;">
                    $${totalSpend.toLocaleString()}
                </strong></div>
            `;

            if (invest && exchange) {
                html += `<div style="font-size: 11px; color: #90a4ae; margin-top: 2px;">
                    (投資 $${investSpend.toLocaleString()} + 兌換 $${exchangeSpend.toLocaleString()})
                </div>`;
            }

            if (netEnergy !== 0) {
                const sign = netEnergy > 0 ? '+' : '';
                html += `<div style="margin-top: 4px;">
                    ⚡ 精力變化: <strong style="color: ${netEnergy > 0 ? '#4fc3f7' : '#ff9800'};">
                        ${sign}${netEnergy}
                    </strong>
                    (${currentEnrg} → ${finalEnergy})
                </div>`;
            }

            if (passiveGain > 0) {
                html += `<div style="margin-top: 4px;">
                    📈 被動收入: <strong style="color: #4caf50;">
                        +$${passiveGain.toLocaleString()}/月
                    </strong>
                </div>`;
            }

            if (!canAffordTotal) {
                html += `<div style="color: #ff6b6b; margin-top: 6px; font-weight: bold;">
                    ⚠️ 資金不足！你只有 $${currentCash.toLocaleString()}
                </div>`;
            }

            if (invest && currentEnrg < energyCost) {
                html += `<div style="color: #ff6b6b; margin-top: 6px; font-weight: bold;">
                    ⚠️ 精力不足！開設外賣店需要 ${energyCost} 精力
                </div>`;
            }

            previewEl.innerHTML = html;

            const canConfirm = canAffordTotal
                && !(invest && currentEnrg < energyCost);

            confirmBtn.disabled      = !canConfirm;
            confirmBtn.style.opacity = canConfirm ? '1' : '0.4';
            confirmBtn.style.cursor  = canConfirm ? 'pointer' : 'not-allowed';
            confirmBtn.textContent   = canConfirm ? '✅ 確認執行' : '❌ 條件不足';
        };

        // Bind checkbox events
        if (investBox)   investBox.addEventListener('change', updatePreview);
        if (exchangeBox) exchangeBox.addEventListener('change', updatePreview);

        // Also allow clicking anywhere on the label to toggle
        if (investOpt)   investOpt.onclick   = (e) => {
            if (e.target !== investBox) {
                investBox.checked = !investBox.checked;
                updatePreview();
            }
        };
        if (exchangeOpt) exchangeOpt.onclick = (e) => {
            if (e.target !== exchangeBox) {
                exchangeBox.checked = !exchangeBox.checked;
                updatePreview();
            }
        };

        // Confirm
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (confirmBtn.disabled) return;
                onConfirm({
                    invest:   investBox.checked,
                    exchange: exchangeBox.checked
                });
            };
        }

        // Cancel
        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
        }

        // Initial state
        updatePreview();
    }
}