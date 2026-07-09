export class BaseCardManager {
    constructor(modalManager, gameClient) {
        this.modalManager = modalManager;
        this.gameClient = gameClient;
    }

    get ws() { return this.gameClient.connection; }
    get ui() { return this.gameClient; }
    get gameState() { return this.gameClient.gameState; }

    _sendExecuteCard(execute) {
        if (this.ws && this.ws.isReady()) {
            this.ws.send({ type: 'execute_card', execute: execute });
        }
    }

    _sendExecuteCardWithUnits(execute, units) {
        if (this.ws && this.ws.isReady()) {
            this.ws.send({ type: 'execute_card', execute: execute, units: units });
        }
    }

    _setupCardImage(cardImage, card) {
        if (!cardImage || !card || !card.image) return;
        let imageUrl = card.image;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = '/' + imageUrl;
        }
        cardImage.src = imageUrl;
        cardImage.onerror = () => {
            cardImage.style.display = 'none';
        };
    }
}