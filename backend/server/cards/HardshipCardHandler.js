"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function drawHardshipCard(ws, state, roomId, player, hardshipCards, broadcastToRoom, rooms) {
    if (hardshipCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無逆境自強卡資料' }));
        return;
    }

    const card = hardshipCards[Math.floor(Math.random() * hardshipCards.length)];

    // ✅ Reset card cost multiplier for ALL players when any hardship card is drawn
    const room = rooms ? rooms.get(roomId) : null;
    if (room) {
        let wasMultiplied = false;
        room.players.forEach((p, pWs) => {
            if (p.gameState.cardCostMultiplier && p.gameState.cardCostMultiplier > 1) {
                p.gameState.cardCostMultiplier = 1;
                wasMultiplied = true;

                if (pWs && pWs.readyState === 1) {
                    pWs.send(JSON.stringify({
                        type: 'notification',
                        message: `💰 抽卡費用恢復正常：$500`
                    }));
                }
            }
        });

        if (wasMultiplied) {
            console.log(`💰 抽卡費用恢復正常 (逆境卡觸發重置)`);
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `💰 由於新的逆境卡出現，抽卡費用恢復正常 $500`
            });
        }
    }

    // ✅ Check hardship shield (C16)
    if (player.gameState.hardshipShield && player.gameState.hardshipShield > 0) {
        player.gameState.hardshipShield--;

        addTransactionRecord(
            player.playerName,
            { name: '家族辦公室 - 抵擋逆境卡', type: 'business', id: 'C16_SHIELD' },
            '逆境卡抵擋', 0,
            `抵擋了「${card.name}」！剩餘 ${player.gameState.hardshipShield} 次`,
            null, player.gameState
        );

        const dr = _buildDiceResult(player, { name: "逆境自強卡", type: "hardship" });
        ws.send(JSON.stringify(dr));
        broadcastToRoom(roomId, dr, ws);

        ws.send(JSON.stringify({
            type: 'hardship_card_shielded',
            card: _serializeCard(card),
            shieldMessage: `🛡️ 家族辦公室抵擋了「${card.name}」！剩餘 ${player.gameState.hardshipShield} 次`,
            remainingShield: player.gameState.hardshipShield,
            gameState: player.gameState
        }));

        broadcastToRoom(roomId, {
            type: 'notification',
            message: `🛡️ ${player.playerName} 的家族辦公室抵擋了「${card.name}」！`
        }, ws);
        broadcastToRoom(roomId, {
            type: 'state_updated', playerId: player.playerId, gameState: player.gameState
        });

        return;
    }

    // ✅ Collective card - affects ALL players
    if (card.isCollective && card.applyCollective) {
        _handleCollectiveCard(ws, roomId, player, card, broadcastToRoom, rooms);
        return;
    }

    // ── Normal card - affects drawer only ──────────────────────────────────
    const stateBefore  = JSON.parse(JSON.stringify(player.gameState));
    const effectResult = card.effect(player.gameState);

    addTransactionRecord(player.playerName, card, '逆境自強卡',
        player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

    const dr = _buildDiceResult(player, { name: "逆境自強卡", type: "hardship" });
    ws.send(JSON.stringify(dr));
    broadcastToRoom(roomId, dr, ws);

    ws.send(JSON.stringify({
        type: 'hardship_card_execute', card: _serializeCard(card),
        effectMessage: effectResult, gameState: player.gameState
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🎭 ${player.playerName} 抽到逆境自強卡「${card.name}」！${effectResult}`
    }, ws);
    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: player.playerId, gameState: player.gameState
    });

    console.log(`✅ ${player.playerName} 執行了逆境自強卡: ${card.name}`);

    // ✅ Check if card triggers additional lier card draws (S11 etc)
    if (card.drawLierCount && card.drawLierCount > 0) {
        let lierCards = [];
        try {
            lierCards = require('../../lier_cards.js').lierCards || [];
        } catch (e) {
            console.log('⚠️ 無法載入騙子卡');
        }

        if (lierCards.length > 0) {
            const {drawAndExecuteLierCard} = require('./LierCardHandler.js');

            for (let i = 0; i < card.drawLierCount; i++) {
                setTimeout(() => {
                    console.log(`🎭 ${player.playerName} 因「${card.name}」抽第 ${i + 1} 張騙子卡`);
                    drawAndExecuteLierCard(
                        ws,
                        player.gameState,
                        roomId,
                        player,
                        lierCards,
                        broadcastToRoom,
                        rooms
                    );
                }, (i + 1) * 2000);  // 2 second delay between each
            }
        }
        // ✅ Check if card has optional choice (S19 etc)
        if (card.hasChoice && card.applyChoice) {
            // Send choice prompt to player after showing the base effect
            setTimeout(() => {
                ws.send(JSON.stringify({
                    type: 'hardship_choice_prompt',
                    cardId: card.id,
                    cardName: card.name,
                    baseEffect: effectResult,
                    choices: [
                        {
                            id: 'hire',
                            label: '💼 聘請稅務顧問',
                            description: '支出 $10,000，精力 +2',
                            cost: 10000,
                            canAfford: player.gameState.cash >= 10000
                        },
                        {
                            id: 'skip',
                            label: '❌ 不聘請',
                            description: '維持現狀',
                            cost: 0,
                            canAfford: true
                        }
                    ],
                    gameState: player.gameState
                }));
            }, 1500);  // delay so player reads the base effect first

            // Store pending choice
            if (!room) {
                const roomObj = rooms ? rooms.get(roomId) : null;
                if (roomObj) {
                    if (!roomObj.pendingHardshipChoices) roomObj.pendingHardshipChoices = new Map();
                    roomObj.pendingHardshipChoices.set(ws, { card, playerId: player.playerId });
                }
            } else {
                // room might not be directly available here - use rooms
                const roomObj = rooms ? rooms.get(roomId) : null;
                if (roomObj) {
                    if (!roomObj.pendingHardshipChoices) roomObj.pendingHardshipChoices = new Map();
                    roomObj.pendingHardshipChoices.set(ws, { card, playerId: player.playerId });
                }
            }
        }
    }
}

// ==================== Collective card handler ====================
// ✅ No if/else chain - each card defines its own applyCollective method

function _handleCollectiveCard(ws, roomId, player, card, broadcastToRoom, rooms) {
    const room = rooms ? rooms.get(roomId) : null;
    if (!room) return;

    console.log(`🌪️ 集體逆境卡觸發: ${card.name}`);

    const ctx = {
        addTransactionRecord,
        broadcastToRoom: (msg, excl) => broadcastToRoom(roomId, msg, excl),
        serializeCard: _serializeCard,
        _pendingLierDraws: []    // ✅ Cards can queue lier draws here
    };

    // Run the card's own collective logic
    const results = card.applyCollective(room, player, ctx);

    // Send dice result for the drawer
    const dr = _buildDiceResult(player, { name: "逆境自強卡", type: "hardship" });
    ws.send(JSON.stringify(dr));
    broadcastToRoom(roomId, dr, ws);

    // Broadcast summary
    const summaryMsg = typeof results === 'string'
        ? results
        : `🌪️ 集體逆境「${card.name}」觸發！`;

    broadcastToRoom(roomId, {
        type: 'notification',
        message: summaryMsg
    });

    // Update all players' states
    room.players.forEach(p => {
        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: p.playerId,
            gameState: p.gameState
        });
    });

    // ✅ Process queued lier card draws (from S09 etc)
    if (ctx._pendingLierDraws && ctx._pendingLierDraws.length > 0) {
        console.log(`🎭 處理 ${ctx._pendingLierDraws.length} 張待抽騙子卡`);

        // Load lier cards
        let lierCards = [];
        try {
            lierCards = require('../../lier_cards.js').lierCards || [];
        } catch (e) {
            console.log('⚠️ 無法載入騙子卡');
        }

        if (lierCards.length === 0) {
            broadcastToRoom(roomId, {
                type: 'notification',
                message: '⚠️ 暫無騙子卡資料'
            });
        } else {
            // Draw lier cards for each queued player with delay between each
            ctx._pendingLierDraws.forEach(({ ws: pWs, player: p, playerName }, index) => {
                setTimeout(() => {
                    if (pWs && pWs.readyState === 1) {
                        console.log(`🎭 ${playerName} 因 ${card.name} 抽騙子卡`);

                        // Use the existing drawAndExecuteLierCard if available
                        try {
                            const { drawAndExecuteLierCard } = require('./LierCardHandler.js');
                            drawAndExecuteLierCard(
                                pWs,
                                p.gameState,
                                roomId,
                                p,
                                lierCards,
                                broadcastToRoom,
                                rooms
                            );
                        } catch (e) {
                            console.error(`❌ 騙子卡抽取失敗: ${playerName}`, e);
                        }
                    }
                }, (index + 1) * 2000);   // 2 second delay between each draw
            });
        }
    }

    if (ctx._pendingHardshipDraws && ctx._pendingHardshipDraws.length > 0) {
        console.log(`🎭 處理 ${ctx._pendingHardshipDraws.length} 張待抽逆境卡`);

        let hardshipCardsData = [];
        try {
            hardshipCardsData = require('../../hardship_cards.js').hardshipCards || [];
        } catch (e) {
            console.log('⚠️ 無法載入逆境卡');
        }

        if (hardshipCardsData.length === 0) {
            broadcastToRoom(roomId, {
                type: 'notification',
                message: '⚠️ 暫無逆境卡資料'
            });
        } else {
            // Filter out the current collective card to avoid infinite loop
            const nonCollectiveCards = hardshipCardsData.filter(c => !c.isCollective);

            if (nonCollectiveCards.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: '⚠️ 沒有可用的非集體逆境卡'
                });
            } else {
                ctx._pendingHardshipDraws.forEach(({ ws: pWs, player: p, playerName }, index) => {
                    setTimeout(() => {
                        if (pWs && pWs.readyState === 1) {
                            console.log(`🎭 ${playerName} 因 ${card.name} 再抽逆境卡`);

                            // Draw a random NON-collective hardship card
                            const randomCard = nonCollectiveCards[
                                Math.floor(Math.random() * nonCollectiveCards.length)
                                ];

                            const cardStateBefore = JSON.parse(JSON.stringify(p.gameState));

                            // Check shield first
                            if (p.gameState.hardshipShield && p.gameState.hardshipShield > 0) {
                                p.gameState.hardshipShield--;

                                pWs.send(JSON.stringify({
                                    type: 'hardship_card_shielded',
                                    card: _serializeCard(randomCard),
                                    shieldMessage: `🛡️ 家族辦公室抵擋了「${randomCard.name}」！剩餘 ${p.gameState.hardshipShield} 次`,
                                    remainingShield: p.gameState.hardshipShield,
                                    gameState: p.gameState
                                }));

                                broadcastToRoom(roomId, {
                                    type: 'notification',
                                    message: `🛡️ ${playerName} 的家族辦公室抵擋了逆境卡「${randomCard.name}」！`
                                }, pWs);
                            } else {
                                // Execute the card
                                const effectResult = randomCard.effect(p.gameState);

                                addTransactionRecord(
                                    playerName, randomCard, '逆境自強卡',
                                    p.gameState.cash - cardStateBefore.cash,
                                    effectResult, cardStateBefore, p.gameState
                                );

                                pWs.send(JSON.stringify({
                                    type: 'hardship_card_execute',
                                    card: _serializeCard(randomCard),
                                    effectMessage: effectResult,
                                    gameState: p.gameState
                                }));

                                broadcastToRoom(roomId, {
                                    type: 'notification',
                                    message: `🎭 ${playerName} 因通貨緊縮再抽逆境卡「${randomCard.name}」！${effectResult}`
                                }, pWs);
                            }

                            broadcastToRoom(roomId, {
                                type: 'state_updated',
                                playerId: p.playerId,
                                gameState: p.gameState
                            });
                        }
                    }, (index + 1) * 2500);  // 2.5 second delay between each
                });
            }
        }
    }

    console.log(`🌪️ 集體逆境完成: ${card.name}`);
}

// ==================== Private ====================

function _buildDiceResult(player, tile) {
    return {
        type: 'dice_result', playerId: player.playerId, playerName: player.playerName,
        steps: 0, originalSteps: 0, multiplierUsed: false,
        gameState: player.gameState, tile, eventMessage: null, multiplierMessage: ''
    };
}

function _serializeCard(card) {
    return {
        id: card.id, name: card.name, description: card.description,
        image: card.image, cardType: 'hardship', cardTypeName: '逆境自強卡', cardTypeIcon: '🎭'
    };
}

function handleHardshipChoice(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = room.pendingHardshipChoices?.get(ws);
    if (!pending || !pending.card || !pending.card.applyChoice) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的選擇' }));
        return;
    }

    const { card } = pending;
    const choice = data.choice;
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));

    const choiceResult = card.applyChoice(player.gameState, choice);

    addTransactionRecord(
        player.playerName,
        { name: `${card.name} - 選擇`, type: 'hardship', id: card.id },
        choice === 'hire' ? '聘請顧問' : '放棄選項',
        player.gameState.cash - stateBefore.cash,
        choiceResult,
        stateBefore,
        player.gameState
    );

    ws.send(JSON.stringify({
        type: 'hardship_choice_result',
        choice,
        message: choiceResult,
        gameState: player.gameState
    }));

    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });

    room.pendingHardshipChoices.delete(ws);
    console.log(`⚖️ ${player.playerName} 逆境卡選擇: ${choice} → ${choiceResult}`);
}

module.exports = { drawHardshipCard, handleHardshipChoice };