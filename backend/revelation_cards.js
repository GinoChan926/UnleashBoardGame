// revelation_cards.js - 启示卡数据（市場消息卡 + 錦囊卡）
"use strict";

// ==================== Helper functions ====================

function _findStockHolders(room, stockPrices) {
    const result = [];
    for (const [ws, p] of room.players) {
        if (!p.gameState.stockHoldings) continue;

        const holdings = [];
        for (const [, holding] of Object.entries(p.gameState.stockHoldings)) {
            const code = holding.code;
            if (stockPrices[code] !== undefined) {
                const sellPrice = holding.shares * stockPrices[code];
                holdings.push({
                    stockCode: code,
                    stockName: holding.name || code,
                    shares: holding.shares,
                    price: stockPrices[code],
                    sellValue: sellPrice,
                    cost: holding.totalCost,
                    profit: sellPrice - holding.totalCost
                });
            }
        }

        if (holdings.length > 0) {
            result.push({
                playerId: p.playerId,
                ws,
                assetInfo: {
                    assetName: '股票',
                    holdings,
                    totalSellValue: holdings.reduce((s, h) => s + h.sellValue, 0),
                    totalProfit: holdings.reduce((s, h) => s + h.profit, 0)
                }
            });
        }
    }
    return result;
}

function _applyStockSales(room, participants, ctx, stockPrices, cardName, cardId) {
    const sold = [];
    let totalRevenue = 0;

    for (const [playerName, willSell] of Object.entries(participants)) {
        if (!willSell) continue;
        const p = ctx.findPlayerByName(playerName);
        if (!p || !p.gameState.stockHoldings) continue;

        let playerRevenue = 0;
        let playerProfit = 0;
        const soldStocks = [];

        for (const [stockId, holding] of Object.entries(p.gameState.stockHoldings)) {
            const code = holding.code;
            if (stockPrices[code] === undefined) continue;

            const price = stockPrices[code];
            const revenue = holding.shares * price;
            const profit = revenue - holding.totalCost;

            p.gameState.cash += revenue;
            playerRevenue += revenue;
            playerProfit += profit;
            soldStocks.push(`${code}(${holding.shares}股)`);
            delete p.gameState.stockHoldings[stockId];
        }

        if (playerRevenue > 0) {
            totalRevenue += playerRevenue;
            sold.push(`${playerName}: ${soldStocks.join(', ')} 獲利 $${playerProfit.toLocaleString()}`);
            ctx.addTransactionRecord(
                playerName,
                { name: cardName, type: "market_news", id: cardId },
                "市場消息出售", playerRevenue,
                `依市場消息出售股票，總收入 $${playerRevenue.toLocaleString()}`,
                null, p.gameState
            );
        }
    }

    if (sold.length === 0) return `📊 「${cardName}」發生，但無人選擇出售`;

    return `📊 ${cardName}！\n👥 出售玩家：\n${sold.join('\n')}\n💰 總成交金額：$${totalRevenue.toLocaleString()}`;
}

function _findPropertyHolders(room, targetPropertyId, marketPrice) {
    const result = [];
    for (const [ws, p] of room.players) {
        if (!p.gameState.propertyInvestments) continue;

        const prop = p.gameState.propertyInvestments.find(inv => inv.id === targetPropertyId);
        if (prop) {
            const mortgageAmount = prop.remainingBalance !== undefined ? prop.remainingBalance : (prop.mortgageAmount || 0);
            const profit = marketPrice - mortgageAmount;
            result.push({
                playerId: p.playerId,
                ws,
                assetInfo: {
                    assetName: prop.name,
                    marketPrice,
                    mortgageAmount,
                    profit
                }
            });
        }
    }
    return result;
}

function _applyPropertySales(room, participants, ctx, targetPropertyId, marketPrice, cardName, cardId) {
    const sold = [];
    let totalPaid = 0;

    for (const [playerName, willSell] of Object.entries(participants)) {
        if (!willSell) continue;
        const p = ctx.findPlayerByName(playerName);
        if (!p || !p.gameState.propertyInvestments) continue;

        const idx = p.gameState.propertyInvestments.findIndex(inv => inv.id === targetPropertyId);
        if (idx === -1) continue;

        const prop = p.gameState.propertyInvestments[idx];
        const mortgageAmount = prop.remainingBalance !== undefined ? prop.remainingBalance : (prop.mortgageAmount || 0);
        const profit = marketPrice - mortgageAmount;

        p.gameState.cash += profit;
        totalPaid += profit;

        // Remove monthly expenses
        if (prop.monthlyPayment && p.gameState.livingExpense) {
            p.gameState.livingExpense = Math.max(0, p.gameState.livingExpense - prop.monthlyPayment);
        }
        if (prop.monthlyReturn && p.gameState.passiveIncome) {
            p.gameState.passiveIncome = Math.max(0, p.gameState.passiveIncome - prop.monthlyReturn);
        }

        p.gameState.propertyInvestments.splice(idx, 1);
        // p.gameState.luck = Math.min(p.gameState.maxLuck || 10, p.gameState.luck + 1);

        sold.push(`${playerName}: ${prop.name} 淨收 $${profit.toLocaleString()}`);
        ctx.addTransactionRecord(
            playerName,
            { name: cardName, type: "market_news", id: cardId },
            "物業出售", profit,
            `出售 ${prop.name}，市價 $${marketPrice.toLocaleString()} - 按揭 $${mortgageAmount.toLocaleString()} = 淨收 $${profit.toLocaleString()}`,
            null, p.gameState
        );
    }

    if (sold.length === 0) return `🏠 「${cardName}」發生，但無人選擇出售`;

    return `🏠 ${cardName}！\n👥 出售玩家：\n${sold.join('\n')}\n💰 總成交金額：$${totalPaid.toLocaleString()}`;
}

