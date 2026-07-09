// js/managers/cards/SpecialCardManager.js
import { BaseCardManager } from './BaseCardManager.js';

export class SpecialCardManager extends BaseCardManager {
	constructor(modalManager, gameClient) {
		super(modalManager, gameClient);
	}

	showHardshipCardModal(card, effectMessage) {
		this.ui.addLog(`🎭 ${effectMessage || '逆境自强卡'}`, 'error');
		this.ui.showNotification(effectMessage || '逆境自强卡触发', 'error');
	}

	showLierCardModal(card, effectMessage) {
		this.ui.addLog(`🎭 ${effectMessage || '骗子卡'}`, 'warning');
		this.ui.showNotification(effectMessage || '骗子卡触发', 'warning');
	}

	showPoliceCardModal(card, effectMessage) {
		this.ui.addLog(`👮 ${effectMessage || '警察卡'}`, 'success');
		this.ui.showNotification(effectMessage || '警察卡触发', 'success');
	}
}

