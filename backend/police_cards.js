const policeCards = [
    {
        id: "P01",
        name: "你有留意提防騙子宣傳",
        description: "警方宣傳提醒你提防騙子，精力 +4",
        image: "../cards/police/P01.png",
        cost: 0,
        type: "police",
        category: "警察卡",
        effect: (state) => {
            state.energy = Math.min(state.maxEnergy, state.energy + 4);
            state.hasFraudAlert = true;
            return `👮 警方宣傳！你留意到提防騙子的資訊，獲得防騙提醒！精力 +4`;
        },
        getEffectDescription: () => "精力 +4,獲得防騙提醒"
    },

    {
        id: "P02",
        name: "防騙通行證",
        description: "可抵擋一次騙子卡/加密貨幣/P2P/信用卡有關損失，之後棄此卡到公共區，你可留下此卡或轉讓別人",
        image: "../cards/police/P02.png",
        cost: 0,
        type: "police",
        category: "警察卡",
        hasShield: true,
        shieldType: "fraud",
        effect: (state) => {
            state.fraudShield = (state.fraudShield || 0) + 1;
            state.energy = Math.min(state.maxEnergy, state.energy + 1);
            // state.luck   = Math.min(state.maxLuck, state.luck + 1);

            return `🛡️ 獲得「防騙通行證」！可抵擋一次騙子卡/加密貨幣/P2P/信用卡有關的損失！\n   💪 精力 +1\n   📌 使用後此卡會棄到公共區`;
        },
        getEffectDescription: () => "抵擋一次損失，精力 +1"
    },

    {
        id: "P03",
        name: "防騙教育",
        description: "下次當其他玩家遇到騙子卡/加密貨幣/P2P/信用卡有關損失，你可以幫他防範一次，遊戲完結時，計算作一次義工。",
        image: "../cards/police/P03.png",
        cost: 0,
        type: "police",
        category: "警察卡",
        hasVolunteerFeature: true,
        effect: (state) => {
            state.volunteerCount  = (state.volunteerCount  || 0) + 1;
            state.volunteerShield = (state.volunteerShield || 0) + 1;
            state.energy = Math.max(0, state.energy - 1);
            // state.luck   = Math.min(state.maxLuck, state.luck + 2);

            return `📚 獲得「防騙教育」義工資格！\n   👮 下次其他玩家遇到騙子卡時，你可以幫他防範一次！\n   ⚡ 精力 -1\n   📝 遊戲完結時，此義工行為將被記錄！`;
        },
        getEffectDescription: () => "幫助其他玩家防範一次損失，精力 -1,記錄義工行為"
    },

    {
        id: "P04",
        name: "平常多了解法例",
        description: "了解法例後，你懂得合法節稅，支出減少 10%",
        image: "../cards/police/P04.png",
        cost: 0,
        type: "police",
        category: "警察卡",
        effect: (state) => {
            const currentTotalExp = state.livingExpense + state.tax + state.loanInterest + state.childExpense;

            if (!state.expenseReduction) state.expenseReduction = 0;
            state.expenseReduction += 10;

            state.hasLegalKnowledge = true;
            state.energy = Math.max(0, state.energy - 1);
            // state.luck   = Math.min(state.maxLuck, state.luck + 1);

            const reductionRate = state.expenseReduction / 100;
            const newTotalExp = Math.floor(currentTotalExp * (1 - reductionRate));

            return `📚 平常多了解法例！你學會了合法節稅技巧！\n   💰 總支出減少 ${state.expenseReduction}%\n   📊 新總支出: ${newTotalExp.toLocaleString()} 元/月\n   📈 每月節省: ${(currentTotalExp - newTotalExp).toLocaleString()} 元/月\n   ⚡ 精力 -1`;
        },
        getEffectDescription: () => "支出減少 10%，精力 -1"
    },

    {
        id: "P05",
        name: "在爭執時報警",
        description: "你報警處理爭執，警方介入！可選擇將另一位玩家向前或向後移動 3 格，該玩家需立即執行該格效果（經過結算日不會有收入）。",
        image: "/cards/police/P05.png",
        type: "police",
        category: "警察卡",
        hasMoveOtherPlayerFeature: true,
        moveSteps: 3,
        effect: (state) => {
            return `👮 警方介入！請選擇要移動的玩家與方向`;
        },
        getEffectDescription: () => "移動另一位玩家 ±3 格，立即執行該格效果"
    },

    {
        id: "P06",
        name: "舉報違法",
        description: "你舉報另一位玩家的違法行為！該玩家被罰款 $5,000。",
        image: "/cards/police/P06.png",
        type: "police",
        category: "警察卡",
        hasFineOtherPlayerFeature: true,
        fineAmount: 5000,
        effect: (state) => {
            return `👮 請選擇要舉報的玩家`;
        },
        getEffectDescription: () => "舉報一位玩家並罰款 $5,000"
    },

    {
        id: "P07",
        name: "忘記交罰款",
        description: "因忙碌忘記繳交交通罰款，被法院強制執行。罰款 $5000，並需暫停一回合處理相關手續。",
        image: "/cards/police/P07.png",
        type: "police",
        category: "警察卡",
        effect: (state) => {
            let message = '';

            if (state.cash >= 5000) {
                state.cash -= 5000;
                message = `💰 忘記交罰款！支付罰款 $5,000 元，剩餘現金 $${state.cash.toLocaleString()} 元。`;
            } else {
                const shortfall = 5000 - state.cash;
                message = `💰 忘記交罰款！現金不足 $${shortfall.toLocaleString()} 元，`;

                if (state.cash > 0) {
                    message += `扣除所有現金 $${state.cash.toLocaleString()} 元，`;
                    state.cash = 0;
                }

                if (shortfall > 0) {
                    state.loanAmount   = (state.loanAmount || 0) + shortfall;
                    state.loanInterest = Math.round(state.loanAmount * 0.01);
                    message += `剩餘 $${shortfall.toLocaleString()} 元轉為貸款（月息 1%）。`;
                }
            }

            state.skipNextTurn = true;
            message += ` ⏸️ 你需要暫停一回合處理相關手續，下一回合無法行動！`;

            return message;
        },
        getEffectDescription: () => "罰款 $5000，暫停一回合"
    },

    {
        id: "P08",
        name: "救人做好市民",
        description: "你見義勇為協助警方破案，獲頒好市民獎！獲得 2 次義工資格。",
        image: "/cards/police/P08.png",
        type: "police",
        category: "警察卡",
        hasGoodCitizenChoiceFeature: true,
        effect: (state) => {
            state.volunteerCount  = (state.volunteerCount  || 0) + 2;
            state.volunteerShield = (state.volunteerShield || 0) + 2;

            return `🏆 救人做好市民！你獲得 2 次義工資格！可用於抵擋騙子卡傷害。當前義工次數：${state.volunteerShield} 次。`;
        },
        getEffectDescription: () => "獲得 2 次義工資格"
    }
];

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { policeCards };
}