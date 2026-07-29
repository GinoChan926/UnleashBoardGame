// investment_cards.js - 項目投資卡数据（顺流层专用）

const investmentCards = [
    {
        id: "K01",
        name: "旅遊集團",
        description: "投資亞太區連鎖旅遊集團，拓展觀光產業版圖，受惠於全球旅遊復甦",
        image: "../cards/investment/K01.png",
        cost: 500,
        type: "investment",
        category: "項目投資",
        investmentCost: 5000000,
        monthlyReturn: 300000,
        energyCost: 3,
        paybackMonths: 17,
        effect: (state) => {
            const cost = 5000000;
            const monthlyIncome = 300000;

            if (state.cash < cost)    return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資旅遊集團`;
            if (state.energy < 3)     return `❌ 精力不足 3 點，無法投資旅遊集團`;

            state.cash          -= cost;
            state.energy        -= 3;
            state.passiveIncome += monthlyIncome;
            state.totalAssets   += cost;

            state.investments = state.investments || [];
            state.investments.push({
                id: "K01", name: "旅遊集團", cost, monthlyReturn: monthlyIncome,
                energyCost: 3, paybackMonths: 17, purchasedAt: Date.now()
            });

            return `✅ 投資旅遊集團成功！投入 ${cost.toLocaleString()} 元，被動收入 +${monthlyIncome.toLocaleString()} 元/月，精力 -3。預計 17 個月回本！`;
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
        category: "項目投資",
        investmentCost: 700000,
        monthlyReturn: 0,
        energyCost: 0,
        energyGain: 30,
        luckGain: 3,
        maxEnergyGain: 5,
        paybackMonths: null,
        effect: (state) => {
            const cost         = 700000;
            const energyGain   = 30;
            const luckGain     = 3;
            const maxEnergyGain = 5;

            if (state.cash < cost) return `❌ 現金不足 ${cost.toLocaleString()} 元，無法參與身心靈健康海外禪修團`;

            state.cash      -= cost;
            state.maxEnergy  = (state.maxEnergy || 100) + maxEnergyGain;
            state.energy     = Math.min(state.maxEnergy, state.energy + energyGain);
            // state.luck       = Math.min(state.maxLuck || 10, state.luck + luckGain);

            state.investments = state.investments || [];
            state.investments.push({
                id: "K02", name: "身心靈健康海外禪修團", cost,
                energyGain, maxEnergyGain,
                purchasedAt: Date.now(), type: "wellness"
            });

            return `🧘 參與身心靈健康海外禪修團成功！\n` +
                `   💰 投入: ${cost.toLocaleString()} 元\n` +
                `   ⚡ 精力 +${energyGain}\n` +
                `   📈 最大精力值 +${maxEnergyGain}\n` +
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
        category: "項目投資",
        investmentCost: 700000,
        energyCost: 0,
        monthlyReturn: 0,
        isAuction: true,
        auctionDetails: {
            basePrice: 700000,
            minBidIncrement: 100000,
            energyReward: 50,
            maxBidders: null
        },
        paybackMonths: null,
        effect: (state, room, currentPlayer, ws, roomId, bidAmount) => {
            return null; // handled by auction logic
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
        category: "項目投資",
        investmentCost: 30000000,
        monthlyReturn: 3000000,
        energyCost: 5,
        paybackMonths: 10,
        effect: (state) => {
            const cost         = 30000000;
            const monthlyIncome = 3000000;

            if (state.cash < cost)    return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資醫學研究所`;
            if (state.energy < 5)     return `❌ 精力不足 5 點，無法投資醫學研究所`;

            state.cash          -= cost;
            state.energy        -= 5;
            state.passiveIncome += monthlyIncome;
            state.totalAssets   += cost;
            // state.luck           = Math.min(state.maxLuck || 10, state.luck + 2);

            state.investments = state.investments || [];
            state.investments.push({
                id: "K04", name: "醫學研究所", cost, monthlyReturn: monthlyIncome,
                energyCost: 5, paybackMonths: 10, purchasedAt: Date.now(), type: "medical"
            });

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
        category: "項目投資",
        investmentCost: 5000000,
        monthlyReturn: 500000,
        energyCost: 3,
        paybackMonths: 10,
        effect: (state) => {
            const cost         = 5000000;
            const monthlyIncome = 500000;

            if (state.cash < cost)    return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資教育集團`;
            if (state.energy < 3)     return `❌ 精力不足 3 點，無法投資教育集團`;

            state.cash          -= cost;
            state.energy        -= 3;
            state.passiveIncome += monthlyIncome;
            state.totalAssets   += cost;
            // state.luck           = Math.min(state.maxLuck || 10, state.luck + 1);

            state.investments = state.investments || [];
            state.investments.push({
                id: "K05", name: "教育集團", cost, monthlyReturn: monthlyIncome,
                energyCost: 3, paybackMonths: 10, purchasedAt: Date.now(), type: "education"
            });

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
        category: "項目投資",
        investmentCost: 5000000,
        monthlyReturn: 400000,
        energyCost: 2,
        paybackMonths: 13,
        effect: (state) => {
            const cost         = 5000000;
            const monthlyIncome = 400000;

            if (state.cash < cost)    return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資文創生活用品連鎖店`;
            if (state.energy < 2)     return `❌ 精力不足 2 點，無法投資文創生活用品連鎖店`;

            state.cash          -= cost;
            state.energy        -= 2;
            state.passiveIncome += monthlyIncome;
            state.totalAssets   += cost;
            // state.luck           = Math.min(state.maxLuck || 10, state.luck + 1);

            state.investments = state.investments || [];
            state.investments.push({
                id: "K06", name: "文創生活用品連鎖店", cost, monthlyReturn: monthlyIncome,
                energyCost: 2, paybackMonths: 13, purchasedAt: Date.now(), type: "lifestyle"
            });

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
        category: "項目投資",
        investmentCost: 1000000,
        monthlyReturn: 60000,
        energyCost: 2,
        healthGain: 20,
        paybackMonths: 17,
        effect: (state) => {
            const cost         = 1000000;
            const monthlyIncome = 60000;
            const healthGain   = 20;

            if (state.cash < cost)    return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資物流集團`;
            if (state.energy < 2)     return `❌ 精力不足 2 點，無法投資物流集團`;

            state.cash          -= cost;
            state.energy        -= 2;
            state.passiveIncome += monthlyIncome;
            state.totalAssets   += cost;
            state.health         = (state.health || 0) + healthGain;
            // state.luck           = Math.min(state.maxLuck || 10, state.luck + 1);

            state.investments = state.investments || [];
            state.investments.push({
                id: "K07", name: "物流集團", cost, monthlyReturn: monthlyIncome,
                energyCost: 2, healthGain, paybackMonths: 17,
                purchasedAt: Date.now(), type: "logistics"
            });

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
        description: "投資網上醫療平台，擲一粒骰，點數=6則得到1千萬，否則損失所有本金。高風險高回報！",
        image: "../cards/investment/K08.png",
        cost: 500,
        type: "investment",
        category: "項目投資",
        investmentCost: 1000000,
        monthlyReturn: 0,
        energyCost: 0,
        isGamble: true,
        gambleDetails: { successNumber: 6, winAmount: 10000000, loseAll: true },
        paybackMonths: null,
        effect: (state) => {
            const cost      = 1000000;
            const winAmount = 10000000;

            if (state.cash < cost) return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資網上醫療平台`;

            state.cash -= cost;

            const diceRoll = Math.floor(Math.random() * 6) + 1;

            state.investments = state.investments || [];
            state.investments.push({
                id: "K08", name: "網上醫療平台", cost,
                win: diceRoll === 6, diceRoll,
                purchasedAt: Date.now(), type: "gamble"
            });

            if (diceRoll === 6) {
                state.cash += winAmount;
                // state.luck  = Math.min(state.maxLuck || 10, state.luck + 2);
                return `🎲 擲出 ${diceRoll} 點！大獎！\n` +
                    `   💰 投入: ${cost.toLocaleString()} 元\n` +
                    `   🎉 獲得: ${winAmount.toLocaleString()} 元\n` +
                    `   📈 淨賺: ${(winAmount - cost).toLocaleString()} 元\n` +
                    `   🍀 幸運值 +2\n` +
                    `   🏥 網上醫療平台投資大成功！`;
            }

            // state.luck = Math.max(0, state.luck - 1);
            return `🎲 擲出 ${diceRoll} 點！失敗！\n` +
                `   💰 損失: ${cost.toLocaleString()} 元\n` +
                `   🍀 幸運值 -1\n` +
                `   😰 網上醫療平台投資失敗，本金全數虧損！`;
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
        category: "項目投資",
        investmentCost: 30000000,
        monthlyReturn: 2000000,
        energyCost: 4,
        healthGain: 20,
        paybackMonths: 15,
        effect: (state) => {
            const cost         = 30000000;
            const monthlyIncome = 2000000;
            const healthGain   = 20;

            if (state.cash < cost)    return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資國際品牌服裝公司`;
            if (state.energy < 4)     return `❌ 精力不足 4 點，無法投資國際品牌服裝公司`;

            state.cash          -= cost;
            state.energy        -= 4;
            state.passiveIncome += monthlyIncome;
            state.totalAssets   += cost;
            state.health         = (state.health || 100) + healthGain;
            // state.luck           = Math.min(state.maxLuck || 10, state.luck + 1);

            state.investments = state.investments || [];
            state.investments.push({
                id: "K09", name: "國際品牌服裝公司", cost, monthlyReturn: monthlyIncome,
                energyCost: 4, healthGain, paybackMonths: 15,
                purchasedAt: Date.now(), type: "fashion"
            });

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
        category: "項目投資",
        investmentCost: 10000000,
        monthlyReturn: 1000000,
        energyCost: 0,
        energyGain: 10,
        luckGain: 1,
        paybackMonths: 10,
        effect: (state) => {
            const cost         = 10000000;
            const monthlyIncome = 1000000;
            const energyGain   = 10;
            const luckGain     = 1;

            if (state.cash < cost) return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資米芝蓮星級餐廳`;

            state.cash          -= cost;
            state.passiveIncome += monthlyIncome;
            state.totalAssets   += cost;
            state.energy         = Math.min(state.maxEnergy, state.energy + energyGain);
            // state.luck           = Math.min(state.maxLuck || 10, state.luck + luckGain);

            state.investments = state.investments || [];
            state.investments.push({
                id: "K10", name: "米芝蓮星級餐廳", cost, monthlyReturn: monthlyIncome,
                energyGain, paybackMonths: 10,
                purchasedAt: Date.now(), type: "dining"
            });

            return `🍽️ 投資米芝蓮星級餐廳成功！\n` +
                `   💰 投入: ${cost.toLocaleString()} 元\n` +
                `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                `   ⚡ 精力: +${energyGain}\n` +
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
        category: "項目投資",
        investmentCost: 40000000,
        monthlyReturn: 0,
        energyCost: 3,
        isGamble: true,
        gambleDetails: { multiplier: 10000000, diceRange: { min: 1, max: 6 } },
        paybackMonths: null,
        effect: (state) => {
            const cost       = 40000000;
            const multiplier = 10000000;

            if (state.cash < cost)    return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資藥業集團`;
            if (state.energy < 3)     return `❌ 精力不足 3 點，無法投資藥業集團`;

            state.cash   -= cost;
            state.energy -= 3;

            const diceRoll  = Math.floor(Math.random() * 6) + 1;
            const winAmount = diceRoll * multiplier;
            const netProfit = winAmount - cost;

            state.cash += winAmount;

            // const luckChange = diceRoll >= 5 ? 2 : diceRoll >= 3 ? 0 : -1;
            // state.luck = Math.min(state.maxLuck || 10, Math.max(0, state.luck + luckChange));

            state.investments = state.investments || [];
            state.investments.push({
                id: "K11", name: "藥業集團", cost, diceRoll, winAmount, netProfit,
                purchasedAt: Date.now(), type: "pharma"
            });

            // const luckStr = `${luckChange >= 0 ? '+' : ''}${luckChange}`;
            const netStr  = `${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}`;

            if (diceRoll >= 5) {
                return `🎲 擲出 ${diceRoll} 點！大成功！\n` +
                    `   💰 投入: ${cost.toLocaleString()} 元\n` +
                    `   🎉 獲得: ${winAmount.toLocaleString()} 元\n` +
                    `   📈 淨賺: ${netStr} 元\n` +
                    `   💊 藥業集團投資大成功！新藥上市帶來巨額回報！`;
            }
            if (diceRoll >= 3) {
                return `🎲 擲出 ${diceRoll} 點！平穩收穫！\n` +
                    `   💰 投入: ${cost.toLocaleString()} 元\n` +
                    `   💰 獲得: ${winAmount.toLocaleString()} 元\n` +
                    `   📈 淨賺: ${netStr} 元\n` +
                    `   💊 藥業集團投資穩定增長，藥物銷售符合預期。`;
            }
            return `🎲 擲出 ${diceRoll} 點！表現不佳！\n` +
                `   💰 投入: ${cost.toLocaleString()} 元\n` +
                `   💰 獲得: ${winAmount.toLocaleString()} 元\n` +
                `   📈 淨賺: ${netStr} 元\n` +
                `   💊 藥業集團投資回報低於預期，市場競爭激烈。`;
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
        category: "項目投資",
        investmentCost: 2000000,
        monthlyReturn: 180000,
        energyCost: 2,
        paybackMonths: 12,
        effect: (state) => {
            const cost         = 2000000;
            const monthlyIncome = 180000;

            if (state.cash < cost)    return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資太陽能發電公司`;
            if (state.energy < 2)     return `❌ 精力不足 2 點，無法投資太陽能發電公司`;

            state.cash          -= cost;
            state.energy        -= 2;
            state.passiveIncome += monthlyIncome;
            state.totalAssets   += cost;
            // state.luck           = Math.min(state.maxLuck || 10, state.luck + 1);

            state.investments = state.investments || [];
            state.investments.push({
                id: "K12", name: "太陽能發電公司", cost, monthlyReturn: monthlyIncome,
                energyCost: 2, paybackMonths: 12,
                purchasedAt: Date.now(), type: "renewable_energy"
            });

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
        category: "項目投資",
        investmentCost: 10000000,
        monthlyReturn: 700000,
        energyCost: 4,
        paybackMonths: 15,
        effect: (state) => {
            const cost         = 10000000;
            const monthlyIncome = 700000;

            if (state.cash < cost)    return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資研發AI軟件`;
            if (state.energy < 4)     return `❌ 精力不足 4 點，無法投資研發AI軟件`;

            state.cash          -= cost;
            state.energy        -= 4;
            state.passiveIncome += monthlyIncome;
            state.totalAssets   += cost;
            state.hasAISkill     = true;
            // state.luck           = Math.min(state.maxLuck || 10, state.luck + 1);

            state.investments = state.investments || [];
            state.investments.push({
                id: "K13", name: "研發AI軟件", cost, monthlyReturn: monthlyIncome,
                energyCost: 4, paybackMonths: 15,
                purchasedAt: Date.now(), type: "ai_technology", hasAISkill: true
            });

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
        category: "項目投資",
        investmentCost: 15000000,
        monthlyReturn: 1000000,
        energyCost: 0,
        energyGain: 10,
        luckGain: 1,
        paybackMonths: 15,
        effect: (state) => {
            const cost         = 15000000;
            const monthlyIncome = 1000000;
            const energyGain   = 10;
            const luckGain     = 1;

            if (state.cash < cost) return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資國際快餐品牌`;

            state.cash          -= cost;
            state.passiveIncome += monthlyIncome;
            state.totalAssets   += cost;
            state.energy         = Math.min(state.maxEnergy, state.energy + energyGain);
            // state.luck           = Math.min(state.maxLuck || 10, state.luck + luckGain);

            state.investments = state.investments || [];
            state.investments.push({
                id: "K14", name: "國際快餐品牌", cost, monthlyReturn: monthlyIncome,
                energyGain, paybackMonths: 15,
                purchasedAt: Date.now(), type: "fastfood"
            });

            return `🍔 投資國際快餐品牌成功！\n` +
                `   💰 投入: ${cost.toLocaleString()} 元\n` +
                `   📈 被動收入: +${monthlyIncome.toLocaleString()} 元/月\n` +
                `   ⚡ 精力: +${energyGain}\n` +
                `   ⏱️ 預計 15 個月回本！\n` +
                `   🌍 全球連鎖快餐品牌，快速成長的餐飲帝國！`;
        },
        getEffectDescription: () => "投資 15,000,000 元，被動收入 +1,000,000/月，精力 +10，幸運值 +1"
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { investmentCards };
}