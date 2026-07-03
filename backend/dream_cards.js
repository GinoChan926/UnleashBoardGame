// dream_cards.js - 梦想卡数据（顺流层专用）

const dreamCards = {
    // 格2: 訂制夢想跑車
    2: {
        id: "D01",
        name: "訂制夢想跑車",
        description: "訂制一輛專屬於你的夢想跑車，享受速度與激情，感受人生巔峰！",
        image: "../cards/dream/D01.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 20000000,   // 2000万
        energyCost: 50,             // 50精力
        luckGain: 3,
        effect: (state) => {
            const cost = 20000000;
            const energyCost = 50;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法訂制夢想跑車`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法訂制夢想跑車`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 3);
            state.hasDreamCar = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "訂制夢想跑車", type: "dream", id: "D01" },
                "實現夢想",
                -cost,
                `實現夢想跑車！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +3！`,
                null,
                state
            );
            
            return `🏎️ 訂制夢想跑車成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +3\n` +
                   `   🏎️ 夢想跑車，馳騁人生！`;
        },
        getEffectDescription: () => "花費 20,000,000 元，50精力，幸運值 +3"
    },

    // 格4: 私人岛屿
    4: {
        id: "D02",
        name: "競爭名畫",
        description: "競爭名畫，擁有名畫，享受絕對的寧靜與奢華！",
        image: "../cards/dream/D02.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 40000000,   // 3000万
        luckGain: 4,
        effect: (state) => {
            const cost = 40000000; 
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法購買名畫`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 4);
            state.hasPrivateIsland = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "名畫", type: "dream", id: "D02" },
                "實現夢想",
                -cost,
                `購買名畫！花費 ${cost.toLocaleString()} 元,幸運值 +4！`,
                null,
                state
            );
            
            return `🏝️ 購買私人島嶼成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   🍀 幸運值: +4\n` +
                   `   🌴 私人天堂，與世隔絕的奢華！`;
        },
        getEffectDescription: () => "花費 40,000,000 元，幸運值 +4"
    },

    // 格6: 環遊世界
     6: {
        id: "D03",
        name: "和朋友登頂富士山",
        description: "與摯友一同攀登日本富士山，在日出時分站在山頂，感受「登頂富士山，人生無遺憾」的壯麗時刻！",
        image: "../cards/dream/D03.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 200000,      // 20万
        energyCost: 30,              // 30精力
        luckGain: 2,
        healthGain: 10,
        effect: (state) => {
            const cost = 200000;
            const energyCost = 30;
            const luckGain = 2;
            const healthGain = 10;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法登頂富士山`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法登頂富士山`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + luckGain);
            state.health = (state.health || 100) + healthGain;
            state.hasClimbedFuji = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "和朋友登頂富士山", type: "dream", id: "D03" },
                "實現夢想",
                -cost,
                `登頂富士山！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +${luckGain}，健康指數 +${healthGain}！`,
                null,
                state
            );
            
            return `🗻 登頂富士山成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +${luckGain}\n` +
                   `   💚 健康指數: +${healthGain}\n` +
                   `   🌅 與摯友在富士山頂看日出，人生無憾！`;
        },
        getEffectDescription: () => "花費 200,000 元，30精力，幸運值 +2，健康指數 +10"
    },


    // 格8: 藝術收藏
    8: {
        id: "D04",
        name: "藝術收藏",
        description: "建立世界級的藝術收藏，擁有畢加索、梵高等大師的傑作，成為藝術界的傳奇！",
        image: "../cards/dream/D04.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 25000000,   // 2500万
        energyCost: 35,
        luckGain: 3,
        effect: (state) => {
            const cost = 25000000;
            const energyCost = 35;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法建立藝術收藏`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法建立藝術收藏`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 3);
            state.hasArtCollection = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "藝術收藏", type: "dream", id: "D04" },
                "實現夢想",
                -cost,
                `建立藝術收藏！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +3！`,
                null,
                state
            );
            
            return `🎨 建立藝術收藏成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +3\n` +
                   `   🖼️ 大師傑作，藝術傳奇！`;
        },
        getEffectDescription: () => "花費 25,000,000 元，35精力，幸運值 +3"
    },

    // 格10: 太空旅行
    10: {
        id: "D05",
        name: "太空旅行",
        description: "乘坐商業太空船前往太空，體驗失重狀態，從太空俯瞰地球，實現人類千年的夢想！",
        image: "../cards/dream/D05.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 40000000,   // 4000万
        energyCost: 60,
        luckGain: 5,
        effect: (state) => {
            const cost = 40000000;
            const energyCost = 60;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法進行太空旅行`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法進行太空旅行`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 5);
            state.hasSpaceTravel = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "太空旅行", type: "dream", id: "D05" },
                "實現夢想",
                -cost,
                `太空旅行！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +5！`,
                null,
                state
            );
            
            return `🚀 太空旅行成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +5\n` +
                   `   🌌 探索宇宙，實現人類千年夢想！`;
        },
        getEffectDescription: () => "花費 40,000,000 元，60精力，幸運值 +5"
    },

    // 格12: 終極成就
    12: {
        id: "D06",
        name: "終極成就",
        description: "達成人生終極成就，獲得諾貝爾獎或奧斯卡等最高榮譽，名留青史！",
        image: "../cards/dream/D06.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 50000000,   // 5000万
        energyCost: 70,
        luckGain: 6,
        effect: (state) => {
            const cost = 50000000;
            const energyCost = 70;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法達成終極成就`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法達成終極成就`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 6);
            state.hasUltimateAchievement = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "終極成就", type: "dream", id: "D06" },
                "實現夢想",
                -cost,
                `達成終極成就！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +6！`,
                null,
                state
            );
            
            return `🏆 達成終極成就！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +6\n` +
                   `   🌟 名留青史，永垂不朽！`;
        },
        getEffectDescription: () => "花費 50,000,000 元，70精力，幸運值 +6"
    },

    // 格16: 慈善基金
    16: {
        id: "D07",
        name: "慈善基金",
        description: "成立自己的慈善基金會，幫助全球需要幫助的人，改變世界！",
        image: "../cards/dream/D07.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 20000000,   // 2000万
        energyCost: 25,
        luckGain: 4,
        effect: (state) => {
            const cost = 20000000;
            const energyCost = 25;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法成立慈善基金`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法成立慈善基金`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 4);
            state.hasCharityFoundation = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "慈善基金", type: "dream", id: "D07" },
                "實現夢想",
                -cost,
                `成立慈善基金！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +4！`,
                null,
                state
            );
            
            return `🤝 成立慈善基金成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +4\n` +
                   `   ❤️ 改變世界，傳遞愛心！`;
        },
        getEffectDescription: () => "花費 20,000,000 元，25精力，幸運值 +4"
    },

    // 格18: 豪宅夢想
    18: {
        id: "D08",
        name: "豪宅夢想",
        description: "購買世界頂級豪宅，俯瞰城市全景，享受極致奢華生活！",
        image: "../cards/dream/D08.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 35000000,   // 3500万
        energyCost: 30,
        luckGain: 3,
        effect: (state) => {
            const cost = 35000000;
            const energyCost = 30;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法購買豪宅`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法購買豪宅`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 3);
            state.hasDreamMansion = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "豪宅夢想", type: "dream", id: "D08" },
                "實現夢想",
                -cost,
                `購買豪宅！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +3！`,
                null,
                state
            );
            
            return `🏰 購買豪宅成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +3\n` +
                   `   🌆 極致奢華，俯瞰世界！`;
        },
        getEffectDescription: () => "花費 35,000,000 元，30精力，幸運值 +3"
    },

    // 格20: 私人遊艇
    20: {
        id: "D09",
        name: "私人遊艇",
        description: "購買豪華私人遊艇，暢遊海洋，享受自由與奢華的航海生活！",
        image: "../cards/dream/D09.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 28000000,   // 2800万
        energyCost: 35,
        luckGain: 3,
        effect: (state) => {
            const cost = 28000000;
            const energyCost = 35;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法購買私人遊艇`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法購買私人遊艇`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 3);
            state.hasYacht = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "私人遊艇", type: "dream", id: "D09" },
                "實現夢想",
                -cost,
                `購買私人遊艇！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +3！`,
                null,
                state
            );
            
            return `⛵ 購買私人遊艇成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +3\n` +
                   `   🌊 暢遊海洋，自由航行！`;
        },
        getEffectDescription: () => "花費 28,000,000 元，35精力，幸運值 +3"
    },

    // 格22: 終極夢想
    22: {
        id: "D10",
        name: "終極夢想",
        description: "實現你心中最偉大的終極夢想，無論是改變世界還是成就非凡，在此一刻達成！",
        image: "../cards/dream/D10.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 60000000,   // 6000万
        energyCost: 80,
        luckGain: 7,
        effect: (state) => {
            const cost = 60000000;
            const energyCost = 80;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法實現終極夢想`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法實現終極夢想`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 7);
            state.hasUltimateDream = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "終極夢想", type: "dream", id: "D10" },
                "實現夢想",
                -cost,
                `實現終極夢想！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +7！`,
                null,
                state
            );
            
            return `🌟 實現終極夢想！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +7\n` +
                   `   🏆 人生巔峰，成就非凡！`;
        },
        getEffectDescription: () => "花費 60,000,000 元，80精力，幸運值 +7"
    },

    // 格24: 葡萄酒莊園
    24: {
        id: "D11",
        name: "葡萄酒莊園",
        description: "購買法國頂級葡萄酒莊園，釀造屬於自己的年份佳釀，享受優雅人生！",
        image: "../cards/dream/D11.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 22000000,   // 2200万
        energyCost: 25,
        luckGain: 2,
        effect: (state) => {
            const cost = 22000000;
            const energyCost = 25;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法購買葡萄酒莊園`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法購買葡萄酒莊園`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 2);
            state.hasVineyard = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "葡萄酒莊園", type: "dream", id: "D11" },
                "實現夢想",
                -cost,
                `購買葡萄酒莊園！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +2！`,
                null,
                state
            );
            
            return `🍷 購買葡萄酒莊園成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +2\n` +
                   `   🍇 頂級佳釀，優雅人生！`;
        },
        getEffectDescription: () => "花費 22,000,000 元，25精力，幸運值 +2"
    },

    // 格26: 私人飛機
    26: {
        id: "D12",
        name: "私人飛機",
        description: "購買灣流或龐巴迪私人飛機，隨時隨地飛往世界任何角落，享受極致便利與奢華！",
        image: "../cards/dream/D12.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 45000000,   // 4500万
        energyCost: 45,
        luckGain: 4,
        effect: (state) => {
            const cost = 45000000;
            const energyCost = 45;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法購買私人飛機`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法購買私人飛機`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 4);
            state.hasPrivateJet = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "私人飛機", type: "dream", id: "D12" },
                "實現夢想",
                -cost,
                `購買私人飛機！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +4！`,
                null,
                state
            );
            
            return `✈️ 購買私人飛機成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +4\n` +
                   `   🛩️ 隨時起飛，暢遊世界！`;
        },
        getEffectDescription: () => "花費 45,000,000 元，45精力，幸運值 +4"
    },

    // 格28: 財務自由
    28: {
        id: "D13",
        name: "財務自由",
        description: "達成真正的財務自由，被動收入完全覆蓋所有開支，從此不再為金錢煩惱！",
        image: "../cards/dream/D13.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 30000000,   // 3000万
        energyCost: 20,
        luckGain: 5,
        effect: (state) => {
            const cost = 30000000;
            const energyCost = 20;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法達成財務自由`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法達成財務自由`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 5);
            state.hasFinancialFreedom = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "財務自由", type: "dream", id: "D13" },
                "實現夢想",
                -cost,
                `達成財務自由！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +5！`,
                null,
                state
            );
            
            return `💰 達成財務自由！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +5\n` +
                   `   🏦 不再為金錢煩惱，真正自由！`;
        },
        getEffectDescription: () => "花費 30,000,000 元，20精力，幸運值 +5"
    },

    // 格32: 終極成就
    32: {
        id: "D14",
        name: "終極成就",
        description: "達成人生終極成就，留下永恆傳奇！這是順流層的終點，實現所有夢想的頂峰！",
        image: "../cards/dream/D14.png",
        cost: 500,
        type: "dream",
        category: "梦想",
        investmentCost: 100000000,  // 1亿
        energyCost: 100,
        luckGain: 10,
        effect: (state) => {
            const cost = 100000000;
            const energyCost = 100;
            
            if (state.cash < cost) {
                return `❌ 现金不足 ${cost.toLocaleString()} 元，无法達成終極成就`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 点，无法達成終極成就`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.luck = Math.min(state.maxLuck || 10, state.luck + 10);
            state.hasUltimateAchievement = true;
            state.gameCompleted = true;
            
            addTransactionRecord(
                state.playerName,
                { name: "終極成就", type: "dream", id: "D14" },
                "實現夢想",
                -cost,
                `達成終極成就！花費 ${cost.toLocaleString()} 元，精力 -${energyCost}，幸運值 +10！遊戲完成！`,
                null,
                state
            );
            
            return `🏆 達成終極成就！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🍀 幸運值: +10\n` +
                   `   🌟 永恆傳奇，人生巔峰！\n` +
                   `   🎉 恭喜完成遊戲！`;
        },
        getEffectDescription: () => "花費 100,000,000 元，100精力，幸運值 +10，遊戲完成！"
    }
};

// 获取梦想卡
function getDreamCard(position) {
    return dreamCards[position] || null;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dreamCards, getDreamCard };
}