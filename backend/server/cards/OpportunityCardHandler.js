"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const { broadcastCardReveal } = require('../utils/CardBroadcastHelper.js');

const CARD_TYPES_META = {
    part_time: { id: 'part_time', name: '兼職類', icon: '💼', color: '#4caf50' },
    finance:   { id: 'finance',   name: '財務類', icon: '📈', color: '#2196f3' },
    business:  { id: 'business',  name: '創業類', icon: '🚀', color: '#ff9800' },
    property:  { id: 'property',  name: '地產類', icon: '🏠', color: '#9c27b0' }
};

function _isPartTimeCard(card, pendingEvent) {
    // Part-time = 兼職類
    const cardTypeId = pendingEvent?.cardType?.id || card.cardType;
    return cardTypeId === 'part_time';
}

function _isInvestmentEffect(card, pendingEvent) {
    // Part-time jobs are NOT investment
    if (_isPartTimeCard(card, pendingEvent)) return false;
    // Everything else (finance, business, property, dream, etc.) IS investment
    return true;
}

function showCardTypeSelection(ws, state, roomId, player, CARD_TYPES, room) {
    const cardTypes = Object.values(CARD_TYPES).map(t => ({
        id:    t.id,
        name:  t.name,
        icon:  t.icon,
        color: t.color,
        count: t.cards.length
    }));

    ws.send(JSON.stringify({
        type:      'card_type_selection',
        cardTypes,
        canAfford: state.cash >= 500
    }));

    if (!room.pendingTypeSelections) room.pendingTypeSelections = new Map();
    room.pendingTypeSelections.set(ws, {
        playerId:  player.playerId,
        timestamp: Date.now()
    });
}

function handleCardTypeChoice(ws, data, roomId, rooms, CARD_TYPES) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const cardTypeData = Object.values(CARD_TYPES).find(t => t.id === data.cardType);
    if (!cardTypeData) {
        ws.send(JSON.stringify({ type: 'error', message: '無效的卡片類型' }));
        return;
    }

    if (!cardTypeData.cards || cardTypeData.cards.length === 0) {
        ws.send(JSON.stringify({ type: 'error', message: '暫無卡片資料' }));
        return;
    }

    room.pendingTypeSelections?.delete(ws);

    const freeCardEntry = room.pendingIN03FreeCards?.get(ws);
    const isFree        = !!freeCardEntry;
    if (isFree) {
        room.pendingIN03FreeCards.delete(ws);
        console.log(`🎁 ${player.playerName} 從 IN03 免費抽卡`);
    }

    const originalCard = cardTypeData.cards[Math.floor(Math.random() * cardTypeData.cards.length)];

    const card = Object.create(originalCard);
    card.cardType     = cardTypeData.id;
    card.cardTypeName = cardTypeData.name;
    card.cardTypeIcon = cardTypeData.icon;

    // ✅ Lock price at draw time for stock/crypto cards
    if (originalCard.getCurrentPrice) {
        const lockedPrice = originalCard.currentPrice || 0;
        card._lockedPrice = lockedPrice;
        card.getCurrentPrice = function() {
            return this._lockedPrice;
        };
        console.log(`🔒 鎖定價格: ${originalCard.name} @ $${lockedPrice}`);
    }

    const serializableCard = {
        id:             originalCard.id,
        name:           originalCard.name,
        description:    originalCard.description,
        image:          originalCard.image,
        cost:           originalCard.cost,
        investmentCost: originalCard.investmentCost || 0,
        energyCost:     originalCard.energyCost || 0,
        cardType:       cardTypeData.id,
        cardTypeName:   cardTypeData.name,
        cardTypeIcon:   cardTypeData.icon,
        pricePerUnit:   originalCard.pricePerUnit,
        monthlyReturn:  originalCard.monthlyReturn,
        minUnits:       originalCard.minUnits,
        maxUnits:       originalCard.maxUnits,
        stockCode:      originalCard.stockCode,
        currentPrice:   card._lockedPrice || originalCard.currentPrice,  // ✅ Use locked price
        cryptoCode:     originalCard.cryptoCode,
        type:           originalCard.type
    };

    if (!room.pendingEvents) room.pendingEvents = new Map();
    room.pendingEvents.set(ws, {
        type:      'opportunity_card',
        card,
        cardType:  cardTypeData,
        playerId:  player.playerId,
        purchased: false,
        timestamp: Date.now(),
        skipPurchaseCost: isFree
    });

    ws.send(JSON.stringify({
        type:      'opportunity_card_draw',
        card:      serializableCard,
        canAfford: player.gameState.cash >= (500 * (player.gameState.cardCostMultiplier || 1))
    }));

    console.log(`🎴 ${player.playerName} 選擇${cardTypeData.name}，抽到: ${originalCard.name} (ID: ${originalCard.id})${card._lockedPrice ? ` @ $${card._lockedPrice}` : ''}`);
}

