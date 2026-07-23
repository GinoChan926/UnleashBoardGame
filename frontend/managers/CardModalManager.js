import {
    OpportunityCardManager,
    RevelationCardManager,
    VolunteerCardManager,
    SpecialCardManager,
    AuctionManager,
    SocialServiceManager,
    FlowLayerManager
} from './cards/index.js';

export class CardModalManager {
    constructor(modalManager, gameClient) {
        this.modalManager = modalManager;
        this.gameClient = gameClient;

        this.opportunity = new OpportunityCardManager(modalManager, gameClient);
        this.revelation = new RevelationCardManager(modalManager, gameClient);
        this.volunteer = new VolunteerCardManager(modalManager, gameClient);
        this.special = new SpecialCardManager(modalManager, gameClient);
        this.auction = new AuctionManager(modalManager, gameClient);
        this.social = new SocialServiceManager(modalManager, gameClient);
        this.flowLayer = new FlowLayerManager(modalManager, gameClient);
    }

    showCardTypeSelection(cardTypes, canAfford) {
        this.opportunity.showCardTypeSelection(cardTypes, canAfford);
    }

    showPurchaseConfirm(card, canAfford) {
        this.opportunity.showPurchaseConfirm(card, canAfford);
    }

    showEffectConfirm(card, effectPreview, activationOnly = false) {
        this.opportunity.showEffectConfirm(card, effectPreview, activationOnly);
    }

    showRevelationTypeSelection(cardTypes, canAfford) {
        this.revelation.showRevelationTypeSelection(cardTypes, canAfford);
    }

    showRevelationPurchaseModal(card, canAfford) {
        this.revelation.showRevelationPurchaseModal(card, canAfford);
    }

    showRevelationEffectModal(card) {
        this.revelation.showRevelationEffectModal(card);
    }

    showVolunteerCardModal(card, effectMessage) {
        this.volunteer.showVolunteerCardModal(card, effectMessage);
    }

    showVolunteerDonationModal(card) {
        this.volunteer.showVolunteerDonationModal(card);
    }

    showVolunteerChoiceModal(card) {
        this.volunteer.showVolunteerChoiceModal(card);
    }

    showHardshipCardModal(card, effectMessage) {
        this.special.showHardshipCardModal(card, effectMessage);
    }

    showLierCardModal(card, effectMessage) {
        this.special.showLierCardModal(card, effectMessage);
    }

    showPoliceCardModal(card, effectMessage) {
        this.special.showPoliceCardModal(card, effectMessage);
    }

    showAuctionModal(message) {
        this.auction.showAuctionModal(message);
    }

    showSocialServiceModal(message) {
        this.social.showSocialServiceModal(message);
    }

    showFlowLayerChoiceModal(message) {
        this.flowLayer.showFlowLayerChoiceModal(message);
    }
}