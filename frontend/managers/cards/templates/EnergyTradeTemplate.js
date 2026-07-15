"use strict";

export class EnergyTradeTemplate {

    // ==================== Seller: price input ====================

    static buildPricePromptModal() {
        return `
            <div class="modal-content" style="max-width: 420px;
                 background: linear-gradient(135deg, #1a3d2b, #0d2b1a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #4caf50;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #4caf50; font-weight: bold;">
                        💚 碳中和釀酒廠 - 精力交易
                    </div>
                    <div style="font-size: 12px; color: #a5d6a7; margin-top: 4px;">
                        設定價格向其他玩家出售精力
                    </div>
                </div>

                <div style="background: rgba(76,175,80,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 16px; text-align: center;">
                    <div style="color: #fff; font-size: 14px;">
                        你將從銀行提取
                    </div>
                    <div style="color: #4caf50; font-size: 28px; font-weight: bold;
                                margin: 6px 0;">
                        ⚡ <span id="pricePromptEnergy">5</span> 精力
                    </div>
                    <div style="color: #a5d6a7; font-size: 12px;">
                        請設定售價
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="color: #a5d6a7; font-size: 13px; display: block;
                                  margin-bottom: 6px;">💰 售價 (元)</label>
                    <input type="number" id="energyPriceInput"
                           min="1" value="1000"
                           style="width: 100%; padding: 12px; border-radius: 10px;
                                  border: 2px solid #4caf50;
                                  background: rgba(0,0,0,0.4); color: #fff;
                                  font-size: 18px; text-align: center; box-sizing: border-box;">
                </div>

                <div style="background: rgba(255,152,0,0.15); padding: 10px;
            border-radius: 10px; margin-bottom: 16px;
            font-size: 12px; color: #ffab00; text-align: center;
            border: 1px solid rgba(255,152,0,0.3);">
    ⚠️ 若無人購買，你將被強制以此價格自買 <span id="pricePromptEnergyInline">5</span> 精力！
                </div>

                <div style="text-align: center;">
                    <button id="energyPriceConfirmBtn"
                            style="background: linear-gradient(135deg, #4caf50, #388e3c);
                                   color: white; padding: 12px 40px; border: none;
                                   border-radius: 30px; cursor: pointer;
                                   font-size: 16px; font-weight: bold;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 4px 12px rgba(76,175,80,0.3);">
                        ✅ 開始交易
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== Buyer: offer notification ====================

    static buildOfferModal() {
        return `
            <div class="modal-content" style="max-width: 400px;
                 background: linear-gradient(135deg, #1a3d2b, #0d2b1a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #4caf50;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 22px; color: #4caf50; font-weight: bold;">
                        💚 精力交易 - 邀請
                    </div>
                    <div id="energyOfferSeller"
                         style="font-size: 13px; color: #a5d6a7; margin-top: 6px;">
                    </div>
                </div>

                <div style="background: rgba(76,175,80,0.2); padding: 18px;
                            border-radius: 16px; margin-bottom: 16px; text-align: center;">
                    <div style="color: #fff; font-size: 14px;">出售</div>
                    <div style="color: #4caf50; font-size: 28px; font-weight: bold;
                                margin: 8px 0;">
                        ⚡ <span id="energyOfferAmount">5</span> 精力
                    </div>
                    <div style="color: #ffd966; font-size: 20px; font-weight: bold;">
                        💰 $<span id="energyOfferPrice">0</span>
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.4); padding: 8px;
                            border-radius: 8px; margin-bottom: 16px; text-align: center;">
                    <span style="color: #ffab00; font-size: 12px;">
                        ⏰ 剩餘時間: <span id="energyOfferCountdown">30</span> 秒
                    </span>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button id="energyOfferPassBtn"
                            style="flex: 1; background: #9e9e9e; color: white;
                                   padding: 12px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;
                                   transition: all 0.2s ease;">
                        ❌ PASS
                    </button>
                    <button id="energyOfferBuyBtn"
                            style="flex: 1; background: linear-gradient(135deg, #4caf50, #388e3c);
                                   color: white; padding: 12px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 4px 12px rgba(76,175,80,0.3);">
                        💚 購買
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== Event binding ====================

    static bindPricePrompt(energyAmount, onConfirm) {
        const energyEl       = document.getElementById('pricePromptEnergy');
        const energyInlineEl = document.getElementById('pricePromptEnergyInline');
        if (energyEl)       energyEl.textContent = energyAmount;
        if (energyInlineEl) energyInlineEl.textContent = energyAmount;

        const input = document.getElementById('energyPriceInput');
        const btn   = document.getElementById('energyPriceConfirmBtn');

        if (btn) {
            btn.onclick = () => {
                const price = parseInt(input?.value);
                if (!price || price < 1) {
                    alert('請輸入有效的價格 (最少 1 元)');
                    return;
                }
                onConfirm(price);
            };
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.03)';
                btn.style.boxShadow = '0 6px 20px rgba(76,175,80,0.4)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)';
            };
        }

