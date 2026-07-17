"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

const pendingAssetChoices = new Map();  // key: choiceId → { card, room, roomId, responses, expectedPlayerIds }

const ASSET_CHOICE_TIMEOUT = 30000;

/**
 * Entry point - called by RevelationCardHandler when a market_news card executes.
 * Routes to automatic or choice-based flow depending on card type.
 */
function startMarketNews(ws, roomId, initiator, card, broadcastToRoom, rooms) {
    const room = rooms.get(roomId);
    if (!room) return;

    // ✅ Automatic cards - run immediately on all players
    if (card.marketNewsMode === 'automatic') {
        _runAutomatic(card, initiator, room, roomId, broadcastToRoom);
        return;
    }

    // ✅ Choice cards - ask each asset holder
    if (card.marketNewsMode === 'choice') {
        _runChoiceBased(ws, card, initiator, room, roomId, broadcastToRoom);
        return;
    }

    // Fallback - treat as automatic
    _runAutomatic(card, initiator, room, roomId, broadcastToRoom);
}

// ==================== Automatic mode ====================

function _runAutomatic(card, initiator, room, roomId, broadcastToRoom) {
    console.log(`📰 自動市場消息: ${card.name}`);

    // Call the card's effect - it handles all logic itself
    let resultMessage = '';
    try {
        // Provide helpers via context object
        const context = {
            addTransactionRecord,
            broadcastToRoom: (msg, excl) => broadcastToRoom(roomId, msg, excl),
            findPlayerByName: (name) => {
                for (const [, p] of room.players) if (p.playerName === name) return p;
                return null;
            }
        };
        resultMessage = card.applyAutomatic(room, initiator, context) || `市場消息「${card.name}」完成`;
    } catch (e) {
        console.error('Market news error:', e);
        resultMessage = `執行市場消息「${card.name}」時發生錯誤`;
    }

    // Broadcast summary
    broadcastToRoom(roomId, {
        type: 'market_news_result',
        cardName: card.name,
        initiator: initiator.playerName,
        message: resultMessage
    });

    // Refresh all states
    room.players.forEach(p => {
        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: p.playerId,
            gameState: p.gameState
        });
    });
}

// ==================== Choice-based mode ====================

function _runChoiceBased(initiatorWs, card, initiator, room, roomId, broadcastToRoom) {
    console.log(`📰 選擇性市場消息: ${card.name}`);

    // Card's method identifies affected asset holders
    let affectedPlayers = [];
    try {
        affectedPlayers = card.findAffectedPlayers(room) || [];
    } catch (e) {
        console.error('findAffectedPlayers error:', e);
    }

    if (affectedPlayers.length === 0) {
        broadcastToRoom(roomId, {
            type: 'market_news_result',
            cardName: card.name,
            initiator: initiator.playerName,
            message: `📊 市場消息「${card.name}」發布，但無人持有相關資產`
        });
        return;
    }

    const choiceId = `mnews_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const expectedPlayerIds = affectedPlayers.map(a => a.playerId);

    pendingAssetChoices.set(choiceId, {
        card,
        roomId,
        initiatorId: initiator.playerId,
        initiatorName: initiator.playerName,
        expectedPlayerIds,
        responses: new Map(),   // playerId → true/false
        startedAt: Date.now()
    });

    // Notify each affected player
    affectedPlayers.forEach(({ playerId, ws: pWs, assetInfo }) => {
        if (pWs && pWs.readyState === 1) {
            pWs.send(JSON.stringify({
                type: 'asset_choice_prompt',
                choiceId,
                card: {
                    name: card.name,
                    description: card.description,
                    image: card.image
                },
                assetInfo,
                actionLabel:  card.actionLabel || '選擇',
                timeout:      ASSET_CHOICE_TIMEOUT / 1000
            }));
        }
    });

    // Notify others who aren't affected
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `📊 ${initiator.playerName} 觸發市場消息「${card.name}」！${affectedPlayers.length} 位玩家正在決定是否參與...`
    });

    // Timeout - auto-finalize
    setTimeout(() => {
        const pending = pendingAssetChoices.get(choiceId);
        if (pending) _finalizeChoice(choiceId, rooms => rooms, broadcastToRoom, room, roomId);
    }, ASSET_CHOICE_TIMEOUT);
}

/**
 * Called when an asset-holder responds yes/no.
 */
function handleAssetChoice(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = pendingAssetChoices.get(data.choiceId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '此選擇已結束' }));
        return;
    }

    pending.responses.set(player.playerId, data.participate === true);

    // Notify progress
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `📊 ${player.playerName} 已回應 (${pending.responses.size}/${pending.expectedPlayerIds.length})`
    });

    // If all responded, finalize immediately
    if (pending.responses.size >= pending.expectedPlayerIds.length) {
        _finalizeChoice(data.choiceId, rooms, broadcastToRoom, room, roomId);
    }
}

function _finalizeChoice(choiceId, ignoredRoomsFn, broadcastToRoom, room, roomId) {
    const pending = pendingAssetChoices.get(choiceId);
    if (!pending) return;

    const { card, responses } = pending;

    // Build participants list - map playerId → true/false
    const participants = {};
    responses.forEach((choice, playerId) => {
        for (const [, p] of room.players) {
            if (p.playerId === playerId) {
                participants[p.playerName] = choice;
                break;
            }
        }
    });

    // Anyone who didn't respond = decline
    pending.expectedPlayerIds.forEach(playerId => {
        for (const [, p] of room.players) {
            if (p.playerId === playerId && !(p.playerName in participants)) {
                participants[p.playerName] = false;
            }
        }
    });

    // Run the card's applyChoices function
    let resultMessage = '';
    try {
        const context = {
            addTransactionRecord,
            broadcastToRoom: (msg, excl) => broadcastToRoom(roomId, msg, excl),
            findPlayerByName: (name) => {
                for (const [, p] of room.players) if (p.playerName === name) return p;
                return null;
            }
        };
        resultMessage = card.applyChoices(room, participants, context) || `市場消息「${card.name}」完成`;
    } catch (e) {
        console.error('applyChoices error:', e);
        resultMessage = `執行市場消息「${card.name}」時發生錯誤`;
    }

    // Broadcast final result
    broadcastToRoom(roomId, {
        type: 'market_news_result',
        cardName: card.name,
        initiator: pending.initiatorName,
        message: resultMessage
    });

    // Refresh all states
    room.players.forEach(p => {
        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: p.playerId,
            gameState: p.gameState
        });
    });

    pendingAssetChoices.delete(choiceId);
}

module.exports = { startMarketNews, handleAssetChoice };