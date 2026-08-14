// dream_cards.js - 夢想卡数据（顺流层专用）

const dreamCards = {
    // 格2: 訂制夢想跑車
    2: {
        id: "D01",
        name: "訂制夢想跑車",
        description: "訂制一輛專屬於你的夢想跑車，享受速度與激情，感受人生巔峰！",
        image: "../cards/dream/D01.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 30000000,   // 3000萬
        energyCost: 50,             // 50精力
        luckGain: 3,
        effect: (state) => {
            const cost = 30000000;
            const energyCost = 50;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法訂制夢想跑車`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法訂制夢想跑車`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.ability = (state.ability || 0) + 1;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 3);
            state.hasDreamCar = true;
            
            return `🏎️ 訂制夢想跑車成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   🎯 能力: +1\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🏎️ 夢想跑車，馳騁人生！`;
        },
        getEffectDescription: () => "花費 20,000,000 元，50精力，能力 +1"
    },

    // 格4: 私人岛屿
    4: {
        id: "D02",
        name: "競投名畫",
        description: "競爭名畫，擁有名畫，享受絕對的寧靜與奢華！",
        image: "../cards/dream/D02.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 40000000,   // 4000万
        luckGain: 4,
        effect: (state) => {
            const cost = 40000000; 
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法購買名畫`;
            }
            
            state.cash -= cost;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 4);
            state.hasFamousPaint = true;
            
            return `🏝️ 購買私人島嶼成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   🌴 私人天堂，與世隔絕的奢華！`;
        },
        getEffectDescription: () => "花費 40,000,000 元"
    },

    // 格6: 環遊世界
     6: {
        id: "D03",
        name: "登頂富士山",
        description: "與摯友一同攀登日本富士山，在日出時分站在山頂，感受「登頂富士山，人生無遺憾」的壯麗時刻！",
        image: "../cards/dream/D03.png",
        cost: 500,
        type: "dream",
        category: "夢想",
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
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法登頂富士山`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法登頂富士山`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.ability = (state.ability || 0) + 1;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + luckGain);
            // state.health = (state.health || 100) + healthGain;
            state.hasClimbedFuji = true;
            
            return `🗻 登頂富士山成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   🎯 能力: +1\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🌅 與摯友在富士山頂看日出，人生無憾！`;
        },
        getEffectDescription: () => "花費 200,000 元，30精力，能力 +1"
    },


    // 格8: 藝術收藏
    8: {
        id: "D04",
        name: "開設媒體平台",
        description: "建立世界級的藝術收藏，擁有畢加索、梵高等大師的傑作，成為藝術界的傳奇！",
        image: "../cards/dream/D04.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 80000000,   // 8000万
        energyCost: 40,
        luckGain: 3,
        effect: (state) => {
            const cost = 80000000;
            const energyCost = 40;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法開設媒體平台`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法開設媒體平台`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 3);
            state.hasMediaPlatform = true;
            
            return `🎨 開設媒體平台成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🖼️ 大師傑作，藝術傳奇！`;
        },
        getEffectDescription: () => "花費 80,000,000 元，40精力"
    },

    // 格10: 太空旅行
    10: {
        id: "D05",
        name: "舉辦大型演唱會",
        description: "舉辦一場盛大的演唱會，邀請國際知名歌手，為粉絲們帶來難忘的音樂體驗！",
        image: "../cards/dream/D05.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 10000000,   // 1000万
        energyCost: 40,
        luckGain: 5,
        effect: (state) => {
            const cost = 10000000;
            const energyCost = 40;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法舉辦大型演唱會`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法舉辦大型演唱會`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.ability = (state.ability || 0) + 1;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 5);
            state.hasHoldConcert = true;
            
            return `🚀 成功舉辦大型演唱會！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   🎯 能力: +1\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🌌 探索宇宙，實現人類千年夢想！`;
        },
        getEffectDescription: () => "花費 10,000,000 元，40精力，能力 +1"
    },

    // 格12: 終極成就
    12: {
        id: "D06",
        name: "極限運動",
        description: "挑戰極限，體驗刺激！",
        image: "../cards/dream/D06.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 2000000,   // 20万
        energyCost: 30,
        effect: (state) => {
            const cost = 200000;
            const energyCost = 30;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法極限運動`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法極限運動`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 6);
            state.hasDoneExtremeSports = true;
            
            return `🏆 達成極限運動！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🌟 名留青史，永垂不朽！`;
        },
        getEffectDescription: () => "花費 200,000 元，30精力"
    },

    // 格16: 慈善基金
    16: {
        id: "D07",
        name: "深海探險",
        description: "研發新的海洋探險技術，探索未知的深海世界！",
        image: "../cards/dream/D07.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 200000000,   // 2000万
        energyCost: 100,
        effect: (state) => {
            const cost = 200000000;
            const energyCost = 100;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法進行深海探險`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法進行深海探險`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 4);
            state.hasDeepWaterExploration = true;

            return `🤝 成功進行深海探險！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n`;
        },
        getEffectDescription: () => "花費 200,000,000 元，100精力"
    },

    // 格18: 開店夢想
    18: {
        id: "D08",
        name: "按自己興趣開店",
        description: "按照自己的興趣和熱情開設一家獨特的商店，實現創業夢想！",
        image: "../cards/dream/D08.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 10000000,   // 1000万
        energyCost: 50,
        effect: (state) => {
            const cost = 10000000;
            const energyCost = 50;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法開店`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法開店`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 3);
            state.hasDreamStore = true;
            
            return `🏰 成功開店！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🌆 極致奢華，俯瞰世界！`;
        },
        getEffectDescription: () => "花費 10,000,000 元，50精力"
    },

    // 格20: 私人遊艇
    20: {
        id: "D09",
        name: "非洲探險",
        description: "踏上非洲大地，探索神秘的野生動物和壯麗的自然風景！",
        image: "../cards/dream/D09.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 2000000,   // 200万
        energyCost: 10,

        effect: (state) => {
            const cost = 2000000;
            const energyCost = 10;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法進行非洲探險`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法進行非洲探險`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.ability = (state.ability || 0) + 1;
            //state.luck = Math.min(state.maxLuck || 10, state.luck + 3);
            state.hasAfricaExploration = true;
            
            return `⛵ 成功進行非洲探險！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   🎯 能力: +1\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🌍 探索世界，體驗不同文化！`;
        },
        getEffectDescription: () => "花費 2,000,000 元，10精力，能力 +1"
    },

    // 格22: 終極夢想
    22: {
        id: "D10",
        name: "購買豪宅",
        description: "購買夢想中的豪宅，享受奢華生活！",
        image: "../cards/dream/D10.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 20000000,   // 2000万
        energyCost: 50,
        effect: (state) => {
            const cost = 20000000;
            const energyCost = 50;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法購買夢想中的豪宅`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法購買夢想中的豪宅`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 7);
            state.hasDreamMansion = true;
            
            return `🌟 購買夢想中的豪宅！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🏆 人生巔峰，成就非凡！`;
        },
        getEffectDescription: () => "花費 20,000,000 元，50精力"
    },

    // 格24: 葡萄酒莊園
    24: {
        id: "D11",
        name: "投資拍電影",
        description: "投資拍攝一部成功的電影，實現你的電影夢想！",
        image: "../cards/dream/D11.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 20000000,   // 2000万
        energyCost: 50,
        effect: (state) => {
            const cost = 20000000;
            const energyCost = 50;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法投資拍電影`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法投資拍電影`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 2);
            state.hasShotMovie = true;
            
            return `🍷 投資拍電影成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🎬 夢想成真，成就非凡！`;
        },
        getEffectDescription: () => "花費 20,000,000 元，50精力"
    },

    // 格26: 私人飛機
    26: {
        id: "D13",
        name: "和股神食飯",
        description: "與股神一起享用美食，學習投資理財的智慧！",
        image: "../cards/dream/D13.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 10000000,   // 1000万
        energyCost: 20,
        effect: (state) => {
            const cost = 10000000;
            const energyCost = 20;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法和股神食飯`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法和股神食飯`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 4);
            state.hasDineWithInvestors = true;

            return `✈️ 和股神食飯成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🛩️ 隨時起飛，暢遊世界！`;
        },
        getEffectDescription: () => "花費 10,000,000 元，20精力"
    },

    // 格28: 財務自由
    28: {
        id: "D14",
        name: "購買私人莊園",
        description: "擁有屬於自己的私人莊園，享受寧靜與安逸的生活！",
        image: "../cards/dream/D13.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 20000000,   // 2000万
        energyCost: 50,
        effect: (state) => {
            const cost = 20000000;
            const energyCost = 50;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法購買私人莊園`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法購買私人莊園`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 5);
            state.hasBoughtManor = true;

            
            return `🏠 購買私人莊園成功！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🏡 安享寧靜與安逸的生活！`;
        },
        getEffectDescription: () => "花費 20,000,000 元，50精力"
    },

    // 格32: 終極成就
    32: {
        id: "D15",
        name: "環遊世界",
        description: "環遊世界，體驗不同文化，留下美好回憶！",
        image: "../cards/dream/D14.png",
        cost: 500,
        type: "dream",
        category: "夢想",
        investmentCost: 2000000,  // 200萬
        energyCost: 30,
        effect: (state) => {
            const cost = 2000000;
            const energyCost = 30;
            
            if (state.cash < cost) {
                return `❌ 現金不足 ${cost.toLocaleString()} 元，無法環遊世界`;
            }
            
            if (state.energy < energyCost) {
                return `❌ 精力不足 ${energyCost} 點，無法環遊世界`;
            }
            
            state.cash -= cost;
            state.energy -= energyCost;
            state.ability = (state.ability || 0) + 1;
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 10);
            state.hasUltimateAchievement = true;
            state.gameCompleted = true;

            
            return `🏆 環遊世界！\n` +
                   `   💰 花費: ${cost.toLocaleString()} 元\n` +
                    `   🎯 能力: +1\n` +
                   `   ⚡ 精力: -${energyCost}\n` +
                   `   🌟 永恆傳奇，人生巔峰！`;
        },
        getEffectDescription: () => "花費 2,000,000 元，30精力，能力 +1"
    }
};

// 获取夢想卡
function getDreamCard(position) {
    return dreamCards[position] || null;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dreamCards, getDreamCard };
}