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
        const canLoan  = gameState.loanAmount === 0;
        const canRepay = gameState.loanAmount > 0 || (gameState.accruedInterest || 0) > 0;

        const clovers  = gameState.fourLeafClover || 0;
        const stars    = gameState.luckyStarCount || 0;

        // ✅ Both buttons disabled once ANY multiplier is used until roll happens
        // (hasRolledThisTurn clears diceMultiplierActive)
        const canUseMultiplier = isMyTurn
            && !gameState.hasRolledThisTurn
            && !gameState.diceMultiplierActive
            && !gameState.skipNextTurn;

        const canUseClover     = canUseMultiplier && clovers > 0;
        const canUseLuckyStar  = canUseMultiplier && stars > 0;

        const hasMinimized = this.client?.modalManager?.hasMinimizedModals?.() || false;
        const canEndTurn   = isMyTurn && !hasMinimized;

        this._set('btnRoll',          canRoll);
        this._set('btnRollTop',       canRoll);
        this._set('btnEndTurn',       canEndTurn);
        this._set('btnEndTurnTop',    canEndTurn);
        this._set('btnLoan',          canLoan);
        this._set('btnRepayLoan',     canRepay);
        this._set('btnUseClover',     canUseClover);
        this._set('btnUseLuckyStar',  canUseLuckyStar);

        // End turn label
        if (isMyTurn && hasMinimized) {
            const count = this.client.modalManager.getMinimizedCount();
            const label = `⚠️ 還有 ${count} 個待處理的決定`;
            this._setLabel('btnEndTurn',    label);
            this._setLabel('btnEndTurnTop', label);   // ✅ ADD
        } else {
            this._setLabel('btnEndTurn',    '⏭️ 結束回合');
            this._setLabel('btnEndTurnTop', '⏭️ 結束回合');   // ✅ ADD
        }


        // Loan button label
        const ratePercent = (gameState.permanentLoanRate ?? 10).toFixed(1);
        this._setLabel('btnLoan', `🏦 申請貸款 (${ratePercent}%/月)`);

        // ✅ Multiplier labels — clear indication of state
        const cloverBaseLabel = clovers > 0 ? `🍀 四葉草 (x2) x${clovers}` : '🍀 四葉草 (x2)';
        const starBaseLabel   = stars > 0   ? `⭐ 幸運星 (x3) x${stars}`  : '⭐ 幸運星 (x3)';

        let cloverLabel = cloverBaseLabel;
        let starLabel   = starBaseLabel;

        if (isMyTurn) {
            if (gameState.diceMultiplierActive) {
                // One is already active — show which one
                if (gameState.diceMultiplier === 3) {
                    cloverLabel = `${cloverBaseLabel} ❌`;
                    starLabel   = `⭐ 幸運星已啟動 (x3) - 請擲骰`;
                } else if (gameState.diceMultiplier === 2) {
                    cloverLabel = `🍀 四葉草已啟動 (x2) - 請擲骰`;
                    starLabel   = `${starBaseLabel} ❌`;
                }
            } else if (gameState.hasRolledThisTurn) {
                cloverLabel = `${cloverBaseLabel} (本回合已擲骰)`;
                starLabel   = `${starBaseLabel} (本回合已擲骰)`;
            }
        }

        this._setLabel('btnUseClover',    cloverLabel);
        this._setLabel('btnUseLuckyStar', starLabel);
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
            'btnEndTurnTop',
            'btnLoan',
            'btnRepayLoan',
            'btnUseClover',
            'btnUseLuckyStar'
        ].forEach(id => this._set(id, false));
    }
}