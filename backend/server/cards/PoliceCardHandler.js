"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function drawPoliceCard(ws, state, roomId, player, policeCards, broadcastToRoom) {
    if (policeCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無警察卡資料' }));
        return;
    }

    const card        = policeCards[Math.floor(Math.random() * policeCards.length)];
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));
    const effectResult = card.effect(player.gameState);

    addTransactionRecord(player.playerName, card, '警察卡',
        player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

    const serializableCard = {
        id: card.id, name: card.name, description: card.description,
        image: card.image, cardType: 'police', cardTypeName: '警察卡', cardTypeIcon: '👮'
    };

    const dr = {
        type: 'dice_result', playerId: player.playerId, playerName: player.playerName,
        steps: 0, originalSteps: 0, multiplierUsed: false,
        gameState: player.gameState, tile: { name: "警察卡", type: "police" },
        eventMessage: null, multiplierMessage: ''
    };
    ws.send(JSON.stringify(dr));
    broadcastToRoom(roomId, dr, ws);

    ws.send(JSON.stringify({
        type: 'police_card_execute', card: serializableCard,
        effectMessage: effectResult, gameState: player.gameState
    }));
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `👮 ${player.playerName} 獲得警察卡「${card.name}」！${effectResult}`
    }, ws);
    broadcastToRoom(roomId, { type: 'state_updated', playerId: player.playerId, gameState: player.gameState });

    console.log(`✅ ${player.playerName} 執行了警察卡: ${card.name}`);
}

module.exports = { drawPoliceCard };