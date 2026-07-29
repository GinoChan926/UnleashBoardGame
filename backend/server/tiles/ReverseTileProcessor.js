"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function processReverseTile(state, tile, ws, roomId, player, streamlineTiles, broadcastToRoom, drawHardshipCard) {
    switch (tile.type) {
        case 'hardship':
            // ✅ Already handled by drawHardshipCard which shows its own modal
            drawHardshipCard(ws, state, roomId, player);
            return null;

        case 'awareness': {
            // const luckBonus   = Math.floor(Math.random() * 3) + 2;
            const energyBonus = Math.floor(Math.random() * 3) + 2;
            // state.luck   = Math.min(state.maxLuck || 10, state.luck + luckBonus);
            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);

            // ✅ Send card reveal for awareness too
            _sendReverseCardReveal(ws, player, broadcastToRoom, roomId, {
                name:   '覺察卡（逆流）',
                effect: `🧘 覺察卡（逆流）！精力 +${energyBonus}`,
                image:  '../cards/tiles/reverse/awareness.png',
                color:  '#ff9800'
            });

            return null;  // ← return null so dice_result doesn't double-show
        }

        case 'business_failure': {
            const loss         = Math.floor(state.cash / 2);
            const originalCash = state.cash;
            state.cash  = Math.max(0, state.cash - loss);
            // state.luck  = Math.max(0, state.luck - 2);

            addTransactionRecord(player.playerName,
                { name: "生意失敗", type: "hardship" }, "生意失敗", -loss,
                `損失 ${loss.toLocaleString()} 元`, null, state);

            // ✅ Send card reveal modal
            _sendReverseCardReveal(ws, player, broadcastToRoom, roomId, {
                name:   '生意失敗',
                effect: `💼 生意失敗！損失 $${loss.toLocaleString()} 元（現金的一半）`,
                image:  '../cards/tiles/reverse/business_failure.png',
                color:  '#f44336'
            });

            return null;
        }

        case 'miracle': {
            const available = streamlineTiles
                .map((t, i) => ({ t, i }))
                .filter(({ t }) => t.type !== 'settlement');
            const target = available[Math.floor(Math.random() * available.length)];
            state.inReverse     = false;
            state.streamlinePos = target.i;

            // ✅ Send card reveal modal (positive!)
            _sendReverseCardReveal(ws, player, broadcastToRoom, roomId, {
                name:   '奇蹟',
                effect: `🌟 奇蹟發生！你脫離逆流層，移動到平流層「${target.t.name}」格子！`,
                image:  '../cards/tiles/reverse/miracle.png',
                color:  '#4caf50'
            });

            return null;
        }

        case 'unemployment': {
            const monthlyIncome    = state.salary + state.sideIncome;
            const unemploymentLoss = Math.min(state.cash, monthlyIncome);
            state.cash   = Math.max(0, state.cash - unemploymentLoss);
            state.salary = 0;
            state.energy = Math.min(state.maxEnergy, state.energy + 6);

            addTransactionRecord(player.playerName,
                { name: "失業", type: "hardship" }, "失業", -unemploymentLoss,
                `失業！損失 ${unemploymentLoss.toLocaleString()} 元，月薪歸零，精力 +6`, null, state);

            // ✅ Send card reveal modal
            _sendReverseCardReveal(ws, player, broadcastToRoom, roomId, {
                name:   '失業',
                effect: `⚠️ 失業！損失 $${unemploymentLoss.toLocaleString()} 元（一個月收入），月薪歸零，精力 +6`,
                image:  '../cards/tiles/reverse/unemployment.png',
                color:  '#f44336'
            });

            return null;
        }

        default:
            return `📌 逆流層格子：${tile.name}`;
    }
}

// ==================== Private ====================

/**
 * Send a card reveal message so the frontend shows the CardRevealTemplate modal.
 * Reuses the 'hardship_card_execute' message type which HardshipHandler already handles.
 */
function _sendReverseCardReveal(ws, player, broadcastToRoom, roomId, { name, effect, image, color }) {
    // Send to the player who landed on the tile
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
            type: 'hardship_card_execute',
            card: {
                id:           `reverse_${name}`,
                name:         name,
                description:  effect,
                image:        image,
                cardType:     'hardship',
                cardTypeName: '逆流層',
                cardTypeIcon: '🌀'
            },
            effectMessage: effect,
            playerId:      player.playerId,
            gameState:     player.gameState
        }));
    }

    // Broadcast to others
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🌀 ${player.playerName} 在逆流層觸發「${name}」！`
    }, ws);

    // Update state for all
    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });
}

module.exports = { processReverseTile };