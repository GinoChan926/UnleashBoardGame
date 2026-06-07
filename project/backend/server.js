const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ==================== 职业定义 ====================
const PROFESSIONS = {
    doctor: { name: "👨‍⚕️ 医生", salary: 15000, sideIncome: 0, cash: 20000, energy: 2, maxEnergy: 100, livingExpense: 8000, tax: 1500, luck: 5.0 },
    engineer: { name: "👨‍🔧 工程师", salary: 12000, sideIncome: 0, cash: 15000, energy: 3, maxEnergy: 100, livingExpense: 6000, tax: 1200, luck: 5.5 },
    teacher: { name: "👩‍🏫 教师", salary: 8000, sideIncome: 0, cash: 10000, energy: 5, maxEnergy: 100, livingExpense: 4500, tax: 800, luck: 6.0 },
    artist: { name: "🎨 艺术家", salary: 6000, sideIncome: 1000, cash: 8000, energy: 6, maxEnergy: 100, livingExpense: 4000, tax: 600, luck: 7.0 },
    entrepreneur: { name: "🚀 创业者", salary: 10000, sideIncome: 2000, cash: 12000, energy: 4, maxEnergy: 100, livingExpense: 7000, tax: 1300, luck: 5.8 }
};

// 加载机会卡数据
let partTimeCards = [], financeCards = [], businessCards = [], propertyCards = [];

try {
    const cardsData = require('./chance_cards.js');
    partTimeCards = cardsData.partTimeCards;
    financeCards = cardsData.financeCards;
    businessCards = cardsData.businessCards;
    propertyCards = cardsData.propertyCards;
    console.log(`📚 加载机会卡: 兼职${partTimeCards.length}张, 财务${financeCards.length}张, 创业${businessCards.length}张, 地产${propertyCards.length}张`);
} catch (e) {
    console.log('⚠️ 无法加载 chance_cards.js，使用默认卡片');
    partTimeCards = [];
    financeCards = [];
    businessCards = [];
    propertyCards = [];
}

// 卡片类型定义
const CARD_TYPES = {
    PART_TIME: { id: 'part_time', name: '兼职类', icon: '💼', color: '#4caf50', cards: partTimeCards },
    FINANCE: { id: 'finance', name: '财务类', icon: '📈', color: '#2196f3', cards: financeCards },
    BUSINESS: { id: 'business', name: '创业类', icon: '🚀', color: '#ff9800', cards: businessCards },
    PROPERTY: { id: 'property', name: '地产类', icon: '🏠', color: '#9c27b0', cards: propertyCards }
};

// 项目路径
const projectRoot = path.join(__dirname, '..');  // C:\CUHK\Summer_Intern\project
const frontendPath = path.join(projectRoot, 'frontend');
const cardsPath = path.join(projectRoot, 'cards');  // C:\CUHK\Summer_Intern\project\cards

