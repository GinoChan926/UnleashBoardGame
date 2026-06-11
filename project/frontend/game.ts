// ==================== 类型定义 ====================

interface GameState {
    playerId: string;
    playerName: string;
    streamlinePos: number;
    reversePos: number;
    flowPos: number;
    inReverse: boolean;
    inFlow: boolean;
    cash: number;
    salary: number;
    sideIncome: number;
    passiveIncome: number;
    livingExpense: number;
    tax: number;
    loanAmount: number;
    loanInterest: number;
    childExpense: number;
    totalAssets: number;
    childCount: number;
    hasSpouse: boolean;
    energy: number;
    maxEnergy: number;
    luck: number;
    maxLuck: number;
    silverWing: boolean;
    usedSilverWing: boolean;
    businessCostDiscount?: number;
    hasDesignSkill?: boolean;
    hasFinanceSkill?: boolean;
    hasMarketingSkill?: boolean;
    hasBusinessDiscount?: boolean;
}

interface Tile {
    name: string;
    type: string;
    needEnergy?: number;
}

interface CardType {
    id: string;
    name: string;
    icon: string;
    color: string;
    count?: number;
}

interface OpportunityCard {
    id: string;
    name: string;
    description: string;
    image: string;
    cost: number;
    cardType?: string;
    cardTypeName?: string;
    cardTypeIcon?: string;
    investmentCost?: number;
}

interface EffectChanges {
    cashChange: number;
    sideIncomeChange: number;
    passiveIncomeChange: number;
    salaryChange: number;
    energyChange: number;
    luckChange: number;
    loanChange: number;
    livingExpenseChange: number;
    childExpenseChange: number;
    hasDesignSkill: boolean;
    hasFinanceSkill: boolean;
    hasMarketingSkill: boolean;
    businessCostDiscount: number;
}

interface EffectPreview {
    description: string;
    changes: EffectChanges;
    canAfford?: boolean;
    investmentCost?: number;
}

interface GameMessage {
    type: string;
    playerId?: string;
    playerName?: string;
    data?: any;
    steps?: number;
    loanAmount?: number;
    reason?: string;
    gameState?: GameState;
    message?: string;
    otherPlayers?: Array<{ id: string; name: string; gameState: GameState }>;
    player?: { id: string; name: string; gameState: GameState };
    tile?: Tile;
    eventMessage?: string;
    card?: OpportunityCard;
    cardTypes?: CardType[];
    canAfford?: boolean;
    decision?: string;
    cardName?: string;
    effectMessage?: string;
    cardType?: string;
    cardTypeName?: string;
    effectPreview?: EffectPreview;
    execute?: boolean;
    [key: string]: any;
}

// ==================== GameClient 类 ====================

class GameClient {
    private ws: WebSocket | null = null;
    private playerId: string = '';
    private playerName: string = '';
    private gameState: GameState | null = null;
    private otherPlayers: Map<string, GameState> = new Map();
    private isConnected: boolean = false;
    private waitingForAction: boolean = false;
    private currentEvent: any = null;
    
    private musicEndedHandled: boolean = false;
    private gameOver: boolean = false;

    private streamlineTiles: Tile[] = [
        { name: "起點", type: "start" },
        { name: "機會卡", type: "opportunity" },
        { name: "升職加薪", type: "income" },
        { name: "市場行情", type: "market" },
        { name: "結算日", type: "settlement" },
        { name: "結婚事件", type: "event" },
        { name: "孩子出生", type: "event" },
        { name: "機會卡", type: "opportunity" },
        { name: "副業發展", type: "income" },
        { name: "房產投資", type: "income" },
        { name: "結算日", type: "settlement" },
        { name: "覺察卡", type: "awareness" },
        { name: "恩典時刻", type: "grace" },
        { name: "慈善捐款", type: "event" },
        { name: "保險規劃", type: "event" },
        { name: "機會卡", type: "opportunity" },
        { name: "教育投資", type: "event" },
        { name: "醫療支出", type: "expense" },
        { name: "市場轉機", type: "market" },
        { name: "逆流入口", type: "reversal" },
        { name: "創業啟動", type: "income" },
        { name: "股票分紅", type: "income" },
        { name: "職業轉換", type: "event" },
        { name: "財務檢視", type: "awareness" }
    ];

