"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function drawVolunteerCard(ws, state, roomId, player, volunteerCards, room, broadcastToRoom, isExactLanding = false) {
    if (volunteerCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無義工卡資料' }));
        return;
    }

    const card = volunteerCards[Math.floor(Math.random() * volunteerCards.length)];
    console.log(`🤝 ${player.playerName} 抽到義工卡: ${card.name}`);

    const serializableCard = _serializable(card);

    if (card.requiresDonation) {
        if (!room.pendingVolunteerEvents) room.pendingVolunteerEvents = new Map();
        room.pendingVolunteerEvents.set(ws, {
            type: 'volunteer_card', card, playerId: player.playerId,
            playerName: player.playerName, timestamp: Date.now(), isExactLanding
        });
        ws.send(JSON.stringify({
            type: 'volunteer_card_draw', card: serializableCard,
            cardData: { requiresDonation: true, donationAmount: 2000 }
        }));
        return;
    }

    if (card.requiresChoice) {
        if (!room.pendingVolunteerEvents) room.pendingVolunteerEvents = new Map();
        room.pendingVolunteerEvents.set(ws, {
            type: 'volunteer_card_choice', card, playerId: player.playerId,
            playerName: player.playerName, timestamp: Date.now(), isExactLanding
        });
        ws.send(JSON.stringify({
            type: 'volunteer_card_choice', card: serializableCard,
            options: [
                { id: 'cash',      name: '💰 獲得 $3,000 元',    description: '直接獲得現金獎勵' },
                { id: 'volunteer', name: '⭐ 獲得 1 次義工資格', description: '增加義工次數' }
            ]
        }));
        return;
    }

    // Direct execute
    const stateBefore  = JSON.parse(JSON.stringify(player.gameState));
    let effectResult   = '';
    try { effectResult = card.effect(player.gameState); } catch (e) { effectResult = `執行「${card.name}」`; }

    addTransactionRecord(player.playerName, card, '義工卡',
        player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

    const dr = _diceResult(player, { name: "義工卡", type: "volunteer" });
    ws.send(JSON.stringify(dr));
    broadcastToRoom(roomId, dr, ws);
    ws.send(JSON.stringify({
        type: 'volunteer_card_execute', card: serializableCard,
        effectMessage: effectResult, gameState: player.gameState
    }));
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🤝 ${player.playerName} 獲得義工卡「${card.name}」！${effectResult}`
    }, ws);
    broadcastToRoom(roomId, { type: 'state_updated', playerId: player.playerId, gameState: player.gameState });
}

function executeVolunteerDonation(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingVolunteerEvents?.get(ws);
    if (!pendingEvent?.card?.requiresDonation) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的義工卡' }));
        return;
    }

    const card        = pendingEvent.card;
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));
    let   effectResult = '';

    try {
        effectResult = card.effect(player.gameState, room, player, ws, roomId);
    } catch (e) {
        effectResult = `執行「${card.name}」效果時發生錯誤`;
    }

    addTransactionRecord(player.playerName, card, '義工卡',
        player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

    ws.send(JSON.stringify({
        type: 'volunteer_card_execute', card: _serializable(card),
        effectMessage: effectResult, gameState: player.gameState
    }));
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🤝 ${player.playerName} 執行義工卡「${card.name}」！`
    });
    room.players.forEach((p) => {
        broadcastToRoom(roomId, { type: 'state_updated', playerId: p.playerId, gameState: p.gameState });
    });
    room.pendingVolunteerEvents.delete(ws);
}

function executeVolunteerChoice(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingVolunteerEvents?.get(ws);
    if (!pendingEvent?.card?.requiresChoice) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的義工卡' }));
        return;
    }

    const card   = pendingEvent.card;
    const choice = data.choice;

    if (!choice || !['cash', 'volunteer'].includes(choice)) {
        ws.send(JSON.stringify({ type: 'error', message: '無效的選擇' }));
        return;
    }

    const stateBefore  = JSON.parse(JSON.stringify(player.gameState));
    let   effectResult = '';
    try { effectResult = card.effect(player.gameState, choice); } catch (e) { effectResult = `執行「${card.name}」`; }

    addTransactionRecord(player.playerName, card, '義工卡',
        player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

    ws.send(JSON.stringify({
        type: 'volunteer_card_execute', card: _serializable(card),
        effectMessage: effectResult, gameState: player.gameState
    }));
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🤝 ${player.playerName} 執行義工卡「${card.name}」！${effectResult}`
    }, ws);
    broadcastToRoom(roomId, { type: 'state_updated', playerId: player.playerId, gameState: player.gameState });
    room.pendingVolunteerEvents.delete(ws);
}

// ── Private ───────────────────────────────────────────────────────────────────

function _serializable(card) {
    return {
        id: card.id, name: card.name, description: card.description, image: card.image,
        cardType: 'volunteer', cardTypeName: '義工卡', cardTypeIcon: '🤝',
        requiresDonation: card.requiresDonation || false,
        requiresChoice:   card.requiresChoice   || false
    };
}

function _diceResult(player, tile) {
    return {
        type: 'dice_result', playerId: player.playerId, playerName: player.playerName,
        steps: 0, originalSteps: 0, multiplierUsed: false,
        gameState: player.gameState, tile, eventMessage: null, multiplierMessage: ''
    };
}

module.exports = { drawVolunteerCard, executeVolunteerDonation, executeVolunteerChoice };