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
            { name: "起點", type: "start" }, { name: "機會卡", type: "opportunity" }, { name: "升職加薪", type: "income" },
            { name: "機會卡", type: "opportunity" }, { name: "結算日", type: "settlement" }, { name: "機會卡", type: "opportunity" },
            { name: "孩子出生", type: "event" }, { name: "機會卡", type: "opportunity" }, { name: "副業發展", type: "income" },
            { name: "幸運星", type: "lucky_star" }, { name: "結算日", type: "settlement" }, { name: "機會卡", type: "opportunity" },
            { name: "恩典時刻", type: "grace" }, { name: "慈善捐款", type: "event" }, { name: "保險規劃", type: "event" },
            { name: "機會卡", type: "opportunity" }, { name: "教育投資", type: "event" }, { name: "四葉草", type: "four_leaf_clover" },
            { name: "市場轉機", type: "market" }, { name: "機會卡", type: "opportunity" }, { name: "創業啟動", type: "income" },
            { name: "機會卡", type: "opportunity" }, { name: "職業轉換", type: "event" }, { name: "機會卡", type: "opportunity" }
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
            default: this.addLog(`⚠️ 未知消息类型: ${message.type}`, 'warning');
        }
    }
    
    // ==================== 股票菜单处理 ====================
    
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
    
    // ==================== 加密货币菜单处理 ====================
    
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
        const totalExp = this.gameState.livingExpense + this.gameState.tax + this.gameState.loanInterest + this.gameState.childExpense;
        const monthlyCF = (this.gameState.salary + this.gameState.sideIncome + this.gameState.passiveIncome) - totalExp;
        
        const totalLoanRepay = this.gameState.loanAmount + Math.round(this.gameState.loanAmount * 0.1);
        
        const luckyStarCount = this.gameState.luckyStarCount || 0;
        const fourLeafCloverCount = this.gameState.fourLeafClover || 0;
        
        const elements = ['statCash', 'statSalary', 'statSideIncome', 'statPassiveIncome', 'statMonthlyCF', 'statLiving', 'statTax', 'statLoanInterest', 'statTotalExpense', 'statEnergy', 'statLuck', 'statLuckyStar', 'statLayer', 'statFourLeafClover'];
        const values = [this.gameState.cash, this.gameState.salary, this.gameState.sideIncome, this.gameState.passiveIncome, monthlyCF, this.gameState.livingExpense, this.gameState.tax, this.gameState.loanInterest, totalExp, `${this.gameState.energy}/${this.gameState.maxEnergy}`, this.gameState.luck.toFixed(1), luckyStarCount, this.gameState.inFlow ? '顺流层' : (this.gameState.inReverse ? '逆流层' : '平流层'), fourLeafCloverCount];
        
        elements.forEach((id, idx) => { const el = this.getElement(id); if (el) el.innerText = values[idx]; });
        
        const totalLoanRepayEl = this.getElement('statTotalLoanRepay');
        if (totalLoanRepayEl) {
            totalLoanRepayEl.innerText = totalLoanRepay.toLocaleString();
            if (this.gameState.loanAmount > 0) {
                totalLoanRepayEl.style.color = '#ff6b6b';
            } else {
                totalLoanRepayEl.style.color = '#4caf50';
            }
        }
        
        const loanBtn = this.getButton('btnLoan');
        if (loanBtn) {
            loanBtn.disabled = this.gameState.loanAmount > 0;
            if (this.gameState.loanAmount > 0) {
                loanBtn.title = '请先还清当前贷款';
            } else {
                loanBtn.title = '';
            }
        }
        
        const repayBtn = this.getButton('btnRepayLoan');
        if (repayBtn) {
            repayBtn.disabled = this.gameState.loanAmount === 0;
        }
        
        const useCloverBtn = this.getButton('btnUseClover');
        if (useCloverBtn) {
            useCloverBtn.disabled = fourLeafCloverCount === 0;
            useCloverBtn.textContent = fourLeafCloverCount > 0 ? `🍀 四葉草 (x2) x${fourLeafCloverCount}` : '🍀 四葉草 (x2)';
        }
        
        const useLuckyStarBtn = this.getButton('btnUseLuckyStar');
        if (useLuckyStarBtn) {
            useLuckyStarBtn.disabled = luckyStarCount === 0;
            useLuckyStarBtn.textContent = luckyStarCount > 0 ? `⭐ 幸運星 (x3) x${luckyStarCount}` : '⭐ 幸運星 (x3)';
        }
        
        const statMonthlyCFEl = this.getElement('statMonthlyCF'); if (statMonthlyCFEl) statMonthlyCFEl.innerText = (monthlyCF >= 0 ? '+' : '') + monthlyCF.toLocaleString();
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