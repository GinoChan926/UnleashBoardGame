"use strict";

import { BaseCardManager } from './BaseCardManager.js';
import { SocialServiceTemplate} from './templates/SocialServiceTemplate.js';

export class SocialServiceManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this.setupModal();
    }

    setupModal() {
        if (!document.getElementById('socialServiceModal')) {
            this.modalManager.createModal('socialServiceModal',
                SocialServiceTemplate.buildCardModal()
                );
        }
    }

    showSocialServiceModal(message) {
        const modal = this.modalManager.openModal('socialServiceModal');
        const body = document.getElementById('socialServiceBody');
        if (!modal || !body) return;

        body.innerHTML = message.message.replace(/\n/g, '<br>');

        const investmentOption = document.getElementById('socialChoiceInvestment');
        const socialOption = document.getElementById('socialChoiceSocial');
        const cancelBtn = document.getElementById('socialServiceCancelBtn');

        const handleChoice = (choice) => {
            this.modalManager.closeModal('socialServiceModal');
            if (this.ws && this.ws.isReady()) {
                this.ws.send({ type: 'social_service_choice', choice: choice });
            }
            if (choice === 'investment') this.ui.addLog('🏛️ 你選擇抽取項目投資卡', 'event');
            else if (choice === 'social') this.ui.addLog('🏛️ 你選擇抽取服務社會卡', 'event');
            else this.ui.addLog('❌ 已取消社會服務中心', 'warning');
        };

        if (investmentOption) {
            investmentOption.onmouseenter = () => { investmentOption.style.transform = 'scale(1.03)'; investmentOption.style.boxShadow = '0 8px 25px rgba(255,111,0,0.3)'; };
            investmentOption.onmouseleave = () => { investmentOption.style.transform = 'scale(1)'; investmentOption.style.boxShadow = 'none'; };
            investmentOption.onclick = () => handleChoice('investment');
        }

        if (socialOption) {
            socialOption.onmouseenter = () => { socialOption.style.transform = 'scale(1.03)'; socialOption.style.boxShadow = '0 8px 25px rgba(46,125,50,0.3)'; };
            socialOption.onmouseleave = () => { socialOption.style.transform = 'scale(1)'; socialOption.style.boxShadow = 'none'; };
            socialOption.onclick = () => handleChoice('social');
        }

        if (cancelBtn) cancelBtn.onclick = () => handleChoice('cancel');
    }
}