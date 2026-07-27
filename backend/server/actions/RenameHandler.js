"use strict";

function handleRenamePlayer(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const newName = (data.newName || '').trim();

    if (!newName) {
        ws.send(JSON.stringify({ type: 'error', message: '名稱不能為空' }));
        return;
    }

    if (newName.length > 20) {
        ws.send(JSON.stringify({ type: 'error', message: '名稱不能超過 20 字元' }));
        return;
    }

    let isDuplicate = false;
    room.players.forEach(p => {
        if (p.playerId !== player.playerId && p.playerName === newName) {
            isDuplicate = true;
        }
    });

    if (isDuplicate) {
        ws.send(JSON.stringify({ type: 'error', message: '此名稱已被其他玩家使用' }));
        return;
    }

    const oldName = player.playerName;
    player.playerName = newName;
    player.gameState.playerName = newName;

    if (room.currentTurnPlayer === oldName) {
        room.currentTurnPlayer = newName;
    }
    if (player.gameState.currentTurnPlayer === oldName) {
        player.gameState.currentTurnPlayer = newName;
    }

    ws.send(JSON.stringify({
        type:      'rename_success',
        oldName,
        newName,
        gameState: player.gameState
    }));

    broadcastToRoom(roomId, {
        type:       'player_renamed',
        playerId:   player.playerId,
        oldName,
        newName,
        gameState:  player.gameState
    });

    broadcastToRoom(roomId, {
        type:    'notification',
        message: `📝「${oldName}」已改名為「${newName}」`
    });

    console.log(`📝 玩家改名: ${oldName} → ${newName}`);
}

module.exports = { handleRenamePlayer };