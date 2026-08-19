"use strict";

export class StockCryptoMenuTemplate {

    // ==================== Stock menu ====================

    static buildStockMenu(message) {
        const holding   = message.holding;
        const canSell   = holding && holding.shares > 0;
        const cashTotal = message.currentCash || 0;

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

                <!-- ✅ Live preview with affordability -->
                <div id="stockPreviewBox"
                     style="background: rgba(0,0,0,0.3); padding: 10px;
                            border-radius: 10px; margin-bottom: 14px;
                            text-align: center; font-size: 13px;">
                    <div id="stockTotalCostDisplay" style="color: #ffd966; font-weight: bold;">
                        總花費: $${(message.minShares * message.currentPrice).toLocaleString()}
                    </div>
                    <div id="stockCashDisplay" style="color: #b3e5fc; margin-top: 4px;">
                        💵 可用資金: $${cashTotal.toLocaleString()}
                    </div>
                    <div id="stockAffordWarning" style="color: #ff5252; font-weight: bold;
                                margin-top: 4px; display: none;">
                        ⚠️ 資金不足
                    </div>
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

    static bindStockButtons(cardId, price, minShares, shareMultiple, onBuy, onSell, onCancel, currentCash, currentHolding) {
        const input      = document.getElementById('stockSharesInput');
        const totalEl    = document.getElementById('stockTotalCostDisplay');
        const cashEl     = document.getElementById('stockCashDisplay');
        const warningEl  = document.getElementById('stockAffordWarning');
        const buyBtn     = document.getElementById('stockBuyBtn');
        const sellBtn    = document.getElementById('stockSellBtn');
        const cancelBtn  = document.getElementById('stockCancelBtn');
        const cash       = currentCash || 0;
        const ownedShares = currentHolding?.shares || 0;

        const updatePreview = () => {
            const shares    = parseInt(input?.value) || 0;
            const totalBuy  = shares * price;
            const canAfford = cash >= totalBuy && totalBuy > 0;
            const validStep = shares >= minShares && shares % (shareMultiple || 100) === 0;
            const canSellAmount = shares <= ownedShares && shares > 0 && validStep;

            if (totalEl) {
                totalEl.textContent = '總花費: $' + totalBuy.toLocaleString();
                totalEl.style.color = canAfford ? '#ffd966' : '#ff5252';
            }

            if (warningEl) {
                if (!validStep && shares > 0) {
                    warningEl.style.display = 'block';
                    warningEl.textContent = '⚠️ 股數必須是 ' + (shareMultiple || 100) + ' 的倍數';
                    warningEl.style.color = '#ff9800';
                } else if (!canAfford && shares > 0) {
                    warningEl.style.display = 'block';
                    warningEl.textContent = '⚠️ 買入資金不足！你只有 $' + cash.toLocaleString();
                    warningEl.style.color = '#ff5252';
                } else {
                    warningEl.style.display = 'none';
                }
            }

            // ✅ Buy button
            if (buyBtn) {
                const canBuy = canAfford && validStep;
                buyBtn.disabled      = !canBuy;
                buyBtn.style.opacity = canBuy ? '1' : '0.4';
                buyBtn.style.cursor  = canBuy ? 'pointer' : 'not-allowed';
                buyBtn.textContent   = canBuy
                    ? '💰 買入 ' + shares + ' 股 ($' + totalBuy.toLocaleString() + ')'
                    : shares > 0 ? '❌ 無法買入' : '💰 買入';
            }

            // ✅ Sell button
            if (sellBtn && ownedShares > 0) {
                const totalSell = shares * price;
                sellBtn.disabled      = !canSellAmount;
                sellBtn.style.opacity = canSellAmount ? '1' : '0.4';
                sellBtn.style.cursor  = canSellAmount ? 'pointer' : 'not-allowed';

                if (shares > ownedShares) {
                    sellBtn.textContent = '❌ 持股不足 (只有 ' + ownedShares + ' 股)';
                } else if (canSellAmount) {
                    sellBtn.textContent = '💸 賣出 ' + shares + ' 股 ($' + totalSell.toLocaleString() + ')';
                } else {
                    sellBtn.textContent = '💸 賣出';
                }
            }
        };

        if (input) {
            input.addEventListener('input', updatePreview);
            input.addEventListener('change', () => {
                let v = parseInt(input.value) || 0;
                if (v < minShares) v = minShares;
                v = Math.round(v / (shareMultiple || 100)) * (shareMultiple || 100);
                input.value = v;
                updatePreview();
            });
        }

        if (buyBtn) {
            buyBtn.onclick = () => {
                if (buyBtn.disabled) return;
                const shares = parseInt(input?.value);
                if (!shares || shares < minShares || shares % (shareMultiple || 100) !== 0) {
                    alert('股數必須是 ' + (shareMultiple || 100) + ' 的倍數，最少 ' + minShares + ' 股');
                    return;
                }
                if (shares * price > cash) {
                    alert('資金不足！總花費 $' + (shares * price).toLocaleString() + '，你只有 $' + cash.toLocaleString());
                    return;
                }
                onBuy(shares);
            };
        }

        if (sellBtn) {
            sellBtn.onclick = () => {
                if (sellBtn.disabled) return;
                const shares = parseInt(input?.value);
                if (!shares || shares < minShares || shares % (shareMultiple || 100) !== 0) {
                    alert('股數必須是 ' + (shareMultiple || 100) + ' 的倍數，最少 ' + minShares + ' 股');
                    return;
                }
                // ✅ Check owned shares
                if (shares > ownedShares) {
                    alert('持股不足！你只有 ' + ownedShares + ' 股，無法賣出 ' + shares + ' 股');
                    return;
                }
                onSell(shares);
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
        }

        updatePreview();
    }

    // ==================== Crypto menu ====================

    static buildCryptoMenu(message) {
        const holding   = message.holding;
        const canSell   = holding && holding.units > 0;
        const cashTotal = message.currentCash || 0;

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

                <!-- ✅ Live preview with affordability -->
                <div id="cryptoPreviewBox"
                     style="background: rgba(0,0,0,0.3); padding: 10px;
                            border-radius: 10px; margin-bottom: 14px;
                            text-align: center; font-size: 13px;">
                    <div id="cryptoTotalCostDisplay" style="color: #ffd966; font-weight: bold;">
                        總花費: $${(message.minUnits * message.currentPrice).toLocaleString()}
                    </div>
                    <div id="cryptoCashDisplay" style="color: #e1bee7; margin-top: 4px;">
                        💵 可用資金: $${cashTotal.toLocaleString()}
                    </div>
                    <div id="cryptoAffordWarning" style="color: #ff5252; font-weight: bold;
                                margin-top: 4px; display: none;">
                        ⚠️ 資金不足
                    </div>
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

    static bindCryptoButtons(cardId, price, minUnits, onBuy, onSell, onCancel, currentCash, currentHolding) {
        const input      = document.getElementById('cryptoUnitsInput');
        const totalEl    = document.getElementById('cryptoTotalCostDisplay');
        const warningEl  = document.getElementById('cryptoAffordWarning');
        const buyBtn     = document.getElementById('cryptoBuyBtn');
        const sellBtn    = document.getElementById('cryptoSellBtn');
        const cancelBtn  = document.getElementById('cryptoCancelBtn');
        const cash       = currentCash || 0;
        const ownedUnits = currentHolding?.units || 0;

        const updatePreview = () => {
            const units     = parseInt(input?.value) || 0;
            const totalBuy  = units * price;
            const canAfford = cash >= totalBuy && totalBuy > 0;
            const validUnits = units >= minUnits;
            const canSellAmount = units <= ownedUnits && units > 0 && validUnits;

            if (totalEl) {
                totalEl.textContent = '總花費: $' + totalBuy.toLocaleString();
                totalEl.style.color = canAfford ? '#ffd966' : '#ff5252';
            }

            if (warningEl) {
                if (!validUnits && units > 0) {
                    warningEl.style.display = 'block';
                    warningEl.textContent = '⚠️ 數量必須至少 ' + minUnits + ' 顆';
                    warningEl.style.color = '#ff9800';
                } else if (!canAfford && units > 0) {
                    warningEl.style.display = 'block';
                    warningEl.textContent = '⚠️ 買入資金不足！你只有 $' + cash.toLocaleString();
                    warningEl.style.color = '#ff5252';
                } else {
                    warningEl.style.display = 'none';
                }
            }

            if (buyBtn) {
                const canBuy = canAfford && validUnits;
                buyBtn.disabled      = !canBuy;
                buyBtn.style.opacity = canBuy ? '1' : '0.4';
                buyBtn.style.cursor  = canBuy ? 'pointer' : 'not-allowed';
                buyBtn.textContent   = canBuy
                    ? '💰 買入 ' + units + ' 顆 ($' + totalBuy.toLocaleString() + ')'
                    : units > 0 ? '❌ 無法買入' : '💰 買入';
            }

            // ✅ Sell button
            if (sellBtn && ownedUnits > 0) {
                const totalSell = units * price;
                sellBtn.disabled      = !canSellAmount;
                sellBtn.style.opacity = canSellAmount ? '1' : '0.4';
                sellBtn.style.cursor  = canSellAmount ? 'pointer' : 'not-allowed';

                if (units > ownedUnits) {
                    sellBtn.textContent = '❌ 持有不足 (只有 ' + ownedUnits + ' 顆)';
                } else if (canSellAmount) {
                    sellBtn.textContent = '💸 賣出 ' + units + ' 顆 ($' + totalSell.toLocaleString() + ')';
                } else {
                    sellBtn.textContent = '💸 賣出';
                }
            }
        };

        if (input) {
            input.addEventListener('input', updatePreview);
        }

        if (buyBtn) {
            buyBtn.onclick = () => {
                if (buyBtn.disabled) return;
                const units = parseInt(input?.value);
                if (!units || units < minUnits) {
                    alert('數量必須至少 ' + minUnits + ' 顆');
                    return;
                }
                if (units * price > cash) {
                    alert('資金不足！總花費 $' + (units * price).toLocaleString() + '，你只有 $' + cash.toLocaleString());
                    return;
                }
                onBuy(units);
            };
        }

        if (sellBtn) {
            sellBtn.onclick = () => {
                if (sellBtn.disabled) return;
                const units = parseInt(input?.value);
                if (!units || units < minUnits) {
                    alert('數量必須至少 ' + minUnits + ' 顆');
                    return;
                }
                if (units > ownedUnits) {
                    alert('持有不足！你只有 ' + ownedUnits + ' 顆，無法賣出 ' + units + ' 顆');
                    return;
                }
                onSell(units);
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
        }

        updatePreview();
    }
}