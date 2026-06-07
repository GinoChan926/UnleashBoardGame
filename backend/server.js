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

// ==================== 交易记录存储 ====================
let transactions = [];

// 添加交易记录
function addTransactionRecord(playerName, card, action, amountChange, details, stateBefore, stateAfter) {
    console.log(`🔍 addTransactionRecord 被调用: ${playerName} ${action} ${card.name}`);
    
    // 获取卡片类型
    let cardType = card.cardType;
    if (!cardType) {
        if (card.id && card.id.startsWith('C')) cardType = 'business';
        else if (card.id && card.id.startsWith('Z')) cardType = 'part_time';
        else if (card.id && card.id.startsWith('F')) cardType = 'finance';
        else if (card.id && card.id.startsWith('pro')) cardType = 'property';
        else cardType = 'general';
    }
    
    const record = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toLocaleString('zh-HK'),
        playerName: playerName,
        cardType: cardType,
        cardName: card.name,
        action: action,
        amountChange: amountChange || 0,
        passiveIncomeChange: (stateAfter?.passiveIncome || 0) - (stateBefore?.passiveIncome || 0),
        sideIncomeChange: (stateAfter?.sideIncome || 0) - (stateBefore?.sideIncome || 0),
        salaryChange: (stateAfter?.salary || 0) - (stateBefore?.salary || 0),
        energyChange: (stateAfter?.energy || 0) - (stateBefore?.energy || 0),
        details: details || ''
    };
    
    transactions.unshift(record);
    
    if (transactions.length > 500) {
        transactions = transactions.slice(0, 500);
    }
    
    // 保存到 backend 文件夹
    const backendDir = __dirname;
    const transactionsPath = path.join(backendDir, 'transactions.json');
    
    try {
        fs.writeFileSync(transactionsPath, JSON.stringify(transactions.slice(0, 200), null, 2));
        console.log(`✅ 交易记录已保存: ${playerName} ${action} ${card.name} (${cardType}) 金额变化: ${amountChange}`);
        console.log(`📁 路径: ${transactionsPath}`);
    } catch (e) {
        console.log(`❌ 保存失败: ${e.message}`);
    }
    
    return record;
}
// 根据卡片获取类型
// 根据卡片获取类型
function getCardTypeFromCard(card) {
    if (card.id && card.id.startsWith('P')) return 'part_time';
    if (card.id && card.id.startsWith('F')) return 'finance';
    if (card.id && card.id.startsWith('C')) return 'business';
    if (card.id && card.id.startsWith('H')) return 'property';
    if (card.type === 'part_time') return 'part_time';
    if (card.type === 'finance') return 'finance';
    if (card.type === 'business') return 'business';
    if (card.type === 'property') return 'property';
    if (card.cardType === 'part_time') return 'part_time';
    if (card.cardType === 'finance') return 'finance';
    if (card.cardType === 'business') return 'business';
    if (card.cardType === 'property') return 'property';
    if (card.category === '财务') return 'finance';
    if (card.category === '兼职') return 'part_time';
    if (card.category === '创业') return 'business';
    if (card.category === '地产') return 'property';
    if (card.name && (card.name.includes('股票') || card.name.includes('基金') || card.name.includes('加密') || 
        card.name.includes('P2P') || (card.id && card.id.startsWith('F')))) {
        return 'finance';
    }
    // 新增：創業卡片名稱關鍵字識別
    if (card.name && (card.name.includes('店') || card.name.includes('企業') || card.name.includes('中心') ||
        card.name.includes('機構') || card.name.includes('辦公室') || card.name.includes('程式') ||
        card.name.includes('廠') || card.name.includes('咖啡') || card.name.includes('Airbnb') ||
        card.name.includes('洗車') || card.name.includes('健身') || card.name.includes('培訓') ||
        card.name.includes('飲品') || card.name.includes('麵包') || card.name.includes('飯堂'))) {
        return 'business';
    }
    return 'general';
}

// 保存交易记录到文件（定期）
function saveTransactionsToFile() {
    try {
        const transactionsPath = path.join(projectRoot, 'transactions.json');
        fs.writeFileSync(transactionsPath, JSON.stringify(transactions.slice(0, 200), null, 2));
    } catch (e) {
        // 忽略
    }
}

// 每30秒保存一次
setInterval(saveTransactionsToFile, 30000);

// 加载已保存的交易记录
function loadTransactionsFromFile() {
    try {
        const transactionsPath = path.join(__dirname, 'transactions.json');
        if (fs.existsSync(transactionsPath)) {
            const data = fs.readFileSync(transactionsPath, 'utf8');
            const saved = JSON.parse(data);
            if (Array.isArray(saved) && saved.length > 0) {
                transactions = saved;
                console.log(`📚 加载了 ${transactions.length} 条历史交易记录`);
            }
        }
    } catch (e) {
        console.log('加载交易记录失败:', e.message);
    }
}

// 加载机会卡数据
let partTimeCards = [], financeCards = [], businessCards = [], propertyCards = [];

