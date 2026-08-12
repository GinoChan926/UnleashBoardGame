"use strict";

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
            client.logManager.addLog(
                `✅ 已連接到房間「${client.roomId}」`,
                'success'
            );
            client.logManager.addLog(
                `👤 玩家: ${client.playerName} (${client.selectedProfession.data.name})`,
                'event'
            );
            this._toggleConnectionButtons(true);
        });

        client.connection.onMessage((message) => client.router.route(message));

        client.connection.onDisconnect(() => {
            client.isConnected = false;
            client.updateNetworkStatus(false);
            client.logManager.addLog('❌ 與服務器連接已斷開', 'error');
            client.buttonState.disableAll();
            client.turnIndicator?.reset();
            this._toggleConnectionButtons(false);
        });

        const playerId = client.playerId || `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const wsUrl    = `ws://${window.location.hostname}:8080`;
        const roomId   = client.roomId || 'default_room';

        client.connection.connect(
            wsUrl,
            playerId,
            client.playerName,
            client.selectedProfession.id,
            client.selectedProfession.data,
            roomId
        );
    }

    disconnect() {
        this.client.connection.disconnect();
        this.client.roomId = null;   // ✅ reset so next connect prompts for room again
    }

    // ── Auto-reconnect on page load ───────────────────────────────────────

    tryAutoReconnect() {
        const { client } = this;
        const session = client.connection.getSavedSession();

        if (!session) {
            console.log('🔌 沒有可重連的 session');
            return false;
        }

        console.log(`🔌 嘗試自動重連: ${session.playerName} to room ${session.roomId}`);

        this._isReconnecting = true;

        client.playerId   = session.playerId;
        client.playerName = session.playerName;
        client.roomId     = session.roomId;   // ✅ use saved room

        client.selectedProfession = {
            id:   session.profession,
            data: { name: '重連中...' }
        };

        const nameInput = document.getElementById('playerName');
        if (nameInput) nameInput.value = session.playerName;

        client.logManager.addLog(
            `🔌 檢測到之前的 session，正在重新連接到房間「${session.roomId}」...`,
            'info'
        );

        this.doConnect();
        return true;
    }

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