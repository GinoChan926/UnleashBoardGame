"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const SERVER_CONFIG = require('../constants/ServerConfig.js');

const pendingGroupInvestments = new Map();  // groupId → state

const GROUP_TIMEOUT = SERVER_CONFIG.groupInvestmentTimeoutSec * 1000;  // 45 seconds for everyone to decide

/**
 * Start group investment flow.
 * Called when a player draws an investment card on the flow layer.
 *
 * @param {WebSocket} initiatorWs
 * @param {string} roomId
 * @param {object} initiator - the player who drew the card
 * @param {object} card - the investment card object
 * @param {Function} broadcastToRoom
 * @param {Map} rooms
 */
function startGroupInvestment(initiatorWs, roomId, initiator, card, broadcastToRoom, rooms) {
    const room = rooms.get(roomId);
    if (!room) return;

    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Find all streamline players (NOT in flow, NOT in reverse)
    const eligiblePlayers = [];
    room.players.forEach((p, ws) => {
        // Everyone can see, but only streamline players (and the initiator) can participate
        if (!p.gameState.inReverse) {
            eligiblePlayers.push({
                playerId:   p.playerId,
                playerName: p.playerName,
                ws,
                isInitiator: p.playerId === initiator.playerId
            });
        }
    });

    // Build serializable card info
    const cardInfo = {
        id:             card.id,
        name:           card.name,
        description:    card.description,
        image:          card.image,
        investmentCost: card.investmentCost || 0,
        monthlyReturn:  card.monthlyReturn  || 0,
        energyCost:     card.energyCost     || 0,
        energyGain:     card.energyGain     || 0,
        maxUnits:       card.maxUnits       || null,
        pricePerUnit:   card.pricePerUnit   || card.investmentCost || 0
    };

    // Determine unit price and max units
    const unitPrice = cardInfo.pricePerUnit || cardInfo.investmentCost;
    const unitReturn = cardInfo.monthlyReturn;

    pendingGroupInvestments.set(groupId, {
        groupId,
        card,
        cardInfo,
        roomId,
        initiatorId:   initiator.playerId,
        initiatorName: initiator.playerName,
        initiatorWs,
        unitPrice,
        unitReturn,
        responses:     new Map(),   // playerId → { units, playerName }
        eligibleIds:   eligiblePlayers.map(p => p.playerId),
        startedAt:     Date.now()
    });

    console.log(`🏗️ 團購投資開始: ${card.name} (groupId=${groupId}), ${eligiblePlayers.length} 位玩家可參與`);

    // Send investment prompt to all eligible players
    eligiblePlayers.forEach(({ ws: pWs, playerId, playerName, isInitiator }) => {
        if (pWs && pWs.readyState === 1) {
            // Find player's cash for UI
            let playerCash = 0;
            let playerEnergy = 0;
            for (const [, p] of room.players) {
                if (p.playerId === playerId) {
                    playerCash   = p.gameState.cash;
                    playerEnergy = p.gameState.energy;
                    break;
                }
            }

            pWs.send(JSON.stringify({
                type: 'group_investment_prompt',
                groupId,
                card: cardInfo,
                unitPrice,
                unitReturn,
                isInitiator,
                initiatorName: initiator.playerName,
                energyCostToJoin: isInitiator ? 0 : 1,  // non-initiators pay 1 energy
                playerCash,
                playerEnergy,
                timeout: GROUP_TIMEOUT / 1000,
                message: isInitiator
                    ? `🏗️ 你抽到投資卡「${card.name}」！其他玩家正在決定是否加入團購`
                    : `🏗️ ${initiator.playerName} 抽到投資卡「${card.name}」！你可以加入團購（需付 1 精力給發起人）`
            }));
        }
    });

    // Notify players NOT eligible (in reverse layer)
    room.players.forEach((p, pWs) => {
        if (p.gameState.inFlow) {
            pWs.send(JSON.stringify({
                type: 'notification',
                message: `🏗️ ${initiator.playerName} 在順流層抽到投資卡「${card.name}」，只有順流層玩家可參與`
            }));
        }
    });

    // Auto-finalize after timeout
    setTimeout(() => {
        const pending = pendingGroupInvestments.get(groupId);
        if (pending) {
            _finalizeGroupInvestment(groupId, rooms, broadcastToRoom);
        }
    }, GROUP_TIMEOUT);
}

/**
 * Handle a player's response to group investment.
 */
