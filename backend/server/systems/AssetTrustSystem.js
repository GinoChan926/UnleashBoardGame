"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

const PROTECTION_FLOOR = 10_000_000;   // Guaranteed cash floor after loss
const SETUP_FEE        = 1_000_000;    // One-time setup fee

// ── Setup prompt (unchanged) ──────────────────────────────────────────────

function promptAssetTrustSetup(state, ws) {
    if (state.assetTrust?.active) {
        ws.send(JSON.stringify({
            type:    'notification',
            message: `🏦 你已設立資產信託！每次逆境保證現金不低於 $${PROTECTION_FLOOR.toLocaleString()}`
        }));
        return false;
    }

    ws.send(JSON.stringify({
        type:            'asset_trust_prompt',
        message:         `🏦 資產信託設立\n` +
            `📌 保障：逆境事件後現金保底 $${PROTECTION_FLOOR.toLocaleString()}\n` +
            `💵 手續費: $${SETUP_FEE.toLocaleString()} (僅使用現金)\n` +
            `💡 一次設立，永久有效`,
        setupFee:        SETUP_FEE,
        protectionFloor: PROTECTION_FLOOR,
        currentCash:     state.cash || 0
    }));
    return true;
}

// ── Execute setup (unchanged from previous version) ───────────────────────

function executeAssetTrust(state, ws, roomId, player, broadcastToRoom) {
    if (state.assetTrust?.active) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '❌ 你已設立資產信託'
        }));
        return false;
    }

    const { canAffordNonInvestment, spendForNonInvestment } =
        require('./WalletSystem.js');

    if (!canAffordNonInvestment(state, SETUP_FEE)) {
        ws.send(JSON.stringify({
            type: 'error',
            message: `❌ 現金不足！需要 $${SETUP_FEE.toLocaleString()} 現金 (貸款金不可用)`
        }));
        return false;
    }

    const stateBefore = JSON.parse(JSON.stringify(state));
    spendForNonInvestment(state, SETUP_FEE);

    state.assetTrust = {
        active:           true,
        protectionFloor:  PROTECTION_FLOOR,
        setupFee:         SETUP_FEE,
        createdAt:        Date.now(),
        totalProtected:   0,
        activationCount:  0
    };

    addTransactionRecord(
        player.playerName,
        { name: '資產信託設立', type: 'trust', id: 'TRUST_SETUP' },
        '設立資產信託',
        -SETUP_FEE,
        `支付 $${SETUP_FEE.toLocaleString()} 手續費，每次逆境現金保底 $${PROTECTION_FLOOR.toLocaleString()}`,
        stateBefore,
        state
    );

    ws.send(JSON.stringify({
        type:    'notification',
        message: `🏦 資產信託設立成功！\n💵 支付 $${SETUP_FEE.toLocaleString()} 手續費\n🛡️ 每次逆境現金保底 $${PROTECTION_FLOOR.toLocaleString()}`
    }));

    broadcastToRoom(roomId, {
        type:    'notification',
        message: `🏦 ${player.playerName} 設立了資產信託！`
    }, ws);

    return true;
}

/**
 * ✅ Apply asset trust protection to a cash-loss event.
 *
 * Behavior:
 * - Trust guarantees post-loss cash ≥ min($10M, pre-loss cash)
 * - Cannot make player gain money (post-loss cash never exceeds pre-loss cash)
 *
 * @param {object} state - player's gameState
 * @param {number} intendedLoss - the amount the player would lose without trust
 * @returns {object} {
 *     absorbedLoss: how much the trust absorbed
 *     actualLoss:   how much the player will actually lose
 *     protected:    true if trust kicked in
 * }
 */
function applyAssetTrustProtection(state, intendedLoss) {
    if (!state.assetTrust?.active || intendedLoss <= 0) {
        return {
            absorbedLoss: 0,
            actualLoss:   intendedLoss,
            protected:    false
        };
    }

    const preLossCash    = state.cash || 0;
    const rawPostLoss    = preLossCash - intendedLoss;

    // Floor = min($10M, pre-loss cash)
    // — can't guarantee more cash than the player had before
    const floor = Math.min(PROTECTION_FLOOR, preLossCash);

    // Final cash = max(rawPostLoss, floor)
    const finalCash    = Math.max(rawPostLoss, floor);
    const actualLoss   = preLossCash - finalCash;
    const absorbedLoss = intendedLoss - actualLoss;

    const kicked = absorbedLoss > 0;

    if (kicked) {
        state.assetTrust.totalProtected  = (state.assetTrust.totalProtected  || 0) + absorbedLoss;
        state.assetTrust.activationCount = (state.assetTrust.activationCount || 0) + 1;
    }

    return {
        absorbedLoss,
        actualLoss,
        protected: kicked
    };
}

module.exports = {
    promptAssetTrustSetup,
    executeAssetTrust,
    applyAssetTrustProtection,
    PROTECTION_FLOOR,
    SETUP_FEE
};