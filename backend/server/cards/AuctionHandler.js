"use strict";

// ── Stub auction state ────────────────────────────────────────────────────────
// Each entry: { card, initiatorId, initiatorName, currentPrice, currentBidder,
//               minBidIncrement, energyReward, passes: Set<playerId> }
const activeAuctions = new Map(); // auctionId → auctionState

function startAuction(roomId, card, player, ws, broadcastToRoom) {
    const auctionId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const auctionState = {
        auctionId,
        card,
        roomId,
        initiatorId:      player.playerId,
        initiatorName:    player.playerName,
        currentPrice:     card.startingPrice    || card.investmentCost || 10000,
        currentBidder:    null,
        minBidIncrement:  card.minBidIncrement  || 5000,
        energyReward:     card.energyReward     || 2,
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

    console.log(`🔨 競拍開始: ${card.name} (ID: ${auctionId})`);
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

    if (player.gameState.cash < newPrice) {
        ws.send(JSON.stringify({
            type:    'error',
            message: `❌ 现金不足！出價需要 ${newPrice.toLocaleString()} 元`
        }));
        return;
    }

    auction.currentPrice  = newPrice;
    auction.currentBidder = player.playerName;
    auction.passes.clear(); // reset passes after new bid

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

    // Find winner and apply effect
    let winnerPlayer = null;
    for (const [, p] of room.players) {
        if (p.playerName === auction.currentBidder) { winnerPlayer = p; break; }
    }

    if (winnerPlayer) {
        winnerPlayer.gameState.cash   -= auction.currentPrice;
        winnerPlayer.gameState.energy  = Math.min(
            winnerPlayer.gameState.maxEnergy,
            winnerPlayer.gameState.energy + auction.energyReward
        );

        if (auction.card.effect) {
            try { auction.card.effect(winnerPlayer.gameState); } catch (e) { /* ignore */ }
        }
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

    console.log(`🏆 競拍結束: ${auction.currentBidder} 赢得 ${auction.card.name}`);
}

module.exports = { startAuction, handleAuctionBid, handleAuctionPass };