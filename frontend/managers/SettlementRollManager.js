"use strict";

import { SettlementRollTemplate } from './cards/templates/SettlementRollTemplate.js';

export class SettlementRollManager {
    constructor(client) {
        this.client  = client;
        this.timerId = null;
    }

    show() {
        this._close();

        const old = document.getElementById('settlementRollModal');
        if (old) old.remove();

        this.client.modalManager.createModal(
            'settlementRollModal',
            SettlementRollTemplate.buildModal()
        );
        this.client.modalManager.openModal('settlementRollModal');

        this.timerId = SettlementRollTemplate.bindEvents(() => this._doRoll());
    }

    async handleResult(message) {
        // Show dice animation
        const { DiceAnimationTemplate } = await import('./cards/templates/DiceAnimationTemplate.js');

        // Close the roll prompt modal
        this._close();

        await new Promise(resolve => {
            DiceAnimationTemplate.show(
                [message.diceRoll],
                'energy',   // uses your custom 'energy' theme, or 'flow' if you skipped that
                `${message.playerName || '你'} - ⚡ 結算日精力`,
                resolve
            );
        });

        // Apply state
        const isMe = message.playerId === this.client.playerId;
        if (isMe && message.gameState) {
            this.client.gameState = message.gameState;
            this.client.updateUI();
        } else if (message.gameState) {
            this.client.otherPlayers.set(message.playerId, message.gameState);
        }

        // Notifications
        const playerLabel = isMe ? '你' : (message.playerName || '玩家');

        if (isMe) {
            this.client.logManager.showNotification(
                `⚡ 擲出 ${message.diceRoll} 點，精力 +${message.energyGained}！`,
                'success'
            );
        }

        this.client.logManager.addLog(
            `⚡ ${playerLabel} 結算日擲骰得 ${message.diceRoll} 點，精力 +${message.energyGained}`,
            'success'
        );

        this.client.updatePlayersList();
    }

    _doRoll() {
        this.client.connection.send({ type: 'settlement_roll' });
    }

    _close() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.client.modalManager.closeModal('settlementRollModal');
        const modal = document.getElementById('settlementRollModal');
        if (modal) modal.remove();
    }
}