function handlePurchaseCard(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingEvents?.get(ws);
    if (!pendingEvent || pendingEvent.type !== 'opportunity_card') {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的機會卡' }));
        return;
    }

    // ✅ Flow layer investment tiles are free to reveal — skip $500 charge
    if (pendingEvent.skipPurchaseCost) {
        pendingEvent.purchased    = true;
        pendingEvent.purchaseTime = Date.now();

        const card          = pendingEvent.card;
        const effectPreview = _getCardEffectPreview(card, player.gameState);

        const serializableCard = {
            id:             card.id,
            name:           card.name,
            description:    card.description,
            image:          card.image,
            investmentCost: card.investmentCost || 0,
            energyCost:     card.energyCost     || 0,
            cardType:       pendingEvent.cardType?.id   || 'investment',
            cardTypeName:   pendingEvent.cardType?.name || '投資',
            cardTypeIcon:   pendingEvent.cardType?.icon || '🏗️',
            currentPrice:   card._lockedPrice || card.currentPrice || 0,
            activationOnly: true   // ✅ tell client to show "啟動" not "購買"
        };

        ws.send(JSON.stringify({
            type:           'card_purchased',
            card:           serializableCard,
            effectPreview,
            activationOnly: true,
            message:        `免費查看「${card.name}」，是否啟動？`,
            gameState:      player.gameState
        }));

        // ✅ No broadcastToRoom here — other players don't need to know yet
        console.log(`🏗️ ${player.playerName} 免費查看順流層投資卡: ${card.name}`);
        return;
    }

    // ── Normal $500 purchase flow ─────────────────────────────────────────────
    const baseCost   = 500;
    const multiplier = player.gameState.cardCostMultiplier || 1;
    const actualCost = baseCost * multiplier;

    const { spendForNonInvestment: _spendFee } = require('../systems/WalletSystem.js');
    const feeResult = _spendFee(player.gameState, actualCost);
    if (!feeResult.success) {
        ws.send(JSON.stringify({
            type: 'purchase_failed',
            message: feeResult.message + `（$${actualCost.toLocaleString()} 抽卡費）`
        }));
        room.pendingEvents.delete(ws);
        return;
    }
    pendingEvent.purchased    = true;
    pendingEvent.purchaseTime = Date.now();

    const card          = pendingEvent.card;
    const effectPreview = _getCardEffectPreview(card, player.gameState);

    const serializableCard = {
        id:             card.id,
        name:           card.name,
        description:    card.description,
        image:          card.image,
        investmentCost: card.investmentCost || 0,
        energyCost:     card.energyCost     || 0,
        cardType:       pendingEvent.cardType?.id   || 'general',
        cardTypeName:   pendingEvent.cardType?.name || '機會卡',
        cardTypeIcon:   pendingEvent.cardType?.icon || '🎴',
        currentPrice:   card._lockedPrice || card.currentPrice || 0
    };

    ws.send(JSON.stringify({
        type:      'card_purchased',
        card:      serializableCard,
        effectPreview,
        message:   `已支付 ${actualCost} 元購買「${card.name}」`,
        gameState: player.gameState
    }));

    broadcastToRoom(roomId, {
        type:      'state_updated',
        playerId:  player.playerId,
        gameState: player.gameState
    });

    broadcastToRoom(roomId, {
        type:       'player_purchased_card',
        playerId:   player.playerId,
        playerName: player.playerName,
        cardName:   card.name,
        message:    `${player.playerName} 花費 ${actualCost} 元購買了「${card.name}」`
    }, ws);

    broadcastCardReveal({
        roomId,
        drawerWs: ws,
        drawerName: player.playerName,
        drawerId: player.playerId,
        card: pendingEvent.card,
        action: pendingEvent.skipPurchaseCost
            ? '免費啟動投資卡'
            : `花費 $${actualCost.toLocaleString()} 購買了機會卡`,
        effectMessage: '',
        broadcastToRoom
    });
}

