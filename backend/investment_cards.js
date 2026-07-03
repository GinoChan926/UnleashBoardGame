// investment_cards.js - 项目投资卡数据（顺流层专用）

const investmentCards = [
    {
        id: "K01",
        name: "旅遊集團",
        description: "投資亞太區連鎖旅遊集團，拓展觀光產業版圖，受惠於全球旅遊復甦",
        image: "../cards/investment/K01.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 5000000,   // 500万
        monthlyReturn: 300000,      // 30万/月
        energyCost: 3,
        paybackMonths: 17,
        effect: (state) => {
            const cost = 5000000;
            const monthlyIncome = 300000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资旅遊集團`;
            }
            
            if (state.energy < 3) {
                return `❌ 精力不足 3 点，无法投资旅遊集團`;
            }
            
            state.cash -= cost;
            state.energy -= 3;
            state.passiveIncome += monthlyIncome;
            state.totalAssets += cost;
            
            // 记录项目投资
            state.investments = state.investments || [];
            state.investments.push({
                id: "K01",
                name: "旅遊集團",
                cost: cost,
                monthlyReturn: monthlyIncome,
                energyCost: 3,
                paybackMonths: 17,
                purchasedAt: Date.now()
            });
            
            return `✅ 投资旅遊集團成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -3。預計 17 個月回本！`;
        },
        getEffectDescription: () => "投資 5,000,000 元，被動收入 +300,000/月，精力 -3"
    },
    {
        id: "K02",
        name: "身心靈健康海外禪修團",
        description: "你可以選擇參與一個豪華海外禪修團，與其他過著精彩人生的同頻者一起提升靈性修行，身心靈全面升級。",
        image: "../cards/investment/K02.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 700000,    // 70万
        monthlyReturn: 0,           // 無被動收入
        energyCost: 0,              // 無精力消耗
        energyGain: 30,             // 精力 +30
        luckGain: 3,                // 幸運值 +3
        maxEnergyGain: 5,           // 最大精力值 +5
        paybackMonths: null,        // 非財務投資，無回本時間
        effect: (state) => {
            const cost = 700000;
            const energyGain = 30;
            const luckGain = 3;
            const maxEnergyGain = 5;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法参与身心靈健康海外禪修團`;
            }
            
            // 扣除費用
            state.cash -= cost;
            
            // 精力提升
            state.energy = Math.min(state.maxEnergy + maxEnergyGain, state.energy + energyGain);
            
            // 最大精力值提升
            state.maxEnergy = (state.maxEnergy || 100) + maxEnergyGain;
            
            // 幸運值提升
            state.luck = Math.min(state.maxLuck || 10, state.luck + luckGain);
            
            // 記錄投資
            state.investments = state.investments || [];
            state.investments.push({
                id: "K02",
                name: "身心靈健康海外禪修團",
                cost: cost,
                energyGain: energyGain,
                luckGain: luckGain,
                maxEnergyGain: maxEnergyGain,
                purchasedAt: Date.now(),
                type: "wellness"  // 標記為身心健康類型
            });
            
            // 記錄交易
            addTransactionRecord(
                state.playerName,
                { name: "身心靈健康海外禪修團", type: "investment", id: "K02" },
                "參與禪修團",
                -cost,
                `參與身心靈健康海外禪修團！投入 ${cost.toLocaleString()} 元，精力 +${energyGain}，最大精力值 +${maxEnergyGain}，幸運值 +${luckGain}！身心靈全面提升！`,
                null,
                state
            );
            
            return `🧘 參與身心靈健康海外禪修團成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力 +${energyGain}\n` +
                   `   📈 最大精力值 +${maxEnergyGain}\n` +
                   `   🍀 幸運值 +${luckGain}\n` +
                   `   🌟 與同頻者一起提升靈性修行，身心靈全面升級！`;
        },
        getEffectDescription: () => "投資 700,000 元，精力 +30，最大精力值 +5，幸運值 +3"
    },
    {
        id: "K03",
        name: "國際足球隊",
        description: "與所有玩家比賽，競投50點精力！底價70萬，10萬元叫價一次，PASS不能再投！",
        image: "../cards/investment/K03.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 700000,  // 底价70万
        energyCost: 0,
        monthlyReturn: 0,
        isAuction: true,          // 标记为竞拍卡
        auctionDetails: {
            basePrice: 700000,    // 底价70万
            minBidIncrement: 100000, // 每次加价10万
            energyReward: 50,     // 奖励50精力
            maxBidders: null      // 不限人数
        },
        paybackMonths: null,
        effect: (state, room, currentPlayer, ws, roomId, bidAmount) => {
            // 这个卡片的效果由服务器端竞拍逻辑处理
            // 这里只返回竞拍结果
            return null;
        },
        getEffectDescription: () => "競拍：底價70萬，每次加價10萬，贏家獲得50精力"
    },
     {
        id: "K04",
        name: "醫學研究所",
        description: "投資頂尖醫學研究所，專注於癌症治療與基因療法研發，受益於醫療科技突破",
        image: "../cards/investment/K04.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 30000000,   // 3000万
        monthlyReturn: 3000000,      // 300万/月
        energyCost: 5,
        paybackMonths: 10,
        effect: (state) => {
            const cost = 30000000;
            const monthlyIncome = 3000000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资醫學研究所`;
            }
            
            if (state.energy < 5) {
                return `❌ 精力不足 5 点，无法投资醫學研究所`;
            }
            
            state.cash -= cost;
            state.energy -= 5;
            state.passiveIncome += monthlyIncome;
            state.totalAssets += cost;
            
            state.investments = state.investments || [];
            state.investments.push({
                id: "K04",
                name: "醫學研究所",
                cost: cost,
                monthlyReturn: monthlyIncome,
                energyCost: 5,
                paybackMonths: 10,
                purchasedAt: Date.now(),
                type: "medical"
            });
            
            // 額外獎勵：幸運值提升（醫學突破帶來好運）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 2);
            
            addTransactionRecord(
                state.playerName,
                { name: "醫學研究所", type: "investment", id: "K04" },
                "投資醫學研究所",
                -cost,
                `投資醫學研究所成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -5，幸運值 +2。預計 10 個月回本！`,
                null,
                state
            );
            
            return `🔬 投資醫學研究所成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -5\n` +
                   `   🍀 幸運值: +2\n` +
                   `   ⏱️ 預計 10 個月回本！\n` +
                   `   🏥 頂尖醫學研究，造福人類健康！`;
        },
        getEffectDescription: () => "投資 30,000,000 元，被動收入 +3,000,000/月，精力 -5，幸運值 +2"
    },
 {
        id: "K05",
        name: "教育集團",
        description: "投資連鎖教育品牌，涵蓋K12、高等教育及職業培訓，培育未來人才，受惠於終身學習趨勢",
        image: "../cards/investment/K05.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 5000000,    // 500万
        monthlyReturn: 500000,       // 50万/月
        energyCost: 3,
        paybackMonths: 10,
        effect: (state) => {
            const cost = 5000000;
            const monthlyIncome = 500000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资教育集團`;
            }
            
            if (state.energy < 3) {
                return `❌ 精力不足 3 点，无法投资教育集團`;
            }
            
            state.cash -= cost;
            state.energy -= 3;
            state.passiveIncome += monthlyIncome;
            state.totalAssets += cost;
            
            state.investments = state.investments || [];
            state.investments.push({
                id: "K05",
                name: "教育集團",
                cost: cost,
                monthlyReturn: monthlyIncome,
                energyCost: 3,
                paybackMonths: 10,
                purchasedAt: Date.now(),
                type: "education"
            });
            
            // 额外奖励：知识带来智慧，幸运值提升
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            addTransactionRecord(
                state.playerName,
                { name: "教育集團", type: "investment", id: "K05" },
                "投資教育集團",
                -cost,
                `投資教育集團成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -3，幸運值 +1。預計 10 個月回本！`,
                null,
                state
            );
            
            return `📚 投資教育集團成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -3\n` +
                   `   🍀 幸運值: +1\n` +
                   `   ⏱️ 預計 10 個月回本！\n` +
                   `   🎓 培育未來人才，教育改變命運！`;
        },
        getEffectDescription: () => "投資 5,000,000 元，被動收入 +500,000/月，精力 -3，幸運值 +1"
    },
     {
        id: "K06",
        name: "文創生活用品連鎖店",
        description: "投資文創生活用品連鎖品牌，結合設計美學與實用功能，打造質感生活，受惠於消費升級趨勢",
        image: "../cards/investment/K06.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 5000000,    // 500万
        monthlyReturn: 400000,       // 40万/月
        energyCost: 2,
        paybackMonths: 13,
        effect: (state) => {
            const cost = 5000000;
            const monthlyIncome = 400000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资文創生活用品連鎖店`;
            }
            
            if (state.energy < 2) {
                return `❌ 精力不足 2 点，无法投资文創生活用品連鎖店`;
            }
            
            state.cash -= cost;
            state.energy -= 2;
            state.passiveIncome += monthlyIncome;
            state.totalAssets += cost;
            
            state.investments = state.investments || [];
            state.investments.push({
                id: "K06",
                name: "文創生活用品連鎖店",
                cost: cost,
                monthlyReturn: monthlyIncome,
                energyCost: 2,
                paybackMonths: 13,
                purchasedAt: Date.now(),
                type: "lifestyle"
            });
            
            // 额外奖励：美學提升幸運值
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            addTransactionRecord(
                state.playerName,
                { name: "文創生活用品連鎖店", type: "investment", id: "K06" },
                "投資文創生活用品連鎖店",
                -cost,
                `投資文創生活用品連鎖店成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -2，幸運值 +1。預計 13 個月回本！`,
                null,
                state
            );
            
            return `🎨 投資文創生活用品連鎖店成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -2\n` +
                   `   🍀 幸運值: +1\n` +
                   `   ⏱️ 預計 13 個月回本！\n` +
                   `   ✨ 設計美學與實用功能結合，打造質感生活！`;
        },
        getEffectDescription: () => "投資 5,000,000 元，被動收入 +400,000/月，精力 -2，幸運值 +1"
    },
    {
        id: "K07",
        name: "物流集團",
        description: "投資綜合物流集團，提供倉儲、運輸、配送一站式服務，受惠於電商及跨境貿易增長",
        image: "../cards/investment/K07.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 1000000,     // 100万
        monthlyReturn: 60000,         // 6万/月
        energyCost: 2,
        healthGain: 20,              // 健康指數 +20
        paybackMonths: 17,
        effect: (state) => {
            const cost = 1000000;
            const monthlyIncome = 60000;
            const healthGain = 20;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资物流集團`;
            }
            
            if (state.energy < 2) {
                return `❌ 精力不足 2 点，无法投资物流集團`;
            }
            
            state.cash -= cost;
            state.energy -= 2;
            state.passiveIncome += monthlyIncome;
            state.totalAssets += cost;
            
            // 健康指數提升（物流效率帶來生活品質提升）
            state.health = (state.health || 0) + healthGain;
            
            state.investments = state.investments || [];
            state.investments.push({
                id: "K07",
                name: "物流集團",
                cost: cost,
                monthlyReturn: monthlyIncome,
                energyCost: 2,
                healthGain: healthGain,
                paybackMonths: 17,
                purchasedAt: Date.now(),
                type: "logistics"
            });
            
            // 額外獎勵：物流效率提升幸運值
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            addTransactionRecord(
                state.playerName,
                { name: "物流集團", type: "investment", id: "K07" },
                "投資物流集團",
                -cost,
                `投資物流集團成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -2，健康指數 +${healthGain}，幸運值 +1。預計 17 個月回本！`,
                null,
                state
            );
            
            return `🚚 投資物流集團成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -2\n` +
                   `   💚 健康指數: +${healthGain}\n` +
                   `   🍀 幸運值: +1\n` +
                   `   ⏱️ 預計 17 個月回本！\n` +
                   `   📦 一站式物流服務，掌握供應鏈關鍵！`;
        },
        getEffectDescription: () => "投資 1,000,000 元，被動收入 +60,000/月，精力 -2，健康指數 +20，幸運值 +1"
    },
     {
        id: "K08",
        name: "網上醫療平台",
        description: "投資網上醫療平台，擲一粒骰，點數=6則得到1仟萬，否則損失所有本金。高風險高回報！",
        image: "../cards/investment/K08.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 1000000,    // 100万
        monthlyReturn: 0,
        energyCost: 0,
        isGamble: true,             // 标记为赌博型投资
        gambleDetails: {
            successNumber: 6,       // 成功点数
            winAmount: 10000000,    // 赢取金额 1000万
            loseAll: true           // 失败则失去所有本金
        },
        paybackMonths: null,
        effect: (state) => {
            const cost = 1000000;
            const winAmount = 10000000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资網上醫療平台`;
            }
            
            // 擲骰決定結果
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            
            // 先扣除本金
            state.cash -= cost;
            
            let resultMessage = '';
            let win = false;
            
            if (diceRoll === 6) {
                // 成功！获得1000万
                state.cash += winAmount;
                win = true;
                
                // 幸运值提升（好運降臨）
                state.luck = Math.min(state.maxLuck || 10, state.luck + 2);
                
                resultMessage = `🎲 擲出 ${diceRoll} 點！大獎！\n` +
                                `   💰 投入: ${cost.toLocaleString()} 元\n` +
                                `   🎉 獲得: ${winAmount.toLocaleString()} 元\n` +
                                `   📈 淨賺: ${(winAmount - cost).toLocaleString()} 元\n` +
                                `   🍀 幸運值 +2\n` +
                                `   🏥 網上醫療平台投資大成功！`;
                
                addTransactionRecord(
                    state.playerName,
                    { name: "網上醫療平台", type: "investment", id: "K08" },
                    "投資成功（大獎）",
                    winAmount - cost,
                    `網上醫療平台投資成功！擲出 ${diceRoll} 點，獲得 ${winAmount.toLocaleString()} 元！淨賺 ${(winAmount - cost).toLocaleString()} 元，幸運值 +2`,
                    null,
                    state
                );
            } else {
                // 失败，损失所有本金
                state.luck = Math.max(0, state.luck - 1);
                
                resultMessage = `🎲 擲出 ${diceRoll} 點！失敗！\n` +
                                `   💰 損失: ${cost.toLocaleString()} 元\n` +
                                `   🍀 幸運值 -1\n` +
                                `   😰 網上醫療平台投資失敗，本金全數虧損！`;
                
                addTransactionRecord(
                    state.playerName,
                    { name: "網上醫療平台", type: "investment", id: "K08" },
                    "投資失敗",
                    -cost,
                    `網上醫療平台投資失敗！擲出 ${diceRoll} 點，損失 ${cost.toLocaleString()} 元，幸運值 -1`,
                    null,
                    state
                );
            }
            
            // 记录投资（无论成功失败）
            state.investments = state.investments || [];
            state.investments.push({
                id: "K08",
                name: "網上醫療平台",
                cost: cost,
                win: win,
                diceRoll: diceRoll,
                purchasedAt: Date.now(),
                type: "gamble"
            });
            
            return resultMessage;
        },
        getEffectDescription: () => "投資 1,000,000 元，擲骰點數=6得10,000,000元，否則損失所有本金"
    },
   {
        id: "K09",
        name: "國際品牌服裝公司",
        description: "投資國際知名服裝品牌，涵蓋設計、生產、零售全產業鏈，受惠於全球消費市場復甦及品牌溢價",
        image: "../cards/investment/K09.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 30000000,    // 3000万
        monthlyReturn: 2000000,       // 200万/月
        energyCost: 4,
        healthGain: 20,              // 健康指數 +20
        paybackMonths: 15,
        effect: (state) => {
            const cost = 30000000;
            const monthlyIncome = 2000000;
            const healthGain = 20;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资國際品牌服裝公司`;
            }
            
            if (state.energy < 4) {
                return `❌ 精力不足 4 点，无法投资國際品牌服裝公司`;
            }
            
            state.cash -= cost;
            state.energy -= 4;
            state.passiveIncome += monthlyIncome;
            state.totalAssets += cost;
            
            state.health = (state.health || 100) + healthGain;
            
            state.investments = state.investments || [];
            state.investments.push({
                id: "K09",
                name: "國際品牌服裝公司",
                cost: cost,
                monthlyReturn: monthlyIncome,
                energyCost: 4,
                healthGain: healthGain,
                paybackMonths: 15,
                purchasedAt: Date.now(),
                type: "fashion"
            });
            
            // 額外獎勵：時尚品味提升幸運值
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            addTransactionRecord(
                state.playerName,
                { name: "國際品牌服裝公司", type: "investment", id: "K09" },
                "投資國際品牌服裝公司",
                -cost,
                `投資國際品牌服裝公司成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -4，健康指數 +${healthGain}，幸運值 +1。預計 15 個月回本！`,
                null,
                state
            );
            
            return `👔 投資國際品牌服裝公司成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -4\n` +
                   `   💚 健康指數: +${healthGain}\n` +
                   `   🍀 幸運值: +1\n` +
                   `   ⏱️ 預計 15 個月回本！\n` +
                   `   👗 國際時尚品牌，引領潮流趨勢！`;
        },
        getEffectDescription: () => "投資 30,000,000 元，被動收入 +2,000,000/月，精力 -4，健康指數 +20，幸運值 +1"
    },
    {
        id: "K10",
        name: "米芝蓮星級餐廳",
        description: "投資米芝蓮星級餐廳品牌，結合頂級廚藝、精緻用餐體驗與國際餐飲文化，受惠於高端餐飲消費增長",
        image: "../cards/investment/K10.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 10000000,    // 1000万
        monthlyReturn: 1000000,       // 100万/月
        energyCost: 0,               // 無精力消耗
        energyGain: 10,              // 精力 +10（美食帶來好心情）
        luckGain: 1,                // 幸運值 +1
        paybackMonths: 10,
        effect: (state) => {
            const cost = 10000000;
            const monthlyIncome = 1000000;
            const energyGain = 10;
            const luckGain = 1;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资米芝蓮星級餐廳`;
            }
            
            state.cash -= cost;
            state.passiveIncome += monthlyIncome;
            state.totalAssets += cost;
            
            // 精力提升（品嚐美食放鬆心情）
            state.energy = Math.min(state.maxEnergy, state.energy + energyGain);
            
            // 幸運值提升（高級餐飲帶來好運）
            state.luck = Math.min(state.maxLuck || 10, state.luck + luckGain);
            
            state.investments = state.investments || [];
            state.investments.push({
                id: "K10",
                name: "米芝蓮星級餐廳",
                cost: cost,
                monthlyReturn: monthlyIncome,
                energyGain: energyGain,
                luckGain: luckGain,
                paybackMonths: 10,
                purchasedAt: Date.now(),
                type: "dining"
            });
            
            addTransactionRecord(
                state.playerName,
                { name: "米芝蓮星級餐廳", type: "investment", id: "K10" },
                "投資米芝蓮星級餐廳",
                -cost,
                `投資米芝蓮星級餐廳成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 +${energyGain}，幸運值 +${luckGain}。預計 10 個月回本！`,
                null,
                state
            );
            
            return `🍽️ 投資米芝蓮星級餐廳成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: +${energyGain}\n` +
                   `   🍀 幸運值: +${luckGain}\n` +
                   `   ⏱️ 預計 10 個月回本！\n` +
                   `   🌟 頂級廚藝與精緻用餐體驗，品味人生！`;
        },
        getEffectDescription: () => "投資 10,000,000 元，被動收入 +1,000,000/月，精力 +10，幸運值 +1"
    },
     {
        id: "K11",
        name: "藥業集團",
        description: "投資綜合藥業集團，涵蓋藥物研發、生產及分銷，受益於全球醫療需求持續增長及人口老化趨勢。擲一粒骰，點數多少可獲相應點數 × 千萬的現金！",
        image: "../cards/investment/K11.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 40000000,    // 4000万
        monthlyReturn: 0,
        energyCost: 3,
        isGamble: true,
        gambleDetails: {
            multiplier: 10000000,    // 每點 = 1千萬
            diceRange: { min: 1, max: 6 }
        },
        paybackMonths: null,
        effect: (state) => {
            const cost = 40000000;
            const multiplier = 10000000;  // 每點 = 1千萬
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资藥業集團`;
            }
            
            if (state.energy < 3) {
                return `❌ 精力不足 3 点，无法投资藥業集團`;
            }
            
            // 扣除投資金額和精力
            state.cash -= cost;
            state.energy -= 3;
            
            // 擲骰決定結果
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            const winAmount = diceRoll * multiplier;  // 點數 × 1千萬
            
            // 獲得現金
            state.cash += winAmount;
            
            // 計算淨收益
            const netProfit = winAmount - cost;
            
            // 根據骰子點數影響幸運值
            let luckChange = 0;
            if (diceRoll >= 5) {
                luckChange = 2;  // 大成功
            } else if (diceRoll >= 3) {
                luckChange = 0;  // 普通
            } else {
                luckChange = -1; // 小失敗
            }
            state.luck = Math.min(state.maxLuck || 10, Math.max(0, state.luck + luckChange));
            
            state.investments = state.investments || [];
            state.investments.push({
                id: "K11",
                name: "藥業集團",
                cost: cost,
                diceRoll: diceRoll,
                winAmount: winAmount,
                netProfit: netProfit,
                purchasedAt: Date.now(),
                type: "pharma"
            });
            
            // 記錄交易
            addTransactionRecord(
                state.playerName,
                { name: "藥業集團", type: "investment", id: "K11" },
                "投資藥業集團",
                netProfit,
                `投資藥業集團！擲出 ${diceRoll} 點，獲得 ${winAmount.toLocaleString()} 元！淨收益 ${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()} 元，幸運值 ${luckChange >= 0 ? '+' : ''}${luckChange}`,
                null,
                state
            );
            
            // 根據結果返回不同訊息
            let resultMessage = '';
            if (diceRoll >= 5) {
                resultMessage = `🎲 擲出 ${diceRoll} 點！大成功！\n` +
                                `   💰 投入: ${cost.toLocaleString()} 元\n` +
                                `   🎉 獲得: ${winAmount.toLocaleString()} 元\n` +
                                `   📈 淨賺: ${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()} 元\n` +
                                `   🍀 幸運值 ${luckChange >= 0 ? '+' : ''}${luckChange}\n` +
                                `   💊 藥業集團投資大成功！新藥上市帶來巨額回報！`;
            } else if (diceRoll >= 3) {
                resultMessage = `🎲 擲出 ${diceRoll} 點！平穩收穫！\n` +
                                `   💰 投入: ${cost.toLocaleString()} 元\n` +
                                `   💰 獲得: ${winAmount.toLocaleString()} 元\n` +
                                `   📈 淨賺: ${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()} 元\n` +
                                `   🍀 幸運值 ${luckChange >= 0 ? '+' : ''}${luckChange}\n` +
                                `   💊 藥業集團投資穩定增長，藥物銷售符合預期。`;
            } else {
                resultMessage = `🎲 擲出 ${diceRoll} 點！表現不佳！\n` +
                                `   💰 投入: ${cost.toLocaleString()} 元\n` +
                                `   💰 獲得: ${winAmount.toLocaleString()} 元\n` +
                                `   📈 淨賺: ${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()} 元\n` +
                                `   🍀 幸運值 ${luckChange >= 0 ? '+' : ''}${luckChange}\n` +
                                `   💊 藥業集團投資回報低於預期，市場競爭激烈。`;
            }
            
            return resultMessage;
        },
        getEffectDescription: () => "投資 40,000,000 元，擲骰點數 × 10,000,000 元回報，精力 -3"
    },
     {
        id: "K12",
        name: "太陽能發電公司",
        description: "投資太陽能發電公司，專注於太陽能板製造及光伏電站開發，受惠於全球綠色能源轉型及碳中和政策",
        image: "../cards/investment/K12.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 2000000,     // 200万
        monthlyReturn: 180000,        // 18万/月
        energyCost: 2,
        paybackMonths: 12,
        effect: (state) => {
            const cost = 2000000;
            const monthlyIncome = 180000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资太陽能發電公司`;
            }
            
            if (state.energy < 2) {
                return `❌ 精力不足 2 点，无法投资太陽能發電公司`;
            }
            
            state.cash -= cost;
            state.energy -= 2;
            state.passiveIncome += monthlyIncome;
            state.totalAssets += cost;
            
            // 綠色能源投資額外獎勵：幸運值 +1（環保形象加分）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            state.investments = state.investments || [];
            state.investments.push({
                id: "K12",
                name: "太陽能發電公司",
                cost: cost,
                monthlyReturn: monthlyIncome,
                energyCost: 2,
                paybackMonths: 12,
                purchasedAt: Date.now(),
                type: "renewable_energy"
            });
            
            addTransactionRecord(
                state.playerName,
                { name: "太陽能發電公司", type: "investment", id: "K12" },
                "投資太陽能發電公司",
                -cost,
                `投資太陽能發電公司成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -2，幸運值 +1。預計 12 個月回本！`,
                null,
                state
            );
            
            return `☀️ 投資太陽能發電公司成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -2\n` +
                   `   🍀 幸運值: +1\n` +
                   `   ⏱️ 預計 12 個月回本！\n` +
                   `   🌱 綠色能源投資，為地球永續盡一份力！`;
        },
        getEffectDescription: () => "投資 2,000,000 元，被動收入 +180,000/月，精力 -2，幸運值 +1"
    },

      {
        id: "K13",
        name: "研發AI軟件",
        description: "投資人工智能軟件研發公司，專注於機器學習、自然語言處理及電腦視覺技術，受惠於全球AI應用爆發式增長",
        image: "../cards/investment/K13.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 10000000,    // 1000万
        monthlyReturn: 700000,        // 70万/月
        energyCost: 4,
        paybackMonths: 15,
        effect: (state) => {
            const cost = 10000000;
            const monthlyIncome = 700000;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资研發AI軟件`;
            }
            
            if (state.energy < 4) {
                return `❌ 精力不足 4 点，无法投资研發AI軟件`;
            }
            
            state.cash -= cost;
            state.energy -= 4;
            state.passiveIncome += monthlyIncome;
            state.totalAssets += cost;
            
            // AI技術投資額外獎勵：獲得AI技能標記，未來科技相關投資可能有加成
            state.hasAISkill = true;
            
            // 幸運值提升（科技創新帶來好運）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            state.investments = state.investments || [];
            state.investments.push({
                id: "K13",
                name: "研發AI軟件",
                cost: cost,
                monthlyReturn: monthlyIncome,
                energyCost: 4,
                paybackMonths: 15,
                purchasedAt: Date.now(),
                type: "ai_technology",
                hasAISkill: true
            });
            
            addTransactionRecord(
                state.playerName,
                { name: "研發AI軟件", type: "investment", id: "K13" },
                "投資研發AI軟件",
                -cost,
                `投資研發AI軟件成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -4，幸運值 +1。獲得AI技能！預計 15 個月回本！`,
                null,
                state
            );
            
            return `🤖 投資研發AI軟件成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: -4\n` +
                   `   🍀 幸運值: +1\n` +
                   `   ⏱️ 預計 15 個月回本！\n` +
                   `   🧠 人工智能技術，引領未來科技潮流！`;
        },
        getEffectDescription: () => "投資 10,000,000 元，被動收入 +700,000/月，精力 -4，幸運值 +1，獲得AI技能"
    },

    {
        id: "K14",
        name: "國際快餐品牌",
        description: "投資國際知名快餐連鎖品牌，涵蓋全球數千家分店，擁有標準化營運模式及強大供應鏈，受惠於全球速食市場持續增長",
        image: "../cards/investment/K14.png",
        cost: 500,
        type: "investment",
        category: "项目投资",
        investmentCost: 15000000,    // 1500万
        monthlyReturn: 1000000,       // 100万/月
        energyCost: 0,               // 無精力消耗
        energyGain: 10,              // 精力 +10（快餐帶來快樂能量）
        luckGain: 1,                // 幸運值 +1
        paybackMonths: 15,
        effect: (state) => {
            const cost = 15000000;
            const monthlyIncome = 1000000;
            const energyGain = 10;
            const luckGain = 1;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法投资國際快餐品牌`;
            }
            
            state.cash -= cost;
            state.passiveIncome += monthlyIncome;
            state.totalAssets += cost;
            
            // 精力提升（快餐帶來快樂能量）
            state.energy = Math.min(state.maxEnergy, state.energy + energyGain);
            
            // 幸運值提升
            state.luck = Math.min(state.maxLuck || 10, state.luck + luckGain);
            
            state.investments = state.investments || [];
            state.investments.push({
                id: "K14",
                name: "國際快餐品牌",
                cost: cost,
                monthlyReturn: monthlyIncome,
                energyGain: energyGain,
                luckGain: luckGain,
                paybackMonths: 15,
                purchasedAt: Date.now(),
                type: "fastfood"
            });
            
            addTransactionRecord(
                state.playerName,
                { name: "國際快餐品牌", type: "investment", id: "K14" },
                "投資國際快餐品牌",
                -cost,
                `投資國際快餐品牌成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 +${energyGain}，幸運值 +${luckGain}。預計 15 個月回本！`,
                null,
                state
            );
            
            return `🍔 投資國際快餐品牌成功！\n` +
                   `   💰 投入: ${cost.toLocaleString()} 元\n` +
                   `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                   `   ⚡ 精力: +${energyGain}\n` +
                   `   🍀 幸運值: +${luckGain}\n` +
                   `   ⏱️ 預計 15 個月回本！\n` +
                   `   🌍 全球連鎖快餐品牌，快速成長的餐飲帝國！`;
        },
        getEffectDescription: () => "投資 15,000,000 元，被動收入 +1,000,000/月，精力 +10，幸運值 +1"
    },
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { investmentCards };
}