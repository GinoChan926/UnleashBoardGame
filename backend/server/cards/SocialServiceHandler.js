"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function processSocialServiceTile(state, ws, roomId, player, tile, room) {
    const cost = 10000;
    if (state.cash < cost) {
        ws.send(JSON.stringify({ type: 'notification', message: `❌ 现金不足 ${cost.toLocaleString()} 元` }));
        return `❌ 现金不足`;
    }
    if (room.pendingSocialService?.has(ws)) {
        ws.send(JSON.stringify({ type: 'notification', message: `⏳ 你已有进行中的社会服务选择` }));
        return `⏳ 已有进行中的选择`;
    }

    if (!room.pendingSocialService) room.pendingSocialService = new Map();
    room.pendingSocialService.set(ws, {
        type: 'social_service_choice', playerId: player.playerId,
        timestamp: Date.now(), tileName: tile.name
    });

    ws.send(JSON.stringify({
        type: 'social_service_prompt',
        message: `🏛️ 社会服务中心\n支付 ${cost.toLocaleString()} 元，抽 2 张「项目投资卡」或「服务社会卡」！`,
        cost, tileName: tile.name
    }));

    console.log(`🏛️ ${player.playerName} 触发社会服务中心，等待选择...`);
    return null;
}

function handleSocialServiceChoice(ws, data, roomId, rooms, broadcastToRoom, investmentCards, socialCards) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = room.pendingSocialService?.get(ws);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '没有待处理的社会服务选择' }));
        return;
    }

    const choice = data.choice;
    const cost   = 10000;

    if (player.gameState.cash < cost) {
        ws.send(JSON.stringify({ type: 'error', message: `❌ 现金不足 ${cost.toLocaleString()} 元` }));
        room.pendingSocialService.delete(ws);
        return;
    }

    player.gameState.cash -= cost;

    addTransactionRecord(player.playerName,
        { name: `社会服务中心 (${pending.tileName})`, type: "social_service", id: "SS01" },
        "社会服务", -cost,
        `支付 ${cost.toLocaleString()} 元，抽取 ${choice === 'investment' ? '项目投资卡' : '服务社会卡'} x2`,
        null, player.gameState);

    const cards        = choice === 'investment'
        ? _drawMultiple(investmentCards, 2)
        : _drawMultiple(socialCards, 2);
    const cardTypeName = choice === 'investment' ? '项目投资卡' : '服务社会卡';
    const cardTypeIcon = choice === 'investment' ? '🏗️' : '🤝';

    room.pendingSocialService.delete(ws);

    // Send each card as an opportunity card draw
    cards.forEach((card, index) => {
        const fullCard = { ...card, cardType: choice, cardTypeName, cardTypeIcon };
        if (card.effect) fullCard.effect = card.effect.bind(card);

        if (!room.pendingEvents) room.pendingEvents = new Map();
        room.pendingEvents.set(ws, {
            type: 'opportunity_card', card: fullCard,
            cardType: { id: choice, name: cardTypeName, icon: cardTypeIcon },
            playerId: player.playerId, purchased: false,
            timestamp: Date.now(), isFromSocialService: true, cardIndex: index
        });

        const canAfford = player.gameState.cash >= 500 &&
            player.gameState.cash >= (card.investmentCost || 0) &&
            player.gameState.energy >= (card.energyCost || 0);

        ws.send(JSON.stringify({
            type: 'opportunity_card_draw',
            card: {
                id: card.id, name: card.name, description: card.description,
                image: card.image || '', cost: card.cost || 500,
                investmentCost: card.investmentCost || 0, energyCost: card.energyCost || 0,
                monthlyReturn: card.monthlyReturn || 0, cardType: choice, cardTypeName, cardTypeIcon
            },
            canAfford, message: `📋 第 ${index + 1} 张 ${cardTypeName}：${card.name}`
        }));
    });

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🏛️ ${player.playerName} 在社会服务中心抽取了 2 张${cardTypeName}！`
    }, ws);
    broadcastToRoom(roomId, { type: 'state_updated', playerId: player.playerId, gameState: player.gameState });
}

function _drawMultiple(deck, count) {
    const available = [...deck];
    const result    = [];
    for (let i = 0; i < count && available.length > 0; i++) {
        const idx = Math.floor(Math.random() * available.length);
        result.push(available.splice(idx, 1)[0]);
    }
    return result;
}

module.exports = { processSocialServiceTile, handleSocialServiceChoice };