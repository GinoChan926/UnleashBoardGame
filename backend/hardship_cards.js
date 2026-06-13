// hardship_cards.js - 逆境自强卡数据

const hardshipCards = [
    {
        id: "S01",
        name: "健康危機",
        description: "身體出現健康問題，需要醫療開支。\n損失 $5,000 元，精力 -3",
        image: "../cards/hardship/S01.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            const loss = 5000;
            if (state.cash >= loss) {
                state.cash -= loss;
            } else {
                const remaining = loss - state.cash;
                state.cash = 0;
                state.loanAmount = (state.loanAmount || 0) + remaining;
                state.loanInterest = Math.round(state.loanAmount * 0.01);
            }
            state.energy = Math.max(0, state.energy - 3);
            state.luck = Math.max(0, state.luck - 1);
            return `🏥 健康危機！醫療開支 $${loss.toLocaleString()} 元，精力 -3，幸運值 -1`;
        },
        getEffectDescription: () => "損失 $5,000，精力 -3，幸運值 -1"
    },
    {
        id: "S02",
        name: "生意失敗",
        description: "創業項目失敗，損失一半現金！",
        image: "../cards/hardship/S02.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            const loss = Math.floor(state.cash / 2);
            const originalCash = state.cash;
            state.cash = Math.max(0, state.cash - loss);
            state.luck = Math.max(0, state.luck - 2);
            return `💼 生意失敗！損失 ${loss.toLocaleString()} 元 (原有現金 ${originalCash.toLocaleString()} 元的一半)，幸運值 -2`;
        },
        getEffectDescription: () => "損失一半現金，幸運值 -2"
    },
    {
        id: "S03",
        name: "投資失利",
        description: "投資市場波動，投資組合虧損。\n損失 $8,000 元，被動收入 -$1,000/月",
        image: "../cards/hardship/S03.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            const loss = 8000;
            if (state.cash >= loss) {
                state.cash -= loss;
            } else {
                const remaining = loss - state.cash;
                state.cash = 0;
                state.loanAmount = (state.loanAmount || 0) + remaining;
                state.loanInterest = Math.round(state.loanAmount * 0.01);
            }
            state.passiveIncome = Math.max(0, state.passiveIncome - 1000);
            state.luck = Math.max(0, state.luck - 1);
            return `📉 投資失利！損失 $${loss.toLocaleString()} 元，被動收入 -$1,000/月，幸運值 -1`;
        },
        getEffectDescription: () => "損失 $8,000，被動收入 -$1,000/月，幸運值 -1"
    },
    {
        id: "S04",
        name: "家庭變故",
        description: "家庭突發事件，需要額外開支。\n損失 $6,000 元，精力 -2",
        image: "../cards/hardship/S04.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            const loss = 6000;
            if (state.cash >= loss) {
                state.cash -= loss;
            } else {
                const remaining = loss - state.cash;
                state.cash = 0;
                state.loanAmount = (state.loanAmount || 0) + remaining;
                state.loanInterest = Math.round(state.loanAmount * 0.01);
            }
            state.energy = Math.max(0, state.energy - 2);
            return `🏠 家庭變故！損失 $${loss.toLocaleString()} 元，精力 -2`;
        },
        getEffectDescription: () => "損失 $6,000，精力 -2"
    },
    {
        id: "S05",
        name: "裁員危機",
        description: "公司裁員，你失去了工作。\n月薪歸零，精力 +4（獲得時間進修）",
        image: "../cards/hardship/S05.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            state.salary = 0;
            state.energy = Math.min(state.maxEnergy, state.energy + 4);
            state.luck = Math.max(0, state.luck - 1);
            return `⚠️ 裁員危機！月薪歸零，精力 +4，幸運值 -1`;
        },
        getEffectDescription: () => "月薪歸零，精力 +4，幸運值 -1"
    },
    {
        id: "S06",
        name: "朋友借貸",
        description: "朋友急需用錢，向你借貸。\n損失 $4,000 元，幸運值 +1（善有善報）",
        image: "../cards/hardship/S06.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            const loss = 4000;
            if (state.cash >= loss) {
                state.cash -= loss;
            } else {
                const remaining = loss - state.cash;
                state.cash = 0;
                state.loanAmount = (state.loanAmount || 0) + remaining;
                state.loanInterest = Math.round(state.loanAmount * 0.01);
            }
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            return `🤝 朋友借貸！損失 $${loss.toLocaleString()} 元，幸運值 +1（善有善報）`;
        },
        getEffectDescription: () => "損失 $4,000，幸運值 +1"
    },
    {
        id: "S07",
        name: "意外事故",
        description: "發生意外事故，需要賠償。\n損失 $10,000 元，精力 -4",
        image: "../cards/hardship/S07.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            const loss = 10000;
            if (state.cash >= loss) {
                state.cash -= loss;
            } else {
                const remaining = loss - state.cash;
                state.cash = 0;
                state.loanAmount = (state.loanAmount || 0) + remaining;
                state.loanInterest = Math.round(state.loanAmount * 0.01);
            }
            state.energy = Math.max(0, state.energy - 4);
            state.luck = Math.max(0, state.luck - 2);
            return `🚗 意外事故！損失 $${loss.toLocaleString()} 元，精力 -4，幸運值 -2`;
        },
        getEffectDescription: () => "損失 $10,000，精力 -4，幸運值 -2"
    },
    {
        id: "S08",
        name: "法律糾紛",
        description: "捲入法律糾紛，需要律師費用。\n損失 $7,000 元，精力 -2",
        image: "../cards/hardship/S08.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            const loss = 7000;
            if (state.cash >= loss) {
                state.cash -= loss;
            } else {
                const remaining = loss - state.cash;
                state.cash = 0;
                state.loanAmount = (state.loanAmount || 0) + remaining;
                state.loanInterest = Math.round(state.loanAmount * 0.01);
            }
            state.energy = Math.max(0, state.energy - 2);
            return `⚖️ 法律糾紛！損失 $${loss.toLocaleString()} 元，精力 -2`;
        },
        getEffectDescription: () => "損失 $7,000，精力 -2"
    },
    {
        id: "S09",
        name: "詐騙陷阱",
        description: "誤信詐騙集團，損失金錢。\n損失 $5,000 元，精力 -2，幸運值 -2",
        image: "../cards/hardship/S09.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            const loss = 5000;
            if (state.cash >= loss) {
                state.cash -= loss;
            } else {
                const remaining = loss - state.cash;
                state.cash = 0;
                state.loanAmount = (state.loanAmount || 0) + remaining;
                state.loanInterest = Math.round(state.loanAmount * 0.01);
            }
            state.energy = Math.max(0, state.energy - 2);
            state.luck = Math.max(0, state.luck - 2);
            return `🎭 詐騙陷阱！損失 $${loss.toLocaleString()} 元，精力 -2，幸運值 -2`;
        },
        getEffectDescription: () => "損失 $5,000，精力 -2，幸運值 -2"
    },
    {
        id: "S10",
        name: "天災影響",
        description: "自然災害影響，財產損失。\n損失 $8,000 元，精力 -3",
        image: "../cards/hardship/S10.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            const loss = 8000;
            if (state.cash >= loss) {
                state.cash -= loss;
            } else {
                const remaining = loss - state.cash;
                state.cash = 0;
                state.loanAmount = (state.loanAmount || 0) + remaining;
                state.loanInterest = Math.round(state.loanAmount * 0.01);
            }
            state.energy = Math.max(0, state.energy - 3);
            return `🌪️ 天災影響！損失 $${loss.toLocaleString()} 元，精力 -3`;
        },
        getEffectDescription: () => "損失 $8,000，精力 -3"
    },
    {
        id: "S11",
        name: "信用破產",
        description: "信用評級下降，貸款利率上升。\n貸款利率永久 +5%，損失 $3,000 元",
        image: "../cards/hardship/S11.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            const loss = 3000;
            if (state.cash >= loss) {
                state.cash -= loss;
            } else {
                const remaining = loss - state.cash;
                state.cash = 0;
                state.loanAmount = (state.loanAmount || 0) + remaining;
                state.loanInterest = Math.round(state.loanAmount * 0.01);
            }
            // 贷款利率永久增加5%
            const currentRate = state.permanentLoanRate || 10;
            state.permanentLoanRate = currentRate + 5;
            state.luck = Math.max(0, state.luck - 1);
            return `💳 信用破產！損失 $${loss.toLocaleString()} 元，貸款利率永久 +5%，幸運值 -1`;
        },
        getEffectDescription: () => "損失 $3,000，貸款利率永久 +5%，幸運值 -1"
    },
    {
        id: "S12",
        name: "疫情衝擊",
        description: "疫情影響生意，收入減少。\n副業收入 -$2,000/月，精力 -2",
        image: "../cards/hardship/S12.png",
        cost: 0,
        type: "hardship",
        category: "逆境自强卡",
        effect: (state) => {
            state.sideIncome = Math.max(0, state.sideIncome - 2000);
            state.energy = Math.max(0, state.energy - 2);
            state.luck = Math.max(0, state.luck - 1);
            return `🦠 疫情衝擊！副業收入 -$2,000/月，精力 -2，幸運值 -1`;
        },
        getEffectDescription: () => "副業收入 -$2,000/月，精力 -2，幸運值 -1"
    }
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hardshipCards };
}