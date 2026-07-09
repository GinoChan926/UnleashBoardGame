"use strict";

import { ButtonStateManager }  from './ui/ButtonStateManager.js';
import { PlayerStatsRenderer } from './ui/PlayerStatsRenderer.js';
import { PlayersListRenderer } from './ui/PlayersListRenderer.js';

/**
 * Thin facade that wires the three UI sub-renderers together.
 * External code that calls playerPanel.updateUI() / updatePlayersList()
 * continues to work without changes.
 */
export class PlayerPanelRenderer {
    constructor(client) {
        this.client  = client;
        this.buttons = new ButtonStateManager(client);
        this.stats   = new PlayerStatsRenderer(this.buttons);
        this.list    = new PlayersListRenderer(client.escapeHtml.bind(client));
    }

    updateUI(gameState) {
        this.stats.render(gameState);
    }

    updatePlayersList(myState, otherPlayers) {
        this.list.render(myState, otherPlayers);
    }
}