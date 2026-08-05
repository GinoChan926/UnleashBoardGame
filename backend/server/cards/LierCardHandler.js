"use strict";

const { addTransactionRecord }            = require('../records/TransactionRecorder.js');
const { checkAndNotifyEmotionalSupport }  = require('../systems/EmotionalSupportSystem.js');
const { getWsByPlayerId }                 = require('../utils/helpers.js');
const { broadcastCardReveal }             = require('../utils/CardBroadcastHelper.js');

function drawAndExecuteLierCard(ws, state, roomId, player, lierCards, broadcastToRoom, rooms) {
    const room = rooms.get(roomId);
    if (!room) return;

    if (lierCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無騙子卡資料' }));
        return;
    }

    // ── 保持警惕 cancellation ─────────────────────────────────────────────────
    if (player.gameState.lierCardCancellation > 0) {
        player.gameState.lierCardCancellation--;
        addTransactionRecord(player.playerName,
            { name: "保持警惕取消騙子卡", type: "tip", id: "IN10" },
            "取消騙子卡", 0,
            `「保持警惕」生效！剩餘 ${player.gameState.lierCardCancellation} 次`,
            null, player.gameState);

        const dr = _diceResult(player, { name: "騙子卡", type: "lier" });
        ws.send(JSON.stringify(dr));
        broadcastToRoom(roomId, dr, ws);
        ws.send(JSON.stringify({
            type: 'notification',
            message: `🛡️ 「保持警惕」生效！成功取消騙子卡！剩餘 ${player.gameState.lierCardCancellation} 次`
        }));
        broadcastToRoom(roomId, { type: 'state_updated', playerId: player.playerId, gameState: player.gameState });
        return;
    }

    const card        = lierCards[Math.floor(Math.random() * lierCards.length)];
    const isFraudCard = card.type === 'lier' || card.category === '騙子卡' ||
        /加密貨幣|P2P|信用卡/.test(card.name || '');

    const damageAmount = isFraudCard ? _estimateDamage(card, player.gameState) : 0;

    // ── Emotional support check ───────────────────────────────────────────────
    if (isFraudCard && damageAmount > 0) {
        const hasSupport = checkAndNotifyEmotionalSupport(
            room, { ws, player }, damageAmount, card.name, roomId, card,
            () => _executeWithoutDamage(ws, player, card, roomId, broadcastToRoom),
            () => continueWithShieldCheck()
        );
        if (hasSupport) return;
    }

    continueWithShieldCheck();

    function continueWithShieldCheck() {
        // ── Own fraud shield ──────────────────────────────────────────────────
        if (isFraudCard && player.gameState.fraudShield > 0) {
            player.gameState.fraudShield--;
            addTransactionRecord(player.playerName,
                { name: '防騙通行證', cardType: 'police' }, '防騙護盾', 0,
                `抵擋了「${card.name}」`, JSON.parse(JSON.stringify(player.gameState)), player.gameState);
            _sendShieldNotification(ws, roomId, player, card,
                `🛡️ 「防騙通行證」生效！抵擋了「${card.name}」！剩餘 ${player.gameState.fraudShield} 次`,
                broadcastToRoom);
            return;
        }

        // ── Volunteer helper shield ───────────────────────────────────────────
        if (isFraudCard) {
            for (const [otherWs, otherPlayer] of room.players) {
                if (otherWs !== ws && otherPlayer.gameState.volunteerShield > 0) {
                    otherPlayer.gameState.volunteerShield--;
                    addTransactionRecord(otherPlayer.playerName,
                        { name: '防騙教育義工', cardType: 'police' }, '義工幫助', 0,
                        `幫助 ${player.playerName} 抵擋「${card.name}」`,
                        null, otherPlayer.gameState);
                    addTransactionRecord(player.playerName,
                        { name: '防騙教育受益', cardType: 'police' }, '義工幫助受益', 0,
                        `獲得 ${otherPlayer.playerName} 幫助`,
                        null, player.gameState);

                    ws.send(JSON.stringify({
                        type: 'notification',
                        message: `👮 ${otherPlayer.playerName} 運用義工資格幫你抵擋了「${card.name}」！`
                    }));
                    const helperWs = getWsByPlayerId(room, otherPlayer.playerId);
                    helperWs?.send(JSON.stringify({
                        type: 'notification',
                        message: `👮 你運用義工資格幫助 ${player.playerName} 抵擋了「${card.name}」！剩餘 ${otherPlayer.gameState.volunteerShield} 次`
                    }));

                    const dr = _diceResult(player, { name: "騙子卡", type: "lier" });
                    ws.send(JSON.stringify(dr));
                    broadcastToRoom(roomId, dr, ws);
                    broadcastToRoom(roomId, { type: 'state_updated', playerId: player.playerId, gameState: player.gameState });
                    return;
                }
            }
        }

        // ── No shield: execute card ───────────────────────────────────────────
        const stateBefore  = JSON.parse(JSON.stringify(player.gameState));
        const effectResult = card.effect(player.gameState);

        addTransactionRecord(player.playerName, card, '騙子卡',
            player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

        const serializableCard = _serializable(card);
        const dr = _diceResult(player, { name: "騙子卡", type: "lier" });
        ws.send(JSON.stringify(dr));
        broadcastToRoom(roomId, dr, ws);

        ws.send(JSON.stringify({
            type:          'lier_card_auto_execute',
            card:          serializableCard,
            effectMessage: effectResult,
            gameState:     player.gameState
        }));

        broadcastCardReveal({
            roomId,
            drawerWs:      ws,
            drawerName:    player.playerName,
            drawerId:      player.playerId,
            card,
            action:        '抽到騙子卡',
            effectMessage: effectResult,
            broadcastToRoom
        });

        broadcastToRoom(roomId, {
            type:    'notification',
            message: `🎭 ${player.playerName} 踩中騙子卡「${card.name}」！${effectResult}`
        }, ws);

        broadcastToRoom(roomId, {
            type:      'state_updated',
            playerId:  player.playerId,
            gameState: player.gameState
        });

        console.log(`✅ ${player.playerName} 自動執行了騙子卡: ${card.name}`);
    }
}

// ── Manual draw (lier tile - give player the card to inspect) ─────────────────

function drawLierCard(ws, state, roomId, player, lierCards, room) {
    if (lierCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無騙子卡資料' }));
        return;
    }
    const card     = lierCards[Math.floor(Math.random() * lierCards.length)];
    const fullCard = { ...card, cardType: 'lier' };
    if (card.effect) fullCard.effect = card.effect.bind(card);

    if (!room.pendingEvents) room.pendingEvents = new Map();
    room.pendingEvents.set(ws, { type: 'lier_card', card: fullCard, playerId: player.playerId, timestamp: Date.now() });

    ws.send(JSON.stringify({ type: 'lier_card_draw', card: _serializable(card) }));
    console.log(`🎭 ${player.playerName} 抽到騙子卡: ${card.name}`);
}

function executeLierCard(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingEvents?.get(ws);
    if (!pendingEvent || pendingEvent.type !== 'lier_card') {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的騙子卡' }));
        return;
    }

    const card         = pendingEvent.card;
    const stateBefore  = JSON.parse(JSON.stringify(player.gameState));
    const effectResult = card.effect(player.gameState);

    addTransactionRecord(player.playerName, card, '騙子卡',
        player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

    broadcastToRoom(roomId, {
        type:          'lier_card_executed',
        playerId:      player.playerId,
        playerName:    player.playerName,
        cardName:      card.name,
        effectMessage: effectResult,
        gameState:     player.gameState
    });

    ws.send(JSON.stringify({
        type:          'lier_card_result',
        cardName:      card.name,
        effectMessage: effectResult,
        gameState:     player.gameState
    }));

    room.pendingEvents.delete(ws);
    broadcastToRoom(roomId, { type: 'state_updated', playerId: player.playerId, gameState: player.gameState });
}

// ── Private ───────────────────────────────────────────────────────────────────

function _estimateDamage(card, state) {
    const id = card.id || '';
    if (id === 'SC01') return 3000;
    if (id === 'SC02') return Math.max(100, Math.floor(state.cash * 0.1));
    if (id === 'SC03') return 1000;
    if (id === 'SC04') return 30000;
    if (id === 'SC07') return 20000;
    return Math.min(50000, Math.max(1000, Math.floor(state.cash * 0.1)));
}

function _executeWithoutDamage(ws, player, card, roomId, broadcastToRoom) {
    // ✅ fixed: define effectMessage in this scope
    const effectMessage = `💝 情緒支援生效！抵銷了「${card.name}」的傷害！`;

    const dr = _diceResult(player, { name: "騙子卡", type: "lier" });
    ws.send(JSON.stringify(dr));
    broadcastToRoom(roomId, dr, ws);

    ws.send(JSON.stringify({
        type:          'lier_card_auto_execute',
        card:          _serializable(card),
        effectMessage,
        gameState:     player.gameState
    }));

    broadcastCardReveal({
        roomId,
        drawerWs:      ws,
        drawerName:    player.playerName,
        drawerId:      player.playerId,
        card,
        action:        '抽到騙子卡',
        effectMessage,    // ✅ fixed: use local effectMessage
        broadcastToRoom
    });

    broadcastToRoom(roomId, {
        type:      'state_updated',
        playerId:  player.playerId,
        gameState: player.gameState
    });
}

function _sendShieldNotification(ws, roomId, player, card, msg, broadcastToRoom) {
    const dr = _diceResult(player, { name: "騙子卡", type: "lier" });
    ws.send(JSON.stringify(dr));
    broadcastToRoom(roomId, dr, ws);
    ws.send(JSON.stringify({
        type:            'lier_card_shield_used',
        cardName:        card.name,
        shieldMessage:   msg,
        remainingShield: player.gameState.fraudShield,
        gameState:       player.gameState
    }));
}

function _diceResult(player, tile) {
    return {
        type: 'dice_result', playerId: player.playerId, playerName: player.playerName,
        steps: 0, originalSteps: 0, multiplierUsed: false,
        gameState: player.gameState, tile, eventMessage: null, multiplierMessage: ''
    };
}

function _serializable(card) {
    return {
        id: card.id, name: card.name, description: card.description,
        image: card.image, cardType: 'lier', cardTypeName: '騙子卡', cardTypeIcon: '🎭'
    };
}

module.exports = { drawAndExecuteLierCard, drawLierCard, executeLierCard };