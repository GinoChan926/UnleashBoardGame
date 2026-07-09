"use strict";

import { PROFESSIONS } from './constants/Tiles.js';
import { ConnectionManager }    from './managers/ConnectionManager.js';
import { ModalManager }         from './managers/ModalManager.js';
import { CardModalManager }     from './managers/CardModalManager.js';
import { BoardRenderer }        from './managers/BoardRenderer.js';
import { PlayerPanelRenderer }  from './managers/PlayerPanelRenderer.js';
import { MessageRouter }        from './managers/MessageRouter.js';
import { LogManager }           from './managers/LogManager.js';
import { TurnManager }          from './managers/TurnManager.js';
import { GameStateManager }     from './managers/GameStateManager.js';

class GameClient {
    constructor() {
        console.log('🎮 GameClient constructor starting...');

        // ── Core infrastructure ──────────────────────────────────────────
        this.connection    = new ConnectionManager();
        this.modalManager  = new ModalManager();
        this.logManager    = new LogManager(this.modalManager);

        // ── Renderers ────────────────────────────────────────────────────
        this.boardRenderer = new BoardRenderer();
        this.playerPanel   = new PlayerPanelRenderer(this);
        this.cardModal     = new CardModalManager(this.modalManager, this);

        // ── Domain managers ──────────────────────────────────────────────
        this.turnManager      = new TurnManager(this);
        this.gameStateManager = new GameStateManager(this);
        this.router           = new MessageRouter(this);

        // ── State ────────────────────────────────────────────────────────
        this.playerId          = '';
        this.playerName        = '';
        this.selectedProfession = null;
        this.gameState         = null;
        this.otherPlayers      = new Map();
        this.isConnected       = false;
        this.gameOver          = false;
        this.currentAuctionId  = null;
        this.isMyTurn          = false;

        this.bindGlobalEvents();
        this.gameStateManager.setupMusicMonitor();

        console.log('🎮 GameClient 初始化完成！');
    }

    // ── Convenience passthrough ──────────────────────────────────────────
    get ws() { return this.connection.ws; }

