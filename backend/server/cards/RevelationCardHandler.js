"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function showRevelationCardTypeSelection(ws, state, roomId, player, marketNewsCards, tipCards, room) {
    const cardTypes = [
        { id: 'market_news', name: '市場消息卡', icon: '📊', color: '#2196f3', cards: marketNewsCards },
        { id: 'tip',         name: '錦囊卡',     icon: '🎁', color: '#9c27b0', cards: tipCards }
    ];
    ws.send(JSON.stringify({
        type: 'revelation_type_selection', cardTypes, canAfford: state.cash >= 500
    }));
    if (!room.pendingRevelationSelections) room.pendingRevelationSelections = new Map();
    room.pendingRevelationSelections.set(ws, { playerId: player.playerId, timestamp: Date.now() });
}

function handleRevelationCardTypeChoice(ws, data, roomId, rooms, marketNewsCards, tipCards) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const type = data.cardType;
    const cards = type === 'market_news' ? marketNewsCards : type === 'tip' ? tipCards : null;
    if (!cards) { ws.send(JSON.stringify({ type: 'error', message: '無效的卡片類型' })); return; }
    if (cards.length === 0) { ws.send(JSON.stringify({ type: 'error', message: '暫無卡片資料' })); return; }

    room.pendingRevelationSelections?.delete(ws);

    const originalCard = cards[Math.floor(Math.random() * cards.length)];
    const card = { ...originalCard, cardType: type };
    if (originalCard.effect) card.effect = originalCard.effect.bind(card);

    const serializableCard = {
        id: card.id, name: card.name, description: card.description, image: card.image,
        cost: card.cost, cardType: type,
        cardTypeName:  type === 'market_news' ? '市場消息卡' : '錦囊卡',
        cardTypeIcon:  type === 'market_news' ? '📊' : '🎁',
        scope: card.scope || 'personal'
    };

    if (!room.pendingRevelationEvents) room.pendingRevelationEvents = new Map();
    room.pendingRevelationEvents.set(ws, {
        type: 'revelation_card', card, cardType: type,
        playerId: player.playerId, purchased: false, timestamp: Date.now()
    });

    ws.send(JSON.stringify({
        type: 'revelation_card_draw', card: serializableCard, canAfford: player.gameState.cash >= 500
    }));
    console.log(`📜 ${player.playerName} 選擇${serializableCard.cardTypeName}，抽到: ${card.name}`);
}

function handlePurchaseRevelationCard(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingRevelationEvents?.get(ws);
    if (!pendingEvent || pendingEvent.type !== 'revelation_card') {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的啟示卡' }));
        return;
    }

    if (player.gameState.cash < 500) {
        ws.send(JSON.stringify({ type: 'purchase_failed', message: `現金不足 500 元` }));
        room.pendingRevelationEvents.delete(ws);
        return;
    }

    // ✅ Deduct cash
    player.gameState.cash -= 500;
    pendingEvent.purchased    = true;
    pendingEvent.purchaseTime = Date.now();

    // ✅ Record the transaction
    addTransactionRecord(
        player.playerName,
        pendingEvent.card,
        '購買啟示卡',
        -500,
        `支付 500 元購買「${pendingEvent.card.name}」`,
        null,
        player.gameState
    );

    const card = pendingEvent.card;
    const serializableCard = {
        id: card.id, name: card.name, description: card.description, image: card.image,
        cardType: pendingEvent.cardType,
        cardTypeName: card.cardTypeName,
        cardTypeIcon: pendingEvent.cardType === 'market_news' ? '📊' : '🎁',
        scope: card.scope || 'personal'
    };

    // ✅ Send updated state to the purchaser
    ws.send(JSON.stringify({
        type: 'revelation_card_purchased',
        card: serializableCard,
        message: `已支付 500 元購買「${card.name}」`,
        gameState: player.gameState   // ← NEW: include updated state
    }));

    // ✅ Broadcast state update to all players (so other players see reduced cash)
    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });

    // Notify others
    broadcastToRoom(roomId, {
        type: 'player_purchased_card',
        playerId: player.playerId,
        playerName: player.playerName,
        cardName: card.name,
        message: `${player.playerName} 花費 500 元購買了「${card.name}」`
    }, ws);
}

