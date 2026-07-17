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

    // Only works on streamline layer for now
    if (state.inFlow || state.inReverse) {
        ws.send(JSON.stringify({
            type: 'notification',
            message: '❌ 此卡只能在平流層使用'
        }));
        return;
    }

    const oldPos = state.streamlinePos;
    const newPos = (oldPos + steps) % room.streamlineTiles.length;

    // Process settlement tiles passed
    for (let i = 1; i < steps; i++) {
        const passPos = (oldPos + i) % room.streamlineTiles.length;
        const passTile = room.streamlineTiles[passPos];
        if (passTile.type === 'settlement') {
            const totalIncome = state.salary + state.sideIncome;
            state.cash += totalIncome;
            state.totalAssets += Math.floor(totalIncome * 0.2);

            const { totalExpense } = calculateReducedExpense(state);
            state.cash -= totalExpense;

            const repayment = processSettlementRepayment(player, ws, roomId, broadcastToRoom);
            if (repayment) {
                ws.send(JSON.stringify(repayment));
            }
        }
    }

    // Move to new position
    state.streamlinePos = newPos;
    const landedTile = room.streamlineTiles[newPos];

    addTransactionRecord(
        player.playerName, card, '黑馬思維移動',
        0,
        `前進 ${steps} 格 (${oldPos + 1} → ${newPos + 1})，踩中「${landedTile.name}」`,
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
        eventMessage: `🐴 黑馬思維前進 ${steps} 格`,
        multiplierMessage: ''
    });

    // Process the landed tile (unless it's settlement - already handled above)
    if (landedTile.type !== 'settlement' && tileProcessor) {
        tileProcessor(state, landedTile, ws, roomId, player, false);
    }

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: state
    });
}

function _findStepsToIncomeTile(state, streamlineTiles) {
    const targetNames = ['升職加薪', '副業發展', '創業啟動'];
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