    // ==================== Utility ====================

    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        if (typeof str !== 'string') str = String(str);
        return str
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#39;');
    }

    /** Delegated to LogManager */
    showNotification(message, type = 'info') {
        this.logManager.showNotification(message, type);
    }

    /** Delegated to LogManager */
    addLog(msg, type = 'default') {
        this.logManager.addLog(msg, type);
    }

    getElement(id) { return document.getElementById(id); }
    getButton(id)  { return document.getElementById(id); }
    getInput(id)   { return document.getElementById(id); }

    // ==================== Network Status ====================

    updateNetworkStatus(connected) {
        const statusDiv = this.getElement('networkStatus');
        if (!statusDiv) return;

        if (connected) {
            statusDiv.className = 'network-status connected';
            statusDiv.textContent = '🟢 已連接 | 遊戲進行中';
        } else {
            statusDiv.className = 'network-status';
            statusDiv.textContent = '⚪ 未連接 | 請選擇職業後連接';
        }
    }

    // ==================== Button Control ====================

    disableGameControls() {
        const controls = [
            'btnRoll', 'btnEndTurn', 'btnLoan',
            'btnRepayLoan', 'btnUseClover', 'btnUseLuckyStar'
        ];
        controls.forEach(id => {
            const btn = this.getButton(id);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.4';
                btn.style.filter = 'grayscale(70%)';
                btn.style.cursor = 'not-allowed';
            }
        });
    }

    enableGameControls() {
        // Lock the connect UI
        const nameInput  = this.getInput('playerName');
        const connectBtn = this.getButton('btnConnect');
        if (nameInput)  nameInput.disabled  = true;
        if (connectBtn) connectBtn.disabled = true;

        // Game buttons are controlled by updateTurnStatus / updateUI
        this.disableGameControls();
    }

    enableAllControls() {
        const buttons = [
            'btnRoll', 'btnEndTurn', 'btnLoan',
            'btnRepayLoan', 'btnUseClover', 'btnUseLuckyStar'
        ];
        buttons.forEach(id => {
            const btn = this.getButton(id);
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.filter = 'none';
                btn.style.cursor = 'pointer';
            }
        });
    }

    // ==================== Global Event Binding ====================

    bindGlobalEvents() {
        window.gameClient = this;

        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onclick = fn;
        };

        bind('btnConnect',    () => this.showProfessionModal());
        bind('btnRoll',       () => this.rollDice());
        bind('btnEndTurn',    () => this.endTurn());
        bind('btnLoan',       () => this.applyLoan());
        bind('btnRepayLoan',  () => this.repayLoan());
        bind('btnDisconnect', () => this.disconnect());
        bind('btnUseClover',  () => this.useFourLeafClover());
        bind('btnUseLuckyStar', () => this.useLuckyStar());
    }

    // ==================== Profession / Connection ====================

    showProfessionModal() {
        this.modalManager.showProfessionModal(PROFESSIONS, this);
    }

    /** Called by ModalManager after profession is chosen */
    connect() {
        this.gameStateManager.doConnect();
    }

    /** Legacy alias kept for any internal callers */
    doConnect() {
        this.gameStateManager.doConnect();
    }

    disconnect() {
        this.gameStateManager.disconnect();
    }

    closeProfessionModal() {
        const modal = document.getElementById('professionModal');
        if (modal) modal.classList.remove('show');
    }

    // ==================== Game Actions (thin wrappers) ====================

    rollDice() {
        this.gameStateManager.rollDice();
    }

    endTurn() {
        this.gameStateManager.endTurn();
    }

    applyLoan() {
        this.gameStateManager.applyLoan();
    }

    repayLoan() {
        this.gameStateManager.repayLoan();
    }

    useFourLeafClover() {
        this.gameStateManager.useFourLeafClover();
    }

    useLuckyStar() {
        this.gameStateManager.useLuckyStar();
    }

    // ==================== UI Updates ====================

    updateUI() {
        this.playerPanel.updateUI(this.gameState);
    }

    updatePlayersList() {
        this.playerPanel.updatePlayersList(this.gameState, this.otherPlayers);
    }

    updateTurnStatus() {
        this.turnManager.updateTurnStatus();
    }

    renderAllTiles() {
        this.boardRenderer.renderAllTiles(this.gameState);
    }

    // ==================== Message Handlers (thin delegation) ====================

    handleJoinSuccess(message) {
        this.gameStateManager.handleJoinSuccess(message);
    }

    handlePlayerJoined(message) {
        this.gameStateManager.handlePlayerJoined(message);
    }

    handleDiceResult(message) {
        this.gameStateManager.handleDiceResult(message);
    }

    handleTurnEnded(message) {
        this.turnManager.handleTurnEnded(message);
    }

    handleStateUpdated(message) {
        this.turnManager.handleStateUpdated(message);
    }

    handleTurnStatus(message) {
        this.turnManager.handleTurnStatus(message);
    }

    handleTurnSkipped(message) {
        this.turnManager.handleTurnSkipped(message);
    }

    handlePlayerDisconnected(message) {
        this.gameStateManager.handlePlayerDisconnected(message);
    }

    handleCardTypeSelection(message) {
        this.gameStateManager.handleCardTypeSelection(message);
    }

    handleOpportunityCardDraw(message) {
        this.gameStateManager.handleOpportunityCardDraw(message);
    }

    handleCardPurchased(message) {
        this.gameStateManager.handleCardPurchased(message);
    }

    handleCardDecisionResult(message) {
        this.gameStateManager.handleCardDecisionResult(message);
    }

    handleLoanApproved(message) {
        this.gameStateManager.handleLoanApproved(message);
    }

    handleLoanRepaid(message) {
        this.gameStateManager.handleLoanRepaid(message);
    }

    handleLoanRejected(message) {
        this.gameStateManager.handleLoanRejected(message);
    }

    handleForcedRepayment(message) {
        this.gameStateManager.handleForcedRepayment(message);
    }

    handleSettlementReminder(message) {
        this.gameStateManager.handleSettlementReminder(message);
    }

    handleSettlement(message) {
        this.gameStateManager.handleSettlement(message);
    }

    handleFourLeafCloverUsed(message) {
        this.gameStateManager.handleFourLeafCloverUsed(message);
    }

    handleLuckyStarUsed(message) {
        this.gameStateManager.handleLuckyStarUsed(message);
    }

    handleCardExecuted(message) {
        this.gameStateManager.handleCardExecuted(message);
    }

    handleCardSkipped(message) {
        this.gameStateManager.handleCardSkipped(message);
    }

    handlePurchaseFailed(message) {
        this.gameStateManager.handlePurchaseFailed(message);
    }

    showPropertySellChoices(message) {
        this.gameStateManager.showPropertySellChoices(message);
    }

    // ==================== Legacy Modal Setup Stubs ====================
    // Kept so any external code that calls these does not break.

    setupProfessionModal()      { /* handled by ModalManager */ }
    setupCardTypeModal()        { /* handled by CardModalManager */ }
    setupPurchaseConfirmModal() { /* handled by CardModalManager */ }
    setupEffectConfirmModal()   { /* handled by CardModalManager */ }
    setupNotificationContainer() { this.logManager.setupNotificationContainer(); }

    // ==================== Card Modal Passthroughs ====================

    showCardTypeSelection(cardTypes, canAfford) {
        this.cardModal.showCardTypeSelection(cardTypes, canAfford);
    }

    showOpportunityCard(card, canAfford) {
        this.cardModal.showPurchaseConfirm(card, canAfford);
    }

    showEffectConfirm(card, effectPreview) {
        this.cardModal.showEffectConfirm(card, effectPreview);
    }

    // ==================== Misc ====================

    showModal(title, body) {
        this.logManager.addLog(`${title}: ${body}`, 'info');
    }

    closeModal() {
        console.log('Modal closed');
    }

    checkMusicAndGameOver() {
        return this.gameStateManager.checkMusicAndGameOver();
    }

    // ── Kept so BoardRenderer / Tiles can reach path helpers if needed ──
    getDreamImagePath(position, tileName) {
        return this.boardRenderer.getDreamImagePath(position, tileName);
    }

    getTileImagePath(layerType, tileType) {
        return this.boardRenderer.getTileImagePath(layerType, tileType);
    }
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
let gameClient;
document.addEventListener('DOMContentLoaded', () => {
    gameClient = new GameClient();
    window.gameClient = gameClient;
});