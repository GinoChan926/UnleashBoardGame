"use strict";

// Map state flags → dream card display info
// Based on backend/dream_cards.js
const DREAM_FLAG_MAP = {
    hasDreamCar:            { id: 'D01', name: '訂制夢想跑車',   image: '../cards/dream/D01.png' },
    hasFamousPaint:       { id: 'D02', name: '競投名畫',       image: '../cards/dream/D02.png' },
    hasClimbedFuji:         { id: 'D03', name: '登頂富士山',     image: '../cards/dream/D03.png' },
    hasMediaPlatform:       { id: 'D04', name: '開設媒體平台',   image: '../cards/dream/D04.png' },
    hasHoldConcert:         { id: 'D05', name: '舉辦大型演唱會', image: '../cards/dream/D05.png' },
    hasDoneExtremeSports: { id: 'D06', name: '極限運動', image: '../cards/dream/D06.png' },
    hasDeepWaterExploration:   { id: 'D07', name: '深海探險',       image: '../cards/dream/D07.png' },
    hasDreamStore:        { id: 'D08', name: '按自己興趣開店', image: '../cards/dream/D08.png' },
    hasAfricaExploration:               { id: 'D09', name: '非洲探險',       image: '../cards/dream/D09.png' },
    hasDreamMansion:       { id: 'D10', name: '購買豪宅',       image: '../cards/dream/D10.png' },
    hasShotMovie:            { id: 'D11', name: '投資拍電影',     image: '../cards/dream/D11.png' },
    hasDineWithInvestors:          { id: 'D13', name: '和股神食飯',     image: '../cards/dream/D12.png' },
    hasBoughtManor:    { id: 'D14', name: '購買私人莊園',   image: '../cards/dream/D13.png' }
    // Note: hasUltimateAchievement is shared by D06 AND D15 (both set the same flag)
};

function handleGetFlowInventory(ws, data, roomId, rooms) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state = player.gameState;

    // Dreams achieved
    const dreams = [];
    for (const [flag, info] of Object.entries(DREAM_FLAG_MAP)) {
        if (state[flag]) {
            dreams.push(info);
        }
    }

    // Flow investments (recorded when player activates investment_tile cards in flow)
    const investments = (state.flowInvestments || []).map(inv => ({
        id:            inv.id,
        name:          inv.name,
        image:         inv.image || '',
        tileName:      inv.tileName || '',
        cost:          inv.cost || 0,
        monthlyReturn: inv.monthlyReturn || 0,
        purchasedAt:   inv.purchasedAt || null
    }));

    const totalInvested      = investments.reduce((s, i) => s + i.cost, 0);
    const totalMonthlyReturn = investments.reduce((s, i) => s + i.monthlyReturn, 0);

    ws.send(JSON.stringify({
        type:                 'flow_inventory_snapshot',
        inFlow:               state.inFlow === true,
        dreams,
        totalDreams:          Object.keys(DREAM_FLAG_MAP).length,
        investments,
        totalInvested,
        totalMonthlyReturn,
        currentPassiveIncome: state.flowPassiveIncome || state.passiveIncome || 0
    }));

    console.log(`🌊 ${player.playerName} 查看順流層清單`);
}

module.exports = { handleGetFlowInventory };