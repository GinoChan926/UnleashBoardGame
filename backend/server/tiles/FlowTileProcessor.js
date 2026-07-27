"use strict";

const { addTransactionRecord }           = require('../records/TransactionRecorder.js');
const { revertFlowLayerIncomeBoost }     = require('../systems/FlowLayerSystem.js');
const { retrieveAssetTrustOnBankruptcy } = require('../systems/AssetTrustSystem.js');
const { promptAssetTrustSetup }          = require('../systems/AssetTrustSystem.js');

function processFlowTile(state, tile, ws, roomId, player, room,
                         { broadcastToRoom, startAuction, processSocialServiceTile, investmentCards }) {

    if (!player || !state) return '❌ 數據異常';

    console.log(`🔍 processFlowTile: ${tile.type} - ${tile.name}`);

    switch (tile.type) {
        case 'asset_trust':
            promptAssetTrustSetup(state, ws);
            return null;

        case 'social_service':
            return processSocialServiceTile(state, ws, roomId, player, tile, room);

        // ✅ All investment tile types use the same flow
        case 'investment_tile':
        case 'investment':
            return _handleInvestmentTile(state, tile, ws, roomId, player, room,
                { broadcastToRoom, startAuction, investmentCards });

        // ✅ Dream tile also draws an investment card with energy requirement
        case 'dream':
            return _handleDreamTile(state, tile, ws, roomId, player, room,
                { broadcastToRoom, startAuction, investmentCards });

        case 'flowbankruptcy':
            return _processBankruptcy(state, ws, roomId, player, broadcastToRoom);

        case 'audit': {
            const taxAmt = Math.floor(state.totalAssets * 0.5);
            state.totalAssets = Math.max(0, state.totalAssets - taxAmt);
            state.luck        = Math.max(0, state.luck - 2);
            addTransactionRecord(player.playerName,
                { name: "查稅審計", type: "flow", id: "FLOW_AUDIT" },
                "查稅審計", -taxAmt,
                `損失 ${taxAmt.toLocaleString()} 元資產，幸運值 -2`, null, state);
            return `🔍 查稅審計！損失 ${taxAmt.toLocaleString()} 元資產，幸運值 -2`;
        }

        case 'income': {
            const bonus = 50000;
            state.cash += bonus;
            addTransactionRecord(player.playerName,
                { name: "分紅收入", type: "flow", id: "FLOW_BONUS" },
                "分紅收入", bonus, `獲得 ${bonus.toLocaleString()} 元`, null, state);
            return `💰 分紅收入！獲得 ${bonus.toLocaleString()} 元`;
        }

        case 'settlement':
            return null;

        default:
            return `📌 順流層格子：${tile.name}`;
    }
}

function _handleInvestmentTile(state, tile, ws, roomId, player, room,
                               { broadcastToRoom, startAuction, investmentCards }) {

    if (!investmentCards || investmentCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '📭 暫無投資卡數據' }));
        return '📭 暫無投資卡數據';
    }

    const card = investmentCards[Math.floor(Math.random() * investmentCards.length)];

    if (card.isAuction) {
        if (room.players.size < 2) {
            ws.send(JSON.stringify({ type: 'notification', message: '👤 需要至少2名玩家才能進行競拍！' }));
            return '👤 需要至少2名玩家';
        }
        startAuction(roomId, card, player, ws, broadcastToRoom);
        return null;
    }

    const serializableCard = {
        id:             card.id,
        name:           card.name,
        description:    card.description,
        image:          card.image || '',
        cost:           0,
        investmentCost: card.investmentCost || 0,
        energyCost:     card.energyCost || 0,
        monthlyReturn:  card.monthlyReturn || 0,
        pricePerUnit:   card.pricePerUnit || card.investmentCost || 0,
        cardType:       'investment',
        cardTypeName:   '投資',
        cardTypeIcon:   '🏗️',
        type:           'investment',
        freeReveal:     true,
        activationOnly: true
    };

    if (!room.pendingEvents) room.pendingEvents = new Map();
    const fullCard = {
        ...card,
        cost:         0,
        cardType:     'investment',
        cardTypeName: '投資',
        cardTypeIcon: '🏗️'
    };
    if (card.effect) fullCard.effect = card.effect.bind(card);

    room.pendingEvents.set(ws, {
        type:             'opportunity_card',
        card:             fullCard,
        cardType:         { id: 'investment', name: '投資', icon: '🏗️', color: '#ff6f00' },
        playerId:         player.playerId,
        purchased:        false,
        timestamp:        Date.now(),
        isInvestmentCard: true,
        tileName:         tile.name,
        skipPurchaseCost: true,
        activationOnly:   true
    });

    let hasOtherFlowPlayers = false;
    room.players.forEach((p) => {
        if (p.playerId !== player.playerId && p.gameState.inFlow) {
            hasOtherFlowPlayers = true;
        }
    });

    if (hasOtherFlowPlayers) {
        ws.send(JSON.stringify({
            type:           'opportunity_card_draw',
            card:           serializableCard,
            canAfford:      true,
            freeReveal:     true,
            activationOnly: true,
            message:        `🏗️ 你踩中了「${tile.name}」格子！免費查看一張投資卡，是否啟動？其他順流層玩家可以加入團購`
        }));

        broadcastToRoom(roomId, {
            type:    'notification',
            message: `🏗️ ${player.playerName} 在順流層踩中「${tile.name}」，正在發起團購投資...`
        }, ws);

        const { startGroupInvestment } = require('../systems/GroupInvestmentSystem.js');
        setTimeout(() => {
            startGroupInvestment(ws, roomId, player, fullCard, broadcastToRoom, rooms);
        }, 1000);

    } else {
        ws.send(JSON.stringify({
            type:           'opportunity_card_draw',
            card:           serializableCard,
            canAfford:      true,
            freeReveal:     true,
            activationOnly: true,
            message:        `🏗️ 你踩中了「${tile.name}」格子！免費查看一張投資卡，是否啟動？`
        }));

        broadcastToRoom(roomId, {
            type:    'notification',
            message: `🏗️ ${player.playerName} 在順流層踩中「${tile.name}」，正在查看投資機會...`
        }, ws);
    }

    return null;
}

