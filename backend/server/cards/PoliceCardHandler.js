"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const { broadcastCardReveal } = require('../utils/CardBroadcastHelper.js');

function drawPoliceCard(ws, state, roomId, player, policeCards, broadcastToRoom, deps) {
    if (policeCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無警察卡資料' }));
        return;
    }

    const card = policeCards[Math.floor(Math.random() * policeCards.length)];
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));

    // Execute base effect (placeholder for special cards)
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
    broadcastCardReveal({
        roomId,
        drawerWs: ws,
        drawerName: player.playerName,
        drawerId: player.playerId,
        card,
        action: '抽到警察卡',
        effectMessage: effectResult,
        broadcastToRoom
    });

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `👮 ${player.playerName} 獲得警察卡「${card.name}」！${effectResult}`
    }, ws);

    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: player.playerId, gameState: player.gameState
    });

    console.log(`✅ ${player.playerName} 執行了警察卡: ${card.name}`);

    // ✅ P05 - Trigger move-other-player flow
    if (card.hasMoveOtherPlayerFeature) {
        const { startMoveOtherPlayer } = require('../systems/MoveOtherPlayerSystem.js');
        const steps = card.moveSteps || 3;

        setTimeout(() => {
            const rooms = deps?.rooms || (require('../../server.js').rooms);
            startMoveOtherPlayer(ws, roomId, player, steps, broadcastToRoom, rooms);
        }, 800);
    }

    // ✅ P06 - Trigger fine-other-player flow
    if (card.hasFineOtherPlayerFeature) {
        const { startFineOtherPlayer } = require('../systems/FineOtherPlayerSystem.js');
        const amount = card.fineAmount || 5000;

        setTimeout(() => {
            const rooms = deps?.rooms;
            if (rooms) {
                startFineOtherPlayer(ws, roomId, player, amount, broadcastToRoom, rooms);
            }
        }, 800);
    }

    // ✅ P08 - Good citizen choice
    if (card.hasGoodCitizenChoiceFeature) {
        const { startGoodCitizenChoice } = require('../systems/GoodCitizenSystem.js');

        setTimeout(() => {
            startGoodCitizenChoice(ws, roomId, player, broadcastToRoom);
        }, 5000);
    }
}

module.exports = { drawPoliceCard };