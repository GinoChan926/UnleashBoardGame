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

        // ✅ Roll only depends on turn + hasRolledThisTurn (no more energy check)
        const canRoll  = isMyTurn && !gameState.hasRolledThisTurn;

        const canLoan  = isMyTurn && gameState.loanAmount === 0;
        const canRepay = isMyTurn && gameState.loanAmount > 0;
        const clovers  = gameState.fourLeafClover  || 0;
        const stars    = gameState.luckyStarCount   || 0;

        this._set('btnRoll',        canRoll);
        this._set('btnRollTop',        canRoll);
        this._set('btnEndTurn',     isMyTurn);
        this._set('btnLoan',        canLoan);
        this._set('btnRepayLoan',   canRepay);
        this._set('btnUseClover',   isMyTurn && clovers > 0);
        this._set('btnUseLuckyStar',isMyTurn && stars   > 0);

        // Update consumable-item button labels
        this._setLabel(
            'btnUseClover',
            clovers > 0 ? `🍀 四葉草 (x2) x${clovers}` : '🍀 四葉草 (x2)'
        );
        this._setLabel(
            'btnUseLuckyStar',
            stars > 0   ? `⭐ 幸運星 (x3) x${stars}`  : '⭐ 幸運星 (x3)'
        );
    }

    disableAll() {
        this._disableAll();
    }

    // ── Private ───────────────────────────────────────────────────────────

    _set(id, enabled) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.disabled          = !enabled;
        btn.style.opacity     = enabled ? '1'           : '0.4';
        btn.style.filter      = enabled ? 'none'        : 'grayscale(70%)';
        btn.style.cursor      = enabled ? 'pointer'     : 'not-allowed';
    }

    _setLabel(id, text) {
        const btn = document.getElementById(id);
        if (btn) btn.textContent = text;
    }

    _disableAll() {
        ['btnRoll', 'canRollTop', 'btnEndTurn','btnLoan',
            'btnRepayLoan','btnUseClover','btnUseLuckyStar']
            .forEach(id => this._set(id, false));
    }
}