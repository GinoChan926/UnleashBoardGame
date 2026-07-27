"use strict";

const { _drawNextQueuedLier } = require('../cards/HardshipCardHandler.js');

function handleLierAck(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    if (!room.pendingLierQueue?.get(ws)) return;

    // Wait a moment then draw the next
    setTimeout(() => {
        _drawNextQueuedLier(ws, roomId, player, rooms, broadcastToRoom);
    }, 800);
}

module.exports = { handleLierAck };