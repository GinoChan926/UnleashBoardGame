"use strict";

/**
 * Modal for renaming a player mid-game.
 * All HTML lives here — GameClient just orchestrates.
 */
export class RenameTemplate {

    /**
     * Build the rename modal HTML.
     * @param {string} currentName - the player's current name (already escaped)
     */
    static buildModal(currentName) {
        return `
            <div class="modal-content" style="
                max-width: 400px;
                background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
                border-radius: 28px;
                padding: 28px;
                color: white;
                border: 2px solid #9c27b0;
            ">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 24px; font-weight: bold; color: #ce93d8;">
                        📝 修改玩家名稱
                    </div>
                    <div style="font-size: 13px; color: #b39ddb; margin-top: 6px;">
                        當前名稱: ${currentName}
                    </div>
                </div>

                <input id="renameInput" type="text" maxlength="20"
                       value="${currentName}"
                       placeholder="輸入新名稱"
                       style="
                           width: 100%;
                           padding: 12px 16px;
                           border-radius: 20px;
                           border: 2px solid #9c27b0;
                           background: rgba(0,0,0,0.4);
                           color: white;
                           font-size: 16px;
                           outline: none;
                           box-sizing: border-box;
                           margin-bottom: 12px;
                       ">

                <div id="renameError" style="
                    display: none;
                    color: #ff6b6b;
                    font-size: 13px;
                    text-align: center;
                    margin-bottom: 10px;
                "></div>

                <div style="display: flex; gap: 12px;">
                    <button id="renameCancelBtn" style="
                        flex: 1;
                        padding: 12px;
                        background: #9e9e9e;
                        border: none;
                        border-radius: 30px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                    ">
                        ❌ 取消
                    </button>
                    <button id="renameConfirmBtn" style="
                        flex: 2;
                        padding: 12px;
                        background: linear-gradient(135deg, #9c27b0, #7b1fa2);
                        border: none;
                        border-radius: 30px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(156,39,176,0.4);
                    ">
                        ✅ 確認改名
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show a validation error inside the modal.
     */
    static showError(message) {
        const errorEl = document.getElementById('renameError');
        if (errorEl) {
            errorEl.textContent   = message;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Hide the error message.
     */
    static clearError() {
        const errorEl = document.getElementById('renameError');
        if (errorEl) errorEl.style.display = 'none';
    }

    /**
     * Focus and select the input for a good UX.
     */
    static focusInput() {
        const input = document.getElementById('renameInput');
        input?.focus();
        input?.select();
    }

    /**
     * Read the trimmed value from the input.
     */
    static getInputValue() {
        const input = document.getElementById('renameInput');
        return (input?.value || '').trim();
    }

    /**
     * Bind confirm / cancel button + Enter/Escape keys.
     * @param {Function} onConfirm - called with the new name string
     * @param {Function} onCancel  - called with no arguments
     */
    static bindEvents(onConfirm, onCancel) {
        const confirmBtn = document.getElementById('renameConfirmBtn');
        const cancelBtn  = document.getElementById('renameCancelBtn');
        const input      = document.getElementById('renameInput');

        if (confirmBtn) confirmBtn.onclick = () => onConfirm(this.getInputValue());
        if (cancelBtn)  cancelBtn.onclick  = () => onCancel();

        if (input) {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter')  onConfirm(this.getInputValue());
                if (e.key === 'Escape') onCancel();
            });
        }
    }
}