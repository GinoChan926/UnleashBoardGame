"use strict";

/**
 * Pure data store - owns gameState and otherPlayers.
 * No UI calls, no WebSocket calls.
 * All mutations go through methods so callers have
 * a single place to add validation later.
 */
export class GameState {
    constructor() {
        this.myState      = null;   // the local player's server gameState object
        this.otherPlayers = new Map(); // playerId → server gameState object
    }

    // ── My state ────────────────────────────────────────────────────────

    setMyState(state) {
        this.myState = state;
    }

    updateMyState(partial) {
        if (!this.myState) this.myState = {};
        Object.assign(this.myState, partial);
    }

    clearMyState() {
        this.myState = null;
    }

    // ── Other players ────────────────────────────────────────────────────

    setOtherPlayer(playerId, state) {
        this.otherPlayers.set(playerId, state);
    }

    removeOtherPlayer(playerId) {
        this.otherPlayers.delete(playerId);
    }

    clearOtherPlayers() {
        this.otherPlayers.clear();
    }

    getOtherPlayer(playerId) {
        return this.otherPlayers.get(playerId);
    }

    // ── Convenience reads ─────────────────────────────────────────────────

    get isMyTurn() {
        return this.myState?.isMyTurn === true;
    }

    get energy() {
        return this.myState?.energy ?? 0;
    }

    get currentTurnPlayer() {
        return this.myState?.currentTurnPlayer ?? null;
    }
}