// 解码 URL 编码的文件名
function decodeUrl(str) {
    try {
        return decodeURIComponent(str);
    } catch (e) {
        return str;
    }
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    let originalUrl = req.url;
    let filePath = decodeUrl(originalUrl);
    
    // 默认首页
    if (filePath === '/' || filePath === '/index.html') {
        filePath = '/frontend/index.html';
    }
    
       // ========== 处理卡片图片路径 ==========
    let imagePath = null;
    
    // 处理 ../cards/cover/part_time.png 或 /cards/cover/part_time.png
    if (filePath.includes('cards/cover/') || filePath.includes('../cards/cover/')) {
        // 提取文件名
        let fileName = path.basename(filePath);
        console.log(`🖼️ 请求卡片封面图片: ${fileName} (原始路径: ${originalUrl})`);
        
        // 构建正确的图片路径 - 直接指向 project/cards/cover/
        let coverImagePath = path.join(projectRoot, 'cards', 'cover', fileName);
        
        if (fs.existsSync(coverImagePath)) {
            imagePath = coverImagePath;
            console.log(`   ✅ 找到图片: ${coverImagePath}`);
        } else {
            console.log(`   ❌ 图片不存在: ${coverImagePath}`);
            // 尝试其他可能的位置
            let altPath = path.join(projectRoot, 'frontend', 'cards', 'cover', fileName);
            if (fs.existsSync(altPath)) {
                imagePath = altPath;
                console.log(`   ✅ 在备用位置找到: ${altPath}`);
            }
        }
        
        if (imagePath) {
            const ext = path.extname(imagePath).toLowerCase();
            const contentType = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif'
            }[ext] || 'image/png';
            
            fs.readFile(imagePath, (err, data) => {
                if (err) {
                    console.log(`❌ 读取图片失败: ${imagePath}`);
                    res.writeHead(404);
                    res.end();
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(data);
                }
            });
            return;
        }
    }
    
    // 处理一般的卡片图片路径 /cards/part_time/xxx.png 或 ../cards/part_time/xxx.png
    if (filePath.includes('/cards/') || filePath.includes('../cards/')) {
        // 提取相对路径
        let relativePath = filePath;
        relativePath = relativePath.replace(/\.\.\//g, '');
        if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
        
        // 构建完整的图片路径
        imagePath = path.join(projectRoot, relativePath);
        
        if (fs.existsSync(imagePath)) {
            const ext = path.extname(imagePath).toLowerCase();
            const contentType = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif'
            }[ext] || 'image/png';
            
            fs.readFile(imagePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end();
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(data);
                }
            });
            return;
        }
    }
    
    // 构建完整文件路径
    let fullPath = path.join(projectRoot, filePath);
    
    // 获取文件扩展名和 MIME 类型
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'text/plain';
    
    if (ext === '.html') contentType = 'text/html';
    else if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.ico') contentType = 'image/x-icon';
    else if (ext === '.json') contentType = 'application/json';
    
    // 检查文件是否存在
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            // 尝试在 frontend 文件夹下查找
            let altPath = path.join(frontendPath, path.basename(filePath));
            
            // 特别处理音乐文件
            if (filePath.includes('mp3') || filePath.includes('MP3')) {
                fs.readdir(frontendPath, (err, files) => {
                    if (!err) {
                        const mp3Files = files.filter(f => f.endsWith('.mp3') || f.endsWith('.MP3'));
                        if (mp3Files.length > 0) {
                            altPath = path.join(frontendPath, mp3Files[0]);
                            console.log(`🎵 找到音乐文件: ${mp3Files[0]}`);
                            serveFile(altPath, contentType);
                            return;
                        }
                    }
                    console.log(`❌ 文件不存在: ${fullPath}`);
                    res.writeHead(404);
                    res.end('Not Found');
                });
                return;
            }
            
            fs.access(altPath, fs.constants.F_OK, (err2) => {
                if (!err2) {
                    serveFile(altPath, contentType);
                } else {
                    if (!filePath.includes('favicon.ico')) {
                        console.log(`❌ 文件不存在: ${fullPath}`);
                    }
                    res.writeHead(404);
                    res.end('Not Found');
                }
            });
        } else {
            serveFile(fullPath, contentType);
        }
    });
    
    function serveFile(filePathToServe, contentType) {
        fs.readFile(filePathToServe, (err, data) => {
            if (err) {
                console.log(`❌ 读取文件失败: ${filePathToServe}`);
                res.writeHead(500);
                res.end('Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
    }
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 存储所有房间
const rooms = new Map();

// 平流层棋盘数据
const streamlineTiles = [
    { name: "起點", type: "start" },
    { name: "機會卡", type: "opportunity" },
    { name: "升職加薪", type: "income" },
    { name: "機會卡", type: "opportunity" },
    { name: "結算日", type: "settlement" },
    { name: "機會卡", type: "opportunity" },
    { name: "孩子出生", type: "event" },
    { name: "機會卡", type: "opportunity" },
    { name: "副業發展", type: "income" },
    { name: "機會卡", type: "opportunity" },
    { name: "結算日", type: "settlement" },
    { name: "機會卡", type: "opportunity" },
    { name: "恩典時刻", type: "grace" },
    { name: "慈善捐款", type: "event" },
    { name: "保險規劃", type: "event" },
    { name: "機會卡", type: "opportunity" },
    { name: "教育投資", type: "event" },
    { name: "機會卡", type: "opportunity" },
    { name: "市場轉機", type: "market" },
    { name: "機會卡", type: "opportunity" },
    { name: "結算日", type: "settlement" },
    { name: "機會卡", type: "opportunity" },
    { name: "職業轉換", type: "event" },
    { name: "機會卡", type: "opportunity" }
];

const reverseTiles = [
    { name: "奇蹟", type: "miracle" },
    { name: "逆境自強", type: "hardship" },
    { name: "覺察卡", type: "awareness" },
    { name: "失業危機", type: "unemployment" },
    { name: "逆境自強", type: "hardship" },
    { name: "破產重組", type: "bankruptcy" },
    { name: "浴火重生", type: "recovery" },
    { name: "逆境自強", type: "hardship" },
    { name: "覺察卡", type: "awareness" }
];

const flowTiles = [
    { name: "查稅審計", type: "audit" },
    { name: "古董投資", type: "investment" },
    { name: "藝術基金", type: "investment" },
    { name: "度假莊園", type: "investment" },
    { name: "私人飛機", type: "dream", needEnergy: 40 },
    { name: "破產陷阱", type: "flowbankruptcy" },
    { name: "環球旅遊", type: "dream", needEnergy: 45 },
    { name: "慈善基金會", type: "investment" },
    { name: "隱形俱樂部", type: "investment" },
    { name: "智庫董事", type: "investment" },
    { name: "終極夢想", type: "dream", needEnergy: 50 },
    { name: "財務自由", type: "dream", needEnergy: 35 },
    { name: "豪華別墅", type: "dream", needEnergy: 45 },
    { name: "私人遊艇", type: "investment" },
    { name: "頂級收藏", type: "investment" },
    { name: "高級俱樂部", type: "investment" },
    { name: "家族基金", type: "investment" },
    { name: "國際投資", type: "investment" },
    { name: "房地產帝國", type: "investment" },
    { name: "能源項目", type: "investment" },
    { name: "科技股票", type: "investment" },
    { name: "貴金屬投資", type: "investment" },
    { name: "珍稀物業", type: "investment" },
    { name: "商業帝國", type: "investment" },
    { name: "董事會席位", type: "investment" },
    { name: "慈善榮譽", type: "grace" },
    { name: "年度評選", type: "event" },
    { name: "財富峰會", type: "event" },
    { name: "投資分紅", type: "income" },
    { name: "版稅收入", type: "income" },
    { name: "顧問費用", type: "income" },
    { name: "終極成就", type: "dream", needEnergy: 60 }
];

// ==================== 辅助函数 ====================

function broadcastToRoom(roomId, message, excludeWs = null) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    room.players.forEach((player, ws) => {
        if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    });
}

function getCardEffectPreview(card, state) {
    const tempState = JSON.parse(JSON.stringify(state));
    const effectResult = card.effect(tempState);
    
    const changes = {
        cashChange: tempState.cash - state.cash,
        sideIncomeBonus: tempState.sideIncomeBonus !== state.sideIncomeBonus,
        passiveIncomeChange: tempState.passiveIncome - state.passiveIncome,
        salaryChange: tempState.salary - state.salary,
        energyChange: tempState.energy - state.energy,
        luckChange: tempState.luck - state.luck,
        loanChange: tempState.loanAmount - state.loanAmount,
        livingExpenseChange: tempState.livingExpense - state.livingExpense,
        childExpenseChange: tempState.childExpense - state.childExpense,
        hasDesignSkill: tempState.hasDesignSkill !== state.hasDesignSkill,
        hasFinanceSkill: tempState.hasFinanceSkill !== state.hasFinanceSkill,
        hasMarketingSkill: tempState.hasMarketingSkill !== state.hasMarketingSkill,
        hasHostSkill: tempState.hasHostSkill !== state.hasHostSkill,
        businessCostDiscount: tempState.businessCostDiscount
    };
    
    const investmentCost = card.investmentCost || 0;
    const canAfford = investmentCost === 0 || state.cash >= investmentCost;
    
    return {
        description: effectResult,
        changes: changes,
        canAfford: canAfford,
        investmentCost: investmentCost
    };
}

function getOrCreateRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            players: new Map(),
            pendingEvents: new Map(),
            pendingTypeSelections: new Map(),
            currentRoomId: roomId,
            streamlineTiles,
            reverseTiles,
            flowTiles
        });
        console.log(`📦 创建房间: ${roomId}`);
    }
    return rooms.get(roomId);
}

