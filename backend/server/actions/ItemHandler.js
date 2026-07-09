"use strict";

function handleUseFourLeafClover(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    if (!player.gameState.fourLeafClover || player.gameState.fourLeafClover <= 0) {
        ws.send(JSON.stringify({ type: 'error', message: '没有四叶草可用' }));
        return;
    }

    player.gameState.fourLeafClover--;
    player.gameState.diceMultiplier       = 2;
    player.gameState.diceMultiplierActive = true;

    ws.send(JSON.stringify({
        type: 'four_leaf_clover_used',
        message: '🍀 你使用了一个四叶草！下一次掷骰步数将 x2 倍！',
        fourLeafClover: player.gameState.fourLeafClover,
        gameState: player.gameState
    }));
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `${player.playerName} 使用了四叶草！下一次掷骰步数将 x2 倍！`
    }, ws);

    console.log(`🍀 ${player.playerName} 使用了四叶草，剩余: ${player.gameState.fourLeafClover}`);
}

function handleUseLuckyStar(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    if (!player.gameState.luckyStarCount || player.gameState.luckyStarCount <= 0) {
        ws.send(JSON.stringify({ type: 'error', message: '没有幸运星可用' }));
        return;
    }

    player.gameState.luckyStarCount--;
    player.gameState.diceMultiplier       = 3;
    player.gameState.diceMultiplierActive = true;

    ws.send(JSON.stringify({
        type: 'lucky_star_used',
        message: `⭐ 你使用了一颗幸运星！剩余 ${player.gameState.luckyStarCount} 颗！下一次掷骰步数将 x3 倍！`,
        luckyStarCount: player.gameState.luckyStarCount,
        gameState: player.gameState
    }));
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `${player.playerName} 使用了幸运星！剩余 ${player.gameState.luckyStarCount} 颗！`
    }, ws);

    console.log(`⭐ ${player.playerName} 使用了幸运星，剩余: ${player.gameState.luckyStarCount}`);
}

module.exports = { handleUseFourLeafClover, handleUseLuckyStar };