"use strict";

export class PortfolioTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 720px;
                 background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #2196f3;
                 max-height: 85vh; overflow-y: auto;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #4fc3f7; font-weight: bold;">
                        📊 投資組合
                    </div>
                    <div style="font-size: 12px; color: #b3e5fc; margin-top: 4px;">
                        你的所有投資與資產
                    </div>
                </div>

                <div id="portfolioSummary"
                     style="background: rgba(66,165,245,0.15); padding: 12px;
                            border-radius: 12px; margin-bottom: 16px;
                            display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
                            border: 1px solid rgba(66,165,245,0.3);">
                </div>

                <!-- Tabs -->
                <div id="portfolioTabs" style="display: flex; gap: 6px;
                     margin-bottom: 14px; flex-wrap: wrap;">
                </div>

                <!-- Content area -->
                <div id="portfolioContent"
                     style="min-height: 200px; max-height: 50vh;
                            overflow-y: auto; padding-right: 4px;">
                </div>

                <div style="text-align: center; margin-top: 16px;">
                    <button id="portfolioCloseBtn"
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

    static populate(message, escapeHtml, onClose) {
        this._buildSummary(message);
        this._buildTabs(message, escapeHtml);
        this._bindClose(onClose);

        // Show stocks by default (first non-empty tab)
        this._showTab('stocks', message, escapeHtml);
    }

    // ==================== Private ====================

    static _buildSummary(message) {
        const summaryEl = document.getElementById('portfolioSummary');
        if (!summaryEl) return;

        const stocksValue = message.stocks.reduce((s, x) => s + x.currentValue, 0);
        const cryptoValue = message.crypto.reduce((s, x) => s + x.currentValue, 0);
        const fundsMonthly = message.funds.reduce((s, x) => s + x.monthlyReturn, 0);
        const businessMonthly = message.businesses.reduce((s, x) => s + x.monthlyReturn, 0);
        const propMonthly = message.properties.reduce((s, x) => s + x.monthlyReturn, 0);

        summaryEl.innerHTML = `
            <div>💵 現金: <strong style="color: #4caf50;">$${message.cash.toLocaleString()}</strong></div>
            <div>💰 總資產: <strong style="color: #ffd966;">$${message.totalAssets.toLocaleString()}</strong></div>
            <div>📈 股票市值: <strong>$${stocksValue.toLocaleString()}</strong></div>
            <div>🪙 加密貨幣: <strong>$${cryptoValue.toLocaleString()}</strong></div>
            <div>📊 基金月收: <strong>$${fundsMonthly.toLocaleString()}</strong></div>
            <div>🏠 生意/物業月收: <strong>$${(businessMonthly + propMonthly).toLocaleString()}</strong></div>
        `;
    }

    static _buildTabs(message, escapeHtml) {
        const tabsEl = document.getElementById('portfolioTabs');
        if (!tabsEl) return;

        const tabs = [
            { key: 'stocks',     label: '📈 股票',     count: message.stocks.length },
            { key: 'crypto',     label: '🪙 加密貨幣', count: message.crypto.length },
            { key: 'funds',      label: '📊 基金/P2P', count: message.funds.length },
            { key: 'businesses', label: '🚀 創業',     count: message.businesses.length },
            { key: 'properties', label: '🏠 地產',     count: message.properties.length }
        ];

        tabsEl.innerHTML = '';
        tabs.forEach((tab, idx) => {
            const btn = document.createElement('button');
            btn.className = 'portfolio-tab-btn';
            btn.dataset.tabKey = tab.key;

            const isActive = idx === 0;
            btn.style.cssText = `
                background: ${isActive
                ? 'linear-gradient(135deg, #2196f3, #1565c0)'
                : 'rgba(0,0,0,0.4)'};
                color: white;
                padding: 8px 14px;
                border: 1px solid ${isActive ? '#4fc3f7' : 'rgba(255,255,255,0.2)'};
                border-radius: 20px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s ease;
            `;

            btn.innerHTML = `${tab.label} <span style="color: #ffd966;">(${tab.count})</span>`;
            btn.onclick = () => {
                document.querySelectorAll('.portfolio-tab-btn').forEach(b => {
                    b.style.background = 'rgba(0,0,0,0.4)';
                    b.style.borderColor = 'rgba(255,255,255,0.2)';
                });
                btn.style.background = 'linear-gradient(135deg, #2196f3, #1565c0)';
                btn.style.borderColor = '#4fc3f7';
                this._showTab(tab.key, message, escapeHtml);
            };

            tabsEl.appendChild(btn);
        });
    }

    static _showTab(tabKey, message, escapeHtml) {
        const contentEl = document.getElementById('portfolioContent');
        if (!contentEl) return;

        let html = '';

        switch (tabKey) {
            case 'stocks':
                html = this._renderStocks(message.stocks, escapeHtml);
                break;
            case 'crypto':
                html = this._renderCrypto(message.crypto, escapeHtml);
                break;
            case 'funds':
                html = this._renderFunds(message.funds, escapeHtml);
                break;
            case 'businesses':
                html = this._renderBusinesses(message.businesses, escapeHtml);
                break;
            case 'properties':
                html = this._renderProperties(message.properties, escapeHtml);
                break;
        }

        contentEl.innerHTML = html;
    }

    static _renderStocks(stocks, escapeHtml) {
        if (stocks.length === 0) {
            return this._emptyState('📭 你目前沒有持有任何股票');
        }

        return stocks.map(s => `
            <div style="background: rgba(0,0,0,0.4); border-radius: 12px;
                        padding: 14px; margin-bottom: 10px;
                        border-left: 4px solid ${s.profit >= 0 ? '#4caf50' : '#f44336'};">
                <div style="display: flex; justify-content: space-between;
                            align-items: center; margin-bottom: 8px;">
                    <div style="color: #4fc3f7; font-size: 15px; font-weight: bold;">
                        ${escapeHtml(s.name)}
                    </div>
                    <div style="color: ${s.profit >= 0 ? '#81c784' : '#ff5252'};
                                font-weight: bold; font-size: 15px;">
                        ${s.profit >= 0 ? '+' : ''}$${s.profit.toLocaleString()}
                        <span style="font-size: 11px;">
                            (${s.profit >= 0 ? '+' : ''}${s.profitPercent.toFixed(1)}%)
                        </span>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr;
                            gap: 4px; font-size: 12px; color: #b0bec5;">
                    <div>持股: <span style="color: #fff;">${s.shares.toLocaleString()} 股</span></div>
                    <div>平均成本: <span style="color: #fff;">$${s.avgCost?.toFixed(2)}</span></div>
                    <div>當前價: <span style="color: #ffd966;">$${s.lastPrice}</span></div>
                    <div>市值: <span style="color: #ffd966;">$${s.currentValue.toLocaleString()}</span></div>
                </div>
            </div>
        `).join('');
    }

    static _renderCrypto(crypto, escapeHtml) {
        if (crypto.length === 0) {
            return this._emptyState('📭 你目前沒有持有任何加密貨幣');
        }

        return crypto.map(c => `
            <div style="background: rgba(0,0,0,0.4); border-radius: 12px;
                        padding: 14px; margin-bottom: 10px;
                        border-left: 4px solid ${c.profit >= 0 ? '#4caf50' : '#f44336'};">
                <div style="display: flex; justify-content: space-between;
                            align-items: center; margin-bottom: 8px;">
                    <div style="color: #ba68c8; font-size: 15px; font-weight: bold;">
                        🪙 ${escapeHtml(c.name)}
                    </div>
                    <div style="color: ${c.profit >= 0 ? '#81c784' : '#ff5252'};
                                font-weight: bold; font-size: 15px;">
                        ${c.profit >= 0 ? '+' : ''}$${c.profit.toLocaleString()}
                        <span style="font-size: 11px;">
                            (${c.profit >= 0 ? '+' : ''}${c.profitPercent.toFixed(1)}%)
                        </span>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr;
                            gap: 4px; font-size: 12px; color: #b0bec5;">
                    <div>持有: <span style="color: #fff;">${c.units.toLocaleString()} 顆</span></div>
                    <div>平均成本: <span style="color: #fff;">$${c.avgCost?.toFixed(4)}</span></div>
                    <div>當前價: <span style="color: #ffd966;">$${c.lastPrice}</span></div>
                    <div>市值: <span style="color: #ffd966;">$${c.currentValue.toLocaleString()}</span></div>
                </div>
            </div>
        `).join('');
    }

    static _renderFunds(funds, escapeHtml) {
        if (funds.length === 0) {
            return this._emptyState('📭 你目前沒有持有任何基金或 P2P');
        }

        return funds.map(f => `
            <div style="background: rgba(0,0,0,0.4); border-radius: 12px;
                        padding: 14px; margin-bottom: 10px;
                        border-left: 4px solid #ff9800;">
                <div style="color: #ffb74d; font-size: 15px;
                            font-weight: bold; margin-bottom: 8px;">
                    ${escapeHtml(f.name)}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr;
                            gap: 4px; font-size: 12px; color: #b0bec5;">
                    <div>單位: <span style="color: #fff;">${(f.units || 0).toLocaleString()}</span></div>
                    <div>單價: <span style="color: #fff;">$${(f.pricePerUnit || 0).toLocaleString()}</span></div>
                    <div>總成本: <span style="color: #ffd966;">$${(f.totalCost || 0).toLocaleString()}</span></div>
                    <div>月收入: <span style="color: #81c784;">$${(f.monthlyReturn || 0).toLocaleString()}</span></div>
                </div>
            </div>
        `).join('');
    }

    static _renderBusinesses(businesses, escapeHtml) {
        if (businesses.length === 0) {
            return this._emptyState('📭 你目前沒有任何生意投資');
        }

        return businesses.map(b => `
            <div style="background: rgba(0,0,0,0.4); border-radius: 12px;
                        padding: 14px; margin-bottom: 10px;
                        border-left: 4px solid #ff9800;">
                <div style="color: #ffb74d; font-size: 15px;
                            font-weight: bold; margin-bottom: 8px;">
                    🚀 ${escapeHtml(b.name)}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr;
                            gap: 4px; font-size: 12px; color: #b0bec5;">
                    ${b.units > 1 ? `<div>數量: <span style="color: #fff;">${b.units}</span></div>` : ''}
                    <div>投資: <span style="color: #ffd966;">$${b.cost.toLocaleString()}</span></div>
                    <div>月收入: <span style="color: #81c784;">$${b.monthlyReturn.toLocaleString()}</span></div>
                    ${b.energyCost > 0 ? `<div>精力: <span style="color: #ff9800;">-${b.energyCost}</span></div>` : ''}
                </div>
            </div>
        `).join('');
    }

    static _renderProperties(properties, escapeHtml) {
        if (properties.length === 0) {
            return this._emptyState('📭 你目前沒有任何物業');
        }

        return properties.map(p => {
            const usageLabel = p.usage === 'self_use' ? '🏘️ 自用' : '🏠 出租';
            const usageColor = p.usage === 'self_use' ? '#ff9800' : '#4caf50';
            const paidLabel = p.paidOff ? '✅ 已還清' : `💰 剩 $${p.remainingBalance.toLocaleString()}`;

            return `
                <div style="background: rgba(0,0,0,0.4); border-radius: 12px;
                            padding: 14px; margin-bottom: 10px;
                            border-left: 4px solid #9c27b0;">
                    <div style="display: flex; justify-content: space-between;
                                align-items: center; margin-bottom: 8px;">
                        <div style="color: #ce93d8; font-size: 15px; font-weight: bold;">
                            🏠 ${escapeHtml(p.name)}
                        </div>
                        <div style="color: ${usageColor}; font-size: 12px;">
                            ${usageLabel}
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr;
                                gap: 4px; font-size: 12px; color: #b0bec5;">
                        <div>總價: <span style="color: #ffd966;">$${p.totalPrice.toLocaleString()}</span></div>
                        <div>月租: <span style="color: #81c784;">$${p.monthlyReturn.toLocaleString()}</span></div>
                        ${p.monthlyPayment > 0
                ? `<div>月供: <span style="color: #ff5252;">-$${p.monthlyPayment.toLocaleString()}</span></div>`
                : ''}
                        <div>貸款: <span style="color: ${p.paidOff ? '#4caf50' : '#ffab00'};">${paidLabel}</span></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    static _emptyState(text) {
        return `
            <div style="text-align: center; padding: 40px 20px;
                        color: #90a4ae; font-size: 14px;">
                ${text}
            </div>
        `;
    }

    static _bindClose(onClose) {
        const btn = document.getElementById('portfolioCloseBtn');
        if (btn) {
            btn.onclick = () => onClose();
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        }
    }
}