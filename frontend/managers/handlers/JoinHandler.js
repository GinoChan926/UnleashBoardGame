"use strict";

export class JoinHandler {
    constructor(client) {
        this.client = client;
    }

    handleJoinSuccess(message) {
        const {client} = this;

        // ✅ Check for server restart
        const savedSession = client.connection.getSavedSession();
        const savedServerId = savedSession?.serverInstanceId;
        const currentServerId = message.serverInstanceId;

        if (savedServerId && currentServerId && savedServerId !== currentServerId) {
            console.log(`🆕 Server restarted (old: ${savedServerId}, new: ${currentServerId})`);
            client.connection._clearSession();
            // Fall through — server treats this as a fresh join anyway
        }

        // ✅ Save the current server ID for next time
        if (currentServerId) {
            client.connection.updateServerInstanceId(currentServerId);
        }

        // ── Existing logic ────────────────────────────────────────────────
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
        client.boardRenderer.renderAllTiles(client.gameState, client.otherPlayers);
        client.updatePlayersList();
        client.turnHandler.updateTurnStatus();

        if (message.timer && window.sharedTimer) {
            if (message.timer.running) {
                window.sharedTimer.handleStart(message.timer);
            } else if (message.timer.paused) {
                window.sharedTimer.handlePause(message.timer);
            } else {
                window.sharedTimer.handleStop();
            }
        }

        if (typeof message.isHost === 'boolean' && window.sharedTimer) {
            window.sharedTimer.setHost(message.isHost);
        }

        if (message.reconnected) {
            client.logManager.addLog(
                `🔌 已重新連接遊戲！歡迎回來 ${message.playerName}`,
                'success'
            );
            client.logManager.showNotification(
                `🔌 已重新連接！繼續遊戲`,
                'success'
            );
        } else {
            client.logManager.addLog('🎉 成功加入遊戲！', 'success');
        }
    }

    handleJoinFailed(message) {
        const { client } = this;

        client.logManager.addLog(
            message.reason || '❌ 加入房間失敗',
            'error'
        );
        client.logManager.showNotification(
            message.reason || '加入房間失敗',
            'error'
        );

        // Reset room and disconnect so player can pick another room
        client.roomId = null;
        client.connection.disconnect();

        // Reset UI state
        const nameInput  = client.getInput('playerName');
        const connectBtn = client.getButton('btnConnect');
        if (nameInput)  nameInput.disabled  = false;
        if (connectBtn) {
            connectBtn.disabled     = false;
            connectBtn.style.display = 'inline-block';
        }

        // Re-open room selection modal after a brief delay
        setTimeout(() => {
            if (typeof client.connect === 'function') {
                client.connect();
            }
        }, 1500);
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
        client.logManager.addLog(
            `👤 ${message.playerName || '玩家'} 離開遊戲`,
            'warning'
        );
        client.updatePlayersList();
        client.turnHandler.updateTurnStatus();
    }

    // ==================== NEW: Temporary disconnect / reconnect ====================

    handleTempDisconnected(message) {
        const { client } = this;
        if (!message.playerId) return;

        // Mark the player in the panel with a "disconnected" flag
        if (client.otherPlayers.has(message.playerId)) {
            const other = client.otherPlayers.get(message.playerId);
            other._disconnected   = true;
            other._disconnectedAt = Date.now();
            other._graceMs        = message.graceMs || 60000;
        }

        client.logManager.addLog(
            `⚠️ ${message.playerName} 暫時斷線 (等待重連中...)`,
            'warning'
        );
        client.logManager.showNotification(
            `⚠️ ${message.playerName} 暫時斷線`,
            'warning'
        );

        client.updatePlayersList();
    }

    handleReconnected(message) {
        const { client } = this;
        if (!message.playerId) return;

        // Clear disconnect flag
        if (client.otherPlayers.has(message.playerId)) {
            const other = client.otherPlayers.get(message.playerId);
            other._disconnected   = false;
            other._disconnectedAt = null;
        }

        client.logManager.addLog(
            `✅ ${message.playerName} 已重新連接！`,
            'success'
        );
        client.logManager.showNotification(
            `✅ ${message.playerName} 已重新連接！`,
            'success'
        );

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