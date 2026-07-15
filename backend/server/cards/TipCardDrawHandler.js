"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

/**
 * Generic "draw N tip cards, pick M" handler.
 * Currently used by C07 (無人機快遞) to draw 3 and pick 1.
 * Can be reused by other cards with different N/M counts.
 */

const activeDraws = new Map(); // playerId → draw state

// ── Entry point ───────────────────────────────────────────────────────────────

function handleTipCardDraw(ws, roomId, player, tipCards, drawCount, pickCount, broadcastToRoom) {
    if (!tipCards || tipCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '⚠️ 暫無錦囊卡資料' }));
        return;
    }

    const actualDrawCount = Math.min(drawCount, tipCards.length);
    const drawnCards      = _drawRandomCards(tipCards, actualDrawCount);

    const drawState = {
        playerId:   player.playerId,
        roomId:     roomId,
        drawnCards: drawnCards,
        pickCount:  pickCount,
        pickedCount: 0
    };
    activeDraws.set(player.playerId, drawState);

    console.log(`🎁 錦囊卡抽選: ${player.playerName} 抽 ${actualDrawCount} 張選 ${pickCount} 張`);

    // Send prompt to player
    ws.send(JSON.stringify({
        type: 'tip_card_pick_prompt',
        availableCards: drawnCards.map((card, idx) => ({
            index: idx,
            taken: false,
            card:  _serializable(card)
        })),
        drawCount:  actualDrawCount,
        pickCount:  pickCount,
        message:    `🎁 你抽到 ${actualDrawCount} 張錦囊卡！請選 ${pickCount} 張執行`
    }));

    // Notify others
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🎁 ${player.playerName} 正在從 ${actualDrawCount} 張錦囊卡中選擇 ${pickCount} 張...`
    }, ws);
}

// ── Handle player picking a card ──────────────────────────────────────────────

function handleTipCardPick(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const drawState = activeDraws.get(player.playerId);
    if (!drawState) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待抽取的錦囊卡' }));
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

    // Mark as taken and execute
    const chosenCard = drawState.drawnCards[cardIdx];
    chosenCard.__taken = true;

    const stateBefore = JSON.parse(JSON.stringify(player.gameState));
    let effectResult = '';
    try {
        // Tip cards may have team scope needing extra params
        if (chosenCard.scope === 'team') {
            effectResult = chosenCard.effect(player.gameState, room, player, ws, roomId);
        } else {
            effectResult = chosenCard.effect(player.gameState);
        }
    } catch (e) {
        effectResult = `執行「${chosenCard.name}」效果時發生錯誤`;
    }

    addTransactionRecord(
        player.playerName,
        chosenCard,
        '無人機快遞錦囊選取',
        player.gameState.cash - stateBefore.cash,
        effectResult,
        stateBefore,
        player.gameState
    );

    drawState.pickedCount++;

    // Notify picker
    ws.send(JSON.stringify({
        type: 'tip_card_taken',
        card: _serializable(chosenCard),
        effectMessage: effectResult,
        gameState: player.gameState
    }));

    // Broadcast to others
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🎁 ${player.playerName} 選了錦囊卡「${chosenCard.name}」！${effectResult}`
    }, ws);

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });

    // Check if done
    if (drawState.pickedCount >= drawState.pickCount) {
        // Finished picking
        ws.send(JSON.stringify({
            type: 'tip_card_draw_end',
            message: `🎁 錦囊卡選取完成！`
        }));
        activeDraws.delete(player.playerId);
        console.log(`✅ 錦囊卡選取結束: ${player.playerName}`);
    } else {
        // Need to pick more - update prompt
        ws.send(JSON.stringify({
            type: 'tip_card_pick_prompt',
            availableCards: drawState.drawnCards.map((card, idx) => ({
                index: idx,
                taken: card.__taken,
                card:  card.__taken ? null : _serializable(card)
            })),
            drawCount:  drawState.drawnCards.length,
            pickCount:  drawState.pickCount - drawState.pickedCount,
            message:    `🎁 還需選 ${drawState.pickCount - drawState.pickedCount} 張`
        }));
    }
}

// ── Cancel (player closes modal without picking) ──────────────────────────────

function handleTipCardCancel(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const drawState = activeDraws.get(player.playerId);
    if (!drawState) return;

    activeDraws.delete(player.playerId);
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🎁 ${player.playerName} 放棄了錦囊卡選取`
    });
}

// ── Private ───────────────────────────────────────────────────────────────────

function _drawRandomCards(pool, count) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(c => {
        const copy = Object.create(c);
        copy.__taken = false;
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

module.exports = { handleTipCardDraw, handleTipCardPick, handleTipCardCancel };