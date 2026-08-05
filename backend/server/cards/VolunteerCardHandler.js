"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const { broadcastCardReveal }  = require('../utils/CardBroadcastHelper.js');

function drawVolunteerCard(ws, state, roomId, player, volunteerCards, room, broadcastToRoom, isExactLanding = false) {
    if (volunteerCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無義工卡資料' }));
        return;
    }

    const card = volunteerCards[Math.floor(Math.random() * volunteerCards.length)];
    console.log(`🤝 ${player.playerName} 抽到義工卡: ${card.name}`);

    const serializableCard = _serializable(card);

    // ✅ Broadcast card reveal IMMEDIATELY when drawn (before donation flow)
    broadcastCardReveal({
        roomId,
        drawerWs: ws,
        drawerName: player.playerName,
        drawerId: player.playerId,
        card,
        action: '抽到義工卡',
        effectMessage: card.description || card.getEffectDescription?.() || '',
        broadcastToRoom
    });

    if (card.requiresDonation) {
        if (!room.pendingVolunteerEvents) room.pendingVolunteerEvents = new Map();
        room.pendingVolunteerEvents.set(ws, {
            type: 'volunteer_card',
            card,
            playerId: player.playerId,
            playerName: player.playerName,
            timestamp: Date.now(),
            isExactLanding,
            donationPhase: 'awaiting_confirm'
        });

        console.log(`🔍 Set pendingVolunteerEvent for player: ${player.playerName}`);
        console.log(`🔍 Card requiresDonation: ${card.requiresDonation}`);
        console.log(`🔍 room.pendingVolunteerEvents size: ${room.pendingVolunteerEvents.size}`);

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

    // Direct execute (V07 etc)
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

    // ✅ Use _sendCardResultNoReveal since we already broadcast above
    _sendCardResultNoReveal(ws, card, effectResult, player, roomId, broadcastToRoom);
    _broadcastAllStates(room, roomId, broadcastToRoom);
}

// ==================== Donation flow ====================

function executeVolunteerDonation(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingVolunteerEvents?.get(ws);

    console.log(`🔍 executeVolunteerDonation called by ${player.playerName}`);
    console.log(`🔍 pendingEvent: ${pendingEvent ? 'found' : 'NOT FOUND'}`);
    console.log(`🔍 pendingEvent phase: ${pendingEvent?.donationPhase}`);
    console.log(`🔍 room.pendingVolunteerEvents size: ${room.pendingVolunteerEvents?.size}`);

    if (!pendingEvent || !pendingEvent.card || !pendingEvent.card.requiresDonation) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的義工卡' }));
        return;
    }

    const card = pendingEvent.card;

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

        console.log(`🔍 effectResult type: ${typeof effectResult}`);
        console.log(`🔍 effectResult:`, effectResult);

        // Direct string result - execute immediately (V01 style)
        if (typeof effectResult === 'string') {
            addTransactionRecord(player.playerName, card, '義工卡',
                player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

            _sendCardResultNoReveal(ws, card, effectResult, player, roomId, broadcastToRoom);
            _broadcastAllStates(room, roomId, broadcastToRoom);
            room.pendingVolunteerEvents.delete(ws);
            return;
        }

        // collect_donations flow (V02-V06)
        if (effectResult && effectResult.type === 'collect_donations') {
            console.log(`🤝 ${card.name}: 收集捐款回應 (${effectResult.playersToAsk.length} 位玩家)`);

            // ✅ No players to ask - finalize immediately
            if (effectResult.playersToAsk.length === 0) {
                console.log(`🤝 沒有其他玩家，直接結算`);

                let finalResult;
                try {
                    finalResult = card.effect(
                        player.gameState, room, player, ws, roomId,
                        {}
                    );
                } catch (e) {
                    console.error('Volunteer immediate finalize error:', e);
                    finalResult = `執行「${card.name}」`;
                }

                if (typeof finalResult !== 'string') {
                    finalResult = `義工活動「${card.name}」完成`;
                }

                addTransactionRecord(
                    player.playerName, card, '義工卡',
                    player.gameState.cash - stateBefore.cash,
                    finalResult, stateBefore, player.gameState
                );

                _sendCardResultNoReveal(ws, card, finalResult, player, roomId, broadcastToRoom);
                _broadcastAllStates(room, roomId, broadcastToRoom);
                room.pendingVolunteerEvents.delete(ws);
                return;
            }

            // Update phase
            pendingEvent.donationPhase     = 'collecting';
            pendingEvent.donationRequest   = effectResult;
            pendingEvent.donationResponses = {};

            // ✅ Send prompt to each player WITH validation info
            effectResult.playersToAsk.forEach(({ playerName: pName }) => {
                let targetWs    = null;
                let targetPlayer = null;
                for (const [pWs, p] of room.players) {
                    if (p.playerName === pName) {
                        targetWs     = pWs;
                        targetPlayer = p;
                        break;
                    }
                }

                if (targetWs && targetWs.readyState === 1) {
                    const donationType = effectResult.donationType || 'cash';
                    const unit = donationType === 'energy' ? '精力' : '元';

                    // ✅ Check if player can afford the donation
                    const canAfford = donationType === 'energy'
                        ? (targetPlayer.gameState.energy >= effectResult.donationAmount)
                        : (targetPlayer.gameState.cash >= effectResult.donationAmount);

                    targetWs.send(JSON.stringify({
                        type: 'volunteer_donation_prompt',
                        cardId: effectResult.cardId,
                        cardName: effectResult.cardName,
                        donationAmount: effectResult.donationAmount,
                        donationType,
                        targetPlayer: effectResult.targetPlayer,
                        canAfford,  // ✅ NEW: tell frontend if player can afford
                        currentAmount: donationType === 'energy'
                            ? targetPlayer.gameState.energy
                            : targetPlayer.gameState.cash,
                        message: `🤝 ${player.playerName} 發起「${effectResult.cardName}」！` +
                            `你是否願意捐贈 ${effectResult.donationAmount} ${unit}` +
                            `${effectResult.targetPlayer ? ` 給 ${effectResult.targetPlayer}` : ''}？`
                    }));

                    console.log(`📤 已發送捐贈請求給 ${pName} (canAfford: ${canAfford})`);
                } else {
                    console.log(`⚠️ 玩家 ${pName} 離線，自動拒絕`);
                    pendingEvent.donationResponses[pName] = false;
                }
            });

            // ✅ Check if all already auto-declined
            const totalAsked     = effectResult.playersToAsk.length;
            const totalResponded = Object.keys(pendingEvent.donationResponses).length;

            if (totalResponded >= totalAsked) {
                console.log(`🤝 所有玩家已自動回應，直接結算`);
                _finalizeDonation(ws, roomId, rooms, broadcastToRoom);
                return;
            }

            ws.send(JSON.stringify({
                type: 'notification',
                message: `🤝 等待其他玩家回應捐贈請求... (${totalAsked} 位玩家)`
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

        console.error('Unknown volunteer effect return type:', effectResult);
        room.pendingVolunteerEvents.delete(ws);
        return;
    }

    ws.send(JSON.stringify({ type: 'error', message: '義工卡狀態異常' }));
}

// ==================== Handle individual donation response ====================

function handleVolunteerDonationResponse(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    // Find initiator's pending event
    let initiatorWs  = null;
    let pendingEvent = null;

    for (const [iWs, pe] of (room.pendingVolunteerEvents || new Map())) {
        if (pe.donationPhase === 'collecting' &&
            pe.donationRequest?.cardId === data.cardId) {
            initiatorWs  = iWs;
            pendingEvent = pe;
            break;
        }
    }

    if (!pendingEvent) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到對應的義工活動' }));
        return;
    }

    // ✅ Validate donation before accepting
    const donationType   = pendingEvent.donationRequest.donationType || 'cash';
    const donationAmount = pendingEvent.donationRequest.donationAmount;
    let willDonate       = data.willDonate === true;

    if (willDonate) {
        const currentValue = donationType === 'energy'
            ? player.gameState.energy
            : player.gameState.cash;

        if (currentValue < donationAmount) {
            willDonate = false;
            console.log(`⚠️ ${player.playerName} 想捐贈但資源不足 (需要 ${donationAmount}, 只有 ${currentValue})，自動拒絕`);
            ws.send(JSON.stringify({
                type: 'notification',
                message: `❌ 你的${donationType === 'energy' ? '精力' : '現金'}不足 ${donationAmount}，無法捐贈`
            }));
        }
    }

    // Record response
    pendingEvent.donationResponses[player.playerName] = willDonate;

    console.log(`🤝 ${player.playerName} 回應義工捐贈: ${willDonate ? '願意' : '不願意'}`);

    const totalAsked     = pendingEvent.donationRequest.playersToAsk.length;
    const totalResponded = Object.keys(pendingEvent.donationResponses).length;

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🤝 ${player.playerName} 已回應 (${totalResponded}/${totalAsked})`
    });

    // Finalize when all responded
    if (totalResponded >= totalAsked) {
        _finalizeDonation(initiatorWs, roomId, rooms, broadcastToRoom);
    }
}

// ==================== Finalize donation ====================

function _finalizeDonation(initiatorWs, roomId, rooms, broadcastToRoom) {
    const room = rooms.get(roomId);
    if (!room) return;

    const pendingEvent = room.pendingVolunteerEvents?.get(initiatorWs);
    if (!pendingEvent || pendingEvent.donationPhase !== 'collecting') return;

    const card      = pendingEvent.card;
    const initiator = room.players.get(initiatorWs);
    if (!initiator) return;

    console.log(`🤝 結算義工卡捐贈: ${card.name}`);

    // Mark non-responded as declined
    pendingEvent.donationRequest.playersToAsk.forEach(({ playerName }) => {
        if (!(playerName in pendingEvent.donationResponses)) {
            pendingEvent.donationResponses[playerName] = false;
        }
    });

    const stateBefore = JSON.parse(JSON.stringify(initiator.gameState));
    let effectResult  = '';

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
    const donationType   = pendingEvent.donationRequest.donationType || 'cash';
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

    // ✅ No card reveal here — already broadcast in drawVolunteerCard
    _sendCardResultNoReveal(initiatorWs, card, effectResult, initiator, roomId, broadcastToRoom);
    _broadcastAllStates(room, roomId, broadcastToRoom);

    room.pendingVolunteerEvents.delete(initiatorWs);
    console.log(`✅ 義工卡捐贈結算完成: ${card.name}`);
}

// ==================== Choice flow ====================

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

    _sendCardResultNoReveal(ws, card, effectResult, player, roomId, broadcastToRoom);
    _broadcastAllStates(room, roomId, broadcastToRoom);
    room.pendingVolunteerEvents.delete(ws);
}

// ==================== Private helpers ====================

// ✅ NEW: send result WITHOUT card reveal (reveal already sent at draw time)
function _sendCardResultNoReveal(ws, card, effectResult, player, roomId, broadcastToRoom) {
    ws.send(JSON.stringify({
        type: 'volunteer_card_execute',
        card: _serializable(card),
        effectMessage: effectResult,
        gameState: player.gameState
    }));

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

// ✅ FIXED: include all card fields needed for display
function _serializable(card) {
    return {
        id:               card.id,
        name:             card.name,
        description:      card.description,
        image:            card.image,
        cardType:         'volunteer',
        cardTypeName:     '義工卡',
        cardTypeIcon:     '🤝',
        requiresDonation: card.requiresDonation || false,
        requiresChoice:   card.requiresChoice   || false,
        donationAmount:   card.donationAmount    || 0,
        donationType:     card.donationType      || 'cash',
        donationTarget:   card.donationTarget    || 'poorest'
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