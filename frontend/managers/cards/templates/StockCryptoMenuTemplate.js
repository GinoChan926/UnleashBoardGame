"use strict";

export class StockCryptoMenuTemplate {

    // ==================== Stock menu ====================

    static buildStockMenu(message) {
        const holding = message.holding;
        const canSell = holding && holding.shares > 0;

        return `
            <div class="modal-content" style="max-width: 450px;
                 background: linear-gradient(135deg, #1a3a5c, #0d2b47);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #42a5f5;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 22px; color: #4fc3f7; font-weight: bold;">
                        📊 ${message.cardName || '股票交易'}
                    </div>
                </div>

                <div style="background: rgba(66,165,245,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;">
                    <div style="color: #fff; font-size: 13px; margin-bottom: 6px;">
                        當前股價: <strong style="color: #ffd966; font-size: 18px;">
                            $${message.currentPrice}
                        </strong>/股
                    </div>
                    <div style="color: #b3e5fc; font-size: 12px;">
                        最小交易: ${message.minShares} 股 (需為 ${message.shareMultiple || 100} 的倍數)
                    </div>
                    ${holding ? `
                        <div style="margin-top: 10px; padding-top: 10px;
                                    border-top: 1px solid rgba(255,255,255,0.1);
                                    color: #b3e5fc; font-size: 12px;">
                            持股: <strong style="color: #fff;">${holding.shares}</strong> 股 |
                            平均成本: $${holding.avgCost?.toFixed(2) || '0'} |
                            市值: $${(holding.currentValue || 0).toLocaleString()}
                        </div>
                    ` : ''}
                </div>

                <div style="margin-bottom: 14px;">
                    <label style="color: #b3e5fc; font-size: 13px; display: block; margin-bottom: 6px;">
                        股數 (${message.shareMultiple || 100} 的倍數)
                    </label>
                    <input type="number" id="stockSharesInput"
                           min="${message.minShares}"
                           step="${message.shareMultiple || 100}"
                           value="${message.minShares}"
                           style="width: 100%; padding: 12px; border-radius: 10px;
                                  border: 2px solid #42a5f5;
                                  background: rgba(0,0,0,0.4); color: #fff;
                                  font-size: 18px; text-align: center; box-sizing: border-box;">
                </div>

                <div id="stockTotalCostDisplay"
                     style="text-align: center; color: #ffd966; font-size: 14px;
                            margin-bottom: 14px;">
                    總花費: $${(message.minShares * message.currentPrice).toLocaleString()}
                </div>

                <div style="display: flex; gap: 10px; flex-direction: column;">
                    <div style="display: flex; gap: 10px;">
                        <button id="stockBuyBtn"
                                style="flex: 1; background: linear-gradient(135deg, #4caf50, #388e3c);
                                       color: white; padding: 12px; border: none;
                                       border-radius: 24px; cursor: pointer;
                                       font-size: 14px; font-weight: bold;
                                       box-shadow: 0 4px 12px rgba(76,175,80,0.3);">
                            💰 買入
                        </button>
                        <button id="stockSellBtn"
                                ${canSell ? '' : 'disabled'}
                                style="flex: 1; background: ${canSell
            ? 'linear-gradient(135deg, #ff9800, #f57c00)'
            : '#9e9e9e'};
                                       color: white; padding: 12px; border: none;
                                       border-radius: 24px;
                                       cursor: ${canSell ? 'pointer' : 'not-allowed'};
                                       opacity: ${canSell ? '1' : '0.5'};
                                       font-size: 14px; font-weight: bold;
                                       box-shadow: 0 4px 12px rgba(255,152,0,0.3);">
                            💸 賣出
                        </button>
                    </div>
                    <button id="stockCancelBtn"
                            style="background: #9e9e9e; color: white;
                                   padding: 10px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 13px;">
                        ❌ 取消
                    </button>
                </div>
            </div>
        `;
    }

