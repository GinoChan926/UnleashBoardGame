import { BaseCardManager } from './BaseCardManager.js';

export class AuctionManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this.setupModal();
        this.currentAuctionId = null;
    }

    setupModal() {
        if (!document.getElementById('auctionModal')) {
            this.modalManager.createModal('auctionModal', `
                <div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #1a2a3a, #0d1b2a); border-radius: 28px; text-align: center; border: 2px solid #ff6f00;">
                    <div class="modal-title" style="color: #ff6f00; font-size: 24px;">🔨 竞拍进行中</div>
                    <div id="auctionBody" style="color: #ffefc0; text-align: left; font-size: 14px; line-height: 1.8;"></div>
                    <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
                        <button class="btn-secondary" id="auctionPassBtn" style="background: #9e9e9e; padding: 12px 24px; border-radius: 30px; cursor: pointer;">⏭️ PASS</button>
                        <button class="btn-primary" id="auctionBidBtn" style="background: #ff6f00; padding: 12px 24px; border-radius: 30px; cursor: pointer;">💰 出價</button>
                    </div>
                </div>
            `);
        }
    }

    showAuctionModal(message) {
        const modal = this.modalManager.openModal('auctionModal');
        const body = document.getElementById('auctionBody');
        if (!modal || !body) return;

        this.currentAuctionId = message.auctionId;

        body.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <strong style="font-size: 18px; color: #ffd966;">${message.cardName}</strong>
                <p style="font-size: 12px; color: #aaa; margin-top: 5px;">${message.description}</p>
            </div>
            <div style="background: rgba(255,111,0,0.2); padding: 12px; border-radius: 12px;">
                <div>💰 當前價格: <strong style="color: #ff6f00; font-size: 18px;">${message.currentPrice.toLocaleString()} 元</strong></div>
                <div>👤 當前出價: <strong style="color: #ffd966;">${message.currentBidder || '無人出價'}</strong></div>
                <div>📈 每次加價: ${message.minBidIncrement.toLocaleString()} 元</div>
                <div>⚡ 獎勵: <strong style="color: #4caf50;">+${message.energyReward} 精力</strong></div>
                <div style="font-size: 12px; color: #888; margin-top: 8px;">發起人: ${message.initiator}</div>
            </div>
        `;

        const bidBtn = document.getElementById('auctionBidBtn');
        const passBtn = document.getElementById('auctionPassBtn');

        if (bidBtn) {
            bidBtn.onclick = () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'auction_bid', auctionId: this.currentAuctionId });
                }
            };
        }

        if (passBtn) {
            passBtn.onclick = () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'auction_pass', auctionId: this.currentAuctionId });
                }
                this.modalManager.closeModal('auctionModal');
            };
        }
    }

    closeAuctionModal() {
        this.modalManager.closeModal('auctionModal');
        this.currentAuctionId = null;
    }

    updateAuctionModal(message) {
        const body = document.getElementById('auctionBody');
        if (body) {
            const currentPriceEl = body.querySelector('div strong[style*="color: #ff6f00"]');
            if (currentPriceEl) {
                currentPriceEl.textContent = message.currentPrice.toLocaleString() + ' 元';
            }
            const bidderEl = body.querySelector('div strong[style*="color: #ffd966"]');
            if (bidderEl) {
                bidderEl.textContent = message.currentBidder || '無人出價';
            }
        }
    }

    handleAuctionEnd(message) {
        this.closeAuctionModal();
        if (message.winner) {
            this.ui.addLog(`🏆 ${message.message}`, 'success');
            this.ui.showNotification(message.message, 'success');
        } else {
            this.ui.addLog(`📌 ${message.message}`, 'info');
        }
    }
}