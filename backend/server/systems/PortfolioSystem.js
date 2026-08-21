"use strict";

/**
 * Sends a snapshot of all a player's investments back to them.
 * Includes stocks, crypto, funds, P2P investments, business, and properties.
 */
function handleGetPortfolio(ws, data, roomId, rooms) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const state = player.gameState;

    // Collect stocks (with current price if available)
    const stocks = [];
    if (state.stockHoldings) {
        for (const [stockId, holding] of Object.entries(state.stockHoldings)) {
            const currentValue = holding.shares * (holding.lastPrice || holding.purchasePrice || 0);
            const profit = currentValue - holding.totalCost;

            stocks.push({
                id:            stockId,
                code:          holding.code || stockId,
                name:          holding.name || stockId,
                shares:        holding.shares,
                avgCost:       holding.purchasePrice,
                totalCost:     holding.totalCost,
                lastPrice:     holding.lastPrice || holding.purchasePrice,
                currentValue,
                profit,
                profitPercent: holding.totalCost > 0
                    ? (profit / holding.totalCost * 100)
                    : 0
            });
        }
    }

    // Collect crypto
    const crypto = [];
    if (state.cryptoHoldings) {
        for (const [cryptoId, holding] of Object.entries(state.cryptoHoldings)) {
            const currentValue = holding.units * (holding.lastPrice || holding.averagePrice || 0);
            const profit = currentValue - holding.totalCost;

            crypto.push({
                id:            cryptoId,
                code:          holding.code || cryptoId,
                name:          holding.name || cryptoId,
                units:         holding.units,
                avgCost:       holding.averagePrice,
                totalCost:     holding.totalCost,
                lastPrice:     holding.lastPrice || holding.averagePrice,
                currentValue,
                profit,
                profitPercent: holding.totalCost > 0
                    ? (profit / holding.totalCost * 100)
                    : 0
            });
        }
    }

    // Collect funds and P2P (from financeInvestments)
    const funds = [];
    if (state.financeInvestments) {
        state.financeInvestments.forEach(inv => {
            funds.push({
                id:            inv.id,
                name:          inv.name,
                units:         inv.units,
                pricePerUnit:  inv.pricePerUnit,
                monthlyReturn:      (inv.monthlyReturn || 0) * (inv.units || 1),
                totalCost:     inv.totalCost
            });
        });
    }
    if (state.p2pHoldings) {
        for (const [p2pId, holding] of Object.entries(state.p2pHoldings)) {
            // Skip if already added from financeInvestments
            if (funds.some(f => f.id === p2pId)) continue;

            funds.push({
                id: p2pId,
                name: holding.name || p2pId,
                units: holding.units || 0,
                pricePerUnit: holding.purchasePrice || holding.lastPrice || 10,
                monthlyReturnPerUnit: 0,
                monthlyReturn: 0,
                totalCost: holding.totalCost || 0
            });
        }
    }

    // Collect business investments
    const businesses = [];
    if (state.businessInvestments) {
        state.businessInvestments.forEach(inv => {
            businesses.push({
                id:            inv.id,
                name:          inv.name,
                units:         inv.units || 1,
                cost:          inv.cost || inv.totalCost || 0,
                monthlyReturn: inv.monthlyReturn || 0,
                energyCost:    inv.energyCost || 0
            });
        });
    }

    // Collect properties
    const properties = [];
    if (state.propertyInvestments) {
        state.propertyInvestments.forEach(inv => {
            properties.push({
                id:               inv.id,
                name:             inv.name,
                totalPrice:       inv.totalPrice,
                monthlyReturn:    inv.monthlyReturn || 0,
                monthlyPayment:   inv.monthlyPayment || 0,
                remainingBalance: inv.remainingBalance !== undefined
                    ? inv.remainingBalance
                    : (inv.mortgageAmount || 0),
                usage:            inv.usage || 'rent_out',
                paidOff:          inv.paidOff === true
            });
        });
    }

    // Send portfolio snapshot
    ws.send(JSON.stringify({
        type: 'portfolio_snapshot',
        cash: state.cash,
        totalAssets: state.totalAssets || 0,
        stocks,
        crypto,
        funds,
        businesses,
        properties
    }));

    console.log(`📊 ${player.playerName} 查看投資組合`);
}

module.exports = { handleGetPortfolio };