"use strict";

const { calculateReducedExpense }   = require('../utils/helpers.js');
const { processHealthInvestment, processHealthSupplementInvestment } = require('../systems/HealthSystem.js');
const { processSettlementRepayment } = require('../systems/LoanSystem.js');
const {_processFlowSettlement } = require('../tiles/FlowTileProcessor');
const { getEffectivePassiveIncome } = require('../utils/helpers.js');

function handleRoll(ws, data, roomId, rooms, deps) {
    const {
        broadcastToRoom, processStreamlineTile, processReverseTile,
        processFlowTile, triggerDreamCard
    } = deps;

    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state = player.gameState;

    // ✅ Not your turn
    if (!state.isMyTurn) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '現在不是你的回合'
        }));
        return;
    }

    // ── Skip turn check ───────────────────────────────────────────────────────
    if (state.skipNextTurn) {
        state.skipNextTurn = false;
        state.hasRolledThisTurn = false;

        const skipPayload = {
            type: 'turn_skipped',
            playerId: player.playerId,
            skippedPlayerId: player.playerId,
            skippedPlayerName: player.playerName,
            gameState: state,
            message: `⏸️ ${player.playerName} 被暫停一回合，本回合已自動跳過`
        };

        ws.send(JSON.stringify({
            type: 'notification',
            message: '⏸️ 你被暫停一回合，自動結束回合！'
        }));

        ws.send(JSON.stringify(skipPayload));
        broadcastToRoom(roomId, skipPayload, ws);

        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: player.playerId,
            gameState: state
        });

        // ✅ Force end turn even though player did not roll
        deps.handleEndTurn(ws, { ...(data || {}), forceSkip: true }, roomId);
        return;
    }

    if (state.extraDice > 0 && !state._processingExtraDice) {
        state._processingExtraDice = true;
        state.extraDice--;
        state.hasRolledThisTurn = false;
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

    // Mark as rolled
    state.hasRolledThisTurn = true;

    // ── Dice roll ─────────────────────────────────────────────────────────────
    let diceCount = 1;
    let diceType  = 'normal';

    if (state.inFlow) {
        diceCount = 2;
        diceType  = 'flow';
    } else if (state.diceMultiplierActive) {
        diceCount = state.diceMultiplier || 1;
        diceType  = state.diceMultiplier === 2 ? 'clover' : 'lucky_star';
    }

    const diceValues = [];
    for (let i = 0; i < diceCount; i++) {
        diceValues.push(Math.floor(Math.random() * 6) + 1);
    }

    const originalSteps = diceValues[0];
    const steps = diceValues.reduce((sum, v) => sum + v, 0);

    // ✅ Check contract dispute (S14)
    if (state.contractDispute && state.contractDispute.active) {
        const disputeCost = state.contractDispute.monthlyCost;

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
            state.confused.turnsRemaining--;

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

            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: player.playerId,
                gameState: state
            });

            console.log(`😵 ${player.playerName} 迷茫中，擲了 ${diceValues.join(',')} 無法行動 (剩 ${state.confused.turnsRemaining} 回合)`);
            return;
        }

        state.confused.turnsRemaining--;

        if (state.confused.turnsRemaining <= 0) {
            state.confused.active = false;
        }

        ws.send(JSON.stringify({
            type: 'notification',
            message: `💪 擺脫迷茫！擲了 ${diceValues.join(', ')} (≥${state.confused.minDiceToAct})，可以行動！${state.confused.active ? `剩餘 ${state.confused.turnsRemaining} 回合迷茫` : '迷茫期結束！'}`
        }));

        console.log(`💪 ${player.playerName} 擺脫迷茫行動 (擲了 ${diceValues.join(',')})`);
    }

    let multiplierMessage = '';
    if (state.inFlow && !state.diceMultiplierActive) {
        multiplierMessage = `🌊 順流層！擲了 2 個骰子: ${diceValues.join(' + ')} = ${steps} 步！`;
    } else if (state.diceMultiplierActive) {
        if (state.inFlow) {
            diceCount = Math.max(diceCount, 2);
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
        const flowSteps  = steps;
        let   currentPos = state.flowPos;
        const startPos   = currentPos;

        // ✅ Passthrough loop: ONLY handle settlement, ignore dreams and everything else
        for (let i = 1; i < flowSteps; i++) {
            currentPos = (currentPos + 1) % room.flowTiles.length;
            const tileAtPos = room.flowTiles[currentPos];

            if (tileAtPos.type === 'settlement') {
                // ✅ Passthrough — no dice roll
                _processFlowSettlement(state, ws, roomId, player, room, broadcastToRoom, false);
            }
        }

        // ✅ Advance to the LANDING position (final step)
        currentPos = (currentPos + 1) % room.flowTiles.length;
        state.flowPos = currentPos;
        tile          = room.flowTiles[state.flowPos];

        // ✅ Process the LANDED tile only
        eventMessage = processFlowTile(state, tile, ws, roomId, player, room, deps);
    }
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
                    room.streamlineTiles, broadcastToRoom, deps.drawHardshipCard, deps);
                if (msg) ws.send(JSON.stringify({ type: 'notification', message: `${player.playerName}: ${msg}` }));
            }

            currentReversePos = newReversePos;
            state.reversePos  = currentReversePos;

            if (completedReverse) {
                state.inReverse  = false;
                state.reversePos = 0;   // ✅ reset for future entries

                // ✅ Teleport to reverse_exit tile on the streamline
                const exitIndex = room.streamlineTiles.findIndex(t => t.type === 'reverse_exit');
                if (exitIndex >= 0) {
                    state.streamlinePos = exitIndex;
                }

                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `🎉 恭喜完成逆流層，回到平流層「${room.streamlineTiles[state.streamlinePos].name}」！`
                }));
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🎉 ${player.playerName} 完成逆流層！`
                }, ws);

                // ✅ Any leftover steps continue from the reverse_exit tile
                const remaining = steps - i;
                if (remaining > 0) {
                    _processStreamlinePassthrough(state, player, ws, roomId, remaining, room, broadcastToRoom, deps);
                }

                tile         = room.streamlineTiles[state.streamlinePos];
                eventMessage = `完成逆流層，抵達「${tile.name}」`;
                break;
            }
        }

        if (state.inReverse) {
            tile         = room.reverseTiles[state.reversePos];
            eventMessage = `移動到逆流層「${tile.name}」`;
        }
    }
    else {
        _processStreamlinePassthrough(state, player, ws, roomId, steps, room, broadcastToRoom, deps);
        tile = room.streamlineTiles[state.streamlinePos];

        const isExactLanding = (tile.type === 'settlement');
        eventMessage = processStreamlineTile(state, tile, ws, roomId, player, isExactLanding, deps);
    }

    const result = {
        type: 'dice_result',
        playerId: player.playerId,
        playerName: player.playerName,
        steps: steps,
        originalSteps: originalSteps,
        multiplierUsed: multiplierMessage !== '',
        diceValues: diceValues,
        diceCount: diceCount,
        diceType: diceType,
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
            _processPassthroughSettlement(state, player, ws, roomId, room, broadcastToRoom, false, deps);
        }
    }
    state.streamlinePos = (state.streamlinePos + steps) % room.streamlineTiles.length;
}

function _processPassthroughSettlement(state, player, ws, roomId, room, broadcastToRoom, isExactLanding, deps) {
    if (state.skipSettlementIncome) {
        state.skipSettlementIncome = false;
        const { totalExpense } = calculateReducedExpense(state);
        // Apply the same split as above
        const mortgageExpense  = state.propertyMortgageExpense || 0;
        const nonInvestExpense = Math.max(0, totalExpense - mortgageExpense);
        // (same block as above)
        return;
    }

    let reducibleIncome = state.salary + state.sideIncome;
    const passiveIncome = getEffectivePassiveIncome(state);

    if (state.nextSettlementHalfIncome) {
        reducibleIncome = Math.floor(reducibleIncome / 2);
        state.nextSettlementHalfIncome = false;
    }

    const totalIncome = reducibleIncome + passiveIncome;
    state.cash        += totalIncome;
    state.totalAssets += Math.floor(totalIncome * 0.2);

    const { processDebtCollection } = require('../systems/AutoDebtSystem.js');
    processDebtCollection(player, room, roomId, broadcastToRoom);

    const { totalExpense, savedAmount, reductionPercent } = calculateReducedExpense(state);

    if (totalExpense > 0) {
        const {
            spendForInvestment,
            spendForNonInvestment,
            canAffordInvestment,
            canAffordNonInvestment
        } = require('../systems/WalletSystem.js');
        const { chargePlayer } = require('../systems/AutoDebtSystem.js');

        const mortgageExpense  = state.propertyMortgageExpense || 0;
        const nonInvestExpense = Math.max(0, totalExpense - mortgageExpense);

        if (mortgageExpense > 0) {
            if (canAffordInvestment(state, mortgageExpense)) {
                spendForInvestment(state, mortgageExpense);
            } else {
                chargePlayer(player, mortgageExpense, {
                    source:       '房貸月供 (途經)',
                    creditor:     'bank',
                    creditorName: '銀行',
                    room, roomId, broadcastToRoom, ws
                });
            }
        }

        if (nonInvestExpense > 0) {
            if (canAffordNonInvestment(state, nonInvestExpense)) {
                spendForNonInvestment(state, nonInvestExpense);
            } else {
                chargePlayer(player, nonInvestExpense, {
                    source:       '結算日支出 (途經)',
                    creditor:     'bank',
                    creditorName: '銀行',
                    room, roomId, broadcastToRoom, ws
                });
            }
        }
    }

    const expenseReductionMessage = reductionPercent > 0
        ? ` (支出減少 ${reductionPercent}%，節省 ${savedAmount.toLocaleString()} 元)`
        : '';

    if (state.bakeryCount > 0) {
        state.energy = Math.min(state.maxEnergy, state.energy + state.bakeryCount);
    }

    processHealthInvestment(state, player, ws);
    processHealthSupplementInvestment(state, player, ws);

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