"use strict";

const { PROFESSIONS }                = require('../constants/Professions.js');
const {
    getOrCreateRoom,
    broadcastToRoom,
    MAX_PLAYERS_PER_ROOM             // ✅ NEW
} = require('../utils/helpers.js');
const { streamlineTiles, reverseTiles, flowTiles } = require('../constants/Tiles.js');
const { handlePlayerReconnect }      = require('./DisconnectHandler.js');

function handleJoin(ws, data, roomId, rooms) {
    const room       = getOrCreateRoom(rooms, roomId, streamlineTiles, reverseTiles, flowTiles);
    const playerId   = data.playerId;
    const playerName = data.playerName;

    const _broadcast = (roomId, msg, excl) => broadcastToRoom(rooms, roomId, msg, excl);

    // ✅ Check for reconnection first
    let existingPlayer = null;
    for (const [, p] of room.players) {
        if (p.playerId === playerId && p.disconnected) {
            existingPlayer = p;
            break;
        }
    }

    if (existingPlayer) {
        // ── Reconnection flow ─────────────────────────────────────────────
        handlePlayerReconnect(ws, roomId, rooms, existingPlayer, _broadcast);

        const otherPlayers = Array.from(room.players.values())
            .filter(p => p.playerId !== playerId)
            .map(p => ({ id: p.playerId, gameState: p.gameState }));

        ws.send(JSON.stringify({
            type: 'join_success',
            reconnected: true,
            playerId,
            playerName: existingPlayer.playerName,
            gameState: existingPlayer.gameState,
            otherPlayers,
            streamlineTiles: room.streamlineTiles,
            reverseTiles:    room.reverseTiles,
            flowTiles:       room.flowTiles,
            timer: {
                running: room.timer.running,
                paused:  room.timer.paused,
                duration: room.timer.duration,
                remaining: room.timer.running && room.timer.endAt
                    ? Math.max(0, Math.round((room.timer.endAt - Date.now()) / 1000))
                    : room.timer.remaining,
                endAt: room.timer.endAt
            },
            isHost: room.hostId === playerId
        }));

        console.log(`🔌 玩家重新加入: ${existingPlayer.playerName}`);
        return;
    }

    // ✅ NEW: Check room capacity before adding new player
    let activeCount = 0;
    room.players.forEach(p => {
        if (!p.disconnected) activeCount++;
    });

    if (activeCount >= MAX_PLAYERS_PER_ROOM) {
        ws.send(JSON.stringify({
            type:   'join_failed',
            reason: `❌ 房間「${roomId}」已滿員 (${activeCount}/${MAX_PLAYERS_PER_ROOM})，請選擇其他房間`
        }));
        console.log(`❌ 玩家 ${playerName} 加入房間 ${roomId} 失敗：房間已滿 (${activeCount}/${MAX_PLAYERS_PER_ROOM})`);

        // ✅ Clean up empty room if the check triggered creation of a fresh empty room
        // (getOrCreateRoom created it above, but if this rejection is for a new "1-of-8" room
        // that shouldn't happen since 0 < 8. So no cleanup needed for capacity rejection.)
        return;
    }

    // ── New player join (existing logic) ──────────────────────────────────
    const professionData = data.professionData || PROFESSIONS[data.profession] || PROFESSIONS.teacher;

    const gameState = {
        playerId, playerName,
        streamlinePos: 0, reversePos: 0, flowPos: 0,
        inReverse: false, inFlow: false,
        cash:            professionData.cash,
        salary:          professionData.salary,
        sideIncome:      professionData.sideIncome || 0,
        originalSideIncome: professionData.sideIncome || 0,
        passiveIncome:   0,
        livingExpense:   professionData.livingExpense,
        tax:             professionData.tax,
        loanAmount:            0,
        loanInterest:          0,
        loanCash:            0,
        accruedInterest:     0,
        propertyMortgageExpense: 0,
        loanRateBase:          10,
        loanCapMultiplier:     10,
        loanCapBaseType:       'cashflow',
        childExpense:    0, totalAssets: professionData.cash,
        energy:          professionData.energy,
        maxEnergy:       professionData.maxEnergy,
        health:          0,
        originalHealth:  0,
        ability:         0,
        originalAbility: 0,
        luck:            professionData.luck, maxLuck: 10,
        isMyTurn:        room.players.size === 0,
        currentTurnPlayer: playerName,
        volunteerCount:    0,
        contributionCount: 0,
        hasRolledThisTurn: false,
        lentOut:    [],
        debtsOwed:  []
    };

    room.players.set(ws, {
        playerId,
        playerName,
        gameState,
        disconnected:     false,
        disconnectedAt:   null,
        disconnectedWs:   null
    });
    if (!room.hostId) {
        room.hostId = playerId;
    }
    room.currentTurnPlayer = playerName;

    const otherPlayers = Array.from(room.players.values())
        .filter(p => p.playerId !== playerId)
        .map(p => ({ id: p.playerId, gameState: p.gameState }));

    ws.send(JSON.stringify({
        type: 'join_success',
        playerId,
        playerName,
        gameState,
        otherPlayers,
        streamlineTiles: room.streamlineTiles,
        reverseTiles:    room.reverseTiles,
        flowTiles:       room.flowTiles,
        serverInstanceId: global.SERVER_INSTANCE_ID,
        timer: {
            running: room.timer.running,
            paused: room.timer.paused,
            duration: room.timer.duration,
            remaining: room.timer.running && room.timer.endAt
                ? Math.max(0, Math.round((room.timer.endAt - Date.now()) / 1000))
                : room.timer.remaining,
            endAt: room.timer.endAt
        },
        isHost: room.hostId === playerId
    }));

    _broadcast(roomId, { type: 'player_joined', player: { id: playerId, gameState } }, ws);

    console.log(`👤 玩家加入: ${playerName}, 房間 ${roomId} 人數: ${room.players.size}/${MAX_PLAYERS_PER_ROOM}`);
}

module.exports = { handleJoin };