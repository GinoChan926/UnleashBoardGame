"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function drawHardshipCard(ws, state, roomId, player, hardshipCards, broadcastToRoom) {
    if (hardshipCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無逆境自強卡資料' }));
        return;
    }

    const card        = hardshipCards[Math.floor(Math.random() * hardshipCards.length)];
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));
    const effectResult = card.effect(player.gameState);

    addTransactionRecord(player.playerName, card, '逆境自強卡',
        player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

    const serializableCard = {
        id: card.id, name: card.name, description: card.description,
        image: card.image, cardType: 'hardship', cardTypeName: '逆境自強卡', cardTypeIcon: '🎭'
    };

    const diceResult = _buildDiceResult(player, { name: "逆境自強卡", type: "hardship" });
    ws.send(JSON.stringify(diceResult));
    broadcastToRoom(roomId, diceResult, ws);

    ws.send(JSON.stringify({
        type: 'hardship_card_execute', card: serializableCard,
        effectMessage: effectResult, gameState: player.gameState
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🎭 ${player.playerName} 抽到逆境自強卡「${card.name}」！${effectResult}`
    }, ws);
    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: player.playerId, gameState: player.gameState
    });

    console.log(`✅ ${player.playerName} 執行了逆境自強卡: ${card.name}`);
}

function _buildDiceResult(player, tile) {
    return {
        type: 'dice_result', playerId: player.playerId, playerName: player.playerName,
        steps: 0, originalSteps: 0, multiplierUsed: false,
        gameState: player.gameState, tile, eventMessage: null, multiplierMessage: ''
    };
}

module.exports = { drawHardshipCard };