"use strict";

const fs   = require('fs');
const path = require('path');

let transactions = [];

// 玩家 → 房間 對照表（於加入房間時登記），作為交易記錄房間標籤的後備來源，
// 讓即使沒有帶入玩家狀態的記錄也能歸入正確房間。
const playerRoomMap = {};
function setPlayerRoom(playerName, roomId) {
    if (playerName && roomId) playerRoomMap[playerName] = roomId;
}

// ── Card type resolver ────────────────────────────────────────────────────────

function getCardTypeFromCard(card) {
    if (!card) return 'general';

    // By ID prefix
    if (card.id) {
        if (card.id.startsWith('Z'))  return 'part_time';
        if (card.id.startsWith('F'))  return 'finance';
        if (card.id.startsWith('C'))  return 'business';
        if (card.id.startsWith('H'))  return 'property';
        if (card.id.startsWith('SC')) return 'lier';
        if (card.id.startsWith('P'))  return 'police';
        if (card.id.startsWith('M'))  return 'market_news';
        if (card.id.startsWith('IN')) return 'tip';
        if (card.id.startsWith('K'))  return 'investment';
        if (card.id.startsWith('CH')) return 'social';
    }

    // By type / cardType / category fields
    const directFields = ['type', 'cardType'];
    for (const f of directFields) {
        const v = card[f];
        if (v && v !== 'general') return v;
    }

    const categoryMap = {
        '財務': 'finance', '兼職': 'part_time', '創業': 'business',
        '地產': 'property', '騙子卡': 'lier', '警察卡': 'police',
        '市場消息卡': 'market_news', '錦囊卡': 'tip',
        '項目投資': 'investment', '貢獻社會': 'social'
    };
    if (card.category && categoryMap[card.category]) {
        return categoryMap[card.category];
    }

    // By name keywords
    if (card.name) {
        if (/股票|基金|加密|P2P/.test(card.name))          return 'finance';
        if (/店|企業|中心|機構|辦公室|程式|廠|咖啡|Airbnb|洗車|健身|培訓|飲品|麵包|飯堂|派對|外賣|無人機|補習|酒|健康/.test(card.name)) return 'business';
        if (/騙|詐|假|虛擬貨幣騙|網購|商業詐騙/.test(card.name)) return 'lier';
        if (/警方|防騙|宣傳|舉報|熱線|警訊|提防騙子|通行證|講座/.test(card.name)) return 'police';
    }

    return 'general';
}

// ── Public API ────────────────────────────────────────────────────────────────

function addTransactionRecord(playerName, card, action, amountChange, details, stateBefore, stateAfter) {
    console.log(`🔍 addTransactionRecord: ${playerName} ${action} ${card.name}`);

    const passiveIncomeChange = _passiveDiff(stateBefore, stateAfter);
    const sideIncomeChange    = _diff(stateBefore, stateAfter, 'sideIncome');
    const salaryChange        = _diff(stateBefore, stateAfter, 'salary');
    const energyChange        = _diff(stateBefore, stateAfter, 'energy');

    const cardType = getCardTypeFromCard(card);

    const roomId = (stateAfter && stateAfter.roomId)
        || (stateBefore && stateBefore.roomId)
        || playerRoomMap[playerName]
        || '未分配';

    // ✅ NEW: Extract snapshot data from stateAfter for analysis
    const snapshot = stateAfter ? {
        cash:           stateAfter.cash || 0,
        loanCash:       stateAfter.loanCash || 0,
        passiveIncome:  stateAfter.passiveIncome || 0,
        flowPassiveIncome: stateAfter.flowPassiveIncome || 0,
        sideIncome:     stateAfter.sideIncome || 0,
        salary:         stateAfter.salary || 0,
        energy:         stateAfter.energy || 0,
        maxEnergy:      stateAfter.maxEnergy || 0,
        health:         stateAfter.health || 0,
        ability:        stateAfter.ability || 0,
        loanAmount:     stateAfter.loanAmount || 0,
        accruedInterest: stateAfter.accruedInterest || 0,
        livingExpense:  stateAfter.livingExpense || 0,
        tax:            stateAfter.tax || 0,
        totalAssets:    stateAfter.totalAssets || 0,
        volunteerCount: stateAfter.volunteerCount || 0,
        contributionCount: stateAfter.contributionCount || 0,
        inFlow:         stateAfter.inFlow || false,
        inReverse:      stateAfter.inReverse || false,
        pendingDebtTotal: (stateAfter.pendingDebts || []).reduce((s, d) => s + d.amount, 0)
    } : null;

    const record = {
        id:                   `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp:            new Date().toLocaleString('zh-HK'),
        unixTime:             Date.now(),   // ✅ NEW: sortable timestamp
        playerName,
        roomId,
        cardType,
        cardName:             card.name,
        action,
        amountChange:         amountChange || 0,
        passiveIncomeChange,
        sideIncomeChange,
        salaryChange,
        energyChange,
        details:              details || '',
        snapshot                              // ✅ NEW: state snapshot
    };

    transactions.unshift(record);
    if (transactions.length > 500) transactions = transactions.slice(0, 500);

    _persist();
    return record;
}

function getTransactions() {
    return transactions;
}

function clearTransactions() {
    transactions = [];
    _persist();
}

function loadFromFile() {
    try {
        const p = path.join(__dirname, '..', '..', 'transactions.json');
        if (fs.existsSync(p)) {
            const saved = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (Array.isArray(saved) && saved.length > 0) {
                transactions = saved;
                console.log(`📚 載入了 ${transactions.length} 條歷史交易記錄`);
            }
        }
    } catch (e) {
        console.log('載入交易記錄失敗:', e.message);
    }
}

// Auto-save every 30 s
setInterval(() => _persist(), 30000);

// ── Private ───────────────────────────────────────────────────────────────────

function _persist() {
    try {
        const p = path.join(__dirname, '..', '..', 'transactions.json');
        fs.writeFileSync(p, JSON.stringify(transactions.slice(0, 200), null, 2));
    } catch (e) {
        console.log('保存交易記錄失敗:', e.message);
    }
}

function _diff(before, after, field) {
    if (!before || !after) return 0;
    return (after[field] || 0) - (before[field] || 0);
}

function _passiveDiff(before, after) {
    if (!before || !after) return 0;
    const b = (before.inFlow && before.flowPassiveIncome) ? before.flowPassiveIncome : (before.passiveIncome || 0);
    const a = (after.inFlow  && after.flowPassiveIncome)  ? after.flowPassiveIncome  : (after.passiveIncome  || 0);
    return a - b;
}

module.exports = { addTransactionRecord, getTransactions, clearTransactions, loadFromFile, getCardTypeFromCard, setPlayerRoom };