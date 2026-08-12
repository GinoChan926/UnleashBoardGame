"use strict";

import { GambleResultTemplate } from '../cards/templates/GambleResultTemplate.js';

export class GambleHandler {
    constructor(client) {
        this.client = client;
    }

    /**
     * Called when THIS player's gamble card was resolved.
     * Shows dice animation followed by result modal.
     */
    async handleGambleResult(message) {
        const { client } = this;
        const { DiceAnimationTemplate } = await import(
            '../cards/templates/DiceAnimationTemplate.js'
            );

        // Apply state
        if (message.gameState) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        // Play dice animation first
        await new Promise(resolve => {
            DiceAnimationTemplate.show(
                [message.diceRoll],
                'normal',
                `${client.playerName} - 🎲 ${message.cardName}`,
                resolve
            );
        });

        // Show result modal
        await this._showResultModal(message);
    }

    /**
     * Called when OTHER players see the gamble result.
     */
    handleGambleResultBroadcast(message) {
        const { client } = this;

        const outcomeText = message.won ? '🎉 大獎！' : '😰 失敗！';
        const profitText  = message.netProfit >= 0
            ? `+$${message.netProfit.toLocaleString()}`
            : `-$${Math.abs(message.netProfit).toLocaleString()}`;

        client.logManager.addLog(
            `🎲 ${message.playerName} 投資「${message.cardName}」擲出 ${message.diceRoll} 點！${outcomeText} 淨賺 ${profitText}`,
            message.won ? 'success' : 'warning'
        );

        client.logManager.showNotification(
            `🎲 ${message.playerName} ${message.won ? '大獎！' : '失敗'} (${message.diceRoll} 點)`,
            message.won ? 'success' : 'warning'
        );
    }

    // ── Private ───────────────────────────────────────────────────────────

    _showResultModal(message) {
        return new Promise(resolve => {
            const { client } = this;

            // Remove any existing modal
            const old = document.getElementById('gambleResultModal');
            if (old) old.remove();

            // Determine result text
            const resultText = this._buildResultText(message);

            // Build modal via template
            const modalHtml = GambleResultTemplate.buildModal(message, resultText);

            client.modalManager.createModal('gambleResultModal', modalHtml);
            client.modalManager.openModal('gambleResultModal');

            // Bind close button
            setTimeout(() => {
                GambleResultTemplate.bindClose(() => {
                    client.modalManager.closeModal('gambleResultModal');
                    const modal = document.getElementById('gambleResultModal');
                    if (modal) modal.remove();
                    resolve();
                });
            }, 100);

            // Log the result
            const logType = message.won ? 'success' : 'error';
            const logMsg  = message.won
                ? `🎲 擲出 ${message.diceRoll} 點！贏得 $${message.winAmount.toLocaleString()}！`
                : `🎲 擲出 ${message.diceRoll} 點！損失 $${message.cost.toLocaleString()}！`;
            client.logManager.addLog(logMsg, logType);
        });
    }

    /**
     * Build result text based on the card and outcome.
     * Uses card-provided resultText if present, else falls back to defaults.
     */
    _buildResultText(message) {
        // If the card already provided custom text (e.g. K11 藥業集團), use it
        if (message.resultText) return message.resultText;

        // Fallback text
        if (message.won) {
            return `${message.cardName} 投資大成功！`;
        }
        return `${message.cardName} 投資失敗，本金全數虧損！`;
    }
}