function handleExecuteCard(ws, data, roomId, rooms, broadcastToRoom, CARD_TYPES, tipCards) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pendingEvent = room.pendingEvents?.get(ws);
    if (!pendingEvent || pendingEvent.type !== 'opportunity_card' || !pendingEvent.purchased) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有已購買的機會卡' }));
        return;
    }

    const card        = pendingEvent.card;
    const execute     = data.execute;
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));
    let   effectResult = '';
    let   resultMessage = '';

    if (execute) {
        const isInvestment = _isInvestmentEffect(card, pendingEvent);
        const { spendForInvestment, canAffordInvestment } = require('../systems/WalletSystem.js');

        // ✅ Pre-check funds for investment cards
        const investmentCost = card.investmentCost || 0;
        if (isInvestment && investmentCost > 0
            && !canAffordInvestment(player.gameState, investmentCost)) {
            ws.send(JSON.stringify({
                type: 'notification',
                message: `❌ 資金不足！投資需要 $${investmentCost.toLocaleString()}，你只有 $${(player.gameState.cash + (player.gameState.loanCash || 0)).toLocaleString()}`
            }));
            room.pendingEvents.delete(ws);
            return;
        }

        // ✅ Snapshot cash to detect what the card spent
        const cashSnapshot = player.gameState.cash || 0;

        effectResult = _executeCardLogic(card, data, player, room, ws, roomId);
        if (effectResult === null) return;

        // ✅ If investment card spent cash, reroute through wallet (loanCash first)
        if (isInvestment && !card._skipWalletInterceptor) {
            const cashAfter = player.gameState.cash || 0;
            const cashSpent = cashSnapshot - cashAfter;

            if (cashSpent > 0) {
                // Undo raw deduction
                player.gameState.cash = cashSnapshot;

                // Redo via wallet
                const spendResult = spendForInvestment(player.gameState, cashSpent);
                if (spendResult.spentLoan > 0) {
                    effectResult += ` | 🏦 貸款金 -$${spendResult.spentLoan.toLocaleString()}`;
                    if (spendResult.spentRegular > 0) {
                        effectResult += ` + 現金 -$${spendResult.spentRegular.toLocaleString()}`;
                    }
                }
            }
        }

        resultMessage = `✨ 執行「${card.name}」成功！${effectResult}`;

        addTransactionRecord(player.playerName, card, '執行',
            (player.gameState.cash + (player.gameState.loanCash || 0))
            - (stateBefore.cash + (stateBefore.loanCash || 0)),
            effectResult, stateBefore, player.gameState);

        if (pendingEvent.skipPurchaseCost && pendingEvent.isInvestmentCard) {
            player.gameState.flowInvestments = player.gameState.flowInvestments || [];
            player.gameState.flowInvestments.push({
                id:            card.id,
                name:          card.name,
                image:         card.image || '',
                tileName:      pendingEvent.tileName || '',
                cost:          card.investmentCost || 0,
                monthlyReturn: card.monthlyReturn || 0,
                purchasedAt:   Date.now()
            });
        }

        if (player.gameState.cash > cashSnapshot
            && player.gameState.pendingDebts?.length > 0) {
            const { processDebtCollection } = require('../systems/AutoDebtSystem.js');
            const paidDebts = processDebtCollection(player, room, roomId, broadcastToRoom);
            const totalRepaid = paidDebts.reduce((s, d) => s + d.paidAmount, 0);
            if (totalRepaid > 0) {
                resultMessage += ` | 💸 自動償還債務 $${totalRepaid.toLocaleString()}`;
                effectResult  += ` | 💸 自動償還債務 $${totalRepaid.toLocaleString()}`;
            }
        }

        broadcastToRoom(roomId, {
            type: 'card_executed', playerId: player.playerId, playerName: player.playerName,
            cardName: card.name, cardType: pendingEvent.cardType?.name || '機會卡',
            effectMessage: effectResult, gameState: player.gameState
        });

        // ✅ Property choice feature (H01 - H05)
        if (card.hasPropertyChoiceFeature) {
            console.log(`🏠 房產選擇觸發: ${player.playerName} - ${card.name}`);

            const { startPropertyChoice } = require('../systems/PropertyChoiceSystem.js');

            // Send base result first
            ws.send(JSON.stringify({
                type: 'card_decision_result', execute, message: resultMessage,
                gameState: player.gameState, cardName: card.name, effectMessage: effectResult
            }));

            room.pendingEvents.delete(ws);

            broadcastToRoom(roomId, {
                type: 'state_updated', playerId: player.playerId, gameState: player.gameState
            });

            // Prompt player after brief delay
            setTimeout(() => {
                startPropertyChoice(ws, roomId, player, card, broadcastToRoom);
            }, 500);

            return; // skip normal response
        }

        // ✅ C17 - Health share feature (does NOT return - continues to auto draw or normal flow)
        if (card.hasHealthShareFeature) {
            console.log(`💚 大學飯堂健康分配觸發: ${player.playerName}`);

            const { distributeHealth } = require('../systems/HealthShareSystem.js');
            const healthAmount = card.healthToShare || 6;

            const result = distributeHealth(player, room, roomId, healthAmount, broadcastToRoom);

            let healthMsg = '';
            if (result.recipients.length === 0) {
                healthMsg = `💚 無其他玩家，你獲得全部 ${healthAmount} 健康`;
            } else {
                const recipientList = result.recipients
                    .map(r => `${r.playerName} +${r.amount}`)
                    .join('、');
                healthMsg = `💚 分配 ${result.distributed} 健康給: ${recipientList}`;
                if (result.remainder > 0) {
                    healthMsg += `，剩餘 ${result.remainder} 健康自留`;
                }
            }

            ws.send(JSON.stringify({
                type: 'notification',
                message: healthMsg
            }));

            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: player.playerId,
                gameState: player.gameState
            });
        }

        // ✅ C20 - Energy trade feature
        if (card.hasEnergyTradeFeature) {
            console.log(`💚 精力交易觸發: ${player.playerName}`);

            const { startEnergyTrade } = require('../systems/EnergyTradeSystem.js');
            const energyAmount = card.energyToSell || 5;

            // Send base card result first
            ws.send(JSON.stringify({
                type: 'card_decision_result', execute, message: resultMessage,
                gameState: player.gameState, cardName: card.name, effectMessage: effectResult
            }));

            room.pendingEvents.delete(ws);

            broadcastToRoom(roomId, {
                type: 'state_updated', playerId: player.playerId, gameState: player.gameState
            });

            // Prompt seller to set price after brief delay
            setTimeout(() => {
                startEnergyTrade(ws, roomId, player, energyAmount, broadcastToRoom, rooms);
            }, 500);

            return; // skip normal response
        }

        // ✅ C17 - Auto draw tip cards feature (player advances through cards)
        if (card.hasAutoDrawTipCardsFeature) {
            console.log(`🎁 大學飯堂錦囊抽卡觸發: ${player.playerName}`);

            const { startAutoTipDraw } = require('../systems/AutoTipDrawSystem.js');
            const drawCount = card.autoDrawTipCount || 2;

            // Send base result first
            ws.send(JSON.stringify({
                type: 'card_decision_result', execute, message: resultMessage,
                gameState: player.gameState, cardName: card.name, effectMessage: effectResult
            }));

            room.pendingEvents.delete(ws);

            broadcastToRoom(roomId, {
                type: 'state_updated', playerId: player.playerId, gameState: player.gameState
            });

            // ✅ Capture tipCards in closure
            const tipCardsRef = tipCards;

            setTimeout(() => {
                startAutoTipDraw(ws, roomId, player, tipCardsRef, drawCount, broadcastToRoom);
            }, 1000);

            return; // skip normal response
        }

        // ✅ Check if card triggers auxiliary police feature BEFORE cleanup
        if (card.hasPoliceCardFeature) {
            console.log(`👮 輔警功能觸發: ${player.playerName} 即將抽取警察卡`);

            const { handleAuxiliaryPoliceCard } = require('./AuxiliaryPoliceHandler.js');

            let policeCardsData = [];
            try {
                policeCardsData = require('../../police_cards.js').policeCards || [];
            } catch (e) {
                console.log('⚠️ 無法載入警察卡資料');
            }

            ws.send(JSON.stringify({
                type: 'card_decision_result', execute, message: resultMessage,
                gameState: player.gameState, cardName: card.name, effectMessage: effectResult
            }));

            room.pendingEvents.delete(ws);

            broadcastToRoom(roomId, {
                type: 'state_updated', playerId: player.playerId, gameState: player.gameState
            });

            setTimeout(() => {
                handleAuxiliaryPoliceCard(ws, roomId, player, policeCardsData, rooms, broadcastToRoom);
            }, 500);

            return;
        }

        // ✅ Check if card triggers AI無人便利店 draw feature
        if (card.hasDrawCardsFeature) {
            const { handleAIStoreDraw } = require('./AIStoreHandler.js');

            ws.send(JSON.stringify({
                type: 'card_decision_result', execute, message: resultMessage,
                gameState: player.gameState, cardName: card.name, effectMessage: effectResult
            }));

            room.pendingEvents.delete(ws);
            broadcastToRoom(roomId, {
                type: 'state_updated', playerId: player.playerId, gameState: player.gameState
            });

            setTimeout(() => {
                handleAIStoreDraw(ws, roomId, player, CARD_TYPES, rooms, broadcastToRoom);
            }, 500);

            return;
        }

        // ✅ Check if card triggers tip card draw (C07 無人機快遞)
        if (card.hasDrawTipCardsFeature) {
            console.log(`🎁 錦囊卡抽選觸發: ${player.playerName}`);

            const { handleTipCardDraw } = require('./TipCardDrawHandler.js');

            const drawCount = card.drawTipCount || 3;
            const pickCount = card.pickTipCount || 1;

            ws.send(JSON.stringify({
                type: 'card_decision_result', execute, message: resultMessage,
                gameState: player.gameState, cardName: card.name, effectMessage: effectResult
            }));

            room.pendingEvents.delete(ws);

            broadcastToRoom(roomId, {
                type: 'state_updated', playerId: player.playerId, gameState: player.gameState
            });

            const tipCardsRef = tipCards;

            setTimeout(() => {
                handleTipCardDraw(ws, roomId, player, tipCardsRef, drawCount, pickCount, broadcastToRoom);
            }, 500);

            return;
        }
        // ✅ Trigger group finance for stock/crypto cards after buy
        const isFinanceCard = !!(card.stockCode || card.cryptoCode || card.getCurrentPrice);

        if (isFinanceCard) {
            const { startGroupFinance } = require('../systems/GroupFinanceSystem.js');

            // Get locked price from player's holdings if they bought, otherwise use card's locked price
            let lockedPrice = card._lockedPrice || card.currentPrice || 0;

            // If player 1 did buy, use their actual purchase price
            if (data.stockAction === 'buy' && player.gameState.stockHoldings?.[card.id]) {
                lockedPrice = player.gameState.stockHoldings[card.id].lastPrice ||
                    player.gameState.stockHoldings[card.id].purchasePrice;
            } else if (data.cryptoAction === 'buy' && player.gameState.cryptoHoldings?.[card.id]) {
                lockedPrice = player.gameState.cryptoHoldings[card.id].lastPrice ||
                    player.gameState.cryptoHoldings[card.id].averagePrice;
            }

            const initiatorBought = (data.stockAction === 'buy' || data.cryptoAction === 'buy');

            setTimeout(() => {
                startGroupFinance(ws, roomId, player, card, broadcastToRoom, rooms, lockedPrice, initiatorBought);
            }, 1000);
        }
    } else {
        // ✅ Flow layer cards were free — don't say "$500 不退還"
        const wasFree = !!pendingEvent.skipPurchaseCost;

        resultMessage = wasFree
            ? `❌ 你決定不啟動「${card.name}」`
            : `❌ 你決定不執行「${card.name}」，500 元不退還。`;

        const isFinanceCard = !!(card.stockCode || card.cryptoCode || card.getCurrentPrice);
        if (isFinanceCard) {
            const { startGroupFinance } = require('../systems/GroupFinanceSystem.js');
            const lockedPrice = card._lockedPrice || card.currentPrice || 0;
            setTimeout(() => {
                startGroupFinance(ws, roomId, player, card, broadcastToRoom, rooms, lockedPrice, false);
            }, 1000);
        }

        addTransactionRecord(
            player.playerName, card, '放棄',
            wasFree ? 0 : -500,   // ✅ no loss if it was free
            '放棄執行',
            stateBefore,
            player.gameState
        );

        broadcastToRoom(roomId, {
            type:       'card_skipped',
            playerId:   player.playerId,
            playerName: player.playerName,
            cardName:   card.name,
            message:    resultMessage
        });
    }

    ws.send(JSON.stringify({
        type: 'card_decision_result', execute, message: resultMessage,
        gameState: player.gameState, cardName: card.name, effectMessage: effectResult
    }));

    room.pendingEvents.delete(ws);
    broadcastToRoom(roomId, { type: 'state_updated', playerId: player.playerId, gameState: player.gameState });
}

