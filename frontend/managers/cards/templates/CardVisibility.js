"use strict";

/**
 * Determines whether a card's content should be hidden until purchase.
 * Blind cards force the player to pay $500 before seeing content.
 */
export class CardVisibility {

    /**
     * @param {object} card - card data from server
     * @returns {boolean} true if content should be hidden before purchase
     */
    static isBlindCard(card) {
        if (!card) return false;

        // Check by cardType or type field
        const type = card.cardType || card.type || '';

        // Blind types
        const BLIND_TYPES = ['police', 'hardship', 'market_news', 'awareness', 'tip'];
        if (BLIND_TYPES.includes(type)) return true;

        // Check by ID prefix
        const id = card.id || '';
        if (id.startsWith('P'))  return true;  // Police
        if (id.startsWith('M'))  return true;  // Market news
        if (id.startsWith('IN')) return true;  // Awareness / tip
        if (id.startsWith('H') && card.type === 'hardship') return true;

        return false;
    }

    /**
     * Get placeholder image URL for blind cards.
     */
    static getBlindImage(cardType) {
        const covers = {
            police:      '../cards/police/back.png',
            hardship:    '../cards/hardship/back.png',
            market_news: '../cards/revelation/market/back.png',
            awareness:   '../cards/revelation/tip/back.png',
            tip:         '../cards/revelation/tip/back.png'
        };
        return covers[cardType] || '../cards/cover/mystery.png';
    }

    /**
     * Get placeholder label for blind cards.
     */
    static getBlindLabel(cardType) {
        const labels = {
            police:      '👮 警察卡',
            hardship:    '🎭 逆境自強卡',
            market_news: '📊 市場消息卡',
            awareness:   '🧘 察覺卡',
            tip:         '🎁 錦囊卡'
        };
        return labels[cardType] || '🎴 未知卡片';
    }

    /**
     * Get description shown before purchase (no spoilers).
     */
    static getBlindDescription(cardType) {
        const descs = {
            police:      '警察卡：可能是好事，也可能是壞事。付 $500 揭曉！',
            hardship:    '逆境自強卡：這是一張考驗你的卡片。付 $500 揭曉！',
            market_news: '市場消息卡：影響市場價格。付 $500 揭曉！',
            awareness:   '察覺卡：可能改變你的策略。付 $500 揭曉！',
            tip:         '錦囊卡：獲得特殊技能或福利。付 $500 揭曉！'
        };
        return descs[cardType] || '神秘卡片，付 $500 揭曉內容';
    }
}