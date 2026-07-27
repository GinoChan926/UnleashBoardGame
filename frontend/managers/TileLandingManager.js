"use strict";

import { TileLandingTemplate }    from './cards/templates/TileLandingTemplate.js';
import { SKIP_LANDING_MODAL_TYPES } from '../constants/TileTypes.js';

export class TileLandingManager {
    constructor(client) {
        this.client  = client;
        this.timerId = null;
    }

    /**
     * Show the tile landing modal for the player who just landed.
     * Automatically skips tile types that trigger their own modal.
     */
    show(tile, eventMessage) {
        if (!tile) return;

        // ✅ Skip if this tile type will trigger its own modal
        if (SKIP_LANDING_MODAL_TYPES.has(tile.type)) {
            return;
        }

        // Close any existing modal
        this._close();

        const old = document.getElementById('tileLandingModal');
        if (old) old.remove();

        this.client.modalManager.createModal(
            'tileLandingModal',
            TileLandingTemplate.buildModal(tile, eventMessage)
        );
        this.client.modalManager.openModal('tileLandingModal');

        this.timerId = TileLandingTemplate.bindEvents(() => this._close());
    }

    _close() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.client.modalManager.closeModal('tileLandingModal');
        const modal = document.getElementById('tileLandingModal');
        if (modal) modal.remove();
    }
}