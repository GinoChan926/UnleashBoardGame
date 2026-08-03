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

        // ✅ Block if any modal is minimized
        if (client.modalManager?.hasMinimizedModals?.()) {
            const count = client.modalManager.getMinimizedCount();
            client.logManager.addLog(
                `⚠️ 還有 ${count} 個待處理的決定，請先處理完再結束回合`,
                'warning'
            );
            client.logManager.showNotification(
                `⚠️ 還有 ${count} 個待處理的決定！請點擊右下角的按鈕繼續`,
                'warning'
            );
            return;
        }

        if (client._endTurnSent) return;
        client._endTurnSent = true;

        client.connection.send({ type: 'end_turn', playerId: client.playerId });
        client.logManager.addLog('🔄 結束回合', 'info');
    }

    applyLoan() {
        const { client } = this;
        if (!client.isConnected || !client.gameState || client.gameOver) return;
        // ✅ Request loan info from server — frontend then opens modal
        client.connection.send({ type: 'get_loan_info' });
    }

    repayLoan() {
        const { client } = this;
        if (!client.isConnected || !client.gameState || client.gameOver) return;

        // ✅ Ask server for latest loan info — server response triggers repay modal
        client.connection.send({ type: 'get_loan_info' });
        client._pendingRepayMode = true;   // flag so FinanceHandler knows to show repay modal
    }

    useFourLeafClover() {
        const { client } = this;
        const gs = client.gameState;

        if (!client.isConnected || !gs || client.gameOver) return;

        if (!gs.isMyTurn) {
            client.logManager.addLog('❌ 現在不是你的回合', 'warning');
            client.logManager.showNotification('現在不是你的回合', 'warning');
            return;
        }

        if (gs.hasRolledThisTurn) {
            client.logManager.addLog(
                '❌ 你已經擲過骰子了，四葉草只能在擲骰前使用',
                'warning'
            );
            client.logManager.showNotification(
                '你已經擲過骰子了！四葉草需要在擲骰前使用',
                'warning'
            );
            return;
        }

        if (gs.diceMultiplierActive) {
            const currentType = gs.diceMultiplier === 3 ? '幸運星' : '四葉草';
            client.logManager.addLog(
                `❌ 你已經使用了${currentType}，不能同時使用多個道具`,
                'warning'
            );
            client.logManager.showNotification(
                `已使用${currentType}，不能疊加`,
                'warning'
            );
            return;
        }

        if (!gs.fourLeafClover || gs.fourLeafClover <= 0) {
            client.logManager.addLog('❌ 你沒有四葉草了', 'warning');
            return;
        }

        // ✅ Disable BOTH buttons immediately to prevent misclick
        this._disableMultiplierButtons();

        client.connection.send({
            type: 'use_four_leaf_clover',
            playerId: client.playerId
        });
        client.logManager.addLog('🍀 使用四葉草', 'info');
    }

    useLuckyStar() {
        const { client } = this;
        const gs = client.gameState;

        if (!client.isConnected || !gs || client.gameOver) return;

        if (!gs.isMyTurn) {
            client.logManager.addLog('❌ 現在不是你的回合', 'warning');
            client.logManager.showNotification('現在不是你的回合', 'warning');
            return;
        }

        if (gs.hasRolledThisTurn) {
            client.logManager.addLog(
                '❌ 你已經擲過骰子了，幸運星只能在擲骰前使用',
                'warning'
            );
            client.logManager.showNotification(
                '你已經擲過骰子了！幸運星需要在擲骰前使用',
                'warning'
            );
            return;
        }

        if (gs.diceMultiplierActive) {
            const currentType = gs.diceMultiplier === 3 ? '幸運星' : '四葉草';
            client.logManager.addLog(
                `❌ 你已經使用了${currentType}，不能同時使用多個道具`,
                'warning'
            );
            client.logManager.showNotification(
                `已使用${currentType}，不能疊加`,
                'warning'
            );
            return;
        }

        if (!gs.luckyStarCount || gs.luckyStarCount <= 0) {
            client.logManager.addLog('❌ 你沒有幸運星了', 'warning');
            return;
        }

        // ✅ Disable BOTH buttons immediately
        this._disableMultiplierButtons();

        client.connection.send({
            type: 'use_lucky_star',
            playerId: client.playerId
        });
        client.logManager.addLog('⭐ 使用幸運星', 'info');
    }

// ✅ NEW helper
    _disableMultiplierButtons() {
        ['btnUseClover', 'btnUseLuckyStar'].forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.disabled      = true;
            btn.style.opacity = '0.4';
            btn.style.filter  = 'grayscale(70%)';
            btn.style.cursor  = 'not-allowed';
        });
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