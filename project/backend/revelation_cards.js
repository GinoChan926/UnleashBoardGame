// revelation_cards.js - 启示卡数据（市场消息卡 + 锦囊卡）

// ==================== 市场消息卡 ====================
const marketNewsCards = [

    {
        id: "M01",
        name: "基金業績上升",
        description: "基金經理眼光獨到且經驗豐富，基金業績亮麗，增加每月利息發放。\n受影響的基金：F02 基金投資\n基金利息 +$500/月",
        image: "../cards/revelation/market/M01.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            
            // 遍历所有玩家
            for (let [pWs, p] of room.players) {
                // 检查玩家是否持有 F02 基金
                const hasFundF02 = p.gameState.financeInvestments && 
                                  p.gameState.financeInvestments.some(inv => inv.id === "F02");
                
                if (hasFundF02) {
                    // 找到 F02 基金投资
                    const fundInvestment = p.gameState.financeInvestments.find(inv => inv.id === "F02");
                    const oldMonthlyReturn = fundInvestment.monthlyReturn;
                    const newMonthlyReturn = oldMonthlyReturn + 500;
                    
                    // 更新基金的每月回报
                    fundInvestment.monthlyReturn = newMonthlyReturn;
                    fundInvestment.interestIncreased = true;
                    fundInvestment.increaseAmount = 500;
                    
                    // 更新被动收入
                    p.gameState.passiveIncome += 500;
                    affectedPlayers.push(p.playerName);
                    changes.push(`${p.playerName}: $${oldMonthlyReturn}/月 → $${newMonthlyReturn}/月`);
                    
                    // 记录交易
                    addTransactionRecord(
                        p.playerName,
                        { name: "基金業績上升", type: "market_news", id: "M01" },
                        "基金利息增加",
                        0,
                        `基金 F02 每月利息增加 $500 元！原利息 $${oldMonthlyReturn}/月 → 新利息 $${newMonthlyReturn}/月`,
                        null,
                        p.gameState
                    );
                    
                    // 通知该玩家
                    if (pWs && pWs !== ws) {
                        pWs.send(JSON.stringify({
                            type: 'notification',
                            message: `📈 市場消息：${currentPlayer.playerName} 觸發了「基金業績上升」！你持有的基金 F02 每月利息增加 $500 元！`
                        }));
                        pWs.send(JSON.stringify({
                            type: 'state_updated',
                            playerId: p.playerId,
                            gameState: p.gameState
                        }));
                    }
                }
            }
            
            if (affectedPlayers.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `📊 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有基金 F02，無法受益。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有基金 F02，無法受益。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `📈 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n受影響玩家：${affectedPlayers.join(', ')}\n基金 F02 每月利息增加 $500 元！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `📈 市場消息「${card.name}」生效！${affectedPlayers.length} 位玩家受益。`
            }));
            
            return `📈 基金業績上升成功！\n` +
                   `👥 受影響玩家：${affectedPlayers.join(', ')}\n` +
                   `💰 基金 F02 每月利息 +$500/月\n` +
                   `📊 變化詳情：\n${changes.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：所有玩家持有的基金 F02 每月利息 +$500/月"
    },

    {
        id: "M02",
        name: "基金業績下跌",
        description: "由於經濟環境逆轉，基金收益減少，縮減每月利息發放。\n受影響的基金：F02 基金投資\n基金利息 -$500/月",
        image: "../cards/revelation/market/M02.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            
            // 遍历所有玩家
            for (let [pWs, p] of room.players) {
                // 检查玩家是否持有 F02 基金
                const hasFundF02 = p.gameState.financeInvestments && 
                                  p.gameState.financeInvestments.some(inv => inv.id === "F02");
                
                if (hasFundF02) {
                    // 找到 F02 基金投资
                    const fundInvestment = p.gameState.financeInvestments.find(inv => inv.id === "F02");
                    const oldMonthlyReturn = fundInvestment.monthlyReturn;
                    const newMonthlyReturn = Math.max(0, oldMonthlyReturn - 500); // 最低为0，不会变成负数
                    const actualDecrease = oldMonthlyReturn - newMonthlyReturn;
                    
                    // 更新基金的每月回报
                    fundInvestment.monthlyReturn = newMonthlyReturn;
                    fundInvestment.interestDecreased = true;
                    fundInvestment.decreaseAmount = actualDecrease;
                    
                    // 更新被动收入
                    p.gameState.passiveIncome -= actualDecrease;
                    affectedPlayers.push(p.playerName);
                    changes.push(`${p.playerName}: $${oldMonthlyReturn}/月 → $${newMonthlyReturn}/月 (減少 $${actualDecrease})`);
                    
                    // 记录交易
                    addTransactionRecord(
                        p.playerName,
                        { name: "基金業績下跌", type: "market_news", id: "M02" },
                        "基金利息減少",
                        0,
                        `基金 F02 每月利息減少 $${actualDecrease} 元！原利息 $${oldMonthlyReturn}/月 → 新利息 $${newMonthlyReturn}/月`,
                        null,
                        p.gameState
                    );
                    
                    // 通知该玩家
                    if (pWs && pWs !== ws) {
                        pWs.send(JSON.stringify({
                            type: 'notification',
                            message: `📉 市場消息：${currentPlayer.playerName} 觸發了「基金業績下跌」！你持有的基金 F02 每月利息減少 $${actualDecrease} 元！`
                        }));
                        pWs.send(JSON.stringify({
                            type: 'state_updated',
                            playerId: p.playerId,
                            gameState: p.gameState
                        }));
                    }
                }
            }
            
            if (affectedPlayers.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `📊 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有基金 F02，沒有影響。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有基金 F02，沒有影響。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `📉 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n受影響玩家：${affectedPlayers.join(', ')}\n基金 F02 每月利息減少 $500 元！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `📉 市場消息「${card.name}」生效！${affectedPlayers.length} 位玩家受到影響。`
            }));
            
            return `📉 基金業績下跌！\n` +
                   `👥 受影響玩家：${affectedPlayers.join(', ')}\n` +
                   `💰 基金 F02 每月利息 -$500/月\n` +
                   `📊 變化詳情：\n${changes.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：所有玩家持有的基金 F02 每月利息 -$500/月"
    },

    {
        id: "M03",
        name: "貸款利率下降",
        description: "隨著美國減息，銀行下調貸款利率，所有有向銀行貸款的玩家，貸款利率下調至5%。\n所有有向銀行貸款的玩家，財務報表的銀行貸款利息支出減半。",
        image: "../cards/revelation/market/M03.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            const newInterestRate = 5; // 新利率 5%
            
            // 遍历所有玩家
            for (let [pWs, p] of room.players) {
                // 检查玩家是否有贷款
                if (p.gameState.loanAmount > 0) {
                    const oldLoanAmount = p.gameState.loanAmount;
                    const oldInterestRate = 10; // 原利率 10%
                    const oldInterestAmount = Math.round(oldLoanAmount * oldInterestRate / 100);
                    const newInterestAmount = Math.round(oldLoanAmount * newInterestRate / 100);
                    const interestSaved = oldInterestAmount - newInterestAmount;
                    
                    // 更新贷款利率
                    p.gameState.loanInterestRate = newInterestRate;
                    p.gameState.loanInterest = newInterestAmount;
                    
                    affectedPlayers.push(p.playerName);
                    changes.push(`${p.playerName}: 貸款 $${oldLoanAmount.toLocaleString()}，利息 $${oldInterestAmount}/月 → $${newInterestAmount}/月 (節省 $${interestSaved}/月)`);
                    
                    // 记录交易
                    addTransactionRecord(
                        p.playerName,
                        { name: "貸款利率下降", type: "market_news", id: "M03" },
                        "貸款利率調整",
                        0,
                        `貸款利率從 10% 降至 ${newInterestRate}%，每月利息從 $${oldInterestAmount} 降至 $${newInterestAmount}，節省 $${interestSaved}/月`,
                        null,
                        p.gameState
                    );
                    
                    // 通知该玩家
                    if (pWs && pWs !== ws) {
                        pWs.send(JSON.stringify({
                            type: 'notification',
                            message: `🏦 市場消息：${currentPlayer.playerName} 觸發了「貸款利率下降」！你的貸款利率降至 ${newInterestRate}%，每月利息節省 $${interestSaved} 元！`
                        }));
                        pWs.send(JSON.stringify({
                            type: 'state_updated',
                            playerId: p.playerId,
                            gameState: p.gameState
                        }));
                    }
                }
            }
            
            if (affectedPlayers.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🏦 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家有銀行貸款，沒有影響。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家有銀行貸款，沒有影響。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🏦 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n受影響玩家：${affectedPlayers.join(', ')}\n貸款利率降至 ${newInterestRate}%，利息支出減半！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🏦 市場消息「${card.name}」生效！${affectedPlayers.length} 位有貸款的玩家受惠，利率降至 ${newInterestRate}%。`
            }));
            
            return `🏦 貸款利率下降成功！\n` +
                `👥 受影響玩家：${affectedPlayers.join(', ')}\n` +
                `📉 貸款利率：10% → ${newInterestRate}%\n` +
                `💰 利息支出減半！\n` +
                `📊 變化詳情：\n${changes.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：所有有貸款的玩家，利率降至5%，利息支出減半"
    },

    {
        id: "M04",
        name: "加密貨幣平台騙局",
        description: "由於加密貨幣平台無牌經營，導致無法兌換/行使加密貨幣權益。\n持有C01加密貨幣的玩家，血本無歸，並將所持有的加密貨幣從財務報表中刪除。",
        image: "../cards/revelation/market/M04.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            let totalLoss = 0;
            
            // 遍历所有玩家
            for (let [pWs, p] of room.players) {
                // 检查玩家是否持有加密货币 (C01)
                let cryptoLoss = 0;
                let cryptoDetails = [];
                
                if (p.gameState.cryptoHoldings) {
                    // 遍历所有加密货币持仓
                    for (const [cryptoId, holding] of Object.entries(p.gameState.cryptoHoldings)) {
                        // 检查是否是 C01 相关加密货币
                        if (cryptoId === 'F03' || cryptoId === 'F04' || 
                            (holding.code === 'C01') || 
                            (holding.name && holding.name.includes('C01'))) {
                            
                            const lossAmount = holding.totalCost;
                            cryptoLoss += lossAmount;
                            totalLoss += lossAmount;
                            cryptoDetails.push(`${holding.name || holding.code}: ${holding.units}顆，成本 $${lossAmount.toLocaleString()}`);
                            
                            // 删除该加密货币持仓
                            delete p.gameState.cryptoHoldings[cryptoId];
                        }
                    }
                }
                
                if (cryptoLoss > 0) {
                    affectedPlayers.push(p.playerName);
                    changes.push(`${p.playerName}: 損失 $${cryptoLoss.toLocaleString()} (${cryptoDetails.join(', ')})`);
                    
                    // 更新总资产（减去损失）
                    p.gameState.totalAssets = Math.max(0, p.gameState.totalAssets - cryptoLoss);
                    
                    // 幸运值下降（被骗影响心情）
                    p.gameState.luck = Math.max(0, p.gameState.luck - 2);
                    
                    // 记录交易
                    addTransactionRecord(
                        p.playerName,
                        { name: "加密貨幣平台騙局", type: "market_news", id: "M04" },
                        "加密貨幣損失",
                        -cryptoLoss,
                        `因加密貨幣平台無牌經營，持有的 C01 加密貨幣血本無歸，損失 $${cryptoLoss.toLocaleString()} 元，幸運值 -2`,
                        null,
                        p.gameState
                    );
                    
                    // 通知该玩家
                    if (pWs && pWs !== ws) {
                        pWs.send(JSON.stringify({
                            type: 'notification',
                            message: `⚠️ 市場消息：${currentPlayer.playerName} 觸發了「加密貨幣平台騙局」！你持有的 C01 加密貨幣血本無歸，損失 $${cryptoLoss.toLocaleString()} 元！幸運值 -2`
                        }));
                        pWs.send(JSON.stringify({
                            type: 'state_updated',
                            playerId: p.playerId,
                            gameState: p.gameState
                        }));
                    }
                }
            }
            
            if (affectedPlayers.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `⚠️ 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有 C01 加密貨幣，沒有人受影響。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有 C01 加密貨幣，沒有人受影響。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `⚠️ ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n受影響玩家：${affectedPlayers.join(', ')}\n血本無歸，損失總額 $${totalLoss.toLocaleString()} 元！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `⚠️ 市場消息「${card.name}」生效！${affectedPlayers.length} 位玩家損失總額 $${totalLoss.toLocaleString()} 元。`
            }));
            
            return `⚠️ 加密貨幣平台騙局！\n` +
                `👥 受影響玩家：${affectedPlayers.join(', ')}\n` +
                `💰 總損失金額：$${totalLoss.toLocaleString()} 元\n` +
                `💔 所有 C01 加密貨幣已從財務報表中刪除\n` +
                `🍀 受影響玩家幸運值 -2\n` +
                `📊 詳細損失：\n${changes.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：所有持有 C01 加密貨幣的玩家，血本無歸，刪除所有加密貨幣持倉，幸運值 -2"
    },

    {
    id: "M05",
    name: "P2P網上銀行業績提升",
    description: "由於平台投資項目營運良好，投資人獲得豐碩回報，收益增加。\nP2P N02 每股價值 +$10 元",
    image: "../cards/revelation/market/M05.png",
    cost: 500,
    type: "market_news",
    category: "市场消息卡",
    effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
        let affectedPlayers = [];
        let changes = [];
        const priceIncrease = 10;
        
        // 遍历所有玩家
        for (let [pWs, p] of room.players) {
            // 检查玩家是否持有 P2P N02 投资 (id 为 "F05")
            const hasP2PInvestment = p.gameState.financeInvestments && 
                                     p.gameState.financeInvestments.some(inv => inv.id === "F05");
            
            if (hasP2PInvestment) {
                // 找到 P2P 投资
                const p2pInvestment = p.gameState.financeInvestments.find(inv => inv.id === "F05");
                const oldPricePerUnit = p2pInvestment.pricePerUnit;
                const newPricePerUnit = oldPricePerUnit + priceIncrease;
                const valueIncrease = p2pInvestment.units * priceIncrease;
                
                // 更新每股价值
                p2pInvestment.pricePerUnit = newPricePerUnit;
                p2pInvestment.valueIncreased = true;
                p2pInvestment.increaseAmount = priceIncrease;
                
                // 更新总资产价值（增加）
                p.gameState.totalAssets = (p.gameState.totalAssets || 0) + valueIncrease;
                
                affectedPlayers.push(p.playerName);
                changes.push(`${p.playerName}: 持有 ${p2pInvestment.units} 股，每股 $${oldPricePerUnit} → $${newPricePerUnit}，總價值增加 $${valueIncrease.toLocaleString()}`);
                
                // 记录交易
                addTransactionRecord(
                    p.playerName,
                    { name: "P2P網上銀行業績提升", type: "market_news", id: "M05" },
                    "P2P價值提升",
                    valueIncrease,
                    `P2P N02 每股價值增加 $${priceIncrease} 元！持有 ${p2pInvestment.units} 股，總價值增加 $${valueIncrease.toLocaleString()} 元`,
                    null,
                    p.gameState
                );
                
                // 通知该玩家
                if (pWs && pWs !== ws) {
                    pWs.send(JSON.stringify({
                        type: 'notification',
                        message: `📈 市場消息：${currentPlayer.playerName} 觸發了「P2P網上銀行業績提升」！你持有的 P2P N02 每股價值增加 $${priceIncrease} 元，總資產增加 $${valueIncrease.toLocaleString()} 元！`
                    }));
                    pWs.send(JSON.stringify({
                        type: 'state_updated',
                        playerId: p.playerId,
                        gameState: p.gameState
                    }));
                }
            }
        }
        
        if (affectedPlayers.length === 0) {
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `📊 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有 P2P N02，無法受益。`
            });
            return `📊 市場消息「${card.name}」生效，但沒有玩家持有 P2P N02，無法受益。`;
        }
        
        // 广播给所有玩家
        broadcastToRoom(roomId, {
            type: 'notification',
            message: `📈 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n受影響玩家：${affectedPlayers.join(', ')}\nP2P N02 每股價值增加 $${priceIncrease} 元！`
        });
        
        // 通知当前玩家结果
        ws.send(JSON.stringify({
            type: 'notification',
            message: `📈 市場消息「${card.name}」生效！${affectedPlayers.length} 位玩家受益，P2P N02 每股 +$${priceIncrease} 元。`
        }));
        
        return `📈 P2P網上銀行業績提升成功！\n` +
               `👥 受影響玩家：${affectedPlayers.join(', ')}\n` +
               `💰 P2P N02 每股價值 +$${priceIncrease} 元\n` +
               `📊 變化詳情：\n${changes.join('\n')}`;
    },
    getEffectDescription: () => "市場消息：所有玩家持有的 P2P N02 每股價值 +$10 元"
    },

    {
        id: "M06",
        name: "加密貨幣爆升",
        description: "由於世界首富高調增持加密貨幣，令不少投資者爭相增持，帶動加密貨幣價格爆升。\n持有C01加密貨幣的玩家可以原價的10倍出售。所有玩家都可以參與。",
        image: "../cards/revelation/market/M06.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            // 收集所有持有 C01 加密货币的玩家
            const playersWithCrypto = [];
            
            for (let [pWs, p] of room.players) {
                let cryptoHoldings = [];
                let totalValue = 0;
                let sellPrice = 0;
                
                if (p.gameState.cryptoHoldings) {
                    for (const [cryptoId, holding] of Object.entries(p.gameState.cryptoHoldings)) {
                        // 检查是否是 C01 相关加密货币
                        if (cryptoId === 'F03' || cryptoId === 'F04' || 
                            (holding.code === 'C01') || 
                            (holding.name && holding.name.includes('C01'))) {
                            
                            // 原價的10倍出售
                            const originalValue = holding.totalCost;
                            const multiplier = 10;
                            sellPrice = originalValue * multiplier;
                            const profit = sellPrice - originalValue;
                            
                            cryptoHoldings.push({
                                cryptoId: cryptoId,
                                name: holding.name || holding.code || 'C01加密货币',
                                units: holding.units,
                                originalCost: originalValue,
                                sellPrice: sellPrice,
                                profit: profit
                            });
                            totalValue += sellPrice;
                        }
                    }
                }
                
                if (cryptoHoldings.length > 0) {
                    playersWithCrypto.push({
                        ws: pWs,
                        player: p,
                        cryptoHoldings: cryptoHoldings,
                        totalValue: totalValue
                    });
                }
            }
            
            if (playersWithCrypto.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🚀 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有 C01 加密貨幣，無法受益。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有 C01 加密貨幣，無法受益。`;
            }
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = playersWithCrypto.map(p => ({
                    ws: p.ws,
                    playerName: p.player.playerName,
                    cryptoHoldings: p.cryptoHoldings,
                    totalValue: p.totalValue
                }));
                
                return {
                    type: 'crypto_sell_choices',
                    message: `🚀 ${card.name}\n\n${card.description}\n\n持有 C01 加密貨幣的玩家可以原價 10 倍出售！\n\n請持有加密貨幣的玩家選擇是否出售：`,
                    multiplier: 10,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            // 处理玩家选择
            let soldRecords = [];
            let totalSoldValue = 0;
            
            for (const [playerName, willSell] of Object.entries(playerChoices)) {
                if (!willSell) continue;
                
                let playerObj = null;
                let playerWs = null;
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        break;
                    }
                }
                
                if (!playerObj) continue;
                
                let playerTotalProfit = 0;
                let soldCryptos = [];
                
                // 出售所有 C01 加密货币
                if (playerObj.gameState.cryptoHoldings) {
                    for (const [cryptoId, holding] of Object.entries(playerObj.gameState.cryptoHoldings)) {
                        if (cryptoId === 'F03' || cryptoId === 'F04' || 
                            (holding.code === 'C01') || 
                            (holding.name && holding.name.includes('C01'))) {
                            
                            const originalValue = holding.totalCost;
                            const multiplier = 10;
                            const sellPrice = originalValue * multiplier;
                            const profit = sellPrice - originalValue;
                            
                            // 增加现金
                            playerObj.gameState.cash += sellPrice;
                            playerTotalProfit += profit;
                            totalSoldValue += sellPrice;
                            
                            soldCryptos.push(`${holding.name || holding.code}: ${holding.units}顆，成本 $${originalValue.toLocaleString()}，售出 $${sellPrice.toLocaleString()}，獲利 $${profit.toLocaleString()}`);
                            
                            // 记录交易
                            addTransactionRecord(
                                playerName,
                                { name: "加密貨幣爆升出售", type: "market_news", id: "M06" },
                                "加密貨幣出售",
                                sellPrice,
                                `以原價 10 倍出售 C01 加密貨幣！成本 $${originalValue.toLocaleString()}，售出 $${sellPrice.toLocaleString()}，獲利 $${profit.toLocaleString()}`,
                                null,
                                playerObj.gameState
                            );
                            
                            // 删除该加密货币持仓
                            delete playerObj.gameState.cryptoHoldings[cryptoId];
                        }
                    }
                }
                
                if (soldCryptos.length > 0) {
                    // 幸运值提升（抓住机会）
                    playerObj.gameState.luck = Math.min(playerObj.gameState.maxLuck || 10, playerObj.gameState.luck + 2);
                    
                    soldRecords.push(`${playerName}: 出售成功！總獲利 $${playerTotalProfit.toLocaleString()}\n   ${soldCryptos.join('；')}`);
                    
                    // 通知该玩家
                    if (playerWs) {
                        playerWs.send(JSON.stringify({
                            type: 'notification',
                            message: `🚀 你以原價 10 倍出售了 C01 加密貨幣！獲利 $${playerTotalProfit.toLocaleString()} 元，幸運值 +2！`
                        }));
                        playerWs.send(JSON.stringify({
                            type: 'state_updated',
                            playerId: playerObj.playerId,
                            gameState: playerObj.gameState
                        }));
                    }
                }
            }
            
            if (soldRecords.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🚀 市場消息：${currentPlayer.playerName} 觸發了「${card.name}」，但沒有玩家選擇出售加密貨幣。`
                });
                return `📊 市場消息「${card.name}」完成，但沒有玩家選擇出售加密貨幣。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🚀 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n${soldRecords.length} 位玩家以原價 10 倍出售了 C01 加密貨幣，總金額 $${totalSoldValue.toLocaleString()} 元！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🚀 市場消息「${card.name}」生效！${soldRecords.length} 位玩家成功出售加密貨幣，總金額 $${totalSoldValue.toLocaleString()} 元。`
            }));
            
            return `🚀 加密貨幣爆升成功！\n` +
                `👥 出售玩家：${soldRecords.map(r => r.split('\n')[0]).join(', ')}\n` +
                `💰 總出售金額：$${totalSoldValue.toLocaleString()} 元\n` +
                `📊 詳細記錄：\n${soldRecords.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：持有 C01 加密貨幣的玩家可以原價 10 倍出售"
    },

    {
        id: "M07",
        name: "P2P網上銀行破產",
        description: "由於平台違規操作，私自挪用資金，導致無法兌付到期資金而爆雷。\n擁有P2P的玩家，血本無歸，並將該P2P從財務報表中刪除。",
        image: "../cards/revelation/market/M07.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            let totalLoss = 0;
            
            // 遍历所有玩家
            for (let [pWs, p] of room.players) {
                // 检查玩家是否持有 P2P N02 投资 (id 为 "N02")
                let p2pLoss = 0;
                let p2pDetails = [];
                
                if (p.gameState.financeInvestments) {
                    // 找到 P2P 投资索引
                    const p2pIndex = p.gameState.financeInvestments.findIndex(inv => inv.id === "N02");
                    
                    if (p2pIndex !== -1) {
                        const p2pInvestment = p.gameState.financeInvestments[p2pIndex];
                        p2pLoss = p2pInvestment.totalCost;
                        totalLoss += p2pLoss;
                        p2pDetails.push(`${p2pInvestment.name}: ${p2pInvestment.units}股，成本 $${p2pLoss.toLocaleString()}`);
                        
                        // 从投资列表中删除
                        p.gameState.financeInvestments.splice(p2pIndex, 1);
                        
                        // 更新总资产（减去损失）
                        p.gameState.totalAssets = Math.max(0, (p.gameState.totalAssets || 0) - p2pLoss);
                        
                        // 幸运值下降（投资失败）
                        p.gameState.luck = Math.max(0, p.gameState.luck - 2);
                        
                        affectedPlayers.push(p.playerName);
                        changes.push(`${p.playerName}: 損失 $${p2pLoss.toLocaleString()} (${p2pDetails.join(', ')})`);
                        
                        // 记录交易
                        addTransactionRecord(
                            p.playerName,
                            { name: "P2P網上銀行破產", type: "market_news", id: "M07" },
                            "P2P投資損失",
                            -p2pLoss,
                            `P2P平台爆雷！持有的 P2P N02 血本無歸，損失 $${p2pLoss.toLocaleString()} 元，幸運值 -2`,
                            null,
                            p.gameState
                        );
                        
                        // 通知该玩家
                        if (pWs && pWs !== ws) {
                            pWs.send(JSON.stringify({
                                type: 'notification',
                                message: `⚠️ 市場消息：${currentPlayer.playerName} 觸發了「P2P網上銀行破產」！你持有的 P2P N02 血本無歸，損失 $${p2pLoss.toLocaleString()} 元！幸運值 -2`
                            }));
                            pWs.send(JSON.stringify({
                                type: 'state_updated',
                                playerId: p.playerId,
                                gameState: p.gameState
                            }));
                        }
                    }
                }
            }
            
            if (affectedPlayers.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `⚠️ 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有 P2P N02，沒有人受影響。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有 P2P N02，沒有人受影響。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `⚠️ ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n受影響玩家：${affectedPlayers.join(', ')}\n血本無歸，損失總額 $${totalLoss.toLocaleString()} 元！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `⚠️ 市場消息「${card.name}」生效！${affectedPlayers.length} 位玩家損失總額 $${totalLoss.toLocaleString()} 元。`
            }));
            
            return `⚠️ P2P網上銀行破產！\n` +
                `👥 受影響玩家：${affectedPlayers.join(', ')}\n` +
                `💰 總損失金額：$${totalLoss.toLocaleString()} 元\n` +
                `💔 所有 P2P N02 已從財務報表中刪除\n` +
                `🍀 受影響玩家幸運值 -2\n` +
                `📊 詳細損失：\n${changes.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：所有持有 P2P N02 的玩家，血本無歸，刪除 P2P 持倉，幸運值 -2"
    },

    {
        id: "M08",
        name: "大奇蹟日",
        description: "所有股票都可以原買入價3倍出售。所有玩家都可以參與。",
        image: "../cards/revelation/market/M08.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            // 收集所有持有股票的玩家
            const playersWithStocks = [];
            
            for (let [pWs, p] of room.players) {
                let stockHoldings = [];
                let totalValue = 0;
                
                if (p.gameState.stockHoldings) {
                    for (const [stockId, holding] of Object.entries(p.gameState.stockHoldings)) {
                        // 原買入價的3倍出售
                        const originalCost = holding.totalCost;
                        const multiplier = 3;
                        const sellPrice = originalCost * multiplier;
                        const profit = sellPrice - originalCost;
                        
                        stockHoldings.push({
                            stockId: stockId,
                            name: holding.name || stockId,
                            shares: holding.shares,
                            originalCost: originalCost,
                            avgCost: holding.purchasePrice,
                            sellPrice: sellPrice,
                            profit: profit
                        });
                        totalValue += sellPrice;
                    }
                }
                
                if (stockHoldings.length > 0) {
                    playersWithStocks.push({
                        ws: pWs,
                        player: p,
                        stockHoldings: stockHoldings,
                        totalValue: totalValue
                    });
                }
            }
            
            if (playersWithStocks.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🌟 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有股票，無法受益。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有股票，無法受益。`;
            }
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = playersWithStocks.map(p => ({
                    ws: p.ws,
                    playerName: p.player.playerName,
                    stockHoldings: p.stockHoldings,
                    totalValue: p.totalValue
                }));
                
                return {
                    type: 'stock_sell_choices',
                    message: `🌟 ${card.name}\n\n${card.description}\n\n所有股票都可以原買入價 3 倍出售！\n\n請持有股票的玩家選擇是否出售：`,
                    multiplier: 3,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            // 处理玩家选择
            let soldRecords = [];
            let totalSoldValue = 0;
            
            for (const [playerName, willSell] of Object.entries(playerChoices)) {
                if (!willSell) continue;
                
                let playerObj = null;
                let playerWs = null;
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        break;
                    }
                }
                
                if (!playerObj) continue;
                
                let playerTotalProfit = 0;
                let soldStocks = [];
                
                // 出售所有股票
                if (playerObj.gameState.stockHoldings) {
                    for (const [stockId, holding] of Object.entries(playerObj.gameState.stockHoldings)) {
                        const originalCost = holding.totalCost;
                        const multiplier = 3;
                        const sellPrice = originalCost * multiplier;
                        const profit = sellPrice - originalCost;
                        
                        // 增加现金
                        playerObj.gameState.cash += sellPrice;
                        playerTotalProfit += profit;
                        totalSoldValue += sellPrice;
                        
                        soldStocks.push(`${holding.name || stockId}: ${holding.shares}股，成本 $${originalCost.toLocaleString()}，售出 $${sellPrice.toLocaleString()}，獲利 $${profit.toLocaleString()}`);
                        
                        // 记录交易
                        addTransactionRecord(
                            playerName,
                            { name: "大奇蹟日出售股票", type: "market_news", id: "M08" },
                            "股票出售",
                            sellPrice,
                            `以原買入價 3 倍出售股票！成本 $${originalCost.toLocaleString()}，售出 $${sellPrice.toLocaleString()}，獲利 $${profit.toLocaleString()}`,
                            null,
                            playerObj.gameState
                        );
                    }
                }
                
                // 清空所有股票持仓
                playerObj.gameState.stockHoldings = {};
                
                if (soldStocks.length > 0) {
                    // 幸运值大幅提升（抓住奇蹟機會）
                    playerObj.gameState.luck = Math.min(playerObj.gameState.maxLuck || 10, playerObj.gameState.luck + 3);
                    
                    // 精力恢复（心情愉悦）
                    playerObj.gameState.energy = Math.min(playerObj.gameState.maxEnergy, playerObj.gameState.energy + 2);
                    
                    soldRecords.push(`${playerName}: 出售成功！總獲利 $${playerTotalProfit.toLocaleString()}\n   ${soldStocks.join('；')}`);
                    
                    // 通知该玩家
                    if (playerWs) {
                        playerWs.send(JSON.stringify({
                            type: 'notification',
                            message: `🌟 大奇蹟日！你以原買入價 3 倍出售了所有股票！總獲利 $${playerTotalProfit.toLocaleString()} 元，幸運值 +3，精力 +2！`
                        }));
                        playerWs.send(JSON.stringify({
                            type: 'state_updated',
                            playerId: playerObj.playerId,
                            gameState: playerObj.gameState
                        }));
                    }
                }
            }
            
            if (soldRecords.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🌟 市場消息：${currentPlayer.playerName} 觸發了「${card.name}」，但沒有玩家選擇出售股票。`
                });
                return `📊 市場消息「${card.name}」完成，但沒有玩家選擇出售股票。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🌟 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n${soldRecords.length} 位玩家以原買入價 3 倍出售了所有股票，總金額 $${totalSoldValue.toLocaleString()} 元！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🌟 市場消息「${card.name}」生效！${soldRecords.length} 位玩家成功出售股票，總金額 $${totalSoldValue.toLocaleString()} 元。`
            }));
            
            return `🌟 大奇蹟日成功！\n` +
                `👥 出售玩家：${soldRecords.map(r => r.split('\n')[0]).join(', ')}\n` +
                `💰 總出售金額：$${totalSoldValue.toLocaleString()} 元\n` +
                `📊 詳細記錄：\n${soldRecords.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：所有股票可以原買入價 3 倍出售，幸運值 +3，精力 +2"
    },

    {
        id: "M09",
        name: "股市黑天鵝",
        description: "所有持有股票的玩家，股數減半 (不用支付現金，股票總成本不變)。此時不能交易。\n股票代碼：所有股票\n每兩股合併成一股",
        image: "../cards/revelation/market/M09.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            
            // 遍历所有玩家
            for (let [pWs, p] of room.players) {
                let playerChanges = [];
                let hasStock = false;
                
                if (p.gameState.stockHoldings && Object.keys(p.gameState.stockHoldings).length > 0) {
                    hasStock = true;
                    
                    for (const [stockId, holding] of Object.entries(p.gameState.stockHoldings)) {
                        const oldShares = holding.shares;
                        const newShares = Math.floor(oldShares / 2); // 股數減半（向下取整）
                        const sharesReduced = oldShares - newShares;
                        
                        if (newShares === 0) {
                            // 如果原本只有1股，合併後為0股，刪除該股票
                            playerChanges.push(`${holding.name || stockId}: ${oldShares}股 → 0股 (被合併消失)`);
                            delete p.gameState.stockHoldings[stockId];
                        } else {
                            // 更新股數，總成本不變，因此平均成本翻倍
                            const oldAvgCost = holding.purchasePrice;
                            const newAvgCost = oldAvgCost * 2;
                            
                            holding.shares = newShares;
                            holding.purchasePrice = newAvgCost;
                            // totalCost 保持不變
                            
                            playerChanges.push(`${holding.name || stockId}: ${oldShares}股 → ${newShares}股 (成本不變，平均成本 $${oldAvgCost.toFixed(2)} → $${newAvgCost.toFixed(2)})`);
                        }
                    }
                    
                    if (playerChanges.length > 0) {
                        affectedPlayers.push(p.playerName);
                        changes.push(`${p.playerName}:\n   ${playerChanges.join('\n   ')}`);
                        
                        // 幸运值下降（股市黑天鵝影響）
                        p.gameState.luck = Math.max(0, p.gameState.luck - 1);
                        
                        // 记录交易
                        addTransactionRecord(
                            p.playerName,
                            { name: "股市黑天鵝", type: "market_news", id: "M09" },
                            "股票合併",
                            0,
                            `股市黑天鵝！所有持股股數減半，每兩股合併成一股。${playerChanges.join('；')}，幸運值 -1`,
                            null,
                            p.gameState
                        );
                        
                        // 通知该玩家
                        if (pWs && pWs !== ws) {
                            pWs.send(JSON.stringify({
                                type: 'notification',
                                message: `🦢 市場消息：${currentPlayer.playerName} 觸發了「股市黑天鵝」！你的所有股票股數減半，幸運值 -1！\n${playerChanges.join('\n')}`
                            }));
                            pWs.send(JSON.stringify({
                                type: 'state_updated',
                                playerId: p.playerId,
                                gameState: p.gameState
                            }));
                        }
                    }
                }
            }
            
            if (affectedPlayers.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🦢 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有股票，沒有人受影響。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有股票，沒有人受影響。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🦢 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n受影響玩家：${affectedPlayers.join(', ')}\n所有股票股數減半，每兩股合併成一股！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🦢 市場消息「${card.name}」生效！${affectedPlayers.length} 位玩家的股票股數減半。`
            }));
            
            return `🦢 股市黑天鵝發生！\n` +
                `👥 受影響玩家：${affectedPlayers.join(', ')}\n` +
                `📊 股票合併：每兩股合併成一股，股數減半\n` +
                `💰 股票總成本不變，平均成本翻倍\n` +
                `🍀 受影響玩家幸運值 -1\n` +
                `📊 詳細變化：\n${changes.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：所有持有股票的玩家，股數減半（每兩股合併成一股），總成本不變，平均成本翻倍，幸運值 -1"
    },

    {
        id: "M10",
        name: "金融市場動盪",
        description: "股票行情：B01 金融公司 $10 | A01 科技公司 $2 | H01 健康食品公司 $10\n所有持有股票的玩家可以選擇出售與否（不消耗精力）",
        image: "../cards/revelation/market/M10.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const stockPrices = {
                "B01": { name: "股票交易 - B01金融公司", price: 10, originalRange: "5-30" },
                "A01": { name: "股票交易 - A01科技公司", price: 2, originalRange: "1-100" },
                "H01": { name: "股票交易 - H01健康食品公司", price: 10, originalRange: "1-10" }
            };
            
            // 收集所有持有股票的玩家
            const playersWithStocks = [];
            for (let [pWs, p] of room.players) {
                const playerStocks = [];
                if (p.gameState.stockHoldings) {
                    for (const [stockId, holding] of Object.entries(p.gameState.stockHoldings)) {
                        const stockCode = holding.code || stockId;
                        if (stockPrices[stockCode]) {
                            playerStocks.push({
                                stockId: stockId,
                                stockCode: stockCode,
                                stockName: stockPrices[stockCode].name,
                                shares: holding.shares,
                                currentPrice: stockPrices[stockCode].price,
                                avgCost: holding.purchasePrice
                            });
                        }
                    }
                }
                if (playerStocks.length > 0) {
                    playersWithStocks.push({
                        ws: pWs,
                        player: p,
                        stocks: playerStocks
                    });
                }
            }
            
            if (playersWithStocks.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `📊 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有相關股票。`
                });
                return `📊 市場消息卡「${card.name}」生效，但沒有玩家持有相關股票。`;
            }
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = playersWithStocks.map(p => ({
                    ws: p.ws,
                    playerName: p.player.playerName,
                    stocks: p.stocks
                }));
                
                return {
                    type: 'market_news_choices',
                    message: `📊 ${card.name}\n\n${card.description}\n\n請持有股票的玩家選擇是否出售股票：`,
                    stockPrices: stockPrices,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            // 处理玩家选择
            let totalSold = 0;
            let soldRecords = [];
            
            for (const [playerName, choices] of Object.entries(playerChoices)) {
                let playerObj = null;
                let playerWs = null;
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        break;
                    }
                }
                
                if (!playerObj) continue;
                
                for (const [stockCode, willSell] of Object.entries(choices)) {
                    if (willSell && stockPrices[stockCode]) {
                        // 找到对应的持股
                        let holdingToSell = null;
                        let stockIdToSell = null;
                        for (const [stockId, holding] of Object.entries(playerObj.gameState.stockHoldings || {})) {
                            if (holding.code === stockCode || stockId.includes(stockCode)) {
                                holdingToSell = holding;
                                stockIdToSell = stockId;
                                break;
                            }
                        }
                        
                        if (holdingToSell && holdingToSell.shares > 0) {
                            const sellPrice = stockPrices[stockCode].price;
                            const totalRevenue = holdingToSell.shares * sellPrice;
                            const profit = totalRevenue - holdingToSell.totalCost;
                            
                            playerObj.gameState.cash += totalRevenue;
                            soldRecords.push(`${playerName} 賣出 ${holdingToSell.shares}股 ${stockPrices[stockCode].name} @ $${sellPrice}，獲利 ${profit >= 0 ? '+' : ''}${profit.toLocaleString()}`);
                            
                            addTransactionRecord(
                                playerName,
                                { name: `市場消息-賣出${stockPrices[stockCode].name}`, type: "market_news", id: card.id },
                                "市場消息出售",
                                totalRevenue,
                                `響應市場消息，賣出 ${holdingToSell.shares}股 ${stockPrices[stockCode].name}，成交價 $${sellPrice}/股`,
                                null,
                                playerObj.gameState
                            );
                            
                            // 清除持股
                            delete playerObj.gameState.stockHoldings[stockIdToSell];
                            totalSold++;
                        }
                    }
                }
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `📊 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！${soldRecords.length > 0 ? soldRecords.join('；') : '沒有玩家出售股票'}`
            });
            
            return `📊 市場消息「${card.name}」完成！${soldRecords.length > 0 ? soldRecords.join('\n') : '沒有玩家出售股票'}`;
        },
        getEffectDescription: () => "市場消息：影響股票價格，持有相關股票的玩家可選擇出售"
    },

    {
        id: "M11",
        name: "金融市場動盪",
        description: "股票行情：B01 金融公司 $30 | A01 科技公司 $60 | H01 健康食品公司 $4\n所有持有股票的玩家可以選擇出售與否（不消耗精力）",
        image: "../cards/revelation/market/M11.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const stockPrices = {
                "B01": { name: "股票交易 - B01金融公司", price: 30, originalRange: "5-30" },
                "A01": { name: "股票交易 - A01科技公司", price: 60, originalRange: "1-100" },
                "H01": { name: "股票交易 - H01健康食品公司", price: 4, originalRange: "1-10" }
            };
            
            // 收集所有持有股票的玩家
            const playersWithStocks = [];
            for (let [pWs, p] of room.players) {
                const playerStocks = [];
                if (p.gameState.stockHoldings) {
                    for (const [stockId, holding] of Object.entries(p.gameState.stockHoldings)) {
                        const stockCode = holding.code || stockId;
                        if (stockPrices[stockCode]) {
                            playerStocks.push({
                                stockId: stockId,
                                stockCode: stockCode,
                                stockName: stockPrices[stockCode].name,
                                shares: holding.shares,
                                currentPrice: stockPrices[stockCode].price,
                                avgCost: holding.purchasePrice
                            });
                        }
                    }
                }
                if (playerStocks.length > 0) {
                    playersWithStocks.push({
                        ws: pWs,
                        player: p,
                        stocks: playerStocks
                    });
                }
            }
            
            if (playersWithStocks.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `📊 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有相關股票。`
                });
                return `📊 市場消息卡「${card.name}」生效，但沒有玩家持有相關股票。`;
            }
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = playersWithStocks.map(p => ({
                    ws: p.ws,
                    playerName: p.player.playerName,
                    stocks: p.stocks
                }));
                
                return {
                    type: 'market_news_choices',
                    message: `📊 ${card.name}\n\n${card.description}\n\n請持有股票的玩家選擇是否出售股票：`,
                    stockPrices: stockPrices,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            // 处理玩家选择
            let totalSold = 0;
            let soldRecords = [];
            
            for (const [playerName, choices] of Object.entries(playerChoices)) {
                let playerObj = null;
                let playerWs = null;
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        break;
                    }
                }
                
                if (!playerObj) continue;
                
                for (const [stockCode, willSell] of Object.entries(choices)) {
                    if (willSell && stockPrices[stockCode]) {
                        // 找到对应的持股
                        let holdingToSell = null;
                        let stockIdToSell = null;
                        for (const [stockId, holding] of Object.entries(playerObj.gameState.stockHoldings || {})) {
                            if (holding.code === stockCode || stockId.includes(stockCode)) {
                                holdingToSell = holding;
                                stockIdToSell = stockId;
                                break;
                            }
                        }
                        
                        if (holdingToSell && holdingToSell.shares > 0) {
                            const sellPrice = stockPrices[stockCode].price;
                            const totalRevenue = holdingToSell.shares * sellPrice;
                            const profit = totalRevenue - holdingToSell.totalCost;
                            
                            playerObj.gameState.cash += totalRevenue;
                            soldRecords.push(`${playerName} 賣出 ${holdingToSell.shares}股 ${stockPrices[stockCode].name} @ $${sellPrice}，獲利 ${profit >= 0 ? '+' : ''}${profit.toLocaleString()}`);
                            
                            addTransactionRecord(
                                playerName,
                                { name: `市場消息-賣出${stockPrices[stockCode].name}`, type: "market_news", id: card.id },
                                "市場消息出售",
                                totalRevenue,
                                `響應市場消息，賣出 ${holdingToSell.shares}股 ${stockPrices[stockCode].name}，成交價 $${sellPrice}/股`,
                                null,
                                playerObj.gameState
                            );
                            
                            // 清除持股
                            delete playerObj.gameState.stockHoldings[stockIdToSell];
                            totalSold++;
                        }
                    }
                }
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `📊 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！${soldRecords.length > 0 ? soldRecords.join('；') : '沒有玩家出售股票'}`
            });
            
            return `📊 市場消息「${card.name}」完成！${soldRecords.length > 0 ? soldRecords.join('\n') : '沒有玩家出售股票'}`;
        },
        getEffectDescription: () => "市場消息：影響股票價格，持有相關股票的玩家可選擇出售"
    },

     {
        id: "M12",
        name: "金融市場動盪",
        description: "股票行情：B01 金融公司 $5 | A01 科技公司 $100 | H01 健康食品公司 $6\n所有持有股票的玩家可以選擇出售與否（不消耗精力）",
        image: "../cards/revelation/market/M12.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const stockPrices = {
                "B01": { name: "股票交易 - B01金融公司", price: 5, originalRange: "5-30" },
                "A01": { name: "股票交易 - A01科技公司", price: 100, originalRange: "1-100" },
                "H01": { name: "股票交易 - H01健康食品公司", price: 6, originalRange: "1-10" }
            };
            
            // 收集所有持有股票的玩家
            const playersWithStocks = [];
            for (let [pWs, p] of room.players) {
                const playerStocks = [];
                if (p.gameState.stockHoldings) {
                    for (const [stockId, holding] of Object.entries(p.gameState.stockHoldings)) {
                        const stockCode = holding.code || stockId;
                        if (stockPrices[stockCode]) {
                            playerStocks.push({
                                stockId: stockId,
                                stockCode: stockCode,
                                stockName: stockPrices[stockCode].name,
                                shares: holding.shares,
                                currentPrice: stockPrices[stockCode].price,
                                avgCost: holding.purchasePrice
                            });
                        }
                    }
                }
                if (playerStocks.length > 0) {
                    playersWithStocks.push({
                        ws: pWs,
                        player: p,
                        stocks: playerStocks
                    });
                }
            }
            
            if (playersWithStocks.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `📊 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有相關股票。`
                });
                return `📊 市場消息卡「${card.name}」生效，但沒有玩家持有相關股票。`;
            }
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = playersWithStocks.map(p => ({
                    ws: p.ws,
                    playerName: p.player.playerName,
                    stocks: p.stocks
                }));
                
                return {
                    type: 'market_news_choices',
                    message: `📊 ${card.name}\n\n${card.description}\n\n請持有股票的玩家選擇是否出售股票：`,
                    stockPrices: stockPrices,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            // 处理玩家选择
            let totalSold = 0;
            let soldRecords = [];
            
            for (const [playerName, choices] of Object.entries(playerChoices)) {
                let playerObj = null;
                let playerWs = null;
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        break;
                    }
                }
                
                if (!playerObj) continue;
                
                for (const [stockCode, willSell] of Object.entries(choices)) {
                    if (willSell && stockPrices[stockCode]) {
                        // 找到对应的持股
                        let holdingToSell = null;
                        let stockIdToSell = null;
                        for (const [stockId, holding] of Object.entries(playerObj.gameState.stockHoldings || {})) {
                            if (holding.code === stockCode || stockId.includes(stockCode)) {
                                holdingToSell = holding;
                                stockIdToSell = stockId;
                                break;
                            }
                        }
                        
                        if (holdingToSell && holdingToSell.shares > 0) {
                            const sellPrice = stockPrices[stockCode].price;
                            const totalRevenue = holdingToSell.shares * sellPrice;
                            const profit = totalRevenue - holdingToSell.totalCost;
                            
                            playerObj.gameState.cash += totalRevenue;
                            soldRecords.push(`${playerName} 賣出 ${holdingToSell.shares}股 ${stockPrices[stockCode].name} @ $${sellPrice}，獲利 ${profit >= 0 ? '+' : ''}${profit.toLocaleString()}`);
                            
                            addTransactionRecord(
                                playerName,
                                { name: `市場消息-賣出${stockPrices[stockCode].name}`, type: "market_news", id: card.id },
                                "市場消息出售",
                                totalRevenue,
                                `響應市場消息，賣出 ${holdingToSell.shares}股 ${stockPrices[stockCode].name}，成交價 $${sellPrice}/股`,
                                null,
                                playerObj.gameState
                            );
                            
                            // 清除持股
                            delete playerObj.gameState.stockHoldings[stockIdToSell];
                            totalSold++;
                        }
                    }
                }
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `📊 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！${soldRecords.length > 0 ? soldRecords.join('；') : '沒有玩家出售股票'}`
            });
            
            return `📊 市場消息「${card.name}」完成！${soldRecords.length > 0 ? soldRecords.join('\n') : '沒有玩家出售股票'}`;
        },
        getEffectDescription: () => "市場消息：影響股票價格，持有相關股票的玩家可選擇出售"
    },

     {
        id: "M13",
        name: "金融市場動盪",
        description: "股票行情：B01 金融公司 $15 | A01 科技公司 $20 | H01 健康食品公司 $8\n所有持有股票的玩家可以選擇出售與否（不消耗精力）",
        image: "../cards/revelation/market/M13.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const stockPrices = {
                "B01": { name: "股票交易 - B01金融公司", price: 15, originalRange: "5-30" },
                "A01": { name: "股票交易 - A01科技公司", price: 20, originalRange: "1-100" },
                "H01": { name: "股票交易 - H01健康食品公司", price: 8, originalRange: "1-10" }
            };
            
            // 收集所有持有股票的玩家
            const playersWithStocks = [];
            for (let [pWs, p] of room.players) {
                const playerStocks = [];
                if (p.gameState.stockHoldings) {
                    for (const [stockId, holding] of Object.entries(p.gameState.stockHoldings)) {
                        const stockCode = holding.code || stockId;
                        if (stockPrices[stockCode]) {
                            playerStocks.push({
                                stockId: stockId,
                                stockCode: stockCode,
                                stockName: stockPrices[stockCode].name,
                                shares: holding.shares,
                                currentPrice: stockPrices[stockCode].price,
                                avgCost: holding.purchasePrice
                            });
                        }
                    }
                }
                if (playerStocks.length > 0) {
                    playersWithStocks.push({
                        ws: pWs,
                        player: p,
                        stocks: playerStocks
                    });
                }
            }
            
            if (playersWithStocks.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `📊 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有相關股票。`
                });
                return `📊 市場消息卡「${card.name}」生效，但沒有玩家持有相關股票。`;
            }
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = playersWithStocks.map(p => ({
                    ws: p.ws,
                    playerName: p.player.playerName,
                    stocks: p.stocks
                }));
                
                return {
                    type: 'market_news_choices',
                    message: `📊 ${card.name}\n\n${card.description}\n\n請持有股票的玩家選擇是否出售股票：`,
                    stockPrices: stockPrices,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            // 处理玩家选择
            let totalSold = 0;
            let soldRecords = [];
            
            for (const [playerName, choices] of Object.entries(playerChoices)) {
                let playerObj = null;
                let playerWs = null;
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        break;
                    }
                }
                
                if (!playerObj) continue;
                
                for (const [stockCode, willSell] of Object.entries(choices)) {
                    if (willSell && stockPrices[stockCode]) {
                        // 找到对应的持股
                        let holdingToSell = null;
                        let stockIdToSell = null;
                        for (const [stockId, holding] of Object.entries(playerObj.gameState.stockHoldings || {})) {
                            if (holding.code === stockCode || stockId.includes(stockCode)) {
                                holdingToSell = holding;
                                stockIdToSell = stockId;
                                break;
                            }
                        }
                        
                        if (holdingToSell && holdingToSell.shares > 0) {
                            const sellPrice = stockPrices[stockCode].price;
                            const totalRevenue = holdingToSell.shares * sellPrice;
                            const profit = totalRevenue - holdingToSell.totalCost;
                            
                            playerObj.gameState.cash += totalRevenue;
                            soldRecords.push(`${playerName} 賣出 ${holdingToSell.shares}股 ${stockPrices[stockCode].name} @ $${sellPrice}，獲利 ${profit >= 0 ? '+' : ''}${profit.toLocaleString()}`);
                            
                            addTransactionRecord(
                                playerName,
                                { name: `市場消息-賣出${stockPrices[stockCode].name}`, type: "market_news", id: card.id },
                                "市場消息出售",
                                totalRevenue,
                                `響應市場消息，賣出 ${holdingToSell.shares}股 ${stockPrices[stockCode].name}，成交價 $${sellPrice}/股`,
                                null,
                                playerObj.gameState
                            );
                            
                            // 清除持股
                            delete playerObj.gameState.stockHoldings[stockIdToSell];
                            totalSold++;
                        }
                    }
                }
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `📊 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！${soldRecords.length > 0 ? soldRecords.join('；') : '沒有玩家出售股票'}`
            });
            
            return `📊 市場消息「${card.name}」完成！${soldRecords.length > 0 ? soldRecords.join('\n') : '沒有玩家出售股票'}`;
        },
        getEffectDescription: () => "市場消息：影響股票價格，持有相關股票的玩家可選擇出售"
    },

    {
        id: "M14",
        name: "房屋遷拆",
        description: "市建局收購遷拆香港陳年唐樓\n持有 H01 陳年唐樓的玩家得到遷拆補償費用：$500 萬，沒有玩家有 H01 則無事發生。",
        image: "../cards/revelation/market/M14.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            const compensationAmount = 5000000; // 500萬
            
            // 遍历所有玩家
            for (let [pWs, p] of room.players) {
                // 检查玩家是否持有 H01 陳年唐樓
                let hasProperty = false;
                let propertyDetails = [];
                let compensationReceived = 0;
                
                // 检查 propertyInvestments
                if (p.gameState.propertyInvestments && p.gameState.propertyInvestments.length > 0) {
                    const propertyIndex = p.gameState.propertyInvestments.findIndex(inv => inv.id === "H01");
                    
                    if (propertyIndex !== -1) {
                        const property = p.gameState.propertyInvestments[propertyIndex];
                        hasProperty = true;
                        compensationReceived = compensationAmount;
                        
                        propertyDetails.push(`${property.name}: 原價 $${property.totalPrice?.toLocaleString() || property.cost?.toLocaleString() || '?'} 元`);
                        
                        // 从地产投资中删除（已被收購）
                        p.gameState.propertyInvestments.splice(propertyIndex, 1);
                        
                        // 增加现金（補償金）
                        p.gameState.cash += compensationReceived;
                        
                        // 更新总资产
                        p.gameState.totalAssets = (p.gameState.totalAssets || 0) + compensationReceived;
                        
                        affectedPlayers.push(p.playerName);
                        changes.push(`${p.playerName}: 獲得補償 $${compensationReceived.toLocaleString()} 元 (${propertyDetails.join(', ')})`);
                        
                        // 记录交易
                        addTransactionRecord(
                            p.playerName,
                            { name: "房屋遷拆補償", type: "market_news", id: "M10" },
                            "房屋收購補償",
                            compensationReceived,
                            `市建局收購陳年唐樓！獲得遷拆補償 $${compensationReceived.toLocaleString()} 元`,
                            null,
                            p.gameState
                        );
                        
                        // 通知该玩家
                        if (pWs && pWs !== ws) {
                            pWs.send(JSON.stringify({
                                type: 'notification',
                                message: `🏗️ 市場消息：${currentPlayer.playerName} 觸發了「房屋遷拆」！你的陳年唐樓被市建局收購，獲得補償 $${compensationReceived.toLocaleString()} 元！`
                            }));
                            pWs.send(JSON.stringify({
                                type: 'state_updated',
                                playerId: p.playerId,
                                gameState: p.gameState
                            }));
                        }
                    }
                }
            }
            
            if (affectedPlayers.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🏗️ 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有 H01 陳年唐樓，無事發生。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有 H01 陳年唐樓，無事發生。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🏗️ ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n受影響玩家：${affectedPlayers.join(', ')}\n獲得遷拆補償總額 $${(affectedPlayers.length * compensationAmount).toLocaleString()} 元！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🏗️ 市場消息「${card.name}」生效！${affectedPlayers.length} 位玩家獲得遷拆補償，每人 $${compensationAmount.toLocaleString()} 元。`
            }));
            
            return `🏗️ 房屋遷拆成功！\n` +
                `👥 受影響玩家：${affectedPlayers.join(', ')}\n` +
                `💰 每位獲得補償：$${compensationAmount.toLocaleString()} 元\n` +
                `🏠 被收購物業：H01 陳年唐樓\n` +
                `📊 詳細記錄：\n${changes.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：持有 H01 陳年唐樓的玩家獲得 $500 萬遷拆補償"
    },

    {
        id: "M15",
        name: "求購香港中西區住宅物業",
        description: "市場現在需要以下物業。所有玩家都可以參與。\n物業要求：香港中西區住宅物業\n市場價格：$12,000,000/套\n玩家收益 = 市場價格 - 按揭貸款",
        image: "../cards/revelation/market/M15.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const marketPrice = 12000000; // 1200萬
            const targetPropertyId = "H02"; // 香港中西區住宅的 ID
            
            // 收集所有持有 H02 香港中西區住宅的玩家
            const playersWithProperty = [];
            
            for (let [pWs, p] of room.players) {
                if (p.gameState.propertyInvestments && p.gameState.propertyInvestments.length > 0) {
                    const propertyIndex = p.gameState.propertyInvestments.findIndex(inv => inv.id === targetPropertyId);
                    
                    if (propertyIndex !== -1) {
                        const property = p.gameState.propertyInvestments[propertyIndex];
                        const mortgageAmount = property.mortgageAmount || 0;
                        const playerProfit = marketPrice - mortgageAmount;
                        
                        playersWithProperty.push({
                            ws: pWs,
                            player: p,
                            property: property,
                            propertyIndex: propertyIndex,
                            mortgageAmount: mortgageAmount,
                            playerProfit: playerProfit
                        });
                    }
                }
            }
            
            if (playersWithProperty.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🏠 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有香港中西區住宅物業，無法出售。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有香港中西區住宅物業，無法出售。`;
            }
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = playersWithProperty.map(p => ({
                    ws: p.ws,
                    playerName: p.player.playerName,
                    property: {
                        name: p.property.name,
                        marketPrice: marketPrice,
                        mortgageAmount: p.mortgageAmount,
                        profit: p.playerProfit
                    }
                }));
                
                return {
                    type: 'property_sell_choices',
                    message: `🏠 ${card.name}\n\n${card.description}\n\n市場價格：$${marketPrice.toLocaleString()} 元/套\n收益計算：市場價格 - 按揭貸款\n\n請持有香港中西區住宅物業的玩家選擇是否出售：`,
                    marketPrice: marketPrice,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            // 处理玩家选择
            let soldRecords = [];
            let totalPaid = 0;
            
            for (const [playerName, willSell] of Object.entries(playerChoices)) {
                if (!willSell) continue;
                
                let playerObj = null;
                let playerWs = null;
                let propertyData = null;
                let propertyIndex = null;
                
                // 找到对应的玩家
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        if (p.gameState.propertyInvestments) {
                            const idx = p.gameState.propertyInvestments.findIndex(inv => inv.id === targetPropertyId);
                            if (idx !== -1) {
                                propertyData = p.gameState.propertyInvestments[idx];
                                propertyIndex = idx;
                            }
                        }
                        break;
                    }
                }
                
                if (!playerObj || !propertyData) continue;
                
                const mortgageAmount = propertyData.mortgageAmount || 0;
                const profit = marketPrice - mortgageAmount;
                
                // 增加现金（出售收益）
                playerObj.gameState.cash += profit;
                totalPaid += profit;
                
                // 从地产投资中删除
                playerObj.gameState.propertyInvestments.splice(propertyIndex, 1);
                
                // 如果有按揭貸款，需要清除相關的每月供款
                if (mortgageAmount > 0 && playerObj.gameState.mortgagePayment) {
                    playerObj.gameState.mortgagePayment = Math.max(0, playerObj.gameState.mortgagePayment - (propertyData.monthlyPayment || 0));
                }
                
                // 幸运值提升（成功出售）
                playerObj.gameState.luck = Math.min(playerObj.gameState.maxLuck || 10, playerObj.gameState.luck + 1);
                
                soldRecords.push(`${playerName}: 出售香港中西區住宅，獲得 $${profit.toLocaleString()} 元 (市場價 $${marketPrice.toLocaleString()} - 按揭 $${mortgageAmount.toLocaleString()})`);
                
                // 记录交易
                addTransactionRecord(
                    playerName,
                    { name: "求購香港中西區住宅物業", type: "market_news", id: "M11" },
                    "物業出售",
                    profit,
                    `出售香港中西區住宅！市場價格 $${marketPrice.toLocaleString()}，按揭貸款 $${mortgageAmount.toLocaleString()}，獲得 $${profit.toLocaleString()} 元，幸運值 +1`,
                    null,
                    playerObj.gameState
                );
                
                // 通知该玩家
                if (playerWs) {
                    playerWs.send(JSON.stringify({
                        type: 'notification',
                        message: `🏠 你成功出售了香港中西區住宅！獲得 $${profit.toLocaleString()} 元，幸運值 +1！`
                    }));
                    playerWs.send(JSON.stringify({
                        type: 'state_updated',
                        playerId: playerObj.playerId,
                        gameState: playerObj.gameState
                    }));
                }
            }
            
            if (soldRecords.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🏠 市場消息：${currentPlayer.playerName} 觸發了「${card.name}」，但沒有玩家選擇出售物業。`
                });
                return `📊 市場消息「${card.name}」完成，但沒有玩家選擇出售物業。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🏠 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n${soldRecords.length} 位玩家成功出售香港中西區住宅，總金額 $${totalPaid.toLocaleString()} 元！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🏠 市場消息「${card.name}」生效！${soldRecords.length} 位玩家成功出售物業，總金額 $${totalPaid.toLocaleString()} 元。`
            }));
            
            return `🏠 求購香港中西區住宅物業成功！\n` +
                `👥 出售玩家：${soldRecords.map(r => r.split(':')[0]).join(', ')}\n` +
                `💰 總支付金額：$${totalPaid.toLocaleString()} 元\n` +
                `📊 詳細記錄：\n${soldRecords.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：持有 H02 香港中西區住宅的玩家可以 $12,000,000 出售，收益 = 市價 - 按揭貸款"
    },

    {
        id: "M16",
        name: "求購香港油尖旺區住宅物業",
        description: "市場現在需要以下物業。所有玩家都可以參與。\n物業要求：香港油尖旺區住宅物業（H03）\n市場價格：$8,000,000/套\n玩家收益 = 市場價格 - 按揭貸款",
        image: "../cards/revelation/market/M16.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const marketPrice = 8000000; // 800萬
            const targetPropertyId = "H03"; // 香港油尖旺區住宅的 ID
            
            // 收集所有持有 H03 香港油尖旺區住宅的玩家
            const playersWithProperty = [];
            
            for (let [pWs, p] of room.players) {
                if (p.gameState.propertyInvestments && p.gameState.propertyInvestments.length > 0) {
                    const propertyIndex = p.gameState.propertyInvestments.findIndex(inv => inv.id === targetPropertyId);
                    
                    if (propertyIndex !== -1) {
                        const property = p.gameState.propertyInvestments[propertyIndex];
                        const mortgageAmount = property.mortgageAmount || 0;
                        const playerProfit = marketPrice - mortgageAmount;
                        
                        playersWithProperty.push({
                            ws: pWs,
                            player: p,
                            property: property,
                            propertyIndex: propertyIndex,
                            mortgageAmount: mortgageAmount,
                            playerProfit: playerProfit
                        });
                    }
                }
            }
            
            if (playersWithProperty.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🏠 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有香港油尖旺區住宅物業，無法出售。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有香港油尖旺區住宅物業，無法出售。`;
            }
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = playersWithProperty.map(p => ({
                    ws: p.ws,
                    playerName: p.player.playerName,
                    property: {
                        name: p.property.name,
                        marketPrice: marketPrice,
                        mortgageAmount: p.mortgageAmount,
                        profit: p.playerProfit
                    }
                }));
                
                return {
                    type: 'property_sell_choices',
                    message: `🏠 ${card.name}\n\n${card.description}\n\n市場價格：$${marketPrice.toLocaleString()} 元/套\n收益計算：市場價格 - 按揭貸款\n\n請持有香港油尖旺區住宅物業的玩家選擇是否出售：`,
                    marketPrice: marketPrice,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            // 处理玩家选择
            let soldRecords = [];
            let totalPaid = 0;
            
            for (const [playerName, willSell] of Object.entries(playerChoices)) {
                if (!willSell) continue;
                
                let playerObj = null;
                let playerWs = null;
                let propertyData = null;
                let propertyIndex = null;
                
                // 找到对应的玩家
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        if (p.gameState.propertyInvestments) {
                            const idx = p.gameState.propertyInvestments.findIndex(inv => inv.id === targetPropertyId);
                            if (idx !== -1) {
                                propertyData = p.gameState.propertyInvestments[idx];
                                propertyIndex = idx;
                            }
                        }
                        break;
                    }
                }
                
                if (!playerObj || !propertyData) continue;
                
                const mortgageAmount = propertyData.mortgageAmount || 0;
                const profit = marketPrice - mortgageAmount;
                
                // 增加现金（出售收益）
                playerObj.gameState.cash += profit;
                totalPaid += profit;
                
                // 从地产投资中删除
                playerObj.gameState.propertyInvestments.splice(propertyIndex, 1);
                
                // 如果有按揭貸款，需要清除相關的每月供款
                if (mortgageAmount > 0 && playerObj.gameState.mortgagePayment) {
                    playerObj.gameState.mortgagePayment = Math.max(0, playerObj.gameState.mortgagePayment - (propertyData.monthlyPayment || 0));
                }
                
                // 幸运值提升（成功出售）
                playerObj.gameState.luck = Math.min(playerObj.gameState.maxLuck || 10, playerObj.gameState.luck + 1);
                
                soldRecords.push(`${playerName}: 出售香港油尖旺區住宅，獲得 $${profit.toLocaleString()} 元 (市場價 $${marketPrice.toLocaleString()} - 按揭 $${mortgageAmount.toLocaleString()})`);
                
                // 记录交易
                addTransactionRecord(
                    playerName,
                    { name: "求購香港油尖旺區住宅物業", type: "market_news", id: "M12" },
                    "物業出售",
                    profit,
                    `出售香港油尖旺區住宅！市場價格 $${marketPrice.toLocaleString()}，按揭貸款 $${mortgageAmount.toLocaleString()}，獲得 $${profit.toLocaleString()} 元，幸運值 +1`,
                    null,
                    playerObj.gameState
                );
                
                // 通知该玩家
                if (playerWs) {
                    playerWs.send(JSON.stringify({
                        type: 'notification',
                        message: `🏠 你成功出售了香港油尖旺區住宅！獲得 $${profit.toLocaleString()} 元，幸運值 +1！`
                    }));
                    playerWs.send(JSON.stringify({
                        type: 'state_updated',
                        playerId: playerObj.playerId,
                        gameState: playerObj.gameState
                    }));
                }
            }
            
            if (soldRecords.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🏠 市場消息：${currentPlayer.playerName} 觸發了「${card.name}」，但沒有玩家選擇出售物業。`
                });
                return `📊 市場消息「${card.name}」完成，但沒有玩家選擇出售物業。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🏠 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n${soldRecords.length} 位玩家成功出售香港油尖旺區住宅，總金額 $${totalPaid.toLocaleString()} 元！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🏠 市場消息「${card.name}」生效！${soldRecords.length} 位玩家成功出售物業，總金額 $${totalPaid.toLocaleString()} 元。`
            }));
            
            return `🏠 求購香港油尖旺區住宅物業成功！\n` +
                `👥 出售玩家：${soldRecords.map(r => r.split(':')[0]).join(', ')}\n` +
                `💰 總支付金額：$${totalPaid.toLocaleString()} 元\n` +
                `📊 詳細記錄：\n${soldRecords.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：持有 H03 香港油尖旺區住宅的玩家可以 $8,000,000 出售，收益 = 市價 - 按揭貸款"
    },

    {
        id: "M17",
        name: "求購香港北區住宅物業",
        description: "市場現在需要以下物業。所有玩家都可以參與。\n物業要求：香港新界北區住宅物業（H04）\n市場價格：$5,000,000/套\n玩家收益 = 市場價格 - 按揭貸款",
        image: "../cards/revelation/market/M17.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const marketPrice = 5000000; // 500萬
            const targetPropertyId = "H04"; // 香港新界北區住宅的 ID
            
            // 收集所有持有 H04 香港新界北區住宅的玩家
            const playersWithProperty = [];
            
            for (let [pWs, p] of room.players) {
                if (p.gameState.propertyInvestments && p.gameState.propertyInvestments.length > 0) {
                    const propertyIndex = p.gameState.propertyInvestments.findIndex(inv => inv.id === targetPropertyId);
                    
                    if (propertyIndex !== -1) {
                        const property = p.gameState.propertyInvestments[propertyIndex];
                        const mortgageAmount = property.mortgageAmount || 0;
                        const playerProfit = marketPrice - mortgageAmount;
                        
                        playersWithProperty.push({
                            ws: pWs,
                            player: p,
                            property: property,
                            propertyIndex: propertyIndex,
                            mortgageAmount: mortgageAmount,
                            playerProfit: playerProfit
                        });
                    }
                }
            }
            
            if (playersWithProperty.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🏠 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有香港新界北區住宅物業，無法出售。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有香港新界北區住宅物業，無法出售。`;
            }
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = playersWithProperty.map(p => ({
                    ws: p.ws,
                    playerName: p.player.playerName,
                    property: {
                        name: p.property.name,
                        marketPrice: marketPrice,
                        mortgageAmount: p.mortgageAmount,
                        profit: p.playerProfit
                    }
                }));
                
                return {
                    type: 'property_sell_choices',
                    message: `🏠 ${card.name}\n\n${card.description}\n\n市場價格：$${marketPrice.toLocaleString()} 元/套\n收益計算：市場價格 - 按揭貸款\n\n請持有香港新界北區住宅物業的玩家選擇是否出售：`,
                    marketPrice: marketPrice,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            // 处理玩家选择
            let soldRecords = [];
            let totalPaid = 0;
            
            for (const [playerName, willSell] of Object.entries(playerChoices)) {
                if (!willSell) continue;
                
                let playerObj = null;
                let playerWs = null;
                let propertyData = null;
                let propertyIndex = null;
                
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        if (p.gameState.propertyInvestments) {
                            const idx = p.gameState.propertyInvestments.findIndex(inv => inv.id === targetPropertyId);
                            if (idx !== -1) {
                                propertyData = p.gameState.propertyInvestments[idx];
                                propertyIndex = idx;
                            }
                        }
                        break;
                    }
                }
                
                if (!playerObj || !propertyData) continue;
                
                const mortgageAmount = propertyData.mortgageAmount || 0;
                const profit = marketPrice - mortgageAmount;
                
                playerObj.gameState.cash += profit;
                totalPaid += profit;
                playerObj.gameState.propertyInvestments.splice(propertyIndex, 1);
                
                if (mortgageAmount > 0 && playerObj.gameState.mortgagePayment) {
                    playerObj.gameState.mortgagePayment = Math.max(0, playerObj.gameState.mortgagePayment - (propertyData.monthlyPayment || 0));
                }
                
                playerObj.gameState.luck = Math.min(playerObj.gameState.maxLuck || 10, playerObj.gameState.luck + 1);
                
                soldRecords.push(`${playerName}: 出售香港新界北區住宅，獲得 $${profit.toLocaleString()} 元 (市場價 $${marketPrice.toLocaleString()} - 按揭 $${mortgageAmount.toLocaleString()})`);
                
                addTransactionRecord(
                    playerName,
                    { name: "求購香港北區住宅物業", type: "market_news", id: "M13" },
                    "物業出售",
                    profit,
                    `出售香港新界北區住宅！市場價格 $${marketPrice.toLocaleString()}，按揭貸款 $${mortgageAmount.toLocaleString()}，獲得 $${profit.toLocaleString()} 元，幸運值 +1`,
                    null,
                    playerObj.gameState
                );
                
                if (playerWs) {
                    playerWs.send(JSON.stringify({
                        type: 'notification',
                        message: `🏠 你成功出售了香港新界北區住宅！獲得 $${profit.toLocaleString()} 元，幸運值 +1！`
                    }));
                    playerWs.send(JSON.stringify({
                        type: 'state_updated',
                        playerId: playerObj.playerId,
                        gameState: playerObj.gameState
                    }));
                }
            }
            
            if (soldRecords.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🏠 市場消息：${currentPlayer.playerName} 觸發了「${card.name}」，但沒有玩家選擇出售物業。`
                });
                return `📊 市場消息「${card.name}」完成，但沒有玩家選擇出售物業。`;
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🏠 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n${soldRecords.length} 位玩家成功出售香港新界北區住宅，總金額 $${totalPaid.toLocaleString()} 元！`
            });
            
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🏠 市場消息「${card.name}」生效！${soldRecords.length} 位玩家成功出售物業，總金額 $${totalPaid.toLocaleString()} 元。`
            }));
            
            return `🏠 求購香港北區住宅物業成功！\n` +
                `👥 出售玩家：${soldRecords.map(r => r.split(':')[0]).join(', ')}\n` +
                `💰 總支付金額：$${totalPaid.toLocaleString()} 元\n` +
                `📊 詳細記錄：\n${soldRecords.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：持有 H04 香港新界北區住宅的玩家可以 $5,000,000 出售，收益 = 市價 - 按揭貸款"
    },
    {
        id: "M18",
        name: "求租香港工廈",
        description: "市場現在需要以下物業。所有玩家都可以參與。\n物業要求：香港工廈（H05）\n市場租金：$30,000\n每月被動收入增加 $6,000",
        image: "../cards/revelation/market/M18.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const rentIncrease = 30000; // 租金增加 $30,000
            const passiveIncomeIncrease = 6000; // 被動收入增加 $6,000
            const targetPropertyId = "H05"; // 香港工廈的 ID
            
            // 收集所有持有 H05 香港工廈的玩家
            const playersWithProperty = [];
            
            for (let [pWs, p] of room.players) {
                if (p.gameState.propertyInvestments && p.gameState.propertyInvestments.length > 0) {
                    const propertyIndex = p.gameState.propertyInvestments.findIndex(inv => inv.id === targetPropertyId);
                    
                    if (propertyIndex !== -1) {
                        const property = p.gameState.propertyInvestments[propertyIndex];
                        const oldMonthlyReturn = property.monthlyReturn || 0;
                        const newMonthlyReturn = oldMonthlyReturn + passiveIncomeIncrease;
                        
                        playersWithProperty.push({
                            ws: pWs,
                            player: p,
                            property: property,
                            propertyIndex: propertyIndex,
                            oldMonthlyReturn: oldMonthlyReturn,
                            newMonthlyReturn: newMonthlyReturn
                        });
                    }
                }
            }
            
            if (playersWithProperty.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🏭 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有香港工廈，無法受益。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有香港工廈，無法受益。`;
            }
            
            // 处理所有持有工廈的玩家（自动生效，无需选择）
            let affectedPlayers = [];
            let changes = [];
            
            for (const { ws: pWs, player: p, property, propertyIndex, oldMonthlyReturn, newMonthlyReturn } of playersWithProperty) {
                // 更新每月租金收入（被動收入）
                property.monthlyReturn = newMonthlyReturn;
                property.rentIncreased = true;
                property.increaseAmount = passiveIncomeIncrease;
                
                // 更新玩家的被動收入
                p.gameState.passiveIncome = (p.gameState.passiveIncome || 0) + passiveIncomeIncrease;
                
                // 更新总资产（租金收入增加提升物業價值）
                p.gameState.totalAssets = (p.gameState.totalAssets || 0) + (passiveIncomeIncrease * 12 * 10); // 簡單估值：年收入 × 10
                
                affectedPlayers.push(p.playerName);
                changes.push(`${p.playerName}: 香港工廈租金上漲！每月租金 $${oldMonthlyReturn.toLocaleString()} → $${newMonthlyReturn.toLocaleString()}，被動收入 +$${passiveIncomeIncrease.toLocaleString()}/月`);
                
                // 记录交易
                addTransactionRecord(
                    p.playerName,
                    { name: "求租香港工廈", type: "market_news", id: "M14" },
                    "租金上漲",
                    0,
                    `香港工廈租金上漲！市場租金 $${rentIncrease.toLocaleString()}，每月被動收入增加 $${passiveIncomeIncrease.toLocaleString()} 元`,
                    null,
                    p.gameState
                );
                
                // 通知该玩家
                if (pWs && pWs !== ws) {
                    pWs.send(JSON.stringify({
                        type: 'notification',
                        message: `🏭 市場消息：${currentPlayer.playerName} 觸發了「求租香港工廈」！你持有的香港工廈每月被動收入增加 $${passiveIncomeIncrease.toLocaleString()} 元！`
                    }));
                    pWs.send(JSON.stringify({
                        type: 'state_updated',
                        playerId: p.playerId,
                        gameState: p.gameState
                    }));
                }
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🏭 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n受影響玩家：${affectedPlayers.join(', ')}\n香港工廈每月被動收入增加 $${passiveIncomeIncrease.toLocaleString()} 元！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🏭 市場消息「${card.name}」生效！${affectedPlayers.length} 位玩家的香港工廈租金上漲，每月被動收入 +$${passiveIncomeIncrease.toLocaleString()} 元。`
            }));
            
            return `🏭 求租香港工廈成功！\n` +
                `👥 受影響玩家：${affectedPlayers.join(', ')}\n` +
                `💰 市場租金：$${rentIncrease.toLocaleString()}/月\n` +
                `📈 被動收入增加：+$${passiveIncomeIncrease.toLocaleString()}/月\n` +
                `📊 詳細記錄：\n${changes.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：持有 H05 香港工廈的玩家，每月被動收入 +$6,000"
    },

    {
        id: "M19",
        name: "香港住宅物業價格下跌",
        description: "由於很多港人移民海外及內地，住屋需求減少，香港樓價回落，租金下跌。\n所有持有香港住宅物業的玩家，物業總價下跌10%，每月被動收入減少$500。",
        image: "../cards/revelation/market/M19.png",
        cost: 500,
        type: "market_news",
        category: "市场消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            const priceDecreasePercent = 10; // 價格下跌10%
            const passiveIncomeDecrease = 500; // 被動收入減少500
            
            // 住宅物業 ID 列表 (H01, H02, H03, H04)
            const residentialPropertyIds = ["H01", "H02", "H03", "H04"];
            
            // 遍历所有玩家
            for (let [pWs, p] of room.players) {
                let playerChanges = [];
                let totalValueDecrease = 0;
                let totalPassiveDecrease = 0;
                let hasResidentialProperty = false;
                
                if (p.gameState.propertyInvestments && p.gameState.propertyInvestments.length > 0) {
                    // 遍历所有住宅物業
                    for (let i = 0; i < p.gameState.propertyInvestments.length; i++) {
                        const property = p.gameState.propertyInvestments[i];
                        
                        if (residentialPropertyIds.includes(property.id)) {
                            hasResidentialProperty = true;
                            
                            // 計算價格下跌金額
                            const oldTotalPrice = property.totalPrice;
                            const decreaseAmount = Math.floor(oldTotalPrice * priceDecreasePercent / 100);
                            const newTotalPrice = oldTotalPrice - decreaseAmount;
                            totalValueDecrease += decreaseAmount;
                            
                            // 更新物業總價
                            property.totalPrice = newTotalPrice;
                            property.priceDecreased = true;
                            property.decreasePercent = priceDecreasePercent;
                            
                            // 減少每月被動收入
                            const oldMonthlyReturn = property.monthlyReturn || 0;
                            const newMonthlyReturn = Math.max(0, oldMonthlyReturn - passiveIncomeDecrease);
                            const monthlyDecrease = oldMonthlyReturn - newMonthlyReturn;
                            totalPassiveDecrease += monthlyDecrease;
                            
                            property.monthlyReturn = newMonthlyReturn;
                            
                            playerChanges.push(`${property.name}: 總價 $${oldTotalPrice.toLocaleString()} → $${newTotalPrice.toLocaleString()} (下跌 $${decreaseAmount.toLocaleString()})，每月收入 $${oldMonthlyReturn.toLocaleString()} → $${newMonthlyReturn.toLocaleString()} (減少 $${monthlyDecrease.toLocaleString()})`);
                        }
                    }
                    
                    if (hasResidentialProperty) {
                        // 更新總資產
                        p.gameState.totalAssets = Math.max(0, (p.gameState.totalAssets || 0) - totalValueDecrease);
                        
                        // 更新被動收入
                        p.gameState.passiveIncome = Math.max(0, (p.gameState.passiveIncome || 0) - totalPassiveDecrease);
                        
                        // 幸运值下降（樓市下跌影響）
                        p.gameState.luck = Math.max(0, p.gameState.luck - 1);
                        
                        affectedPlayers.push(p.playerName);
                        changes.push(`${p.playerName}: 總資產減少 $${totalValueDecrease.toLocaleString()}，被動收入減少 $${totalPassiveDecrease.toLocaleString()}/月\n   ${playerChanges.join('\n   ')}`);
                        
                        // 记录交易
                        addTransactionRecord(
                            p.playerName,
                            { name: "香港住宅物業價格下跌", type: "market_news", id: "M15" },
                            "物業貶值",
                            -totalValueDecrease,
                            `香港住宅物業價格下跌！物業總價下跌 ${priceDecreasePercent}%，每月被動收入減少 $${totalPassiveDecrease.toLocaleString()} 元，幸運值 -1`,
                            null,
                            p.gameState
                        );
                        
                        // 通知该玩家
                        if (pWs && pWs !== ws) {
                            pWs.send(JSON.stringify({
                                type: 'notification',
                                message: `📉 市場消息：${currentPlayer.playerName} 觸發了「香港住宅物業價格下跌」！你的住宅物業總價下跌 ${priceDecreasePercent}%，被動收入減少 $${totalPassiveDecrease.toLocaleString()} 元/月，幸運值 -1！`
                            }));
                            pWs.send(JSON.stringify({
                                type: 'state_updated',
                                playerId: p.playerId,
                                gameState: p.gameState
                            }));
                        }
                    }
                }
            }
            
            if (affectedPlayers.length === 0) {
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `📉 市場消息：${currentPlayer.playerName} 獲得了「${card.name}」，但沒有玩家持有香港住宅物業，沒有人受影響。`
                });
                return `📊 市場消息「${card.name}」生效，但沒有玩家持有香港住宅物業，沒有人受影響。`;
            }
            
            // 广播给所有玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `📉 ${currentPlayer.playerName} 觸發市場消息「${card.name}」！\n受影響玩家：${affectedPlayers.join(', ')}\n香港住宅物業價格下跌 ${priceDecreasePercent}%，被動收入每月減少 $500！`
            });
            
            // 通知当前玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `📉 市場消息「${card.name}」生效！${affectedPlayers.length} 位玩家的住宅物業貶值，被動收入減少。`
            }));
            
            return `📉 香港住宅物業價格下跌！\n` +
                `👥 受影響玩家：${affectedPlayers.join(', ')}\n` +
                `📊 物業總價下跌 ${priceDecreasePercent}%\n` +
                `💰 每月被動收入減少 $${passiveIncomeDecrease.toLocaleString()}/月 (每個物業)\n` +
                `🍀 受影響玩家幸運值 -1\n` +
                `📊 詳細變化：\n${changes.join('\n')}`;
        },
        getEffectDescription: () => "市場消息：所有持有香港住宅物業 (H02/H03/H04) 的玩家，物業總價下跌10%，每月被動收入減少 $500，幸運值 -1"
    }
   
];