// ==================== 格子事件处理 ====================

function processStreamlineTile(state, tile, ws, roomId, player, isExactLanding = false) {
    switch(tile.type) {
        case 'income':
            if (tile.name === '升職加薪') {
                state.salary += 2000;
                return `💼 升职加薪！月薪增加 2000 元`;
            } else if (tile.name === '副業發展') {
                let baseIncome = 1000;
                let finalIncome = baseIncome;
                if (state.sideIncomeBonus && state.sideIncomeBonus > 0) {
                    finalIncome = Math.floor(baseIncome * (1 + state.sideIncomeBonus));
                }
                state.sideIncome += finalIncome;
                return `💪 副业发展！每月副业收入增加 ${finalIncome} 元${finalIncome !== baseIncome ? ` (含${Math.round(state.sideIncomeBonus * 100)}%人脈加成)` : ''}`;
            } else if (tile.name === '創業啟動') {
                let baseIncome = 1500;
                let finalIncome = baseIncome;
                if (state.sideIncomeBonus && state.sideIncomeBonus > 0) {
                    finalIncome = Math.floor(baseIncome * (1 + state.sideIncomeBonus));
                }
                state.sideIncome += finalIncome;
                return `🚀 创业启动！副业收入增加 ${finalIncome} 元${finalIncome !== baseIncome ? ` (含${Math.round(state.sideIncomeBonus * 100)}%人脈加成)` : ''}`;
            }
            break;
            
        case 'settlement':
            const totalIncome = state.salary + state.sideIncome;
            state.cash += totalIncome;
            state.totalAssets += Math.floor(totalIncome * 0.2);
            
            const settlementMsg = {
                type: 'settlement',
                playerId: player.playerId,
                playerName: player.playerName,
                salary: state.salary,
                sideIncome: state.sideIncome,
                totalIncome: totalIncome,
                isExactLanding: isExactLanding,
                gameState: state
            };
            ws.send(JSON.stringify(settlementMsg));
            broadcastToRoom(roomId, settlementMsg, ws);
            
            if (isExactLanding) {
                return `💰 结算日！正好踩中！获得 ${totalIncome.toLocaleString()} 元现金流 (薪水 + 副业收入)，并额外获得一次掷骰机会！`;
            }
            return `💰 结算日！经过结算日，获得 ${totalIncome.toLocaleString()} 元现金流 (薪水 + 副业收入)`;
            
        case 'grace':
            state.cash += 500;
            state.energy = Math.min(state.maxEnergy, state.energy + 3);
            state.luck = Math.min(state.maxLuck, state.luck + 2);
            return `✨ 恩典时刻！获得 500 元，精力 +3，幸运值 +2`;
            
        case 'event':
            if (tile.name === '孩子出生') {
                state.childCount++;
                state.childExpense += 800;
                return `👶 孩子出生！孩子支出增加 800 元`;
            } else if (tile.name === '慈善捐款') {
                const donation = 1000;
                if (state.cash >= donation) {
                    state.cash -= donation;
                    state.luck = Math.min(state.maxLuck, state.luck + 2);
                    return `🙏 慈善捐款 ${donation} 元，幸运值 +2`;
                }
                return `🙏 慈善捐款 ${donation} 元，现金不足，无法捐款`;
            } else if (tile.name === '保險規劃') {
                state.cash -= 2000;
                state.luck = Math.min(state.maxLuck, state.luck + 1);
                return `🛡️ 保险规划，花费 2000 元，幸运值 +1`;
            } else if (tile.name === '教育投資') {
                state.cash -= 5000;
                state.salary += 1000;
                return `📖 教育投资 5000 元，月薪增加 1000 元`;
            } else if (tile.name === '職業轉換') {
                state.salary += 2000;
                state.energy = Math.max(0, state.energy - 1);
                return `💼 职业转换，月薪增加 2000 元，精力消耗 1 点`;
            }
            break;
            
        case 'market':
            if (tile.name === '市場轉機') {
                const bonus = 2000;
                state.cash += bonus;
                state.luck = Math.min(state.maxLuck, state.luck + 1);
                return `🔄 市场转机！获得 ${bonus} 元，幸运值 +1`;
            }
            break;
            
        case 'opportunity':
            showCardTypeSelection(ws, state, roomId, player);
            return null;
    }
    return null;
}

