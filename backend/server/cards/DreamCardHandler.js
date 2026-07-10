"use strict";

function triggerDreamCard(state, tile, ws, roomId, player, oldPos, newPos, getDreamCard, broadcastToRoom) {
    if (typeof getDreamCard !== 'function') return;

    const position = newPos + 1;
    const dreamCard = getDreamCard(position);
    if (!dreamCard) return;

    console.log(`🌟 ${player.playerName} 經過夢想格 ${position}: ${dreamCard.name}`);

    const dreamKey = `has${dreamCard.name.replace(/[^a-zA-Z]/g, '')}`;
    if (state[dreamKey]) {
        ws.send(JSON.stringify({ type: 'notification', message: `🌟 你已實現「${dreamCard.name}」夢想！` }));
        return;
    }

    const canAfford = state.cash >= 500 &&
        state.cash >= (dreamCard.investmentCost || 0) &&
        state.energy >= (dreamCard.energyCost || 0);

    ws.send(JSON.stringify({
        type: 'opportunity_card_draw',
        card: {
            id: dreamCard.id, name: dreamCard.name, description: dreamCard.description,
            image: dreamCard.image || '', cost: dreamCard.cost || 500,
            investmentCost: dreamCard.investmentCost || 0, energyCost: dreamCard.energyCost || 0,
            cardType: 'dream', cardTypeName: '夢想', cardTypeIcon: '🌟',
            type: 'dream', position
        },
        canAfford,
        message: `🌟 你經過夢想格 ${position}！「${dreamCard.name}」正在等待你實現！`
    }));

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🌟 ${player.playerName} 經過夢想格 ${position}：${dreamCard.name}！`
    }, ws);
}

module.exports = { triggerDreamCard };