// ==================== 锦囊卡 ====================
const tipCards = [
      {
        id: "IN01",
        name: "健康投資",
        description: "你體驗到健康是無法用金錢衡量的，健康是1，其他都是0，開始投資自己的健康。\n自願選擇是否投資。\n健康投資支出：$1,000/月\n精力：+1/月",
        image: "../cards/revelation/tip/IN01.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "team",  // 团队锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const monthlyCost = 1000;  // 每月支出 $1,000
            const energyBonus = 1;     // 每月精力 +1
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = [];
                for (let [pWs, p] of room.players) {
                    playersToAsk.push({
                        ws: pWs,
                        playerName: p.playerName,
                        cash: p.gameState.cash
                    });
                }
                
                return {
                    type: 'team_tip_choices',
                    message: `💪 ${card.name}\n\n${card.description}\n\n投資金額：$${monthlyCost.toLocaleString()}/月\n\n投資後獲得：\n   • 每月精力 +${energyBonus}\n   • 健康是最大的財富！\n\n請每位玩家選擇是否投資：`,
                    investmentCost: monthlyCost,
                    energyBonus: energyBonus,
                    luckBonus: 0,
                    isRecurring: true,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            let investors = [];
            
            for (const [playerName, willInvest] of Object.entries(playerChoices)) {
                if (!willInvest) continue;
                
                let playerObj = null;
                let playerWs = null;
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        break;
                    }
                }
                
                if (playerObj && playerObj.gameState.cash >= monthlyCost) {
                    playerObj.gameState.cash -= monthlyCost;
                    
                    if (!playerObj.gameState.healthInvestment) {
                        playerObj.gameState.healthInvestment = {
                            active: true,
                            monthlyCost: monthlyCost,
                            energyBonus: energyBonus,
                            startTurn: playerObj.gameState.totalTurns || 0
                        };
                    }
                    
                    playerObj.gameState.energy = Math.min(playerObj.gameState.maxEnergy, playerObj.gameState.energy + energyBonus);
                    investors.push(playerName);
                    
                    addTransactionRecord(
                        playerName,
                        { name: card.name, type: "tip", id: card.id },
                        "健康投資",
                        -monthlyCost,
                        `開始健康投資！每月支出 $${monthlyCost.toLocaleString()} 元，每月精力 +${energyBonus}`,
                        null,
                        playerObj.gameState
                    );
                    
                    if (playerWs) {
                        playerWs.send(JSON.stringify({
                            type: 'notification',
                            message: `💪 你開始了健康投資！每月支出 $${monthlyCost.toLocaleString()} 元，每月精力 +${energyBonus}！健康是最大的財富！`
                        }));
                        playerWs.send(JSON.stringify({
                            type: 'state_updated',
                            playerId: playerObj.playerId,
                            gameState: playerObj.gameState
                        }));
                    }
                } else if (playerObj && playerObj.gameState.cash < monthlyCost) {
                    if (playerWs) {
                        playerWs.send(JSON.stringify({
                            type: 'notification',
                            message: `⚠️ 你選擇投資健康，但現金不足 $${monthlyCost.toLocaleString()} 元，無法開始健康投資。`
                        }));
                    }
                }
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `💪 ${currentPlayer.playerName} 觸發團隊錦囊「${card.name}」！${investors.length > 0 ? `${investors.join(', ')} 開始健康投資！` : '沒有玩家參與投資。'}`
            });
            
            if (investors.length === 0) {
                return `💪 團隊錦囊「${card.name}」完成，但沒有玩家參與投資。`;
            }
            
            return `💪 團隊錦囊「${card.name}」完成！\n` +
                   `👥 投資玩家：${investors.join(', ')}\n` +
                   `💰 每月支出：$${monthlyCost.toLocaleString()} 元\n` +
                   `⚡ 每月獲得：精力 +${energyBonus}\n` +
                   `💚 健康是最大的財富！`;
        },
        getEffectDescription: () => "團隊錦囊：每位玩家可自願投資 $1,000/月，獲得每月精力 +1"
    },

     {
        id: "IN02",
        name: "個人品牌建立",
        description: "你意識到形象管理非常重要，開始學習如何打造自己的形象，結交到人脈質量也越來越好，信譽越來越高。\n自願選擇是否學習\n學習投資：$10,000\n精力：-3\n向銀行借貸月息變為永久2%\n貸款額度提高至月現金流40倍",
        image: "../cards/revelation/tip/IN02.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "team",  // 改为团队锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const investmentCost = 10000;
            const energyCost = 3;
            
            // 如果需要收集玩家选择
            if (!playerChoices) {
                const playersToAsk = [];
                for (let [pWs, p] of room.players) {
                    playersToAsk.push({
                        ws: pWs,
                        playerName: p.playerName,
                        cash: p.gameState.cash,
                        energy: p.gameState.energy
                    });
                }
                
                return {
                    type: 'team_tip_choices',
                    message: `✨ ${card.name}\n\n${card.description}\n\n學習投資：$${investmentCost.toLocaleString()} 元\n精力消耗：-${energyCost}\n\n學習後獲得：\n   • 向銀行借貸月息變為永久 2%\n   • 貸款額度提高至月現金流 40 倍\n   • 人脈加成 +10%\n\n請每位玩家選擇是否學習：`,
                    investmentCost: investmentCost,
                    energyCost: energyCost,
                    playersToAsk: playersToAsk,
                    cardId: card.id,
                    cardName: card.name
                };
            }
            
            let learners = [];
            
            for (const [playerName, willLearn] of Object.entries(playerChoices)) {
                if (!willLearn) continue;
                
                let playerObj = null;
                let playerWs = null;
                for (let [pWs, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        playerWs = pWs;
                        break;
                    }
                }
                
                if (playerObj && playerObj.gameState.cash >= investmentCost && playerObj.gameState.energy >= energyCost) {
                    // 扣除費用和精力
                    playerObj.gameState.cash -= investmentCost;
                    playerObj.gameState.energy -= energyCost;
                    
                    // 永久降低贷款利率至2%
                    playerObj.gameState.permanentLoanRate = 2;
                    // 提高贷款额度至月现金流40倍
                    playerObj.gameState.loanMultiplier = 40;
                    // 人脈加成提升
                    playerObj.gameState.sideIncomeBonus = (playerObj.gameState.sideIncomeBonus || 0) + 0.1;
                    
                    learners.push(playerName);
                    
                    addTransactionRecord(
                        playerName,
                        { name: card.name, type: "tip", id: card.id },
                        "個人品牌建立",
                        -investmentCost,
                        `學習個人品牌建立！花費 $${investmentCost.toLocaleString()} 元，精力 -${energyCost}，貸款利率降至2%，貸款額度40倍，人脈+10%`,
                        null,
                        playerObj.gameState
                    );
                    
                    if (playerWs) {
                        playerWs.send(JSON.stringify({
                            type: 'notification',
                            message: `✨ 你學習了個人品牌建立！花費 $${investmentCost.toLocaleString()} 元，精力 -${energyCost}。貸款利率降至 2%，貸款額度提高至月現金流 40 倍，人脈加成 +10%！`
                        }));
                        playerWs.send(JSON.stringify({
                            type: 'state_updated',
                            playerId: playerObj.playerId,
                            gameState: playerObj.gameState
                        }));
                    }
                } else if (playerObj) {
                    if (playerObj.gameState.cash < investmentCost && playerObj.gameState.energy < energyCost) {
                        if (playerWs) {
                            playerWs.send(JSON.stringify({
                                type: 'notification',
                                message: `⚠️ 你選擇學習個人品牌建立，但現金不足 $${investmentCost.toLocaleString()} 元且精力不足 ${energyCost} 點，無法學習。`
                            }));
                        }
                    } else if (playerObj.gameState.cash < investmentCost) {
                        if (playerWs) {
                            playerWs.send(JSON.stringify({
                                type: 'notification',
                                message: `⚠️ 你選擇學習個人品牌建立，但現金不足 $${investmentCost.toLocaleString()} 元，無法學習。`
                            }));
                        }
                    } else if (playerObj.gameState.energy < energyCost) {
                        if (playerWs) {
                            playerWs.send(JSON.stringify({
                                type: 'notification',
                                message: `⚠️ 你選擇學習個人品牌建立，但精力不足 ${energyCost} 點，無法學習。`
                            }));
                        }
                    }
                }
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `✨ ${currentPlayer.playerName} 觸發團隊錦囊「${card.name}」！${learners.length > 0 ? `${learners.join(', ')} 學習了個人品牌建立！` : '沒有玩家參與學習。'}`
            });
            
            if (learners.length === 0) {
                return `✨ 團隊錦囊「${card.name}」完成，但沒有玩家參與學習。`;
            }
            
            return `✨ 團隊錦囊「${card.name}」完成！\n` +
                   `👥 學習玩家：${learners.join(', ')}\n` +
                   `💰 學習投資：$${investmentCost.toLocaleString()} 元\n` +
                   `⚡ 精力消耗：-${energyCost}\n` +
                   `🏦 向銀行借貸月息變為永久 2%\n` +
                   `💵 貸款額度提高至月現金流 40 倍\n` +
                   `🤝 人脈加成 +10%`;
        },
        getEffectDescription: () => "團隊錦囊：每位玩家可自願投資 $10,000，精力 -3，貸款利率降至2%，貸款額度升至月現金流40倍，人脈加成+10%"
    },

    {
        id: "IN03",
        name: "慢活",
        description: "每人擲一次骰子\n點數\n1: 抽1逆境卡\n2: 損失$2,000\n3-4: 抽1機會卡\n5-6: 獲得2精力 或 $2,000 (可選擇)",
        image: "../cards/revelation/tip/IN03.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "team",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            // 收集所有玩家（包括執行者）
            const allPlayers = [];
            for (let [pWs, p] of room.players) {
                allPlayers.push({
                    ws: pWs,
                    player: p
                });
            }
            
            // 如果需要收集玩家对5-6的選擇
            if (!playerChoices) {
                // 先讓每個玩家擲骰子
                const diceResults = [];
                for (const { ws: pWs, player: p } of allPlayers) {
                    const diceRoll = Math.floor(Math.random() * 6) + 1;
                    diceResults.push({
                        ws: pWs,
                        playerName: p.playerName,
                        diceRoll: diceRoll,
                        result: getDiceResultMessage(diceRoll)
                    });
                }
                
                // 檢查是否有玩家擲出5-6需要選擇
                const playersNeedChoice = diceResults.filter(r => r.diceRoll === 5 || r.diceRoll === 6);
                
                if (playersNeedChoice.length > 0) {
                    return {
                        type: 'slow_life_choices',
                        message: `🧘 ${card.name}\n\n${card.description}\n\n請選擇獎勵：`,
                        diceResults: diceResults,
                        playersNeedChoice: playersNeedChoice,
                        cardId: card.id,
                        cardName: card.name
                    };
                }
                
                // 沒有需要選擇的，直接執行所有結果
                return executeSlowLifeResults(room, allPlayers, diceResults, currentPlayer, ws, roomId, card);
            }
            
            // 處理玩家選擇（5-6的獎勵選擇）
            // playerChoices 格式: { playerName: 'energy' 或 'cash' }
            
            // 重新擲骰子（或從儲存的结果获取）
            const diceResults = [];
            for (const { ws: pWs, player: p } of allPlayers) {
                const diceRoll = Math.floor(Math.random() * 6) + 1;
                diceResults.push({
                    ws: pWs,
                    playerName: p.playerName,
                    diceRoll: diceRoll,
                    result: getDiceResultMessage(diceRoll)
                });
            }
            
            // 應用玩家選擇
            for (const { playerName, diceRoll } of diceResults) {
                if (diceRoll === 5 || diceRoll === 6) {
                    const choice = playerChoices[playerName];
                    if (choice === 'energy') {
                        // 找到對應玩家，給予精力
                        for (const { ws: pWs, player: p } of allPlayers) {
                            if (p.playerName === playerName) {
                                p.gameState.energy = Math.min(p.gameState.maxEnergy, p.gameState.energy + 2);
                                break;
                            }
                        }
                    } else if (choice === 'cash') {
                        for (const { ws: pWs, player: p } of allPlayers) {
                            if (p.playerName === playerName) {
                                p.gameState.cash += 2000;
                                break;
                            }
                        }
                    }
                }
            }
            
            return executeSlowLifeResults(room, allPlayers, diceResults, currentPlayer, ws, roomId, card, playerChoices);
        },
        getEffectDescription: () => "團隊錦囊：每人擲骰子，1→逆境卡，2→損失$2,000，3-4→機會卡，5-6→獲得2精力或$2,000"
    },

    {
        id: "IN04",
        name: "身體健康最重要",
        description: "身體健康最重要，每月支出一筆錢購買保健品，讓自己身體越來越好。\n健康投資支出：$2,000/月\n精力：+1/月",
        image: "../cards/revelation/tip/IN04.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const monthlyCost = 2000;  // 每月支出 $2,000
            const energyBonus = 1;     // 每月精力 +1
            
            // 检查是否已经投资
            if (state.healthSupplementInvestment && state.healthSupplementInvestment.active) {
                return `⚠️ 你已經在進行保健品投資了，無需重複投資。`;
            }
            
            // 检查现金是否足够支付首月费用
            if (state.cash < monthlyCost) {
                return `❌ 現金不足 $${monthlyCost.toLocaleString()} 元，無法開始保健品投資。`;
            }
            
            // 扣除首月费用
            state.cash -= monthlyCost;
            
            // 立即获得本月精力奖励
            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);
            
            // 记录健康保健品投资状态（每月自动生效）
            state.healthSupplementInvestment = {
                active: true,
                monthlyCost: monthlyCost,
                energyBonus: energyBonus,
                startTurn: state.totalTurns || 0
            };
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "保健品投資",
                -monthlyCost,
                `開始保健品投資！每月支出 $${monthlyCost.toLocaleString()} 元，每月精力 +${energyBonus}`,
                null,
                state
            );
            
            // 通知玩家
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `💊 你開始了保健品投資！每月支出 $${monthlyCost.toLocaleString()} 元，每月精力 +${energyBonus}！身體健康最重要！`
                }));
                ws.send(JSON.stringify({
                    type: 'state_updated',
                    playerId: currentPlayer.playerId,
                    gameState: state
                }));
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `💊 ${currentPlayer.playerName} 開始了保健品投資！每月支出 $${monthlyCost.toLocaleString()} 元，每月精力 +${energyBonus}！`
            }, ws);
            
            return `✨ 開始保健品投資成功！\n` +
                `💰 每月支出：$${monthlyCost.toLocaleString()} 元\n` +
                `⚡ 每月獲得：精力 +${energyBonus}\n` +
                `💚 身體健康是最大的財富！\n` +
                `📝 首次支付已扣除，每月結算日自動扣款。`;
        },
        getEffectDescription: () => "個人錦囊：每月支出 $2,000，獲得每月精力 +1"
    },

    {
        id: "IN05",
        name: "釋放情緒",
        description: "學會釋放情緒，放下不必要的煩惱，心情輕鬆愉快。\n自願選擇是否學習。\n投資：$5,000\n獲得2個幸運星",
        image: "../cards/revelation/tip/IN05.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const investmentCost = 5000;
            const luckyStarReward = 2;  // 獲得2個幸運星
            
            // 个人锦囊，直接询问是否学习
            const userChoice = confirm(
                `🧘 ${card.name}\n\n${card.description}\n\n學習投資：$${investmentCost.toLocaleString()} 元\n\n學習後獲得：\n   • 幸運星 x${luckyStarReward}\n   • 心情輕鬆愉快，好運降臨！\n\n你是否願意學習？`
            );
            
            if (!userChoice) {
                return `❌ 你決定不學習「${card.name}」，已支付的 500 元無法退還。`;
            }
            
            // 检查现金是否足够
            if (state.cash < investmentCost) {
                return `❌ 現金不足 $${investmentCost.toLocaleString()} 元，無法學習釋放情緒。`;
            }
            
            // 扣除費用
            state.cash -= investmentCost;
            
            // 獲得幸運星
            state.luckyStarCount = (state.luckyStarCount || 0) + luckyStarReward;
            
            // 精力提升（心情輕鬆）
            state.energy = Math.min(state.maxEnergy, state.energy + 2);
            
            // 幸运值提升
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "學習釋放情緒",
                -investmentCost,
                `學習釋放情緒！花費 $${investmentCost.toLocaleString()} 元，獲得 ${luckyStarReward} 個幸運星，精力 +2，幸運值 +1`,
                null,
                state
            );
            
            // 通知玩家
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `🧘 你學習了釋放情緒！花費 $${investmentCost.toLocaleString()} 元，獲得 ${luckyStarReward} 個幸運星，精力 +2，幸運值 +1！心情輕鬆愉快！`
                }));
                ws.send(JSON.stringify({
                    type: 'state_updated',
                    playerId: currentPlayer.playerId,
                    gameState: state
                }));
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🧘 ${currentPlayer.playerName} 學習了釋放情緒，獲得 ${luckyStarReward} 個幸運星！`
            }, ws);
            
            return `🧘 學習釋放情緒成功！\n` +
                `💰 花費：$${investmentCost.toLocaleString()} 元\n` +
                `⭐ 獲得：${luckyStarReward} 個幸運星\n` +
                `⚡ 精力 +2\n` +
                `🍀 幸運值 +1\n` +
                `😊 心情輕鬆愉快，好運降臨！\n` +
                `📝 目前幸運星數量：${state.luckyStarCount}`;
        },
        getEffectDescription: () => "個人錦囊：投資 $5,000，獲得 2 個幸運星，精力 +2，幸運值 +1"
    },

    {
        id: "IN06",
        name: "社交人脈",
        description: "你了解社交人脈的重要。\n精力 +3",
        image: "../cards/revelation/tip/IN06.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const energyBonus = 3;
            
            // 个人锦囊，直接询问是否学习
            const userChoice = confirm(
                `🤝 ${card.name}\n\n${card.description}\n\n學習後獲得：\n   • 精力 +${energyBonus}\n   • 拓展社交圈，人脈廣闊！\n\n你是否願意學習？（已支付 500 元）`
            );
            
            if (!userChoice) {
                return `❌ 你決定不學習「${card.name}」，已支付的 500 元無法退還。`;
            }
            
            // 獲得精力獎勵
            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);
            
            // 人脈加成提升（可選）
            if (!state.sideIncomeBonus) {
                state.sideIncomeBonus = 0;
            }
            // 輕微人脈加成
            state.sideIncomeBonus = Math.min(0.5, state.sideIncomeBonus + 0.05);
            
            // 幸运值微升（人脈帶來好運）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "學習社交人脈",
                0,
                `學習社交人脈！精力 +${energyBonus}，人脈加成 +5%，幸運值 +1`,
                null,
                state
            );
            
            // 通知玩家
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `🤝 你學習了社交人脈！精力 +${energyBonus}，人脈加成 +5%，幸運值 +1！社交圈擴展，機會更多！`
                }));
                ws.send(JSON.stringify({
                    type: 'state_updated',
                    playerId: currentPlayer.playerId,
                    gameState: state
                }));
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🤝 ${currentPlayer.playerName} 學習了社交人脈，精力 +${energyBonus}！`
            }, ws);
            
            return `🤝 學習社交人脈成功！\n` +
                `⚡ 精力 +${energyBonus}\n` +
                `🤝 人脈加成 +5%\n` +
                `🍀 幸運值 +1\n` +
                `📈 社交圈擴展，未來機會更多！`;
        },
        getEffectDescription: () => "個人錦囊：精力 +3，人脈加成 +5%，幸運值 +1"
    },

    {
        id: "IN07",
        name: "面對恐懼",
        description: "越抗拒越揮之不去，只要勇敢面對恐懼才能遇見新契機。\n抽取一張逆境卡\n精力 +2",
        image: "../cards/revelation/tip/IN07.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const energyBonus = 2;
            
            // 个人锦囊，直接询问是否执行
            const userChoice = confirm(
                `🦁 ${card.name}\n\n${card.description}\n\n執行後獲得：\n   • 精力 +${energyBonus}\n   • 抽取一張逆境卡（勇敢面對）\n\n你是否願意執行？（已支付 500 元）`
            );
            
            if (!userChoice) {
                return `❌ 你決定不執行「${card.name}」，已支付的 500 元無法退還。`;
            }
            
            // 獲得精力獎勵
            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);
            
            // 幸运值微升（勇敢面對恐懼）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            // 记录交易 - 修复这里！
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "面對恐懼",
                0,
                `勇敢面對恐懼！精力 +${energyBonus}，幸運值 +1 (逆境卡系統開發中)`,
                null,
                state
            );
            
            // 通知玩家
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `🦁 你勇敢面對恐懼！精力 +${energyBonus}，幸運值 +1！ (逆境卡系統開發中)`
                }));
                ws.send(JSON.stringify({
                    type: 'state_updated',
                    playerId: currentPlayer.playerId,
                    gameState: state
                }));
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🦁 ${currentPlayer.playerName} 勇敢面對恐懼，精力 +${energyBonus}！`
            }, ws);
            
            // TODO: 逆境卡系統開發完成後，在這裡添加抽逆境卡的邏輯
            ws.send(JSON.stringify({
                type: 'notification',
                message: `📜 注意：逆境卡系統正在開發中，暫時無法抽取逆境卡。`
            }));
            
            return `🦁 勇敢面對恐懼成功！\n` +
                `⚡ 精力 +${energyBonus}\n` +
                `🍀 幸運值 +1\n` +
                `📜 逆境卡系統開發中，暫時無法抽取逆境卡。\n` +
                `💪 勇氣可嘉！繼續保持！`;
        },
        getEffectDescription: () => "個人錦囊：精力 +2，幸運值 +1，抽取一張逆境卡（開發中）"
    },

    {
        id: "IN08",
        name: "凡事感恩",
        description: "凡事感恩，奇蹟誕生。\n獲得兩個一次使用的四葉草",
        image: "../cards/revelation/tip/IN08.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const fourLeafCloverReward = 2;  // 獲得2個四葉草
            
            // 个人锦囊，直接询问是否执行
            const userChoice = confirm(
                `🙏 ${card.name}\n\n${card.description}\n\n執行後獲得：\n   • 四葉草 x${fourLeafCloverReward}\n   • 感恩的心帶來奇蹟！\n\n你是否願意執行？（已支付 500 元）`
            );
            
            if (!userChoice) {
                return `❌ 你決定不執行「${card.name}」，已支付的 500 元無法退還。`;
            }
            
            // 獲得四葉草
            state.fourLeafClover = (state.fourLeafClover || 0) + fourLeafCloverReward;
            
            // 精力提升（心情愉快）
            state.energy = Math.min(state.maxEnergy, state.energy + 2);
            
            // 幸运值提升（感恩帶來好運）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "凡事感恩",
                0,
                `凡事感恩！獲得 ${fourLeafCloverReward} 個四葉草，精力 +2，幸運值 +1`,
                null,
                state
            );
            
            // 通知玩家
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `🙏 你學會了凡事感恩！獲得 ${fourLeafCloverReward} 個四葉草，精力 +2，幸運值 +1！奇蹟即將誕生！`
                }));
                ws.send(JSON.stringify({
                    type: 'state_updated',
                    playerId: currentPlayer.playerId,
                    gameState: state
                }));
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🙏 ${currentPlayer.playerName} 學會了凡事感恩，獲得 ${fourLeafCloverReward} 個四葉草！`
            }, ws);
            
            return `🙏 凡事感恩成功！\n` +
                `🍀 獲得：${fourLeafCloverReward} 個四葉草\n` +
                `⚡ 精力 +2\n` +
                `🍀 幸運值 +1\n` +
                `✨ 感恩的心帶來奇蹟！\n` +
                `📝 目前四葉草數量：${state.fourLeafClover}`;
        },
        getEffectDescription: () => "個人錦囊：獲得 2 個四葉草，精力 +2，幸運值 +1"
    },

    {
        id: "IN09",
        name: "保持警惕",
        description: "保持警惕不輕信網上信息。\n錦囊：取消你下一張騙子卡。",
        image: "../cards/revelation/tip/IN09.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            // 个人锦囊，直接询问是否执行
            const userChoice = confirm(
                `🛡️ ${card.name}\n\n${card.description}\n\n執行後獲得：\n   • 取消下一張騙子卡\n   • 保持警惕，遠離詐騙！\n\n你是否願意執行？（已支付 500 元）`
            );
            
            if (!userChoice) {
                return `❌ 你決定不執行「${card.name}」，已支付的 500 元無法退還。`;
            }
            
            // 增加騙子卡取消次數
            state.lierCardCancellation = (state.lierCardCancellation || 0) + 1;
            
            // 精力提升（警覺性提高）
            state.energy = Math.min(state.maxEnergy, state.energy + 2);
            
            // 幸运值提升（避開詐騙）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "保持警惕",
                0,
                `獲得騙子卡取消機會！可取消下一張騙子卡，精力 +2，幸運值 +1`,
                null,
                state
            );
            
            // 通知玩家
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `🛡️ 你學會了保持警惕！獲得一次取消騙子卡的機會，精力 +2，幸運值 +1！遠離詐騙，保護財產！`
                }));
                ws.send(JSON.stringify({
                    type: 'state_updated',
                    playerId: currentPlayer.playerId,
                    gameState: state
                }));
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🛡️ ${currentPlayer.playerName} 學會了保持警惕，獲得一次取消騙子卡的機會！`
            }, ws);
            
            return `🛡️ 保持警惕成功！\n` +
                `🛡️ 獲得：1 次取消騙子卡的機會\n` +
                `⚡ 精力 +2\n` +
                `🍀 幸運值 +1\n` +
                `📝 提醒：下一張騙子卡將被自動取消！\n` +
                `🔒 遠離詐騙，保護財產！`;
        },
        getEffectDescription: () => "個人錦囊：取消下一張騙子卡，精力 +2，幸運值 +1"
    },

    {
        id: "IN10",
        name: "舉報騙案",
        description: "友人被網上騙財，你發現阻止並及時舉報。\n下次其他玩家有關騙子卡，你可以幫他防範一次，遊戲完結時，計算作一次義工。",
        image: "../cards/revelation/tip/IN10.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            // 个人锦囊，直接询问是否执行
            const userChoice = confirm(
                `👮 ${card.name}\n\n${card.description}\n\n執行後獲得：\n   • 獲得 1 次義工資格（可幫助其他玩家防範騙子卡）\n   • 打擊詐騙，維護正義！\n\n你是否願意執行？（已支付 500 元）`
            );
            
            if (!userChoice) {
                return `❌ 你決定不執行「${card.name}」，已支付的 500 元無法退還。`;
            }
            
            // 增加義工次數（用於幫助其他玩家抵擋騙子卡）
            state.volunteerCount = (state.volunteerCount || 0) + 1;
            state.volunteerShield = (state.volunteerShield || 0) + 1;
            
            // 精力消耗（舉報需要精力）
            state.energy = Math.max(0, state.energy - 1);
            
            // 幸运值提升（善有善報）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 2);
            
            // 额外精力（正義感帶來的滿足）
            state.energy = Math.min(state.maxEnergy, state.energy + 2);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "舉報騙案",
                0,
                `獲得義工資格！可幫助其他玩家防範騙子卡，精力 +1，幸運值 +2，額外精力 +2`,
                null,
                state
            );
            
            // 通知玩家
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `👮 你成功舉報騙案！獲得 1 次義工資格，精力 +1，幸運值 +2！下次其他玩家遇到騙子卡時，你可以幫助他們！`
                }));
                ws.send(JSON.stringify({
                    type: 'state_updated',
                    playerId: currentPlayer.playerId,
                    gameState: state
                }));
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `👮 ${currentPlayer.playerName} 成功舉報騙案，獲得 1 次義工資格！`
            }, ws);
            
            return `👮 舉報騙案成功！\n` +
                `👮 獲得：1 次義工資格\n` +
                `⚡ 精力 -1 +2 (淨 +1)\n` +
                `🍀 幸運值 +2\n` +
                `📝 目前義工次數：${state.volunteerShield}\n` +
                `🤝 下次其他玩家遇到騙子卡時，你可以幫助他們防範！`;
        },
        getEffectDescription: () => "個人錦囊：獲得 1 次義工資格（可幫助其他玩家防範騙子卡），精力 +1，幸運值 +2"
    },

    {
        id: "IN11",
        name: "逆境恩典",
        description: "即使身處逆境，仍是滿有恩典。\n抽取一張逆境卡\n加3精力",
        image: "../cards/revelation/tip/IN11.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const energyBonus = 3;
            
            // 个人锦囊，直接询问是否执行
            const userChoice = confirm(
                `✨ ${card.name}\n\n${card.description}\n\n執行後獲得：\n   • 精力 +${energyBonus}\n   • 抽取一張逆境卡（滿有恩典）\n\n你是否願意執行？（已支付 500 元）`
            );
            
            if (!userChoice) {
                return `❌ 你決定不執行「${card.name}」，已支付的 500 元無法退還。`;
            }
            
            // 獲得精力獎勵
            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);
            
            // 幸运值提升（逆境中的恩典）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "逆境恩典",
                0,
                `逆境中的恩典！精力 +${energyBonus}，幸運值 +1 (逆境卡系統開發中)`,
                null,
                state
            );
            
            // 通知玩家
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `✨ 你獲得了逆境中的恩典！精力 +${energyBonus}，幸運值 +1！(逆境卡系統開發中)`
                }));
                ws.send(JSON.stringify({
                    type: 'state_updated',
                    playerId: currentPlayer.playerId,
                    gameState: state
                }));
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `✨ ${currentPlayer.playerName} 獲得了逆境恩典，精力 +${energyBonus}！`
            }, ws);
            
            // TODO: 逆境卡系統開發完成後，在這裡添加抽逆境卡的邏輯
            ws.send(JSON.stringify({
                type: 'notification',
                message: `📜 注意：逆境卡系統正在開發中，暫時無法抽取逆境卡。`
            }));
            
            return `✨ 逆境恩典成功！\n` +
                `⚡ 精力 +${energyBonus}\n` +
                `🍀 幸運值 +1\n` +
                `📜 逆境卡系統開發中，暫時無法抽取逆境卡。\n` +
                `💪 即使身處逆境，仍有滿滿恩典！`;
        },
        getEffectDescription: () => "個人錦囊：精力 +3，幸運值 +1，抽取一張逆境卡（開發中）"
    },

    {
        id: "IN12",
        name: "時間管理",
        description: "每人每日都有24小時可以運用，視乎你如何安排。\n多進行一回合",
        image: "../cards/revelation/tip/IN12.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",
        effect: (state) => {
            // 此效果将在 handleExecuteRevelationCard 中特殊处理
            // 这里只返回基本信息
            return "獲得一個額外回合！";
        },
        getEffectDescription: () => "個人錦囊：多進行一回合"
    },

    {
        id: "IN13",
        name: "贈人玫瑰",
        description: "贈人玫瑰，手有餘香。\n購買一張機會卡送給其他玩家\n精力 +2",
        image: "../cards/revelation/tip/IN13.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            const energyBonus = 2;
            
            // 收集其他玩家列表
            const otherPlayers = [];
            for (let [pWs, p] of room.players) {
                if (pWs !== ws) {
                    otherPlayers.push({
                        ws: pWs,
                        playerName: p.playerName,
                        player: p
                    });
                }
            }
            
            if (otherPlayers.length === 0) {
                return `❌ 沒有其他玩家在線，無法贈送機會卡。`;
            }
            
            // 检查现金是否足够购买机会卡（500元）
            if (state.cash < 500) {
                return `❌ 現金不足 500 元，無法購買機會卡送給其他玩家。`;
            }
            
            // 选择要赠送的玩家
            let playerOptions = otherPlayers.map((p, index) => `${index + 1}. ${p.playerName}`).join('\n');
            let selectedIndex = -1;
            
            // 弹出选择对话框
            const choice = prompt(
                `🌹 ${card.name}\n\n${card.description}\n\n請選擇要贈送機會卡的玩家：\n\n${playerOptions}\n\n請輸入玩家編號 (1-${otherPlayers.length}):`
            );
            
            selectedIndex = parseInt(choice) - 1;
            
            if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= otherPlayers.length) {
                return `❌ 無效的選擇，已取消贈送。`;
            }
            
            const targetPlayer = otherPlayers[selectedIndex];
            
            // 扣除购买机会卡的费用
            state.cash -= 500;
            
            // 获得精力奖励
            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);
            
            // 幸运值提升（善有善報）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            // 记录交易（执行者）
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "贈送機會卡",
                -500,
                `贈送一張機會卡給 ${targetPlayer.playerName}，精力 +${energyBonus}，幸運值 +1`,
                null,
                state
            );
            
            // 通知执行者
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: `🌹 你贈送了一張機會卡給 ${targetPlayer.playerName}！精力 +${energyBonus}，幸運值 +1！`
                }));
                ws.send(JSON.stringify({
                    type: 'state_updated',
                    playerId: currentPlayer.playerId,
                    gameState: state
                }));
            }
            
            // ==================== 触發被赠送玩家的机会卡选择 ====================
            // 为被赠送的玩家触发机会卡选择
            const targetWs = targetPlayer.ws;
            const targetPlayerObj = targetPlayer.player;
            
            // 显示机会卡类型选择给被赠送的玩家
            const cardTypes = Object.values(CARD_TYPES).map(t => ({
                id: t.id,
                name: t.name,
                icon: t.icon,
                color: t.color,
                count: t.cards.length
            }));
            
            targetWs.send(JSON.stringify({
                type: 'card_type_selection',
                cardTypes: cardTypes,
                canAfford: true,  // 已经付费，所以可以免费选择
                isGifted: true,   // 标记这是被赠送的
                giftedBy: currentPlayer.playerName
            }));
            
            // 记录被赠送玩家的交易
            addTransactionRecord(
                targetPlayerObj.playerName,
                { name: "收到贈送機會卡", type: "tip", id: card.id },
                "收到贈送",
                0,
                `收到 ${currentPlayer.playerName} 贈送的一張機會卡`,
                null,
                targetPlayerObj.gameState
            );
            
            // 通知被赠送玩家
            targetWs.send(JSON.stringify({
                type: 'notification',
                message: `🌹 ${currentPlayer.playerName} 贈送了一張機會卡給你！請選擇機會卡類型。`
            }));
            
            // 广播给其他玩家
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🌹 ${currentPlayer.playerName} 贈送了一張機會卡給 ${targetPlayer.playerName}！`
            }, ws);
            
            // 存储待处理的机会卡事件（标记为已付费）
            if (!room.pendingEvents) {
                room.pendingEvents = new Map();
            }
            
            // 为被赠送的玩家创建待处理事件，标记为已购买
            room.pendingEvents.set(targetWs, {
                type: 'opportunity_card',
                card: null,
                cardType: null,
                playerId: targetPlayerObj.playerId,
                purchased: true,  // 已经付费
                isGifted: true,
                giftedBy: currentPlayer.playerName,
                timestamp: Date.now()
            });
            
            return `🌹 贈人玫瑰，手有餘香！\n` +
                `🎁 你贈送了一張機會卡給 ${targetPlayer.playerName}\n` +
                `⚡ 精力 +${energyBonus}\n` +
                `🍀 幸運值 +1\n` +
                `💰 花費：500 元\n` +
                `💝 善有善報，好運降臨！`;
        },
        getEffectDescription: () => "個人錦囊：購買一張機會卡送給其他玩家，精力 +2，幸運值 +1"
    },

    {
        id: "IN14",
        name: "黑馬思維",
        description: "找到你的微動力：能夠找到激發前進的微小動力。\n前進1-3格執行格子行動。",
        image: "../cards/revelation/tip/IN14.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            // 随机前进1-3格
            const steps = Math.floor(Math.random() * 3) + 1; // 1, 2, 或 3
            
            let oldPos = state.streamlinePos;
            let newPos = (oldPos + steps) % room.streamlineTiles.length;
            let tile = null;
            let eventMessage = null;
            let passedSettlement = false;
            let settlementMessage = '';
            
            // 遍历每一步，检查是否经过结算日
            for (let i = 1; i <= steps; i++) {
                let tempPos = (oldPos + i) % room.streamlineTiles.length;
                let tileAtPos = room.streamlineTiles[tempPos];
                if (tileAtPos.type === 'settlement') {
                    passedSettlement = true;
                    // 经过结算日获得收入
                    const totalIncome = state.salary + state.sideIncome;
                    state.cash += totalIncome;
                    state.totalAssets += Math.floor(totalIncome * 0.2);
                    
                    // 计算支出（应用减免）
                    const { totalExpense, savedAmount, reductionPercent } = calculateReducedExpense(state);
                    let expenseReductionMessage = '';
                    if (reductionPercent > 0) {
                        expenseReductionMessage = ` (支出減少 ${reductionPercent}%，節省 ${savedAmount.toLocaleString()} 元)`;
                    }
                    
                    // 面包店精力奖励
                    if (state.bakeryCount && state.bakeryCount > 0) {
                        const bakeryEnergyBonus = state.bakeryCount;
                        state.energy = Math.min(state.maxEnergy, state.energy + bakeryEnergyBonus);
                    }
                    
                    settlementMessage += `\n📅 經過結算日！獲得 ${totalIncome.toLocaleString()} 元現金流${expenseReductionMessage}`;
                    
                    // 处理贷款还款
                    const repaymentResult = processSettlementRepayment(currentPlayer, ws, roomId);
                    if (repaymentResult) {
                        ws.send(JSON.stringify(repaymentResult));
                        broadcastToRoom(roomId, repaymentResult, ws);
                    }
                }
            }
            
            // 更新位置
            state.streamlinePos = newPos;
            tile = room.streamlineTiles[state.streamlinePos];
            
            // 执行格子行动（如果不是结算日）
            if (tile.type !== 'settlement') {
                const isExactLanding = false;
                
                // 根据格子类型执行行动
                if (tile.type === 'lier') {
                    drawAndExecuteLierCard(ws, state, roomId, currentPlayer);
                    eventMessage = `踩中「${tile.name}」，執行騙子卡效果！`;
                } else if (tile.type === 'opportunity') {
                    showCardTypeSelection(ws, state, roomId, currentPlayer);
                    eventMessage = `踩中「${tile.name}」，獲得機會卡選擇！`;
                } else if (tile.type === 'police') {
                    drawPoliceCard(ws, state, roomId, currentPlayer);
                    eventMessage = `踩中「${tile.name}」，獲得警察卡！`;
                } else if (tile.type === 'volunteer') {
                    drawVolunteerCard(ws, state, roomId, currentPlayer);
                    eventMessage = `踩中「${tile.name}」，獲得義工卡！`;
                } else if (tile.type === 'awareness') {
                    showRevelationCardTypeSelection(ws, state, roomId, currentPlayer);
                    eventMessage = `踩中「${tile.name}」，獲得察覺卡！`;
                } else {
                    // 其他格子类型（income, lucky_star, four_leaf_clover, grace, event, market等）
                    eventMessage = processStreamlineTile(state, tile, ws, roomId, currentPlayer, false);
                }
            }
            
            // 精力消耗（前進需要精力）
            state.energy = Math.max(0, state.energy - 1);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "黑馬思維",
                0,
                `前進 ${steps} 格！從位置 ${oldPos + 1} → ${newPos + 1}，踩中「${tile.name}」${eventMessage ? '，' + eventMessage : ''}`,
                null,
                state
            );
            
            // 发送骰子结果（模拟移动）
            const diceResult = {
                type: 'dice_result',
                playerId: currentPlayer.playerId,
                playerName: currentPlayer.playerName,
                steps: steps,
                originalSteps: steps,
                multiplierUsed: false,
                gameState: state,
                tile: tile,
                eventMessage: eventMessage,
                multiplierMessage: `🐴 黑馬思維！前進 ${steps} 格！`
            };
            
            ws.send(JSON.stringify(diceResult));
            broadcastToRoom(roomId, diceResult, ws);
            
            // 如果有经过结算日的消息，额外发送
            if (settlementMessage) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: settlementMessage
                }));
            }
            
            // 通知玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🐴 黑馬思維生效！你前進了 ${steps} 格，${eventMessage ? '觸發了格子效果。' : ''}`
            }));
            
            // 广播状态更新
            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: currentPlayer.playerId,
                gameState: state
            });
            
            return `🐴 黑馬思維成功！\n` +
                `🚀 前進 ${steps} 格\n` +
                `📍 從位置 ${oldPos + 1} → ${newPos + 1}\n` +
                `🎲 踩中「${tile.name}」\n` +
                `${eventMessage ? `📋 效果：${eventMessage.substring(0, 100)}...\n` : ''}` +
                `${settlementMessage ? `💰 ${settlementMessage}\n` : ''}` +
                `⚡ 精力 -1\n` +
                `💪 找到微動力，持續前進！`;
        },
        getEffectDescription: () => "個人錦囊：前進1-3格並執行格子行動，精力 -1"
    },

    {
        id: "IN15",
        name: "黑馬思維",
        description: "清楚你的選擇：他們能夠清楚地選擇適合自己的環境。\n行動自選1-3格",
        image: "../cards/revelation/tip/IN15.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            // 让玩家选择前进1-3格
            let steps = 0;
            let validChoice = false;
            
            while (!validChoice) {
                const choice = prompt(
                    `🐴 ${card.name}\n\n${card.description}\n\n請選擇前進的格數：\n\n1️⃣ 前進 1 格\n2️⃣ 前進 2 格\n3️⃣ 前進 3 格\n\n請輸入 1、2 或 3：`
                );
                
                steps = parseInt(choice);
                if (steps >= 1 && steps <= 3) {
                    validChoice = true;
                } else {
                    alert(`❌ 無效的選擇，請輸入 1、2 或 3。`);
                }
            }
            
            let oldPos = state.streamlinePos;
            let newPos = (oldPos + steps) % room.streamlineTiles.length;
            let tile = null;
            let eventMessage = null;
            let passedSettlement = false;
            let settlementMessage = '';
            
            // 遍历每一步，检查是否经过结算日
            for (let i = 1; i <= steps; i++) {
                let tempPos = (oldPos + i) % room.streamlineTiles.length;
                let tileAtPos = room.streamlineTiles[tempPos];
                if (tileAtPos.type === 'settlement') {
                    passedSettlement = true;
                    // 经过结算日获得收入
                    const totalIncome = state.salary + state.sideIncome;
                    state.cash += totalIncome;
                    state.totalAssets += Math.floor(totalIncome * 0.2);
                    
                    // 计算支出（应用减免）
                    const { totalExpense, savedAmount, reductionPercent } = calculateReducedExpense(state);
                    let expenseReductionMessage = '';
                    if (reductionPercent > 0) {
                        expenseReductionMessage = ` (支出減少 ${reductionPercent}%，節省 ${savedAmount.toLocaleString()} 元)`;
                    }
                    
                    // 面包店精力奖励
                    if (state.bakeryCount && state.bakeryCount > 0) {
                        const bakeryEnergyBonus = state.bakeryCount;
                        state.energy = Math.min(state.maxEnergy, state.energy + bakeryEnergyBonus);
                    }
                    
                    settlementMessage += `\n📅 經過結算日！獲得 ${totalIncome.toLocaleString()} 元現金流${expenseReductionMessage}`;
                    
                    // 处理贷款还款
                    const repaymentResult = processSettlementRepayment(currentPlayer, ws, roomId);
                    if (repaymentResult) {
                        ws.send(JSON.stringify(repaymentResult));
                        broadcastToRoom(roomId, repaymentResult, ws);
                    }
                }
            }
            
            // 更新位置
            state.streamlinePos = newPos;
            tile = room.streamlineTiles[state.streamlinePos];
            
            // 执行格子行动（如果不是结算日）
            if (tile.type !== 'settlement') {
                const isExactLanding = false;
                
                // 根据格子类型执行行动
                if (tile.type === 'lier') {
                    drawAndExecuteLierCard(ws, state, roomId, currentPlayer);
                    eventMessage = `踩中「${tile.name}」，執行騙子卡效果！`;
                } else if (tile.type === 'opportunity') {
                    showCardTypeSelection(ws, state, roomId, currentPlayer);
                    eventMessage = `踩中「${tile.name}」，獲得機會卡選擇！`;
                } else if (tile.type === 'police') {
                    drawPoliceCard(ws, state, roomId, currentPlayer);
                    eventMessage = `踩中「${tile.name}」，獲得警察卡！`;
                } else if (tile.type === 'volunteer') {
                    drawVolunteerCard(ws, state, roomId, currentPlayer);
                    eventMessage = `踩中「${tile.name}」，獲得義工卡！`;
                } else if (tile.type === 'awareness') {
                    showRevelationCardTypeSelection(ws, state, roomId, currentPlayer);
                    eventMessage = `踩中「${tile.name}」，獲得察覺卡！`;
                } else {
                    // 其他格子类型（income, lucky_star, four_leaf_clover, grace, event, market等）
                    eventMessage = processStreamlineTile(state, tile, ws, roomId, currentPlayer, false);
                }
            }
            
            // 精力消耗（前進需要精力）
            state.energy = Math.max(0, state.energy - 1);
            
            // 幸运值提升（清楚的選擇）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "黑馬思維",
                0,
                `自選前進 ${steps} 格！從位置 ${oldPos + 1} → ${newPos + 1}，踩中「${tile.name}」${eventMessage ? '，' + eventMessage : ''}`,
                null,
                state
            );
            
            // 发送骰子结果（模拟移动）
            const diceResult = {
                type: 'dice_result',
                playerId: currentPlayer.playerId,
                playerName: currentPlayer.playerName,
                steps: steps,
                originalSteps: steps,
                multiplierUsed: false,
                gameState: state,
                tile: tile,
                eventMessage: eventMessage,
                multiplierMessage: `🐴 黑馬思維！你選擇前進 ${steps} 格！`
            };
            
            ws.send(JSON.stringify(diceResult));
            broadcastToRoom(roomId, diceResult, ws);
            
            // 如果有经过结算日的消息，额外发送
            if (settlementMessage) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: settlementMessage
                }));
            }
            
            // 通知玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🐴 黑馬思維生效！你前進了 ${steps} 格，${eventMessage ? '觸發了格子效果。' : ''}`
            }));
            
            // 广播状态更新
            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: currentPlayer.playerId,
                gameState: state
            });
            
            return `🐴 黑馬思維成功！\n` +
                `🎯 你選擇前進 ${steps} 格\n` +
                `📍 從位置 ${oldPos + 1} → ${newPos + 1}\n` +
                `🎲 踩中「${tile.name}」\n` +
                `${eventMessage ? `📋 效果：${eventMessage.substring(0, 100)}...\n` : ''}` +
                `${settlementMessage ? `💰 ${settlementMessage}\n` : ''}` +
                `⚡ 精力 -1\n` +
                `🍀 幸運值 +1\n` +
                `💪 清楚自己的選擇，創造適合的環境！`;
        },
        getEffectDescription: () => "個人錦囊：自選前進1-3格並執行格子行動，精力 -1，幸運值 +1"
    },

    {
        id: "IN16",
        name: "黑馬思維",
        description: "了解自己的人生策略，能應對挑戰，擁有豐盛人生。\n前往月收入格",
        image: "../cards/revelation/tip/IN16.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            // 找到月收入格的位置（平流层中 type 为 'income' 的格子）
            // 月收入格包括：升職加薪、副業發展、創業啟動
            const targetTileNames = ["升職加薪", "副業發展", "創業啟動"];
            
            let targetIndex = -1;
            let targetTile = null;
            
            // 寻找最近的月收入格（从当前位置往后找）
            for (let i = 1; i <= room.streamlineTiles.length; i++) {
                let checkIndex = (state.streamlinePos + i) % room.streamlineTiles.length;
                let tile = room.streamlineTiles[checkIndex];
                if (targetTileNames.includes(tile.name)) {
                    targetIndex = checkIndex;
                    targetTile = tile;
                    break;
                }
            }
            
            // 如果找不到（理论上应该有），找第一个月收入格
            if (targetIndex === -1) {
                for (let i = 0; i < room.streamlineTiles.length; i++) {
                    let tile = room.streamlineTiles[i];
                    if (targetTileNames.includes(tile.name)) {
                        targetIndex = i;
                        targetTile = tile;
                        break;
                    }
                }
            }
            
            if (targetIndex === -1) {
                return `❌ 找不到月收入格，卡片無法執行。`;
            }
            
            const oldPos = state.streamlinePos;
            let steps = 0;
            
            // 计算需要前进的步数
            if (targetIndex >= oldPos) {
                steps = targetIndex - oldPos;
            } else {
                steps = (room.streamlineTiles.length - oldPos) + targetIndex;
            }
            
            let eventMessage = null;
            let passedSettlement = false;
            let settlementMessage = '';
            
            // 遍历每一步，检查是否经过结算日
            for (let i = 1; i <= steps; i++) {
                let tempPos = (oldPos + i) % room.streamlineTiles.length;
                let tileAtPos = room.streamlineTiles[tempPos];
                if (tileAtPos.type === 'settlement') {
                    passedSettlement = true;
                    // 经过结算日获得收入
                    const totalIncome = state.salary + state.sideIncome;
                    state.cash += totalIncome;
                    state.totalAssets += Math.floor(totalIncome * 0.2);
                    
                    // 计算支出（应用减免）
                    const { totalExpense, savedAmount, reductionPercent } = calculateReducedExpense(state);
                    let expenseReductionMessage = '';
                    if (reductionPercent > 0) {
                        expenseReductionMessage = ` (支出減少 ${reductionPercent}%，節省 ${savedAmount.toLocaleString()} 元)`;
                    }
                    
                    // 面包店精力奖励
                    if (state.bakeryCount && state.bakeryCount > 0) {
                        const bakeryEnergyBonus = state.bakeryCount;
                        state.energy = Math.min(state.maxEnergy, state.energy + bakeryEnergyBonus);
                    }
                    
                    settlementMessage += `\n📅 經過結算日！獲得 ${totalIncome.toLocaleString()} 元現金流${expenseReductionMessage}`;
                    
                    // 处理贷款还款
                    const repaymentResult = processSettlementRepayment(currentPlayer, ws, roomId);
                    if (repaymentResult) {
                        ws.send(JSON.stringify(repaymentResult));
                        broadcastToRoom(roomId, repaymentResult, ws);
                    }
                }
            }
            
            // 更新位置到月收入格
            state.streamlinePos = targetIndex;
            
            // 执行月收入格的效果
            const isExactLanding = false;
            eventMessage = processStreamlineTile(state, targetTile, ws, roomId, currentPlayer, isExactLanding);
            
            // 精力消耗（前進需要精力）
            state.energy = Math.max(0, state.energy - 1);
            
            // 幸运值提升（了解人生策略）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 2);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "黑馬思維",
                0,
                `前往月收入格！前進 ${steps} 格，從位置 ${oldPos + 1} → ${targetIndex + 1}，執行「${targetTile.name}」效果${eventMessage ? '：' + eventMessage : ''}`,
                null,
                state
            );
            
            // 发送骰子结果（模拟移动）
            const diceResult = {
                type: 'dice_result',
                playerId: currentPlayer.playerId,
                playerName: currentPlayer.playerName,
                steps: steps,
                originalSteps: steps,
                multiplierUsed: false,
                gameState: state,
                tile: targetTile,
                eventMessage: eventMessage,
                multiplierMessage: `🐴 黑馬思維！前往月收入格，前進 ${steps} 格！`
            };
            
            ws.send(JSON.stringify(diceResult));
            broadcastToRoom(roomId, diceResult, ws);
            
            // 如果有经过结算日的消息，额外发送
            if (settlementMessage) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: settlementMessage
                }));
            }
            
            // 通知玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🐴 黑馬思維生效！你前往月收入格「${targetTile.name}」，${eventMessage || '獲得了收入提升！'}`
            }));
            
            // 广播状态更新
            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: currentPlayer.playerId,
                gameState: state
            });
            
            return `🐴 黑馬思維成功！\n` +
                `🎯 前往月收入格：「${targetTile.name}」\n` +
                `🚀 前進 ${steps} 格\n` +
                `📍 從位置 ${oldPos + 1} → ${targetIndex + 1}\n` +
                `📋 效果：${eventMessage || '獲得收入提升！'}\n` +
                `${settlementMessage ? `💰 ${settlementMessage}\n` : ''}` +
                `⚡ 精力 -1\n` +
                `🍀 幸運值 +2\n` +
                `💪 了解人生策略，應對挑戰，擁有豐盛人生！`;
        },
        getEffectDescription: () => "個人錦囊：前往最近的月收入格（升職加薪/副業發展/創業啟動），執行格子效果，精力 -1，幸運值 +2"
    },

    {
        id: "IN17",
        name: "黑馬思維",
        description: "突破：他們能夠突破標準化限制，實現自我。\n前進到最近一位玩家格子（經過結算日有收入）",
        image: "../cards/revelation/tip/IN17.png",
        cost: 500,
        type: "tip",
        category: "锦囊卡",
        scope: "personal",  // 个人锦囊
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            // 收集其他玩家的位置
            const otherPlayers = [];
            for (let [pWs, p] of room.players) {
                if (pWs !== ws) {
                    otherPlayers.push({
                        ws: pWs,
                        playerName: p.playerName,
                        position: p.gameState.streamlinePos,
                        inReverse: p.gameState.inReverse,
                        inFlow: p.gameState.inFlow
                    });
                }
            }
            
            if (otherPlayers.length === 0) {
                return `❌ 沒有其他玩家在線，無法前進到玩家格子。`;
            }
            
            const currentPos = state.streamlinePos;
            
            // 找到最近的玩家（從當前位置往後找，最少步數）
            let closestPlayer = null;
            let minSteps = Infinity;
            
            for (const player of otherPlayers) {
                // 只考慮平流層的玩家（因為卡片只在平流層使用）
                if (player.inReverse || player.inFlow) continue;
                
                let steps = 0;
                if (player.position >= currentPos) {
                    steps = player.position - currentPos;
                } else {
                    steps = (room.streamlineTiles.length - currentPos) + player.position;
                }
                
                if (steps > 0 && steps < minSteps) {
                    minSteps = steps;
                    closestPlayer = player;
                }
            }
            
            // 如果沒有平流層的玩家，找逆流層或順流層的
            if (closestPlayer === null) {
                for (const player of otherPlayers) {
                    let steps = 0;
                    if (player.position >= currentPos) {
                        steps = player.position - currentPos;
                    } else {
                        steps = (room.streamlineTiles.length - currentPos) + player.position;
                    }
                    
                    if (steps > 0 && steps < minSteps) {
                        minSteps = steps;
                        closestPlayer = player;
                    }
                }
            }
            
            if (closestPlayer === null) {
                return `❌ 找不到其他玩家的位置，無法執行。`;
            }
            
            const oldPos = state.streamlinePos;
            const steps = minSteps;
            const targetPos = closestPlayer.position;
            let eventMessage = null;
            let passedSettlement = false;
            let settlementMessage = '';
            
            // 遍历每一步，检查是否经过结算日
            for (let i = 1; i <= steps; i++) {
                let tempPos = (oldPos + i) % room.streamlineTiles.length;
                let tileAtPos = room.streamlineTiles[tempPos];
                if (tileAtPos.type === 'settlement') {
                    passedSettlement = true;
                    // 经过结算日获得收入
                    const totalIncome = state.salary + state.sideIncome;
                    state.cash += totalIncome;
                    state.totalAssets += Math.floor(totalIncome * 0.2);
                    
                    // 计算支出（应用减免）
                    const { totalExpense, savedAmount, reductionPercent } = calculateReducedExpense(state);
                    let expenseReductionMessage = '';
                    if (reductionPercent > 0) {
                        expenseReductionMessage = ` (支出減少 ${reductionPercent}%，節省 ${savedAmount.toLocaleString()} 元)`;
                    }
                    
                    // 面包店精力奖励
                    if (state.bakeryCount && state.bakeryCount > 0) {
                        const bakeryEnergyBonus = state.bakeryCount;
                        state.energy = Math.min(state.maxEnergy, state.energy + bakeryEnergyBonus);
                    }
                    
                    settlementMessage += `\n📅 經過結算日！獲得 ${totalIncome.toLocaleString()} 元現金流${expenseReductionMessage}`;
                    
                    // 处理贷款还款
                    const repaymentResult = processSettlementRepayment(currentPlayer, ws, roomId);
                    if (repaymentResult) {
                        ws.send(JSON.stringify(repaymentResult));
                        broadcastToRoom(roomId, repaymentResult, ws);
                    }
                }
            }
            
            // 更新位置到目标玩家的格子
            state.streamlinePos = targetPos;
            const targetTile = room.streamlineTiles[targetPos];
            
            // 执行格子行动
            const isExactLanding = false;
            
            if (targetTile.type === 'lier') {
                drawAndExecuteLierCard(ws, state, roomId, currentPlayer);
                eventMessage = `踩中「${targetTile.name}」，執行騙子卡效果！`;
            } else if (targetTile.type === 'opportunity') {
                showCardTypeSelection(ws, state, roomId, currentPlayer);
                eventMessage = `踩中「${targetTile.name}」，獲得機會卡選擇！`;
            } else if (targetTile.type === 'police') {
                drawPoliceCard(ws, state, roomId, currentPlayer);
                eventMessage = `踩中「${targetTile.name}」，獲得警察卡！`;
            } else if (targetTile.type === 'volunteer') {
                drawVolunteerCard(ws, state, roomId, currentPlayer);
                eventMessage = `踩中「${targetTile.name}」，獲得義工卡！`;
            } else if (targetTile.type === 'awareness') {
                showRevelationCardTypeSelection(ws, state, roomId, currentPlayer);
                eventMessage = `踩中「${targetTile.name}」，獲得察覺卡！`;
            } else {
                eventMessage = processStreamlineTile(state, targetTile, ws, roomId, currentPlayer, isExactLanding);
            }
            
            // 精力消耗（突破需要精力）
            state.energy = Math.max(0, state.energy - 1);
            
            // 幸运值提升（突破限制）
            state.luck = Math.min(state.maxLuck || 10, state.luck + 2);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: card.name, type: "tip", id: card.id },
                "黑馬思維",
                0,
                `前進到最近玩家 ${closestPlayer.playerName} 的格子！前進 ${steps} 格，從位置 ${oldPos + 1} → ${targetPos + 1}，踩中「${targetTile.name}」${eventMessage ? '，' + eventMessage : ''}`,
                null,
                state
            );
            
            // 发送骰子结果（模拟移动）
            const diceResult = {
                type: 'dice_result',
                playerId: currentPlayer.playerId,
                playerName: currentPlayer.playerName,
                steps: steps,
                originalSteps: steps,
                multiplierUsed: false,
                gameState: state,
                tile: targetTile,
                eventMessage: eventMessage,
                multiplierMessage: `🐴 黑馬思維！突破限制，前進 ${steps} 格到 ${closestPlayer.playerName} 的位置！`
            };
            
            ws.send(JSON.stringify(diceResult));
            broadcastToRoom(roomId, diceResult, ws);
            
            // 如果有经过结算日的消息，额外发送
            if (settlementMessage) {
                ws.send(JSON.stringify({
                    type: 'notification',
                    message: settlementMessage
                }));
            }
            
            // 通知玩家结果
            ws.send(JSON.stringify({
                type: 'notification',
                message: `🐴 黑馬思維生效！你前進到 ${closestPlayer.playerName} 的格子「${targetTile.name}」，${eventMessage || '觸發了格子效果！'}`
            }));
            
            // 通知被踩中格子的玩家
            if (closestPlayer.ws) {
                closestPlayer.ws.send(JSON.stringify({
                    type: 'notification',
                    message: `🐴 ${currentPlayer.playerName} 使用黑馬思維前進到你的位置（${targetTile.name}）！`
                }));
            }
            
            // 广播状态更新
            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: currentPlayer.playerId,
                gameState: state
            });
            
            return `🐴 黑馬思維成功！\n` +
                `🎯 目標玩家：${closestPlayer.playerName}\n` +
                `🚀 前進 ${steps} 格\n` +
                `📍 從位置 ${oldPos + 1} → ${targetPos + 1}\n` +
                `🎲 踩中「${targetTile.name}」\n` +
                `📋 效果：${eventMessage || '觸發格子效果'}\n` +
                `${settlementMessage ? `💰 ${settlementMessage}\n` : ''}` +
                `⚡ 精力 -1\n` +
                `🍀 幸運值 +2\n` +
                `💪 突破標準化限制，實現自我！`;
        },
        getEffectDescription: () => "個人錦囊：前進到最近一位玩家的格子（經過結算日有收入），執行格子效果，精力 -1，幸運值 +2"
    },

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

 // ============================================================

