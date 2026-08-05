"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

const pendingGroupFinance = new Map();  // groupId → state
const GROUP_TIMEOUT = 45000;

/**
 * When a player draws a finance card (stock/crypto),
 * all other players can also trade it.
 * If they buy, they pay 1 energy to the drawer.
 */
function startGroupFinance(
    initiatorWs,
    roomId,
    initiator,
    card,
    broadcastToRoom,
    rooms,
    lockedPrice,
    initiatorBought = false
) {
    const room = rooms.get(roomId);
    if (!room) return;

    const isStock  = !!(card.stockCode || card.getCurrentPrice);
    const isCrypto = !!(card.cryptoCode);
    if (!isStock && !isCrypto) return;

    let hasOthers = false;
    room.players.forEach((p, pWs) => {
        if (pWs !== initiatorWs) hasOthers = true;
    });
    if (!hasOthers) return;

    const groupId = `gfin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Use locked price from drawer's card reveal / actual purchase price if available
    const currentPrice = lockedPrice || card._lockedPrice || card.currentPrice || 0;

    const cardType = isCrypto ? 'crypto' : 'stock';
    const unit     = isCrypto ? '顆' : '股';
    const minTrade = isCrypto ? (card.minUnits || 1) : (card.minShares || 100);
    const multiple = isCrypto ? 1 : (card.shareMultiple || 100);

    pendingGroupFinance.set(groupId, {
        groupId,
        card,
        cardType,
        roomId,
        initiatorId:     initiator.playerId,
        initiatorName:   initiator.playerName,
        initiatorBought,
        currentPrice,
        unit,
        minTrade,
        multiple,
        responses:       new Map(),
        startedAt:       Date.now()
    });

    console.log(
        `📊 團購金融: ${card.name}, 鎖定價格: $${currentPrice}, 發起人是否買入: ${initiatorBought ? '是' : '否'} (groupId=${groupId})`
    );

    room.players.forEach((p, pWs) => {
        if (pWs === initiatorWs) return;

        pWs.send(JSON.stringify({
            type: 'group_finance_prompt',
            groupId,
            cardType,
            cardName:      card.name,
            cardCode:      card.stockCode || card.cryptoCode || card.code || '',
            description:   card.description,
            image:         card.image,
            currentPrice,
            unit,
            minTrade,
            multiple,
            initiatorName: initiator.playerName,
            initiatorBought,
            energyCost:    1,
            playerCash:    p.gameState.cash,
            playerEnergy:  p.gameState.energy,
            timeout:       GROUP_TIMEOUT / 1000,
            message: initiatorBought
                ? `📊 ${initiator.playerName} 抽到並買入「${card.name}」！你也可以一起買入（需付 1 精力給發起人）`
                : `📊 ${initiator.playerName} 抽到「${card.name}」但選擇不買！你仍可以一起買入（需付 1 精力給發起人）`
        }));
    });

    initiatorWs.send(JSON.stringify({
        type: 'notification',
        message: initiatorBought
            ? `📊 其他玩家正在決定是否一起買入「${card.name}」...`
            : `📊 雖然你沒有買入「${card.name}」，其他玩家仍可決定是否一起買入...`
    }));

    setTimeout(() => {
        const pending = pendingGroupFinance.get(groupId);
        if (pending) {
            _finalizeGroupFinance(groupId, rooms, broadcastToRoom);
        }
    }, GROUP_TIMEOUT);
}

/**
 * Handle other player's response - how many units they want to buy.
 */
function handleGroupFinanceResponse(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = pendingGroupFinance.get(data.groupId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '此交易已結束' }));
        return;
    }

    const units = parseInt(data.units) || 0;

    pending.responses.set(player.playerId, {
        units,
        playerName: player.playerName
    });

    console.log(`📊 ${player.playerName} 回應團購金融: ${units} ${pending.unit}`);

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `📊 ${player.playerName} 已回應 (${pending.responses.size} 人)`
    });

    // Count how many non-initiator players exist
    let otherCount = 0;
    room.players.forEach((p) => {
        if (p.playerId !== pending.initiatorId) otherCount++;
    });

    // If all others responded, finalize
    if (pending.responses.size >= otherCount) {
        _finalizeGroupFinance(data.groupId, rooms, broadcastToRoom);
    }
}

// ==================== Finalize ====================

function _finalizeGroupFinance(groupId, rooms, broadcastToRoom) {
    const pending = pendingGroupFinance.get(groupId);
    if (!pending) return;

    const room = rooms.get(pending.roomId);
    if (!room) {
        pendingGroupFinance.delete(groupId);
        return;
    }

    const { card, currentPrice, unit, minTrade, multiple, cardType } = pending;

    // Find initiator
    let initiator   = null;
    let initiatorWs = null;
    for (const [pWs, p] of room.players) {
        if (p.playerId === pending.initiatorId) {
            initiator   = p;
            initiatorWs = pWs;
            break;
        }
    }

    const results = [];
    let totalEnergyToInitiator = 0;

    // Process each responder's purchase
    pending.responses.forEach(({ units, playerName }, playerId) => {
        if (units <= 0) {
            results.push(`${playerName}: 不參與`);
            return;
        }

        // Find this player
        let buyer   = null;
        let buyerWs = null;
        for (const [pWs, p] of room.players) {
            if (p.playerId === playerId) {
                buyer   = p;
                buyerWs = pWs;
                break;
            }
        }
        if (!buyer) return;

        const totalCost = units * currentPrice;

        // Check affordability
        if (buyer.gameState.cash < totalCost) {
            results.push(`${playerName}: 現金不足，無法購買`);
            if (buyerWs) {
                buyerWs.send(JSON.stringify({
                    type: 'notification',
                    message: `❌ 現金不足 $${totalCost.toLocaleString()}，無法購買 ${card.name}`
                }));
            }
            return;
        }

        if (buyer.gameState.energy < 1) {
            results.push(`${playerName}: 精力不足，無法購買`);
            if (buyerWs) {
                buyerWs.send(JSON.stringify({
                    type: 'notification',
                    message: `❌ 精力不足 1 點，無法參與團購`
                }));
            }
            return;
        }

        // Execute purchase
        buyer.gameState.cash -= totalCost;

        // Pay 1 energy to initiator
        buyer.gameState.energy = Math.max(0, buyer.gameState.energy - 1);
        totalEnergyToInitiator++;

        // Add holdings
        if (cardType === 'crypto') {
            _addCryptoHolding(buyer.gameState, card, units, currentPrice);
        } else {
            _addStockHolding(buyer.gameState, card, units, currentPrice);
        }

        results.push(
            `${playerName}: 買入 ${units} ${unit} ($${totalCost.toLocaleString()})，精力 -1`
        );

        addTransactionRecord(
            playerName,
            { name: `團購 ${card.name}`, type: 'finance', id: card.id },
            '團購金融',
            -totalCost,
            `團購 ${units} ${unit} ${card.name} @ $${currentPrice}/${unit}，精力 -1 給發起人`,
            null,
            buyer.gameState
        );

        if (buyerWs) {
            buyerWs.send(JSON.stringify({
                type: 'notification',
                message: `✅ 團購成功！買入 ${units} ${unit} ${card.name}，花費 $${totalCost.toLocaleString()}，精力 -1`
            }));
        }
    });

    // Give energy to initiator
    if (initiator && totalEnergyToInitiator > 0) {
        initiator.gameState.energy = Math.min(
            initiator.gameState.maxEnergy,
            initiator.gameState.energy + totalEnergyToInitiator
        );

        addTransactionRecord(
            initiator.playerName,
            { name: `團購發起人精力收益`, type: 'finance', id: 'GRP_FIN_ENERGY' },
            '發起人精力',
            0,
            `收到 ${totalEnergyToInitiator} 位買家各 1 精力，共 +${totalEnergyToInitiator} 精力`,
            null,
            initiator.gameState
        );

        if (initiatorWs) {
            initiatorWs.send(JSON.stringify({
                type: 'notification',
                message: `💪 收到 ${totalEnergyToInitiator} 位玩家的精力！精力 +${totalEnergyToInitiator}`
            }));
        }
    }

    // Build summary
    const buyerCount = results.filter(r => r.includes('買入')).length;

    const summaryMsg = `📊 團購「${card.name}」完成！\n` +
        `👤 發起人: ${pending.initiatorName}${totalEnergyToInitiator > 0 ? ` (精力 +${totalEnergyToInitiator})` : ''}\n` +
        `👥 參與: ${buyerCount} 人\n\n` +
        results.join('\n');

    broadcastToRoom(pending.roomId, {
        type: 'group_finance_result',
        groupId,
        cardName: card.name,
        message: summaryMsg
    });

    // Update all states
    room.players.forEach((p) => {
        broadcastToRoom(pending.roomId, {
            type: 'state_updated',
            playerId: p.playerId,
            gameState: p.gameState
        });
    });

    pendingGroupFinance.delete(groupId);
    console.log(`✅ 團購金融完成: ${card.name}, ${buyerCount} 人參與`);
}

// ==================== Private helpers ====================

function _addStockHolding(state, card, shares, price) {
    state.stockHoldings = state.stockHoldings || {};
    const key = card.id;

    if (!state.stockHoldings[key]) {
        state.stockHoldings[key] = {
            id:            card.id,
            code:          card.stockCode || card.code,
            name:          card.name,
            shares:        0,
            totalCost:     0,
            purchasePrice: price,
            lastPrice:     price,
            transactions:  []
        };
    }

    const holding   = state.stockHoldings[key];
    const totalCost = shares * price;

    holding.shares        += shares;
    holding.totalCost     += totalCost;
    holding.purchasePrice  = holding.totalCost / holding.shares;
    holding.lastPrice      = price;
    holding.transactions.push({
        type: 'buy', shares, price, total: totalCost,
        timestamp: new Date().toLocaleString(), source: '團購'
    });

    state.totalAssets = (state.totalAssets || 0) + totalCost;
}

function _addCryptoHolding(state, card, units, price) {
    state.cryptoHoldings = state.cryptoHoldings || {};
    const key = card.id;

    if (!state.cryptoHoldings[key]) {
        state.cryptoHoldings[key] = {
            id:           card.id,
            code:         card.cryptoCode || card.code,
            name:         card.name,
            units:        0,
            totalCost:    0,
            averagePrice: price,
            lastPrice:    price,
            transactions: []
        };
    }

    const holding   = state.cryptoHoldings[key];
    const totalCost = units * price;

    holding.units        += units;
    holding.totalCost    += totalCost;
    holding.averagePrice  = holding.totalCost / holding.units;
    holding.lastPrice     = price;
    holding.transactions.push({
        type: 'buy', units, price, total: totalCost,
        timestamp: new Date().toLocaleString(), source: '團購'
    });

    state.totalAssets = (state.totalAssets || 0) + totalCost;
}

module.exports = { startGroupFinance, handleGroupFinanceResponse };