"use strict";

export class FlowLayerTemplate {

    // ── Modal shell (created once) ────────────────────────────────────────

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 520px;
                 background: linear-gradient(135deg, #1a472a, #0d2b1a);
                 border-radius: 28px; text-align: center;
                 border: 2px solid #ffd700; padding: 24px;">

                ${this._buildTitle()}

                <div class="modal-body" id="flowLayerChoiceBody"
                     style="color: #ffefc0; text-align: left;
                            font-size: 14px; line-height: 1.6;
                            margin-bottom: 20px;">
                </div>

                ${this._buildButtons()}
            </div>
        `;
    }

    // ── Body content (injected when modal opens) ──────────────────────────

    /**
     * Build the body content from the server message.
     * @param {object} message - flow_layer_choice message from server
     * @returns {string} HTML
     */
    static buildBody(message) {
        const msgHtml = (message.message || '').replace(/\n/g, '<br>');

        return `
            <div style="background: rgba(255,215,0,0.1); padding: 16px;
                        border-radius: 16px; border: 1px solid rgba(255,215,0,0.2);
                        margin-bottom: 16px;">
                ${msgHtml}
            </div>

            ${this._buildStatsPreview(message)}
            ${this._buildBenefits()}
            ${this._buildWarning()}
        `;
    }

    // ── Event binding ─────────────────────────────────────────────────────

    /**
     * Bind click and hover events to the two choice buttons.
     * @param {Function} onEnter - called when player chooses to enter flow layer
     * @param {Function} onStay  - called when player chooses to stay
     */
    static bindEvents(onEnter, onStay) {
        const enterBtn = document.getElementById('enterFlowLayerBtn');
        const stayBtn  = document.getElementById('stayInStreamlineBtn');

        if (enterBtn) {
            enterBtn.onmouseenter = () => {
                enterBtn.style.transform = 'scale(1.03)';
                enterBtn.style.boxShadow = '0 6px 20px rgba(255,152,0,0.4)';
            };
            enterBtn.onmouseleave = () => {
                enterBtn.style.transform = 'scale(1)';
                enterBtn.style.boxShadow = '0 4px 12px rgba(255,152,0,0.3)';
            };
            enterBtn.onclick = () => onEnter();
        }

        if (stayBtn) {
            stayBtn.onmouseenter = () => {
                stayBtn.style.transform = 'scale(1.03)';
                stayBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
            };
            stayBtn.onmouseleave = () => {
                stayBtn.style.transform = 'scale(1)';
                stayBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            };
            stayBtn.onclick = () => onStay();
        }
    }

    // ── Private sections ──────────────────────────────────────────────────

    static _buildTitle() {
        return `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 26px; color: #ffd700; font-weight: bold;">
                    🌟 進入順流層？
                </div>
                <div style="font-size: 12px; color: #a5d6a7; margin-top: 4px;">
                    恭喜！你已滿足進入順流層的條件
                </div>
            </div>
        `;
    }

    static _buildStatsPreview(message) {
        if (!message.passiveIncome && !message.totalExpense) return '';

        return `
            <div style="background: rgba(0,0,0,0.3); padding: 14px;
                        border-radius: 12px; margin-bottom: 14px;">
                <div style="text-align: center; color: #81c784; font-size: 13px;
                            font-weight: bold; margin-bottom: 10px;">
                    📊 當前財務狀況
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
                            font-size: 13px;">
                    ${message.passiveIncome !== undefined ? `
                        <div style="color: #b0bec5;">被動收入:</div>
                        <div style="color: #4caf50; text-align: right;">
                            ${message.passiveIncome.toLocaleString()} 元/月
                        </div>
                    ` : ''}
                    ${message.totalExpense !== undefined ? `
                        <div style="color: #b0bec5;">總支出:</div>
                        <div style="color: #ff9800; text-align: right;">
                            ${message.totalExpense.toLocaleString()} 元/月
                        </div>
                    ` : ''}
                    ${message.energy !== undefined ? `
                        <div style="color: #b0bec5;">精力:</div>
                        <div style="color: #42a5f5; text-align: right;">
                            ${message.energy}/${message.maxEnergy || 100}
                        </div>
                    ` : ''}
                    ${message.loanAmount !== undefined ? `
                        <div style="color: #b0bec5;">貸款:</div>
                        <div style="color: ${message.loanAmount > 0 ? '#ff6b6b' : '#4caf50'}; text-align: right;">
                            ${message.loanAmount.toLocaleString()} 元
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    static _buildBenefits() {
        return `
            <div style="background: rgba(255,215,0,0.08); padding: 14px;
                        border-radius: 12px; margin-bottom: 14px;
                        border: 1px solid rgba(255,215,0,0.15);">
                <div style="text-align: center; color: #ffd700; font-size: 13px;
                            font-weight: bold; margin-bottom: 10px;">
                    ✨ 進入順流層後
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;
                            font-size: 13px; color: #c8e6c9;">
                    <div>📈 被動收入 × 100 倍！</div>
                    <div>🏦 可設立資產信託保護財富</div>
                    <div>🎲 步數加倍！</div>
                    <div>🌟 追求終極夢想</div>
                </div>
            </div>
        `;
    }

    static _buildWarning() {
        return `
            <div style="text-align: center; font-size: 12px; color: #ff9800;
                        background: rgba(255,152,0,0.1); padding: 10px;
                        border-radius: 10px;">
                ⚠️ 注意：進入後將無法立即返回平流層！
            </div>
        `;
    }

    static _buildButtons() {
        return `
            <div style="display: flex; gap: 15px; justify-content: center;
                        margin-top: 20px;">
                <button id="stayInStreamlineBtn"
                        style="background: linear-gradient(135deg, #9e9e9e, #757575);
                               color: white; padding: 14px 24px; border: none;
                               border-radius: 30px; cursor: pointer; font-size: 15px;
                               transition: all 0.2s ease;
                               box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                               display: flex; align-items: center; gap: 6px;">
                    <span>📌</span>
                    <span>留在平流層</span>
                </button>
                <button id="enterFlowLayerBtn"
                        style="background: linear-gradient(135deg, #ff9800, #f57c00);
                               color: white; padding: 14px 24px; border: none;
                               border-radius: 30px; cursor: pointer; font-size: 15px;
                               transition: all 0.2s ease;
                               box-shadow: 0 4px 12px rgba(255,152,0,0.3);
                               display: flex; align-items: center; gap: 6px;">
                    <span>🚀</span>
                    <span>進入順流層</span>
                </button>
            </div>
        `;
    }
}