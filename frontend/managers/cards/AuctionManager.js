"use strict";

import { BaseCardManager }  from './BaseCardManager.js';
import { AuctionTemplate }  from './templates/AuctionTemplate.js';

export class AuctionManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this.currentAuctionId = null;
        this._ensureModal();
    }

    // ── Show auction modal ────────────────────────────────────────────────

    showAuctionModal(message) {
        this._ensureModal();

        const body = document.getElementById('auctionBody');
        if (!body) return;

        this.currentAuctionId = message.auctionId;

        // Inject body content from template
        body.innerHTML = AuctionTemplate.buildBody(message);

        // Open modal
        this.modalManager.openModal('auctionModal');

        // Bind events - pure logic callbacks, no HTML
        AuctionTemplate.bindEvents(
            // On bid
            () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({
                        type: 'auction_bid',
                        auctionId: this.currentAuctionId
                    });
                }
            },
            // On pass
            () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({
                        type: 'auction_pass',
                        auctionId: this.currentAuctionId
                    });
                }
                this.closeAuctionModal();
            }
        );
    }

    // ── Update auction (new bid received) ─────────────────────────────────

    updateAuctionModal(message) {
        const body = document.getElementById('auctionBody');
        AuctionTemplate.updatePriceAndBidder(body, message);
    }

    // ── End auction ───────────────────────────────────────────────────────

    handleAuctionEnd(message) {
        this.closeAuctionModal();

        if (message.winner) {
            this.ui.addLog(`🏆 ${message.message}`, 'success');
            this.ui.showNotification(message.message, 'success');
        } else {
            this.ui.addLog(`📌 ${message.message}`, 'info');
        }
    }

    // ── Close ─────────────────────────────────────────────────────────────

    closeAuctionModal() {
        this.modalManager.closeModal('auctionModal');
        this.currentAuctionId = null;
    }

    // ── Private ───────────────────────────────────────────────────────────

    _ensureModal() {
        if (!document.getElementById('auctionModal')) {
            this.modalManager.createModal('auctionModal', AuctionTemplate.buildModal());
        }
    }
}