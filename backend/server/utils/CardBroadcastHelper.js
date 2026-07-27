"use strict";

/**
 * Broadcast a card reveal to all OTHER players in the room.
 * The player who drew the card sees their own dedicated modal.
 *
 * @param {object} params
 *   - roomId
 *   - drawerWs           - WebSocket of the player who drew (excluded from broadcast)
 *   - drawerName         - name of drawer
 *   - drawerId           - id of drawer
 *   - card               - { id, name, description, image, cardType, cardTypeName }
 *   - action             - '抽到' | '購買了' | '啟動了' etc.
 *   - effectMessage      - optional effect summary
 *   - broadcastToRoom    - broadcast function
 */
function broadcastCardReveal({
                                 roomId,
                                 drawerWs,
                                 drawerName,
                                 drawerId,
                                 card,
                                 action = '抽到',
                                 effectMessage = '',
                                 broadcastToRoom
                             }) {
    if (!card || !broadcastToRoom) return;

    const serializedCard = {
        id:           card.id,
        name:         card.name,
        description:  card.description,
        image:        card.image,
        cardType:     card.cardType || card.type || 'default',
        cardTypeName: card.cardTypeName || ''
    };

    broadcastToRoom(roomId, {
        type:          'card_revealed',
        playerId:      drawerId,
        playerName:    drawerName,
        card:          serializedCard,
        action,
        effectMessage
    }, drawerWs);  // exclude drawer from broadcast
}

module.exports = { broadcastCardReveal };