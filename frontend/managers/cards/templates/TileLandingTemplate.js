"use strict";

import { getTileTypeMeta } from '../../../constants/TileTypes.js';

/**
 * Simple modal shown to the player who just landed on a tile.
 * Auto-closes after 30 seconds or on confirm.
 */
export class TileLandingTemplate {

    /**
     * Build the modal HTML.
     * @param {object} tile - the tile object (has name, type)
     * @param {string} eventMessage - optional description of what happened
     */
    static buildModal(tile, eventMessage) {
        const style    = getTileTypeMeta(tile?.type);
        const tileName = tile?.name || '未知格子';
        const message  = eventMessage || `你踩中了「${tileName}」`;

        return `
            <div class="modal-content" style="
                max-width: 420px;
                background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
                border-radius: 24px;
                padding: 24px;
                color: white;
                border: 3px solid ${style.color};
                box-shadow: 0 12px 32px ${style.color}66;
                text-align: center;
            ">
                <div style="font-size: 60px; margin-bottom: 8px;
                            filter: drop-shadow(0 4px 12px ${style.color}88);">
                    ${style.icon}
                </div>

                <div style="font-size: 14px; color: ${style.color};
                            font-weight: bold; margin-bottom: 6px;
                            letter-spacing: 1px; text-transform: uppercase;">
                    ${style.title}
                </div>

                <div style="font-size: 24px; font-weight: bold;
                            color: white; margin-bottom: 12px;
                            text-shadow: 0 2px 6px rgba(0,0,0,0.5);">
                    ${tileName}
                </div>

                <div style="background: rgba(0,0,0,0.35);
                            padding: 12px 16px;
                            border-radius: 14px;
                            font-size: 14px;
                            color: #e2e8f0;
                            line-height: 1.6;
                            margin-bottom: 16px;
                            border: 1px solid ${style.color}44;
                            white-space: pre-wrap;">
                    ${message}
                </div>

                <button id="tileLandingConfirmBtn" style="
                    width: 100%;
                    padding: 12px 20px;
                    background: linear-gradient(135deg, ${style.color}, ${style.color}dd);
                    border: none;
                    border-radius: 24px;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px ${style.color}66;
                    transition: transform 0.15s ease;
                ">
                    ✅ 確認
                </button>

                <div style="margin-top: 10px;
                            font-size: 11px;
                            color: #94a3b8;">
                    ⏰ <span id="tileLandingCountdown">30</span> 秒後自動關閉
                </div>
            </div>
        `;
    }

    /**
     * Bind confirm button + start countdown. Returns interval id.
     */
    static bindEvents(onClose) {
        const btn = document.getElementById('tileLandingConfirmBtn');
        if (btn) {
            btn.onclick = () => onClose();
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        }

        let remaining = 30;
        const countdownEl = document.getElementById('tileLandingCountdown');

        const timerId = setInterval(() => {
            remaining--;
            if (countdownEl) countdownEl.textContent = remaining;

            if (remaining <= 0) {
                clearInterval(timerId);
                onClose();
            }
        }, 1000);

        return timerId;
    }
}