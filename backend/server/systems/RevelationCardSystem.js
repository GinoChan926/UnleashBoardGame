"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

const pendingPersonal = new Map();  // playerId → { card, room, roomId }
const pendingTeam     = new Map();  // teamId → { card, room, roomId, responses, playerIds }

const TEAM_TIMEOUT = 30000;  // 30s for team decisions

// ==================== Personal card flow ====================

/**
 * Show personal card to only the drawer.
 * Server sends prompt with full card details.
 */
function startPersonalCard(ws, roomId, player, card, broadcastToRoom, rooms) {
    pendingPersonal.set(player.playerId, { card, roomId });

    // Send card details to drawer only
    ws.send(JSON.stringify({
        type: 'personal_card_prompt',
        card: _serializeCard(card),
        message: `📜 你抽到「${card.name}」錦囊卡，是否執行？`
    }));

    // Notify OTHERS with only the fact that someone drew a card - no content
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `📜 ${player.playerName} 正在查看個人錦囊卡...`
    }, ws);

    console.log(`📜 ${player.playerName} 個人錦囊卡: ${card.name}`);
}

/**
 * Player responds to personal card - execute or decline.
 */
function handlePersonalCardResponse(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = pendingPersonal.get(player.playerId);
    if (!pending) return;

    const { card } = pending;
    const execute = data.execute === true;
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));

    if (!execute) {
        // Declined - keep existing decline logic
        // ... existing decline code
        pendingPersonal.delete(player.playerId);
        return;
    }

    // Run the effect
    let resultMessage = '';
    try {
        resultMessage = card.effect(player.gameState) || `執行「${card.name}」`;
    } catch (e) {
        resultMessage = `執行「${card.name}」時發生錯誤`;
    }

    addTransactionRecord(
        player.playerName, card, '個人錦囊執行',
        player.gameState.cash - stateBefore.cash,
        resultMessage, stateBefore, player.gameState
    );

    ws.send(JSON.stringify({
        type: 'personal_card_result',
        executed: true,
        card: _serializeCard(card),
        message: resultMessage,
        gameState: player.gameState
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `📜 ${player.playerName} 執行了個人錦囊卡`
    }, ws);

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });

    // ✅ Check for special follow-up features
    pendingPersonal.delete(player.playerId);

    // IN13 - gift chance card
    if (card.hasGiftChanceCardFeature) {
        const { startGiftCardFlow } = require('./GiftCardSystem.js');
        // Note: CARD_TYPES needs to be passed - see server.js update below
        setTimeout(() => {
            startGiftCardFlow(ws, roomId, player, global.CARD_TYPES, broadcastToRoom, rooms);
        }, 500);
    }

    // IN14/IN15/IN16/IN17 - move forward
    if (card.hasMoveForwardFeature) {
        const { startMoveForward } = require('./MoveForwardSystem.js');
        setTimeout(() => {
            // ✅ Use the real tile processor from deps
            const tileProcessor = global._streamlineTileProcessor || null;
            startMoveForward(ws, roomId, player, card, broadcastToRoom, rooms, tileProcessor);
        }, 500);
    }
    // ✅ IN07/IN11 - Draw hardship card after personal card executes
    if (card._pendingHardshipDraw || player.gameState._pendingHardshipDraw) {
        delete player.gameState._pendingHardshipDraw;

        let hardshipCardsData = [];
        try {
            hardshipCardsData = require('../../hardship_cards.js').hardshipCards || [];
        } catch (e) {
            console.log('⚠️ 無法載入逆境卡');
        }

        if (hardshipCardsData.length > 0) {
            // Filter out collective cards to avoid chain reactions
            const nonCollective = hardshipCardsData.filter(c => !c.isCollective);

            if (nonCollective.length > 0) {
                const { drawHardshipCard } = require('../../cards/HardshipCardHandler.js');
                setTimeout(() => {
                    drawHardshipCard(ws, player.gameState, roomId, player, nonCollective, broadcastToRoom, rooms);
                }, 1500);
            }
        }
    }
}

// ==================== Team card flow ====================

/**
 * Show team card to ALL players - each decides individually.
 */
