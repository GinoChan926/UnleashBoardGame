"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const SERVER_CONFIG = require('../constants/ServerConfig.js');

/**
 * Energy trading system for C20 可持續發展碳中和釀酒廠.
 *
 * Flow:
 * 1. Seller sets a price for 5 energy
 * 2. All other players see the offer with buy/pass buttons
 * 3. First player to click "buy" wins (pays seller, receives energy)
 * 4. If all pass or 30 seconds pass, seller keeps the energy at their own price
 *    (net effect: seller loses the price amount, gains 5 energy)
 *
 * State per active trade:
 *   { tradeId, sellerId, price, energyAmount, roomId,
 *     responses: Map<playerId, 'buy' | 'pass'>,
 *     status: 'active' | 'sold' | 'expired' }
 */

const activeTrades  = new Map();  // tradeId → trade state
const TRADE_TIMEOUT = SERVER_CONFIG.energyTradeTimeoutSec;  // 30 seconds default

/**
 * Called after C20 executes. Prompts seller to set a price.
 */
function startEnergyTrade(ws, roomId, player, energyAmount, broadcastToRoom, rooms) {
    // Send price prompt to seller
    ws.send(JSON.stringify({
        type: 'energy_trade_price_prompt',
        energyAmount,
        message: `💚 你可從銀行提取 ${energyAmount} 精力向其他玩家開價出售！請設定售價：`
    }));

    console.log(`💚 ${player.playerName} 準備開始精力交易 (${energyAmount} 精力)`);
}

/**
 * Called when seller submits their price.
 */
function handleEnergyTradeSetPrice(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const price        = parseInt(data.price);
    const energyAmount = parseInt(data.energyAmount) || 5;

    if (!price || price < 1) {
        ws.send(JSON.stringify({ type: 'error', message: '請輸入有效的價格' }));
        return;
    }

    // Check if there are other players
    const otherPlayers = [];
    room.players.forEach((p, otherWs) => {
        if (p.playerId !== player.playerId) {
            otherPlayers.push({ ws: otherWs, player: p });
        }
    });

    if (otherPlayers.length === 0) {
        // No other players - create trade and prompt seller to decide
        const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        const trade = {
            tradeId,
            sellerId:      player.playerId,
            sellerName:    player.playerName,
            sellerWs:      ws,
            price,
            energyAmount,
            roomId,
            responses:     new Map(),
            status:        'awaiting_seller_decision',
            startedAt:     Date.now()
        };

        activeTrades.set(tradeId, trade);

        ws.send(JSON.stringify({
            type: 'energy_trade_seller_decide',
            tradeId,
            price,
            energyAmount,
            canAfford: player.gameState.cash >= price,
            currentCash: player.gameState.cash,
            message: `💚 無其他玩家！你是否願意以 $${price.toLocaleString()} 自買 ${energyAmount} 精力？`
        }));

        console.log(`💚 精力交易 (無其他玩家): ${player.playerName} 等待決定`);
        return;
    }

    // Create trade
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const trade = {
        tradeId,
        sellerId:      player.playerId,
        sellerName:    player.playerName,
        sellerWs:      ws,
        price,
        energyAmount,
        roomId,
        responses:     new Map(),
        status:        'active',
        startedAt:     Date.now()
    };

    activeTrades.set(tradeId, trade);

    console.log(`💚 ${player.playerName} 開始精力交易 tradeId=${tradeId}, 價格=${price}, 精力=${energyAmount}`);

    // Notify seller of trade start
    ws.send(JSON.stringify({
        type: 'energy_trade_started_seller',
        tradeId,
        price,
        energyAmount,
        message: `💚 精力交易已開始！以 $${price.toLocaleString()} 出售 ${energyAmount} 精力，等待其他玩家回應...`
    }));

    // Send buy offer to all other players
    otherPlayers.forEach(({ ws: otherWs, player: otherPlayer }) => {
        otherWs.send(JSON.stringify({
            type: 'energy_trade_offer',
            tradeId,
            sellerName:  player.playerName,
            price,
            energyAmount,
            timeout:     TRADE_TIMEOUT / 1000,
            message: `💚 ${player.playerName} 以 $${price.toLocaleString()} 出售 ${energyAmount} 精力，你要買嗎？(30秒內回應)`
        }));
    });

    // Timeout - if trade still active after 30s, seller keeps energy at own price
    setTimeout(() => {
        const t = activeTrades.get(tradeId);
        if (t && t.status === 'active') {
            _finalizeAsExpired(t, rooms, broadcastToRoom);
        }
    }, TRADE_TIMEOUT);
}

/**
 * Called when a buyer clicks "buy".
 */
