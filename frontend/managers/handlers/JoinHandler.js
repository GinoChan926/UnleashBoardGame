"use strict";

export class JoinHandler {
    constructor(client) {
        this.client = client;
    }

    handleJoinSuccess(message) {
        const { client } = this;

        client.gameState = message.gameState;
        client.otherPlayers.clear();

        if (message.otherPlayers) {
            message.otherPlayers.forEach(p =>
                client.otherPlayers.set(p.id, p.gameState)
            );
        }

        this._lockConnectUI();
        client.buttonState.disableAll();

        client.updateUI();
        // ✅ Pass otherPlayers
        client.boardRenderer.renderAllTiles(client.gameState, client.otherPlayers);
        client.updatePlayersList();
        client.turnHandler.updateTurnStatus();
        client.logManager.addLog('🎉 成功加入遊戲！', 'success');
    }

    handlePlayerJoined(message) {
        const { client } = this;
        if (!message.player?.id) return;

        client.otherPlayers.set(
            message.player.id,
            message.player.gameState || message.player
        );

        const name = message.player.gameState?.playerName ?? message.player.playerName;
        client.logManager.addLog(`👤 ${name} 加入遊戲`, 'event');

        client.updatePlayersList();
        client.turnHandler.updateTurnStatus();
    }

    handlePlayerDisconnected(message) {
        const { client } = this;
        if (!message.playerId) return;

        client.otherPlayers.delete(message.playerId);
        client.logManager.addLog(`👤 ${message.playerName} 離開遊戲`, 'warning');
        client.updatePlayersList();
    }

    // ── Private ───────────────────────────────────────────────────────────

    _lockConnectUI() {
        const nameInput  = this.client.getInput('playerName');
        const connectBtn = this.client.getButton('btnConnect');
        if (nameInput)  nameInput.disabled  = true;
        if (connectBtn) connectBtn.disabled = true;
    }
}