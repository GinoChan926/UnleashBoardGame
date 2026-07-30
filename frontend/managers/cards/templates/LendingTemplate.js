"use strict";

export class LendingTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 680px;
                 background: linear-gradient(135deg, #2a2a3a, #1a1a2a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #f57c00;
                 max-height: 85vh; overflow-y: auto;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #ffb74d; font-weight: bold;">
                        💸 借還款管理
                    </div>
                    <div style="font-size: 12px; color: #ffe0b2; margin-top: 4px;">
                        隨時可以借款/還款，不限回合，可設定利率
                    </div>
                </div>

                <div id="lendingCashDisplay"
                     style="background: rgba(245,124,0,0.15); padding: 10px;
                            border-radius: 10px; margin-bottom: 14px;
                            text-align: center; color: #ffd966;
                            border: 1px solid rgba(245,124,0,0.3);">
                </div>

                <div id="lendingTabs" style="display: flex; gap: 6px;
                     margin-bottom: 14px; flex-wrap: wrap; justify-content: center;">
                </div>

                <div id="lendingContent"
                     style="min-height: 200px; max-height: 55vh;
                            overflow-y: auto; padding-right: 4px;">
                </div>

                <div style="text-align: center; margin-top: 16px;">
                    <button id="lendingCloseBtn"
                            style="background: #9e9e9e; color: white;
                                   padding: 10px 30px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 14px;">
                        關閉
                    </button>
                </div>
            </div>
        `;
    }

    static populate(message, escapeHtml, callbacks) {
        this._buildCashDisplay(message.cash);
        this._buildTabs(message, escapeHtml, callbacks);
        this._showTab('lend', message, escapeHtml, callbacks);
        this._bindClose(callbacks.onClose);
    }

    // ==================== Private ====================

    static _buildCashDisplay(cash) {
        const el = document.getElementById('lendingCashDisplay');
        if (el) {
            el.innerHTML = `💵 你的現金: <strong style="color: #ffd966; font-size: 16px;">$${cash.toLocaleString()}</strong>`;
        }
    }

    static _buildTabs(message, escapeHtml, callbacks) {
        const tabsEl = document.getElementById('lendingTabs');
        if (!tabsEl) return;

        const totalLent = message.lentOut.reduce((s, d) => s + d.amount, 0);
        const totalOwed = message.debtsOwed.reduce((s, d) => s + d.amount, 0);

        // ✅ NEW: bank debt total
        const pendingDebts   = message.pendingDebts || [];
        const totalBankDebt  = pendingDebts.reduce((s, d) => s + d.amount, 0);

        const tabs = [
            { key: 'lend',  label: '💸 借出',     count: null },
            { key: 'lent',  label: '📤 已借出',   count: `$${totalLent.toLocaleString()}` },
            { key: 'owed',  label: '📥 待還款',   count: `$${totalOwed.toLocaleString()}` }
        ];

        // ✅ Only show bank debt tab if there are any
        if (pendingDebts.length > 0) {
            tabs.push({
                key:   'bank',
                label: '🏦 銀行債務',
                count: `$${totalBankDebt.toLocaleString()}`
            });
        }

        tabsEl.innerHTML = '';
        tabs.forEach((tab, idx) => {
            const btn = document.createElement('button');
            btn.className = 'lending-tab-btn';
            btn.dataset.tabKey = tab.key;

            const isActive = idx === 0;
            const isBank   = tab.key === 'bank';

            btn.style.cssText = `
                background: ${isActive
                ? 'linear-gradient(135deg, #f57c00, #e65100)'
                : isBank
                    ? 'rgba(239,83,80,0.3)'
                    : 'rgba(0,0,0,0.4)'};
                color: white;
                padding: 8px 14px;
                border: 1px solid ${
                isActive ? '#ffb74d'
                    : isBank ? '#ef5350'
                        : 'rgba(255,255,255,0.2)'
            };
                border-radius: 20px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s ease;
            `;

            btn.innerHTML = tab.count
                ? `${tab.label} <span style="color: ${isBank ? '#ff8a80' : '#ffd966'}; margin-left: 4px;">(${tab.count})</span>`
                : tab.label;

            btn.onclick = () => {
                document.querySelectorAll('.lending-tab-btn').forEach(b => {
                    const bIsBank = b.dataset.tabKey === 'bank';
                    b.style.background = bIsBank
                        ? 'rgba(239,83,80,0.3)'
                        : 'rgba(0,0,0,0.4)';
                    b.style.borderColor = bIsBank
                        ? '#ef5350'
                        : 'rgba(255,255,255,0.2)';
                });
                btn.style.background  = 'linear-gradient(135deg, #f57c00, #e65100)';
                btn.style.borderColor = '#ffb74d';
                this._showTab(tab.key, message, escapeHtml, callbacks);
            };

            tabsEl.appendChild(btn);
        });
    }

    static _showTab(tabKey, message, escapeHtml, callbacks) {
        const contentEl = document.getElementById('lendingContent');
        if (!contentEl) return;

        if (tabKey === 'lend') {
            this._renderLendForm(contentEl, message, escapeHtml, callbacks);
        } else if (tabKey === 'lent') {
            this._renderLentList(contentEl, message.lentOut, escapeHtml);
        } else if (tabKey === 'owed') {
            this._renderOwedList(contentEl, message.debtsOwed, escapeHtml, callbacks);
        } else if (tabKey === 'bank') {
            // ✅ NEW
            this._renderBankDebtList(
                contentEl,
                message.pendingDebts || [],
                message.cash,
                escapeHtml,
                callbacks
            );
        }
    }

    // ==================== Lend form ====================

    static _renderLendForm(container, message, escapeHtml, callbacks) {
        if (message.otherPlayers.length === 0) {
            container.innerHTML = this._emptyState('📭 沒有其他玩家可以借錢');
            return;
        }

        const options = message.otherPlayers.map(p =>
            `<option value="${p.playerId}">${escapeHtml(p.playerName)}</option>`
        ).join('');

        container.innerHTML = `
            <div style="background: rgba(0,0,0,0.4); padding: 16px;
                        border-radius: 12px;">

                <div style="margin-bottom: 12px;">
                    <label style="color: #ffe0b2; font-size: 13px;
                                  display: block; margin-bottom: 6px;">
                        👤 借給誰？
                    </label>
                    <select id="lendTargetSelect"
                            style="width: 100%; padding: 10px;
                                   border-radius: 8px; border: 2px solid #f57c00;
                                   background: rgba(0,0,0,0.5); color: #fff;
                                   font-size: 14px; box-sizing: border-box;">
                        <option value="">-- 請選擇玩家 --</option>
                        ${options}
                    </select>
                </div>

                <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                    <div style="flex: 2;">
                        <label style="color: #ffe0b2; font-size: 13px;
                                      display: block; margin-bottom: 6px;">
                            💰 借款金額 (本金)
                        </label>
                        <input type="number" id="lendAmountInput"
                               min="1" max="${message.cash}"
                               placeholder="輸入金額"
                               style="width: 100%; padding: 10px;
                                      border-radius: 8px; border: 2px solid #f57c00;
                                      background: rgba(0,0,0,0.5); color: #fff;
                                      font-size: 16px; text-align: center; box-sizing: border-box;">
                    </div>

                    <div style="flex: 1;">
                        <label style="color: #ffe0b2; font-size: 13px;
                                      display: block; margin-bottom: 6px;">
                            📈 利率 (%)
                        </label>
                        <input type="number" id="lendInterestInput"
                               min="0" max="100" step="0.5" value="0"
                               placeholder="0"
                               style="width: 100%; padding: 10px;
                                      border-radius: 8px; border: 2px solid #f57c00;
                                      background: rgba(0,0,0,0.5); color: #fff;
                                      font-size: 16px; text-align: center; box-sizing: border-box;">
                    </div>
                </div>

                <div id="lendPreview" style="
                    background: rgba(255,193,7,0.15);
                    border: 1px solid rgba(255,193,7,0.4);
                    border-radius: 10px;
                    padding: 10px;
                    margin-bottom: 12px;
                    color: #ffd966;
                    font-size: 13px;
                    text-align: center;
                    display: none;
                "></div>

                <div style="margin-bottom: 14px;">
                    <label style="color: #ffe0b2; font-size: 13px;
                                  display: block; margin-bottom: 6px;">
                        📝 備註 (可選, 最多 100 字)
                    </label>
                    <input type="text" id="lendNoteInput"
                           maxlength="100"
                           placeholder="例如: 食飯錢"
                           style="width: 100%; padding: 10px;
                                  border-radius: 8px; border: 2px solid #f57c00;
                                  background: rgba(0,0,0,0.5); color: #fff;
                                  font-size: 13px; box-sizing: border-box;">
                </div>

                <button id="lendSubmitBtn"
                        style="width: 100%; background: linear-gradient(135deg, #f57c00, #e65100);
                               color: white; padding: 12px; border: none;
                               border-radius: 24px; cursor: pointer;
                               font-size: 15px; font-weight: bold;
                               box-shadow: 0 4px 12px rgba(245,124,0,0.3);">
                    💸 確認借出
                </button>
            </div>

            <div style="text-align: center; font-size: 11px;
                        color: #ffcc80; margin-top: 12px;">
                💡 設定利率後，對方需償還 本金 + 利息
            </div>
        `;

        const amountInput   = document.getElementById('lendAmountInput');
        const interestInput = document.getElementById('lendInterestInput');
        const previewEl     = document.getElementById('lendPreview');

        const updatePreview = () => {
            const amount = parseInt(amountInput.value) || 0;
            const rate   = parseFloat(interestInput.value) || 0;

            if (amount > 0) {
                const interest = Math.floor(amount * rate / 100);
                const total    = amount + interest;

                previewEl.innerHTML = rate > 0
                    ? `💰 本金 <strong>$${amount.toLocaleString()}</strong>
                       + 利息 <strong>$${interest.toLocaleString()}</strong>
                       (${rate}%)
                       = 對方需還 <strong style="color: #fff;">$${total.toLocaleString()}</strong>`
                    : `💰 本金 <strong>$${amount.toLocaleString()}</strong> (無利息)`;
                previewEl.style.display = 'block';
            } else {
                previewEl.style.display = 'none';
            }
        };

        amountInput.addEventListener('input', updatePreview);
        interestInput.addEventListener('input', updatePreview);

        const submitBtn = document.getElementById('lendSubmitBtn');
        if (submitBtn) {
            submitBtn.onclick = () => {
                const targetPlayerId = document.getElementById('lendTargetSelect')?.value;
                const amount         = parseInt(amountInput?.value);
                const interestRate   = parseFloat(interestInput?.value) || 0;
                const note           = document.getElementById('lendNoteInput')?.value || '';

                if (!targetPlayerId) { alert('請選擇借款對象'); return; }
                if (!amount || amount < 1) { alert('請輸入有效金額'); return; }
                if (amount > message.cash) { alert('現金不足'); return; }
                if (interestRate < 0 || interestRate > 100) { alert('利率必須介於 0 到 100%'); return; }

                callbacks.onLend(targetPlayerId, amount, note, interestRate);
            };
            submitBtn.onmouseenter = () => {
                submitBtn.style.transform = 'scale(1.02)';
                submitBtn.style.boxShadow = '0 6px 18px rgba(245,124,0,0.5)';
            };
            submitBtn.onmouseleave = () => {
                submitBtn.style.transform = 'scale(1)';
                submitBtn.style.boxShadow = '0 4px 12px rgba(245,124,0,0.3)';
            };
        }
    }

    // ==================== Lent-out list ====================

    static _renderLentList(container, lentOut, escapeHtml) {
        if (lentOut.length === 0) {
            container.innerHTML = this._emptyState('📭 你目前沒有借出任何金錢');
            return;
        }

        const totalPrincipal = lentOut.reduce((s, d) => s + (d.principal || d.originalAmount), 0);
        const totalInterest  = lentOut.reduce((s, d) => s + (d.interestAmount || 0), 0);
        const totalOwed      = lentOut.reduce((s, d) => s + d.amount, 0);

        let html = `
            <div style="background: rgba(76,175,80,0.15); padding: 10px;
                        border-radius: 10px; margin-bottom: 12px;
                        text-align: center; color: #81c784;
                        border: 1px solid rgba(76,175,80,0.3);">
                📤 本金 <strong>$${totalPrincipal.toLocaleString()}</strong>
                + 利息 <strong>$${totalInterest.toLocaleString()}</strong>
                | 尚未收回 <strong style="color: #fff;">$${totalOwed.toLocaleString()}</strong>
            </div>
        `;

        lentOut.forEach(d => {
            const principal  = d.principal      || d.originalAmount;
            const interest   = d.interestAmount || 0;
            const rate       = d.interestRate   || 0;
            const totalOwed  = d.originalAmount;
            const paid       = totalOwed - d.amount;
            const progress   = totalOwed > 0 ? Math.round((paid / totalOwed) * 100) : 0;

            html += `
                <div style="background: rgba(0,0,0,0.4); border-radius: 12px;
                            padding: 14px; margin-bottom: 10px;
                            border-left: 4px solid #4caf50;">
                    <div style="display: flex; justify-content: space-between;
                                align-items: center; margin-bottom: 8px;">
                        <div style="color: #81c784; font-weight: bold; font-size: 15px;">
                            📤 借給 ${escapeHtml(d.to)}
                        </div>
                        <div style="color: #ffd966; font-weight: bold;">
                            剩 $${d.amount.toLocaleString()}
                        </div>
                    </div>

                    <div style="font-size: 12px; color: #b0bec5; margin-bottom: 8px;
                                display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
                        <div>💰 本金: <strong>$${principal.toLocaleString()}</strong></div>
                        <div>📈 利率: <strong>${rate}%</strong></div>
                        <div>💵 利息: <strong>$${interest.toLocaleString()}</strong></div>
                        <div>💸 總額: <strong>$${totalOwed.toLocaleString()}</strong></div>
                        <div style="grid-column: 1/-1;">✅ 已收: <strong>$${paid.toLocaleString()}</strong></div>
                        ${d.note ? `<div style="grid-column: 1/-1;">📝 ${escapeHtml(d.note)}</div>` : ''}
                    </div>

                    <div style="background: rgba(0,0,0,0.5); height: 6px;
                                border-radius: 3px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #4caf50, #81c784);
                                    height: 100%; width: ${progress}%;
                                    transition: width 0.3s ease;">
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 10px;
                                color: #90a4ae; margin-top: 2px;">
                        還款進度 ${progress}%
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ==================== Owed-debts list ====================

    static _renderOwedList(container, debtsOwed, escapeHtml, callbacks) {
        if (debtsOwed.length === 0) {
            container.innerHTML = this._emptyState('✅ 你目前沒有任何欠款！');
            return;
        }

        const totalPrincipal = debtsOwed.reduce((s, d) => s + (d.principal || d.originalAmount), 0);
        const totalInterest  = debtsOwed.reduce((s, d) => s + (d.interestAmount || 0), 0);
        const totalOwed      = debtsOwed.reduce((s, d) => s + d.amount, 0);

        let html = `
            <div style="background: rgba(244,67,54,0.15); padding: 10px;
                        border-radius: 10px; margin-bottom: 12px;
                        text-align: center; color: #ff8a80;
                        border: 1px solid rgba(244,67,54,0.3);">
                📥 本金 <strong>$${totalPrincipal.toLocaleString()}</strong>
                + 利息 <strong>$${totalInterest.toLocaleString()}</strong>
                | 尚欠 <strong style="color: #fff;">$${totalOwed.toLocaleString()}</strong>
            </div>
        `;

        debtsOwed.forEach(d => {
            const principal  = d.principal      || d.originalAmount;
            const interest   = d.interestAmount || 0;
            const rate       = d.interestRate   || 0;
            const totalOwed  = d.originalAmount;
            const paid       = totalOwed - d.amount;
            const progress   = totalOwed > 0 ? Math.round((paid / totalOwed) * 100) : 0;

            html += `
                <div style="background: rgba(0,0,0,0.4); border-radius: 12px;
                            padding: 14px; margin-bottom: 10px;
                            border-left: 4px solid #f44336;">
                    <div style="display: flex; justify-content: space-between;
                                align-items: center; margin-bottom: 8px;">
                        <div style="color: #ff8a80; font-weight: bold; font-size: 15px;">
                            📥 欠 ${escapeHtml(d.from)}
                        </div>
                        <div style="color: #ffd966; font-weight: bold;">
                            剩 $${d.amount.toLocaleString()}
                        </div>
                    </div>

                    <div style="font-size: 12px; color: #b0bec5; margin-bottom: 8px;
                                display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
                        <div>💰 本金: <strong>$${principal.toLocaleString()}</strong></div>
                        <div>📈 利率: <strong>${rate}%</strong></div>
                        <div>💵 利息: <strong>$${interest.toLocaleString()}</strong></div>
                        <div>💸 總額: <strong>$${totalOwed.toLocaleString()}</strong></div>
                        <div style="grid-column: 1/-1;">✅ 已還: <strong>$${paid.toLocaleString()}</strong></div>
                        ${d.note ? `<div style="grid-column: 1/-1;">📝 ${escapeHtml(d.note)}</div>` : ''}
                    </div>

                    <div style="background: rgba(0,0,0,0.5); height: 6px;
                                border-radius: 3px; overflow: hidden;
                                margin-bottom: 10px;">
                        <div style="background: linear-gradient(90deg, #4caf50, #81c784);
                                    height: 100%; width: ${progress}%;
                                    transition: width 0.3s ease;">
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="number" class="repay-amount-input"
                               data-debt-id="${d.debtId}"
                               min="1" max="${d.amount}"
                               placeholder="還款金額"
                               style="flex: 1; padding: 8px; border-radius: 8px;
                                      border: 1px solid #f44336;
                                      background: rgba(0,0,0,0.5); color: #fff;
                                      font-size: 13px; text-align: center; box-sizing: border-box;">
                        <button class="repay-partial-btn"
                                data-debt-id="${d.debtId}"
                                style="background: #ff9800; color: white;
                                       padding: 8px 14px; border: none;
                                       border-radius: 20px; cursor: pointer;
                                       font-size: 12px; white-space: nowrap;">
                            💰 部分還款
                        </button>
                        <button class="repay-full-btn"
                                data-debt-id="${d.debtId}"
                                data-full-amount="${d.amount}"
                                style="background: linear-gradient(135deg, #4caf50, #388e3c);
                                       color: white; padding: 8px 14px; border: none;
                                       border-radius: 20px; cursor: pointer;
                                       font-size: 12px; white-space: nowrap;">
                            ✅ 全額還清
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        document.querySelectorAll('.repay-partial-btn').forEach(btn => {
            btn.onclick = () => {
                const debtId = btn.dataset.debtId;
                const input  = document.querySelector(`.repay-amount-input[data-debt-id="${debtId}"]`);
                const amount = parseInt(input?.value);
                if (!amount || amount < 1) { alert('請輸入還款金額'); return; }
                if (confirm(`確認還款 $${amount.toLocaleString()} 嗎？`)) {
                    callbacks.onRepay(debtId, amount);
                }
            };
        });

        document.querySelectorAll('.repay-full-btn').forEach(btn => {
            btn.onclick = () => {
                const debtId = btn.dataset.debtId;
                const amount = parseInt(btn.dataset.fullAmount);
                if (confirm(`確認全額還清 $${amount.toLocaleString()} 嗎？（含利息）`)) {
                    callbacks.onRepay(debtId, amount);
                }
            };
        });
    }

    // ==================== 🏦 NEW: Bank debt list ====================

    static _renderBankDebtList(container, pendingDebts, currentCash, escapeHtml, callbacks) {
        if (pendingDebts.length === 0) {
            container.innerHTML = this._emptyState('✅ 你目前沒有任何銀行債務！');
            return;
        }

        const totalDebt = pendingDebts.reduce((s, d) => s + d.amount, 0);

        let html = `
            <div style="background: rgba(239,83,80,0.15); padding: 12px;
                        border-radius: 10px; margin-bottom: 12px;
                        text-align: center; color: #ff8a80;
                        border: 1px solid rgba(239,83,80,0.3);">
                🏦 待償還銀行債務總額
                <strong style="color: #fff; font-size: 18px;">
                    $${totalDebt.toLocaleString()}
                </strong>
                <div style="font-size: 11px; color: #ffcdd2; margin-top: 4px;">
                    ⚠️ 這些債務會在結算日或收到收入時自動償還
                </div>
            </div>

            <div style="background: rgba(76,175,80,0.15); padding: 10px;
                        border-radius: 10px; margin-bottom: 12px;
                        text-align: center; color: #a5d6a7;
                        border: 1px solid rgba(76,175,80,0.3);">
                💵 現金餘額 <strong>$${currentCash.toLocaleString()}</strong>
            </div>

            <button id="repayAllBankDebtsBtn"
                    style="width: 100%; background: linear-gradient(135deg, #4caf50, #2e7d32);
                           color: white; padding: 12px; border: none;
                           border-radius: 20px; cursor: pointer;
                           font-size: 14px; font-weight: bold;
                           margin-bottom: 14px;
                           box-shadow: 0 4px 12px rgba(76,175,80,0.3);
                           ${currentCash <= 0 ? 'opacity:0.4; cursor:not-allowed;' : ''}"
                    ${currentCash <= 0 ? 'disabled' : ''}>
                💰 一次還清全部 (最多 $${Math.min(currentCash, totalDebt).toLocaleString()})
            </button>
        `;

        pendingDebts.forEach(d => {
            const createdDate = d.createdAt
                ? new Date(d.createdAt).toLocaleString('zh-HK', {
                    month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                })
                : '';

            html += `
                <div style="background: rgba(0,0,0,0.4); border-radius: 12px;
                            padding: 14px; margin-bottom: 10px;
                            border-left: 4px solid #ef5350;">

                    <div style="display: flex; justify-content: space-between;
                                align-items: center; margin-bottom: 8px;">
                        <div style="color: #ff8a80; font-weight: bold; font-size: 15px;">
                            🏦 ${escapeHtml(d.creditorName || '銀行')}
                        </div>
                        <div style="color: #ffd966; font-weight: bold;">
                            $${d.amount.toLocaleString()}
                        </div>
                    </div>

                    <div style="font-size: 12px; color: #b0bec5; margin-bottom: 10px;">
                        <div>📌 來源: <strong>${escapeHtml(d.source || '未知')}</strong></div>
                        ${createdDate ? `<div>🕒 產生時間: ${createdDate}</div>` : ''}
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="number" class="bank-repay-amount-input"
                               data-debt-id="${d.id}"
                               min="1" max="${Math.min(d.amount, currentCash)}"
                               placeholder="還款金額"
                               style="flex: 1; padding: 8px; border-radius: 8px;
                                      border: 1px solid #ef5350;
                                      background: rgba(0,0,0,0.5); color: #fff;
                                      font-size: 13px; text-align: center; box-sizing: border-box;"
                               ${currentCash <= 0 ? 'disabled' : ''}>
                        <button class="bank-repay-partial-btn"
                                data-debt-id="${d.id}"
                                style="background: #ff9800; color: white;
                                       padding: 8px 14px; border: none;
                                       border-radius: 20px; cursor: pointer;
                                       font-size: 12px; white-space: nowrap;
                                       ${currentCash <= 0 ? 'opacity:0.4; cursor:not-allowed;' : ''}"
                                ${currentCash <= 0 ? 'disabled' : ''}>
                            💰 部分還款
                        </button>
                        <button class="bank-repay-full-btn"
                                data-debt-id="${d.id}"
                                data-full-amount="${Math.min(d.amount, currentCash)}"
                                style="background: linear-gradient(135deg, #4caf50, #388e3c);
                                       color: white; padding: 8px 14px; border: none;
                                       border-radius: 20px; cursor: pointer;
                                       font-size: 12px; white-space: nowrap;
                                       ${currentCash < d.amount ? 'opacity:0.6;' : ''}
                                       ${currentCash <= 0 ? 'cursor:not-allowed;' : ''}"
                                ${currentCash <= 0 ? 'disabled' : ''}
                                title="${currentCash < d.amount ? '現金不足以全還，將盡量還' : '全額還清'}">
                            ${currentCash >= d.amount ? '✅ 全額還清' : '💵 現有全還'}
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // ── Bind "一次還清全部" ──────────────────────────────────────
        const allBtn = document.getElementById('repayAllBankDebtsBtn');
        if (allBtn && currentCash > 0) {
            allBtn.onclick = () => {
                const payAmount = Math.min(currentCash, totalDebt);
                if (confirm(`確認一次還款 $${payAmount.toLocaleString()} 給銀行嗎？\n(採先入先出方式清償各筆債務)`)) {
                    callbacks.onPayBankDebt(null, payAmount);  // null = FIFO
                }
            };
            allBtn.onmouseenter = () => { allBtn.style.transform = 'scale(1.02)'; };
            allBtn.onmouseleave = () => { allBtn.style.transform = 'scale(1)'; };
        }

        // ── Bind partial repay per debt ────────────────────────────
        document.querySelectorAll('.bank-repay-partial-btn').forEach(btn => {
            btn.onclick = () => {
                const debtId = btn.dataset.debtId;
                const input  = document.querySelector(
                    `.bank-repay-amount-input[data-debt-id="${debtId}"]`
                );
                const amount = parseInt(input?.value);
                if (!amount || amount < 1) { alert('請輸入還款金額'); return; }
                if (amount > currentCash) { alert('現金不足'); return; }
                if (confirm(`確認還款 $${amount.toLocaleString()} 給銀行嗎？`)) {
                    callbacks.onPayBankDebt(debtId, amount);
                }
            };
        });

        // ── Bind full repay per debt ───────────────────────────────
        document.querySelectorAll('.bank-repay-full-btn').forEach(btn => {
            btn.onclick = () => {
                const debtId = btn.dataset.debtId;
                const amount = parseInt(btn.dataset.fullAmount);
                if (!amount || amount < 1) return;
                const label = currentCash >= amount
                    ? `全額還清 $${amount.toLocaleString()}`
                    : `以現有現金 $${amount.toLocaleString()} 盡量償還`;
                if (confirm(`確認 ${label} 嗎？`)) {
                    callbacks.onPayBankDebt(debtId, amount);
                }
            };
        });
    }

    // ==================== Helpers ====================

    static _emptyState(text) {
        return `
            <div style="text-align: center; padding: 40px 20px;
                        color: #90a4ae; font-size: 14px;">
                ${text}
            </div>
        `;
    }

    static _bindClose(onClose) {
        const btn = document.getElementById('lendingCloseBtn');
        if (btn) {
            btn.onclick = () => onClose();
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        }
    }
}