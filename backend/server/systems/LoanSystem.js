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
            message: `❌ 你还有 ${loanRecord.principal.toLocaleString()} 元贷款未还清，请先还清再申请！`
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
        player.gameState.luck         = Math.max(0, player.gameState.luck - 1);

        const result = {
            type: 'loan_approved', playerId: player.playerId,
            playerName: player.playerName, loanAmount: amount,
            interestAmount: interest, totalToRepay, interestRate,
            gameState: player.gameState
        };
        ws.send(JSON.stringify(result));
        broadcastToRoom(roomId, result, ws);

        console.log(`🏦 ${player.playerName} 贷款 ${amount.toLocaleString()} 元`);
    } else {
        ws.send(JSON.stringify({ type: 'loan_rejected', reason: '贷款金额无效或超出上限' }));
    }
}

function handleRepayLoan(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const loanRecord  = getPlayerLoan(player);
    const principal   = loanRecord.principal;

    if (principal === 0) {
        ws.send(JSON.stringify({ type: 'error', message: '💰 没有未偿还的贷款' }));
        return;
    }

    const totalToRepay = calculateTotalRepay(principal, loanRecord.interestRate);
    const interest     = totalToRepay - principal;

    if (player.gameState.cash < totalToRepay) {
        ws.send(JSON.stringify({
            type:    'error',
            message: `💰 现金不足！需要 ${totalToRepay.toLocaleString()} 元 (本金 ${principal.toLocaleString()} + 利息 ${interest.toLocaleString()})`
        }));
        return;
    }

    player.gameState.cash        -= totalToRepay;
    player.gameState.loanAmount   = 0;
    player.gameState.loanInterest = 0;
    loanRecord.principal          = 0;
    loanRecord.settlementCount    = 0;
    player.gameState.luck         = Math.min(player.gameState.maxLuck, player.gameState.luck + 1);

    const result = {
        type: 'loan_repaid', playerId: player.playerId,
        playerName: player.playerName, repaidAmount: principal,
        interestAmount: interest, totalRepaid: totalToRepay,
        gameState: player.gameState
    };
    ws.send(JSON.stringify(result));
    broadcastToRoom(roomId, result, ws);

    console.log(`💰 ${player.playerName} 还款 ${totalToRepay.toLocaleString()} 元`);
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
                message: `⚠️ 强制还款！扣除 ${totalToRepay.toLocaleString()} 元`,
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
                message: `⚠️ 强制部分还款！扣除 ${deducted.toLocaleString()} 元，剩余欠款 ${remainingDebt.toLocaleString()} 元`,
                deductedAmount: deducted, remainingDebt, remainingCash: 0,
                gameState: player.gameState
            };
        }
    }

    return {
        type:    'settlement_reminder',
        playerId: player.playerId, playerName: player.playerName,
        message: `⚠️ 贷款提醒！本金 ${loanRecord.principal.toLocaleString()} 元，已过 ${loanRecord.settlementCount}/12 次结算日`,
        principal: loanRecord.principal, totalToRepay, interest,
        settlementCount:     loanRecord.settlementCount,
        remainingSettlements: 12 - loanRecord.settlementCount,
        gameState: player.gameState
    };
}

module.exports = { getPlayerLoan, calculateTotalRepay, handleLoan, handleRepayLoan, processSettlementRepayment };