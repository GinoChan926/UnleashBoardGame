"use strict";

const { calculateReducedExpense }   = require('../utils/helpers.js');
const { processHealthInvestment, processHealthSupplementInvestment } = require('../systems/HealthSystem.js');
const { processSettlementRepayment } = require('../systems/LoanSystem.js');

function handleRoll(ws, data, roomId, rooms, deps) {
    const {
        broadcastToRoom, processStreamlineTile, processReverseTile,
        processFlowTile, triggerDreamCard
    } = deps;

    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state = player.gameState;

    // ── Skip turn check ───────────────────────────────────────────────────────
    if (state.skipNextTurn) {
        state.skipNextTurn = false;
        ws.send(JSON.stringify({ type: 'notification', message: '⏸️ 你被暫停一回合，自動結束回合！' }));
        broadcastToRoom(roomId, { type: 'notification', message: `⏸️ ${player.playerName} 被暫停一回合` }, ws);
        deps.handleEndTurn(ws, data, roomId);
        return;
    }

    // ── Extra dice from social card ───────────────────────────────────────────
    if (state.extraDice > 0 && !state._processingExtraDice) {
        state._processingExtraDice = true;
        state.extraDice--;
        ws.send(JSON.stringify({ type: 'notification', message: `🎲 額外擲骰機會！剩餘 ${state.extraDice} 次` }));
        setTimeout(() => { state._processingExtraDice = false; handleRoll(ws, data, roomId, rooms, deps); }, 300);
        return;
    }
    state._processingExtraDice = false;

    // ── Energy check ──────────────────────────────────────────────────────────
    if (state.energy <= 0) {
        ws.send(JSON.stringify({ type: 'error', message: '精力不足，無法擲骰' }));
        return;
    }
    state.energy = Math.max(0, state.energy - 1);

    // ── Dice roll ─────────────────────────────────────────────────────────────
    let originalSteps = Math.floor(Math.random() * 6) + 1;
    let steps         = originalSteps;
    let multiplierMessage = '';

    if (state.diceMultiplierActive) {
        steps = originalSteps * (state.diceMultiplier || 1);
        multiplierMessage = state.diceMultiplier === 2
            ? `🍀 四葉草生效！${originalSteps} x2 = ${steps} 步！`
            : `⭐ 幸運星生效！${originalSteps} x3 = ${steps} 步！`;
        state.diceMultiplierActive = false;
        state.diceMultiplier       = 1;
        ws.send(JSON.stringify({ type: 'notification', message: multiplierMessage }));
    }

    const oldPos = state.streamlinePos;
    let tile     = null;
    let eventMessage = null;

    // ── Flow layer movement ───────────────────────────────────────────────────
    if (state.inFlow) {
        const flowSteps      = steps * 2;
        let   currentPos     = state.flowPos;
        let   lastDreamPos   = -1;
        const startPos       = currentPos;

        for (let i = 1; i <= flowSteps; i++) {
            const newPos    = (currentPos + 1) % room.flowTiles.length;
            const tileAtPos = room.flowTiles[newPos];

            if (tileAtPos.type === 'dream' && (newPos !== startPos || i === flowSteps)) {
                triggerDreamCard(state, tileAtPos, ws, roomId, player, currentPos, newPos);
                lastDreamPos = newPos;
            }
            currentPos = newPos;
        }

        state.flowPos = currentPos;
        tile          = room.flowTiles[state.flowPos];

        if (tile.type === 'dream' && lastDreamPos !== state.flowPos) {
            triggerDreamCard(state, tile, ws, roomId, player, startPos, state.flowPos);
        }

        eventMessage = processFlowTile(state, tile, ws, roomId, player, room, deps);
    }
    // ── Reverse layer movement ────────────────────────────────────────────────
    else if (state.inReverse) {
        let currentReversePos = state.reversePos;

        for (let i = 1; i <= steps; i++) {
            let newReversePos   = currentReversePos + 1;
            let completedReverse = false;

            if (newReversePos >= room.reverseTiles.length) {
                completedReverse = true;
                newReversePos    = room.reverseTiles.length - 1;
            }

            const tileAtPos = room.reverseTiles[newReversePos];
            if (tileAtPos.type !== 'settlement') {
                const msg = processReverseTile(state, tileAtPos, ws, roomId, player,
                    room.streamlineTiles, broadcastToRoom, deps.drawHardshipCard);
                if (msg) ws.send(JSON.stringify({ type: 'notification', message: `${player.playerName}: ${msg}` }));
            }

            currentReversePos = newReversePos;
            state.reversePos  = currentReversePos;

            if (completedReverse) {
                state.inReverse = false;
                ws.send(JSON.stringify({ type: 'notification', message: '🎉 恭喜完成逆流層，回到平流層！' }));
                broadcastToRoom(roomId, { type: 'notification', message: `🎉 ${player.playerName} 完成逆流層！` }, ws);

                const remaining = steps - i;
                if (remaining > 0) {
                    _processStreamlinePassthrough(state, player, ws, roomId, remaining, room, broadcastToRoom, deps);
                }
                tile         = room.streamlineTiles[state.streamlinePos];
                eventMessage = `完成逆流層，回到平流層「${tile.name}」`;
                break;
            }
        }

        if (state.inReverse) {
            tile         = room.reverseTiles[state.reversePos];
            eventMessage = `移動到逆流層「${tile.name}」`;
        }
    }
    // ── Streamline movement ───────────────────────────────────────────────────
    else {
        _processStreamlinePassthrough(state, player, ws, roomId, steps, room, broadcastToRoom, deps);
        tile = room.streamlineTiles[state.streamlinePos];

        // ✅ Always call processStreamlineTile - the settlement case now handles landing correctly
        const isExactLanding = (tile.type === 'settlement');
        eventMessage = processStreamlineTile(state, tile, ws, roomId, player, isExactLanding, deps);
    }

    // ── Flow layer entry check ────────────────────────────────────────────────
    if (!state.inReverse && !state.inFlow) {
        const totalExpense = (state.livingExpense || 0) + (state.tax || 0)
            + (state.loanInterest  || 0) + (state.childExpense || 0);

        if (state.passiveIncome >= totalExpense) {
            if (state.energy <= 0) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `❌ 無法進入順流層！精力不足 (當前 ${state.energy})`
                }));
            } else if (state.loanAmount > 0) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `❌ 無法進入順流層！還有貸款 ${state.loanAmount.toLocaleString()} 元`
                }));
            } else {
                ws.send(JSON.stringify({
                    type: 'flow_layer_choice',
                    message: `🎉 恭喜！你已滿足進入順流層的條件！\n被動收入: ${state.passiveIncome.toLocaleString()} 元/月\n總支出: ${totalExpense.toLocaleString()} 元/月\n\n你是否願意進入順流層？`,
                    canEnter: true, passiveIncome: state.passiveIncome, totalExpense,
                    energy: state.energy, maxEnergy: state.maxEnergy, loanAmount: state.loanAmount
                }));

                if (!room.pendingFlowChoices) room.pendingFlowChoices = new Map();
                room.pendingFlowChoices.set(ws, { playerId: player.playerId, timestamp: Date.now() });
                return;
            }
        }
    }

    // ── Send result ───────────────────────────────────────────────────────────
    const result = {
        type: 'dice_result', playerId: player.playerId, playerName: player.playerName,
        steps, originalSteps, multiplierUsed: multiplierMessage !== '',
        gameState: state, tile, eventMessage, multiplierMessage
    };

    if (tile && !['opportunity','lier','hardship'].includes(tile.type)) {
        ws.send(JSON.stringify(result));
        broadcastToRoom(roomId, result, ws);
        if (eventMessage && !['settlement','lier'].includes(tile.type)) {
            ws.send(JSON.stringify({ type: 'notification', message: eventMessage }));
            broadcastToRoom(roomId, { type: 'notification', message: `${player.playerName}: ${eventMessage}` }, ws);
        }
    } else if (tile?.type === 'opportunity') {
        ws.send(JSON.stringify(result));
        broadcastToRoom(roomId, result, ws);
    }

    console.log(`🎲 ${player.playerName} 擲出 ${originalSteps} 步，移動到 ${tile?.name || '未知'}`);
}