        // Focus input for immediate typing
        if (input) setTimeout(() => input.select(), 100);
    }

    static populateOffer(message) {
        const sellerEl   = document.getElementById('energyOfferSeller');
        const amountEl   = document.getElementById('energyOfferAmount');
        const priceEl    = document.getElementById('energyOfferPrice');

        if (sellerEl) sellerEl.textContent = `賣家: ${message.sellerName}`;
        if (amountEl) amountEl.textContent = message.energyAmount;
        if (priceEl)  priceEl.textContent  = message.price.toLocaleString();
    }

    static bindOfferButtons(onBuy, onPass) {
        const buyBtn  = document.getElementById('energyOfferBuyBtn');
        const passBtn = document.getElementById('energyOfferPassBtn');

        if (buyBtn) {
            buyBtn.onclick = () => onBuy();
            buyBtn.onmouseenter = () => {
                buyBtn.style.transform = 'scale(1.03)';
                buyBtn.style.boxShadow = '0 6px 20px rgba(76,175,80,0.4)';
            };
            buyBtn.onmouseleave = () => {
                buyBtn.style.transform = 'scale(1)';
                buyBtn.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)';
            };
        }

        if (passBtn) {
            passBtn.onclick = () => onPass();
            passBtn.onmouseenter = () => { passBtn.style.transform = 'scale(1.03)'; };
            passBtn.onmouseleave = () => { passBtn.style.transform = 'scale(1)'; };
        }
    }

    static startCountdown(seconds, onExpire) {
        const el = document.getElementById('energyOfferCountdown');
        if (!el) return null;

        let remaining = seconds;
        el.textContent = remaining;

        const timerId = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(timerId);
                if (onExpire) onExpire();
            }
            if (el) el.textContent = remaining;
        }, 1000);

        return timerId;
    }

    static disableButtons() {
        ['energyOfferBuyBtn', 'energyOfferPassBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        });
    }
    // ==================== Seller decision modal ====================

    static buildSellerDecideModal() {
        return `
        <div class="modal-content" style="max-width: 440px;
             background: linear-gradient(135deg, #4a2a1a, #2a1a0a);
             border-radius: 24px; padding: 24px;
             border: 2px solid #ff9800;">

            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 22px; color: #ff9800; font-weight: bold;">
                    💚 精力交易 - 你的決定
                </div>
                <div style="font-size: 12px; color: #ffcc80; margin-top: 6px;">
                    無人購買你的精力
                </div>
            </div>

            <div style="background: rgba(255,152,0,0.15); padding: 18px;
                        border-radius: 16px; margin-bottom: 16px; text-align: center;">
                <div style="color: #fff; font-size: 13px;">你的開價</div>
                <div style="color: #ff9800; font-size: 32px; font-weight: bold;
                            margin: 8px 0;">
                    💰 $<span id="sellerDecidePrice">0</span>
                </div>
                <div style="color: #fff; font-size: 13px;">
                    可獲得 ⚡ <span id="sellerDecideEnergy">5</span> 精力
                </div>
            </div>

            <div id="sellerDecideAffordWarning"
                 style="display: none; background: rgba(255,82,82,0.2);
                        padding: 10px; border-radius: 10px; margin-bottom: 14px;
                        color: #ff5252; font-size: 12px; text-align: center;
                        border: 1px solid rgba(255,82,82,0.4);">
                ⚠️ 現金不足！當前現金 $<span id="sellerDecideCash">0</span>
            </div>

            <div style="background: rgba(0,0,0,0.3); padding: 10px;
                        border-radius: 10px; margin-bottom: 16px;
                        font-size: 12px; color: #b0bec5; text-align: center;">
                💡 選擇「自買」以此價格獲得精力，或選擇「取消」放棄本次交易
            </div>

            <div style="display: flex; gap: 12px;">
                <button id="sellerDecideCancelBtn"
                        style="flex: 1; background: #9e9e9e; color: white;
                               padding: 12px; border: none;
                               border-radius: 24px; cursor: pointer;
                               font-size: 14px; font-weight: bold;
                               transition: all 0.2s ease;">
                    ❌ 取消交易
                </button>
                <button id="sellerDecideBuyBtn"
                        style="flex: 1; background: linear-gradient(135deg, #ff9800, #f57c00);
                               color: white; padding: 12px; border: none;
                               border-radius: 24px; cursor: pointer;
                               font-size: 14px; font-weight: bold;
                               transition: all 0.2s ease;
                               box-shadow: 0 4px 12px rgba(255,152,0,0.3);">
                    💚 自買精力
                </button>
            </div>
        </div>
    `;
    }

    static populateSellerDecide(message) {
        const priceEl   = document.getElementById('sellerDecidePrice');
        const energyEl  = document.getElementById('sellerDecideEnergy');
        const warningEl = document.getElementById('sellerDecideAffordWarning');
        const cashEl    = document.getElementById('sellerDecideCash');
        const buyBtn    = document.getElementById('sellerDecideBuyBtn');

        if (priceEl)  priceEl.textContent  = message.price.toLocaleString();
        if (energyEl) energyEl.textContent = message.energyAmount;

        if (!message.canAfford) {
            if (warningEl) warningEl.style.display = 'block';
            if (cashEl)    cashEl.textContent = (message.currentCash || 0).toLocaleString();
            if (buyBtn) {
                buyBtn.disabled = true;
                buyBtn.style.opacity = '0.5';
                buyBtn.style.cursor = 'not-allowed';
            }
        } else {
            if (warningEl) warningEl.style.display = 'none';
            if (buyBtn) {
                buyBtn.disabled = false;
                buyBtn.style.opacity = '1';
                buyBtn.style.cursor = 'pointer';
            }
        }
    }

    static bindSellerDecideButtons(onBuy, onCancel) {
        const buyBtn    = document.getElementById('sellerDecideBuyBtn');
        const cancelBtn = document.getElementById('sellerDecideCancelBtn');

        if (buyBtn && !buyBtn.disabled) {
            buyBtn.onclick = () => onBuy();
            buyBtn.onmouseenter = () => {
                buyBtn.style.transform = 'scale(1.03)';
                buyBtn.style.boxShadow = '0 6px 20px rgba(255,152,0,0.4)';
            };
            buyBtn.onmouseleave = () => {
                buyBtn.style.transform = 'scale(1)';
                buyBtn.style.boxShadow = '0 4px 12px rgba(255,152,0,0.3)';
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => onCancel();
            cancelBtn.onmouseenter = () => { cancelBtn.style.transform = 'scale(1.03)'; };
            cancelBtn.onmouseleave = () => { cancelBtn.style.transform = 'scale(1)'; };
        }
    }
}