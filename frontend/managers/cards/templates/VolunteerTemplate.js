"use strict";

// ── Shared constants ──────────────────────────────────────────────────────────

const VOLUNTEER_FALLBACK_SVG =
    'data:image/svg+xml,' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
    '<rect width="100" height="100" fill="%234caf50"/>' +
    '<text x="50" y="55" text-anchor="middle" fill="white" font-size="40">🤝</text>' +
    '</svg>';

const VOLUNTEER_MODAL_BASE = `
    background: linear-gradient(135deg, #2a4a2a, #1a3a1a);
    border-radius: 24px;
    text-align: center;
    border: 2px solid #4caf50;
    padding: 24px;
`;

// ── Template class ────────────────────────────────────────────────────────────

export class VolunteerTemplate {

    // ==================== Modal Shells ====================

    static buildCardModal() {
        return `
            <div class="modal-content" style="max-width:450px; ${VOLUNTEER_MODAL_BASE}">
                <div class="modal-title"
                     style="color:#4caf50; font-size:24px; margin-bottom:12px;">
                    🤝 義工卡
                </div>
                <div style="text-align:center; margin:15px 0;">
                    <img id="volunteerCardImg" src="" alt="義工卡"
                         style="max-width:100%; border-radius:16px;
                                box-shadow:0 8px 20px rgba(0,0,0,0.3);
                                border:3px solid #4caf50;">
                </div>
                <div class="modal-body" id="volunteerCardBody"
                     style="font-size:16px; line-height:1.5;
                            color:#ffefc0; text-align:center;">
                </div>
                <div style="background:rgba(76,175,80,0.2); padding:12px;
                            border-radius:12px; margin:15px 0; text-align:center;">
                    <span style="color:#4caf50; font-size:14px;"
                          id="volunteerCardEffect">
                    </span>
                </div>
                <div class="modal-buttons"
                     style="justify-content:center; margin-top:15px;">
                    <button id="closeVolunteerCardBtn"
                            style="background:linear-gradient(135deg,#4caf50,#388e3c);
                                   color:white; padding:10px 30px; border:none;
                                   border-radius:30px; cursor:pointer; font-size:15px;
                                   transition:all 0.2s ease;
                                   box-shadow:0 4px 12px rgba(76,175,80,0.3);">
                        確認
                    </button>
                </div>
            </div>
        `;
    }

    static buildDonationModal() {
        return `
            <div class="modal-content" style="max-width:450px; ${VOLUNTEER_MODAL_BASE}">
                <div class="modal-title"
                     style="color:#4caf50; font-size:24px; margin-bottom:12px;">
                    🤝 義工卡
                </div>
                <div style="text-align:center; margin:15px 0;">
                    <img id="donationCardImg" src="" alt="義工卡"
                         style="max-width:100%; border-radius:16px;
                                box-shadow:0 8px 20px rgba(0,0,0,0.3);
                                border:3px solid #4caf50;">
                </div>
                <div class="modal-body" id="donationModalBody"
                     style="font-size:16px; line-height:1.5;
                            color:#ffefc0; text-align:center;">
                </div>
                <div class="modal-buttons"
                     style="display:flex; justify-content:center;
                            gap:15px; margin-top:15px;">
                    <button id="cancelDonationBtn"
                            style="background:#9e9e9e; color:white; padding:10px 30px;
                                   border:none; border-radius:30px; cursor:pointer;
                                   font-size:15px; transition:all 0.2s ease;">
                        ❌ 取消
                    </button>
                    <button id="confirmDonationBtn"
                            style="background:linear-gradient(135deg,#4caf50,#388e3c);
                                   color:white; padding:10px 30px; border:none;
                                   border-radius:30px; cursor:pointer; font-size:15px;
                                   transition:all 0.2s ease;
                                   box-shadow:0 4px 12px rgba(76,175,80,0.3);">
                        ✅ 執行義工
                    </button>
                </div>
            </div>
        `;
    }

