"use strict";

import { OpportunityHandler }  from './cards/OpportunityHandler.js';
import { RevelationHandler }   from './cards/RevelationHandler.js';
import { VolunteerHandler }    from './cards/VolunteerHandler.js';
import { LierHandler }         from './cards/LierHandler.js';
import { HardshipHandler }     from './cards/HardshipHandler.js';
import { PoliceHandler }       from './cards/PoliceHandler.js';
import { SocialFlowHandler }   from './cards/SocialFlowHandler.js';
import { AIStoreHandler }      from './cards/AIStoreHandler.js';
import { TipCardHandler }      from './cards/TipCardHandler.js';
import { EnergyTradeHandler }  from './cards/EnergyTradeHandler.js';
import { PropertyHandler }     from './cards/PropertyHandler.js';
import { PortfolioHandler } from './cards/PortfolioHandler.js';

/**
 * Thin facade that delegates each message to the appropriate sub-handler.
 * Keeps MessageRouter's call surface unchanged.
 */
export class CardHandler {
    constructor(client) {
        this.client = client;

        this.opportunity = new OpportunityHandler(client);
        this.revelation  = new RevelationHandler(client);
        this.volunteer   = new VolunteerHandler(client);
        this.lier        = new LierHandler(client);
        this.hardship    = new HardshipHandler(client);
        this.police      = new PoliceHandler(client);
        this.socialFlow  = new SocialFlowHandler(client);
        this.aiStore     = new AIStoreHandler(client);
        this.tipCard     = new TipCardHandler(client);
        this.energyTrade = new EnergyTradeHandler(client);
        this.property    = new PropertyHandler(client);
        this.portfolio   = new PortfolioHandler(client);
    }

    // ── Opportunity ───────────────────────────────────────────────────────
    handleCardTypeSelection(m)     { this.opportunity.handleCardTypeSelection(m); }
    handleOpportunityCardDraw(m)   { this.opportunity.handleOpportunityCardDraw(m); }
    handleCardPurchased(m)         { this.opportunity.handleCardPurchased(m); }
    handleCardDecisionResult(m)    { this.opportunity.handleCardDecisionResult(m); }
    handleCardExecuted(m)          { this.opportunity.handleCardExecuted(m); }
    handleCardSkipped(m)           { this.opportunity.handleCardSkipped(m); }
    handlePurchaseFailed(m)        { this.opportunity.handlePurchaseFailed(m); }
    handlePortfolioSnapshot(m) { this.portfolio.handlePortfolioSnapshot(m); }

    // ── Revelation ────────────────────────────────────────────────────────
    handleRevelationTypeSelection(m) { this.revelation.handleRevelationTypeSelection(m); }
    handleRevelationCardDraw(m)      { this.revelation.handleRevelationCardDraw(m); }
    handleRevelationCardPurchased(m) { this.revelation.handleRevelationCardPurchased(m); }
    handlePersonalCardPrompt(m) { this.revelation.handlePersonalCardPrompt(m); }
    handlePersonalCardResult(m) { this.revelation.handlePersonalCardResult(m); }
    handleTeamCardPrompt(m)     { this.revelation.handleTeamCardPrompt(m); }
    handleTeamCardResult(m)     { this.revelation.handleTeamCardResult(m); }
    handleAssetChoicePrompt(m) { this.revelation.handleAssetChoicePrompt(m); }
    handleMarketNewsResult(m)  { this.revelation.handleMarketNewsResult(m); }
    handleStockMenu(m)         { this.opportunity.handleStockMenu(m); }
    handleCryptoMenu(m)        { this.opportunity.handleCryptoMenu(m); }
    handleFoodDeliveryMenu(m)  { this.opportunity.handleFoodDeliveryMenu(m); }

    // ── Volunteer ─────────────────────────────────────────────────────────
    handleVolunteerCardExecute(m) { this.volunteer.handleVolunteerCardExecute(m); }
    handleVolunteerCardDraw(m)    { this.volunteer.handleVolunteerCardDraw(m); }
    handleVolunteerCardChoice(m)  { this.volunteer.handleVolunteerCardChoice(m); }

    // ── Lier ──────────────────────────────────────────────────────────────
    handleLierCardAutoExecute(m) { this.lier.handleLierCardAutoExecute(m); }
    handleLierCardDraw(m)        { this.lier.handleLierCardDraw(m); }
    handleLierCardResult(m)      { this.lier.handleLierCardResult(m); }

