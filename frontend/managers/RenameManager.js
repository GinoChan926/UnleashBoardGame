"use strict";

import { RenameTemplate } from './cards/templates/RenameTemplate.js';

export class RenameManager {
    constructor(client) {
        this.client = client;
    }

    // ==================== Show modal ====================

    show() {
        if (!this.client.isConnected) {
            this.client.logManager.addLog('⚠️ 尚未連接遊戲', 'error');
            return;
        }

        // Remove existing modal if any
        const old = document.getElementById('renameModal');
        if (old) old.remove();

        // Build fresh modal using template
        const currentName = this.client.escapeHtml(this.client.playerName);
        this.client.modalManager.createModal(
            'renameModal',
            RenameTemplate.buildModal(currentName)
        );
        this.client.modalManager.openModal('renameModal');

        RenameTemplate.focusInput();

        RenameTemplate.bindEvents(
            (newName) => this._handleConfirm(newName),
            ()        => this._handleCancel()
        );
    }

    // ==================== Message handlers ====================

    handleRenameSuccess(message) {
        this.client.playerName = message.newName;

        const nameInput = document.getElementById('playerName');
        if (nameInput) nameInput.value = message.newName;

        if (message.gameState) {
            this.client.gameState = message.gameState;
            this.client.updateUI();
        }

        this.client.updatePlayersList();

        this.client.turnHandler.updateTurnStatus();

        this.client.logManager.addLog(
            `📝 你已改名為「${message.newName}」`,
            'success'
        );
        this.client.logManager.showNotification(
            `✅ 改名成功: ${message.newName}`,
            'success'
        );
    }

    handlePlayerRenamed(message) {
        // Skip our own rename (handleRenameSuccess covers that)
        if (message.playerId === this.client.playerId) return;

        // Update other player entry in local map
        if (this.client.otherPlayers.has(message.playerId)) {
            const other = this.client.otherPlayers.get(message.playerId);
            other.playerName = message.newName;
            if (other.gameState) {
                other.gameState.playerName = message.newName;
            }
        }

        this.client.updatePlayersList();
        this.client.renderAllTiles();
        this.client.turnHandler.updateTurnStatus();

        this.client.logManager.addLog(
            `📝「${message.oldName}」已改名為「${message.newName}」`,
            'info'
        );
    }

    // ==================== Private ====================

    _handleConfirm(newName) {
        if (!newName) {
            RenameTemplate.showError('⚠️ 名稱不能為空');
            return;
        }

        if (newName === this.client.playerName) {
            RenameTemplate.showError('⚠️ 名稱與目前相同');
            return;
        }

        RenameTemplate.clearError();
        this.client.actions.renamePlayer(newName);
        this._close();
    }

    _handleCancel() {
        this._close();
    }

    _close() {
        this.client.modalManager.closeModal('renameModal');
        const modal = document.getElementById('renameModal');
        if (modal) modal.remove();
    }
}