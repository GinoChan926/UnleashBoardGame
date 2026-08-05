"use strict";

/**
 * ✅ Global server configuration.
 * Change values here to affect backend timing / behavior at once.
 *
 * All times in MILLISECONDS unless suffix says otherwise.
 */
module.exports = {

    // ==================== Timed decisions (sent to frontend as message.timeout in SECONDS) ====================

    // Team card (RevelationCardSystem — team tips like IN02, IN03)
    teamCardTimeoutSec: 60,

    // Market news / asset choice
    assetChoiceTimeoutSec: 30,

    // Group investment / group finance prompts
    groupInvestmentTimeoutSec: 60,

    // Volunteer donation prompts
    volunteerDonationTimeoutSec: 30,

    // Energy trade offers
    energyTradeTimeoutSec: 45,

    // Personal card / gift card
    personalCardTimeoutSec: 45,

    // ==================== Loan / debt ====================

    // Number of settlements before forced repayment
    loanForcedRepayMonths: 12,

    // ==================== Auction ====================

    auctionRoundTimeoutSec: 15,
};