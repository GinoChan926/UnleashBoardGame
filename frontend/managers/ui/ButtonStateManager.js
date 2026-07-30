"use strict";

export class ButtonStateManager {
    constructor(client) {
        this.client = client;
    }

    refresh(gameState) {
        if (!gameState) {
            this._disableAll();
            return;
        }

        const isMyTurn = gameState.isMyTurn === true;
        const canRoll  = isMyTurn && !gameState.hasRolledThisTurn && !gameState.skipNextTurn;
        const canLoan  = isMyTurn && gameState.loanAmount === 0;
        const canRepay = isMyTurn && gameState.loanAmount > 0;
        const clovers  = gameState.fourLeafClover || 0;
        const stars    = gameState.luckyStarCount || 0;

        // ✅ Check if there are minimized modals (blocks end turn visually)
        const hasMinimized = this.client.modalManager?.hasMinimizedModals?.() || false;
        const canEndTurn   = isMyTurn && !hasMinimized;

        this._set('btnRoll',          canRoll);
        this._set('btnRollTop',       canRoll);
        this._set('btnEndTurn',       canEndTurn);
        this._set('btnLoan',          canLoan);
        this._set('btnRepayLoan',     canRepay);
        this._set('btnUseClover',     isMyTurn && clovers > 0);
        this._set('btnUseLuckyStar',  isMyTurn && stars > 0);

        // ✅ End turn label
        if (isMyTurn && hasMinimized) {
            const count = this.client.modalManager.getMinimizedCount();
            this._setLabel('btnEndTurn', `⚠️ 還有 ${count} 個待處理的決定`);
        } else {
            this._setLabel('btnEndTurn', '⏭️ 結束回合');
        }

        // Loan button dynamic label
        const ratePercent = (gameState.permanentLoanRate ?? 10).toFixed(1);
        this._setLabel('btnLoan', `🏦 申請貸款 (${ratePercent}%/月)`);

        this._setLabel(
            'btnUseClover',
            clovers > 0 ? `🍀 四葉草 (x2) x${clovers}` : '🍀 四葉草 (x2)'
        );
        this._setLabel(
            'btnUseLuckyStar',
            stars > 0 ? `⭐ 幸運星 (x3) x${stars}` : '⭐ 幸運星 (x3)'
        );
    }

    disableAll() {
        this._disableAll();
    }

    // ── Private ───────────────────────────────────────────────────────────

    _set(id, enabled) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.disabled      = !enabled;
        btn.style.opacity = enabled ? '1' : '0.4';
        btn.style.filter  = enabled ? 'none' : 'grayscale(70%)';
        btn.style.cursor  = enabled ? 'pointer' : 'not-allowed';
    }

    _setLabel(id, text) {
        const btn = document.getElementById(id);
        if (btn) btn.textContent = text;
    }

    _disableAll() {
        // ✅ fixed typo: btnRollTop, not canRollTop
        [
            'btnRoll',
            'btnRollTop',
            'btnEndTurn',
            'btnLoan',
            'btnRepayLoan',
            'btnUseClover',
            'btnUseLuckyStar'
        ].forEach(id => this._set(id, false));
    }
}