function handleGroupInvestmentResponse(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = pendingGroupInvestments.get(data.groupId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '此投資已結束' }));
        return;
    }

    const units = parseInt(data.units) || 0;

    // Record response (0 means decline)
    pending.responses.set(player.playerId, {
        units,
        playerName: player.playerName
    });

    // Notify progress
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🏗️ ${player.playerName} 已回應投資 (${pending.responses.size}/${pending.eligibleIds.length})`
    });

    console.log(`🏗️ ${player.playerName} 回應: ${units} 份`);

    // If all eligible players have responded, finalize
    if (pending.responses.size >= pending.eligibleIds.length) {
        _finalizeGroupInvestment(data.groupId, rooms, broadcastToRoom);
    }
}

// ==================== Finalize ====================

function _finalizeGroupInvestment(groupId, rooms, broadcastToRoom) {
    const pending = pendingGroupInvestments.get(groupId);
    if (!pending) return;

    const room = rooms.get(pending.roomId);
    if (!room) {
        pendingGroupInvestments.delete(groupId);
        return;
    }

    const { card, unitPrice, unitReturn, initiatorId, initiatorName } = pending;

    // Collect all participants and their units
    const participants = [];
    let totalUnits = 0;

    pending.responses.forEach(({ units, playerName }, playerId) => {
        if (units <= 0) return;

        // Find player
        let playerObj = null;
        for (const [, p] of room.players) {
            if (p.playerId === playerId) {
                playerObj = p;
                break;
            }
        }
        if (!playerObj) return;

        const totalCost = units * unitPrice;
        const isInitiator = playerId === initiatorId;
        const energyCost = isInitiator ? 0 : 1;  // non-initiators pay 1 energy

        // Check affordability
        if (playerObj.gameState.cash < totalCost) return;
        if (!isInitiator && playerObj.gameState.energy < energyCost) return;

        participants.push({
            playerId,
            playerName,
            playerObj,
            units,
            totalCost,
            isInitiator,
            energyCost
        });
        totalUnits += units;
    });

    // Nobody invested
    if (totalUnits === 0) {
        broadcastToRoom(pending.roomId, {
            type: 'group_investment_result',
            groupId,
            cardName: card.name,
            message: `🏗️ 投資卡「${card.name}」無人投資，機會消失`,
            participants: []
        });
        pendingGroupInvestments.delete(groupId);
        return;
    }

    // Find initiator for energy transfer
    let initiatorObj = null;
    for (const [, p] of room.players) {
        if (p.playerId === initiatorId) {
            initiatorObj = p;
            break;
        }
    }

    // Apply effects to each participant
    const results = [];

    participants.forEach(({ playerId, playerName, playerObj, units, totalCost, isInitiator, energyCost }) => {
        const sharePercent = (units / totalUnits * 100).toFixed(1);
        const monthlyShare = Math.floor(unitReturn * units);

        // Deduct cost
        playerObj.gameState.cash -= totalCost;

        // Deduct energy (non-initiator pays 1 energy to initiator)
        if (!isInitiator && energyCost > 0) {
            playerObj.gameState.energy = Math.max(0, playerObj.gameState.energy - energyCost);
            // Transfer energy to initiator
            if (initiatorObj) {
                initiatorObj.gameState.energy = Math.min(
                    initiatorObj.gameState.maxEnergy,
                    initiatorObj.gameState.energy + energyCost
                );
            }
        }

        // Add proportional monthly return
        playerObj.gameState.passiveIncome += monthlyShare;
        playerObj.gameState.totalAssets   += totalCost;

        // Apply card energy gain proportionally
        if (card.energyGain) {
            const energyShare = Math.floor(card.energyGain * units / totalUnits);
            playerObj.gameState.energy = Math.min(
                playerObj.gameState.maxEnergy,
                playerObj.gameState.energy + energyShare
            );
        }

        results.push({
            playerName,
            units,
            totalCost,
            sharePercent,
            monthlyShare,
            isInitiator,
            energyPaid: isInitiator ? 0 : energyCost
        });

        addTransactionRecord(
            playerName,
            { name: `團購投資 - ${card.name}`, type: 'investment', id: card.id },
            '團購投資',
            -totalCost,
            `投資 ${units} 份 (佔 ${sharePercent}%)，花費 $${totalCost.toLocaleString()}，月回報 +$${monthlyShare.toLocaleString()}${isInitiator ? '' : `，支付 ${energyCost} 精力給發起人`}`,
            null,
            playerObj.gameState
        );
    });

    // Record initiator's energy gain from others
    if (initiatorObj) {
        const energyGained = participants.filter(p => !p.isInitiator).length;
        if (energyGained > 0) {
            addTransactionRecord(
                initiatorName,
                { name: `團購發起人精力收益`, type: 'investment', id: 'GRP_ENERGY' },
                '發起人精力',
                0,
                `收到 ${energyGained} 位投資者各 1 精力，共 +${energyGained} 精力`,
                null,
                initiatorObj.gameState
            );
        }
    }

    // Build result summary
    let summaryMsg = `🏗️ 投資卡「${card.name}」團購完成！\n`;
    summaryMsg += `📊 總投資: ${totalUnits} 份\n\n`;
    results.forEach(r => {
        summaryMsg += `${r.isInitiator ? '👑' : '👤'} ${r.playerName}: ${r.units} 份 (${r.sharePercent}%)`;
        summaryMsg += ` → 月收入 +$${r.monthlyShare.toLocaleString()}`;
        if (r.energyPaid > 0) summaryMsg += ` | 精力 -${r.energyPaid}`;
        summaryMsg += '\n';
    });

    // Broadcast result to all
    broadcastToRoom(pending.roomId, {
        type: 'group_investment_result',
        groupId,
        cardName: card.name,
        message: summaryMsg,
        participants: results
    });

    // Update all players' states
    room.players.forEach(p => {
        broadcastToRoom(pending.roomId, {
            type: 'state_updated',
            playerId: p.playerId,
            gameState: p.gameState
        });
    });

    pendingGroupInvestments.delete(groupId);
    console.log(`✅ 團購投資完成: ${card.name}, ${participants.length} 人參與, 共 ${totalUnits} 份`);
}

module.exports = { startGroupInvestment, handleGroupInvestmentResponse };