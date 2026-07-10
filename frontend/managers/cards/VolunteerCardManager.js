import { BaseCardManager } from './BaseCardManager.js';

export class VolunteerCardManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this.setupModals();
    }

    setupModals() {
        if (!document.getElementById('volunteerCardModal')) {
            this.modalManager.createModal('volunteerCardModal', `
                <div class="modal-content" style="max-width: 450px; background: linear-gradient(135deg, #2a4a2a, #1a3a1a); border-radius: 24px; text-align: center; border: 2px solid #4caf50;">
                    <div class="modal-title" style="color: #4caf50; font-size: 24px; text-align: center;">🤝 義工卡</div>
                    <div id="volunteerCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="volunteerCardImg" src="" alt="義工卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 3px solid #4caf50;">
                    </div>
                    <div class="modal-body" id="volunteerCardBody" style="font-size: 16px; line-height: 1.5; color: #ffefc0; text-align: center;"></div>
                    <div style="background: rgba(76,175,80,0.2); padding: 12px; border-radius: 12px; margin: 15px 0; text-align: center;">
                        <span style="color: #4caf50; font-size: 14px;" id="volunteerCardEffect"></span>
                    </div>
                    <div class="modal-buttons" style="justify-content: center; margin-top: 15px;">
                        <button class="btn-primary" id="closeVolunteerCardBtn" style="background: #4caf50; padding: 10px 30px; border-radius: 30px; cursor: pointer;">確認</button>
                    </div>
                </div>
            `);
        }

        if (!document.getElementById('volunteerDonationModal')) {
            this.modalManager.createModal('volunteerDonationModal', `
                <div class="modal-content" style="max-width: 450px; background: linear-gradient(135deg, #2a4a2a, #1a3a1a); border-radius: 24px; text-align: center; border: 2px solid #4caf50;">
                    <div class="modal-title" style="color: #4caf50; font-size: 24px;">🤝 幫助傷健人士</div>
                    <div id="donationCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="donationCardImg" src="" alt="義工卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 3px solid #4caf50;">
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
            `);
        }

        if (!document.getElementById('volunteerChoiceModal')) {
            this.modalManager.createModal('volunteerChoiceModal', `
                <div class="modal-content" style="max-width: 450px; background: linear-gradient(135deg, #2a4a2a, #1a3a1a); border-radius: 24px; text-align: center; border: 2px solid #4caf50;">
                    <div class="modal-title" style="color: #4caf50; font-size: 24px;">🤝 義工卡 - 選擇獎勵</div>
                    <div id="choiceCardImage" style="text-align: center; margin: 15px 0;">
                        <img id="choiceCardImg" src="" alt="義工卡" style="max-width: 100%; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); border: 3px solid #4caf50;">
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
            `);
        }
    }

    showVolunteerCardModal(card, effectMessage) {
        const modal = this.modalManager.openModal('volunteerCardModal');
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
                <strong style="font-size: 20px; color: #4caf50;">${this.ui.escapeHtml(card.name)}</strong><br>
                <p style="margin-top: 10px;">${this.ui.escapeHtml(card.description)}</p>
            `;
        }

        if (effectSpan) {
            effectSpan.innerHTML = `📌 ${this.ui.escapeHtml(effectMessage)}`;
        }

        const closeBtn = document.getElementById('closeVolunteerCardBtn');
        if (closeBtn) {
            closeBtn.onclick = () => this.modalManager.closeModal('volunteerCardModal');
        }
    }

    showVolunteerDonationModal(card) {
        const modal = this.modalManager.openModal('volunteerDonationModal');
        const cardImg = document.getElementById('donationCardImg');
        const modalBody = document.getElementById('donationModalBody');
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
                <strong style="font-size: 20px; color: #4caf50;">${this.ui.escapeHtml(card.name)}</strong><br>
                <p style="margin-top: 10px;">${this.ui.escapeHtml(card.description)}</p>
                <div style="background: rgba(76,175,80,0.3); padding: 10px; border-radius: 12px; margin-top: 12px;">
                    <span style="color: #ffd966;">💡 執行後，每位有能力的玩家將捐款 $2,000 給現金最少的玩家，你將獲得 1 次義工資格</span>
                </div>
            `;
        }

        const confirmBtn = document.getElementById('confirmDonationBtn');
        const cancelBtn = document.getElementById('cancelDonationBtn');

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'volunteer_card_confirm' });
                }
                this.modalManager.closeModal('volunteerDonationModal');
            };
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.modalManager.closeModal('volunteerDonationModal');
                this.ui.addLog('已取消执行義工卡', 'warning');
            };
        }
    }

    showVolunteerChoiceModal(card) {
        const modal = this.modalManager.openModal('volunteerChoiceModal');
        const cardImg = document.getElementById('choiceCardImg');
        const modalBody = document.getElementById('choiceModalBody');
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
                <strong style="font-size: 20px; color: #4caf50;">${this.ui.escapeHtml(card.name)}</strong><br>
                <p style="margin-top: 10px;">${this.ui.escapeHtml(card.description)}</p>
                <div style="background: rgba(76,175,80,0.3); padding: 10px; border-radius: 12px; margin-top: 12px;">
                    <span style="color: #ffd966;">📌 請選擇你的獎勵：</span>
                </div>
            `;
        }

        const cashBtn = document.getElementById('choiceCashBtn');
        const volunteerBtn = document.getElementById('choiceVolunteerBtn');
        const cancelBtn = document.getElementById('cancelChoiceBtn');

        const handleChoice = (choice) => {
            if (this.ws && this.ws.isReady()) {
                this.ws.send({ type: 'volunteer_card_choice_confirm', choice: choice });
            }
            this.modalManager.closeModal('volunteerChoiceModal');
        };

        if (cashBtn) cashBtn.onclick = () => handleChoice('cash');
        if (volunteerBtn) volunteerBtn.onclick = () => handleChoice('volunteer');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.modalManager.closeModal('volunteerChoiceModal');
                this.ui.addLog('已取消选择', 'warning');
            };
        }
    }
}