// ── Private ───────────────────────────────────────────────────────────────────

function _executeCardLogic(card, data, player, room, ws, roomId) {
    const state    = player.gameState;
    const cardId   = card.id || '';
    const isStock  = !!(card.stockCode  || /^F0[6-9]|^F1[0-7]/.test(cardId));
    const isCrypto = !!(card.cryptoCode || cardId === 'F03' || cardId === 'F04');
    const isFund   = !!(cardId === 'F02' || (card.type === 'finance' && card.pricePerUnit && card.monthlyReturn > 0));
    const isP2P    = !!(cardId === 'F05');
    const isParty  = !!(cardId === 'C03' && card.name === '派對房間');
    const isFood   = !!(cardId === 'C04' && card.name === '外賣店');
    const isUnitBusiness = card.type === 'business'
        && card.pricePerUnit
        && card.maxUnits > 1
        && !isFood
        && !isParty;


    // Party room
    if (isParty) return _handlePartyRoom(card, data, player, room, ws, roomId);
    // Food delivery
    if (isFood)  return _handleFoodDelivery(card, data, player, room, ws, roomId);
    // Business
    if (isUnitBusiness) return _handleUnitBusiness(card, data, player, room, ws, roomId);
    // Stock
    if (isStock  && card.getCurrentPrice && card.buy && card.sell)
        return _handleStock(card, data, player, ws, room);
    // Crypto
    if (isCrypto && card.getCurrentPrice && card.buy && card.sell)
        return _handleCrypto(card, data, player, ws);
    // Fund
    if (isFund)  return _handleFund(card, data, player, ws);
    // P2P
    if (isP2P)   return _handleP2P(card, data, player, ws);

    // Generic card
    return _handleGeneric(card, state, ws);
}

