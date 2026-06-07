// chance_cards.js - 修复版

// 兼职类机会卡 (Part Time)
const partTimeCards = [
    {
        id: "Z01",
        name: "短片制作",
        description: "制作短片,成為KOL",
        image: "../cards/part_time/video_edit.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 6000;
            state.energy = Math.max(0, state.energy - 3);
            state.businessCostDiscount = 10;
            state.hasEditSkill = true;
            state.hasBusinessDiscount = true;
            return "网店开张！副业收入增加 6000 元，精力消耗 3 点,获得「短片制作」专业知识！未来任何生意营运成本将永久减少 10%";
        }
    },
    {
        id: "Z02",
        name: "在社區藥房工作",
        description: "預防疾病，救助生命",
        image: "../cards/part_time/pharmacies.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 4000;
            state.energy = Math.max(0, state.energy - 4);
            return "副业收入增加 4000 元，精力消耗 4 点";
        }
    },
    {
        id: "Z03",
        name: "WEB3公司員工",
        description: "利用加密貨幣與NFT將數據與數位資產的所有權交還給使用者",
        image: "../cards/part_time/web3.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 4000;
            state.energy = Math.max(0, state.energy - 4);
            return "副业收入增加 4000 元，精力消耗 4 点";
        }
    },
    {
        id: "Z04",
        name: "海外代購",
        description: "利用空闲时间做海外代購生意,需要投资10000元建立代購渠道",
        image: "../cards/part_time/oversea_purchase.png",
        cost: 500,
        investmentCost: 10000,
        effect: (state) => {
            if (state.cash >= 10000) {
                state.cash -= 10000;
                state.sideIncome += 5000;
                state.energy = Math.max(0, state.energy - 3);
                return `✅ 投资 10000 元建立代購渠道成功！副业收入增加 5000 元，精力消耗 3 点`;
            } else {
                return `❌ 现金不足 10000 元，无法投资建立代購渠道，已支付的 500 元无法退还`;
            }
        }
    },
    {
        id: "Z05",
        name: "專車司機",
        description: "私人/企業專車/商務/旅遊包車",
        image: "../cards/part_time/driver.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 6000;
            state.energy = Math.max(0, state.energy - 6);
            return "副业收入增加 6000 元，精力消耗 6 点";
        }
    },
    {
        id: "Z06",
        name: "活動司儀",
        description: "專業司儀從不金盤洗手，只會金盤浪口，體面地棟篤笑，獲得人脈資源，未來副業收入+20%",
        image: "../cards/part_time/ceremonies.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 3500;
            state.energy = Math.max(0, state.energy - 3);
            if (!state.hasHostSkill) {
                state.sideIncomeBonus = 0.2;
                state.hasHostSkill = true;
                state.hostSkillActive = true;
                return `活動司儀工作成功！副业收入增加 3500 元，精力消耗 3 点。获得「人脈資源」被动技能！未来所有副业收入将永久增加 20%`;
            } else {
                return `活動司儀工作成功！副业收入增加 3500 元，精力消耗 3 点。（你已拥有人脈資源技能，效果不叠加）`;
            }
        }
    },
    {
        id: "Z07",
        name: "翻译",
        description: "承接文件翻译工作",
        image: "../cards/part_time/translation.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 2000;
            state.energy = Math.max(0, state.energy - 3);
            state.fourLeafClover = (state.fourLeafClover || 0) + 2;
            return "翻译工作稳定，副业收入增加 2000 元，精力消耗 3 点。获得 2 个四叶草！使用四叶草可使下一步掷骰步数翻倍！";
        }
    },
    {
        id: "Z08",
        name: "平面设计",
        description: "承接平面设计案件",
        image: "../cards/part_time/design.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 3000;
            state.energy = Math.max(0, state.energy - 3);
            state.businessCostDiscount = 20;
            state.hasSkill = true;
            state.hasBusinessDiscount = true;
            return "副业收入增加 3000 元，精力消耗 3 点。获得「平面设计」专业知识！未来任何生意营运成本将永久减少 20%";
        }
    },
    {
        id: "Z09",
        name: "香港本地資深導遊",
        description: "經驗豐富，全程陪同講解，城市徒步導覽",
        image: "../cards/part_time/local_tour.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 4000;
            state.energy = Math.max(0, state.energy - 4);
            return "副业收入增加 4000 元，精力消耗 4 点";
        }
    },
    {
        id: "Z11",
        name: "補習功課導師",
        description: "利用专业知识提供補習服务",
        image: "../cards/part_time/tutoring.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 3000;
            state.energy = Math.max(0, state.energy - 3);
            return "家教服务开始！副业收入增加 3000 元";
        }
    },
    {
        id: "Z12",
        name: "健身教練",
        description: "專屬定制個人化健身課程",
        image: "../cards/part_time/gym.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 4000;
            state.energy = Math.max(0, state.energy - 4);
            return "副业收入增加 4000 元，精力消耗 4 点";
        }
    },
    {
        id: "Z13",
        name: "銷售健康食品",
        description: "銷售有機健康食品，收入取決於客戶訂單量（擲骰子點數 × 1000）",
        image: "../cards/part_time/healthy_food.png",
        cost: 500,
        effect: (state) => {
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            let baseIncome = diceRoll * 1000;
            let finalIncome = baseIncome;
            let bonusMessage = '';
            if (state.sideIncomeBonus && state.sideIncomeBonus > 0) {
                finalIncome = Math.floor(baseIncome * (1 + state.sideIncomeBonus));
                bonusMessage = ` (含${Math.round(state.sideIncomeBonus * 100)}%人脈加成，${baseIncome} → ${finalIncome})`;
            }
            state.sideIncome += finalIncome;
            state.energy = Math.max(0, state.energy - 2);
            return `🍎 健康食品銷售成功！客戶訂單量為 ${diceRoll} 單，獲得 ${finalIncome} 元副业收入${bonusMessage}，精力消耗 2 点`;
        }
    },
    {
        id: "Z14",
        name: "侍應",
        description: "餐飲業的核心，負責為客人提供從帶位、點餐、上菜到結帳的貼心服務",
        image: "../cards/part_time/waiter.png",
        cost: 500,
        effect: (state) => {
            state.sideIncome += 4000;
            state.energy = Math.max(0, state.energy - 4);
            return "副业收入增加 4000 元，精力消耗 4 点";
        }
    }
];