function processReverseTile(state, tile) {
    switch(tile.type) {
        case 'hardship':
            const r = Math.floor(Math.random() * 3);
            let msg = '';
            if (r === 0) {
                state.salary = Math.max(0, state.salary - 1000);
                msg = '😔 逆境自强：月薪减少 1000 元';
            } else if (r === 1) {
                state.energy = Math.max(0, state.energy - 3);
                msg = '😫 逆境自强：精力消耗 3 点';
            } else {
                state.sideIncome = Math.max(0, state.sideIncome - 500);
                msg = '😥 逆境自强：副业收入减少 500 元';
            }
            state.luck = Math.max(0, state.luck - 1);
            msg += `，幸运值 -1`;
            return msg;
            
        case 'recovery':
            state.cash += 3000;
            state.energy = Math.min(state.maxEnergy, state.energy + 5);
            state.sideIncome += 500;
            state.luck = Math.min(state.maxLuck, state.luck + 3);
            const totalExp = state.livingExpense + state.tax + state.loanInterest + state.childExpense;
            const cf = (state.salary + state.sideIncome + state.passiveIncome) - totalExp;
            if (cf >= 0 && state.passiveIncome > totalExp * 0.3) {
                state.inReverse = false;
                return `🦋 浴火重生！获得 3000 元，精力 +5，副业 +500，幸运 +3，成功脱离逆流层！`;
            }
            return `🦋 浴火重生！获得 3000 元，精力 +5，副业 +500，幸运 +3`;
            
        case 'unemployment':
            const totalExpU = state.livingExpense + state.tax + state.loanInterest + state.childExpense;
            state.cash = Math.max(0, state.cash - totalExpU);
            state.salary = 0;
            state.energy = Math.min(state.maxEnergy, state.energy + 6);
            return `⚠️ 失业危机！支出 ${totalExpU} 元，月薪归零，精力 +6`;
            
        case 'bankruptcy':
            state.cash = 0;
            state.loanAmount = Math.max(0, state.loanAmount - 5000);
            state.loanInterest = Math.round(state.loanAmount * 0.01);
            state.salary = Math.max(0, state.salary - 2000);
            return `💔 破产重组！现金归零，贷款减少 5000，月薪减少 2000`;
            
        case 'miracle':
            state.cash += 10000;
            state.energy = state.maxEnergy;
            state.luck = state.maxLuck;
            state.inReverse = false;
            return `🌟 奇迹发生！获得 10000 元，精力恢复满，幸运值满，脱离逆流层！`;
            
        case 'awareness':
            state.luck = Math.min(state.maxLuck, state.luck + 3);
            state.energy = Math.min(state.maxEnergy, state.energy + 3);
            return `🧘 觉察卡（逆流）！幸运值 +3，精力 +3`;
    }
    return null;
}

function processFlowTile(state, tile) {
    switch(tile.type) {
        case 'investment':
            const profit = Math.floor(Math.random() * 50000) + 30000;
            const income = Math.floor(Math.random() * 5000) + 2000;
            state.cash += profit;
            state.passiveIncome += income;
            return `💎 投资获利！获得 ${profit.toLocaleString()} 元现金，被动收入增加 ${income} 元`;
            
        case 'flowbankruptcy':
            state.inFlow = false;
            state.streamlinePos = 0;
            state.inReverse = false;
            return `💥 破产陷阱！跌回平流层...`;
            
        case 'audit':
            const taxAmt = Math.floor(state.totalAssets * 0.5);
            state.totalAssets -= taxAmt;
            state.luck = Math.max(0, state.luck - 2);
            return `🔍 查税审计！损失 ${taxAmt.toLocaleString()} 元资产，幸运值 -2`;
            
        case 'income':
            const bonus = 50000;
            state.cash += bonus;
            return `💰 分红收入！获得 ${bonus.toLocaleString()} 元`;
            
        case 'dream':
            if (tile.needEnergy && state.energy >= tile.needEnergy) {
                state.energy -= tile.needEnergy;
                return `✨ 实现梦想「${tile.name}」！消耗 ${tile.needEnergy} 精力`;
            } else if (tile.needEnergy) {
                return `⭐ 接近梦想「${tile.name}」，需要 ${tile.needEnergy} 精力`;
            }
            break;
            
        case 'grace':
            state.cash += 5000;
            state.energy = Math.min(state.maxEnergy, state.energy + 5);
            state.luck = Math.min(state.maxLuck, state.luck + 2);
            return `✨ 慈善荣誉！获得 5000 元，精力 +5，幸运值 +2`;
            
        case 'event':
            return `🎉 特殊事件：${tile.name}`;
    }
    return null;
}