function _handleGeneric(card, state, ws) {
    const investmentCost = card.investmentCost || 0;
    const energyCost     = card.energyCost     || 0;

    if (investmentCost > 0 && state.cash < investmentCost) {
        ws.send(JSON.stringify({ type: 'notification', message: `❌ 現金不足` }));
        return '';
    }
    if (energyCost > 0 && state.energy < energyCost) {
        ws.send(JSON.stringify({ type: 'notification', message: `❌ 精力不足` }));
        return '';
    }

    const result = card.effect(state);

    // ✅ Track social contributions
    if (card.category === '貢獻社會' || card.cardType === 'social' ||
        (card.id && card.id.startsWith('CH'))) {
        state.contributionCount = (state.contributionCount || 0) + 1;
    }

    return result;
}

function _handlePartyRoom(card, data, player, room, ws, roomId) {
    const state          = player.gameState;
    const investmentCost = card.investmentCost || 250000;
    const energyCost     = card.energyCost     || 3;
    const selfEnergy     = card.selfEnergyGain  || 7;
    const otherEnergy    = card.otherEnergyGain || 2;

    if (state.cash < investmentCost || state.energy < energyCost) {
        ws.send(JSON.stringify({ type: 'notification', message: `❌ 條件不足，無法執行「${card.name}」` }));
        return '';
    }

    const result = card.effect(state);
    state.energy = Math.min(state.maxEnergy, state.energy + selfEnergy);

    room.players.forEach((otherPlayer, otherWs) => {
        if (otherWs !== ws) {
            otherPlayer.gameState.energy = Math.min(otherPlayer.gameState.maxEnergy, otherPlayer.gameState.energy + otherEnergy);
            otherWs.send(JSON.stringify({ type: 'notification', message: `🎉 ${player.playerName} 開設了派對房間！你獲得 ${otherEnergy} 精力！` }));
        }
    });

    return `${result} 所有玩家獲得精力獎勵！`;
}

