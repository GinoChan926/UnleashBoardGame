"use strict";

export class TurnHandler {
    constructor(client) {
        this.client          = client;
        this.lastTurnWasMine = false;
        this.turnNumber      = 1;
        this.currentTurnPlayer = null;
    }

    updateTurnStatus() {
        const { client } = this;

        if (!client.gameState) {
            client.buttonState.disableAll();
            return;
        }

        const isMyTurn = client.gameState.isMyTurn === true;
        client.isMyTurn = isMyTurn;

        client.buttonState.refresh(client.gameState);
        this._updateStatusBar(isMyTurn);
        this._notifyOnTurnStart(isMyTurn);

        this.lastTurnWasMine = isMyTurn;
    }

    handleTurnStatus(message) {
        const { client } = this;

        this.turnNumber        = message.roundNumber     || this.turnNumber || 1;
        this.currentTurnPlayer = message.currentPlayerName || message.currentTurnPlayer;

        if (!client.gameState) client.gameState = {};

        if (message.currentPlayerId) {
            client.gameState.isMyTurn          = (message.currentPlayerId === client.playerId);
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

        // ✅ Pass otherPlayers so tokens render correctly
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
        }

        // ✅ Pass otherPlayers so tokens render correctly
        client.boardRenderer.renderAllTiles(client.gameState, client.otherPlayers);
        client.updatePlayersList();
        this.updateTurnStatus();
    }

    async handleDiceResult(message) {
        const { client } = this;

        // ✅ Show dice animation FIRST before updating anything
        if (message.diceValues && message.diceValues.length > 0) {
            // Only show animation for own rolls
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

        // Now apply state updates (after animation completes)
        if (message.playerId === client.playerId && message.gameState) {
            client.gameState = message.gameState;
        } else if (message.gameState) {
            client.otherPlayers.set(message.playerId, message.gameState);
        }

        client.updateUI();
        client.boardRenderer.renderAllTiles(client.gameState, client.otherPlayers);
        client.updatePlayersList();
        this.updateTurnStatus();

        // Show multiplier message if any
        if (message.multiplierMessage) {
            client.logManager.showNotification(message.multiplierMessage, 'success');
        }
    }

    handleTurnSkipped(message) {
        const { client } = this;
        const msg = `⏰ ${message.playerName} 超時被跳過`;
        client.logManager.addLog(msg, 'warning');
        client.logManager.showNotification(msg, 'warning');
        this.updateTurnStatus();
    }

    // ── Private ───────────────────────────────────────────────────────

    _updateStatusBar(isMyTurn) {
        const { client } = this;
        const bar = client.getElement('networkStatus');
        if (!bar) return;

        bar.className = 'network-status connected';

        if (isMyTurn) {
            if (client.gameState.energy <= 0) {
                bar.textContent  = '🟡 你的回合 - 精力耗盡，請結束回合';
                bar.style.color  = '#ff9800';
            } else {
                bar.textContent  = '🟢 你的回合 - 可以行動';
                bar.style.color  = '#4caf50';
            }
        } else {
            const waiting       = client.gameState.currentTurnPlayer || '其他玩家';
            bar.textContent     = `⏳ 等待 ${waiting} 的回合`;
            bar.style.color     = '#ff9800';
        }
    }

    _notifyOnTurnStart(isMyTurn) {
        if (isMyTurn && !this.lastTurnWasMine) {
            this.client.logManager.showNotification('🎯 輪到你了！請行動', 'success');
            this.client.logManager.addLog('🎯 輪到你了！', 'success');
        }
    }
}