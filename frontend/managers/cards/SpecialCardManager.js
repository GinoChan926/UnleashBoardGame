"use strict";

import { BaseCardManager }    from './BaseCardManager.js';
import { SpecialCardTemplate } from './templates/SpecialCardTemplate.js';

// ── Modal ID constants ────────────────────────────────────────────────────────
const HARDSHIP_MODAL = 'hardshipCardModal';
const LIER_MODAL     = 'lierCardModal';
const POLICE_MODAL   = 'policeCardModal';

export class SpecialCardManager extends BaseCardManager {
	constructor(modalManager, gameClient) {
		super(modalManager, gameClient);
		this._ensureModals();
	}

	// ── Helpers ───────────────────────────────────────────────────────────

	_escape(str) {
		return this.gameClient.escapeHtml(str);
	}

	_log(msg, type = 'info') {
		this.gameClient.logManager.addLog(msg, type);
	}

	_notify(msg, type = 'info') {
		this.gameClient.logManager.showNotification(msg, type);
	}

	// ==================== Hardship Card ====================

	showHardshipCardModal(card, effectMessage) {
		this._ensureModals();

		SpecialCardTemplate.setModalTitle(
			HARDSHIP_MODAL,
			`😰 ${card?.name || '逆境卡'}`
		);
		SpecialCardTemplate.applyCardImage(
			document.getElementById('hardshipCardImg'), card, 'hardship'
		);

		const body = document.getElementById('hardshipCardBody');
		if (body) body.innerHTML = SpecialCardTemplate.buildCardBody(
			card, this._escape.bind(this)
		);

		const effectSpan = document.getElementById('hardshipCardEffect');
		if (effectSpan) {
			effectSpan.textContent = `📌 ${effectMessage || ''}`;
		}

		this.modalManager.openModal(HARDSHIP_MODAL);

		SpecialCardTemplate.bindCloseButton('closeHardshipCardBtn', () => {
			this.modalManager.closeModal(HARDSHIP_MODAL);
		});

		this._log(`😰 ${effectMessage || '逆境卡'}`, 'error');
		this._notify(effectMessage || '逆境卡觸發', 'error');
	}

	// ==================== Lier Card ====================

	showLierCardModal(card, effectMessage) {
		this._ensureModals();

		SpecialCardTemplate.setModalTitle(
			LIER_MODAL,
			`🤥 ${card?.name || '騙子卡'}`
		);
		SpecialCardTemplate.applyCardImage(
			document.getElementById('lierCardImg'), card, 'lier'
		);

		const body = document.getElementById('lierCardBody');
		if (body) body.innerHTML = SpecialCardTemplate.buildCardBody(
			card, this._escape.bind(this)
		);

		const effectSpan = document.getElementById('lierCardEffect');
		if (effectSpan) {
			effectSpan.textContent = `📌 ${effectMessage || ''}`;
		}

		this.modalManager.openModal(LIER_MODAL);

		SpecialCardTemplate.bindCloseButton('closeLierCardBtn', () => {
			this.modalManager.closeModal(LIER_MODAL);
		});

		this._log(`🤥 ${effectMessage || '騙子卡'}`, 'warning');
		this._notify(effectMessage || '騙子卡觸發', 'warning');
	}

	// ==================== Police Card ====================

	showPoliceCardModal(card, effectMessage) {
		this._ensureModals();

		SpecialCardTemplate.setModalTitle(
			POLICE_MODAL,
			`👮 ${card?.name || '警察卡'}`
		);
		SpecialCardTemplate.applyCardImage(
			document.getElementById('policeCardImg'), card, 'police'
		);

		const body = document.getElementById('policeCardBody');
		if (body) body.innerHTML = SpecialCardTemplate.buildCardBody(
			card, this._escape.bind(this)
		);

		const effectSpan = document.getElementById('policeCardEffect');
		if (effectSpan) {
			effectSpan.textContent = `📌 ${effectMessage || ''}`;
		}

		this.modalManager.openModal(POLICE_MODAL);

		SpecialCardTemplate.bindCloseButton('closePoliceCardBtn', () => {
			this.modalManager.closeModal(POLICE_MODAL);
		});

		this._log(`👮 ${effectMessage || '警察卡'}`, 'success');
		this._notify(effectMessage || '警察卡觸發', 'success');
	}

	// ==================== Private ====================

	_ensureModals() {
		if (!document.getElementById(HARDSHIP_MODAL)) {
			this.modalManager.createModal(
				HARDSHIP_MODAL,
				SpecialCardTemplate.buildModal(
					'hardship',
					HARDSHIP_MODAL,
					'hardshipCardImg',
					'hardshipCardBody',
					'hardshipCardEffect',
					'closeHardshipCardBtn'
				)
			);
		}

		if (!document.getElementById(LIER_MODAL)) {
			this.modalManager.createModal(
				LIER_MODAL,
				SpecialCardTemplate.buildModal(
					'lier',
					LIER_MODAL,
					'lierCardImg',
					'lierCardBody',
					'lierCardEffect',
					'closeLierCardBtn'
				)
			);
		}

		if (!document.getElementById(POLICE_MODAL)) {
			this.modalManager.createModal(
				POLICE_MODAL,
				SpecialCardTemplate.buildModal(
					'police',
					POLICE_MODAL,
					'policeCardImg',
					'policeCardBody',
					'policeCardEffect',
					'closePoliceCardBtn'
				)
			);
		}
	}
}