function _handleFoodDelivery(card, data, player, room, ws, roomId) {
    const state      = player.gameState;
    const userAction = data.userAction || data.action;

    if (!userAction) {
        card._skipWalletInterceptor = true;
        // ✅ Send menu with both options
        ws.send(JSON.stringify({
            type:           'food_delivery_menu',
            cardId:         card.id,
            cardName:       card.name,
            investmentCost: card.investmentCost || 100000,
            monthlyReturn:  card.monthlyReturn  || 8000,
            energyCost:     card.energyCost     || 3,
            exchangeCost:   card.exchangeCost   || 50000,
            exchangeEnergy: card.exchangeEnergy || 10,
            currentCash:    (state.cash || 0) + (state.loanCash || 0),
            currentEnergy:  state.energy,
            maxEnergy:      state.maxEnergy
        }));
        return null;
    }

    // ✅ userAction can be:
    //    - Legacy string: 'invest' | 'exchange'  (for backward compat)
    //    - Object: { invest: bool, exchange: bool }
    const doInvest = userAction === 'invest'
        || (typeof userAction === 'object' && userAction.invest === true);
    const doExchange = userAction === 'exchange'
        || (typeof userAction === 'object' && userAction.exchange === true);

    if (!doInvest && !doExchange) {
        return `❌ 你放棄了外賣店的所有選項`;
    }

    const { canAffordInvestment, spendForInvestment,
        canAffordNonInvestment, spendForNonInvestment } =
        require('../systems/WalletSystem.js');

    const results = [];

    // ── Option: Invest in restaurant (INVESTMENT — uses loanCash first) ─────
    if (doInvest) {
        const investCost = card.investmentCost || 100000;
        const energyCost = card.energyCost     || 3;

        if (state.energy < energyCost) {
            results.push(`❌ 精力不足 ${energyCost} 點，無法開設外賣店`);
        } else if (!canAffordInvestment(state, investCost)) {
            results.push(
                `❌ 資金不足 $${investCost.toLocaleString()}，無法開設外賣店`
            );
        } else {
            // Note: the outer handleExecuteCard interceptor already handles
            // wallet routing for the card's cash deduction.
            // But since we do the deduction ourselves inline here, we route directly.
            const spendResult = spendForInvestment(state, investCost);
            state.energy        -= energyCost;
            state.passiveIncome += (card.monthlyReturn || 8000);
            state.totalAssets   += investCost;

            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id:            card.id,
                name:          card.name,
                cost:          investCost,
                monthlyReturn: card.monthlyReturn || 8000,
                energyCost:    energyCost,
                layer:         state.inFlow ? 'flow' : 'streamline',   // ✅ NEW
                purchasedAt:   Date.now()
            });

            let msg = `✅ 開設外賣店成功！投資 $${investCost.toLocaleString()}` +
                `，被動收入 +$${(card.monthlyReturn || 8000).toLocaleString()}/月，精力 -${energyCost}`;

            if (spendResult.spentLoan > 0) {
                msg += ` (使用貸款金 $${spendResult.spentLoan.toLocaleString()}` +
                    (spendResult.spentRegular > 0
                        ? ` + 現金 $${spendResult.spentRegular.toLocaleString()}`
                        : '') + `)`;
            }

            results.push(msg);
        }
    }

    // ── Option: Exchange energy (NON-INVESTMENT — regular cash only) ────────
    if (doExchange) {
        const exchangeCost   = card.exchangeCost   || 50000;
        const exchangeEnergy = card.exchangeEnergy || 10;

        if (!canAffordNonInvestment(state, exchangeCost)) {
            results.push(
                `❌ 現金不足 $${exchangeCost.toLocaleString()}，無法兌換 ${exchangeEnergy} 精力` +
                `（貸款金不可用於此）`
            );
        } else {
            spendForNonInvestment(state, exchangeCost);
            const before = state.energy;
            state.energy = Math.min(state.maxEnergy, state.energy + exchangeEnergy);
            const actualGain = state.energy - before;

            results.push(
                `✅ 兌換 ${actualGain} 精力成功！花費 $${exchangeCost.toLocaleString()}` +
                (actualGain < exchangeEnergy
                    ? ` (原本 ${exchangeEnergy} 精力，因達上限 ${state.maxEnergy} 只獲得 ${actualGain})`
                    : '')
            );
        }
    }

    return results.join('\n');
}

