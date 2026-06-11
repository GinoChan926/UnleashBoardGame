// lier_cards.js - 骗子卡数据

const lierCards = [
    {
        id: "SC01",
        name: "網上買賣被騙",
        description: "網上買賣被騙，精力-2,金錢$-3,000",
        image: "../cards/lier/SC01.png",
        cost: 0,
        type: "lier",
        category: "骗子卡",
        effect: (state) => {
            const loss = 3000;
            state.cash = Math.max(0, state.cash - loss);
            state.luck = Math.max(0, state.energy - 2);
            return `💸 假冒銀行職員騙取 ${loss.toLocaleString()} 元，精力-2`;
        },
        getEffectDescription: () => "損失 3,000 元，精力-2"
    },
     
    {
        id: "SC02",
        name: "投資加密貨幣平台",
        description: "用手上的現金10%投資,擲骰1次,1-3你損失了該金錢,4-6你僥倖及時提取金錢",
        image: "../cards/lier/SC02.png",
        cost: 0,
        type: "lier",
        category: "骗子卡",
        effect: (state) => {
            // 計算投資金額（現金的10%）
            const investmentPercent = 0.1;
            let investmentAmount = Math.floor(state.cash * investmentPercent);
            
            // 確保最少投資100元（如果現金太少）
            if (investmentAmount < 100 && state.cash >= 100) {
                investmentAmount = 100;
            }
            
            // 如果現金少於100元，無法投資
            if (state.cash < 100) {
                return `💰 現金不足 100 元，無法投資加密貨幣平台`;
            }
            
            // 擲骰決定結果
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            let resultMessage = '';
            let loss = 0;
            
            if (diceRoll <= 3) {
                // 1-3: 損失金錢
                loss = investmentAmount;
                state.cash = Math.max(0, state.cash - loss);
                resultMessage = `🎲 擲出 ${diceRoll} 點！投資失敗，損失 ${loss.toLocaleString()} 元 (現金的 ${investmentPercent * 100}%)`;
            } else {
                // 4-6: 僥倖提取金錢（拿回本金，無損失）
                resultMessage = `🎲 擲出 ${diceRoll} 點！你僥倖及時提取金錢，拿回 ${investmentAmount.toLocaleString()} 元本金，沒有損失！`;
            }
            
            // 額外影響：幸運值微調
            if (diceRoll <= 3) {
                state.luck = Math.max(0, state.luck - 1);
                resultMessage += `，幸運值 -1`;
            } else {
                state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
                resultMessage += `，幸運值 +1`;
            }
            
            return resultMessage;
        },
        getEffectDescription: () => "用現金10%投資,擲骰1-3損失該金錢,4-6僥倖取回"
    },

    {
        id: "SC03",
        name: "網購平台買到次貨",
        description: "網購平台買到次貨，金錢 -1,000,停一回合",
        image: "../cards/lier/SC03.png",
        cost: 0,
        type: "lier",
        category: "骗子卡",
        effect: (state) => {
            const loss = 1000;
            state.cash = Math.max(0, state.cash - loss);
            state.skipNextTurn = true;  // 停一回合
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
        category: "骗子卡",
        effect: (state) => {
            const loss = 30000;
            
            // 检查现金是否足够
            if (state.cash >= loss) {
                state.cash -= loss;
                return `💼 商業詐騙！做生意被走數，損失 ${loss.toLocaleString()} 元`;
            } else {
                // 现金不足，差额转为贷款
                const remaining = loss - state.cash;
                state.cash = 0;
                state.loanAmount += remaining;
                state.loanInterest = Math.round(state.loanAmount * 0.01);
                return `💼 商業詐騙！做生意被走數，損失 ${loss.toLocaleString()} 元 (現金不足，${remaining.toLocaleString()} 元轉為貸款)`;
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
        category: "骗子卡",
        effect: (state) => {
            let message = '';
            
            // 记录当前位置，用于判断是否经过结算日
            const previousPos = state.streamlinePos;
            
            // 后退到逆流层
            state.inFlow = false;
            state.inReverse = true;
            state.reversePos = 0;
            state.streamlinePos = 0;
            
            message = `📧 電郵的假網址！你點擊了假連結，被黑客入侵系統，被迫退回逆流層！\n`;
            message += `   ⚠️ 注意：倒退過程中經過的結算日將不會獲得任何收入！`;
            
            // 精力消耗（处理电脑中毒）
            state.energy = Math.max(0, state.energy - 3);
            message += `\n   ⚡ 處理電腦病毒，精力 -3`;
            
            // 幸运值下降
            state.luck = Math.max(0, state.luck - 2);
            message += `\n   🍀 幸運值 -2`;
            
            return message;
        },
        getEffectDescription: () => "後退到逆流層 (經過月入也沒有收入)，精力 -3,幸運值 -2"
    },

    {
        id: "SC06",
        name: "不明短訊和連接",
        description: "點擊不明短訊中的假連結，後退到逆流層 (經過月入也沒有收入)",
        image: "../cards/lier/SC06.png",
        cost: 0,
        type: "lier",
        category: "骗子卡",
        effect: (state) => {
            let message = '';
            
            // 后退到逆流层
            const wasInFlow = state.inFlow;
            state.inFlow = false;
            state.inReverse = true;
            state.reversePos = 0;
            state.streamlinePos = 0;
            
            message = `📱 不明短訊和連接！你點擊了假連結，被黑客入侵手機系統！\n`;
            
            if (wasInFlow) {
                message += `   🌊 你從順流層被強制退回逆流層！\n`;
            } else {
                message += `   📉 你被拖入逆流層！\n`;
            }
            
            message += `   ⚠️ 倒退過程中經過的結算日將不會獲得任何收入！\n`;
            
            // 精力消耗
            state.energy = Math.max(0, state.energy - 2);
            message += `   ⚡ 處理手機病毒，精力 -2\n`;
            
            // 幸运值下降
            state.luck = Math.max(0, state.luck - 1);
            message += `   🍀 幸運值 -1`;
            
            return message;
        },
        getEffectDescription: () => "後退到逆流層 (經過月入也沒有收入)，精力 -2,幸運值 -1"
    },

    {
        id: "SC07",
        name: "虛擬貨幣騙案",
        description: "先付 $20,000 投資虛擬貨幣,擲骰1次,5-6無事,1-4損失 $20,000",
        image: "../cards/lier/SC07.png",
        cost: 0,
        type: "lier",
        category: "骗子卡",
        effect: (state) => {
            const investment = 20000;
            let message = '';
            
            // 检查现金是否足够支付投资金额
            if (state.cash < investment) {
                return `💰 現金不足 ${investment.toLocaleString()} 元，無法參與此虛擬貨幣投資！`;
            }
            
            // 先扣除投资金额
            state.cash -= investment;
            message = `💰 你支付了 ${investment.toLocaleString()} 元參與虛擬貨幣投資\n`;
            
            // 擲骰決定結果
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            message += `🎲 你擲出 ${diceRoll} 點！\n`;
            
            if (diceRoll >= 5) {
                // 5-6: 無事，拿回本金
                state.cash += investment;
                message += `🍀 幸運！你及時發現是騙局，成功取回 ${investment.toLocaleString()} 元本金，沒有損失！`;
                state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
                message += `，幸運值 +1`;
            } else {
                // 1-4: 損失金錢
                message += `💸 不幸！這是一個騙局，你損失了 ${investment.toLocaleString()} 元！`;
                state.luck = Math.max(0, state.luck - 1);
                message += `，幸運值 -1`;
                
                // 精力消耗（處理報警和後續）
                state.energy = Math.max(0, state.energy - 1);
                message += `，精力 -1`;
            }
            
            return message;
        },
        getEffectDescription: () => "先付 20,000 元,擲骰1-4損失全部,5-6無事取回"
    },

    {
        id: "SC08",
        name: "虛擬貨幣騙局",
        description: "投資虛擬貨幣，結果項目方跑路",
        image: "../cards/lier/SC08.png",
        cost: 0,
        type: "lier",
        category: "骗子卡",
        effect: (state) => {
            const loss = Math.floor(Math.random() * 20000) + 10000;
            state.cash = Math.max(0, state.cash - loss);
            state.luck = Math.max(0, state.luck - 2);
            return `🪙 虛擬貨幣騙局！損失 ${loss.toLocaleString()} 元，幸運值 -2`;
        },
        getEffectDescription: () => "損失 10,000-30,000 元（隨機），幸運值 -2"
    },

    {
        id: "SC08",
        name: "被游說買了大量運動套票",
        description: "健身室倒閉，你損失了一半現金",
        image: "../cards/lier/SC08.png",
        cost: 0,
        type: "lier",
        category: "骗子卡",
        effect: (state) => {
            const loss = Math.floor(state.cash / 2);  // 损失一半现金
            let message = '';
            
            if (state.cash <= 0) {
                return `💪 你沒有現金，無法購買運動套票，僥倖逃過一劫！`;
            }
            
            const originalCash = state.cash;
            state.cash = Math.max(0, state.cash - loss);
            
            message = `💪 你被游說購買了大量運動套票，花費 ${loss.toLocaleString()} 元\n`;
            message += `🏋️ 沒想到健身室突然倒閉！你損失了一半現金！\n`;
            message += `   💰 原有現金: ${originalCash.toLocaleString()} 元\n`;
            message += `   💸 損失金額: ${loss.toLocaleString()} 元\n`;
            message += `   💵 剩餘現金: ${state.cash.toLocaleString()} 元`;
            
            // 精力消耗（處理投訴和後續）
            state.energy = Math.max(0, state.energy - 2);
            message += `\n   ⚡ 精力 -2`;
            
            // 幸运值下降
            state.luck = Math.max(0, state.luck - 1);
            message += `\n   🍀 幸運值 -1`;
            
            return message;
        },
        getEffectDescription: () => "損失一半現金，精力 -2,幸運值 -1"
    }
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { lierCards };
}