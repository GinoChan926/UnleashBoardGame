"use strict";

export class FlowInventoryTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 720px;
                 background: linear-gradient(135deg, #2c1f3d, #1a1428);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ba68c8;
                 max-height: 85vh; overflow-y: auto;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #ce93d8; font-weight: bold;">
                        🌊 順流層清單
                    </div>
                    <div style="font-size: 12px; color: #e1bee7; margin-top: 4px;">
                        你的夢想與順流層投資
                    </div>
                </div>

                <div id="flowInvSummary"
                     style="background: rgba(186,104,200,0.15); padding: 12px;
                            border-radius: 12px; margin-bottom: 16px;
                            display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
                            border: 1px solid rgba(186,104,200,0.3);
                            font-size: 13px;">
                </div>

                <div id="flowInvTabs" style="display: flex; gap: 6px;
                     margin-bottom: 14px;">
                </div>

                <div id="flowInvContent"
                     style="min-height: 200px; max-height: 55vh;
                            overflow-y: auto; padding-right: 4px;">
                </div>

                <div style="text-align: center; margin-top: 16px;">
                    <button id="flowInvCloseBtn"
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
        this._showTab('dreams', message, escapeHtml);
        this._bindClose(onClose);
    }

    // ==================== Private ====================

    static _buildSummary(message) {
        const el = document.getElementById('flowInvSummary');
        if (!el) return;

        el.innerHTML = `
            <div>🌊 目前狀態:</div>
            <div style="text-align: right; color: ${message.inFlow ? '#4caf50' : '#ff9800'};">
                <strong>${message.inFlow ? '順流層' : '未進入順流層'}</strong>
            </div>

            <div>🌟 已實現夢想:</div>
            <div style="text-align: right; color: #ffd966;">
                <strong>${message.dreams.length} / ${message.totalDreams}</strong>
            </div>

            <div>🏗️ 順流層投資:</div>
            <div style="text-align: right; color: #ffd966;">
                <strong>${message.investments.length} 項</strong>
            </div>

            <div>📈 投資月收益:</div>
            <div style="text-align: right; color: #81c784;">
                <strong>+$${message.totalMonthlyReturn.toLocaleString()}/月</strong>
            </div>
        `;
    }

    static _buildTabs(message, escapeHtml) {
        const tabsEl = document.getElementById('flowInvTabs');
        if (!tabsEl) return;

        const tabs = [
            { key: 'dreams',      label: '🌟 已實現夢想',   count: message.dreams.length },
            { key: 'investments', label: '🏗️ 順流層投資',   count: message.investments.length }
        ];

        tabsEl.innerHTML = '';
        tabs.forEach((tab, idx) => {
            const btn = document.createElement('button');
            btn.className = 'flow-inv-tab-btn';
            btn.dataset.tabKey = tab.key;

            const isActive = idx === 0;
            btn.style.cssText = `
                flex: 1;
                background: ${isActive
                ? 'linear-gradient(135deg, #ba68c8, #8e24aa)'
                : 'rgba(0,0,0,0.4)'};
                color: white;
                padding: 10px 14px;
                border: 1px solid ${isActive ? '#ce93d8' : 'rgba(255,255,255,0.2)'};
                border-radius: 20px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s ease;
            `;

            btn.innerHTML = `${tab.label} <span style="color: #ffd966;">(${tab.count})</span>`;
            btn.onclick = () => {
                document.querySelectorAll('.flow-inv-tab-btn').forEach(b => {
                    b.style.background   = 'rgba(0,0,0,0.4)';
                    b.style.borderColor  = 'rgba(255,255,255,0.2)';
                });
                btn.style.background     = 'linear-gradient(135deg, #ba68c8, #8e24aa)';
                btn.style.borderColor    = '#ce93d8';
                this._showTab(tab.key, message, escapeHtml);
            };

            tabsEl.appendChild(btn);
        });
    }

    static _showTab(tabKey, message, escapeHtml) {
        const contentEl = document.getElementById('flowInvContent');
        if (!contentEl) return;

        if (tabKey === 'dreams') {
            contentEl.innerHTML = this._renderDreams(message.dreams, escapeHtml);
        } else if (tabKey === 'investments') {
            contentEl.innerHTML = this._renderInvestments(message.investments, escapeHtml);
        }
    }

    static _renderDreams(dreams, escapeHtml) {
        if (dreams.length === 0) {
            return this._emptyState('🌟 你還沒有實現任何夢想');
        }

        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                        gap: 12px;">
                ${dreams.map(d => this._renderDreamCard(d, escapeHtml)).join('')}
            </div>
        `;
    }

    static _renderDreamCard(dream, escapeHtml) {
        let imgUrl = dream.image || '';
        if (imgUrl && !imgUrl.startsWith('http')) {
            imgUrl = imgUrl.replace(/^(\.\.\/)+/, '/');
            if (!imgUrl.startsWith('/')) imgUrl = '/' + imgUrl;
        }

        return `
            <div style="background: rgba(0,0,0,0.4); border-radius: 12px;
                        padding: 12px; text-align: center;
                        border: 2px solid #ba68c8;
                        box-shadow: 0 4px 12px rgba(186,104,200,0.3);">

                ${imgUrl ? `
                    <img src="${imgUrl}" alt="${escapeHtml(dream.name)}"
                         style="width: 100%; height: 120px; object-fit: cover;
                                border-radius: 8px; margin-bottom: 8px;"
                         onerror="this.style.display='none';">
                ` : `
                    <div style="height: 120px; display: flex;
                                align-items: center; justify-content: center;
                                font-size: 60px; margin-bottom: 8px;">
                        🌟
                    </div>
                `}

                <div style="color: #ffd966; font-weight: bold;
                            font-size: 14px; margin-bottom: 4px;">
                    ${escapeHtml(dream.name)}
                </div>
                <div style="color: #4caf50; font-size: 11px; font-weight: bold;">
                    ✅ 已實現
                </div>
            </div>
        `;
    }

    static _renderInvestments(investments, escapeHtml) {
        if (investments.length === 0) {
            return this._emptyState('🏗️ 順流層還沒有投資');
        }

        return investments.map(inv => {
            let imgUrl = inv.image || '';
            if (imgUrl && !imgUrl.startsWith('http')) {
                imgUrl = imgUrl.replace(/^(\.\.\/)+/, '/');
                if (!imgUrl.startsWith('/')) imgUrl = '/' + imgUrl;
            }

            const dateStr = inv.purchasedAt
                ? new Date(inv.purchasedAt).toLocaleDateString('zh-HK', {
                    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                })
                : '';

            // ✅ NEW: badge for auction wins
            const auctionBadge = inv.wonViaAuction
                ? `<span style="background:#ff9800; color:white; padding:2px 8px;
                             border-radius:10px; font-size:10px; margin-left:6px;">
                 🔨 競拍勝出
               </span>`
                : '';

            return `
            <div style="background: rgba(0,0,0,0.4); border-radius: 12px;
                        padding: 12px; margin-bottom: 10px;
                        border-left: 4px solid #ff9800;
                        display: flex; gap: 12px;">
                ${imgUrl ? `
                    <img src="${imgUrl}" alt=""
                         style="width: 80px; height: 80px; object-fit: cover;
                                border-radius: 8px; flex-shrink: 0;"
                         onerror="this.style.display='none';">
                ` : ''}
                <div style="flex: 1;">
                    <div style="color: #ffb74d; font-weight: bold;
                                font-size: 15px; margin-bottom: 6px;">
                        🏗️ ${escapeHtml(inv.name)}${auctionBadge}
                    </div>
                    ${inv.tileName ? `
                        <div style="color: #90a4ae; font-size: 11px; margin-bottom: 4px;">
                            📍 ${escapeHtml(inv.tileName)}
                        </div>
                    ` : ''}
                    <div style="display: grid; grid-template-columns: 1fr 1fr;
                                gap: 4px; font-size: 12px; color: #b0bec5;">
                        <div>投資: <span style="color: #ffd966;">$${inv.cost.toLocaleString()}</span></div>
                        <div>月收入: <span style="color: #81c784;">+$${inv.monthlyReturn.toLocaleString()}</span></div>
                        ${inv.energyReward ? `
                            <div style="grid-column: 1/-1;">
                                ⚡ 精力獎勵: +${inv.energyReward}
                            </div>
                        ` : ''}
                        ${dateStr ? `<div style="grid-column: 1/-1; color: #90a4ae; font-size: 10px;">
                            🕒 ${dateStr}
                        </div>` : ''}
                    </div>
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
        const btn = document.getElementById('flowInvCloseBtn');
        if (btn) {
            btn.onclick = () => onClose();
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        }
    }
}