// ==================== 机会卡处理 ====================

function showCardTypeSelection(ws, state, roomId, player) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const cardTypes = Object.values(CARD_TYPES).map(t => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
        color: t.color,
        count: t.cards.length
    }));
    
    ws.send(JSON.stringify({
        type: 'card_type_selection',
        cardTypes: cardTypes,
        canAfford: state.cash >= 500
    }));
    
    if (!room.pendingTypeSelections) {
        room.pendingTypeSelections = new Map();
    }
    room.pendingTypeSelections.set(ws, { playerId: player.playerId, timestamp: Date.now() });
}

function handleCardTypeChoice(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    const selectedType = data.cardType;
    let cardTypeData = null;
    
    switch(selectedType) {
        case 'part_time':
            cardTypeData = CARD_TYPES.PART_TIME;
            break;
        case 'finance':
            cardTypeData = CARD_TYPES.FINANCE;
            break;
        case 'business':
            cardTypeData = CARD_TYPES.BUSINESS;
            break;
        case 'property':
            cardTypeData = CARD_TYPES.PROPERTY;
            break;
        default:
            ws.send(JSON.stringify({ type: 'error', message: '无效的卡片类型' }));
            return;
    }
    
    if (room.pendingTypeSelections) {
        room.pendingTypeSelections.delete(ws);
    }
    
    const randomIndex = Math.floor(Math.random() * cardTypeData.cards.length);
    const card = cardTypeData.cards[randomIndex];
    
    const serializableCard = {
        id: card.id,
        name: card.name,
        description: card.description,
        image: card.image,
        cost: card.cost,
        investmentCost: card.investmentCost || 0,
        energyCost: card.energyCost || 0,
        cardType: cardTypeData.id,
        cardTypeName: cardTypeData.name,
        cardTypeIcon: cardTypeData.icon
    };
    
    if (!room.pendingEvents) {
        room.pendingEvents = new Map();
    }
    room.pendingEvents.set(ws, {
        type: 'opportunity_card',
        card: card,
        cardType: cardTypeData,
        playerId: player.playerId,
        purchased: false,
        timestamp: Date.now()
    });
    
    ws.send(JSON.stringify({
        type: 'opportunity_card_draw',
        card: serializableCard,
        canAfford: player.gameState.cash >= 500
    }));
    
    console.log(`🎴 玩家 ${player.playerName} 选择${cardTypeData.name}，抽到: ${card.name}`);
}

function handlePurchaseCard(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    const pendingEvent = room.pendingEvents.get(ws);
    if (!pendingEvent || pendingEvent.type !== 'opportunity_card') {
        ws.send(JSON.stringify({ type: 'error', message: '没有待处理的机会卡' }));
        return;
    }
    
    const card = pendingEvent.card;
    
    if (player.gameState.cash < 500) {
        ws.send(JSON.stringify({
            type: 'purchase_failed',
            message: `现金不足 500 元，无法购买「${card.name}」`
        }));
        room.pendingEvents.delete(ws);
        return;
    }
    
    player.gameState.cash -= 500;
    pendingEvent.purchased = true;
    pendingEvent.purchaseTime = Date.now();
    
    const effectPreview = getCardEffectPreview(card, player.gameState);
    
    const serializableCard = {
        id: card.id,
        name: card.name,
        description: card.description,
        image: card.image,
        investmentCost: card.investmentCost || 0,
        energyCost: card.energyCost || 0,
        cardType: pendingEvent.cardType?.id || 'general',
        cardTypeName: pendingEvent.cardType?.name || '机会卡',
        cardTypeIcon: pendingEvent.cardType?.icon || '🎴'
    };
    
    ws.send(JSON.stringify({
        type: 'card_purchased',
        card: serializableCard,
        effectPreview: effectPreview,
        message: `已支付 500 元购买「${card.name}」，请查看效果并决定是否执行`
    }));
    
    broadcastToRoom(roomId, {
        type: 'player_purchased_card',
        playerId: player.playerId,
        playerName: player.playerName,
        cardName: card.name,
        cardType: pendingEvent.cardType?.name || '机会卡',
        message: `${player.playerName} 花费 500 元购买了「${card.name}」`
    }, ws);
    
    console.log(`💰 玩家 ${player.playerName} 支付 500 元购买了卡片: ${card.name}`);
}

