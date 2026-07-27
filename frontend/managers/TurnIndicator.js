"use strict";

/**
 * Manages the permanent turn indicator bar at the top of the board.
 */
export class TurnIndicator {
    constructor() {
        this.el       = document.getElementById('turnIndicator');
        this.nameEl   = document.getElementById('turnIndicatorName');
        this.statusEl = document.getElementById('turnIndicatorStatus');
        this.rollBtn  = document.getElementById('btnRollTop');   // ✅ NEW
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
            return;
        }

        if (isMyTurn) {
            this.nameEl.textContent = `👑 ${myName} (你)`;
            this.el.classList.add('my-turn');

            const hasRolled = gameState?.hasRolledThisTurn;

            if (hasRolled) {
                this.statusEl.textContent = '⏭️ 請結束回合';
                this._hideRollBtn();   // ✅ Hide after rolling
            } else {
                this.statusEl.textContent = '🎲 請擲骰子';
                this._showRollBtn(gameState);   // ✅ Show ready to roll
            }
        } else {
            this.nameEl.textContent = `👤 ${currentPlayerName}`;
            this.el.classList.remove('my-turn');
            this.statusEl.textContent = '⏳ 等待其他玩家...';
            this._hideRollBtn();
        }
    }

    reset() {
        if (!this.el || !this.nameEl) return;
        this.nameEl.textContent   = '尚未連接';
        this.statusEl.textContent = '';
        this.el.classList.remove('my-turn');
        this._hideRollBtn();
    }

    // ── Private ───────────────────────────────────────────────────────────

    _showRollBtn(gameState) {
        if (!this.rollBtn) return;

        this.rollBtn.style.display = 'inline-block';

        // Disable if energy too low (matching sidebar button logic if any)
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
}