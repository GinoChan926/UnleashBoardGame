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

    if (state.extraDice > 0 && !state._processingExtraDice) {
        state._processingExtraDice = true;
        state.extraDice--;
        state.hasRolledThisTurn = false;  // ✅ Allow the extra roll
        ws.send(JSON.stringify({
            type: 'notification',
            message: `🎲 額外擲骰機會！剩餘 ${state.extraDice} 次`
        }));
        setTimeout(() => {
            state._processingExtraDice = false;
            handleRoll(ws, data, roomId, rooms, deps);
        }, 300);
        return;
    }
    state._processingExtraDice = false;

    // ── Already rolled this turn? ────────────────────────────────────────────
    if (state.hasRolledThisTurn) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '你本回合已經擲過骰子了，請結束回合'
        }));
        return;
    }

// Mark as rolled - no more rolls until turn ends
    state.hasRolledThisTurn = true;

    // ── Dice roll ─────────────────────────────────────────────────────────────
    let diceCount = 1;
    let diceType  = 'normal';

// ✅ Flow layer always uses 2 dice
    if (state.inFlow) {
        diceCount = 2;
        diceType  = 'flow';
    } else if (state.diceMultiplierActive) {
        diceCount = state.diceMultiplier || 1;
        diceType  = state.diceMultiplier === 2 ? 'clover' : 'lucky_star';
    }

// Roll individual dice values
    // Roll individual dice values
    const diceValues = [];
    for (let i = 0; i < diceCount; i++) {
        diceValues.push(Math.floor(Math.random() * 6) + 1);
    }

    const originalSteps = diceValues[0];
    const steps = diceValues.reduce((sum, v) => sum + v, 0);

