"use strict";

export class CardVisibility {

    static isBlindCard(card) {
        if (!card) return false;

        const type = card.cardType || card.type || '';

        // ✅ ALL these types are now blind (content hidden before purchase)
        const BLIND_TYPES = [
            'police', 'hardship', 'market_news', 'awareness', 'tip',
            'part_time', 'finance', 'business', 'property'   // ← ADDED
        ];
        if (BLIND_TYPES.includes(type)) return true;

        // ID prefix check
        const id = card.id || '';
        if (id.startsWith('P'))   return true;   // Police
        if (id.startsWith('M'))   return true;   // Market news
        if (id.startsWith('IN'))  return true;   // Awareness / tip
        if (id.startsWith('Z'))   return true;   // Part-time
        if (id.startsWith('F'))   return true;   // Finance
        if (id.startsWith('C'))   return true;   // Business
        if (id.startsWith('H') && card.type === 'hardship') return true;
        if (id.startsWith('H') && card.type === 'property') return true;

        return false;
    }

    static getBlindImage(cardType) {
        const covers = {
            police:      '../cards/police/back.png',
            hardship:    '../cards/hardship/back.png',
            market_news: '../cards/revelation/market/back.png',
            awareness:   '../cards/revelation/tip/back.png',
            tip:         '../cards/revelation/tip/back.png',
            part_time:   '../cards/cover/part_time.png',
            finance:     '../cards/cover/finance.png',
            business:    '../cards/cover/business.png',
            property:    '../cards/cover/property.png'
        };
        return covers[cardType] || '../cards/cover/mystery.png';
    }

    static getBlindLabel(cardType) {
        const labels = {
            police:      '👮 警察卡',
            hardship:    '🎭 逆境自強卡',
            market_news: '📊 市場消息卡',
            awareness:   '🧘 察覺卡',
            tip:         '🎁 錦囊卡',
            part_time:   '💼 兼職卡',
            finance:     '📈 財務卡',
            business:    '🚀 創業卡',
            property:    '🏠 地產卡'
        };
        return labels[cardType] || '🎴 未知卡片';
    }

    static getBlindDescription(cardType) {
        const descs = {
            police:      '警察卡：可能是好事，也可能是壞事。付 $500 揭曉！',
            hardship:    '逆境自強卡：這是一張考驗你的卡片。付 $500 揭曉！',
            market_news: '市場消息卡：影響市場價格。付 $500 揭曉！',
            awareness:   '察覺卡：可能改變你的策略。付 $500 揭曉！',
            tip:         '錦囊卡：獲得特殊技能或福利。付 $500 揭曉！',
            part_time:   '兼職卡：增加收入的機會。付 $500 揭曉具體工作！',
            finance:     '財務卡：股票、基金、加密貨幣等投資。付 $500 揭曉！',
            business:    '創業卡：開設生意賺取被動收入。付 $500 揭曉！',
            property:    '地產卡：物業投資或收購機會。付 $500 揭曉！'
        };
        return descs[cardType] || '神秘卡片，付 $500 揭曉內容';
    }
}