const volunteerCards = [
    {
        id: "V01",
        name: "協助基層人士",
        description: "你自願給 $5,000 予現金最少的玩家(不能是你)，執行者記一次義工。",
        image: "../cards/volunteer/V01.png",
        cost: 0,
        type: "volunteer",
        category: "義工卡",
        requiresDonation: true,
        donationAmount: 5000,
        effect: (state, room, currentPlayer, ws, roomId) => {
            // Find poorest player (not self)
            let targetPlayer = null;
            let minCash = Infinity;

            room.players.forEach((player, playerWs) => {
                if (playerWs !== ws && player.gameState.cash < minCash) {
                    minCash = player.gameState.cash;
                    targetPlayer = player;
                }
            });

            if (!targetPlayer) {
                return `👥 沒有其他玩家在線，無法執行捐款`;
            }

            const donation = 5000;
            if (currentPlayer.gameState.cash < donation) {
                return `❌ 現金不足 $${donation.toLocaleString()}，無法捐款`;
            }

            // Execute directly (single player donation, no need to ask others)
            currentPlayer.gameState.cash -= donation;
            targetPlayer.gameState.cash  += donation;

            currentPlayer.gameState.volunteerCount  = (currentPlayer.gameState.volunteerCount  || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            currentPlayer.gameState.luck   = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 2);

            return `🤝 協助基層人士成功！捐款 $${donation.toLocaleString()} 給 ${targetPlayer.playerName}。獲得義工資格！精力 -1，幸運值 +2`;
        },
        getEffectDescription: () => "捐款 $5,000 予現金最少的玩家，記一次義工"
    },

    {
        id: "V02",
        name: "幫助傷健人士",
        description: "每個玩家自願捐出 $2,000 予現金最少的玩家，執行者記一次義工。",
        image: "../cards/volunteer/V02.png",
        cost: 0,
        type: "volunteer",
        category: "義工卡",
        requiresDonation: true,
        donationAmount: 2000,
        donationTarget: "poorest",   // donate to poorest player
        effect: (state, room, currentPlayer, ws, roomId, donationResponses) => {
            // Find poorest player
            let targetPlayer = null;
            let minCash = Infinity;

            room.players.forEach((player) => {
                if (player.gameState.cash < minCash) {
                    minCash = player.gameState.cash;
                    targetPlayer = player;
                }
            });

            if (!targetPlayer || room.players.size <= 1) {
                return `👥 沒有足夠玩家，無法執行捐款`;
            }

            const donation = 2000;
            const isSelfTarget = targetPlayer.playerId === currentPlayer.playerId;

            // First call - return request to collect donations
            if (!donationResponses) {
                const playersToAsk = [];
                room.players.forEach((player, playerWs) => {
                    if (player.playerId !== targetPlayer.playerId) {
                        playersToAsk.push({
                            playerName: player.playerName,
                            cash: player.gameState.cash
                        });
                    }
                });

                return {
                    type: 'collect_donations',
                    donationAmount: donation,
                    targetPlayer: targetPlayer.playerName,
                    isSelfTarget,
                    playersToAsk,
                    cardId: "V02",
                    cardName: "幫助傷健人士"
                };
            }

            // Second call - process responses
            let totalDonation = 0;
            let donors = [];

            for (const [playerName, willDonate] of Object.entries(donationResponses)) {
                if (!willDonate) continue;

                let donorPlayer = null;
                for (const [, p] of room.players) {
                    if (p.playerName === playerName) {
                        donorPlayer = p;
                        break;
                    }
                }

                if (donorPlayer && donorPlayer.gameState.cash >= donation) {
                    donorPlayer.gameState.cash -= donation;
                    totalDonation += donation;
                    donors.push(playerName);
                    donorPlayer.gameState.luck = Math.min(donorPlayer.gameState.maxLuck || 10, donorPlayer.gameState.luck + 1);
                } else if (donorPlayer && donorPlayer.gameState.cash > 0) {
                    const actual = donorPlayer.gameState.cash;
                    donorPlayer.gameState.cash = 0;
                    totalDonation += actual;
                    donors.push(`${playerName}($${actual.toLocaleString()})`);
                }
            }

            if (donors.length === 0) {
                return `💰 沒有玩家願意捐款`;
            }

            targetPlayer.gameState.cash += totalDonation;

            currentPlayer.gameState.volunteerCount  = (currentPlayer.gameState.volunteerCount  || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            currentPlayer.gameState.luck   = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 2);
            currentPlayer.gameState.energy = Math.min(currentPlayer.gameState.maxEnergy, currentPlayer.gameState.energy + 2);

            const targetMsg = isSelfTarget ? `${targetPlayer.playerName} (自己)` : targetPlayer.playerName;

            return `🤝 幫助傷健人士成功！\n${donors.join(', ')} 捐款共 $${totalDonation.toLocaleString()} 給 ${targetMsg}。\n獲得義工資格！精力 -1+2，幸運值 +2`;
        },
        getEffectDescription: () => "每位玩家可自願捐 $2,000 予現金最少的玩家，記一次義工"
    },

    {
        id: "V03",
        name: "拯救他國饑民",
        description: "每個玩家自願捐出 $3,000 予銀行，執行者記一次義工。",
        image: "../cards/volunteer/V03.png",
        cost: 0,
        type: "volunteer",
        category: "義工卡",
        requiresDonation: true,
        donationAmount: 3000,
        donationTarget: "bank",     // donate to bank
        effect: (state, room, currentPlayer, ws, roomId, donationResponses) => {
            const donation = 3000;

            if (!donationResponses) {
                const playersToAsk = [];
                room.players.forEach((player, playerWs) => {
                    if (playerWs !== ws) {
                        playersToAsk.push({
                            playerName: player.playerName,
                            cash: player.gameState.cash
                        });
                    }
                });

                return {
                    type: 'collect_donations',
                    donationAmount: donation,
                    targetPlayer: '銀行',
                    isSelfTarget: false,
                    playersToAsk,
                    cardId: "V03",
                    cardName: "拯救他國饑民"
                };
            }

            let totalDonation = 0;
            let donors = [];

            for (const [playerName, willDonate] of Object.entries(donationResponses)) {
                if (!willDonate) continue;

                let donorPlayer = null;
                for (const [, p] of room.players) {
                    if (p.playerName === playerName) {
                        donorPlayer = p;
                        break;
                    }
                }

                if (donorPlayer && donorPlayer.gameState.cash >= donation) {
                    donorPlayer.gameState.cash -= donation;
                    totalDonation += donation;
                    donors.push(playerName);
                    donorPlayer.gameState.luck = Math.min(donorPlayer.gameState.maxLuck || 10, donorPlayer.gameState.luck + 1);
                } else if (donorPlayer && donorPlayer.gameState.cash > 0) {
                    const actual = donorPlayer.gameState.cash;
                    donorPlayer.gameState.cash = 0;
                    totalDonation += actual;
                    donors.push(`${playerName}($${actual.toLocaleString()})`);
                }
            }

            if (donors.length === 0) {
                return `💰 沒有玩家願意捐款`;
            }

            currentPlayer.gameState.volunteerCount  = (currentPlayer.gameState.volunteerCount  || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            currentPlayer.gameState.luck   = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 3);

            return `🌍 拯救他國饑民成功！\n${donors.join(', ')} 捐款共 $${totalDonation.toLocaleString()} 給銀行。\n獲得義工資格！精力 -1，幸運值 +3`;
        },
        getEffectDescription: () => "每位玩家可捐 $3,000 予銀行，記一次義工"
    },

    {
        id: "V04",
        name: "義工探望兒童病房",
        description: "每個玩家自願捐出 $2,000 予現金最少的玩家，執行者記一次義工。",
        image: "../cards/volunteer/V04.png",
        cost: 0,
        type: "volunteer",
        category: "義工卡",
        requiresDonation: true,
        donationAmount: 2000,
        donationTarget: "poorest",
        effect: (state, room, currentPlayer, ws, roomId, donationResponses) => {
            let targetPlayer = null;
            let minCash = Infinity;

            room.players.forEach((player) => {
                if (player.gameState.cash < minCash) {
                    minCash = player.gameState.cash;
                    targetPlayer = player;
                }
            });

            if (!targetPlayer || room.players.size <= 1) {
                return `👥 沒有足夠玩家，無法執行捐款`;
            }

            const donation = 2000;
            const isSelfTarget = targetPlayer.playerId === currentPlayer.playerId;

            if (!donationResponses) {
                const playersToAsk = [];
                room.players.forEach((player) => {
                    if (player.playerId !== targetPlayer.playerId) {
                        playersToAsk.push({
                            playerName: player.playerName,
                            cash: player.gameState.cash
                        });
                    }
                });

                return {
                    type: 'collect_donations',
                    donationAmount: donation,
                    targetPlayer: targetPlayer.playerName,
                    isSelfTarget,
                    playersToAsk,
                    cardId: "V04",
                    cardName: "義工探望兒童病房"
                };
            }

            let totalDonation = 0;
            let donors = [];

            for (const [playerName, willDonate] of Object.entries(donationResponses)) {
                if (!willDonate) continue;

                let donorPlayer = null;
                for (const [, p] of room.players) {
                    if (p.playerName === playerName) {
                        donorPlayer = p;
                        break;
                    }
                }

                if (donorPlayer && donorPlayer.gameState.cash >= donation) {
                    donorPlayer.gameState.cash -= donation;
                    totalDonation += donation;
                    donors.push(playerName);
                    donorPlayer.gameState.luck = Math.min(donorPlayer.gameState.maxLuck || 10, donorPlayer.gameState.luck + 1);
                } else if (donorPlayer && donorPlayer.gameState.cash > 0) {
                    const actual = donorPlayer.gameState.cash;
                    donorPlayer.gameState.cash = 0;
                    totalDonation += actual;
                    donors.push(`${playerName}($${actual.toLocaleString()})`);
                }
            }

            if (donors.length === 0) {
                return `💰 沒有玩家願意捐款`;
            }

            targetPlayer.gameState.cash += totalDonation;

            currentPlayer.gameState.volunteerCount  = (currentPlayer.gameState.volunteerCount  || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            currentPlayer.gameState.luck   = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 2);
            currentPlayer.gameState.energy = Math.min(currentPlayer.gameState.maxEnergy, currentPlayer.gameState.energy + 2);

            const targetMsg = isSelfTarget ? `${targetPlayer.playerName} (自己)` : targetPlayer.playerName;

            return `🏥 義工探望兒童病房成功！\n${donors.join(', ')} 捐款共 $${totalDonation.toLocaleString()} 給 ${targetMsg}。\n獲得義工資格！精力 -1+2，幸運值 +2`;
        },
        getEffectDescription: () => "每位玩家可捐 $2,000 予現金最少的玩家，記一次義工"
    },

    {
        id: "V05",
        name: "集體善事探望長者",
        description: "每個玩家自願捐出 2 精力予現金最少的玩家，執行者記一次義工。",
        image: "../cards/volunteer/V05.png",
        cost: 0,
        type: "volunteer",
        category: "義工卡",
        requiresDonation: true,
        donationType: "energy",
        donationAmount: 2,
        donationTarget: "poorest",
        effect: (state, room, currentPlayer, ws, roomId, donationResponses) => {
            let targetPlayer = null;
            let minCash = Infinity;

            room.players.forEach((player) => {
                if (player.gameState.cash < minCash) {
                    minCash = player.gameState.cash;
                    targetPlayer = player;
                }
            });

            if (!targetPlayer || room.players.size <= 1) {
                return `👥 沒有足夠玩家，無法執行捐贈精力`;
            }

            const energyDonation = 2;
            const isSelfTarget = targetPlayer.playerId === currentPlayer.playerId;

            if (!donationResponses) {
                const playersToAsk = [];
                room.players.forEach((player) => {
                    if (player.playerId !== targetPlayer.playerId) {
                        playersToAsk.push({
                            playerName: player.playerName,
                            energy: player.gameState.energy,
                            maxEnergy: player.gameState.maxEnergy
                        });
                    }
                });

                return {
                    type: 'collect_donations',
                    donationAmount: energyDonation,
                    donationType: 'energy',
                    targetPlayer: targetPlayer.playerName,
                    isSelfTarget,
                    playersToAsk,
                    cardId: "V05",
                    cardName: "集體善事探望長者"
                };
            }

            let totalEnergy = 0;
            let donors = [];

            for (const [playerName, willDonate] of Object.entries(donationResponses)) {
                if (!willDonate) continue;

                let donorPlayer = null;
                for (const [, p] of room.players) {
                    if (p.playerName === playerName) {
                        donorPlayer = p;
                        break;
                    }
                }

                if (donorPlayer && donorPlayer.gameState.energy >= energyDonation) {
                    donorPlayer.gameState.energy -= energyDonation;
                    totalEnergy += energyDonation;
                    donors.push(playerName);
                    donorPlayer.gameState.luck = Math.min(donorPlayer.gameState.maxLuck || 10, donorPlayer.gameState.luck + 1);
                } else if (donorPlayer && donorPlayer.gameState.energy > 0) {
                    const actual = donorPlayer.gameState.energy;
                    donorPlayer.gameState.energy = 0;
                    totalEnergy += actual;
                    donors.push(`${playerName}(${actual})`);
                }
            }

            if (donors.length === 0) {
                return `⚡ 沒有玩家願意捐贈精力`;
            }

            targetPlayer.gameState.energy = Math.min(
                targetPlayer.gameState.maxEnergy,
                targetPlayer.gameState.energy + totalEnergy
            );

            currentPlayer.gameState.volunteerCount  = (currentPlayer.gameState.volunteerCount  || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            currentPlayer.gameState.luck   = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 2);
            currentPlayer.gameState.energy = Math.min(currentPlayer.gameState.maxEnergy, currentPlayer.gameState.energy + 2);

            const targetMsg = isSelfTarget ? `${targetPlayer.playerName} (自己)` : targetPlayer.playerName;

            return `👴 集體善事探望長者成功！\n${donors.join(', ')} 捐贈共 ${totalEnergy} 精力給 ${targetMsg}。\n獲得義工資格！精力 -1+2，幸運值 +2`;
        },
        getEffectDescription: () => "每位玩家可捐 2 精力予現金最少的玩家，記一次義工"
    },

    {
        id: "V06",
        name: "集體執垃圾",
        description: "每個玩家自願捐出 2 精力予銀行，執行者記一次義工。",
        image: "../cards/volunteer/V06.png",
        cost: 0,
        type: "volunteer",
        category: "義工卡",
        requiresDonation: true,
        donationType: "energy",
        donationAmount: 2,
        donationTarget: "bank",
        effect: (state, room, currentPlayer, ws, roomId, donationResponses) => {
            const energyDonation = 2;

            if (!donationResponses) {
                const playersToAsk = [];
                room.players.forEach((player, playerWs) => {
                    if (playerWs !== ws) {
                        playersToAsk.push({
                            playerName: player.playerName,
                            energy: player.gameState.energy,
                            maxEnergy: player.gameState.maxEnergy
                        });
                    }
                });

                return {
                    type: 'collect_donations',
                    donationAmount: energyDonation,
                    donationType: 'energy',
                    targetPlayer: '銀行',
                    isSelfTarget: false,
                    playersToAsk,
                    cardId: "V06",
                    cardName: "集體執垃圾"
                };
            }

            let totalEnergy = 0;
            let donors = [];

            for (const [playerName, willDonate] of Object.entries(donationResponses)) {
                if (!willDonate) continue;

                let donorPlayer = null;
                for (const [, p] of room.players) {
                    if (p.playerName === playerName) {
                        donorPlayer = p;
                        break;
                    }
                }

                if (donorPlayer && donorPlayer.gameState.energy >= energyDonation) {
                    donorPlayer.gameState.energy -= energyDonation;
                    totalEnergy += energyDonation;
                    donors.push(playerName);
                    donorPlayer.gameState.luck = Math.min(donorPlayer.gameState.maxLuck || 10, donorPlayer.gameState.luck + 1);
                } else if (donorPlayer && donorPlayer.gameState.energy > 0) {
                    const actual = donorPlayer.gameState.energy;
                    donorPlayer.gameState.energy = 0;
                    totalEnergy += actual;
                    donors.push(`${playerName}(${actual})`);
                }
            }

            if (donors.length === 0) {
                return `⚡ 沒有玩家願意捐贈精力`;
            }

            currentPlayer.gameState.volunteerCount  = (currentPlayer.gameState.volunteerCount  || 0) + 1;
            currentPlayer.gameState.volunteerShield = (currentPlayer.gameState.volunteerShield || 0) + 1;
            currentPlayer.gameState.energy = Math.max(0, currentPlayer.gameState.energy - 1);
            currentPlayer.gameState.luck   = Math.min(currentPlayer.gameState.maxLuck || 10, currentPlayer.gameState.luck + 2);
            currentPlayer.gameState.energy = Math.min(currentPlayer.gameState.maxEnergy, currentPlayer.gameState.energy + 2);

            return `🗑️ 集體執垃圾成功！\n${donors.join(', ')} 捐贈共 ${totalEnergy} 精力給銀行。\n獲得義工資格！精力 -1+2，幸運值 +2`;
        },
        getEffectDescription: () => "每位玩家可捐 2 精力予銀行，記一次義工"
    },

    {
        id: "V07",
        name: "情緒支援",
        description: "你獲得情緒支援護盾，可在其他玩家受損時抵銷傷害。記一次義工。",
        image: "../cards/volunteer/V07.png",
        cost: 0,
        type: "volunteer",
        category: "義工卡",
        effect: (state) => {
            state.emotionalSupportShield = (state.emotionalSupportShield || 0) + 1;
            state.volunteerCount  = (state.volunteerCount  || 0) + 1;
            state.volunteerShield = (state.volunteerShield || 0) + 1;
            state.energy = Math.max(0, state.energy - 1);
            state.luck   = Math.min(state.maxLuck || 10, state.luck + 2);
            state.energy = Math.min(state.maxEnergy, state.energy + 2);

            return `💝 獲得情緒支援護盾！可在其他玩家受損時抵銷傷害。\n獲得義工資格！精力 -1+2，幸運值 +2\n📝 目前義工次數: ${state.volunteerShield}`;
        },
        getEffectDescription: () => "獲得情緒支援護盾，記一次義工"
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { volunteerCards };
}