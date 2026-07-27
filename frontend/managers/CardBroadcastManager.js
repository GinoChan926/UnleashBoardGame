"use strict";

import { CardRevealBroadcastTemplate } from './cards/templates/CardRevealBroadcastTemplate.js';

/**
 * Shows read-only card viewer to OTHER players.
 * Queues cards so multiple reveals don't overlap.
 */
export class CardBroadcastManager {
    constructor(client) {
        this.client  = client;
        this.queue   = [];
        this.showing = false;
        this.timerId = null;
    }

    /**
     * Called on 'card_revealed' broadcast messages.
     * Ignores if it's the current player's own card (they see their own modal).
     */
    handleCardRevealed(message) {
        // Don't show broadcast to the player who drew the card
        if (message.playerId === this.client.playerId) return;
        if (!message.card) return;

        this.queue.push(message);
        this._processQueue();
    }

    _processQueue() {
        if (this.showing || this.queue.length === 0) return;

        const message = this.queue.shift();
        this.showing = true;

        // Remove old modal
        const old = document.getElementById('cardRevealBroadcastModal');
        if (old) old.remove();

        this.client.modalManager.createModal(
            'cardRevealBroadcastModal',
            CardRevealBroadcastTemplate.buildModal({
                playerName:    message.playerName,
                card:          message.card,
                action:        message.action,
                effectMessage: message.effectMessage
            })
        );
        this.client.modalManager.openModal('cardRevealBroadcastModal');

        this.timerId = CardRevealBroadcastTemplate.bindEvents(() => this._close());

        // Log to chat too
        this.client.logManager.addLog(
            `👀 ${message.playerName} ${message.action || '抽到'}「${message.card.name}」`,
            'info'
        );
    }

    _close() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.client.modalManager.closeModal('cardRevealBroadcastModal');
        const modal = document.getElementById('cardRevealBroadcastModal');
        if (modal) modal.remove();

        this.showing = false;
        // Process next queued card
        setTimeout(() => this._processQueue(), 300);
    }
}