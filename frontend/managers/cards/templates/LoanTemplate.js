"use strict";

export class LoanTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 520px;
                 background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ffd966; text-align: center;">

                <div style="font-size: 22px; color: #ffd966;
                            font-weight: bold; margin-bottom: 6px;">
                    🏦 銀行貸款申請
                </div>
                <div style="font-size: 12px; color: #b3e5fc; margin-bottom: 14px;">
                    貸款僅可用於投資，利息會計入每月支出
                </div>

                <div id="loanInfoBox"
                     style="background: rgba(0,0,0,0.4); padding: 14px;
                            border-radius: 14px; margin-bottom: 14px;
                            text-align: left; font-size: 13px; color: #ffe0b2;">
                </div>

                <div style="margin-bottom: 12px; text-align: left;">
                    <label style="color: #ffd966; font-size: 13px;
                                  display: block; margin-bottom: 6px;">
                        💰 貸款金額
                    </label>
                    <input type="number" id="loanAmountInput"
                           min="1"
                           placeholder="輸入金額"
                           style="width: 100%; padding: 12px;
                                  border-radius: 8px; border: 2px solid #ffd966;
                                  background: rgba(0,0,0,0.5); color: #fff;
                                  font-size: 16px; text-align: center;
                                  box-sizing: border-box;">
                    <div style="display: flex; gap: 6px; margin-top: 8px;">
                        <button class="loan-quick-btn" data-percent="25"
                                style="flex: 1; padding: 6px; font-size: 12px;
                                       background: #455a64; border: none;
                                       color: white; border-radius: 8px;
                                       cursor: pointer;">
                            25%
                        </button>
                        <button class="loan-quick-btn" data-percent="50"
                                style="flex: 1; padding: 6px; font-size: 12px;
                                       background: #455a64; border: none;
                                       color: white; border-radius: 8px;
                                       cursor: pointer;">
                            50%
                        </button>
                        <button class="loan-quick-btn" data-percent="100"
                                style="flex: 1; padding: 6px; font-size: 12px;
                                       background: #455a64; border: none;
                                       color: white; border-radius: 8px;
                                       cursor: pointer;">
                            全額
                        </button>
                    </div>
                </div>

                <div id="loanPreview"
                     style="background: rgba(255,193,7,0.15);
                            border: 1px solid rgba(255,193,7,0.4);
                            border-radius: 10px; padding: 12px;
                            margin-bottom: 14px; text-align: left;
                            font-size: 13px; color: #ffd966;
                            display: none;">
                </div>

                <div style="display: flex; gap: 10px;">
                    <button id="loanCancelBtn"
                            style="flex: 1; background: #9e9e9e; color: white;
                                   padding: 10px; border: none;
                                   border-radius: 20px; cursor: pointer;
                                   font-size: 14px;">
                        取消
                    </button>
                    <button id="loanConfirmBtn"
                            style="flex: 2; background: linear-gradient(135deg, #4caf50, #2e7d32);
                                   color: white; padding: 10px; border: none;
                                   border-radius: 20px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;">
                        🏦 確認申請
                    </button>
                </div>

                <div style="margin-top: 12px; font-size: 11px; color: #90a4ae;">
                    💡 貸款後每月現金流必須 &gt; 0 才可申請
                </div>
            </div>
        `;
    }

    /**
     * Populate the loan modal with server data.
     */
    static populate(info, callbacks) {
        const infoBox  = document.getElementById('loanInfoBox');
        const rateName = (info.monthlyRate * 100).toFixed(1) + '%';

        // Current loan warning
        const hasActiveLoan = info.currentLoan > 0;

        // Replace the infoBox.innerHTML section with:
        if (infoBox) {
            infoBox.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px;">
            <div>💵 現金:</div>
            <div>🏦 貸款金:</div>
                <div style="text-align: right; color: #4fc3f7;">
                <strong>$${(info.loanCash || 0).toLocaleString()}</strong>
            </div>
            <div style="text-align: right; color: #4caf50;">
                <strong>$${info.cash.toLocaleString()}</strong>
            </div>

            <div>📊 月現金流:</div>
            <div style="text-align: right; color: ${info.monthlyCashflow >= 0 ? '#4caf50' : '#ff6b6b'};">
                <strong>$${info.monthlyCashflow.toLocaleString()}</strong>
            </div>

            <div>💼 月收入:</div>
            <div style="text-align: right;">
                <strong>$${info.monthlyIncome.toLocaleString()}</strong>
            </div>

            <div>📈 貸款上限:</div>
            <div style="text-align: right; color: #ffd966;">
                <strong>$${info.maxLoan.toLocaleString()}</strong>
                <span style="font-size: 10px; color: #90a4ae;">
                    (月現金流 × ${info.capMultiplier})
                </span>
            </div>

            <div>💸 月利率:</div>
            <div style="text-align: right; color: #ff9800;">
                <strong>${rateName}</strong>
            </div>

            ${hasActiveLoan ? `
                <div style="grid-column: 1/-1; margin-top: 8px;
                            padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);
                            color: #ff6b6b;">
                    ⚠️ 你已有 $${info.currentLoan.toLocaleString()} 元貸款未還清
                </div>
            ` : ''}
        </div>
    `;
        }

        const amountInput = document.getElementById('loanAmountInput');
        const previewEl   = document.getElementById('loanPreview');
        const confirmBtn  = document.getElementById('loanConfirmBtn');
        const cancelBtn   = document.getElementById('loanCancelBtn');

        // Set max
        if (amountInput) {
            amountInput.max = info.maxLoan;
        }

        // Disable confirm if:
        // - active loan exists
        // - max is 0 (cashflow ≤ 0)
        if (hasActiveLoan || info.maxLoan <= 0) {
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.4';
                confirmBtn.style.cursor  = 'not-allowed';
                confirmBtn.textContent   = hasActiveLoan ? '❌ 已有未還清貸款' : '❌ 無法貸款';
            }
            if (amountInput) amountInput.disabled = true;
        }

        // Live preview + cashflow check
        const updatePreview = () => {
            const amt = parseInt(amountInput?.value) || 0;
            if (amt <= 0 || amt > info.maxLoan) {
                previewEl.style.display = 'none';
                if (confirmBtn && !hasActiveLoan && info.maxLoan > 0) {
                    confirmBtn.disabled = true;
                    confirmBtn.style.opacity = '0.4';
                    confirmBtn.textContent   = '🏦 確認申請';
                }
                return;
            }

            const monthlyInterest = Math.round(amt * info.monthlyRate);
            const cashflowAfter   = info.monthlyCashflow - monthlyInterest;
            const totalToRepay    = amt + monthlyInterest;

            const isBad = cashflowAfter < 0;

            previewEl.style.display = 'block';
            previewEl.style.background = isBad
                ? 'rgba(244,67,54,0.15)'
                : 'rgba(76,175,80,0.15)';
            previewEl.style.borderColor = isBad
                ? 'rgba(244,67,54,0.5)'
                : 'rgba(76,175,80,0.5)';

            previewEl.innerHTML = `
                <div>💰 貸款: <strong>$${amt.toLocaleString()}</strong></div>
                <div>💸 月利息: <strong>$${monthlyInterest.toLocaleString()}</strong> (${(info.monthlyRate * 100).toFixed(1)}%)</div>
                <div>📊 貸款後月現金流:
                    <strong style="color: ${isBad ? '#ff6b6b' : '#4caf50'};">
                        $${cashflowAfter.toLocaleString()}
                    </strong>
                </div>
                <div>💵 每月總本利: <strong>$${totalToRepay.toLocaleString()}</strong></div>
                ${isBad ? `
                    <div style="color: #ff6b6b; margin-top: 6px; font-weight: bold;">
                        ⚠️ 現金流會變成 < 0，禁止貸款！
                    </div>
                ` : ''}
            `;

            if (confirmBtn && !hasActiveLoan) {
                confirmBtn.disabled = isBad;
                confirmBtn.style.opacity = isBad ? '0.4' : '1';
                confirmBtn.style.cursor  = isBad ? 'not-allowed' : 'pointer';
                confirmBtn.textContent   = isBad ? '❌ 現金流不足' : '🏦 確認申請';
            }
        };

        if (amountInput) {
            amountInput.addEventListener('input', updatePreview);
        }

        // Quick buttons
        document.querySelectorAll('.loan-quick-btn').forEach(btn => {
            btn.onclick = () => {
                const pct = parseInt(btn.dataset.percent);
                const val = Math.round(info.maxLoan * pct / 100);
                if (amountInput) {
                    amountInput.value = val;
                    updatePreview();
                }
            };
        });

        // Confirm
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                const amt = parseInt(amountInput?.value);
                if (!amt || amt <= 0) { alert('請輸入貸款金額'); return; }
                if (amt > info.maxLoan) { alert(`超出上限 $${info.maxLoan.toLocaleString()}`); return; }
                callbacks.onConfirm(amt);
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => callbacks.onCancel();
        }
    }

    // ==================== Repay Modal ====================

    static buildRepayModal() {
        return `
        <div class="modal-content" style="max-width: 480px;
             background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
             border-radius: 24px; padding: 24px;
             border: 2px solid #4caf50; text-align: center;">

            <div style="font-size: 22px; color: #4caf50;
                        font-weight: bold; margin-bottom: 6px;">
                💰 償還貸款
            </div>
            <div style="font-size: 12px; color: #a5d6a7; margin-bottom: 14px;">
                只能使用現金還款（貸款金不可用於還債）
            </div>

            <div id="loanRepayInfoBox"
                 style="background: rgba(0,0,0,0.4); padding: 14px;
                        border-radius: 14px; margin-bottom: 14px;
                        text-align: left; font-size: 13px; color: #ffe0b2;">
            </div>

            <div style="margin-bottom: 12px; text-align: left;">
                <label style="color: #a5d6a7; font-size: 13px;
                              display: block; margin-bottom: 6px;">
                    💵 還款金額
                </label>
                <input type="number" id="loanRepayAmountInput"
                       min="1" step="1" inputmode="numeric"
                       placeholder="輸入金額"
                       style="width: 100%; padding: 12px;
                              border-radius: 8px; border: 2px solid #4caf50;
                              background: rgba(0,0,0,0.5); color: #fff;
                              font-size: 16px; text-align: center;
                              box-sizing: border-box;">
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button class="loan-repay-quick-btn" data-mode="interest"
                            style="flex: 1; padding: 6px; font-size: 12px;
                                   background: #ff9800; border: none;
                                   color: white; border-radius: 8px;
                                   cursor: pointer;">
                        僅還累積利息
                    </button>
                    <button class="loan-repay-quick-btn" data-mode="half"
                            style="flex: 1; padding: 6px; font-size: 12px;
                                   background: #455a64; border: none;
                                   color: white; border-radius: 8px;
                                   cursor: pointer;">
                        還一半
                    </button>
                    <button class="loan-repay-quick-btn" data-mode="full"
                            style="flex: 1; padding: 6px; font-size: 12px;
                                   background: #4caf50; border: none;
                                   color: white; border-radius: 8px;
                                   cursor: pointer;">
                        全部還清
                    </button>
                </div>
            </div>

            <div id="loanRepayPreview"
                 style="background: rgba(76,175,80,0.15);
                        border: 1px solid rgba(76,175,80,0.4);
                        border-radius: 10px; padding: 12px;
                        margin-bottom: 14px; text-align: left;
                        font-size: 13px; color: #a5d6a7;
                        display: none;">
            </div>

            <div style="display: flex; gap: 10px;">
                <button id="loanRepayCancelBtn"
                        style="flex: 1; background: #9e9e9e; color: white;
                               padding: 10px; border: none;
                               border-radius: 20px; cursor: pointer;
                               font-size: 14px;">
                    取消
                </button>
                <button id="loanRepayConfirmBtn"
                        style="flex: 2; background: linear-gradient(135deg, #4caf50, #2e7d32);
                               color: white; padding: 10px; border: none;
                               border-radius: 20px; cursor: pointer;
                               font-size: 14px; font-weight: bold;">
                    💰 確認還款
                </button>
            </div>

            <div style="margin-top: 12px; font-size: 11px; color: #90a4ae;">
                💡 還款會先扣利息，再扣本金
            </div>
        </div>
    `;
    }

    static populateRepay(info, callbacks) {
        const infoBox      = document.getElementById('loanRepayInfoBox');
        const amountInput  = document.getElementById('loanRepayAmountInput');
        const previewEl    = document.getElementById('loanRepayPreview');
        const confirmBtn   = document.getElementById('loanRepayConfirmBtn');
        const cancelBtn    = document.getElementById('loanRepayCancelBtn');

        const principal       = info.currentLoan;
        const accruedInterest = info.accruedInterest || 0;
        const rate            = info.monthlyRate;
        const totalOwed       = info.totalOwed;
        const cash            = info.cash;
        const maxRepay        = Math.min(cash, totalOwed);

        if (infoBox) {
            infoBox.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px;">
            <div>💵 現金:</div>
            <div style="text-align: right; color: #4caf50;">
                <strong>$${cash.toLocaleString()}</strong>
            </div>

            <div>🏦 貸款金 (不可用):</div>
            <div style="text-align: right; color: #90a4ae;">
                <strong>$${(info.loanCash || 0).toLocaleString()}</strong>
            </div>

            <div style="grid-column: 1/-1; padding-top: 8px;
                        border-top: 1px solid rgba(255,255,255,0.1);
                        margin-top: 4px;"></div>

            <div>💰 貸款本金:</div>
            <div style="text-align: right;">
                <strong>$${principal.toLocaleString()}</strong>
            </div>

            <div>💸 累積利息:</div>
            <div style="text-align: right; color: #ff9800;">
                <strong>$${accruedInterest.toLocaleString()}</strong>
            </div>

            <div>📊 月利率:</div>
            <div style="text-align: right;">
                <strong>${(rate * 100).toFixed(1)}%</strong>
            </div>

            <div>💵 總欠款 (本利和):</div>
            <div style="text-align: right; color: #ffd966;">
                <strong>$${totalOwed.toLocaleString()}</strong>
            </div>

            <div>📅 已過結算日:</div>
            <div style="text-align: right;">
                <strong>${info.settlementCount}/12</strong>
            </div>

            ${cash < totalOwed ? `
                <div style="grid-column: 1/-1; margin-top: 8px;
                            padding-top: 8px;
                            border-top: 1px solid rgba(255,255,255,0.2);
                            color: #ff9800; font-size: 12px;">
                    ⚠️ 現金不足以全額還清，可選擇部分還款
                </div>
            ` : ''}
        </div>
    `;
        }

        if (amountInput) {
            amountInput.max = maxRepay;
        }

        const updatePreview = () => {
            let amt = parseInt(amountInput?.value, 10);
            if (isNaN(amt)) amt = 0;

            if (amt <= 0) {
                previewEl.style.display = 'none';
                if (confirmBtn) {
                    confirmBtn.disabled      = true;
                    confirmBtn.style.opacity = '0.4';
                    confirmBtn.textContent   = '💰 確認還款';
                }
                return;
            }

            if (amt > totalOwed) {
                amt = totalOwed;
                amountInput.value = amt;
            }

            const willBeFullyPaid = amt >= totalOwed;
            const loanCash        = info.loanCash || 0;

            // ✅ Calculate loan cash refund (only on full repay)
            let loanCashReturned = 0;
            let cashRequired     = amt;

            if (willBeFullyPaid && loanCash > 0) {
                loanCashReturned = Math.min(loanCash, principal);
                cashRequired     = amt - loanCashReturned;
            }

            if (cashRequired > cash) {
                previewEl.style.display     = 'block';
                previewEl.style.background  = 'rgba(244,67,54,0.15)';
                previewEl.style.borderColor = 'rgba(244,67,54,0.5)';
                previewEl.innerHTML = `
            <div style="color: #ff6b6b;">
                ❌ 現金不足！需要 $${cashRequired.toLocaleString()}
                ${loanCashReturned > 0 ? `<br>(已抵銷返還貸款金 $${loanCashReturned.toLocaleString()})` : ''}
                <br>你只有 $${cash.toLocaleString()}
            </div>
        `;
                if (confirmBtn) {
                    confirmBtn.disabled      = true;
                    confirmBtn.style.opacity = '0.4';
                    confirmBtn.textContent   = '❌ 現金不足';
                }
                return;
            }

            // Payment: accrued interest first, then principal
            const paidInterest  = Math.min(amt, accruedInterest);
            const paidPrincipal = amt - paidInterest;
            const newPrincipal  = principal - paidPrincipal;
            const newAccrued    = accruedInterest - paidInterest;

            previewEl.style.display     = 'block';
            previewEl.style.background  = willBeFullyPaid
                ? 'rgba(76,175,80,0.2)'
                : 'rgba(76,175,80,0.15)';
            previewEl.style.borderColor = 'rgba(76,175,80,0.5)';

            previewEl.innerHTML = `
        <div>💸 償還累積利息: <strong>$${paidInterest.toLocaleString()}</strong></div>
        <div>💰 償還本金: <strong>$${paidPrincipal.toLocaleString()}</strong></div>
        ${loanCashReturned > 0 ? `
            <div style="color: #4fc3f7; margin-top: 4px;">
                🏦 返還未用貸款金: <strong>-$${loanCashReturned.toLocaleString()}</strong>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1);
                        margin-top: 6px; padding-top: 6px;">
                💵 實付現金:
                <strong style="color: #ff9800;">
                    $${cashRequired.toLocaleString()}
                </strong>
            </div>
        ` : ''}
        <div style="border-top: 1px solid rgba(255,255,255,0.1);
                    margin-top: 6px; padding-top: 6px;">
            📊 還款後:
            <br>剩餘本金:
            <strong style="color: ${willBeFullyPaid ? '#4caf50' : '#ffd966'};">
                $${Math.max(0, newPrincipal).toLocaleString()}
            </strong>
            <br>剩餘累積利息:
            <strong style="color: ${willBeFullyPaid ? '#4caf50' : '#ff9800'};">
                $${Math.max(0, newAccrued).toLocaleString()}
            </strong>
        </div>
        <div>💵 還款後現金:
            <strong>$${(cash - cashRequired).toLocaleString()}</strong>
        </div>
        ${willBeFullyPaid && loanCash > 0 ? `
            <div>🏦 還款後貸款金:
                <strong style="color: #4caf50;">
                    $${(loanCash - loanCashReturned).toLocaleString()}
                </strong>
            </div>
        ` : ''}
        ${willBeFullyPaid ? `
            <div style="color: #4caf50; margin-top: 6px; font-weight: bold;">
                ✅ 貸款將全部還清！${loanCashReturned > 0 ? '未用貸款金會歸還銀行' : ''}
            </div>
        ` : ''}
    `;

            if (confirmBtn) {
                confirmBtn.disabled      = false;
                confirmBtn.style.opacity = '1';
                confirmBtn.style.cursor  = 'pointer';
                confirmBtn.textContent   = willBeFullyPaid
                    ? '✅ 全額還清'
                    : `💰 還款 $${amt.toLocaleString()}`;
            }
        };
        if (amountInput) {
            amountInput.addEventListener('input', updatePreview);
        }

        // Quick buttons
        document.querySelectorAll('.loan-repay-quick-btn').forEach(btn => {
            btn.onclick = () => {
                const mode = btn.dataset.mode;
                let val = 0;

                if (mode === 'interest') {
                    val = Math.min(accruedInterest, cash);        // ✅ pay off just the accrued interest
                } else if (mode === 'half') {
                    val = Math.min(Math.round(totalOwed / 2), cash);   // ✅ half of total owed
                } else if (mode === 'full') {
                    val = Math.min(totalOwed, cash);              // ✅ full total owed
                }

                if (amountInput) {
                    amountInput.value = val;
                    updatePreview();
                }
            };
        });

        // Confirm
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                const amt = parseInt(amountInput?.value, 10);
                if (!amt || amt <= 0) { alert('請輸入還款金額'); return; }
                if (amt > cash) { alert(`現金不足，你只有 $${cash.toLocaleString()}`); return; }
                callbacks.onConfirm(amt);
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => callbacks.onCancel();
        }

        // Trigger once for initial state
        setTimeout(updatePreview, 50);
    }
}