// 辅助函数：获取骰子結果訊息
function getDiceResultMessage(diceRoll) {
    switch(diceRoll) {
        case 1: return "🎭 抽1張逆境卡";
        case 2: return "💰 損失 $2,000";
        case 3: return "🎴 抽1張機會卡";
        case 4: return "🎴 抽1張機會卡";
        case 5: return "⚡ 獲得2精力 或 $2,000";
        case 6: return "⚡ 獲得2精力 或 $2,000";
        default: return "";
    }
}

// 辅助函数：执行慢活结果
function executeSlowLifeResults(room, allPlayers, diceResults, currentPlayer, ws, roomId, card, playerChoices = {}) {
    let results = [];
    let totalLoss = 0;
    let totalGain = 0;
    
    for (const { ws: pWs, player: p, playerName, diceRoll } of diceResults) {
        let resultMessage = `${playerName} 擲出 ${diceRoll} 點：`;
        
        switch(diceRoll) {
            case 1:
                // 抽1張逆境卡 - 触发逆流层卡片
                resultMessage += ` 觸發逆境卡效果！`;
                // 这里需要调用逆流层卡片抽取函数
                // 注意：这需要后端支持，可能需要发送消息让前端处理
                break;
                
            case 2:
                // 損失 $2,000
                const lossAmount = 2000;
                if (p.gameState.cash >= lossAmount) {
                    p.gameState.cash -= lossAmount;
                    totalLoss += lossAmount;
                    resultMessage += ` 損失 $${lossAmount.toLocaleString()} 元`;
                } else {
                    // 现金不足，扣除所有现金
                    const actualLoss = p.gameState.cash;
                    p.gameState.cash = 0;
                    totalLoss += actualLoss;
                    resultMessage += ` 現金不足，損失 $${actualLoss.toLocaleString()} 元`;
                }
                
                addTransactionRecord(
                    playerName,
                    { name: card.name, type: "tip", id: card.id },
                    "慢活損失",
                    -lossAmount,
                    `慢活骰子點數 ${diceRoll}，損失 $${lossAmount.toLocaleString()} 元`,
                    null,
                    p.gameState
                );
                break;
                
            case 3:
            case 4:
                // 抽1張機會卡
                resultMessage += ` 獲得機會卡！`;
                // 这里需要调用机会卡抽取函数
                // 注意：这需要后端支持
                break;
                
            case 5:
            case 6:
                // 獲得2精力 或 $2,000
                const choice = playerChoices[playerName];
                if (choice === 'energy') {
                    p.gameState.energy = Math.min(p.gameState.maxEnergy, p.gameState.energy + 2);
                    resultMessage += ` 獲得 2 精力！`;
                    totalGain += 0;
                    
                    addTransactionRecord(
                        playerName,
                        { name: card.name, type: "tip", id: card.id },
                        "慢活獎勵",
                        0,
                        `慢活骰子點數 ${diceRoll}，獲得 2 精力`,
                        null,
                        p.gameState
                    );
                } else {
                    p.gameState.cash += 2000;
                    resultMessage += ` 獲得 $2,000 元！`;
                    totalGain += 2000;
                    
                    addTransactionRecord(
                        playerName,
                        { name: card.name, type: "tip", id: card.id },
                        "慢活獎勵",
                        2000,
                        `慢活骰子點數 ${diceRoll}，獲得 $2,000 元`,
                        null,
                        p.gameState
                    );
                }
                break;
        }
        
        results.push(resultMessage);
        
        // 通知该玩家
        if (pWs) {
            pWs.send(JSON.stringify({
                type: 'notification',
                message: `🧘 ${resultMessage}`
            }));
            pWs.send(JSON.stringify({
                type: 'state_updated',
                playerId: p.playerId,
                gameState: p.gameState
            }));
        }
    }
    
    // 广播给所有玩家
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `🧘 ${currentPlayer.playerName} 觸發團隊錦囊「${card.name}」！\n${results.join('\n')}`
    });
    
    return `🧘 團隊錦囊「${card.name}」完成！\n` +
           `📊 結果：\n${results.join('\n')}\n` +
           `💰 總損失：$${totalLoss.toLocaleString()} 元\n` +
           `🎁 總獲得：$${totalGain.toLocaleString()} 元 / ${totalGain > 0 ? '獎勵' : '無'}`;
}

// 辅助函数：获取骰子結果訊息
function getDiceResultMessage(diceRoll) {
    switch(diceRoll) {
        case 1: return "🎭 抽1張逆境卡";
        case 2: return "💰 損失 $2,000";
        case 3: return "🎴 抽1張機會卡";
        case 4: return "🎴 抽1張機會卡";
        case 5: return "⚡ 獲得2精力 或 $2,000";
        case 6: return "⚡ 獲得2精力 或 $2,000";
        default: return "";
    }
}