// ==================== 市場消息卡 ====================
const marketNewsCards = [

    // ==================== M01 - Fund performance up ====================
    {
        id: "M01",
        name: "基金業績上升",
        description: "基金經理眼光獨到且經驗豐富，基金業績亮麗，增加每月利息發放。\n受影響的基金：F02 基金投資\n基金利息 +$500/月",
        image: "../cards/revelation/market/M01.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "automatic",
        effect: (state) => `📈 市場消息：基金業績上升`,
        applyAutomatic: (room, initiator, ctx) => {
            const investors = [];
            const bonus = 500;

            for (const [, p] of room.players) {
                const funds = (p.gameState.financeInvestments || [])
                    .filter(inv => inv.id === "F02");

                funds.forEach(fund => {
                    fund.monthlyReturn = (fund.monthlyReturn || 0) + bonus;
                    p.gameState.passiveIncome += bonus;
                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "基金業績上升", type: "market_news", id: "M01" },
                        "基金利息增加", 0,
                        `基金 F02 每月利息 +$${bonus}`,
                        null, p.gameState
                    );
                });

                if (funds.length > 0) investors.push(p.playerName);
            }

            if (investors.length === 0) return `📊 沒有玩家持有 F02，無人受益`;

            return `📈 基金業績上升！\n👥 受益玩家：${investors.join(', ')}\n💰 每月利息 +$${bonus}`;
        },
        getEffectDescription: () => "市場消息：持有 F02 的玩家每月利息 +$500"
    },

    // ==================== M02 - Fund performance down ====================
    {
        id: "M02",
        name: "基金業績下跌",
        description: "由於經濟環境逆轉，基金收益減少，縮減每月利息發放。\n受影響的基金：F02 基金投資\n基金利息 -$500/月",
        image: "../cards/revelation/market/M02.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "automatic",
        effect: (state) => `📉 市場消息：基金業績下跌`,
        applyAutomatic: (room, initiator, ctx) => {
            const affected = [];
            const decrease = 500;

            for (const [, p] of room.players) {
                const funds = (p.gameState.financeInvestments || [])
                    .filter(inv => inv.id === "F02");

                funds.forEach(fund => {
                    const oldReturn = fund.monthlyReturn || 0;
                    const newReturn = Math.max(0, oldReturn - decrease);
                    const actualDecrease = oldReturn - newReturn;
                    fund.monthlyReturn = newReturn;
                    p.gameState.passiveIncome -= actualDecrease;
                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "基金業績下跌", type: "market_news", id: "M02" },
                        "基金利息減少", 0,
                        `基金 F02 每月利息 -$${actualDecrease}`,
                        null, p.gameState
                    );
                });

                if (funds.length > 0) affected.push(p.playerName);
            }

            if (affected.length === 0) return `📊 沒有玩家持有 F02，無影響`;

            return `📉 基金業績下跌！\n👥 受影響玩家：${affected.join(', ')}\n💰 每月利息 -$${decrease}`;
        },
        getEffectDescription: () => "市場消息：持有 F02 的玩家每月利息 -$500"
    },

    // ==================== M03 - Loan rate down ====================
    {
        id: "M03",
        name: "貸款利率下降",
        description: "隨著美國減息，銀行下調貸款利率，所有有向銀行貸款的玩家，貸款利率下調至5%。\n所有有向銀行貸款的玩家，財務報表的銀行貸款利息支出減半。",
        image: "../cards/revelation/market/M03.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "automatic",
        effect: (state) => `🏦 市場消息：貸款利率下降`,
        applyAutomatic: (room, initiator, ctx) => {
            const affected = [];
            const newRate = 5;

            for (const [, p] of room.players) {
                if (p.gameState.loanAmount > 0) {
                    const oldInterest = p.gameState.loanInterest || 0;
                    const newInterest = Math.round(p.gameState.loanAmount * newRate / 100);
                    const saved = oldInterest - newInterest;
                    p.gameState.loanInterestRate = newRate;
                    p.gameState.loanInterest = newInterest;
                    affected.push(p.playerName);
                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "貸款利率下降", type: "market_news", id: "M03" },
                        "貸款利率調整", 0,
                        `利率降至 ${newRate}%，每月節省 $${saved}`,
                        null, p.gameState
                    );
                }
            }

            if (affected.length === 0) return `📊 沒有玩家有貸款，無影響`;

            return `🏦 貸款利率下降至 ${newRate}%！\n👥 受惠玩家：${affected.join(', ')}`;
        },
        getEffectDescription: () => "市場消息：所有有貸款的玩家利率降至 5%"
    },

    // ==================== M04 - Crypto scam ====================
    {
        id: "M04",
        name: "加密貨幣平台騙局",
        description: "由於加密貨幣平台無牌經營，導致無法兌換/行使加密貨幣權益。\n持有C01加密貨幣的玩家，血本無歸，並將所持有的加密貨幣從財務報表中刪除。",
        image: "../cards/revelation/market/M04.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "automatic",
        effect: (state) => `⚠️ 市場消息：加密貨幣平台騙局`,
        applyAutomatic: (room, initiator, ctx) => {
            const affected = [];
            let totalLoss = 0;

            for (const [, p] of room.players) {
                let playerLoss = 0;
                if (p.gameState.cryptoHoldings) {
                    for (const [cryptoId, holding] of Object.entries(p.gameState.cryptoHoldings)) {
                        if (cryptoId === 'F03' || cryptoId === 'F04' ||
                            holding.code === 'C01' ||
                            (holding.name && holding.name.includes('C01'))) {
                            playerLoss += holding.totalCost;
                            delete p.gameState.cryptoHoldings[cryptoId];
                        }
                    }
                }

                if (playerLoss > 0) {
                    p.gameState.totalAssets = Math.max(0, p.gameState.totalAssets - playerLoss);
                    // p.gameState.luck = Math.max(0, p.gameState.luck - 2);
                    totalLoss += playerLoss;
                    affected.push(p.playerName);
                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "加密貨幣平台騙局", type: "market_news", id: "M04" },
                        "加密貨幣損失", -playerLoss,
                        `C01 加密貨幣血本無歸，損失 $${playerLoss.toLocaleString()}`,
                        null, p.gameState
                    );
                }
            }

            if (affected.length === 0) return `📊 沒有玩家持有 C01，無影響`;

            return `⚠️ 加密貨幣平台騙局！\n👥 受害玩家：${affected.join(', ')}\n💰 總損失：$${totalLoss.toLocaleString()}\n🍀 幸運值 -2`;
        },
        getEffectDescription: () => "市場消息：持有 C01 加密貨幣者血本無歸"
    },

    // ==================== M05 - P2P performance up ====================
    {
        id: "M05",
        name: "P2P網上銀行業績提升",
        description: "由於平台投資項目營運良好，投資人獲得豐碩回報，收益增加。\nP2P N02 每股價值 +$10 元",
        image: "../cards/revelation/market/M05.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "automatic",
        effect: (state) => `📈 市場消息：P2P 業績提升`,
        applyAutomatic: (room, initiator, ctx) => {
            const affected = [];
            const priceIncrease = 10;

            for (const [, p] of room.players) {
                const p2ps = (p.gameState.financeInvestments || [])
                    .filter(inv => inv.id === "F05");

                p2ps.forEach(p2p => {
                    const valueIncrease = p2p.units * priceIncrease;
                    p2p.pricePerUnit = (p2p.pricePerUnit || 10) + priceIncrease;
                    p.gameState.totalAssets = (p.gameState.totalAssets || 0) + valueIncrease;
                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "P2P業績提升", type: "market_news", id: "M05" },
                        "P2P價值提升", valueIncrease,
                        `P2P N02 每股 +$${priceIncrease}，總資產 +$${valueIncrease.toLocaleString()}`,
                        null, p.gameState
                    );
                });

                if (p2ps.length > 0) affected.push(p.playerName);
            }

            if (affected.length === 0) return `📊 沒有玩家持有 P2P N02，無影響`;

            return `📈 P2P 業績提升！\n👥 受益玩家：${affected.join(', ')}\n💰 每股 +$${priceIncrease}`;
        },
        getEffectDescription: () => "市場消息：持有 P2P N02 者每股價值 +$10"
    },
    // ==================== M06 - Crypto boom (sell at 10x) ====================
    {
        id: "M06",
        name: "加密貨幣爆升",
        description: "由於世界首富高調增持加密貨幣，令不少投資者爭相增持，帶動加密貨幣價格爆升。\n持有C01加密貨幣的玩家可以原價的10倍出售。所有玩家都可以參與。",
        image: "../cards/revelation/market/M06.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "choice",
        actionLabel: "以 10 倍價格出售 C01 加密貨幣",
        effect: (state) => `🚀 市場消息：加密貨幣爆升`,

        findAffectedPlayers: (room) => {
            const result = [];
            for (const [ws, p] of room.players) {
                if (!p.gameState.cryptoHoldings) continue;

                let totalUnits = 0;
                let totalCost = 0;
                let sellValue = 0;

                for (const [cryptoId, holding] of Object.entries(p.gameState.cryptoHoldings)) {
                    if (cryptoId === 'F03' || cryptoId === 'F04' ||
                        holding.code === 'C01' ||
                        (holding.name && holding.name.includes('C01'))) {
                        totalUnits += holding.units;
                        totalCost += holding.totalCost;
                    }
                }

                if (totalUnits > 0) {
                    sellValue = totalCost * 10;
                    result.push({
                        playerId: p.playerId,
                        ws,
                        assetInfo: {
                            assetName: 'C01 加密貨幣',
                            units: totalUnits,
                            originalCost: totalCost,
                            sellValue,
                            profit: sellValue - totalCost
                        }
                    });
                }
            }
            return result;
        },

        applyChoices: (room, participants, ctx) => {
            const sold = [];
            let totalRevenue = 0;

            for (const [playerName, willSell] of Object.entries(participants)) {
                if (!willSell) continue;
                const p = ctx.findPlayerByName(playerName);
                if (!p || !p.gameState.cryptoHoldings) continue;

                let playerRevenue = 0;
                let playerProfit = 0;

                for (const [cryptoId, holding] of Object.entries(p.gameState.cryptoHoldings)) {
                    if (cryptoId === 'F03' || cryptoId === 'F04' ||
                        holding.code === 'C01' ||
                        (holding.name && holding.name.includes('C01'))) {
                        const sellPrice = holding.totalCost * 10;
                        const profit = sellPrice - holding.totalCost;
                        p.gameState.cash += sellPrice;
                        playerRevenue += sellPrice;
                        playerProfit += profit;
                        delete p.gameState.cryptoHoldings[cryptoId];
                    }
                }

                if (playerRevenue > 0) {
                    // p.gameState.luck = Math.min(p.gameState.maxLuck || 10, p.gameState.luck + 2);
                    totalRevenue += playerRevenue;
                    sold.push(`${playerName} 獲利 $${playerProfit.toLocaleString()}`);
                    ctx.addTransactionRecord(
                        playerName,
                        { name: "加密貨幣爆升出售", type: "market_news", id: "M06" },
                        "10倍出售", playerRevenue,
                        `以 10 倍價格出售 C01，獲利 $${playerProfit.toLocaleString()}`,
                        null, p.gameState
                    );
                }
            }

            if (sold.length === 0) return `🚀 加密貨幣爆升發生，但無人選擇出售`;

            return `🚀 加密貨幣爆升！\n👥 出售玩家：\n${sold.join('\n')}\n💰 總成交金額：$${totalRevenue.toLocaleString()}`;
        },

        getEffectDescription: () => "市場消息：C01 加密貨幣可以 10 倍價格出售"
    },

    // ==================== M07 - P2P bankrupt ====================
    {
        id: "M07",
        name: "P2P網上銀行破產",
        description: "由於平台違規操作，私自挪用資金，導致無法兌付到期資金而爆雷。\n擁有P2P的玩家，血本無歸，並將該P2P從財務報表中刪除。",
        image: "../cards/revelation/market/M07.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "automatic",
        effect: (state) => `⚠️ 市場消息：P2P 破產`,
        applyAutomatic: (room, initiator, ctx) => {
            const affected = [];
            let totalLoss = 0;

            for (const [, p] of room.players) {
                if (!p.gameState.financeInvestments) continue;
                const idx = p.gameState.financeInvestments.findIndex(inv => inv.id === "F05" || inv.id === "N02");
                if (idx === -1) continue;

                const p2p = p.gameState.financeInvestments[idx];
                const loss = p2p.totalCost || (p2p.units * p2p.pricePerUnit);
                p.gameState.financeInvestments.splice(idx, 1);
                p.gameState.totalAssets = Math.max(0, (p.gameState.totalAssets || 0) - loss);
                // p.gameState.luck = Math.max(0, p.gameState.luck - 2);
                totalLoss += loss;
                affected.push(p.playerName);
                ctx.addTransactionRecord(
                    p.playerName,
                    { name: "P2P破產", type: "market_news", id: "M07" },
                    "P2P損失", -loss,
                    `P2P N02 血本無歸，損失 $${loss.toLocaleString()}`,
                    null, p.gameState
                );
            }

            if (affected.length === 0) return `📊 沒有玩家持有 P2P，無影響`;

            return `⚠️ P2P 網上銀行破產！\n👥 受害玩家：${affected.join(', ')}\n💰 總損失：$${totalLoss.toLocaleString()}\n🍀 幸運值 -2`;
        },
        getEffectDescription: () => "市場消息：所有 P2P N02 持有者血本無歸"
    },
    // ==================== M08 - Great miracle day (stocks at 3x) ====================
    {
        id: "M08",
        name: "大奇蹟日",
        description: "所有股票都可以原買入價3倍出售。所有玩家都可以參與。",
        image: "../cards/revelation/market/M08.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "choice",
        actionLabel: "以 3 倍價格出售所有股票",
        effect: (state) => `🌟 市場消息：大奇蹟日`,

        findAffectedPlayers: (room) => {
            const result = [];
            for (const [ws, p] of room.players) {
                if (!p.gameState.stockHoldings) continue;

                let totalShares = 0;
                let totalCost = 0;

                for (const [, holding] of Object.entries(p.gameState.stockHoldings)) {
                    totalShares += holding.shares;
                    totalCost += holding.totalCost;
                }

                if (totalShares > 0) {
                    const sellValue = totalCost * 3;
                    result.push({
                        playerId: p.playerId,
                        ws,
                        assetInfo: {
                            assetName: '所有股票',
                            units: totalShares,
                            originalCost: totalCost,
                            sellValue,
                            profit: sellValue - totalCost
                        }
                    });
                }
            }
            return result;
        },

        applyChoices: (room, participants, ctx) => {
            const sold = [];
            let totalRevenue = 0;

            for (const [playerName, willSell] of Object.entries(participants)) {
                if (!willSell) continue;
                const p = ctx.findPlayerByName(playerName);
                if (!p || !p.gameState.stockHoldings) continue;

                let playerRevenue = 0;
                let playerProfit = 0;

                for (const [, holding] of Object.entries(p.gameState.stockHoldings)) {
                    const sellPrice = holding.totalCost * 3;
                    playerRevenue += sellPrice;
                    playerProfit += (sellPrice - holding.totalCost);
                }

                p.gameState.cash += playerRevenue;
                p.gameState.stockHoldings = {};

                // p.gameState.luck = Math.min(p.gameState.maxLuck || 10, p.gameState.luck + 3);
                p.gameState.energy = Math.min(p.gameState.maxEnergy, p.gameState.energy + 2);
                totalRevenue += playerRevenue;
                sold.push(`${playerName} 獲利 $${playerProfit.toLocaleString()}`);
                ctx.addTransactionRecord(
                    playerName,
                    { name: "大奇蹟日出售股票", type: "market_news", id: "M08" },
                    "3倍出售所有股票", playerRevenue,
                    `所有股票以 3 倍價格出售，獲利 $${playerProfit.toLocaleString()}`,
                    null, p.gameState
                );
            }

            if (sold.length === 0) return `🌟 大奇蹟日發生，但無人選擇出售`;

            return `🌟 大奇蹟日！\n👥 出售玩家：\n${sold.join('\n')}\n💰 總成交金額：$${totalRevenue.toLocaleString()}\n🍀 幸運值 +3, 精力 +2`;
        },

        getEffectDescription: () => "市場消息：所有股票可以 3 倍價格出售"
    },


    // ==================== M09 - Stock black swan ====================
    {
        id: "M09",
        name: "股市黑天鵝",
        description: "所有持有股票的玩家，股數減半 (不用支付現金，股票總成本不變)。此時不能交易。\n股票代碼：所有股票\n每兩股合併成一股",
        image: "../cards/revelation/market/M09.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "automatic",
        effect: (state) => `🦢 市場消息：股市黑天鵝`,
        applyAutomatic: (room, initiator, ctx) => {
            const affected = [];

            for (const [, p] of room.players) {
                if (!p.gameState.stockHoldings) continue;
                let hasStock = false;

                for (const [stockId, holding] of Object.entries(p.gameState.stockHoldings)) {
                    const oldShares = holding.shares;
                    const newShares = Math.floor(oldShares / 2);

                    if (newShares === 0) {
                        delete p.gameState.stockHoldings[stockId];
                    } else {
                        holding.shares = newShares;
                        holding.purchasePrice = holding.purchasePrice * 2;
                    }
                    hasStock = true;
                }

                if (hasStock) {
                    // p.gameState.luck = Math.max(0, p.gameState.luck - 1);
                    affected.push(p.playerName);
                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "股市黑天鵝", type: "market_news", id: "M09" },
                        "股票合併", 0,
                        `所有股數減半，總成本不變`,
                        null, p.gameState
                    );
                }
            }

            if (affected.length === 0) return `📊 沒有玩家持有股票，無影響`;

            return `🦢 股市黑天鵝！\n👥 受影響玩家：${affected.join(', ')}\n📊 所有股票股數減半\n🍀 幸運值 -1`;
        },
        getEffectDescription: () => "市場消息：所有股票股數減半"
    },

    // ==================== M10 - Stock news set A (B01=10, A01=2, H01=10) ====================
    {
        id: "M10",
        name: "金融市場動盪 (熊市)",
        description: "股票行情：B01 金融公司 $10 | A01 科技公司 $2 | H01 健康食品公司 $10\n所有持有股票的玩家可以選擇出售與否（不消耗精力）",
        image: "../cards/revelation/market/M10.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "choice",
        actionLabel: "以市場價格出售股票",
        stockPrices: { B01: 10, A01: 2, H01: 10 },
        effect: (state) => `📊 市場消息：金融市場動盪`,

        findAffectedPlayers: function(room) {
            return _findStockHolders(room, this.stockPrices);
        },
        applyChoices: function(room, participants, ctx) {
            return _applyStockSales(room, participants, ctx, this.stockPrices, this.name, this.id);
        },
        getEffectDescription: () => "市場消息：B01=$10, A01=$2, H01=$10"
    },
    // ==================== M11 - Stock news set B (B01=30, A01=60, H01=4) ====================
    {
        id: "M11",
        name: "金融市場動盪 (混合)",
        description: "股票行情：B01 金融公司 $30 | A01 科技公司 $60 | H01 健康食品公司 $4\n所有持有股票的玩家可以選擇出售與否（不消耗精力）",
        image: "../cards/revelation/market/M11.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "choice",
        actionLabel: "以市場價格出售股票",
        stockPrices: { B01: 30, A01: 60, H01: 4 },
        effect: (state) => `📊 市場消息：金融市場動盪`,

        findAffectedPlayers: function(room) {
            return _findStockHolders(room, this.stockPrices);
        },
        applyChoices: function(room, participants, ctx) {
            return _applyStockSales(room, participants, ctx, this.stockPrices, this.name, this.id);
        },
        getEffectDescription: () => "市場消息：B01=$30, A01=$60, H01=$4"
    },

    // ==================== M12 - Stock news set C (B01=5, A01=100, H01=6) ====================
    {
        id: "M12",
        name: "金融市場動盪 (科技牛市)",
        description: "股票行情：B01 金融公司 $5 | A01 科技公司 $100 | H01 健康食品公司 $6\n所有持有股票的玩家可以選擇出售與否（不消耗精力）",
        image: "../cards/revelation/market/M12.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "choice",
        actionLabel: "以市場價格出售股票",
        stockPrices: { B01: 5, A01: 100, H01: 6 },
        effect: (state) => `📊 市場消息：金融市場動盪`,

        findAffectedPlayers: function(room) {
            return _findStockHolders(room, this.stockPrices);
        },
        applyChoices: function(room, participants, ctx) {
            return _applyStockSales(room, participants, ctx, this.stockPrices, this.name, this.id);
        },
        getEffectDescription: () => "市場消息：B01=$5, A01=$100, H01=$6"
    },

    // ==================== M13 - Stock news set D (B01=15, A01=20, H01=8) ====================
    {
        id: "M13",
        name: "金融市場動盪 (平穩)",
        description: "股票行情：B01 金融公司 $15 | A01 科技公司 $20 | H01 健康食品公司 $8\n所有持有股票的玩家可以選擇出售與否（不消耗精力）",
        image: "../cards/revelation/market/M13.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "choice",
        actionLabel: "以市場價格出售股票",
        stockPrices: { B01: 15, A01: 20, H01: 8 },
        effect: (state) => `📊 市場消息：金融市場動盪`,

        findAffectedPlayers: function(room) {
            return _findStockHolders(room, this.stockPrices);
        },
        applyChoices: function(room, participants, ctx) {
            return _applyStockSales(room, participants, ctx, this.stockPrices, this.name, this.id);
        },
        getEffectDescription: () => "市場消息：B01=$15, A01=$20, H01=$8"
    },


    // ==================== M14 - Property demolition compensation ====================
    {
        id: "M14",
        name: "房屋遷拆",
        description: "市建局收購遷拆香港陳年唐樓\n持有 H01 陳年唐樓的玩家得到遷拆補償費用：$500 萬，沒有玩家有 H01 則無事發生。",
        image: "../cards/revelation/market/M14.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "automatic",
        effect: (state) => `🏗️ 市場消息：房屋遷拆`,
        applyAutomatic: (room, initiator, ctx) => {
            const affected = [];
            const compensation = 5000000;

            for (const [, p] of room.players) {
                if (!p.gameState.propertyInvestments) continue;
                const idx = p.gameState.propertyInvestments.findIndex(inv => inv.id === "H01");
                if (idx === -1) continue;

                p.gameState.propertyInvestments.splice(idx, 1);
                p.gameState.cash += compensation;
                p.gameState.totalAssets = (p.gameState.totalAssets || 0) + compensation;
                affected.push(p.playerName);
                ctx.addTransactionRecord(
                    p.playerName,
                    { name: "房屋遷拆補償", type: "market_news", id: "M14" },
                    "房屋收購補償", compensation,
                    `陳年唐樓被收購，獲補償 $${compensation.toLocaleString()}`,
                    null, p.gameState
                );
            }

            if (affected.length === 0) return `📊 沒有玩家持有 H01，無事發生`;

            return `🏗️ 房屋遷拆！\n👥 受惠玩家：${affected.join(', ')}\n💰 每人補償：$${compensation.toLocaleString()}`;
        },
        getEffectDescription: () => "市場消息：持有 H01 陳年唐樓的玩家獲得 $500 萬補償"
    },

    // ==================== M15 - Buy H02 residential at $12M ====================
    {
        id: "M15",
        name: "求購香港中西區住宅物業",
        description: "市場現在需要以下物業。所有玩家都可以參與。\n物業要求：香港中西區住宅物業\n市場價格：$12,000,000/套\n玩家收益 = 市場價格 - 按揭貸款",
        image: "../cards/revelation/market/M15.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "choice",
        actionLabel: "以 $12,000,000 出售",
        marketPrice: 12000000,
        targetPropertyId: "H02",
        effect: (state) => `🏠 市場消息：求購中西區住宅`,

        findAffectedPlayers: function(room) {
            return _findPropertyHolders(room, this.targetPropertyId, this.marketPrice);
        },
        applyChoices: function(room, participants, ctx) {
            return _applyPropertySales(room, participants, ctx, this.targetPropertyId, this.marketPrice, this.name, this.id);
        },
        getEffectDescription: () => "市場消息：H02 香港中西區住宅可以 $12,000,000 出售"
    },
    // ==================== M16 - Buy H03 residential at $8M ====================
    {
        id: "M16",
        name: "求購香港油尖旺區住宅物業",
        description: "市場現在需要以下物業。所有玩家都可以參與。\n物業要求：香港油尖旺區住宅物業（H03）\n市場價格：$8,000,000/套\n玩家收益 = 市場價格 - 按揭貸款",
        image: "../cards/revelation/market/M16.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "choice",
        actionLabel: "以 $8,000,000 出售",
        marketPrice: 8000000,
        targetPropertyId: "H03",
        effect: (state) => `🏠 市場消息：求購油尖旺住宅`,

        findAffectedPlayers: function(room) {
            return _findPropertyHolders(room, this.targetPropertyId, this.marketPrice);
        },
        applyChoices: function(room, participants, ctx) {
            return _applyPropertySales(room, participants, ctx, this.targetPropertyId, this.marketPrice, this.name, this.id);
        },
        getEffectDescription: () => "市場消息：H03 香港油尖旺區住宅可以 $8,000,000 出售"
    },

    // ==================== M17 - Buy H04 residential at $5M ====================
    {
        id: "M17",
        name: "求購香港北區住宅物業",
        description: "市場現在需要以下物業。所有玩家都可以參與。\n物業要求：香港新界北區住宅物業（H04）\n市場價格：$5,000,000/套\n玩家收益 = 市場價格 - 按揭貸款",
        image: "../cards/revelation/market/M17.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "choice",
        actionLabel: "以 $5,000,000 出售",
        marketPrice: 5000000,
        targetPropertyId: "H04",
        effect: (state) => `🏠 市場消息：求購新界北住宅`,

        findAffectedPlayers: function(room) {
            return _findPropertyHolders(room, this.targetPropertyId, this.marketPrice);
        },
        applyChoices: function(room, participants, ctx) {
            return _applyPropertySales(room, participants, ctx, this.targetPropertyId, this.marketPrice, this.name, this.id);
        },
        getEffectDescription: () => "市場消息：H04 香港新界北區住宅可以 $5,000,000 出售"
    },
    // ==================== M18 - Industrial building rent up ====================
    {
        id: "M18",
        name: "求租香港工廈",
        description: "市場現在需要以下物業。所有玩家都可以參與。\n物業要求：香港工廈（H05）\n市場租金：$30,000\n每月被動收入增加 $6,000",
        image: "../cards/revelation/market/M18.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "automatic",
        effect: (state) => `🏭 市場消息：工廈租金上漲`,
        applyAutomatic: (room, initiator, ctx) => {
            const affected = [];
            const passiveIncrease = 6000;

            for (const [, p] of room.players) {
                if (!p.gameState.propertyInvestments) continue;
                const props = p.gameState.propertyInvestments.filter(inv => inv.id === "H05");

                props.forEach(prop => {
                    prop.monthlyReturn = (prop.monthlyReturn || 0) + passiveIncrease;
                    p.gameState.passiveIncome = (p.gameState.passiveIncome || 0) + passiveIncrease;
                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "求租香港工廈", type: "market_news", id: "M18" },
                        "租金上漲", 0,
                        `工廈每月被動收入 +$${passiveIncrease}`,
                        null, p.gameState
                    );
                });

                if (props.length > 0) affected.push(p.playerName);
            }

            if (affected.length === 0) return `📊 沒有玩家持有 H05，無影響`;

            return `🏭 求租香港工廈！\n👥 受益玩家：${affected.join(', ')}\n💰 每月被動收入 +$${passiveIncrease}`;
        },
        getEffectDescription: () => "市場消息：持有 H05 香港工廈的玩家每月被動收入 +$6,000"
    },

    // ==================== M19 - Residential price down ====================
    {
        id: "M19",
        name: "香港住宅物業價格下跌",
        description: "由於很多港人移民海外及內地，住屋需求減少，香港樓價回落，租金下跌。\n所有持有香港住宅物業的玩家，物業總價下跌10%，每月被動收入減少$500。",
        image: "../cards/revelation/market/M19.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        scope: "team",
        marketNewsMode: "automatic",
        effect: (state) => `📉 市場消息：住宅物業價格下跌`,
        applyAutomatic: (room, initiator, ctx) => {
            const affected = [];
            const decreasePercent = 10;
            const passiveDecrease = 500;
            const residentialIds = ["H01", "H02", "H03", "H04"];

            for (const [, p] of room.players) {
                if (!p.gameState.propertyInvestments) continue;
                let totalValueLoss = 0;
                let totalPassiveLoss = 0;
                let hasResidential = false;

                p.gameState.propertyInvestments.forEach(prop => {
                    if (!residentialIds.includes(prop.id)) return;
                    hasResidential = true;

                    const valueLoss = Math.floor((prop.totalPrice || 0) * decreasePercent / 100);
                    prop.totalPrice -= valueLoss;
                    totalValueLoss += valueLoss;

                    const oldReturn = prop.monthlyReturn || 0;
                    const newReturn = Math.max(0, oldReturn - passiveDecrease);
                    const passiveLoss = oldReturn - newReturn;
                    prop.monthlyReturn = newReturn;
                    totalPassiveLoss += passiveLoss;
                });

                if (hasResidential) {
                    p.gameState.totalAssets = Math.max(0, (p.gameState.totalAssets || 0) - totalValueLoss);
                    p.gameState.passiveIncome = Math.max(0, (p.gameState.passiveIncome || 0) - totalPassiveLoss);
                    // p.gameState.luck = Math.max(0, p.gameState.luck - 1);
                    affected.push(p.playerName);
                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "住宅物業價格下跌", type: "market_news", id: "M19" },
                        "物業貶值", -totalValueLoss,
                        `住宅物業下跌 ${decreasePercent}%，被動收入 -$${totalPassiveLoss}/月`,
                        null, p.gameState
                    );
                }
            }

            if (affected.length === 0) return `📊 沒有玩家持有住宅物業，無影響`;

            return `📉 住宅物業價格下跌！\n👥 受影響玩家：${affected.join(', ')}\n📊 物業總價 -${decreasePercent}%\n💰 每月被動收入 -$${passiveDecrease}/物業\n🍀 幸運值 -1`;
        },
        getEffectDescription: () => "市場消息：所有住宅物業總價 -10%，每月被動收入 -$500"
    },
];

