// volunteer_cards.js - 义工卡数据

const volunteerCards = [
    {
        id: "V01",
        name: "協助基層人士",
        description: "你自願給 $5,000 予現金最少的玩家(不能是你)，執行者記一次義工。",
        image: "../cards/volunteer/V01.png",
        cost: 0,
        type: "volunteer",
        category: "义工卡",
        requiresDonation: true,
        donationAmount: 5000,
        effect: (state, room, currentPlayer, ws, roomId) => {
            // 找到现金最少的玩家（不能是自己）
            let targetPlayer = null;
            let minCash = Infinity;
            let otherPlayers = [];
            
            room.players.forEach((player, playerWs) => {
                if (playerWs !== ws) {
                    otherPlayers.push({ ws: playerWs, player: player });
                    if (player.gameState.cash < minCash) {
                        minCash = player.gameState.cash;
                        targetPlayer = { ws: playerWs, player: player };
                    }
                }
            });
            
            if (!targetPlayer || otherPlayers.length === 0) {
                return `👥 沒有其他玩家在線，無法執行捐款。`;
            }
            
            const donationAmount = 5000;
            
            // 询问执行者是否愿意捐款
            // 这里需要等待前端确认，所以返回需要选择的标记
            if (!state._donationConfirmed) {
                return {
                    type: 'donation_choice',
                    message: `🤝 協助基層人士\n\n你是否願意捐款 $${donationAmount.toLocaleString()} 給 ${targetPlayer.player.playerName}？\n\n捐款後你將獲得 1 次義工資格！`,
                    donationAmount: donationAmount,
                    targetPlayer: targetPlayer.player.playerName,
                    cardId: "V01"
                };
            }
            
            // 执行捐款
            currentPlayer.gameState.cash -= donationAmount;
            targetPlayer.player.gameState.cash += donationAmount;
            
            addTransactionRecord(
                currentPlayer.playerName,
                { name: "協助基層人士捐款", type: "volunteer", id: "V01" },
                "義工捐款",
                -donationAmount,
                `捐款 ${donationAmount.toLocaleString()} 元給 ${targetPlayer.player.playerName}`,
                null,
                currentPlayer.gameState
            );
            
            addTransactionRecord(
                targetPlayer.player.playerName,
                { name: "協助基層人士受助", type: "volunteer", id: "V01" },
                "接受義工捐款",
                donationAmount,
                `收到 ${currentPlayer.player.playerName} 的捐款 ${donationAmount.toLocaleString()} 元`,
                null,
                targetPlayer.player.gameState
            );
            
            state.volunteerCount = (state.volunteerCount || 0) + 1;
            state.volunteerShield = (state.volunteerShield || 0) + 1;
            state.energy = Math.max(0, state.energy - 1);
            state.luck = Math.min(state.maxLuck, state.luck + 2);
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🤝 ${currentPlayer.playerName} 發起「協助基層人士」義工活動！捐款 ${donationAmount.toLocaleString()} 元給 ${targetPlayer.player.playerName}！獲得義工資格！`
            });
            
            return `🤝 協助基層人士成功！\n` +
                   `💰 你捐款 ${donationAmount.toLocaleString()} 元給 ${targetPlayer.player.playerName}\n` +
                   `⭐ 你獲得 1 次義工資格！精力 -1，幸運值 +2\n` +
                   `📝 目前義工次數: ${state.volunteerShield}`;
        },
        getEffectDescription: () => "自願捐款 $5,000 予現金最少的玩家，執行者記一次義工，精力 -1，幸運值 +2"
    },
    {
        id: "V02",
        name: "幫助傷健人士",
        description: "每個玩家自願捐出 $2000 予現金最少的玩家，執行者記一次義工。",
        image: "../cards/volunteer/V02.png",
        cost: 0,
        type: "volunteer",
        category: "义工卡",
        requiresDonation: true,
        donationAmount: 2000,
        effect: (state, room, currentPlayer, ws, roomId, donationResponses) => {
            // 找到现金最少的玩家
            let minCashPlayer = null;
            let minCash = Infinity;
            let allPlayers = [];
            
            room.players.forEach((player, playerWs) => {
                allPlayers.push({ ws: playerWs, player: player });
                if (player.gameState.cash < minCash) {
                    minCash = player.gameState.cash;
                    minCashPlayer = { ws: playerWs, player: player };
                }
            });
            
            if (!minCashPlayer || allPlayers.length <= 1) {
                return `👥 沒有足夠玩家在線，無法執行捐款。`;
            }
            
            const donationAmount = 2000;
            const isSelfTarget = (minCashPlayer.ws === ws);
            
            // 如果需要收集捐款响应
            if (!donationResponses) {
                // 返回需要收集所有玩家响应的标记
                const playersToAsk = [];
                allPlayers.forEach(({ ws: playerWs, player: p }) => {
                    if (playerWs !== minCashPlayer.ws) {
                        playersToAsk.push({
                            ws: playerWs,
                            playerName: p.playerName,
                            cash: p.gameState.cash
                        });
                    }
                });
                
                return {
                    type: 'collect_donations',
                    message: `🤝 幫助傷健人士\n\n現金最少的玩家是：${minCashPlayer.player.playerName}\n\n請每位玩家選擇是否捐款 $${donationAmount.toLocaleString()} 給 TA？\n\n捐款的玩家將獲得幸運值 +1 獎勵！`,
                    donationAmount: donationAmount,
                    targetPlayer: minCashPlayer.player.playerName,
                    isSelfTarget: isSelfTarget,
                    playersToAsk: playersToAsk,
                    cardId: "V02",
                    cardName: "幫助傷健人士"
                };
            }
            
            // 处理捐款响应
            let totalDonation = 0;
            let donors = [];
            
            for (const [playerName, willDonate] of Object.entries(donationResponses)) {
                if (willDonate) {
                    // 找到对应的玩家
                    let donorPlayer = null;
                    let donorWs = null;
                    for (let [pWs, p] of room.players) {
                        if (p.playerName === playerName) {
                            donorPlayer = p;
                            donorWs = pWs;
                            break;
                        }
                    }
                    
                    if (donorPlayer && donorPlayer.gameState.cash >= donationAmount) {
                        donorPlayer.gameState.cash -= donationAmount;
                        totalDonation += donationAmount;
                        donors.push(playerName);
                        
                        // 捐款者获得幸运值奖励
                        donorPlayer.gameState.luck = Math.min(donorPlayer.gameState.maxLuck || 10, donorPlayer.gameState.luck + 1);
                        
                        addTransactionRecord(
                            playerName,
                            { name: "幫助傷健人士捐款", type: "volunteer", id: "V02" },
                            "義工捐款",
                            -donationAmount,
                            `捐款 ${donationAmount.toLocaleString()} 元給 ${minCashPlayer.player.playerName}`,
                            null,
                            donorPlayer.gameState
                        );
                        
                        // 通知捐款者
                        if (donorWs) {
                            broadcastToRoom(roomId, {
                                type: 'notification',
                                message: `✅ 你捐款 $${donationAmount.toLocaleString()} 給 ${minCashPlayer.player.playerName}，幸運值 +1！`
                            }, null);
                        }
                    } else if (donorPlayer && donorPlayer.gameState.cash > 0) {
                        // 现金不足，捐出所有
                        const actualDonation = donorPlayer.gameState.cash;
                        donorPlayer.gameState.cash = 0;
                        totalDonation += actualDonation;
                        donors.push(`${playerName}(${actualDonation.toLocaleString()})`);
                        
                        addTransactionRecord(
                            playerName,
                            { name: "幫助傷健人士捐款", type: "volunteer", id: "V02" },
                            "義工捐款",
                            -actualDonation,
                            `盡力捐款 ${actualDonation.toLocaleString()} 元給 ${minCashPlayer.player.playerName}`,
                            null,
                            donorPlayer.gameState
                        );
                    }
                }
            }
            
            if (donors.length === 0) {
                return `💰 沒有玩家願意捐款。`;
            }
            
            // 捐款给现金最少的玩家
            minCashPlayer.player.gameState.cash += totalDonation;
            
            addTransactionRecord(
                minCashPlayer.player.playerName,
                { name: "幫助傷健人士受助", type: "volunteer", id: "V02" },
                "接受義工捐款",
                totalDonation,
                `收到 ${donors.join(', ')} 的捐款共 ${totalDonation.toLocaleString()} 元`,
                null,
                minCashPlayer.player.gameState
            );
            
            // 执行者获得义工次数
            currentPlayer.gameState.volunteerCount = (currentPlayer.gameState.volunteerCount || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            currentPlayer.gameState.luck = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 2);
            
            // 额外精力奖励
            currentPlayer.gameState.energy = Math.min(currentPlayer.gameState.maxEnergy, currentPlayer.gameState.energy + 2);
            
            let targetMsg = minCashPlayer.player.playerName;
            if (isSelfTarget) {
                targetMsg = `${minCashPlayer.player.playerName} (自己)`;
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🤝 ${currentPlayer.playerName} 發起「幫助傷健人士」義工活動！${donors.join(', ')} 合共捐款 ${totalDonation.toLocaleString()} 元給 ${targetMsg}！${currentPlayer.playerName} 獲得義工資格！`
            });
            
            let selfNote = isSelfTarget ? `\n📌 你是現金最少的玩家，收到了捐款！` : '';
            
            return `🤝 幫助傷健人士成功！\n` +
                   `💰 ${donors.join(', ')} 合共捐款 ${totalDonation.toLocaleString()} 元給 ${targetMsg}\n` +
                   `⭐ 你獲得 1 次義工資格！精力 -1，幸運值 +2，額外精力 +2\n` +
                   `📝 目前義工次數: ${currentPlayer.gameState.volunteerShield}${selfNote}`;
        },
        getEffectDescription: () => "每位玩家可自願捐款 $2,000 予現金最少的玩家，執行者記一次義工，精力 -1，幸運值 +2，額外精力 +2"
    },
    {
        id: "V03",
        name: "拯救他國饑民",
        description: "每個玩家自願捐出 $3000 予銀行，執行者記一次義工。",
        image: "../cards/volunteer/V03.png",
        cost: 0,
        type: "volunteer",
        category: "义工卡",
        requiresDonation: true,
        donationAmount: 3000,
        effect: (state, room, currentPlayer, ws, roomId, donationResponses) => {
            let otherPlayers = [];
            
            room.players.forEach((player, playerWs) => {
                if (playerWs !== ws) {
                    otherPlayers.push({ ws: playerWs, player: player });
                }
            });
            
            if (otherPlayers.length === 0) {
                return `👥 沒有其他玩家在線，無法執行捐款。`;
            }
            
            const donationAmount = 3000;
            
            // 如果需要收集捐款响应
            if (!donationResponses) {
                const playersToAsk = otherPlayers.map(({ ws: pWs, player: p }) => ({
                    ws: pWs,
                    playerName: p.playerName,
                    cash: p.gameState.cash
                }));
                
                return {
                    type: 'collect_donations_bank',
                    message: `🌍 拯救他國饑民\n\n請每位玩家選擇是否捐款 $${donationAmount.toLocaleString()} 給銀行？\n\n捐款的玩家將獲得幸運值 +1 獎勵！`,
                    donationAmount: donationAmount,
                    playersToAsk: playersToAsk,
                    cardId: "V03",
                    cardName: "拯救他國饑民"
                };
            }
            
            let totalDonation = 0;
            let donors = [];
            
            for (const [playerName, willDonate] of Object.entries(donationResponses)) {
                if (willDonate) {
                    let donorPlayer = null;
                    for (let [pWs, p] of room.players) {
                        if (p.playerName === playerName) {
                            donorPlayer = p;
                            break;
                        }
                    }
                    
                    if (donorPlayer && donorPlayer.gameState.cash >= donationAmount) {
                        donorPlayer.gameState.cash -= donationAmount;
                        totalDonation += donationAmount;
                        donors.push(playerName);
                        donorPlayer.gameState.luck = Math.min(donorPlayer.gameState.maxLuck || 10, donorPlayer.gameState.luck + 1);
                        
                        addTransactionRecord(
                            playerName,
                            { name: "拯救他國饑民捐款", type: "volunteer", id: "V03" },
                            "義工捐款",
                            -donationAmount,
                            `捐款 ${donationAmount.toLocaleString()} 元給銀行（拯救饑民）`,
                            null,
                            donorPlayer.gameState
                        );
                    } else if (donorPlayer && donorPlayer.gameState.cash > 0) {
                        const actualDonation = donorPlayer.gameState.cash;
                        donorPlayer.gameState.cash = 0;
                        totalDonation += actualDonation;
                        donors.push(`${playerName}(${actualDonation.toLocaleString()})`);
                        
                        addTransactionRecord(
                            playerName,
                            { name: "拯救他國饑民捐款", type: "volunteer", id: "V03" },
                            "義工捐款",
                            -actualDonation,
                            `盡力捐款 ${actualDonation.toLocaleString()} 元給銀行（拯救饑民）`,
                            null,
                            donorPlayer.gameState
                        );
                    }
                }
            }
            
            if (donors.length === 0) {
                return `💰 沒有玩家願意捐款。`;
            }
            
            // 执行者获得义工次数
            currentPlayer.gameState.volunteerCount = (currentPlayer.gameState.volunteerCount || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            currentPlayer.gameState.luck = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 3);
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🌍 ${currentPlayer.playerName} 發起「拯救他國饑民」義工活動！${donors.join(', ')} 合共捐款 ${totalDonation.toLocaleString()} 元給銀行！${currentPlayer.playerName} 獲得義工資格！`
            });
            
            return `🌍 拯救他國饑民成功！\n` +
                   `💰 ${donors.join(', ')} 合共捐款 ${totalDonation.toLocaleString()} 元給銀行\n` +
                   `⭐ 你獲得 1 次義工資格！精力 -1，幸運值 +3\n` +
                   `📝 目前義工次數: ${currentPlayer.gameState.volunteerShield}`;
        },
        getEffectDescription: () => "每位玩家可自願捐出 $3,000 予銀行，執行者記一次義工，精力 -1，幸運值 +3"
    },
    {
        id: "V04",
        name: "義工探望兒童病房",
        description: "每個玩家自願捐出 $2000 予現金最少的玩家，執行者記一次義工。",
        image: "../cards/volunteer/V04.png",
        cost: 0,
        type: "volunteer",
        category: "义工卡",
        requiresDonation: true,
        donationAmount: 2000,
        effect: (state, room, currentPlayer, ws, roomId, donationResponses) => {
            // 找到现金最少的玩家
            let targetPlayer = null;
            let minCash = Infinity;
            let allPlayers = [];
            
            room.players.forEach((player, playerWs) => {
                allPlayers.push({ ws: playerWs, player: player });
                if (player.gameState.cash < minCash) {
                    minCash = player.gameState.cash;
                    targetPlayer = { ws: playerWs, player: player };
                }
            });
            
            if (!targetPlayer || allPlayers.length <= 1) {
                return `👥 沒有足夠玩家在線，無法執行捐款。`;
            }
            
            const donationAmount = 2000;
            const isSelfTarget = (targetPlayer.ws === ws);
            
            // 如果需要收集捐款响应
            if (!donationResponses) {
                const playersToAsk = [];
                allPlayers.forEach(({ ws: playerWs, player: p }) => {
                    if (playerWs !== targetPlayer.ws) {
                        playersToAsk.push({
                            ws: playerWs,
                            playerName: p.playerName,
                            cash: p.gameState.cash
                        });
                    }
                });
                
                return {
                    type: 'collect_donations',
                    message: `🏥 義工探望兒童病房\n\n現金最少的玩家是：${targetPlayer.player.playerName}\n\n請每位玩家選擇是否捐款 $${donationAmount.toLocaleString()} 給 TA？\n\n捐款的玩家將獲得幸運值 +1 獎勵！`,
                    donationAmount: donationAmount,
                    targetPlayer: targetPlayer.player.playerName,
                    isSelfTarget: isSelfTarget,
                    playersToAsk: playersToAsk,
                    cardId: "V04",
                    cardName: "義工探望兒童病房"
                };
            }
            
            // 处理捐款响应
            let totalDonation = 0;
            let donors = [];
            
            for (const [playerName, willDonate] of Object.entries(donationResponses)) {
                if (willDonate) {
                    let donorPlayer = null;
                    for (let [pWs, p] of room.players) {
                        if (p.playerName === playerName) {
                            donorPlayer = p;
                            break;
                        }
                    }
                    
                    if (donorPlayer && donorPlayer.gameState.cash >= donationAmount) {
                        donorPlayer.gameState.cash -= donationAmount;
                        totalDonation += donationAmount;
                        donors.push(playerName);
                        donorPlayer.gameState.luck = Math.min(donorPlayer.gameState.maxLuck || 10, donorPlayer.gameState.luck + 1);
                        
                        addTransactionRecord(
                            playerName,
                            { name: "義工探望兒童病房捐款", type: "volunteer", id: "V04" },
                            "義工捐款",
                            -donationAmount,
                            `捐款 ${donationAmount.toLocaleString()} 元給 ${targetPlayer.player.playerName}（兒童病房探望）`,
                            null,
                            donorPlayer.gameState
                        );
                    } else if (donorPlayer && donorPlayer.gameState.cash > 0) {
                        const actualDonation = donorPlayer.gameState.cash;
                        donorPlayer.gameState.cash = 0;
                        totalDonation += actualDonation;
                        donors.push(`${playerName}(${actualDonation.toLocaleString()})`);
                        
                        addTransactionRecord(
                            playerName,
                            { name: "義工探望兒童病房捐款", type: "volunteer", id: "V04" },
                            "義工捐款",
                            -actualDonation,
                            `盡力捐款 ${actualDonation.toLocaleString()} 元給 ${targetPlayer.player.playerName}（兒童病房探望）`,
                            null,
                            donorPlayer.gameState
                        );
                    }
                }
            }
            
            if (donors.length === 0) {
                return `💰 沒有玩家願意捐款。`;
            }
            
            // 捐款给现金最少的玩家
            targetPlayer.player.gameState.cash += totalDonation;
            
            addTransactionRecord(
                targetPlayer.player.playerName,
                { name: "義工探望兒童病房受助", type: "volunteer", id: "V04" },
                "接受義工捐款",
                totalDonation,
                `收到 ${donors.join(', ')} 的捐款共 ${totalDonation.toLocaleString()} 元（兒童病房探望）`,
                null,
                targetPlayer.player.gameState
            );
            
            // 执行者获得义工次数
            currentPlayer.gameState.volunteerCount = (currentPlayer.gameState.volunteerCount || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            currentPlayer.gameState.luck = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 2);
            currentPlayer.gameState.energy = Math.min(currentPlayer.gameState.maxEnergy, currentPlayer.gameState.energy + 2);
            
            let targetMsg = targetPlayer.player.playerName;
            if (isSelfTarget) {
                targetMsg = `${targetPlayer.player.playerName} (自己)`;
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🏥 ${currentPlayer.playerName} 發起「義工探望兒童病房」活動！${donors.join(', ')} 合共捐款 ${totalDonation.toLocaleString()} 元給 ${targetMsg}！${currentPlayer.playerName} 獲得義工資格！`
            });
            
            let selfNote = isSelfTarget ? `\n📌 你是現金最少的玩家，收到了捐款！` : '';
            
            return `🏥 義工探望兒童病房成功！\n` +
                   `💰 ${donors.join(', ')} 合共捐款 ${totalDonation.toLocaleString()} 元給 ${targetMsg}\n` +
                   `⭐ 你獲得 1 次義工資格！精力 -1，幸運值 +2，額外精力 +2\n` +
                   `📝 目前義工次數: ${currentPlayer.gameState.volunteerShield}${selfNote}`;
        },
        getEffectDescription: () => "每位玩家可自願捐款 $2,000 予現金最少的玩家，執行者記一次義工，精力 -1，幸運值 +2，額外精力 +2"
    },
    {
        id: "V05",
        name: "集體善事探望長者",
        description: "每個玩家自願捐出 2 精力予現金最少的玩家，執行者記一次義工。",
        image: "../cards/volunteer/V05.png",
        cost: 0,
        type: "volunteer",
        category: "义工卡",
        requiresDonation: true,
        donationType: "energy",
        donationAmount: 2,
        effect: (state, room, currentPlayer, ws, roomId, donationResponses) => {
            // 找到现金最少的玩家
            let targetPlayer = null;
            let minCash = Infinity;
            let allPlayers = [];
            
            room.players.forEach((player, playerWs) => {
                allPlayers.push({ ws: playerWs, player: player });
                if (player.gameState.cash < minCash) {
                    minCash = player.gameState.cash;
                    targetPlayer = { ws: playerWs, player: player };
                }
            });
            
            if (!targetPlayer || allPlayers.length <= 1) {
                return `👥 沒有足夠玩家在線，無法執行捐贈精力。`;
            }
            
            const donationAmount = 2;
            const isSelfTarget = (targetPlayer.ws === ws);
            
            // 如果需要收集捐赠响应
            if (!donationResponses) {
                const playersToAsk = [];
                allPlayers.forEach(({ ws: playerWs, player: p }) => {
                    if (playerWs !== targetPlayer.ws) {
                        playersToAsk.push({
                            ws: playerWs,
                            playerName: p.playerName,
                            energy: p.gameState.energy,
                            maxEnergy: p.gameState.maxEnergy
                        });
                    }
                });
                
                return {
                    type: 'collect_energy_donations',
                    message: `👴 集體善事探望長者\n\n現金最少的玩家是：${targetPlayer.player.playerName}\n\n請每位玩家選擇是否捐贈 2 精力給 TA？\n\n捐贈精力的玩家將獲得幸運值 +1 獎勵！`,
                    donationAmount: donationAmount,
                    donationType: "energy",
                    targetPlayer: targetPlayer.player.playerName,
                    isSelfTarget: isSelfTarget,
                    playersToAsk: playersToAsk,
                    cardId: "V12",
                    cardName: "集體善事探望長者"
                };
            }
            
            // 处理捐赠响应
            let totalEnergyDonated = 0;
            let donors = [];
            
            for (const [playerName, willDonate] of Object.entries(donationResponses)) {
                if (willDonate) {
                    let donorPlayer = null;
                    for (let [pWs, p] of room.players) {
                        if (p.playerName === playerName) {
                            donorPlayer = p;
                            break;
                        }
                    }
                    
                    if (donorPlayer && donorPlayer.gameState.energy >= donationAmount) {
                        donorPlayer.gameState.energy -= donationAmount;
                        totalEnergyDonated += donationAmount;
                        donors.push(playerName);
                        
                        // 捐赠者获得幸运值奖励
                        donorPlayer.gameState.luck = Math.min(donorPlayer.gameState.maxLuck || 10, donorPlayer.gameState.luck + 1);
                        
                        addTransactionRecord(
                            playerName,
                            { name: "集體善事探望長者捐贈精力", type: "volunteer", id: "V12" },
                            "義工捐贈精力",
                            0,
                            `捐贈 ${donationAmount} 精力給 ${targetPlayer.player.playerName}（探望長者）`,
                            null,
                            donorPlayer.gameState
                        );
                        
                        // 通知捐赠者
                        broadcastToRoom(roomId, {
                            type: 'notification',
                            message: `✅ 你捐贈了 ${donationAmount} 精力給 ${targetPlayer.player.playerName}，幸運值 +1！`
                        }, null);
                    } else if (donorPlayer && donorPlayer.gameState.energy > 0) {
                        // 精力不足，捐出所有剩余精力
                        const actualDonation = donorPlayer.gameState.energy;
                        donorPlayer.gameState.energy = 0;
                        totalEnergyDonated += actualDonation;
                        donors.push(`${playerName}(${actualDonation})`);
                        
                        addTransactionRecord(
                            playerName,
                            { name: "集體善事探望長者捐贈精力", type: "volunteer", id: "V12" },
                            "義工捐贈精力",
                            0,
                            `盡力捐贈 ${actualDonation} 精力給 ${targetPlayer.player.playerName}（探望長者）`,
                            null,
                            donorPlayer.gameState
                        );
                    }
                }
            }
            
            if (donors.length === 0) {
                return `⚡ 沒有玩家願意捐贈精力。`;
            }
            
            // 捐赠精力给现金最少的玩家
            targetPlayer.player.gameState.energy += totalEnergyDonated;
            // 限制最大精力
            if (targetPlayer.player.gameState.energy > targetPlayer.player.gameState.maxEnergy) {
                targetPlayer.player.gameState.energy = targetPlayer.player.gameState.maxEnergy;
            }
            
            addTransactionRecord(
                targetPlayer.player.playerName,
                { name: "集體善事探望長者受助", type: "volunteer", id: "V12" },
                "接受義工捐贈精力",
                0,
                `收到 ${donors.join(', ')} 捐贈的精力共 ${totalEnergyDonated} 點（探望長者）`,
                null,
                targetPlayer.player.gameState
            );
            
            // 执行者获得义工次数
            currentPlayer.gameState.volunteerCount = (currentPlayer.gameState.volunteerCount || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            
            // 执行者精力消耗（组织活动）
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            
            // 执行者幸运值提升
            currentPlayer.gameState.luck = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 2);
            
            // 执行者额外精力（心灵满足）
            currentPlayer.gameState.energy = Math.min(currentPlayer.gameState.maxEnergy, currentPlayer.gameState.energy + 2);
            
            let targetMsg = targetPlayer.player.playerName;
            if (isSelfTarget) {
                targetMsg = `${targetPlayer.player.playerName} (自己)`;
            }
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `👴 ${currentPlayer.player.playerName} 發起「集體善事探望長者」活動！${donors.join(', ')} 合共捐贈 ${totalEnergyDonated} 精力給 ${targetMsg}！${currentPlayer.player.playerName} 獲得義工資格！`
            });
            
            let selfNote = isSelfTarget ? `\n📌 你是現金最少的玩家，收到了精力捐贈！` : '';
            
            return `👴 集體善事探望長者成功！\n` +
                   `⚡ ${donors.join(', ')} 合共捐贈 ${totalEnergyDonated} 精力給 ${targetMsg}\n` +
                   `⭐ 你獲得 1 次義工資格！精力 -1，幸運值 +2，額外精力 +2\n` +
                   `📝 目前義工次數: ${currentPlayer.gameState.volunteerShield}${selfNote}`;
        },
        getEffectDescription: () => "每個玩家可自願捐贈 2 精力予現金最少的玩家，執行者記一次義工，精力 -1，幸運值 +2，額外精力 +2"
    },
    {
        id: "V06",
        name: "集體執垃圾",
        description: "每個玩家自願捐出 2 精力予銀行，執行者記一次義工。",
        image: "../cards/volunteer/V06.png",
        cost: 0,
        type: "volunteer",
        category: "义工卡",
        requiresDonation: true,
        donationType: "energy",
        donationAmount: 2,
        targetIsBank: true,
        effect: (state, room, currentPlayer, ws, roomId, donationResponses) => {
            let otherPlayers = [];
            
            room.players.forEach((player, playerWs) => {
                if (playerWs !== ws) {
                    otherPlayers.push({ ws: playerWs, player: player });
                }
            });
            
            if (otherPlayers.length === 0) {
                return `👥 沒有其他玩家在線，無法執行捐贈精力。`;
            }
            
            const donationAmount = 2;
            
            // 如果需要收集捐赠响应
            if (!donationResponses) {
                const playersToAsk = otherPlayers.map(({ ws: pWs, player: p }) => ({
                    ws: pWs,
                    playerName: p.playerName,
                    energy: p.gameState.energy,
                    maxEnergy: p.gameState.maxEnergy
                }));
                
                return {
                    type: 'collect_energy_donations_bank',
                    message: `🗑️ 集體執垃圾\n\n請每位玩家選擇是否捐贈 ${donationAmount} 精力給銀行？\n\n捐贈精力的玩家將獲得幸運值 +1 獎勵！`,
                    donationAmount: donationAmount,
                    donationType: "energy",
                    playersToAsk: playersToAsk,
                    cardId: "V13",
                    cardName: "集體執垃圾"
                };
            }
            
            // 处理捐赠响应
            let totalEnergyDonated = 0;
            let donors = [];
            
            for (const [playerName, willDonate] of Object.entries(donationResponses)) {
                if (willDonate) {
                    let donorPlayer = null;
                    for (let [pWs, p] of room.players) {
                        if (p.playerName === playerName) {
                            donorPlayer = p;
                            break;
                        }
                    }
                    
                    if (donorPlayer && donorPlayer.gameState.energy >= donationAmount) {
                        donorPlayer.gameState.energy -= donationAmount;
                        totalEnergyDonated += donationAmount;
                        donors.push(playerName);
                        
                        // 捐赠者获得幸运值奖励
                        donorPlayer.gameState.luck = Math.min(donorPlayer.gameState.maxLuck || 10, donorPlayer.gameState.luck + 1);
                        
                        addTransactionRecord(
                            playerName,
                            { name: "集體執垃圾捐贈精力", type: "volunteer", id: "V13" },
                            "義工捐贈精力",
                            0,
                            `捐贈 ${donationAmount} 精力給銀行（集體執垃圾）`,
                            null,
                            donorPlayer.gameState
                        );
                        
                        // 通知捐赠者
                        broadcastToRoom(roomId, {
                            type: 'notification',
                            message: `✅ 你捐贈了 ${donationAmount} 精力給銀行，幸運值 +1！`
                        }, null);
                    } else if (donorPlayer && donorPlayer.gameState.energy > 0) {
                        // 精力不足，捐出所有剩余精力
                        const actualDonation = donorPlayer.gameState.energy;
                        donorPlayer.gameState.energy = 0;
                        totalEnergyDonated += actualDonation;
                        donors.push(`${playerName}(${actualDonation})`);
                        
                        addTransactionRecord(
                            playerName,
                            { name: "集體執垃圾捐贈精力", type: "volunteer", id: "V13" },
                            "義工捐贈精力",
                            0,
                            `盡力捐贈 ${actualDonation} 精力給銀行（集體執垃圾）`,
                            null,
                            donorPlayer.gameState
                        );
                    }
                }
            }
            
            if (donors.length === 0) {
                return `⚡ 沒有玩家願意捐贈精力。`;
            }
            
            // 执行者获得义工次数
            currentPlayer.gameState.volunteerCount = (currentPlayer.gameState.volunteerCount || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            
            // 执行者精力消耗（组织活动）
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            
            // 执行者幸运值提升
            currentPlayer.gameState.luck = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 2);
            
            // 执行者额外精力（环保意识提升，心灵满足）
            currentPlayer.gameState.energy = Math.min(currentPlayer.gameState.maxEnergy, currentPlayer.gameState.energy + 2);
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `🗑️ ${currentPlayer.player.playerName} 發起「集體執垃圾」環保活動！${donors.join(', ')} 合共捐贈 ${totalEnergyDonated} 精力給銀行！${currentPlayer.player.playerName} 獲得義工資格！`
            });
            
            return `🗑️ 集體執垃圾成功！\n` +
                   `⚡ ${donors.join(', ')} 合共捐贈 ${totalEnergyDonated} 精力給銀行\n` +
                   `⭐ 你獲得 1 次義工資格！精力 -1，幸運值 +2，額外精力 +2\n` +
                   `📝 目前義工次數: ${currentPlayer.gameState.volunteerShield}\n` +
                   `🌍 為環保出一分力，地球感謝你！`;
        },
        getEffectDescription: () => "每個玩家可自願捐贈 2 精力予銀行，執行者記一次義工，精力 -1，幸運值 +2，額外精力 +2"
    },
     {
        id: "V07",
        name: "情緒支援",
        description: "你選擇在其他玩家受損時，你用此卡抵銷。記一次義工。",
        image: "../cards/volunteer/V07.png",
        cost: 0,
        type: "volunteer",
        category: "义工卡",
        isShieldCard: true,
        shieldType: "emotional_support",
        effect: (state, room, currentPlayer, ws, roomId) => {
            // 这是一张被动使用的卡片，用于在其他玩家受损时抵销伤害
            // 当持有此卡时，玩家可以选择在别人受损时使用
            
            // 获得情绪支援护盾次数
            state.emotionalSupportShield = (state.emotionalSupportShield || 0) + 1;
            
            // 执行者获得义工次数
            state.volunteerCount = (state.volunteerCount || 0) + 1;
            state.volunteerShield = (state.volunteerShield || 0) + 1;
            
            // 精力消耗（提供情绪支持需要精力）
            state.energy = Math.max(0, state.energy - 1);
            
            // 幸运值提升（善有善报）
            state.luck = Math.min(state.maxLuck, state.luck + 2);
            
            // 额外精力（助人后的心灵满足）
            state.energy = Math.min(state.maxEnergy, state.energy + 2);
            
            // 记录交易
            addTransactionRecord(
                currentPlayer.playerName,
                { name: "情緒支援卡", type: "volunteer", id: "V14" },
                "獲得情緒支援卡",
                0,
                `獲得情緒支援護盾！可在其他玩家受損時提供支援，抵銷傷害。獲得 1 次義工資格！`,
                null,
                state
            );
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `💝 ${currentPlayer.playerName} 獲得了「情緒支援」卡！可在其他玩家受損時提供情緒支援，抵銷傷害！獲得義工資格！`
            });
            
            return `💝 獲得「情緒支援」卡成功！\n` +
                   `🛡️ 你獲得 1 次情緒支援護盾！可在其他玩家受損時使用\n` +
                   `⭐ 你獲得 1 次義工資格！精力 -1，幸運值 +2，額外精力 +2\n` +
                   `📝 目前義工次數: ${state.volunteerShield}\n` +
                   `💪 你的情緒支援將為他人帶來溫暖！`;
        },
        // 使用情绪支援卡抵销其他玩家的伤害
        useEmotionalSupport: (state, targetPlayer, damageAmount, damageDescription, room, ws, roomId) => {
            if (!state.emotionalSupportShield || state.emotionalSupportShield <= 0) {
                return { success: false, message: "沒有情緒支援護盾可用" };
            }
            
            // 使用一次护盾
            state.emotionalSupportShield--;
            
            // 记录使用
            addTransactionRecord(
                state.playerName,
                { name: "情緒支援卡使用", type: "volunteer", id: "V14" },
                "使用情緒支援",
                0,
                `使用情緒支援護盾，幫助 ${targetPlayer.playerName} 抵銷了「${damageDescription}」的傷害 ${damageAmount.toLocaleString()} 元`,
                null,
                state
            );
            
            // 执行者获得额外奖励（使用护盾时）
            state.luck = Math.min(state.maxLuck, state.luck + 1);
            state.energy = Math.min(state.maxEnergy, state.energy + 1);
            
            broadcastToRoom(roomId, {
                type: 'notification',
                message: `💝 ${state.playerName} 使用了「情緒支援」卡，幫助 ${targetPlayer.playerName} 抵銷了傷害！獲得幸運值 +1，精力 +1！`
            });
            
            return { 
                success: true, 
                message: `💝 ${state.playerName} 提供了情緒支援，幫助你抵銷了傷害！`,
                remainingShield: state.emotionalSupportShield
            };
        },
        getEffectDescription: () => "獲得情緒支援護盾，可在其他玩家受損時抵銷傷害。記一次義工，精力 -1，幸運值 +2，額外精力 +2"
    },
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { volunteerCards };
}