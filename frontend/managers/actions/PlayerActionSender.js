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

        if (!client.isConnected || !gs || gs.energy === 0 || client.gameOver) {
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

        if (client._endTurnSent) return;
        client._endTurnSent = true;

        client.connection.send({ type: 'end_turn', playerId: client.playerId });
        client.logManager.addLog('🔄 結束回合', 'info');
    }

    applyLoan() {
        const { client } = this;
        if (!client.isConnected || !client.gameState || client.gameOver) return;
        // TODO: wire up real loan request when server supports it
        client.logManager.addLog('💰 貸款功能', 'info');
    }

    repayLoan() {
        const { client } = this;
        if (!client.isConnected || !client.gameState || client.gameOver) return;
        // TODO: wire up real repay request when server supports it
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
}