"use strict";

/**
 * Manages the permanent turn indicator bar at the top of the board.
 */
export class TurnIndicator {
    constructor() {
        this.el         = document.getElementById('turnIndicator');
        this.nameEl     = document.getElementById('turnIndicatorName');
        this.statusEl   = document.getElementById('turnIndicatorStatus');
        this.rollBtn    = document.getElementById('btnRollTop');
        this.endTurnBtn = document.getElementById('btnEndTurnTop');   // ✅ NEW
        this.flowBtn    = document.getElementById('btnEnterFlow');
    }

    /**
     * Update the display with current turn info.
     */
    update(currentPlayerName, myName, isMyTurn, gameState) {
        if (!this.el || !this.nameEl) return;

        if (!currentPlayerName) {
            this.nameEl.textContent   = '等待玩家加入...';
            this.statusEl.textContent = '';
            this.el.classList.remove('my-turn');
            this._hideRollBtn();
            this._hideEndTurnBtn();   // ✅ NEW
            this._hideFlowBtn();
            return;
        }

        if (isMyTurn) {
            this.nameEl.textContent = `${myName} (你)`;
            this.el.classList.add('my-turn');

            const hasRolled = gameState?.hasRolledThisTurn;

            if (hasRolled) {
                this.statusEl.textContent = '請結束回合';
                this._hideRollBtn();
                this._showEndTurnBtn(gameState);   // ✅ NEW — show end turn after rolling
            } else {
                this.statusEl.textContent = '請擲骰子';
                this._showRollBtn(gameState);
                this._hideEndTurnBtn();   // ✅ NEW — hide end turn while ready to roll
            }
            this._updateFlowBtn(gameState);
        } else {
            this.nameEl.textContent = `👤 ${currentPlayerName}`;
            this.el.classList.remove('my-turn');
            this.statusEl.textContent = '⏳ 等待其他玩家...';
            this._hideRollBtn();
            this._hideEndTurnBtn();   // ✅ NEW
            this._hideFlowBtn();
        }
    }

    reset() {
        if (!this.el || !this.nameEl) return;
        this.nameEl.textContent   = '尚未連接';
        this.statusEl.textContent = '';
        this.el.classList.remove('my-turn');
        this._hideRollBtn();
        this._hideEndTurnBtn();   // ✅ NEW
        this._hideFlowBtn();
    }

    // ── Private ───────────────────────────────────────────────────────────

    _showRollBtn(gameState) {
        if (!this.rollBtn) return;

        this.rollBtn.style.display = 'inline-block';

        const canRoll = !gameState?.skipNextTurn;
        this.rollBtn.disabled = !canRoll;

        if (gameState?.skipNextTurn) {
            this.rollBtn.textContent = '⏸️ 被暫停';
        } else {
            this.rollBtn.textContent = '🎲 擲骰子';
        }
    }

    _hideRollBtn() {
        if (this.rollBtn) {
            this.rollBtn.style.display = 'none';
        }
    }

    // ✅ NEW METHODS

    _showEndTurnBtn(gameState) {
        if (!this.endTurnBtn) return;

        this.endTurnBtn.style.display = 'inline-block';

        // Check for pending modals (blocks end turn)
        const hasMinimized = window.gameClient?.modalManager?.hasMinimizedModals?.() || false;
        this.endTurnBtn.disabled = hasMinimized;

        if (hasMinimized) {
            const count = window.gameClient.modalManager.getMinimizedCount();
            this.endTurnBtn.textContent = `⚠️ 還有 ${count} 個待處理`;
        } else {
            this.endTurnBtn.textContent = '⏭️ 結束回合';
        }
    }

    _hideEndTurnBtn() {
        if (this.endTurnBtn) {
            this.endTurnBtn.style.display = 'none';
        }
    }
    _updateFlowBtn(gameState) {
        if (!this.flowBtn) return;

        // Only show if:
        // - Not already in flow
        // - Not in reverse
        // - Passive income ≥ total expenses (excluding loan interest since it's accrued now)
        // - No active loan
        // - Energy > 0
        if (!gameState || gameState.inFlow || gameState.inReverse) {
            this._hideFlowBtn();
            return;
        }

        const totalExpense = (gameState.livingExpense || 0)
            + (gameState.tax || 0)
            + (gameState.childExpense || 0);
        const hasLoan   = (gameState.loanAmount || 0) > 0;
        const hasEnergy = (gameState.energy || 0) > 0;
        const qualifies = gameState.passiveIncome >= totalExpense && !hasLoan && hasEnergy;

        if (qualifies) {
            this.flowBtn.style.display = 'inline-block';
            this.flowBtn.title =
                `📈 被動收入: $${gameState.passiveIncome.toLocaleString()}\n` +
                `💸 每月支出: $${totalExpense.toLocaleString()}\n` +
                `✅ 你已達成順流層資格！點擊進入`;
        } else {
            this._hideFlowBtn();
        }
    }

    _hideFlowBtn() {
        if (this.flowBtn) this.flowBtn.style.display = 'none';
    }
}