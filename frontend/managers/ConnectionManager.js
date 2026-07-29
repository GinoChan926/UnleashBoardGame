"use strict";

export class ConnectionManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.playerId    = '';
        this.playerName  = '';
        this.roomId      = 'default_room';
        this.profession  = '';

        this.onMessageCallback    = null;
        this.onConnectCallback    = null;
        this.onDisconnectCallback = null;
        this.onErrorCallback      = null;
    }

    connect(serverUrl, playerId, playerName, profession, professionData, roomId = 'default_room') {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(serverUrl);
                this.playerId   = playerId;
                this.playerName = playerName;
                this.roomId     = roomId;
                this.profession = profession;

                this.ws.onopen = () => {
                    this.isConnected = true;

                    const joinMessage = {
                        type:           'join',
                        playerId:       this.playerId,
                        playerName:     playerName,
                        roomId:         roomId,
                        profession:     profession,
                        professionData: professionData
                    };
                    this.ws.send(JSON.stringify(joinMessage));

                    // ✅ Save credentials for auto-reconnect
                    this._saveSession(playerId, playerName, roomId, profession);

                    if (this.onConnectCallback) {
                        this.onConnectCallback();
                    }
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (this.onMessageCallback) {
                            this.onMessageCallback(message);
                        }
                    } catch (e) {
                        console.error('Failed to parse message:', e);
                    }
                };

                this.ws.onclose = () => {
                    this.isConnected = false;
                    if (this.onDisconnectCallback) {
                        this.onDisconnectCallback();
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    if (this.onErrorCallback) {
                        this.onErrorCallback(error);
                    }
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Disconnect intentionally — clears session so no auto-reconnect.
     */
    disconnect() {
        this._clearSession();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        console.warn('WebSocket is not open. Message not sent:', message);
        return false;
    }

    isReady() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    onMessage(handler)    { this.onMessageCallback    = handler; }
    onConnect(handler)    { this.onConnectCallback    = handler; }
    onDisconnect(handler) { this.onDisconnectCallback = handler; }
    onError(handler)      { this.onErrorCallback      = handler; }

    // ==================== Session persistence ====================

    /**
     * Retrieve saved session for auto-reconnect.
     * Returns null if no valid session found.
     */
    getSavedSession() {
        try {
            const raw = sessionStorage.getItem('gameSession');
            if (!raw) return null;

            const session = JSON.parse(raw);

            // Expire sessions older than 5 minutes
            const MAX_AGE_MS = 5 * 60 * 1000;
            if (Date.now() - session.savedAt > MAX_AGE_MS) {
                this._clearSession();
                return null;
            }

            return session;
        } catch (e) {
            return null;
        }
    }

    updateServerInstanceId(serverInstanceId) {
        const session = this.getSavedSession();
        if (session) {
            session.serverInstanceId = serverInstanceId;
            session.savedAt = Date.now();
            try {
                sessionStorage.setItem('gameSession', JSON.stringify(session));
            } catch (e) {
                // ignore
            }
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    _saveSession(playerId, playerName, roomId, profession) {
        try {
            sessionStorage.setItem('gameSession', JSON.stringify({
                playerId,
                playerName,
                roomId,
                profession,
                serverInstanceId,
                savedAt: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to save session:', e);
        }
    }

    _clearSession() {
        try {
            sessionStorage.removeItem('gameSession');
        } catch (e) {
            // ignore
        }
    }
}