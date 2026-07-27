"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const { broadcastCardReveal } = require('../utils/CardBroadcastHelper.js');

function drawVolunteerCard(ws, state, roomId, player, volunteerCards, room, broadcastToRoom, isExactLanding = false) {
    if (volunteerCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無義工卡資料' }));
        return;
    }

    const card = volunteerCards[Math.floor(Math.random() * volunteerCards.length)];
    console.log(`🤝 ${player.playerName} 抽到義工卡: ${card.name}`);

    const serializableCard = _serializable(card);

    if (card.requiresDonation) {
        if (!room.pendingVolunteerEvents) room.pendingVolunteerEvents = new Map();
        room.pendingVolunteerEvents.set(ws, {
            type: 'volunteer_card',
            card,
            playerId: player.playerId,
            playerName: player.playerName,
            timestamp: Date.now(),
            isExactLanding,
            donationPhase: 'awaiting_confirm'  // ✅ Track phase
        });
        ws.send(JSON.stringify({
            type: 'volunteer_card_draw',
            card: serializableCard,
            cardData: {
                requiresDonation: true,
                donationAmount: card.donationAmount || 2000,
                donationType: card.donationType || 'cash'
            }
        }));
        return;
    }

    if (card.requiresChoice) {
        if (!room.pendingVolunteerEvents) room.pendingVolunteerEvents = new Map();
        room.pendingVolunteerEvents.set(ws, {
            type: 'volunteer_card_choice',
            card,
            playerId: player.playerId,
            playerName: player.playerName,
            timestamp: Date.now(),
            isExactLanding
        });
        ws.send(JSON.stringify({
            type: 'volunteer_card_choice',
            card: serializableCard,
            options: [
                { id: 'cash',      name: '💰 獲得 $3,000 元',    description: '直接獲得現金獎勵' },
                { id: 'volunteer', name: '⭐ 獲得 1 次義工資格', description: '增加義工次數' }
            ]
        }));
        return;
    }

    // Direct execute (V07 etc - no donation needed)
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));
    let effectResult  = '';
    try {
        effectResult = card.effect(player.gameState);
    } catch (e) {
        effectResult = `執行「${card.name}」`;
    }

    addTransactionRecord(player.playerName, card, '義工卡',
        player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

    const dr = _diceResult(player, { name: "義工卡", type: "volunteer" });
    ws.send(JSON.stringify(dr));
    broadcastToRoom(roomId, dr, ws);
    ws.send(JSON.stringify({
        type: 'volunteer_card_execute',
        card: serializableCard,
        effectMessage: effectResult,
        gameState: player.gameState
    }));
    broadcastCardReveal({
        roomId,
        drawerWs: ws,
        drawerName: player.playerName,
        drawerId: player.playerId,
        card,
        action: '抽到義工卡',
        effectMessage: effectResult,
        broadcastToRoom
    });
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🤝 ${player.playerName} 獲得義工卡「${card.name}」！${effectResult}`
    }, ws);
    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: player.playerId, gameState: player.gameState
    });
}

// ==================== Donation flow (V01-V06) ====================

function executeVolunteerDonation(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingVolunteerEvents?.get(ws);
    if (!pendingEvent || !pendingEvent.card || !pendingEvent.card.requiresDonation) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的義工卡' }));
        return;
    }

    const card = pendingEvent.card;

    // ── Phase 1: First call - get donation request from card effect ──────
    if (pendingEvent.donationPhase === 'awaiting_confirm') {
        console.log(`🤝 ${player.playerName} 確認執行義工卡: ${card.name}`);

        const stateBefore = JSON.parse(JSON.stringify(player.gameState));
        let effectResult;

        try {
            effectResult = card.effect(player.gameState, room, player, ws, roomId);
        } catch (e) {
            console.error('Volunteer card effect error:', e);
            effectResult = `執行「${card.name}」效果時發生錯誤`;
        }

        // Check if effect returned a string (V01 direct) or object (V02-V06 collect)
        if (typeof effectResult === 'string') {
            // ✅ Direct execution (V01 - single donation, already done in effect)
            addTransactionRecord(player.playerName, card, '義工卡',
                player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

            _sendCardResult(ws, card, effectResult, player, roomId, broadcastToRoom);
            _broadcastAllStates(room, roomId, broadcastToRoom);
            room.pendingVolunteerEvents.delete(ws);
            return;
        }

        // ✅ Effect returned an object requesting donation collection
        if (effectResult && effectResult.type === 'collect_donations') {
            console.log(`🤝 ${card.name}: 收集捐款回應 (${effectResult.playersToAsk.length} 位玩家)`);

            // Update phase
            pendingEvent.donationPhase = 'collecting';
            pendingEvent.donationRequest = effectResult;
            pendingEvent.donationResponses = {};

            // Send donation prompt to each player
            effectResult.playersToAsk.forEach(({ playerName: pName }) => {
                // Find player ws
                let targetWs = null;
                for (const [pWs, p] of room.players) {
                    if (p.playerName === pName) {
                        targetWs = pWs;
                        break;
                    }
                }

                if (targetWs && targetWs.readyState === 1) {
                    const donationType = effectResult.donationType || 'cash';
                    const unit = donationType === 'energy' ? '精力' : '元';

                    targetWs.send(JSON.stringify({
                        type: 'volunteer_donation_prompt',
                        cardId: effectResult.cardId,
                        cardName: effectResult.cardName,
                        donationAmount: effectResult.donationAmount,
                        donationType,
                        targetPlayer: effectResult.targetPlayer,
                        message: `🤝 ${player.playerName} 發起「${effectResult.cardName}」！\n` +
                            `你是否願意捐贈 ${effectResult.donationAmount} ${unit}` +
                            `${effectResult.targetPlayer ? ` 給 ${effectResult.targetPlayer}` : ''}？`
                    }));
                }
            });

            // Notify initiator
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🤝 等待其他玩家回應捐贈請求...`
            }));

            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🤝 ${player.playerName} 發起「${card.name}」義工活動，等待玩家回應...`
            }, ws);

            // Auto-finalize after 30 seconds
            setTimeout(() => {
                const pe = room.pendingVolunteerEvents?.get(ws);
                if (pe && pe.donationPhase === 'collecting') {
                    console.log(`⏰ 義工卡捐贈超時，自動結算`);
                    _finalizeDonation(ws, roomId, rooms, broadcastToRoom);
                }
            }, 30000);

            return;
        }

        // Unknown return type
        console.error('Unknown volunteer effect return type:', effectResult);
        room.pendingVolunteerEvents.delete(ws);
        return;
    }

    // Should not reach here in normal flow
    ws.send(JSON.stringify({ type: 'error', message: '義工卡狀態異常' }));
}

// ==================== Handle individual donation response ====================

function handleVolunteerDonationResponse(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    // Find the pending volunteer event (it's on the INITIATOR's ws, not this player's)
    let initiatorWs = null;
    let pendingEvent = null;

    for (const [iWs, pe] of (room.pendingVolunteerEvents || new Map())) {
        if (pe.donationPhase === 'collecting' &&
            pe.donationRequest?.cardId === data.cardId) {
            initiatorWs = iWs;
            pendingEvent = pe;
            break;
        }
    }

    if (!pendingEvent) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到對應的義工活動' }));
        return;
    }

    // Record this player's response
    pendingEvent.donationResponses[player.playerName] = data.willDonate === true;

    console.log(`🤝 ${player.playerName} 回應義工捐贈: ${data.willDonate ? '願意' : '不願意'}`);

    // Notify progress
    const totalAsked = pendingEvent.donationRequest.playersToAsk.length;
    const totalResponded = Object.keys(pendingEvent.donationResponses).length;

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🤝 ${player.playerName} 已回應 (${totalResponded}/${totalAsked})`
    });

    // Check if all responded
    if (totalResponded >= totalAsked) {
        _finalizeDonation(initiatorWs, roomId, rooms, broadcastToRoom);
    }
}

