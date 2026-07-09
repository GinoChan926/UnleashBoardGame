// chance_cards.js - 完整版

// ==================== 兼职类机会卡 (Part Time) ====================
const partTimeCards = [
    {
        id: "Z01",
        name: "短片制作",
        description: "制作短片,成為KOL",
        image: "../cards/part_time/video_edit.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            state.sideIncome += 6000;
            state.energy = Math.max(0, state.energy - 3);
            state.businessCostDiscount = 10;
            state.hasEditSkill = true;
            state.hasBusinessDiscount = true;
            return "网店开张！副业收入增加 6000 元，精力消耗 3 点,获得「短片制作」专业知识！未来任何生意营运成本将永久减少 10%";
        },
        getEffectDescription: () => "副业收入 +6000/月，精力 -3,生意成本 -10%"
    },
    {
        id: "Z02",
        name: "在社區藥房工作",
        description: "預防疾病，救助生命",
        image: "../cards/part_time/pharmacies.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            state.sideIncome += 4000;
            state.energy = Math.max(0, state.energy - 4);
            return "副业收入增加 4000 元，精力消耗 4 点";
        },
        getEffectDescription: () => "副业收入 +4000/月，精力 -4"
    },
    {
        id: "Z03",
        name: "WEB3公司員工",
        description: "利用加密貨幣與NFT將數據與數位資產的所有權交還給使用者",
        image: "../cards/part_time/web3.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            state.sideIncome += 4000;
            state.energy = Math.max(0, state.energy - 4);
            return "副业收入增加 4000 元，精力消耗 4 点";
        },
        getEffectDescription: () => "副业收入 +4000/月，精力 -4"
    },
    {
        id: "Z04",
        name: "海外代購",
        description: "利用空闲时间做海外代購生意,需要投资10000元建立代購渠道",
        image: "../cards/part_time/oversea_purchase.png",
        cost: 500,
        investmentCost: 10000,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            if (state.cash >= 10000) {
                state.cash -= 10000;
                state.sideIncome += 5000;
                state.energy = Math.max(0, state.energy - 3);
                return `✅ 投资 10000 元建立代購渠道成功！副业收入增加 5000 元，精力消耗 3 点`;
            } else {
                return `❌ 现金不足 10000 元，无法投资建立代購渠道，已支付的 500 元无法退还`;
            }
        },
        getEffectDescription: () => "投资 10000 元，副业收入 +5000/月，精力 -3"
    },
    {
        id: "Z05",
        name: "專車司機",
        description: "私人/企業專車/商務/旅遊包車",
        image: "../cards/part_time/driver.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            state.sideIncome += 6000;
            state.energy = Math.max(0, state.energy - 6);
            return "副业收入增加 6000 元，精力消耗 6 点";
        },
        getEffectDescription: () => "副业收入 +6000/月，精力 -6"
    },
    {
        id: "Z06",
        name: "活動司儀",
        description: "專業司儀從不金盤洗手，只會金盤浪口，體面地棟篤笑，獲得人脈資源，未來副業收入+20%",
        image: "../cards/part_time/ceremonies.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
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
        },
        getEffectDescription: () => "副业收入 +3500/月，精力 -3，获得人脈資源技能 (+20%副业收入)"
    },
    {
        id: "Z07",
        name: "翻译",
        description: "承接文件翻译工作",
        image: "../cards/part_time/translation.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            state.sideIncome += 2000;
            state.energy = Math.max(0, state.energy - 3);
            state.fourLeafClover = (state.fourLeafClover || 0) + 2;
            return "翻译工作稳定，副业收入增加 2000 元，精力消耗 3 点。获得 2 个四叶草！使用四叶草可使下一步掷骰步数翻倍！";
        },
        getEffectDescription: () => "副业收入 +2000/月，精力 -3，获得 2 个四叶草"
    },
    {
        id: "Z08",
        name: "平面设计",
        description: "承接平面设计案件",
        image: "../cards/part_time/design.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            state.sideIncome += 3000;
            state.energy = Math.max(0, state.energy - 3);
            state.businessCostDiscount = 20;
            state.hasSkill = true;
            state.hasBusinessDiscount = true;
            return "副业收入增加 3000 元，精力消耗 3 点。获得「平面设计」专业知识！未来任何生意营运成本将永久减少 20%";
        },
        getEffectDescription: () => "副业收入 +3000/月，精力 -3，生意成本 -20%"
    },
    {
        id: "Z09",
        name: "香港本地資深導遊",
        description: "經驗豐富，全程陪同講解，城市徒步導覽",
        image: "../cards/part_time/local_tour.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            state.sideIncome += 4000;
            state.energy = Math.max(0, state.energy - 4);
            return "副业收入增加 4000 元，精力消耗 4 点";
        },
        getEffectDescription: () => "副业收入 +4000/月，精力 -4"
    },
    {
        id: "Z11",
        name: "補習功課導師",
        description: "利用专业知识提供補習服务",
        image: "../cards/part_time/tutoring.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            state.sideIncome += 3000;
            state.energy = Math.max(0, state.energy - 3);
            return "家教服务开始！副业收入增加 3000 元";
        },
        getEffectDescription: () => "副业收入 +3000/月，精力 -3"
    },
    {
        id: "Z12",
        name: "健身教練",
        description: "專屬定制個人化健身課程",
        image: "../cards/part_time/gym.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            state.sideIncome += 4000;
            state.energy = Math.max(0, state.energy - 4);
            return "副业收入增加 4000 元，精力消耗 4 点";
        },
        getEffectDescription: () => "副业收入 +4000/月，精力 -4"
    },
    {
        id: "Z13",
        name: "銷售健康食品",
        description: "銷售有機健康食品，收入取決於客戶訂單量（擲骰子點數 × 1000）",
        image: "../cards/part_time/healthy_food.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
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
        },
        getEffectDescription: () => "副业收入 +1,000-6,000/月（隨機），精力 -2"
    },
    {
        id: "Z14",
        name: "侍應",
        description: "餐飲業的核心，負責為客人提供從帶位、點餐、上菜到結帳的貼心服務",
        image: "../cards/part_time/waiter.png",
        cost: 500,
        type: "part_time",
        category: "兼职",
        effect: (state) => {
            state.sideIncome += 4000;
            state.energy = Math.max(0, state.energy - 4);
            return "副业收入增加 4000 元，精力消耗 4 点";
        },
        getEffectDescription: () => "副业收入 +4000/月，精力 -4"
    }
];

// ==================== 竞拍系统 ====================

// 存储活跃的竞拍
const activeAuctions = new Map();

// 开始竞拍
function startAuction(roomId, card, currentPlayer, ws) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const auctionId = Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    const auction = {
        id: auctionId,
        card: card,
        roomId: roomId,
        currentPrice: card.auctionDetails.basePrice || 700000,
        minBidIncrement: card.auctionDetails.minBidIncrement || 100000,
        energyReward: card.auctionDetails.energyReward || 50,
        currentBidder: null,
        bidders: new Map(), // ws -> { playerName, currentBid }
        passedPlayers: new Set(), // 已PASS的玩家
        active: true,
        startTime: Date.now(),
        initiator: currentPlayer.playerName
    };
    
    // 收集所有玩家
    room.players.forEach((player, playerWs) => {
        auction.bidders.set(playerWs, {
            playerName: player.playerName,
            currentBid: 0,
            ws: playerWs
        });
    });
    
    activeAuctions.set(auctionId, auction);
    
    // 发送竞拍开始消息给所有玩家
    const auctionMessage = {
        type: 'auction_start',
        auctionId: auctionId,
        cardName: card.name,
        description: card.description,
        basePrice: auction.currentPrice,
        minBidIncrement: auction.minBidIncrement,
        energyReward: auction.energyReward,
        initiator: currentPlayer.playerName,
        currentPrice: auction.currentPrice,
        currentBidder: null
    };
    
    broadcastToRoom(roomId, auctionMessage);
    
    console.log(`🏗️ 竞拍开始: ${card.name}, 底价: ${auction.currentPrice}, 由 ${currentPlayer.playerName} 发起`);
    return auctionId;
}

// 处理竞拍出价
function handleAuctionBid(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    const auctionId = data.auctionId;
    const auction = activeAuctions.get(auctionId);
    
    if (!auction || !auction.active) {
        ws.send(JSON.stringify({
            type: 'auction_error',
            message: '竞拍已结束或不存在'
        }));
        return;
    }
    
    // 检查玩家是否已经PASS
    if (auction.passedPlayers.has(ws)) {
        ws.send(JSON.stringify({
            type: 'auction_error',
            message: '你已PASS，不能再参与竞拍'
        }));
        return;
    }
    
    const newBid = auction.currentPrice + auction.minBidIncrement;
    
    // 检查玩家现金是否足够
    if (player.gameState.cash < newBid) {
        ws.send(JSON.stringify({
            type: 'auction_error',
            message: `现金不足！需要 ${newBid.toLocaleString()} 元，当前 ${player.gameState.cash.toLocaleString()} 元`
        }));
        return;
    }
    
    // 更新竞拍价格
    auction.currentPrice = newBid;
    auction.currentBidder = player.playerName;
    
    // 更新该玩家的出价记录
    const bidderInfo = auction.bidders.get(ws);
    if (bidderInfo) {
        bidderInfo.currentBid = newBid;
    }
    
    // 广播更新
    broadcastToRoom(roomId, {
        type: 'auction_update',
        auctionId: auctionId,
        currentPrice: newBid,
        currentBidder: player.playerName,
        message: `${player.playerName} 出价 ${newBid.toLocaleString()} 元！`
    });
    
    console.log(`💰 ${player.playerName} 出价 ${newBid.toLocaleString()} 元`);
}

// 处理玩家PASS
function handleAuctionPass(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    const auctionId = data.auctionId;
    const auction = activeAuctions.get(auctionId);
    
    if (!auction || !auction.active) {
        ws.send(JSON.stringify({
            type: 'auction_error',
            message: '竞拍已结束或不存在'
        }));
        return;
    }
    
    // 标记玩家已PASS
    auction.passedPlayers.add(ws);
    
    // 检查是否所有玩家都已PASS
    let allPassed = true;
    auction.bidders.forEach((bidder, bidderWs) => {
        if (!auction.passedPlayers.has(bidderWs)) {
            allPassed = false;
        }
    });
    
    // 如果所有玩家都PASS了，结束竞拍
    if (allPassed) {
        endAuction(auctionId, roomId);
        return;
    }
    
    // 广播玩家PASS
    broadcastToRoom(roomId, {
        type: 'auction_update',
        auctionId: auctionId,
        currentPrice: auction.currentPrice,
        currentBidder: auction.currentBidder,
        message: `${player.playerName} 已 PASS (不能再出价)`
    });
    
    console.log(`⏭️ ${player.playerName} 已PASS`);
}