function _handleUnitBusiness(card, data, player, room, ws, roomId) {
    const state = player.gameState;
    const units = data.units;

    // First call — no units specified, send menu
    if (units === undefined || units === null) {
        // Count existing units of this card
        const existing = state.businessInvestments?.find(inv => inv.id === card.id);
        const existingUnits = existing?.units || 0;
        const remainingSlots = (card.maxUnits || 1) - existingUnits;

        ws.send(JSON.stringify({
            type:               'business_unit_menu',
            cardId:             card.id,
            cardName:           card.name,
            cardImage:          card.image || '',
            cardDescription:    card.description || '',
            pricePerUnit:       card.pricePerUnit,
            monthlyReturnPerUnit: card.monthlyReturn,
            energyCostPerUnit:  card.energyCostPerUnit || 0,
            minUnits:           Math.max(1, card.minUnits || 1),
            maxUnits:           card.maxUnits || 1,
            existingUnits,
            remainingSlots,
            currentCash:        (state.cash || 0) + (state.loanCash || 0),
            currentEnergy:      state.energy,
            maxEnergy:          state.maxEnergy
        }));
        return null;   // wait for menu response
    }

    // Second call — execute
    const chosenUnits = parseInt(units) || 0;
    if (chosenUnits <= 0) {
        return `❌ 你放棄了「${card.name}」的購買`;
    }

    // Cap at remaining slots
    const existing        = state.businessInvestments?.find(inv => inv.id === card.id);
    const existingUnits   = existing?.units || 0;
    const remainingSlots  = (card.maxUnits || 1) - existingUnits;
    const actualUnits     = Math.min(chosenUnits, remainingSlots);

    if (actualUnits <= 0) {
        return `❌ 已達最大投資數量 (${card.maxUnits}部)，無法繼續投資`;
    }

    const totalCost   = actualUnits * card.pricePerUnit;
    const totalEnergy = actualUnits * (card.energyCostPerUnit || 0);
    const totalReturn = actualUnits * card.monthlyReturn;

    // ✅ Check energy
    if (state.energy < totalEnergy) {
        return `❌ 精力不足 ${totalEnergy} 點，無法購買 ${actualUnits} 部`;
    }

    // ✅ Check funds (investment — cash + loanCash)
    const { canAffordInvestment, spendForInvestment } =
        require('../systems/WalletSystem.js');

    if (!canAffordInvestment(state, totalCost)) {
        return `❌ 資金不足 $${totalCost.toLocaleString()}，無法購買 ${actualUnits} 部`;
    }

    // ✅ Deduct via wallet (loanCash first)
    // Mark to skip interceptor since we handle it here
    card._skipWalletInterceptor = true;

    const spendResult = spendForInvestment(state, totalCost);
    state.energy        -= totalEnergy;
    state.passiveIncome += totalReturn;
    state.totalAssets   += totalCost;

    // Record investment
    state.businessInvestments = state.businessInvestments || [];
    if (existing) {
        existing.units         += actualUnits;
        existing.totalCost     += totalCost;
        existing.monthlyReturn  = existing.units * card.monthlyReturn;
    } else {
        state.businessInvestments.push({
            id:            card.id,
            name:          card.name,
            units:         actualUnits,
            pricePerUnit:  card.pricePerUnit,
            monthlyReturn: card.monthlyReturn * actualUnits,
            totalCost:     totalCost,
            layer:         state.inFlow ? 'flow' : 'streamline',   // ✅ NEW
            purchasedAt:   Date.now()
        });
    }

    const currentUnits = existingUnits + actualUnits;
    const remaining    = (card.maxUnits || 1) - currentUnits;

    let msg = `✅ 購買 ${actualUnits} 部「${card.name}」成功！\n` +
        `   💰 花費: $${totalCost.toLocaleString()}\n` +
        `   📈 被動收入: +$${totalReturn.toLocaleString()}/月\n` +
        `   ⚡ 精力: -${totalEnergy}\n` +
        `   📊 目前持有: ${currentUnits}/${card.maxUnits} 部` +
        (remaining > 0 ? `（剩餘 ${remaining} 部可投資）` : '（已達上限）');

    if (spendResult.spentLoan > 0) {
        msg += `\n   🏦 使用貸款金: $${spendResult.spentLoan.toLocaleString()}`;
        if (spendResult.spentRegular > 0) {
            msg += ` + 現金: $${spendResult.spentRegular.toLocaleString()}`;
        }
    }

    return msg;
}

