"use strict";

const { PROFESSIONS }                = require('../constants/Professions.js');
const { getOrCreateRoom, broadcastToRoom } = require('../utils/helpers.js');
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

        // Send join_success with saved state
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

    // ── New player join (existing logic) ──────────────────────────────────
    const professionData = data.professionData || PROFESSIONS[data.profession] || PROFESSIONS.teacher;

    const gameState = {
        playerId, playerName,
        streamlinePos: 0, reversePos: 0, flowPos: 0,
        inReverse: false, inFlow: false,
        cash:            professionData.cash,
        salary:          professionData.salary,
        sideIncome:      professionData.sideIncome || 0,
        passiveIncome:   0,
        livingExpense:   professionData.livingExpense,
        tax:             professionData.tax,
        loanAmount:      0, loanInterest: 0,
        childExpense:    0, totalAssets: professionData.cash,
        energy:          professionData.energy,
        maxEnergy:       professionData.maxEnergy,
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

    console.log(`👤 玩家加入: ${playerName}, 房間人數: ${room.players.size}`);
}

module.exports = { handleJoin };