    static bindStockButtons(cardId, price, minShares, shareMultiple, onBuy, onSell, onCancel) {
        const input = document.getElementById('stockSharesInput');
        const totalEl = document.getElementById('stockTotalCostDisplay');

        // Update total on input change
        if (input && totalEl) {
            input.oninput = () => {
                const shares = parseInt(input.value) || 0;
                totalEl.textContent = `總花費: $${(shares * price).toLocaleString()}`;
            };
        }

        const buyBtn    = document.getElementById('stockBuyBtn');
        const sellBtn   = document.getElementById('stockSellBtn');
        const cancelBtn = document.getElementById('stockCancelBtn');

        if (buyBtn) {
            buyBtn.onclick = () => {
                const shares = parseInt(input?.value);
                if (!shares || shares < minShares || shares % (shareMultiple || 100) !== 0) {
                    alert(`股數必須是 ${shareMultiple || 100} 的倍數，最少 ${minShares} 股`);
                    return;
                }
                onBuy(shares);
            };
        }

        if (sellBtn && !sellBtn.disabled) {
            sellBtn.onclick = () => {
                const shares = parseInt(input?.value);
                if (!shares || shares < minShares) {
                    alert(`股數必須至少 ${minShares} 股`);
                    return;
                }
                onSell(shares);
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
        }
    }

    // ==================== Crypto menu ====================

    static buildCryptoMenu(message) {
        const holding = message.holding;
        const canSell = holding && holding.units > 0;

        return `
            <div class="modal-content" style="max-width: 450px;
                 background: linear-gradient(135deg, #4a2a5c, #2a1a3a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ba68c8;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 22px; color: #ce93d8; font-weight: bold;">
                        🪙 ${message.cardName || '加密貨幣'}
                    </div>
                    <div style="color: #ff5252; font-size: 11px; margin-top: 4px;">
                        ⚠️ 高風險投資
                    </div>
                </div>

                <div style="background: rgba(186,104,200,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;">
                    <div style="color: #fff; font-size: 13px; margin-bottom: 6px;">
                        當前價格: <strong style="color: #ffd966; font-size: 18px;">
                            $${message.currentPrice}
                        </strong>/顆
                    </div>
                    <div style="color: #e1bee7; font-size: 12px;">
                        最小交易: ${message.minUnits} 顆
                    </div>
                    ${holding ? `
                        <div style="margin-top: 10px; padding-top: 10px;
                                    border-top: 1px solid rgba(255,255,255,0.1);
                                    color: #e1bee7; font-size: 12px;">
                            持有: <strong style="color: #fff;">${holding.units}</strong> 顆 |
                            平均成本: $${holding.averagePrice?.toFixed(4) || '0'} |
                            市值: $${(holding.currentValue || 0).toLocaleString()}
                        </div>
                    ` : ''}
                </div>

                <div style="margin-bottom: 14px;">
                    <label style="color: #e1bee7; font-size: 13px; display: block; margin-bottom: 6px;">
                        數量
                    </label>
                    <input type="number" id="cryptoUnitsInput"
                           min="${message.minUnits}"
                           value="${message.minUnits}"
                           style="width: 100%; padding: 12px; border-radius: 10px;
                                  border: 2px solid #ba68c8;
                                  background: rgba(0,0,0,0.4); color: #fff;
                                  font-size: 18px; text-align: center; box-sizing: border-box;">
                </div>

                <div id="cryptoTotalCostDisplay"
                     style="text-align: center; color: #ffd966; font-size: 14px;
                            margin-bottom: 14px;">
                    總花費: $${(message.minUnits * message.currentPrice).toLocaleString()}
                </div>

                <div style="display: flex; gap: 10px; flex-direction: column;">
                    <div style="display: flex; gap: 10px;">
                        <button id="cryptoBuyBtn"
                                style="flex: 1; background: linear-gradient(135deg, #4caf50, #388e3c);
                                       color: white; padding: 12px; border: none;
                                       border-radius: 24px; cursor: pointer;
                                       font-size: 14px; font-weight: bold;">
                            💰 買入
                        </button>
                        <button id="cryptoSellBtn"
                                ${canSell ? '' : 'disabled'}
                                style="flex: 1; background: ${canSell
            ? 'linear-gradient(135deg, #ff9800, #f57c00)'
            : '#9e9e9e'};
                                       color: white; padding: 12px; border: none;
                                       border-radius: 24px;
                                       cursor: ${canSell ? 'pointer' : 'not-allowed'};
                                       opacity: ${canSell ? '1' : '0.5'};
                                       font-size: 14px; font-weight: bold;">
                            💸 賣出
                        </button>
                    </div>
                    <button id="cryptoCancelBtn"
                            style="background: #9e9e9e; color: white;
                                   padding: 10px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 13px;">
                        ❌ 取消
                    </button>
                </div>
            </div>
        `;
    }

    static bindCryptoButtons(cardId, price, minUnits, onBuy, onSell, onCancel) {
        const input = document.getElementById('cryptoUnitsInput');
        const totalEl = document.getElementById('cryptoTotalCostDisplay');

        if (input && totalEl) {
            input.oninput = () => {
                const units = parseInt(input.value) || 0;
                totalEl.textContent = `總花費: $${(units * price).toLocaleString()}`;
            };
        }

        const buyBtn    = document.getElementById('cryptoBuyBtn');
        const sellBtn   = document.getElementById('cryptoSellBtn');
        const cancelBtn = document.getElementById('cryptoCancelBtn');

        if (buyBtn) {
            buyBtn.onclick = () => {
                const units = parseInt(input?.value);
                if (!units || units < minUnits) {
                    alert(`數量必須至少 ${minUnits} 顆`);
                    return;
                }
                onBuy(units);
            };
        }

        if (sellBtn && !sellBtn.disabled) {
            sellBtn.onclick = () => {
                const units = parseInt(input?.value);
                if (!units || units < minUnits) {
                    alert(`數量必須至少 ${minUnits} 顆`);
                    return;
                }
                onSell(units);
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
        }
    }

    // ==================== Food delivery menu (C04) ====================

    static buildFoodDeliveryMenu(message) {
        return `
            <div class="modal-content" style="max-width: 450px;
                 background: linear-gradient(135deg, #4a3a1a, #2a2510);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ff9800;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 22px; color: #ffb74d; font-weight: bold;">
                        🍔 ${message.cardName || '外賣店'}
                    </div>
                    <div style="color: #fff59d; font-size: 12px; margin-top: 4px;">
                        請選擇操作
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px;">
                    <button id="foodInvestBtn"
                            style="background: linear-gradient(135deg, #4caf50, #388e3c);
                                   color: white; padding: 14px; border: none;
                                   border-radius: 12px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;
                                   text-align: left;">
                        <div style="font-size: 16px; margin-bottom: 4px;">🏪 投資開店</div>
                        <div style="font-size: 11px; opacity: 0.9;">
                            投資 $${(message.investmentCost || 0).toLocaleString()}，
                            被動收入 +$${(message.monthlyReturn || 0).toLocaleString()}/月，
                            精力 -${message.energyCost || 0}
                        </div>
                    </button>

                    <button id="foodExchangeBtn"
                            style="background: linear-gradient(135deg, #ff9800, #f57c00);
                                   color: white; padding: 14px; border: none;
                                   border-radius: 12px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;
                                   text-align: left;">
                        <div style="font-size: 16px; margin-bottom: 4px;">⚡ 兌換精力</div>
                        <div style="font-size: 11px; opacity: 0.9;">
                            $${(message.exchangeCost || 0).toLocaleString()} 兌換
                            ${message.exchangeEnergy || 0} 精力
                        </div>
                    </button>

                    <button id="foodCancelBtn"
                            style="background: #9e9e9e; color: white;
                                   padding: 10px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 13px;">
                        ❌ 取消
                    </button>
                </div>
            </div>
        `;
    }

    static bindFoodDeliveryButtons(onInvest, onExchange, onCancel) {
        const investBtn   = document.getElementById('foodInvestBtn');
        const exchangeBtn = document.getElementById('foodExchangeBtn');
        const cancelBtn   = document.getElementById('foodCancelBtn');

        if (investBtn)   investBtn.onclick   = () => onInvest();
        if (exchangeBtn) exchangeBtn.onclick = () => onExchange();
        if (cancelBtn)   cancelBtn.onclick   = () => onCancel();
    }
}