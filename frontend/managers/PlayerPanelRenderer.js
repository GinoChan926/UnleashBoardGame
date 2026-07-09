export class PlayerPanelRenderer {
    constructor(uiManager) {
        this.ui = uiManager;
    }

    updateUI(gameState) {
        if (!gameState) return;

        const rawTotalExp = gameState.livingExpense + gameState.tax + gameState.loanInterest + (gameState.childExpense || 0);
        let totalExp = rawTotalExp;
        let expenseReductionMessage = '';
        const expenseReductionPercent = gameState.expenseReduction || 0;

        if (expenseReductionPercent > 0) {
            const savedAmount = Math.floor(rawTotalExp * expenseReductionPercent / 100);
            totalExp = rawTotalExp - savedAmount;
            expenseReductionMessage = ` (已減免 ${expenseReductionPercent}%)`;
        }

        let effectivePassiveIncome = gameState.passiveIncome;
        if (gameState.inFlow && gameState.flowPassiveIncome) {
            effectivePassiveIncome = gameState.flowPassiveIncome;
        }

        const monthlyCF = (gameState.salary + gameState.sideIncome + effectivePassiveIncome) - totalExp;
        const luckyStarCount = gameState.luckyStarCount || 0;
        const fourLeafCloverCount = gameState.fourLeafClover || 0;
        const totalLoanRepay = gameState.loanAmount + Math.round(gameState.loanAmount * 0.1);

        this._updateStat('statCash', gameState.cash.toLocaleString());
        this._updateStat('statSalary', gameState.salary.toLocaleString());
        this._updateStat('statSideIncome', gameState.sideIncome.toLocaleString());
        this._updateStat('statPassiveIncome', effectivePassiveIncome.toLocaleString());

        const monthlyCFEl = document.getElementById('statMonthlyCF');
        if (monthlyCFEl) {
            monthlyCFEl.innerText = (monthlyCF >= 0 ? '+' : '') + monthlyCF.toLocaleString();
            monthlyCFEl.style.color = monthlyCF >= 0 ? '#4caf50' : '#ff6b6b';
        }

        this._updateStat('statLiving', gameState.livingExpense.toLocaleString());
        this._updateStat('statTax', gameState.tax.toLocaleString());
        this._updateStat('statLoanInterest', (gameState.loanInterest || 0).toLocaleString());

        const totalExpEl = document.getElementById('statTotalExpense');
        if (totalExpEl) {
            totalExpEl.innerText = totalExp.toLocaleString() + expenseReductionMessage;
            totalExpEl.style.color = expenseReductionPercent > 0 ? '#4caf50' : '#ffefc0';
        }

        this._updateStat('statEnergy', `${gameState.energy}/${gameState.maxEnergy}`);
        this._updateStat('statLuck', gameState.luck.toFixed(1));
        this._updateStat('statLuckyStar', luckyStarCount);
        this._updateStat('statFourLeafClover', fourLeafCloverCount);

        const layerText = gameState.inFlow ? '顺流层' : (gameState.inReverse ? '逆流层' : '平流层');
        this._updateStat('statLayer', layerText);

        const loanRepayEl = document.getElementById('statTotalLoanRepay');
        if (loanRepayEl) {
            loanRepayEl.innerText = totalLoanRepay.toLocaleString();
            loanRepayEl.style.color = gameState.loanAmount > 0 ? '#ff6b6b' : '#4caf50';
        }

        const layerTextEl = document.getElementById('layerText');
        if (layerTextEl) layerTextEl.innerText = layerText;

        // ✅ Pass isMyTurn so button states respect turn ownership
        this._updateButtonStates(gameState, fourLeafCloverCount, luckyStarCount, gameState.isMyTurn === true);
    }

    _updateStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }

    _updateButtonStates(gameState, fourLeafCloverCount, luckyStarCount, isMyTurn) {
        // ✅ Roll button: disabled if not your turn OR no energy
        const rollBtn = document.getElementById('btnRoll');
        if (rollBtn) {
            const canRoll = isMyTurn && gameState.energy > 0 && !gameState.hasRolledThisTurn;
            rollBtn.disabled = !canRoll;
            rollBtn.style.opacity = canRoll ? '1' : '0.4';
            rollBtn.style.cursor = canRoll ? 'pointer' : 'not-allowed';
            rollBtn.style.filter = canRoll ? 'none' : 'grayscale(70%)';
        }

        // ✅ End turn button: disabled if not your turn
        const endTurnBtn = document.getElementById('btnEndTurn');
        if (endTurnBtn) {
            endTurnBtn.disabled = !isMyTurn;
            endTurnBtn.style.opacity = isMyTurn ? '1' : '0.4';
            endTurnBtn.style.cursor = isMyTurn ? 'pointer' : 'not-allowed';
            endTurnBtn.style.filter = isMyTurn ? 'none' : 'grayscale(70%)';
        }

        // ✅ Loan button: disabled if not your turn OR already has loan
        const loanBtn = document.getElementById('btnLoan');
        if (loanBtn) {
            const canLoan = isMyTurn && gameState.loanAmount === 0;
            loanBtn.disabled = !canLoan;
            loanBtn.style.opacity = canLoan ? '1' : '0.4';
            loanBtn.style.cursor = canLoan ? 'pointer' : 'not-allowed';
            loanBtn.style.filter = canLoan ? 'none' : 'grayscale(70%)';
        }

        // ✅ Repay button: disabled if not your turn OR no loan
        const repayBtn = document.getElementById('btnRepayLoan');
        if (repayBtn) {
            const canRepay = isMyTurn && gameState.loanAmount > 0;
            repayBtn.disabled = !canRepay;
            repayBtn.style.opacity = canRepay ? '1' : '0.4';
            repayBtn.style.cursor = canRepay ? 'pointer' : 'not-allowed';
            repayBtn.style.filter = canRepay ? 'none' : 'grayscale(70%)';
        }

        // ✅ Clover button: disabled if not your turn OR no clovers
        const useCloverBtn = document.getElementById('btnUseClover');
        if (useCloverBtn) {
            const canClover = isMyTurn && fourLeafCloverCount > 0;
            useCloverBtn.disabled = !canClover;
            useCloverBtn.style.opacity = canClover ? '1' : '0.4';
            useCloverBtn.style.cursor = canClover ? 'pointer' : 'not-allowed';
            useCloverBtn.style.filter = canClover ? 'none' : 'grayscale(70%)';
            useCloverBtn.textContent = fourLeafCloverCount > 0
                ? `🍀 四葉草 (x2) x${fourLeafCloverCount}`
                : '🍀 四葉草 (x2)';
        }

        // ✅ Lucky star button: disabled if not your turn OR no stars
        const useLuckyStarBtn = document.getElementById('btnUseLuckyStar');
        if (useLuckyStarBtn) {
            const canStar = isMyTurn && luckyStarCount > 0;
            useLuckyStarBtn.disabled = !canStar;
            useLuckyStarBtn.style.opacity = canStar ? '1' : '0.4';
            useLuckyStarBtn.style.cursor = canStar ? 'pointer' : 'not-allowed';
            useLuckyStarBtn.style.filter = canStar ? 'none' : 'grayscale(70%)';
            useLuckyStarBtn.textContent = luckyStarCount > 0
                ? `⭐ 幸運星 (x3) x${luckyStarCount}`
                : '⭐ 幸運星 (x3)';
        }
    }

    updatePlayersList(gameState, otherPlayers) {
        const playersList = document.getElementById('playersList');
        if (!playersList) return;
        playersList.innerHTML = '';

        if (gameState) {
            // ✅ Don't use random avatar - use stored value only
            const avatarPath = gameState.avatar
                ? `../cards/players/${gameState.avatar}`
                : '../cards/players/player1.png';

            const myItem = document.createElement('div');
            myItem.className = 'player-item';
            myItem.innerHTML = `
                <strong>👤 ${this.ui.escapeHtml(gameState.playerName)} (你)</strong><br>
                <img src="${avatarPath}" style="width: 24px; height: 24px; border-radius: 50%; vertical-align: middle;" onerror="this.style.display='none';">
                💰 ${gameState.cash.toLocaleString()} 元 | ⚡ ${gameState.energy}/${gameState.maxEnergy}<br>
                🍀 四叶草: ${gameState.fourLeafClover || 0} | ⭐ 幸运星: ${gameState.luckyStarCount || 0}
            `;
            playersList.appendChild(myItem);
        }

        otherPlayers.forEach((state, playerId) => {
            // ✅ Don't use random - use stable fallback based on player id
            const avatarPath = state.avatar
                ? `../cards/players/${state.avatar}`
                : '../cards/players/player2.png';

            const item = document.createElement('div');
            item.className = 'player-item';
            // ✅ Add data-player-id for debugging
            item.dataset.playerId = playerId;
            item.innerHTML = `
                <strong>👤 ${this.ui.escapeHtml(state.playerName)}</strong><br>
                <img src="${avatarPath}" style="width: 24px; height: 24px; border-radius: 50%; vertical-align: middle;" onerror="this.style.display='none';">
                💰 ${state.cash.toLocaleString()} 元 | ⚡ ${state.energy}/${state.maxEnergy}<br>
                🍀 四叶草: ${state.fourLeafClover || 0} | ⭐ 幸运星: ${state.luckyStarCount || 0}
            `;
            playersList.appendChild(item);
        });
    }
}