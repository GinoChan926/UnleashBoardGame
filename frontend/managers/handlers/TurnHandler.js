"use strict";

export class TurnHandler {
    constructor(client) {
        this.client            = client;
        this.lastTurnWasMine   = false;
        this.turnNumber        = 1;
        this.currentTurnPlayer = null;
    }

    updateTurnStatus() {
        const { client } = this;

        if (!client.gameState) {
            client.buttonState.disableAll();
            this._refreshIndicator();
            return;
        }

        const isMyTurn = client.gameState.isMyTurn === true;
        client.isMyTurn = isMyTurn;

        client._endTurnSent = false;

        client.buttonState.refresh(client.gameState);
        this._updateStatusBar(isMyTurn);
        this._notifyOnTurnStart(isMyTurn);
        this._refreshIndicator();

        this.lastTurnWasMine = isMyTurn;
    }

    handleTurnStatus(message) {
        const { client } = this;

        this.turnNumber        = message.roundNumber || this.turnNumber || 1;
        this.currentTurnPlayer = message.currentPlayerName || message.currentTurnPlayer;

        if (!client.gameState) client.gameState = {};

        const targetId = message.currentPlayerId || message.currentTurnPlayerId;
        if (targetId) {
            client.gameState.isMyTurn = (targetId === client.playerId);
        }

        if (this.currentTurnPlayer) {
            client.gameState.currentTurnPlayer = this.currentTurnPlayer;
        }

        this.updateTurnStatus();

        if (!client.gameState.isMyTurn && this.currentTurnPlayer) {
            client.logManager.addLog(`⏳ 等待 ${this.currentTurnPlayer} 操作`, 'info');
        }
    }

    handleTurnEnded(message) {
        const { client } = this;
        console.log('🔄 handleTurnEnded:', message.playerId, '/ me:', client.playerId);

        if (message.playerId === client.playerId) {
            if (message.gameState) {
                client.gameState = message.gameState;
                console.log(`⚡ My energy restored: ${client.gameState.energy}/${client.gameState.maxEnergy}`);
                client.updateUI();
            }
        } else if (message.gameState) {
            client.otherPlayers.set(message.playerId, message.gameState);
            console.log(`⚡ Other player ${message.playerId} energy: ${message.gameState.energy}`);
        }

        client.boardRenderer.renderAllTiles(client.gameState, client.otherPlayers);
        client.updatePlayersList();
        this.updateTurnStatus();
    }

    handleStateUpdated(message) {
        const { client } = this;
        console.log('📡 handleStateUpdated:', message.playerId,
            'isMyTurn:', message.gameState?.isMyTurn);

        if (message.playerId === client.playerId && message.gameState) {
            client.gameState = message.gameState;
            console.log(`🎯 My turn: ${client.gameState.isMyTurn}, energy: ${client.gameState.energy}`);
            client.updateUI();
        } else if (message.playerId && message.gameState) {
            client.otherPlayers.set(message.playerId, message.gameState);
            console.log(`👤 Other player ${message.playerId} state updated`);

            if (message.gameState.currentTurnPlayer && client.gameState) {
                client.gameState.currentTurnPlayer = message.gameState.currentTurnPlayer;
            }
        }

        client.boardRenderer.renderAllTiles(client.gameState, client.otherPlayers);
        client.updatePlayersList();
        this.updateTurnStatus();
    }

    async handleDiceResult(message) {
        const { client } = this;

        if (message.diceValues && message.diceValues.length > 0) {
            const { DiceAnimationTemplate } = await import('../cards/templates/DiceAnimationTemplate.js');

            await new Promise(resolve => {
                DiceAnimationTemplate.show(
                    message.diceValues,
                    message.diceType || 'normal',
                    message.playerName || '',
                    resolve
                );
            });
        }

        if (message.playerId === client.playerId && message.gameState) {
            client.gameState = message.gameState;
        } else if (message.gameState) {
            client.otherPlayers.set(message.playerId, message.gameState);
        }

        client.updateUI();
        client.boardRenderer.renderAllTiles(client.gameState, client.otherPlayers);
        client.updatePlayersList();
        this.updateTurnStatus();

        if (message.multiplierMessage) {
            client.logManager.showNotification(message.multiplierMessage, 'success');
        }

        if (message.playerId === client.playerId && message.tile) {
            client.tileLandingManager.show(message.tile, message.eventMessage);
        }
    }

    handleTurnSkipped(message) {
        const { client } = this;

        const skippedPlayerId   = message.skippedPlayerId || message.playerId;
        const skippedPlayerName = message.skippedPlayerName || message.playerName || '某玩家';
        const msg = message.message || `⏸️ ${skippedPlayerName} 的回合已被跳過`;

        client.logManager.addLog(msg, 'warning');
        client.logManager.showNotification(msg, 'warning');

        // ✅ If I am the skipped player, immediately disable my actions locally
        if (skippedPlayerId === client.playerId && client.gameState) {
            client.gameState.isMyTurn = false;
            client.isMyTurn = false;
            client.gameState.hasRolledThisTurn = false;
            client.buttonState.refresh(client.gameState);
            client.updateUI();
        }

        this.updateTurnStatus();
    }

    // ── Private ───────────────────────────────────────────────────────

    _refreshIndicator() {
        const { client } = this;
        if (!client.turnIndicator) return;

        const currentTurn =
            client.gameState?.currentTurnPlayer ||
            this.currentTurnPlayer ||
            null;

        client.turnIndicator.update(
            currentTurn,
            client.playerName,
            client.isMyTurn === true,
            client.gameState
        );
    }

    _updateStatusBar(isMyTurn) {
        const { client } = this;
        const bar = client.getElement('networkStatus');
        if (!bar) return;

        bar.className = 'network-status connected';

        if (isMyTurn) {
            if (client.gameState.energy <= 0) {
                bar.textContent = '🟡 你的回合 - 精力耗盡，請結束回合';
                bar.style.color = '#ff9800';
            } else {
                bar.textContent = '🟢 你的回合 - 可以行動';
                bar.style.color = '#4caf50';
            }
        } else {
            const waiting = client.gameState.currentTurnPlayer || '其他玩家';
            bar.textContent = `⏳ 等待 ${waiting} 的回合`;
            bar.style.color = '#ff9800';
        }
    }

    _notifyOnTurnStart(isMyTurn) {
        if (isMyTurn && !this.lastTurnWasMine) {
            this.client.logManager.showNotification('🎯 輪到你了！請行動', 'success');
            this.client.logManager.addLog('🎯 輪到你了！', 'success');
        }
    }
}