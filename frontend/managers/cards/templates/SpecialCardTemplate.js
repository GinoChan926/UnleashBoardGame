"use strict";

// ── Fallback SVGs ─────────────────────────────────────────────────────────────

const makeFallbackSvg = (color, emoji) =>
    `data:image/svg+xml,` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">` +
    `<rect width="100" height="100" fill="${encodeURIComponent(color)}"/>` +
    `<text x="50" y="55" text-anchor="middle" fill="white" font-size="40">${emoji}</text>` +
    `</svg>`;

const FALLBACKS = {
    hardship: makeFallbackSvg('#e53935', '😰'),
    lier:     makeFallbackSvg('#7b1fa2', '🤥'),
    police:   makeFallbackSvg('#1565c0', '👮')
};

// ── Shared style ──────────────────────────────────────────────────────────────

const BASE = (borderColor) => `
    border-radius: 24px;
    text-align: center;
    border: 2px solid ${borderColor};
    padding: 24px;
`;

const THEMES = {
    hardship: {
        border:      '#e53935',
        titleColor:  '#ef9a9a',
        effectBg:    'rgba(229,57,53,0.2)',
        effectColor: '#ef9a9a',
        btnBg:       'linear-gradient(135deg,#e53935,#b71c1c)',
        btnShadow:   'rgba(229,57,53,0.3)',
        btnShadowHover: 'rgba(229,57,53,0.5)',
        icon:        '😰',
        label:       '逆境卡',
        fallback:    'hardship'
    },
    lier: {
        border:      '#9c27b0',
        titleColor:  '#ce93d8',
        effectBg:    'rgba(156,39,176,0.2)',
        effectColor: '#ce93d8',
        btnBg:       'linear-gradient(135deg,#9c27b0,#6a1b9a)',
        btnShadow:   'rgba(156,39,176,0.3)',
        btnShadowHover: 'rgba(156,39,176,0.5)',
        icon:        '🤥',
        label:       '騙子卡',
        fallback:    'lier'
    },
    police: {
        border:      '#2196f3',
        titleColor:  '#90caf9',
        effectBg:    'rgba(33,150,243,0.2)',
        effectColor: '#90caf9',
        btnBg:       'linear-gradient(135deg,#2196f3,#1565c0)',
        btnShadow:   'rgba(33,150,243,0.3)',
        btnShadowHover: 'rgba(33,150,243,0.5)',
        icon:        '👮',
        label:       '警察卡',
        fallback:    'police'
    }
};

// ── Template class ────────────────────────────────────────────────────────────

export class SpecialCardTemplate {

    // ==================== Modal Shell ====================

    /**
     * @param {'hardship'|'lier'|'police'} type
     * @param {string} modalId
     * @param {string} imgId
     * @param {string} bodyId
     * @param {string} effectId
     * @param {string} closeBtnId
     */
    static buildModal(type, modalId, imgId, bodyId, effectId, closeBtnId) {
        const t = THEMES[type];
        return `
            <div class="modal-content"
                 style="max-width:450px;
                        background:linear-gradient(135deg,#2a1a1a,#1a0d0d);
                        ${BASE(t.border)}">

                <div class="modal-title"
                     style="color:${t.titleColor}; font-size:24px; margin-bottom:12px;">
                    ${t.icon} ${t.label}
                </div>

                <div style="text-align:center; margin:15px 0;">
                    <img id="${imgId}" src="" alt="${t.label}"
                         style="max-width:100%; border-radius:16px;
                                box-shadow:0 8px 20px rgba(0,0,0,0.3);
                                border:3px solid ${t.border};">
                </div>

                <div class="modal-body" id="${bodyId}"
                     style="font-size:16px; line-height:1.5;
                            color:#ffefc0; text-align:center;">
                </div>

                <div style="background:${t.effectBg}; padding:12px;
                            border-radius:12px; margin:15px 0; text-align:center;">
                    <span style="color:${t.effectColor}; font-size:14px;"
                          id="${effectId}">
                    </span>
                </div>

                <div class="modal-buttons"
                     style="justify-content:center; margin-top:15px;">
                    <button id="${closeBtnId}"
                            style="background:${t.btnBg};
                                   color:white; padding:10px 30px; border:none;
                                   border-radius:30px; cursor:pointer; font-size:15px;
                                   transition:all 0.2s ease;
                                   box-shadow:0 4px 12px ${t.btnShadow};"
                            data-shadow="${t.btnShadow}"
                            data-shadow-hover="${t.btnShadowHover}">
                        確認
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== Body Builder ====================

    static buildCardBody(card, escapeHtml) {
        return `
            <strong style="font-size:20px; color:#ffd966;">
                ${escapeHtml(card.name || '')}
            </strong>
            <p style="margin-top:10px; color:#ffefc0;">
                ${escapeHtml(card.description || '')}
            </p>
        `;
    }

    // ==================== Title Updater ====================

    static setModalTitle(modalId, title) {
        const el = document.querySelector(`#${modalId} .modal-title`);
        if (el) el.textContent = title;
    }

    // ==================== Image Setter ====================

    static applyCardImage(imgEl, card, type) {
        if (!imgEl) return;
        if (!card?.image) {
            imgEl.src = FALLBACKS[type] || FALLBACKS.police;
            return;
        }
        let url = card.image;
        if (!url.startsWith('http') && !url.startsWith('/')) url = '/' + url;
        imgEl.src     = url;
        imgEl.onerror = () => { imgEl.src = FALLBACKS[type] || FALLBACKS.police; };
    }

    // ==================== Button Binding ====================

    static bindCloseButton(btnId, onClose) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        const shadow      = btn.dataset.shadow      || 'rgba(0,0,0,0.3)';
        const shadowHover = btn.dataset.shadowHover || 'rgba(0,0,0,0.5)';

        btn.onclick      = () => onClose();
        btn.onmouseenter = () => {
            btn.style.transform  = 'scale(1.03)';
            btn.style.boxShadow  = `0 6px 20px ${shadowHover}`;
        };
        btn.onmouseleave = () => {
            btn.style.transform  = 'scale(1)';
            btn.style.boxShadow  = `0 4px 12px ${shadow}`;
        };
    }
}