// ✅ Check contract dispute (S14)
    if (state.contractDispute && state.contractDispute.active) {
        const disputeCost = state.contractDispute.monthlyCost;

        // Pay the ongoing cost
        if (state.cash >= disputeCost) {
            state.cash -= disputeCost;
        } else {
            const shortfall = disputeCost - state.cash;
            state.cash = 0;
            state.pendingDebts = state.pendingDebts || [];
            state.pendingDebts.push({
                id:           `debt_S14_${Date.now()}`,
                amount:       shortfall,
                source:       '合約糾紛費用',
                creditor:     'bank',
                creditorName: '律師',
                createdAt:    Date.now()
            });
        }

        // Check if ANY dice shows 4, 5, or 6 → dispute resolved
        const resolved = diceValues.some(v => v >= 4);

        if (resolved) {
            state.contractDispute.active = false;
            ws.send(JSON.stringify({
                type: 'notification',
                message: `⚖️ 合約糾紛解決！擲到 ${diceValues.join(', ')} (含 ≥4)，支付最後 $${disputeCost.toLocaleString()} 後結束`
            }));

            broadcastToRoom(roomId, {
                type: 'notification',
                message: `⚖️ ${player.playerName} 的合約糾紛已解決！`
            }, ws);

            console.log(`⚖️ ${player.playerName} 合約糾紛解決 (擲到 ${diceValues.join(', ')})`);
        } else {
            ws.send(JSON.stringify({
                type: 'notification',
                message: `⚖️ 合約糾紛持續！擲到 ${diceValues.join(', ')} (全部 ≤3)，支付 $${disputeCost.toLocaleString()}，下回合繼續`
            }));

            console.log(`⚖️ ${player.playerName} 合約糾紛持續 (擲到 ${diceValues.join(', ')})`);
        }
    }
    // ✅ Check confused state (S18)
    if (state.confused && state.confused.active) {
        const highestDice = Math.max(...diceValues);

        if (highestDice < state.confused.minDiceToAct) {
            // Failed to act - turn wasted
            state.confused.turnsRemaining--;

            // Check if confusion ends
            if (state.confused.turnsRemaining <= 0) {
                state.confused.active = false;
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `😵 迷茫結束！你擲了 ${diceValues.join(', ')} (未達 ${state.confused.minDiceToAct})，但迷茫期已過，下回合恢復正常`
                }));
            } else {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `😵 對前途迷茫！擲了 ${diceValues.join(', ')} (需 ≥${state.confused.minDiceToAct})，無法行動！剩餘 ${state.confused.turnsRemaining} 回合`
                }));
            }

            broadcastToRoom(roomId, {
                type: 'notification',
                message: `😵 ${player.playerName} 因迷茫無法行動 (擲了 ${diceValues.join(', ')})`
            }, ws);

            // ✅ Send dice result for animation but don't move
            const result = {
                type: 'dice_result',
                playerId: player.playerId,
                playerName: player.playerName,
                steps: 0,
                originalSteps: 0,
                multiplierUsed: false,
                diceValues,
                diceCount: diceValues.length,
                diceType: 'normal',
                gameState: state,
                tile: null,
                eventMessage: `😵 迷茫中，無法行動`,
                multiplierMessage: ''
            };
            ws.send(JSON.stringify(result));
            broadcastToRoom(roomId, result, ws);

            // Update state
            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: player.playerId,
                gameState: state
            });

            console.log(`😵 ${player.playerName} 迷茫中，擲了 ${diceValues.join(',')} 無法行動 (剩 ${state.confused.turnsRemaining} 回合)`);
            return;  // ← skip all movement logic
        }

        // Rolled high enough - can act this turn
        state.confused.turnsRemaining--;

        if (state.confused.turnsRemaining <= 0) {
            state.confused.active = false;
        }

        ws.send(JSON.stringify({
            type: 'notification',
            message: `💪 擺脫迷茫！擲了 ${diceValues.join(', ')} (≥${state.confused.minDiceToAct})，可以行動！${state.confused.active ? `剩餘 ${state.confused.turnsRemaining} 回合迷茫` : '迷茫期結束！'}`
        }));

        console.log(`💪 ${player.playerName} 擺脫迷茫行動 (擲了 ${diceValues.join(',')})`);
        // Continue with normal movement below...
    }

    let multiplierMessage = '';
    if (state.inFlow && !state.diceMultiplierActive) {
        // ✅ Flow layer always rolls 2 dice — no special message needed,
        //    but we can show a brief note
        multiplierMessage = `🌊 順流層！擲了 2 個骰子: ${diceValues.join(' + ')} = ${steps} 步！`;
    } else if (state.diceMultiplierActive) {
        // ✅ Flow layer + clover/star = even more dice
        if (state.inFlow) {
            diceCount = Math.max(diceCount, 2);  // at least 2 in flow
        }
        multiplierMessage = diceType === 'clover'
            ? `🍀 四葉草生效！擲了 ${diceCount} 個骰子: ${diceValues.join(' + ')} = ${steps} 步！`
            : `⭐ 幸運星生效！擲了 ${diceCount} 個骰子: ${diceValues.join(' + ')} = ${steps} 步！`;

        state.diceMultiplierActive = false;
        state.diceMultiplier       = 1;
    }

    const oldPos = state.streamlinePos;
    let tile     = null;
    let eventMessage = null;

    // ── Flow layer movement ───────────────────────────────────────────────────
    if (state.inFlow) {
        const flowSteps      = steps;
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
            const isLanding = (i === steps) || completedReverse;

            if (isLanding && tileAtPos.type !== 'settlement') {
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
        type: 'dice_result',
        playerId: player.playerId,
        playerName: player.playerName,
        steps: steps,
        originalSteps: originalSteps,
        multiplierUsed: multiplierMessage !== '',
        diceValues: diceValues,    // ← NEW: individual dice
        diceCount: diceCount,       // ← NEW: number of dice
        diceType: diceType,         // ← NEW: 'normal' / 'clover' / 'lucky_star'
        gameState: state,
        tile: tile,
        eventMessage: eventMessage,
        multiplierMessage: multiplierMessage
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
    // ✅ Check skip flag
    if (state.skipSettlementIncome) {
        state.skipSettlementIncome = false;
        const { totalExpense } = calculateReducedExpense(state);
        state.cash -= totalExpense;
        return;
    }

// ✅ S13: half income on passthrough too
    let totalIncome = state.salary + state.sideIncome;
    if (state.nextSettlementHalfIncome) {
        totalIncome = Math.floor(totalIncome / 2);
        state.nextSettlementHalfIncome = false;
    }
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