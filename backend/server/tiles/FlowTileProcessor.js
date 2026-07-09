"use strict";

const { addTransactionRecord }           = require('../records/TransactionRecorder.js');
const { revertFlowLayerIncomeBoost }     = require('../systems/FlowLayerSystem.js');
const { retrieveAssetTrustOnBankruptcy } = require('../systems/AssetTrustSystem.js');
const { promptAssetTrustSetup }          = require('../systems/AssetTrustSystem.js');

function processFlowTile(state, tile, ws, roomId, player, room,
                         { broadcastToRoom, startAuction, processSocialServiceTile, investmentCards }) {

    if (!player || !state) return '❌ 数据异常';

    console.log(`🔍 processFlowTile: ${tile.type} - ${tile.name}`);

    switch (tile.type) {
        case 'asset_trust':
            promptAssetTrustSetup(state, ws);
            return null;

        case 'social_service':
            return processSocialServiceTile(state, ws, roomId, player, tile, room);

        case 'investment_tile':
            return _handleInvestmentTile(state, tile, ws, roomId, player, room,
                { broadcastToRoom, startAuction, investmentCards });

        case 'investment': {
            const profit = Math.floor(Math.random() * 50000) + 30000;
            const income = Math.floor(Math.random() * 5000)  + 2000;
            state.cash          += profit;
            state.passiveIncome += income;
            addTransactionRecord(player.playerName,
                { name: `顺流层投资 (${tile.name})`, type: "flow", id: "FLOW_INVEST" },
                "顺流层投资", profit,
                `获得 ${profit.toLocaleString()} 元现金，被动收入 +${income.toLocaleString()} 元/月`,
                null, state);
            return `💎 投资获利！获得 ${profit.toLocaleString()} 元，被动收入 +${income.toLocaleString()} 元/月`;
        }

        case 'flowbankruptcy':
            return _processBankruptcy(state, ws, roomId, player, broadcastToRoom);

        case 'audit': {
            const taxAmt = Math.floor(state.totalAssets * 0.5);
            state.totalAssets = Math.max(0, state.totalAssets - taxAmt);
            state.luck        = Math.max(0, state.luck - 2);
            addTransactionRecord(player.playerName,
                { name: "查稅審計", type: "flow", id: "FLOW_AUDIT" },
                "查税审计", -taxAmt,
                `损失 ${taxAmt.toLocaleString()} 元资产，幸运值 -2`, null, state);
            return `🔍 查税审计！损失 ${taxAmt.toLocaleString()} 元资产，幸运值 -2`;
        }

        case 'income': {
            const bonus = 50000;
            state.cash += bonus;
            addTransactionRecord(player.playerName,
                { name: "分红收入", type: "flow", id: "FLOW_BONUS" },
                "分红收入", bonus, `获得 ${bonus.toLocaleString()} 元`, null, state);
            return `💰 分红收入！获得 ${bonus.toLocaleString()} 元`;
        }

        case 'dream':
            return _handleDream(state, tile);

        case 'settlement':
            return null; // handled in RollHandler

        default:
            return `📌 顺流层格子：${tile.name}`;
    }
}

function _handleInvestmentTile(state, tile, ws, roomId, player, room,
                               { broadcastToRoom, startAuction, investmentCards }) {

    if (!investmentCards || investmentCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '📭 暂无投资卡数据' }));
        return '📭 暂无投资卡数据';
    }

    const card = investmentCards[Math.floor(Math.random() * investmentCards.length)];

    if (card.isAuction) {
        if (room.players.size < 2) {
            ws.send(JSON.stringify({ type: 'notification', message: '👤 需要至少2名玩家才能进行竞拍！' }));
            return '👤 需要至少2名玩家';
        }
        startAuction(roomId, card, player, ws, broadcastToRoom);
        return null;
    }

    const serializableCard = {
        id: card.id, name: card.name, description: card.description,
        image: card.image || '', cost: card.cost || 500,
        investmentCost: card.investmentCost || 0, energyCost: card.energyCost || 0,
        monthlyReturn: card.monthlyReturn || 0,
        cardType: 'investment', cardTypeName: '投资', cardTypeIcon: '🏗️', type: 'investment'
    };

    const canPurchase = state.cash >= 500;

    if (!room.pendingEvents) room.pendingEvents = new Map();
    const fullCard = { ...card, cardType: 'investment', cardTypeName: '投资', cardTypeIcon: '🏗️' };
    if (card.effect) fullCard.effect = card.effect.bind(card);

    room.pendingEvents.set(ws, {
        type: 'opportunity_card', card: fullCard,
        cardType: { id: 'investment', name: '投资', icon: '🏗️', color: '#ff6f00' },
        playerId: player.playerId, purchased: false, timestamp: Date.now(),
        isInvestmentCard: true, tileName: tile.name
    });

    ws.send(JSON.stringify({
        type: 'opportunity_card_draw', card: serializableCard, canAfford: canPurchase,
        message: `🏗️ 你踩中了「${tile.name}」格子！抽到一张投资卡！`
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🏗️ ${player.playerName} 在顺流层踩中「${tile.name}」，正在查看投资机会...`
    }, ws);

    return null;
}

function _processBankruptcy(state, ws, roomId, player, broadcastToRoom) {
    if (state.assetTrust?.active) {
        const protectedAmount = retrieveAssetTrustOnBankruptcy(state, ws, roomId, broadcastToRoom);
        state.inFlow        = false;
        state.streamlinePos = 0;
        state.inReverse     = false;
        state.loanAmount    = 0;
        state.loanInterest  = 0;
        state.stockHoldings = {};
        state.cryptoHoldings = {};
        state.financeInvestments  = [];
        state.businessInvestments = [];
        state.propertyInvestments = [];
        revertFlowLayerIncomeBoost(state);
        return `💥 破产陷阱触发！资产信托保护生效，取回 ${protectedAmount.toLocaleString()} 元，跌回平流层！`;
    }

    const previousCash   = state.cash;
    state.inFlow         = false;
    state.streamlinePos  = 0;
    state.inReverse      = false;
    state.cash           = Math.max(0, Math.floor(previousCash * 0.1));
    state.stockHoldings  = {};
    state.cryptoHoldings = {};
    state.financeInvestments  = [];
    state.businessInvestments = [];
    state.propertyInvestments = [];
    revertFlowLayerIncomeBoost(state);
    return `💥 破产陷阱！几乎失去所有资产，仅保留 ${state.cash.toLocaleString()} 元，跌回平流层。`;
}

function _handleDream(state, tile) {
    if (tile.needEnergy && state.energy >= tile.needEnergy) {
        state.energy -= tile.needEnergy;
        const dreamBonus = Math.floor(Math.random() * 100000) + 50000;
        state.passiveIncome += dreamBonus;
        return `✨ 实现梦想「${tile.name}」！消耗 ${tile.needEnergy} 精力，被动收入 +${dreamBonus.toLocaleString()} 元/月！`;
    } else if (tile.needEnergy) {
        return `⭐ 接近梦想「${tile.name}」，需要 ${tile.needEnergy} 精力 (当前 ${state.energy})`;
    }
    return null;
}

module.exports = { processFlowTile };