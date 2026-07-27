"use strict";

/**
 * Modal shown after landing on settlement — player rolls dice to gain energy.
 */
export class SettlementRollTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="
                max-width: 440px;
                background: linear-gradient(135deg, #4a148c, #6a1b9a);
                border-radius: 24px;
                padding: 28px;
                color: white;
                border: 3px solid #ce93d8;
                box-shadow: 0 12px 32px rgba(156,39,176,0.5);
                text-align: center;
            ">
                <div style="font-size: 60px; margin-bottom: 8px;
                            filter: drop-shadow(0 4px 12px rgba(206,147,216,0.8));">
                    ⚡
                </div>

                <div style="font-size: 22px; font-weight: bold; color: #fce4ec;
                            margin-bottom: 8px;">
                    💰 結算日 - 精力擲骰
                </div>

                <div style="font-size: 13px; color: #e1bee7; margin-bottom: 20px;">
                    正好踩中結算日！擲一顆骰子獲取精力！
                </div>

                <div style="background: rgba(0,0,0,0.35);
                            padding: 16px;
                            border-radius: 14px;
                            margin-bottom: 20px;
                            border: 1px solid rgba(206,147,216,0.3);">
                    <div style="font-size: 14px; color: #f3e5f5;">
                        擲骰結果 = 獲得精力數
                    </div>
                    <div style="font-size: 11px; color: #ce93d8; margin-top: 6px;">
                        (1-6 點，精力 +1 到 +6)
                    </div>
                </div>

                <button id="settlementRollBtn" style="
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #ce93d8, #ba68c8);
                    border: none;
                    border-radius: 30px;
                    color: white;
                    font-weight: bold;
                    font-size: 18px;
                    cursor: pointer;
                    box-shadow: 0 6px 18px rgba(206,147,216,0.5);
                    transition: transform 0.15s ease;
                ">
                    🎲 擲骰獲取精力
                </button>

                <div style="margin-top: 12px;
                            font-size: 11px;
                            color: #ce93d8;">
                    ⏰ <span id="settlementRollCountdown">15</span> 秒後自動擲骰
                </div>
            </div>
        `;
    }

    /**
     * Bind the roll button + countdown timer.
     * @param {Function} onRoll - called when player clicks roll or countdown ends
     */
    static bindEvents(onRoll) {
        const btn = document.getElementById('settlementRollBtn');
        if (btn) {
            btn.onclick = () => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.textContent = '🎲 擲骰中...';
                onRoll();
            };

            btn.onmouseenter = () => {
                if (!btn.disabled) btn.style.transform = 'scale(1.03)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
            };
        }

        // Auto-roll after countdown
        let remaining = 15;
        const countdownEl = document.getElementById('settlementRollCountdown');

        const timerId = setInterval(() => {
            remaining--;
            if (countdownEl) countdownEl.textContent = remaining;

            if (remaining <= 0) {
                clearInterval(timerId);
                if (btn && !btn.disabled) {
                    btn.click();   // trigger auto-roll
                }
            }
        }, 1000);

        return timerId;
    }
}