// 结束竞拍
function endAuction(auctionId, roomId) {
    const auction = activeAuctions.get(auctionId);
    if (!auction) return;
    
    auction.active = false;
    
    // 检查是否有赢家
    let winner = null;
    let highestBid = 0;
    
    auction.bidders.forEach((bidder, bidderWs) => {
        if (bidder.currentBid > highestBid && !auction.passedPlayers.has(bidderWs)) {
            highestBid = bidder.currentBid;
            winner = {
                ws: bidderWs,
                playerName: bidder.playerName,
                bid: bidder.currentBid
            };
        }
    });
    
    const room = rooms.get(roomId);
    
    if (winner && room) {
        // 找到赢家的玩家对象
        const winnerPlayer = room.players.get(winner.ws);
        
        if (winnerPlayer) {
            // 扣除现金
            winnerPlayer.gameState.cash -= winner.bid;
            
            // 获得精力奖励
            winnerPlayer.gameState.energy = Math.min(
                winnerPlayer.gameState.maxEnergy,
                winnerPlayer.gameState.energy + auction.energyReward
            );
            
            // 记录交易
            addTransactionRecord(
                winnerPlayer.playerName,
                { name: auction.card.name, type: "investment", id: auction.card.id },
                "竞拍获胜",
                -winner.bid,
                `竞拍「${auction.card.name}」获胜！支出 ${winner.bid.toLocaleString()} 元，获得 ${auction.energyReward} 精力！`,
                null,
                winnerPlayer.gameState
            );
            
            // 广播竞拍结果
            broadcastToRoom(roomId, {
                type: 'auction_end',
                auctionId: auctionId,
                winner: winner.playerName,
                winningBid: winner.bid,
                energyReward: auction.energyReward,
                message: `🎉 竞拍结束！${winner.playerName} 以 ${winner.bid.toLocaleString()} 元获胜，获得 ${auction.energyReward} 精力！`
            });
            
            // 更新赢家状态
            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: winnerPlayer.playerId,
                gameState: winnerPlayer.gameState
            });
            
            console.log(`🏆 竞拍结束！${winner.playerName} 以 ${winner.bid.toLocaleString()} 元获胜`);
        }
    } else {
        // 没有人出价，竞拍取消
        broadcastToRoom(roomId, {
            type: 'auction_end',
            auctionId: auctionId,
            winner: null,
            winningBid: 0,
            message: `竞拍取消 - 没有人出价`
        });
    }
    
    activeAuctions.delete(auctionId);
}

// 处理竞拍超时（60秒自动结束）
setInterval(() => {
    const now = Date.now();
    activeAuctions.forEach((auction, auctionId) => {
        if (now - auction.startTime > 60000 && auction.active) {
            console.log(`⏰ 竞拍超时: ${auction.card.name}`);
            endAuction(auctionId, auction.roomId);
        }
    });
}, 5000);



