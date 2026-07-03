// social_cards.js - 貢獻社會卡数据（顺流层社会服务中心专用）

const socialCards = [
    // ==================== CH01: 殘疾人士就業基金 ====================
    {
        id: "CH01",
        name: "殘疾人士就業基金",
        description: "設立此基金，為殘疾人士就業提供補貼及支援，幫助他們融入職場，實現自我價值。你可以為此基金命名！",
        image: "../cards/social/CH01.png",
        cost: 500,
        type: "social",
        category: "貢獻社會",
        investmentCost: 500000,    // 50万
        monthlyReturn: 0,
        energyCost: 2,
        luckGain: 3,
        healthGain: 10,
        extraDice: 1,              // 擲多一個骰子行動
        paybackMonths: null,
        effect: (state) => {
            const cost = 500000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法设立殘疾人士就業基金`;
            }
            
            if (state.energy < 2) {
                return `❌ 精力不足 2 点，无法设立殘疾人士就業基金`;
            }
            
            // 扣除费用
            state.cash -= cost;
            state.energy -= 2;
            
            // 幸运值提升
            state.luck = Math.min(state.maxLuck || 10, state.luck + 3);
            
            // 健康指数提升
            state.health = (state.health || 100) + 10;
            
            // 记录社会服务项目
            state.socialProjects = state.socialProjects || [];
            state.socialProjects.push({
                id: "CH01",
                name: "殘疾人士就業基金",
                cost: cost,
                purchasedAt: Date.now(),
                type: "social"
            });
            
            // 额外功能：擲多一個骰子（标记）
            state.extraDice = (state.extraDice || 0) + 1;
            
            // 记录交易
            addTransactionRecord(
                state.playerName,
                { name: "殘疾人士就業基金", type: "social", id: "CH01" },
                "設立殘疾人士就業基金",
                -cost,
                `設立殘疾人士就業基金！投入 ${cost.toLocaleString()} 元，精力 -2，幸運值 +3，健康指數 +10。獲得額外擲骰機會！`,
                null,
                state
            );
            
            return `♿ 設立殘疾人士就業基金成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -2\n` +
                   `   🍀 幸運值: +3\n` +
                   `   💚 健康指數: +10\n` +
                   `   🎲 獲得額外擲骰機會！\n` +
                   `   ❤️ 為殘疾人士創造公平就業機會！`;
        },
        getEffectDescription: () => "設立基金，幸運值 +3，健康指數 +10，獲得額外擲骰機會"
    },

    // ==================== CH02: 社區圖書館 ====================
    {
        id: "CH02",
        name: "社區圖書館",
        description: "在社區建立免費圖書館，推廣閱讀文化，提升社區教育水平",
        image: "../cards/social/CH02.png",
        cost: 500,
        type: "social",
        category: "貢獻社會",
        investmentCost: 300000,
        monthlyReturn: 15000,
        energyCost: 2,
        luckGain: 2,
        paybackMonths: 20,
        effect: (state) => {
            const cost = 300000;
            const monthlyIncome = 15000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法建立社區圖書館`;
            }
            
            if (state.energy < 2) {
                return `❌ 精力不足 2 点，无法建立社區圖書館`;
            }
            
            state.cash -= cost;
            state.energy -= 2;
            state.passiveIncome += monthlyIncome;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 2);
            
            state.socialProjects = state.socialProjects || [];
            state.socialProjects.push({
                id: "CH02",
                name: "社區圖書館",
                cost: cost,
                monthlyReturn: monthlyIncome,
                purchasedAt: Date.now(),
                type: "social"
            });
            
            addTransactionRecord(
                state.playerName,
                { name: "社區圖書館", type: "social", id: "CH02" },
                "建立社區圖書館",
                -cost,
                `建立社區圖書館！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -2，幸運值 +2！`,
                null,
                state
            );
            
            return `📚 建立社區圖書館成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -2\n` +
                   `   🍀 幸運值: +2\n` +
                   `   📖 推廣閱讀，造福社區！`;
        },
        getEffectDescription: () => "建立社區圖書館，被動收入 +15,000/月，精力 -2，幸運值 +2"
    },

    // ==================== CH04: 長者關懷計劃 ====================
    {
        id: "CH04",
        name: "長者關懷計劃",
        description: "建立長者關懷計劃，為社區長者提供生活支援、健康檢查和陪伴服務",
        image: "../cards/social/CH04.png",
        cost: 500,
        type: "social",
        category: "貢獻社會",
        investmentCost: 400000,
        monthlyReturn: 20000,
        energyCost: 4,
        luckGain: 3,
        paybackMonths: 20,
        effect: (state) => {
            const cost = 400000;
            const monthlyIncome = 20000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法建立長者關懷計劃`;
            }
            
            if (state.energy < 4) {
                return `❌ 精力不足 4 点，无法建立長者關懷計劃`;
            }
            
            state.cash -= cost;
            state.energy -= 4;
            state.passiveIncome += monthlyIncome;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 3);
            
            state.socialProjects = state.socialProjects || [];
            state.socialProjects.push({
                id: "CH04",
                name: "長者關懷計劃",
                cost: cost,
                monthlyReturn: monthlyIncome,
                purchasedAt: Date.now(),
                type: "social"
            });
            
            addTransactionRecord(
                state.playerName,
                { name: "長者關懷計劃", type: "social", id: "CH04" },
                "建立長者關懷計劃",
                -cost,
                `建立長者關懷計劃！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -4，幸運值 +3！`,
                null,
                state
            );
            
            return `👴 建立長者關懷計劃成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -4\n` +
                   `   🍀 幸運值: +3\n` +
                   `   ❤️ 關懷長者，傳遞溫暖！`;
        },
        getEffectDescription: () => "建立長者關懷計劃，被動收入 +20,000/月，精力 -4，幸運值 +3"
    },

    // ==================== CH05: 青年創業導師 ====================
    {
        id: "CH05",
        name: "青年創業導師",
        description: "成為青年創業導師，指導年輕人創業，分享經驗和資源",
        image: "../cards/social/CH05.png",
        cost: 500,
        type: "social",
        category: "貢獻社會",
        investmentCost: 250000,
        monthlyReturn: 25000,
        energyCost: 2,
        luckGain: 2,
        paybackMonths: 10,
        effect: (state) => {
            const cost = 250000;
            const monthlyIncome = 25000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法成为青年創業導師`;
            }
            
            if (state.energy < 2) {
                return `❌ 精力不足 2 点，无法成为青年創業導師`;
            }
            
            state.cash -= cost;
            state.energy -= 2;
            state.passiveIncome += monthlyIncome;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 2);
            
            state.socialProjects = state.socialProjects || [];
            state.socialProjects.push({
                id: "CH05",
                name: "青年創業導師",
                cost: cost,
                monthlyReturn: monthlyIncome,
                purchasedAt: Date.now(),
                type: "social"
            });
            
            addTransactionRecord(
                state.playerName,
                { name: "青年創業導師", type: "social", id: "CH05" },
                "成為青年創業導師",
                -cost,
                `成為青年創業導師！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -2，幸運值 +2！`,
                null,
                state
            );
            
            return `🚀 成為青年創業導師成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -2\n` +
                   `   🍀 幸運值: +2\n` +
                   `   🌟 培育青年，點亮未來！`;
        },
        getEffectDescription: () => "成為青年創業導師，被動收入 +25,000/月，精力 -2，幸運值 +2"
    },

    // ==================== CH07: 社區健康中心 ====================
    {
        id: "CH07",
        name: "社區健康中心",
        description: "建立社區健康中心，提供免費健康檢查、醫療諮詢和健康講座",
        image: "../cards/social/CH07.png",
        cost: 500,
        type: "social",
        category: "貢獻社會",
        investmentCost: 450000,
        monthlyReturn: 22000,
        energyCost: 4,
        healthGain: 20,
        paybackMonths: 20,
        effect: (state) => {
            const cost = 450000;
            const monthlyIncome = 22000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法建立社區健康中心`;
            }
            
            if (state.energy < 4) {
                return `❌ 精力不足 4 点，无法建立社區健康中心`;
            }
            
            state.cash -= cost;
            state.energy -= 4;
            state.passiveIncome += monthlyIncome;
            state.health = (state.health || 100) + 20;
            
            state.socialProjects = state.socialProjects || [];
            state.socialProjects.push({
                id: "CH07",
                name: "社區健康中心",
                cost: cost,
                monthlyReturn: monthlyIncome,
                purchasedAt: Date.now(),
                type: "social"
            });
            
            addTransactionRecord(
                state.playerName,
                { name: "社區健康中心", type: "social", id: "CH07" },
                "建立社區健康中心",
                -cost,
                `建立社區健康中心！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -4，健康指數 +20！`,
                null,
                state
            );
            
            return `🏥 建立社區健康中心成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -4\n` +
                   `   💚 健康指數: +20\n` +
                   `   ❤️ 守護健康，服務社區！`;
        },
        getEffectDescription: () => "建立社區健康中心，被動收入 +22,000/月，精力 -4，健康指數 +20"
    },

    // ==================== CH08: 文化藝術基金 ====================
    {
        id: "CH08",
        name: "文化藝術基金",
        description: "設立文化藝術基金，支持本地藝術家和文化活動，豐富社區文化生活",
        image: "../cards/social/CH08.png",
        cost: 500,
        type: "social",
        category: "貢獻社會",
        investmentCost: 280000,
        monthlyReturn: 12000,
        energyCost: 2,
        luckGain: 2,
        paybackMonths: 23,
        effect: (state) => {
            const cost = 280000;
            const monthlyIncome = 12000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法設立文化藝術基金`;
            }
            
            if (state.energy < 2) {
                return `❌ 精力不足 2 点，无法設立文化藝術基金`;
            }
            
            state.cash -= cost;
            state.energy -= 2;
            state.passiveIncome += monthlyIncome;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 2);
            
            state.socialProjects = state.socialProjects || [];
            state.socialProjects.push({
                id: "CH08",
                name: "文化藝術基金",
                cost: cost,
                monthlyReturn: monthlyIncome,
                purchasedAt: Date.now(),
                type: "social"
            });
            
            addTransactionRecord(
                state.playerName,
                { name: "文化藝術基金", type: "social", id: "CH08" },
                "設立文化藝術基金",
                -cost,
                `設立文化藝術基金！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -2，幸運值 +2！`,
                null,
                state
            );
            
            return `🎨 設立文化藝術基金成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -2\n` +
                   `   🍀 幸運值: +2\n` +
                   `   🖼️ 支持藝術，豐富文化！`;
        },
        getEffectDescription: () => "設立文化藝術基金，被動收入 +12,000/月，精力 -2，幸運值 +2"
    },

];

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { socialCards };
}