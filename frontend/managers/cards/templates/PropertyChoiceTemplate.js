"use strict";

export class PropertyChoiceTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 550px;
                 background: linear-gradient(135deg, #4a2a5a, #2a1a3a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #9c27b0;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #ce93d8; font-weight: bold;">
                        🏠 房地產選擇
                    </div>
                    <div id="propChoiceName"
                         style="font-size: 16px; color: #fff; margin-top: 6px;">
                    </div>
                </div>

                <div id="propChoiceImage" style="text-align: center; margin: 12px 0;">
                    <img id="propChoiceImg" src="" alt="房產"
                         style="max-width: 70%; max-height: 160px; border-radius: 12px;
                                border: 2px solid #ba68c8;">
                </div>

                <div style="background: rgba(156,39,176,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;">
                    <div id="propChoiceStats"
                         style="color: #e1bee7; font-size: 13px; line-height: 1.8;">
                    </div>
                </div>

                <div id="propChoiceAffordWarning"
                     style="display: none; background: rgba(255,82,82,0.15);
                            padding: 10px; border-radius: 10px; margin-bottom: 14px;
                            color: #ff5252; font-size: 12px; text-align: center;
                            border: 1px solid rgba(255,82,82,0.3);">
                    ⚠️ 現金不足首期！
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;">
                    <button id="propChoiceRentBtn"
                            style="background: linear-gradient(135deg, #4caf50, #388e3c);
                                   color: white; padding: 14px; border: none;
                                   border-radius: 12px; cursor: pointer;
                                   font-size: 15px; font-weight: bold;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 4px 12px rgba(76,175,80,0.3);">
                        <div>🏠 出租 (轉讓)</div>
                        <div id="propRentSubtext"
                             style="font-size: 11px; font-weight: normal; margin-top: 4px; opacity: 0.85;">
                        </div>
                    </button>

                    <button id="propChoiceSelfBtn"
                            style="background: linear-gradient(135deg, #ff9800, #f57c00);
                                   color: white; padding: 14px; border: none;
                                   border-radius: 12px; cursor: pointer;
                                   font-size: 15px; font-weight: bold;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 4px 12px rgba(255,152,0,0.3);">
                        <div>🏘️ 自用</div>
                        <div id="propSelfSubtext"
                             style="font-size: 11px; font-weight: normal; margin-top: 4px; opacity: 0.85;">
                        </div>
                    </button>

                    <button id="propChoiceSkipBtn"
                            style="background: #9e9e9e; color: white; padding: 12px;
                                   border: none; border-radius: 12px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;
                                   transition: all 0.2s ease;">
                        ❌ 放棄購買 (不退還500元)
                    </button>
                </div>

                <div style="text-align: center; font-size: 11px; color: #b39ddb;">
                    💡 自用 = 只付月供無收入 | 出租 = 付月供並收租金
                </div>
            </div>
        `;
    }

    static populate(message) {
        const { card, details } = message;

        // Name
        const nameEl = document.getElementById('propChoiceName');
        if (nameEl) nameEl.textContent = card.name;

        // Image
        const imgEl = document.getElementById('propChoiceImg');
        if (imgEl && card.image) {
            let url = card.image;
            if (url && !url.startsWith('http') && !url.startsWith('/')) {
                url = '/' + url;
            }
            imgEl.src = url;
            imgEl.onerror = () => { imgEl.style.display = 'none'; };
        }

        // Stats
        const statsEl = document.getElementById('propChoiceStats');
        if (statsEl) {
            let html = '';
            html += `<div>💰 物業總價: $${details.totalPrice.toLocaleString()}</div>`;
            html += `<div>📥 首期支付: <strong style="color: #ffd966;">$${details.downPayment.toLocaleString()}</strong>`;
            if (details.discount > 0) {
                html += ` <span style="color: #4caf50; font-size: 11px;">(折扣 ${details.discount}%)</span>`;
            }
            html += `</div>`;
            if (details.monthlyPayment > 0) {
                html += `<div>📅 每月供款: $${details.monthlyPayment.toLocaleString()}/月</div>`;
            }
            html += `<div>🏠 潛在租金: $${details.monthlyRent.toLocaleString()}/月</div>`;
            html += `<div>💵 你現金: $${details.currentCash.toLocaleString()}</div>`;
            statsEl.innerHTML = html;
        }

        // Rent button subtext (net income)
        const rentSubEl = document.getElementById('propRentSubtext');
        if (rentSubEl) {
            const net = details.monthlyRent - details.monthlyPayment;
            const netStr = net >= 0
                ? `+$${net.toLocaleString()}/月`
                : `-$${Math.abs(net).toLocaleString()}/月`;
            rentSubEl.textContent = `月供 $${details.monthlyPayment.toLocaleString()} + 租金 $${details.monthlyRent.toLocaleString()} = 淨 ${netStr}`;
        }

        // Self button subtext (only expense)
        const selfSubEl = document.getElementById('propSelfSubtext');
        if (selfSubEl) {
            if (details.monthlyPayment > 0) {
                selfSubEl.textContent = `僅付月供 $${details.monthlyPayment.toLocaleString()}/月，無收入`;
            } else {
                selfSubEl.textContent = `無月供，無收入`;
            }
        }

        // Afford warning
        const warningEl = document.getElementById('propChoiceAffordWarning');
        const rentBtn   = document.getElementById('propChoiceRentBtn');
        const selfBtn   = document.getElementById('propChoiceSelfBtn');

        if (!details.canAfford) {
            if (warningEl) warningEl.style.display = 'block';
            if (rentBtn) {
                rentBtn.disabled = true;
                rentBtn.style.opacity = '0.5';
                rentBtn.style.cursor = 'not-allowed';
            }
            if (selfBtn) {
                selfBtn.disabled = true;
                selfBtn.style.opacity = '0.5';
                selfBtn.style.cursor = 'not-allowed';
            }
        }
    }

    static bindButtons(onSelfUse, onRentOut, onSkip) {
        const rentBtn = document.getElementById('propChoiceRentBtn');
        const selfBtn = document.getElementById('propChoiceSelfBtn');
        const skipBtn = document.getElementById('propChoiceSkipBtn');

        if (rentBtn && !rentBtn.disabled) {
            rentBtn.onclick = () => onRentOut();
            rentBtn.onmouseenter = () => {
                rentBtn.style.transform = 'scale(1.02)';
                rentBtn.style.boxShadow = '0 6px 18px rgba(76,175,80,0.5)';
            };
            rentBtn.onmouseleave = () => {
                rentBtn.style.transform = 'scale(1)';
                rentBtn.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)';
            };
        }

        if (selfBtn && !selfBtn.disabled) {
            selfBtn.onclick = () => onSelfUse();
            selfBtn.onmouseenter = () => {
                selfBtn.style.transform = 'scale(1.02)';
                selfBtn.style.boxShadow = '0 6px 18px rgba(255,152,0,0.5)';
            };
            selfBtn.onmouseleave = () => {
                selfBtn.style.transform = 'scale(1)';
                selfBtn.style.boxShadow = '0 4px 12px rgba(255,152,0,0.3)';
            };
        }

        if (skipBtn) {
            skipBtn.onclick = () => onSkip();
            skipBtn.onmouseenter = () => { skipBtn.style.transform = 'scale(1.02)'; };
            skipBtn.onmouseleave = () => { skipBtn.style.transform = 'scale(1)'; };
        }
    }
}