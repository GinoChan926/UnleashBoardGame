"use strict";

/**
 * ✅ Global UI configuration.
 *
 * All UI timing / behavior constants live here.
 * Change values in this file to affect the whole game — no need to hunt through
 * multiple files.
 *
 * All times are in MILLISECONDS unless suffix says otherwise (e.g. *Sec).
 */
export const UI_CONFIG = {

    // ==================== Notifications ====================

    notifications: {
        success: 8000,    // 8 seconds
        error:   12000,   // 12 seconds — errors need time to read
        info:    20000,   // 20 seconds
        warning: 10000,   // 10 seconds
        default: 8000
    },

    // ==================== Modals ====================

    // Fade-out animation before removing a notification/modal from DOM
    modalFadeOutMs: 500,

    // ==================== Timed Decisions ====================

    // Team card (RevelationCardSystem — team tips)
    teamCardTimeoutSec: 60,

    // Market news / asset choice
    assetChoiceTimeoutSec: 30,

    // Group investment / group finance prompts
    groupInvestmentTimeoutSec: 45,

    // Volunteer donation prompts
    volunteerDonationTimeoutSec: 30,

    // Energy trade offers
    energyTradeTimeoutSec: 30,

    // ==================== Auto-Close ====================

    // Hardship shield success modal
    hardshipShieldAutoCloseMs: 30000,

    // Card reveal broadcast (other players seeing what was drawn)
    cardRevealBroadcastAutoCloseMs: 15000,

    // ==================== Animations ====================

    // Dice roll animation duration
    diceAnimationMs: 1500,

    // Player token movement animation
    tokenMoveMs: 500,

    // ==================== Debug ====================

    logMinimizeDebug: false,
    logWalletDebug:   false
};