// ==================== 錦囊卡 ====================
const tipCards = [
    // ==================== IN01 - Team: Health Investment ====================
    {
        id: "IN01",
        name: "健康投資",
        description: "你體驗到健康是無法用金錢衡量的，健康是1，其他都是0，開始投資自己的健康。\n自願選擇是否投資。\n健康投資支出：$1,000/月\n精力：+1/月",
        image: "../cards/revelation/tip/IN01.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "team",
        effect: (state, room, initiator, ws, roomId, playerChoices) => {
            const monthlyCost = 1000;
            const energyBonus = 1;

            const investors = [];
            const insufficientCash = [];
            const declined = [];

            for (const [playerName, willInvest] of Object.entries(playerChoices || {})) {
                let playerObj = null;
                for (const [, p] of room.players) {
                    if (p.playerId === playerName || p.playerName === playerName) {
                        playerObj = p;
                        break;
                    }
                }
                if (!playerObj) continue;

                if (!willInvest) {
                    declined.push(playerObj.playerName);
                    continue;
                }

                const pState = playerObj.gameState;

                if (pState.cash < monthlyCost) {
                    insufficientCash.push(playerObj.playerName);
                    continue;
                }

                // ✅ Activate recurring investment
                pState.healthInvestment = {
                    active: true,
                    monthlyCost,
                    energyBonus,
                    startTurn: pState.totalTurns || 0
                };

                // ✅ Add to livingExpense so UI shows the cost immediately
                pState.livingExpense = (pState.livingExpense || 0) + monthlyCost;

                // ✅ Give immediate energy bonus for joining
                // (monthly deduction starts at next settlement via processHealthInvestment)
                pState.energy = Math.min(
                    pState.maxEnergy || 100,
                    (pState.energy || 0) + energyBonus
                );

                investors.push(playerObj.playerName);
            }

            if (investors.length === 0 && insufficientCash.length === 0) {
                return `💪 團隊錦囊「健康投資」完成，但沒有玩家參與投資`;
            }

            let msg = `💪 團隊錦囊「健康投資」完成！\n`;

            if (investors.length > 0) {
                msg += `👥 投資玩家：${investors.join(', ')}\n` +
                    `💰 每月支出：$${monthlyCost.toLocaleString()}\n` +
                    `⚡ 即時獲得：精力 +${energyBonus}\n` +
                    `📅 下次結算起每月自動扣款`;
            }

            if (insufficientCash.length > 0) {
                msg += `\n⚠️ 現金不足未能參與：${insufficientCash.join(', ')}`;
            }

            if (declined.length > 0) {
                msg += `\n❌ 選擇不參與：${declined.join(', ')}`;
            }

            return msg;
        },
        getEffectDescription: () => "團隊錦囊：每位玩家可自願投資 $1,000/月，獲得每月精力 +1"
    },

    // ==================== IN02 - Team: Personal Brand ====================
    {
        id: "IN02",
        name: "個人品牌建立",
        description: "你意識到形象管理非常重要，開始學習如何打造自己的形象，結交到人脈質量也越來越好，信譽越來越高。\n自願選擇是否學習\n學習投資：$10,000\n精力：-3\n向銀行借貸月息變為永久2%\n貸款額度提高至月現金流40倍",
        image: "../cards/revelation/tip/IN02.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "team",
        effect: (state, room, initiator, ws, roomId, playerChoices) => {
            const investmentCost = 10000;
            const energyCost = 3;

            const learners = [];
            const insufficient = [];

            for (const [playerName, willLearn] of Object.entries(playerChoices || {})) {
                if (!willLearn) continue;

                let playerObj = null;
                for (const [, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        break;
                    }
                }
                if (!playerObj) continue;

                if (playerObj.gameState.cash < investmentCost ||
                    playerObj.gameState.energy < energyCost) {
                    insufficient.push(playerName);
                    continue;
                }

                playerObj.gameState.cash -= investmentCost;
                playerObj.gameState.energy -= energyCost;
                playerObj.gameState.permanentLoanRate = 2;
                playerObj.gameState.loanMultiplier = 40;
                // playerObj.gameState.sideIncomeBonus =
                    // (playerObj.gameState.sideIncomeBonus || 0) + 0.1;
                if (playerObj.gameState.loanAmount > 0) {
                    playerObj.gameState.loanInterest = Math.round(
                        playerObj.gameState.loanAmount * 0.02
                    );

                    // Also update loanRecord if it exists
                    if (playerObj.loanRecord) {
                        playerObj.loanRecord.interestRate = 0.02;
                    }
                }

                learners.push(playerName);
            }

            if (learners.length === 0 && insufficient.length === 0) {
                return `✨ 團隊錦囊「個人品牌建立」完成，但沒有玩家參與學習`;
            }

            let msg = `✨ 團隊錦囊「個人品牌建立」完成！\n`;
            if (learners.length > 0) {
                msg += `👥 學習玩家：${learners.join(', ')}\n💰 投資：$${investmentCost.toLocaleString()}\n⚡ 精力 -${energyCost}\n🏦 貸款利率降至 2%\n💵 貸款額度升至月現金流 40 倍\n🤝 人脈加成 +10%`;
            }
            if (insufficient.length > 0) {
                msg += `\n⚠️ 條件不足未能學習：${insufficient.join(', ')}`;
            }
            return msg;
        },
        getEffectDescription: () => "團隊錦囊：投資 $10,000 精力 -3，貸款利率永久 2%，貸款額度升至月現金流 40 倍"
    },

    // ==================== IN03 - Team: Slow Life (dice for each) ====================
    {
        id: "IN03",
        name: "慢活",
        description: "每人擲一次骰子\n點數\n1: 抽1逆境卡\n2: 損失$2,000\n3-4: 抽1機會卡\n5-6: 獲得2精力 或 $2,000 (可選擇)",
        image: "../cards/revelation/tip/IN03.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "team",
        effect: (state, room, initiator, ws, roomId, playerChoices) => {
            const results = [];
            const CARD_TYPES = global.CARD_TYPES;
            const broadcast  = global._broadcastToRoom;
            const rooms      = global._rooms;

            // Load card pools
            let hardshipCards = [];
            try { hardshipCards = require('./hardship_cards.js').hardshipCards || []; }
            catch (e) { console.log('⚠️ 無法載入逆境卡'); }

            for (const [playerName, participate] of Object.entries(playerChoices || {})) {
                if (!participate) continue;

                let playerObj = null;
                let playerWs  = null;
                for (const [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs  = pWs;
                        break;
                    }
                }
                if (!playerObj || !playerWs) continue;

                const diceRoll = Math.floor(Math.random() * 6) + 1;
                const diceFaces = { 1:'⚀',2:'⚁',3:'⚂',4:'⚃',5:'⚄',6:'⚅' };
                const face = diceFaces[diceRoll];

                if (playerWs && playerWs.readyState === 1) {
                    playerWs.send(JSON.stringify({
                        type: 'notification',
                        message: `🎲 慢活：系統為你擲出 ${face} ${diceRoll} 點！`
                    }));
                }
                let outcome = '';

                if (diceRoll === 1) {
                    // ✅ Draw real hardship card (free — hardship cards have no cost anyway)
                    if (hardshipCards.length > 0) {
                        setTimeout(() => {
                            const { drawHardshipCard } = require('./server/cards/HardshipCardHandler.js');
                            drawHardshipCard(playerWs, playerObj.gameState, roomId, playerObj,
                                hardshipCards, broadcast, rooms);
                        }, 500);
                        outcome = '抽 1 張逆境卡';
                    } else {
                        outcome = '抽逆境卡失敗（無資料）';
                    }

                } else if (diceRoll === 2) {
                    const loss = Math.min(2000, playerObj.gameState.cash);
                    playerObj.gameState.cash -= loss;
                    outcome = `損失 $${loss.toLocaleString()}`;

                } else if (diceRoll === 3 || diceRoll === 4) {
                    // ✅ Draw real opportunity card (FREE — mark skipPurchaseCost)
                    if (CARD_TYPES) {
                        // Mark that when this player picks a card type, purchase should be free
                        if (!room.pendingIN03FreeCards) room.pendingIN03FreeCards = new Map();
                        room.pendingIN03FreeCards.set(playerWs, { source: 'IN03', timestamp: Date.now() });

                        setTimeout(() => {
                            const { showCardTypeSelection } = require('./server/cards/OpportunityCardHandler.js');
                            showCardTypeSelection(playerWs, playerObj.gameState, roomId, playerObj,
                                CARD_TYPES, room);
                        }, 500);
                        outcome = '抽 1 張機會卡 (免費)';
                    } else {
                        outcome = '抽機會卡失敗（無資料）';
                    }

                } else {
                    // ✅ Dice 5-6 — prompt player to choose reward
                    setTimeout(() => {
                        if (!room.pendingIN03Choices) room.pendingIN03Choices = new Map();
                        room.pendingIN03Choices.set(playerWs, {
                            playerId: playerObj.playerId,
                            playerName,
                            diceRoll,
                            timestamp: Date.now()
                        });

                        playerWs.send(JSON.stringify({
                            type: 'in03_reward_choice',
                            cardName: '慢活',
                            diceRoll,
                            options: [
                                { id: 'cash',   label: '💰 獲得 $2,000',    description: '現金 +$2,000' },
                                { id: 'energy', label: '⚡ 獲得 2 精力',     description: '精力 +2' }
                            ]
                        }));
                    }, 500);

                    outcome = `擲到 ${diceRoll}，等待選擇獎勵`;
                }

                results.push(`${playerName} 擲 ${diceRoll} → ${outcome}`);
            }

            if (results.length === 0) {
                return `🧘 團隊錦囊「慢活」完成，但沒有玩家參與`;
            }

            return `🧘 團隊錦囊「慢活」結果：\n${results.join('\n')}`;
        },
        getEffectDescription: () => "團隊錦囊：每人擲骰子獲得隨機獎勵或懲罰"
    },
    // ==================== IN04 - Personal: Health Supplement ====================
    {
        id: "IN04",
        name: "身體健康最重要",
        description: "身體健康最重要，每月支出一筆錢購買保健品，讓自己身體越來越好。\n健康投資支出：$2,000/月\n精力：+1/月",
        image: "../cards/revelation/tip/IN04.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        effect: (state) => {
            const monthlyCost = 2000;
            const energyBonus = 1;

            if (state.healthSupplementInvestment?.active) {
                return `⚠️ 你已經在進行保健品投資了`;
            }

            if (state.cash < monthlyCost) {
                return `❌ 現金不足 $${monthlyCost.toLocaleString()}，無法開始保健品投資`;
            }

            state.cash -= monthlyCost;
            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);
            state.healthSupplementInvestment = {
                active: true,
                monthlyCost,
                energyBonus,
                startTurn: state.totalTurns || 0
            };

            return `💊 開始保健品投資成功！\n💰 每月支出：$${monthlyCost.toLocaleString()}\n⚡ 每月獲得：精力 +${energyBonus}\n💚 身體健康是最大的財富！`;
        },
        getEffectDescription: () => "個人錦囊：每月支出 $2,000，獲得每月精力 +1"
    },

    // ==================== IN05 - Personal: Release Emotions ====================
    {
        id: "IN05",
        name: "釋放情緒",
        description: "學會釋放情緒，放下不必要的煩惱，心情輕鬆愉快。\n投資：$5,000\n獲得2個幸運星",
        image: "../cards/revelation/tip/IN05.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        effect: (state) => {
            const investmentCost = 5000;
            const luckyStarReward = 2;

            if (state.cash < investmentCost) {
                return `❌ 現金不足 $${investmentCost.toLocaleString()}，無法學習釋放情緒`;
            }

            state.cash -= investmentCost;
            state.ability = (state.ability || 0) + 1;
            state.luckyStarCount = (state.luckyStarCount || 0) + luckyStarReward;
            // state.energy = Math.min(state.maxEnergy, state.energy + 2);
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 1);

            return `🧘 學習釋放情緒成功！\n💰 能力 +1\n花費：$${investmentCost.toLocaleString()}\n⭐ 獲得：${luckyStarReward} 個幸運星\n📝 目前幸運星：${state.luckyStarCount}`;
        },
        getEffectDescription: () => "個人錦囊：投資 $5,000，獲得 2 個幸運星，能力 +1"
    },

    // ==================== IN06 - Personal: Social Network ====================
    {
        id: "IN06",
        name: "社交人脈",
        description: "你了解社交人脈的重要。\n精力 +3",
        image: "../cards/revelation/tip/IN06.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        effect: (state) => {
            const energyBonus = 3;

            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);
            // state.sideIncomeBonus = Math.min(
                // 0.5,
                // (state.sideIncomeBonus || 0) + 0.05
            // );
            // state.luck = Math.min(state.maxLuck || 10, state.luck + 1);

            return `🤝 學習社交人脈成功！\n⚡ 精力 +${energyBonus}`;
        },
        getEffectDescription: () => "個人錦囊：精力 +3"
    },
    // ==================== IN07 - Personal: Face Fear ====================
    {
        id: "IN07",
        name: "面對恐懼",
        description: "越抗拒越揮之不去，只要勇敢面對恐懼才能遇見新契機。\n抽取一張逆境卡\n精力 +2",
        image: "../cards/revelation/tip/IN07.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        hasHardshipDrawFeature: true,
        scope: "personal",
        effect: (state) => {
            const energyBonus = 2;

            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);
            // state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);

            // Mark for hardship card draw (handled by RevelationCardSystem or handler)
            state._pendingHardshipDraw = true;

            return `🦁 勇敢面對恐懼！\n⚡ 精力 +${energyBonus}\n📜 將抽取一張逆境卡\n💪 勇氣可嘉，繼續保持！`;
        },
        getEffectDescription: () => "個人錦囊：精力 +2，抽取一張逆境卡"
    },
    // ==================== IN08 - Personal: Gratitude ====================
    {
        id: "IN08",
        name: "凡事感恩",
        description: "凡事感恩，奇蹟誕生。\n獲得兩個一次使用的四葉草",
        image: "../cards/revelation/tip/IN08.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        effect: (state) => {
            const cloverReward = 2;

            state.fourLeafClover = (state.fourLeafClover || 0) + cloverReward;
            // state.energy = Math.min(state.maxEnergy, state.energy + 2);
            // state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);

            return `🙏 凡事感恩成功！\n🍀 獲得：${cloverReward} 個四葉草\n✨ 感恩的心帶來奇蹟！\n📝 目前四葉草：${state.fourLeafClover}`;
        },
        getEffectDescription: () => "個人錦囊：獲得 2 個四葉草"
    },

    // ==================== IN09 - Personal: Stay Vigilant ====================
    {
        id: "IN09",
        name: "保持警惕",
        description: "保持警惕不輕信網上信息。\n錦囊：取消你下一張騙子卡。",
        image: "../cards/revelation/tip/IN09.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        effect: (state) => {
            state.lierCardCancellation = (state.lierCardCancellation || 0) + 1;
            // state.energy = Math.min(state.maxEnergy, state.energy + 2);
            // state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);

            return `🛡️ 保持警惕成功！\n🛡️ 獲得：1 次取消騙子卡的機會\n📝 下一張騙子卡將被自動取消！\n🔒 遠離詐騙，保護財產！`;
        },
        getEffectDescription: () => "個人錦囊：取消下一張騙子卡"
    },

    // ==================== IN10 - Personal: Report Scam ====================
    {
        id: "IN10",
        name: "舉報騙案",
        description: "友人被網上騙財，你發現阻止並及時舉報。\n下次其他玩家有關騙子卡，你可以幫他防範一次，遊戲完結時，計算作一次義工。",
        image: "../cards/revelation/tip/IN10.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        effect: (state) => {
            state.volunteerCount  = (state.volunteerCount  || 0) + 1;
            state.volunteerShield = (state.volunteerShield || 0) + 1;

            // -1 for reporting effort, +2 satisfaction = net +1
            // state.energy = Math.min(state.maxEnergy, state.energy + 1);
            // state.luck   = Math.min(state.maxLuck || 10, state.luck + 2);

            return `👮 舉報騙案成功！\n👮 獲得：1 次義工資格\n📝 目前義工次數：${state.volunteerShield}\n🤝 可幫助其他玩家防範騙子卡！`;
        },
        getEffectDescription: () => "個人錦囊：獲得 1 次義工資格"
    },

    // ==================== IN11 - Personal: Grace in Adversity ====================
    {
        id: "IN11",
        name: "逆境恩典",
        description: "即使身處逆境，仍是滿有恩典。\n抽取一張逆境卡\n加3精力",
        image: "../cards/revelation/tip/IN11.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        hasHardshipDrawFeature: true,   // ✅ flag for RevelationCardSystem to trigger draw
        effect: (state) => {
            const energyBonus = 3;
            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);

            // ✅ Mark for hardship draw — RevelationCardSystem handles the actual draw
            state._pendingHardshipDraw = true;

            return `✨ 逆境恩典成功！\n⚡ 精力 +${energyBonus}\n📜 即將抽取一張逆境卡！\n💪 即使身處逆境，仍有滿滿恩典！`;
        },
        getEffectDescription: () => "個人錦囊：精力 +3，抽取一張逆境卡"
    },

    // ==================== IN12 - Personal: Time Management ====================
    {
        id: "IN12",
        name: "時間管理",
        description: "每人每日都有24小時可以運用，視乎你如何安排。\n多進行一回合",
        image: "../cards/revelation/tip/IN12.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        effect: (state) => {
            state.extraTurn = true;
            // state.energy = Math.min(state.maxEnergy, state.energy + 1);

            return `⏰ 時間管理生效！\n✨ 獲得一個額外回合！\n📌 結束目前回合後，你將立即進行下一回合！`;
        },
        getEffectDescription: () => "個人錦囊：獲得一個額外回合"
    },

    // ==================== IN13 - Personal: Gift Chance Card ====================
    // Uses feature flag pattern - actual logic in GiftCardSystem.js
    {
        id: "IN13",
        name: "贈人玫瑰",
        description: "贈人玫瑰，手有餘香。\n購買一張機會卡送給其他玩家\n精力 +2",
        image: "../cards/revelation/tip/IN13.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        hasGiftChanceCardFeature: true,   // ← triggers gift flow
        effect: (state) => {
            // Placeholder - actual gift flow handled by RevelationCardSystem
            state.energy = Math.min(state.maxEnergy, state.energy + 2);
            // state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);
            return `🌹 贈人玫瑰！精力 +2，請選擇要贈送的玩家`;
        },
        getEffectDescription: () => "個人錦囊：贈送機會卡給其他玩家，精力 +2"
    },

    // ==================== IN14 - Personal: Move 1-3 Random ====================
    {
        id: "IN14",
        name: "黑馬思維 - 微動力",
        description: "找到你的微動力：能夠找到激發前進的微小動力。\n前進1-3格執行格子行動。",
        image: "../cards/revelation/tip/IN14.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        hasMoveForwardFeature: true,   // ← triggers movement flow
        moveMode: 'random',             // ← random 1-3 steps
        effect: (state) => {
            // state.energy = Math.max(0, state.energy - 1);
            return `🐴 黑馬思維！將隨機前進 1-3 格`;
        },
        getEffectDescription: () => "個人錦囊：隨機前進 1-3 格並執行格子效果"
    },

    // ==================== IN15 - Personal: Move 1-3 Choose ====================
    {
        id: "IN15",
        name: "黑馬思維 - 清晰選擇",
        description: "清楚你的選擇：他們能夠清楚地選擇適合自己的環境。\n行動自選1-3格",
        image: "../cards/revelation/tip/IN15.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        hasMoveForwardFeature: true,
        moveMode: 'choose',             // ← player picks 1-3
        effect: (state) => {
            // state.energy = Math.max(0, state.energy - 1);
            // state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);
            return `🐴 黑馬思維！請選擇要前進的格數 (1-3)`;
        },
        getEffectDescription: () => "個人錦囊：自選前進 1-3 格並執行格子效果"
    },
    // ==================== IN16 - Personal: Move to Income Tile ====================
    {
        id: "IN16",
        name: "黑馬思維 - 收入策略",
        description: "了解自己的人生策略，能應對挑戰，擁有豐盛人生。\n前往月收入格",
        image: "../cards/revelation/tip/IN16.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        hasMoveForwardFeature: true,
        moveMode: 'income',             // ← auto move to nearest income tile
        effect: (state) => {
            // state.energy = Math.max(0, state.energy - 1);
            // state.luck   = Math.min(state.maxLuck || 10, state.luck + 2);
            return `🐴 黑馬思維！將前往最近的月收入格`;
        },
        getEffectDescription: () => "個人錦囊：前往最近的月收入格"
    },

    // ==================== IN17 - Personal: Move to Nearest Player ====================
    {
        id: "IN17",
        name: "黑馬思維 - 突破限制",
        description: "突破：他們能夠突破標準化限制，實現自我。\n前進到最近一位玩家格子（經過結算日有收入）",
        image: "../cards/revelation/tip/IN17.png",
        cost: 500,
        type: "tip",
        category: "錦囊卡",
        scope: "personal",
        hasMoveForwardFeature: true,
        moveMode: 'nearest_player',    // ← auto move to nearest player
        effect: (state) => {
            // state.energy = Math.max(0, state.energy - 1);
            // state.luck   = Math.min(state.maxLuck || 10, state.luck + 2);
            return `🐴 黑馬思維！將前進到最近玩家的位置`;
        },
        getEffectDescription: () => "個人錦囊：前進到最近玩家格子"
    }
];

// 合并所有启示卡
const revelationCards = {
    market_news: marketNewsCards,
    tip: tipCards,
    all: [...marketNewsCards, ...tipCards]
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { marketNewsCards, tipCards, revelationCards };
}