    private reverseTiles: Tile[] = [
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

    private flowTiles: Tile[] = [
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

    // ==================== 构造函数 ====================

    constructor() {
        this.setupMusicMonitor();
        this.setupOpportunityModal();
        this.setupCardTypeModal();
        this.setupPurchaseConfirmModal();
        this.setupEffectConfirmModal();
        this.setupNotificationContainer();
        this.bindGlobalEvents();
    }

    // ==================== UI 设置 ====================

    private bindGlobalEvents(): void {
        (window as any).gameClient = this;
        
        const connectBtn = document.getElementById('btnConnect');
        const rollBtn = document.getElementById('btnRoll');
        const endTurnBtn = document.getElementById('btnEndTurn');
        const loanBtn = document.getElementById('btnLoan');
        const disconnectBtn = document.getElementById('btnDisconnect');
        
        if (connectBtn) connectBtn.onclick = () => this.connect();
        if (rollBtn) rollBtn.onclick = () => this.rollDice();
        if (endTurnBtn) endTurnBtn.onclick = () => this.endTurn();
        if (loanBtn) loanBtn.onclick = () => this.applyLoan();
        if (disconnectBtn) disconnectBtn.onclick = () => this.disconnect();
    }

    private setupNotificationContainer(): void {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 350px;
            `;
            document.body.appendChild(container);
        }
    }

    private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const colors = {
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
            font-size: 14px;
            cursor: pointer;
        `;
        notification.textContent = message;

        notification.onclick = () => notification.remove();
        container.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // ==================== 辅助函数 ====================

    private getButton(id: string): HTMLButtonElement | null {
        return document.getElementById(id) as HTMLButtonElement | null;
    }

    private getInput(id: string): HTMLInputElement | null {
        return document.getElementById(id) as HTMLInputElement | null;
    }

    private getElement(id: string): HTMLElement | null {
        return document.getElementById(id);
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private setupButtonListeners(confirmBtn: Element | null, cancelBtn: Element | null, onConfirm: () => void, onCancel: () => void): void {
        if (confirmBtn) {
            confirmBtn.removeEventListener('click', onConfirm);
            confirmBtn.addEventListener('click', onConfirm);
        }
        if (cancelBtn) {
            cancelBtn.removeEventListener('click', onCancel);
            cancelBtn.addEventListener('click', onCancel);
        }
    }

    // ==================== 购买确认模态框 ====================

    private setupPurchaseConfirmModal(): void {
        let modal = document.getElementById('purchaseConfirmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'purchaseConfirmModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #fff9e6, #fff3d6); border-radius: 20px;">
                    <div class="modal-title" style="text-align: center; color: #ff9800; font-size: 24px;">💰 购买机会卡</div>
                    <div id="purchaseCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="purchaseCardImg" src="" alt="机会卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.2); border: 3px solid #ffb347;">
                    </div>
                    <div class="modal-body" id="purchaseModalBody" style="font-size: 16px; line-height: 1.5;"></div>
                    <div id="purchaseCardTypeBadge" style="text-align: center; margin: 10px 0;">
                        <span id="purchaseCardTypeSpan" style="display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; color: white;"></span>
                    </div>
                    <div style="background: #ffecb3; padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;">
                        <span style="font-size: 18px; font-weight: bold;">💰 购买费用: 500 元</span>
                        <span id="purchaseAffordWarning" style="color: #d32f2f; display: none; margin-left: 10px;">(现金不足)</span>
                    </div>
                    <div class="modal-buttons" style="display: flex; gap: 15px; justify-content: center;">
                        <button class="btn-secondary" id="cancelPurchaseBtn" style="background: #9e9e9e; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">❌ 放弃购买</button>
                        <button class="btn-primary" id="confirmPurchaseBtn" style="background: #ff9800; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">💰 支付500购买</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    private setupEffectConfirmModal(): void {
        let modal = document.getElementById('effectConfirmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'effectConfirmModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 550px; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 20px;">
                    <div class="modal-title" style="text-align: center; color: #2e7d32; font-size: 24px;">✨ 卡片效果预览</div>
                    <div id="effectCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="effectCardImg" src="" alt="机会卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.2); border: 3px solid #4caf50;">
                    </div>
                    <div class="modal-body" id="effectModalBody" style="font-size: 16px; line-height: 1.5;"></div>
                    <div id="effectChanges" style="background: #ffffff; padding: 15px; border-radius: 12px; margin: 15px 0; font-size: 14px;">
                        <strong>📊 效果预览:</strong>
                        <div id="effectChangesList"></div>
                    </div>
                    <div style="background: #fff3e0; padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;">
                        <span style="font-size: 16px; font-weight: bold;">⚠️ 注意：执行后无法撤销！</span>
                    </div>
                    <div class="modal-buttons" style="display: flex; gap: 15px; justify-content: center;">
                        <button class="btn-secondary" id="declineExecuteBtn" style="background: #9e9e9e; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">❌ 不执行</button>
                        <button class="btn-primary" id="confirmExecuteBtn" style="background: #4caf50; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">✅ 确认执行</button>
                    </div>
                    <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #666;">
                        (已支付 500 元，不执行费用不退还)
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    public showPurchaseConfirm(card: OpportunityCard, canAfford: boolean): void {
        const modal = document.getElementById('purchaseConfirmModal');
        const modalBody = document.getElementById('purchaseModalBody');
        const cardImage = document.getElementById('purchaseCardImg') as HTMLImageElement;
        const confirmBtn = document.getElementById('confirmPurchaseBtn');
        const cancelBtn = document.getElementById('cancelPurchaseBtn');
        const affordWarning = document.getElementById('purchaseAffordWarning');
        const cardTypeSpan = document.getElementById('purchaseCardTypeSpan');
        
        if (!modal || !modalBody) return;
        
        if (cardTypeSpan && card.cardTypeName) {
            const typeColors: Record<string, string> = {
                'part_time': '#4caf50',
                'finance': '#2196f3',
                'business': '#ff9800',
                'property': '#9c27b0'
            };
            const color = typeColors[card.cardType || ''] || '#ffb347';
            cardTypeSpan.style.backgroundColor = color;
            cardTypeSpan.innerHTML = `${card.cardTypeIcon || '🎴'} ${card.cardTypeName || '机会卡'}`;
        }
        
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #ff6f00; margin-bottom: 10px; font-size: 20px;">${this.escapeHtml(card.name)}</h3>
                <p style="color: #555; font-size: 14px;">${this.escapeHtml(card.description)}</p>
                <div style="background: #e3f2fd; padding: 10px; border-radius: 8px; margin-top: 10px;">
                    <span style="color: #1565c0;">💡 支付 500 元购买后，可查看详细效果并决定是否执行</span>
                </div>
            </div>
        `;
        
        if (cardImage && card.image) {
            cardImage.src = card.image;
            cardImage.onerror = () => {
                cardImage.src = 'cards/default.jpg';
            };
        }
        
        if (affordWarning) {
            affordWarning.style.display = canAfford ? 'none' : 'inline';
        }
        
        const handleConfirm = () => {
            this.sendPurchaseCard();
            this.closePurchaseConfirmModal();
        };
        
        const handleCancel = () => {
            this.closePurchaseConfirmModal();
            this.addLog('已放弃购买机会卡', 'warning');
        };
        
        this.setupButtonListeners(confirmBtn, cancelBtn, handleConfirm, handleCancel);
        
        if (confirmBtn) {
            (confirmBtn as HTMLButtonElement).disabled = !canAfford;
            if (!canAfford) {
                confirmBtn.classList.add('disabled');
                (confirmBtn as HTMLButtonElement).style.opacity = '0.5';
                (confirmBtn as HTMLButtonElement).style.cursor = 'not-allowed';
            } else {
                (confirmBtn as HTMLButtonElement).style.opacity = '1';
                (confirmBtn as HTMLButtonElement).style.cursor = 'pointer';
            }
        }
        
        modal.classList.add('show');
        this.waitingForAction = true;
    }

    public showEffectConfirm(card: OpportunityCard, effectPreview: EffectPreview): void {
        const modal = document.getElementById('effectConfirmModal');
        const modalBody = document.getElementById('effectModalBody');
        const effectChangesList = document.getElementById('effectChangesList');
        const cardImage = document.getElementById('effectCardImg') as HTMLImageElement;
        const confirmBtn = document.getElementById('confirmExecuteBtn');
        const declineBtn = document.getElementById('declineExecuteBtn');
        
        if (!modal || !modalBody || !effectChangesList) return;
        
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #2e7d32; margin-bottom: 10px; font-size: 20px;">${this.escapeHtml(card.name)}</h3>
                <p style="color: #555; font-size: 14px;">${this.escapeHtml(card.description)}</p>
            </div>
        `;
        
        const changes = effectPreview.changes;
        let changesHtml = '';
        
        if (changes.cashChange !== 0) {
            const color = changes.cashChange > 0 ? '#4caf50' : '#f44336';
            const sign = changes.cashChange > 0 ? '+' : '';
            changesHtml += `<div style="margin: 5px 0;"><span style="color: ${color};">💰 现金: ${sign}${changes.cashChange.toLocaleString()} 元</span></div>`;
        }
        if (changes.sideIncomeChange !== 0) {
            const color = changes.sideIncomeChange > 0 ? '#4caf50' : '#f44336';
            const sign = changes.sideIncomeChange > 0 ? '+' : '';
            changesHtml += `<div><span style="color: ${color};">💪 副业收入: ${sign}${changes.sideIncomeChange.toLocaleString()} 元/月</span></div>`;
        }
        if (changes.passiveIncomeChange !== 0) {
            const color = changes.passiveIncomeChange > 0 ? '#4caf50' : '#f44336';
            const sign = changes.passiveIncomeChange > 0 ? '+' : '';
            changesHtml += `<div><span style="color: ${color};">📈 被动收入: ${sign}${changes.passiveIncomeChange.toLocaleString()} 元/月</span></div>`;
        }
        if (changes.salaryChange !== 0) {
            const color = changes.salaryChange > 0 ? '#4caf50' : '#f44336';
            const sign = changes.salaryChange > 0 ? '+' : '';
            changesHtml += `<div><span style="color: ${color};">💼 月薪: ${sign}${changes.salaryChange.toLocaleString()} 元</span></div>`;
        }
        if (changes.energyChange !== 0) {
            const color = changes.energyChange > 0 ? '#4caf50' : '#f44336';
            const sign = changes.energyChange > 0 ? '+' : '';
            changesHtml += `<div><span style="color: ${color};">⚡ 精力: ${sign}${changes.energyChange}</span></div>`;
        }
        if (changes.luckChange !== 0) {
            const color = changes.luckChange > 0 ? '#4caf50' : '#f44336';
            const sign = changes.luckChange > 0 ? '+' : '';
            changesHtml += `<div><span style="color: ${color};">🍀 幸运值: ${sign}${changes.luckChange.toFixed(1)}</span></div>`;
        }
        if (changes.hasDesignSkill) {
            changesHtml += `<div><span style="color: #9c27b0;">🎨 获得被动技能: 生意成本 -20%</span></div>`;
        }
        if (changes.businessCostDiscount > 0 && !changes.hasDesignSkill) {
            changesHtml += `<div><span style="color: #9c27b0;">🎨 生意成本折扣: ${changes.businessCostDiscount}%</span></div>`;
        }
        
        if (changesHtml === '') {
            changesHtml = '<div>无数据变化（可能影响其他属性）</div>';
        }
        
        effectChangesList.innerHTML = changesHtml;
        
        const effectDesc = document.createElement('div');
        effectDesc.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; color: #666; font-style: italic;';
        effectDesc.innerHTML = `📝 "${this.escapeHtml(effectPreview.description)}"`;
        effectChangesList.appendChild(effectDesc);
        
        if (cardImage && card.image) {
            cardImage.src = card.image;
            cardImage.onerror = () => {
                cardImage.src = 'cards/default.jpg';
            };
        }
        
        const handleConfirm = () => {
            this.sendExecuteCard(true);
            this.closeEffectConfirmModal();
        };
        
        const handleDecline = () => {
            this.sendExecuteCard(false);
            this.closeEffectConfirmModal();
        };
        
        this.setupButtonListeners(confirmBtn, declineBtn, handleConfirm, handleDecline);
        
        modal.classList.add('show');
        this.waitingForAction = true;
    }

    private sendPurchaseCard(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        
        this.ws.send(JSON.stringify({
            type: 'purchase_card'
        }));
    }

    private sendExecuteCard(execute: boolean): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        
        this.ws.send(JSON.stringify({
            type: 'execute_card',
            execute: execute
        }));
    }

    public closePurchaseConfirmModal(): void {
        const modal = document.getElementById('purchaseConfirmModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.waitingForAction = false;
    }

    public closeEffectConfirmModal(): void {
        const modal = document.getElementById('effectConfirmModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.waitingForAction = false;
    }

    // ==================== 机会卡模态框 ====================

    private setupOpportunityModal(): void {
        let modal = document.getElementById('opportunityModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'opportunityModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #fff9e6, #fff3d6); border-radius: 20px;">
                    <div class="modal-title" style="text-align: center; color: #ff9800; font-size: 24px;">🎴 机会卡</div>
                    <div id="opportunityCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="cardImage" src="" alt="机会卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.2); border: 3px solid #ffb347;">
                    </div>
                    <div class="modal-body" id="opportunityModalBody" style="font-size: 16px; line-height: 1.5;"></div>
                    <div id="cardTypeBadge" style="text-align: center; margin: 10px 0;">
                        <span id="cardTypeSpan" style="display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; color: white;"></span>
                    </div>
                    <div style="background: #ffecb3; padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;">
                        <span style="font-size: 18px; font-weight: bold;">💰 执行费用: 500 元</span>
                        <span id="affordWarning" style="color: #d32f2f; display: none; margin-left: 10px;">(现金不足)</span>
                    </div>
                    <div class="modal-buttons" style="display: flex; gap: 15px; justify-content: center;">
                        <button class="btn-secondary" id="declineBtn" style="background: #9e9e9e; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">❌ 放弃</button>
                        <button class="btn-primary" id="acceptBtn" style="background: #ff9800; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">✅ 执行 (花费500)</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    public showOpportunityCard(card: OpportunityCard, canAfford: boolean): void {
        this.showPurchaseConfirm(card, canAfford);
    }

    public closeOpportunityModal(): void {
        const modal = document.getElementById('opportunityModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.waitingForAction = false;
    }

    // ==================== 卡片类型选择模态框 ====================

    private setupCardTypeModal(): void {
        let modal = document.getElementById('cardTypeModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cardTypeModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 650px; background: linear-gradient(135deg, #1a472a, #0d2b1a); border-radius: 24px;">
                    <div class="modal-title" style="text-align: center; color: #ffd966; font-size: 24px;">🎴 选择机会卡类型</div>
                    <div class="modal-body" id="cardTypeBody" style="text-align: center;">
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 20px;" id="cardTypeButtons"></div>
                    </div>
                    <div style="background: rgba(0,0,0,0.5); padding: 12px; border-radius: 12px; margin: 10px 20px; text-align: center;">
                        <span style="color: #ffd966;">💰 执行任何机会卡都需要花费 500 元</span>
                    </div>
                    <div class="modal-buttons" style="justify-content: center; margin: 15px 0 20px 0;">
                        <button class="btn-secondary" id="cancelCardTypeBtn" style="background: #9e9e9e; padding: 10px 30px; border-radius: 30px; cursor: pointer;">取消</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    public showCardTypeSelection(cardTypes: CardType[], canAfford: boolean): void {
        const modal = document.getElementById('cardTypeModal');
        const buttonsContainer = document.getElementById('cardTypeButtons');
        const cancelBtn = document.getElementById('cancelCardTypeBtn');
        
        if (!modal || !buttonsContainer) return;
        
        buttonsContainer.innerHTML = '';
        
        const typeColors: Record<string, string> = {
            'part_time': '#4caf50',
            'finance': '#2196f3',
            'business': '#ff9800',
            'property': '#9c27b0'
        };
        
        const typeIcons: Record<string, string> = {
            'part_time': '💼',
            'finance': '📈',
            'business': '🚀',
            'property': '🏠'
        };
        
        cardTypes.forEach(type => {
            const btn = document.createElement('button');
            btn.style.cssText = `
                background: ${typeColors[type.id] || '#ffb347'};
                border: none;
                padding: 18px 25px;
                border-radius: 60px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                min-width: 120px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            `;
            btn.innerHTML = `
                <span style="font-size: 32px;">${typeIcons[type.id] || type.icon || '🎴'}</span>
                <span>${this.escapeHtml(type.name)}</span>
                <span style="font-size: 11px; opacity: 0.8;">${type.count || '?'} 张卡片</span>
            `;
            
            btn.onmouseenter = () => { 
                btn.style.transform = 'scale(1.05)'; 
                btn.style.boxShadow = '0 6px 15px rgba(0,0,0,0.4)';
            };
            btn.onmouseleave = () => { 
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
            };
            
            if (!canAfford) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = '现金不足500元，无法执行机会卡';
            } else {
                btn.onclick = () => {
                    this.sendCardTypeChoice(type.id);
                    this.closeCardTypeModal();
                };
            }
            
            buttonsContainer.appendChild(btn);
        });
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.closeCardTypeModal();
                this.addLog('已取消选择机会卡', 'warning');
            };
        }
        
        modal.classList.add('show');
        this.waitingForAction = true;
    }

    public closeCardTypeModal(): void {
        const modal = document.getElementById('cardTypeModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.waitingForAction = false;
    }

    private sendCardTypeChoice(cardType: string): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('WebSocket not connected');
            return;
        }
        
        const message = {
            type: 'card_type_choice',
            cardType: cardType
        };
        console.log('发送卡片类型选择:', message);
        this.ws.send(JSON.stringify(message));
    }

    // ==================== 音乐功能 ====================

    private setupMusicMonitor(): void {
        const audio = document.getElementById('bgAudio') as HTMLAudioElement;
        if (!audio) return;
        
        const statusDiv = this.getElement('musicStatus');
        
        const handleMusicEnd = () => {
            if (this.musicEndedHandled) return;
            this.musicEndedHandled = true;
            this.gameOver = true;
            
            if (statusDiv) statusDiv.innerHTML = '⏹️ 音乐已结束 | 游戏终止';
            
            this.addLog('🔴 背景音乐结束，游戏终止', 'error');
            
            const logContainer = this.getElement('logContainer');
            const logs: string[] = [];
            if (logContainer) {
                for (let child of logContainer.children) {
                    logs.push(child.textContent || '');
                }
            }
            
            this.showGameEndModal(logs);
            this.disableGameControls();
            
            if (this.ws) {
                this.ws.close();
            }
        };
        
        audio.addEventListener('ended', handleMusicEnd);
        
        audio.addEventListener('play', () => {
            if (statusDiv) statusDiv.innerHTML = '🎧 播放中 | 音乐停止将自动结束游戏并回顾日志';
            this.musicEndedHandled = false;
        });
        
        audio.addEventListener('pause', () => {
            if (!this.gameOver && !audio.ended && !this.musicEndedHandled) {
                if (statusDiv) statusDiv.innerHTML = '⏸️ 已暂停 | 音乐停止不会结束游戏';
            }
        });
        
        audio.play().catch(() => {
            this.addLog('🎵 点击页面任意位置播放背景音乐', 'default');
            const playOnce = () => {
                audio.play();
                document.body.removeEventListener('click', playOnce);
            };
            document.body.addEventListener('click', playOnce, { once: true });
        });
    }

    private showGameEndModal(logs: string[]): void {
        let endModal = this.getElement('gameEndModal');
        if (!endModal) {
            endModal = document.createElement('div');
            endModal.id = 'gameEndModal';
            endModal.className = 'modal';
            endModal.innerHTML = `
                <div class="modal-content" style="max-width: 700px; border-radius: 24px;">
                    <div class="modal-title" id="endModalTitle" style="color: #ff9800; text-align: center; font-size: 24px;">🎵 音乐结束 - 游戏终止</div>
                    <div class="modal-body" id="endModalBody"></div>
                    <div class="log-review" id="endLogReview" style="font-family: monospace; font-size: 12px; background: #f5f5f5; padding: 15px; border-radius: 16px; max-height: 400px; overflow-y: auto; margin-top: 15px;"></div>
                    <div class="modal-buttons" style="margin-top: 15px; justify-content: center;">
                        <button class="btn-primary" onclick="location.reload()" style="background: #ff9800; padding: 12px 30px; border-radius: 30px; cursor: pointer;">重新开始</button>
                    </div>
                </div>
            `;
            document.body.appendChild(endModal);
            endModal = this.getElement('gameEndModal');
        }
        
        const endBody = this.getElement('endModalBody');
        const endReview = this.getElement('endLogReview');
        
        if (this.gameState && endBody) {
            const totalExp = this.gameState.livingExpense + this.gameState.tax + this.gameState.loanInterest + this.gameState.childExpense;
            const monthlyCF = (this.gameState.salary + this.gameState.sideIncome + this.gameState.passiveIncome) - totalExp;
            
            endBody.innerHTML = `
                <div style="margin-bottom: 15px; padding: 15px; background: #e8f5e9; border-radius: 16px;">
                    <strong style="font-size: 16px;">🎯 最终财务状态</strong><br><br>
                    现金: ${this.gameState.cash.toLocaleString()} 元<br>
                    月现金流: ${monthlyCF >= 0 ? '+' : ''}${monthlyCF.toLocaleString()} 元<br>
                    总资产: ${this.gameState.totalAssets.toLocaleString()} 元<br>
                    精力: ${this.gameState.energy}/${this.gameState.maxEnergy}<br>
                    幸运值: ${this.gameState.luck.toFixed(1)}<br>
                    层级: ${this.gameState.inFlow ? '顺流层' : (this.gameState.inReverse ? '逆流层' : '平流层')}
                </div>
                <div><strong>📜 完整游戏日志回顾</strong></div>
            `;
        }
        
        if (endReview) {
            endReview.innerHTML = logs.map(log => `<div style="padding: 6px 0; border-bottom: 1px solid #ddd;">${this.escapeHtml(log)}</div>`).join('');
            if (logs.length === 0) endReview.innerHTML = '<div>暂无日志记录</div>';
        }
        
        if (endModal) endModal.classList.add('show');
    }

    public checkMusicAndGameOver(): boolean {
        const audio = document.getElementById('bgAudio') as HTMLAudioElement;
        if (audio && audio.ended && !this.musicEndedHandled) {
            const event = new Event('ended');
            audio.dispatchEvent(event);
            return true;
        }
        return false;
    }

    // ==================== 公共方法 ====================

    public connect(): void {
        if (this.checkMusicAndGameOver()) return;
        
        const playerNameInput = this.getInput('playerName');
        this.playerName = playerNameInput?.value.trim() || `Player_${Date.now()}`;
        if (this.playerName === '') {
            this.playerName = `Player_${Date.now()}`;
        }

        this.ws = new WebSocket('ws://localhost:8080');

        this.ws.onopen = () => {
            this.isConnected = true;
            this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            this.updateNetworkStatus(true);

            const joinMessage: GameMessage = {
                type: 'join',
                playerId: this.playerId,
                playerName: this.playerName,
            };

            this.ws!.send(JSON.stringify(joinMessage));
            this.addLog(`✅ 已连接到游戏服务器`, 'success');
            this.addLog(`👤 玩家: ${this.playerName}`, 'event');
            this.showNotification(`欢迎 ${this.playerName} 加入游戏！`, 'success');
        };

        this.ws.onmessage = (event: MessageEvent) => {
            this.handleServerMessage(JSON.parse(event.data));
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            this.updateNetworkStatus(false);
            this.addLog('❌ 与服务器连接已断开', 'error');
            this.disableGameControls();
            this.showNotification('连接已断开', 'error');
        };

        this.ws.onerror = (error: Event) => {
            this.addLog('⚠️ 连接错误，请确认服务器已启动', 'error');
            console.error('WebSocket error:', error);
            this.showNotification('连接失败，请确保服务器正在运行', 'error');
        };
    }

    public rollDice(): void {
        if (this.checkMusicAndGameOver()) return;
        
        if (!this.isConnected || !this.gameState || this.gameState.energy === 0 || this.gameOver) {
            this.addLog('❌ 无法掷骰', 'error');
            return;
        }

        const message: GameMessage = {
            type: 'roll',
            playerId: this.playerId,
            data: { diceCount: 1 },
        };

        this.ws!.send(JSON.stringify(message));
    }

    public endTurn(): void {
        if (this.checkMusicAndGameOver()) return;
        
        if (!this.isConnected || this.gameOver) return;

        const message: GameMessage = {
            type: 'end_turn',
            playerId: this.playerId,
        };

        this.ws!.send(JSON.stringify(message));
    }

    public applyLoan(): void {
        if (this.checkMusicAndGameOver()) return;
        
        if (!this.isConnected || !this.gameState || this.gameOver) return;

        const maxLoan = Math.round((this.gameState.salary + this.gameState.sideIncome) * 3);
        const amount = parseInt(prompt(`贷款上限: ${maxLoan.toLocaleString()} 元\n请输入贷款金额:`) || '0');

        if (amount > 0 && amount <= maxLoan) {
            const message: GameMessage = {
                type: 'apply_loan',
                playerId: this.playerId,
                data: { amount },
            };
            this.ws!.send(JSON.stringify(message));
        } else if (amount > 0) {
            this.addLog(`❌ 贷款金额超过上限 (${maxLoan.toLocaleString()} 元)`, 'error');
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
        }
    }

    public addLog(msg: string, type: string = 'default'): void {
        const logDiv = this.getElement('logContainer');
        if (!logDiv) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const timestamp = new Date().toLocaleTimeString();
        entry.innerText = `[${timestamp}] ${msg}`;
        
        if (type === 'success') {
            entry.style.color = '#4caf50';
        } else if (type === 'error') {
            entry.style.color = '#ff6b6b';
        } else if (type === 'event') {
            entry.style.color = '#ffb347';
        } else if (type === 'warning') {
            entry.style.color = '#ff9800';
        }
        
        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;

        while (logDiv.children.length > 80) {
            logDiv.removeChild(logDiv.firstChild!);
        }
    }

    public showModal(title: string, body: string): void {
        const modalTitle = this.getElement('modalTitle');
        const modalBody = this.getElement('modalBody');
        const modal = this.getElement('eventModal');
        if (modalTitle && modalBody && modal) {
            modalTitle.innerText = title;
            modalBody.innerText = body;
            modal.classList.add('show');
            this.waitingForAction = true;
        }
    }

    public closeModal(): void {
        const modal = this.getElement('eventModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.currentEvent = null;
        this.waitingForAction = false;
    }

    public handleModalAction(): void {
        this.closeModal();
    }

    // ==================== 消息处理 ====================

    private handleServerMessage(message: GameMessage): void {
        console.log('收到服务器消息:', message.type, message);
        switch (message.type) {
            case 'join_success':
                this.handleJoinSuccess(message);
                break;
            case 'player_joined':
                this.handlePlayerJoined(message);
                break;
            case 'dice_result':
                this.handleDiceResult(message);
                break;
            case 'turn_ended':
                this.handleTurnEnded(message);
                break;
            case 'loan_approved':
                this.handleLoanApproved(message);
                break;
            case 'loan_rejected':
                this.handleLoanRejected(message);
                break;
            case 'state_updated':
                this.handleStateUpdated(message);
                break;
            case 'player_disconnected':
                this.handlePlayerDisconnected(message);
                break;
            case 'card_type_selection':
                this.handleCardTypeSelection(message);
                break;
            case 'opportunity_card_draw':
                this.handleOpportunityCardDraw(message);
                break;
            case 'card_purchased':
                this.handleCardPurchased(message);
                break;
            case 'card_decision_result':
                this.handleCardDecisionResult(message);
                break;
            case 'card_executed':
                this.handleCardExecuted(message);
                break;
            case 'card_skipped':
                this.handleCardSkipped(message);
                break;
            case 'purchase_failed':
                this.handlePurchaseFailed(message);
                break;
            case 'notification':
                this.addLog(message.message || '', 'success');
                this.showNotification(message.message || '', 'info');
                break;
            case 'error':
                this.addLog(`❌ 服务器错误: ${message.message}`, 'error');
                this.showNotification(message.message || '发生错误', 'error');
                break;
            default:
                this.addLog(`⚠️ 未知消息类型: ${message.type}`, 'warning');
        }
    }

    private handleJoinSuccess(message: GameMessage): void {
        this.gameState = message.gameState || null;
        this.otherPlayers.clear();

        if (message.otherPlayers) {
            message.otherPlayers.forEach((player) => {
                this.otherPlayers.set(player.id, player.gameState);
            });
        }

        this.enableGameControls();
        this.updateUI();
        this.renderAllTiles();
        this.updatePlayersList();
        this.addLog(`🎉 成功加入游戏！当前在线人数: ${this.otherPlayers.size + 1}`, 'success');
        
        if (message.cardTypes) {
            (window as any).cardTypes = message.cardTypes;
        }
    }

    private handlePlayerJoined(message: GameMessage): void {
        if (message.player) {
            this.otherPlayers.set(message.player.id, message.player.gameState);
            this.addLog(`👤 ${message.player.gameState.playerName} 加入游戏`, 'event');
            this.updatePlayersList();
            this.showNotification(`${message.player.gameState.playerName} 加入了游戏`, 'info');
        }
    }

    private handleDiceResult(message: GameMessage): void {
        const pid = message.playerId;
        if (!pid) return;

        const steps = message.steps || 0;
        const tileName = message.tile?.name || '未知';
        const eventMsg = message.eventMessage;

        if (pid === this.playerId) {
            this.addLog(`🎲 你掷出 ${steps} 步，移动到「${tileName}」`, 'success');
            if (eventMsg && message.tile?.type !== 'opportunity') {
                this.addLog(`📌 ${eventMsg}`, 'event');
                this.showNotification(eventMsg, 'info');
            }
            if (this.gameState && message.gameState) {
                this.gameState = message.gameState;
            }
        } else {
            const playerState = this.otherPlayers.get(pid);
            if (playerState && message.gameState) {
                this.addLog(`🎲 ${message.playerName} 掷出 ${steps} 步，移动到「${tileName}」`, 'event');
                if (eventMsg) {
                    this.addLog(`📌 ${message.playerName}: ${eventMsg}`, 'event');
                }
                this.otherPlayers.set(pid, message.gameState);
            }
        }
        this.updateUI();
        this.renderAllTiles();
        this.updatePlayersList();
    }

    private handleTurnEnded(message: GameMessage): void {
        const pid = message.playerId;
        if (!pid) return;

        if (pid === this.playerId) {
            if (message.gameState) {
                this.gameState = message.gameState;
            }
            this.addLog(`⏭️ 你结束了回合，精力恢复`, 'success');
        } else {
            if (message.gameState) {
                this.otherPlayers.set(pid, message.gameState);
            }
            this.addLog(`⏭️ ${message.playerName} 结束了回合`, 'event');
        }
        this.updateUI();
        this.updatePlayersList();
    }

    private handleLoanApproved(message: GameMessage): void {
        const pid = message.playerId;
        if (!pid) return;

        if (pid === this.playerId) {
            if (message.gameState) {
                this.gameState = message.gameState;
            }
            this.addLog(`🏦 贷款申请批准: +${message.loanAmount?.toLocaleString()} 元`, 'success');
            this.showNotification(`贷款 ${message.loanAmount?.toLocaleString()} 元已批准`, 'success');
        } else {
            if (message.gameState) {
                this.otherPlayers.set(pid, message.gameState);
            }
            this.addLog(`🏦 ${message.playerName} 申请贷款: ${message.loanAmount?.toLocaleString()} 元`, 'event');
        }
        this.updateUI();
        this.updatePlayersList();
    }

    private handleLoanRejected(message: GameMessage): void {
        this.addLog(`❌ 贷款申请被拒: ${message.reason}`, 'error');
    }

    private handleStateUpdated(message: GameMessage): void {
        const pid = message.playerId;
        if (pid && pid !== this.playerId && message.gameState) {
            this.otherPlayers.set(pid, message.gameState);
            this.updatePlayersList();
        } else if (pid === this.playerId && message.gameState) {
            this.gameState = message.gameState;
            this.updateUI();
            this.renderAllTiles();
        }
    }

    private handlePlayerDisconnected(message: GameMessage): void {
        const pid = message.playerId;
        if (pid) {
            const playerName = message.playerName;
            this.otherPlayers.delete(pid);
            this.addLog(`👤 ${playerName} 离开游戏`, 'warning');
            this.updatePlayersList();
            this.showNotification(`${playerName} 离开了游戏`, 'info');
        }
    }

    private handleCardTypeSelection(message: GameMessage): void {
        const cardTypes = message.cardTypes;
        const canAfford = message.canAfford;
        this.showCardTypeSelection(cardTypes || [], canAfford || false);
        this.addLog('🎴 请选择机会卡类型', 'event');
    }

    private handleOpportunityCardDraw(message: GameMessage): void {
        const card = message.card;
        const canAfford = message.canAfford || false;
        
        if (card) {
            this.showOpportunityCard(card, canAfford);
            this.addLog(`🎴 抽到${card.cardTypeName || ''}机会卡: ${card.name}`, 'event');
            this.showNotification(`抽到${card.cardTypeName || ''}机会卡: ${card.name}`, 'info');
        } else {
            this.addLog(`⚠️ 卡片数据不完整`, 'warning');
        }
    }

    private handleCardPurchased(message: GameMessage): void {
        const card = message.card;
        const effectPreview = message.effectPreview;
        
        if (card && effectPreview) {
            this.showEffectConfirm(card, effectPreview);
            this.addLog(`已支付 500 元购买「${card.name}」，请查看效果并决定是否执行`, 'success');
        } else {
            this.addLog(`⚠️ 卡片数据不完整，无法显示效果预览`, 'warning');
        }
    }

    private handleCardDecisionResult(message: GameMessage): void {
        if (message.execute) {
            this.addLog(`✅ ${message.message || '执行成功'}`, 'success');
            if (message.effectMessage) {
                this.addLog(`✨ ${message.effectMessage}`, 'success');
                this.showNotification(message.effectMessage, 'success');
            }
        } else {
            this.addLog(`⚠️ ${message.message || '已放弃执行'}`, 'warning');
            if (message.message) {
                this.showNotification(message.message, 'info');
            }
        }
        
        if (message.gameState && message.playerId === this.playerId) {
            this.gameState = message.gameState;
            this.updateUI();
            this.renderAllTiles();
        }
    }

    private handleCardExecuted(message: GameMessage): void {
        if (message.playerId !== this.playerId) {
            this.addLog(`✨ ${message.playerName || '某玩家'} 执行了${message.cardType || ''}「${message.cardName || ''}」: ${message.effectMessage || ''}`, 'event');
        }
        
        if (message.gameState && message.playerId === this.playerId) {
            this.gameState = message.gameState;
            this.updateUI();
            this.renderAllTiles();
        } else if (message.gameState && message.playerId) {
            this.otherPlayers.set(message.playerId, message.gameState);
            this.updatePlayersList();
        }
    }

    private handleCardSkipped(message: GameMessage): void {
        if (message.playerId !== this.playerId) {
            this.addLog(`⏭️ ${message.playerName || '某玩家'} 选择不执行${message.cardType || ''}「${message.cardName || ''}」`, 'event');
        }
    }

    private handlePurchaseFailed(message: GameMessage): void {
        this.addLog(`❌ ${message.message || '购买失败'}`, 'error');
        if (message.message) {
            this.showNotification(message.message, 'error');
        }
    }

    // ==================== UI 更新方法 ====================

    private updateNetworkStatus(connected: boolean): void {
        const statusDiv = this.getElement('networkStatus');
        if (statusDiv) {
            if (connected) {
                statusDiv.className = 'network-status connected';
                statusDiv.textContent = '🟢 已连接 | 游戏进行中';
            } else {
                statusDiv.className = 'network-status';
                statusDiv.textContent = '⚪ 未连接 | 请启动服务器后点击连接';
            }
        }
    }

    private enableGameControls(): void {
        const rollBtn = this.getButton('btnRoll');
        const endTurnBtn = this.getButton('btnEndTurn');
        const loanBtn = this.getButton('btnLoan');
        const playerNameInput = this.getInput('playerName');
        const connectBtn = this.getButton('btnConnect');

        if (rollBtn) rollBtn.disabled = false;
        if (endTurnBtn) endTurnBtn.disabled = false;
        if (loanBtn) loanBtn.disabled = false;
        if (playerNameInput) playerNameInput.disabled = true;
        if (connectBtn) connectBtn.disabled = true;
    }

    private disableGameControls(): void {
        const rollBtn = this.getButton('btnRoll');
        const endTurnBtn = this.getButton('btnEndTurn');
        const loanBtn = this.getButton('btnLoan');

        if (rollBtn) rollBtn.disabled = true;
        if (endTurnBtn) endTurnBtn.disabled = true;
        if (loanBtn) loanBtn.disabled = true;
    }

    private updateUI(): void {
        if (!this.gameState) return;

        const totalExp = this.gameState.livingExpense + this.gameState.tax + this.gameState.loanInterest + this.gameState.childExpense;
        const monthlyCF = (this.gameState.salary + this.gameState.sideIncome + this.gameState.passiveIncome) - totalExp;

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
        const statSilverWing = this.getElement('statSilverWing');
        const statLayer = this.getElement('statLayer');

        if (statCash) statCash.innerText = this.gameState.cash.toLocaleString();
        if (statSalary) statSalary.innerText = this.gameState.salary.toLocaleString();
        if (statSideIncome) statSideIncome.innerText = this.gameState.sideIncome.toLocaleString();
        if (statPassiveIncome) statPassiveIncome.innerText = this.gameState.passiveIncome.toLocaleString();
        if (statMonthlyCF) statMonthlyCF.innerText = (monthlyCF >= 0 ? '+' : '') + monthlyCF.toLocaleString();
        if (statLiving) statLiving.innerText = this.gameState.livingExpense.toLocaleString();
        if (statTax) statTax.innerText = this.gameState.tax.toLocaleString();
        if (statLoanInterest) statLoanInterest.innerText = this.gameState.loanInterest.toLocaleString();
        if (statTotalExpense) statTotalExpense.innerText = totalExp.toLocaleString();
        if (statEnergy) statEnergy.innerText = `${this.gameState.energy}/${this.gameState.maxEnergy}`;
        if (statLuck) statLuck.innerText = this.gameState.luck.toFixed(1);
        if (statSilverWing) statSilverWing.innerText = this.gameState.silverWing ? '✔️' : '❌';

        const layerText = this.gameState.inFlow ? '顺流层' : (this.gameState.inReverse ? '逆流层' : '平流层');
        if (statLayer) statLayer.innerText = layerText;

        const controlPanel = this.getElement('controlPanel');
        if (controlPanel) {
            controlPanel.className = 'panel control-panel';
            if (this.gameState.inFlow) controlPanel.classList.add('flow');
            if (this.gameState.inReverse) controlPanel.classList.add('reverse');
        }
        
        const layerTextElement = this.getElement('layerText');
        if (layerTextElement) {
            layerTextElement.innerText = layerText;
        }
    }

    private updatePlayersList(): void {
        const playersList = this.getElement('playersList');
        if (!playersList) return;
        
        playersList.innerHTML = '';

        if (this.gameState) {
            const totalExp = this.gameState.livingExpense + this.gameState.tax + this.gameState.loanInterest + this.gameState.childExpense;
            const monthlyCF = (this.gameState.salary + this.gameState.sideIncome + this.gameState.passiveIncome) - totalExp;
            
            const myItem = document.createElement('div');
            myItem.className = 'player-item';
            myItem.style.borderLeftColor = '#ffb347';
            myItem.style.background = 'rgba(255, 179, 71, 0.3)';
            myItem.style.padding = '10px';
            myItem.style.borderRadius = '10px';
            myItem.style.marginBottom = '8px';
            myItem.innerHTML = `
                <strong>👤 ${this.escapeHtml(this.gameState.playerName)} (你)</strong><br>
                💰 ${this.gameState.cash.toLocaleString()} 元 | ⚡ ${this.gameState.energy}/${this.gameState.maxEnergy}<br>
                📊 月现金流: ${monthlyCF >= 0 ? '+' : ''}${monthlyCF.toLocaleString()} 元
            `;
            playersList.appendChild(myItem);
        }

        this.otherPlayers.forEach((state) => {
            const totalExp = state.livingExpense + state.tax + state.loanInterest + state.childExpense;
            const monthlyCF = (state.salary + state.sideIncome + state.passiveIncome) - totalExp;
            
            const item = document.createElement('div');
            item.className = 'player-item';
            item.style.padding = '10px';
            item.style.borderRadius = '10px';
            item.style.marginBottom = '8px';
            item.style.background = 'rgba(255, 255, 255, 0.1)';
            item.style.borderLeft = '3px solid #ffb347';
            item.innerHTML = `
                <strong>👤 ${this.escapeHtml(state.playerName)}</strong><br>
                💰 ${state.cash.toLocaleString()} 元 | ⚡ ${state.energy}/${state.maxEnergy}<br>
                📊 月现金流: ${monthlyCF >= 0 ? '+' : ''}${monthlyCF.toLocaleString()} 元
            `;
            playersList.appendChild(item);
        });

        if (this.otherPlayers.size === 0 && this.gameState) {
            const emptyHint = document.createElement('div');
            emptyHint.style.color = '#999';
            emptyHint.style.fontSize = '12px';
            emptyHint.style.textAlign = 'center';
            emptyHint.style.padding = '10px';
            emptyHint.innerText = '等待其他玩家加入...';
            playersList.appendChild(emptyHint);
        }
    }

    // ==================== 棋盘渲染方法 ====================

    private renderAllTiles(): void {
        if (!this.gameState) return;

        this.renderLayerOnCircle('reverseCellsLayer', this.reverseTiles, this.gameState.reversePos, this.gameState.inReverse, 15, 48);
        this.renderLayerOnCircle('streamlineCellsLayer', this.streamlineTiles, this.gameState.streamlinePos, !this.gameState.inReverse && !this.gameState.inFlow, 35, 45);
        this.renderLayerOnHollowSquare('flowCellsLayer', this.flowTiles, this.gameState.flowPos, this.gameState.inFlow, 45);
    }

    private renderLayerOnCircle(containerId: string, tiles: Tile[], currentPos: number, isActive: boolean, radiusPercent: number, cellSizePx: number): void {
        const container = this.getElement(containerId);
        if (!container) return;

        container.innerHTML = '';
        const angleStep = (2 * Math.PI) / tiles.length;

        for (let i = 0; i < tiles.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const x = 50 + radiusPercent * Math.cos(angle);
            const y = 50 + radiusPercent * Math.sin(angle);

            const cell = document.createElement('div');
            cell.className = `cell type-${tiles[i].type}`;
            if (isActive && i === currentPos) cell.classList.add('highlight');

            cell.style.position = 'absolute';
            cell.style.left = x + '%';
            cell.style.top = y + '%';
            cell.style.transform = 'translate(-50%, -50%)';
            cell.style.width = cellSizePx + 'px';
            cell.style.height = cellSizePx + 'px';
            cell.style.display = 'flex';
            cell.style.flexDirection = 'column';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.borderRadius = '8px';
            cell.style.fontSize = '8px';
            cell.style.fontWeight = 'bold';
            cell.style.textAlign = 'center';
            cell.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

            const shortName = tiles[i].name.length > 3 ? tiles[i].name.substring(0, 3) : tiles[i].name;
            cell.innerHTML = `<div style="font-size: 10px; font-weight: bold;">${i + 1}</div><div style="font-size: 7px;">${shortName}</div>`;

            if (isActive && i === currentPos) {
                const tokenDiv = document.createElement('div');
                tokenDiv.style.position = 'absolute';
                tokenDiv.style.top = '-8px';
                tokenDiv.style.right = '-8px';
                tokenDiv.style.width = '20px';
                tokenDiv.style.height = '20px';
                tokenDiv.style.background = 'radial-gradient(circle, #ff3b3b, #b71c1c)';
                tokenDiv.style.borderRadius = '50%';
                tokenDiv.style.boxShadow = '0 0 0 2px #ffd966';
                tokenDiv.style.pointerEvents = 'none';
                tokenDiv.style.zIndex = '25';
                cell.appendChild(tokenDiv);
            }

            container.appendChild(cell);
        }
    }

    private renderLayerOnHollowSquare(containerId: string, tiles: Tile[], currentPos: number, isActive: boolean, cellSizePx: number): void {
        const container = this.getElement(containerId);
        if (!container) return;

        container.innerHTML = '';
        const minBound = 5;
        const maxBound = 95;
        const range = maxBound - minBound;

        for (let i = 0; i < tiles.length; i++) {
            const ratio = i / tiles.length;
            const perimeter = ratio * 4;

            let x: number, y: number;
            if (perimeter < 1) {
                x = minBound + (perimeter * range);
                y = minBound;
            } else if (perimeter < 2) {
                x = maxBound;
                y = minBound + ((perimeter - 1) * range);
            } else if (perimeter < 3) {
                x = maxBound - ((perimeter - 2) * range);
                y = maxBound;
            } else {
                x = minBound;
                y = maxBound - ((perimeter - 3) * range);
            }

            const cell = document.createElement('div');
            cell.className = `cell type-${tiles[i].type}`;
            if (isActive && i === currentPos) cell.classList.add('highlight');

            cell.style.position = 'absolute';
            cell.style.left = x + '%';
            cell.style.top = y + '%';
            cell.style.transform = 'translate(-50%, -50%)';
            cell.style.width = cellSizePx + 'px';
            cell.style.height = cellSizePx + 'px';
            cell.style.display = 'flex';
            cell.style.flexDirection = 'column';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.borderRadius = '8px';
            cell.style.fontSize = '8px';
            cell.style.fontWeight = 'bold';
            cell.style.textAlign = 'center';
            cell.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

            const shortName = tiles[i].name.length > 3 ? tiles[i].name.substring(0, 3) : tiles[i].name;
            cell.innerHTML = `<div style="font-size: 10px; font-weight: bold;">${i + 1}</div><div style="font-size: 7px;">${shortName}</div>`;

            if (isActive && i === currentPos) {
                const tokenDiv = document.createElement('div');
                tokenDiv.style.position = 'absolute';
                tokenDiv.style.top = '-8px';
                tokenDiv.style.right = '-8px';
                tokenDiv.style.width = '20px';
                tokenDiv.style.height = '20px';
                tokenDiv.style.background = 'radial-gradient(circle, #ff3b3b, #b71c1c)';
                tokenDiv.style.borderRadius = '50%';
                tokenDiv.style.boxShadow = '0 0 0 2px #ffd966';
                tokenDiv.style.pointerEvents = 'none';
                tokenDiv.style.zIndex = '25';
                cell.appendChild(tokenDiv);
            }

            container.appendChild(cell);
        }
    }
}

// ==================== 初始化 ====================

let gameClient: GameClient;

document.addEventListener('DOMContentLoaded', () => {
    gameClient = new GameClient();
    (window as any).gameClient = gameClient;
    console.log('🎮 游戏客户端已初始化，请先启动服务器 (node server.js) 然后点击连接');
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .disabled {
            cursor: not-allowed !important;
            opacity: 0.5 !important;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 2000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            align-items: center;
            justify-content: center;
        }
        .modal.show {
            display: flex;
        }
        .modal-content {
            background: white;
            border-radius: 24px;
            padding: 24px;
            max-width: 600px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease;
        }
        .modal-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 16px;
        }
        .modal-body {
            font-size: 14px;
            margin-bottom: 16px;
            white-space: pre-wrap;
        }
        .modal-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        .btn-primary, .btn-secondary {
            padding: 10px 20px;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            transition: 0.2s;
        }
        .btn-primary {
            background: #ffb347;
            color: #333;
        }
        .btn-primary:hover:not(:disabled) {
            background: #ffc107;
            transform: scale(1.02);
        }
        .btn-secondary {
            background: #ccc;
            color: #333;
        }
        .btn-secondary:hover {
            background: #ddd;
        }
        .log-entry {
            padding: 5px;
            border-bottom: 1px solid #555;
            font-size: 11px;
        }
        .player-item {
            background: rgba(255, 179, 71, 0.2);
            padding: 8px;
            border-radius: 10px;
            font-size: 12px;
            border-left: 3px solid #ffb347;
            margin-bottom: 8px;
        }
        .cell {
            transition: all 0.2s ease;
        }
        .cell:hover {
            transform: scale(1.05);
            z-index: 99;
        }
        .cell.highlight {
            box-shadow: 0 0 0 3px #ffff88, 0 0 0 6px #ff9800;
            transform: scale(1.1);
            z-index: 200;
        }
        .type-part_time { background: linear-gradient(135deg, #4caf50, #2e7d32) !important; }
        .type-finance { background: linear-gradient(135deg, #2196f3, #1565c0) !important; }
        .type-business { background: linear-gradient(135deg, #ff9800, #e65100) !important; }
        .type-property { background: linear-gradient(135deg, #9c27b0, #6a1b9a) !important; }
    `;
    document.head.appendChild(style);
});