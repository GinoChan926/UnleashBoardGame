// revelation_cards.js - 启示卡数据（市場消息卡 + 錦囊卡）

// ==================== 市場消息卡 ====================
const marketNewsCards = [

    {
        id: "M01",
        name: "基金業績上升",
        description: "基金經理眼光獨到且經驗豐富，基金業績亮麗，增加每月利息發放。\n受影響的基金：F02 基金投資\n基金利息 +$500/月",
        image: "../cards/revelation/market/M01.png",
        cost: 500,
        type: "market_news",
        category: "市場消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            
            // 遍歷所有玩家
            for (let [pWs, p] of room.players) {
                // 檢查玩家是否持有 F02 基金
                const hasFundF02 = p.gameState.financeInvestments && 
                                  p.gameState.financeInvestments.some(inv => inv.id === "F02");
                
                if (hasFundF02) {
                    // 找到 F02 基金投資
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
        category: "市場消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            
            // 遍歷所有玩家
            for (let [pWs, p] of room.players) {
                // 檢查玩家是否持有 F02 基金
                const hasFundF02 = p.gameState.financeInvestments && 
                                  p.gameState.financeInvestments.some(inv => inv.id === "F02");
                
                if (hasFundF02) {
                    // 找到 F02 基金投資
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
        category: "市場消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            const newInterestRate = 5; // 新利率 5%
            
            // 遍歷所有玩家
            for (let [pWs, p] of room.players) {
                // 檢查玩家是否有貸款
                if (p.gameState.loanAmount > 0) {
                    const oldLoanAmount = p.gameState.loanAmount;
                    const oldInterestRate = 10; // 原利率 10%
                    const oldInterestAmount = Math.round(oldLoanAmount * oldInterestRate / 100);
                    const newInterestAmount = Math.round(oldLoanAmount * newInterestRate / 100);
                    const interestSaved = oldInterestAmount - newInterestAmount;
                    
                    // 更新貸款利率
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
        category: "市場消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            let totalLoss = 0;
            
            // 遍歷所有玩家
            for (let [pWs, p] of room.players) {
                // 檢查玩家是否持有加密货币 (C01)
                let cryptoLoss = 0;
                let cryptoDetails = [];
                
                if (p.gameState.cryptoHoldings) {
                    // 遍歷所有加密货币持仓
                    for (const [cryptoId, holding] of Object.entries(p.gameState.cryptoHoldings)) {
                        // 檢查是否是 C01 相关加密货币
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
                    
                    // 更新总資产（减去损失）
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
    category: "市場消息卡",
    effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
        let affectedPlayers = [];
        let changes = [];
        const priceIncrease = 10;
        
        // 遍歷所有玩家
        for (let [pWs, p] of room.players) {
            // 檢查玩家是否持有 P2P N02 投資 (id 为 "F05")
            const hasP2PInvestment = p.gameState.financeInvestments && 
                                     p.gameState.financeInvestments.some(inv => inv.id === "F05");
            
            if (hasP2PInvestment) {
                // 找到 P2P 投資
                const p2pInvestment = p.gameState.financeInvestments.find(inv => inv.id === "F05");
                const oldPricePerUnit = p2pInvestment.pricePerUnit;
                const newPricePerUnit = oldPricePerUnit + priceIncrease;
                const valueIncrease = p2pInvestment.units * priceIncrease;
                
                // 更新每股价值
                p2pInvestment.pricePerUnit = newPricePerUnit;
                p2pInvestment.valueIncreased = true;
                p2pInvestment.increaseAmount = priceIncrease;
                
                // 更新总資产价值（增加）
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
        category: "市場消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            // 收集所有持有 C01 加密货币的玩家
            const playersWithCrypto = [];
            
            for (let [pWs, p] of room.players) {
                let cryptoHoldings = [];
                let totalValue = 0;
                let sellPrice = 0;
                
                if (p.gameState.cryptoHoldings) {
                    for (const [cryptoId, holding] of Object.entries(p.gameState.cryptoHoldings)) {
                        // 檢查是否是 C01 相关加密货币
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
        category: "市場消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            let totalLoss = 0;
            
            // 遍歷所有玩家
            for (let [pWs, p] of room.players) {
                // 檢查玩家是否持有 P2P N02 投資 (id 为 "N02")
                let p2pLoss = 0;
                let p2pDetails = [];
                
                if (p.gameState.financeInvestments) {
                    // 找到 P2P 投資索引
                    const p2pIndex = p.gameState.financeInvestments.findIndex(inv => inv.id === "N02");
                    
                    if (p2pIndex !== -1) {
                        const p2pInvestment = p.gameState.financeInvestments[p2pIndex];
                        p2pLoss = p2pInvestment.totalCost;
                        totalLoss += p2pLoss;
                        p2pDetails.push(`${p2pInvestment.name}: ${p2pInvestment.units}股，成本 $${p2pLoss.toLocaleString()}`);
                        
                        // 从投資列表中删除
                        p.gameState.financeInvestments.splice(p2pIndex, 1);
                        
                        // 更新总資产（减去损失）
                        p.gameState.totalAssets = Math.max(0, (p.gameState.totalAssets || 0) - p2pLoss);
                        
                        // 幸运值下降（投資失败）
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
        category: "市場消息卡",
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
        category: "市場消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            
            // 遍歷所有玩家
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
        category: "市場消息卡",
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
        category: "市場消息卡",
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
        category: "市場消息卡",
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
        category: "市場消息卡",
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
        category: "市場消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            const compensationAmount = 5000000; // 500萬
            
            // 遍歷所有玩家
            for (let [pWs, p] of room.players) {
                // 檢查玩家是否持有 H01 陳年唐樓
                let hasProperty = false;
                let propertyDetails = [];
                let compensationReceived = 0;
                
                // 檢查 propertyInvestments
                if (p.gameState.propertyInvestments && p.gameState.propertyInvestments.length > 0) {
                    const propertyIndex = p.gameState.propertyInvestments.findIndex(inv => inv.id === "H01");
                    
                    if (propertyIndex !== -1) {
                        const property = p.gameState.propertyInvestments[propertyIndex];
                        hasProperty = true;
                        compensationReceived = compensationAmount;
                        
                        propertyDetails.push(`${property.name}: 原價 $${property.totalPrice?.toLocaleString() || property.cost?.toLocaleString() || '?'} 元`);
                        
                        // 从地产投資中删除（已被收購）
                        p.gameState.propertyInvestments.splice(propertyIndex, 1);
                        
                        // 增加现金（補償金）
                        p.gameState.cash += compensationReceived;
                        
                        // 更新总資产
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
        category: "市場消息卡",
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
                
                // 从地产投資中删除
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
        category: "市場消息卡",
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
                
                // 从地产投資中删除
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
        category: "市場消息卡",
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
        category: "市場消息卡",
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
                
                // 更新总資产（租金收入增加提升物業價值）
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
        category: "市場消息卡",
        effect: (state, room, currentPlayer, ws, roomId, playerChoices) => {
            let affectedPlayers = [];
            let changes = [];
            const priceDecreasePercent = 10; // 價格下跌10%
            const passiveIncomeDecrease = 500; // 被動收入減少500
            
            // 住宅物業 ID 列表 (H01, H02, H03, H04)
            const residentialPropertyIds = ["H01", "H02", "H03", "H04"];
            
            // 遍歷所有玩家
            for (let [pWs, p] of room.players) {
                let playerChanges = [];
                let totalValueDecrease = 0;
                let totalPassiveDecrease = 0;
                let hasResidentialProperty = false;
                
                if (p.gameState.propertyInvestments && p.gameState.propertyInvestments.length > 0) {
                    // 遍歷所有住宅物業
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

            for (const [playerName, willInvest] of Object.entries(playerChoices || {})) {
                if (!willInvest) continue;

                let playerObj = null;
                for (const [, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        break;
                    }
                }
                if (!playerObj) continue;

                if (playerObj.gameState.cash < monthlyCost) {
                    insufficientCash.push(playerName);
                    continue;
                }

                playerObj.gameState.cash -= monthlyCost;

                if (!playerObj.gameState.healthInvestment) {
                    playerObj.gameState.healthInvestment = {
                        active: true,
                        monthlyCost,
                        energyBonus,
                        startTurn: playerObj.gameState.totalTurns || 0
                    };
                }

                playerObj.gameState.energy = Math.min(
                    playerObj.gameState.maxEnergy,
                    playerObj.gameState.energy + energyBonus
                );
                investors.push(playerName);
            }

            if (investors.length === 0 && insufficientCash.length === 0) {
                return `💪 團隊錦囊「健康投資」完成，但沒有玩家參與投資`;
            }

            let msg = `💪 團隊錦囊「健康投資」完成！\n`;
            if (investors.length > 0) {
                msg += `👥 投資玩家：${investors.join(', ')}\n💰 每月支出：$${monthlyCost.toLocaleString()}\n⚡ 每月獲得：精力 +${energyBonus}`;
            }
            if (insufficientCash.length > 0) {
                msg += `\n⚠️ 現金不足未能參與：${insufficientCash.join(', ')}`;
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
                playerObj.gameState.sideIncomeBonus =
                    (playerObj.gameState.sideIncomeBonus || 0) + 0.1;

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
            // Each participating player rolls, and gets result based on dice
            const results = [];

            for (const [playerName, participate] of Object.entries(playerChoices || {})) {
                if (!participate) continue;

                let playerObj = null;
                for (const [, p] of room.players) {
                    if (p.playerName === playerName) {
                        playerObj = p;
                        break;
                    }
                }
                if (!playerObj) continue;

                const diceRoll = Math.floor(Math.random() * 6) + 1;
                let outcome = '';

                if (diceRoll === 1) {
                    outcome = '抽 1 張逆境卡 (系統開發中)';
                } else if (diceRoll === 2) {
                    const loss = Math.min(2000, playerObj.gameState.cash);
                    playerObj.gameState.cash -= loss;
                    outcome = `損失 $${loss.toLocaleString()}`;
                } else if (diceRoll === 3 || diceRoll === 4) {
                    outcome = '抽 1 張機會卡 (系統開發中)';
                } else {
                    // 5-6: give both bonuses (simplified - can't do secondary choice easily)
                    playerObj.gameState.energy = Math.min(
                        playerObj.gameState.maxEnergy,
                        playerObj.gameState.energy + 2
                    );
                    playerObj.gameState.cash += 2000;
                    outcome = '獲得 2 精力 + $2,000';
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
            state.luckyStarCount = (state.luckyStarCount || 0) + luckyStarReward;
            state.energy = Math.min(state.maxEnergy, state.energy + 2);
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);

            return `🧘 學習釋放情緒成功！\n💰 花費：$${investmentCost.toLocaleString()}\n⭐ 獲得：${luckyStarReward} 個幸運星\n⚡ 精力 +2\n🍀 幸運值 +1\n📝 目前幸運星：${state.luckyStarCount}`;
        },
        getEffectDescription: () => "個人錦囊：投資 $5,000，獲得 2 個幸運星，精力 +2，幸運值 +1"
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
            state.sideIncomeBonus = Math.min(
                0.5,
                (state.sideIncomeBonus || 0) + 0.05
            );
            state.luck = Math.min(state.maxLuck || 10, state.luck + 1);

            return `🤝 學習社交人脈成功！\n⚡ 精力 +${energyBonus}\n🤝 人脈加成 +5%\n🍀 幸運值 +1\n📈 社交圈擴展，未來機會更多！`;
        },
        getEffectDescription: () => "個人錦囊：精力 +3，人脈加成 +5%，幸運值 +1"
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
        scope: "personal",
        effect: (state) => {
            const energyBonus = 2;

            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);
            state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);

            // Mark for hardship card draw (handled by RevelationCardSystem or handler)
            state._pendingHardshipDraw = true;

            return `🦁 勇敢面對恐懼！\n⚡ 精力 +${energyBonus}\n🍀 幸運值 +1\n📜 將抽取一張逆境卡（開發中）\n💪 勇氣可嘉，繼續保持！`;
        },
        getEffectDescription: () => "個人錦囊：精力 +2，幸運值 +1，抽取一張逆境卡（開發中）"
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
            state.energy = Math.min(state.maxEnergy, state.energy + 2);
            state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);

            return `🙏 凡事感恩成功！\n🍀 獲得：${cloverReward} 個四葉草\n⚡ 精力 +2\n🍀 幸運值 +1\n✨ 感恩的心帶來奇蹟！\n📝 目前四葉草：${state.fourLeafClover}`;
        },
        getEffectDescription: () => "個人錦囊：獲得 2 個四葉草，精力 +2，幸運值 +1"
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
            state.energy = Math.min(state.maxEnergy, state.energy + 2);
            state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);

            return `🛡️ 保持警惕成功！\n🛡️ 獲得：1 次取消騙子卡的機會\n⚡ 精力 +2\n🍀 幸運值 +1\n📝 下一張騙子卡將被自動取消！\n🔒 遠離詐騙，保護財產！`;
        },
        getEffectDescription: () => "個人錦囊：取消下一張騙子卡，精力 +2，幸運值 +1"
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
            state.energy = Math.min(state.maxEnergy, state.energy + 1);
            state.luck   = Math.min(state.maxLuck || 10, state.luck + 2);

            return `👮 舉報騙案成功！\n👮 獲得：1 次義工資格\n⚡ 精力 +1（淨效果）\n🍀 幸運值 +2\n📝 目前義工次數：${state.volunteerShield}\n🤝 可幫助其他玩家防範騙子卡！`;
        },
        getEffectDescription: () => "個人錦囊：獲得 1 次義工資格，精力 +1，幸運值 +2"
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
        effect: (state) => {
            const energyBonus = 3;

            state.energy = Math.min(state.maxEnergy, state.energy + energyBonus);
            state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);

            // Mark for hardship draw
            state._pendingHardshipDraw = true;

            return `✨ 逆境恩典成功！\n⚡ 精力 +${energyBonus}\n🍀 幸運值 +1\n📜 將抽取一張逆境卡（開發中）\n💪 即使身處逆境，仍有滿滿恩典！`;
        },
        getEffectDescription: () => "個人錦囊：精力 +3，幸運值 +1，抽取一張逆境卡（開發中）"
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
            state.energy = Math.min(state.maxEnergy, state.energy + 1);

            return `⏰ 時間管理生效！\n✨ 獲得一個額外回合！\n⚡ 精力 +1\n📌 結束目前回合後，你將立即進行下一回合！`;
        },
        getEffectDescription: () => "個人錦囊：獲得一個額外回合，精力 +1"
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
            state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);
            return `🌹 贈人玫瑰！精力 +2，幸運值 +1，請選擇要贈送的玩家`;
        },
        getEffectDescription: () => "個人錦囊：贈送機會卡給其他玩家，精力 +2，幸運值 +1"
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
            state.energy = Math.max(0, state.energy - 1);
            return `🐴 黑馬思維！將隨機前進 1-3 格`;
        },
        getEffectDescription: () => "個人錦囊：隨機前進 1-3 格並執行格子效果，精力 -1"
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
            state.energy = Math.max(0, state.energy - 1);
            state.luck   = Math.min(state.maxLuck || 10, state.luck + 1);
            return `🐴 黑馬思維！請選擇要前進的格數 (1-3)`;
        },
        getEffectDescription: () => "個人錦囊：自選前進 1-3 格並執行格子效果，精力 -1，幸運值 +1"
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
            state.energy = Math.max(0, state.energy - 1);
            state.luck   = Math.min(state.maxLuck || 10, state.luck + 2);
            return `🐴 黑馬思維！將前往最近的月收入格`;
        },
        getEffectDescription: () => "個人錦囊：前往最近的月收入格，精力 -1，幸運值 +2"
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
            state.energy = Math.max(0, state.energy - 1);
            state.luck   = Math.min(state.maxLuck || 10, state.luck + 2);
            return `🐴 黑馬思維！將前進到最近玩家的位置`;
        },
        getEffectDescription: () => "個人錦囊：前進到最近玩家格子，精力 -1，幸運值 +2"
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