// 财务类机会卡 (Finance)
const financeCards = [
    {
        id: "fin1",
        name: "基金投资",
        description: "投资稳健型基金",
        image: "../cards/finance/fund.png",
        cost: 500,
        effect: (state) => {
            const returns = Math.floor(Math.random() * 4000) + 1000;
            state.cash += returns;
            state.passiveIncome += 200;
            return `基金获利！获得 ${returns} 元，被动收入增加 200 元`;
        }
    },
    {
        id: "fin2",
        name: "股票操作",
        description: "短期股票交易获利",
        image: "../cards/finance/stock.png",
        cost: 500,
        effect: (state) => {
            const profit = Math.floor(Math.random() * 8000) - 2000;
            state.cash += profit;
            if (profit >= 0) {
                return `股票获利！赚取 ${profit} 元`;
            } else {
                return `股票亏损！损失 ${Math.abs(profit)} 元`;
            }
        }
    },
    {
        id: "fin3",
        name: "债券配置",
        description: "购买政府债券",
        image: "../cards/finance/bond.png",
        cost: 500,
        effect: (state) => {
            state.passiveIncome += 300;
            state.luck = Math.min(state.maxLuck, state.luck + 1);
            return "债券配置完成！被动收入增加 300 元，幸运值 +1";
        }
    },
    {
        id: "fin4",
        name: "外汇交易",
        description: "操作外币汇率差价",
        image: "../cards/finance/forex.png",
        cost: 500,
        effect: (state) => {
            const result = Math.random();
            if (result > 0.5) {
                const profit = Math.floor(Math.random() * 5000) + 2000;
                state.cash += profit;
                return `外汇交易成功！获利 ${profit} 元`;
            } else {
                const loss = Math.floor(Math.random() * 3000) + 1000;
                state.cash -= loss;
                return `外汇交易失败！损失 ${loss} 元`;
            }
        }
    },
    {
        id: "fin5",
        name: "理财规划",
        description: "专业理财顾问规划",
        image: "../cards/finance/planning.png",
        cost: 500,
        effect: (state) => {
            state.passiveIncome += 500;
            state.luck = Math.min(state.maxLuck, state.luck + 2);
            return "理财规划完成！被动收入增加 500 元，幸运值 +2";
        }
    },
    {
        id: "fin6",
        name: "保险配置",
        description: "购买投资型保险",
        image: "../cards/finance/insurance.png",
        cost: 500,
        effect: (state) => {
            state.cash += 2000;
            state.livingExpense += 300;
            return "保险配置完成！立即获得 2000 元，每月支出增加 300 元";
        }
    }
];

