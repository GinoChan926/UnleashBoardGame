"use strict";

// ==================== 职业定义 ====================
const PROFESSIONS = {
    doctor: { name: "👨‍⚕️ 医生", salary: 15000, sideIncome: 0, cash: 20000, energy: 2, maxEnergy: 100, livingExpense: 8000, tax: 1500, luck: 5.0 },
    engineer: { name: "👨‍🔧 工程师", salary: 12000, sideIncome: 0, cash: 15000, energy: 3, maxEnergy: 100, livingExpense: 6000, tax: 1200, luck: 5.5 },
    teacher: { name: "👩‍🏫 教师", salary: 8000, sideIncome: 0, cash: 10000, energy: 5, maxEnergy: 100, livingExpense: 4500, tax: 800, luck: 6.0 },
    artist: { name: "🎨 艺术家", salary: 6000, sideIncome: 1000, cash: 8000, energy: 6, maxEnergy: 100, livingExpense: 4000, tax: 600, luck: 7.0 },
    entrepreneur: { name: "🚀 创业者", salary: 10000, sideIncome: 2000, cash: 12000, energy: 4, maxEnergy: 100, livingExpense: 7000, tax: 1300, luck: 5.8 }
};

// ==================== GameClient 类 ====================
class GameClient {
    constructor() {
        this.ws = null;
        this.playerId = '';
        this.playerName = '';
        this.selectedProfession = null;
        this.gameState = null;
        this.otherPlayers = new Map();
        this.isConnected = false;
        this.waitingForAction = false;
        this.currentEvent = null;
        this.musicEndedHandled = false;
        this.gameOver = false;
        
        this.streamlineTiles = [
            { name: "義工卡", type: "volunteer" },
            { name: "騙子卡", type: "lier" },
            { name: "察覺卡", type: "awareness" },
            { name: "機會卡", type: "opportunity" },
            { name: "結算日", type: "settlement" },
            { name: "機會卡", type: "opportunity" },
            { name: "孩子出生", type: "event" },
            { name: "機會卡", type: "opportunity" },
            { name: "幸運星", type: "lucky_star" },
            { name: "機會卡", type: "opportunity" },
            { name: "察覺卡", type: "awareness" },
            { name: "機會卡", type: "opportunity" },
            { name: "結算日", type: "settlement" },
            { name: "警察卡", type: "police" }, 
            { name: "察覺卡", type: "awareness" },
            { name: "機會卡", type: "opportunity" },
            { name: "四葉草", type: "four_leaf_clover" },
            { name: "機會卡", type: "opportunity" },
            { name: "市場轉機", type: "market" },
            { name: "機會卡", type: "opportunity" },
            { name: "結算日", type: "settlement" },
            { name: "機會卡", type: "opportunity" },
            { name: "察覺卡", type: "awareness" },
            { name: "機會卡", type: "opportunity" }
    
        ];
        
        this.reverseTiles = [
            { name: "奇蹟", type: "miracle" }, { name: "逆境自強", type: "hardship" }, { name: "覺察卡", type: "awareness" },
            { name: "失業危機", type: "unemployment" }, { name: "逆境自強", type: "hardship" }, { name: "破產重組", type: "bankruptcy" },
            { name: "浴火重生", type: "recovery" }, { name: "逆境自強", type: "hardship" }, { name: "覺察卡", type: "awareness" }
        ];
        
        this.flowTiles = [
            { name: "查稅審計", type: "audit" }, { name: "古董投資", type: "investment" }, { name: "藝術基金", type: "investment" },
            { name: "度假莊園", type: "investment" }, { name: "私人飛機", type: "dream", needEnergy: 40 }, { name: "破產陷阱", type: "flowbankruptcy" },
            { name: "環球旅遊", type: "dream", needEnergy: 45 }, { name: "慈善基金會", type: "investment" }, { name: "隱形俱樂部", type: "investment" },
            { name: "智庫董事", type: "investment" }, { name: "終極夢想", type: "dream", needEnergy: 50 }, { name: "財務自由", type: "dream", needEnergy: 35 },
            { name: "豪華別墅", type: "dream", needEnergy: 45 }, { name: "私人遊艇", type: "investment" }, { name: "頂級收藏", type: "investment" },
            { name: "高級俱樂部", type: "investment" }, { name: "家族基金", type: "investment" }, { name: "國際投資", type: "investment" },
            { name: "房地產帝國", type: "investment" }, { name: "能源項目", type: "investment" }, { name: "科技股票", type: "investment" },
            { name: "貴金屬投資", type: "investment" }, { name: "珍稀物業", type: "investment" }, { name: "商業帝國", type: "investment" },
            { name: "董事會席位", type: "investment" }, { name: "慈善榮譽", type: "grace" }, { name: "年度評選", type: "event" },
            { name: "財富峰會", type: "event" }, { name: "投資分紅", type: "income" }, { name: "版稅收入", type: "income" },
            { name: "顧問費用", type: "income" }, { name: "終極成就", type: "dream", needEnergy: 60 }
        ];
        
        this.setupMusicMonitor();
        this.setupProfessionModal();
        this.setupCardTypeModal();
        this.setupPurchaseConfirmModal();
        this.setupEffectConfirmModal();
        this.setupVolunteerCardModal();
        this.setupNotificationContainer();
        this.bindGlobalEvents();
        
        console.log('🎮 GameClient 初始化完成，职业系统已加载');
    }
    
    bindGlobalEvents() {
        window.gameClient = this;
        
        const connectBtn = document.getElementById('btnConnect');
        const rollBtn = document.getElementById('btnRoll');
        const endTurnBtn = document.getElementById('btnEndTurn');
        const loanBtn = document.getElementById('btnLoan');
        const repayBtn = document.getElementById('btnRepayLoan');
        const disconnectBtn = document.getElementById('btnDisconnect');
        const useCloverBtn = document.getElementById('btnUseClover');
        const useLuckyStarBtn = document.getElementById('btnUseLuckyStar');
        
        if (connectBtn) connectBtn.onclick = () => this.showProfessionModal();
        if (rollBtn) rollBtn.onclick = () => this.rollDice();
        if (endTurnBtn) endTurnBtn.onclick = () => this.endTurn();
        if (loanBtn) loanBtn.onclick = () => this.applyLoan();
        if (repayBtn) repayBtn.onclick = () => this.repayLoan();
        if (disconnectBtn) disconnectBtn.onclick = () => this.disconnect();
        if (useCloverBtn) useCloverBtn.onclick = () => this.useFourLeafClover();
        if (useLuckyStarBtn) useLuckyStarBtn.onclick = () => this.useLuckyStar();
        
        console.log('✅ 全局事件绑定完成');
    }
    
    setupNotificationContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 350px;`;
            document.body.appendChild(container);
        }
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const colors = { success: '#4caf50', error: '#f44336', info: '#2196f3', warning: '#ff9800' };
        const notification = document.createElement('div');
        notification.style.cssText = `background: ${colors[type]}; color: white; padding: 12px 20px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease; font-size: 14px; cursor: pointer;`;
        notification.textContent = message;
        notification.onclick = () => notification.remove();
        container.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
    
    getButton(id) { return document.getElementById(id); }
    getInput(id) { return document.getElementById(id); }
    getElement(id) { return document.getElementById(id); }
    
    escapeHtml(str) {
    // 确保 str 是字符串
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
     // ==================== 物業模态框 ====================
    showPropertySellChoices(message) {
        const { playersToAsk, cardId, cardName, marketPrice } = message;
        
        // 检查当前玩家是否有相关物業
        const currentPlayerProperty = playersToAsk ? playersToAsk.find(p => p.playerName === this.gameState?.playerName) : null;
        if (!currentPlayerProperty) {
            this.addLog(`🏠 ${cardName}：你沒有持有香港中西區住宅物業，無需操作`, 'info');
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'market_news_response',
                    playerChoices: {},
                    cardId: cardId
                }));
            }
            return;
        }
        
        const property = currentPlayerProperty.property;
        const profit = property.profit;
        
        const userChoice = confirm(
            `🏠 ${cardName}\n\n` +
            `市場正在求購香港中西區住宅物業！\n\n` +
            `市場價格：$${marketPrice.toLocaleString()} 元\n` +
            `你的物業：${property.name}\n` +
            `按揭貸款：$${property.mortgageAmount.toLocaleString()} 元\n` +
            `你可獲得：$${profit.toLocaleString()} 元\n\n` +
            `按下「確定」出售物業，按下「取消」保留。\n\n` +
            `出售後你將獲得：\n` +
            `   • 現金 $${profit.toLocaleString()} 元\n` +
            `   • 幸運值 +1`
        );
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'market_news_response',
                playerChoices: { [this.gameState.playerName]: userChoice },
                cardId: cardId
            }));
        }
    }

    // ==================== 职业选择模态框 ====================
    
    setupProfessionModal() {
        let modal = document.getElementById('professionModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'professionModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px; background: linear-gradient(135deg, #1a2a3a, #0d1b2a); border-radius: 28px;">
                    <div class="modal-title" style="text-align: center; color: #ffd966; font-size: 26px; margin-bottom: 20px;">🎭 选择你的职业</div>
                    <div class="modal-body" id="professionBody" style="text-align: center;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; padding: 16px;" id="professionButtons"></div>
                    </div>
                    <div class="modal-buttons" style="justify-content: center; margin: 10px 0 5px 0;">
                        <button class="btn-secondary" id="cancelProfessionBtn" style="background: #9e9e9e; padding: 10px 32px; border-radius: 30px; cursor: pointer;">取消</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            console.log('✅ 职业选择模态框已创建');
        }
    }
    
    showProfessionModal() {
        console.log('🎭 显示职业选择窗口');
        
        if (this.checkMusicAndGameOver()) return;
        
        const modal = document.getElementById('professionModal');
        const buttonsContainer = document.getElementById('professionButtons');
        const cancelBtn = document.getElementById('cancelProfessionBtn');
        
        if (!modal) {
            console.error('❌ 职业选择模态框不存在');
            this.setupProfessionModal();
            return;
        }
        
        if (!buttonsContainer) {
            console.error('❌ 按钮容器不存在');
            return;
        }
        
        buttonsContainer.innerHTML = '';
        
        for (const [id, prof] of Object.entries(PROFESSIONS)) {
            const card = document.createElement('div');
            card.style.cssText = `
                cursor: pointer;
                transition: all 0.3s ease;
                background: linear-gradient(135deg, #2a3a2a, #1a2a1a);
                border-radius: 20px;
                padding: 16px;
                text-align: left;
                border: 2px solid #ffb347;
                box-shadow: 0 6px 14px rgba(0,0,0,0.3);
            `;
            
            const monthlyCF = prof.salary + prof.sideIncome - (prof.livingExpense + prof.tax);
            
            card.innerHTML = `
                <div style="font-size: 18px; font-weight: bold; color: #ffd966; margin-bottom: 12px;">${prof.name}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                    <div>💰 起始现金: ${prof.cash.toLocaleString()}</div>
                    <div>💼 月薪: ${prof.salary.toLocaleString()}</div>
                    <div>💪 副业: ${prof.sideIncome.toLocaleString()}</div>
                    <div>⚡ 精力: ${prof.energy}/${prof.maxEnergy}</div>
                    <div>🏠 生活支出: ${prof.livingExpense.toLocaleString()}</div>
                    <div>📑 税务: ${prof.tax.toLocaleString()}</div>
                    <div>🔄 月现金流: ${monthlyCF >= 0 ? '+' : ''}${monthlyCF.toLocaleString()}</div>
                    <div>🍀 幸运值: ${prof.luck}</div>
                </div>
            `;
            
            card.onmouseenter = () => { card.style.transform = 'scale(1.02)'; card.style.boxShadow = '0 10px 22px rgba(0,0,0,0.4)'; };
            card.onmouseleave = () => { card.style.transform = 'scale(1)'; card.style.boxShadow = '0 6px 14px rgba(0,0,0,0.3)'; };
            card.onclick = () => {
                console.log(`✅ 选择了职业: ${prof.name}`);
                this.selectedProfession = { id, data: prof };
                this.doConnect();
                this.closeProfessionModal();
            };
            
            buttonsContainer.appendChild(card);
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                console.log('❌ 取消职业选择');
                this.closeProfessionModal();
            };
        }
        
        modal.classList.add('show');
        console.log('🎭 职业选择窗口已显示');
    }
    
    closeProfessionModal() {
        const modal = document.getElementById('professionModal');
        if (modal) modal.classList.remove('show');
    }
    
    connect() {
        console.log('🔌 连接按钮被点击，显示职业选择');
        this.showProfessionModal();
    }
    
    doConnect() {
        const playerNameInput = this.getInput('playerName');
        this.playerName = playerNameInput?.value.trim() || `Player_${Date.now()}`;
        
        if (!this.selectedProfession) {
            this.showNotification('请先选择职业', 'error');
            return;
        }
        
        console.log(`🔌 开始连接服务器，职业: ${this.selectedProfession.data.name}`);
        
        this.ws = new WebSocket('ws://localhost:8080');
        
        this.ws.onopen = () => {
            this.isConnected = true;
            this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            this.updateNetworkStatus(true);
            
            const joinMessage = {
                type: 'join',
                playerId: this.playerId,
                playerName: this.playerName,
                profession: this.selectedProfession.id,
                professionData: this.selectedProfession.data
            };
            
            this.ws.send(JSON.stringify(joinMessage));
            this.addLog(`✅ 已连接到游戏服务器`, 'success');
            this.addLog(`👤 玩家: ${this.playerName} (${this.selectedProfession.data.name})`, 'event');
            this.showNotification(`欢迎 ${this.playerName} 加入游戏！`, 'success');
        };
        
        this.ws.onmessage = (event) => {
            this.handleServerMessage(JSON.parse(event.data));
        };
        
        this.ws.onclose = () => {
            this.isConnected = false;
            this.updateNetworkStatus(false);
            this.addLog('❌ 与服务器连接已断开', 'error');
            this.disableGameControls();
            this.showNotification('连接已断开', 'error');
        };
        
        this.ws.onerror = (error) => {
            this.addLog('⚠️ 连接错误，请确认服务器已启动', 'error');
            console.error('WebSocket error:', error);
            this.showNotification('连接失败，请确保服务器正在运行', 'error');
        };
    }
    
    rollDice() {
        if (this.checkMusicAndGameOver()) return;
        if (!this.isConnected || !this.gameState || this.gameState.energy === 0 || this.gameOver) {
            this.addLog('❌ 无法掷骰', 'error');
            return;
        }
        this.ws.send(JSON.stringify({ type: 'roll', playerId: this.playerId, data: { diceCount: 1 } }));
    }
    
    endTurn() {
        if (this.checkMusicAndGameOver()) return;
        if (!this.isConnected || this.gameOver) return;
        this.ws.send(JSON.stringify({ type: 'end_turn', playerId: this.playerId }));
    }
    
    applyLoan() {
        if (this.checkMusicAndGameOver()) return;
        if (!this.isConnected || !this.gameState || this.gameOver) return;
        
        if (this.gameState.loanAmount > 0) {
            this.addLog(`❌ 你还有 ${this.gameState.loanAmount.toLocaleString()} 元贷款未还清，请先还清贷款再申请新贷款！`, 'error');
            this.showNotification('请先还清当前贷款', 'error');
            return;
        }
        
        const maxLoan = Math.round((this.gameState.salary + this.gameState.sideIncome) * 3);
        const interest = Math.round(maxLoan * 0.1);
        const totalRepay = maxLoan + interest;
        
        const message = `📋 贷款信息:\n\n💰 贷款上限: ${maxLoan.toLocaleString()} 元\n📈 利息: 10%\n💰 需还本利和: ${totalRepay.toLocaleString()} 元\n\n⚠️ 重要提示:\n• 贷款后不可再次贷款直到还清\n• 经过12次结算日未还清将强制扣款\n• 利息按总本金10%计算\n\n请输入贷款金额:`;
        
        const amount = parseInt(prompt(message) || '0');
        if (amount > 0 && amount <= maxLoan) {
            const confirmMsg = `确认贷款 ${amount.toLocaleString()} 元？\n需还本利和: ${(amount + Math.round(amount * 0.1)).toLocaleString()} 元`;
            if (confirm(confirmMsg)) {
                this.ws.send(JSON.stringify({ type: 'apply_loan', playerId: this.playerId, data: { amount } }));
            }
        } else if (amount > 0) {
            this.addLog(`❌ 贷款金额超过上限 (${maxLoan.toLocaleString()} 元)`, 'error');
        }
    }
    
    repayLoan() {
        if (this.checkMusicAndGameOver()) return;
        if (!this.isConnected || !this.gameState || this.gameOver) return;
        
        const loanAmount = this.gameState.loanAmount;
        if (loanAmount === 0) {
            this.addLog('💰 没有未偿还的贷款', 'warning');
            this.showNotification('没有未偿还的贷款', 'info');
            return;
        }
        
        const totalToRepay = loanAmount + Math.round(loanAmount * 0.1);
        const message = `📋 贷款详情:\n\n本金: ${loanAmount.toLocaleString()} 元\n10% 利息: ${Math.round(loanAmount * 0.1).toLocaleString()} 元\n━━━━━━━━━━━━━━\n总计需还: ${totalToRepay.toLocaleString()} 元\n\n当前现金: ${this.gameState.cash.toLocaleString()} 元\n\n确认偿还贷款吗？`;
        
        if (confirm(message)) {
            this.ws.send(JSON.stringify({ type: 'repay_loan', playerId: this.playerId }));
        }
    }
    
    useFourLeafClover() {
        if (this.checkMusicAndGameOver()) return;
        if (!this.isConnected || !this.gameState || this.gameOver) { 
            this.addLog('❌ 无法使用四叶草', 'error'); 
            return; 
        }
        const cloverCount = this.gameState.fourLeafClover || 0;
        if (cloverCount === 0) { 
            this.addLog('❌ 没有四叶草可用', 'error'); 
            return; 
        }
        this.ws.send(JSON.stringify({ type: 'use_four_leaf_clover', playerId: this.playerId }));
    }
    
    useLuckyStar() {
        if (this.checkMusicAndGameOver()) return;
        if (!this.isConnected || !this.gameState || this.gameOver) { 
            this.addLog('❌ 无法使用幸运星', 'error'); 
            return; 
        }
        const luckyStarCount = this.gameState.luckyStarCount || 0;
        if (luckyStarCount === 0) { 
            this.addLog('❌ 没有幸运星可用', 'error'); 
            return; 
        }
        this.ws.send(JSON.stringify({ type: 'use_lucky_star', playerId: this.playerId }));
    }
    
    disconnect() { if (this.ws) this.ws.close(); }
    
    addLog(msg, type = 'default') {
        const logDiv = this.getElement('logContainer');
        if (!logDiv) return;
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const timestamp = new Date().toLocaleTimeString();
        entry.innerText = `[${timestamp}] ${msg}`;
        if (type === 'success') entry.style.color = '#4caf50';
        else if (type === 'error') entry.style.color = '#ff6b6b';
        else if (type === 'event') entry.style.color = '#ffb347';
        else if (type === 'warning') entry.style.color = '#ff9800';
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;
        while (logDiv.children.length > 80) logDiv.removeChild(logDiv.firstChild);
    }
    
    // ==================== 卡片类型选择模态框 ====================
    setupCardTypeModal() {
        let modal = document.getElementById('cardTypeModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cardTypeModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 560px; background: linear-gradient(135deg, #1a472a, #0d2b1a); border-radius: 28px; padding: 20px;">
                    <div class="modal-title" style="text-align: center; color: #ffd966; font-size: 22px; margin-bottom: 16px;">🎴 选择机会卡类型</div>
                    <div class="modal-body" id="cardTypeBody" style="text-align: center;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; padding: 8px;" id="cardTypeButtons"></div>
                    </div>
                    <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 12px; margin: 12px 8px; text-align: center;">
                        <span style="color: #ffd966; font-size: 13px;">💰 执行机会卡需要花费 500 元，部分机会卡还需消耗精力 ⚡</span>
                    </div>
                    <div class="modal-buttons" style="justify-content: center; margin: 10px 0 5px 0;">
                        <button class="btn-secondary" id="cancelCardTypeBtn" style="background: #9e9e9e; padding: 10px 32px; border-radius: 30px; cursor: pointer; font-size: 14px;">取消</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }
    
    showCardTypeSelection(cardTypes, canAfford) {
        const modal = document.getElementById('cardTypeModal');
        const buttonsContainer = document.getElementById('cardTypeButtons');
        const cancelBtn = document.getElementById('cancelCardTypeBtn');
        if (!modal || !buttonsContainer) return;
        buttonsContainer.innerHTML = '';
        
        const typeImages = {
            'part_time': '../cards/cover/part_time.png',
            'finance': '../cards/cover/finance.png',
            'business': '../cards/cover/business.png',
            'property': '../cards/cover/property.png'
        };
        
        const typeColors = { 'part_time': '#4caf50', 'finance': '#2196f3', 'business': '#ff9800', 'property': '#9c27b0' };
        const orderedTypes = [
            { id: 'part_time', name: '兼职类', icon: '💼', color: '#4caf50' },
            { id: 'finance', name: '财务类', icon: '📈', color: '#2196f3' },
            { id: 'business', name: '创业类', icon: '🚀', color: '#ff9800' },
            { id: 'property', name: '地产类', icon: '🏠', color: '#9c27b0' }
        ];
        
        orderedTypes.forEach(type => {
            const cardType = cardTypes.find(t => t.id === type.id);
            const count = cardType ? cardType.count : '?';
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = `cursor: pointer; transition: all 0.3s ease; text-align: center; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 14px rgba(0,0,0,0.3); background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2));`;
            const img = document.createElement('img');
            img.src = typeImages[type.id];
            img.alt = type.name;
            img.style.cssText = `width: 100%; max-width: 140px; height: auto; aspect-ratio: 1 / 1; object-fit: contain; display: block; margin: 0 auto; padding: 8px; background: rgba(30, 25, 20, 0.6); border-radius: 12px; box-sizing: border-box;`;
            img.onerror = () => { img.style.display = 'none'; const fallbackDiv = document.createElement('div'); fallbackDiv.style.cssText = `width: 100%; max-width: 140px; margin: 0 auto; aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; font-size: 48px; background: ${type.color}; border-radius: 12px;`; fallbackDiv.innerHTML = type.icon; btnContainer.insertBefore(fallbackDiv, img); };
            const label = document.createElement('div');
            label.style.cssText = `padding: 10px 6px; font-size: 14px; font-weight: bold; color: #ffd966; background: rgba(0,0,0,0.75); text-align: center;`;
            label.innerHTML = `${type.icon} ${type.name}<span style="font-size: 10px; margin-left: 6px; color: #ffaa66;">${count}张</span>`;
            btnContainer.appendChild(img);
            btnContainer.appendChild(label);
            btnContainer.onmouseenter = () => { btnContainer.style.transform = 'scale(1.03)'; };
            btnContainer.onmouseleave = () => { btnContainer.style.transform = 'scale(1)'; };
            if (!canAfford) {
                btnContainer.style.opacity = '0.55';
                btnContainer.style.cursor = 'not-allowed';
                btnContainer.title = '现金不足500元，无法执行机会卡';
            } else {
                btnContainer.onclick = () => { this.sendCardTypeChoice(type.id); this.closeCardTypeModal(); };
            }
            buttonsContainer.appendChild(btnContainer);
        });
        
        if (cancelBtn) cancelBtn.onclick = () => { this.closeCardTypeModal(); this.addLog('已取消选择机会卡', 'warning'); };
        modal.classList.add('show');
        this.waitingForAction = true;
    }
    
    closeCardTypeModal() { const modal = document.getElementById('cardTypeModal'); if (modal) modal.classList.remove('show'); this.waitingForAction = false; }
    sendCardTypeChoice(cardType) { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'card_type_choice', cardType: cardType })); }
    
    // ==================== 购买确认模态框 ====================
    
    setupPurchaseConfirmModal() {
        let modal = document.getElementById('purchaseConfirmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'purchaseConfirmModal';
            modal.className = 'modal';
            modal.innerHTML = `<div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #fff9e6, #fff3d6); border-radius: 20px;"><div class="modal-title" style="text-align: center; color: #ff9800; font-size: 24px;">💰 购买机会卡</div><div id="purchaseCardImage" style="text-align: center; margin: 15px 0;"><img id="purchaseCardImg" src="" alt="机会卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.2); border: 3px solid #ffb347;"></div><div class="modal-body" id="purchaseModalBody" style="font-size: 16px; line-height: 1.5;"></div><div id="purchaseCardTypeBadge" style="text-align: center; margin: 10px 0;"><span id="purchaseCardTypeSpan" style="display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; color: white;"></span></div><div style="background: #ffecb3; padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;"><span style="font-size: 18px; font-weight: bold;">💰 购买费用: 500 元</span><span id="purchaseAffordWarning" style="color: #d32f2f; display: none; margin-left: 10px;">(现金不足)</span></div><div class="modal-buttons" style="display: flex; gap: 15px; justify-content: center;"><button class="btn-secondary" id="cancelPurchaseBtn" style="background: #9e9e9e; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">❌ 放弃购买</button><button class="btn-primary" id="confirmPurchaseBtn" style="background: #ff9800; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">💰 支付500购买</button></div></div>`;
            document.body.appendChild(modal);
        }
    }
    
    showPurchaseConfirm(card, canAfford) {
        console.log('显示购买确认:', card.name);
        const modal = document.getElementById('purchaseConfirmModal');
        const modalBody = document.getElementById('purchaseModalBody');
        const cardImage = document.getElementById('purchaseCardImg');
        const confirmBtn = document.getElementById('confirmPurchaseBtn');
        const cancelBtn = document.getElementById('cancelPurchaseBtn');
        const affordWarning = document.getElementById('purchaseAffordWarning');
        const cardTypeSpan = document.getElementById('purchaseCardTypeSpan');
        
        if (!modal || !modalBody) return;
        
        if (cardTypeSpan && card.cardTypeName) {
            const typeColors = { 'part_time': '#4caf50', 'finance': '#2196f3', 'business': '#ff9800', 'property': '#9c27b0' };
            const color = typeColors[card.cardType || ''] || '#ffb347';
            cardTypeSpan.style.backgroundColor = color;
            cardTypeSpan.innerHTML = `${card.cardTypeIcon || '🎴'} ${card.cardTypeName || '机会卡'}`;
        }
        
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #ff6f00; margin-bottom: 10px; font-size: 20px;">${this.escapeHtml(card.name || '机会卡')}</h3>
                <p style="color: #555; font-size: 14px;">${this.escapeHtml(card.description || '')}</p>
                ${card.investmentCost ? `<div style="background: #e8f5e9; padding: 8px; border-radius: 8px; margin-top: 10px;"><span style="color: #2e7d32;">💰 需要额外投资: ${card.investmentCost.toLocaleString()} 元</span></div>` : ''}
                <div style="background: #e3f2fd; padding: 10px; border-radius: 8px; margin-top: 10px;">
                    <span style="color: #1565c0;">💡 支付 500 元购买后，可查看详细效果并决定是否执行</span>
                </div>
            </div>
        `;
        
        if (cardImage && card.image) {
            let imageUrl = card.image;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            cardImage.src = imageUrl || '';
            cardImage.onload = () => console.log('购买图片加载成功');
            cardImage.onerror = () => { cardImage.style.display = 'none'; };
        }
        
        if (affordWarning) {
            affordWarning.style.display = canAfford ? 'none' : 'inline';
        }
        
        const handleConfirm = () => {
            console.log('点击购买按钮');
            this.sendPurchaseCard();
            this.closePurchaseConfirmModal();
        };
        
        const handleCancel = () => {
            this.closePurchaseConfirmModal();
            this.addLog('已放弃购买机会卡', 'warning');
        };
        
        if (confirmBtn) {
            confirmBtn.onclick = handleConfirm;
            confirmBtn.disabled = !canAfford;
            confirmBtn.style.opacity = canAfford ? '1' : '0.5';
            confirmBtn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
        }
        if (cancelBtn) cancelBtn.onclick = handleCancel;
        
        modal.classList.add('show');
        this.waitingForAction = true;
    }
    
    closePurchaseConfirmModal() { const modal = document.getElementById('purchaseConfirmModal'); if (modal) modal.classList.remove('show'); this.waitingForAction = false; }
    sendPurchaseCard() { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'purchase_card' })); }
    
    setupEffectConfirmModal() {
        let modal = document.getElementById('effectConfirmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'effectConfirmModal';
            modal.className = 'modal';
            modal.innerHTML = `<div class="modal-content" style="max-width: 550px; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 20px;"><div class="modal-title" style="text-align: center; color: #2e7d32; font-size: 24px;">✨ 卡片效果预览</div><div id="effectCardImage" style="text-align: center; margin: 15px 0;"><img id="effectCardImg" src="" alt="机会卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.2); border: 3px solid #4caf50;"></div><div id="effectCardTypeBadge" style="text-align: center; margin: 10px 0;"><span id="effectCardTypeSpan" style="display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; color: white;"></span></div><div class="modal-body" id="effectModalBody" style="font-size: 16px; line-height: 1.5;"></div><div id="effectChanges" style="background: #ffffff; padding: 15px; border-radius: 12px; margin: 15px 0; font-size: 14px;"><strong>📊 效果预览:</strong><div id="effectChangesList"></div></div><div style="background: #fff3e0; padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;"><span style="font-size: 16px; font-weight: bold;">⚠️ 注意：执行后无法撤销！</span></div><div class="modal-buttons" style="display: flex; gap: 15px; justify-content: center;"><button class="btn-secondary" id="declineExecuteBtn" style="background: #9e9e9e; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">❌ 不执行</button><button class="btn-primary" id="confirmExecuteBtn" style="background: #4caf50; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">✅ 确认执行</button></div><div style="text-align: center; margin-top: 10px; font-size: 12px; color: #666;">(已支付 500 元，不执行费用不退还)</div></div>`;
            document.body.appendChild(modal);
        }
    }
    
    showEffectConfirm(card, effectPreview) {
        console.log('显示效果预览:', card.name);
        
        // 如果是财务卡片且有价格/份额，显示购买数量输入
        if (card.type === 'finance' && card.pricePerUnit && card.monthlyReturn > 0 && card.id !== 'F06') {
            const maxUnitsByCash = Math.floor((this.gameState?.cash || 0) / card.pricePerUnit);
            const maxUnits = card.maxUnits === null ? maxUnitsByCash : Math.min(card.maxUnits, maxUnitsByCash);
            
            if (maxUnits === 0) {
                this.showNotification(`现金不足，无法购买任何份额。需要至少 ${card.pricePerUnit.toLocaleString()} 元`, 'error');
                this.sendExecuteCard(false);
                return;
            }
            
            const message = `📊 ${card.name}\n\n` +
                `基金代碼: ${card.code || card.id}\n` +
                `今日價格: ${card.pricePerUnit.toLocaleString()} 元/份\n` +
                `每月利息: +${card.monthlyReturn.toLocaleString()} 元/份\n` +
                `可購買份數: ${card.maxUnits === null ? '不限' : card.maxUnits} 份\n` +
                `最大可購買份數 (按現金): ${maxUnits} 份\n\n` +
                `請輸入購買份数 (1-${maxUnits}):`;
            
            const units = parseInt(prompt(message) || '0');
            if (units > 0 && units <= maxUnits) {
                const totalCost = units * card.pricePerUnit;
                const confirmMsg = `確認購買 ${units} 份 ${card.name}？\n` +
                    `總花費: ${totalCost.toLocaleString()} 元\n` +
                    `每月被動收入增加: +${(units * card.monthlyReturn).toLocaleString()} 元\n\n` +
                    `確認執行嗎？`;
                if (confirm(confirmMsg)) {
                    this.sendExecuteCardWithUnits(true, units);
                } else {
                    this.sendExecuteCard(false);
                }
            } else {
                this.addLog(`❌ 无效的购买数量`, 'error');
                this.sendExecuteCard(false);
            }
            return;
        }
        
        // P2P卡片处理 (F05)
        if (card.id === 'F05' && card.type === 'finance' && card.pricePerUnit) {
            const maxUnits = Math.min(1000, Math.floor((this.gameState?.cash || 0) / card.pricePerUnit));
            const maxAllowed = Math.min(1000, Math.floor(maxUnits / 100) * 100);
            
            if (maxAllowed === 0) {
                this.showNotification(`现金不足，无法购买。需要至少 ${card.pricePerUnit * 100} 元`, 'error');
                this.sendExecuteCard(false);
                return;
            }
            
            const message = `📊 ${card.name}\n\n` +
                `今日價格: ${card.pricePerUnit} 元/股\n` +
                `可購買股數: 100-1000 股 (100的倍数)\n` +
                `最大可購買: ${maxAllowed} 股\n\n` +
                `請輸入購買股數 (100, 200, 300... 最大 ${maxAllowed}):`;
            
            const units = parseInt(prompt(message) || '0');
            if (units >= 100 && units <= 1000 && units % 100 === 0 && units <= maxAllowed) {
                const totalCost = units * card.pricePerUnit;
                const confirmMsg = `確認購買 ${units} 股 ${card.name}？\n總花費: ${totalCost.toLocaleString()} 元\n確認執行嗎？`;
                if (confirm(confirmMsg)) {
                    this.sendExecuteCardWithUnits(true, units);
                } else {
                    this.sendExecuteCard(false);
                }
            } else {
                this.addLog(`❌ 无效的购买数量，必须是100的倍数且不超过 ${maxAllowed}`, 'error');
                this.sendExecuteCard(false);
            }
            return;
        }
        
        // 原有显示效果预览的代码
        const modal = document.getElementById('effectConfirmModal');
        const modalBody = document.getElementById('effectModalBody');
        const effectChangesList = document.getElementById('effectChangesList');
        const cardImage = document.getElementById('effectCardImg');
        const confirmBtn = document.getElementById('confirmExecuteBtn');
        const declineBtn = document.getElementById('declineExecuteBtn');
        const cardTypeSpan = document.getElementById('effectCardTypeSpan');
        
        if (!modal || !modalBody) return;
        
        if (cardTypeSpan && card.cardTypeName) {
            const typeColors = { 'part_time': '#4caf50', 'finance': '#2196f3', 'business': '#ff9800', 'property': '#9c27b0' };
            const color = typeColors[card.cardType || ''] || '#ffb347';
            cardTypeSpan.style.backgroundColor = color;
            cardTypeSpan.innerHTML = `${card.cardTypeIcon || '🎴'} ${card.cardTypeName || '机会卡'}`;
        }
        
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #2e7d32; margin-bottom: 10px; font-size: 20px;">${this.escapeHtml(card.name)}</h3>
                <p style="color: #555; font-size: 14px;">${this.escapeHtml(card.description || '')}</p>
                ${card.energyCost ? `<div style="background: #fff3e0; padding: 8px; border-radius: 8px; margin-top: 10px;"><span style="color: #e65100;">⚡ 执行需要精力: ${card.energyCost}</span></div>` : ''}
            </div>
        `;
        
        if (cardImage && card.image) {
            let imageUrl = card.image;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            cardImage.src = imageUrl || '';
            cardImage.onerror = () => { cardImage.style.display = 'none'; };
        }
        
        if (effectChangesList && effectPreview && effectPreview.changes) {
            const changes = effectPreview.changes;
            let changesHtml = '';
            if (changes.cashChange !== undefined && changes.cashChange !== 0) {
                const sign = changes.cashChange > 0 ? '+' : '';
                changesHtml += `<div>💰 现金: ${sign}${changes.cashChange.toLocaleString()} 元</div>`;
            }
            if (changes.sideIncomeChange !== undefined && changes.sideIncomeChange !== 0) {
                const sign = changes.sideIncomeChange > 0 ? '+' : '';
                changesHtml += `<div>💪 副业收入: ${sign}${changes.sideIncomeChange.toLocaleString()} 元/月</div>`;
            }
            if (changes.passiveIncomeChange !== undefined && changes.passiveIncomeChange !== 0) {
                const sign = changes.passiveIncomeChange > 0 ? '+' : '';
                changesHtml += `<div>📈 被动收入: ${sign}${changes.passiveIncomeChange.toLocaleString()} 元/月</div>`;
            }
            if (changes.energyChange !== undefined && changes.energyChange !== 0) {
                const sign = changes.energyChange > 0 ? '+' : '';
                changesHtml += `<div>⚡ 精力: ${sign}${changes.energyChange}</div>`;
            }
            if (changesHtml === '') changesHtml = '<div>无数据变化</div>';
            effectChangesList.innerHTML = changesHtml;
            
            if (effectPreview.description) {
                const effectDesc = document.createElement('div');
                effectDesc.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; color: #666; font-style: italic;';
                effectDesc.innerHTML = `📝 "${this.escapeHtml(effectPreview.description)}"`;
                effectChangesList.appendChild(effectDesc);
            }
        }
        
        const handleConfirm = () => { this.sendExecuteCard(true); this.closeEffectConfirmModal(); };
        const handleDecline = () => { this.sendExecuteCard(false); this.closeEffectConfirmModal(); };
        
        if (confirmBtn) confirmBtn.onclick = handleConfirm;
        if (declineBtn) declineBtn.onclick = handleDecline;
        
        modal.classList.add('show');
        this.waitingForAction = true;
    }
    
    sendExecuteCardWithUnits(execute, units) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: execute, units: units }));
        }
    }
    
    closeEffectConfirmModal() { const modal = document.getElementById('effectConfirmModal'); if (modal) modal.classList.remove('show'); this.waitingForAction = false; }
    sendExecuteCard(execute) { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'execute_card', execute: execute })); }
    
    showOpportunityCard(card, canAfford) { this.showPurchaseConfirm(card, canAfford); }
    
    setupMusicMonitor() { /* 保持原有音乐功能 */ }
    checkMusicAndGameOver() { return false; }
    
    // ==================== 消息处理 ====================
    
    handleServerMessage(message) {
        console.log('收到服务器消息:', message.type);
        switch (message.type) {
            case 'join_success': this.handleJoinSuccess(message); break;
            case 'player_joined': this.handlePlayerJoined(message); break;
            case 'dice_result': this.handleDiceResult(message); break;
            case 'turn_ended': this.handleTurnEnded(message); break;
            case 'loan_approved': this.handleLoanApproved(message); break;
            case 'loan_repaid': this.handleLoanRepaid(message); break;
            case 'loan_rejected': this.handleLoanRejected(message); break;
            case 'forced_repayment': this.handleForcedRepayment(message); break;
            case 'forced_repayment_partial': this.handleForcedRepayment(message); break;
            case 'settlement_reminder': this.handleSettlementReminder(message); break;
            case 'state_updated': this.handleStateUpdated(message); break;
            case 'player_disconnected': this.handlePlayerDisconnected(message); break;
            case 'card_type_selection': this.handleCardTypeSelection(message); break;
            case 'opportunity_card_draw': this.handleOpportunityCardDraw(message); break;
            case 'card_purchased': this.handleCardPurchased(message); break;
            case 'card_decision_result': this.handleCardDecisionResult(message); break;
            case 'settlement': this.handleSettlement(message); break;
            case 'four_leaf_clover_used': this.handleFourLeafCloverUsed(message); break;
            case 'lucky_star_used': this.handleLuckyStarUsed(message); break;
            case 'stock_menu': this.handleStockMenu(message); break;
            case 'crypto_menu': this.handleCryptoMenu(message); break;
            case 'food_delivery_menu': this.handleFoodDeliveryMenu(message); break;
            case 'notification': this.addLog(message.message || '', 'success'); this.showNotification(message.message || '', 'info'); break;
            case 'error': this.addLog(`❌ ${message.message}`, 'error'); this.showNotification(message.message, 'error'); break;
            case 'lier_card_auto_execute':this.handleLierCardAutoExecute(message);break;
            case 'lier_card_draw':this.handleLierCardDraw(message);break;
            case 'lier_card_result':this.handleLierCardResult(message);break;
            case 'police_card_execute':this.handlePoliceCardExecute(message);break;
            case 'lier_card_shield_used':this.handleLierCardShieldUsed(message);break;
            case 'lier_card_volunteer_used':this.handleLierCardVolunteerUsed(message);break;
            case 'volunteer_card_execute':this.handleVolunteerCardExecute(message);break;
            case 'volunteer_card_draw':this.handleVolunteerCardDraw(message);break;
            case 'volunteer_card_choice':this.handleVolunteerCardChoice(message);break;
            case 'emotional_support_available':this.showEmotionalSupportDialog(message);break;
            case 'revelation_type_selection':this.showRevelationTypeSelection(message);break;
            case 'revelation_card_draw':this.showRevelationCard(message);break;
            case 'revelation_card_purchased':this.showRevelationCardEffect(message);break;
            case 'market_news_choices':this.showMarketNewsChoices(message);break;
            case 'market_news_property_choices':this.showMarketNewsPropertyChoices(message);break;
            case 'team_tip_choices':this.showTeamTipChoices(message);break;
            case 'market_news_result':this.handleMarketNewsResult(message);break;
            case 'crypto_sell_choices':this.showCryptoSellChoices(message);break;
            case 'stock_sell_choices':this.showStockSellChoices(message);break;
            case 'property_sell_choices':this.showPropertySellChoices(message);break;
            case 'slow_life_choices':this.showSlowLifeChoices(message);break;
            default: this.addLog(`⚠️ 未知消息类型: ${message.type}`, 'warning');
        }
    }

    // ==================== 察覺卡处理 ====================

  showRevelationTypeSelection(message) {
    const { cardTypes, canAfford } = message;
    
    let modal = document.getElementById('revelationTypeModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'revelationTypeModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 560px; background: linear-gradient(135deg, #4a2a1a, #3a1a0a); border-radius: 28px; padding: 20px; border: 2px solid #ff9800;">
                <div class="modal-title" style="text-align: center; color: #ff9800; font-size: 22px; margin-bottom: 16px;">🧘 察觉卡</div>
                <div class="modal-body" style="text-align: center;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 8px;" id="revelationTypeButtons"></div>
                </div>
                <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 12px; margin: 12px 8px; text-align: center;">
                    <span style="color: #ff9800; font-size: 13px;">💰 执行察觉卡需要花费 500 元</span>
                </div>
                <div class="modal-buttons" style="justify-content: center; margin: 10px 0 5px 0;">
                    <button class="btn-secondary" id="cancelRevelationTypeBtn" style="background: #9e9e9e; padding: 10px 32px; border-radius: 30px; cursor: pointer;">取消</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const buttonsContainer = document.getElementById('revelationTypeButtons');
    if (!buttonsContainer) return;
    buttonsContainer.innerHTML = '';
    
    // 定义图片路径
    const typeImages = {
        'market_news': '../cards/revelation/market/M00.png',
        'tip': '../cards/revelation/tip/IN00.png'
    };
    
    // 定义类型配置
    const typeConfig = {
        'market_news': { name: '市场消息卡', icon: '📊', color: '#2196f3', description: '影响市场价格，持有相关资产的玩家可选择出售' },
        'tip': { name: '锦囊卡', icon: '🎁', color: '#9c27b0', description: '获得特殊技能或团队福利' }
    };
    
    cardTypes.forEach(type => {
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = `
            cursor: pointer; 
            transition: all 0.3s ease; 
            text-align: center; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 6px 14px rgba(0,0,0,0.3);
            background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2));
        `;
        
        // 创建图片元素
        const img = document.createElement('img');
        img.src = typeImages[type.id];
        img.alt = typeConfig[type.id]?.name || type.name;
        img.style.cssText = `
            width: 100%;
            max-width: 180px;
            height: auto;
            aspect-ratio: 1 / 1;
            object-fit: contain;
            display: block;
            margin: 0 auto;
            padding: 16px;
            background: rgba(30, 25, 20, 0.6);
            border-radius: 12px;
            box-sizing: border-box;
        `;
        
        // 图片加载失败时的备用显示
        img.onerror = () => {
            img.style.display = 'none';
            const fallbackDiv = document.createElement('div');
            fallbackDiv.style.cssText = `
                width: 100%;
                max-width: 180px;
                margin: 0 auto;
                aspect-ratio: 1 / 1;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 48px;
                background: ${typeConfig[type.id]?.color || '#ff9800'};
                border-radius: 12px;
            `;
            fallbackDiv.innerHTML = typeConfig[type.id]?.icon || '🎴';
            btnContainer.insertBefore(fallbackDiv, img);
        };
        
        // 创建标签
        const label = document.createElement('div');
        label.style.cssText = `
            padding: 10px 6px;
            font-size: 14px;
            font-weight: bold;
            color: #ffd966;
            background: rgba(0,0,0,0.75);
            text-align: center;
        `;
        label.innerHTML = `${typeConfig[type.id]?.icon || ''} ${typeConfig[type.id]?.name || type.name}`;
        
        btnContainer.appendChild(img);
        btnContainer.appendChild(label);
        
        // 悬停效果
        btnContainer.onmouseenter = () => {
            btnContainer.style.transform = 'scale(1.03)';
        };
        btnContainer.onmouseleave = () => {
            btnContainer.style.transform = 'scale(1)';
        };
        
        // 点击选择
        if (!canAfford) {
            btnContainer.style.opacity = '0.55';
            btnContainer.style.cursor = 'not-allowed';
            btnContainer.title = '现金不足500元，无法执行察觉卡';
        } else {
            btnContainer.onclick = () => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'revelation_type_choice',
                        cardType: type.id
                    }));
                }
                modal.classList.remove('show');
            };
        }
        
        buttonsContainer.appendChild(btnContainer);
    });
    
    const cancelBtn = document.getElementById('cancelRevelationTypeBtn');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.classList.remove('show');
        };
    }
    
    modal.classList.add('show');
    }

    showRevelationCard(message) {
            const { card, canAfford } = message;
            
            let modal = document.getElementById('revelationPurchaseModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'revelationPurchaseModal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #4a2a1a, #3a1a0a); border-radius: 24px; text-align: center; border: 2px solid #ff9800;">
                        <div class="modal-title" style="color: #ff9800; font-size: 24px;">${card.cardTypeIcon || '🧘'} ${card.cardTypeName || '察觉卡'}</div>
                        <div style="text-align: center; margin: 15px 0;">
                            <img id="revelationPurchaseImg" src="" alt="察觉卡" style="max-width: 100%; border-radius: 16px; border: 3px solid #ff9800;">
                        </div>
                        <div class="modal-body" id="revelationPurchaseBody" style="font-size: 14px; line-height: 1.5; color: #ffefc0;"></div>
                        <div style="background: #fff3e0; padding: 12px; border-radius: 12px; margin: 15px 0;">
                            <span style="font-size: 18px; font-weight: bold; color: #e65100;">💰 购买费用: 500 元</span>
                        </div>
                        <div class="modal-buttons" style="display: flex; gap: 15px; justify-content: center;">
                            <button class="btn-secondary" id="cancelRevelationPurchaseBtn" style="background: #9e9e9e; padding: 12px 24px; border-radius: 30px; cursor: pointer;">❌ 放弃购买</button>
                            <button class="btn-primary" id="confirmRevelationPurchaseBtn" style="background: #ff9800; padding: 12px 24px; border-radius: 30px; cursor: pointer;">💰 支付500购买</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            const cardImg = document.getElementById('revelationPurchaseImg');
            const modalBody = document.getElementById('revelationPurchaseBody');
            
            if (cardImg && card.image) {
                let imageUrl = card.image;
                if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                    imageUrl = '/' + imageUrl;
                }
                cardImg.src = imageUrl || '';
                cardImg.onerror = () => { 
                    cardImg.style.display = 'none';
                    cardImg.alt = '图片加载失败';
                };
            }
            
            if (modalBody) {
                modalBody.innerHTML = `
                    <h3 style="color: #ff9800; margin-bottom: 10px;">${this.escapeHtml(card.name)}</h3>
                    <p>${this.escapeHtml(card.description)}</p>
                    ${card.scope === 'team' ? '<p style="color: #ff9800;">🌟 团队锦囊 - 所有玩家可参与</p>' : ''}
                `;
            }
            
            const confirmBtn = document.getElementById('confirmRevelationPurchaseBtn');
            const cancelBtn = document.getElementById('cancelRevelationPurchaseBtn');
            
            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify({ type: 'purchase_revelation_card' }));
                    }
                    modal.classList.remove('show');
                };
                confirmBtn.disabled = !canAfford;
                confirmBtn.style.opacity = canAfford ? '1' : '0.5';
                confirmBtn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
            }
            
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    modal.classList.remove('show');
                    this.addLog('已放弃购买察觉卡', 'warning');
                };
            }
            
            modal.classList.add('show');
        }

    showRevelationCardEffect(message) {
        const { card } = message;
        
        let modal = document.getElementById('revelationEffectModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'revelationEffectModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 550px; background: linear-gradient(135deg, #4a2a1a, #3a1a0a); border-radius: 24px; text-align: center; border: 2px solid #ff9800;">
                    <div class="modal-title" style="color: #ff9800; font-size: 24px;">${card.cardTypeIcon || '🧘'} ${card.cardTypeName || '察觉卡'}</div>
                    <div style="text-align: center; margin: 15px 0;">
                        <img id="revelationEffectImg" src="" alt="察觉卡" style="max-width: 100%; border-radius: 16px; border: 3px solid #ff9800;">
                    </div>
                    <div class="modal-body" id="revelationEffectBody" style="font-size: 14px; line-height: 1.5; color: #ffefc0;"></div>
                    <div style="background: #fff3e0; padding: 12px; border-radius: 12px; margin: 15px 0;">
                        <span style="font-size: 16px; font-weight: bold; color: #e65100;">⚠️ 执行后无法撤销！</span>
                    </div>
                    <div class="modal-buttons" style="display: flex; gap: 15px; justify-content: center;">
                        <button class="btn-secondary" id="declineRevelationBtn" style="background: #9e9e9e; padding: 12px 24px; border-radius: 30px; cursor: pointer;">❌ 不执行</button>
                        <button class="btn-primary" id="confirmRevelationBtn" style="background: #ff9800; padding: 12px 24px; border-radius: 30px; cursor: pointer;">✅ 确认执行</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const cardImg = document.getElementById('revelationEffectImg');
        const modalBody = document.getElementById('revelationEffectBody');
        
        if (cardImg && card.image) {
            let imageUrl = card.image;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            cardImg.src = imageUrl || '';
            cardImg.onerror = () => {
                cardImg.style.display = 'none';
            };
        }
        
        if (modalBody) {
            modalBody.innerHTML = `
                <h3 style="color: #ff9800; margin-bottom: 10px;">${this.escapeHtml(card.name)}</h3>
                <p>${this.escapeHtml(card.description)}</p>
                ${card.scope === 'team' ? '<p style="color: #ff9800;">🌟 团队锦囊 - 所有玩家可参与</p>' : ''}
            `;
        }
        
        const confirmBtn = document.getElementById('confirmRevelationBtn');
        const declineBtn = document.getElementById('declineRevelationBtn');
        
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type: 'execute_revelation_card', execute: true }));
                }
                modal.classList.remove('show');
            };
        }
        
        if (declineBtn) {
            declineBtn.onclick = () => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type: 'execute_revelation_card', execute: false }));
                }
                modal.classList.remove('show');
            };
        }
        
        modal.classList.add('show');
        this.waitingForAction = true;
    }

    showMarketNewsChoices(message) {
        const { stockPrices, playersToAsk, cardId, cardName } = message;
        
        // 检查当前玩家是否有股票
        const currentPlayerStocks = playersToAsk ? playersToAsk.find(p => p.playerName === this.gameState?.playerName) : null;
        if (!currentPlayerStocks || currentPlayerStocks.stocks.length === 0) {
            this.addLog(`📊 ${cardName}：你沒有持有相關股票，無需操作`, 'info');
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'market_news_response',
                    playerChoices: {},
                    cardId: cardId
                }));
            }
            return;
        }
        
        let stockListHtml = '';
        for (const stock of currentPlayerStocks.stocks) {
            const priceInfo = stockPrices[stock.stockCode];
            stockListHtml += `${stock.stockName} (${stock.stockCode}): ${stock.shares}股 @ $${priceInfo.price}/股\n`;
        }
        
        const userChoice = confirm(
            `📊 ${cardName}\n\n` +
            `当前股价：\n` +
            Object.entries(stockPrices).map(([code, info]) => `${info.name} (${code}): $${info.price}/股`).join('\n') +
            `\n\n你的持股：\n${stockListHtml}\n\n` +
            `按下「确定」出售所有持股，按下「取消」保留持股。`
        );
        
        const choices = {};
        if (userChoice) {
            for (const stock of currentPlayerStocks.stocks) {
                choices[stock.stockCode] = true;
            }
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'market_news_response',
                playerChoices: { [this.gameState.playerName]: choices },
                cardId: cardId
            }));
        }
    }

    showMarketNewsPropertyChoices(message) {
            const { playersToAsk, cardId, cardName } = message;
            
            const currentPlayerProperties = playersToAsk ? playersToAsk.find(p => p.playerName === this.gameState?.playerName) : null;
            if (!currentPlayerProperties || currentPlayerProperties.properties.length === 0) {
                this.addLog(`🏠 ${cardName}：你沒有持有地產，無需操作`, 'info');
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'market_news_response',
                        playerChoices: {},
                        cardId: cardId
                    }));
                }
                return;
            }
            
            let propertyList = '';
            for (const prop of currentPlayerProperties.properties) {
                const increasedValue = Math.floor(prop.totalPrice * 0.2);
                propertyList += `${prop.name}: 原价 ${prop.totalPrice.toLocaleString()} 元，现值 ${(prop.totalPrice + increasedValue).toLocaleString()} 元 (+20%)\n`;
            }
            
            const userChoice = confirm(
                `🏠 ${cardName}\n\n` +
                `你的地产：\n${propertyList}\n\n` +
                `按下「确定」出售所有地产，按下「取消」保留。`
            );
            
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'market_news_response',
                    playerChoices: { [this.gameState.playerName]: userChoice },
                    cardId: cardId
                }));
            }
        }

        showTeamTipChoices(message) {
            const { investmentCost, energyBonus, luckBonus, playersToAsk, cardId, cardName } = message;
            
            const userChoice = confirm(
                `🎁 ${cardName}\n\n` +
                `投资金额: $${investmentCost.toLocaleString()} 元\n` +
                `获得奖励: 精力 +${energyBonus}，幸运值 +${luckBonus}\n\n` +
                `你是否愿意投资？`
            );
            
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'market_news_response',
                    playerChoices: { [this.gameState.playerName]: userChoice },
                    cardId: cardId
                }));
            }
        }

        handleMarketNewsResult(message) {
            this.addLog(`📊 ${message.effectMessage}`, 'success');
            this.showNotification(message.effectMessage, 'info');
            
            if (message.gameState) {
                this.gameState = message.gameState;
                this.updateUI();
                this.renderAllTiles();
                this.updatePlayersList();
            }
        }

        showSlowLifeChoices(message) {
        const { diceResults, playersNeedChoice, cardId, cardName } = message;
        
        // 显示所有玩家的骰子结果
        let resultMessage = `🧘 ${cardName}\n\n骰子結果：\n`;
        for (const result of diceResults) {
            resultMessage += `${result.playerName}: 擲出 ${result.diceRoll} 點 → ${result.result}\n`;
        }
        
        // 检查当前玩家是否需要选择
        const currentPlayerNeedChoice = playersNeedChoice.find(p => p.playerName === this.gameState?.playerName);
        
        if (currentPlayerNeedChoice) {
            const userChoice = confirm(
                `${resultMessage}\n\n你擲出 ${currentPlayerNeedChoice.diceRoll} 點！\n請選擇獎勵：\n\n按下「確定」獲得 2 精力\n按下「取消」獲得 $2,000 元`
            );
            
            const choice = userChoice ? 'energy' : 'cash';
            const choiceMessage = userChoice ? '獲得 2 精力' : '獲得 $2,000 元';
            
            this.addLog(`🧘 你選擇 ${choiceMessage}`, 'success');
            
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'market_news_response',
                    playerChoices: { [this.gameState.playerName]: choice },
                    cardId: cardId
                }));
            }
        } else {
            // 当前玩家不需要选择，直接显示结果
            alert(resultMessage);
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'market_news_response',
                    playerChoices: {},
                    cardId: cardId
                }));
            }
        }
    }

    // ==================== 义工卡处理 ====================

    // 志愿者帮助处理（骗子卡被义工帮助）
    handleLierCardVolunteerUsed(message) {
        console.log('志愿者帮助:', message);
        
        this.addLog(`👮 ${message.shieldMessage}`, 'success');
        this.showNotification(message.shieldMessage, 'success');
        
        if (message.gameState) {
            this.gameState = message.gameState;
            this.updateUI();
            this.renderAllTiles();
            this.updatePlayersList();
        }
    }

    // ==================== 义工卡模态框设置 ====================

    setupVolunteerCardModal() {
        // 普通义工卡显示模态框
        let modal = document.getElementById('volunteerCardModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'volunteerCardModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 450px; background: linear-gradient(135deg, #2a4a2a, #1a3a1a); border-radius: 24px; text-align: center; border: 2px solid #4caf50;">
                    <div class="modal-title" style="color: #4caf50; font-size: 24px; text-align: center;">🤝 義工卡</div>
                    <div id="volunteerCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="volunteerCardImg" src="" alt="义工卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 3px solid #4caf50;">
                    </div>
                    <div class="modal-body" id="volunteerCardBody" style="font-size: 16px; line-height: 1.5; color: #ffefc0; text-align: center;"></div>
                    <div style="background: rgba(76,175,80,0.2); padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;">
                        <span style="color: #4caf50; font-size: 14px;" id="volunteerCardEffect"></span>
                    </div>
                    <div class="modal-buttons" style="justify-content: center; margin-top: 15px;">
                        <button class="btn-primary" id="closeVolunteerCardBtn" style="background: #4caf50; padding: 10px 30px; border-radius: 30px; cursor: pointer;">確認</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // 捐款确认模态框（用于V02帮助伤健人士）
        let donationModal = document.getElementById('volunteerDonationModal');
        if (!donationModal) {
            donationModal = document.createElement('div');
            donationModal.id = 'volunteerDonationModal';
            donationModal.className = 'modal';
            donationModal.innerHTML = `
                <div class="modal-content" style="max-width: 450px; background: linear-gradient(135deg, #2a4a2a, #1a3a1a); border-radius: 24px; text-align: center; border: 2px solid #4caf50;">
                    <div class="modal-title" style="color: #4caf50; font-size: 24px;">🤝 幫助傷健人士</div>
                    <div id="donationCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="donationCardImg" src="" alt="义工卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 3px solid #4caf50;">
                    </div>
                    <div class="modal-body" id="donationModalBody" style="font-size: 16px; line-height: 1.5; color: #ffefc0; text-align: center;"></div>
                    <div style="background: rgba(76,175,80,0.2); padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;">
                        <span style="color: #4caf50; font-size: 14px;">📌 所有其他玩家將自願捐款 $2,000 給現金最少的玩家</span>
                    </div>
                    <div class="modal-buttons" style="justify-content: center; gap: 15px; margin-top: 15px;">
                        <button class="btn-secondary" id="cancelDonationBtn" style="background: #9e9e9e; padding: 10px 30px; border-radius: 30px; cursor: pointer;">❌ 取消</button>
                        <button class="btn-primary" id="confirmDonationBtn" style="background: #4caf50; padding: 10px 30px; border-radius: 30px; cursor: pointer;">✅ 執行義工</button>
                    </div>
                </div>
            `;
            document.body.appendChild(donationModal);
        }
        
        // 选择模态框（用于V05义教儿童）
        let choiceModal = document.getElementById('volunteerChoiceModal');
        if (!choiceModal) {
            choiceModal = document.createElement('div');
            choiceModal.id = 'volunteerChoiceModal';
            choiceModal.className = 'modal';
            choiceModal.innerHTML = `
                <div class="modal-content" style="max-width: 450px; background: linear-gradient(135deg, #2a4a2a, #1a3a1a); border-radius: 24px; text-align: center; border: 2px solid #4caf50;">
                    <div class="modal-title" style="color: #4caf50; font-size: 24px;">🤝 義工卡 - 選擇獎勵</div>
                    <div id="choiceCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="choiceCardImg" src="" alt="义工卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 3px solid #4caf50;">
                    </div>
                    <div class="modal-body" id="choiceModalBody" style="font-size: 16px; line-height: 1.5; color: #ffefc0; text-align: center;"></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;" id="choiceButtons">
                        <button class="btn-primary" id="choiceCashBtn" style="background: #ff9800; padding: 12px; border-radius: 30px; cursor: pointer;">💰 獲得 $3,000 元</button>
                        <button class="btn-primary" id="choiceVolunteerBtn" style="background: #4caf50; padding: 12px; border-radius: 30px; cursor: pointer;">⭐ 獲得 1 次義工資格</button>
                    </div>
                    <div class="modal-buttons" style="justify-content: center; margin-top: 10px;">
                        <button class="btn-secondary" id="cancelChoiceBtn" style="background: #9e9e9e; padding: 10px 30px; border-radius: 30px; cursor: pointer;">取消</button>
                    </div>
                </div>
            `;
            document.body.appendChild(choiceModal);
        }
    }

    // 处理普通义工卡执行
    handleVolunteerCardExecute(message) {
        console.log('义工卡执行:', message.card);
        
        this.setupVolunteerCardModal();
        
        const card = message.card;
        const effectMessage = message.effectMessage;
        
        const modal = document.getElementById('volunteerCardModal');
        const cardImg = document.getElementById('volunteerCardImg');
        const cardBody = document.getElementById('volunteerCardBody');
        const effectSpan = document.getElementById('volunteerCardEffect');
        
        if (!modal) return;
        
        if (cardImg && card.image) {
            let imageUrl = card.image;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            cardImg.src = imageUrl || '';
            cardImg.onerror = () => {
                cardImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%234caf50"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40">🤝</text></svg>';
            };
        }
        
        if (cardBody) {
            cardBody.innerHTML = `
                <strong style="font-size: 20px; color: #4caf50;">${this.escapeHtml(card.name)}</strong><br>
                <p style="margin-top: 10px;">${this.escapeHtml(card.description)}</p>
            `;
        }
        
        if (effectSpan) {
            effectSpan.innerHTML = `📌 ${this.escapeHtml(effectMessage)}`;
        }
        
        modal.classList.add('show');
        
        const closeBtn = document.getElementById('closeVolunteerCardBtn');
        const closeModal = () => {
            modal.classList.remove('show');
            if (closeBtn) closeBtn.removeEventListener('click', closeModal);
        };
        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.onclick = null;
            }
        };
        
        this.addLog(`🤝 ${effectMessage}`, 'success');
        this.showNotification(effectMessage, 'success');
        
        if (message.gameState) {
            this.gameState = message.gameState;
            this.updateUI();
            this.renderAllTiles();
            this.updatePlayersList();
        }
    }

    // 处理需要捐款的义工卡（V02）
    handleVolunteerCardDraw(message) {
        console.log('需要捐款的义工卡:', message.card);
        
        this.setupVolunteerCardModal();
        
        const card = message.card;
        
        const modal = document.getElementById('volunteerDonationModal');
        const cardImg = document.getElementById('donationCardImg');
        const modalBody = document.getElementById('donationModalBody');
        const confirmBtn = document.getElementById('confirmDonationBtn');
        const cancelBtn = document.getElementById('cancelDonationBtn');
        
        if (!modal) return;
        
        if (cardImg && card.image) {
            let imageUrl = card.image;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            cardImg.src = imageUrl || '';
            cardImg.onerror = () => {
                cardImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%234caf50"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40">🤝</text></svg>';
            };
        }
        
        if (modalBody) {
            modalBody.innerHTML = `
                <strong style="font-size: 20px; color: #4caf50;">${this.escapeHtml(card.name)}</strong><br>
                <p style="margin-top: 10px;">${this.escapeHtml(card.description)}</p>
                <div style="background: rgba(76,175,80,0.3); padding: 10px; border-radius: 12px; margin-top: 12px;">
                    <span style="color: #ffd966;">💡 執行後，每位有能力的玩家將捐款 $2,000 給現金最少的玩家，你將獲得 1 次義工資格</span>
                </div>
            `;
        }
        
        const handleConfirm = () => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'volunteer_card_confirm' }));
            }
            modal.classList.remove('show');
            this.waitingForAction = false;
        };
        
        const handleCancel = () => {
            modal.classList.remove('show');
            this.waitingForAction = false;
            this.addLog('已取消执行义工卡', 'warning');
        };
        
        if (confirmBtn) confirmBtn.onclick = handleConfirm;
        if (cancelBtn) cancelBtn.onclick = handleCancel;
        
        modal.classList.add('show');
        this.waitingForAction = true;
    }

    // 处理需要选择的义工卡（V05）
    handleVolunteerCardChoice(message) {
        console.log('需要选择的义工卡:', message.card);
        
        this.setupVolunteerCardModal();
        
        const card = message.card;
        
        const modal = document.getElementById('volunteerChoiceModal');
        const cardImg = document.getElementById('choiceCardImg');
        const modalBody = document.getElementById('choiceModalBody');
        const cashBtn = document.getElementById('choiceCashBtn');
        const volunteerBtn = document.getElementById('choiceVolunteerBtn');
        const cancelBtn = document.getElementById('cancelChoiceBtn');
        
        if (!modal) return;
        
        if (cardImg && card.image) {
            let imageUrl = card.image;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            cardImg.src = imageUrl || '';
            cardImg.onerror = () => {
                cardImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%234caf50"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40">🤝</text></svg>';
            };
        }
        
        if (modalBody) {
            modalBody.innerHTML = `
                <strong style="font-size: 20px; color: #4caf50;">${this.escapeHtml(card.name)}</strong><br>
                <p style="margin-top: 10px;">${this.escapeHtml(card.description)}</p>
                <div style="background: rgba(76,175,80,0.3); padding: 10px; border-radius: 12px; margin-top: 12px;">
                    <span style="color: #ffd966;">📌 請選擇你的獎勵：</span>
                </div>
            `;
        }
        
        const handleChoice = (choice) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'volunteer_card_choice_confirm',
                    choice: choice
                }));
            }
            modal.classList.remove('show');
            this.waitingForAction = false;
        };
        
        if (cashBtn) cashBtn.onclick = () => handleChoice('cash');
        if (volunteerBtn) volunteerBtn.onclick = () => handleChoice('volunteer');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                modal.classList.remove('show');
                this.waitingForAction = false;
                this.addLog('已取消选择', 'warning');
            };
        }
        
        modal.classList.add('show');
        this.waitingForAction = true;
    }

    // ==================== 集体捐款处理函数 ====================

    // 处理集体捐款给玩家（V02, V04）
    handleCollectDonations(message) {
        console.log('处理集体捐款:', message);
        
        const { donationAmount, targetPlayer, playersToAsk, cardId, cardName } = message;
        
        // 显示捐款选择对话框
        let donationChoices = {};
        
        // 遍历每个玩家，询问是否捐款
        for (let i = 0; i < playersToAsk.length; i++) {
            const player = playersToAsk[i];
            
            // 跳过自己（如果是执行者）
            if (player.playerName === this.gameState?.playerName) {
                continue;
            }
            
            const userChoice = confirm(
                `🤝 ${cardName}\n\n` +
                `目標玩家：${targetPlayer}\n` +
                `捐款金額：$${donationAmount.toLocaleString()} 元\n\n` +
                `玩家：${player.playerName}\n` +
                `當前現金：$${player.cash.toLocaleString()} 元\n\n` +
                `你是否願意捐款？\n` +
                `捐款後你將獲得幸運值 +1 獎勵！`
            );
            
            donationChoices[player.playerName] = userChoice;
            
            if (userChoice) {
                this.addLog(`✅ 你選擇捐款 $${donationAmount.toLocaleString()} 給 ${targetPlayer}`, 'success');
            } else {
                this.addLog(`❌ 你選擇不捐款`, 'warning');
            }
        }
        
        // 发送选择结果到服务器
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'volunteer_donation_response',
                cardId: cardId,
                donationResponses: donationChoices
            }));
        }
    }

    // 处理集体捐款给银行（V03）
    handleCollectDonationsBank(message) {
        console.log('处理集体捐款给银行:', message);
        
        const { donationAmount, playersToAsk, cardId, cardName } = message;
        
        let donationChoices = {};
        
        for (let i = 0; i < playersToAsk.length; i++) {
            const player = playersToAsk[i];
            
            // 跳过自己（如果是执行者）
            if (player.playerName === this.gameState?.playerName) {
                continue;
            }
            
            const userChoice = confirm(
                `🌍 ${cardName}\n\n` +
                `捐款金額：$${donationAmount.toLocaleString()} 元\n` +
                `捐款去向：銀行（拯救饑民）\n\n` +
                `玩家：${player.playerName}\n` +
                `當前現金：$${player.cash.toLocaleString()} 元\n\n` +
                `你是否願意捐款？\n` +
                `捐款後你將獲得幸運值 +1 獎勵！`
            );
            
            donationChoices[player.playerName] = userChoice;
            
            if (userChoice) {
                this.addLog(`✅ 你選擇捐款 $${donationAmount.toLocaleString()} 給銀行`, 'success');
            } else {
                this.addLog(`❌ 你選擇不捐款`, 'warning');
            }
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'volunteer_donation_response',
                cardId: cardId,
                donationResponses: donationChoices
            }));
        }
    }

    // 处理集体捐赠精力给玩家（V12）
    handleCollectEnergyDonations(message) {
        console.log('处理集体捐赠精力:', message);
        
        const { donationAmount, targetPlayer, playersToAsk, cardId, cardName } = message;
        
        let donationChoices = {};
        
        for (let i = 0; i < playersToAsk.length; i++) {
            const player = playersToAsk[i];
            
            // 跳过自己（如果是执行者）
            if (player.playerName === this.gameState?.playerName) {
                continue;
            }
            
            const userChoice = confirm(
                `👴 ${cardName}\n\n` +
                `目標玩家：${targetPlayer}\n` +
                `捐贈精力：${donationAmount} 點\n\n` +
                `玩家：${player.playerName}\n` +
                `當前精力：${player.energy}/${player.maxEnergy}\n\n` +
                `你是否願意捐贈精力？\n` +
                `捐贈後你將獲得幸運值 +1 獎勵！`
            );
            
            donationChoices[player.playerName] = userChoice;
            
            if (userChoice) {
                this.addLog(`✅ 你選擇捐贈 ${donationAmount} 精力給 ${targetPlayer}`, 'success');
            } else {
                this.addLog(`❌ 你選擇不捐贈精力`, 'warning');
            }
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'volunteer_donation_response',
                cardId: cardId,
                donationResponses: donationChoices
            }));
        }
    }

    // 处理集体捐赠精力给银行（V13）
    handleCollectEnergyDonationsBank(message) {
        console.log('处理集体捐赠精力给银行:', message);
        
        const { donationAmount, playersToAsk, cardId, cardName } = message;
        
        let donationChoices = {};
        
        for (let i = 0; i < playersToAsk.length; i++) {
            const player = playersToAsk[i];
            
            // 跳过自己（如果是执行者）
            if (player.playerName === this.gameState?.playerName) {
                continue;
            }
            
            const userChoice = confirm(
                `🗑️ ${cardName}\n\n` +
                `捐贈精力：${donationAmount} 點\n` +
                `捐贈去向：銀行（環保活動）\n\n` +
                `玩家：${player.playerName}\n` +
                `當前精力：${player.energy}/${player.maxEnergy}\n\n` +
                `你是否願意捐贈精力？\n` +
                `捐贈後你將獲得幸運值 +1 獎勵！`
            );
            
            donationChoices[player.playerName] = userChoice;
            
            if (userChoice) {
                this.addLog(`✅ 你選擇捐贈 ${donationAmount} 精力給銀行`, 'success');
            } else {
                this.addLog(`❌ 你選擇不捐贈精力`, 'warning');
            }
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'volunteer_donation_response',
                cardId: cardId,
                donationResponses: donationChoices
            }));
        }
    }

    // ==================== 情绪支援处理函数 ====================

    // 显示情绪支援对话框
    showEmotionalSupportDialog(message) {
        console.log('情绪支援可用:', message);
        
        const { damagedPlayer, damageAmount, damageDescription, cardId } = message;
        
        // 显示确认对话框
        const userChoice = confirm(
            `💝 情緒支援機會\n\n` +
            `玩家「${damagedPlayer}」正在受到傷害！\n` +
            `傷害類型：${damageDescription}\n` +
            `損失金額：${damageAmount.toLocaleString()} 元\n\n` +
            `你是否願意使用「情緒支援」卡幫助 TA？\n` +
            `使用後你將獲得：\n` +
            `   • 幸運值 +1\n` +
            `   • 精力 +1\n` +
            `   • 記錄一次義工行為\n\n` +
            `按下「確定」使用情緒支援，按下「取消」放棄。`
        );
        
        if (userChoice) {
            this.addLog(`💝 你使用情緒支援幫助 ${damagedPlayer}`, 'success');
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'use_emotional_support',
                    targetPlayer: damagedPlayer,
                    cardId: cardId
                }));
            }
        } else {
            this.addLog(`❌ 你選擇不使用情緒支援`, 'warning');
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'skip_emotional_support',
                    targetPlayer: damagedPlayer,
                    cardId: cardId
                }));
            }
        }
    }

    // 情绪支援使用结果
    handleEmotionalSupportResult(message) {
        console.log('情绪支援结果:', message);
        
        const { success, resultMessage, remainingShield } = message;
        
        if (success) {
            this.addLog(`💝 ${resultMessage}`, 'success');
            this.showNotification(resultMessage, 'success');
        } else {
            this.addLog(`❌ ${resultMessage}`, 'error');
        }
        
        if (remainingShield !== undefined) {
            this.addLog(`🛡️ 剩餘情緒支援護盾次數: ${remainingShield}`, 'info');
        }
        
        if (message.gameState) {
            this.gameState = message.gameState;
            this.updateUI();
        }
    }

     // ==================== 警察卡处理 ====================
    handlePoliceCardExecute(message) {
        console.log('警察卡执行:', message.card);
        
        const card = message.card;
        const effectMessage = message.effectMessage;
        
        // 创建或获取模态框
        let modal = document.getElementById('policeCardModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'policeCardModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 450px; background: linear-gradient(135deg, #1a2a3a, #0d1b2a); border-radius: 24px; text-align: center;">
                    <div class="modal-title" style="color: #4caf50; font-size: 24px; text-align: center;">👮 警察卡</div>
                    <div id="policeCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="policeCardImg" src="" alt="警察卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 3px solid #4caf50;">
                    </div>
                    <div class="modal-body" id="policeCardBody" style="font-size: 16px; line-height: 1.5; color: #ffefc0; text-align: center;"></div>
                    <div style="background: rgba(76,175,80,0.2); padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;">
                        <span style="color: #4caf50; font-size: 14px;" id="policeCardEffect"></span>
                    </div>
                    <div class="modal-buttons" style="justify-content: center; margin-top: 15px;">
                        <button class="btn-primary" id="closePoliceCardBtn" style="background: #4caf50; padding: 10px 30px; border-radius: 30px; cursor: pointer;">確認</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // 设置卡片图片
        const cardImg = document.getElementById('policeCardImg');
        if (cardImg && card.image) {
            let imageUrl = card.image;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            cardImg.src = imageUrl || '';
            cardImg.onerror = () => {
                cardImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%234caf50"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40">👮</text></svg>';
            };
        }
        
        // 设置卡片内容
        const cardBody = document.getElementById('policeCardBody');
        if (cardBody) {
            cardBody.innerHTML = `
                <strong style="font-size: 20px; color: #4caf50;">${this.escapeHtml(card.name)}</strong><br>
                <p style="margin-top: 10px;">${this.escapeHtml(card.description)}</p>
            `;
        }
        
        // 设置效果说明
        const effectSpan = document.getElementById('policeCardEffect');
        if (effectSpan) {
            effectSpan.innerHTML = `📌 效果：${this.escapeHtml(effectMessage)}`;
        }
        
        // 显示模态框
        modal.classList.add('show');
        
        // 关闭按钮事件
        const closeBtn = document.getElementById('closePoliceCardBtn');
        const closeModal = () => {
            modal.classList.remove('show');
            closeBtn.removeEventListener('click', closeModal);
        };
        closeBtn.addEventListener('click', closeModal);
        
        // 点击模态框背景也可以关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.onclick = null;
            }
        };
        
        // 添加到游戏日志
        this.addLog(`👮 ${effectMessage}`, 'success');
        this.showNotification(effectMessage, 'success');
        
        // 更新游戏状态
        if (message.gameState) {
            this.gameState = message.gameState;
            this.updateUI();
            this.renderAllTiles();
            this.updatePlayersList();
        }
    }

    handleLierCardShieldUsed(message) {
        console.log('防骗护盾使用:', message);
        
        // 显示护盾使用通知
        this.addLog(`🛡️ ${message.shieldMessage}`, 'success');
        this.showNotification(message.shieldMessage, 'success');
        
        // 更新游戏状态
        if (message.gameState) {
            this.gameState = message.gameState;
            this.updateUI();
            this.renderAllTiles();
            this.updatePlayersList();
        }
    }

    // ==================== 骗子卡处理 ====================
    // 处理骗子卡抽取（自动执行，无需确认）
    handleLierCardDraw(message) {
        console.log('显示骗子卡:', message.card);
        
        const card = message.card;
        
        // 显示卡片图片和效果（弹窗提示）
        alert(`🎭 ${card.name}\n\n${card.description}\n\n效果將自動執行！`);
        
        // 自动执行骗子卡
        this.ws.send(JSON.stringify({
            type: 'execute_lier_card'
        }));
    }

    // 处理骗子卡执行结果
    handleLierCardResult(message) {
        this.addLog(`🎭 ${message.effectMessage}`, 'error');
        this.showNotification(message.effectMessage, 'error');
        if (message.gameState) {
            this.gameState = message.gameState;
            this.updateUI();
        }
    }

    // 添加自动执行处理方法
    // 处理骗子卡自动执行（显示卡片图片）
    handleLierCardAutoExecute(message) {
        console.log('骗子卡自动执行:', message.card);
        
        const card = message.card;
        const effectMessage = message.effectMessage;
        
        // 创建或获取模态框
        let modal = document.getElementById('lierCardModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'lierCardModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 450px; background: linear-gradient(135deg, #2a1a1a, #1a0a0a); border-radius: 24px; text-align: center;">
                    <div class="modal-title" style="color: #ff6b6b; font-size: 24px; text-align: center;">🎭 騙子卡</div>
                    <div id="lierCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="lierCardImg" src="" alt="骗子卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 3px solid #ff6b6b;">
                    </div>
                    <div class="modal-body" id="lierCardBody" style="font-size: 16px; line-height: 1.5; color: #ffefc0; text-align: center;"></div>
                    <div style="background: rgba(255,107,107,0.2); padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;">
                        <span style="color: #ff6b6b; font-size: 14px;" id="lierCardEffect"></span>
                    </div>
                    <div class="modal-buttons" style="justify-content: center; margin-top: 15px;">
                        <button class="btn-primary" id="closeLierCardBtn" style="background: #ff6b6b; padding: 10px 30px; border-radius: 30px; cursor: pointer;">確認</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // 设置卡片图片
        const cardImg = document.getElementById('lierCardImg');
        if (cardImg && card.image) {
            let imageUrl = card.image;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            cardImg.src = imageUrl || '';
            cardImg.onerror = () => {
                cardImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23dc143c"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40">🎭</text></svg>';
            };
        }
        
        // 设置卡片内容
        const cardBody = document.getElementById('lierCardBody');
        if (cardBody) {
            cardBody.innerHTML = `
                <strong style="font-size: 20px; color: #ff6b6b;">${this.escapeHtml(card.name)}</strong><br>
                <p style="margin-top: 10px;">${this.escapeHtml(card.description)}</p>
            `;
        }
        
        // 设置效果说明
        const effectSpan = document.getElementById('lierCardEffect');
        if (effectSpan) {
            effectSpan.innerHTML = `📌 效果：${this.escapeHtml(effectMessage)}`;
        }
        
        // 显示模态框
        modal.classList.add('show');
        
        // 关闭按钮事件
        const closeBtn = document.getElementById('closeLierCardBtn');
        const closeModal = () => {
            modal.classList.remove('show');
            // 移除事件监听器避免重复
            closeBtn.removeEventListener('click', closeModal);
        };
        closeBtn.addEventListener('click', closeModal);
        
        // 点击模态框背景也可以关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.onclick = null;
            }
        };
        
        // 添加到游戏日志
        this.addLog(`🎭 ${effectMessage}`, 'error');
        this.showNotification(effectMessage, 'error');
        
        // 更新游戏状态
        if (message.gameState) {
            this.gameState = message.gameState;
            this.updateUI();
            this.renderAllTiles();
            this.updatePlayersList();
        }
    }
        
    // ==================== 股票处理 ====================
    
    // 在 game.js 中，找到 handleStockMenu 函数，修改为：

    handleStockMenu(message) {
    console.log('显示股票菜单:', message);
    
    const userChoice = prompt(message.menuMessage + '\n\n請輸入數字選擇操作:');
    
    if (userChoice === '1') {
        // 买入股票
        const minShares = message.minShares || 100;
        const shareMultiple = message.shareMultiple || 100;
        const maxSharesByCash = Math.floor((this.gameState?.cash || 0) / message.currentPrice);
        const maxShares = Math.floor(maxSharesByCash / shareMultiple) * shareMultiple;
        
        if (maxShares === 0) {
            this.addLog(`❌ 现金不足，无法购买任何股票。需要至少 ${message.currentPrice * minShares} 元`, 'error');
            this.showNotification('现金不足，无法购买股票', 'error');
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
            return;
        }
        
        const defaultShares = Math.min(minShares, maxShares);
        const sharesInput = prompt(
            `📈 買入股票\n\n` +
            `股票名稱: ${message.cardName}\n` +
            `當前股價: $${message.currentPrice}/股\n` +
            `最小交易: ${minShares} 股 (${shareMultiple}股的倍數)\n` +
            `最大可買 (按現金): ${maxShares.toLocaleString()} 股\n\n` +
            `請輸入購買股數 (${minShares} ~ ${maxShares.toLocaleString()}，${shareMultiple}股的倍數):`,
            defaultShares.toString()
        );
        
        const shares = parseInt(sharesInput);
        
        if (isNaN(shares) || shares < minShares || shares % shareMultiple !== 0) {
            this.addLog(`❌ 股数无效，必须是 ${minShares} 的倍数`, 'error');
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
            return;
        }
        
        if (shares > maxShares) {
            this.addLog(`❌ 股数超过最大可购买数量 ${maxShares.toLocaleString()} 股`, 'error');
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
            return;
        }
        
        const totalCost = shares * message.currentPrice;
        const confirmMsg = `確認買入 ${shares.toLocaleString()} 股 ${message.cardName}？\n\n` +
            `成交價: $${message.currentPrice}/股\n` +
            `總金額: ${totalCost.toLocaleString()} 元\n` +
            `當前現金: ${this.gameState?.cash?.toLocaleString() || 0} 元\n\n` +
            `確認執行嗎？`;
        
        if (confirm(confirmMsg)) {
            // 关键：发送 stockAction: 'buy'
            this.ws.send(JSON.stringify({
                type: 'execute_card',
                execute: true,
                stockAction: 'buy',
                shares: shares,
                cardId: message.cardId
            }));
        } else {
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
        }
        
    } else if (userChoice === '2' && message.holding) {
        // 卖出股票
        const minShares = message.minShares || 100;
        const shareMultiple = message.shareMultiple || 100;
        const currentShares = message.holding.shares;
        
        if (currentShares === 0) {
            this.addLog(`❌ 没有持有 ${message.cardName} 股票`, 'error');
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
            return;
        }
        
        const maxShares = Math.floor(currentShares / shareMultiple) * shareMultiple;
        const defaultShares = Math.min(minShares, maxShares);
        
        const sharesInput = prompt(
            `📉 賣出股票\n\n` +
            `股票名稱: ${message.cardName}\n` +
            `當前股價: $${message.currentPrice}/股\n` +
            `持有股數: ${currentShares.toLocaleString()} 股\n` +
            `平均成本: $${message.holding.avgCost?.toFixed(2) || '0'}/股\n` +
            `持倉市值: $${message.holding.currentValue?.toLocaleString() || '0'} 元\n` +
            `總成本: $${message.holding.totalCost?.toLocaleString() || '0'} 元\n` +
            `盈虧: ${message.holding.profit >= 0 ? '+' : ''}${message.holding.profit?.toLocaleString() || '0'} 元\n\n` +
            `最小交易: ${minShares} 股 (${shareMultiple}股的倍數)\n` +
            `最大可賣: ${maxShares.toLocaleString()} 股\n\n` +
            `請輸入賣出股數 (${minShares} ~ ${maxShares.toLocaleString()}，${shareMultiple}股的倍數):`,
            defaultShares.toString()
        );
        
        const shares = parseInt(sharesInput);
        
        if (isNaN(shares) || shares < minShares || shares % shareMultiple !== 0) {
            this.addLog(`❌ 股数无效，必须是 ${minShares} 的倍数`, 'error');
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
            return;
        }
        
        if (shares > currentShares) {
            this.addLog(`❌ 股数超过持有数量 ${currentShares.toLocaleString()} 股`, 'error');
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
            return;
        }
        
        const totalRevenue = shares * message.currentPrice;
        const confirmMsg = `確認賣出 ${shares.toLocaleString()} 股 ${message.cardName}？\n\n` +
            `成交價: $${message.currentPrice}/股\n` +
            `總金額: ${totalRevenue.toLocaleString()} 元\n\n` +
            `確認執行嗎？`;
        
        if (confirm(confirmMsg)) {
            // 关键：发送 stockAction: 'sell'
            this.ws.send(JSON.stringify({
                type: 'execute_card',
                execute: true,
                stockAction: 'sell',
                shares: shares,
                cardId: message.cardId
            }));
        } else {
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
        }
        
    } else if (userChoice === '3') {
        this.addLog('已取消股票交易', 'warning');
        this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
    } else if (userChoice === '2' && !message.holding) {
        this.addLog('没有持有该股票，无法卖出', 'warning');
        this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
    } else {
        this.addLog('无效的选择，已取消操作', 'warning');
        this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
    }
    }

    showStockSellChoices(message) {
        const { playersToAsk, cardId, cardName, multiplier } = message;
        
        // 检查当前玩家是否有股票
        const currentPlayerStocks = playersToAsk ? playersToAsk.find(p => p.playerName === this.gameState?.playerName) : null;
        if (!currentPlayerStocks || currentPlayerStocks.stockHoldings.length === 0) {
            this.addLog(`🌟 ${cardName}：你沒有持有股票，無需操作`, 'info');
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'market_news_response',
                    playerChoices: {},
                    cardId: cardId
                }));
            }
            return;
        }
        
        let stockList = '';
        for (const stock of currentPlayerStocks.stockHoldings) {
            stockList += `${stock.name}: ${stock.shares}股，成本 $${stock.originalCost.toLocaleString()}，可賣出 $${stock.sellPrice.toLocaleString()} (獲利 $${stock.profit.toLocaleString()})\n`;
        }
        
        const userChoice = confirm(
            `🌟 ${cardName}\n\n` +
            `大奇蹟日！所有股票可以原買入價 ${multiplier} 倍出售！\n\n` +
            `你的持股：\n${stockList}\n\n` +
            `按下「確定」以 ${multiplier} 倍價格出售所有股票，按下「取消」保留。\n\n` +
            `出售後你將獲得：\n` +
            `   • 幸運值 +3\n` +
            `   • 精力 +2`
        );
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'market_news_response',
                playerChoices: { [this.gameState.playerName]: userChoice },
                cardId: cardId
            }));
        }
    }
    
    // ==================== 加密货币菜单处理 ====================
    
    showCryptoSellChoices(message) {
        const { playersToAsk, cardId, cardName, multiplier } = message;
        
        // 检查当前玩家是否有加密货币
        const currentPlayerCrypto = playersToAsk ? playersToAsk.find(p => p.playerName === this.gameState?.playerName) : null;
        if (!currentPlayerCrypto || currentPlayerCrypto.cryptoHoldings.length === 0) {
            this.addLog(`🚀 ${cardName}：你沒有持有 C01 加密貨幣，無需操作`, 'info');
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'market_news_response',
                    playerChoices: {},
                    cardId: cardId
                }));
            }
            return;
        }
        
        let cryptoList = '';
        for (const crypto of currentPlayerCrypto.cryptoHoldings) {
            cryptoList += `${crypto.name}: ${crypto.units}顆，成本 $${crypto.originalCost.toLocaleString()}，可賣出 $${crypto.sellPrice.toLocaleString()} (獲利 $${crypto.profit.toLocaleString()})\n`;
        }
        
        const userChoice = confirm(
            `🚀 ${cardName}\n\n` +
            `加密貨幣價格爆升！可以原價 ${multiplier} 倍出售！\n\n` +
            `你的持倉：\n${cryptoList}\n\n` +
            `按下「確定」以 ${multiplier} 倍價格出售所有 C01 加密貨幣，按下「取消」保留。`
        );
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'market_news_response',
                playerChoices: { [this.gameState.playerName]: userChoice },
                cardId: cardId
            }));
        }
    }

    handleCryptoMenu(message) {
        console.log('显示加密货币菜单:', message);
        
        const userChoice = prompt(message.menuMessage + '\n\n請輸入數字選擇操作:');
        
        if (userChoice === '1') {
            // 买入加密货币
            const minUnits = message.minUnits || 1;
            const maxUnitsByCash = Math.floor((this.gameState?.cash || 0) / message.currentPrice);
            
            if (maxUnitsByCash === 0) {
                this.addLog(`❌ 现金不足，无法购买任何 ${message.cardName}。需要至少 $${message.currentPrice * minUnits} 元`, 'error');
                this.showNotification('现金不足，无法购买加密货币', 'error');
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
                return;
            }
            
            const unitsInput = prompt(
                `🪙 買入加密貨幣\n\n` +
                `名稱: ${message.cardName}\n` +
                `當前價格: $${message.currentPrice}/顆\n` +
                `最小交易: ${minUnits} 顆\n` +
                `最大可買 (按現金): ${maxUnitsByCash.toLocaleString()} 顆\n\n` +
                `⚠️ 高風險警告：價格可能歸零或暴漲！\n\n` +
                `請輸入購買數量 (${minUnits} ~ ${maxUnitsByCash.toLocaleString()}，整數):`,
                minUnits.toString()
            );
            
            const units = parseInt(unitsInput);
            
            if (isNaN(units) || units < minUnits) {
                this.addLog(`❌ 數量无效，必须是至少 ${minUnits} 的整数`, 'error');
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
                return;
            }
            
            if (units > maxUnitsByCash) {
                this.addLog(`❌ 數量超过最大可购买数量 ${maxUnitsByCash.toLocaleString()} 顆`, 'error');
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
                return;
            }
            
            const totalCost = units * message.currentPrice;
            const confirmMsg = `⚠️ 高風險投資警告 ⚠️\n\n` +
                `確認買入 ${units.toLocaleString()} 顆 ${message.cardName}？\n\n` +
                `成交價: $${message.currentPrice}/顆\n` +
                `總金額: ${totalCost.toLocaleString()} 元\n` +
                `當前現金: ${this.gameState?.cash?.toLocaleString() || 0} 元\n\n` +
                `價格可能暴漲或歸零，確認執行嗎？`;
            
            if (confirm(confirmMsg)) {
                this.ws.send(JSON.stringify({
                    type: 'execute_card',
                    execute: true,
                    cryptoAction: 'buy',
                    units: units,
                    cardId: message.cardId
                }));
            } else {
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
            }
            
        } else if (userChoice === '2' && message.holding) {
            // 卖出加密货币
            const minUnits = message.minUnits || 1;
            const currentUnits = message.holding.units;
            
            if (currentUnits === 0) {
                this.addLog(`❌ 没有持有 ${message.cardName}`, 'error');
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
                return;
            }
            
            const unitsInput = prompt(
                `🪙 賣出加密貨幣\n\n` +
                `名稱: ${message.cardName}\n` +
                `當前價格: $${message.currentPrice}/顆\n` +
                `持有數量: ${currentUnits.toLocaleString()} 顆\n` +
                `平均成本: $${message.holding.averagePrice?.toFixed(4) || '0'}/顆\n` +
                `持倉市值: $${message.holding.currentValue?.toLocaleString() || '0'} 元\n` +
                `總成本: $${message.holding.totalCost?.toLocaleString() || '0'} 元\n` +
                `盈虧: ${message.holding.profit >= 0 ? '+' : ''}${message.holding.profit?.toLocaleString() || '0'} 元\n\n` +
                `最小交易: ${minUnits} 顆\n` +
                `最大可賣: ${currentUnits.toLocaleString()} 顆\n\n` +
                `請輸入賣出數量 (${minUnits} ~ ${currentUnits.toLocaleString()}，整數):`,
                minUnits.toString()
            );
            
            const units = parseInt(unitsInput);
            
            if (isNaN(units) || units < minUnits) {
                this.addLog(`❌ 數量无效，必须是至少 ${minUnits} 的整数`, 'error');
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
                return;
            }
            
            if (units > currentUnits) {
                this.addLog(`❌ 數量超过持有数量 ${currentUnits.toLocaleString()} 顆`, 'error');
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
                return;
            }
            
            const totalRevenue = units * message.currentPrice;
            const confirmMsg = `確認賣出 ${units.toLocaleString()} 顆 ${message.cardName}？\n\n` +
                `成交價: $${message.currentPrice}/顆\n` +
                `總金額: ${totalRevenue.toLocaleString()} 元\n\n` +
                `確認執行嗎？`;
            
            if (confirm(confirmMsg)) {
                this.ws.send(JSON.stringify({
                    type: 'execute_card',
                    execute: true,
                    cryptoAction: 'sell',
                    units: units,
                    cardId: message.cardId
                }));
            } else {
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
            }
            
        } else if (userChoice === '3') {
            this.addLog('已取消加密货币交易', 'warning');
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
        } else {
            this.addLog('无效的选择，已取消操作', 'warning');
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
        }
    }

    // ==================== 外卖店菜单处理 ====================

    handleFoodDeliveryMenu(message) {
        console.log('显示外卖店菜单:', message);
        
        const userChoice = prompt(message.menuMessage);
        
        if (userChoice === '1') {
            // 投资开店
            const confirmMsg = `確認投資開設外賣店？\n\n` +
                `投資金額: $${message.investmentCost.toLocaleString()} 元\n` +
                `被動收入: +$${message.monthlyReturn.toLocaleString()}/月\n` +
                `精力消耗: -${message.energyCost} 点\n\n` +
                `確認執行嗎？`;
            
            if (confirm(confirmMsg)) {
                this.ws.send(JSON.stringify({
                    type: 'execute_card',
                    execute: true,
                    userAction: 'invest',
                    cardId: message.cardId
                }));
            } else {
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
            }
            
        } else if (userChoice === '2') {
            // 兑换精力
            const maxUnits = Math.floor((this.gameState?.cash || 0) / message.exchangeCost);
            
            if (maxUnits === 0) {
                this.addLog(`❌ 现金不足 ${message.exchangeCost.toLocaleString()} 元，无法兑换精力`, 'error');
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
                return;
            }
            
            const unitsInput = prompt(
                `🔄 兌換精力\n\n` +
                `兌換價格: $${message.exchangeCost.toLocaleString()} 元 → ${message.exchangeEnergy} 精力\n` +
                `可兌換次數: 最多 ${maxUnits} 次\n` +
                `每次兌換獲得 ${message.exchangeEnergy} 精力\n\n` +
                `請輸入兌換次數 (1-${maxUnits}):`,
                '1'
            );
            
            const units = parseInt(unitsInput);
            
            if (isNaN(units) || units < 1 || units > maxUnits) {
                this.addLog(`❌ 无效的兑换次数`, 'error');
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
                return;
            }
            
            const totalCost = units * message.exchangeCost;
            const totalEnergy = units * message.exchangeEnergy;
            
            const confirmMsg = `確認兌換 ${units} 次？\n\n` +
                `總花費: $${totalCost.toLocaleString()} 元\n` +
                `獲得精力: +${totalEnergy} 點\n\n` +
                `確認執行嗎？`;
            
            if (confirm(confirmMsg)) {
                this.ws.send(JSON.stringify({
                    type: 'execute_card',
                    execute: true,
                    userAction: 'exchange',
                    units: units,
                    cardId: message.cardId
                }));
            } else {
                this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
            }
            
        } else if (userChoice === '3') {
            this.addLog('已取消操作', 'warning');
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
        } else {
            this.addLog('无效的选择，已取消操作', 'warning');
            this.ws.send(JSON.stringify({ type: 'execute_card', execute: false }));
        }
    }
    
    handleSettlement(message) {
        if (message.playerId === this.playerId) {
            this.addLog(`📅 结算日！获得 ${(message.salary + message.sideIncome).toLocaleString()} 元现金流`, 'success');
            if (message.isExactLanding) this.addLog(`🎲 正好踩中结算日！`, 'event');
        }
        if (message.gameState && message.playerId === this.playerId) { this.gameState = message.gameState; this.updateUI(); }
    }
    
    handleJoinSuccess(message) { this.gameState = message.gameState; this.otherPlayers.clear(); if (message.otherPlayers) message.otherPlayers.forEach(p => this.otherPlayers.set(p.id, p.gameState)); this.enableGameControls(); this.updateUI(); this.renderAllTiles(); this.updatePlayersList(); this.addLog(`🎉 成功加入游戏！`, 'success'); }
    handlePlayerJoined(message) { if (message.player) { this.otherPlayers.set(message.player.id, message.player.gameState); this.addLog(`👤 ${message.player.gameState.playerName} 加入游戏`, 'event'); this.updatePlayersList(); } }
    handleDiceResult(message) { if (message.playerId === this.playerId && message.gameState) this.gameState = message.gameState; this.updateUI(); this.renderAllTiles(); this.updatePlayersList(); }
    handleTurnEnded(message) { if (message.playerId === this.playerId && message.gameState) this.gameState = message.gameState; this.updateUI(); this.updatePlayersList(); }
    handleStateUpdated(message) { if (message.playerId === this.playerId && message.gameState) { this.gameState = message.gameState; this.updateUI(); this.renderAllTiles(); } else if (message.playerId && message.gameState) { this.otherPlayers.set(message.playerId, message.gameState); this.updatePlayersList(); } }
    handlePlayerDisconnected(message) { if (message.playerId) { this.otherPlayers.delete(message.playerId); this.addLog(`👤 ${message.playerName} 离开游戏`, 'warning'); this.updatePlayersList(); } }
    handleCardTypeSelection(message) { this.showCardTypeSelection(message.cardTypes || [], message.canAfford || false); }
    handleOpportunityCardDraw(message) { if (message.card) this.showOpportunityCard(message.card, message.canAfford); }
    handleCardPurchased(message) { if (message.card && message.effectPreview) this.showEffectConfirm(message.card, message.effectPreview); }
    handleCardDecisionResult(message) { if (message.execute) this.addLog(`✅ ${message.message}`, 'success'); else this.addLog(`⚠️ ${message.message}`, 'warning'); if (message.gameState && message.playerId === this.playerId) { this.gameState = message.gameState; this.updateUI(); } }
    
    handleLoanApproved(message) {
        if (message.playerId === this.playerId) {
            this.addLog(`🏦 贷款获批！获得 ${message.loanAmount.toLocaleString()} 元`, 'success');
            this.addLog(`📋 需还本利和: ${message.totalToRepay.toLocaleString()} 元 (本金 + ${message.interestRate}%利息)`, 'warning');
            this.showNotification(`贷款成功！获得 ${message.loanAmount.toLocaleString()} 元，需还 ${message.totalToRepay.toLocaleString()} 元`, 'success');
        }
        if (message.gameState && message.playerId === this.playerId) {
            this.gameState = message.gameState;
            this.updateUI();
        }
    }
    
    handleLoanRepaid(message) {
        if (message.playerId === this.playerId) {
            this.addLog(`💰 成功偿还贷款！`, 'success');
            this.addLog(`   💰 本金: ${message.repaidAmount.toLocaleString()} 元`, 'success');
            this.addLog(`   💰 利息: ${message.interestAmount.toLocaleString()} 元`, 'success');
            this.addLog(`   💰 总计: ${message.totalRepaid.toLocaleString()} 元`, 'success');
            this.showNotification(`偿还贷款成功！总支出 ${message.totalRepaid.toLocaleString()} 元`, 'success');
        }
        if (message.gameState && message.playerId === this.playerId) {
            this.gameState = message.gameState;
            this.updateUI();
        }
    }
    
    handleLoanRejected(message) {
        this.addLog(`❌ 贷款被拒绝: ${message.reason}`, 'error');
        this.showNotification(`贷款失败: ${message.reason}`, 'error');
    }
    
    handleForcedRepayment(message) {
        if (message.playerId === this.playerId) {
            this.addLog(`⚠️ ${message.message}`, 'error');
            this.showNotification(message.message, 'error');
            if (message.remainingCash !== undefined) {
                this.addLog(`💰 剩余现金: ${message.remainingCash.toLocaleString()} 元`, 'warning');
            }
            if (message.remainingDebt !== undefined) {
                this.addLog(`💰 剩余欠款: ${message.remainingDebt.toLocaleString()} 元`, 'warning');
            }
        } else {
            this.addLog(`⚠️ ${message.playerName}: ${message.message}`, 'warning');
        }
        if (message.gameState && message.playerId === this.playerId) {
            this.gameState = message.gameState;
            this.updateUI();
        }
    }
    
    handleSettlementReminder(message) {
        if (message.playerId === this.playerId) {
            this.addLog(`📅 ${message.message}`, 'warning');
            this.showNotification(`⚠️ 贷款提醒: ${message.remainingSettlements}次结算日后强制扣款`, 'warning');
        }
    }
    
    handleFourLeafCloverUsed(message) { 
        this.addLog(`🍀 ${message.message}`, 'success'); 
        this.showNotification(message.message, 'success'); 
        if (message.gameState) { 
            this.gameState = message.gameState; 
            this.updateUI(); 
        } 
    }
    
    handleLuckyStarUsed(message) { 
        this.addLog(`⭐ ${message.message}`, 'success'); 
        this.showNotification(message.message, 'success'); 
        if (message.gameState) { 
            this.gameState = message.gameState; 
            this.updateUI(); 
        } 
    }
    
    updateNetworkStatus(connected) { const statusDiv = this.getElement('networkStatus'); if (statusDiv) { if (connected) { statusDiv.className = 'network-status connected'; statusDiv.textContent = '🟢 已连接 | 游戏进行中'; } else { statusDiv.className = 'network-status'; statusDiv.textContent = '⚪ 未连接 | 请选择职业后连接'; } } }
    
    enableGameControls() {
        ['btnRoll', 'btnEndTurn', 'btnLoan', 'btnRepayLoan', 'btnUseClover', 'btnUseLuckyStar'].forEach(id => {
            const btn = this.getButton(id);
            if (btn) btn.disabled = false;
        });
        const nameInput = this.getInput('playerName');
        const connectBtn = this.getButton('btnConnect');
        if (nameInput) nameInput.disabled = true;
        if (connectBtn) connectBtn.disabled = true;
    }
    
    disableGameControls() {
        ['btnRoll', 'btnEndTurn', 'btnLoan', 'btnRepayLoan', 'btnUseClover', 'btnUseLuckyStar'].forEach(id => {
            const btn = this.getButton(id);
            if (btn) btn.disabled = true;
        });
    }
    
   updateUI() {
        if (!this.gameState) return;
        
        // 计算原始总支出
        const rawTotalExp = this.gameState.livingExpense + this.gameState.tax + this.gameState.loanInterest + this.gameState.childExpense;
        
        // 应用支出减免
        let totalExp = rawTotalExp;
        let expenseReductionMessage = '';
        let expenseReductionPercent = this.gameState.expenseReduction || 0;
        
        if (expenseReductionPercent > 0) {
            const savedAmount = Math.floor(rawTotalExp * expenseReductionPercent / 100);
            totalExp = rawTotalExp - savedAmount;
            expenseReductionMessage = ` (已減免 ${expenseReductionPercent}%)`;
        }
        
        // 计算月现金流（使用减免后的支出）
        const monthlyCF = (this.gameState.salary + this.gameState.sideIncome + this.gameState.passiveIncome) - totalExp;
        
        const totalLoanRepay = this.gameState.loanAmount + Math.round(this.gameState.loanAmount * 0.1);
        
        const luckyStarCount = this.gameState.luckyStarCount || 0;
        const fourLeafCloverCount = this.gameState.fourLeafClover || 0;
        
        // 更新各个统计元素
        const statCash = this.getElement('statCash');
        const statSalary = this.getElement('statSalary');
        const statSideIncome = this.getElement('statSideIncome');
        const statPassiveIncome = this.getElement('statPassiveIncome');
        const statMonthlyCF = this.getElement('statMonthlyCF');
        const statLiving = this.getElement('statLiving');
        const statTax = this.getElement('statTax');
        const statLoanInterest = this.getElement('statLoanInterest');
        const statTotalExpense = this.getElement('statTotalExpense');
        const statEnergy = this.getElement('statEnergy');
        const statLuck = this.getElement('statLuck');
        const statLuckyStar = this.getElement('statLuckyStar');
        const statLayer = this.getElement('statLayer');
        const statFourLeafClover = this.getElement('statFourLeafClover');
        
        if (statCash) statCash.innerText = this.gameState.cash.toLocaleString();
        if (statSalary) statSalary.innerText = this.gameState.salary.toLocaleString();
        if (statSideIncome) statSideIncome.innerText = this.gameState.sideIncome.toLocaleString();
        if (statPassiveIncome) statPassiveIncome.innerText = this.gameState.passiveIncome.toLocaleString();
        if (statMonthlyCF) statMonthlyCF.innerText = (monthlyCF >= 0 ? '+' : '') + monthlyCF.toLocaleString();
        if (statLiving) statLiving.innerText = this.gameState.livingExpense.toLocaleString();
        if (statTax) statTax.innerText = this.gameState.tax.toLocaleString();
        if (statLoanInterest) statLoanInterest.innerText = this.gameState.loanInterest.toLocaleString();
        
        // 显示减免后的总支出
        if (statTotalExpense) {
            statTotalExpense.innerText = totalExp.toLocaleString() + expenseReductionMessage;
            if (expenseReductionPercent > 0) {
                statTotalExpense.style.color = '#4caf50';
            } else {
                statTotalExpense.style.color = '#ffefc0';
            }
        }
        
        if (statEnergy) statEnergy.innerText = `${this.gameState.energy}/${this.gameState.maxEnergy}`;
        if (statLuck) statLuck.innerText = this.gameState.luck.toFixed(1);
        if (statLuckyStar) statLuckyStar.innerText = luckyStarCount;
        if (statFourLeafClover) statFourLeafClover.innerText = fourLeafCloverCount;
        
        const layerText = this.gameState.inFlow ? '顺流层' : (this.gameState.inReverse ? '逆流层' : '平流层');
        if (statLayer) statLayer.innerText = layerText;
        
        // 更新本利和显示
        const totalLoanRepayEl = this.getElement('statTotalLoanRepay');
        if (totalLoanRepayEl) {
            totalLoanRepayEl.innerText = totalLoanRepay.toLocaleString();
            if (this.gameState.loanAmount > 0) {
                totalLoanRepayEl.style.color = '#ff6b6b';
            } else {
                totalLoanRepayEl.style.color = '#4caf50';
            }
        }
        
        // 更新贷款按钮状态
        const loanBtn = this.getButton('btnLoan');
        if (loanBtn) {
            loanBtn.disabled = this.gameState.loanAmount > 0;
            if (this.gameState.loanAmount > 0) {
                loanBtn.title = '请先还清当前贷款';
            } else {
                loanBtn.title = '';
            }
        }
        
        // 更新还款按钮状态
        const repayBtn = this.getButton('btnRepayLoan');
        if (repayBtn) {
            repayBtn.disabled = this.gameState.loanAmount === 0;
        }
        
        // 更新四叶草按钮
        const useCloverBtn = this.getButton('btnUseClover');
        if (useCloverBtn) {
            useCloverBtn.disabled = fourLeafCloverCount === 0;
            useCloverBtn.textContent = fourLeafCloverCount > 0 ? `🍀 四葉草 (x2) x${fourLeafCloverCount}` : '🍀 四葉草 (x2)';
        }
        
        // 更新幸运星按钮
        const useLuckyStarBtn = this.getButton('btnUseLuckyStar');
        if (useLuckyStarBtn) {
            useLuckyStarBtn.disabled = luckyStarCount === 0;
            useLuckyStarBtn.textContent = luckyStarCount > 0 ? `⭐ 幸運星 (x3) x${luckyStarCount}` : '⭐ 幸運星 (x3)';
        }
        
        // 更新控制面板样式
        const controlPanel = this.getElement('controlPanel');
        if (controlPanel) {
            controlPanel.className = 'panel control-panel';
            if (this.gameState.inFlow) controlPanel.classList.add('flow');
            if (this.gameState.inReverse) controlPanel.classList.add('reverse');
        }
        
        // 更新中心文字
        const layerTextElement = this.getElement('layerText');
        if (layerTextElement) {
            layerTextElement.innerText = layerText;
        }
    }
    
    updatePlayersList() {
        const playersList = this.getElement('playersList');
        if (!playersList) return;
        playersList.innerHTML = '';
        if (this.gameState) { 
            const myItem = document.createElement('div'); 
            myItem.className = 'player-item'; 
            myItem.innerHTML = `<strong>👤 ${this.escapeHtml(this.gameState.playerName)} (你)</strong><br>💰 ${this.gameState.cash.toLocaleString()} 元 | ⚡ ${this.gameState.energy}/${this.gameState.maxEnergy}<br>🍀 四叶草: ${this.gameState.fourLeafClover || 0} | ⭐ 幸运星: ${this.gameState.luckyStarCount || 0}${this.gameState.loanAmount > 0 ? `<br><span style="color: #ff6b6b;">💸 欠款: ${this.gameState.loanAmount.toLocaleString()} 元</span>` : ''}`; 
            playersList.appendChild(myItem); 
        }
        this.otherPlayers.forEach((state) => { 
            const item = document.createElement('div'); 
            item.className = 'player-item'; 
            item.innerHTML = `<strong>👤 ${this.escapeHtml(state.playerName)}</strong><br>💰 ${state.cash.toLocaleString()} 元 | ⚡ ${state.energy}/${state.maxEnergy}<br>🍀 四叶草: ${state.fourLeafClover || 0} | ⭐ 幸运星: ${state.luckyStarCount || 0}${state.loanAmount > 0 ? `<br><span style="color: #ff6b6b;">💸 欠款: ${state.loanAmount.toLocaleString()} 元</span>` : ''}`; 
            playersList.appendChild(item); 
        });
    }
    
    renderAllTiles() { if (!this.gameState) return; this.renderLayerOnCircle('reverseCellsLayer', this.reverseTiles, this.gameState.reversePos, this.gameState.inReverse, 15, 48); this.renderLayerOnCircle('streamlineCellsLayer', this.streamlineTiles, this.gameState.streamlinePos, !this.gameState.inReverse && !this.gameState.inFlow, 35, 45); this.renderLayerOnHollowSquare('flowCellsLayer', this.flowTiles, this.gameState.flowPos, this.gameState.inFlow, 45); }
    renderLayerOnCircle(containerId, tiles, currentPos, isActive, radiusPercent, cellSizePx) { const container = this.getElement(containerId); if (!container) return; container.innerHTML = ''; const angleStep = (2 * Math.PI) / tiles.length; for (let i = 0; i < tiles.length; i++) { const angle = angleStep * i - Math.PI / 2; const x = 50 + radiusPercent * Math.cos(angle); const y = 50 + radiusPercent * Math.sin(angle); const cell = document.createElement('div'); cell.className = `cell type-${tiles[i].type}`; if (isActive && i === currentPos) cell.classList.add('highlight'); cell.style.cssText = `position: absolute; left: ${x}%; top: ${y}%; transform: translate(-50%, -50%); width: ${cellSizePx}px; height: ${cellSizePx}px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 8px; font-size: 8px; font-weight: bold; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`; const shortName = tiles[i].name.length > 3 ? tiles[i].name.substring(0, 3) : tiles[i].name; cell.innerHTML = `<div style="font-size: 10px; font-weight: bold;">${i + 1}</div><div style="font-size: 7px;">${shortName}</div>`; if (isActive && i === currentPos) { const tokenDiv = document.createElement('div'); tokenDiv.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 28px; height: 28px; background: radial-gradient(circle, #ff3b3b, #b71c1c); border-radius: 50%; box-shadow: 0 0 0 2px #ffd966, 0 0 0 3px rgba(0,0,0,0.3); border: 2px solid #ffec80; z-index: 25; display: flex; align-items: center; justify-content: center;`; tokenDiv.innerHTML = '⚡'; tokenDiv.style.fontSize = '16px'; tokenDiv.style.color = '#ffec80'; cell.appendChild(tokenDiv); } container.appendChild(cell); } }
    renderLayerOnHollowSquare(containerId, tiles, currentPos, isActive, cellSizePx) { const container = this.getElement(containerId); if (!container) return; container.innerHTML = ''; const minBound = 5, maxBound = 95, range = maxBound - minBound; for (let i = 0; i < tiles.length; i++) { const ratio = i / tiles.length; const perimeter = ratio * 4; let x, y; if (perimeter < 1) { x = minBound + (perimeter * range); y = minBound; } else if (perimeter < 2) { x = maxBound; y = minBound + ((perimeter - 1) * range); } else if (perimeter < 3) { x = maxBound - ((perimeter - 2) * range); y = maxBound; } else { x = minBound; y = maxBound - ((perimeter - 3) * range); } const cell = document.createElement('div'); cell.className = `cell type-${tiles[i].type}`; if (isActive && i === currentPos) cell.classList.add('highlight'); cell.style.cssText = `position: absolute; left: ${x}%; top: ${y}%; transform: translate(-50%, -50%); width: ${cellSizePx}px; height: ${cellSizePx}px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 8px; font-size: 8px; font-weight: bold; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`; const shortName = tiles[i].name.length > 3 ? tiles[i].name.substring(0, 3) : tiles[i].name; cell.innerHTML = `<div style="font-size: 10px; font-weight: bold;">${i + 1}</div><div style="font-size: 7px;">${shortName}</div>`; if (isActive && i === currentPos) { const tokenDiv = document.createElement('div'); tokenDiv.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 28px; height: 28px; background: radial-gradient(circle, #ff3b3b, #b71c1c); border-radius: 50%; box-shadow: 0 0 0 2px #ffd966, 0 0 0 3px rgba(0,0,0,0.3); border: 2px solid #ffec80; z-index: 25; display: flex; align-items: center; justify-content: center;`; tokenDiv.innerHTML = '⚡'; tokenDiv.style.fontSize = '16px'; tokenDiv.style.color = '#ffec80'; cell.appendChild(tokenDiv); } container.appendChild(cell); } }
}

// ==================== 初始化 ====================
let gameClient;
document.addEventListener('DOMContentLoaded', () => {
    gameClient = new GameClient();
    window.gameClient = gameClient;
    console.log('🎮 游戏客户端已初始化，点击连接按钮选择职业');
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); align-items: center; justify-content: center; }
        .modal.show { display: flex; }
        .modal-content { background: white; border-radius: 24px; padding: 24px; max-width: 600px; width: 90%; max-height: 85vh; overflow-y: auto; animation: slideIn 0.3s ease; }
        .modal-title { font-size: 24px; font-weight: bold; margin-bottom: 16px; }
        .btn-primary, .btn-secondary { padding: 10px 20px; border: none; border-radius: 20px; cursor: pointer; font-weight: bold; transition: 0.2s; }
        .btn-primary { background: #ffb347; color: #333; }
        .btn-secondary { background: #ccc; color: #333; }
        .log-entry { padding: 5px; border-bottom: 1px solid #555; font-size: 11px; }
        .player-item { background: rgba(255, 179, 71, 0.2); padding: 8px; border-radius: 10px; font-size: 12px; border-left: 3px solid #ffb347; margin-bottom: 8px; }
        .cell { transition: all 0.2s ease; }
        .cell:hover { transform: scale(1.05); z-index: 99; }
        .cell.highlight { box-shadow: 0 0 0 3px #ffff88, 0 0 0 6px #ff9800; transform: scale(1.1); z-index: 200; }
    `;
    document.head.appendChild(style);
});