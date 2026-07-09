"use strict";

export class ItemHandler {
    constructor(client) {
        this.client = client;
    }

    handleFourLeafCloverUsed(message) {
        this._applyAndLog(message, `🍀 ${message.message}`, 'success');
    }

    handleLuckyStarUsed(message) {
        this._applyAndLog(message, `⭐ ${message.message}`, 'success');
    }

    // ── Private ───────────────────────────────────────────────────────────

    _applyAndLog(message, logMsg, type) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
        client.logManager.addLog(logMsg, type);
    }
}