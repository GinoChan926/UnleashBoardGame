"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

/**
 * Draw N random tip cards for a player.
 * Player sees each card one at a time and clicks "Next" to auto-execute
 * and proceed to the next card.
 *
 * State machine per player:
 *   { drawnCards: [...], currentIndex: 0, roomId }
 */
const activeDraws = new Map(); // playerId → draw state

function startAutoTipDraw(ws, roomId, player, tipCards, drawCount, broadcastToRoom) {
    if (!tipCards || tipCards.length === 0) {
        ws.send(JSON.stringify({
            type: 'notification',
            message: '⚠️ 暫無錦囊卡資料'
        }));
        return;
    }

    const actualCount = Math.min(drawCount, tipCards.length);
    const drawnCards  = _drawRandomCards(tipCards, actualCount);

    activeDraws.set(player.playerId, {
        drawnCards,
        currentIndex: 0,
        roomId
    });

    console.log(`🎁 大學飯堂錦囊自動抽卡: ${player.playerName} 抽 ${actualCount} 張`);

    // Notify start
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🎁 ${player.playerName} 的大學飯堂抽取了 ${actualCount} 張錦囊卡...`
    }, ws);

    // Show first card
    _showCurrentCard(ws, player, broadcastToRoom);
}

/**
 * Called when player clicks "Next" or "執行" in the modal.
 * Auto-executes the current card, then advances to the next one.
 */
function handleAutoTipDrawNext(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const drawState = activeDraws.get(player.playerId);
    if (!drawState) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的錦囊卡' }));
        return;
    }

    const currentCard = drawState.drawnCards[drawState.currentIndex];
    if (!currentCard) return;

    // Execute the current card
    const stateBefore  = JSON.parse(JSON.stringify(player.gameState));
    let effectResult = '';
    try {
        // Tip cards may have team scope needing extra params
        if (currentCard.scope === 'team') {
            effectResult = currentCard.effect(player.gameState, room, player, ws, roomId);
        } else {
            effectResult = currentCard.effect(player.gameState);
        }
    } catch (e) {
        effectResult = `執行「${currentCard.name}」效果時發生錯誤`;
    }

    addTransactionRecord(
        player.playerName,
        currentCard,
        '大學飯堂錦囊執行',
        player.gameState.cash - stateBefore.cash,
        effectResult,
        stateBefore,
        player.gameState
    );

    // Send execution result
    ws.send(JSON.stringify({
        type: 'auto_tip_card_executed',
        card: _serializable(currentCard),
        effectMessage: effectResult,
        cardIndex:  drawState.currentIndex + 1,
        totalCards: drawState.drawnCards.length,
        gameState:  player.gameState
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🎁 ${player.playerName} 的大學飯堂 (${drawState.currentIndex + 1}/${drawState.drawnCards.length}) 執行了錦囊卡「${currentCard.name}」`
    }, ws);

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });

    // Advance to next
    drawState.currentIndex++;

    if (drawState.currentIndex >= drawState.drawnCards.length) {
        // Done - send end message
        ws.send(JSON.stringify({
            type: 'auto_tip_draw_end',
            message: `🎁 大學飯堂錦囊抽卡完成！共執行 ${drawState.drawnCards.length} 張錦囊卡`
        }));
        activeDraws.delete(player.playerId);
        console.log(`✅ ${player.playerName} 完成大學飯堂錦囊抽卡`);
    } else {
        // Show next card - delay slightly so state update lands first
        setTimeout(() => _showCurrentCard(ws, player, broadcastToRoom), 300);
    }
}

// ── Private ───────────────────────────────────────────────────────────────────

function _showCurrentCard(ws, player, broadcastToRoom) {
    const drawState = activeDraws.get(player.playerId);
    if (!drawState) return;

    const card = drawState.drawnCards[drawState.currentIndex];
    if (!card) return;

    ws.send(JSON.stringify({
        type: 'auto_tip_card_show',
        card: _serializable(card),
        cardIndex:  drawState.currentIndex + 1,
        totalCards: drawState.drawnCards.length,
        message: `錦囊卡 ${drawState.currentIndex + 1}/${drawState.drawnCards.length}`
    }));
}

function _drawRandomCards(pool, count) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(c => {
        const copy = Object.create(c);
        return copy;
    });
}

function _serializable(card) {
    return {
        id:          card.id,
        name:        card.name,
        description: card.description,
        image:       card.image,
        scope:       card.scope || 'personal',
        cardType:    'tip',
        cardTypeName: '錦囊卡',
        cardTypeIcon: '🎁'
    };
}

module.exports = { startAutoTipDraw, handleAutoTipDrawNext };