"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const { broadcastCardReveal }  = require('../utils/CardBroadcastHelper.js');

const pendingPersonal = new Map();  // playerId → { card, room, roomId }
const pendingTeam     = new Map();  // teamId → { card, room, roomId, responses, playerIds }

const TEAM_TIMEOUT = 30000;  // 30s for team decisions

// ==================== Personal card flow ====================

function startPersonalCard(ws, roomId, player, card, broadcastToRoom, rooms) {
    pendingPersonal.set(player.playerId, { card, roomId });

    ws.send(JSON.stringify({
        type: 'personal_card_prompt',
        card: _serializeCard(card),
        message: `📜 你抽到「${card.name}」錦囊卡，是否執行？`
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `📜 ${player.playerName} 正在查看個人錦囊卡...`
    }, ws);

    console.log(`📜 ${player.playerName} 個人錦囊卡: ${card.name}`);
}

function handlePersonalCardResponse(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = pendingPersonal.get(player.playerId);
    if (!pending) return;

    const { card }   = pending;
    const execute    = data.execute === true;
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));

    if (!execute) {
        pendingPersonal.delete(player.playerId);
        return;
    }

    let resultMessage = '';
    try {
        resultMessage = card.effect(player.gameState) || `執行「${card.name}」`;
    } catch (e) {
        resultMessage = `執行「${card.name}」時發生錯誤`;
    }

    // ✅ Auto-repay debts if effect gave player money
    if (player.gameState.cash > stateBefore.cash
        && player.gameState.pendingDebts?.length > 0) {
        const { processDebtCollection } = require('./AutoDebtSystem.js');
        const paidDebts = processDebtCollection(player, room, roomId, broadcastToRoom);
        const totalRepaid = paidDebts.reduce((s, d) => s + d.paidAmount, 0);
        if (totalRepaid > 0) {
            resultMessage += ` | 💸 自動償還債務 $${totalRepaid.toLocaleString()}`;
        }
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

    broadcastCardReveal({
        roomId,
        drawerWs:      ws,
        drawerName:    player.playerName,
        drawerId:      player.playerId,
        card: {
            id:           card.id,
            name:         card.name,
            description:  card.description,
            image:        card.image,
            cardType:     'tip',
            cardTypeName: '個人錦囊卡'
        },
        action:        '執行了個人錦囊卡',
        effectMessage: resultMessage,
        broadcastToRoom
    });

    pendingPersonal.delete(player.playerId);

    // ── Follow-up features ────────────────────────────────────────────

    if (card.hasGiftChanceCardFeature) {
        const { startGiftCardFlow } = require('./GiftCardSystem.js');
        setTimeout(() => {
            startGiftCardFlow(ws, roomId, player, global.CARD_TYPES, broadcastToRoom, rooms);
        }, 500);
    }

    if (card.hasMoveForwardFeature) {
        const { startMoveForward } = require('./MoveForwardSystem.js');
        setTimeout(() => {
            const tileProcessor = global._streamlineTileProcessor || null;
            startMoveForward(ws, roomId, player, card, broadcastToRoom, rooms, tileProcessor);
        }, 500);
    }

    if (card._pendingHardshipDraw || player.gameState._pendingHardshipDraw) {
        delete player.gameState._pendingHardshipDraw;

        let hardshipCardsData = [];
        try {
            hardshipCardsData = require('../../hardship_cards.js').hardshipCards || [];
        } catch (e) {
            console.log('⚠️ 無法載入逆境卡');
        }

        if (hardshipCardsData.length > 0) {
            const nonCollective = hardshipCardsData.filter(c => !c.isCollective);

            if (nonCollective.length > 0) {
                const { drawHardshipCard } = require('../cards/HardshipCardHandler.js');
                setTimeout(() => {
                    drawHardshipCard(ws, player.gameState, roomId, player, nonCollective, broadcastToRoom, rooms);
                }, 3000);
            }
        }
    }
}

// ==================== Team card flow ====================

function startTeamCard(ws, roomId, initiator, card, broadcastToRoom, rooms) {
    const room = rooms.get(roomId);
    if (!room) return;

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const playerIds = Array.from(room.players.values()).map(p => p.playerId);

    pendingTeam.set(teamId, {
        card,
        roomId,
        initiatorId:   initiator.playerId,
        initiatorName: initiator.playerName,
        responses:     new Map(),
        playerIds,
        startedAt:     Date.now()
    });

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

    setTimeout(() => {
        const pending = pendingTeam.get(teamId);
        if (pending) {
            _finalizeTeamCard(teamId, rooms, broadcastToRoom);
        }
    }, TEAM_TIMEOUT);
}

function handleTeamCardResponse(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = pendingTeam.get(data.teamId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '此團隊錦囊已結束' }));
        return;
    }

    pending.responses.set(player.playerId, data.participate === true);

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `👥 ${player.playerName} 已回應團隊錦囊 (${pending.responses.size}/${pending.playerIds.length})`
    });

    if (pending.responses.size >= pending.playerIds.length) {
        _finalizeTeamCard(data.teamId, rooms, broadcastToRoom);
    }
}

