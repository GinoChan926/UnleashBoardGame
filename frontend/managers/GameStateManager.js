"use strict";

export class GameStateManager {
    constructor(client) {
        this.client = client;
    }

    // ==================== Connection Actions ====================

    doConnect() {
        const { client } = this;
        const playerNameInput = client.getInput('playerName');
        client.playerName = playerNameInput?.value.trim() || `Player_${Date.now()}`;

        if (!client.selectedProfession) {
            client.logManager.showNotification('請先選擇職業', 'error');
            return;
        }

        client.connection.onConnect(() => {
            client.isConnected = true;
            client.playerId = client.connection.playerId;
            client.updateNetworkStatus(true);
            client.logManager.addLog(`✅ 已連接到遊戲服務器`, 'success');
            client.logManager.addLog(
                `👤 玩家: ${client.playerName} (${client.selectedProfession.data.name})`,
                'event'
            );
        });

        client.connection.onMessage((message) => client.router.route(message));

        client.connection.onDisconnect(() => {
            client.isConnected = false;
            client.updateNetworkStatus(false);
            client.logManager.addLog('❌ 與服務器連接已斷開', 'error');
            client.disableGameControls();
        });

        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const wsUrl = `ws://${window.location.hostname}:8080`;

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

    // ==================== Game Action Senders ====================

    rollDice() {
        const { client } = this;
        if (!client.isConnected || !client.gameState || client.gameState.energy === 0 || client.gameOver) {
            client.logManager.addLog('❌ 無法擲骰', 'error');
            return;
        }
        client.connection.send({
            type: 'roll',
            playerId: client.playerId,
            data: { diceCount: 1 }
        });
    }

    endTurn() {
        const { client } = this;
        if (!client.isConnected || client.gameOver) return;

        if (client.gameState && client.gameState.energy < client.gameState.maxEnergy) {
            console.log(`⚡ Energy before end turn: ${client.gameState.energy}/${client.gameState.maxEnergy}`);
        }

        client.connection.send({ type: 'end_turn', playerId: client.playerId });
        client.logManager.addLog('🔄 結束回合', 'info');
    }

    applyLoan() {
        const { client } = this;
        if (!client.isConnected || !client.gameState || client.gameOver) return;
        client.logManager.addLog('💰 貸款功能', 'info');
    }

    repayLoan() {
        const { client } = this;
        if (!client.isConnected || !client.gameState || client.gameOver) return;
        client.logManager.addLog('💰 還款功能', 'info');
    }

    useFourLeafClover() {
        this.client.logManager.addLog('🍀 四葉草功能', 'info');
    }

    useLuckyStar() {
        this.client.logManager.addLog('⭐ 幸運星功能', 'info');
    }

    // ==================== Incoming Message Handlers ====================

    handleJoinSuccess(message) {
        const { client } = this;
        client.gameState = message.gameState;
        client.otherPlayers.clear();

        if (message.otherPlayers) {
            message.otherPlayers.forEach(p => client.otherPlayers.set(p.id, p.gameState));
        }

        client.enableGameControls();
        client.updateUI();
        client.boardRenderer.renderAllTiles(client.gameState);
        client.updatePlayersList();
        client.turnManager.updateTurnStatus();
        client.logManager.addLog(`🎉 成功加入遊戲！`, 'success');
    }

    handlePlayerJoined(message) {
        const { client } = this;
        if (message.player && message.player.id) {
            client.otherPlayers.set(
                message.player.id,
                message.player.gameState || message.player
            );
            client.logManager.addLog(
                `👤 ${message.player.gameState?.playerName || message.player.playerName} 加入遊戲`,
                'event'
            );
            client.updatePlayersList();
            client.turnManager.updateTurnStatus();
        }
    }

    handleDiceResult(message) {
        const { client } = this;

        if (message.playerId === client.playerId && message.gameState) {
            client.gameState = message.gameState;
        }

        if (message.playerId !== client.playerId && message.gameState) {
            client.otherPlayers.set(message.playerId, message.gameState);
        }

        client.updateUI();
        client.boardRenderer.renderAllTiles(client.gameState);
        client.boardRenderer.updatePlayerToken(client.gameState);
        client.boardRenderer.updateAllOtherPlayerTokens(client.otherPlayers);
        client.updatePlayersList();
        client.turnManager.updateTurnStatus();
    }

    handlePlayerDisconnected(message) {
        const { client } = this;
        if (message.playerId) {
            client.otherPlayers.delete(message.playerId);
            client.logManager.addLog(`👤 ${message.playerName} 離開遊戲`, 'warning');
            client.updatePlayersList();
        }
    }

    handleCardTypeSelection(message) {
        this.client.cardModal.showCardTypeSelection(
            message.cardTypes || [],
            message.canAfford || false
        );
    }

    handleOpportunityCardDraw(message) {
        if (message.card) {
            this.client.cardModal.showPurchaseConfirm(message.card, message.canAfford);
        }
    }

    handleCardPurchased(message) {
        if (message.card && message.effectPreview) {
            this.client.cardModal.showEffectConfirm(message.card, message.effectPreview);
        }
    }

    handleCardDecisionResult(message) {
        const { client } = this;
        if (message.execute) {
            client.logManager.addLog(`✅ ${message.message}`, 'success');
        } else {
            client.logManager.addLog(`⚠️ ${message.message}`, 'warning');
        }
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }

    handleLoanApproved(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
        }
        client.updateUI();
        client.logManager.addLog(`🏦 貸款批准: ${message.message}`, 'success');
    }

