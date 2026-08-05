"use strict";

import { PROFESSIONS }           from './constants/Professions.js';
import { ConnectionManager }     from './managers/ConnectionManager.js';
import { ModalManager }          from './managers/ModalManager.js';
import { LogManager }            from './managers/LogManager.js';
import { BoardRenderer }         from './managers/BoardRenderer.js';
import { PlayerPanelRenderer }   from './managers/PlayerPanelRenderer.js';
import { CardModalManager }      from './managers/CardModalManager.js';
import { MessageRouter }         from './managers/MessageRouter.js';
import { RenameManager }         from './managers/RenameManager.js';
import { TurnIndicator } from './managers/TurnIndicator.js';
import { TileLandingManager } from './managers/TileLandingManager.js';
import { SettlementRollManager } from './managers/SettlementRollManager.js';
import { CardBroadcastManager } from './managers/CardBroadcastManager.js';

import { GameLifecycleManager }  from './managers/lifecycle/GameLifecycleManager.js';
import { PlayerActionSender }    from './managers/actions/PlayerActionSender.js';

import { JoinHandler }           from './managers/handlers/JoinHandler.js';
import { TurnHandler }           from './managers/handlers/TurnHandler.js';
import { CardHandler }           from './managers/handlers/CardHandler.js';
import { FinanceHandler }        from './managers/handlers/FinanceHandler.js';
import { ItemHandler }           from './managers/handlers/ItemHandler.js';
import { MarketHandler }         from './managers/handlers/MarketHandler.js';

class GameClient {
    constructor() {
        console.log('🎮 GameClient constructor starting...');

        // ── Infrastructure ────────────────────────────────────────────────
        this.connection   = new ConnectionManager();
        this.modalManager = new ModalManager();
        this.logManager   = new LogManager(this.modalManager);

        // ── Renderers ─────────────────────────────────────────────────────
        this.boardRenderer = new BoardRenderer();
        this.playerPanel   = new PlayerPanelRenderer(this);
        this.cardModal     = new CardModalManager(this.modalManager, this);
        this.turnIndicator  = new TurnIndicator();
        this.tileLandingManager = new TileLandingManager(this.modalManager);
        // Expose ButtonStateManager so lifecycle/handlers can call it directly
        this.buttonState = this.playerPanel.buttons;

        // ── Domain handlers ───────────────────────────────────────────────
        this.joinHandler    = new JoinHandler(this);
        this.turnHandler    = new TurnHandler(this);
        this.cardHandler    = new CardHandler(this);
        this.financeHandler = new FinanceHandler(this);
        this.itemHandler    = new ItemHandler(this);
        this.marketHandler  = new MarketHandler(this);
        this.renameManager  = new RenameManager(this);
        this.renameManager      = new RenameManager(this);
        this.tileLandingManager = new TileLandingManager(this);
        this.settlementRollManager = new SettlementRollManager(this);
        this.cardBroadcast = new CardBroadcastManager(this);

        // ── Actions & lifecycle ───────────────────────────────────────────
        this.actions   = new PlayerActionSender(this);
        this.lifecycle = new GameLifecycleManager(this);

        // ── Router (must be last - references all handlers above) ─────────
        this.router = new MessageRouter(this);

        // ── State ─────────────────────────────────────────────────────────
        this.playerId           = '';
        this.playerName         = '';
        this.selectedProfession = null;
        this.gameState          = null;
        this.otherPlayers       = new Map();
        this.isConnected        = false;
        this.gameOver           = false;
        this.isMyTurn           = false;

        // ── Boot ──────────────────────────────────────────────────────────
        this._bindEvents();
        this.lifecycle.setupMusicMonitor();

        console.log('🎮 GameClient 初始化完成！');
    }

    // ── WebSocket passthrough ─────────────────────────────────────────────
    get ws() { return this.connection.ws; }

    // ==================== Utilities ====================

    escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#39;');
    }

    showNotification(message, type = 'info') { this.logManager.showNotification(message, type); }
    addLog(msg, type = 'default')            { this.logManager.addLog(msg, type); }

    getElement(id) { return document.getElementById(id); }
    getButton(id)  { return document.getElementById(id); }
    getInput(id)   { return document.getElementById(id); }

    // ==================== Network status bar ====================

    updateNetworkStatus(connected) {
        const bar = this.getElement('networkStatus');
        if (!bar) return;
        if (connected) {
            bar.className   = 'network-status connected';
            bar.textContent = '🟢 已連接 | 遊戲進行中';
        } else {
            bar.className   = 'network-status';
            bar.textContent = '⚪ 未連接 | 請選擇職業後連接';
        }
    }

    // ==================== UI delegates ====================

    updateUI() {
        this.playerPanel.updateUI(this.gameState);
    }

    updatePlayersList() {
        this.playerPanel.updatePlayersList(this.gameState, this.otherPlayers);
    }

    updateTurnStatus() {
        this.turnHandler.updateTurnStatus();
    }

    handleTimerStart(message) {
        if (window.sharedTimer && typeof window.sharedTimer.handleStart === 'function') {
            window.sharedTimer.handleStart(message);
        }
    }

    handleTimerPaused(message) {
        if (window.sharedTimer && typeof window.sharedTimer.handlePause === 'function') {
            window.sharedTimer.handlePause(message);
        }
    }

    handleTimerReset(message) {
        if (window.sharedTimer && typeof window.sharedTimer.handleReset === 'function') {
            window.sharedTimer.handleReset(message);
        }
    }

    handleTimerStop(message) {
        if (window.sharedTimer && typeof window.sharedTimer.handleStop === 'function') {
            window.sharedTimer.handleStop(message);
        }
    }

    // ✅ Always pass both gameState AND otherPlayers - no global reads
    renderAllTiles() {
        this.boardRenderer.renderAllTiles(this.gameState, this.otherPlayers);
    }

    showPropertyPanel() {
        this.connection.send({ type: 'get_property_list' });
    }

    showPortfolio() {
        if (!this.isConnected) return;
        this.connection.send({ type: 'get_portfolio' });
    }

    showLendingPanel() {
        if (!this.isConnected) return;
        this.connection.send({ type: 'get_lending_summary' });
    }
    // ==================== Connect / disconnect ====================

    showProfessionModal() {
        this.modalManager.showProfessionModal(PROFESSIONS, this);
    }

    doConnect()  { this.lifecycle.doConnect(); }
    connect()    { this.lifecycle.doConnect(); }
    disconnect() { this.lifecycle.disconnect(); }

    // ==================== Rename delegate ====================  ✅ ADD THIS

    showRenameModal()        { this.renameManager.show(); }
    handleRenameSuccess(msg) { this.renameManager.handleRenameSuccess(msg); }
    handlePlayerRenamed(msg) { this.renameManager.handlePlayerRenamed(msg); }
    // ==================== Settlement roll delegate ====================
    showSettlementRoll()               { this.settlementRollManager.show(); }
    handleSettlementRollResult(msg)    { this.settlementRollManager.handleResult(msg); }

    // ==================== Player actions ====================

    rollDice()          { this.actions.rollDice(); }
    endTurn() {
        // ✅ Disable button immediately to prevent double-click
        const btn = document.getElementById('btnEndTurn');
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.4';
            btn.style.cursor = 'not-allowed';
        }

        this.actions.endTurn();
    }
    applyLoan()         { this.actions.applyLoan(); }
    repayLoan()         { this.actions.repayLoan(); }
    useFourLeafClover() { this.actions.useFourLeafClover(); }
    useLuckyStar()      { this.actions.useLuckyStar(); }

    // ==================== Private ====================

    _bindEvents() {
        window.gameClient = this;

        const on = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onclick = fn;
        };

        on('btnConnect',      () => this.showProfessionModal());
        on('btnRoll',         () => this.rollDice());
        on('btnEndTurn',      () => this.endTurn());
        on('btnLoan',         () => this.applyLoan());
        on('btnRepayLoan',    () => this.repayLoan());
        on('btnDisconnect',   () => this.disconnect());
        on('btnUseClover',    () => this.useFourLeafClover());
        on('btnUseLuckyStar', () => this.useLuckyStar());
        on('btnRename',       () => this.showRenameModal());
    }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    window.gameClient = new GameClient();
    setTimeout(() => {
        window.gameClient.lifecycle.tryAutoReconnect();
    }, 500);
});