    static buildChoiceModal() {
        return `
            <div class="modal-content" style="max-width:450px; ${VOLUNTEER_MODAL_BASE}">
                <div class="modal-title"
                     style="color:#4caf50; font-size:24px; margin-bottom:12px;">
                    🤝 義工卡 - 選擇獎勵
                </div>
                <div style="text-align:center; margin:15px 0;">
                    <img id="choiceCardImg" src="" alt="義工卡"
                         style="max-width:100%; border-radius:16px;
                                box-shadow:0 8px 20px rgba(0,0,0,0.3);
                                border:3px solid #4caf50;">
                </div>
                <div class="modal-body" id="choiceModalBody"
                     style="font-size:16px; line-height:1.5;
                            color:#ffefc0; text-align:center;">
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr;
                            gap:15px; margin:20px 0;">
                    <button id="choiceCashBtn"
                            style="background:linear-gradient(135deg,#ff9800,#f57c00);
                                   color:white; padding:14px 12px; border:none;
                                   border-radius:20px; cursor:pointer; font-size:14px;
                                   transition:all 0.2s ease;
                                   box-shadow:0 4px 12px rgba(255,152,0,0.3);">
                        💰 獲得 $3,000 元
                    </button>
                    <button id="choiceVolunteerBtn"
                            style="background:linear-gradient(135deg,#4caf50,#388e3c);
                                   color:white; padding:14px 12px; border:none;
                                   border-radius:20px; cursor:pointer; font-size:14px;
                                   transition:all 0.2s ease;
                                   box-shadow:0 4px 12px rgba(76,175,80,0.3);">
                        ⭐ 獲得 1 次義工資格
                    </button>
                </div>
                <div class="modal-buttons"
                     style="justify-content:center; margin-top:10px;">
                    <button id="cancelChoiceBtn"
                            style="background:#9e9e9e; color:white; padding:10px 30px;
                                   border:none; border-radius:30px; cursor:pointer;
                                   font-size:14px; transition:all 0.2s ease;">
                        取消
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== Body Content ====================

    static buildCardBody(card, effectMessage, escapeHtml) {
        return `
            <strong style="font-size:20px; color:#4caf50;">
                ${escapeHtml(card.name || '')}
            </strong>
            <p style="margin-top:10px; color:#ffefc0;">
                ${escapeHtml(card.description || '')}
            </p>
        `;
    }

    static buildDonationBody(card, escapeHtml) {
        const donationType = card.donationType || 'cash';
        const unit         = donationType === 'energy' ? '精力' : '元';
        const amount       = card.donationAmount ?? 0;
        const targetText   = card.donationTarget === 'bank'
            ? '銀行'
            : '現金最少的玩家';

        return `
            <strong style="font-size:20px; color:#4caf50;">
                ${escapeHtml(card.name || '')}
            </strong>
            <p style="margin-top:10px; color:#ffefc0;">
                ${escapeHtml(card.description || '')}
            </p>
            <div style="background:rgba(76,175,80,0.3); padding:10px;
                        border-radius:12px; margin-top:12px;">
                <span style="color:#ffd966; font-size:13px;">
                    💡 執行後，每位有能力的玩家將捐贈
                    <strong>${amount} ${unit}</strong>
                    給 ${targetText}，你將獲得 1 次義工資格
                </span>
            </div>
        `;
    }

    // ✅ NEW — prompt body for other players
    static buildDonationPromptBody(message, escapeHtml) {
        const donationType = message.donationType || 'cash';
        const unit         = donationType === 'energy' ? '精力' : '元';
        const icon         = donationType === 'energy' ? '⚡' : '💰';
        const canAfford    = message.canAfford !== false; // default true

        return `
        <div class="donation-prompt">
            <p style="color:#ffefc0; margin-bottom:12px;">
                ${escapeHtml(message.message || '')}
            </p>
            <div style="background:rgba(76,175,80,0.2); padding:12px;
                        border-radius:12px; margin:12px 0;
                        font-size:1.1em; color:#ffefc0;">
                ${icon} 捐贈：
                <strong style="color:#ffd966;">
                    ${message.donationAmount} ${unit}
                </strong>
                ${message.targetPlayer ? `
                    <br>🎯 受益人：
                    <strong style="color:#4caf50;">
                        ${escapeHtml(message.targetPlayer)}
                    </strong>
                ` : ''}
                ${message.currentAmount !== undefined ? `
                    <br><span style="font-size:0.9em; color:#bbb;">
                        📊 你目前有：${message.currentAmount} ${unit}
                    </span>
                ` : ''}
            </div>
            ${!canAfford ? `
                <p style="color:#ff6b6b; font-size:13px; margin:8px 0;
                          background:rgba(255,107,107,0.15); padding:8px;
                          border-radius:8px;">
                    ⚠️ 你的${unit}不足，無法捐贈！
                </p>
            ` : `
                <p style="color:#f0a500; font-size:13px;">
                    🍀 捐贈者將獲得幸運值 +1 獎勵！
                </p>
            `}
        </div>
    `;
    }

    static buildChoiceBody(card, escapeHtml) {
        return `
            <strong style="font-size:20px; color:#4caf50;">
                ${escapeHtml(card.name || '')}
            </strong>
            <p style="margin-top:10px; color:#ffefc0;">
                ${escapeHtml(card.description || '')}
            </p>
            <div style="background:rgba(76,175,80,0.3); padding:10px;
                        border-radius:12px; margin-top:12px;">
                <span style="color:#ffd966;">📌 請選擇你的獎勵：</span>
            </div>
        `;
    }

    // ==================== Title Updater ====================

    // ✅ NEW — centralize title updates
    static setModalTitle(modalId, title) {
        const titleEl = document.querySelector(`#${modalId} .modal-title`);
        if (titleEl) titleEl.textContent = title;
    }