    // ── Hardship ──────────────────────────────────────────────────────────
    handleHardshipCardExecute(m)  { this.hardship.handleHardshipCardExecute(m); }
    handleHardshipCardShielded(m) { this.hardship.handleHardshipCardShielded(m); }

    // ── Police ────────────────────────────────────────────────────────────
    handlePoliceCardExecute(m)       { this.police.handlePoliceCardExecute(m); }
    handleAuxiliaryPoliceChoice(m)   { this.police.handleAuxiliaryPoliceChoice(m); }
    handlePoliceMovePrompt(m)        { this.police.handlePoliceMovePrompt(m); }
    handlePoliceMoveExecuted(m)      { this.police.handlePoliceMoveExecuted(m); }
    handlePoliceMoveReceived(m)      { this.police.handlePoliceMoveReceived(m); }
    handlePoliceFinePrompt(m)        { this.police.handlePoliceFinePrompt(m); }
    handlePoliceFineExecuted(m)      { this.police.handlePoliceFineExecuted(m); }
    handlePoliceFineReceived(m)      { this.police.handlePoliceFineReceived(m); }
    handleGoodCitizenChoicePrompt(m) { this.police.handleGoodCitizenChoicePrompt(m); }
    handleGoodCitizenResult(m)       { this.police.handleGoodCitizenResult(m); }

    // ── Social / Flow ─────────────────────────────────────────────────────
    handleFlowLayerChoice(m)     { this.socialFlow.handleFlowLayerChoice(m); }
    handleSocialServicePrompt(m) { this.socialFlow.handleSocialServicePrompt(m); }

    // ── AI Store (C05) ────────────────────────────────────────────────────
    handleAIStoreDrawStart(m)  { this.aiStore.handleAIStoreDrawStart(m); }
    handleAIStorePickPrompt(m) { this.aiStore.handleAIStorePickPrompt(m); }
    handleAIStoreCardTaken(m)  { this.aiStore.handleAIStoreCardTaken(m); }
    handleAIStoreDrawEnd(m)    { this.aiStore.handleAIStoreDrawEnd(m); }

    // ── Tip Card (C07, C17) ───────────────────────────────────────────────
    handleTipCardPickPrompt(m)   { this.tipCard.handleTipCardPickPrompt(m); }
    handleTipCardTaken(m)        { this.tipCard.handleTipCardTaken(m); }
    handleTipCardDrawEnd(m)      { this.tipCard.handleTipCardDrawEnd(m); }
    handleAutoTipCardShow(m)     { this.tipCard.handleAutoTipCardShow(m); }
    handleAutoTipCardExecuted(m) { this.tipCard.handleAutoTipCardExecuted(m); }
    handleAutoTipDrawEnd(m)      { this.tipCard.handleAutoTipDrawEnd(m); }

    // ── Energy Trade (C20) ────────────────────────────────────────────────
    handleEnergyTradePricePrompt(m)   { this.energyTrade.handleEnergyTradePricePrompt(m); }
    handleEnergyTradeStartedSeller(m) { this.energyTrade.handleEnergyTradeStartedSeller(m); }
    handleEnergyTradeOffer(m)         { this.energyTrade.handleEnergyTradeOffer(m); }
    handleEnergyTradeSold(m)          { this.energyTrade.handleEnergyTradeSold(m); }
    handleEnergyTradeBought(m)        { this.energyTrade.handleEnergyTradeBought(m); }
    handleEnergyTradeExpired(m)       { this.energyTrade.handleEnergyTradeExpired(m); }
    handleEnergyTradeClosed(m)        { this.energyTrade.handleEnergyTradeClosed(m); }
    handleEnergyTradeSellerDecide(m)  { this.energyTrade.handleEnergyTradeSellerDecide(m); }
    handleEnergyTradeSelfBought(m)    { this.energyTrade.handleEnergyTradeSelfBought(m); }
    handleEnergyTradeCancelled(m)     { this.energyTrade.handleEnergyTradeCancelled(m); }

    // ── Property (H01-H05) ────────────────────────────────────────────────
    handlePropertyChoicePrompt(m) { this.property.handlePropertyChoicePrompt(m); }
    handlePropertyChoiceResult(m) { this.property.handlePropertyChoiceResult(m); }
    handlePropertyList(m)         { this.property.handlePropertyList(m); }
    handlePropertyPaidOff(m)      { this.property.handlePropertyPaidOff(m); }
}