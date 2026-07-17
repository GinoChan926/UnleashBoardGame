"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function processSocialServiceTile(state, ws, roomId, player, tile, room) {
    const cost = 10000;
    if (state.cash < cost) {
        ws.send(JSON.stringify({ type: 'notification', message: `❌ 現金不足 ${cost.toLocaleString()} 元` }));
        return `❌ 現金不足`;
    }
    if (room.pendingSocialService?.has(ws)) {
        ws.send(JSON.stringify({ type: 'notification', message: `⏳ 你已有進行中的社會服務選擇` }));
        return `⏳ 已有進行中的選擇`;
    }

    if (!room.pendingSocialService) room.pendingSocialService = new Map();
    room.pendingSocialService.set(ws, {
        type: 'social_service_choice', playerId: player.playerId,
        timestamp: Date.now(), tileName: tile.name
    });

    ws.send(JSON.stringify({
        type: 'social_service_prompt',
        message: `🏛️ 社會服務中心\n支付 ${cost.toLocaleString()} 元，抽 2 張「項目投資卡」或「服務社會卡」！`,
        cost, tileName: tile.name
    }));

    console.log(`🏛️ ${player.playerName} 觸發社會服務中心，等待選擇...`);
    return null;
}

function handleSocialServiceChoice(ws, data, roomId, rooms, broadcastToRoom, investmentCards, socialCards) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = room.pendingSocialService?.get(ws);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的社會服務選擇' }));
        return;
    }

    const choice = data.choice;
    const cost   = 10000;

    if (player.gameState.cash < cost) {
        ws.send(JSON.stringify({ type: 'error', message: `❌ 現金不足 ${cost.toLocaleString()} 元` }));
        room.pendingSocialService.delete(ws);
        return;
    }

    player.gameState.cash -= cost;
    // ✅ Track social contribution when player picks 服務社會卡
    if (choice === 'social') {
        player.gameState.contributionCount = (player.gameState.contributionCount || 0) + 1;
    }

    addTransactionRecord(player.playerName,
        { name: `社會服務中心 (${pending.tileName})`, type: "social_service", id: "SS01" },
        "社會服務", -cost,
        `支付 ${cost.toLocaleString()} 元，抽取 ${choice === 'investment' ? '項目投資卡' : '服務社會卡'} x2`,
        null, player.gameState);

    const cards        = choice === 'investment'
        ? _drawMultiple(investmentCards, 2)
        : _drawMultiple(socialCards, 2);
    const cardTypeName = choice === 'investment' ? '項目投資卡' : '服務社會卡';
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
            canAfford, message: `📋 第 ${index + 1} 張 ${cardTypeName}：${card.name}`
        }));
    });

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🏛️ ${player.playerName} 在社會服務中心抽取了 2 張${cardTypeName}！`
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