    // ==================== Image Setter ====================

    static applyCardImage(imgEl, card) {
        if (!imgEl) return;
        if (!card?.image) {
            imgEl.src = VOLUNTEER_FALLBACK_SVG;
            return;
        }
        let url = card.image;
        if (!url.startsWith('http') && !url.startsWith('/')) url = '/' + url;
        imgEl.src    = url;
        imgEl.onerror = () => { imgEl.src = VOLUNTEER_FALLBACK_SVG; };
    }

    // ✅ NEW — show/hide image area
    static setImageVisible(imgEl, visible) {
        if (imgEl) imgEl.style.display = visible ? '' : 'none';
    }

    // ==================== Button Label Updater ====================

    // ✅ NEW — centralize button label updates
    static setDonationButtonLabels(confirmText, cancelText) {
        const confirmBtn = document.getElementById('confirmDonationBtn');
        const cancelBtn  = document.getElementById('cancelDonationBtn');
        if (confirmBtn) confirmBtn.textContent = confirmText;
        if (cancelBtn)  cancelBtn.textContent  = cancelText;
    }

    // ==================== Event Binding ====================

    static bindCardButtons(onClose) {
        const closeBtn = document.getElementById('closeVolunteerCardBtn');
        if (closeBtn) {
            closeBtn.onclick      = () => onClose();
            closeBtn.onmouseenter = () => {
                closeBtn.style.transform  = 'scale(1.03)';
                closeBtn.style.boxShadow  = '0 6px 20px rgba(76,175,80,0.4)';
            };
            closeBtn.onmouseleave = () => {
                closeBtn.style.transform  = 'scale(1)';
                closeBtn.style.boxShadow  = '0 4px 12px rgba(76,175,80,0.3)';
            };
        }
    }

    static bindDonationButtons(onConfirm, onCancel) {
        const confirmBtn = document.getElementById('confirmDonationBtn');
        const cancelBtn  = document.getElementById('cancelDonationBtn');

        if (confirmBtn) {
            confirmBtn.onclick      = () => onConfirm();
            confirmBtn.onmouseenter = () => {
                confirmBtn.style.transform = 'scale(1.03)';
                confirmBtn.style.boxShadow = '0 6px 20px rgba(76,175,80,0.4)';
            };
            confirmBtn.onmouseleave = () => {
                confirmBtn.style.transform = 'scale(1)';
                confirmBtn.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)';
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick      = () => onCancel();
            cancelBtn.onmouseenter = () => { cancelBtn.style.transform = 'scale(1.02)'; };
            cancelBtn.onmouseleave = () => { cancelBtn.style.transform = 'scale(1)'; };
        }
    }

    static bindChoiceButtons(onChoice, onCancel) {
        const cashBtn      = document.getElementById('choiceCashBtn');
        const volunteerBtn = document.getElementById('choiceVolunteerBtn');
        const cancelBtn    = document.getElementById('cancelChoiceBtn');

        if (cashBtn) {
            cashBtn.onclick      = () => onChoice('cash');
            cashBtn.onmouseenter = () => {
                cashBtn.style.transform = 'scale(1.03)';
                cashBtn.style.boxShadow = '0 6px 20px rgba(255,152,0,0.4)';
            };
            cashBtn.onmouseleave = () => {
                cashBtn.style.transform = 'scale(1)';
                cashBtn.style.boxShadow = '0 4px 12px rgba(255,152,0,0.3)';
            };
        }

        if (volunteerBtn) {
            volunteerBtn.onclick      = () => onChoice('volunteer');
            volunteerBtn.onmouseenter = () => {
                volunteerBtn.style.transform = 'scale(1.03)';
                volunteerBtn.style.boxShadow = '0 6px 20px rgba(76,175,80,0.4)';
            };
            volunteerBtn.onmouseleave = () => {
                volunteerBtn.style.transform = 'scale(1)';
                volunteerBtn.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)';
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick      = () => onCancel();
            cancelBtn.onmouseenter = () => { cancelBtn.style.transform = 'scale(1.02)'; };
            cancelBtn.onmouseleave = () => { cancelBtn.style.transform = 'scale(1)'; };
        }
    }
}