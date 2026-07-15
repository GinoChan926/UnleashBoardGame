"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

/**
 * After C05 (AI無人便利店) executes:
 * - Draw N opportunity cards (N = number of players in room)
 * - Initiator picks 1 first
 * - Then each other player picks 1 in turn order
 * - Each picked card auto-executes on the picker
 */

const activeDraws = new Map(); // key: initiatorPlayerId, value: draw state

// ── Entry point ───────────────────────────────────────────────────────────────

function handleAIStoreDraw(ws, roomId, player, CARD_TYPES, rooms, broadcastToRoom) {
    const room = rooms.get(roomId);
    if (!room) return;

    const playerCount = room.players.size;
    if (playerCount === 0) return;

    // Pool all opportunity cards
    const allOpportunityCards = _collectAllCards(CARD_TYPES);
    if (allOpportunityCards.length < playerCount) {
        ws.send(JSON.stringify({
            type: 'notification',
            message: '⚠️ 機會卡數量不足，無法執行此功能'
        }));
        return;
    }

    // Draw N cards randomly
    const drawnCards = _drawRandomCards(allOpportunityCards, playerCount);

    // Build turn order: initiator first, then others in join order
    const turnOrder = _buildTurnOrder(room, player);

    // Save draw state
    const drawState = {
        initiatorId: player.playerId,
        drawnCards:  drawnCards,
        turnOrder:   turnOrder,
        currentIdx:  0,
        roomId:      roomId
    };
    activeDraws.set(player.playerId, drawState);

    console.log(`🏪 AI無人便利店: ${player.playerName} 開始抽 ${drawnCards.length} 張卡分配給 ${turnOrder.length} 位玩家`);

    // Notify everyone about the draw start
    broadcastToRoom(roomId, {
        type: 'ai_store_draw_start',
        initiator:  player.playerName,
        totalCards: drawnCards.length,
        players:    turnOrder.map(p => p.playerName)
    });

    // Send first player their choice
    _promptCurrentPlayer(drawState, rooms, broadcastToRoom);
}

// ── Handle player picking a card ──────────────────────────────────────────────

function handleAIStorePick(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    // Find the draw state this player belongs to
    let drawState = null;
    for (const [, ds] of activeDraws) {
        if (ds.roomId === roomId && ds.turnOrder[ds.currentIdx]?.playerId === player.playerId) {
            drawState = ds;
            break;
        }
    }

    if (!drawState) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待抽取的卡片' }));
        return;
    }

    const cardIdx = data.cardIndex;
    if (typeof cardIdx !== 'number' || cardIdx < 0 || cardIdx >= drawState.drawnCards.length) {
        ws.send(JSON.stringify({ type: 'error', message: '無效的卡片選擇' }));
        return;
    }

    if (drawState.drawnCards[cardIdx].__taken) {
        ws.send(JSON.stringify({ type: 'error', message: '此卡片已被選取' }));
        return;
    }

    // Mark card as taken and execute effect
    const chosenCard = drawState.drawnCards[cardIdx];
    chosenCard.__taken = true;

    const stateBefore = JSON.parse(JSON.stringify(player.gameState));
    let effectResult = '';
    try {
        effectResult = chosenCard.effect(player.gameState);
    } catch (e) {
        effectResult = `執行「${chosenCard.name}」效果時發生錯誤`;
    }

    addTransactionRecord(
        player.playerName, chosenCard, 'AI無人便利店分配',
        player.gameState.cash - stateBefore.cash, effectResult,
        stateBefore, player.gameState
    );

    // Notify picker
    ws.send(JSON.stringify({
        type: 'ai_store_card_taken',
        card: _serializable(chosenCard),
        effectMessage: effectResult,
        gameState: player.gameState
    }));

    // Broadcast to others
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🏪 ${player.playerName} 選了「${chosenCard.name}」！${effectResult}`
    }, ws);

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });

    // Move to next player
    drawState.currentIdx++;

    if (drawState.currentIdx >= drawState.turnOrder.length) {
        // All players have picked - end the draw
        console.log(`🏪 AI無人便利店抽卡結束`);
        broadcastToRoom(roomId, {
            type: 'ai_store_draw_end',
            message: '🏪 AI無人便利店抽卡完成！'
        });
        activeDraws.delete(drawState.initiatorId);
    } else {
        // Prompt next player
        _promptCurrentPlayer(drawState, rooms, broadcastToRoom);
    }
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _collectAllCards(CARD_TYPES) {
    const all = [];
    Object.values(CARD_TYPES).forEach(t => {
        (t.cards || []).forEach(c => all.push(c));
    });
    return all;
}

function _drawRandomCards(pool, count) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(c => {
        const copy = Object.create(c);
        copy.__taken = false;
        return copy;
    });
}

function _buildTurnOrder(room, initiator) {
    const order = [];

    // Initiator first
    order.push({
        playerId:   initiator.playerId,
        playerName: initiator.playerName
    });

    // Then others in Map order (join order)
    room.players.forEach(p => {
        if (p.playerId !== initiator.playerId) {
            order.push({
                playerId:   p.playerId,
                playerName: p.playerName
            });
        }
    });

    return order;
}

function _promptCurrentPlayer(drawState, rooms, broadcastToRoom) {
    const room = rooms.get(drawState.roomId);
    if (!room) return;

    const current = drawState.turnOrder[drawState.currentIdx];

    // Find that player's ws
    let currentWs = null;
    let currentPlayer = null;
    for (const [ws, p] of room.players) {
        if (p.playerId === current.playerId) {
            currentWs = ws;
            currentPlayer = p;
            break;
        }
    }

    if (!currentWs) {
        // Player disconnected - skip
        drawState.currentIdx++;
        if (drawState.currentIdx < drawState.turnOrder.length) {
            _promptCurrentPlayer(drawState, rooms, broadcastToRoom);
        }
        return;
    }

    // Build available cards list
    const availableCards = drawState.drawnCards.map((card, idx) => ({
        index:       idx,
        taken:       card.__taken,
        card: card.__taken ? null : _serializable(card)
    }));

    // Send picker prompt to current player
    currentWs.send(JSON.stringify({
        type:            'ai_store_pick_prompt',
        availableCards:  availableCards,
        yourTurn:        true,
        message:         `🏪 輪到你了！請從剩餘的 ${availableCards.filter(c => !c.taken).length} 張卡中選 1 張`
    }));

    // Notify others whose turn it is
    broadcastToRoom(drawState.roomId, {
        type:      'notification',
        message:   `🏪 輪到 ${current.playerName} 選卡...`
    }, currentWs);
}

function _serializable(card) {
    return {
        id:            card.id,
        name:          card.name,
        description:   card.description,
        image:         card.image,
        type:          card.type,
        cardType:      card.cardType || card.type,
        investmentCost: card.investmentCost || 0,
        energyCost:    card.energyCost || 0
    };
}

module.exports = { handleAIStoreDraw, handleAIStorePick };