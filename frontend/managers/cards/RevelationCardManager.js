import { BaseCardManager } from './BaseCardManager.js';

export class RevelationCardManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this.setupModals();
    }

    setupModals() {
        // Revelation Type Modal
        if (!document.getElementById('revelationTypeModal')) {
            this.modalManager.createModal('revelationTypeModal', `
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
            `);
        }

        // Revelation Purchase Modal
        if (!document.getElementById('revelationPurchaseModal')) {
            this.modalManager.createModal('revelationPurchaseModal', `
                <div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #4a2a1a, #3a1a0a); border-radius: 24px; text-align: center; border: 2px solid #ff9800;">
                    <div class="modal-title" style="color: #ff9800; font-size: 24px;">🧘 察觉卡</div>
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
            `);
        }

        // Revelation Effect Modal
        if (!document.getElementById('revelationEffectModal')) {
            this.modalManager.createModal('revelationEffectModal', `
                <div class="modal-content" style="max-width: 550px; background: linear-gradient(135deg, #4a2a1a, #3a1a0a); border-radius: 24px; text-align: center; border: 2px solid #ff9800;">
                    <div class="modal-title" style="color: #ff9800; font-size: 24px;">🧘 察觉卡</div>
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
            `);
        }
    }

    showRevelationTypeSelection(cardTypes, canAfford) {
        const modal = this.modalManager.openModal('revelationTypeModal');
        const buttonsContainer = document.getElementById('revelationTypeButtons');
        if (!buttonsContainer) return;
        buttonsContainer.innerHTML = '';

        const typeImages = { 'market_news': '../cards/revelation/market/M00.png', 'tip': '../cards/revelation/tip/IN00.png' };
        const typeConfig = {
            'market_news': { name: '市场消息卡', icon: '📊', color: '#2196f3' },
            'tip': { name: '锦囊卡', icon: '🎁', color: '#9c27b0' }
        };

        cardTypes.forEach(type => {
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = `cursor: pointer; transition: all 0.3s ease; text-align: center; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 14px rgba(0,0,0,0.3); background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2));`;

            const img = document.createElement('img');
            img.src = typeImages[type.id];
            img.alt = typeConfig[type.id]?.name || type.name;
            img.style.cssText = `width: 100%; max-width: 180px; height: auto; aspect-ratio: 1 / 1; object-fit: contain; display: block; margin: 0 auto; padding: 16px; background: rgba(30, 25, 20, 0.6); border-radius: 12px; box-sizing: border-box;`;
            img.onerror = () => {
                img.style.display = 'none';
                const fallbackDiv = document.createElement('div');
                fallbackDiv.style.cssText = `width: 100%; max-width: 180px; margin: 0 auto; aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; font-size: 48px; background: ${typeConfig[type.id]?.color || '#ff9800'}; border-radius: 12px;`;
                fallbackDiv.innerHTML = typeConfig[type.id]?.icon || '🎴';
                btnContainer.insertBefore(fallbackDiv, img);
            };

            const label = document.createElement('div');
            label.style.cssText = `padding: 10px 6px; font-size: 14px; font-weight: bold; color: #ffd966; background: rgba(0,0,0,0.75); text-align: center;`;
            label.innerHTML = `${typeConfig[type.id]?.icon || ''} ${typeConfig[type.id]?.name || type.name}`;
            btnContainer.appendChild(img);
            btnContainer.appendChild(label);

            btnContainer.onmouseenter = () => { btnContainer.style.transform = 'scale(1.03)'; };
            btnContainer.onmouseleave = () => { btnContainer.style.transform = 'scale(1)'; };

            if (!canAfford) {
                btnContainer.style.opacity = '0.55';
                btnContainer.style.cursor = 'not-allowed';
                btnContainer.title = '现金不足500元，无法执行察觉卡';
            } else {
                btnContainer.onclick = () => {
                    if (this.ws && this.ws.isReady()) {
                        this.ws.send({ type: 'revelation_type_choice', cardType: type.id });
                    }
                    this.modalManager.closeModal('revelationTypeModal');
                };
            }
            buttonsContainer.appendChild(btnContainer);
        });

        const cancelBtn = document.getElementById('cancelRevelationTypeBtn');
        if (cancelBtn) cancelBtn.onclick = () => this.modalManager.closeModal('revelationTypeModal');
    }

    showRevelationPurchaseModal(card, canAfford) {
        const modal = this.modalManager.openModal('revelationPurchaseModal');
        const cardImg = document.getElementById('revelationPurchaseImg');
        const modalBody = document.getElementById('revelationPurchaseBody');
        if (!modal) return;

        if (cardImg && card.image) {
            let imageUrl = card.image;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            cardImg.src = imageUrl || '';
            cardImg.onerror = () => { cardImg.style.display = 'none'; };
        }

        if (modalBody) {
            modalBody.innerHTML = `
                <h3 style="color: #ff9800; margin-bottom: 10px;">${this.ui.escapeHtml(card.name)}</h3>
                <p>${this.ui.escapeHtml(card.description)}</p>
                ${card.scope === 'team' ? '<p style="color: #ff9800;">🌟 团队锦囊 - 所有玩家可参与</p>' : ''}
            `;
        }

        const confirmBtn = document.getElementById('confirmRevelationPurchaseBtn');
        const cancelBtn = document.getElementById('cancelRevelationPurchaseBtn');

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'purchase_revelation_card' });
                }
                this.modalManager.closeModal('revelationPurchaseModal');
            };
            confirmBtn.disabled = !canAfford;
            confirmBtn.style.opacity = canAfford ? '1' : '0.5';
            confirmBtn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.modalManager.closeModal('revelationPurchaseModal');
                this.ui.addLog('已放弃购买察觉卡', 'warning');
            };
        }
    }

    showRevelationEffectModal(card) {
        const modal = this.modalManager.openModal('revelationEffectModal');
        const cardImg = document.getElementById('revelationEffectImg');
        const modalBody = document.getElementById('revelationEffectBody');
        if (!modal) return;

        if (cardImg && card.image) {
            let imageUrl = card.image;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            cardImg.src = imageUrl || '';
            cardImg.onerror = () => { cardImg.style.display = 'none'; };
        }

        if (modalBody) {
            modalBody.innerHTML = `
                <h3 style="color: #ff9800; margin-bottom: 10px;">${this.ui.escapeHtml(card.name)}</h3>
                <p>${this.ui.escapeHtml(card.description)}</p>
                ${card.scope === 'team' ? '<p style="color: #ff9800;">🌟 团队锦囊 - 所有玩家可参与</p>' : ''}
            `;
        }

        const confirmBtn = document.getElementById('confirmRevelationBtn');
        const declineBtn = document.getElementById('declineRevelationBtn');

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'execute_revelation_card', execute: true });
                }
                this.modalManager.closeModal('revelationEffectModal');
            };
        }

        if (declineBtn) {
            declineBtn.onclick = () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'execute_revelation_card', execute: false });
                }
                this.modalManager.closeModal('revelationEffectModal');
            };
        }
    }
}