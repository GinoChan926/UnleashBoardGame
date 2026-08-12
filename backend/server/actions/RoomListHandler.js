"use strict";

const { getRoomList } = require('../utils/helpers.js');

function handleListRooms(ws, data, rooms) {
    const list = getRoomList(rooms);
    ws.send(JSON.stringify({
        type:  'room_list',
        rooms: list
    }));
    console.log(`📋 房間列表已發送 (${list.length} 個房間)`);
}

module.exports = { handleListRooms };