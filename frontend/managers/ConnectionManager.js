export class ConnectionManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.playerId = '';
        this.onMessageCallback = null;
        this.onConnectCallback = null;
        this.onDisconnectCallback = null;
        this.onErrorCallback = null;
    }

    connect(serverUrl, playerId, playerName, profession, professionData) {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(serverUrl);
                this.playerId = playerId;

                this.ws.onopen = () => {
                    this.isConnected = true;
                    const joinMessage = {
                        type: 'join',
                        playerId: this.playerId,
                        playerName: playerName,
                        profession: profession,
                        professionData: professionData
                    };
                    this.ws.send(JSON.stringify(joinMessage));

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

    disconnect() {
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

    onMessage(handler) {
        this.onMessageCallback = handler;
    }

    onConnect(handler) {
        this.onConnectCallback = handler;
    }

    onDisconnect(handler) {
        this.onDisconnectCallback = handler;
    }

    onError(handler) {
        this.onErrorCallback = handler;
    }
}