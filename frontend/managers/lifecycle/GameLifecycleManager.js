"use strict";

/**
 * Manages the connect → play → disconnect lifecycle
 * and the music/game-over monitor.
 */
export class GameLifecycleManager {
    constructor(client) {
        this.client = client;
    }

    // ── Connection ────────────────────────────────────────────────────────

    doConnect() {
        const { client } = this;

        const nameInput  = client.getInput('playerName');
        client.playerName = nameInput?.value.trim() || `Player_${Date.now()}`;

        if (!client.selectedProfession) {
            client.logManager.showNotification('請先選擇職業', 'error');
            return;
        }

        client.connection.onConnect(() => {
            client.isConnected = true;
            client.playerId    = client.connection.playerId;
            client.updateNetworkStatus(true);
            client.logManager.addLog('✅ 已連接到遊戲服務器', 'success');
            client.logManager.addLog(
                `👤 玩家: ${client.playerName} (${client.selectedProfession.data.name})`,
                'event'
            );

            // ✅ Show rename button, hide connect button
            this._toggleConnectionButtons(true);
        });

        client.connection.onMessage((message) => client.router.route(message));

        client.connection.onDisconnect(() => {
            client.isConnected = false;
            client.updateNetworkStatus(false);
            client.logManager.addLog('❌ 與服務器連接已斷開', 'error');
            client.buttonState.disableAll();
            client.turnIndicator.reset();

            // ✅ Hide rename button, show connect button
            this._toggleConnectionButtons(false);
        });

        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const wsUrl    = `ws://${window.location.hostname}:8080`;

        client.connection.connect(
            wsUrl,
            playerId,
            client.playerName,
            client.selectedProfession.id,
            client.selectedProfession.data
        );
    }

    disconnect() {
        this.client.connection.disconnect();
    }

    // ── Music / game-over monitor ─────────────────────────────────────────

    setupMusicMonitor() {
        const audio = document.getElementById('bgAudio');
        if (!audio) return;
        audio.addEventListener('ended', () => {
            this.client.gameOver = true;
            this.client.logManager.addLog('🎵 音樂結束，遊戲終止', 'error');
        });
    }

    isGameOver() {
        return this.client.gameOver;
    }

    // ── Private ───────────────────────────────────────────────────────────

    _toggleConnectionButtons(connected) {
        const renameBtn  = document.getElementById('btnRename');
        const connectBtn = document.getElementById('btnConnect');

        if (renameBtn)  renameBtn.style.display  = connected ? 'inline-block' : 'none';
        if (connectBtn) connectBtn.style.display = connected ? 'none'         : 'inline-block';
    }
}