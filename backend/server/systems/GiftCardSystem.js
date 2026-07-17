"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

const pendingGifts = new Map();  // playerId → { roomId }

/**
 * IN13 - Player picks another player to gift a chance card.
 * Recipient will see a card type selection modal for free (already paid by giver).
 */
function startGiftCardFlow(ws, roomId, giver, CARD_TYPES, broadcastToRoom, rooms) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Find other players
    const otherPlayers = [];
    room.players.forEach((p, pWs) => {
        if (p.playerId !== giver.playerId) {
            otherPlayers.push({
                playerId:   p.playerId,
                playerName: p.playerName
            });
        }
    });

    if (otherPlayers.length === 0) {
        ws.send(JSON.stringify({
            type: 'notification',
            message: '🌹 沒有其他玩家可以贈送機會卡'
        }));
        return;
    }

    pendingGifts.set(giver.playerId, { roomId });

    ws.send(JSON.stringify({
        type: 'gift_card_prompt',
        otherPlayers,
        message: `🌹 選擇要贈送機會卡的玩家`
    }));

    console.log(`🌹 ${giver.playerName} 準備贈送機會卡`);
}

/**
 * Handle giver's choice of target player.
 */
function handleGiftCardTarget(ws, data, roomId, rooms, broadcastToRoom, CARD_TYPES) {
    const room  = rooms.get(roomId);
    const giver = room?.players.get(ws);
    if (!room || !giver) return;

    const pending = pendingGifts.get(giver.playerId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的贈送' }));
        return;
    }

    // Find target
    let targetPlayer = null;
    let targetWs = null;
    for (const [pWs, p] of room.players) {
        if (p.playerId === data.targetPlayerId) {
            targetPlayer = p;
            targetWs = pWs;
            break;
        }
    }

    if (!targetPlayer) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到目標玩家' }));
        pendingGifts.delete(giver.playerId);
        return;
    }

    // Record transactions
    addTransactionRecord(
        giver.playerName,
        { name: '贈人玫瑰 - 贈送機會卡', type: 'tip', id: 'IN13' },
        '贈送機會卡',
        0,
        `贈送機會卡給 ${targetPlayer.playerName}`,
        null,
        giver.gameState
    );

    addTransactionRecord(
        targetPlayer.playerName,
        { name: '收到贈送機會卡', type: 'tip', id: 'IN13' },
        '收到贈送',
        0,
        `收到 ${giver.playerName} 贈送的機會卡`,
        null,
        targetPlayer.gameState
    );

    // Notify giver
    ws.send(JSON.stringify({
        type: 'notification',
        message: `🌹 你成功贈送機會卡給 ${targetPlayer.playerName}！`
    }));

    // Trigger card type selection for the recipient (marked as free/gifted)
    if (targetWs) {
        const cardTypes = Object.values(CARD_TYPES).map(t => ({
            id: t.id,
            name: t.name,
            icon: t.icon,
            color: t.color,
            count: t.cards.length
        }));

        targetWs.send(JSON.stringify({
            type: 'card_type_selection',
            cardTypes,
            canAfford: true,     // Free for recipient
            isGifted: true,
            giftedBy: giver.playerName
        }));

        targetWs.send(JSON.stringify({
            type: 'notification',
            message: `🌹 ${giver.playerName} 贈送了一張機會卡給你！請選擇機會卡類型`
        }));

        // Set up pending event marked as pre-paid
        if (!room.pendingEvents) room.pendingEvents = new Map();
        room.pendingEvents.set(targetWs, {
            type: 'opportunity_card',
            card: null,
            cardType: null,
            playerId: targetPlayer.playerId,
            purchased: true,     // Pre-paid by gift
            isGifted: true,
            giftedBy: giver.playerName,
            timestamp: Date.now()
        });
    }

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🌹 ${giver.playerName} 贈送機會卡給 ${targetPlayer.playerName}！`
    }, ws);

    pendingGifts.delete(giver.playerId);
    console.log(`🌹 ${giver.playerName} 贈送機會卡給 ${targetPlayer.playerName}`);
}

module.exports = { startGiftCardFlow, handleGiftCardTarget };