function startTeamCard(ws, roomId, initiator, card, broadcastToRoom, rooms) {
    const room = rooms.get(roomId);
    if (!room) return;

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const playerIds = Array.from(room.players.values()).map(p => p.playerId);

    pendingTeam.set(teamId, {
        card,
        roomId,
        initiatorId: initiator.playerId,
        initiatorName: initiator.playerName,
        responses: new Map(),   // playerId → true/false
        playerIds,
        startedAt: Date.now()
    });

    // Send card details to ALL players
    room.players.forEach((p, pWs) => {
        pWs.send(JSON.stringify({
            type: 'team_card_prompt',
            teamId,
            card: _serializeCard(card),
            initiator: initiator.playerName,
            isInitiator: p.playerId === initiator.playerId,
            timeout: TEAM_TIMEOUT / 1000,
            message: `👥 ${initiator.playerName} 觸發團隊錦囊「${card.name}」！每位玩家請選擇是否參與`
        }));
    });

    console.log(`👥 ${initiator.playerName} 團隊錦囊: ${card.name} (teamId=${teamId})`);

    // Auto-finalize after timeout
    setTimeout(() => {
        const pending = pendingTeam.get(teamId);
        if (pending) {
            _finalizeTeamCard(teamId, rooms, broadcastToRoom);
        }
    }, TEAM_TIMEOUT);
}

/**
 * Player responds to team card.
 */
function handleTeamCardResponse(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = pendingTeam.get(data.teamId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '此團隊錦囊已結束' }));
        return;
    }

    // Record response
    pending.responses.set(player.playerId, data.participate === true);

    // Notify initiator of progress
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `👥 ${player.playerName} 已回應團隊錦囊 (${pending.responses.size}/${pending.playerIds.length})`
    });

    // If everyone has responded, finalize immediately
    if (pending.responses.size >= pending.playerIds.length) {
        _finalizeTeamCard(data.teamId, rooms, broadcastToRoom);
    }
}

/**
 * Called when all players responded OR timeout expired.
 */
function _finalizeTeamCard(teamId, rooms, broadcastToRoom) {
    const pending = pendingTeam.get(teamId);
    if (!pending) return;

    const room = rooms.get(pending.roomId);
    if (!room) {
        pendingTeam.delete(teamId);
        return;
    }

    const { card, responses } = pending;

    // Build playerChoices object for the card's effect function
    const playerChoices = {};
    room.players.forEach(p => {
        const chose = responses.get(p.playerId);
        playerChoices[p.playerName] = chose === true;
    });

    console.log(`👥 團隊錦囊結算: ${card.name}`, playerChoices);

    // Find the initiator player and ws
    let initiatorPlayer = null;
    let initiatorWs = null;
    for (const [pWs, p] of room.players) {
        if (p.playerId === pending.initiatorId) {
            initiatorPlayer = p;
            initiatorWs = pWs;
            break;
        }
    }

    // Run the card's effect with playerChoices
    let resultMessage = '';
    try {
        resultMessage = card.effect(
            initiatorPlayer?.gameState,
            room,
            initiatorPlayer,
            initiatorWs,
            pending.roomId,
            playerChoices,
            broadcastToRoom  // ← pass broadcastToRoom as extra arg
        ) || `團隊錦囊「${card.name}」完成`;
    } catch (e) {
        console.error('Team card effect error:', e);
        resultMessage = `執行團隊錦囊「${card.name}」時發生錯誤`;
    }

    // Broadcast final result to everyone
    broadcastToRoom(pending.roomId, {
        type: 'team_card_result',
        teamId,
        card: _serializeCard(card),
        initiator: pending.initiatorName,
        message: resultMessage,
        playerChoices
    });

    // Update all players' states
    room.players.forEach(p => {
        broadcastToRoom(pending.roomId, {
            type: 'state_updated',
            playerId: p.playerId,
            gameState: p.gameState
        });
    });

    pendingTeam.delete(teamId);
}

// ==================== Private ====================

function _serializeCard(card) {
    return {
        id:          card.id,
        name:        card.name,
        description: card.description,
        image:       card.image,
        scope:       card.scope || 'personal',
        cardType:    card.type || 'tip',
        cardTypeName:'錦囊卡',
        cardTypeIcon:'🎁'
    };
}

module.exports = {
    startPersonalCard,
    handlePersonalCardResponse,
    startTeamCard,
    handleTeamCardResponse
};