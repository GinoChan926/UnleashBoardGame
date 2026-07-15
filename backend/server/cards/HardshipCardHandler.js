"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

function drawHardshipCard(ws, state, roomId, player, hardshipCards, broadcastToRoom) {
    if (hardshipCards.length === 0) {
        ws.send(JSON.stringify({ type: 'notification', message: '暫無逆境自強卡資料' }));
        return;
    }

    const card = hardshipCards[Math.floor(Math.random() * hardshipCards.length)];

    // ✅ Check hardship shield (from C16 家族辦公室)
    if (player.gameState.hardshipShield && player.gameState.hardshipShield > 0) {
        player.gameState.hardshipShield--;

        // Record shield usage
        addTransactionRecord(
            player.playerName,
            { name: '家族辦公室 - 抵擋逆境卡', type: 'business', id: 'C16_SHIELD' },
            '逆境卡抵擋',
            0,
            `「家族辦公室」抵擋了逆境卡「${card.name}」！剩餘 ${player.gameState.hardshipShield} 次抵擋機會`,
            null,
            player.gameState
        );

        // Send serializable card so frontend can show what was blocked
        const serializableCard = {
            id: card.id,
            name: card.name,
            description: card.description,
            image: card.image,
            cardType: 'hardship',
            cardTypeName: '逆境自強卡',
            cardTypeIcon: '🎭'
        };

        // Dice result (position didn't change - shield only affects the card effect)
        const diceResult = _buildDiceResult(player, { name: "逆境自強卡", type: "hardship" });
        ws.send(JSON.stringify(diceResult));
        broadcastToRoom(roomId, diceResult, ws);

        // Notify player - shield blocked the card
        ws.send(JSON.stringify({
            type: 'hardship_card_shielded',
            card: serializableCard,
            shieldMessage: `🛡️ 家族辦公室的專業團隊為你抵擋了逆境卡「${card.name}」！剩餘 ${player.gameState.hardshipShield} 次抵擋機會`,
            remainingShield: player.gameState.hardshipShield,
            gameState: player.gameState
        }));

        // Broadcast to other players
        broadcastToRoom(roomId, {
            type: 'notification',
            message: `🛡️ ${player.playerName} 的家族辦公室抵擋了逆境卡「${card.name}」！`
        }, ws);

        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: player.playerId,
            gameState: player.gameState
        });

        console.log(`🛡️ ${player.playerName} 的家族辦公室抵擋了逆境卡: ${card.name}`);
        return;
    }

    // ── No shield - normal execution ──────────────────────────────────────────
    const stateBefore  = JSON.parse(JSON.stringify(player.gameState));
    const effectResult = card.effect(player.gameState);

    addTransactionRecord(player.playerName, card, '逆境自強卡',
        player.gameState.cash - stateBefore.cash, effectResult, stateBefore, player.gameState);

    const serializableCard = {
        id: card.id, name: card.name, description: card.description,
        image: card.image, cardType: 'hardship', cardTypeName: '逆境自強卡', cardTypeIcon: '🎭'
    };

    const diceResult = _buildDiceResult(player, { name: "逆境自強卡", type: "hardship" });
    ws.send(JSON.stringify(diceResult));
    broadcastToRoom(roomId, diceResult, ws);

    ws.send(JSON.stringify({
        type: 'hardship_card_execute', card: serializableCard,
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
}

function _buildDiceResult(player, tile) {
    return {
        type: 'dice_result', playerId: player.playerId, playerName: player.playerName,
        steps: 0, originalSteps: 0, multiplierUsed: false,
        gameState: player.gameState, tile, eventMessage: null, multiplierMessage: ''
    };
}

module.exports = { drawHardshipCard };