function handleExecuteCard(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    const pendingEvent = room.pendingEvents.get(ws);
    if (!pendingEvent || pendingEvent.type !== 'opportunity_card' || !pendingEvent.purchased) {
        ws.send(JSON.stringify({ type: 'error', message: '没有已购买的机会卡' }));
        return;
    }
    
    const card = pendingEvent.card;
    const execute = data.execute;
    
    let resultMessage = '';
    let effectResult = '';
    
    if (execute) {
        const investmentCost = card.investmentCost || 0;
        
        if (investmentCost > 0 && player.gameState.cash < investmentCost) {
            resultMessage = `❌ 现金不足 ${investmentCost.toLocaleString()} 元，无法执行「${card.name}」，已支付的 500 元无法退还`;
            
            ws.send(JSON.stringify({
                type: 'card_decision_result',
                execute: false,
                message: resultMessage,
                gameState: player.gameState,
                cardName: card.name,
                effectMessage: ""
            }));
            
            room.pendingEvents.delete(ws);
            
            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: player.playerId,
                gameState: player.gameState
            });
            return;
        }
        
        const energyCost = card.energyCost || 0;
        if (energyCost > 0 && player.gameState.energy < energyCost) {
            resultMessage = `❌ 精力不足 ${energyCost} 点，无法执行「${card.name}」，已支付的 500 元无法退还`;
            
            ws.send(JSON.stringify({
                type: 'card_decision_result',
                execute: false,
                message: resultMessage,
                gameState: player.gameState,
                cardName: card.name,
                effectMessage: ""
            }));
            
            room.pendingEvents.delete(ws);
            
            broadcastToRoom(roomId, {
                type: 'state_updated',
                playerId: player.playerId,
                gameState: player.gameState
            });
            return;
        }
        
        effectResult = card.effect(player.gameState);
        resultMessage = `✨ 执行「${card.name}」成功！${effectResult}`;
        
        broadcastToRoom(roomId, {
            type: 'card_executed',
            playerId: player.playerId,
            playerName: player.playerName,
            cardName: card.name,
            cardType: pendingEvent.cardType?.name || '机会卡',
            effectMessage: effectResult,
            gameState: player.gameState
        });
        
        console.log(`✅ 玩家 ${player.playerName} 执行了卡片: ${card.name}`);
    } else {
        resultMessage = `❌ 你决定不执行「${card.name}」，但已支付的 500 元无法退还。`;
        
        broadcastToRoom(roomId, {
            type: 'card_skipped',
            playerId: player.playerId,
            playerName: player.playerName,
            cardName: card.name,
            cardType: pendingEvent.cardType?.name || '机会卡',
            message: resultMessage
        });
        
        console.log(`⏭️ 玩家 ${player.playerName} 选择不执行卡片: ${card.name}`);
    }
    
    ws.send(JSON.stringify({
        type: 'card_decision_result',
        execute: execute,
        message: resultMessage,
        gameState: player.gameState,
        cardName: card.name,
        effectMessage: effectResult
    }));
    
    room.pendingEvents.delete(ws);
    
    broadcastToRoom(roomId, {
        type: 'state_updated',
        playerId: player.playerId,
        gameState: player.gameState
    });
}

// ==================== 四叶草处理 ====================

function handleUseFourLeafClover(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    if (!player.gameState.fourLeafClover || player.gameState.fourLeafClover <= 0) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '没有四叶草可用'
        }));
        return;
    }
    
    player.gameState.fourLeafClover--;
    player.gameState.diceMultiplier = 2;
    player.gameState.diceMultiplierActive = true;
    
    ws.send(JSON.stringify({
        type: 'four_leaf_clover_used',
        message: '🍀 你使用了一个四叶草！下一次掷骰步数将翻倍！',
        fourLeafClover: player.gameState.fourLeafClover,
        gameState: player.gameState
    }));
    
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `${player.playerName} 使用了一个四叶草！下一次掷骰步数将翻倍！`
    }, ws);
    
    console.log(`🍀 玩家 ${player.playerName} 使用了四叶草，剩余: ${player.gameState.fourLeafClover}`);
}

// ==================== 玩家操作处理 ====================

function handleJoin(ws, data, roomId) {
    const room = getOrCreateRoom(roomId);
    const playerId = data.playerId;
    const playerName = data.playerName;
    const professionId = data.profession;
    const professionData = data.professionData || PROFESSIONS[professionId] || PROFESSIONS.teacher;
    
    console.log(`📊 职业数据: ${professionData.name}, 起始精力: ${professionData.energy}/${professionData.maxEnergy}`);
    
    const gameState = {
        playerId,
        playerName,
        streamlinePos: 0,
        reversePos: 0,
        flowPos: 0,
        inReverse: false,
        inFlow: false,
        cash: professionData.cash,
        salary: professionData.salary,
        sideIncome: professionData.sideIncome || 0,
        sideIncomeBonus: 0,
        passiveIncome: 0,
        livingExpense: professionData.livingExpense,
        tax: professionData.tax,
        loanAmount: 0,
        loanInterest: 0,
        childExpense: 0,
        totalAssets: professionData.cash,
        childCount: 0,
        hasSpouse: false,
        energy: professionData.energy,
        maxEnergy: professionData.maxEnergy,
        luck: professionData.luck,
        maxLuck: 10,
        silverWing: false,
        usedSilverWing: false,
        businessCostDiscount: 0,
        hasEditSkill: false,
        hasDesignSkill: false,
        hasHostSkill: false,
        hostSkillActive: false,
        hasBusinessDiscount: false,
        fourLeafClover: 1,
        diceMultiplier: 1,
        diceMultiplierActive: false
    };
    
    room.players.set(ws, { playerId, playerName, gameState });
    
    const otherPlayers = [];
    room.players.forEach((player, otherWs) => {
        if (otherWs !== ws) {
            otherPlayers.push({
                id: player.playerId,
                name: player.playerName,
                gameState: player.gameState
            });
        }
    });
    
    ws.send(JSON.stringify({
        type: 'join_success',
        playerId,
        playerName,
        gameState,
        otherPlayers,
        streamlineTiles: room.streamlineTiles,
        reverseTiles: room.reverseTiles,
        flowTiles: room.flowTiles,
        cardTypes: Object.values(CARD_TYPES).map(t => ({
            id: t.id,
            name: t.name,
            icon: t.icon,
            color: t.color
        }))
    }));
    
    broadcastToRoom(roomId, {
        type: 'player_joined',
        player: {
            id: playerId,
            name: playerName,
            gameState
        }
    }, ws);
    
    console.log(`👤 玩家加入: ${playerName} (${professionData.name}), 房间: ${roomId}, 当前人数: ${room.players.size}`);
}

