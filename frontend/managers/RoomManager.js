"use strict";

import { RoomSelectionTemplate } from './cards/templates/RoomSelectionTemplate.js';

export class RoomManager {
    constructor(client) {
        this.client   = client;
        this._tempWs  = null;
        this._onJoinRoom = null;
    }

    show(onRoomChosen, onCancel) {
        const { client } = this;

        const old = document.getElementById('roomSelectionModal');
        if (old) old.remove();

        client.modalManager.createModal('roomSelectionModal', RoomSelectionTemplate.buildModal());
        client.modalManager.openModal('roomSelectionModal');

        this._onJoinRoom = (roomId, playerName) => {
            // ✅ Set the player name on the client
            client.playerName = playerName;

            // ✅ Also sync to the top bar input
            const topBarInput = document.getElementById('playerName');
            if (topBarInput) topBarInput.value = playerName;

            onRoomChosen(roomId);
        };

        RoomSelectionTemplate.bindEvents({
            onRefresh: () => this._fetchRoomList(),
            onJoinRoom: (roomId, playerName) => {
                this._closeModal();
                this._onJoinRoom(roomId, playerName);
            },
            onCancel: () => {
                this._closeModal();
                if (onCancel) onCancel();
            }
        });

        this._fetchRoomList();
    }

    handleRoomList(message) {
        RoomSelectionTemplate.renderRoomList(message.rooms || [], (roomId, playerName) => {
            this._closeModal();
            if (this._onJoinRoom) this._onJoinRoom(roomId, playerName);
        });
    }
    // ── Private ───────────────────────────────────────────────────────────

    _fetchRoomList() {
        const wsUrl = `ws://${window.location.hostname}:8080`;

        // Reuse existing connection if open
        if (this._tempWs && this._tempWs.readyState === WebSocket.OPEN) {
            this._tempWs.send(JSON.stringify({ type: 'list_rooms' }));
            return;
        }

        // Close stale connection if any
        if (this._tempWs) {
            try { this._tempWs.close(); } catch (e) {}
            this._tempWs = null;
        }

        this._tempWs = new WebSocket(wsUrl);

        this._tempWs.onopen = () => {
            this._tempWs.send(JSON.stringify({ type: 'list_rooms' }));
        };

        this._tempWs.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'room_list') {
                    this.handleRoomList(message);
                }
            } catch (e) {
                console.error('Failed to parse room list message:', e);
            }
        };

        this._tempWs.onerror = (err) => {
            console.error('Room list WebSocket error:', err);
            RoomSelectionTemplate.renderRoomList([], (roomId) => {
                this._closeModal();
                if (this._onJoinRoom) this._onJoinRoom(roomId);
            });
        };
    }

    _closeModal() {
        if (this._tempWs) {
            try { this._tempWs.close(); } catch (e) {}
            this._tempWs = null;
        }
        this.client.modalManager.closeModal('roomSelectionModal');
        const modal = document.getElementById('roomSelectionModal');
        if (modal) modal.remove();
    }
}