// 创业类机会卡 (Business)
const businessCards = [
    {
        id: "bus1",
        name: "餐饮创业",
        description: "开设小型餐厅",
        image: "../cards/business/restaurant.png",
        cost: 500,
        effect: (state) => {
            let baseIncome = 2000;
            let finalIncome = baseIncome;
            if (state.sideIncomeBonus && state.sideIncomeBonus > 0) {
                finalIncome = Math.floor(baseIncome * (1 + state.sideIncomeBonus));
            }
            state.sideIncome += finalIncome;
            state.energy = Math.max(0, state.energy - 2);
            state.luck = Math.min(state.maxLuck, state.luck + 1);
            return `餐厅开业！副业收入增加 ${finalIncome} 元${finalIncome !== baseIncome ? ` (含20%人脈加成)` : ''}，精力消耗 2 点，幸运值 +1`;
        }
    },
    {
        id: "bus5",
        name: "工作室成立",
        description: "成立个人工作室",
        image: "../cards/business/studio.png",
        cost: 500,
        effect: (state) => {
            let baseIncome = 1800;
            let finalIncome = baseIncome;
            if (state.sideIncomeBonus && state.sideIncomeBonus > 0) {
                finalIncome = Math.floor(baseIncome * (1 + state.sideIncomeBonus));
            }
            state.sideIncome += finalIncome;
            state.luck = Math.min(state.maxLuck, state.luck + 2);
            return `工作室成立！副业收入增加 ${finalIncome} 元${finalIncome !== baseIncome ? ` (含20%人脈加成)` : ''}，幸运值 +2`;
        }
    },
    {
        id: "bus6",
        name: "代理经销",
        description: "取得产品代理权",
        image: "../cards/business/agency.png",
        cost: 500,
        effect: (state) => {
            let baseIncome = 1000;
            let finalIncome = baseIncome;
            if (state.sideIncomeBonus && state.sideIncomeBonus > 0) {
                finalIncome = Math.floor(baseIncome * (1 + state.sideIncomeBonus));
            }
            state.passiveIncome += 2000;
            state.sideIncome += finalIncome;
            return `取得代理权！被动收入增加 2000 元，副业收入增加 ${finalIncome} 元${finalIncome !== baseIncome ? ` (含20%人脈加成)` : ''}`;
        }
    }
];

// 地产类机会卡 (Property)
const propertyCards = [
    {
        id: "pro1",
        name: "小户型投资",
        description: "投资小户型公寓",
        image: "../cards/property/apartment.png",
        cost: 500,
        effect: (state) => {
            state.passiveIncome += 2000;
            state.cash -= 30000;
            state.totalAssets += 30000;
            return "购入小户型公寓！被动收入增加 2000 元，花费 30000 元";
        }
    },
    {
        id: "pro2",
        name: "店面投资",
        description: "投资黄金店面",
        image: "../cards/property/shop.png",
        cost: 500,
        effect: (state) => {
            state.passiveIncome += 4000;
            state.cash -= 80000;
            state.totalAssets += 80000;
            return "购入黄金店面！被动收入增加 4000 元，花费 80000 元";
        }
    },
    {
        id: "pro3",
        name: "预售屋转手",
        description: "购买预售屋并转售",
        image: "../cards/property/pre_sale.png",
        cost: 500,
        effect: (state) => {
            const profit = Math.floor(Math.random() * 50000) + 20000;
            state.cash += profit;
            state.luck = Math.min(state.maxLuck, state.luck + 2);
            return `预售屋转售成功！获利 ${profit} 元，幸运值 +2`;
        }
    },
    {
        id: "pro4",
        name: "土地开发",
        description: "投资土地开发案",
        image: "../cards/property/land.png",
        cost: 500,
        effect: (state) => {
            const result = Math.random();
            if (result > 0.4) {
                state.passiveIncome += 5000;
                state.cash += 20000;
                return "土地开发成功！被动收入增加 5000 元，获得 20000 元";
            } else {
                state.cash -= 50000;
                return "土地开发失败！损失 50000 元";
            }
        }
    },
    {
        id: "pro5",
        name: "房产拍卖",
        description: "参与法拍屋竞标",
        image: "../cards/property/auction.png",
        cost: 500,
        effect: (state) => {
            const discount = Math.floor(Math.random() * 30) + 20;
            state.passiveIncome += 2500;
            state.cash -= 40000;
            state.totalAssets += 40000;
            return `法拍屋中标！以 ${discount}% 市价购入，被动收入增加 2500 元`;
        }
    },
    {
        id: "pro6",
        name: "REITs投资",
        description: "投资房地产信托基金",
        image: "../cards/property/reits.png",
        cost: 500,  // ✅ 添加了 cost 字段
        effect: (state) => {
            const dividends = Math.floor(Math.random() * 8000) + 2000;
            state.cash += dividends;
            state.passiveIncome += 800;
            return `REITs 分红！获得 ${dividends} 元，被动收入增加 800 元`;
        }
    }
];

// 导出所有卡片
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        partTimeCards,
        financeCards,
        businessCards,
        propertyCards,
        getAllCards: () => ({
            part_time: partTimeCards,
            finance: financeCards,
            business: businessCards,
            property: propertyCards
        })
    };
}