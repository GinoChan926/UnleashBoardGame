"use strict";

export class LierHandler {
    constructor(client) {
        this.client       = client;
        this.queue        = [];
        this.showingModal = false;
    }

    // ==================== Auto execute (queued) ====================

    handleLierCardAutoExecute(message) {
        // ✅ Queue the card so multiple ones don't overlap
        this.queue.push(message);
        this._processQueue();
    }

    async _processQueue() {
        if (this.showingModal || this.queue.length === 0) return;

        const message = this.queue.shift();
        this.showingModal = true;

        await this._showAutoExecuteModal(message);

        this.showingModal = false;

        // Small pause between cards
        setTimeout(() => this._processQueue(), 400);
    }

    async _showAutoExecuteModal(message) {
        const { client } = this;

        // Apply state first
        this._applyState(message);

        client.logManager.addLog(
            `🎭 ${message.message || '騙子卡自動執行'}`,
            'warning'
        );

        if (!message.card) return;

        const { CardRevealTemplate } = await import('../../cards/templates/CardRevealTemplate.js');

        // Ensure no leftover modal
        const old = document.getElementById('cardRevealModal');
        if (old) old.remove();



        const modalHtml = CardRevealTemplate.buildModal({
            title:        '🎭 騙子卡',
            subtitle:     this.queue.length > 0
                ? `⚠️ 還有 ${this.queue.length} 張騙子卡待處理`
                : '小心！可能是騙局或詐騙',
            primaryColor: '#dc143c',
            accentColor:  '#f8bbd0',
            confirmText:  '😱 認命接受',
            hint:         this.queue.length > 0
                ? `💡 點擊繼續，還有 ${this.queue.length} 張騙子卡`
                : '💡 這張卡片的效果已經生效，點擊繼續遊戲'
        });

        client.modalManager.createModal('cardRevealModal', modalHtml);
        client.modalManager.openModal('cardRevealModal');

        const displayCard = {
            ...message.card,
            description: message.effectMessage || message.message || message.card.description
        };

        CardRevealTemplate.populate(
            displayCard,
            null,
            client.escapeHtml.bind(client)
        );

        // ✅ Wrap confirm + auto-timeout in a promise
        return new Promise(resolve => {
            let resolved = false;

            const finish = () => {
                if (resolved) return;
                resolved = true;

                client.modalManager.closeModal('cardRevealModal');
                const modal = document.getElementById('cardRevealModal');
                if (modal) modal.remove();

                clearTimeout(autoCloseTimer);
                client.connection.send({ type: 'lier_ack' });
                resolve();
            };

            CardRevealTemplate.bindConfirm(finish);
            // ✅ Auto-close after 30 seconds
            const autoCloseTimer = setTimeout(finish, 30000);
        });
    }

    // ==================== Manual draw (unchanged) ====================

    async handleLierCardDraw(message) {
        const { client } = this;

        if (!message.card) return;

        const { CardRevealTemplate } = await import('../../cards/templates/CardRevealTemplate.js');

        const old = document.getElementById('cardRevealModal');
        if (old) old.remove();

        const modalHtml = CardRevealTemplate.buildModal({
            title:        '🎭 騙子卡',
            subtitle:     '小心！可能是騙局或詐騙',
            primaryColor: '#dc143c',
            accentColor:  '#f8bbd0',
            confirmText:  '😱 認命接受',
            hint:         '💡 這張卡片的效果將在你點擊後生效'
        });

        client.modalManager.createModal('cardRevealModal', modalHtml);
        client.modalManager.openModal('cardRevealModal');

        CardRevealTemplate.populate(
            message.card,
            message.effectMessage || '騙子卡',
            client.escapeHtml.bind(client)
        );

        CardRevealTemplate.bindConfirm(() => {
            client.modalManager.closeModal('cardRevealModal');
            client.connection.send({ type: 'execute_lier_card' });
        });
    }

    handleLierCardResult(message) {
        const { client } = this;
        client.logManager.addLog(`🎭 ${message.message || '騙子卡結果'}`, 'warning');
        this._applyState(message);
    }

    // ==================== Private ====================

    _applyState(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }
}