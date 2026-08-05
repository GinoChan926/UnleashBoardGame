// hardship_cards.js - 逆境自强卡数据

const hardshipCards = [
    {
        id: "S01",
        name: "集體逆境 - 超級通貨膨脹",
        description: "超級通貨膨脹！所有玩家前往逆流層（除順流層）。順流層玩家損失一半金錢。經過月收入格子沒有收入。",
        image: "../cards/hardship/S01.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: true,

        effect: (state) => {
            return `🌪️ 超級通貨膨脹！`;
        },

        // ✅ All collective logic lives HERE, not in the handler
        applyCollective: (room, drawer, ctx) => {
            const results = [];

            room.players.forEach((p, pWs) => {
                const pState = p.gameState;
                const stateBefore = JSON.parse(JSON.stringify(pState));

                if (pState.inFlow) {
                    // 順流層: 損失一半金錢
                    const loss = Math.floor(pState.cash / 2);
                    pState.cash -= loss;

                    results.push(`${p.playerName} (順流層): 損失一半金錢 $${loss.toLocaleString()}`);

                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "超級通貨膨脹", type: "hardship", id: "S01" },
                        "超級通貨膨脹", -loss,
                        `順流層損失一半金錢 $${loss.toLocaleString()}`,
                        stateBefore, pState
                    );

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id: "S01", name: "超級通貨膨脹",
                                description: `你在順流層，損失一半金錢 $${loss.toLocaleString()} 元！`,
                                image: "../cards/hardship/S01.png"
                            }),
                            effectMessage: `🌪️ 你在順流層，損失一半金錢 $${loss.toLocaleString()} 元！`,
                            gameState: pState
                        }));
                    }

                } else {
                    // 平流層/逆流層: 進入逆流層
                    const layerBefore = pState.inReverse ? '逆流層' : '平流層';
                    pState.inReverse  = true;
                    pState.inFlow     = false;
                    pState.reversePos = 0;
                    pState.skipSettlementIncome = true;

                    results.push(`${p.playerName} (${layerBefore}): 進入逆流層`);

                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "超級通貨膨脹", type: "hardship", id: "S01" },
                        "超級通貨膨脹", 0,
                        `從${layerBefore}進入逆流層`,
                        stateBefore, pState
                    );

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id: "S01", name: "超級通貨膨脹",
                                description: `你從${layerBefore}被送進逆流層！經過月收入格子沒有收入！`,
                                image: "../cards/hardship/S01.png"
                            }),
                            effectMessage: `🌪️ 你從${layerBefore}被送進逆流層！經過月收入格子沒有收入！`,
                            gameState: pState
                        }));
                    }
                }
            });

            return `🌪️ 集體逆境「超級通貨膨脹」！\n${results.join('\n')}`;
        },

        getEffectDescription: () => "集體逆境：非順流層玩家進入逆流層，順流層玩家損失一半金錢"
    },
    {
        id: "S02",
        name: "集體逆境 - 通貨膨脹屋租上漲",
        description: "通貨膨脹導致屋租上漲，所有租屋的玩家，屋租支出增加。所有沒有買房的玩家都遭此逆境。\n屋租支出：+$2,000/月",
        image: "../cards/hardship/S02.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: true,

        effect: (state) => {
            return `🏠 通貨膨脹屋租上漲！`;
        },

        applyCollective: (room, drawer, ctx) => {
            const results = [];
            const rentIncrease = 2000;

            room.players.forEach((p, pWs) => {
                const pState = p.gameState;
                const stateBefore = JSON.parse(JSON.stringify(pState));

                // Check if player owns any property
                const ownsProperty = pState.propertyInvestments &&
                    pState.propertyInvestments.length > 0;

                if (ownsProperty) {
                    // ✅ Has property - not affected (they own, not rent)
                    results.push(`${p.playerName}: 擁有物業，不受影響`);

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'notification',
                            message: `🏠 通貨膨脹屋租上漲！但你擁有物業，不受影響`
                        }));
                    }

                } else {
                    // ✅ No property - renting, rent goes up
                    pState.livingExpense = (pState.livingExpense || 0) + rentIncrease;

                    // Track the increase for potential future reversal
                    pState.rentIncreaseFromInflation =
                        (pState.rentIncreaseFromInflation || 0) + rentIncrease;

                    results.push(`${p.playerName}: 沒有物業，屋租 +$${rentIncrease.toLocaleString()}/月`);

                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "通貨膨脹屋租上漲", type: "hardship", id: "S02" },
                        "屋租上漲",
                        0,
                        `沒有買房，屋租支出增加 $${rentIncrease.toLocaleString()}/月`,
                        stateBefore,
                        pState
                    );

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id: "S02",
                                name: "通貨膨脹屋租上漲",
                                description: `你沒有買房，屋租支出增加 $${rentIncrease.toLocaleString()}/月！`,
                                image: "../cards/hardship/S02.png"
                            }),
                            effectMessage: `🏠 通貨膨脹！你沒有買房，屋租支出增加 $${rentIncrease.toLocaleString()}/月！`,
                            gameState: pState
                        }));
                    }
                }
            });

            const affectedCount = results.filter(r => r.includes('沒有物業')).length;
            const safeCount     = results.filter(r => r.includes('不受影響')).length;

            return `🏠 集體逆境「通貨膨脹屋租上漲」！\n` +
                `📊 受影響: ${affectedCount} 人 (屋租 +$${rentIncrease.toLocaleString()}/月)\n` +
                `🏡 不受影響: ${safeCount} 人 (擁有物業)\n\n` +
                results.join('\n');
        },

        getEffectDescription: () => "集體逆境：沒有買房的玩家屋租支出 +$2,000/月"
    },
    {
        id: "S03",
        name: "集體逆境 - 流感病毒肆虐",
        description: "流感病毒肆虐。\n精力 ≥ 3：精力 -3\n精力 < 3：入院治療，支付 $10,000（精力不變）",
        image: "../cards/hardship/S03.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: true,

        effect: (state) => {
            return `🦠 流感病毒肆虐！`;
        },

        applyCollective: (room, drawer, ctx) => {
            const results = [];
            const hospitalCost = 10000;
            const energyLoss   = 3;

            room.players.forEach((p, pWs) => {
                const pState = p.gameState;
                const stateBefore = JSON.parse(JSON.stringify(pState));

                if (pState.energy < 3) {
                    // ✅ Low energy — MUST go to hospital, pay $10,000 (energy unchanged)
                    const actualCost = Math.min(hospitalCost, pState.cash);
                    const shortfall  = hospitalCost - actualCost;

                    pState.cash -= actualCost;
                    // ❌ Do NOT change energy — pState.energy stays as-is

                    // If can't afford full cost, add to pending debt
                    if (shortfall > 0) {
                        pState.pendingDebts = pState.pendingDebts || [];
                        pState.pendingDebts.push({
                            id:           `debt_S03_${Date.now()}_${p.playerId}`,
                            amount:       shortfall,
                            source:       '住院醫療費用',
                            creditor:     'bank',
                            creditorName: '醫院',
                            createdAt:    Date.now()
                        });
                    }

                    const costMsg = shortfall > 0
                        ? `支付 $${actualCost.toLocaleString()} + 欠款 $${shortfall.toLocaleString()}`
                        : `支付 $${hospitalCost.toLocaleString()}`;

                    results.push(
                        `${p.playerName} (精力 ${stateBefore.energy}): ` +
                        `入院治療！${costMsg}，精力不變`
                    );

                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "流感病毒肆虐", type: "hardship", id: "S03" },
                        "住院醫療費用",
                        -actualCost,
                        `精力不足 (${stateBefore.energy})，入院治療！${costMsg}`,
                        stateBefore,
                        pState
                    );

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id:          "S03",
                                name:        "流感病毒肆虐",
                                description: `你的精力只有 ${stateBefore.energy}，需要入院治療！`,
                                image:       "../cards/hardship/S03.png"
                            }),
                            effectMessage: `🦠 流感入院！${costMsg}，精力不變`,
                            gameState:     pState
                        }));
                    }

                } else {
                    // ✅ Enough energy (≥ 3) — just lose 3 energy, no hospital fee
                    pState.energy = Math.max(0, pState.energy - energyLoss);

                    results.push(
                        `${p.playerName} (精力 ${stateBefore.energy} → ${pState.energy}): ` +
                        `患上流感！精力 -${energyLoss}`
                    );

                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "流感病毒肆虐", type: "hardship", id: "S03" },
                        "流感影響",
                        0,
                        `精力充足 (${stateBefore.energy})，僅精力 -${energyLoss}`,
                        stateBefore,
                        pState
                    );

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id:          "S03",
                                name:        "流感病毒肆虐",
                                description: `你精力充足 (${stateBefore.energy})，患上流感但不需入院`,
                                image:       "../cards/hardship/S03.png"
                            }),
                            effectMessage: `🦠 患上流感！精力 -${energyLoss}`,
                            gameState:     pState
                        }));
                    }
                }
            });

            const hospitalizedCount = results.filter(r => r.includes('入院')).length;
            const infectedCount     = results.filter(r => r.includes('患上流感')).length;

            return `🦠 集體逆境「流感病毒肆虐」！\n` +
                `🏥 入院治療: ${hospitalizedCount} 人 (醫療費 $${hospitalCost.toLocaleString()}，精力不變)\n` +
                `😷 患上流感: ${infectedCount} 人 (精力 -${energyLoss})\n\n` +
                results.join('\n');
        },

        getEffectDescription: () => "集體逆境：精力 ≥ 3 精力 -3；精力 < 3 入院支付 $10,000（精力不變）"
    },
    {
        id: "S04",
        name: "集體逆境 - 大量裁員潮",
        description: "很多公司大量裁員以縮減成本，所有人都要面臨被裁的風險。\n所有玩家都要擲骰，點數 >3 平安沒事；點數 ≤3 就需支付額外一個月支出。\n點數 ≤3，順流層玩家現金減半。",
        image: "../cards/hardship/S04.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: true,

        effect: (state) => {
            return `📉 大量裁員潮！所有玩家擲骰決定命運`;
        },

        applyCollective: (room, drawer, ctx) => {
            const results = [];

            room.players.forEach((p, pWs) => {
                const pState = p.gameState;
                const stateBefore = JSON.parse(JSON.stringify(pState));

                // Each player rolls a dice
                const diceRoll = Math.floor(Math.random() * 6) + 1;

                if (diceRoll > 3) {
                    // ✅ Safe - dice > 3
                    results.push(
                        `${p.playerName} 擲 ${diceRoll} 點: ✅ 平安沒事`
                    );

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id: "S04",
                                name: "大量裁員潮",
                                description: `你擲了 ${diceRoll} 點，平安沒事！`,
                                image: "../cards/hardship/S04.png"
                            }),
                            effectMessage: `📉 大量裁員潮！你擲了 ${diceRoll} 點 (>3)，平安沒事！😌`,
                            gameState: pState
                        }));
                    }

                } else {
                    // ❌ Unlucky - dice <= 3
                    if (pState.inFlow) {
                        // ✅ Flow layer player: cash halved + one month expense
                        const totalExpense = (pState.livingExpense || 0)
                            + (pState.tax || 0)
                            + (pState.loanInterest || 0)
                            + (pState.childExpense || 0);

                        const cashBefore = pState.cash;
                        const halfCash   = Math.floor(pState.cash / 2);
                        pState.cash      = halfCash;
                        const cashLostFromHalf = cashBefore - halfCash;

                        // Also pay one month expense
                        const expensePayment = Math.min(totalExpense, pState.cash);
                        pState.cash -= expensePayment;
                        const shortfall = totalExpense - expensePayment;

                        // Add shortfall to pending debt if can't afford
                        if (shortfall > 0) {
                            pState.pendingDebts = pState.pendingDebts || [];
                            pState.pendingDebts.push({
                                id:           `debt_S04_${Date.now()}_${p.playerId}`,
                                amount:       shortfall,
                                source:       '大量裁員潮額外支出',
                                creditor:     'bank',
                                creditorName: '銀行',
                                createdAt:    Date.now()
                            });
                        }

                        const totalLoss = cashLostFromHalf + expensePayment;
                        const shortfallMsg = shortfall > 0
                            ? `，欠款 $${shortfall.toLocaleString()}`
                            : '';

                        results.push(
                            `${p.playerName} 擲 ${diceRoll} 點 (順流層): ❌ 現金減半 (-$${cashLostFromHalf.toLocaleString()}) ` +
                            `+ 額外支出 $${totalExpense.toLocaleString()}${shortfallMsg}`
                        );

                        ctx.addTransactionRecord(
                            p.playerName,
                            { name: "大量裁員潮", type: "hardship", id: "S04" },
                            "裁員潮損失",
                            -totalLoss,
                            `擲 ${diceRoll} 點 (順流層)，現金減半 (-$${cashLostFromHalf.toLocaleString()}) + 額外支出 $${totalExpense.toLocaleString()}${shortfallMsg}`,
                            stateBefore,
                            pState
                        );

                        if (pWs && pWs.readyState === 1) {
                            pWs.send(JSON.stringify({
                                type: 'hardship_card_execute',
                                card: ctx.serializeCard({
                                    id: "S04",
                                    name: "大量裁員潮",
                                    description: `你擲了 ${diceRoll} 點，在順流層遭受雙重打擊！`,
                                    image: "../cards/hardship/S04.png"
                                }),
                                effectMessage: `📉 大量裁員潮！你擲了 ${diceRoll} 點 (≤3)！\n💸 現金減半: -$${cashLostFromHalf.toLocaleString()}\n💰 額外支出: $${totalExpense.toLocaleString()}${shortfallMsg}`,
                                gameState: pState
                            }));
                        }

                    } else {
                        // ✅ Streamline/Reverse player: pay one month expense only
                        const totalExpense = (pState.livingExpense || 0)
                            + (pState.tax || 0)
                            + (pState.loanInterest || 0)
                            + (pState.childExpense || 0);

                        const expensePayment = Math.min(totalExpense, pState.cash);
                        pState.cash -= expensePayment;
                        const shortfall = totalExpense - expensePayment;

                        // Add shortfall to pending debt
                        if (shortfall > 0) {
                            pState.pendingDebts = pState.pendingDebts || [];
                            pState.pendingDebts.push({
                                id:           `debt_S04_${Date.now()}_${p.playerId}`,
                                amount:       shortfall,
                                source:       '大量裁員潮額外支出',
                                creditor:     'bank',
                                creditorName: '銀行',
                                createdAt:    Date.now()
                            });
                        }

                        const layerName = pState.inReverse ? '逆流層' : '平流層';
                        const shortfallMsg = shortfall > 0
                            ? `，欠款 $${shortfall.toLocaleString()}`
                            : '';

                        results.push(
                            `${p.playerName} 擲 ${diceRoll} 點 (${layerName}): ❌ 額外支出 $${totalExpense.toLocaleString()}${shortfallMsg}`
                        );

                        ctx.addTransactionRecord(
                            p.playerName,
                            { name: "大量裁員潮", type: "hardship", id: "S04" },
                            "裁員潮損失",
                            -expensePayment,
                            `擲 ${diceRoll} 點 (${layerName})，額外支出 $${totalExpense.toLocaleString()}${shortfallMsg}`,
                            stateBefore,
                            pState
                        );

                        if (pWs && pWs.readyState === 1) {
                            pWs.send(JSON.stringify({
                                type: 'hardship_card_execute',
                                card: ctx.serializeCard({
                                    id: "S04",
                                    name: "大量裁員潮",
                                    description: `你擲了 ${diceRoll} 點，被裁員了！`,
                                    image: "../cards/hardship/S04.png"
                                }),
                                effectMessage: `📉 大量裁員潮！你擲了 ${diceRoll} 點 (≤3)！\n💰 額外支出一個月: $${totalExpense.toLocaleString()}${shortfallMsg}`,
                                gameState: pState
                            }));
                        }
                    }
                }
            });

            const safeCount    = results.filter(r => r.includes('✅')).length;
            const affectedCount = results.filter(r => r.includes('❌')).length;

            return `📉 集體逆境「大量裁員潮」！\n` +
                `🎲 所有玩家擲骰：\n` +
                `✅ 平安: ${safeCount} 人 (點數 >3)\n` +
                `❌ 被裁: ${affectedCount} 人 (點數 ≤3)\n\n` +
                results.join('\n');
        },

        getEffectDescription: () => "集體逆境：所有玩家擲骰，≤3 額外支出一個月，順流層 ≤3 現金減半"
    },
    {
        id: "S05",
        name: "集體逆境 - 股市暴跌",
        description: "股市暴跌，所有投資股票的玩家，將所有股票以初始價格的一半強行退回給銀行離場。",
        image: "../cards/hardship/S05.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: true,

        effect: (state) => {
            return `📉 股市暴跌！所有股票強制以半價退回`;
        },

        applyCollective: (room, drawer, ctx) => {
            const results = [];
            let totalMarketLoss = 0;

            room.players.forEach((p, pWs) => {
                const pState = p.gameState;

                if (!pState.stockHoldings || Object.keys(pState.stockHoldings).length === 0) {
                    // ✅ No stocks - not affected
                    results.push(`${p.playerName}: 沒有持股，不受影響`);

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'notification',
                            message: `📉 股市暴跌！但你沒有持有任何股票，不受影響`
                        }));
                    }
                    return;
                }

                // ✅ Has stocks - forced sell at half of original purchase price
                const stateBefore = JSON.parse(JSON.stringify(pState));
                let playerRefund = 0;
                let playerLoss   = 0;
                const soldDetails = [];

                for (const [stockId, holding] of Object.entries(pState.stockHoldings)) {
                    const originalCost = holding.totalCost;
                    const refundAmount = Math.floor(originalCost / 2);  // half of what they paid
                    const loss         = originalCost - refundAmount;

                    playerRefund += refundAmount;
                    playerLoss   += loss;

                    soldDetails.push(
                        `${holding.name || holding.code || stockId}: ` +
                        `${holding.shares} 股，原價 $${originalCost.toLocaleString()}，` +
                        `退回 $${refundAmount.toLocaleString()} (損失 $${loss.toLocaleString()})`
                    );
                }

                // Apply: clear all stocks, add refund to cash
                pState.cash += playerRefund;
                pState.stockHoldings = {};

                // Update total assets
                pState.totalAssets = Math.max(0, (pState.totalAssets || 0) - playerLoss);

                // Luck decrease
                // pState.luck = Math.max(0, pState.luck - 2);

                totalMarketLoss += playerLoss;

                results.push(
                    `${p.playerName}: 所有股票強制退回！` +
                    `退款 $${playerRefund.toLocaleString()}，損失 $${playerLoss.toLocaleString()}`
                );

                ctx.addTransactionRecord(
                    p.playerName,
                    { name: "股市暴跌", type: "hardship", id: "S05" },
                    "股票強制退回",
                    playerRefund - stateBefore.cash,  // net cash change (refund minus what they had in stocks)
                    `股市暴跌！所有股票以半價強制退回銀行。` +
                    `退款 $${playerRefund.toLocaleString()}，損失 $${playerLoss.toLocaleString()}，幸運值 -2\n` +
                    soldDetails.join('\n'),
                    stateBefore,
                    pState
                );

                if (pWs && pWs.readyState === 1) {
                    pWs.send(JSON.stringify({
                        type: 'hardship_card_execute',
                        card: ctx.serializeCard({
                            id: "S05",
                            name: "股市暴跌",
                            description: `你的所有股票被強制以半價退回銀行！`,
                            image: "../cards/hardship/S05.png"
                        }),
                        effectMessage: `📉 股市暴跌！你的所有股票被強制退回！\n` +
                            `💸 退回金額: $${playerRefund.toLocaleString()}\n` +
                            `💔 總損失: $${playerLoss.toLocaleString()}\n` +
                            `🍀 幸運值 -2\n\n` +
                            `📊 詳情:\n${soldDetails.join('\n')}`,
                        gameState: pState
                    }));
                }
            });

            const affectedCount = results.filter(r => r.includes('強制退回')).length;
            const safeCount     = results.filter(r => r.includes('不受影響')).length;

            return `📉 集體逆境「股市暴跌」！\n` +
                `📊 所有股票以初始價格一半強制退回銀行\n` +
                `💔 全場總損失: $${totalMarketLoss.toLocaleString()}\n` +
                `❌ 受影響: ${affectedCount} 人\n` +
                `✅ 不受影響: ${safeCount} 人\n\n` +
                results.join('\n');
        },

        getEffectDescription: () => "集體逆境：所有股票以初始價格一半強制退回銀行"
    },
    {
        id: "S06",
        name: "集體逆境 - 傳染病疫情",
        description: "由於受到傳染病疫情影響，有生意營運/參與投資者受到影響。\n現金損失：$20,000\n精力：-2",
        image: "../cards/hardship/S06.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: true,

        effect: (state) => {
            return `🦠 傳染病疫情！有生意或投資的玩家受影響`;
        },

        applyCollective: (room, drawer, ctx) => {
            const results = [];
            const cashLoss   = 20000;
            const energyLoss = 2;

            room.players.forEach((p, pWs) => {
                const pState = p.gameState;
                const stateBefore = JSON.parse(JSON.stringify(pState));

                // Check if player has any business or investment
                const hasBusinessInvestments = pState.businessInvestments &&
                    pState.businessInvestments.length > 0;
                const hasFinanceInvestments  = pState.financeInvestments &&
                    pState.financeInvestments.length > 0;
                const hasStockHoldings       = pState.stockHoldings &&
                    Object.keys(pState.stockHoldings).length > 0;
                const hasCryptoHoldings      = pState.cryptoHoldings &&
                    Object.keys(pState.cryptoHoldings).length > 0;
                const hasPropertyInvestments = pState.propertyInvestments &&
                    pState.propertyInvestments.length > 0;

                const hasInvestments = hasBusinessInvestments ||
                    hasFinanceInvestments  ||
                    hasStockHoldings       ||
                    hasCryptoHoldings      ||
                    hasPropertyInvestments;

                if (!hasInvestments) {
                    // ✅ No business or investments - not affected
                    results.push(`${p.playerName}: 沒有生意或投資，不受影響`);

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'notification',
                            message: `🦠 傳染病疫情！但你沒有生意或投資，不受影響`
                        }));
                    }
                    return;
                }

                // ✅ Has business/investments - affected
                const actualCashLoss = Math.min(cashLoss, pState.cash);
                const shortfall      = cashLoss - actualCashLoss;

                pState.cash   -= actualCashLoss;
                pState.energy  = Math.max(0, pState.energy - energyLoss);

                // Add shortfall to pending debt
                if (shortfall > 0) {
                    pState.pendingDebts = pState.pendingDebts || [];
                    pState.pendingDebts.push({
                        id:           `debt_S06_${Date.now()}_${p.playerId}`,
                        amount:       shortfall,
                        source:       '傳染病疫情損失',
                        creditor:     'bank',
                        creditorName: '銀行',
                        createdAt:    Date.now()
                    });
                }

                // Build what they own for display
                const investmentTypes = [];
                if (hasBusinessInvestments) investmentTypes.push('生意');
                if (hasFinanceInvestments)  investmentTypes.push('基金/P2P');
                if (hasStockHoldings)       investmentTypes.push('股票');
                if (hasCryptoHoldings)      investmentTypes.push('加密貨幣');
                if (hasPropertyInvestments) investmentTypes.push('物業');

                const shortfallMsg = shortfall > 0
                    ? `，欠款 $${shortfall.toLocaleString()}`
                    : '';

                results.push(
                    `${p.playerName} (持有: ${investmentTypes.join(', ')}): ` +
                    `損失 $${cashLoss.toLocaleString()}${shortfallMsg}，精力 -${energyLoss}`
                );

                ctx.addTransactionRecord(
                    p.playerName,
                    { name: "傳染病疫情", type: "hardship", id: "S06" },
                    "疫情損失",
                    -actualCashLoss,
                    `有生意/投資 (${investmentTypes.join(', ')})，損失 $${cashLoss.toLocaleString()}${shortfallMsg}，精力 -${energyLoss}`,
                    stateBefore,
                    pState
                );

                if (pWs && pWs.readyState === 1) {
                    pWs.send(JSON.stringify({
                        type: 'hardship_card_execute',
                        card: ctx.serializeCard({
                            id: "S06",
                            name: "傳染病疫情",
                            description: `你的生意/投資受到疫情影響！`,
                            image: "../cards/hardship/S06.png"
                        }),
                        effectMessage: `🦠 傳染病疫情！你持有 ${investmentTypes.join(', ')}，受到影響！\n` +
                            `💸 現金損失: $${cashLoss.toLocaleString()}${shortfallMsg}\n` +
                            `⚡ 精力: -${energyLoss}`,
                        gameState: pState
                    }));
                }
            });

            const affectedCount = results.filter(r => r.includes('損失')).length;
            const safeCount     = results.filter(r => r.includes('不受影響')).length;

            return `🦠 集體逆境「傳染病疫情」！\n` +
                `💸 有生意/投資者損失 $${cashLoss.toLocaleString()} + 精力 -${energyLoss}\n` +
                `❌ 受影響: ${affectedCount} 人\n` +
                `✅ 不受影響: ${safeCount} 人\n\n` +
                results.join('\n');
        },

        getEffectDescription: () => "集體逆境：有生意或投資的玩家損失 $20,000，精力 -2"
    },
    {
        id: "S07",
        name: "集體逆境 - 上市公司做假帳",
        description: "上市公司做假帳，股票停牌！\n擲1骰決定受影響股票：\n1,2,3 → A01 科技公司 & B01 金融公司\n4,5,6 → C01 加密貨幣 & H01 健康食品公司\n受影響股票以買入價半價強制退市。",
        image: "../cards/hardship/S07.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: true,

        effect: (state) => {
            return `📉 上市公司做假帳！股票停牌`;
        },

        applyCollective: (room, drawer, ctx) => {
            // First check if any player owns stocks
            let anyoneHasStocks = false;
            room.players.forEach((p) => {
                if (p.gameState.stockHoldings && Object.keys(p.gameState.stockHoldings).length > 0) {
                    anyoneHasStocks = true;
                }
            });

            if (!anyoneHasStocks) {
                return `📉 集體逆境「上市公司做假帳」！\n但沒有玩家持有任何股票，無事發生`;
            }

            // Roll dice to determine which stocks are affected
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            let affectedCodes = [];
            let affectedNames = '';

            if (diceRoll <= 3) {
                affectedCodes = ['A01', 'B01'];
                affectedNames = 'A01 科技公司 & B01 金融公司';
            } else {
                affectedCodes = ['H01'];
                affectedNames = 'H01 健康食品公司';
                // Also check crypto C01
            }

            const results = [];
            let totalMarketLoss = 0;

            room.players.forEach((p, pWs) => {
                const pState = p.gameState;

                if (!pState.stockHoldings || Object.keys(pState.stockHoldings).length === 0) {
                    results.push(`${p.playerName}: 沒有持股，不受影響`);

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'notification',
                            message: `📉 上市公司做假帳！擲了 ${diceRoll} 點，${affectedNames} 停牌。但你沒有持有相關股票`
                        }));
                    }
                    return;
                }

                const stateBefore = JSON.parse(JSON.stringify(pState));
                let playerRefund = 0;
                let playerLoss   = 0;
                const soldDetails = [];
                const stockIdsToRemove = [];

                // Check each stock holding
                for (const [stockId, holding] of Object.entries(pState.stockHoldings)) {
                    const stockCode = holding.code || stockId;

                    // Check if this stock code matches the affected ones
                    let isAffected = false;
                    for (const code of affectedCodes) {
                        if (stockCode === code || stockId.includes(code)) {
                            isAffected = true;
                            break;
                        }
                    }

                    if (!isAffected) continue;

                    // Force sell at half of original purchase price
                    const originalCost = holding.totalCost;
                    const refundAmount = Math.floor(originalCost / 2);
                    const loss         = originalCost - refundAmount;

                    playerRefund += refundAmount;
                    playerLoss   += loss;

                    soldDetails.push(
                        `${holding.name || stockCode}: ${holding.shares} 股，` +
                        `原價 $${originalCost.toLocaleString()} → ` +
                        `退回 $${refundAmount.toLocaleString()} (損失 $${loss.toLocaleString()})`
                    );

                    stockIdsToRemove.push(stockId);
                }

                // Remove affected stocks
                stockIdsToRemove.forEach(id => {
                    delete pState.stockHoldings[id];
                });

                if (playerRefund === 0 && playerLoss === 0) {
                    // Has stocks but none of the affected ones
                    results.push(`${p.playerName}: 持有股票但非受影響類別，不受影響`);

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'notification',
                            message: `📉 上市公司做假帳！${affectedNames} 停牌。你持有的股票不在此列，不受影響`
                        }));
                    }
                    return;
                }

                // Apply refund
                pState.cash += playerRefund;
                pState.totalAssets = Math.max(0, (pState.totalAssets || 0) - playerLoss);
                // pState.luck = Math.max(0, pState.luck - 1);

                totalMarketLoss += playerLoss;

                results.push(
                    `${p.playerName}: ${affectedNames} 強制退市！` +
                    `退款 $${playerRefund.toLocaleString()}，損失 $${playerLoss.toLocaleString()}`
                );

                ctx.addTransactionRecord(
                    p.playerName,
                    { name: "上市公司做假帳", type: "hardship", id: "S07" },
                    "股票強制退市",
                    playerRefund,
                    `${affectedNames} 做假帳停牌！以半價強制退市。` +
                    `退款 $${playerRefund.toLocaleString()}，損失 $${playerLoss.toLocaleString()}，幸運值 -1\n` +
                    soldDetails.join('\n'),
                    stateBefore,
                    pState
                );

                if (pWs && pWs.readyState === 1) {
                    pWs.send(JSON.stringify({
                        type: 'hardship_card_execute',
                        card: ctx.serializeCard({
                            id: "S07",
                            name: "上市公司做假帳",
                            description: `${affectedNames} 做假帳被揭發！你的相關股票被強制退市！`,
                            image: "../cards/hardship/S07.png"
                        }),
                        effectMessage: `📉 上市公司做假帳！擲了 ${diceRoll} 點\n` +
                            `🚫 受影響: ${affectedNames}\n` +
                            `💸 退回金額: $${playerRefund.toLocaleString()}\n` +
                            `💔 總損失: $${playerLoss.toLocaleString()}\n` +
                            `🍀 幸運值 -1\n\n` +
                            `📊 詳情:\n${soldDetails.join('\n')}`,
                        gameState: pState
                    }));
                }
            });

            const affectedCount   = results.filter(r => r.includes('強制退市')).length;
            const unaffectedCount = results.filter(r => r.includes('不受影響')).length;

            return `📉 集體逆境「上市公司做假帳」！\n` +
                `🎲 擲骰: ${diceRoll} 點 → ${affectedNames} 停牌\n` +
                `📊 受影響股票以買入價半價強制退市\n` +
                `💔 全場總損失: $${totalMarketLoss.toLocaleString()}\n` +
                `❌ 受影響: ${affectedCount} 人\n` +
                `✅ 不受影響: ${unaffectedCount} 人\n\n` +
                results.join('\n');
        },

        getEffectDescription: () => "集體逆境：擲骰決定哪些股票停牌，受影響股票以半價強制退市"
    },
    {
        id: "S08",
        name: "集體逆境 - 中東打仗海峽禁運",
        description: "中東打仗，海峽禁運，百物騰貴。\n所有 $500 元的抽卡現在要 $1,000，直到下一個逆境卡出現。",
        image: "../cards/hardship/S08.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: true,

        effect: (state) => {
            return `⚔️ 中東打仗！抽卡費用翻倍`;
        },

        applyCollective: (room, drawer, ctx) => {
            const results = [];

            room.players.forEach((p, pWs) => {
                const pState = p.gameState;

                // ✅ Set card cost multiplier on every player
                pState.cardCostMultiplier = 2;  // 500 × 2 = 1000

                results.push(`${p.playerName}: 抽卡費用 $500 → $1,000`);

                if (pWs && pWs.readyState === 1) {
                    pWs.send(JSON.stringify({
                        type: 'hardship_card_execute',
                        card: ctx.serializeCard({
                            id: "S08",
                            name: "中東打仗海峽禁運",
                            description: "百物騰貴！所有抽卡費用翻倍，直到下一個逆境卡出現",
                            image: "../cards/hardship/S08.png"
                        }),
                        effectMessage: `⚔️ 中東打仗！百物騰貴！\n💰 抽卡費用：$500 → $1,000\n⏰ 持續至下一張逆境卡出現`,
                        gameState: pState
                    }));
                }
            });

            return `⚔️ 集體逆境「中東打仗海峽禁運」！\n` +
                `💰 所有抽卡費用翻倍：$500 → $1,000\n` +
                `⏰ 持續至下一張逆境卡出現\n\n` +
                results.join('\n');
        },

        getEffectDescription: () => "集體逆境：所有抽卡費用翻倍 ($500→$1,000)，直到下一個逆境卡出現"
    },
    {
        id: "S09",
        name: "集體逆境 - JPEX騙案",
        description: "JPEX騙案爆發！\n在平流/逆流層的玩家：每人抽一張騙子卡。\n在順流層的玩家：減100萬。",
        image: "../cards/hardship/S09.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: true,
        needsLierCards: true,     // ← flag so handler knows to pass lierCards

        effect: (state) => {
            return `🚨 JPEX騙案！`;
        },

        applyCollective: (room, drawer, ctx) => {
            const results = [];
            const flowLoss = 1000000;

            room.players.forEach((p, pWs) => {
                const pState = p.gameState;
                const stateBefore = JSON.parse(JSON.stringify(pState));

                if (pState.inFlow) {
                    // ✅ Flow layer: lose $1,000,000
                    const actualLoss = Math.min(flowLoss, pState.cash);
                    const shortfall  = flowLoss - actualLoss;

                    pState.cash -= actualLoss;

                    if (shortfall > 0) {
                        pState.pendingDebts = pState.pendingDebts || [];
                        pState.pendingDebts.push({
                            id:           `debt_S09_${Date.now()}_${p.playerId}`,
                            amount:       shortfall,
                            source:       'JPEX騙案損失',
                            creditor:     'bank',
                            creditorName: '銀行',
                            createdAt:    Date.now()
                        });
                    }

                    const shortfallMsg = shortfall > 0
                        ? `，欠款 $${shortfall.toLocaleString()}`
                        : '';

                    results.push(
                        `${p.playerName} (順流層): 損失 $${flowLoss.toLocaleString()}${shortfallMsg}`
                    );

                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "JPEX騙案", type: "hardship", id: "S09" },
                        "JPEX損失",
                        -actualLoss,
                        `順流層玩家損失 $${flowLoss.toLocaleString()}${shortfallMsg}`,
                        stateBefore,
                        pState
                    );

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id: "S09",
                                name: "JPEX騙案",
                                description: `你在順流層，損失 $${flowLoss.toLocaleString()}！`,
                                image: "../cards/hardship/S09.png"
                            }),
                            effectMessage: `🚨 JPEX騙案！你在順流層，損失 $${flowLoss.toLocaleString()}${shortfallMsg}`,
                            gameState: pState
                        }));
                    }

                } else {
                    // ✅ Streamline/Reverse layer: draw a lier card
                    const layerName = pState.inReverse ? '逆流層' : '平流層';

                    results.push(
                        `${p.playerName} (${layerName}): 抽一張騙子卡`
                    );

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id: "S09",
                                name: "JPEX騙案",
                                description: `你在${layerName}，需要抽一張騙子卡！`,
                                image: "../cards/hardship/S09.png"
                            }),
                            effectMessage: `🚨 JPEX騙案！你在${layerName}，即將抽一張騙子卡！`,
                            gameState: pState
                        }));
                    }

                    // ✅ Queue lier card draw for this player
                    // Stored in ctx._pendingLierDraws so the handler can execute them after
                    ctx._pendingLierDraws = ctx._pendingLierDraws || [];
                    ctx._pendingLierDraws.push({
                        ws: pWs,
                        player: p,
                        playerName: p.playerName
                    });
                }
            });

            const flowCount   = results.filter(r => r.includes('順流層')).length;
            const lierCount   = results.filter(r => r.includes('騙子卡')).length;

            return `🚨 集體逆境「JPEX騙案」！\n` +
                `💸 順流層玩家: ${flowCount} 人，每人損失 $${flowLoss.toLocaleString()}\n` +
                `🎭 平流/逆流層玩家: ${lierCount} 人，每人抽一張騙子卡\n\n` +
                results.join('\n');
        },

        getEffectDescription: () => "集體逆境：平流/逆流層抽騙子卡，順流層損失 $100萬"
    },
    {
        id: "S10",
        name: "集體逆境 - 通貨緊縮",
        description: "通貨緊縮！\n順流層玩家：損失一半金錢\n平流層玩家：損失一半金錢\n逆流層玩家：再抽一張逆境卡",
        image: "../cards/hardship/S10.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: true,

        effect: (state) => {
            return `💸 通貨緊縮！`;
        },

        applyCollective: (room, drawer, ctx) => {
            const results = [];

            room.players.forEach((p, pWs) => {
                const pState = p.gameState;
                const stateBefore = JSON.parse(JSON.stringify(pState));

                if (pState.inFlow) {
                    // ✅ Flow layer: lose half cash
                    const loss = Math.floor(pState.cash / 2);
                    pState.cash -= loss;

                    results.push(`${p.playerName} (順流層): 損失一半金錢 $${loss.toLocaleString()}`);

                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "通貨緊縮", type: "hardship", id: "S10" },
                        "通貨緊縮損失", -loss,
                        `順流層損失一半金錢 $${loss.toLocaleString()}`,
                        stateBefore, pState
                    );

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id: "S10", name: "通貨緊縮",
                                description: `你在順流層，損失一半金錢！`,
                                image: "../cards/hardship/S10.png"
                            }),
                            effectMessage: `💸 通貨緊縮！你在順流層，損失一半金錢 $${loss.toLocaleString()}！`,
                            gameState: pState
                        }));
                    }

                } else if (pState.inReverse) {
                    // ✅ Reverse layer: draw another hardship card
                    results.push(`${p.playerName} (逆流層): 再抽一張逆境卡`);

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id: "S10", name: "通貨緊縮",
                                description: `你在逆流層，需要再抽一張逆境卡！`,
                                image: "../cards/hardship/S10.png"
                            }),
                            effectMessage: `💸 通貨緊縮！你在逆流層，即將再抽一張逆境卡！`,
                            gameState: pState
                        }));
                    }

                    // Queue hardship draw
                    ctx._pendingHardshipDraws = ctx._pendingHardshipDraws || [];
                    ctx._pendingHardshipDraws.push({
                        ws: pWs,
                        player: p,
                        playerName: p.playerName
                    });

                } else {
                    // ✅ Streamline layer: lose half cash
                    const loss = Math.floor(pState.cash / 2);
                    pState.cash -= loss;

                    results.push(`${p.playerName} (平流層): 損失一半金錢 $${loss.toLocaleString()}`);

                    ctx.addTransactionRecord(
                        p.playerName,
                        { name: "通貨緊縮", type: "hardship", id: "S10" },
                        "通貨緊縮損失", -loss,
                        `平流層損失一半金錢 $${loss.toLocaleString()}`,
                        stateBefore, pState
                    );

                    if (pWs && pWs.readyState === 1) {
                        pWs.send(JSON.stringify({
                            type: 'hardship_card_execute',
                            card: ctx.serializeCard({
                                id: "S10", name: "通貨緊縮",
                                description: `你在平流層，損失一半金錢！`,
                                image: "../cards/hardship/S10.png"
                            }),
                            effectMessage: `💸 通貨緊縮！你在平流層，損失一半金錢 $${loss.toLocaleString()}！`,
                            gameState: pState
                        }));
                    }
                }
            });

            const flowCount      = results.filter(r => r.includes('順流層')).length;
            const streamCount    = results.filter(r => r.includes('平流層')).length;
            const reverseCount   = results.filter(r => r.includes('逆流層')).length;

            return `💸 集體逆境「通貨緊縮」！\n` +
                `📊 順流層: ${flowCount} 人，損失一半金錢\n` +
                `📊 平流層: ${streamCount} 人，損失一半金錢\n` +
                `🎭 逆流層: ${reverseCount} 人，再抽逆境卡\n\n` +
                results.join('\n');
        },

        getEffectDescription: () => "集體逆境：順流/平流層損失一半金錢，逆流層再抽逆境卡"
    },
    {
        id: "S11",
        name: "個人逆境 - 誤信假網購廣告",
        description: "誤信假網購廣告，被騙款及影響健康。\n抽2張騙子卡",
        image: "../cards/hardship/S11.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: false,
        drawLierCount: 2,     // ← how many lier cards to draw

        effect: (state) => {
            return `🚨 誤信假網購廣告！即將抽 2 張騙子卡`;
        },

        getEffectDescription: () => "個人逆境：抽 2 張騙子卡"
    },
    {
        id: "S12",
        name: "個人逆境 - 運動扭傷足踝",
        description: "運動時扭傷足踝，需要支出一筆醫療費用。\n醫療費支出：$3,000\n停一回合",
        image: "../cards/hardship/S12.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: false,

        effect: (state) => {
            const medicalCost = 3000;

            if (state.cash >= medicalCost) {
                state.cash -= medicalCost;
            } else {
                const shortfall = medicalCost - state.cash;
                state.cash = 0;
                state.pendingDebts = state.pendingDebts || [];
                state.pendingDebts.push({
                    id:           `debt_S12_${Date.now()}`,
                    amount:       shortfall,
                    source:       '運動扭傷醫療費',
                    creditor:     'bank',
                    creditorName: '醫院',
                    createdAt:    Date.now()
                });
            }

            state.skipNextTurn = true;

            return `🏥 運動扭傷足踝！醫療費 $${medicalCost.toLocaleString()}，停一回合`;
        },

        getEffectDescription: () => "個人逆境：醫療費 $3,000，停一回合"
    },
    {
        id: "S13",
        name: "個人逆境 - 公司減薪",
        description: "市道不景氣，公司減薪。\n下次月收入減半。",
        image: "../cards/hardship/S13.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: false,

        effect: (state) => {
            state.nextSettlementHalfIncome = true;

            return `📉 市道不景氣！公司減薪，下次月收入減半`;
        },

        getEffectDescription: () => "個人逆境：下次月收入減半"
    },
    {
        id: "S14",
        name: "個人逆境 - 合約糾紛",
        description: "因合約糾紛損失一筆費用，並令健康指數下跌。\n每回合支付 $1,000，直到你擲骰子擲到 4/5/6。",
        image: "../cards/hardship/S14.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: false,

        effect: (state) => {
            // Set ongoing penalty flag
            state.contractDispute = {
                active:       true,
                monthlyCost:  1000,
                startedAt:    Date.now()
            };

            // Immediate health/energy impact
            state.energy = Math.max(0, state.energy - 2);

            return `⚖️ 合約糾紛！精力 -2，每回合支付 $1,000 直到擲到 4/5/6`;
        },

        getEffectDescription: () => "個人逆境：每回合支付 $1,000，直到擲到 4/5/6"
    },
    {
        id: "S15",
        name: "個人逆境 - 公司裁員",
        description: "公司裁員，你被解僱了，支付一個月開支。",
        image: "../cards/hardship/S15.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: false,

        effect: (state) => {
            const totalExpense = (state.livingExpense || 0)
                + (state.tax || 0)
                + (state.loanInterest || 0)
                + (state.childExpense || 0);

            if (state.cash >= totalExpense) {
                state.cash -= totalExpense;
            } else {
                const shortfall = totalExpense - state.cash;
                state.cash = 0;
                state.pendingDebts = state.pendingDebts || [];
                state.pendingDebts.push({
                    id:           `debt_S15_${Date.now()}`,
                    amount:       shortfall,
                    source:       '裁員額外支出',
                    creditor:     'bank',
                    creditorName: '銀行',
                    createdAt:    Date.now()
                });
            }

            return `📉 公司裁員！你被解僱了，支付一個月開支 $${totalExpense.toLocaleString()}`;
        },

        getEffectDescription: () => "個人逆境：支付一個月開支"
    },
    {
        id: "S16",
        name: "個人逆境 - 工作效率低被減薪",
        description: "工作效率低，被公司減薪。\n月收入減 $2,000（更新月入報表）。",
        image: "../cards/hardship/S16.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: false,

        effect: (state) => {
            const reduction = 2000;
            const oldSalary = state.salary;
            state.salary = Math.max(0, state.salary - reduction);
            const actualReduction = oldSalary - state.salary;

            return `📉 工作效率低被減薪！月薪 $${oldSalary.toLocaleString()} → $${state.salary.toLocaleString()} (-$${actualReduction.toLocaleString()}/月)`;
        },

        getEffectDescription: () => "個人逆境：月薪 -$2,000"
    },
    {
        id: "S17",
        name: "個人逆境 - 遺失銀包",
        description: "遺失銀包，損失一筆金錢。\n擲1骰子，你要支付點數 × $3,000。",
        image: "../cards/hardship/S17.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: false,

        effect: (state) => {
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            const loss = diceRoll * 3000;

            if (state.cash >= loss) {
                state.cash -= loss;
            } else {
                const shortfall = loss - state.cash;
                state.cash = 0;
                state.pendingDebts = state.pendingDebts || [];
                state.pendingDebts.push({
                    id:           `debt_S17_${Date.now()}`,
                    amount:       shortfall,
                    source:       '遺失銀包損失',
                    creditor:     'bank',
                    creditorName: '銀行',
                    createdAt:    Date.now()
                });
            }

            return `👛 遺失銀包！擲了 ${diceRoll} 點，損失 ${diceRoll} × $3,000 = $${loss.toLocaleString()}`;
        },

        getEffectDescription: () => "個人逆境：擲骰 × $3,000"
    },
    {
        id: "S18",
        name: "個人逆境 - 對前途迷茫",
        description: "對前途迷茫。\n在下兩個回合中，擲1骰子，你擲到 5-6 才能行動，第三回合你可正常擲骰行動。",
        image: "../cards/hardship/S18.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: false,

        effect: (state) => {
            state.confused = {
                active:         true,
                turnsRemaining: 2,
                minDiceToAct:   5     // must roll 5 or 6 to move
            };

            return `😵 對前途迷茫！接下來 2 回合需要擲到 5-6 才能行動`;
        },

        getEffectDescription: () => "個人逆境：接下來 2 回合擲到 5-6 才能行動"
    },
    {
        id: "S19",
        name: "個人逆境 - 忘記報稅",
        description: "忘記報稅，需繳交罰款。\n罰款支出：$3,000\n精力：-2\n（可自選）：支出 $10,000 聘請稅務顧問幫你處理，精力 +2",
        image: "../cards/hardship/S19.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: false,
        hasChoice: true,       // ← flag triggers choice modal

        effect: (state) => {
            // Base penalty always applies
            const fine = 3000;

            if (state.cash >= fine) {
                state.cash -= fine;
            } else {
                const shortfall = fine - state.cash;
                state.cash = 0;
                state.pendingDebts = state.pendingDebts || [];
                state.pendingDebts.push({
                    id:           `debt_S19_${Date.now()}`,
                    amount:       shortfall,
                    source:       '忘記報稅罰款',
                    creditor:     'bank',
                    creditorName: '稅務局',
                    createdAt:    Date.now()
                });
            }

            state.energy = Math.max(0, state.energy - 2);

            return `📋 忘記報稅！罰款 $${fine.toLocaleString()}，精力 -2`;
        },

        // ✅ Called when player chooses whether to hire tax consultant
        applyChoice: (state, choice) => {
            if (choice === 'hire') {
                const consultantCost = 10000;

                if (state.cash >= consultantCost) {
                    state.cash   -= consultantCost;
                    state.energy  = Math.min(state.maxEnergy, state.energy + 2);

                    return `✅ 聘請稅務顧問！支出 $${consultantCost.toLocaleString()}，精力 +2`;
                } else {
                    return `❌ 現金不足 $${consultantCost.toLocaleString()}，無法聘請稅務顧問`;
                }
            }

            return `📋 你選擇不聘請稅務顧問`;
        },

        getEffectDescription: () => "個人逆境：罰款 $3,000 精力 -2，可選花 $10,000 聘請顧問恢復精力"
    },
    {
        id: "S20",
        name: "個人逆境 - 高利貸",
        description: "急需用錢，借了一筆月息 30% 的高利貸 $10,000。\n財務報表額外負債增加 $10,000，額外每月負債支出增加 $3,000。\n額外負債支出：$3,000/月",
        image: "../cards/hardship/S20.png",
        type: "hardship",
        category: "逆境自強卡",
        isCollective: false,

        effect: (state) => {
            const loanAmount    = 10000;
            const monthlyExpense = 3000;

            // Receive the loan money
            state.cash += loanAmount;

            // Add to living expense (permanent until repaid)
            state.livingExpense = (state.livingExpense || 0) + monthlyExpense;

            // Track the loan shark debt separately
            state.loanSharkDebts = state.loanSharkDebts || [];
            state.loanSharkDebts.push({
                id:              `shark_${Date.now()}`,
                principal:       loanAmount,
                remainingAmount: loanAmount,
                monthlyPayment:  monthlyExpense,
                interestRate:    30,
                totalPaid:       0,
                active:          true,
                createdAt:       Date.now()
            });

            return `🦈 高利貸！借入 $${loanAmount.toLocaleString()}，每月額外支出 $${monthlyExpense.toLocaleString()} (月息 30%)`;
        },

        getEffectDescription: () => "個人逆境：借高利貸 $10,000，每月額外支出 $3,000"
    }
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { hardshipCards };
}