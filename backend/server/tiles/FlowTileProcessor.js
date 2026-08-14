"use strict";

const { addTransactionRecord }           = require('../records/TransactionRecorder.js');
const { revertFlowLayerIncomeBoost }     = require('../systems/FlowLayerSystem.js');
const { promptAssetTrustSetup, applyAssetTrustProtection } = require('../systems/AssetTrustSystem.js');
const { getEffectivePassiveIncome } = require('../utils/helpers.js');
const { broadcastCardReveal }       = require('../utils/CardBroadcastHelper.js');   // ✅ NEW

function processFlowTile(state, tile, ws, roomId, player, room,
                         { broadcastToRoom, startAuction, processSocialServiceTile, investmentCards, dreamCards }) {

    if (!player || !state) return '❌ 數據異常';

    console.log(`🔍 processFlowTile: ${tile.type} - ${tile.name}`);

    switch (tile.type) {
        case 'asset_trust':
            promptAssetTrustSetup(state, ws);
            return null;

        case 'social_service':
            return processSocialServiceTile(state, ws, roomId, player, tile, room);

        case 'investment_tile':
        case 'investment':
            return _handleInvestmentTile(state, tile, ws, roomId, player, room,
                { broadcastToRoom, startAuction, investmentCards });

        case 'dream':
            return _handleDreamTile(state, tile, ws, roomId, player, room,
                { broadcastToRoom, startAuction, investmentCards, dreamCards });

        case 'flowbankruptcy':
            return _processBankruptcy(state, ws, roomId, player, broadcastToRoom);

        case 'audit': {
            const cashBefore = state.cash || 0;
            const taxAmt     = Math.floor(cashBefore * 0.5);

            const { canAffordNonInvestment, spendForNonInvestment } =
                require('../systems/WalletSystem.js');
            const { chargePlayer } = require('../systems/AutoDebtSystem.js');

            let actualPaid = 0;
            let debtMsg   = '';

            if (canAffordNonInvestment(state, taxAmt)) {
                spendForNonInvestment(state, taxAmt);
                actualPaid = taxAmt;
            } else {
                const result = chargePlayer(player, taxAmt, {
                    source:       '查稅審計',
                    creditor:     'bank',
                    creditorName: '稅務局',
                    room, roomId, broadcastToRoom, ws
                });
                actualPaid = result.paid;
                if (result.debtCreated) {
                    debtMsg = `\n💸 欠款 $${result.debtAmount.toLocaleString()} 待未來償還`;
                }
            }

            addTransactionRecord(
                player.playerName,
                { name: "查稅審計", type: "flow", id: "FLOW_AUDIT" },
                "查稅審計",
                -actualPaid,
                `查稅損失 $${taxAmt.toLocaleString()}${debtMsg}`,
                null,
                state
            );

            // ✅ NEW: Broadcast audit event to other players
            broadcastCardReveal({
                roomId,
                drawerWs:      ws,
                drawerName:    player.playerName,
                drawerId:      player.playerId,
                card: {
                    id:           `audit_${Date.now()}`,
                    name:         '查稅審計',
                    description:  `損失 $${taxAmt.toLocaleString()} 現金${debtMsg}`,
                    image:        '/cards/tiles/flow/audit.png',
                    cardType:     'audit',
                    cardTypeName: '順流層事件'
                },
                action:        '踩中查稅審計',
                effectMessage: `損失 $${taxAmt.toLocaleString()}`,
                broadcastToRoom
            });

            broadcastToRoom(roomId, {
                type:      'state_updated',
                playerId:  player.playerId,
                gameState: state
            });

            return `🔍 查稅審計！損失 $${taxAmt.toLocaleString()} 元${debtMsg}`;
        }

        case 'income': {
            const bonus = 50000;
            state.cash += bonus;
            addTransactionRecord(player.playerName,
                { name: "分紅收入", type: "flow", id: "FLOW_BONUS" },
                "分紅收入", bonus, `獲得 ${bonus.toLocaleString()} 元`, null, state);

            // ✅ NEW: Broadcast income event
            broadcastCardReveal({
                roomId,
                drawerWs:      ws,
                drawerName:    player.playerName,
                drawerId:      player.playerId,
                card: {
                    id:           `income_${Date.now()}`,
                    name:         '投資分紅',
                    description:  `獲得 $${bonus.toLocaleString()} 元分紅收入`,
                    image:        '/cards/tiles/flow/income.png',
                    cardType:     'income',
                    cardTypeName: '順流層事件'
                },
                action:        '踩中投資分紅',
                effectMessage: `+$${bonus.toLocaleString()}`,
                broadcastToRoom
            });

            return `💰 分紅收入！獲得 ${bonus.toLocaleString()} 元`;
        }

        case 'settlement':
            return _processFlowSettlement(state, ws, roomId, player, room, broadcastToRoom, true);

        case 'business_failure': {
            const cashBefore = state.cash || 0;
            const intendedLoss = Math.floor(cashBefore / 2);

            // ✅ Apply asset trust protection (if active)
            const protection = applyAssetTrustProtection(state, intendedLoss);
            const actualLoss = protection.actualLoss;

            // ✅ Non-investment: use regular cash only
            const { canAffordNonInvestment, spendForNonInvestment } =
                require('../systems/WalletSystem.js');
            const { chargePlayer } = require('../systems/AutoDebtSystem.js');

            let paidNow = 0;
            let debtMsg = '';

            if (actualLoss > 0) {
                if (canAffordNonInvestment(state, actualLoss)) {
                    spendForNonInvestment(state, actualLoss);
                    paidNow = actualLoss;
                } else {
                    const result = chargePlayer(player, actualLoss, {
                        source:       '生意失敗',
                        creditor:     'bank',
                        creditorName: '銀行',
                        room, roomId, broadcastToRoom, ws
                    });
                    paidNow = result.paid;
                    if (result.debtCreated) {
                        debtMsg = `\n💸 欠款 $${result.debtAmount.toLocaleString()} 待未來償還`;
                    }
                }
            }

            addTransactionRecord(
                player.playerName,
                { name: "生意失敗", type: "flow", id: "FLOW_BUSINESS_FAILURE" },
                "生意失敗",
                -paidNow,
                `損失 $${actualLoss.toLocaleString()}${debtMsg}` +
                (protection.protected
                    ? ` (🛡️ 資產信託吸收 $${protection.absorbedLoss.toLocaleString()})`
                    : ''),
                null,
                state
            );

            // ✅ Broadcast card reveal to other players
            broadcastCardReveal({
                roomId,
                drawerWs:      ws,
                drawerName:    player.playerName,
                drawerId:      player.playerId,
                card: {
                    id:           `bfail_${Date.now()}`,
                    name:         '生意失敗',
                    description:  `損失 $${actualLoss.toLocaleString()} 元`,
                    image:        '/cards/tiles/flow/business_failure.png',
                    cardType:     'business_failure',
                    cardTypeName: '順流層災難'
                },
                action:        '踩中生意失敗',
                effectMessage: `損失 $${actualLoss.toLocaleString()}`,
                broadcastToRoom
            });

            broadcastToRoom(roomId, {
                type:      'state_updated',
                playerId:  player.playerId,
                gameState: state
            });

            const trustMsg = protection.protected
                ? `\n🛡️ 資產信託保護生效！吸收 $${protection.absorbedLoss.toLocaleString()}`
                : '';

            return `💼 生意失敗！損失 $${actualLoss.toLocaleString()} 元 (現金的一半)${trustMsg}${debtMsg}`;
        }

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

    // ✅ NEW: Broadcast the investment card to other players
    broadcastCardReveal({
        roomId,
        drawerWs:      ws,
        drawerName:    player.playerName,
        drawerId:      player.playerId,
        card:          fullCard,
        action:        `在順流層「${tile.name}」抽到投資卡`,
        effectMessage: card.description || '',
        broadcastToRoom
    });

    return null;
}

function _handleDreamTile(state, tile, ws, roomId, player, room,
                          { broadcastToRoom, startAuction, dreamCards }) {

    if (!dreamCards) {
        ws.send(JSON.stringify({ type: 'notification', message: '📭 暫無夢想卡數據' }));
        return '📭 暫無夢想卡數據';
    }

    const dreamPool = Object.values(dreamCards);
    const card = dreamPool.find(c => c.name === tile.name);

    if (!card) {
        console.warn(`⚠️ No dream card found matching tile name "${tile.name}"`);
        ws.send(JSON.stringify({
            type: 'notification',
            message: `⚠️ 夢想「${tile.name}」尚未實裝`
        }));
        return `⚠️ 夢想「${tile.name}」尚未實裝`;
    }

    const needEnergy = tile.needEnergy || card.energyCost || 0;
    const investCost = card.investmentCost || 0;
    const totalCash  = (state.cash || 0) + (state.loanCash || 0);

    const lacks = [];
    if (needEnergy && state.energy < needEnergy) {
        lacks.push(`⚡ 精力不足 (需 ${needEnergy}，你有 ${state.energy})`);
    }
    if (investCost > totalCash) {
        lacks.push(`💵 資金不足 (需 $${investCost.toLocaleString()}，你有 $${totalCash.toLocaleString()})`);
    }

    const canAfford = lacks.length === 0;

    if (card.isAuction) {
        if (!canAfford) {
            _sendDreamModal(ws, tile, card, canAfford, lacks);
            return `⭐ 接近夢想「${tile.name}」，但條件不足`;
        }
        if (room.players.size < 2) {
            ws.send(JSON.stringify({ type: 'notification', message: '👤 需要至少2名玩家才能進行競拍！' }));
            return '👤 需要至少2名玩家';
        }
        startAuction(roomId, card, player, ws, broadcastToRoom);
        return null;
    }

    if (!room.pendingEvents) room.pendingEvents = new Map();

    const originalEffect = card.effect;
    const fullCard = {
        ...card,
        cost:         0,
        cardType:     'dream',
        cardTypeName: '夢想',
        cardTypeIcon: '🌟'
    };

    if (originalEffect) {
        fullCard.effect = function(s, ...args) {
            return originalEffect.call(card, s, ...args);
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
        activationOnly:   true,
        canAfford:        canAfford,
        blockedReasons:   lacks
    });

    _sendDreamModal(ws, tile, card, canAfford, lacks);

    broadcastToRoom(roomId, {
        type:    'notification',
        message: canAfford
            ? `🌟 ${player.playerName} 正在追逐夢想「${card.name}」...`
            : `⭐ ${player.playerName} 接近夢想「${card.name}」，但條件不足`
    }, ws);

    // ✅ NEW: Broadcast the dream card to other players
    broadcastCardReveal({
        roomId,
        drawerWs:      ws,
        drawerName:    player.playerName,
        drawerId:      player.playerId,
        card:          fullCard,
        action:        canAfford
            ? `踩中夢想「${tile.name}」`
            : `接近夢想「${tile.name}」（條件不足）`,
        effectMessage: card.description || '',
        broadcastToRoom
    });

    return null;
}

function _sendDreamModal(ws, tile, card, canAfford, lacks) {
    const serializableCard = {
        id:             card.id,
        name:           card.name,
        description:    card.description || '',
        image:          card.image || '',
        cost:           0,
        investmentCost: card.investmentCost || 0,
        energyCost:     tile.needEnergy || card.energyCost || 0,
        monthlyReturn:  card.monthlyReturn || 0,
        pricePerUnit:   card.pricePerUnit || card.investmentCost || 0,
        cardType:       'dream',
        cardTypeName:   '夢想',
        cardTypeIcon:   '🌟',
        type:           'dream',
        freeReveal:     true,
        activationOnly: true,
        canAfford,
        blockedReasons: lacks
    };

    ws.send(JSON.stringify({
        type:           'opportunity_card_draw',
        card:           serializableCard,
        canAfford,
        blockedReasons: lacks,
        freeReveal:     true,
        activationOnly: true,
        message:        canAfford
            ? `🌟 你踩中了夢想「${card.name}」！是否啟動實現？`
            : `⭐ 你踩中了夢想「${card.name}」！但你目前條件不足，只能觀看`
    }));
}

function _processBankruptcy(state, ws, roomId, player, broadcastToRoom) {
    const stateBefore = JSON.parse(JSON.stringify(state));

    const lostPassiveIncome = state.flowPassiveIncome || state.passiveIncome || 0;
    const lostSideIncome    = (state.sideIncome || 0) - (state.originalSideIncome || 0);

    state.flowInvestments = [];

    state.inFlow        = false;
    state.streamlinePos = 0;
    state.inReverse     = false;
    state.flowPos       = 0;
    state.health        = 0;

    state.stockHoldings        = {};
    state.cryptoHoldings       = {};
    state.financeInvestments   = [];
    state.businessInvestments  = [];
    state.propertyInvestments  = [];

    if (state.propertyMortgageExpense) {
        state.livingExpense = Math.max(0,
            (state.livingExpense || 0) - state.propertyMortgageExpense
        );
        state.propertyMortgageExpense = 0;
    }

    revertFlowLayerIncomeBoost(state);
    state.passiveIncome = 0;

    state.flowPassiveIncome           = 0;
    state.passiveIncomeBeforeFlow     = 0;
    state.passiveIncomeFlowMultiplier = 1;

    state.sideIncome = state.originalSideIncome || 0;
    state.ability = state.originalAbility || 0;

    state.totalAssets = state.cash;

    addTransactionRecord(
        player.playerName,
        { name: '破產陷阱', type: 'flow', id: 'FLOW_BANKRUPTCY' },
        '破產陷阱',
        0,
        `踩中破產陷阱！所有被動收入和投資消失，回到平流層。現金保留 $${state.cash.toLocaleString()}`,
        stateBefore,
        state
    );

    // ✅ NEW: Broadcast bankruptcy event
    broadcastCardReveal({
        roomId,
        drawerWs:      ws,
        drawerName:    player.playerName,
        drawerId:      player.playerId,
        card: {
            id:           `bankruptcy_${Date.now()}`,
            name:         '破產陷阱',
            description:  `失去所有投資與被動收入！跌回平流層。現金保留 $${state.cash.toLocaleString()}`,
            image:        '/cards/tiles/flow/bankruptcy.png',
            cardType:     'flowbankruptcy',
            cardTypeName: '順流層災難'
        },
        action:        '踩中破產陷阱',
        effectMessage: `失去 $${lostPassiveIncome.toLocaleString()}/月 被動收入`,
        broadcastToRoom
    });

    return `💥 破產陷阱！\n` +
        `💰 現金保留: $${state.cash.toLocaleString()}\n` +
        `📉 失去所有被動收入 (原 $${lostPassiveIncome.toLocaleString()}/月)\n` +
        `📊 所有投資（股票、加密貨幣、基金、生意、物業）清空\n` +
        `🌊 跌回平流層起點`;
}

function _processFlowSettlement(state, ws, roomId, player, room, broadcastToRoom, isLanding) {
    const { calculateReducedExpense } = require('../utils/helpers.js');
    const { processSettlementRepayment } = require('../systems/LoanSystem.js');
    const { spendForNonInvestment, canAffordNonInvestment,
        spendForInvestment,    canAffordInvestment } =
        require('../systems/WalletSystem.js');
    const { chargePlayer } = require('../systems/AutoDebtSystem.js');

    let reducibleIncome = state.salary + state.sideIncome;
    const passiveIncome = getEffectivePassiveIncome(state);

    if (state.nextSettlementHalfIncome) {
        reducibleIncome = Math.floor(reducibleIncome / 2);
        state.nextSettlementHalfIncome = false;
    }

    const totalIncome = reducibleIncome + passiveIncome;
    state.cash        += totalIncome;
    state.totalAssets += Math.floor(totalIncome * 0.2);

    const { processDebtCollection } = require('../systems/AutoDebtSystem.js');
    processDebtCollection(player, room, roomId, broadcastToRoom);

    const { totalExpense, savedAmount, reductionPercent } = calculateReducedExpense(state);

    const mortgageExpense  = state.propertyMortgageExpense || 0;
    const nonInvestExpense = Math.max(0, totalExpense - mortgageExpense);

    if (mortgageExpense > 0) {
        if (canAffordInvestment(state, mortgageExpense)) {
            spendForInvestment(state, mortgageExpense);
        } else {
            chargePlayer(player, mortgageExpense, {
                source: '順流層房貸月供', creditor: 'bank', creditorName: '銀行',
                room, roomId, broadcastToRoom, ws
            });
        }
    }

    if (nonInvestExpense > 0) {
        if (canAffordNonInvestment(state, nonInvestExpense)) {
            spendForNonInvestment(state, nonInvestExpense);
        } else {
            chargePlayer(player, nonInvestExpense, {
                source: '順流層結算支出', creditor: 'bank', creditorName: '銀行',
                room, roomId, broadcastToRoom, ws
            });
        }
    }

    const expenseReductionMessage = reductionPercent > 0
        ? ` (支出減少 ${reductionPercent}%，節省 ${savedAmount.toLocaleString()} 元)`
        : '';

    if (state.bakeryCount > 0) {
        state.energy = Math.min(state.maxEnergy, state.energy + state.bakeryCount);
    }

    const { processPropertyMortgages } = require('../systems/PropertyChoiceSystem.js');
    processPropertyMortgages(player, ws, broadcastToRoom, roomId);

    const repaymentResult = processSettlementRepayment(player, ws, roomId, broadcastToRoom);
    if (repaymentResult) {
        ws.send(JSON.stringify(repaymentResult));
        broadcastToRoom(roomId, repaymentResult, ws);
    }

    if (isLanding) {
        state.pendingSettlementRoll = true;
        state.settlementRollDiceCount = 2;
    }

    const settlementMsg = {
        type:                   'settlement',
        playerId:               player.playerId,
        playerName:             player.playerName,
        salary:                 state.salary,
        sideIncome:             state.sideIncome,
        totalIncome,
        totalExpense,
        expenseReductionMessage,
        teaRestaurantMessage:   '',
        isExactLanding:         isLanding,
        pendingSettlementRoll:  isLanding,
        diceCount:              2,
        gameState:              state
    };
    ws.send(JSON.stringify(settlementMsg));
    broadcastToRoom(roomId, settlementMsg, ws);

    return isLanding
        ? `🏝️ 順流層結算日！收入 $${totalIncome.toLocaleString()}${expenseReductionMessage} - 請擲 2 顆骰子獲取精力！`
        : `🏝️ 順流層結算日途經！收入 $${totalIncome.toLocaleString()}${expenseReductionMessage}`;
}

module.exports = { processFlowTile, _processFlowSettlement };