    handleLoanRepaid(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
        }
        client.updateUI();
        client.logManager.addLog(`💰 貸款已償還`, 'success');
    }

    handleLoanRejected(message) {
        this.client.logManager.addLog(`❌ 貸款被拒: ${message.reason}`, 'error');
    }

    handleForcedRepayment(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
        }
        client.updateUI();
        client.logManager.addLog(`⚠️ 強制還款: ${message.message}`, 'warning');
    }

    handleSettlementReminder(message) {
        this.client.logManager.addLog(`📅 ${message.message}`, 'info');
    }

    handleSettlement(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
        }
        client.updateUI();
        client.logManager.addLog(`🏁 結算日: ${message.message}`, 'event');
    }

    handleFourLeafCloverUsed(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
        }
        client.updateUI();
        client.logManager.addLog(`🍀 ${message.message}`, 'success');
    }

    handleLuckyStarUsed(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
        }
        client.updateUI();
        client.logManager.addLog(`⭐ ${message.message}`, 'success');
    }

    handleCardExecuted(message) {
        const { client } = this;
        client.logManager.addLog(`✨ ${message.message || '卡片執行成功'}`, 'success');
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }

    handleCardSkipped(message) {
        this.client.logManager.addLog(`⏭️ ${message.message || '已跳過卡片'}`, 'warning');
    }

    handlePurchaseFailed(message) {
        this.client.logManager.addLog(`❌ ${message.message}`, 'error');
    }

    // ==================== Property/Market Handlers ====================

    showPropertySellChoices(message) {
        const { client } = this;
        const { playersToAsk, cardId, cardName } = message;

        const currentPlayerProperty = playersToAsk
            ? playersToAsk.find(p => p.playerName === client.gameState?.playerName)
            : null;

        if (!currentPlayerProperty) {
            client.logManager.addLog(
                `🏠 ${cardName}：你沒有持有香港中西區住宅物業`,
                'info'
            );
            if (client.ws && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                    type: 'market_news_response',
                    playerChoices: {},
                    cardId: cardId
                }));
            }
            return;
        }

        const userChoice = confirm(`🏠 ${cardName}\n市場正在求購...\n\n確定出售？`);
        if (client.ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
                type: 'market_news_response',
                playerChoices: { [client.gameState.playerName]: userChoice },
                cardId: cardId
            }));
        }
    }

    // ==================== Music / Game Over ====================

    setupMusicMonitor() {
        const audio = document.getElementById('bgAudio');
        if (audio) {
            audio.addEventListener('ended', () => {
                this.client.gameOver = true;
                this.client.logManager.addLog('🎵 音樂結束，遊戲終止', 'error');
            });
        }
    }

    checkMusicAndGameOver() {
        return this.client.gameOver;
    }
}