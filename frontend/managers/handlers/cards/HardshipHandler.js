"use strict";

export class HardshipHandler {
    constructor(client) {
        this.client = client;
    }

    handleHardshipCardExecute(message) {
        const { client } = this;
        client.logManager.addLog(`🎭 ${message.message || '逆境自強卡'}`, 'error');
        client.logManager.showNotification(message.message || '逆境自強卡觸發', 'error');
        if (message.card) {
            client.cardModal.showHardshipCardModal(
                message.card,
                message.effectMessage || message.message || '逆境自強卡'
            );
        }
        this._applyState(message);
    }

    handleHardshipCardShielded(message) {
        const { client } = this;
        this._applyState(message);

        client.logManager.addLog(`🛡️ ${message.shieldMessage}`, 'success');
        client.logManager.showNotification(message.shieldMessage, 'success');

        this._showShieldBlockedModal(message.card, message.remainingShield);
    }

    _showShieldBlockedModal(card, remainingShield) {
        const { client } = this;
        const old = document.getElementById('hardshipShieldModal');
        if (old) old.remove();

        const cardImage = card.image
            ? (card.image.startsWith('/') || card.image.startsWith('http') ? card.image : '/' + card.image)
            : '';

        const modalHtml = `
        <div class="modal-content" style="max-width: 450px;
             background: linear-gradient(135deg, #1a3a5c, #0d2b47);
             border-radius: 24px; padding: 24px;
             border: 2px solid #4fc3f7; text-align: center;">

            <div class="modal-title" style="color: #4fc3f7; font-size: 22px;
                 margin-bottom: 14px;">
                🛡️ 家族辦公室 - 抵擋成功！
            </div>

            <div style="background: rgba(79,195,247,0.15); padding: 14px;
                        border-radius: 12px; margin-bottom: 16px;">
                <div style="color: #b3e5fc; font-size: 14px; margin-bottom: 10px;">
                    你的家族辦公室專業團隊抵擋了以下逆境卡：
                </div>
                ${cardImage ? `
                    <img src="${cardImage}" alt="${client.escapeHtml(card.name)}"
                         style="max-width: 80%; max-height: 150px;
                                border-radius: 12px; opacity: 0.6;
                                filter: grayscale(50%);
                                border: 2px dashed #ff5252;">
                ` : ''}
                <div style="color: #fff; font-size: 16px; font-weight: bold;
                            margin-top: 10px;">
                    ${client.escapeHtml(card.name)}
                </div>
                <div style="color: #ff5252; font-size: 12px; margin-top: 6px;">
                    ❌ 已被抵擋 - 效果無效
                </div>
            </div>

            <div style="background: rgba(0,0,0,0.3); padding: 10px;
                        border-radius: 10px; margin-bottom: 16px;
                        color: #ffd966; font-size: 13px;">
                🛡️ 剩餘抵擋機會: <strong style="color: #4fc3f7; font-size: 16px;">
                ${remainingShield}</strong> 次
            </div>

            <button id="closeShieldModalBtn"
                    style="background: linear-gradient(135deg, #4fc3f7, #039be5);
                           color: white; padding: 10px 30px; border: none;
                           border-radius: 30px; cursor: pointer; font-size: 15px;
                           transition: all 0.2s ease;
                           box-shadow: 0 4px 12px rgba(79,195,247,0.3);">
                太好了！
            </button>
        </div>
    `;

        client.modalManager.createModal('hardshipShieldModal', modalHtml);
        client.modalManager.openModal('hardshipShieldModal');

        setTimeout(() => {
            const btn = document.getElementById('closeShieldModalBtn');
            if (btn) {
                btn.onclick = () => client.modalManager.closeModal('hardshipShieldModal');
                btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; };
                btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
            }
        }, 100);

        setTimeout(() => {
            client.modalManager.closeModal('hardshipShieldModal');
        }, 30000);
    }

    _applyState(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }
}