function handleRoll(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    const state = player.gameState;
    if (state.energy <= 0) {
        ws.send(JSON.stringify({ type: 'error', message: '精力不足，无法掷骰' }));
        return;
    }
    
    state.energy = Math.max(0, state.energy - 1);
    
    let originalSteps = Math.floor(Math.random() * 6) + 1;
    let steps = originalSteps;
    let multiplierMessage = '';
    
    if (state.diceMultiplierActive && state.diceMultiplier === 2) {
        steps = originalSteps * 2;
        multiplierMessage = `🍀 四叶草生效！步数 ${originalSteps} x2 = ${steps} 步！`;
        state.diceMultiplierActive = false;
        state.diceMultiplier = 1;
        
        ws.send(JSON.stringify({
            type: 'notification',
            message: `🍀 四叶草生效！${originalSteps} x 2 = ${steps} 步！`
        }));
    }
    
    let oldPos = state.streamlinePos;
    let tile = null;
    let eventMessage = null;
    
    if (state.inFlow) {
        state.flowPos = (state.flowPos + steps) % room.flowTiles.length;
        tile = room.flowTiles[state.flowPos];
        eventMessage = processFlowTile(state, tile);
    } else if (state.inReverse) {
        state.reversePos = (state.reversePos + steps) % room.reverseTiles.length;
        tile = room.reverseTiles[state.reversePos];
        eventMessage = processReverseTile(state, tile);
    } else {
        for (let i = 1; i <= steps; i++) {
            let newPos = (oldPos + i) % room.streamlineTiles.length;
            let tileAtPos = room.streamlineTiles[newPos];
            if (tileAtPos.type === 'settlement') {
                const totalIncome = state.salary + state.sideIncome;
                state.cash += totalIncome;
                state.totalAssets += Math.floor(totalIncome * 0.2);
                
                const settlementMsg = {
                    type: 'settlement',
                    playerId: player.playerId,
                    playerName: player.playerName,
                    salary: state.salary,
                    sideIncome: state.sideIncome,
                    totalIncome: totalIncome,
                    isExactLanding: (i === steps),
                    gameState: state
                };
                ws.send(JSON.stringify(settlementMsg));
                broadcastToRoom(roomId, settlementMsg, ws);
            }
        }
        
        state.streamlinePos = (state.streamlinePos + steps) % room.streamlineTiles.length;
        tile = room.streamlineTiles[state.streamlinePos];
        
        if (tile.type !== 'settlement') {
            const isExactLanding = tile.type === 'settlement';
            eventMessage = processStreamlineTile(state, tile, ws, roomId, player, isExactLanding);
        }
    }
    
    const totalExp = state.livingExpense + state.tax + state.loanInterest + state.childExpense;
    if (!state.inReverse && state.passiveIncome > totalExp && !state.inFlow) {
        state.inFlow = true;
        state.flowPos = 0;
        ws.send(JSON.stringify({ type: 'notification', message: '🎉 恭喜进入顺流层！' }));
        broadcastToRoom(roomId, { type: 'notification', message: `🎉 ${player.playerName} 进入顺流层！` }, ws);
    }
    
    const result = {
        type: 'dice_result',
        playerId: player.playerId,
        playerName: player.playerName,
        steps: steps,
        originalSteps: originalSteps,
        multiplierUsed: multiplierMessage !== '',
        gameState: state,
        tile: tile,
        eventMessage: eventMessage,
        multiplierMessage: multiplierMessage
    };
    
    if (tile.type !== 'opportunity') {
        ws.send(JSON.stringify(result));
        broadcastToRoom(roomId, result, ws);
        
        if (eventMessage && tile.type !== 'settlement') {
            ws.send(JSON.stringify({ type: 'notification', message: eventMessage }));
            broadcastToRoom(roomId, { type: 'notification', message: `${player.playerName}: ${eventMessage}` }, ws);
        }
    }
    
    console.log(`🎲 玩家 ${player.playerName} 掷出 ${originalSteps} 步${multiplierMessage ? ' (翻倍后 ' + steps + '步)' : ''}，移动到 ${tile.name}`);
}

