"use strict";

export class PropertyPanelTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 700px;
                 background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #9c27b0; max-height: 85vh; overflow-y: auto;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #ce93d8; font-weight: bold;">
                        🏠 物業管理
                    </div>
                    <div style="font-size: 12px; color: #b39ddb; margin-top: 4px;">
                        管理你的所有房產和貸款
                    </div>
                </div>

                <div id="propertyPanelCash"
                     style="text-align: center; background: rgba(156,39,176,0.15);
                            padding: 10px; border-radius: 10px; margin-bottom: 14px;
                            color: #ffd966; font-size: 14px;">
                </div>

                <div id="propertyPanelList" style="display: flex; flex-direction: column; gap: 12px;">
                    <!-- Property cards inserted here -->
                </div>

                <div style="text-align: center; margin-top: 16px;">
                    <button id="propertyPanelCloseBtn"
                            style="background: #9e9e9e; color: white; padding: 10px 30px;
                                   border: none; border-radius: 24px; cursor: pointer;
                                   font-size: 14px;">
                        關閉
                    </button>
                </div>
            </div>
        `;
    }

    static buildPropertyRow(property, currentCash) {
        const div = document.createElement('div');

        const paidOff = property.paidOff;
        const progress = property.mortgageAmount > 0
            ? Math.min(100, Math.round((property.totalPaid - property.downPayment) / property.mortgageAmount * 100))
            : 100;

        const usageLabel = property.usage === 'self_use' ? '🏘️ 自用' : '🏠 出租';
        const usageColor = property.usage === 'self_use' ? '#ff9800' : '#4caf50';

        div.style.cssText = `
            background: rgba(0,0,0,0.4); border-radius: 14px; padding: 14px;
            border: 1px solid rgba(156,39,176,0.3);
        `;

        // Property header
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: start;
                        margin-bottom: 10px;">
                <div>
                    <div style="color: #ce93d8; font-size: 16px; font-weight: bold;">
                        ${property.name}
                    </div>
                    <div style="color: ${usageColor}; font-size: 12px; margin-top: 4px;">
                        ${usageLabel}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #ffd966; font-size: 14px; font-weight: bold;">
                        總價 $${property.totalPrice.toLocaleString()}
                    </div>
                    ${property.monthlyReturn > 0 ? `
                        <div style="color: #81c784; font-size: 11px; margin-top: 2px;">
                            租金 +$${property.monthlyReturn.toLocaleString()}/月
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        if (property.mortgageAmount > 0) {
            html += `
                <div style="background: rgba(0,0,0,0.3); padding: 10px;
                            border-radius: 8px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between;
                                font-size: 12px; color: #b0bec5; margin-bottom: 6px;">
                        <span>已還: $${(property.totalPaid - property.downPayment).toLocaleString()}</span>
                        <span>剩餘: $${property.remainingBalance.toLocaleString()}</span>
                    </div>
                    <div style="background: rgba(0,0,0,0.5); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #4caf50, #81c784);
                                    height: 100%; width: ${progress}%;
                                    transition: width 0.3s ease;">
                        </div>
                    </div>
                    <div style="font-size: 11px; color: #90a4ae; margin-top: 4px; text-align: center;">
                        已付 ${property.monthsPaid} 個月 · 進度 ${progress}%
                    </div>
                </div>
            `;

            if (paidOff) {
                html += `
                    <div style="background: rgba(76,175,80,0.2); padding: 10px;
                                border-radius: 8px; text-align: center;
                                color: #81c784; font-size: 13px; font-weight: bold;">
                        ✅ 貸款已還清！
                    </div>
                `;
            } else {
                const canAfford = currentCash >= property.remainingBalance;
                html += `
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <div style="flex: 1; font-size: 12px; color: #b0bec5;">
                            月供 $${property.monthlyPayment.toLocaleString()}/月
                        </div>
                        <button class="property-payoff-btn"
                                data-instance-id="${property.instanceId}"
                                data-remaining="${property.remainingBalance}"
                                ${canAfford ? '' : 'disabled'}
                                style="background: linear-gradient(135deg, #ff9800, #f57c00);
                                       color: white; padding: 8px 16px; border: none;
                                       border-radius: 20px;
                                       cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                                       opacity: ${canAfford ? '1' : '0.5'};
                                       font-size: 12px; font-weight: bold;
                                       transition: all 0.2s ease;">
                            💰 一次付清 $${property.remainingBalance.toLocaleString()}
                        </button>
                    </div>
                `;
                if (!canAfford) {
                    html += `
                        <div style="text-align: center; color: #ff5252; font-size: 11px;
                                    margin-top: 4px;">
                            現金不足 (需 $${property.remainingBalance.toLocaleString()})
                        </div>
                    `;
                }
            }
        } else {
            html += `
                <div style="background: rgba(76,175,80,0.15); padding: 8px;
                            border-radius: 8px; text-align: center;
                            color: #81c784; font-size: 12px;">
                    💰 全款購買，無貸款
                </div>
            `;
        }

        div.innerHTML = html;
        return div;
    }

    static populate(properties, currentCash) {
        const listEl = document.getElementById('propertyPanelList');
        const cashEl = document.getElementById('propertyPanelCash');

        if (cashEl) cashEl.innerHTML = `💵 現金: <strong>$${currentCash.toLocaleString()}</strong>`;

        if (!listEl) return;
        listEl.innerHTML = '';

        if (!properties || properties.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #90a4ae;">
                    📭 你還沒有任何房產
                </div>
            `;
            return;
        }

        properties.forEach(prop => {
            listEl.appendChild(this.buildPropertyRow(prop, currentCash));
        });
    }

    static bindPayoffButtons(onPayoff) {
        document.querySelectorAll('.property-payoff-btn').forEach(btn => {
            if (btn.disabled) return;

            btn.onclick = () => {
                const instanceId = btn.dataset.instanceId;
                const remaining  = parseInt(btn.dataset.remaining);
                if (confirm(`確認一次付清 $${remaining.toLocaleString()} 嗎？`)) {
                    onPayoff(instanceId);
                }
            };
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        });
    }

    static bindClose(onClose) {
        const btn = document.getElementById('propertyPanelCloseBtn');
        if (btn) btn.onclick = () => onClose();
    }
}