"use strict";

function getPlayerLoan(player) {
    if (!player.loanRecord) {
        player.loanRecord = {
            principal:            0,
            interestRate:         0.1,
            settlementCount:      0,
            lastSettlementMonth:  0
        };
    }
    return player.loanRecord;
}

function calculateTotalRepay(principal, interestRate = 0.1) {
    return principal + Math.round(principal * interestRate);
}

function handleLoan(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const loanRecord = getPlayerLoan(player);

    if (loanRecord.principal > 0) {
        ws.send(JSON.stringify({
            type:    'error',
            message: `❌ 你還有 ${loanRecord.principal.toLocaleString()} 元貸款未還清，請先還清再申請！`
        }));
        return;
    }

    const amount       = data.data?.amount || data.amount;
    const maxLoan      = Math.round((player.gameState.salary + player.gameState.sideIncome) * 3);
    const interestRate = player.gameState.permanentLoanRate || 10;

    if (amount > 0 && amount <= maxLoan) {
        const interest    = Math.round(amount * interestRate / 100);
        const totalToRepay = amount + interest;

        loanRecord.principal           = amount;
        loanRecord.interestRate        = interestRate / 100;
        loanRecord.settlementCount     = 0;
        loanRecord.lastSettlementMonth = player.gameState.totalSettlementCount || 0;

        player.gameState.cash        += amount;
        player.gameState.loanAmount   = amount;
        player.gameState.loanInterest = Math.round(amount * interestRate / 100 / 12);
        // player.gameState.luck         = Math.max(0, player.gameState.luck - 1);

        const result = {
            type: 'loan_approved', playerId: player.playerId,
            playerName: player.playerName, loanAmount: amount,
            interestAmount: interest, totalToRepay, interestRate,
            gameState: player.gameState
        };
        ws.send(JSON.stringify(result));
        broadcastToRoom(roomId, result, ws);

        console.log(`🏦 ${player.playerName} 貸款 ${amount.toLocaleString()} 元`);
    } else {
        ws.send(JSON.stringify({ type: 'loan_rejected', reason: '貸款金額無效或超出上限' }));
    }
}

function handleRepayLoan(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const loanRecord  = getPlayerLoan(player);
    const principal   = loanRecord.principal;

    if (principal === 0) {
        ws.send(JSON.stringify({ type: 'error', message: '💰 沒有未償還的貸款' }));
        return;
    }

    const totalToRepay = calculateTotalRepay(principal, loanRecord.interestRate);
    const interest     = totalToRepay - principal;

    if (player.gameState.cash < totalToRepay) {
        ws.send(JSON.stringify({
            type:    'error',
            message: `💰 現金不足！需要 ${totalToRepay.toLocaleString()} 元 (本金 ${principal.toLocaleString()} + 利息 ${interest.toLocaleString()})`
        }));
        return;
    }

    player.gameState.cash        -= totalToRepay;
    player.gameState.loanAmount   = 0;
    player.gameState.loanInterest = 0;
    loanRecord.principal          = 0;
    loanRecord.settlementCount    = 0;
    // player.gameState.luck         = Math.min(player.gameState.maxLuck, player.gameState.luck + 1);

    const result = {
        type: 'loan_repaid', playerId: player.playerId,
        playerName: player.playerName, repaidAmount: principal,
        interestAmount: interest, totalRepaid: totalToRepay,
        gameState: player.gameState
    };
    ws.send(JSON.stringify(result));
    broadcastToRoom(roomId, result, ws);

    console.log(`💰 ${player.playerName} 還款 ${totalToRepay.toLocaleString()} 元`);
}

function processSettlementRepayment(player, ws, roomId, broadcastToRoom) {
    const loanRecord = getPlayerLoan(player);
    if (loanRecord.principal === 0) return null;

    loanRecord.settlementCount++;
    player.gameState.totalSettlementCount = (player.gameState.totalSettlementCount || 0) + 1;

    const interestRate  = loanRecord.interestRate || 0.1;
    const totalToRepay  = loanRecord.principal + Math.round(loanRecord.principal * interestRate);
    const interest      = totalToRepay - loanRecord.principal;

    if (loanRecord.settlementCount >= 12) {
        if (player.gameState.cash >= totalToRepay) {
            player.gameState.cash -= totalToRepay;
            const result = {
                type:    'forced_repayment',
                playerId: player.playerId, playerName: player.playerName,
                message: `⚠️ 強制還款！扣除 ${totalToRepay.toLocaleString()} 元`,
                deductedAmount: totalToRepay, remainingCash: player.gameState.cash,
                gameState: player.gameState
            };
            player.gameState.loanAmount   = 0;
            player.gameState.loanInterest = 0;
            loanRecord.principal          = 0;
            loanRecord.settlementCount    = 0;
            return result;
        } else {
            const deducted      = player.gameState.cash;
            const remainingDebt = totalToRepay - deducted;
            player.gameState.cash         = 0;
            loanRecord.principal          = remainingDebt;
            loanRecord.settlementCount    = 12;
            player.gameState.loanAmount   = remainingDebt;
            player.gameState.loanInterest = Math.round(remainingDebt * 0.01);

            return {
                type:    'forced_repayment_partial',
                playerId: player.playerId, playerName: player.playerName,
                message: `⚠️ 強制部分還款！扣除 ${deducted.toLocaleString()} 元，剩餘欠款 ${remainingDebt.toLocaleString()} 元`,
                deductedAmount: deducted, remainingDebt, remainingCash: 0,
                gameState: player.gameState
            };
        }
    }

    return {
        type:    'settlement_reminder',
        playerId: player.playerId, playerName: player.playerName,
        message: `⚠️ 貸款提醒！本金 ${loanRecord.principal.toLocaleString()} 元，已過 ${loanRecord.settlementCount}/12 次結算日`,
        principal: loanRecord.principal, totalToRepay, interest,
        settlementCount:     loanRecord.settlementCount,
        remainingSettlements: 12 - loanRecord.settlementCount,
        gameState: player.gameState
    };
}

module.exports = { getPlayerLoan, calculateTotalRepay, handleLoan, handleRepayLoan, processSettlementRepayment };