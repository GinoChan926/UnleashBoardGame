"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const { broadcastCardReveal } = require('../utils/CardBroadcastHelper.js');

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

    // ✅ Use non-investment wallet (social service fee is not investment)
    const { spendForNonInvestment } = require('../systems/WalletSystem.js');
    spendForNonInvestment(player.gameState, cost);

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

    // ✅ Store queue of cards to present one at a time
    room.pendingSocialServiceQueue = room.pendingSocialServiceQueue || new Map();
    room.pendingSocialServiceQueue.set(ws, {
        cards, cardTypeName, cardTypeIcon, choice,
        currentIndex: 0,
        totalCards: cards.length,
        tileName: pending.tileName
    });

    room.pendingSocialService.delete(ws);

    // ✅ Present the first card
    _presentNextSocialServiceCard(ws, roomId, room, player, broadcastToRoom);

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🏛️ ${player.playerName} 在社會服務中心抽取了 2 張${cardTypeName}！`
    }, ws);
    broadcastToRoom(roomId, { type: 'state_updated', playerId: player.playerId, gameState: player.gameState });
}

function _presentNextSocialServiceCard(ws, roomId, room, player, broadcastToRoom) {
    const queue = room.pendingSocialServiceQueue?.get(ws);
    if (!queue || queue.currentIndex >= queue.totalCards) {
        // All done
        room.pendingSocialServiceQueue?.delete(ws);
        ws.send(JSON.stringify({
            type: 'notification',
            message: `✅ 社會服務中心結束，共查看 ${queue?.totalCards || 0} 張卡`
        }));
        return;
    }

    const card         = queue.cards[queue.currentIndex];
    const cardTypeName = queue.cardTypeName;
    const cardTypeIcon = queue.cardTypeIcon;
    const choice       = queue.choice;
    const totalCash    = (player.gameState.cash || 0) + (player.gameState.loanCash || 0);

    const fullCard = { ...card, cardType: choice, cardTypeName, cardTypeIcon };
    if (card.effect) fullCard.effect = card.effect.bind(card);

    if (!room.pendingEvents) room.pendingEvents = new Map();
    room.pendingEvents.set(ws, {
        type: 'opportunity_card',
        card: fullCard,
        cardType: { id: choice, name: cardTypeName, icon: cardTypeIcon },
        playerId: player.playerId,
        purchased: false,
        timestamp: Date.now(),
        isFromSocialService: true,
        skipPurchaseCost: true,   // ✅ already paid $10k
        activationOnly: true,      // ✅ show as activation
        cardIndex: queue.currentIndex,
        totalCards: queue.totalCards
    });

    // Determine affordability
    const investCost = card.investmentCost || 0;
    const lacks = [];
    if (investCost > totalCash) {
        lacks.push(`💵 資金不足 (需 $${investCost.toLocaleString()}，你有 $${totalCash.toLocaleString()})`);
    }
    if (card.energyCost && player.gameState.energy < card.energyCost) {
        lacks.push(`⚡ 精力不足 (需 ${card.energyCost}，你有 ${player.gameState.energy})`);
    }
    const canAfford = lacks.length === 0;

    ws.send(JSON.stringify({
        type: 'opportunity_card_draw',
        card: {
            id: card.id, name: card.name, description: card.description,
            image: card.image || '', cost: 0,
            investmentCost: card.investmentCost || 0,
            energyCost: card.energyCost || 0,
            monthlyReturn: card.monthlyReturn || 0,
            cardType: choice, cardTypeName, cardTypeIcon,
            activationOnly: true, freeReveal: true,
            canAfford, blockedReasons: lacks
        },
        canAfford,
        blockedReasons: lacks,
        activationOnly: true,
        freeReveal: true,
        message: `📋 第 ${queue.currentIndex + 1}/${queue.totalCards} 張 ${cardTypeName}：${card.name}`
    }));

    broadcastCardReveal({
        roomId,
        drawerWs:      ws,
        drawerName:    player.playerName,
        drawerId:      player.playerId,
        card:          fullCard,
        action:        `在社會服務中心抽到${cardTypeName}`,
        effectMessage: card.description || '',
        broadcastToRoom
    });

    console.log(`🏛️ ${player.playerName} 收到社會服務卡 ${queue.currentIndex + 1}/${queue.totalCards}: ${card.name}`);
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

function handleSocialServiceCancel(ws, data, roomId, rooms) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    if (room.pendingSocialService?.has(ws)) {
        room.pendingSocialService.delete(ws);
        console.log(`🏛️ ${player.playerName} 取消社會服務中心`);
    }

    ws.send(JSON.stringify({
        type:    'notification',
        message: '❌ 已取消社會服務中心，無扣費'
    }));
}


module.exports = { processSocialServiceTile, handleSocialServiceChoice, _presentNextSocialServiceCard, handleSocialServiceCancel};