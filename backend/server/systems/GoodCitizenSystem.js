"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

const pendingChoices = new Map(); // playerId → { roomId }

/**
 * Called after P08 executes. Prompt player to pick reward type.
 */
function startGoodCitizenChoice(ws, roomId, player, broadcastToRoom) {
    pendingChoices.set(player.playerId, { roomId });

    ws.send(JSON.stringify({
        type: 'good_citizen_choice_prompt',
        message: `🏆 救人做好市民！請選擇獎勵`
    }));

    console.log(`🏆 ${player.playerName} 準備選擇好市民獎勵`);
}

/**
 * Called when player picks 'volunteer' or 'tip_card'.
 */
function handleGoodCitizenChoice(ws, data, roomId, rooms, broadcastToRoom, tipCards) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const pending = pendingChoices.get(player.playerId);
    if (!pending) {
        ws.send(JSON.stringify({ type: 'error', message: '沒有待處理的選擇' }));
        return;
    }

    const choice = data.choice;
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));

    if (choice === 'volunteer') {
        // Grant 2 volunteer resources
        player.gameState.volunteerCount  = (player.gameState.volunteerCount  || 0) + 2;
        player.gameState.volunteerShield = (player.gameState.volunteerShield || 0) + 2;

        const message = `🏆 救人做好市民！獲得 2 次義工資格！當前義工次數：${player.gameState.volunteerShield} 次`;

        addTransactionRecord(
            player.playerName,
            { name: '救人做好市民 - 義工資格', type: 'police', id: 'P08_VOLUNTEER' },
            '獲得義工資格',
            0,
            `選擇獲得 2 次義工資格`,
            stateBefore,
            player.gameState
        );

        ws.send(JSON.stringify({
            type: 'good_citizen_result',
            choice: 'volunteer',
            message,
            gameState: player.gameState
        }));

        broadcastToRoom(roomId, {
            type: 'notification',
            message: `🏆 ${player.playerName} 獲得 2 次義工資格！`
        }, ws);

        broadcastToRoom(roomId, {
            type: 'state_updated',
            playerId: player.playerId,
            gameState: player.gameState
        });

        console.log(`✅ ${player.playerName} P08 選擇義工資格`);

    } else if (choice === 'tip_card') {
        // Draw 1 tip card - reuse the tip card system
        addTransactionRecord(
            player.playerName,
            { name: '救人做好市民 - 抽錦囊卡', type: 'police', id: 'P08_TIP' },
            '抽取錦囊卡',
            0,
            `選擇抽取 1 張錦囊卡`,
            null,
            player.gameState
        );

        // Notify player
        ws.send(JSON.stringify({
            type: 'good_citizen_result',
            choice: 'tip_card',
            message: `🎁 你選擇抽取 1 張錦囊卡！`,
            gameState: player.gameState
        }));

        broadcastToRoom(roomId, {
            type: 'notification',
            message: `🏆 ${player.playerName} 選擇抽取錦囊卡！`
        }, ws);

        // Trigger the auto tip draw system (draw 1, pick 1)
        setTimeout(() => {
            const { startAutoTipDraw } = require('./AutoTipDrawSystem.js');
            startAutoTipDraw(ws, roomId, player, tipCards, 1, broadcastToRoom);
        }, 500);

        console.log(`✅ ${player.playerName} P08 選擇抽錦囊卡`);
    } else {
        ws.send(JSON.stringify({ type: 'error', message: '無效的選擇' }));
        return;
    }

    pendingChoices.delete(player.playerId);
}

module.exports = { startGoodCitizenChoice, handleGoodCitizenChoice };