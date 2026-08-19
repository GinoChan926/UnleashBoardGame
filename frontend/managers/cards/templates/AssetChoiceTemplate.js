"use strict";

export class AssetChoiceTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 500px;
                 background: linear-gradient(135deg, #2a3a5c, #0d2b47);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #42a5f5;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 22px; color: #4fc3f7; font-weight: bold;">
                        📊 市場消息卡
                    </div>
                    <div id="assetChoiceCardName"
                         style="font-size: 14px; color: #b3e5fc; margin-top: 4px;">
                    </div>
                </div>

                <div id="assetChoiceImage" style="text-align: center; margin: 12px 0;">
                    <img id="assetChoiceImg" src=""
                         style="max-width: 60%; max-height: 140px;
                                border-radius: 12px;
                                border: 3px solid #42a5f5;">
                </div>

                <div style="background: rgba(66,165,245,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;">
                    <div id="assetChoiceDesc"
                         style="color: #b3e5fc; font-size: 13px;
                                line-height: 1.6; text-align: center;">
                    </div>
                </div>

                <div id="assetInfoBox" style="background: rgba(0,0,0,0.3);
                     padding: 14px; border-radius: 12px; margin-bottom: 14px;
                     color: #ffd966;">
                </div>

                <div style="background: rgba(0,0,0,0.4); padding: 8px;
                            border-radius: 8px; margin-bottom: 14px; text-align: center;">
                    <span style="color: #ffab00; font-size: 12px;">
                        ⏰ 剩餘時間: <span id="assetChoiceCountdown">30</span> 秒
                    </span>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button id="assetChoiceDeclineBtn"
                            style="flex: 1; background: #9e9e9e; color: white;
                                   padding: 12px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;">
                        ❌ 不參與
                    </button>
                    <button id="assetChoiceParticipateBtn"
                            style="flex: 1; background: linear-gradient(135deg, #42a5f5, #1e88e5);
                                   color: white; padding: 12px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;
                                   box-shadow: 0 4px 12px rgba(66,165,245,0.3);">
                        ✅ 參與
                    </button>
                </div>
            </div>
        `;
    }

    static populate(message, escapeHtml) {
        const nameEl = document.getElementById('assetChoiceCardName');
        const descEl = document.getElementById('assetChoiceDesc');
        const imgEl = document.getElementById('assetChoiceImg');
        const infoEl = document.getElementById('assetInfoBox');

        if (nameEl) nameEl.textContent = message.card.name || '';
        if (descEl) descEl.textContent = message.card.description || '';

        if (imgEl && message.card.image) {
            let url = message.card.image;
            if (url && !url.startsWith('http') && !url.startsWith('/')) url = '/' + url;
            imgEl.src = url;
            imgEl.onerror = () => {
                imgEl.style.display = 'none';
            };
        }

        if (infoEl) {
            const info = message.assetInfo || {};
            let html = `<div style="text-align: center; margin-bottom: 10px;
                        color: #4fc3f7; font-weight: bold;">
                你的資產詳情
            </div>`;

            // ✅ Check if this is a multi-stock holding
            if (info.holdings && Array.isArray(info.holdings) && info.holdings.length > 0) {
                // Per-stock checkboxes
                html += `<div style="margin-bottom:8px; font-size:12px; color:#b0bec5;">
                請勾選你想出售的股票：
            </div>`;

                info.holdings.forEach(h => {
                    const profitColor = h.profit >= 0 ? '#81c784' : '#ff5252';
                    const profitSign = h.profit >= 0 ? '+' : '';

                    html += `
                    <label class="stock-select-row" data-code="${h.stockCode}"
                           style="display:flex; align-items:center; gap:10px;
                                  padding:10px; margin-bottom:6px;
                                  border-bottom:1px solid rgba(255,255,255,0.1);
                                  cursor:pointer; border-radius:8px;
                                  transition: background 0.2s ease;">
                        <input type="checkbox" class="stock-checkbox"
                               data-code="${h.stockCode}"
                               checked
                               style="width:18px; height:18px; cursor:pointer;">
                        <div style="flex:1;">
                            <div style="color:#fff; font-weight:bold;">
                                ${escapeHtml(h.stockName)} (${h.stockCode})
                            </div>
                            <div style="color:#b0bec5; font-size:12px;">
                                持股: ${h.shares} 股 × $${h.price}
                                = <span style="color:#ffd966;">$${h.sellValue.toLocaleString()}</span>
                            </div>
                        </div>
                        <div style="font-size:14px; color:${profitColor}; font-weight:bold; white-space:nowrap;">
                            ${profitSign}$${h.profit.toLocaleString()}
                        </div>
                    </label>
                `;
                });

                // Summary line (updates dynamically)
                html += `<div id="stockSelectionSummary"
                         style="text-align:center; margin-top:10px; padding-top:10px;
                                border-top:1px solid rgba(255,255,255,0.2);
                                color:#ffd966; font-weight:bold;">
                總收入: $${info.totalSellValue.toLocaleString()}
                (盈虧: ${info.totalProfit >= 0 ? '+' : ''}$${info.totalProfit.toLocaleString()})
            </div>`;

                // Select all / deselect all buttons
                html += `<div style="display:flex; gap:8px; margin-top:8px;">
                <button id="selectAllStocks" style="flex:1; padding:6px; font-size:11px;
                        background:rgba(76,175,80,0.3); border:1px solid #4caf50;
                        color:white; border-radius:8px; cursor:pointer;">
                    ✅ 全選
                </button>
                <button id="deselectAllStocks" style="flex:1; padding:6px; font-size:11px;
                        background:rgba(244,67,54,0.3); border:1px solid #f44336;
                        color:white; border-radius:8px; cursor:pointer;">
                    ❌ 取消全選
                </button>
            </div>`;

            } else if (info.holdings) {
                // Single-asset display (legacy)
                html += `<div>💼 資產: ${escapeHtml(info.assetName || '')}</div>`;
                if (info.marketPrice) html += `<div>💵 市場價格: $${info.marketPrice.toLocaleString()}</div>`;
                if (info.mortgageAmount !== undefined)
                    html += `<div>🏦 按揭: $${info.mortgageAmount.toLocaleString()}</div>`;
                if (info.profit !== undefined) {
                    const color = info.profit >= 0 ? '#81c784' : '#ff5252';
                    html += `<div style="margin-top:8px; color:${color}; font-weight:bold;">
                    📈 淨收益: ${info.profit >= 0 ? '+' : ''}$${info.profit.toLocaleString()}
                </div>`;
                }
            }

            infoEl.innerHTML = html;

            // ✅ Bind checkbox events for dynamic summary update
            if (info.holdings && Array.isArray(info.holdings)) {
                AssetChoiceTemplate._bindStockCheckboxes(info.holdings);
            }
        }

        // Update button label
        const partBtn = document.getElementById('assetChoiceParticipateBtn');
        if (partBtn && message.actionLabel) {
            partBtn.textContent = '✅ ' + message.actionLabel;
        }
    }

    static bindButtons(onParticipate, onDecline) {
        const partBtn = document.getElementById('assetChoiceParticipateBtn');
        const declBtn = document.getElementById('assetChoiceDeclineBtn');

        if (partBtn) {
            partBtn.onclick = () => onParticipate();
            partBtn.onmouseenter = () => {
                partBtn.style.transform = 'scale(1.03)';
                partBtn.style.boxShadow = '0 6px 18px rgba(66,165,245,0.5)';
            };
            partBtn.onmouseleave = () => {
                partBtn.style.transform = 'scale(1)';
                partBtn.style.boxShadow = '0 4px 12px rgba(66,165,245,0.3)';
            };
        }

        if (declBtn) {
            declBtn.onclick = () => onDecline();
            declBtn.onmouseenter = () => {
                declBtn.style.transform = 'scale(1.03)';
            };
            declBtn.onmouseleave = () => {
                declBtn.style.transform = 'scale(1)';
            };
        }
    }

    static startCountdown(seconds, onExpire) {
        const el = document.getElementById('assetChoiceCountdown');
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

    static disableButtons() {
        ['assetChoiceParticipateBtn', 'assetChoiceDeclineBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        });
    }

    static _bindStockCheckboxes(holdings) {
        const checkboxes = document.querySelectorAll('.stock-checkbox');
        const summaryEl = document.getElementById('stockSelectionSummary');

        const updateSummary = () => {
            let totalValue = 0;
            let totalProfit = 0;
            let count = 0;

            checkboxes.forEach(cb => {
                if (cb.checked) {
                    const code = cb.dataset.code;
                    const h = holdings.find(x => x.stockCode === code);
                    if (h) {
                        totalValue += h.sellValue;
                        totalProfit += h.profit;
                        count++;
                    }
                }
            });

            if (summaryEl) {
                if (count === 0) {
                    summaryEl.innerHTML = `<span style="color:#90a4ae;">未選擇任何股票</span>`;
                } else {
                    summaryEl.innerHTML = `已選 ${count} 項 · 總收入: $${totalValue.toLocaleString()} ` +
                        `(盈虧: <span style="color:${totalProfit >= 0 ? '#4caf50' : '#ff5252'};">` +
                        `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toLocaleString()}</span>)`;
                }
            }

            // Update participate button state
            const partBtn = document.getElementById('assetChoiceParticipateBtn');
            if (partBtn) {
                partBtn.disabled = count === 0;
                partBtn.style.opacity = count > 0 ? '1' : '0.4';
                partBtn.style.cursor = count > 0 ? 'pointer' : 'not-allowed';
            }
        };

        checkboxes.forEach(cb => {
            cb.addEventListener('change', updateSummary);
        });

        // Row click toggles checkbox
        document.querySelectorAll('.stock-select-row').forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.background = 'rgba(66,165,245,0.15)';
            });
            row.addEventListener('mouseleave', () => {
                row.style.background = 'transparent';
            });

            document.querySelectorAll('.stock-select-row').forEach(row => {
                row.addEventListener('click', (e) => {
                    if (e.target.tagName === 'INPUT') return;  // don't double-toggle
                    const cb = row.querySelector('.stock-checkbox');
                    if (cb) {
                        cb.checked = !cb.checked;
                        updateSummary();
                    }
                });
            });

            // Select all / deselect all
            const selectAll = document.getElementById('selectAllStocks');
            const deselectAll = document.getElementById('deselectAllStocks');

            if (selectAll) {
                selectAll.onclick = () => {
                    checkboxes.forEach(cb => {
                        cb.checked = true;
                    });
                    updateSummary();
                };
            }
            if (deselectAll) {
                deselectAll.onclick = () => {
                    checkboxes.forEach(cb => {
                        cb.checked = false;
                    });
                    updateSummary();
                };
            }

            // Initial summary
            updateSummary();
        });
    }
}