function handleEnergyTradeBuy(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const buyer  = room?.players.get(ws);
    if (!room || !buyer) return;

    const trade = activeTrades.get(data.tradeId);
    if (!trade || trade.status !== 'active') {
        ws.send(JSON.stringify({ type: 'error', message: '此交易已結束' }));
        return;
    }

    if (buyer.playerId === trade.sellerId) {
        ws.send(JSON.stringify({ type: 'error', message: '賣家不能買自己的精力' }));
        return;
    }

    if (buyer.gameState.cash < trade.price) {
        ws.send(JSON.stringify({
            type: 'notification',
            message: `❌ 現金不足 $${trade.price.toLocaleString()} 元，無法購買`
        }));
        return;
    }

    // ✅ Lock trade to prevent race condition
    trade.status = 'sold';

    const seller = _findPlayerById(room, trade.sellerId);
    if (!seller) return;

    // Transfer money and energy
    buyer.gameState.cash          -= trade.price;
    seller.gameState.cash          += trade.price;
    buyer.gameState.energy          = Math.min(
        buyer.gameState.maxEnergy,
        buyer.gameState.energy + trade.energyAmount
    );

    // Record transactions
    addTransactionRecord(
        buyer.playerName,
        { name: `購買精力 ← ${seller.playerName}`, type: 'business', id: 'C20_BUY' },
        '購買精力',
        -trade.price,
        `以 $${trade.price.toLocaleString()} 向 ${seller.playerName} 購買 ${trade.energyAmount} 精力`,
        null,
        buyer.gameState
    );

    addTransactionRecord(
        seller.playerName,
        { name: `出售精力 → ${buyer.playerName}`, type: 'business', id: 'C20_SELL' },
        '出售精力',
        trade.price,
        `以 $${trade.price.toLocaleString()} 向 ${buyer.playerName} 出售 ${trade.energyAmount} 精力`,
        null,
        seller.gameState
    );

    // Notify seller
    if (trade.sellerWs && trade.sellerWs.readyState === 1) {
        trade.sellerWs.send(JSON.stringify({
            type: 'energy_trade_sold',
            tradeId: trade.tradeId,
            buyerName: buyer.playerName,
            price: trade.price,
            energyAmount: trade.energyAmount,
            message: `💰 ${buyer.playerName} 買了你的精力！獲得 $${trade.price.toLocaleString()} 元`,
            gameState: seller.gameState
        }));
    }

    // Notify buyer
    ws.send(JSON.stringify({
        type: 'energy_trade_bought',
        tradeId: trade.tradeId,
        sellerName: seller.playerName,
        price: trade.price,
        energyAmount: trade.energyAmount,
        message: `💚 你成功購買 ${trade.energyAmount} 精力！花費 $${trade.price.toLocaleString()} 元`,
        gameState: buyer.gameState
    }));

    // Notify all other players (trade closed)
    room.players.forEach((p, pWs) => {
        if (pWs !== trade.sellerWs && pWs !== ws) {
            pWs.send(JSON.stringify({
                type: 'energy_trade_closed',
                tradeId: trade.tradeId,
                message: `💚 ${buyer.playerName} 買了 ${seller.playerName} 的精力（$${trade.price.toLocaleString()} / ${trade.energyAmount} 精力）`
            }));
        }
    });

    // Broadcast state updates
    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: seller.playerId,
        gameState: seller.gameState
    });
    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: buyer.playerId,
        gameState: buyer.gameState
    });

    activeTrades.delete(trade.tradeId);
    console.log(`✅ 精力交易完成: ${buyer.playerName} 買了 ${seller.playerName} 的 ${trade.energyAmount} 精力 (價格 $${trade.price})`);
}

/**
 * Called when a player clicks "pass".
 */
function handleEnergyTradePass(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const trade = activeTrades.get(data.tradeId);
    if (!trade || trade.status !== 'active') return;

    trade.responses.set(player.playerId, 'pass');

    // Check if all other players have passed
    let allPassed = true;
    room.players.forEach((p, pWs) => {
        if (p.playerId !== trade.sellerId) {
            const response = trade.responses.get(p.playerId);
            if (response !== 'pass') {
                allPassed = false;
            }
        }
    });

    console.log(`⏭️ ${player.playerName} 拒絕精力交易 tradeId=${trade.tradeId}`);

    if (allPassed) {
        _finalizeAsExpired(trade, rooms, broadcastToRoom);
    }
}

// ── Private ───────────────────────────────────────────────────────────────────

/**
 * Called when timeout expires or all buyers pass.
 * Seller keeps the energy but pays the price to themselves (net: gains energy, cash unchanged).
 * OR seller can choose to skip - handled by client sending 'skip' if they don't want to self-buy.
 */
/**
 * Called when timeout expires or all buyers pass.
 * Seller is FORCED to buy the energy at their own set price.
 */
/**
 * Called when timeout expires or all buyers pass.
 * Instead of forcing, prompt the seller to decide: self-buy or cancel.
 */
