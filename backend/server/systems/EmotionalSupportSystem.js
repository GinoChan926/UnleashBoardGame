"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

const pendingEmotionalSupport = new Map();

function checkAndNotifyEmotionalSupport(room, damagedPlayerObj, damageAmount, damageDescription, roomId, card, onSuccess, onTimeout) {
    const supporters = [];
    for (const [pWs, p] of room.players) {
        if (pWs !== damagedPlayerObj.ws && p.gameState.emotionalSupportShield > 0) {
            supporters.push({ ws: pWs, player: p });
        }
    }
    if (supporters.length === 0) return false;

    const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    pendingEmotionalSupport.set(requestId, {
        damagedPlayer: damagedPlayerObj, damageAmount, damageDescription,
        onSuccessCallback: onSuccess, onTimeoutCallback: onTimeout,
        supporters, timestamp: Date.now(), responded: false
    });

    for (const s of supporters) {
        s.ws.send(JSON.stringify({
            type: 'emotional_support_available', requestId,
            damagedPlayer: damagedPlayerObj.player.playerName,
            damageAmount, damageDescription,
            cardId: card?.id || 'V14'
        }));
    }

    setTimeout(() => {
        const pending = pendingEmotionalSupport.get(requestId);
        if (pending && !pending.responded) {
            pending.responded = true;
            pendingEmotionalSupport.delete(requestId);
            pending.onTimeoutCallback?.();
        }
    }, 15000);

    return true;
}

function handleUseEmotionalSupport(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const targetName = data.targetPlayer;
    let targetPlayer = null;
    let targetWs     = null;

    for (const [pWs, p] of room.players) {
        if (p.playerName === targetName) { targetPlayer = p; targetWs = pWs; break; }
    }

    if (!targetPlayer) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到目标玩家' }));
        return;
    }

    const pending = pendingEmotionalSupport.get(targetName);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '没有待处理的伤害事件' }));
        return;
    }

    if (!player.gameState.emotionalSupportShield || player.gameState.emotionalSupportShield <= 0) {
        ws.send(JSON.stringify({ type: 'error', message: '你没有情绪支援护盾可用' }));
        return;
    }

    player.gameState.emotionalSupportShield--;
    player.gameState.luck   = Math.min(player.gameState.maxLuck || 10, player.gameState.luck + 1);
    player.gameState.energy = Math.min(player.gameState.maxEnergy, player.gameState.energy + 1);

    const originalDamage             = pending.damageAmount;
    targetPlayer.gameState.cash     += originalDamage;

    addTransactionRecord(player.playerName,
        { name: "情緒支援卡使用", type: "volunteer", id: "V14" },
        "使用情緒支援", 0,
        `幫助 ${targetName} 抵銷 ${originalDamage.toLocaleString()} 元傷害`,
        null, player.gameState);

    ws.send(JSON.stringify({
        type: 'emotional_support_result', success: true,
        resultMessage: `你使用情緒支援幫助 ${targetName} 抵銷了 ${originalDamage.toLocaleString()} 元傷害！`,
        remainingShield: player.gameState.emotionalSupportShield,
        gameState: player.gameState
    }));

    targetWs?.send(JSON.stringify({
        type: 'notification',
        message: `💝 ${player.playerName} 使用情緒支援，幫你抵銷了 ${originalDamage.toLocaleString()} 元傷害！`
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `💝 ${player.playerName} 使用情緒支援幫助 ${targetName} 抵銷了傷害！`
    }, ws);
    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: player.playerId, gameState: player.gameState
    });

    pendingEmotionalSupport.delete(targetName);
}

function handleSkipEmotionalSupport(ws, data) {
    pendingEmotionalSupport.delete(data.targetPlayer);
}

module.exports = {
    checkAndNotifyEmotionalSupport,
    handleUseEmotionalSupport,
    handleSkipEmotionalSupport
};