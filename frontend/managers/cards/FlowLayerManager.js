import { BaseCardManager } from './BaseCardManager.js';

export class FlowLayerManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this.setupModal();
    }

    setupModal() {
        if (!document.getElementById('flowLayerChoiceModal')) {
            this.modalManager.createModal('flowLayerChoiceModal', `
                <div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #1a472a, #0d2b1a); border-radius: 28px; text-align: center; border: 2px solid #ffd700;">
                    <div class="modal-title" style="color: #ffd700; font-size: 24px;">🌟 進入顺流層？</div>
                    <div class="modal-body" id="flowLayerChoiceBody" style="color: #ffefc0; text-align: left; font-size: 14px; line-height: 1.6;"></div>
                    <div class="modal-buttons" style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
                        <button class="btn-secondary" id="stayInStreamlineBtn" style="background: #9e9e9e; padding: 12px 24px; border-radius: 30px; cursor: pointer;">📌 留在平流層</button>
                        <button class="btn-primary" id="enterFlowLayerBtn" style="background: #ff9800; padding: 12px 24px; border-radius: 30px; cursor: pointer;">🚀 進入顺流層</button>
                    </div>
                </div>
            `);
        }
    }

    showFlowLayerChoiceModal(message) {
        const modal = this.modalManager.openModal('flowLayerChoiceModal');
        const modalBody = document.getElementById('flowLayerChoiceBody');
        if (!modal || !modalBody) return;

        modalBody.innerHTML = message.message.replace(/\n/g, '<br>');

        const enterBtn = document.getElementById('enterFlowLayerBtn');
        const stayBtn = document.getElementById('stayInStreamlineBtn');

        const handleEnter = () => {
            if (this.ws && this.ws.isReady()) {
                this.ws.send({ type: 'flow_layer_choice', willEnter: true });
            }
            this.modalManager.closeModal('flowLayerChoiceModal');
            this.ui.addLog('🎉 你選擇進入顺流層！', 'success');
        };

        const handleStay = () => {
            if (this.ws && this.ws.isReady()) {
                this.ws.send({ type: 'flow_layer_choice', willEnter: false });
            }
            this.modalManager.closeModal('flowLayerChoiceModal');
            this.ui.addLog('📌 你選擇暫时留在平流層', 'info');
        };

        if (enterBtn) enterBtn.onclick = handleEnter;
        if (stayBtn) stayBtn.onclick = handleStay;
    }
}