function _finalizeTeamCard(teamId, rooms, broadcastToRoom) {
    const pending = pendingTeam.get(teamId);
    if (!pending) return;

    const room = rooms.get(pending.roomId);
    if (!room) {
        pendingTeam.delete(teamId);
        return;
    }

    const { card, responses } = pending;

    const playerChoices = {};
    room.players.forEach(p => {
        const chose = responses.get(p.playerId);
        playerChoices[p.playerName] = chose === true;
    });

    console.log(`👥 團隊錦囊結算: ${card.name}`, playerChoices);

    let initiatorPlayer = null;
    let initiatorWs = null;
    for (const [pWs, p] of room.players) {
        if (p.playerId === pending.initiatorId) {
            initiatorPlayer = p;
            initiatorWs = pWs;
            break;
        }
    }

    // ✅ Snapshot cash for all participants BEFORE effect
    const cashSnapshot = new Map();
    room.players.forEach(p => {
        cashSnapshot.set(p.playerId, p.gameState.cash);
    });

    let resultMessage = '';
    try {
        resultMessage = card.effect(
            initiatorPlayer?.gameState,
            room,
            initiatorPlayer,
            initiatorWs,
            pending.roomId,
            playerChoices,
            broadcastToRoom
        ) || `團隊錦囊「${card.name}」完成`;
    } catch (e) {
        console.error('Team card effect error:', e);
        resultMessage = `執行團隊錦囊「${card.name}」時發生錯誤`;
    }

    // ✅ After team effect runs, auto-repay debts for EVERY player who gained cash
    const { processDebtCollection } = require('./AutoDebtSystem.js');
    const repaidPlayers = [];

    room.players.forEach((p, pWs) => {
        const cashBefore = cashSnapshot.get(p.playerId) || 0;
        const cashAfter  = p.gameState.cash;

        if (cashAfter > cashBefore && p.gameState.pendingDebts?.length > 0) {
            const paidDebts = processDebtCollection(p, room, pending.roomId, broadcastToRoom);
            const totalRepaid = paidDebts.reduce((s, d) => s + d.paidAmount, 0);
            if (totalRepaid > 0) {
                repaidPlayers.push(`${p.playerName} 償還 $${totalRepaid.toLocaleString()}`);

                // Notify each player individually
                if (pWs && pWs.readyState === 1) {
                    pWs.send(JSON.stringify({
                        type: 'notification',
                        message: `💸 你的收入已自動償還 $${totalRepaid.toLocaleString()} 銀行債務`
                    }));
                }
            }
        }
    });

    if (repaidPlayers.length > 0) {
        resultMessage += `\n💸 自動償還債務: ${repaidPlayers.join('、')}`;
    }

    broadcastToRoom(pending.roomId, {
        type: 'team_card_result',
        teamId,
        card: _serializeCard(card),
        initiator: pending.initiatorName,
        message: resultMessage,
        playerChoices
    });

    room.players.forEach(p => {
        broadcastToRoom(pending.roomId, {
            type: 'state_updated',
            playerId: p.playerId,
            gameState: p.gameState
        });
    });

    pendingTeam.delete(teamId);
}

// ==================== IN03 Reward Choice ====================

function handleIN03RewardChoice(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = room.pendingIN03Choices?.get(ws);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的獎勵選擇' }));
        return;
    }

    const choice = data.choice;
    let message = '';
    let autoRepaidNote = '';

    if (choice === 'cash') {
        // ✅ Use creditPlayer so debts auto-repay
        const { creditPlayer } = require('./AutoDebtSystem.js');
        const result = creditPlayer(player, 2000, {
            room, roomId, broadcastToRoom,
            source: 'IN03 慢活現金獎勵'
        });

        message = `💰 你選擇獲得 $2,000！`;
        if (result.autoRepaid > 0) {
            autoRepaidNote = ` (其中 $${result.autoRepaid.toLocaleString()} 自動償還銀行債務)`;
            message += autoRepaidNote;
        }

        addTransactionRecord(
            player.playerName,
            { name: '慢活 - 現金獎勵', type: 'tip', id: 'IN03_CASH' },
            '團隊錦囊獎勵',
            2000,
            `選擇 $2,000 現金獎勵${autoRepaidNote}`,
            null,
            player.gameState
        );

    } else if (choice === 'energy') {
        const gained = Math.min(2, player.gameState.maxEnergy - player.gameState.energy);
        player.gameState.energy = Math.min(
            player.gameState.maxEnergy,
            player.gameState.energy + 2
        );
        message = `⚡ 你選擇獲得 ${gained} 精力！`;

        addTransactionRecord(
            player.playerName,
            { name: '慢活 - 精力獎勵', type: 'tip', id: 'IN03_ENERGY' },
            '團隊錦囊獎勵',
            0,
            `選擇獲得 2 精力（實際 +${gained}）`,
            null,
            player.gameState
        );
    } else {
        ws.send(JSON.stringify({ type: 'error', message: '無效的選擇' }));
        return;
    }

    ws.send(JSON.stringify({
        type: 'in03_reward_choice_result',
        choice,
        message,
        gameState: player.gameState
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🧘 ${player.playerName} 慢活選擇了${choice === 'cash' ? '$2,000' : '2 精力'}`
    }, ws);

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });

    room.pendingIN03Choices.delete(ws);
    console.log(`🧘 ${player.playerName} IN03 選擇: ${choice}`);
}

// ==================== Private ====================

function _serializeCard(card) {
    return {
        id:           card.id,
        name:         card.name,
        description:  card.description,
        image:        card.image,
        scope:        card.scope || 'personal',
        cardType:     card.type || 'tip',
        cardTypeName: '錦囊卡',
        cardTypeIcon: '🎁'
    };
}

module.exports = {
    startPersonalCard,
    handlePersonalCardResponse,
    startTeamCard,
    handleTeamCardResponse,
    handleIN03RewardChoice
};