// ── Private ───────────────────────────────────────────────────────────────────

function _processStreamlinePassthrough(state, player, ws, roomId, steps, room, broadcastToRoom, deps) {
    for (let i = 1; i <= steps; i++) {
        const newPos    = (state.streamlinePos + i) % room.streamlineTiles.length;
        const tileAtPos = room.streamlineTiles[newPos];

        const isLandingHere = (i === steps);
        if (tileAtPos.type === 'settlement' && !isLandingHere) {
            // Only process passthrough - landing is handled by processStreamlineTile
            _processPassthroughSettlement(state, player, ws, roomId, room, broadcastToRoom, false, deps);
        }
    }
    state.streamlinePos = (state.streamlinePos + steps) % room.streamlineTiles.length;
}

function _processPassthroughSettlement(state, player, ws, roomId, room, broadcastToRoom, isExactLanding, deps) {
    const totalIncome  = state.salary + state.sideIncome;
    state.cash        += totalIncome;
    state.totalAssets += Math.floor(totalIncome * 0.2);

    // ✅ Auto-collect pending debts
    const { processDebtCollection } = require('../systems/AutoDebtSystem.js');
    processDebtCollection(player, room, roomId, broadcastToRoom);

    const { totalExpense, savedAmount, reductionPercent } = calculateReducedExpense(state);

    // ✅ Deduct expense on passthrough too
    if (totalExpense > 0) {
        state.cash -= totalExpense;
    }

    const expenseReductionMessage = reductionPercent > 0
        ? ` (支出減少 ${reductionPercent}%，節省 ${savedAmount.toLocaleString()} 元)`
        : '';

    if (state.bakeryCount > 0) {
        state.energy = Math.min(state.maxEnergy, state.energy + state.bakeryCount);
    }

    processHealthInvestment(state, player, ws);
    processHealthSupplementInvestment(state, player, ws);

    // NO tea restaurant fee on passthrough (only on landing)

    // ✅ Process property mortgages on passthrough too
    const { processPropertyMortgages } = require('../systems/PropertyChoiceSystem.js');
    processPropertyMortgages(player, ws, broadcastToRoom, roomId);

    const repaymentResult = processSettlementRepayment(player, ws, roomId, broadcastToRoom);
    if (repaymentResult) {
        ws.send(JSON.stringify(repaymentResult));
        broadcastToRoom(roomId, repaymentResult, ws);
    }

    const settlementMsg = {
        type: 'settlement',
        playerId: player.playerId,
        playerName: player.playerName,
        salary: state.salary,
        sideIncome: state.sideIncome,
        totalIncome,
        totalExpense,
        expenseReductionMessage,
        isExactLanding,
        gameState: state
    };
    ws.send(JSON.stringify(settlementMsg));
    broadcastToRoom(roomId, settlementMsg, ws);
}

module.exports = { handleRoll };