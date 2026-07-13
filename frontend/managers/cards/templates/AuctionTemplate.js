"use strict";

export class AuctionTemplate {

    // ── Modal shell (created once) ────────────────────────────────────────

    /**
     * Build the static modal HTML structure.
     * Content is injected later via buildBody().
     */
    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 500px;
                 background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
                 border-radius: 28px; text-align: center;
                 border: 2px solid #ff6f00; padding: 24px;">

                <div class="modal-title" style="color: #ff6f00; font-size: 24px;
                     margin-bottom: 16px;">
                    🔨 競拍進行中
                </div>

                <div id="auctionBody" style="color: #ffefc0; text-align: left;
                     font-size: 14px; line-height: 1.8;">
                </div>

                <div style="display: flex; gap: 15px; justify-content: center;
                     margin-top: 20px;">
                    <button class="btn-secondary" id="auctionPassBtn"
                            style="background: linear-gradient(135deg, #9e9e9e, #757575);
                                   color: white; padding: 12px 24px; border: none;
                                   border-radius: 30px; cursor: pointer; font-size: 15px;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                        ⏭️ PASS
                    </button>
                    <button class="btn-primary" id="auctionBidBtn"
                            style="background: linear-gradient(135deg, #ff6f00, #e65100);
                                   color: white; padding: 12px 24px; border: none;
                                   border-radius: 30px; cursor: pointer; font-size: 15px;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 4px 12px rgba(255,111,0,0.3);">
                        💰 出價
                    </button>
                </div>
            </div>
        `;
    }

    // ── Body content (updated on each auction event) ──────────────────────

    /**
     * Build the auction body content.
     * @param {object} message - auction_start or auction_update message
     * @returns {string} HTML for #auctionBody
     */
    static buildBody(message) {
        return `
            <div style="text-align: center; margin-bottom: 15px;">
                <strong style="font-size: 20px; color: #ffd966;">
                    ${message.cardName || '投資項目'}
                </strong>
                <p style="font-size: 12px; color: #aaa; margin-top: 5px;">
                    ${message.description || ''}
                </p>
            </div>

            <div style="background: rgba(255,111,0,0.15); padding: 16px;
                        border-radius: 16px; border: 1px solid rgba(255,111,0,0.3);">

                ${this._buildRow('💰 當前價格',
            `<strong style="color: #ff6f00; font-size: 18px;">${(message.currentPrice || 0).toLocaleString()} 元</strong>`
        )}

                ${this._buildRow('👤 當前出價',
            `<strong style="color: #ffd966;">${message.currentBidder || '無人出價'}</strong>`
        )}

                ${this._buildRow('📈 每次加價',
            `${(message.minBidIncrement || 0).toLocaleString()} 元`
        )}

                ${this._buildRow('⚡ 獎勵',
            `<strong style="color: #4caf50;">+${message.energyReward || 0} 精力</strong>`
        )}

                <div style="font-size: 12px; color: #888; margin-top: 10px;
                            text-align: center; border-top: 1px solid rgba(255,255,255,0.1);
                            padding-top: 8px;">
                    發起人: ${message.initiator || '未知'}
                </div>
            </div>
        `;
    }

    // ── Partial update (price and bidder only) ────────────────────────────

    /**
     * Update just the price and bidder in an existing auction body.
     * More efficient than rebuilding the entire body.
     * @param {HTMLElement} bodyEl - the #auctionBody element
     * @param {object}     message - auction_update message
     */
    static updatePriceAndBidder(bodyEl, message) {
        if (!bodyEl) return;

        const priceEl = bodyEl.querySelector('[data-auction-price]');
        if (priceEl) {
            priceEl.innerHTML = `${(message.currentPrice || 0).toLocaleString()} 元`;
        } else {
            // Fallback: find by style
            const strongEls = bodyEl.querySelectorAll('strong');
            strongEls.forEach(el => {
                if (el.style.color === 'rgb(255, 111, 0)' || el.style.cssText.includes('#ff6f00')) {
                    el.textContent = (message.currentPrice || 0).toLocaleString() + ' 元';
                }
                if (el.style.color === 'rgb(255, 217, 102)' || el.style.cssText.includes('#ffd966')) {
                    el.textContent = message.currentBidder || '無人出價';
                }
            });
        }
    }

    // ── Event binding ─────────────────────────────────────────────────────

    /**
     * Bind click and hover events to auction buttons.
     * @param {Function} onBid  - called when player clicks bid
     * @param {Function} onPass - called when player clicks pass
     */
    static bindEvents(onBid, onPass) {
        const bidBtn  = document.getElementById('auctionBidBtn');
        const passBtn = document.getElementById('auctionPassBtn');

        if (bidBtn) {
            bidBtn.onmouseenter = () => {
                bidBtn.style.transform = 'scale(1.03)';
                bidBtn.style.boxShadow = '0 6px 20px rgba(255,111,0,0.4)';
            };
            bidBtn.onmouseleave = () => {
                bidBtn.style.transform = 'scale(1)';
                bidBtn.style.boxShadow = '0 4px 12px rgba(255,111,0,0.3)';
            };
            bidBtn.onclick = () => onBid();
        }

        if (passBtn) {
            passBtn.onmouseenter = () => {
                passBtn.style.transform = 'scale(1.03)';
                passBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
            };
            passBtn.onmouseleave = () => {
                passBtn.style.transform = 'scale(1)';
                passBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            };
            passBtn.onclick = () => onPass();
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    static _buildRow(label, value) {
        return `
            <div style="display: flex; justify-content: space-between;
                        align-items: center; padding: 6px 0;
                        border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="color: #b0bec5;">${label}</span>
                <span>${value}</span>
            </div>
        `;
    }
}