// ==================== Finalize donation collection ====================

function _finalizeDonation(initiatorWs, roomId, rooms, broadcastToRoom) {
    const room = rooms.get(roomId);
    if (!room) return;

    const pendingEvent = room.pendingVolunteerEvents?.get(initiatorWs);
    if (!pendingEvent || pendingEvent.donationPhase !== 'collecting') return;

    const card = pendingEvent.card;
    const initiator = room.players.get(initiatorWs);
    if (!initiator) return;

    console.log(`🤝 結算義工卡捐贈: ${card.name}`);

    // Mark any non-responded players as declined
    pendingEvent.donationRequest.playersToAsk.forEach(({ playerName }) => {
        if (!(playerName in pendingEvent.donationResponses)) {
            pendingEvent.donationResponses[playerName] = false;
        }
    });

    // Call the card effect again with donation responses
    const stateBefore = JSON.parse(JSON.stringify(initiator.gameState));
    let effectResult = '';

    try {
        effectResult = card.effect(
            initiator.gameState,
            room,
            initiator,
            initiatorWs,
            roomId,
            pendingEvent.donationResponses
        );
    } catch (e) {
        console.error('Volunteer donation finalize error:', e);
        effectResult = `執行「${card.name}」效果時發生錯誤`;
    }

    // Should be a string this time (second call with responses)
    if (typeof effectResult !== 'string') {
        effectResult = `義工活動「${card.name}」完成`;
    }

    // Record transaction for initiator
    addTransactionRecord(
        initiator.playerName, card, '義工卡',
        initiator.gameState.cash - stateBefore.cash,
        effectResult, stateBefore, initiator.gameState
    );

    // Record transactions for donors
    const donationType = pendingEvent.donationRequest.donationType || 'cash';
    const donationAmount = pendingEvent.donationRequest.donationAmount;

    for (const [playerName, willDonate] of Object.entries(pendingEvent.donationResponses)) {
        if (!willDonate) continue;

        let donorPlayer = null;
        for (const [, p] of room.players) {
            if (p.playerName === playerName) {
                donorPlayer = p;
                break;
            }
        }

        if (donorPlayer) {
            const unit = donationType === 'energy' ? '精力' : '元';
            addTransactionRecord(
                playerName,
                { name: `${card.name} 捐贈`, type: 'volunteer', id: card.id },
                '義工捐贈',
                donationType === 'cash' ? -donationAmount : 0,
                `捐贈 ${donationAmount} ${unit}`,
                null,
                donorPlayer.gameState
            );
        }
    }

    // Send result to initiator
    _sendCardResult(initiatorWs, card, effectResult, initiator, roomId, broadcastToRoom);

    // Update ALL players' states (donors' cash/energy changed too)
    _broadcastAllStates(room, roomId, broadcastToRoom);

    // Cleanup
    room.pendingVolunteerEvents.delete(initiatorWs);

    console.log(`✅ 義工卡捐贈結算完成: ${card.name}`);
}