function handleEndTurn(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    player.gameState.energy = Math.min(player.gameState.maxEnergy, player.gameState.energy + 1);
    player.gameState.usedSilverWing = false;
    player.gameState.luck = Math.max(0, player.gameState.luck - 0.5);
    
    const result = {
        type: 'turn_ended',
        playerId: player.playerId,
        playerName: player.playerName,
        gameState: player.gameState
    };
    
    ws.send(JSON.stringify(result));
    broadcastToRoom(roomId, result, ws);
    
    console.log(`⏭️ 玩家 ${player.playerName} 结束回合，精力恢复1点`);
}

function handleLoan(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    const amount = data.data?.amount || data.amount;
    const maxLoan = Math.round((player.gameState.salary + player.gameState.sideIncome) * 3);
    
    if (amount > 0 && amount <= maxLoan) {
        player.gameState.loanAmount += amount;
        player.gameState.loanInterest = Math.round(player.gameState.loanAmount * 0.01);
        player.gameState.cash += amount;
        player.gameState.luck = Math.max(0, player.gameState.luck - 1);
        
        const result = {
            type: 'loan_approved',
            playerId: player.playerId,
            playerName: player.playerName,
            loanAmount: amount,
            gameState: player.gameState
        };
        
        ws.send(JSON.stringify(result));
        broadcastToRoom(roomId, result, ws);
        
        console.log(`🏦 玩家 ${player.playerName} 贷款 ${amount} 元`);
    } else {
        ws.send(JSON.stringify({ type: 'loan_rejected', reason: '贷款金额无效或超出上限' }));
    }
}

// ==================== WebSocket 连接处理 ====================

wss.on('connection', (ws) => {
    let playerRoomId = 'default_room';
    console.log('🔌 新客户端连接');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📨 收到消息:', data.type);
            
            switch(data.type) {
                case 'join':
                    playerRoomId = data.roomId || 'default_room';
                    handleJoin(ws, data, playerRoomId);
                    break;
                case 'roll':
                    handleRoll(ws, data, playerRoomId);
                    break;
                case 'end_turn':
                    handleEndTurn(ws, data, playerRoomId);
                    break;
                case 'apply_loan':
                    handleLoan(ws, data, playerRoomId);
                    break;
                case 'card_type_choice':
                    handleCardTypeChoice(ws, data, playerRoomId);
                    break;
                case 'purchase_card':
                    handlePurchaseCard(ws, data, playerRoomId);
                    break;
                case 'execute_card':
                    handleExecuteCard(ws, data, playerRoomId);
                    break;
                case 'use_four_leaf_clover':
                    handleUseFourLeafClover(ws, data, playerRoomId);
                    break;
                default:
                    ws.send(JSON.stringify({ type: 'error', message: '未知消息类型' }));
            }
        } catch (e) {
            console.error('消息处理错误:', e);
            ws.send(JSON.stringify({ type: 'error', message: '消息格式错误' }));
        }
    });
    
    ws.on('close', () => {
        const room = rooms.get(playerRoomId);
        if (room && room.players.has(ws)) {
            const player = room.players.get(ws);
            console.log(`👋 玩家断开: ${player.playerName}`);
            room.players.delete(ws);
            
            if (room.pendingEvents) room.pendingEvents.delete(ws);
            if (room.pendingTypeSelections) room.pendingTypeSelections.delete(ws);
            
            broadcastToRoom(playerRoomId, {
                type: 'player_disconnected',
                playerId: player.playerId,
                playerName: player.playerName
            });
            
            if (room.players.size === 0) {
                rooms.delete(playerRoomId);
                console.log(`🗑️ 房间已删除: ${playerRoomId}`);
            }
        }
    });
});

// 启动服务器
const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   🎲 财富流沙盘 WebSocket 服务器                           ║
╠════════════════════════════════════════════════════════════╣
║   端口: ${PORT}                                               ║
║   地址: http://localhost:${PORT}                             ║
║   状态: 运行中                                              ║
╠════════════════════════════════════════════════════════════╣
║   👥 职业系统:                                             ║
║   👨‍⚕️ 医生 | 👨‍🔧 工程师 | 👩‍🏫 教师 | 🎨 艺术家 | 🚀 创业者      ║
╠════════════════════════════════════════════════════════════╣
║   📅 结算日机制:                                           ║
║   第5、13、21格 - 获得月薪+副业收入                        ║
║   正好踩中结算日 - 额外获得一次掷骰机会                    ║
╠════════════════════════════════════════════════════════════╣
║   ⚡ 精力系统:                                             ║
║   掷骰消耗1精力 | 结束回合恢复1精力                        ║
╠════════════════════════════════════════════════════════════╣
║   📚 机会卡系统:                                            ║
║   💼 兼职类: ${partTimeCards.length} 张                        ║
║   📈 财务类: ${financeCards.length} 张                        ║
║   🚀 创业类: ${businessCards.length} 张                       ║
║   🏠 地产类: ${propertyCards.length} 张                       ║
╠════════════════════════════════════════════════════════════╣
║   🌐 访问地址: http://localhost:${PORT}                      ║
╚════════════════════════════════════════════════════════════╝
    `);
});