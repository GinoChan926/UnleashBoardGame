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
            // 精力恢复
            state.energy = Math.min(state.maxEnergy, state.energy + 4);
            // 获得防骗提醒标记
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
            // 获得防骗护盾（可抵挡一次损失）
            state.fraudShield = (state.fraudShield || 0) + 1;
            
            // 精力恢复
            state.energy = Math.min(state.maxEnergy, state.energy + 1);
            
            // 幸运值提升
            state.luck = Math.min(state.maxLuck, state.luck + 1);
            
            let message = `🛡️ 獲得「防騙通行證」！可抵擋一次騙子卡/加密貨幣/P2P/信用卡有關的損失！\n`;
            message += `   💪 精力 +1,幸運值 +1\n`;
            message += `   📌 使用後此卡會棄到公共區，你可選擇留下或轉讓給其他玩家 (功能開發中)`;
            
            return message;
        },
        getEffectDescription: () => "抵擋一次損失，精力 +1,幸運值 +1"
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
            // 获得志愿者次数（可帮助其他玩家）
            state.volunteerCount = (state.volunteerCount || 0) + 1;
            
            // 获得防骗护盾（用于帮助他人）
            state.volunteerShield = (state.volunteerShield || 0) + 1;
            
            // 精力消耗（做义工）
            state.energy = Math.max(0, state.energy - 1);
            
            // 幸运值提升（善有善报）
            state.luck = Math.min(state.maxLuck, state.luck + 2);
            
            let message = `📚 獲得「防騙教育」義工資格！\n`;
            message += `   👮 下次其他玩家遇到騙子卡/加密貨幣/P2P/信用卡有關損失時，你可以幫助他防範一次！\n`;
            message += `   ⚡ 精力 -1,幸運值 +2\n`;
            message += `   📝 遊戲完結時，此義工行為將被記錄！`;
            
            return message;
        },
        getEffectDescription: () => "幫助其他玩家防範一次損失，精力 -1,幸運值 +2,記錄義工行為"
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
            // 计算当前总支出
            const currentTotalExp = state.livingExpense + state.tax + state.loanInterest + state.childExpense;
            
            // 记录支出减免百分比
            if (!state.expenseReduction) {
                state.expenseReduction = 0;
            }
            state.expenseReduction += 10;  // 增加10%减免
            
            // 应用支出减免到各项支出
            const reductionRate = state.expenseReduction / 100;
            
            // 重新计算各项支出（应用减免）
            const originalLiving = state.livingExpense;
            const originalTax = state.tax;
            const originalLoanInterest = state.loanInterest;
            const originalChildExpense = state.childExpense;
            
            // 注意：这里不减 base 值，只影响显示和月现金流计算
            // 实际扣除时会使用 discount 计算
            
            // 添加法例知识标记
            state.hasLegalKnowledge = true;
            
            // 精力消耗（学习法例需要精力）
            state.energy = Math.max(0, state.energy - 1);
            
            // 幸运值提升
            state.luck = Math.min(state.maxLuck, state.luck + 1);
            
            // 计算新的月现金流
            const newTotalExp = Math.floor(currentTotalExp * (1 - reductionRate));
            const monthlyCF = (state.salary + state.sideIncome + state.passiveIncome) - newTotalExp;
            
            let message = `📚 平常多了解法例！你學會了合法節稅技巧！\n`;
            message += `   💰 總支出減少 ${state.expenseReduction}%\n`;
            message += `   📊 原總支出: ${currentTotalExp.toLocaleString()} 元/月\n`;
            message += `   📊 新總支出: ${newTotalExp.toLocaleString()} 元/月\n`;
            message += `   📈 每月節省: ${(currentTotalExp - newTotalExp).toLocaleString()} 元/月\n`;
            message += `   ⚡ 精力 -1,幸運值 +1\n`;
            message += `   🏛️ 獲得「法例知識」技能！`;
            
            return message;
        },
        getEffectDescription: () => "支出減少 10%，精力 -1,幸運值 +1"
    },

   {
        id: "P05",
        name: "在爭執時報警",
        description: "你報警處理爭執，警方介入！可選擇將另一位玩家向前或向後移動 3 格，該玩家需立即執行該格效果（經過結算日不會有收入）。",
        image: "/cards/cover/P05.png",
        type: "police",
        category: "警察卡",
        effect: (gameState, targetPlayer, direction, room) => {
            // 此卡片需要後端處理，因為涉及移動其他玩家和觸發格子效果
            // 返回特殊標記讓 server 處理
            return {
                type: 'move_other_player',
                targetPlayer: targetPlayer,
                direction: direction,  // 'forward' 或 'backward'
                steps: 3,
                noIncomeOnSettlement: true,
                message: `👮 ${gameState.playerName} 報警處理爭執！你被移動 ${direction === 'forward' ? '向前' : '向後'} 3 格！`
            };
        }
    },

    {
        id: "P06",
        name: "舉報違法",
        description: "你舉報另一位玩家的違法行為！該玩家被罰款 $5,000。",
        image: "/cards/cover/P06.png",
        type: "police",
        category: "警察卡",
        effect: (gameState, targetPlayer) => {
            let message = '';
            
            // 檢查目標玩家現金是否足夠
            if (targetPlayer.cash >= 5000) {
                targetPlayer.cash -= 5000;
                message = `👮 你被舉報違法！罰款 $5,000 元，剩餘現金 $${targetPlayer.cash.toLocaleString()} 元。`;
            } else {
                const shortfall = 5000 - targetPlayer.cash;
                message = `👮 你被舉報違法！現金不足 $${shortfall.toLocaleString()} 元，`;
                
                if (targetPlayer.cash > 0) {
                    message += `扣除所有現金 $${targetPlayer.cash.toLocaleString()} 元，`;
                    targetPlayer.cash = 0;
                }
                
                if (shortfall > 0) {
                    targetPlayer.loanAmount = (targetPlayer.loanAmount || 0) + shortfall;
                    targetPlayer.loanInterest = Math.round(targetPlayer.loanAmount * 0.01);
                    message += `剩餘 $${shortfall.toLocaleString()} 元轉為貸款（月息 1%）。`;
                }
            }
            
            message += ` (舉報者: ${gameState.playerName})`;
            
            return message;
        }
    },

    // 在 police_cards.js 文件中添加以下卡片

    {
        id: "P07",
        name: "忘記交罰款",
        description: "因忙碌忘記繳交交通罰款，被法院強制執行。罰款 $5000，並需暫停一回合處理相關手續。",
        image: "/cards/cover/P07.png",
        type: "police",
        category: "警察卡",
        effect: (gameState) => {
            let message = '';
            
            // 檢查現金是否足夠支付罰款
            if (gameState.cash >= 5000) {
                gameState.cash -= 5000;
                message = `💰 忘記交罰款！支付罰款 $5,000 元，剩餘現金 $${gameState.cash.toLocaleString()} 元。`;
            } else {
                const shortfall = 5000 - gameState.cash;
                message = `💰 忘記交罰款！現金不足 $${shortfall.toLocaleString()} 元，`;
                
                // 如果現金不足，扣除所有現金
                if (gameState.cash > 0) {
                    message += `扣除所有現金 $${gameState.cash.toLocaleString()} 元，`;
                    gameState.cash = 0;
                }
                
                // 剩餘欠款轉為貸款
                if (shortfall > 0) {
                    gameState.loanAmount = (gameState.loanAmount || 0) + shortfall;
                    gameState.loanInterest = Math.round(gameState.loanAmount * 0.01);
                    message += `剩餘 $${shortfall.toLocaleString()} 元轉為貸款（月息 1%）。`;
                }
            }
            
            // 暫停一回合
            gameState.skipNextTurn = true;
            message += ` ⏸️ 你需要暫停一回合處理相關手續，下一回合無法行動！`;
            
            return message;
        }
    },

    // 在 police_cards.js 文件中添加以下卡片

    {
        id: "P08",
        name: "救人做好市民",
        description: "你見義勇為協助警方破案，獲頒好市民獎！可選擇：獲得 2 次義工資格，或抽取 1 張錦囊卡。",
        image: "/cards/cover/P08.png",
        type: "police",
        category: "警察卡",
        effect: (gameState, choice, ws, roomId) => {
            // 注意：這個卡片需要前端彈出選擇框，讓玩家選擇獎勵
            // 如果沒有 choice 參數，返回選項信息供前端顯示
            if (!choice) {
                return {
                    type: 'choice_needed',
                    message: "🏆 救人做好市民！你見義勇為協助警方破案，獲頒好市民獎！\n\n請選擇獎勵：\n1️⃣ 獲得 2 次義工資格\n2️⃣ 抽取 1 張錦囊卡",
                    options: ['volunteer', 'card']
                };
            }
            
            let message = '';
            
            if (choice === 'volunteer') {
                // 獲得 2 次義工資格
                gameState.volunteerCount = (gameState.volunteerCount || 0) + 2;
                gameState.volunteerShield = (gameState.volunteerShield || 0) + 2;
                message = `🏆 救人做好市民！你獲得 2 次義工資格！可用於抵擋騙子卡傷害。當前義工次數：${gameState.volunteerShield} 次。`;
            } else if (choice === 'card') {
                // 抽取 1 張錦囊卡 - 返回特殊標記讓 server 處理
                return {
                    type: 'draw_card',
                    message: "🏆 救人做好市民！你獲得抽取 1 張錦囊卡的機會！"
                };
            } else {
                message = `🏆 救人做好市民！你見義勇為協助警方破案，獲頒好市民獎！`;
            }
            
            return message;
        }
    }

];

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { policeCards };
}