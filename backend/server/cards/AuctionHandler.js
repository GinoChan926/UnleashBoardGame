"use strict";

// ── Stub auction state ────────────────────────────────────────────────────────
// Each entry: { card, initiatorId, initiatorName, currentPrice, currentBidder,
//               minBidIncrement, energyReward, passes: Set<playerId> }
const activeAuctions = new Map(); // auctionId → auctionState

function startAuction(roomId, card, player, ws, broadcastToRoom) {
    const auctionId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // ✅ Read from auctionDetails first, fall back to top-level, then defaults
    const details = card.auctionDetails || {};

    const auctionState = {
        auctionId,
        card,
        roomId,
        initiatorId:      player.playerId,
        initiatorName:    player.playerName,
        currentPrice:     details.basePrice
            || card.startingPrice
            || card.investmentCost
            || 10000,
        currentBidder:    null,
        minBidIncrement:  details.minBidIncrement
            || card.minBidIncrement
            || 5000,
        energyReward:     details.energyReward
            || card.energyReward
            || 2,
        maxBidders:       details.maxBidders || null,
        passes:           new Set()
    };

    activeAuctions.set(auctionId, auctionState);

    broadcastToRoom(roomId, {
        type:            'auction_start',
        auctionId,
        cardName:        card.name,
        description:     card.description || '',
        currentPrice:    auctionState.currentPrice,
        currentBidder:   null,
        minBidIncrement: auctionState.minBidIncrement,
        energyReward:    auctionState.energyReward,
        initiator:       player.playerName
    });

    console.log(`🔨 競拍開始: ${card.name} (ID: ${auctionId}) - 底價 $${auctionState.currentPrice.toLocaleString()}，加價 $${auctionState.minBidIncrement.toLocaleString()}，獎勵 +${auctionState.energyReward} 精力`);
    return auctionId;
}

function handleAuctionBid(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const auction = activeAuctions.get(data.auctionId);
    if (!auction) {
        ws.send(JSON.stringify({ type: 'error', message: '競拍不存在或已結束' }));
        return;
    }

    const newPrice = auction.currentPrice + auction.minBidIncrement;

    // ✅ Use wallet system — investment can use cash + loanCash
    const { canAffordInvestment } = require('../systems/WalletSystem.js');

    if (!canAffordInvestment(player.gameState, newPrice)) {
        const total = (player.gameState.cash || 0) + (player.gameState.loanCash || 0);
        ws.send(JSON.stringify({
            type:    'error',
            message: `❌ 資金不足！出價需要 $${newPrice.toLocaleString()}，你只有 $${total.toLocaleString()} (現金+貸款金)`
        }));
        return;
    }

    auction.currentPrice  = newPrice;
    auction.currentBidder = player.playerName;
    auction.passes.clear();

    broadcastToRoom(roomId, {
        type:           'auction_update',
        auctionId:      auction.auctionId,
        currentPrice:   auction.currentPrice,
        currentBidder:  auction.currentBidder
    });

    console.log(`💰 ${player.playerName} 出價 ${newPrice.toLocaleString()} 元`);
}

function handleAuctionPass(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const auction = activeAuctions.get(data.auctionId);
    if (!auction) return;

    auction.passes.add(player.playerId);

    const totalPlayers = room.players.size;

    // End auction when everyone except current bidder has passed
    const nonBidderCount = auction.currentBidder
        ? totalPlayers - 1
        : totalPlayers;

    if (auction.passes.size >= nonBidderCount) {
        _endAuction(auction, roomId, rooms, broadcastToRoom);
    }
}

// ── Private ───────────────────────────────────────────────────────────────────

function _endAuction(auction, roomId, rooms, broadcastToRoom) {
    const room = rooms.get(roomId);
    activeAuctions.delete(auction.auctionId);

    if (!auction.currentBidder) {
        broadcastToRoom(roomId, {
            type:    'auction_end',
            auctionId: auction.auctionId,
            winner:  null,
            message: `🔨 競拍結束，無人出價，「${auction.card.name}」流拍。`
        });
        return;
    }

    let winnerPlayer = null;
    for (const [, p] of room.players) {
        if (p.playerName === auction.currentBidder) { winnerPlayer = p; break; }
    }

    if (winnerPlayer) {
        const { canAffordInvestment, spendForInvestment } =
            require('../systems/WalletSystem.js');

        if (canAffordInvestment(winnerPlayer.gameState, auction.currentPrice)) {
            spendForInvestment(winnerPlayer.gameState, auction.currentPrice);
        } else {
            winnerPlayer.gameState.cash = Math.max(0,
                (winnerPlayer.gameState.cash || 0) - auction.currentPrice);
        }

        winnerPlayer.gameState.energy = Math.min(
            winnerPlayer.gameState.maxEnergy,
            winnerPlayer.gameState.energy + auction.energyReward
        );

        const passiveIncomeSnapshot = winnerPlayer.gameState.passiveIncome || 0;

        if (auction.card.effect) {
            try { auction.card.effect(winnerPlayer.gameState); } catch (e) { /* ignore */ }
        }

        // ✅ Intercept passiveIncome changes for flow layer
        if (winnerPlayer.gameState.inFlow) {
            const passiveIncomeAfter = winnerPlayer.gameState.passiveIncome || 0;
            const passiveIncomeGained = passiveIncomeAfter - passiveIncomeSnapshot;
            if (passiveIncomeGained !== 0) {
                winnerPlayer.gameState.passiveIncome = passiveIncomeSnapshot;
                winnerPlayer.gameState.flowPassiveIncome = Math.max(0,
                    (winnerPlayer.gameState.flowPassiveIncome || 0) + passiveIncomeGained
                );
            }
        }

        // ✅ Always add to flowInvestments (regardless of current layer)
        winnerPlayer.gameState.flowInvestments = winnerPlayer.gameState.flowInvestments || [];
        winnerPlayer.gameState.flowInvestments.push({
            id:            auction.card.id,
            name:          auction.card.name,
            image:         auction.card.image || '',
            tileName:      '項目投資 (競拍)',
            cost:          auction.currentPrice,
            monthlyReturn: auction.card.monthlyReturn || 0,
            purchasedAt:   Date.now(),
            energyReward:  auction.energyReward,
            wonViaAuction: true
        });

        // Record transaction
        const { addTransactionRecord } = require('../records/TransactionRecorder.js');
        addTransactionRecord(
            winnerPlayer.playerName,
            auction.card,
            '競拍勝出',
            -auction.currentPrice,
            `以 $${auction.currentPrice.toLocaleString()} 贏得「${auction.card.name}」，精力 +${auction.energyReward}`,
            null,
            winnerPlayer.gameState
        );

    }

    broadcastToRoom(roomId, {
        type:      'auction_end',
        auctionId: auction.auctionId,
        winner:    auction.currentBidder,
        price:     auction.currentPrice,
        message:   `🏆 ${auction.currentBidder} 以 ${auction.currentPrice.toLocaleString()} 元赢得「${auction.card.name}」！精力 +${auction.energyReward}！`
    });

    if (winnerPlayer) {
        broadcastToRoom(roomId, {
            type: 'state_updated', playerId: winnerPlayer.playerId, gameState: winnerPlayer.gameState
        });
    }

    console.log(`🏆 競拍結束: ${auction.currentBidder} 赢得 ${auction.card.name} - $${auction.currentPrice.toLocaleString()}, +${auction.energyReward} 精力`);
}

module.exports = { startAuction, handleAuctionBid, handleAuctionPass };