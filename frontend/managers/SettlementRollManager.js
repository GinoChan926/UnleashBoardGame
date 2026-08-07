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
        const { DiceAnimationTemplate } = await import('./cards/templates/DiceAnimationTemplate.js');

        this._close();

        // ✅ Support N dice values
        const diceValues = message.diceValues || [message.diceRoll];
        const diceCount  = message.diceCount || 1;

        await new Promise(resolve => {
            DiceAnimationTemplate.show(
                diceValues,
                'energy',
                `${message.playerName || '你'} - ⚡ 結算日精力 (${diceCount} 顆骰)`,
                resolve
            );
        });

        const isMe = message.playerId === this.client.playerId;
        if (isMe && message.gameState) {
            this.client.gameState = message.gameState;
            this.client.updateUI();
        } else if (message.gameState) {
            this.client.otherPlayers.set(message.playerId, message.gameState);
        }

        const playerLabel = isMe ? '你' : (message.playerName || '玩家');

        const diceDetail = diceValues.length > 1
            ? `擲 ${diceValues.join(' + ')} = ${message.diceRoll}`
            : `擲 ${message.diceRoll}`;

        if (isMe) {
            this.client.logManager.showNotification(
                `⚡ ${diceDetail} 點，精力 +${message.energyGained}！`,
                'success'
            );
        }

        this.client.logManager.addLog(
            `⚡ ${playerLabel} 結算日${diceDetail} 點，精力 +${message.energyGained}`,
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