// ==================== Choice flow (if needed in future) ====================

function executeVolunteerChoice(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingVolunteerEvents?.get(ws);
    if (!pendingEvent?.card?.requiresChoice) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的義工卡' }));
        return;
    }

    const card   = pendingEvent.card;
    const choice = data.choice;

    if (!choice || !['cash', 'volunteer'].includes(choice)) {
        ws.send(JSON.stringify({ type: 'error', message: '無效的選擇' }));
        return;
    }

    const stateBefore = JSON.parse(JSON.stringify(player.gameState));
    let effectResult  = '';
    try {
        effectResult = card.effect(player.gameState, choice);
    } catch (e) {
        effectResult = `執行「${card.name}」`;
    }

    addTransactionRecord(player.playerName, card, '義工卡',
        player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

    _sendCardResult(ws, card, effectResult, player, roomId, broadcastToRoom);
    room.pendingVolunteerEvents.delete(ws);
}

// ==================== Private helpers ====================

function _sendCardResult(ws, card, effectResult, player, roomId, broadcastToRoom) {
    ws.send(JSON.stringify({
        type: 'volunteer_card_execute',
        card: _serializable(card),
        effectMessage: effectResult,
        gameState: player.gameState
    }));

    broadcastCardReveal({
        roomId,
        drawerWs: ws,
        drawerName: player.playerName,
        drawerId: player.playerId,
        card,
        action: '抽到義工卡',
        effectMessage: effectResult,
        broadcastToRoom
    });

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🤝 ${player.playerName} 執行義工卡「${card.name}」！`
    }, ws);

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });
}

function _broadcastAllStates(room, roomId, broadcastToRoom) {
    room.players.forEach((p) => {
        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: p.playerId,
            gameState: p.gameState
        });
    });
}

function _serializable(card) {
    return {
        id: card.id, name: card.name, description: card.description, image: card.image,
        cardType: 'volunteer', cardTypeName: '義工卡', cardTypeIcon: '🤝',
        requiresDonation: card.requiresDonation || false,
        requiresChoice:   card.requiresChoice   || false
    };
}

function _diceResult(player, tile) {
    return {
        type: 'dice_result', playerId: player.playerId, playerName: player.playerName,
        steps: 0, originalSteps: 0, multiplierUsed: false,
        gameState: player.gameState, tile, eventMessage: null, multiplierMessage: ''
    };
}

module.exports = {
    drawVolunteerCard,
    executeVolunteerDonation,
    executeVolunteerChoice,
    handleVolunteerDonationResponse
};