"use strict";

const { addTransactionRecord }    = require('../records/TransactionRecorder.js');
const { calculateReducedExpense } = require('../utils/helpers.js');
const { processSettlementRepayment } = require('./LoanSystem.js');

const pendingMoves = new Map();   // playerId → { card, mode }

/**
 * IN14/IN15/IN16/IN17 - move current player forward.
 *
 * Modes:
 *   'random'         - random 1-3 steps
 *   'choose'         - player picks 1-3
 *   'income'         - auto move to nearest income tile
 *   'nearest_player' - auto move to nearest player's tile
 */
function startMoveForward(ws, roomId, player, card, broadcastToRoom, rooms, tileProcessor) {
    const room = rooms.get(roomId);
    if (!room) return;

    const mode = card.moveMode || 'random';

    if (mode === 'random') {
        // Roll dice immediately
        const steps = Math.floor(Math.random() * 3) + 1;
        _executeMove(ws, roomId, player, card, steps, room, broadcastToRoom, tileProcessor);
    } else if (mode === 'choose') {
        // Show choice modal to player
        pendingMoves.set(player.playerId, { card, mode, roomId });
        ws.send(JSON.stringify({
            type: 'move_forward_choice_prompt',
            cardName: card.name,
            message: `🐴 請選擇要前進的格數`
        }));
    } else if (mode === 'income') {
        // Auto - find nearest income tile
        const steps = _findStepsToIncomeTile(player.gameState, room.streamlineTiles);
        if (steps > 0) {
            _executeMove(ws, roomId, player, card, steps, room, broadcastToRoom, tileProcessor);
        } else {
            ws.send(JSON.stringify({ type: 'notification', message: '❌ 找不到月收入格' }));
        }
    } else if (mode === 'nearest_player') {
        // Auto - find nearest player
        const steps = _findStepsToNearestPlayer(player, room);
        if (steps > 0) {
            _executeMove(ws, roomId, player, card, steps, room, broadcastToRoom, tileProcessor);
        } else {
            ws.send(JSON.stringify({ type: 'notification', message: '❌ 找不到其他玩家' }));
        }
    }
}

/**
 * Called when player picks number of steps for 'choose' mode.
 */
function handleMoveForwardChoice(ws, data, roomId, rooms, broadcastToRoom, tileProcessor) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = pendingMoves.get(player.playerId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的移動' }));
        return;
    }

    const steps = parseInt(data.steps);
    if (isNaN(steps) || steps < 1 || steps > 3) {
        ws.send(JSON.stringify({ type: 'error', message: '請選擇 1-3 格' }));
        return;
    }

    pendingMoves.delete(player.playerId);
    _executeMove(ws, roomId, player, pending.card, steps, room, broadcastToRoom, tileProcessor);
}

// ==================== Private ====================

function _executeMove(ws, roomId, player, card, steps, room, broadcastToRoom, tileProcessor) {
    const state = player.gameState;

    // ✅ Only reject in flow layer (reverse is now allowed)
    if (state.inFlow) {
        ws.send(JSON.stringify({
            type: 'notification',
            message: '❌ 此卡不能在順流層使用'
        }));
        return;
    }

    // ✅ Reverse loop movement
    if (state.inReverse) {
        return _executeReverseMove(ws, roomId, player, card, steps, room, broadcastToRoom, tileProcessor);
    }

    // ─── Streamline movement (unchanged) ─────────────────────────────────────
    const oldPos = state.streamlinePos;
    const newPos = (oldPos + steps) % room.streamlineTiles.length;

    // Process ALL tiles passed through (including settlement)
    for (let i = 1; i < steps; i++) {
        const passPos  = (oldPos + i) % room.streamlineTiles.length;
        const passTile = room.streamlineTiles[passPos];
        const isLanding = (i === steps);

        if (passTile.type === 'settlement' && !isLanding) {
            const totalIncome = state.salary + state.sideIncome;
            state.cash       += totalIncome;
            state.totalAssets += Math.floor(totalIncome * 0.2);

            const { totalExpense } = calculateReducedExpense(state);
            state.cash -= totalExpense;

            if (state.bakeryCount > 0) {
                state.energy = Math.min(state.maxEnergy, state.energy + state.bakeryCount);
            }

            if (state.nextSettlementHalfIncome) {
                state.nextSettlementHalfIncome = false;
            }

            const repayment = processSettlementRepayment(player, ws, roomId, broadcastToRoom);
            if (repayment) {
                ws.send(JSON.stringify(repayment));
            }

            ws.send(JSON.stringify({
                type: 'notification',
                message: `💰 經過結算日！獲得收入 $${totalIncome.toLocaleString()}`
            }));
        }
    }

    state.streamlinePos = newPos;
    const landedTile = room.streamlineTiles[newPos];

    addTransactionRecord(
        player.playerName, card, '黑馬思維移動',
        0,
        `前進 ${steps} 格 (${oldPos + 1} → ${newPos + 1})，踩中「${landedTile.name}」`,
        null, state
    );

    broadcastToRoom(roomId, {
        type: 'dice_result',
        playerId: player.playerId,
        playerName: player.playerName,
        steps,
        originalSteps: steps,
        multiplierUsed: false,
        diceValues: [steps],
        diceCount: 1,
        diceType: 'normal',
        gameState: state,
        tile: landedTile,
        eventMessage: `🐴 黑馬思維前進 ${steps} 格`,
        multiplierMessage: ''
    });

    if (tileProcessor) {
        setTimeout(() => {
            tileProcessor(state, landedTile, ws, roomId, player, landedTile.type === 'settlement');
        }, 500);
    }

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: state
    });
}