function _handleStock(card, data, player, ws, room) {
    const state       = player.gameState;
    const stockAction = data.stockAction;
    const shares      = data.shares;

    if (!stockAction) {
        const currentPrice = card.getCurrentPrice(state);
        const holding      = card.getHoldingsInfo?.(state);
        ws.send(JSON.stringify({
            type: 'stock_menu', cardId: card.id, cardName: card.name,
            holding, currentPrice,
            minShares: card.minShares || 100, shareMultiple: card.shareMultiple || 100
        }));
        return null;
    }

    const minShares    = card.minShares    || 100;
    const shareMultiple = card.shareMultiple || 100;

    if (stockAction === 'buy') {
        if (!shares || shares < minShares || shares % shareMultiple !== 0) return '';
        const totalCost = shares * card.getCurrentPrice(state);
        if (state.cash < totalCost) return '';
        return card.buy(state, shares).message;
    }
    if (stockAction === 'sell') {
        const holding = card.getHoldingsInfo?.(state);
        if (!shares || !holding || holding.shares < shares) return '';
        return card.sell(state, shares).message;
    }
    return '';
}

function _handleCrypto(card, data, player, ws) {
    const state        = player.gameState;
    const cryptoAction = data.cryptoAction;
    const units        = data.units;

    if (!cryptoAction) {
        ws.send(JSON.stringify({
            type: 'crypto_menu', cardId: card.id, cardName: card.name,
            currentPrice: card.getCurrentPrice(state),
            holding: card.getHoldingsInfo?.(state),
            minUnits: card.minUnits || 1, cryptoCode: card.cryptoCode
        }));
        return null;
    }

    const minUnits = card.minUnits || 1;
    if (cryptoAction === 'buy') {
        if (!units || units < minUnits) return '';
        if (state.cash < units * card.getCurrentPrice(state)) return '';
        return card.buy(state, units).message;
    }
    if (cryptoAction === 'sell') {
        const holding = card.getHoldingsInfo(state);
        if (!units || !holding || holding.units < units) return '';
        return card.sell(state, units).message;
    }
    return '';
}

function _handleFund(card, data, player, ws) {
    const state     = player.gameState;
    const fundUnits = data.units || card.minUnits || 1;
    const totalCost = fundUnits * card.pricePerUnit;
    if (state.cash < totalCost) { ws.send(JSON.stringify({ type: 'notification', message: `❌ 現金不足` })); return ''; }
    return card.effect(state, fundUnits);
}

function _handleP2P(card, data, player, ws) {
    const state     = player.gameState;
    const p2pUnits  = data.units || 100;
    const totalCost = p2pUnits * card.pricePerUnit;
    if (state.cash < totalCost) { ws.send(JSON.stringify({ type: 'notification', message: `❌ 現金不足` })); return ''; }
    return card.effect(state, p2pUnits);
}

function _getCardEffectPreview(card, state) {
    const tempState = JSON.parse(JSON.stringify(state));
    let effectResult = `執行「${card.name}」`;
    try {
        if (card.effect && !card.getCurrentPrice) effectResult = card.effect(tempState) || effectResult;
    } catch (e) { /* ignore */ }
    if (typeof effectResult !== 'string') effectResult = String(effectResult);

    return {
        description:  effectResult,
        changes: {
            cashChange:           tempState.cash         - state.cash,
            passiveIncomeChange:  tempState.passiveIncome - state.passiveIncome,
            salaryChange:         tempState.salary        - state.salary,
            energyChange:         tempState.energy        - state.energy,
            sideIncomeChange:     tempState.sideIncome    - state.sideIncome
        },
        canAfford:     (card.investmentCost || 0) === 0 || state.cash >= (card.investmentCost || 0),
        investmentCost: card.investmentCost || 0
    };
}

module.exports = { showCardTypeSelection, handleCardTypeChoice, handlePurchaseCard, handleExecuteCard };