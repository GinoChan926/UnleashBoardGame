"use strict";

function handleUseFourLeafClover(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state = player.gameState;

    // ✅ Must be player's turn
    if (!state.isMyTurn) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '❌ 現在不是你的回合'
        }));
        return;
    }

    // ✅ Must not have rolled yet this turn
    if (state.hasRolledThisTurn) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '❌ 你已經擲過骰子了，四葉草只能在擲骰前使用'
        }));
        return;
    }

    // ✅ Must not have another multiplier already active
    if (state.diceMultiplierActive) {
        const currentType = state.diceMultiplier === 3 ? '幸運星' : '四葉草';
        ws.send(JSON.stringify({
            type:    'error',
            message: `❌ 你已經使用了${currentType}，不能同時使用多個道具`
        }));
        return;
    }

    // ✅ Must not be skipped
    if (state.skipNextTurn) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '❌ 你本回合被暫停，無法使用道具'
        }));
        return;
    }

    // ✅ Must have at least one clover
    if (!state.fourLeafClover || state.fourLeafClover <= 0) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '❌ 沒有四葉草可用'
        }));
        return;
    }

    // ── Apply the item ────────────────────────────────────────────────────────
    state.fourLeafClover--;
    state.diceMultiplier       = 2;
    state.diceMultiplierActive = true;

    ws.send(JSON.stringify({
        type:            'four_leaf_clover_used',
        message:         '🍀 你使用了一個四葉草！下一次擲骰步數將 x2 倍！',
        fourLeafClover:  state.fourLeafClover,
        gameState:       state
    }));

    broadcastToRoom(roomId, {
        type:    'notification',
        message: `${player.playerName} 使用了四葉草！下一次擲骰步數將 x2 倍！`
    }, ws);

    // ✅ Broadcast state so other players see the update too
    broadcastToRoom(roomId, {
        type:      'state_updated',
        playerId:  player.playerId,
        gameState: state
    });

    console.log(`🍀 ${player.playerName} 使用了四葉草，剩餘: ${state.fourLeafClover}`);
}

function handleUseLuckyStar(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state = player.gameState;

    // ✅ Must be player's turn
    if (!state.isMyTurn) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '❌ 現在不是你的回合'
        }));
        return;
    }

    // ✅ Must not have rolled yet this turn
    if (state.hasRolledThisTurn) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '❌ 你已經擲過骰子了，幸運星只能在擲骰前使用'
        }));
        return;
    }

    // ✅ Must not have another multiplier already active
    if (state.diceMultiplierActive) {
        const currentType = state.diceMultiplier === 3 ? '幸運星' : '四葉草';
        ws.send(JSON.stringify({
            type:    'error',
            message: `❌ 你已經使用了${currentType}，不能同時使用多個道具`
        }));
        return;
    }

    // ✅ Must not be skipped
    if (state.skipNextTurn) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '❌ 你本回合被暫停，無法使用道具'
        }));
        return;
    }

    // ✅ Must have at least one lucky star
    if (!state.luckyStarCount || state.luckyStarCount <= 0) {
        ws.send(JSON.stringify({
            type:    'error',
            message: '❌ 沒有幸運星可用'
        }));
        return;
    }

    // ── Apply the item ────────────────────────────────────────────────────────
    state.luckyStarCount--;
    state.diceMultiplier       = 3;
    state.diceMultiplierActive = true;

    ws.send(JSON.stringify({
        type:            'lucky_star_used',
        message:         `⭐ 你使用了一顆幸運星！剩餘 ${state.luckyStarCount} 顆！下一次擲骰步數將 x3 倍！`,
        luckyStarCount:  state.luckyStarCount,
        gameState:       state
    }));

    broadcastToRoom(roomId, {
        type:    'notification',
        message: `${player.playerName} 使用了幸運星！剩餘 ${state.luckyStarCount} 顆！`
    }, ws);

    // ✅ Broadcast state so other players see the update too
    broadcastToRoom(roomId, {
        type:      'state_updated',
        playerId:  player.playerId,
        gameState: state
    });

    console.log(`⭐ ${player.playerName} 使用了幸運星！剩餘: ${state.luckyStarCount}`);
}

module.exports = { handleUseFourLeafClover, handleUseLuckyStar };