function _handleDreamTile(state, tile, ws, roomId, player, room,
                          { broadcastToRoom, startAuction, investmentCards }) {

    // ✅ Check energy requirement first
    if (tile.needEnergy && state.energy < tile.needEnergy) {
        ws.send(JSON.stringify({
            type:    'notification',
            message: `⭐ 接近夢想「${tile.name}」，需要 ${tile.needEnergy} 精力 (當前 ${state.energy})`
        }));
        return `⭐ 接近夢想「${tile.name}」，需要 ${tile.needEnergy} 精力 (當前 ${state.energy})`;
    }

    if (!investmentCards || investmentCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '📭 暫無夢想卡數據' }));
        return '📭 暫無夢想卡數據';
    }

    const card = investmentCards[Math.floor(Math.random() * investmentCards.length)];

    if (card.isAuction) {
        if (room.players.size < 2) {
            ws.send(JSON.stringify({ type: 'notification', message: '👤 需要至少2名玩家才能進行競拍！' }));
            return '👤 需要至少2名玩家';
        }
        startAuction(roomId, card, player, ws, broadcastToRoom);
        return null;
    }

    const serializableCard = {
        id:             card.id,
        name:           card.name,
        description:    `🌟 實現夢想「${tile.name}」\n\n${card.description || ''}`,
        image:          card.image || '',
        cost:           0,
        investmentCost: card.investmentCost || 0,
        energyCost:     tile.needEnergy || 0,
        monthlyReturn:  card.monthlyReturn || 0,
        pricePerUnit:   card.pricePerUnit || card.investmentCost || 0,
        cardType:       'dream',
        cardTypeName:   '夢想',
        cardTypeIcon:   '🌟',
        type:           'dream',
        freeReveal:     true,
        activationOnly: true
    };

    if (!room.pendingEvents) room.pendingEvents = new Map();

    const originalEffect = card.effect;
    const fullCard = {
        ...card,
        cost:         0,
        cardType:     'dream',
        cardTypeName: '夢想',
        cardTypeIcon: '🌟'
    };

    // ✅ Wrap effect to deduct dream tile energy on activation
    if (originalEffect) {
        fullCard.effect = function(s, ...args) {
            if (tile.needEnergy && s.energy >= tile.needEnergy) {
                s.energy -= tile.needEnergy;
            }
            const result = originalEffect.call(card, s, ...args);
            return `🌟 實現夢想「${tile.name}」！消耗 ${tile.needEnergy || 0} 精力\n${result || ''}`;
        };
    }

    room.pendingEvents.set(ws, {
        type:             'opportunity_card',
        card:             fullCard,
        cardType:         { id: 'dream', name: '夢想', icon: '🌟', color: '#8e24aa' },
        playerId:         player.playerId,
        purchased:        false,
        timestamp:        Date.now(),
        isInvestmentCard: true,
        isDreamCard:      true,
        tileName:         tile.name,
        skipPurchaseCost: true,
        activationOnly:   true
    });

    ws.send(JSON.stringify({
        type:           'opportunity_card_draw',
        card:           serializableCard,
        canAfford:      true,
        freeReveal:     true,
        activationOnly: true,
        message:        `🌟 你踩中了夢想「${tile.name}」！免費查看夢想卡，是否啟動實現夢想？`
    }));

    broadcastToRoom(roomId, {
        type:    'notification',
        message: `🌟 ${player.playerName} 正在追逐夢想「${tile.name}」...`
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
        return `💥 破產陷阱觸發！資產信託保護生效，取回 ${protectedAmount.toLocaleString()} 元，跌回平流層！`;
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
    return `💥 破產陷阱！幾乎失去所有資產，僅保留 ${state.cash.toLocaleString()} 元，跌回平流層。`;
}

module.exports = { processFlowTile };