function handleExecuteRevelationCard(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingRevelationEvents?.get(ws);
    if (!pendingEvent || !pendingEvent.purchased) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有已購買的啟示卡' }));
        return;
    }

    const card = pendingEvent.card;
    const execute = data.execute;

    if (!execute) {
        // Declined
        const stateBefore = JSON.parse(JSON.stringify(player.gameState));
        addTransactionRecord(player.playerName, card, '放棄', -500, '放棄執行', stateBefore, player.gameState);
        broadcastToRoom(roomId, {
            type: 'card_skipped', playerId: player.playerId, playerName: player.playerName,
            cardName: card.name, message: `❌ 放棄「${card.name}」`
        });
        ws.send(JSON.stringify({
            type: 'card_decision_result', execute: false,
            message: `❌ 你決定不執行「${card.name}」，500 元不退還`,
            gameState: player.gameState, cardName: card.name
        }));
        room.pendingRevelationEvents.delete(ws);
        return;
    }

    room.pendingRevelationEvents.delete(ws);

    // ✅ Route by card type
    if (card.type === 'market_news') {
        // Market news cards - use MarketNewsSystem
        const { startMarketNews } = require('../systems/MarketNewsSystem.js');

        ws.send(JSON.stringify({
            type: 'card_decision_result',
            execute: true,
            message: `📰 觸發市場消息「${card.name}」...`,
            gameState: player.gameState,
            cardName: card.name
        }));

        setTimeout(() => {
            startMarketNews(ws, roomId, player, card, broadcastToRoom, rooms);
        }, 300);

    } else if (card.scope === 'team') {
        // Team tip cards
        const { startTeamCard } = require('../systems/RevelationCardSystem.js');

        ws.send(JSON.stringify({
            type: 'card_decision_result',
            execute: true,
            message: `👥 團隊錦囊「${card.name}」已觸發，等待其他玩家回應...`,
            gameState: player.gameState,
            cardName: card.name
        }));

        setTimeout(() => {
            startTeamCard(ws, roomId, player, card, broadcastToRoom, rooms);
        }, 300);

    } else {
        // Personal tip cards
        const { startPersonalCard } = require('../systems/RevelationCardSystem.js');

        ws.send(JSON.stringify({
            type: 'card_decision_result',
            execute: true,
            message: `📜 準備執行個人錦囊「${card.name}」...`,
            gameState: player.gameState,
            cardName: card.name
        }));

        setTimeout(() => {
            startPersonalCard(ws, roomId, player, card, broadcastToRoom, rooms);
        }, 300);
    }
}

function handleMarketNewsResponse(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingRevelationEvents?.get(ws);
    if (!pendingEvent?.card) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的啟示卡' }));
        return;
    }

    let effectResult = '';
    try {
        effectResult = pendingEvent.card.effect(
            player.gameState, room, player, ws, roomId, data.playerChoices);
    } catch (e) {
        effectResult = `執行「${pendingEvent.card.name}」效果時發生錯誤`;
    }

    addTransactionRecord(player.playerName, pendingEvent.card, '市場消息', 0, effectResult, null, player.gameState);

    ws.send(JSON.stringify({ type: 'market_news_result', effectMessage: effectResult, gameState: player.gameState }));
    broadcastToRoom(roomId, { type: 'state_updated', playerId: player.playerId, gameState: player.gameState });
    room.pendingRevelationEvents.delete(ws);
}

module.exports = {
    showRevelationCardTypeSelection,
    handleRevelationCardTypeChoice,
    handlePurchaseRevelationCard,
    handleExecuteRevelationCard,
    handleMarketNewsResponse
};