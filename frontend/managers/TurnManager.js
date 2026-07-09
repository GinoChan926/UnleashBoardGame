"use strict";

export class TurnManager {
    constructor(client) {
        this.client = client;
        this.lastTurnWasMine = false;
        this.turnNumber = 1;
        this.currentTurnPlayer = null;
        this.isMyTurn = false;
    }

    /**
     * Main turn status update - controls all button states and status display
     */
    updateTurnStatus() {
        const { client } = this;

        if (!client.gameState) {
            client.disableGameControls();
            return;
        }

        const isMyTurn = client.gameState.isMyTurn === true;
        this.isMyTurn = isMyTurn;
        client.isMyTurn = isMyTurn;

        this._updateNonRollButtons(isMyTurn);
        this._updateRollButton(isMyTurn);
        this._updateStatusDisplay(isMyTurn);
        this._notifyIfTurnChanged(isMyTurn);

        this.lastTurnWasMine = isMyTurn;
    }

    /**
     * Handle incoming turn_status message from server
     */
    handleTurnStatus(message) {
        const { client } = this;

        this.turnNumber = message.roundNumber || this.turnNumber || 1;
        this.currentTurnPlayer = message.currentPlayerName || message.currentTurnPlayer;

        // Always update gameState from server, never derive locally
        if (!client.gameState) client.gameState = {};

        if (message.currentPlayerId) {
            client.gameState.isMyTurn = (message.currentPlayerId === client.playerId);
            client.gameState.currentTurnPlayer = this.currentTurnPlayer;
        }

        this.updateTurnStatus();

        if (!client.gameState.isMyTurn && this.currentTurnPlayer) {
            client.logManager.addLog(`⏳ 等待 ${this.currentTurnPlayer} 操作`, 'info');
        }
    }

    /**
     * Handle turn_skipped message - another player timed out
     */
    handleTurnSkipped(message) {
        const { client } = this;
        const msg = `⏰ ${message.playerName} 超時被跳過`;
        client.logManager.addLog(msg, 'warning');
        client.logManager.showNotification(msg, 'warning');
        this.updateTurnStatus();
    }

    /**
     * Handle turn_ended message - a player ended their turn
     */
    handleTurnEnded(message) {
        const { client } = this;
        console.log('🔄 handleTurnEnded:', message.playerId, 'me:', client.playerId);

        if (message.playerId === client.playerId) {
            // This is YOUR turn ending - update your restored energy
            if (message.gameState) {
                client.gameState = message.gameState;
                console.log(`⚡ My energy restored to: ${client.gameState.energy}/${client.gameState.maxEnergy}`);
                client.updateUI();
            }
        } else {
            // Someone else ended their turn - update their state in map
            if (message.gameState) {
                client.otherPlayers.set(message.playerId, message.gameState);
                console.log(`⚡ Other player ${message.playerId} energy restored to: ${message.gameState.energy}`);
            }
        }

        client.boardRenderer.renderAllTiles(client.gameState);
        client.updatePlayersList();
        this.updateTurnStatus();
    }

    /**
     * Handle state_updated message - player states refreshed after turn change
     */
    handleStateUpdated(message) {
        const { client } = this;
        console.log('📡 handleStateUpdated:', message.playerId, 'isMyTurn:', message.gameState?.isMyTurn);

        if (message.playerId === client.playerId && message.gameState) {
            // Your state updated (you are next player)
            client.gameState = message.gameState;
            console.log(`🎯 My turn: ${client.gameState.isMyTurn}, energy: ${client.gameState.energy}`);
            client.updateUI();
        }

        if (message.playerId && message.playerId !== client.playerId && message.gameState) {
            // Other player's state updated
            client.otherPlayers.set(message.playerId, message.gameState);
            console.log(`👤 Other player ${message.playerId} state updated`);
        }

        client.boardRenderer.renderAllTiles(client.gameState);
        client.updatePlayersList();
        this.updateTurnStatus();
    }

    // ==================== Private Helpers ====================

    _updateNonRollButtons(isMyTurn) {
        const { client } = this;
        const nonRollControls = [
            'btnEndTurn',
            'btnLoan',
            'btnRepayLoan',
            'btnUseClover',
            'btnUseLuckyStar'
        ];

        nonRollControls.forEach(id => {
            const btn = client.getButton(id);
            if (btn) {
                btn.disabled = !isMyTurn;
                btn.style.opacity = isMyTurn ? '1' : '0.4';
                btn.style.filter = isMyTurn ? 'none' : 'grayscale(70%)';
                btn.style.cursor = isMyTurn ? 'pointer' : 'not-allowed';
            }
        });
    }

    _updateRollButton(isMyTurn) {
        const { client } = this;
        const rollBtn = client.getButton('btnRoll');
        if (!rollBtn) return;

        const canRoll = isMyTurn
            && client.gameState.energy > 0
            && !client.gameState.hasRolledThisTurn;

        rollBtn.disabled = !canRoll;
        rollBtn.style.opacity = canRoll ? '1' : '0.4';
        rollBtn.style.filter = canRoll ? 'none' : 'grayscale(70%)';
        rollBtn.style.cursor = canRoll ? 'pointer' : 'not-allowed';
    }

    _updateStatusDisplay(isMyTurn) {
        const { client } = this;
        const statusDiv = client.getElement('networkStatus');
        if (!statusDiv) return;

        statusDiv.className = 'network-status connected';

        if (isMyTurn) {
            if (client.gameState.energy <= 0) {
                statusDiv.textContent = '🟡 你的回合 - 精力耗盡，請結束回合';
                statusDiv.style.color = '#ff9800';
            } else {
                statusDiv.textContent = '🟢 你的回合 - 可以行動';
                statusDiv.style.color = '#4caf50';
            }
        } else {
            const waitingFor = client.gameState.currentTurnPlayer || '其他玩家';
            statusDiv.textContent = `⏳ 等待 ${waitingFor} 的回合`;
            statusDiv.style.color = '#ff9800';
        }
    }

    _notifyIfTurnChanged(isMyTurn) {
        const { client } = this;
        if (isMyTurn && !this.lastTurnWasMine) {
            client.logManager.showNotification('🎯 輪到你了！請行動', 'success');
            client.logManager.addLog('🎯 輪到你了！', 'success');
        }
    }
}