try {
    const cardsData = require('./chance_cards.js');
    partTimeCards = cardsData.partTimeCards || [];
    financeCards = cardsData.financeCards || [];
    businessCards = cardsData.businessCards || [];
    propertyCards = cardsData.propertyCards || [];
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
const projectRoot = path.resolve(__dirname, '..');
const frontendPath = path.join(projectRoot, 'frontend');
const cardsPath = path.join(projectRoot, 'cards');

console.log(`📁 项目根目录: ${projectRoot}`);
console.log(`📁 Frontend目录: ${frontendPath}`);
console.log(`📁 Cards目录: ${cardsPath}`);

// 解码 URL 编码的文件名
function decodeUrl(str) {
    try {
        return decodeURIComponent(str);
    } catch (e) {
        return str;
    }
}

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
    { name: "幸運星", type: "lucky_star" },
    { name: "結算日", type: "settlement" },
    { name: "機會卡", type: "opportunity" },
    { name: "恩典時刻", type: "grace" },
    { name: "慈善捐款", type: "event" },
    { name: "保險規劃", type: "event" },
    { name: "機會卡", type: "opportunity" },
    { name: "教育投資", type: "event" },
    { name: "四葉草", type: "four_leaf_clover" },
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
    
    // ==================== API 路由 ====================
    
    // 获取交易记录
    if (req.url === '/api/transactions' && req.method === 'GET') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(transactions));
        return;
    }
    
    // 清空交易记录
    if (req.url === '/api/transactions/clear' && req.method === 'POST') {
        transactions = [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: '交易记录已清空' }));
        return;
    }
    
    // ==================== 静态文件服务 ====================
    
    let originalUrl = req.url;
    let filePath = decodeUrl(originalUrl);
    
    // 默认首页
    if (filePath === '/' || filePath === '/index.html') {
        filePath = '/frontend/index.html';
    }
    
    // 处理 record.html
    if (filePath === '/record.html') {
        filePath = '/frontend/record.html';
    }
    
    // 处理卡片图片路径
    let imagePath = null;
    
    if (filePath.includes('cards/cover/') || filePath.includes('../cards/cover/')) {
        let fileName = path.basename(filePath);
        console.log(`🖼️ 请求卡片封面图片: ${fileName}`);
        
        let coverImagePath = path.join(projectRoot, 'cards', 'cover', fileName);
        
        if (fs.existsSync(coverImagePath)) {
            imagePath = coverImagePath;
            console.log(`   ✅ 找到图片: ${coverImagePath}`);
        } else {
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
    
    if (filePath.includes('/cards/') || filePath.includes('../cards/')) {
        let relativePath = filePath;
        relativePath = relativePath.replace(/\.\.\//g, '');
        if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
        
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
    
    let fullPath = path.join(projectRoot, filePath);
    
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
    
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            let altPath = path.join(frontendPath, path.basename(filePath));
            
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
    let effectResult;
    
    try {
        // 检查卡片是否有 effect 方法
        if (card.effect) {
            // 对于股票卡片，effect 可能需要额外参数
            if (card.getCurrentPrice && card.buy && card.sell) {
                // 股票卡片：显示菜单，不执行实际效果
                effectResult = `请选择买入或卖出操作`;
            } else {
                effectResult = card.effect(tempState);
            }
        } else {
            effectResult = `执行「${card.name}」`;
        }
    } catch (e) {
        effectResult = `执行「${card.name}」`;
    }
    
    // 确保 effectResult 是字符串
    if (typeof effectResult !== 'string') {
        effectResult = String(effectResult || '执行卡片效果');
    }
    
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

// ==================== 贷款系统 ====================

function getPlayerLoan(player) {
    if (!player.loanRecord) {
        player.loanRecord = {
            principal: 0,
            interestRate: 0.1,
            settlementCount: 0,
            lastSettlementMonth: 0
        };
    }
    return player.loanRecord;
}

function calculateTotalRepay(principal) {
    return principal + Math.round(principal * 0.1);
}

function handleLoan(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    const loanRecord = getPlayerLoan(player);
    
    if (loanRecord.principal > 0) {
        ws.send(JSON.stringify({ 
            type: 'error', 
            message: `❌ 你还有 ${loanRecord.principal.toLocaleString()} 元贷款未还清，请先还清贷款再申请新贷款！` 
        }));
        return;
    }
    
    const amount = data.data?.amount || data.amount;
    const maxLoan = Math.round((player.gameState.salary + player.gameState.sideIncome) * 3);
    
    if (amount > 0 && amount <= maxLoan) {
        const interest = Math.round(amount * loanRecord.interestRate);
        const totalToRepay = amount + interest;
        
        loanRecord.principal = amount;
        loanRecord.settlementCount = 0;
        loanRecord.lastSettlementMonth = player.gameState.totalSettlementCount || 0;
        
        player.gameState.cash += amount;
        player.gameState.loanAmount = amount;
        player.gameState.loanInterest = Math.round(amount * 0.01);
        player.gameState.luck = Math.max(0, player.gameState.luck - 1);
        
        const result = {
            type: 'loan_approved',
            playerId: player.playerId,
            playerName: player.playerName,
            loanAmount: amount,
            interestAmount: interest,
            totalToRepay: totalToRepay,
            interestRate: loanRecord.interestRate * 100,
            gameState: player.gameState
        };
        
        ws.send(JSON.stringify(result));
        broadcastToRoom(roomId, result, ws);
        
        console.log(`🏦 玩家 ${player.playerName} 贷款 ${amount.toLocaleString()} 元，需还本利和 ${totalToRepay.toLocaleString()} 元 (+${loanRecord.interestRate*100}%利息)`);
    } else {
        ws.send(JSON.stringify({ type: 'loan_rejected', reason: '贷款金额无效或超出上限' }));
    }
}

function handleRepayLoan(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    const loanRecord = getPlayerLoan(player);
    const principal = loanRecord.principal;
    
    if (principal === 0) {
        ws.send(JSON.stringify({ type: 'error', message: '💰 没有未偿还的贷款' }));
        return;
    }
    
    const totalToRepay = calculateTotalRepay(principal);
    const interest = totalToRepay - principal;
    
    if (player.gameState.cash < totalToRepay) {
        ws.send(JSON.stringify({ 
            type: 'error', 
            message: `💰 现金不足！需要 ${totalToRepay.toLocaleString()} 元 (本金 ${principal.toLocaleString()} + 利息 ${interest.toLocaleString()})` 
        }));
        return;
    }
    
    player.gameState.cash -= totalToRepay;
    player.gameState.loanAmount = 0;
    player.gameState.loanInterest = 0;
    
    loanRecord.principal = 0;
    loanRecord.settlementCount = 0;
    
    player.gameState.luck = Math.min(player.gameState.maxLuck, player.gameState.luck + 1);
    
    const result = {
        type: 'loan_repaid',
        playerId: player.playerId,
        playerName: player.playerName,
        repaidAmount: principal,
        interestAmount: interest,
        totalRepaid: totalToRepay,
        gameState: player.gameState
    };
    
    ws.send(JSON.stringify(result));
    broadcastToRoom(roomId, result, ws);
    
    console.log(`💰 玩家 ${player.playerName} 偿还贷款 ${principal.toLocaleString()} 元 + ${interest.toLocaleString()} 元利息，总计 ${totalToRepay.toLocaleString()} 元`);
}

function processSettlementRepayment(player, ws, roomId) {
    const loanRecord = getPlayerLoan(player);
    
    if (loanRecord.principal === 0) return null;
    
    loanRecord.settlementCount++;
    player.gameState.totalSettlementCount = (player.gameState.totalSettlementCount || 0) + 1;
    
    const totalToRepay = calculateTotalRepay(loanRecord.principal);
    
    console.log(`📅 玩家 ${player.playerName} 第 ${loanRecord.settlementCount} 次经过结算日，贷款本金: ${loanRecord.principal.toLocaleString()}`);
    
    if (loanRecord.settlementCount >= 12) {
        if (player.gameState.cash >= totalToRepay) {
            player.gameState.cash -= totalToRepay;
            const interest = totalToRepay - loanRecord.principal;
            
            const result = {
                type: 'forced_repayment',
                playerId: player.playerId,
                playerName: player.playerName,
                message: `⚠️ 强制还款！经过12次结算日仍未还清贷款，系统强制扣除本利和 ${totalToRepay.toLocaleString()} 元 (本金 ${loanRecord.principal.toLocaleString()} + 利息 ${interest.toLocaleString()})`,
                deductedAmount: totalToRepay,
                remainingCash: player.gameState.cash,
                gameState: player.gameState
            };
            
            player.gameState.loanAmount = 0;
            player.gameState.loanInterest = 0;
            loanRecord.principal = 0;
            loanRecord.settlementCount = 0;
            
            return result;
        } else {
            const deductedAmount = player.gameState.cash;
            const remainingDebt = totalToRepay - deductedAmount;
            
            player.gameState.cash = 0;
            
            loanRecord.principal = remainingDebt;
            loanRecord.settlementCount = 12;
            
            const result = {
                type: 'forced_repayment_partial',
                playerId: player.playerId,
                playerName: player.playerName,
                message: `⚠️ 强制部分还款！现金不足，扣除所有现金 ${deductedAmount.toLocaleString()} 元，剩余欠款 ${remainingDebt.toLocaleString()} 元将继续计息！`,
                deductedAmount: deductedAmount,
                remainingDebt: remainingDebt,
                remainingCash: 0,
                gameState: player.gameState
            };
            
            player.gameState.loanAmount = remainingDebt;
            player.gameState.loanInterest = Math.round(remainingDebt * 0.01);
            
            return result;
        }
    }
    
    return {
        type: 'settlement_reminder',
        playerId: player.playerId,
        playerName: player.playerName,
        message: `⚠️ 贷款提醒！你还有贷款本金 ${loanRecord.principal.toLocaleString()} 元未还，需还本利和 ${totalToRepay.toLocaleString()} 元。已过 ${loanRecord.settlementCount}/12 次结算日，${12 - loanRecord.settlementCount} 次后强制扣款！`,
        principal: loanRecord.principal,
        totalToRepay: totalToRepay,
        settlementCount: loanRecord.settlementCount,
        remainingSettlements: 12 - loanRecord.settlementCount,
        gameState: player.gameState
    };
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
            
        case 'lucky_star':
            state.luckyStarCount = (state.luckyStarCount || 0) + 1;
            return `⭐ 获得幸运星！当前共有 ${state.luckyStarCount} 颗！下次掷骰移动步数 x3 倍！`;
                    
        case 'four_leaf_clover':
            state.fourLeafClover = (state.fourLeafClover || 0) + 1;
            return `🍀 获得四叶草！下次掷骰移动步数 x2 倍！`;
            
        case 'settlement':
            const totalIncome = state.salary + state.sideIncome;
            state.cash += totalIncome;
            state.totalAssets += Math.floor(totalIncome * 0.2);

              // ===== 面包店精力奖励 =====
            if (state.bakeryCount && state.bakeryCount > 0) {
                const bakeryEnergyBonus = state.bakeryCount; // 每个面包店 +1 精力
                state.energy = Math.min(state.maxEnergy, state.energy + bakeryEnergyBonus);
                const bonusMessage = ` 🍞 麵包店提供精力 +${bakeryEnergyBonus}！`;
                if (eventMessage) {
                    eventMessage += bonusMessage;
                } else {
                    eventMessage = bonusMessage;
                }
            }
            // =========================
            
            const repaymentResult = processSettlementRepayment(player, ws, roomId);
            if (repaymentResult) {
                ws.send(JSON.stringify(repaymentResult));
                broadcastToRoom(roomId, repaymentResult, ws);
            }
            
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
                return `💰 结算日！正好踩中！获得 ${totalIncome.toLocaleString()} 元现金流，并额外获得一次掷骰机会！`;
            }
            return `💰 结算日！经过结算日，获得 ${totalIncome.toLocaleString()} 元现金流`;
            
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
            return `⚠️ 失业危机！支出 ${totalExpU.toLocaleString()} 元，月薪归零，精力 +6`;
            
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
    const originalCard = cardTypeData.cards[randomIndex];
    
    // 复制原始卡片，保留所有属性和方法
    const card = { ...originalCard };
    card.cardType = cardTypeData.id;
    
    // 保留关键方法（用于股票和加密货币）
    if (originalCard.getCurrentPrice) {
        card.getCurrentPrice = originalCard.getCurrentPrice.bind(card);
    }
    if (originalCard.buy) {
        card.buy = originalCard.buy.bind(card);
    }
    if (originalCard.sell) {
        card.sell = originalCard.sell.bind(card);
    }
    if (originalCard.getHoldingsInfo) {
        card.getHoldingsInfo = originalCard.getHoldingsInfo.bind(card);
    }
    if (originalCard.effect) {
        card.effect = originalCard.effect.bind(card);
    }
    
    // 构建可序列化的卡片对象（发送给前端）
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
        cardTypeIcon: cardTypeData.icon,
        // 财务卡片特有属性（用于前端显示输入框）
        pricePerUnit: card.pricePerUnit,
        monthlyReturn: card.monthlyReturn,
        minUnits: card.minUnits,
        maxUnits: card.maxUnits,
        stockCode: card.stockCode,
        currentPrice: card.currentPrice,
        cryptoCode: card.cryptoCode,
        type: card.type
    };
    
    if (!room.pendingEvents) {
        room.pendingEvents = new Map();
    }
    room.pendingEvents.set(ws, {
        type: 'opportunity_card',
        card: card,  // 保留完整卡片对象（包含方法）
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
    
    console.log(`🎴 玩家 ${player.playerName} 选择${cardTypeData.name}，抽到: ${card.name} (ID: ${card.id})`);
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
    const stockAction = data.stockAction;
    const cryptoAction = data.cryptoAction;
    const shares = data.shares;
    const units = data.units;
    
    let resultMessage = '';
    let effectResult = '';
    
    const stateBefore = JSON.parse(JSON.stringify(player.gameState));
    
    // 判断卡片类型
    const isStockCard = !!(card.stockCode || (card.id && (card.id.startsWith('F06') || card.id.startsWith('F07') || 
                         card.id.startsWith('F08') || card.id.startsWith('F09') || card.id.startsWith('F10') ||
                         card.id.startsWith('F11') || card.id.startsWith('F12') || card.id.startsWith('F13') ||
                         card.id.startsWith('F14') || card.id.startsWith('F15') || card.id.startsWith('F16') ||
                         card.id.startsWith('F17'))));
    const isCryptoCard = !!(card.cryptoCode || card.id === 'F03' || card.id === 'F04');
    const isFundCard = !!(card.id === 'F02' || (card.type === 'finance' && card.pricePerUnit && card.monthlyReturn > 0));
    const isP2PCard = !!(card.id === 'F05');
    const isPartyRoomCard = !!(card.id === 'C03' && card.name === '派對房間');
    const isFoodDeliveryCard = !!(card.id === 'C04' && card.name === '外賣店');
    
    console.log(`🔍 执行卡片: ${card.name} (ID: ${card.id})`);
    console.log(`   - isStockCard: ${isStockCard}, isCryptoCard: ${isCryptoCard}, isFundCard: ${isFundCard}, isP2PCard: ${isP2PCard}, isPartyRoomCard: ${isPartyRoomCard}`);
    
    if (execute) {
        // ==================== 派对房间卡片特殊处理 (C02) ====================
        if (isPartyRoomCard) {
            console.log(`🎉 处理派对房间卡片: ${card.id} - ${card.name}`);
            
            const investmentCost = card.investmentCost || 250000;
            const energyCost = card.energyCost || 3;
            const selfEnergyGain = card.selfEnergyGain || 7;
            const otherEnergyGain = card.otherEnergyGain || 2;
            
            // 检查投资条件
            if (player.gameState.cash < investmentCost) {
                resultMessage = `❌ 现金不足 ${investmentCost.toLocaleString()} 元，无法执行「${card.name}」`;
                ws.send(JSON.stringify({
                    type: 'card_decision_result', execute: false, message: resultMessage,
                    gameState: player.gameState, cardName: card.name, effectMessage: ""
                }));
                room.pendingEvents.delete(ws);
                return;
            }
            
            if (player.gameState.energy < energyCost) {
                resultMessage = `❌ 精力不足 ${energyCost} 点，无法执行「${card.name}」`;
                ws.send(JSON.stringify({
                    type: 'card_decision_result', execute: false, message: resultMessage,
                    gameState: player.gameState, cardName: card.name, effectMessage: ""
                }));
                room.pendingEvents.delete(ws);
                return;
            }
            
            // 执行投资效果（扣钱、扣精力、加被动收入）
            effectResult = card.effect(player.gameState);
            
            // 给当前玩家增加精力（派对效果）
            player.gameState.energy += selfEnergyGain;
            // 限制最大精力
            if (player.gameState.energy > player.gameState.maxEnergy) {
                player.gameState.energy = player.gameState.maxEnergy;
            }
            
            resultMessage = `✨ 执行「${card.name}」成功！${effectResult} 派對歡樂氣氛讓你獲得 ${selfEnergyGain} 精力！`;
            
            // 计算现金变化
            const cashChange = player.gameState.cash - stateBefore.cash;
            
            addTransactionRecord(
                player.playerName, card, '执行', cashChange, effectResult, stateBefore, player.gameState
            );
            
            // 给其他玩家增加精力
            const otherPlayersList = [];
            room.players.forEach((otherPlayer, otherWs) => {
                if (otherWs !== ws) {
                    otherPlayer.gameState.energy = Math.min(
                        otherPlayer.gameState.maxEnergy, 
                        otherPlayer.gameState.energy + otherEnergyGain
                    );
                    otherPlayersList.push(otherPlayer.playerName);
                    
                    // 通知其他玩家
                    otherWs.send(JSON.stringify({
                        type: 'notification',
                        message: `🎉 ${player.playerName} 開設了派對房間！你獲得 ${otherEnergyGain} 精力！`
                    }));
                    
                    // 广播其他玩家的状态更新
                    broadcastToRoom(roomId, {
                        type: 'state_updated',
                        playerId: otherPlayer.playerId,
                        gameState: otherPlayer.gameState
                    });
                }
            });
            
            if (otherPlayersList.length > 0) {
                resultMessage += ` 其他玩家 (${otherPlayersList.join(', ')}) 獲得 ${otherEnergyGain} 精力！`;
                broadcastToRoom(roomId, {
                    type: 'notification',
                    message: `🎉 ${player.playerName} 開設了派對房間！所有其他玩家獲得 ${otherEnergyGain} 精力！`
                }, ws);
            } else {
                resultMessage += ` 沒有其他玩家在線，只有你獲得精力獎勵。`;
            }
        }

        // ==================== 外卖店卡片特殊处理 (C04) ====================
        else if (isFoodDeliveryCard) {
        console.log(`🍔 处理外卖店卡片: ${card.id} - ${card.name}`);
        
        // 检查是否有选择操作
        const userAction = data.userAction || data.action;
        
        // 如果没有指定操作，显示菜单让玩家选择
        if (!userAction) {
            const menuMessage = `🍔 ${card.name}\n\n` +
                `請選擇操作:\n` +
                `1️⃣ 投資開店 ($${card.investmentCost?.toLocaleString()} 元，被動收入 +${card.monthlyReturn?.toLocaleString()}/月，精力 -${card.energyCost})\n` +
                `2️⃣ 兌換精力 ($${card.exchangeCost?.toLocaleString()} 元兌換 ${card.exchangeEnergy} 精力)\n` +
                `3️⃣ 取消操作`;
            
            ws.send(JSON.stringify({
                type: 'food_delivery_menu',
                cardId: card.id,
                cardName: card.name,
                menuMessage: menuMessage,
                investmentCost: card.investmentCost,
                monthlyReturn: card.monthlyReturn,
                energyCost: card.energyCost,
                exchangeCost: card.exchangeCost,
                exchangeEnergy: card.exchangeEnergy
            }));
            return;
        }
        
        if (userAction === 'invest') {
            // 投资开店
            const investmentCost = card.investmentCost || 100000;
            const energyCost = card.energyCost || 3;
            
            if (player.gameState.cash < investmentCost) {
                resultMessage = `❌ 现金不足 ${investmentCost.toLocaleString()} 元，无法开设外賣店`;
                ws.send(JSON.stringify({
                    type: 'card_decision_result', execute: false, message: resultMessage,
                    gameState: player.gameState, cardName: card.name, effectMessage: ""
                }));
                room.pendingEvents.delete(ws);
                return;
            }
            
            if (player.gameState.energy < energyCost) {
                resultMessage = `❌ 精力不足 ${energyCost} 点，无法开设外賣店`;
                ws.send(JSON.stringify({
                    type: 'card_decision_result', execute: false, message: resultMessage,
                    gameState: player.gameState, cardName: card.name, effectMessage: ""
                }));
                room.pendingEvents.delete(ws);
                return;
            }
            
            effectResult = card.effect(player.gameState, 'invest');
            resultMessage = `✨ 执行「${card.name}」成功！${effectResult}`;
            
            const cashChange = player.gameState.cash - stateBefore.cash;
            addTransactionRecord(
                player.playerName, card, '投资开店', cashChange, effectResult, stateBefore, player.gameState
            );
            
        } else if (userAction === 'exchange') {
            // 兑换精力
            const exchangeCost = card.exchangeCost || 50000;
            const exchangeEnergy = card.exchangeEnergy || 10;
            let exchangeUnits = data.units || 1;
            
            const totalCost = exchangeUnits * exchangeCost;
            const totalEnergy = exchangeUnits * exchangeEnergy;
            
            if (player.gameState.cash < totalCost) {
                resultMessage = `❌ 现金不足 ${totalCost.toLocaleString()} 元，无法兑换 ${totalEnergy} 精力`;
                ws.send(JSON.stringify({
                    type: 'card_decision_result', execute: false, message: resultMessage,
                    gameState: player.gameState, cardName: card.name, effectMessage: ""
                }));
                room.pendingEvents.delete(ws);
                return;
            }
            
            effectResult = card.effect(player.gameState, 'exchange', exchangeUnits);
            resultMessage = `✨ 执行「${card.name}」兑换功能成功！${effectResult}`;
            
            const cashChange = player.gameState.cash - stateBefore.cash;
            addTransactionRecord(
                player.playerName, card, `兑换${totalEnergy}精力`, cashChange, effectResult, stateBefore, player.gameState
            );
            
        } else {
            resultMessage = `❌ 无效的操作，已取消执行「${card.name}」`;
            ws.send(JSON.stringify({
                type: 'card_decision_result', execute: false, message: resultMessage,
                gameState: player.gameState, cardName: card.name, effectMessage: ""
            }));
            room.pendingEvents.delete(ws);
            return;
        }
        }
        
        // ==================== 股票卡片处理 (F06-F17) ====================
        else if (isStockCard && card.getCurrentPrice && card.buy && card.sell) {
            console.log(`📊 处理股票卡片: ${card.id} - ${card.name}, action: ${stockAction}`);
            
            // 如果没有指定买卖操作，显示菜单
            if (!stockAction) {
                const currentPrice = card.getCurrentPrice(player.gameState);
                const holding = card.getHoldingsInfo ? card.getHoldingsInfo(player.gameState) : null;
                let menuMessage = `📊 ${card.name} (${card.stockCode || card.code})\n`;
                menuMessage += `當前股價: $${currentPrice}/股\n`;
                menuMessage += `價格範圍: $${card.priceRange?.min || 1} - $${card.priceRange?.max || 100}/股\n`;
                menuMessage += `最小交易: ${card.minShares || 100}股 (${card.shareMultiple || 100}股的倍數)\n\n`;
                
                if (holding && holding.shares > 0) {
                    menuMessage += `📈 持仓信息:\n`;
                    menuMessage += `  持有股數: ${holding.shares}股\n`;
                    menuMessage += `  平均成本: $${holding.avgCost?.toFixed(2)}/股\n`;
                    menuMessage += `  持倉市值: $${holding.currentValue?.toLocaleString()} 元\n`;
                    menuMessage += `  盈虧: ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()} 元\n\n`;
                    menuMessage += `1️⃣ 買入股票\n2️⃣ 賣出股票\n3️⃣ 取消操作`;
                } else {
                    menuMessage += `1️⃣ 買入股票\n2️⃣ 取消操作`;
                }
                
                ws.send(JSON.stringify({
                    type: 'stock_menu',
                    cardId: card.id,
                    cardName: card.name,
                    menuMessage: menuMessage,
                    holding: holding,
                    currentPrice: currentPrice,
                    minShares: card.minShares || 100,
                    shareMultiple: card.shareMultiple || 100
                }));
                return;
            }
            
            // 处理买入
            if (stockAction === 'buy') {
                const minShares = card.minShares || 100;
                const shareMultiple = card.shareMultiple || 100;
                
                if (!shares || shares < minShares || shares % shareMultiple !== 0) {
                    resultMessage = `❌ 股数必须是 ${minShares} 的倍数`;
                    ws.send(JSON.stringify({
                        type: 'card_decision_result', execute: false, message: resultMessage,
                        gameState: player.gameState, cardName: card.name, effectMessage: ""
                    }));
                    room.pendingEvents.delete(ws);
                    return;
                }
                
                const currentPrice = card.getCurrentPrice(player.gameState);
                const totalCost = shares * currentPrice;
                
                if (player.gameState.cash < totalCost) {
                    resultMessage = `❌ 现金不足 ${totalCost.toLocaleString()} 元`;
                    ws.send(JSON.stringify({
                        type: 'card_decision_result', execute: false, message: resultMessage,
                        gameState: player.gameState, cardName: card.name, effectMessage: ""
                    }));
                    room.pendingEvents.delete(ws);
                    return;
                }
                
                const buyResult = card.buy(player.gameState, shares);
                effectResult = buyResult.message;
                resultMessage = `✨ ${effectResult}`;
                
                addTransactionRecord(
                    player.playerName, card, `买入 ${shares} 股 @ $${currentPrice}/股`,
                    -totalCost, effectResult, stateBefore, player.gameState
                );
                console.log(`📝 股票买入记录: ${player.playerName} 买入 ${shares} 股 ${card.name}, 花费: ${totalCost}`);
            }
            // 处理卖出
            else if (stockAction === 'sell') {
                const minShares = card.minShares || 100;
                const shareMultiple = card.shareMultiple || 100;
                const holding = card.getHoldingsInfo ? card.getHoldingsInfo(player.gameState) : null;
                
                if (!holding || holding.shares < shares) {
                    resultMessage = `❌ 持股不足，当前持有 ${holding?.shares || 0} 股`;
                    ws.send(JSON.stringify({
                        type: 'card_decision_result', execute: false, message: resultMessage,
                        gameState: player.gameState, cardName: card.name, effectMessage: ""
                    }));
                    room.pendingEvents.delete(ws);
                    return;
                }
                
                if (!shares || shares < minShares || shares % shareMultiple !== 0) {
                    resultMessage = `❌ 股数必须是 ${minShares} 的倍数`;
                    ws.send(JSON.stringify({
                        type: 'card_decision_result', execute: false, message: resultMessage,
                        gameState: player.gameState, cardName: card.name, effectMessage: ""
                    }));
                    room.pendingEvents.delete(ws);
                    return;
                }
                
                const currentPrice = card.getCurrentPrice(player.gameState);
                const totalRevenue = shares * currentPrice;
                
                const sellResult = card.sell(player.gameState, shares);
                effectResult = sellResult.message;
                resultMessage = `✨ ${effectResult}`;
                
                addTransactionRecord(
                    player.playerName, card, `卖出 ${shares} 股 @ $${currentPrice}/股`,
                    totalRevenue, effectResult, stateBefore, player.gameState
                );
                console.log(`📝 股票卖出记录: ${player.playerName} 卖出 ${shares} 股 ${card.name}, 获得: ${totalRevenue}`);
            }
        }
        
        // ==================== 加密货币卡片处理 (F03, F04) ====================
        else if (isCryptoCard && card.getCurrentPrice && card.buy && card.sell) {
            console.log(`🪙 处理加密货币卡片: ${card.id} - ${card.name}, action: ${cryptoAction}`);
            
            if (!cryptoAction) {
                const currentPrice = card.getCurrentPrice(player.gameState);
                const holding = card.getHoldingsInfo ? card.getHoldingsInfo(player.gameState) : null;
                let menuMessage = `🪙 ${card.name}\n`;
                menuMessage += `當前價格: $${currentPrice}/顆\n`;
                menuMessage += `最小交易: ${card.minUnits || 1}顆\n`;
                menuMessage += `⚠️ 高風險投資 ⚠️\n\n`;
                
                if (holding && holding.units > 0) {
                    menuMessage += `📈 持仓信息:\n`;
                    menuMessage += `  持有數量: ${holding.units}顆\n`;
                    menuMessage += `  平均成本: $${holding.averagePrice?.toFixed(4)}/顆\n`;
                    menuMessage += `  持倉市值: $${holding.currentValue?.toLocaleString()} 元\n`;
                    menuMessage += `  盈虧: ${holding.profit >= 0 ? '+' : ''}${holding.profit?.toLocaleString()} 元\n\n`;
                    menuMessage += `1️⃣ 買入\n2️⃣ 賣出\n3️⃣ 取消`;
                } else {
                    menuMessage += `1️⃣ 買入\n2️⃣ 取消`;
                }
                
                ws.send(JSON.stringify({
                    type: 'crypto_menu',
                    cardId: card.id,
                    cardName: card.name,
                    menuMessage: menuMessage,
                    holding: holding,
                    currentPrice: currentPrice,
                    minUnits: card.minUnits || 1,
                    cryptoCode: card.cryptoCode || 'C01'
                }));
                return;
            }
            
            if (cryptoAction === 'buy') {
                const minUnits = card.minUnits || 1;
                if (!units || units < minUnits) {
                    resultMessage = `❌ 购买数量必须至少 ${minUnits} 颗`;
                    ws.send(JSON.stringify({
                        type: 'card_decision_result', execute: false, message: resultMessage,
                        gameState: player.gameState, cardName: card.name, effectMessage: ""
                    }));
                    room.pendingEvents.delete(ws);
                    return;
                }
                
                const currentPrice = card.getCurrentPrice(player.gameState);
                const totalCost = units * currentPrice;
                
                if (player.gameState.cash < totalCost) {
                    resultMessage = `❌ 现金不足 ${totalCost.toLocaleString()} 元`;
                    ws.send(JSON.stringify({
                        type: 'card_decision_result', execute: false, message: resultMessage,
                        gameState: player.gameState, cardName: card.name, effectMessage: ""
                    }));
                    room.pendingEvents.delete(ws);
                    return;
                }
                
                const buyResult = card.buy(player.gameState, units);
                effectResult = buyResult.message;
                resultMessage = `✨ ${effectResult}`;
                
                addTransactionRecord(
                    player.playerName, card, `买入 ${units} 颗 @ $${currentPrice}/颗`,
                    -totalCost, effectResult, stateBefore, player.gameState
                );
                
            } else if (cryptoAction === 'sell') {
                const minUnits = card.minUnits || 1;
                const holding = card.getHoldingsInfo(player.gameState);
                
                if (!holding || holding.units < units) {
                    resultMessage = `❌ 持仓不足，当前持有 ${holding?.units || 0} 颗`;
                    ws.send(JSON.stringify({
                        type: 'card_decision_result', execute: false, message: resultMessage,
                        gameState: player.gameState, cardName: card.name, effectMessage: ""
                    }));
                    room.pendingEvents.delete(ws);
                    return;
                }
                
                if (!units || units < minUnits) {
                    resultMessage = `❌ 卖出数量必须至少 ${minUnits} 颗`;
                    ws.send(JSON.stringify({
                        type: 'card_decision_result', execute: false, message: resultMessage,
                        gameState: player.gameState, cardName: card.name, effectMessage: ""
                    }));
                    room.pendingEvents.delete(ws);
                    return;
                }
                
                const currentPrice = card.getCurrentPrice(player.gameState);
                const totalRevenue = units * currentPrice;
                
                const sellResult = card.sell(player.gameState, units);
                effectResult = sellResult.message;
                resultMessage = `✨ ${effectResult}`;
                
                addTransactionRecord(
                    player.playerName, card, `卖出 ${units} 颗 @ $${currentPrice}/颗`,
                    totalRevenue, effectResult, stateBefore, player.gameState
                );
            }
        }
        
        // ==================== 基金卡片处理 (F02) ====================
        else if (isFundCard && card.pricePerUnit && card.monthlyReturn > 0) {
            console.log(`📊 处理基金卡片: ${card.id} - ${card.name}`);
            let fundUnits = data.units || card.minUnits || 1;
            const totalCost = fundUnits * card.pricePerUnit;
            
            if (player.gameState.cash < totalCost) {
                resultMessage = `❌ 现金不足 ${totalCost.toLocaleString()} 元`;
                ws.send(JSON.stringify({
                    type: 'card_decision_result', execute: false, message: resultMessage,
                    gameState: player.gameState, cardName: card.name, effectMessage: ""
                }));
                room.pendingEvents.delete(ws);
                return;
            }
            
            effectResult = card.effect(player.gameState, fundUnits);
            resultMessage = `✨ 执行「${card.name}」成功！${effectResult}`;
            
            addTransactionRecord(
                player.playerName, card, `购买 ${fundUnits} 份 @ $${card.pricePerUnit}/份`,
                -totalCost, effectResult, stateBefore, player.gameState
            );
        }
        
        // ==================== P2P借贷卡片处理 (F05) ====================
        else if (isP2PCard && card.pricePerUnit) {
            console.log(`📊 处理P2P卡片: ${card.id} - ${card.name}`);
            let p2pUnits = data.units || 100;
            const totalCost = p2pUnits * card.pricePerUnit;
            
            if (player.gameState.cash < totalCost) {
                resultMessage = `❌ 现金不足 ${totalCost.toLocaleString()} 元`;
                ws.send(JSON.stringify({
                    type: 'card_decision_result', execute: false, message: resultMessage,
                    gameState: player.gameState, cardName: card.name, effectMessage: ""
                }));
                room.pendingEvents.delete(ws);
                return;
            }
            
            effectResult = card.effect(player.gameState, p2pUnits);
            resultMessage = `✨ 执行「${card.name}」成功！${effectResult}`;
            
            addTransactionRecord(
                player.playerName, card, `购买 ${p2pUnits} 股 @ $${card.pricePerUnit}/股`,
                -totalCost, effectResult, stateBefore, player.gameState
            );
        }
        
        // ==================== 普通卡片处理 (兼职/创业/地产) ====================
        else {
            console.log(`📝 处理普通卡片: ${card.id} - ${card.name}`);
            console.log(`   - 卡片类型属性: type=${card.type}, category=${card.category}, cardType=${card.cardType}`);
            
            // 确保卡片类型正确设置（重要！）
            if (!card.cardType) {
                if (card.id && (card.id.startsWith('C') || card.id.startsWith('bus'))) {
                    card.cardType = 'business';
                    console.log(`   - 设置 cardType = business (基于ID)`);
                } else if (card.type === 'business') {
                    card.cardType = 'business';
                    console.log(`   - 设置 cardType = business (基于type)`);
                } else if (card.category === '创业') {
                    card.cardType = 'business';
                    console.log(`   - 设置 cardType = business (基于category)`);
                } else if (card.id && card.id.startsWith('Z')) {
                    card.cardType = 'part_time';
                } else if (card.id && card.id.startsWith('F')) {
                    card.cardType = 'finance';
                } else if (card.id && card.id.startsWith('pro')) {
                    card.cardType = 'property';
                }
            }
            
            const investmentCost = card.investmentCost || 0;
            console.log(`   - 投资成本: ${investmentCost}, 当前现金: ${player.gameState.cash}`);
            
            if (investmentCost > 0 && player.gameState.cash < investmentCost) {
                resultMessage = `❌ 现金不足 ${investmentCost.toLocaleString()} 元，无法执行「${card.name}」`;
                ws.send(JSON.stringify({
                    type: 'card_decision_result', execute: false, message: resultMessage,
                    gameState: player.gameState, cardName: card.name, effectMessage: ""
                }));
                room.pendingEvents.delete(ws);
                return;
            }
            
            const energyCost = card.energyCost || 0;
            if (energyCost > 0 && player.gameState.energy < energyCost) {
                resultMessage = `❌ 精力不足 ${energyCost} 点，无法执行「${card.name}」`;
                ws.send(JSON.stringify({
                    type: 'card_decision_result', execute: false, message: resultMessage,
                    gameState: player.gameState, cardName: card.name, effectMessage: ""
                }));
                room.pendingEvents.delete(ws);
                return;
            }
            
            // 执行卡片效果
            effectResult = card.effect(player.gameState);
            resultMessage = `✨ 执行「${card.name}」成功！${effectResult}`;
            
            // 计算现金变化
            const cashChange = player.gameState.cash - stateBefore.cash;
            console.log(`   - 现金变化: ${cashChange}`);
            console.log(`   - 准备调用 addTransactionRecord...`);
            
            // ========== 关键：添加交易记录 ==========
            addTransactionRecord(
                player.playerName, card, '执行', cashChange, effectResult, stateBefore, player.gameState
            );
            
            console.log(`   ✅ 交易记录已添加，卡片类型: ${card.cardType}`);
        }
        
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
        
        addTransactionRecord(
            player.playerName, card, '放弃', -500, '放弃执行，500元不退还', stateBefore, player.gameState
        );
        
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
        message: '🍀 你使用了一个四叶草！下一次掷骰步数将 x2 倍！',
        fourLeafClover: player.gameState.fourLeafClover,
        gameState: player.gameState
    }));
    
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `${player.playerName} 使用了一个四叶草！下一次掷骰步数将 x2 倍！`
    }, ws);
    
    console.log(`🍀 玩家 ${player.playerName} 使用了四叶草，剩余: ${player.gameState.fourLeafClover}`);
}

