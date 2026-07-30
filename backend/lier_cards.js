const lierCards = [
    {
        id: "SC01",
        name: "網上買賣被騙",
        description: "網上買賣被騙，精力 -2，金錢 -$3,000",
        image: "../cards/lier/SC01.png",
        cost: 0,
        type: "lier",
        category: "騙子卡",
        effect: (state) => {
            const loss = 3000;
            state.cash   = Math.max(0, state.cash - loss);
            state.energy = Math.max(0, state.energy - 2);  // ✅ Fixed: was state.luck
            return `💸 網上買賣被騙！損失 ${loss.toLocaleString()} 元，精力 -2`;  // ✅ Fixed message
        },
        getEffectDescription: () => "損失 3,000 元，精力 -2"
    },

    {
        id: "SC02",
        name: "投資加密貨幣平台",
        description: "用手上的現金10%投資,擲骰1次,1-3你損失了該金錢,4-6你僥倖及時提取金錢",
        image: "../cards/lier/SC02.png",
        cost: 0,
        type: "lier",
        category: "騙子卡",
        effect: (state) => {
            const investmentPercent = 0.1;
            let investmentAmount = Math.floor(state.cash * investmentPercent);

            if (investmentAmount < 100 && state.cash >= 100) investmentAmount = 100;
            if (state.cash < 100) return `💰 現金不足 100 元，無法投資加密貨幣平台`;

            const diceRoll = Math.floor(Math.random() * 6) + 1;
            let resultMessage = '';

            if (diceRoll <= 3) {
                state.cash = Math.max(0, state.cash - investmentAmount);
                // state.luck = Math.max(0, state.luck - 1);
                resultMessage = `🎲 擲出 ${diceRoll} 點！投資失敗，損失 ${investmentAmount.toLocaleString()} 元 (現金的10%)`;
            } else {
                // state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
                resultMessage = `🎲 擲出 ${diceRoll} 點！僥倖及時提取金錢，拿回 ${investmentAmount.toLocaleString()} 元 (現金的10%)`;
            }

            return resultMessage;
        },
        getEffectDescription: () => "用現金10%投資,擲骰1-3損失該金錢,4-6僥倖取回"
    },

    {
        id: "SC03",
        name: "網購平台買到次貨",
        description: "網購平台買到次貨，金錢 -1,000，停一回合",
        image: "../cards/lier/SC03.png",
        cost: 0,
        type: "lier",
        category: "騙子卡",
        effect: (state) => {
            const loss = 1000;
            state.cash = Math.max(0, state.cash - loss);
            state.skipNextTurn = true;
            return `📦 網購平台買到次貨！損失 ${loss.toLocaleString()} 元，下一回合暫停！`;
        },
        getEffectDescription: () => "損失 1,000 元，停一回合"
    },

    {
        id: "SC04",
        name: "商業詐騙",
        description: "做生意被走數，金錢 -30,000",
        image: "../cards/lier/SC04.png",
        cost: 0,
        type: "lier",
        category: "騙子卡",
        effect: (state) => {
            const loss = 30000;

            if (state.cash >= loss) {
                state.cash -= loss;
                return `💼 商業詐騙！做生意被走數，損失 ${loss.toLocaleString()} 元`;
            } else {
                const remaining = loss - state.cash;
                state.cash = 0;
                state.pendingDebts = state.pendingDebts || [];
                state.pendingDebts.push({
                    id:           `debt_SC04_${Date.now()}`,
                    amount:       remaining,
                    source:       '商業詐騙',
                    creditor:     'bank',
                    creditorName: '銀行',
                    createdAt:    Date.now()
                });
                return `💼 商業詐騙！損失 ${loss.toLocaleString()} 元 (現金不足，$${remaining.toLocaleString()} 待償還)`;
            }
        },
        getEffectDescription: () => "損失 30,000 元"
    },

    {
        id: "SC05",
        name: "電郵的假網址",
        description: "點擊假網址，後退到逆流層 (經過月入也沒有收入)",
        image: "../cards/lier/SC05.png",
        cost: 0,
        type: "lier",
        category: "騙子卡",
        effect: (state) => {
            state.inFlow    = false;
            state.inReverse = true;
            state.reversePos = 0;
            state.energy = Math.max(0, state.energy - 3);
            // state.luck   = Math.max(0, state.luck - 2);

            return `📧 電郵假網址！被黑客入侵，退回逆流層！精力 -3`;
        },
        getEffectDescription: () => "後退到逆流層，精力 -3"
    },

    {
        id: "SC06",
        name: "不明短訊和連接",
        description: "點擊不明短訊中的假連結，後退到逆流層 (經過月入也沒有收入)",
        image: "../cards/lier/SC06.png",
        cost: 0,
        type: "lier",
        category: "騙子卡",
        effect: (state) => {
            state.inFlow    = false;
            state.inReverse = true;
            state.reversePos = 0;
            state.energy = Math.max(0, state.energy - 2);
            // state.luck   = Math.max(0, state.luck - 1);

            return `📱 不明短訊假連結！被黑客入侵手機，退回逆流層！精力 -2`;
        },
        getEffectDescription: () => "後退到逆流層，精力 -2"
    },

    {
        id: "SC07",
        name: "虛擬貨幣騙案",
        description: "先付 $20,000 投資虛擬貨幣，擲骰1次，5-6無事，1-4損失 $20,000",
        image: "../cards/lier/SC07.png",
        cost: 0,
        type: "lier",
        category: "騙子卡",
        effect: (state) => {
            const investment = 20000;

            if (state.cash < investment) {
                return `💰 現金不足 ${investment.toLocaleString()} 元，無法參與虛擬貨幣投資`;
            }

            state.cash -= investment;
            const diceRoll = Math.floor(Math.random() * 6) + 1;

            if (diceRoll >= 5) {
                state.cash += investment;
                // state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
                return `🎲 擲出 ${diceRoll} 點！幸運取回 ${investment.toLocaleString()} 元`;
            } else {
                // state.luck   = Math.max(0, state.luck - 1);
                state.energy = Math.max(0, state.energy - 1);
                return `🎲 擲出 ${diceRoll} 點！騙局！損失 ${investment.toLocaleString()} 元，精力 -1`;
            }
        },
        getEffectDescription: () => "先付 20,000 元，擲骰1-4損失，5-6取回"
    },
    {
        id: "SC08",                    // ✅ Fixed: was duplicate SC08
        name: "被游說買了大量運動套票",
        description: "健身室倒閉，你損失了一半現金",
        image: "../cards/lier/SC08.png",
        cost: 0,
        type: "lier",
        category: "騙子卡",
        effect: (state) => {
            if (state.cash <= 0) {
                return `💪 你沒有現金，僥倖逃過一劫！`;
            }

            const loss = Math.floor(state.cash / 2);
            state.cash   = Math.max(0, state.cash - loss);
            // state.energy = Math.max(0, state.energy - 2);
            // state.luck   = Math.max(0, state.luck - 1);

            return `💪 被游說買運動套票，健身室倒閉！損失 ${loss.toLocaleString()} 元（一半現金）`;
        },
        getEffectDescription: () => "損失一半現金"
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { lierCards };
}