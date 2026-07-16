"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

const pendingMoves = new Map();  // initiatorPlayerId → { steps }

/**
 * Called after P05 executes. Show target/direction picker to the initiator.
 */
function startMoveOtherPlayer(ws, roomId, player, steps, broadcastToRoom, rooms) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Build list of other players
    const otherPlayers = [];
    room.players.forEach((p, pWs) => {
        if (p.playerId !== player.playerId) {
            otherPlayers.push({
                playerId:   p.playerId,
                playerName: p.playerName,
                inFlow:     p.gameState.inFlow,
                inReverse:  p.gameState.inReverse
            });
        }
    });

    if (otherPlayers.length === 0) {
        ws.send(JSON.stringify({
            type: 'notification',
            message: '👮 無其他玩家可以移動，警察卡效果失效'
        }));
        return;
    }

    pendingMoves.set(player.playerId, { steps, roomId });

    ws.send(JSON.stringify({
        type: 'police_move_prompt',
        steps,
        otherPlayers,
        message: `👮 選擇要移動的玩家與方向（${steps} 格）`
    }));

    console.log(`👮 ${player.playerName} 準備使用 P05 移動其他玩家 ${steps} 格`);
}

/**
 * Called when initiator picks target + direction.
 */
function handleMoveOtherPlayer(ws, data, roomId, rooms, broadcastToRoom, deps) {
    const room     = rooms.get(roomId);
    const initiator = room?.players.get(ws);
    if (!room || !initiator) return;

    const pending = pendingMoves.get(initiator.playerId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的移動請求' }));
        return;
    }

    const { targetPlayerId, direction } = data;
    if (!targetPlayerId || !['forward', 'backward'].includes(direction)) {
        ws.send(JSON.stringify({ type: 'error', message: '無效的選擇' }));
        return;
    }

    // Find target player
    let targetPlayer = null;
    let targetWs = null;
    for (const [pWs, p] of room.players) {
        if (p.playerId === targetPlayerId) {
            targetPlayer = p;
            targetWs = pWs;
            break;
        }
    }

    if (!targetPlayer) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到目標玩家' }));
        pendingMoves.delete(initiator.playerId);
        return;
    }

    const steps = pending.steps;
    const state = targetPlayer.gameState;

    // Determine layer and tile array
    const layerType = state.inFlow ? 'flow' : state.inReverse ? 'reverse' : 'streamline';
    const tileArray = room[`${layerType}Tiles`];
    if (!tileArray) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到目標玩家所在層' }));
        pendingMoves.delete(initiator.playerId);
        return;
    }

    // Calculate old and new positions
    const posKey = state.inFlow ? 'flowPos' : state.inReverse ? 'reversePos' : 'streamlinePos';
    const oldPos = state[posKey];
    const totalTiles = tileArray.length;

    let newPos;
    if (direction === 'forward') {
        newPos = (oldPos + steps) % totalTiles;
    } else {
        newPos = ((oldPos - steps) % totalTiles + totalTiles) % totalTiles;
    }

    // Update position WITHOUT processing settlement in between (skip income on passthrough)
    state[posKey] = newPos;

    const targetTile = tileArray[newPos];

    console.log(`👮 ${targetPlayer.playerName} 被 ${initiator.playerName} 移動: ${layerType}[${oldPos}] → [${newPos}] (${targetTile.name})`);

    // Notify initiator
    ws.send(JSON.stringify({
        type: 'police_move_executed',
        targetName: targetPlayer.playerName,
        direction,
        steps,
        landedOn: targetTile.name,
        message: `👮 你將 ${targetPlayer.playerName} ${direction === 'forward' ? '向前' : '向後'} 移動 ${steps} 格，抵達「${targetTile.name}」`
    }));

    // Notify target
    if (targetWs && targetWs.readyState === 1) {
        targetWs.send(JSON.stringify({
            type: 'police_move_received',
            initiatorName: initiator.playerName,
            direction,
            steps,
            landedOn: targetTile.name,
            gameState: state,
            message: `⚠️ ${initiator.playerName} 報警！你被${direction === 'forward' ? '向前' : '向後'}移動 ${steps} 格，抵達「${targetTile.name}」，立即執行該格效果！`
        }));
    }

    // Broadcast state update
    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: targetPlayer.playerId,
        gameState: state
    });

    // Record transaction
    addTransactionRecord(
        initiator.playerName,
        { name: '在爭執時報警', type: 'police', id: 'P05' },
        '移動玩家',
        0,
        `將 ${targetPlayer.playerName} ${direction === 'forward' ? '向前' : '向後'} 移動 ${steps} 格`,
        null,
        initiator.gameState
    );

    // Execute the tile effect on target (only if it is an interactive tile)
    // Skip settlement income by using a special flag
    setTimeout(() => {
        _executeTileEffectOnTarget(
            targetWs, targetPlayer, targetTile, layerType,
            roomId, room, broadcastToRoom, deps
        );
    }, 800);

    pendingMoves.delete(initiator.playerId);
}

/**
 * Execute the tile effect on the target player.
 * Important: skip settlement income (they don't collect salary from this forced move).
 */
function _executeTileEffectOnTarget(ws, player, tile, layerType, roomId, room, broadcastToRoom, deps) {
    if (!tile) return;

    // Send a "dice result" so the frontend updates the token position visually
    const diceResult = {
        type: 'dice_result',
        playerId: player.playerId,
        playerName: player.playerName,
        steps: 0,   // moved by card, not dice
        originalSteps: 0,
        multiplierUsed: false,
        gameState: player.gameState,
        tile: tile,
        eventMessage: `👮 被警察卡移動至「${tile.name}」`,
        multiplierMessage: ''
    };
    ws?.send(JSON.stringify(diceResult));
    broadcastToRoom(roomId, diceResult, ws);

    // For settlement tile - explicitly skip income (per P05 rule)
    if (tile.type === 'settlement') {
        ws?.send(JSON.stringify({
            type: 'notification',
            message: '⚠️ 因警察卡強制移動，經過結算日不會有收入'
        }));
        console.log(`   ⚠️ ${player.playerName} skipped settlement income (P05 forced move)`);
        return;
    }

    // Process the tile based on layer
    if (layerType === 'streamline') {
        deps.processStreamlineTile?.(player.gameState, tile, ws, roomId, player, false);
    } else if (layerType === 'reverse') {
        deps.processReverseTile?.(player.gameState, tile, ws, roomId, player);
    } else if (layerType === 'flow') {
        deps.processFlowTile?.(player.gameState, tile, ws, roomId, player, room);
    }
}

module.exports = { startMoveOtherPlayer, handleMoveOtherPlayer };