// ==================== 幸运星处理 ====================

function handleUseLuckyStar(ws, data, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const player = room.players.get(ws);
    if (!player) return;
    
    const luckyStarCount = player.gameState.luckyStarCount || 0;
    if (luckyStarCount === 0) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '没有幸运星可用'
        }));
        return;
    }
    
    player.gameState.luckyStarCount--;
    player.gameState.diceMultiplier = 3;
    player.gameState.diceMultiplierActive = true;
    
    ws.send(JSON.stringify({
        type: 'lucky_star_used',
        message: `⭐ 你使用了一颗幸运星！剩余 ${player.gameState.luckyStarCount} 颗！下一次掷骰步数将 x3 倍！`,
        luckyStarCount: player.gameState.luckyStarCount,
        gameState: player.gameState
    }));
    
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `${player.playerName} 使用了一颗幸运星！剩余 ${player.gameState.luckyStarCount} 颗！`
    }, ws);
    
    console.log(`⭐ 玩家 ${player.playerName} 使用了幸运星，剩余: ${player.gameState.luckyStarCount}`);
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
        fourLeafClover: 0,
        luckyStarCount: 0,
        diceMultiplier: 0,
        diceMultiplierActive: false,
        totalSettlementCount: 0
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
    
    if (state.diceMultiplierActive) {
        if (state.diceMultiplier === 2) {
            steps = originalSteps * 2;
            multiplierMessage = `🍀 四叶草生效！步数 ${originalSteps} x2 = ${steps} 步！`;
        } else if (state.diceMultiplier === 3) {
            steps = originalSteps * 3;
            multiplierMessage = `⭐ 幸运星生效！步数 ${originalSteps} x3 = ${steps} 步！`;
        }
        state.diceMultiplierActive = false;
        state.diceMultiplier = 1;
        
        ws.send(JSON.stringify({
            type: 'notification',
            message: multiplierMessage
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
                
                const repaymentResult = processSettlementRepayment(player, ws, roomId);
                if (repaymentResult) {
                    ws.send(JSON.stringify(repaymentResult));
                    broadcastToRoom(roomId, repaymentResult, ws);
                }
                
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
                case 'repay_loan':
                    handleRepayLoan(ws, data, playerRoomId);
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
                case 'use_lucky_star':
                    handleUseLuckyStar(ws, data, playerRoomId);
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

// 加载历史交易记录
//loadTransactionsFromFile();

// 启动服务器
const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                         🎲 财富流沙盘 WebSocket 服务器                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   端口: ${PORT}                                                                 ║
║   地址: http://localhost:${PORT}                                               ║
║   状态: 运行中                                                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   👥 职业系统:                                                               ║
║   👨‍⚕️ 医生 | 👨‍🔧 工程师 | 👩‍🏫 教师 | 🎨 艺术家 | 🚀 创业者                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   ⭐ 幸运星系统:                                                             ║
║   • 第9格获得幸运星                                                          ║
║   • 使用后下次掷骰步数 x3 倍                                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   🍀 四叶草系统:                                                             ║
║   • 第17格获得四叶草                                                         ║
║   • 使用后下次掷骰步数 x2 倍                                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   💰 贷款系统 (10% 利息):                                                    ║
║   • 贷款金额 = 月薪+副业 x 3                                                ║
║   • 利息 = 本金 x 10%                                                       ║
║   • 本利和 = 本金 + 利息                                                    ║
║   • 有欠款时不可再次贷款                                                    ║
║   • 随时可全额还款                                                          ║
║   • 经过12次结算日未还清 → 强制扣款                                         ║
║   • 现金不足时扣除所有现金，剩余欠款继续计息                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   📅 结算日机制:                                                            ║
║   第5、13、21格 - 获得月薪+副业收入                                         ║
║   正好踩中结算日 - 额外获得一次掷骰机会                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   📚 机会卡系统:                                                            ║
║   💼 兼职类: ${partTimeCards.length} 张                                        ║
║   📈 财务类: ${financeCards.length} 张                                        ║
║   🚀 创业类: ${businessCards.length} 张                                       ║
║   🏠 地产类: ${propertyCards.length} 张                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   📝 交易记录系统:                                                          ║
║   • 自动记录所有卡片交易                                                    ║
║   • 访问 /api/transactions 查看JSON数据                                     ║
║   • 访问 /record.html 查看交易记录页面                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   🌐 访问地址: http://localhost:${PORT}                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
});