function _finalizeAsExpired(trade, rooms, broadcastToRoom) {
    if (trade.status !== 'active') return;
    trade.status = 'awaiting_seller_decision';

    const room = rooms.get(trade.roomId);
    if (!room) return;

    const seller = _findPlayerById(room, trade.sellerId);
    if (!seller) return;

    // Ask seller if they want to buy at their own price
    if (trade.sellerWs && trade.sellerWs.readyState === 1) {
        trade.sellerWs.send(JSON.stringify({
            type: 'energy_trade_seller_decide',
            tradeId: trade.tradeId,
            price: trade.price,
            energyAmount: trade.energyAmount,
            canAfford: seller.gameState.cash >= trade.price,
            currentCash: seller.gameState.cash,
            message: `💚 沒有玩家購買！你是否願意以 $${trade.price.toLocaleString()} 自買 ${trade.energyAmount} 精力？`
        }));
    }

    // Notify others that trade is pending seller decision
    room.players.forEach((p, pWs) => {
        if (pWs !== trade.sellerWs) {
            pWs.send(JSON.stringify({
                type: 'energy_trade_closed',
                tradeId: trade.tradeId,
                message: `💚 ${seller.playerName} 的精力交易無人接手，等待賣家決定是否自買...`
            }));
        }
    });

    console.log(`⏳ 精力交易等待賣家決定: ${seller.playerName}`);
}

/**
 * Called when seller responds to buy-or-cancel prompt.
 */
function handleEnergyTradeSellerDecide(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const seller = room?.players.get(ws);
    if (!room || !seller) return;

    const trade = activeTrades.get(data.tradeId);
    if (!trade || trade.status !== 'awaiting_seller_decision') {
        ws.send(JSON.stringify({ type: 'error', message: '此交易已結束' }));
        return;
    }

    if (seller.playerId !== trade.sellerId) {
        ws.send(JSON.stringify({ type: 'error', message: '只有賣家可以做此決定' }));
        return;
    }

    const willBuy = data.willBuy === true;

    if (willBuy) {
        // Seller chooses to self-buy
        if (seller.gameState.cash < trade.price) {
            ws.send(JSON.stringify({
                type: 'notification',
                message: `❌ 現金不足 $${trade.price.toLocaleString()}，無法自買`
            }));
            trade.status = 'active';  // reset so they can retry
            return;
        }

        seller.gameState.cash   -= trade.price;
        seller.gameState.energy  = Math.min(
            seller.gameState.maxEnergy,
            seller.gameState.energy + trade.energyAmount
        );

        addTransactionRecord(
            seller.playerName,
            { name: '可持續發展碳中和釀酒廠 - 自買精力', type: 'business', id: 'C20_SELF_BUY' },
            '自買精力',
            -trade.price,
            `無人購買後選擇自買，以 $${trade.price.toLocaleString()} 獲得 ${trade.energyAmount} 精力`,
            null,
            seller.gameState
        );

        ws.send(JSON.stringify({
            type: 'energy_trade_self_bought',
            tradeId: trade.tradeId,
            energyAmount: trade.energyAmount,
            pricePaid: trade.price,
            message: `💚 你選擇以 $${trade.price.toLocaleString()} 自買 ${trade.energyAmount} 精力！`,
            gameState: seller.gameState
        }));

        broadcastToRoom(roomId, {
            type: 'notification',
            message: `💚 ${seller.playerName} 選擇自買 ${trade.energyAmount} 精力（$${trade.price.toLocaleString()}）`
        }, ws);

        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: seller.playerId,
            gameState: seller.gameState
        });

        console.log(`✅ 精力交易自買: ${seller.playerName} 支付 $${trade.price} 獲得 ${trade.energyAmount} 精力`);

    } else {
        // Seller cancels - no energy, no money change
        addTransactionRecord(
            seller.playerName,
            { name: '可持續發展碳中和釀酒廠 - 取消交易', type: 'business', id: 'C20_CANCEL' },
            '取消交易',
            0,
            `無人購買且賣家選擇不自買，取消精力交易`,
            null,
            seller.gameState
        );

        ws.send(JSON.stringify({
            type: 'energy_trade_cancelled',
            tradeId: trade.tradeId,
            message: `💚 你選擇不自買，精力交易已取消`
        }));

        broadcastToRoom(roomId, {
            type: 'notification',
            message: `💚 ${seller.playerName} 取消了精力交易`
        }, ws);

        console.log(`❌ 精力交易取消: ${seller.playerName}`);
    }

    activeTrades.delete(trade.tradeId);
}

function _findPlayerById(room, playerId) {
    for (const [, p] of room.players) {
        if (p.playerId === playerId) return p;
    }
    return null;
}

module.exports = {
    startEnergyTrade,
    handleEnergyTradeSetPrice,
    handleEnergyTradeBuy,
    handleEnergyTradePass,
    handleEnergyTradeSellerDecide
};