// ✅ NEW: reverse loop movement
function _executeReverseMove(ws, roomId, player, card, steps, room, broadcastToRoom, tileProcessor) {
    const state = player.gameState;
    const oldReversePos = state.reversePos;

    let currentReversePos = oldReversePos;
    let completedReverse  = false;

    // ✅ Passthrough: DON'T trigger hardship cards on tiles passed through
    for (let i = 1; i <= steps; i++) {
        currentReversePos += 1;

        if (currentReversePos >= room.reverseTiles.length) {
            completedReverse  = true;
            currentReversePos = room.reverseTiles.length - 1;
            break;
        }
    }

    state.reversePos = currentReversePos;

    // ✅ If completed the reverse loop → exit to reverse_exit tile on streamline
    if (completedReverse) {
        state.inReverse  = false;
        state.reversePos = 0;

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
    }

    // ✅ Determine final landed tile
    const landedTile = completedReverse
        ? room.streamlineTiles[state.streamlinePos]
        : room.reverseTiles[state.reversePos];

    const eventMsg = completedReverse
        ? `🐴 黑馬思維前進 ${steps} 格，完成逆流層並回到平流層！`
        : `🐴 黑馬思維在逆流層前進 ${steps} 格`;

    addTransactionRecord(
        player.playerName, card, '黑馬思維移動 (逆流層)',
        0,
        completedReverse
            ? `逆流層前進 ${steps} 格，完成逆流層並回到平流層「${landedTile.name}」`
            : `逆流層前進 ${steps} 格 (${oldReversePos + 1} → ${state.reversePos + 1})，踩中「${landedTile.name}」`,
        null, state
    );

    // Send dice_result for token animation
    broadcastToRoom(roomId, {
        type: 'dice_result',
        playerId: player.playerId,
        playerName: player.playerName,
        steps,
        originalSteps: steps,
        multiplierUsed: false,
        diceValues: [steps],
        diceCount: 1,
        diceType: 'normal',
        gameState: state,
        tile: landedTile,
        eventMessage: eventMsg,
        multiplierMessage: ''
    });

    // ✅ Process landed tile
    if (completedReverse && tileProcessor) {
        // Just exited reverse — process the streamline exit tile normally
        setTimeout(() => {
            tileProcessor(state, landedTile, ws, roomId, player, landedTile.type === 'settlement');
        }, 500);
    } else if (!completedReverse) {
        // Still in reverse — process the landed reverse tile
        setTimeout(() => {
            _processLandedReverseTile(state, landedTile, ws, roomId, player, room, broadcastToRoom);
        }, 500);
    }

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: state
    });
}

// ✅ NEW: Process the landed reverse tile
// Uses the same handlers as normal reverse movement (uses processReverseTile)
function _processLandedReverseTile(state, tile, ws, roomId, player, room, broadcastToRoom) {
    try {
        const { processReverseTile } = require('../tiles/ReverseTileProcessor.js');
        const { drawHardshipCard }   = require('../cards/HardshipCardHandler.js');

        let hardshipCards = [];
        try {
            hardshipCards = require('../../hardship_cards.js').hardshipCards || [];
        } catch (e) {
            console.log('⚠️ 無法載入逆境卡');
        }

        const rooms = global._rooms;
        const tipCards = global._tipCards || [];

        const drawHardshipCardFn = (ws2, s2, rId2, p2) => {
            drawHardshipCard(ws2, s2, rId2, p2, hardshipCards, broadcastToRoom, rooms);
        };

        const msg = processReverseTile(
            state, tile, ws, roomId, player,
            room.streamlineTiles, broadcastToRoom, drawHardshipCardFn,
            { rooms, tipCards }
        );

        if (msg) {
            ws.send(JSON.stringify({
                type:    'notification',
                message: `${player.playerName}: ${msg}`
            }));
        }
    } catch (e) {
        console.error('❌ Reverse tile processing error:', e);
    }
}

function _findStepsToIncomeTile(state, streamlineTiles) {
    const targetNames = ['結算日', '副業發展', '創業啟動'];
    const currentPos = state.streamlinePos;

    for (let i = 1; i <= streamlineTiles.length; i++) {
        const pos  = (currentPos + i) % streamlineTiles.length;
        const tile = streamlineTiles[pos];
        if (targetNames.includes(tile.name)) return i;
    }
    return 0;
}

function _findStepsToNearestPlayer(currentPlayer, room) {
    const currentPos = currentPlayer.gameState.streamlinePos;
    const streamlineLen = room.streamlineTiles.length;

    let minSteps = Infinity;
    for (const [, p] of room.players) {
        if (p.playerId === currentPlayer.playerId) continue;
        if (p.gameState.inFlow || p.gameState.inReverse) continue;

        const targetPos = p.gameState.streamlinePos;
        let steps = (targetPos - currentPos + streamlineLen) % streamlineLen;
        if (steps === 0) steps = streamlineLen;   // avoid staying put

        if (steps < minSteps) minSteps = steps;
    }

    return minSteps === Infinity ? 0 : minSteps;
}

module.exports = { startMoveForward, handleMoveForwardChoice };