"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

const MAX_AMOUNT  = 10_000_000;
const FEE_PERCENT = 10;

function promptAssetTrustSetup(state, ws) {
    if (state.assetTrust?.active) {
        ws.send(JSON.stringify({
            type: 'notification',
            message: `🏦 你已设立资产信托！金额: ${state.assetTrust.amount.toLocaleString()} 元`
        }));
        return false;
    }
    ws.send(JSON.stringify({
        type:         'asset_trust_prompt',
        message:      `🏦 资产信托设立\n信托上限: ${MAX_AMOUNT.toLocaleString()} 元\n手续费: ${FEE_PERCENT}%\n当前现金: ${state.cash.toLocaleString()} 元`,
        maxAmount:    MAX_AMOUNT,
        feePercent:   FEE_PERCENT,
        currentCash:  state.cash
    }));
    return true;
}

function executeAssetTrust(state, depositAmount, ws, roomId, player, broadcastToRoom) {
    if (depositAmount < 1 || depositAmount > MAX_AMOUNT) {
        ws.send(JSON.stringify({ type: 'error', message: `❌ 信托金额必须在 1 ~ ${MAX_AMOUNT.toLocaleString()} 元之间` }));
        return false;
    }

    const fee       = Math.ceil(depositAmount * FEE_PERCENT / 100);
    const totalCost = depositAmount + fee;

    if (state.cash < totalCost) {
        ws.send(JSON.stringify({ type: 'error', message: `❌ 现金不足！需要 ${totalCost.toLocaleString()} 元` }));
        return false;
    }

    const stateBefore  = JSON.parse(JSON.stringify(state));
    state.cash        -= totalCost;
    state.assetTrust   = {
        active: true, amount: depositAmount,
        maxAmount: MAX_AMOUNT, feePercent: FEE_PERCENT,
        totalCost, fee, createdAt: Date.now(),
        protectedAmount: depositAmount
    };

    addTransactionRecord(state.playerName,
        { name: "资产信托设立", type: "trust", id: "TRUST01" },
        "设立资产信托", -totalCost,
        `存入 ${depositAmount.toLocaleString()} 元，手续费 ${fee.toLocaleString()} 元`,
        stateBefore, state);

    ws.send(JSON.stringify({
        type: 'notification',
        message: `🏦 资产信托设立成功！存入 ${depositAmount.toLocaleString()} 元，总花费 ${totalCost.toLocaleString()} 元`
    }));
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🏦 ${state.playerName} 设立了资产信托，存入 ${depositAmount.toLocaleString()} 元！`
    }, ws);

    return true;
}

function retrieveAssetTrustOnBankruptcy(state, ws, roomId, broadcastToRoom) {
    if (!state.assetTrust?.active) return null;

    const stateBefore      = JSON.parse(JSON.stringify(state));
    const protectedAmount  = state.assetTrust.amount;
    state.cash            += protectedAmount;

    addTransactionRecord(state.playerName,
        { name: "资产信托取回", type: "trust", id: "TRUST_RETRIEVE" },
        "信托取回", protectedAmount,
        `破产保护！取回 ${protectedAmount.toLocaleString()} 元`,
        stateBefore, state);

    state.assetTrust.active           = false;
    state.assetTrust.usedOnBankruptcy = true;

    ws.send(JSON.stringify({
        type: 'notification',
        message: `🛡️ 破产保护生效！取回 ${protectedAmount.toLocaleString()} 元！`
    }));
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🛡️ ${state.playerName} 触发破产保护，取回 ${protectedAmount.toLocaleString()} 元！`
    }, ws);

    return protectedAmount;
}

module.exports = { promptAssetTrustSetup, executeAssetTrust, retrieveAssetTrustOnBankruptcy };