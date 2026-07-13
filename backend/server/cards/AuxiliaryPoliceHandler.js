"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

/**
 * After Z10 (輔警) card is executed, this handler draws a police card
 * and lets the player choose: use it themselves or force it on another player.
 */
function handleAuxiliaryPoliceCard(ws, roomId, player, policeCards, rooms, broadcastToRoom) {
    const room = rooms.get(roomId);
    if (!room) return;

    if (policeCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無警察卡資料' }));
        return;
    }

    // Draw a random police card
    const card = policeCards[Math.floor(Math.random() * policeCards.length)];

    console.log(`👮 輔警功能: ${player.playerName} 抽到警察卡: ${card.name}`);

    // Build list of other players for the choice
    const otherPlayers = [];
    room.players.forEach((p, pWs) => {
        if (pWs !== ws) {
            otherPlayers.push({
                playerId: p.playerId,
                playerName: p.playerName
            });
        }
    });

    const serializableCard = {
        id: card.id,
        name: card.name,
        description: card.description,
        image: card.image,
        cardType: 'police',
        cardTypeName: '警察卡',
        cardTypeIcon: '👮'
    };

    // Save pending event
    if (!room.pendingAuxPoliceEvents) room.pendingAuxPoliceEvents = new Map();
    room.pendingAuxPoliceEvents.set(ws, {
        card: card,
        playerId: player.playerId,
        timestamp: Date.now()
    });

    // Send choice to player: use self or give to another player
    ws.send(JSON.stringify({
        type: 'auxiliary_police_choice',
        card: serializableCard,
        otherPlayers: otherPlayers,
        message: `👮 你的輔警身份讓你抽到了警察卡「${card.name}」！\n\n請選擇：\n1️⃣ 自己使用\n2️⃣ 強制給另一位玩家使用`
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `👮 ${player.playerName} 的輔警身份啟動，正在查看警察卡...`
    }, ws);
}

/**
 * Handle the player's choice: use police card on self or give to another player
 */
function handleAuxiliaryPoliceChoice(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingAuxPoliceEvents?.get(ws);
    if (!pendingEvent || !pendingEvent.card) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的輔警警察卡' }));
        return;
    }

    const card        = pendingEvent.card;
    const choice      = data.choice;      // 'self' or 'give'
    const targetId    = data.targetPlayerId;
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));

    if (choice === 'self') {
        // ── Use on self ───────────────────────────────────────────────────
        let effectResult = '';
        try {
            effectResult = card.effect(player.gameState);
        } catch (e) {
            effectResult = `執行「${card.name}」效果時發生錯誤`;
        }

        addTransactionRecord(
            player.playerName, card, '輔警自用警察卡',
            player.gameState.cash - stateBefore.cash, effectResult,
            stateBefore, player.gameState
        );

        ws.send(JSON.stringify({
            type: 'police_card_execute',
            card: _serializable(card),
            effectMessage: effectResult,
            gameState: player.gameState
        }));

        broadcastToRoom(roomId, {
            type: 'notification',
            message: `👮 ${player.playerName} 使用輔警身份，自用警察卡「${card.name}」！${effectResult}`
        }, ws);

        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: player.playerId,
            gameState: player.gameState
        });

        console.log(`✅ ${player.playerName} 輔警自用警察卡: ${card.name}`);

    } else if (choice === 'give' && targetId) {
        // ── Give to another player ────────────────────────────────────────
        let targetPlayer = null;
        let targetWs     = null;

        for (const [pWs, p] of room.players) {
            if (p.playerId === targetId) {
                targetPlayer = p;
                targetWs     = pWs;
                break;
            }
        }

        if (!targetPlayer) {
            ws.send(JSON.stringify({ type: 'error', message: '找不到目標玩家' }));
            room.pendingAuxPoliceEvents.delete(ws);
            return;
        }

        const targetStateBefore = JSON.parse(JSON.stringify(targetPlayer.gameState));
        let effectResult = '';
        try {
            effectResult = card.effect(targetPlayer.gameState);
        } catch (e) {
            effectResult = `執行「${card.name}」效果時發生錯誤`;
        }

        // Record for the giver
        addTransactionRecord(
            player.playerName,
            { name: `輔警強制給予「${card.name}」`, type: 'police', id: card.id },
            '輔警強制給予', 0,
            `將警察卡「${card.name}」強制給予 ${targetPlayer.playerName}`,
            null, player.gameState
        );

        // Record for the receiver
        addTransactionRecord(
            targetPlayer.playerName, card, '被輔警強制使用',
            targetPlayer.gameState.cash - targetStateBefore.cash, effectResult,
            targetStateBefore, targetPlayer.gameState
        );

        // Notify giver
        ws.send(JSON.stringify({
            type: 'notification',
            message: `👮 你將警察卡「${card.name}」強制給予了 ${targetPlayer.playerName}！`
        }));

        // Notify receiver
        if (targetWs) {
            targetWs.send(JSON.stringify({
                type: 'police_card_execute',
                card: _serializable(card),
                effectMessage: `${player.playerName} 的輔警身份強制你使用警察卡「${card.name}」！${effectResult}`,
                gameState: targetPlayer.gameState
            }));
        }

        // Broadcast
        broadcastToRoom(roomId, {
            type: 'notification',
            message: `👮 ${player.playerName} 使用輔警身份，將警察卡「${card.name}」強制給予 ${targetPlayer.playerName}！`
        }, ws);

        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: targetPlayer.playerId,
            gameState: targetPlayer.gameState
        });

        console.log(`✅ ${player.playerName} 輔警強制給予 ${targetPlayer.playerName} 警察卡: ${card.name}`);

    } else {
        ws.send(JSON.stringify({ type: 'error', message: '無效的選擇' }));
    }

    // Cleanup
    room.pendingAuxPoliceEvents.delete(ws);
}

function _serializable(card) {
    return {
        id: card.id, name: card.name, description: card.description,
        image: card.image, cardType: 'police', cardTypeName: '警察卡', cardTypeIcon: '👮'
    };
}

module.exports = { handleAuxiliaryPoliceCard, handleAuxiliaryPoliceChoice };