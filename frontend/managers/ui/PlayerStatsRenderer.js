"use strict";

/**
 * Renders the numeric stats panel only.
 * Button states are handled by ButtonStateManager.
 */
export class PlayerStatsRenderer {
    constructor(buttonStateManager) {
        this.buttons = buttonStateManager;
    }

    render(gameState) {
        if (!gameState) return;

        // ── Expense calculation ──────────────────────────────────────────
        const rawExp = gameState.livingExpense
            + gameState.tax
            + (gameState.childExpense   || 0);

        const reductionPct = gameState.expenseReduction || 0;
        const savedAmount  = Math.floor(rawExp * reductionPct / 100);
        const totalExp     = rawExp - savedAmount;
        const reductionMsg = reductionPct > 0 ? ` (已減免 ${reductionPct}%)` : '';

        // ── Passive income (flow layer override) ─────────────────────────
        const effectivePassive = (gameState.inFlow && gameState.flowPassiveIncome)
            ? gameState.flowPassiveIncome
            : gameState.passiveIncome;

        const monthlyCF     = (gameState.salary + gameState.sideIncome + effectivePassive) - totalExp;
        const totalLoanRepay = gameState.loanAmount + (gameState.accruedInterest || 0);

        const layerText      = gameState.inFlow    ? '順流層'
            : gameState.inReverse ? '逆流層'
                : '平流層';

        // ✅ Win condition progress with color coding
        const VOL_REQ  = 5;
        const CONT_REQ = 1;

        const volunteers    = gameState.volunteerCount    || 0;
        const contributions = gameState.contributionCount || 0;

        const volEl = document.getElementById('statVolunteerProgress');
        if (volEl) {
            volEl.innerText = `${volunteers}/${VOL_REQ}`;
            volEl.style.color = volunteers >= VOL_REQ ? '#4caf50' : '#ff5252';
        }

        const contEl = document.getElementById('statContributionProgress');
        if (contEl) {
            contEl.innerText = `${contributions}/${CONT_REQ}`;
            contEl.style.color = contributions >= CONT_REQ ? '#4caf50' : '#ff5252';
        }

        // ── Stat elements ────────────────────────────────────────────────
        this._set('statCash',          gameState.cash.toLocaleString());
        this._set('statSalary',        gameState.salary.toLocaleString());
        this._set('statSideIncome',    gameState.sideIncome.toLocaleString());
        this._set('statPassiveIncome', effectivePassive.toLocaleString());
        this._set('statLiving',        gameState.livingExpense.toLocaleString());
        this._set('statTax',           gameState.tax.toLocaleString());
        this._set('statLoanInterest',  (gameState.loanInterest || 0).toLocaleString());
        this._set('statEnergy',        `${gameState.energy}/${gameState.maxEnergy}`);
        this._set('statLuck',          gameState.luck.toFixed(1));
        this._set('statLuckyStar',     gameState.luckyStarCount  || 0);
        this._set('statFourLeafClover',gameState.fourLeafClover  || 0);
        this._set('statHardshipShield', gameState.hardshipShield || 0);
        this._set('statLayer',         layerText);
        this._set('layerText',         layerText);
        this._set('statLoanCash', (gameState.loanCash || 0).toLocaleString());
        this._set('statTotalCash',
            ((gameState.cash || 0) + (gameState.loanCash || 0)).toLocaleString()
        );
        this._set('statAccruedInterest', (gameState.accruedInterest || 0).toLocaleString());
        this._set('statHealth', (gameState.health || 0).toString());
        this._set('statAbility', (gameState.ability || 0).toString());

        // ── Coloured elements ─────────────────────────────────────────────
        this._setHtml('statMonthlyCF', el => {
            el.innerText   = (monthlyCF >= 0 ? '+' : '') + monthlyCF.toLocaleString();
            el.style.color = monthlyCF >= 0 ? '#4caf50' : '#ff6b6b';
        });

        this._setHtml('statTotalExpense', el => {
            el.innerText   = totalExp.toLocaleString() + reductionMsg;
            el.style.color = reductionPct > 0 ? '#4caf50' : '#ffefc0';
        });

        this._setHtml('statTotalLoanRepay', el => {
            el.innerText   = totalLoanRepay.toLocaleString();
            el.style.color = gameState.loanAmount > 0 ? '#ff6b6b' : '#4caf50';
        });

        // ── Delegate buttons to ButtonStateManager ────────────────────────
        this.buttons.refresh(gameState);

        // ✅ Show pending auto-debt
        const pendingDebt = (gameState.pendingDebts || [])
            .reduce((sum, d) => sum + d.amount, 0);
        const pendingDebtEl = document.getElementById('statPendingDebt');
        if (pendingDebtEl) {
            pendingDebtEl.innerText = pendingDebt.toLocaleString();
            pendingDebtEl.style.color = pendingDebt > 0 ? '#ff9800' : '#4caf50';
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    _set(id, value) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }

    _setHtml(id, fn) {
        const el = document.getElementById(id);
        if (el) fn(el);
    }
}