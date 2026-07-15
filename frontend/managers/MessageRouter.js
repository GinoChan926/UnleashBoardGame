"use strict";

export class MessageRouter {
    constructor(gameClient) {
        this.client   = gameClient;
        this.handlers = new Map();
        this._register();
        this._setupDefaultHandler();
    }

    route(message) {
        const entry = this.handlers.get(message.type);
        if (!entry) {
            console.warn(`Unknown message type: ${message.type}`);
            this.client.logManager.addLog(`⚠️ 未知消息類型: ${message.type}`, 'warning');
            return;
        }
        try {
            entry(message);
        } catch (err) {
            console.error(`Error handling "${message.type}":`, err);
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    _register() {
        const c  = this.client;
        const jh = () => c.joinHandler;
        const th = () => c.turnHandler;
        const ch = () => c.cardHandler;
        const fh = () => c.financeHandler;
        const ih = () => c.itemHandler;
        const mh = () => c.marketHandler;

        const map = {
            // ── Join / presence
            'join_success':          m => jh().handleJoinSuccess(m),
            'player_joined':         m => jh().handlePlayerJoined(m),
            'player_disconnected':   m => jh().handlePlayerDisconnected(m),

            // ── Turn flow
            'dice_result':           m => th().handleDiceResult(m),
            'turn_ended':            m => th().handleTurnEnded(m),
            'state_updated':         m => th().handleStateUpdated(m),
            'turn_status':           m => th().handleTurnStatus(m),
            'turn_skipped':          m => th().handleTurnSkipped(m),

            // ── Opportunity cards
            'card_type_selection':   m => ch().handleCardTypeSelection(m),
            'opportunity_card_draw': m => ch().handleOpportunityCardDraw(m),
            'card_purchased':        m => ch().handleCardPurchased(m),
            'card_decision_result':  m => ch().handleCardDecisionResult(m),
            'card_executed':         m => ch().handleCardExecuted(m),
            'card_skipped':          m => ch().handleCardSkipped(m),
            'purchase_failed':       m => ch().handlePurchaseFailed(m),

            // ── Revelation cards
            'revelation_type_selection':  m => ch().handleRevelationTypeSelection(m),
            'revelation_card_draw':       m => ch().handleRevelationCardDraw(m),
            'revelation_card_purchased':  m => ch().handleRevelationCardPurchased(m),

            // ── Volunteer cards
            'volunteer_card_execute': m => ch().handleVolunteerCardExecute(m),
            'volunteer_card_draw':    m => ch().handleVolunteerCardDraw(m),
            'volunteer_card_choice':  m => ch().handleVolunteerCardChoice(m),

            // ── Special cards
            'lier_card_auto_execute': m => ch().handleLierCardAutoExecute(m),
            'lier_card_draw':         m => ch().handleLierCardDraw(m),
            'lier_card_result':       m => ch().handleLierCardResult(m),
            'police_card_execute':    m => ch().handlePoliceCardExecute(m),
            'hardship_card_execute':  m => ch().handleHardshipCardExecute(m),

            // ── Flow / social
            'flow_layer_choice':      m => ch().handleFlowLayerChoice(m),
            'social_service_prompt':  m => ch().handleSocialServicePrompt(m),

            // ── Finance
            'loan_approved':          m => fh().handleLoanApproved(m),
            'loan_repaid':            m => fh().handleLoanRepaid(m),
            'loan_rejected':          m => fh().handleLoanRejected(m),
            'forced_repayment':       m => fh().handleForcedRepayment(m),
            'settlement_reminder':    m => fh().handleSettlementReminder(m),
            'settlement':             m => fh().handleSettlement(m),

            // ── Items
            'four_leaf_clover_used':  m => ih().handleFourLeafCloverUsed(m),
            'lucky_star_used':        m => ih().handleLuckyStarUsed(m),

            // ── Market / auction
            'market_news_choices':    m => mh().showMarketNewsChoices(m),
            'property_sell_choices':  m => mh().showPropertySellChoices(m),
            'market_news_result':     m => mh().handleMarketNewsResult(m),
            'auction_start':          m => mh().handleAuctionStart(m),
            'auction_update':         m => mh().handleAuctionUpdate(m),
            'auction_end':            m => mh().handleAuctionEnd(m),

            // ── Part time
            'auxiliary_police_choice': m => ch().handleAuxiliaryPoliceChoice(m),

            'ai_store_draw_start':  m => ch().handleAIStoreDrawStart(m),
            'ai_store_pick_prompt': m => ch().handleAIStorePickPrompt(m),
            'ai_store_card_taken':  m => ch().handleAIStoreCardTaken(m),
            'ai_store_draw_end':    m => ch().handleAIStoreDrawEnd(m),

            'tip_card_pick_prompt': m => ch().handleTipCardPickPrompt(m),
            'tip_card_taken':       m => ch().handleTipCardTaken(m),
            'tip_card_draw_end':    m => ch().handleTipCardDrawEnd(m),

            'hardship_card_shielded': m => ch().handleHardshipCardShielded(m),

            'auto_tip_card_show':      m => ch().handleAutoTipCardShow(m),
            'auto_tip_card_executed':  m => ch().handleAutoTipCardExecuted(m),
            'auto_tip_draw_end':       m => ch().handleAutoTipDrawEnd(m),

            'energy_trade_price_prompt':    m => ch().handleEnergyTradePricePrompt(m),
            'energy_trade_started_seller':  m => ch().handleEnergyTradeStartedSeller(m),
            'energy_trade_offer':           m => ch().handleEnergyTradeOffer(m),
            'energy_trade_sold':            m => ch().handleEnergyTradeSold(m),
            'energy_trade_bought':          m => ch().handleEnergyTradeBought(m),
            'energy_trade_seller_decide': m => ch().handleEnergyTradeSellerDecide(m),
            'energy_trade_self_bought':   m => ch().handleEnergyTradeSelfBought(m),
            'energy_trade_cancelled':     m => ch().handleEnergyTradeCancelled(m),
            'energy_trade_closed':          m => ch().handleEnergyTradeClosed(m),
            // ── System
            'notification': m => {
                if (m.message) {
                    c.logManager.addLog(m.message, 'success');
                    c.logManager.showNotification(m.message, 'info');
                }
            },
            'error': m => {
                if (m.message) {
                    c.logManager.addLog(`❌ ${m.message}`, 'error');
                    c.logManager.showNotification(m.message, 'error');
                }
            }
        };

        for (const [type, fn] of Object.entries(map)) {
            this.handlers.set(type, fn);
        }
    }

    _setupDefaultHandler() {
        // already handled inline in route()
    }
}