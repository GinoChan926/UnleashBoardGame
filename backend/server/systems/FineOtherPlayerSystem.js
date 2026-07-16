"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const { chargePlayer }         = require('./AutoDebtSystem.js');

const pendingFines = new Map();

function startFineOtherPlayer(ws, roomId, player, amount, broadcastToRoom, rooms) {
    // ... unchanged ...
    const room = rooms.get(roomId);
    if (!room) return;

    const otherPlayers = [];
    room.players.forEach((p, pWs) => {
        if (p.playerId !== player.playerId) {
            otherPlayers.push({
                playerId:   p.playerId,
                playerName: p.playerName,
                cash:       p.gameState.cash
            });
        }
    });

    if (otherPlayers.length === 0) {
        ws.send(JSON.stringify({
            type: 'notification',
            message: '👮 無其他玩家可以舉報，警察卡效果失效'
        }));
        return;
    }

    pendingFines.set(player.playerId, { amount, roomId });

    ws.send(JSON.stringify({
        type: 'police_fine_prompt',
        amount,
        otherPlayers,
        message: `👮 選擇要舉報的玩家 (罰款 $${amount.toLocaleString()})`
    }));

    console.log(`👮 ${player.playerName} 準備使用 P06 舉報玩家`);
}

function handleFineOtherPlayer(ws, data, roomId, rooms, broadcastToRoom) {
    const room      = rooms.get(roomId);
    const initiator = room?.players.get(ws);
    if (!room || !initiator) return;

    const pending = pendingFines.get(initiator.playerId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的舉報請求' }));
        return;
    }

    const { targetPlayerId } = data;
    if (!targetPlayerId) {
        ws.send(JSON.stringify({ type: 'error', message: '請選擇目標玩家' }));
        return;
    }

    let targetPlayer = null;
    let targetWs = null;
    for (const [pWs, p] of room.players) {
        if (p.playerId === targetPlayerId) {
            targetPlayer = p;
            targetWs = pWs;
            break;
        }
    }

    if (!targetPlayer) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到目標玩家' }));
        pendingFines.delete(initiator.playerId);
        return;
    }

    const amount = pending.amount;
    const stateBefore = JSON.parse(JSON.stringify(targetPlayer.gameState));

    // ✅ Use AutoDebtSystem - fine goes to initiator, unpaid becomes auto-debt
    const chargeResult = chargePlayer(targetPlayer, amount, {
        source:          '舉報違法罰款',
        creditor:        'bank',                   // fines go to bank, not initiator
        creditorName:    '銀行',
        room,
        roomId,
        broadcastToRoom,
        ws:              targetWs
    });

    // Record for initiator (who initiated the fine)
    addTransactionRecord(
        initiator.playerName,
        { name: '舉報違法', type: 'police', id: 'P06' },
        '舉報玩家',
        0,
        `舉報了 ${targetPlayer.playerName}，罰款 $${amount.toLocaleString()}`,
        null,
        initiator.gameState
    );

    // Record for target
    let targetActionDesc = `被 ${initiator.playerName} 舉報，罰款 $${amount.toLocaleString()}`;
    if (chargeResult.debtCreated) {
        targetActionDesc += ` (現金 $${chargeResult.paid.toLocaleString()}，$${chargeResult.debtAmount.toLocaleString()} 待未來償還)`;
    }
    addTransactionRecord(
        targetPlayer.playerName,
        { name: '舉報違法 - 罰款', type: 'police', id: 'P06_FINE' },
        '罰款',
        -chargeResult.paid,
        targetActionDesc,
        stateBefore,
        targetPlayer.gameState
    );

    // Notify initiator
    let initMsg = `👮 你成功舉報 ${targetPlayer.playerName}！扣除 $${chargeResult.paid.toLocaleString()} 元`;
    if (chargeResult.debtCreated) {
        initMsg += ` (剩餘 $${chargeResult.debtAmount.toLocaleString()} 將由對方未來收入自動償還)`;
    }
    ws.send(JSON.stringify({
        type: 'police_fine_executed',
        targetName: targetPlayer.playerName,
        amount: chargeResult.paid,
        debtAmount: chargeResult.debtAmount,
        message: initMsg
    }));

    // Notify target
    if (targetWs && targetWs.readyState === 1) {
        let targetMsg = `你被 ${initiator.playerName} 舉報違法！罰款 $${amount.toLocaleString()} 元`;
        if (chargeResult.debtCreated) {
            targetMsg += `\n💸 現金不足，剩餘 $${chargeResult.debtAmount.toLocaleString()} 將由未來收入自動償還`;
        }
        targetWs.send(JSON.stringify({
            type: 'police_fine_received',
            initiatorName: initiator.playerName,
            amount,
            actualFined: chargeResult.paid,
            debtAmount: chargeResult.debtAmount,
            gameState: targetPlayer.gameState,
            message: `⚠️ ${targetMsg}`
        }));
    }

    // Broadcast
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `👮 ${initiator.playerName} 舉報了 ${targetPlayer.playerName}！罰款 $${amount.toLocaleString()}`
    }, ws);

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: targetPlayer.playerId,
        gameState: targetPlayer.gameState
    });

    pendingFines.delete(initiator.playerId);
}

module.exports = { startFineOtherPlayer, handleFineOtherPlayer };