// ==================== 财务类机会卡 (Finance) ====================
const financeCards = [
    // 基金投资 F02
    {
        id: "F02",
        code: "F02",
        name: "基金投資",
        description: "基金代碼 F02 | 今日價格:$30,000/份 | 可購買的份數不限,但必須為整數| 利息 +$2,500/份/月",
        image: "../cards/finance/F02.png",
        cost: 500,
        type: "finance",
        category: "财务",
        pricePerUnit: 30000,
        monthlyReturn: 2500,
        minUnits: 1,
        maxUnits: null,
        effect: (state, units = 1) => {
            const totalCost = units * 30000;
            if (state.cash >= totalCost) {
                state.cash -= totalCost;
                state.passiveIncome += units * 2500;
                state.totalAssets += totalCost;
                state.financeInvestments = state.financeInvestments || [];
                state.financeInvestments.push({
                    id: "F02",
                    name: "基金投資",
                    units: units,
                    pricePerUnit: 30000,
                    monthlyReturn: 2500,
                    totalCost: totalCost
                });
                return `✅ 購買 ${units} 份基金投資，花费 ${totalCost.toLocaleString()} 元，被动收入 +${(units * 2500).toLocaleString()} 元/月`;
            } else {
                return `❌ 现金不足 ${totalCost.toLocaleString()} 元，无法购买 ${units} 份基金`;
            }
        },
        getEffectDescription: (units = 1) => `購買 ${units} 份，花費 ${(units * 30000).toLocaleString()} 元，被動收入 +${(units * 2500).toLocaleString()}/月`
    },

    // 加密货币交易 F03 (C01 - 价格 $10)
    {
        id: "F03",
        code: "C01",
        name: "C01加密貨幣交易",
        description: "基金代碼 C01 | 今日價格:$10/顆 | 價值($0-無限)/顆 | 可購買的顆數不限但必須為整數 | 高風險高回報",
        image: "../cards/finance/F03.png",
        cost: 500,
        type: "finance",
        category: "财务",
        cryptoCode: "C01",
        cryptoName: "加密貨幣",
        currentPrice: 10,
        minUnits: 1,
        maxUnits: null,
        priceRange: { min: 0, max: null },
        
        // 获取当前价格（高波动性）
        getCurrentPrice: function(state) {
            let basePrice = this.currentPrice;
            
            if (state.cryptoHoldings && state.cryptoHoldings[this.id] && state.cryptoHoldings[this.id].lastPrice) {
                basePrice = state.cryptoHoldings[this.id].lastPrice;
            }
            
            // 加密货币波动范围：0.3x 到 4x (极大波动)
            const volatility = 0.3 + Math.random() * 3.7;
            let newPrice = Math.round(basePrice * volatility * 100) / 100;
            
            newPrice = Math.max(0.01, newPrice);
            
            // 极低概率的暴涨/暴跌（5%概率）
            const extremeEvent = Math.random();
            if (extremeEvent < 0.02) {
                const multiplier = 3 + Math.random() * 7;
                newPrice = newPrice * multiplier;
                this.extremeEventTriggered = '暴涨';
            } else if (extremeEvent < 0.04) {
                const multiplier = 0.05 + Math.random() * 0.2;
                newPrice = newPrice * multiplier;
                this.extremeEventTriggered = '暴跌';
            } else {
                this.extremeEventTriggered = null;
            }
            
            return Math.round(newPrice * 100) / 100;
        },
        
        // 购买加密货币
        buy: function(state, units) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = units * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元，无法购买 ${units} 顆。当前现金: ${state.cash.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.cryptoHoldings = state.cryptoHoldings || {};
            if (!state.cryptoHoldings[this.id]) {
                state.cryptoHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    units: 0,
                    totalCost: 0,
                    averagePrice: 0,
                    lastPrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.cryptoHoldings[this.id];
            holding.units += units;
            holding.totalCost += totalCost;
            holding.averagePrice = holding.totalCost / holding.units;
            holding.lastPrice = currentPrice;
            holding.transactions.push({
                type: 'buy',
                units: units,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            let extremeMsg = '';
            if (this.extremeEventTriggered === '暴涨') {
                extremeMsg = ' 🚀 市场出现暴涨行情！价格剧烈上涨！';
            } else if (this.extremeEventTriggered === '暴跌') {
                extremeMsg = ' 📉 市场出现恐慌性抛售！价格暴跌！';
            }
            
            return {
                success: true,
                message: `✅ 購買 ${units.toLocaleString()} 顆 ${this.cryptoName} (代碼:${this.code})，成交價 $${currentPrice}/顆，花費 ${totalCost.toLocaleString()} 元。平均成本 $${holding.averagePrice.toFixed(4)}/顆，共持有 ${holding.units.toLocaleString()} 顆${extremeMsg}`,
                units: units,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        // 卖出加密货币
        sell: function(state, units) {
            const holding = state.cryptoHoldings?.[this.id];
            if (!holding || holding.units < units) {
                return { success: false, message: `❌ 持仓不足，当前持有 ${holding?.units || 0} 顆，无法卖出 ${units} 顆` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = units * currentPrice;
            
            state.cash += totalRevenue;
            holding.units -= units;
            
            const costToRemove = (holding.totalCost / (holding.units + units)) * units;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.lastPrice = currentPrice;
            holding.transactions.push({
                type: 'sell',
                units: units,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.units === 0) {
                delete state.cryptoHoldings[this.id];
            } else {
                holding.averagePrice = holding.totalCost / holding.units;
            }
            
            let extremeMsg = '';
            if (this.extremeEventTriggered === '暴涨') {
                extremeMsg = ' 🚀 出货时机完美！价格处于高位！';
            } else if (this.extremeEventTriggered === '暴跌') {
                extremeMsg = ' 😭 被迫在低位卖出，损失惨重！';
            }
            
            return {
                success: true,
                message: `💰 賣出 ${units.toLocaleString()} 顆 ${this.cryptoName} (代碼:${this.code})，成交價 $${currentPrice}/顆，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}${extremeMsg}`,
                units: units,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        // 获取持仓信息
        getHoldingsInfo: function(state) {
            const holding = state.cryptoHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.units * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                units: holding.units,
                averagePrice: holding.averagePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', units = 1) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `🪙 ${this.name} (${this.code})\n\n`;
                menuText += `📊 加密貨幣資訊:\n`;
                menuText += `  當前價格: $${currentPrice}/顆\n`;
                menuText += `  價格波動範圍: $0 - ∞/顆 (極高波動)\n`;
                menuText += `  最小交易: ${this.minUnits} 顆\n`;
                menuText += `  ⚠️ 高風險投資，價格可能暴漲暴跌 ⚠️\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓信息:\n`;
                    menuText += `  持有數量: ${holding.units.toLocaleString()} 顆\n`;
                    menuText += `  平均成本: $${holding.averagePrice.toFixed(4)}/顆\n`;
                    menuText += `  持倉市值: $${holding.currentValue.toLocaleString()} 元\n`;
                    menuText += `  總成本: $${holding.totalCost.toLocaleString()} 元\n`;
                    menuText += `  盈虧: ${holding.profit >= 0 ? '+' : ''}${holding.profit.toLocaleString()} 元 (${holding.profitPercent >= 0 ? '+' : ''}${holding.profitPercent.toFixed(2)}%)\n\n`;
                    menuText += `請選擇操作:\n`;
                    menuText += `1️⃣ 買入 ${this.cryptoName}\n`;
                    menuText += `2️⃣ 賣出 ${this.cryptoName}\n`;
                    menuText += `3️⃣ 取消操作`;
                } else {
                    menuText += `請選擇操作:\n`;
                    menuText += `1️⃣ 買入 ${this.cryptoName}\n`;
                    menuText += `2️⃣ 取消操作`;
                }
                
                return { type: 'crypto_menu', message: menuText, holding: holding, currentPrice: currentPrice };
            } else if (action === 'buy') {
                return this.buy(state, units);
            } else if (action === 'sell') {
                return this.sell(state, units);
            }
            
            return `加密货币交易 - ${this.name}`;
        },
        
        getEffectDescription: function() {
            return `加密貨幣交易 | 價格波動 $0-∞/顆 | 最小交易 ${this.minUnits} 顆 | 可買入/賣出 | 高風險高回報`;
        }
    },

    // 加密货币交易 F04 (C01 - 价格 $5)
    {
        id: "F04",
        code: "C01",
        name: "C01加密貨幣交易",
        description: "基金代碼 C01 | 今日價格:$5/顆 | 價值($0-無限)/顆 | 可購買的顆數不限但必須為整數 | 高風險高回報",
        image: "../cards/finance/F04.png",
        cost: 500,
        type: "finance",
        category: "财务",
        cryptoCode: "C01",
        cryptoName: "加密貨幣",
        currentPrice: 5,
        minUnits: 1,
        maxUnits: null,
        priceRange: { min: 0, max: null },
        
        getCurrentPrice: function(state) {
            let basePrice = this.currentPrice;
            
            if (state.cryptoHoldings && state.cryptoHoldings[this.id] && state.cryptoHoldings[this.id].lastPrice) {
                basePrice = state.cryptoHoldings[this.id].lastPrice;
            }
            
            const volatility = 0.3 + Math.random() * 3.7;
            let newPrice = Math.round(basePrice * volatility * 100) / 100;
            newPrice = Math.max(0.01, newPrice);
            
            const extremeEvent = Math.random();
            if (extremeEvent < 0.02) {
                const multiplier = 3 + Math.random() * 7;
                newPrice = newPrice * multiplier;
                this.extremeEventTriggered = '暴涨';
            } else if (extremeEvent < 0.04) {
                const multiplier = 0.05 + Math.random() * 0.2;
                newPrice = newPrice * multiplier;
                this.extremeEventTriggered = '暴跌';
            } else {
                this.extremeEventTriggered = null;
            }
            
            return Math.round(newPrice * 100) / 100;
        },
        
        buy: function(state, units) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = units * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元，无法购买 ${units} 顆` };
            }
            
            state.cash -= totalCost;
            
            state.cryptoHoldings = state.cryptoHoldings || {};
            if (!state.cryptoHoldings[this.id]) {
                state.cryptoHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    units: 0,
                    totalCost: 0,
                    averagePrice: 0,
                    lastPrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.cryptoHoldings[this.id];
            holding.units += units;
            holding.totalCost += totalCost;
            holding.averagePrice = holding.totalCost / holding.units;
            holding.lastPrice = currentPrice;
            holding.transactions.push({
                type: 'buy',
                units: units,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            let extremeMsg = '';
            if (this.extremeEventTriggered === '暴涨') {
                extremeMsg = ' 🚀 市场出现暴涨行情！';
            } else if (this.extremeEventTriggered === '暴跌') {
                extremeMsg = ' 📉 市场出现恐慌性抛售！';
            }
            
            return {
                success: true,
                message: `✅ 購買 ${units.toLocaleString()} 顆 ${this.cryptoName}，成交價 $${currentPrice}/顆，花費 ${totalCost.toLocaleString()} 元${extremeMsg}`,
                units: units,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, units) {
            const holding = state.cryptoHoldings?.[this.id];
            if (!holding || holding.units < units) {
                return { success: false, message: `❌ 持仓不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = units * currentPrice;
            
            state.cash += totalRevenue;
            holding.units -= units;
            
            const costToRemove = (holding.totalCost / (holding.units + units)) * units;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.lastPrice = currentPrice;
            holding.transactions.push({
                type: 'sell',
                units: units,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.units === 0) {
                delete state.cryptoHoldings[this.id];
            }
            
            return {
                success: true,
                message: `💰 賣出 ${units.toLocaleString()} 顆 ${this.cryptoName}，成交價 $${currentPrice}/顆，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                units: units,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.cryptoHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.units * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                units: holding.units,
                averagePrice: holding.averagePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', units = 1) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `🪙 ${this.name} (${this.code})\n\n`;
                menuText += `📊 當前價格: $${currentPrice}/顆\n`;
                menuText += `最小交易: ${this.minUnits} 顆\n`;
                menuText += `⚠️ 高風險投資 ⚠️\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.units}顆 | 成本 $${holding.averagePrice?.toFixed(4)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'crypto_menu', message: menuText, holding: holding, currentPrice: currentPrice, minUnits: this.minUnits, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, units);
            } else if (action === 'sell') {
                return this.sell(state, units);
            }
            return `加密货币交易`;
        },
        
        getEffectDescription: function() {
            return `加密貨幣交易 | 價格波動 $0-∞/顆 | 最小交易 ${this.minUnits} 顆 | 高風險高回報`;
        }
    },

    // P2P投資網上借貸平台 F05
    {
        id: "F05",
        code: "N02",
        name: "P2P投資網上借貸平台",
        description: "基金代碼 N02 | 今日價格:$10/股 | 價值($0-無限)/股 | 可買股數:100-1,000股",
        image: "../cards/finance/F05.png",
        cost: 500,
        type: "finance",
        category: "财务",
        pricePerUnit: 10,
        minUnits: 100,
        maxUnits: 1000,
        monthlyReturn: 0,
        effect: (state, units = 100) => {
            const totalCost = units * 10;
            if (state.cash >= totalCost) {
                state.cash -= totalCost;
                state.totalAssets += totalCost;
                state.financeInvestments = state.financeInvestments || [];
                state.financeInvestments.push({
                    id: "N02",
                    name: "P2P投資網上借貸平台",
                    units: units,
                    pricePerUnit: 10,
                    totalCost: totalCost
                });
                return `✅ 購買 ${units} 股 P2P投資平台，花费 ${totalCost.toLocaleString()} 元`;
            } else {
                return `❌ 现金不足 ${totalCost.toLocaleString()} 元，无法购买`;
            }
        },
        getEffectDescription: (units = 100) => `購買 ${units} 股，花費 ${(units * 10).toLocaleString()} 元`
    },

    // 股票交易 F06
    {
        id: "F06",
        code: "B01",
        name: "股票交易 - B01金融公司",
        description: "股票代碼 B01 | 今日價格 $5/股 | 價格波動範圍 $5-$30/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F06.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "B01",
        stockName: "金融公司",
        currentPrice: 5,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 5, max: 30 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },


    {
        id: "F07",
        code: "B01",
        name: "股票交易 - B01金融公司",
        description: "股票代碼 B01 | 今日價格 $10/股 | 價格波動範圍 $5-$30/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F07.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "B01",
        stockName: "金融公司",
        currentPrice: 10,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 5, max: 30 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

    {
        id: "F08",
        code: "B01",
        name: "股票交易 - B01金融公司",
        description: "股票代碼 B01 | 今日價格 $20/股 | 價格波動範圍 $5-$30/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F08.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "B01",
        stockName: "金融公司",
        currentPrice: 20,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 5, max: 30 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

    {
        id: "F09",
        code: "B01",
        name: "股票交易 - B01金融公司",
        description: "股票代碼 B01 | 今日價格 $30/股 | 價格波動範圍 $5-$30/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F09.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "B01",
        stockName: "金融公司",
        currentPrice: 30,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 5, max: 30 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

    {
        id: "F10",
        code: "B01",
        name: "股票交易 - B01金融公司",
        description: "股票代碼 B01 | 今日價格 $1/股 | 價格波動範圍 $1-$100/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F08.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "B01",
        stockName: "金融公司",
        currentPrice: 1,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 1, max: 100 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

    {
        id: "F11",
        code: "A01",
        name: "股票交易 - 科技公司",
        description: "股票代碼 A01 | 今日價格 $10/股 | 價格波動範圍 $1-$100/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F11.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "A01",
        stockName: "科技公司",
        currentPrice: 10,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 1, max: 100 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

    {
        id: "F12",
        code: "A01",
        name: "股票交易 - A01科技公司",
        description: "股票代碼 A01 | 今日價格 $50/股 | 價格波動範圍 $1-$100/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F12.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "A01",
        stockName: "科技公司",
        currentPrice: 50,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 1, max: 100 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

    {
        id: "F13",
        code: "A01",
        name: "股票交易 - A01科技公司",
        description: "股票代碼 A01 | 今日價格 $100/股 | 價格波動範圍 $1-$100/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F13.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "A01",
        stockName: "科技公司",
        currentPrice: 100,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 1, max: 100 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

    {
        id: "F14",
        code: "H01",
        name: "股票交易 - H01健康食品公司",
        description: "股票代碼 H01 | 今日價格 $1/股 | 價格波動範圍 $1-$10/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F14.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "H01",
        stockName: "健康食品公司",
        currentPrice: 1,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 1, max: 10 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

    {
        id: "F15",
        code: "H01",
        name: "股票交易 - H01健康食品公司",
        description: "股票代碼 H01 | 今日價格 $3/股 | 價格波動範圍 $1-$10/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F15.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "H01",
        stockName: "健康食品公司",
        currentPrice: 3,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 1, max: 10 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

    {
        id: "F16",
        code: "H01",
        name: "股票交易 - H01健康食品公司",
        description: "股票代碼 H01 | 今日價格 $8/股 | 價格波動範圍 $1-$10/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F16.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "H01",
        stockName: "健康食品公司",
        currentPrice: 8,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 1, max: 10 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

    {
        id: "F17",
        code: "H01",
        name: "股票交易 - H01健康食品公司",
        description: "股票代碼 H01 | 今日價格 $10/股 | 價格波動範圍 $1-$10/股 | 可購買股數 100股的倍數 (無上限)",
        image: "../cards/finance/F17.png",
        cost: 500,
        type: "finance",
        category: "财务",
        stockCode: "H01",
        stockName: "健康食品公司",
        currentPrice: 10,
        minShares: 100,
        shareMultiple: 100,
        maxShares: null,
        priceRange: { min: 1, max: 10 },
        
        getCurrentPrice: function(state) {
            if (state.stockHoldings && state.stockHoldings[this.id] && state.stockHoldings[this.id].purchasePrice) {
                const volatility = 0.8 + Math.random() * 0.8;
                let newPrice = Math.round(state.stockHoldings[this.id].purchasePrice * volatility);
                newPrice = Math.max(this.priceRange.min, Math.min(this.priceRange.max, newPrice));
                return newPrice;
            }
            return Math.floor(Math.random() * (this.priceRange.max - this.priceRange.min + 1)) + this.priceRange.min;
        },
        
        buy: function(state, shares) {
            const currentPrice = this.getCurrentPrice(state);
            const totalCost = shares * currentPrice;
            
            if (state.cash < totalCost) {
                return { success: false, message: `❌ 现金不足 ${totalCost.toLocaleString()} 元` };
            }
            
            state.cash -= totalCost;
            
            state.stockHoldings = state.stockHoldings || {};
            if (!state.stockHoldings[this.id]) {
                state.stockHoldings[this.id] = {
                    id: this.id,
                    code: this.code,
                    name: this.name,
                    shares: 0,
                    totalCost: 0,
                    purchasePrice: currentPrice,
                    transactions: []
                };
            }
            
            const holding = state.stockHoldings[this.id];
            holding.shares += shares;
            holding.totalCost += totalCost;
            holding.purchasePrice = holding.totalCost / holding.shares;
            holding.transactions.push({
                type: 'buy',
                shares: shares,
                price: currentPrice,
                total: totalCost,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += totalCost;
            
            return {
                success: true,
                message: `✅ 購買 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，花費 ${totalCost.toLocaleString()} 元`,
                shares: shares,
                price: currentPrice,
                totalCost: totalCost
            };
        },
        
        sell: function(state, shares) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding || holding.shares < shares) {
                return { success: false, message: `❌ 持股不足` };
            }
            
            const currentPrice = this.getCurrentPrice(state);
            const totalRevenue = shares * currentPrice;
            
            state.cash += totalRevenue;
            holding.shares -= shares;
            
            const costToRemove = (holding.totalCost / (holding.shares + shares)) * shares;
            holding.totalCost -= costToRemove;
            const profit = totalRevenue - costToRemove;
            
            holding.transactions.push({
                type: 'sell',
                shares: shares,
                price: currentPrice,
                total: totalRevenue,
                profit: profit,
                timestamp: new Date().toLocaleString()
            });
            
            state.totalAssets += profit;
            
            if (holding.shares === 0) {
                delete state.stockHoldings[this.id];
            } else {
                holding.purchasePrice = holding.totalCost / holding.shares;
            }
            
            return {
                success: true,
                message: `💰 賣出 ${shares} 股 ${this.name}，成交價 $${currentPrice}/股，獲得 ${totalRevenue.toLocaleString()} 元。${profit >= 0 ? `獲利 +${profit.toLocaleString()} 元` : `虧損 ${profit.toLocaleString()} 元`}`,
                shares: shares,
                price: currentPrice,
                totalRevenue: totalRevenue,
                profit: profit
            };
        },
        
        getHoldingsInfo: function(state) {
            const holding = state.stockHoldings?.[this.id];
            if (!holding) return null;
            
            const currentPrice = this.getCurrentPrice(state);
            const currentValue = holding.shares * currentPrice;
            const profit = currentValue - holding.totalCost;
            const profitPercent = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
            
            return {
                code: this.code,
                name: this.name,
                shares: holding.shares,
                avgCost: holding.purchasePrice,
                currentPrice: currentPrice,
                currentValue: currentValue,
                totalCost: holding.totalCost,
                profit: profit,
                profitPercent: profitPercent
            };
        },
        
        effect: function(state, action = 'menu', shares = 100) {
            if (action === 'menu') {
                const holding = this.getHoldingsInfo(state);
                const currentPrice = this.getCurrentPrice(state);
                
                let menuText = `📊 ${this.name} (${this.code})\n\n`;
                menuText += `當前股價: $${currentPrice}/股\n`;
                menuText += `價格範圍: $${this.priceRange.min} - $${this.priceRange.max}/股\n`;
                menuText += `最小交易: ${this.minShares} 股 (${this.minShares}股的倍數)\n\n`;
                
                if (holding) {
                    menuText += `📈 持仓: ${holding.shares}股 | 成本 $${holding.avgCost?.toFixed(2)} | 市值 $${holding.currentValue} | 盈虧 ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()}\n\n`;
                    menuText += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuText += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                return { type: 'stock_menu', message: menuText, holding: holding, currentPrice: currentPrice, minShares: this.minShares, shareMultiple: this.shareMultiple, cardId: this.id };
            } else if (action === 'buy') {
                return this.buy(state, shares);
            } else if (action === 'sell') {
                return this.sell(state, shares);
            }
            return `股票交易`;
        },
        
        getEffectDescription: function() {
            return `股票交易 | 價格 $${this.priceRange.min}-$${this.priceRange.max}/股 | 最小交易 ${this.minShares} 股 | 可買入/賣出`;
        }
    },

];

// ==================== 创业类机会卡 (Business) ====================
const businessCards = [

     {
        id: "C01",
        name: "自助咖啡售賣機",
        description: "投資:$50,000/部 (最多可投資3部) | 約10個月回本 | 被動收入:+$5,000/部/月 | 精力:-2",
        image: "../cards/business/aicafe.png",
        cost: 500,
        type: "business",
        category: "创业",
        pricePerUnit: 50000,
        monthlyReturn: 5000,
        energyCostPerUnit: 2,
        minUnits: 1,
        maxUnits: 3,
        effect: (state, units = 1) => {
            // 检查已有投资数量
            const existingInvestment = state.businessInvestments?.find(inv => inv.id === "C01");
            const existingUnits = existingInvestment?.units || 0;
            const newUnits = Math.min(units, 3 - existingUnits);
            
            if (newUnits <= 0) {
                return `❌ 已达到最大投资数量 (3部)，无法继续投资自助咖啡售賣機`;
            }
            
            const totalCost = newUnits * 50000;
            const totalEnergyCost = newUnits * 2;
            
            if (state.cash < totalCost) {
                return `❌ 现金不足 ${totalCost.toLocaleString()} 元，无法购买 ${newUnits} 部自助咖啡售賣機`;
            }
            
            if (state.energy < totalEnergyCost) {
                return `❌ 精力不足 ${totalEnergyCost} 点，无法购买 ${newUnits} 部自助咖啡售賣機`;
            }
            
            // 执行购买
            state.cash -= totalCost;
            state.energy -= totalEnergyCost;
            state.passiveIncome += newUnits * 5000;
            state.totalAssets += totalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            if (existingInvestment) {
                existingInvestment.units += newUnits;
                existingInvestment.totalCost += totalCost;
                existingInvestment.monthlyReturn = existingInvestment.units * 5000;
            } else {
                state.businessInvestments.push({
                    id: "C01",
                    name: "自助咖啡售賣機",
                    units: newUnits,
                    pricePerUnit: 50000,
                    monthlyReturn: 5000,
                    totalCost: totalCost
                });
            }
            
            const currentUnits = (existingInvestment?.units || 0) + newUnits;
            const remaining = 3 - currentUnits;
            
            return `✅ 購買 ${newUnits} 部自助咖啡售賣機成功！花費 ${totalCost.toLocaleString()} 元，被動收入 +${(newUnits * 5000).toLocaleString()} 元/月，精力消耗 ${totalEnergyCost} 点。現共持有 ${currentUnits}/3 部，剩餘 ${remaining} 部可投資`;
        },
        getEffectDescription: (units = 1) => `購買 ${units} 部，花費 ${(units * 50000).toLocaleString()} 元，被動收入 +${(units * 5000).toLocaleString()}/月，精力 -${units * 2}`
    },

     {
        id: "C02",
        name: "格仔舖",
        description: "投資:$5,000/格 (最多可投資3格) | 約6個月回本 | 被動收入:+$800/格/月 | 精力: -2",
        image: "../cards/business/aicafe.png",
        cost: 500,
        type: "business",
        category: "创业",
        pricePerUnit: 5000,
        monthlyReturn: 800,
        energyCostPerUnit: 2,
        minUnits: 1,
        maxUnits: 3,
        effect: (state, units = 1) => {
            // 检查已有投资数量
            const existingInvestment = state.businessInvestments?.find(inv => inv.id === "C02");
            const existingUnits = existingInvestment?.units || 0;
            const newUnits = Math.min(units, 3 - existingUnits);
            
            if (newUnits <= 0) {
                return `❌ 已达到最大投资数量 (3部)，无法继续投资自助咖啡售賣機`;
            }
            
            const totalCost = newUnits * 5000;
            const totalEnergyCost = newUnits * 2;
            
            if (state.cash < totalCost) {
                return `❌ 现金不足 ${totalCost.toLocaleString()} 元，无法购买 ${newUnits} 部自助咖啡售賣機`;
            }
            
            if (state.energy < totalEnergyCost) {
                return `❌ 精力不足 ${totalEnergyCost} 点，无法购买 ${newUnits} 部自助咖啡售賣機`;
            }
            
            // 执行购买
            state.cash -= totalCost;
            state.energy -= totalEnergyCost;
            state.passiveIncome += newUnits * 5000;
            state.totalAssets += totalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            if (existingInvestment) {
                existingInvestment.units += newUnits;
                existingInvestment.totalCost += totalCost;
                existingInvestment.monthlyReturn = existingInvestment.units * 5000;
            } else {
                state.businessInvestments.push({
                    id: "C01",
                    name: "自助咖啡售賣機",
                    units: newUnits,
                    pricePerUnit: 5000,
                    monthlyReturn: 800,
                    totalCost: totalCost
                });
            }
            
            const currentUnits = (existingInvestment?.units || 0) + newUnits;
            const remaining = 3 - currentUnits;
            
            return `✅ 購買 ${newUnits} 部自助咖啡售賣機成功！花費 ${totalCost.toLocaleString()} 元，被動收入 +${(newUnits * 5000).toLocaleString()} 元/月，精力消耗 ${totalEnergyCost} 点。現共持有 ${currentUnits}/3 部，剩餘 ${remaining} 部可投資`;
        },
        getEffectDescription: (units = 1) => `購買 ${units} 部，花費 ${(units * 5000).toLocaleString()} 元，被動收入 +${(units * 800).toLocaleString()}/月，精力 -${units * 2}`
    },

    {
    id: "C03",
    name: "派對房間",
    description: "投資:$250,000/店 | 約12個月回本 | 被動收入 +$20,000/月 | 精力 -3\n使用效果:自己獲得7精力,其他玩家獲得2精力",
    image: "../cards/business/partyroom.png",
    cost: 500,
    type: "business",
    category: "创业",
    investmentCost: 250000,
    energyCost: 3,
    monthlyReturn: 20000,
    effect: (state, extraData) => {
        // 首先检查投资条件
        if (state.cash < 250000) {
            return `❌ 现金不足 250,000 元，无法开设派對房間。已支付的 500 元无法退还`;
        }
        
        if (state.energy < 3) {
            return `❌ 精力不足 3 点，无法开设派對房間`;
        }
        
        // 执行投资
        state.cash -= 250000;
        state.energy -= 3;
        state.passiveIncome += 20000;
        state.totalAssets += 250000;
        
        // 记录投资
        state.businessInvestments = state.businessInvestments || [];
        state.businessInvestments.push({
            id: "C03",
            name: "派對房間",
            cost: 250000,
            monthlyReturn: 20000,
            energyCost: 3
        });
        
        // 注意：给其他玩家增加精力的效果需要在服务器端额外处理
        // 这里返回投资结果，精力分配会由服务器单独处理
        
        return `✅ 開設派對房間成功！投資 250,000 元，被動收入 +20,000 元/月，精力消耗 3 点。派對歡樂氣氛讓大家精力充沛！`;
    },
    getEffectDescription: () => "投資 250,000 元，被動收入 +20,000/月，精力 -3。使用後自己獲得7精力,其他玩家獲得2精力"
    },

    {
        id: "C04",
        name: "外賣店",
        description: "首期投資:$100,000/店 | 約12個月回本 | 被動收入:+$8,000/月 | 精力 -3\n功能:可用 $50,000 兌換 10 精力（一次性）",
        image: "../cards/business/fooddelivery.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 100000,
        energyCost: 3,
        monthlyReturn: 8000,
        exchangeCost: 50000,
        exchangeEnergy: 10,
        effect: (state, action = 'invest', exchangeUnits = 1) => {
            if (action === 'exchange') {
                // 兑换精力功能
                const totalCost = exchangeUnits * 50000;
                const totalEnergy = exchangeUnits * 10;
                
                if (state.cash < totalCost) {
                    return `❌ 现金不足 ${totalCost.toLocaleString()} 元，无法兑换 ${totalEnergy} 精力`;
                }
                
                state.cash -= totalCost;
                state.energy = Math.min(state.maxEnergy, state.energy + totalEnergy);
                
                return `✅ 使用外賣店兌換功能！花費 ${totalCost.toLocaleString()} 元，獲得 ${totalEnergy} 精力！`;
            } else {
                // 投资开店功能
                if (state.cash < 100000) {
                    return `❌ 现金不足 100,000 元，无法开设外賣店`;
                }
                if (state.energy < 3) {
                    return `❌ 精力不足 3 点，无法开设外賣店`;
                }
                
                state.cash -= 100000;
                state.energy -= 3;
                state.passiveIncome += 8000;
                state.totalAssets += 100000;
                
                state.businessInvestments = state.businessInvestments || [];
                state.businessInvestments.push({
                    id: "C04",
                    name: "外賣店",
                    cost: 100000,
                    monthlyReturn: 8000,
                    energyCost: 3
                });
                
                return `✅ 開設外賣店成功！投資 100,000 元，被動收入 +8,000 元/月，精力消耗 3 点。`;
            }
        },
        getEffectDescription: () => "投資 100,000 元，被動收入 +8,000/月，精力 -3。另可用 $50,000 兌換 10 精力"
    },

    {
        id: "C05",
        name: "人工智能無人便利店",
        description: "首期投資:$200,000/店 | 約10個月回本 | 被動收入:+$20,000/月 | 精力:-4",
        image: "../cards/business/ai_store.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 200000,
        energyCost: 4,
        monthlyReturn: 20000,
        effect: (state) => {
            // 检查是否有生意成本折扣（从短片制作、平面设计等卡片获得的技能）
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 200000;
            if (discount > 0) {
                const saved = Math.round(200000 * discount / 100);
                finalCost = 200000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设人工智能無人便利店`;
            }
            
            if (state.energy < 4) {
                return `❌ 精力不足 4 点，无法开设人工智能無人便利店`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 4;
            state.passiveIncome += 20000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C05",
                name: "人工智能無人便利店",
                cost: finalCost,
                monthlyReturn: 20000,
                energyCost: 4,
                hasDiscount: discount > 0
            });
            
            // 获得科技技能（可选：未来可能有额外加成）
            state.hasTechSkill = true;
            
            return `✅ 開設人工智能無人便利店成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +20,000 元/月，精力消耗 4 点。AI 技術提升營運效率！`;
        },
        getEffectDescription: () => "投資 200,000 元，被動收入 +20,000/月，精力 -4"
    },

     {
        id: "C05",
        name: "人工智能無人便利店",
        description: "首期投資:$200,000/店 | 約10個月回本 | 被動收入:+$20,000/月 | 精力:-4",
        image: "../cards/business/ai_store.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 200000,
        energyCost: 4,
        monthlyReturn: 20000,
        effect: (state) => {
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 200000;
            if (discount > 0) {
                const saved = Math.round(200000 * discount / 100);
                finalCost = 200000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设人工智能無人便利店`;
            }
            
            if (state.energy < 4) {
                return `❌ 精力不足 4 点，无法开设人工智能無人便利店`;
            }
            
            state.cash -= finalCost;
            state.energy -= 4;
            state.passiveIncome += 20000;
            state.totalAssets += finalCost;
            
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C05",
                name: "人工智能無人便利店",
                cost: finalCost,
                monthlyReturn: 20000,
                energyCost: 4,
                hasDiscount: discount > 0
            });
            
            state.hasTechSkill = true;
            
            return `✅ 開設人工智能無人便利店成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +20,000 元/月，精力消耗 4 点。AI 技術提升營運效率！`;
        },
        getEffectDescription: () => "投資 200,000 元，被動收入 +20,000/月，精力 -4"
    },

    {
        id: "C06",
        name: "補習社",
        description: "首期投資:$300,000/店 | 約10個月回本 | 被動收入:+$30,000/月 | 精力:-4",
        image: "../cards/business/tutoring.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 300000,
        energyCost: 4,
        monthlyReturn: 30000,
        effect: (state) => {
            // 检查是否有生意成本折扣（从短片制作、平面设计等卡片获得的技能）
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 300000;
            if (discount > 0) {
                const saved = Math.round(300000 * discount / 100);
                finalCost = 300000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设補習社`;
            }
            
            if (state.energy < 4) {
                return `❌ 精力不足 4 点，无法开设補習社`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 4;
            state.passiveIncome += 30000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C06",
                name: "補習社",
                cost: finalCost,
                monthlyReturn: 30000,
                energyCost: 4,
                hasDiscount: discount > 0
            });
            
            // 获得教育技能（可选：未来可能有额外加成）
            state.hasEducationSkill = true;
            
            return `✅ 開設補習社成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +30,000 元/月，精力消耗 4 点。教育事業惠及莘莘學子！`;
        },
        getEffectDescription: () => "投資 300,000 元，被動收入 +30,000/月，精力 -4"
    },

    {
        id: "C07",
        name: "無人機快遞",
        description: "首期投資 $100,000/店 | 約10個月回本 | 被動收入 +$10,000/月 | 精力 -2\n功能:可抽取1張錦囊卡 (開發中)",
        image: "../cards/business/drone_delivery.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 100000,
        energyCost: 2,
        monthlyReturn: 10000,
        hasJinangCard: true,  // 标记有锦囊卡功能，供未来使用
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 100000;
            if (discount > 0) {
                const saved = Math.round(100000 * discount / 100);
                finalCost = 100000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设無人機快遞`;
            }
            
            if (state.energy < 2) {
                return `❌ 精力不足 2 点，无法开设無人機快遞`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 2;
            state.passiveIncome += 10000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C07",
                name: "無人機快遞",
                cost: finalCost,
                monthlyReturn: 10000,
                energyCost: 2,
                hasDiscount: discount > 0
            });
            
            // 获得科技物流技能
            state.hasDroneTech = true;
            
            let resultMessage = `✅ 開設無人機快遞成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +10,000 元/月，精力消耗 2 点。無人機科技提升物流效率！`;
            
            // 锦囊卡功能（预留，待未来实现）
            // resultMessage += `\n📦 你獲得抽取1張錦囊卡的機會！(功能開發中)`;
            
            return resultMessage;
        },
        getEffectDescription: () => "投資 100,000 元，被動收入 +10,000/月，精力 -2。可抽取錦囊卡 (開發中)"
    },

    {
        id: "C08",
        name: "Airbnb",
        description: "投資 $300,000 | 約15個月回本 | 被動收入 +$20,000/月 | 精力 -3",
        image: "../cards/business/airbnb.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 300000,
        energyCost: 3,
        monthlyReturn: 20000,
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 300000;
            if (discount > 0) {
                const saved = Math.round(300000 * discount / 100);
                finalCost = 300000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法投资 Airbnb`;
            }
            
            if (state.energy < 3) {
                return `❌ 精力不足 3 点，无法投资 Airbnb`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 3;
            state.passiveIncome += 20000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C08",
                name: "Airbnb",
                cost: finalCost,
                monthlyReturn: 20000,
                energyCost: 3,
                hasDiscount: discount > 0
            });
            
            // 获得旅游/房产科技技能
            state.hasTravelTech = true;
            
            return `✅ 投資 Airbnb 成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +20,000 元/月，精力消耗 3 点。共享經濟帶來穩定現金流！`;
        },
        getEffectDescription: () => "投資 300,000 元，被動收入 +20,000/月，精力 -3"
    },

    {
    id: "C09",
    name: "洗車店",
    description: "投資 $120,000 | 約12個月回本 | 被動收入 +$10,000/月 | 精力 -6\n功能：可抽取1張錦囊卡 (開發中)",
    image: "../cards/business/car_wash.png",
    cost: 500,
    type: "business",
    category: "创业",
    investmentCost: 120000,
    energyCost: 6,
    monthlyReturn: 10000,
    hasJinangCard: true,  // 标记有锦囊卡功能，供未来使用
    effect: (state) => {
        // 检查是否有生意成本折扣
        let discount = 0;
        let discountMessage = '';
        
        if (state.businessCostDiscount) {
            discount = state.businessCostDiscount;
        }
        if (state.hasBusinessDiscount) {
            discount = Math.max(discount, state.businessCostDiscount || 0);
        }
        
        let finalCost = 120000;
        if (discount > 0) {
            const saved = Math.round(120000 * discount / 100);
            finalCost = 120000 - saved;
            discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
        }
        
        if (state.cash < finalCost) {
            return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设洗車店`;
        }
        
        if (state.energy < 6) {
            return `❌ 精力不足 6 点，无法开设洗車店`;
        }
        
        // 执行投资
        state.cash -= finalCost;
        state.energy -= 6;
        state.passiveIncome += 10000;
        state.totalAssets += finalCost;
        
        // 记录投资
        state.businessInvestments = state.businessInvestments || [];
        state.businessInvestments.push({
            id: "C09",
            name: "洗車店",
            cost: finalCost,
            monthlyReturn: 10000,
            energyCost: 6,
            hasDiscount: discount > 0
        });
        
        // 获得汽车服务技能
        state.hasAutoServiceSkill = true;
        
        let resultMessage = `✅ 開設洗車店成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +10,000 元/月，精力消耗 6 点。`;
        
        // 锦囊卡功能（预留，待未来实现）
        // resultMessage += `\n📦 你獲得抽取1張錦囊卡的機會！(功能開發中)`;
        
        return resultMessage;
    },
    getEffectDescription: () => "投資 120,000 元，被動收入 +10,000/月，精力 -6。可抽取錦囊卡 (開發中)"
    },
    
    {
        id: "C10",
        name: "自動化企業",
        description: "投資 $280,000 | 約14個月回本 | 被動收入 +$20,000/月 | 精力 -6",
        image: "../cards/business/automation.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 280000,
        energyCost: 6,
        monthlyReturn: 20000,
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 280000;
            if (discount > 0) {
                const saved = Math.round(280000 * discount / 100);
                finalCost = 280000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法投资自動化企業`;
            }
            
            if (state.energy < 6) {
                return `❌ 精力不足 6 点，无法投资自動化企業`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 6;
            state.passiveIncome += 20000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C10",
                name: "自動化企業",
                cost: finalCost,
                monthlyReturn: 20000,
                energyCost: 6,
                hasDiscount: discount > 0
            });
            
            // 获得自动化/工业科技技能
            state.hasAutomationSkill = true;
            
            // 额外的自动化效益：未来其他生意的精力消耗可能减少
            if (!state.automationDiscount) {
                state.automationDiscount = 0;
            }
            state.automationDiscount += 5; // 自动化技术使未来生意精力消耗减少5%
            
            return `✅ 投資自動化企業成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +20,000 元/月，精力消耗 6 点。自動化技術提升企業效率，未來所有生意精力消耗 -5%！`;
        },
        getEffectDescription: () => "投資 280,000 元，被動收入 +20,000/月，精力 -6。獲得自動化技能,未來生意精力消耗 -5%"
    },

        {
        id: "C11",
        name: "連鎖健康產品店",
        description: "投資 $280,000 | 約14個月回本 | 被動收入 +$20,000/月 | 精力 -5",
        image: "../cards/business/health_store.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 280000,
        energyCost: 5,
        monthlyReturn: 20000,
        effect: (state) => {
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 280000;
            if (discount > 0) {
                const saved = Math.round(280000 * discount / 100);
                finalCost = 280000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设連鎖健康產品店`;
            }
            
            if (state.energy < 5) {
                return `❌ 精力不足 5 点，无法开设連鎖健康產品店`;
            }
            
            state.cash -= finalCost;
            state.energy -= 5;
            state.passiveIncome += 20000;
            state.totalAssets += finalCost;
            
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C11",
                name: "連鎖健康產品店",
                cost: finalCost,
                monthlyReturn: 20000,
                energyCost: 5,
                hasDiscount: discount > 0
            });
            
            state.hasHealthIndustrySkill = true;
            
            const luckBonus = 1;
            state.luck = Math.min(state.maxLuck, state.luck + luckBonus);
            
            return `✅ 開設連鎖健康產品店成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +20,000 元/月，精力消耗 5 点。健康產品深受歡迎，幸運值 +${luckBonus}！`;
        },
        getEffectDescription: () => "投資 280,000 元，被動收入 +20,000/月，精力 -5。幸運值 +1"
    },

    {
        id: "C12",
        name: "麵包店",
        description: "投資 $220,000 | 約13個月回本 | 被動收入 +$17,000/月 | 精力 -5\n功能：每月結算時獲得 +1 精力",
        image: "../cards/business/bakery.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 220000,
        energyCost: 5,
        monthlyReturn: 17000,
        energyBonusPerSettlement: 1,  // 每月结算时获得的精力
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 220000;
            if (discount > 0) {
                const saved = Math.round(220000 * discount / 100);
                finalCost = 220000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设麵包店`;
            }
            
            if (state.energy < 5) {
                return `❌ 精力不足 5 点，无法开设麵包店`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 5;
            state.passiveIncome += 17000;
            state.totalAssets += finalCost;
            
            // 记录投资（包含特殊属性）
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C12",
                name: "麵包店",
                cost: finalCost,
                monthlyReturn: 17000,
                energyCost: 5,
                energyBonusPerSettlement: 1,
                hasDiscount: discount > 0
            });
            
            // 获得餐饮业技能
            state.hasFoodIndustrySkill = true;
            
            // 标记面包店数量，用于结算时计算精力奖励
            state.bakeryCount = (state.bakeryCount || 0) + 1;
            
            return `✅ 開設麵包店成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +17,000 元/月，精力消耗 5 点。新鮮出爐的麵包香氣撲鼻，每月結算時獲得 +1 精力！`;
        },
        getEffectDescription: () => "投資 220,000 元，被動收入 +17,000/月，精力 -5。每月結算時獲得 +1 精力"
    },

    {
        id: "C13",
        name: "港式茶餐廳",
        description: "投資:$350,000 | 約14個月回本 | 被動收入:+$25,000/月 | 精力:-6",
        image: "../cards/business/tearestaurant.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 350000,
        energyCost: 6,
        effect: (state) => {
            if (state.cash >= 350000) {
                // 检查是否有生意成本折扣
                let discount = 0;
                if (state.businessCostDiscount) {
                    discount = state.businessCostDiscount;
                }
                if (state.hasBusinessDiscount) {
                    discount = Math.max(discount, state.businessCostDiscount || 0);
                }
                
                let finalCost = 350000;
                let discountMessage = '';
                if (discount > 0) {
                    const saved = Math.round(350000 * discount / 100);
                    finalCost = 350000 - saved;
                    discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
                }
                
                state.cash -= finalCost;
                state.passiveIncome += 25000;
                state.energy = Math.max(0, state.energy - 6);
                state.totalAssets += finalCost;
                
                // 记录投资
                state.businessInvestments = state.businessInvestments || [];
                state.businessInvestments.push({
                    id: "C13",
                    name: "港式茶餐廳",
                    cost: finalCost,
                    monthlyReturn: 25000,
                    energyCost: 6
                });
                
                return `✅ 開設港式茶餐廳成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +25,000 元/月，精力消耗 6 点`;
            } else {
                return `❌ 现金不足 350,000 元，无法开设港式茶餐廳。已支付的 500 元无法退还`;
            }
        },
        getEffectDescription: () => "投資 350,000 元，被動收入 +25,000/月，精力 -6"

        // 功能: 其他人到達出糧格子時,他要給你$2000。（预留backend，待未来实现）;
    },

    {
        id: "C14",
        name: "健身中心",
        description: "投資 $350,000 | 約17個月回本 | 被動收入 +$20,000/月 | 精力 -6",
        image: "../cards/business/fitness_center.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 350000,
        energyCost: 6,
        monthlyReturn: 20000,
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 350000;
            if (discount > 0) {
                const saved = Math.round(350000 * discount / 100);
                finalCost = 350000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设健身中心`;
            }
            
            if (state.energy < 6) {
                return `❌ 精力不足 6 点，无法开设健身中心`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 6;
            state.passiveIncome += 20000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C14",
                name: "健身中心",
                cost: finalCost,
                monthlyReturn: 20000,
                energyCost: 6,
                hasDiscount: discount > 0
            });
            
            // 获得健康/健身技能
            state.hasFitnessSkill = true;
            
            // 额外效益：最大精力值永久增加
            const maxEnergyBonus = 5;
            state.maxEnergy += maxEnergyBonus;
            state.energy += maxEnergyBonus; // 同时恢复等量精力
            
            return `✅ 開設健身中心成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +20,000 元/月，精力消耗 6 点。健身文化提升全民體質，最大精力值 +${maxEnergyBonus}！`;
        },
        getEffectDescription: () => "投資 350,000 元，被動收入 +20,000/月，精力 -6。最大精力值 +5"
    },

    {
        id: "C15",
        name: "培訓機構",
        description: "投資 $450,000 | 約15個月回本 | 被動收入 +$30,000/月 | 精力 -4",
        image: "../cards/business/training_center.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 450000,
        energyCost: 4,
        monthlyReturn: 30000,
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 450000;
            if (discount > 0) {
                const saved = Math.round(450000 * discount / 100);
                finalCost = 450000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设培訓機構`;
            }
            
            if (state.energy < 4) {
                return `❌ 精力不足 4 点，无法开设培訓機構`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 4;
            state.passiveIncome += 30000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C15",
                name: "培訓機構",
                cost: finalCost,
                monthlyReturn: 30000,
                energyCost: 4,
                hasDiscount: discount > 0
            });
            
            // 获得教育/培训技能
            state.hasEducationSkill = true;
            state.hasTrainingSkill = true;
            
            // 额外效益：幸运值提升（知识带来好运气）
            const luckBonus = 2;
            state.luck = Math.min(state.maxLuck, state.luck + luckBonus);
            
            // 额外效益：被动收入加成（教育培训提升整体能力）
            if (!state.passiveIncomeBonus) {
                state.passiveIncomeBonus = 0;
            }
            state.passiveIncomeBonus += 5; // 所有被动收入 +5%
            
            return `✅ 開設培訓機構成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +30,000 元/月，精力消耗 4 点。知識改變命運！幸運值 +${luckBonus}，所有被動收入 +5%！`;
        },
        getEffectDescription: () => "投資 450,000 元，被動收入 +30,000/月，精力 -4。幸運值 +2,所有被動收入 +5%"
    },

    {
        id: "C16",
        name: "家族辦公室",
        description: "投資 $400,000 | 約13個月回本 | 被動收入 +$30,000/月 | 精力 -4\n功能：可抵擋一次逆境卡 (開發中)",
        image: "../cards/business/family_office.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 400000,
        energyCost: 4,
        monthlyReturn: 30000,
        hasShieldFeature: true,  // 标记有抵御功能，供未来使用
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 400000;
            if (discount > 0) {
                const saved = Math.round(400000 * discount / 100);
                finalCost = 400000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设家族辦公室`;
            }
            
            if (state.energy < 4) {
                return `❌ 精力不足 4 点，无法开设家族辦公室`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 4;
            state.passiveIncome += 30000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C16",
                name: "家族辦公室",
                cost: finalCost,
                monthlyReturn: 30000,
                energyCost: 4,
                hasDiscount: discount > 0
            });
            
            // 获得金融/财富管理技能
            state.hasWealthManagementSkill = true;
            
            // 记录抵御逆境卡的次数（预留）
            state.adversityShield = (state.adversityShield || 0) + 1;
            
            let resultMessage = `✅ 開設家族辦公室成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +30,000 元/月，精力消耗 4 点。專業財富管理團隊為您服務！`;
            
            // 抵御逆境卡功能（预留，待未来实现）
            // resultMessage += `\n🛡️ 獲得 1 次抵擋逆境卡的機會！`;
            
            return resultMessage;
        },
        getEffectDescription: () => "投資 400,000 元，被動收入 +30,000/月，精力 -4。可抵擋一次逆境卡 (開發中)"
    },

    {
        id: "C17",
        name: "大學飯堂",
        description: "投資 $700,000 | 約14個月回本 | 被動收入 +$50,000/月 | 精力 -10\n功能:獲得6健康平均分配給其他玩家,抽2張卡 (開發中)",
        image: "../cards/business/university_canteen.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 700000,
        energyCost: 10,
        monthlyReturn: 50000,
        hasHealthShareFeature: true,  // 标记有健康分配功能
        hasDrawCardFeature: true,      // 标记有抽卡功能
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 700000;
            if (discount > 0) {
                const saved = Math.round(700000 * discount / 100);
                finalCost = 700000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设大學飯堂`;
            }
            
            if (state.energy < 10) {
                return `❌ 精力不足 10 点，无法开设大學飯堂`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 10;
            state.passiveIncome += 50000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C17",
                name: "大學飯堂",
                cost: finalCost,
                monthlyReturn: 50000,
                energyCost: 10,
                hasDiscount: discount > 0
            });
            
            // 获得餐饮/教育产业技能
            state.hasFoodServiceSkill = true;
            state.hasCampusBusinessSkill = true;
            
            let resultMessage = `✅ 開設大學飯堂成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +50,000 元/月，精力消耗 10 点。大學飯堂為校園注入活力！`;
            
            // 健康分配和抽卡功能（预留，待未来实现）
            // resultMessage += `\n💚 獲得 6 健康值並平均分配給其他玩家！(功能開發中)`;
            // resultMessage += `\n🎴 獲得 2 次抽卡機會！(功能開發中)`;
            
            return resultMessage;
        },
        getEffectDescription: () => "投資 700,000 元，被動收入 +50,000/月，精力 -10。獲得6健康平均分配給其他玩家,抽2張卡 (開發中)"
    },

    {
        id: "C18",
        name: "連鎖飲品店",
        description: "投資 $300,000 | 約15個月回本 | 被動收入 +$20,000/月 | 精力 -5",
        image: "../cards/business/drink_chain.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 300000,
        energyCost: 5,
        monthlyReturn: 20000,
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 300000;
            if (discount > 0) {
                const saved = Math.round(300000 * discount / 100);
                finalCost = 300000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设連鎖飲品店`;
            }
            
            if (state.energy < 5) {
                return `❌ 精力不足 5 点，无法开设連鎖飲品店`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 5;
            state.passiveIncome += 20000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C18",
                name: "連鎖飲品店",
                cost: finalCost,
                monthlyReturn: 20000,
                energyCost: 5,
                hasDiscount: discount > 0
            });
            
            // 获得餐饮业技能
            state.hasBeverageSkill = true;
            state.hasFoodIndustrySkill = true;
            
            // 额外效益：生意成本折扣永久增加（饮品店供应链优化）
            if (!state.businessCostDiscount) {
                state.businessCostDiscount = 0;
            }
            state.businessCostDiscount += 3;  // 永久增加3%生意成本折扣
            
            return `✅ 開設連鎖飲品店成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +20,000 元/月，精力消耗 5 点。飲品店人氣旺盛，生意成本折扣永久 +3%！`;
        },
        getEffectDescription: () => "投資 300,000 元，被動收入 +20,000/月，精力 -5。生意成本折扣永久 +3%"
    },

    {
        id: "C19",
        name: "AI智能手機程式",
        description: "投資 $150,000 | 約15個月回本 | 被動收入 +$10,000/月 | 精力 -5",
        image: "../cards/business/ai_app.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 150000,
        energyCost: 5,
        monthlyReturn: 10000,
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 150000;
            if (discount > 0) {
                const saved = Math.round(150000 * discount / 100);
                finalCost = 150000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开发AI智能手機程式`;
            }
            
            if (state.energy < 5) {
                return `❌ 精力不足 5 点，无法开发AI智能手機程式`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 5;
            state.passiveIncome += 10000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C19",
                name: "AI智能手機程式",
                cost: finalCost,
                monthlyReturn: 10000,
                energyCost: 5,
                hasDiscount: discount > 0
            });
            
            // 获得科技/AI技能
            state.hasAISkill = true;
            state.hasTechSkill = true;
            
            // 额外效益：幸运值提升（AI辅助决策）
            const luckBonus = 1;
            state.luck = Math.min(state.maxLuck, state.luck + luckBonus);
            
            // 额外效益：精力消耗永久减少（AI自动化辅助）
            if (!state.energyCostReduction) {
                state.energyCostReduction = 0;
            }
            state.energyCostReduction += 2;  // 所有行动精力消耗减少2%
            
            return `✅ 開發AI智能手機程式成功投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +10,000 元/月，精力消耗 5 点。AI技術提升效率,幸運值 +${luckBonus}，所有行動精力消耗 -2%！`;
        },
        getEffectDescription: () => "投資 150,000 元，被動收入 +10,000/月，精力 -5。幸運值 +1,所有行動精力消耗 -2%"
    },

    {
        id: "C20",
        name: "可持續發展碳中和釀酒廠",
        description: "投資 $190,000 | 約15.8個月回本 | 被動收入 +$12,000/月 | 精力 -6\n功能：環境保護、精力交易 (開發中)",
        image: "../cards/business/sustainable_brewery.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 190000,
        energyCost: 6,
        monthlyReturn: 12000,
        hasGreenFeature: true,      // 标记有环保功能
        hasEnergyTradeFeature: true, // 标记有精力交易功能
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 190000;
            if (discount > 0) {
                const saved = Math.round(190000 * discount / 100);
                finalCost = 190000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设可持續發展碳中和釀酒廠`;
            }
            
            if (state.energy < 6) {
                return `❌ 精力不足 6 点，无法开设可持續發展碳中和釀酒廠`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 6;
            state.passiveIncome += 12000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C20",
                name: "可持續發展碳中和釀酒廠",
                cost: finalCost,
                monthlyReturn: 12000,
                energyCost: 6,
                hasDiscount: discount > 0
            });
            
            // 获得环保/可持续发展技能
            state.hasGreenSkill = true;
            state.hasSustainableSkill = true;
            
            // 额外效益：幸运值提升（环保形象提升品牌价值）
            const luckBonus = 1;
            state.luck = Math.min(state.maxLuck, state.luck + luckBonus);
            
            // 额外效益：被动收入加成（环保产品溢价）
            if (!state.passiveIncomeBonus) {
                state.passiveIncomeBonus = 0;
            }
            state.passiveIncomeBonus += 3;  // 所有被动收入 +3%
            
            let resultMessage = `✅ 開設可持續發展碳中和釀酒廠成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +12,000 元/月，精力消耗 6 点。綠色企業形象提升品牌價值！幸運值 +${luckBonus}，所有被動收入 +3%！`;
            
            // 环保和精力交易功能（预留，待未来实现）
            // resultMessage += `\n🌱 環境保護：減少廢物產生，促進循環經濟！(功能開發中)`;
            // resultMessage += `\n💚 精力交易：可從銀行提取5精力向其他玩家出售！(功能開發中)`;
            
            return resultMessage;
        },
        getEffectDescription: () => "投資 190,000 元，被動收入 +12,000/月，精力 -6。幸運值 +1,所有被動收入 +3%。環境保護: 企業減少廢物產生,並促進循環經濟的實踐,精力交易功能 (開發中)"
    },

    {
        id: "C21",
        name: "可持續發展傷健咖啡店",
        description: "投資 $140,000 | 約15.6個月回本 | 被動收入 +$9,000/月 | 精力 -6\n功能:知識共享、精力交易 (開發中)",
        image: "../cards/business/inclusive_cafe.png",
        cost: 500,
        type: "business",
        category: "创业",
        investmentCost: 140000,
        energyCost: 6,
        monthlyReturn: 9000,
        hasEducationFeature: true,    // 标记有教育/知识共享功能
        hasEnergyTradeFeature: true,  // 标记有精力交易功能
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 140000;
            if (discount > 0) {
                const saved = Math.round(140000 * discount / 100);
                finalCost = 140000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法开设可持續發展傷健咖啡店`;
            }
            
            if (state.energy < 6) {
                return `❌ 精力不足 6 点，无法开设可持續發展傷健咖啡店`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.energy -= 6;
            state.passiveIncome += 9000;
            state.totalAssets += finalCost;
            
            // 记录投资
            state.businessInvestments = state.businessInvestments || [];
            state.businessInvestments.push({
                id: "C21",
                name: "可持續發展傷健咖啡店",
                cost: finalCost,
                monthlyReturn: 9000,
                energyCost: 6,
                hasDiscount: discount > 0
            });
            
            // 获得社会企业/共融技能
            state.hasSocialEnterpriseSkill = true;
            state.hasInclusiveSkill = true;
            
            // 额外效益：幸运值提升（社会企业形象提升品牌价值）
            const luckBonus = 1;
            state.luck = Math.min(state.maxLuck, state.luck + luckBonus);
            
            // 额外效益：最大精力值增加（正能量激励）
            const maxEnergyBonus = 3;
            state.maxEnergy += maxEnergyBonus;
            
            // 额外效益：精力恢复（共融环境带来的正向能量）
            state.energy += 2;
            state.energy = Math.min(state.maxEnergy, state.energy);
            
            let resultMessage = `✅ 開設可持續發展傷健咖啡店成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，被動收入 +9,000 元/月，精力消耗 6 点。社會企業形象提升品牌價值！幸運值 +${luckBonus}，最大精力值 +${maxEnergyBonus}，精力 +2！`;
            
            // 知识共享和精力交易功能（预留，待未来实现）
            // resultMessage += `\n📚 知識共享：分享創業知識和傷健共融理念！(功能開發中)`;
            // resultMessage += `\n💚 精力交易：可從銀行提取5精力向其他玩家出售！(功能開發中)`;
            
            return resultMessage;
        },
        getEffectDescription: () => "投資 140,000 元，被動收入 +9,000/月，精力 -6。幸運值 +1，最大精力值 +3。知識共享及精力交易功能 (開發中)"
    }
];

// ==================== 地产类机会卡 (Property) ====================
const propertyCards = [
    {
        id: "H01",
        name: "陳年唐樓",
        description: "物業總價 $700,000 | 租金收入 +$10,000/月\n功能:有機會獲得收購清拆賠償 (開發中)",
        image: "../cards/property/old_tenement.png",
        cost: 500,
        type: "property",
        category: "地产",
        investmentCost: 700000,
        energyCost: 0,
        monthlyReturn: 10000,
        hasDemolitionFeature: true,  // 标记有清拆赔偿功能，供未来使用
        demolitionCompensation: 5000000,  // 潜在赔偿金额 500万
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 700000;
            if (discount > 0) {
                const saved = Math.round(700000 * discount / 100);
                finalCost = 700000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法购买陳年唐樓`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.passiveIncome += 10000;
            state.totalAssets += finalCost;
            
            // 记录地产投资
            state.propertyInvestments = state.propertyInvestments || [];
            state.propertyInvestments.push({
                id: "H01",
                name: "陳年唐樓",
                cost: finalCost,
                monthlyReturn: 10000,
                hasDemolitionPotential: true,
                purchasePrice: finalCost
            });
            
            // 记录唐楼数量（用于未来清拆赔偿）
            state.oldTenementCount = (state.oldTenementCount || 0) + 1;
            
            // 获得地产投资技能
            state.hasPropertySkill = true;
            
            let resultMessage = `✅ 購買陳年唐樓成功！投資 ${finalCost.toLocaleString()} 元${discountMessage}，租金收入 +10,000 元/月。`;
            
            // 清拆赔偿功能（预留，待未来市场消息系统实现）
            // resultMessage += `\n🏗️ 有傳聞這幢唐樓將會收購清拆，未來可能獲得巨額賠償！(功能開發中)`;
            
            return resultMessage;
        },
        getEffectDescription: () => "投資 700,000 元，被動收入 +10,000/月。有機會獲得收購清拆賠償 (開發中)"
    },

    {
        id: "H02",
        name: "香港中西區住宅",
        description: "物業總價 $10,000,000 | 首期 $1,000,000 | 月供 $40,000/月 (30年) | 租金收入 $30,000/月\n功能：可自用或轉讓給其他玩家 (開發中)",
        image: "../cards/property/central_west_residence.png",
        cost: 500,
        type: "property",
        category: "地产",
        investmentCost: 1000000,  // 首期
        totalPrice: 10000000,     // 总价
        monthlyPayment: 40000,    // 每月供款
        monthlyReturn: 30000,     // 租金收入
        energyCost: 0,
        hasTransferFeature: true,  // 标记有转让功能，供未来使用
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 1000000;  // 首期
            if (discount > 0) {
                const saved = Math.round(1000000 * discount / 100);
                finalCost = 1000000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法支付首期购买香港中西區住宅`;
            }
            
            // 检查每月现金流是否足够支付月供
            const totalExp = state.livingExpense + state.tax + state.loanInterest + state.childExpense;
            const currentMonthlyCF = (state.salary + state.sideIncome + state.passiveIncome) - totalExp;
            
            if (currentMonthlyCF + state.cash < this.monthlyPayment) {
                return `⚠️ 警告：每月供款 ${this.monthlyPayment.toLocaleString()} 元，当前月现金流 ${currentMonthlyCF.toLocaleString()} 元，可能无法负担月供！是否继续？`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            
            // 记录贷款信息（按揭）
            const mortgageAmount = this.totalPrice - finalCost;  // 贷款金额 900万
            const monthlyPayment = this.monthlyPayment;
            
            // 添加每月固定支出（月供）
            state.mortgagePayment = (state.mortgagePayment || 0) + monthlyPayment;
            state.passiveIncome += this.monthlyReturn;
            state.totalAssets += this.totalPrice;
            
            // 记录地产投资
            state.propertyInvestments = state.propertyInvestments || [];
            state.propertyInvestments.push({
                id: "H02",
                name: "香港中西區住宅",
                totalPrice: this.totalPrice,
                downPayment: finalCost,
                mortgageAmount: mortgageAmount,
                monthlyPayment: monthlyPayment,
                monthlyReturn: this.monthlyReturn,
                hasDiscount: discount > 0,
                isTransferable: true  // 可转让
            });
            
            // 记录住宅数量
            state.residentialCount = (state.residentialCount || 0) + 1;
            state.hasPropertySkill = true;
            
            // 计算实际月现金流变化
            const netMonthlyChange = this.monthlyReturn - monthlyPayment;
            
            let resultMessage = `✅ 購買香港中西區住宅成功！\n`;
            resultMessage += `   💰 首期支付: ${finalCost.toLocaleString()} 元${discountMessage}\n`;
            resultMessage += `   🏦 貸款金額: ${mortgageAmount.toLocaleString()} 元\n`;
            resultMessage += `   📅 每月供款: ${monthlyPayment.toLocaleString()} 元\n`;
            resultMessage += `   🏠 租金收入: ${this.monthlyReturn.toLocaleString()} 元/月\n`;
            resultMessage += `   📊 每月淨收益: ${netMonthlyChange >= 0 ? '+' : ''}${netMonthlyChange.toLocaleString()} 元/月`;
            
            if (netMonthlyChange < 0) {
                resultMessage += `\n   ⚠️ 注意：租金不足以支付月供，每月需額外支出 ${Math.abs(netMonthlyChange).toLocaleString()} 元！`;
            }
            
            // 转让功能（预留，待未来实现）
            // resultMessage += `\n🔄 此物業可自用或轉讓給其他玩家！(功能開發中)`;
            
            return resultMessage;
        },
        getEffectDescription: () => "首期 1,000,000 元，總價 10,000,000 元，月供 40,000/月，租金收入 30,000/月。可自用或轉讓 (開發中)"
    },

    {
        id: "H03",
        name: "香港油尖旺區住宅",
        description: "物業總價 $7,000,000 | 首期 $700,000 | 月供 $30,000/月 (30年) | 租金收入 $18,000/月\n功能：可自用或轉讓給其他玩家 (開發中)",
        image: "../cards/property/yau_tsim_mong_residence.png",
        cost: 500,
        type: "property",
        category: "地产",
        investmentCost: 700000,   // 首期
        totalPrice: 7000000,      // 总价
        monthlyPayment: 30000,    // 每月供款
        monthlyReturn: 18000,     // 租金收入
        energyCost: 0,
        hasTransferFeature: true,  // 标记有转让功能，供未来使用
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 700000;  // 首期
            if (discount > 0) {
                const saved = Math.round(700000 * discount / 100);
                finalCost = 700000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法支付首期购买香港油尖旺區住宅`;
            }
            
            // 检查每月现金流是否足够支付月供
            const totalExp = state.livingExpense + state.tax + state.loanInterest + state.childExpense;
            const currentMonthlyCF = (state.salary + state.sideIncome + state.passiveIncome) - totalExp;
            
            if (currentMonthlyCF + state.cash < this.monthlyPayment) {
                return `⚠️ 警告：每月供款 ${this.monthlyPayment.toLocaleString()} 元，当前月现金流 ${currentMonthlyCF.toLocaleString()} 元，可能无法负担月供！是否繼續？`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            
            // 记录贷款信息（按揭）
            const mortgageAmount = this.totalPrice - finalCost;  // 贷款金额 630万
            const monthlyPayment = this.monthlyPayment;
            
            // 添加每月固定支出（月供）
            state.mortgagePayment = (state.mortgagePayment || 0) + monthlyPayment;
            state.passiveIncome += this.monthlyReturn;
            state.totalAssets += this.totalPrice;
            
            // 记录地产投资
            state.propertyInvestments = state.propertyInvestments || [];
            state.propertyInvestments.push({
                id: "H03",
                name: "香港油尖旺區住宅",
                totalPrice: this.totalPrice,
                downPayment: finalCost,
                mortgageAmount: mortgageAmount,
                monthlyPayment: monthlyPayment,
                monthlyReturn: this.monthlyReturn,
                hasDiscount: discount > 0,
                isTransferable: true
            });
            
            // 记录住宅数量
            state.residentialCount = (state.residentialCount || 0) + 1;
            state.hasPropertySkill = true;
            
            // 计算实际月现金流变化
            const netMonthlyChange = this.monthlyReturn - monthlyPayment;
            
            let resultMessage = `✅ 購買香港油尖旺區住宅成功！\n`;
            resultMessage += `   💰 首期支付: ${finalCost.toLocaleString()} 元${discountMessage}\n`;
            resultMessage += `   🏦 貸款金額: ${mortgageAmount.toLocaleString()} 元\n`;
            resultMessage += `   📅 每月供款: ${monthlyPayment.toLocaleString()} 元\n`;
            resultMessage += `   🏠 租金收入: ${this.monthlyReturn.toLocaleString()} 元/月\n`;
            resultMessage += `   📊 每月淨收益: ${netMonthlyChange >= 0 ? '+' : ''}${netMonthlyChange.toLocaleString()} 元/月`;
            
            if (netMonthlyChange < 0) {
                resultMessage += `\n   ⚠️ 注意：租金不足以支付月供，每月需額外支出 ${Math.abs(netMonthlyChange).toLocaleString()} 元！`;
            }
            
            // 转让功能（预留，待未来实现）
            // resultMessage += `\n🔄 此物業可自用或轉讓給其他玩家！(功能開發中)`;
            
            return resultMessage;
        },
        getEffectDescription: () => "首期 700,000 元，總價 7,000,000 元，月供 30,000/月，租金收入 18,000/月。可自用或轉讓 (開發中)"
    },

    {
        id: "H04",
        name: "香港新界北區住宅",
        description: "物業總價 $4,000,000 | 首期 $400,000 | 月供 $16,000/月 (30年) | 租金收入 $10,000/月\n功能：可自用或轉讓給其他玩家 (開發中)",
        image: "../cards/property/north_district_residence.png",
        cost: 500,
        type: "property",
        category: "地产",
        investmentCost: 400000,   // 首期
        totalPrice: 4000000,      // 总价
        monthlyPayment: 16000,    // 每月供款
        monthlyReturn: 10000,     // 租金收入
        energyCost: 0,
        hasTransferFeature: true,  // 标记有转让功能，供未来使用
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 400000;  // 首期
            if (discount > 0) {
                const saved = Math.round(400000 * discount / 100);
                finalCost = 400000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法支付首期购买香港新界北區住宅`;
            }
            
            // 检查每月现金流是否足够支付月供
            const totalExp = state.livingExpense + state.tax + state.loanInterest + state.childExpense;
            const currentMonthlyCF = (state.salary + state.sideIncome + state.passiveIncome) - totalExp;
            
            if (currentMonthlyCF + state.cash < this.monthlyPayment) {
                return `⚠️ 警告：每月供款 ${this.monthlyPayment.toLocaleString()} 元，当前月现金流 ${currentMonthlyCF.toLocaleString()} 元，可能无法负担月供！是否繼續？`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            
            // 记录贷款信息（按揭）
            const mortgageAmount = this.totalPrice - finalCost;  // 贷款金额 360万
            const monthlyPayment = this.monthlyPayment;
            
            // 添加每月固定支出（月供）
            state.mortgagePayment = (state.mortgagePayment || 0) + monthlyPayment;
            state.passiveIncome += this.monthlyReturn;
            state.totalAssets += this.totalPrice;
            
            // 记录地产投资
            state.propertyInvestments = state.propertyInvestments || [];
            state.propertyInvestments.push({
                id: "H04",
                name: "香港新界北區住宅",
                totalPrice: this.totalPrice,
                downPayment: finalCost,
                mortgageAmount: mortgageAmount,
                monthlyPayment: monthlyPayment,
                monthlyReturn: this.monthlyReturn,
                hasDiscount: discount > 0,
                isTransferable: true
            });
            
            // 记录住宅数量
            state.residentialCount = (state.residentialCount || 0) + 1;
            state.hasPropertySkill = true;
            
            // 计算实际月现金流变化
            const netMonthlyChange = this.monthlyReturn - monthlyPayment;
            
            let resultMessage = `✅ 購買香港新界北區住宅成功！\n`;
            resultMessage += `   💰 首期支付: ${finalCost.toLocaleString()} 元${discountMessage}\n`;
            resultMessage += `   🏦 貸款金額: ${mortgageAmount.toLocaleString()} 元\n`;
            resultMessage += `   📅 每月供款: ${monthlyPayment.toLocaleString()} 元\n`;
            resultMessage += `   🏠 租金收入: ${this.monthlyReturn.toLocaleString()} 元/月\n`;
            resultMessage += `   📊 每月淨收益: ${netMonthlyChange >= 0 ? '+' : ''}${netMonthlyChange.toLocaleString()} 元/月`;
            
            if (netMonthlyChange < 0) {
                resultMessage += `\n   ⚠️ 注意：租金不足以支付月供，每月需額外支出 ${Math.abs(netMonthlyChange).toLocaleString()} 元！`;
            }
            
            // 转让功能（预留，待未来实现）
            // resultMessage += `\n🔄 此物業可自用或轉讓給其他玩家！(功能開發中)`;
            
            return resultMessage;
        },
        getEffectDescription: () => "首期 400,000 元，總價 4,000,000 元，月供 16,000/月，租金收入 10,000/月。可自用或轉讓 (開發中)"
    },

    {
        id: "H05",
        name: "香港工廈",
        description: "物業總價 $700,000 | 租金收入 +$10,000/月\n功能：可自用或轉讓給其他玩家 (開發中)",
        image: "../cards/property/industrial_building.png",
        cost: 500,
        type: "property",
        category: "地产",
        investmentCost: 700000,   // 全款购买（工厦通常不需要按揭）
        totalPrice: 700000,
        monthlyReturn: 10000,
        energyCost: 0,
        hasTransferFeature: true,  // 标记有转让功能，供未来使用
        effect: (state) => {
            // 检查是否有生意成本折扣
            let discount = 0;
            let discountMessage = '';
            
            if (state.businessCostDiscount) {
                discount = state.businessCostDiscount;
            }
            if (state.hasBusinessDiscount) {
                discount = Math.max(discount, state.businessCostDiscount || 0);
            }
            
            let finalCost = 700000;
            if (discount > 0) {
                const saved = Math.round(700000 * discount / 100);
                finalCost = 700000 - saved;
                discountMessage = ` (生意成本折扣 ${discount}%，節省 ${saved.toLocaleString()} 元)`;
            }
            
            if (state.cash < finalCost) {
                return `❌ 现金不足 ${finalCost.toLocaleString()} 元，无法购买香港工廈`;
            }
            
            // 执行投资
            state.cash -= finalCost;
            state.passiveIncome += 10000;
            state.totalAssets += this.totalPrice;
            
            // 记录地产投资
            state.propertyInvestments = state.propertyInvestments || [];
            state.propertyInvestments.push({
                id: "H05",
                name: "香港工廈",
                totalPrice: this.totalPrice,
                purchasePrice: finalCost,
                monthlyReturn: 10000,
                hasDiscount: discount > 0,
                isTransferable: true,
                propertyType: "industrial"  // 工廈类型
            });
            
            // 记录工廈数量
            state.industrialBuildingCount = (state.industrialBuildingCount || 0) + 1;
            state.hasPropertySkill = true;
            
            // 计算回本时间
            const paybackMonths = Math.ceil(finalCost / 10000);
            const paybackYears = (paybackMonths / 12).toFixed(1);
            
            let resultMessage = `✅ 購買香港工廈成功！\n`;
            resultMessage += `   💰 總投資: ${finalCost.toLocaleString()} 元${discountMessage}\n`;
            resultMessage += `   🏭 物業類型: 工業大廈\n`;
            resultMessage += `   🏠 租金收入: 10,000 元/月\n`;
            resultMessage += `   📊 每月淨收益: +10,000 元/月\n`;
            resultMessage += `   ⏱️ 預計回本時間: 約 ${paybackMonths} 個月 (${paybackYears} 年)`;
            
            // 转让功能（预留，待未来实现）
            // resultMessage += `\n🔄 此物業可自用或轉讓給其他玩家！(功能開發中)`;
            
            return resultMessage;
        },
        getEffectDescription: () => "總價 700,000 元，租金收入 10,000/月。可自用或轉讓 (開發中)"
    },
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