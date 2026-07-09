export class MessageRouter {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.handlers = new Map();
        this.unknownMessageHandler = null;
        this.errorHandler = null;
        this._registerHandlers();
        this._setupDefaultHandlers();
    }

    _registerHandlers() {
        this.register('join_success', 'handleJoinSuccess');
        this.register('player_joined', 'handlePlayerJoined');
        this.register('dice_result', 'handleDiceResult');
        this.register('turn_ended', 'handleTurnEnded');
        this.register('state_updated', 'handleStateUpdated');
        this.register('player_disconnected', 'handlePlayerDisconnected');

        this.register('loan_approved', 'handleLoanApproved');
        this.register('loan_repaid', 'handleLoanRepaid');
        this.register('loan_rejected', 'handleLoanRejected');
        this.register('forced_repayment', 'handleForcedRepayment');
        this.register('settlement_reminder', 'handleSettlementReminder');
        this.register('settlement', 'handleSettlement');

        this.register('card_type_selection', 'handleCardTypeSelection');
        this.register('opportunity_card_draw', 'handleOpportunityCardDraw');
        this.register('card_purchased', 'handleCardPurchased');
        this.register('card_decision_result', 'handleCardDecisionResult');

        this.register('four_leaf_clover_used', 'handleFourLeafCloverUsed');
        this.register('lucky_star_used', 'handleLuckyStarUsed');

        this.register('lier_card_auto_execute', 'handleLierCardAutoExecute');
        this.register('lier_card_draw', 'handleLierCardDraw');
        this.register('lier_card_result', 'handleLierCardResult');

        this.register('police_card_execute', 'handlePoliceCardExecute');

        this.register('volunteer_card_execute', 'handleVolunteerCardExecute');
        this.register('volunteer_card_draw', 'handleVolunteerCardDraw');
        this.register('volunteer_card_choice', 'handleVolunteerCardChoice');

        this.register('revelation_type_selection', 'handleRevelationTypeSelection');
        this.register('revelation_card_draw', 'handleRevelationCardDraw');
        this.register('revelation_card_purchased', 'handleRevelationCardPurchased');

        this.register('market_news_choices', 'showMarketNewsChoices');
        this.register('property_sell_choices', 'showPropertySellChoices');
        this.register('market_news_result', 'handleMarketNewsResult');

        this.register('auction_start', 'handleAuctionStart');
        this.register('auction_update', 'handleAuctionUpdate');
        this.register('auction_end', 'handleAuctionEnd');

        this.register('hardship_card_execute', 'handleHardshipCardExecute');
        this.register('flow_layer_choice', 'handleFlowLayerChoice');
        this.register('social_service_prompt', 'handleSocialServicePrompt');

        this.register('notification', this._handleNotification.bind(this));
        this.register('error', this._handleError.bind(this));
    }

    _setupDefaultHandlers() {
        this.setUnknownMessageHandler((message) => {
            console.warn(`Unknown message type: ${message.type}`);
            this.gameClient.addLog(`⚠️ 未知消息类型: ${message.type}`, 'warning');
        });
    }

    register(type, handler) {
        if (typeof handler === 'string') {
            this.handlers.set(type, { methodName: handler });
        } else if (typeof handler === 'function') {
            this.handlers.set(type, { fn: handler });
        }
    }

    setUnknownMessageHandler(handler) {
        this.unknownMessageHandler = handler;
    }

    route(message) {
        const entry = this.handlers.get(message.type);
        if (!entry) {
            if (this.unknownMessageHandler) this.unknownMessageHandler(message);
            return;
        }

        try {
            if (entry.methodName) {
                const handler = this.gameClient[entry.methodName];
                if (typeof handler === 'function') {
                    handler.call(this.gameClient, message);
                }
            } else if (entry.fn) {
                entry.fn(message);
            }
        } catch (error) {
            console.error(`Error handling message type ${message.type}:`, error);
        }
    }

    _handleNotification(message) {
        if (message.message) {
            this.gameClient.addLog(message.message, 'success');
            this.gameClient.showNotification(message.message, 'info');
        }
    }

    _handleError(message) {
        if (message.message) {
            this.gameClient.addLog(`❌ ${message.message}`, 'error');
            this.gameClient.showNotification(message.message, 'error');
        }
    }
}