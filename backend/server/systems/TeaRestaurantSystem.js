"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

/**
 * When any player lands on a settlement tile:
 * - Find all OTHER players in the room who own C13 (港式茶餐廳)
 * - For each C13 owner, transfer $2,000 from the settling player to them
 * - Stacks: if a player owns 3 x C13, they get $6,000 per settlement event
 */
function processTeaRestaurantFees(settlingPlayer, room, roomId, broadcastToRoom) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 processTeaRestaurantFees CALLED');
    console.log('   settling player:', settlingPlayer?.playerName);
    console.log('   room exists:', !!room);
    console.log('   room.players size:', room?.players?.size);

    if (!room || !settlingPlayer) {
        console.log('   ❌ early return: room or player missing');
        return;
    }

    const state = settlingPlayer.gameState;
    if (!state) {
        console.log('   ❌ early return: no state');
        return;
    }

    let totalPaid = 0;
    const feeRecords = [];

    room.players.forEach((otherPlayer, otherWs) => {
        console.log(`   → other player: ${otherPlayer.playerName}`);
        console.log(`     teaRestaurantCount: ${otherPlayer.gameState?.teaRestaurantCount || 0}`);

        // Skip self
        if (otherPlayer.playerId === settlingPlayer.playerId) {
            console.log('     ⏭️ skip (is self)');
            return;
        }

        const otherState = otherPlayer.gameState;
        if (!otherState) return;

        // How many tea restaurants does this player own?
        const restaurantCount = otherState.teaRestaurantCount || 0;
        if (restaurantCount === 0) return;

        const feePerRestaurant = 2000;
        const totalFee         = restaurantCount * feePerRestaurant;

        // Check if settling player can afford it
        if (state.cash < totalFee) {
            // Pay whatever they can
            const partial = state.cash;
            if (partial > 0) {
                state.cash              -= partial;
                otherState.cash         += partial;
                totalPaid               += partial;

                feeRecords.push({
                    receiverName:  otherPlayer.playerName,
                    receiverWs:    otherWs,
                    amount:        partial,
                    restaurantCount,
                    partial:       true
                });

                _recordTransaction(settlingPlayer, otherPlayer, partial, restaurantCount, true, state, otherState);
            }
            return;
        }

        // Full payment
        state.cash      -= totalFee;
        otherState.cash += totalFee;
        totalPaid       += totalFee;

        feeRecords.push({
            receiverName:  otherPlayer.playerName,
            receiverWs:    otherWs,
            amount:        totalFee,
            restaurantCount,
            partial:       false
        });

        _recordTransaction(settlingPlayer, otherPlayer, totalFee, restaurantCount, false, state, otherState);
    });

    if (totalPaid === 0) return; // no C13 owners in room

    // ── Notify settling player ────────────────────────────────────────────
    const receiverList = feeRecords.map(r =>
        `${r.receiverName} $${r.amount.toLocaleString()}${r.partial ? ' (部分)' : ''}`
    ).join('、');

    settlingPlayer._pendingTeaRestaurantMessage = `☕ 港式茶餐廳費用：你付了 $${totalPaid.toLocaleString()} 元給 ${receiverList}`;

    // ── Notify each receiver ──────────────────────────────────────────────
    feeRecords.forEach(r => {
        if (r.receiverWs && r.receiverWs.readyState === 1) { // WebSocket.OPEN = 1
            r.receiverWs.send(JSON.stringify({
                type: 'notification',
                message: `☕ 港式茶餐廳收益！${settlingPlayer.playerName} 到達出糧格子，你收到 $${r.amount.toLocaleString()} 元 (${r.restaurantCount} 間茶餐廳)`
            }));

            // Push state update to receiver
            const receiverPlayer = _findPlayerByWs(room, r.receiverWs);
            if (receiverPlayer) {
                broadcastToRoom(roomId, {
                    type: 'state_updated',
                    playerId: receiverPlayer.playerId,
                    gameState: receiverPlayer.gameState
                });
            }
        }
    });

    console.log(`☕ 港式茶餐廳費用結算: ${settlingPlayer.playerName} 付出 $${totalPaid.toLocaleString()}`);
}

// ── Private ───────────────────────────────────────────────────────────────────

function _recordTransaction(payer, receiver, amount, count, partial, payerState, receiverState) {
    // Record for the payer
    addTransactionRecord(
        payer.playerName,
        { name: `港式茶餐廳費用 → ${receiver.playerName}`, type: 'business', id: 'C13_FEE' },
        '出糧付費',
        -amount,
        `到達出糧格子，付給 ${receiver.playerName} $${amount.toLocaleString()} 元 (${count} 間茶餐廳)${partial ? ' [現金不足，部分支付]' : ''}`,
        null,
        payerState
    );

    // Record for the receiver
    addTransactionRecord(
        receiver.playerName,
        { name: `港式茶餐廳收益 ← ${payer.playerName}`, type: 'business', id: 'C13_INCOME' },
        '茶餐廳收益',
        amount,
        `${payer.playerName} 到達出糧格子，收到 $${amount.toLocaleString()} 元 (${count} 間茶餐廳)`,
        null,
        receiverState
    );
}

function _findPlayerByWs(room, ws) {
    for (const [pWs, p] of room.players) {
        if (pWs === ws) return p;
    }
    return null;
}

module.exports = { processTeaRestaurantFees };