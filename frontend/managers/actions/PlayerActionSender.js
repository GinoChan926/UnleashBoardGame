"use strict";

/**
 * Sends player-initiated actions to the server.
 * Guards: connection ready, game not over, correct state.
 */
export class PlayerActionSender {
    constructor(client) {
        this.client = client;
    }

    rollDice() {
        const { client } = this;
        const gs = client.gameState;

        // ✅ keep frontend guard consistent with ButtonStateManager
        if (!client.isConnected || !gs || client.gameOver) {
            client.logManager.addLog('❌ 無法擲骰', 'error');
            return;
        }

        if (!gs.isMyTurn) {
            client.logManager.addLog('❌ 現在不是你的回合', 'warning');
            return;
        }

        if (gs.hasRolledThisTurn) {
            client.logManager.addLog('❌ 你本回合已經擲過骰子', 'warning');
            return;
        }

        // ✅ disable immediately to prevent double-click spam
        const rollBtn = document.getElementById('btnRoll');
        const rollTopBtn = document.getElementById('btnRollTop');

        [rollBtn, rollTopBtn].forEach(btn => {
            if (!btn) return;
            btn.disabled = true;
            btn.style.opacity = '0.4';
            btn.style.filter = 'grayscale(70%)';
            btn.style.cursor = 'not-allowed';
        });

        const ok = client.connection.send({
            type: 'roll',
            playerId: client.playerId,
            data: { diceCount: 1 }
        });

        // ✅ if send failed, restore button state
        if (!ok) {
            client.buttonState.refresh(gs);
            client.logManager.addLog('❌ 擲骰請求發送失敗', 'error');
        }
    }

    endTurn() {
        const { client } = this;
        if (!client.isConnected || client.gameOver) return;

        if (client._endTurnSent) return;
        client._endTurnSent = true;

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
        const { client } = this;
        if (!client.isConnected || !client.gameState || client.gameOver) return;
        client.connection.send({ type: 'use_four_leaf_clover', playerId: client.playerId });
        client.logManager.addLog('🍀 使用四葉草', 'info');
    }

    useLuckyStar() {
        const { client } = this;
        if (!client.isConnected || !client.gameState || client.gameOver) return;
        client.connection.send({ type: 'use_lucky_star', playerId: client.playerId });
        client.logManager.addLog('⭐ 使用幸運星', 'info');
    }

    renamePlayer(newName) {
        if (!this.client.connection?.isReady()) {
            this.client.logManager.addLog('⚠️ 尚未連接遊戲', 'error');
            return;
        }
        this.client.connection.send({
            type: 'rename_player',
            newName
        });
    }
}