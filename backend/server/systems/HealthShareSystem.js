"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

/**
 * Distribute `totalHealth` energy equally among OTHER players in the room.
 * Any remainder stays with the initiator.
 *
 * Example: 6 health, 3 other players → each gets 2, initiator gets 0 remainder
 * Example: 6 health, 4 other players → each gets 1, initiator gets 2 remainder
 * Example: 6 health, 0 other players → initiator gets all 6
 */
function distributeHealth(initiator, room, roomId, totalHealth, broadcastToRoom) {
    if (!room || !initiator) return { distributed: 0, remainder: 0, recipients: [] };

    // Find other players
    const others = [];
    room.players.forEach((p, ws) => {
        if (p.playerId !== initiator.playerId) {
            others.push({ player: p, ws });
        }
    });

    if (others.length === 0) {
        // No other players - initiator keeps everything
        initiator.gameState.energy = Math.min(
            initiator.gameState.maxEnergy,
            initiator.gameState.energy + totalHealth
        );

        addTransactionRecord(
            initiator.playerName,
            { name: '大學飯堂 - 健康自留', type: 'business', id: 'C17_HEALTH_SELF' },
            '健康分配',
            0,
            `無其他玩家，${totalHealth} 健康全部自留`,
            null,
            initiator.gameState
        );

        return {
            distributed: 0,
            remainder:   totalHealth,
            recipients:  []
        };
    }

    const perPlayer = Math.floor(totalHealth / others.length);
    const remainder = totalHealth - (perPlayer * others.length);

    const recipients = [];

    // Give to each other player
    others.forEach(({ player, ws }) => {
        if (perPlayer > 0) {
            const before = player.gameState.energy;
            player.gameState.energy = Math.min(
                player.gameState.maxEnergy,
                player.gameState.energy + perPlayer
            );
            const actualGain = player.gameState.energy - before;

            addTransactionRecord(
                player.playerName,
                { name: `大學飯堂健康分配 ← ${initiator.playerName}`, type: 'business', id: 'C17_HEALTH_GAIN' },
                '健康受贈',
                0,
                `收到 ${initiator.playerName} 的大學飯堂分配 ${actualGain} 健康`,
                null,
                player.gameState
            );

            // Notify receiver
            if (ws && ws.readyState === 1) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `💚 ${initiator.playerName} 的大學飯堂分給你 ${actualGain} 健康！`
                }));
                broadcastToRoom(roomId, {
                    type: 'state_updated',
                    playerId: player.playerId,
                    gameState: player.gameState
                });
            }

            recipients.push({
                playerName: player.playerName,
                amount:     actualGain
            });
        }
    });

    // Remainder stays with initiator
    if (remainder > 0) {
        initiator.gameState.energy = Math.min(
            initiator.gameState.maxEnergy,
            initiator.gameState.energy + remainder
        );

        addTransactionRecord(
            initiator.playerName,
            { name: '大學飯堂 - 剩餘健康自留', type: 'business', id: 'C17_HEALTH_REMAIN' },
            '健康自留',
            0,
            `分配後剩餘 ${remainder} 健康自留`,
            null,
            initiator.gameState
        );
    }

    console.log(`💚 ${initiator.playerName} 分配 ${totalHealth} 健康: 每人 ${perPlayer}, 剩餘 ${remainder}`);

    return {
        distributed: perPlayer * others.length,
        remainder:   remainder,
        recipients:  recipients
    };
}

module.exports = { distributeHealth };