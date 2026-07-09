import { BaseCardManager } from './BaseCardManager.js';

export class OpportunityCardManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this.setupModals();
    }

    setupModals() {
        // Card Type Modal
        if (!document.getElementById('cardTypeModal')) {
            this.modalManager.createModal('cardTypeModal', `
                <div class="modal-content" style="max-width: 560px; background: linear-gradient(135deg, #1a472a, #0d2b1a); border-radius: 28px; padding: 20px;">
                    <div class="modal-title" style="text-align: center; color: #ffd966; font-size: 22px; margin-bottom: 16px;">🎴 选择机会卡类型</div>
                    <div class="modal-body" style="text-align: center;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; padding: 8px;" id="cardTypeButtons"></div>
                    </div>
                    <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 12px; margin: 12px 8px; text-align: center;">
                        <span style="color: #ffd966; font-size: 13px;">💰 执行机会卡需要花费 500 元，部分机会卡还需消耗精力 ⚡</span>
                    </div>
                    <div class="modal-buttons" style="justify-content: center; margin: 10px 0 5px 0;">
                        <button class="btn-secondary" id="cancelCardTypeBtn" style="background: #9e9e9e; padding: 10px 32px; border-radius: 30px; cursor: pointer; font-size: 14px;">取消</button>
                    </div>
                </div>
            `);
        }

        // Purchase Confirm Modal
        if (!document.getElementById('purchaseConfirmModal')) {
            this.modalManager.createModal('purchaseConfirmModal', `
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
            `);
        }

        // Effect Confirm Modal
        if (!document.getElementById('effectConfirmModal')) {
            this.modalManager.createModal('effectConfirmModal', `
                <div class="modal-content" style="max-width: 550px; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 20px;">
                    <div class="modal-title" style="text-align: center; color: #2e7d32; font-size: 24px;">✨ 卡片效果预览</div>
                    <div id="effectCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="effectCardImg" src="" alt="机会卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.2); border: 3px solid #4caf50;">
                    </div>
                    <div id="effectCardTypeBadge" style="text-align: center; margin: 10px 0;">
                        <span id="effectCardTypeSpan" style="display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; color: white;"></span>
                    </div>
                    <div class="modal-body" id="effectModalBody" style="font-size: 16px; line-height: 1.5;"></div>
                    <div id="effectChanges" style="background: #ffffff; padding: 15px; border-radius: 12px; margin: 15px 0; font-size: 14px;">
                        <strong>📊 效果预览:</strong><div id="effectChangesList"></div>
                    </div>
                    <div style="background: #fff3e0; padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;">
                        <span style="font-size: 16px; font-weight: bold;">⚠️ 注意：执行后无法撤销！</span>
                    </div>
                    <div class="modal-buttons" style="display: flex; gap: 15px; justify-content: center;">
                        <button class="btn-secondary" id="declineExecuteBtn" style="background: #9e9e9e; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">❌ 不执行</button>
                        <button class="btn-primary" id="confirmExecuteBtn" style="background: #4caf50; padding: 12px 24px; font-size: 16px; border-radius: 30px; cursor: pointer;">✅ 确认执行</button>
                    </div>
                    <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #666;">(已支付 500 元，不执行费用不退还)</div>
                </div>
            `);
        }
    }

    showCardTypeSelection(cardTypes, canAfford) {
        const modal = this.modalManager.openModal('cardTypeModal');
        const buttonsContainer = document.getElementById('cardTypeButtons');
        if (!buttonsContainer) return;
        buttonsContainer.innerHTML = '';

        const typeImages = {
            'part_time': '../cards/cover/part_time.png',
            'finance': '../cards/cover/finance.png',
            'business': '../cards/cover/business.png',
            'property': '../cards/cover/property.png'
        };

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
            img.onerror = () => {
                img.style.display = 'none';
                const fallbackDiv = document.createElement('div');
                fallbackDiv.style.cssText = `width: 100%; max-width: 140px; margin: 0 auto; aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; font-size: 48px; background: ${type.color}; border-radius: 12px;`;
                fallbackDiv.innerHTML = type.icon;
                btnContainer.insertBefore(fallbackDiv, img);
            };
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
                btnContainer.onclick = () => {
                    if (this.ws && this.ws.isReady()) {
                        this.ws.send({ type: 'card_type_choice', cardType: type.id });
                    }
                    this.modalManager.closeModal('cardTypeModal');
                };
            }
            buttonsContainer.appendChild(btnContainer);
        });

        const cancelBtn = document.getElementById('cancelCardTypeBtn');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.modalManager.closeModal('cardTypeModal');
                this.ui.addLog('已取消选择机会卡', 'warning');
            };
        }
    }

    showPurchaseConfirm(card, canAfford) {
        const modal = this.modalManager.openModal('purchaseConfirmModal');
        const modalBody = document.getElementById('purchaseModalBody');
        const cardImage = document.getElementById('purchaseCardImg');
        const confirmBtn = document.getElementById('confirmPurchaseBtn');
        const cancelBtn = document.getElementById('cancelPurchaseBtn');
        const affordWarning = document.getElementById('purchaseAffordWarning');
        const cardTypeSpan = document.getElementById('purchaseCardTypeSpan');
        const modalTitle = document.querySelector('#purchaseConfirmModal .modal-title');

        if (!modal || !modalBody) return;

        let titleText = '💰 购买机会卡';
        if (card.cardType === 'investment') titleText = '🏗️ 投资项目';
        else if (card.cardType === 'dream') titleText = '🌟 实现梦想';
        else if (card.cardType === 'social') titleText = '🤝 贡献社会';
        if (modalTitle) modalTitle.textContent = titleText;

        if (cardTypeSpan && card.cardTypeName) {
            const typeColors = {
                'part_time': '#4caf50', 'finance': '#2196f3', 'business': '#ff9800',
                'property': '#9c27b0', 'investment': '#ff6f00', 'dream': '#d4a017',
                'social': '#2e7d32'
            };
            const color = typeColors[card.cardType || ''] || '#ffb347';
            cardTypeSpan.style.backgroundColor = color;
            cardTypeSpan.innerHTML = `${card.cardTypeIcon || '🎴'} ${card.cardTypeName || '机会卡'}`;
        }

        modalBody.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #ff6f00; margin-bottom: 10px; font-size: 20px;">${this.ui.escapeHtml(card.name || '机会卡')}</h3>
                <p style="color: #555; font-size: 14px; line-height: 1.6;">${this.ui.escapeHtml(card.description || '')}</p>
                ${card.investmentCost ? `<div style="background: #e8f5e9; padding: 8px; border-radius: 8px; margin-top: 10px;"><span style="color: #2e7d32;">💰 需要投资: ${card.investmentCost.toLocaleString()} 元</span></div>` : ''}
                <div style="background: #e3f2fd; padding: 10px; border-radius: 8px; margin-top: 10px;">
                    <span style="color: #1565c0;">💡 支付 500 元购买后，可查看详细效果并决定是否执行</span>
                </div>
            </div>
        `;

        this._setupCardImage(cardImage, card);

        if (affordWarning) affordWarning.style.display = canAfford ? 'none' : 'inline';

        const handleConfirm = () => {
            if (this.ws && this.ws.isReady()) {
                this.ws.send({ type: 'purchase_card' });
            }
            this.modalManager.closeModal('purchaseConfirmModal');
        };

        const handleCancel = () => {
            this.modalManager.closeModal('purchaseConfirmModal');
            this.ui.addLog('已放弃购买', 'warning');
        };

        if (confirmBtn) {
            confirmBtn.onclick = handleConfirm;
            confirmBtn.disabled = !canAfford;
            confirmBtn.style.opacity = canAfford ? '1' : '0.5';
            confirmBtn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
        }
        if (cancelBtn) cancelBtn.onclick = handleCancel;
    }

    showEffectConfirm(card, effectPreview) {
        if (card.type === 'finance' && card.pricePerUnit && card.monthlyReturn > 0 && card.id !== 'F06') {
            this._handleFinanceCardUnits(card);
            return;
        }
        if (card.id === 'F05' && card.type === 'finance' && card.pricePerUnit) {
            this._handleP2PCardUnits(card);
            return;
        }
        this._showStandardEffectConfirm(card, effectPreview);
    }

    _handleFinanceCardUnits(card) {
        const maxUnitsByCash = Math.floor((this.gameState?.cash || 0) / card.pricePerUnit);
        const maxUnits = card.maxUnits === null ? maxUnitsByCash : Math.min(card.maxUnits, maxUnitsByCash);

        if (maxUnits === 0) {
            this.ui.showNotification(`现金不足，无法购买任何份额。需要至少 ${card.pricePerUnit.toLocaleString()} 元`, 'error');
            this._sendExecuteCard(false);
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
                this._sendExecuteCardWithUnits(true, units);
            } else {
                this._sendExecuteCard(false);
            }
        } else {
            this.ui.addLog(`❌ 无效的购买数量`, 'error');
            this._sendExecuteCard(false);
        }
    }

    _handleP2PCardUnits(card) {
        const maxUnits = Math.min(1000, Math.floor((this.gameState?.cash || 0) / card.pricePerUnit));
        const maxAllowed = Math.min(1000, Math.floor(maxUnits / 100) * 100);

        if (maxAllowed === 0) {
            this.ui.showNotification(`现金不足，无法购买。需要至少 ${card.pricePerUnit * 100} 元`, 'error');
            this._sendExecuteCard(false);
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
                this._sendExecuteCardWithUnits(true, units);
            } else {
                this._sendExecuteCard(false);
            }
        } else {
            this.ui.addLog(`❌ 无效的购买数量，必须是100的倍数且不超过 ${maxAllowed}`, 'error');
            this._sendExecuteCard(false);
        }
    }

    _showStandardEffectConfirm(card, effectPreview) {
        const modal = this.modalManager.openModal('effectConfirmModal');
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
                <h3 style="color: #2e7d32; margin-bottom: 10px; font-size: 20px;">${this.ui.escapeHtml(card.name)}</h3>
                <p style="color: #555; font-size: 14px;">${this.ui.escapeHtml(card.description || '')}</p>
                ${card.energyCost ? `<div style="background: #fff3e0; padding: 8px; border-radius: 8px; margin-top: 10px;"><span style="color: #e65100;">⚡ 执行需要精力: ${card.energyCost}</span></div>` : ''}
            </div>
        `;

        this._setupCardImage(cardImage, card);

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
        }

        const handleConfirm = () => {
            this._sendExecuteCard(true);
            this.modalManager.closeModal('effectConfirmModal');
        };
        const handleDecline = () => {
            this._sendExecuteCard(false);
            this.modalManager.closeModal('effectConfirmModal');
        };

        if (confirmBtn) confirmBtn.onclick = handleConfirm;
        if (declineBtn) declineBtn.onclick = handleDecline;
    }
}