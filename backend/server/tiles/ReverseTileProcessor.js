"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function processReverseTile(state, tile, ws, roomId, player, streamlineTiles, broadcastToRoom, drawHardshipCard, deps) {
    switch (tile.type) {
        case 'hardship':
            drawHardshipCard(ws, state, roomId, player);
            return null;

        case 'awareness': {
            // ✅ Reuse streamline tip card flow — auto-select tip type (no choice)
            const { drawRevelationTipCard } = require('../cards/RevelationCardHandler.js');
            const rooms    = deps?.rooms;
            const tipCards = deps?.tipCards || [];
            const room     = rooms?.get(roomId);

            if (!room || tipCards.length === 0) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: '⚠️ 暫無錦囊卡資料'
                }));
                return null;
            }

            drawRevelationTipCard(ws, roomId, room, player, tipCards, true);

            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🌀 ${player.playerName} 在逆流層抽取錦囊卡`
            }, ws);

            return null;
        }

        case 'business_failure': {
            const loss = Math.floor(state.cash / 2);
            state.cash = Math.max(0, state.cash - loss);

            addTransactionRecord(player.playerName,
                { name: "生意失敗", type: "hardship" }, "生意失敗", -loss,
                `損失 ${loss.toLocaleString()} 元`, null, state);

            _sendReverseCardReveal(ws, player, broadcastToRoom, roomId, {
                name:         '生意失敗',
                effect:       `💼 生意失敗！損失 $${loss.toLocaleString()} 元（現金的一半）`,
                image:        '/cards/tiles/reverse/business_failure.png',
                cardType:     'hardship',
                cardTypeName: '生意失敗',
                cardTypeIcon: '💼'
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

            _sendReverseCardReveal(ws, player, broadcastToRoom, roomId, {
                name:         '奇蹟',
                effect:       `🌟 奇蹟發生！你脫離逆流層，移動到平流層「${target.t.name}」格子！`,
                image:        '/cards/tiles/reverse/miracle.png',
                cardType:     'miracle',
                cardTypeName: '奇蹟',
                cardTypeIcon: '🌟'
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

            _sendReverseCardReveal(ws, player, broadcastToRoom, roomId, {
                name:         '失業',
                effect:       `⚠️ 失業！損失 $${unemploymentLoss.toLocaleString()} 元（一個月收入），月薪歸零，精力 +6`,
                image:        '/cards/tiles/reverse/unemployment.png',
                cardType:     'hardship',
                cardTypeName: '失業',
                cardTypeIcon: '⚠️'
            });

            return null;
        }

        default:
            return `📌 逆流層格子：${tile.name}`;
    }
}

// ==================== Private ====================

function _sendReverseCardReveal(ws, player, broadcastToRoom, roomId, opts) {
    const { name, effect, image, cardType, cardTypeName, cardTypeIcon } = opts;

    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
            type: 'reverse_tile_reveal',
            card: {
                id:           `reverse_${cardType}_${Date.now()}`,
                name:         name,
                description:  effect,
                image:        image,
                cardType:     cardType,
                cardTypeName: cardTypeName,
                cardTypeIcon: cardTypeIcon
            },
            effectMessage: effect,
            playerId:      player.playerId,
            gameState:     player.gameState
        }));
    }

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🌀 ${player.playerName} 在逆流層觸發「${name}」！`
    }, ws);

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });
}

module.exports = { processReverseTile };