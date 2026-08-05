"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');
const { creditPlayer } = require('./AutoDebtSystem.js');

/**
 * Player A lends money to Player B with an interest rate.
 */
function handleLendMoney(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const lender = room?.players.get(ws);
    if (!room || !lender) return;

    const { targetPlayerId, amount, note, interestRate } = data;
    const lendAmount = parseInt(amount);
    const rate       = parseFloat(interestRate) || 0;   // ✅ percentage, e.g. 5 = 5%

    if (!targetPlayerId) {
        ws.send(JSON.stringify({ type: 'error', message: '請選擇借款對象' }));
        return;
    }

    if (!lendAmount || lendAmount < 1) {
        ws.send(JSON.stringify({ type: 'error', message: '請輸入有效金額' }));
        return;
    }

    if (rate < 0 || rate > 100) {
        ws.send(JSON.stringify({ type: 'error', message: '利率必須介於 0% 到 100%' }));
        return;
    }

    if (lender.gameState.cash < lendAmount) {
        ws.send(JSON.stringify({ type: 'error', message: `現金不足 $${lendAmount.toLocaleString()}` }));
        return;
    }

    let borrower = null;
    let borrowerWs = null;
    for (const [pWs, p] of room.players) {
        if (p.playerId === targetPlayerId) {
            borrower   = p;
            borrowerWs = pWs;
            break;
        }
    }

    if (!borrower) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到目標玩家' }));
        return;
    }

    if (borrower.playerId === lender.playerId) {
        ws.send(JSON.stringify({ type: 'error', message: '不能借錢給自己' }));
        return;
    }

    // ✅ Calculate interest amount and total repayment
    const interestAmount = Math.floor(lendAmount * rate / 100);
    const totalRepayment = lendAmount + interestAmount;

    // Transfer money
    lender.gameState.cash -= lendAmount;
    const creditResult = creditPlayer(borrower, lendAmount, {
        room, roomId, broadcastToRoom,
        source: `借入自 ${lender.playerName}`
    });

// If auto-repay happened, notify borrower
    if (creditResult.autoRepaid > 0) {
        if (borrowerWs && borrowerWs.readyState === 1) {
            borrowerWs.send(JSON.stringify({
                type: 'notification',
                message: `💸 收到借款後，$${creditResult.autoRepaid.toLocaleString()} 已自動償還銀行債務`
            }));
        }
    }

    // Create debt record
    const debtId = `lend_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const trimmedNote = (note || '').substring(0, 100);

    const debtRecord = {
        debtId,
        principal:      lendAmount,       // ✅ original amount
        interestRate:   rate,             // ✅ interest rate %
        interestAmount: interestAmount,   // ✅ fixed interest owed
        totalOwed:      totalRepayment,   // ✅ principal + interest
        amount:         totalRepayment,   // ✅ remaining balance (starts at totalOwed)
        originalAmount: totalRepayment,   // for display
        note:           trimmedNote,
        timestamp:      Date.now()
    };

    // Lender's side
    lender.gameState.lentOut = lender.gameState.lentOut || [];
    lender.gameState.lentOut.push({
        ...debtRecord,
        to:         borrower.playerName,
        toPlayerId: borrower.playerId
    });

    // Borrower's side
    borrower.gameState.debtsOwed = borrower.gameState.debtsOwed || [];
    borrower.gameState.debtsOwed.push({
        ...debtRecord,
        from:         lender.playerName,
        fromPlayerId: lender.playerId
    });

    // ✅ Build description with interest
    const interestDesc = rate > 0
        ? ` (利率 ${rate}%，需還 $${totalRepayment.toLocaleString()})`
        : '';

    // Records
    addTransactionRecord(
        lender.playerName,
        { name: `借出金錢 → ${borrower.playerName}`, type: 'lending', id: 'LEND' },
        '借出金錢', -lendAmount,
        `借出 $${lendAmount.toLocaleString()} 給 ${borrower.playerName}${interestDesc}${trimmedNote ? ` [${trimmedNote}]` : ''}`,
        null, lender.gameState
    );
    addTransactionRecord(
        borrower.playerName,
        { name: `借入金錢 ← ${lender.playerName}`, type: 'lending', id: 'BORROW' },
        '借入金錢', lendAmount,
        `從 ${lender.playerName} 借入 $${lendAmount.toLocaleString()}${interestDesc}${trimmedNote ? ` [${trimmedNote}]` : ''}`,
        null, borrower.gameState
    );

    // Notify lender
    ws.send(JSON.stringify({
        type: 'lending_success',
        role: 'lender',
        message: `💸 已借出 $${lendAmount.toLocaleString()} 給 ${borrower.playerName}${interestDesc}`,
        gameState: lender.gameState
    }));

    // Notify borrower
    if (borrowerWs && borrowerWs.readyState === 1) {
        borrowerWs.send(JSON.stringify({
            type: 'lending_received',
            fromPlayer:     lender.playerName,
            amount:         lendAmount,
            interestRate:   rate,
            interestAmount: interestAmount,
            totalOwed:      totalRepayment,
            note:           trimmedNote,
            message: `💰 ${lender.playerName} 借了 $${lendAmount.toLocaleString()} 給你${interestDesc}${trimmedNote ? ` [${trimmedNote}]` : ''}`,
            gameState: borrower.gameState
        }));
    }

    // Broadcast
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `💸 ${lender.playerName} 借出 $${lendAmount.toLocaleString()} 給 ${borrower.playerName}${rate > 0 ? ` @ ${rate}% 利率` : ''}`
    });

    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: lender.playerId, gameState: lender.gameState
    });
    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: borrower.playerId, gameState: borrower.gameState
    });

    console.log(`💸 ${lender.playerName} → ${borrower.playerName}: $${lendAmount.toLocaleString()} @ ${rate}% (repay $${totalRepayment.toLocaleString()})`);
}

/**
 * Borrower repays part or all of a debt (including interest).
 */
function handleRepayDebt(ws, data, roomId, rooms, broadcastToRoom) {
    const room     = rooms.get(roomId);
    const borrower = room?.players.get(ws);
    if (!room || !borrower) return;

    const { debtId, amount } = data;
    const payAmount = parseInt(amount);

    if (!debtId || !payAmount || payAmount < 1) {
        ws.send(JSON.stringify({ type: 'error', message: '無效的還款' }));
        return;
    }

    const debt = (borrower.gameState.debtsOwed || []).find(d => d.debtId === debtId);
    if (!debt) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到此債務' }));
        return;
    }

    if (borrower.gameState.cash < payAmount) {
        ws.send(JSON.stringify({ type: 'error', message: `現金不足 $${payAmount.toLocaleString()}` }));
        return;
    }

    // Cap payment at remaining debt (includes interest)
    const actualPayment = Math.min(payAmount, debt.amount);

    let lender = null;
    let lenderWs = null;
    for (const [pWs, p] of room.players) {
        if (p.playerId === debt.fromPlayerId) {
            lender = p;
            lenderWs = pWs;
            break;
        }
    }

    if (!lender) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '借款人已離開遊戲，無法還款'
        }));
        return;
    }

    // Transfer
    borrower.gameState.cash -= actualPayment;
    const creditResult = creditPlayer(lender, actualPayment, {
        room, roomId, broadcastToRoom,
        source: `收到 ${borrower.playerName} 還款`
    });

    if (creditResult.autoRepaid > 0 && lenderWs && lenderWs.readyState === 1) {
        lenderWs.send(JSON.stringify({
            type: 'notification',
            message: `💸 收到還款後，$${creditResult.autoRepaid.toLocaleString()} 已自動償還你的銀行債務`
        }));
    }
    // Update remaining
    debt.amount -= actualPayment;

    const lenderDebt = (lender.gameState.lentOut || []).find(d => d.debtId === debtId);
    if (lenderDebt) lenderDebt.amount -= actualPayment;

    const wasFullyPaid = debt.amount <= 0;
    if (wasFullyPaid) {
        borrower.gameState.debtsOwed = borrower.gameState.debtsOwed.filter(d => d.debtId !== debtId);
        lender.gameState.lentOut     = lender.gameState.lentOut.filter(d => d.debtId !== debtId);
    }

    const noteText = debt.note ? ` [${debt.note}]` : '';
    const rateText = debt.interestRate > 0 ? ` @ ${debt.interestRate}% 利率` : '';

    addTransactionRecord(
        borrower.playerName,
        { name: `還款給 ${lender.playerName}`, type: 'lending', id: 'REPAY' },
        '還款', -actualPayment,
        `還 $${actualPayment.toLocaleString()} 給 ${lender.playerName}${rateText}${noteText}${wasFullyPaid ? '（已還清）' : `（剩餘 $${debt.amount.toLocaleString()}）`}`,
        null, borrower.gameState
    );
    addTransactionRecord(
        lender.playerName,
        { name: `收到還款 ${borrower.playerName}`, type: 'lending', id: 'REPAY_RECEIVED' },
        '收到還款', actualPayment,
        `收到 ${borrower.playerName} 還款 $${actualPayment.toLocaleString()}${rateText}${noteText}${wasFullyPaid ? '（已還清）' : `（剩餘 $${debt.amount.toLocaleString()}）`}`,
        null, lender.gameState
    );

    ws.send(JSON.stringify({
        type: 'repay_success',
        message: wasFullyPaid
            ? `✅ 已還清欠 ${lender.playerName} 的 $${debt.originalAmount.toLocaleString()}${rateText}！`
            : `💰 已還 $${actualPayment.toLocaleString()} 給 ${lender.playerName}，剩餘欠款 $${debt.amount.toLocaleString()}`,
        gameState: borrower.gameState
    }));

    if (lenderWs && lenderWs.readyState === 1) {
        lenderWs.send(JSON.stringify({
            type: 'repay_received',
            message: wasFullyPaid
                ? `✅ ${borrower.playerName} 已還清欠款 $${debt.originalAmount.toLocaleString()}${rateText}！`
                : `💰 收到 ${borrower.playerName} 還款 $${actualPayment.toLocaleString()}，剩餘 $${debt.amount.toLocaleString()}`,
            gameState: lender.gameState
        }));
    }

    broadcastToRoom(roomId, {
        type: 'notification',
        message: `💰 ${borrower.playerName} 還款 $${actualPayment.toLocaleString()} 給 ${lender.playerName}${wasFullyPaid ? '（已還清）' : ''}`
    });

    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: borrower.playerId, gameState: borrower.gameState
    });
    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: lender.playerId, gameState: lender.gameState
    });

    console.log(`💰 ${borrower.playerName} 還 $${actualPayment.toLocaleString()} 給 ${lender.playerName}${wasFullyPaid ? '（清償）' : ''}`);
}

function handleGetLendingSummary(ws, data, roomId, rooms) {
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const otherPlayers = [];
    room.players.forEach(p => {
        if (p.playerId !== player.playerId) {
            otherPlayers.push({
                playerId:   p.playerId,
                playerName: p.playerName
            });
        }
    });

    ws.send(JSON.stringify({
        type:         'lending_summary',
        cash:         player.gameState.cash,
        lentOut:      player.gameState.lentOut   || [],
        debtsOwed:    player.gameState.debtsOwed || [],
        pendingDebts: player.gameState.pendingDebts || [],   // ✅ NEW
        otherPlayers
    }));
}

/**
 * Manually pay a bank-owed debt (from pendingDebts, not player-to-player).
 */
function handlePayBankDebt(ws, data, roomId, rooms, broadcastToRoom) {
    const { payDebtManually } = require('./AutoDebtSystem.js');
    const room   = rooms.get(roomId);
    const player = room?.players.get(ws);
    if (!room || !player) return;

    const { debtId, amount } = data;
    const payAmount = parseInt(amount);

    if (!payAmount || payAmount < 1) {
        ws.send(JSON.stringify({ type: 'error', message: '請輸入有效金額' }));
        return;
    }

    const result = payDebtManually(
        player, room, roomId, broadcastToRoom, payAmount, debtId || null
    );

    if (!result.success) {
        ws.send(JSON.stringify({ type: 'error', message: result.message }));
        return;
    }

    ws.send(JSON.stringify({
        type:      'bank_debt_repay_success',
        message:   `${result.message}${
            result.clearedDebts.length > 0
                ? `（清償 ${result.clearedDebts.length} 筆）`
                : ''
        }`,
        totalPaid:      result.totalPaid,
        remainingDebts: result.remainingDebts,
        gameState:      player.gameState
    }));

    broadcastToRoom(roomId, {
        type:      'state_updated',
        playerId:  player.playerId,
        gameState: player.gameState
    });

    console.log(`💰 ${player.playerName} 手動償還銀行債務 $${result.totalPaid.toLocaleString()}`);
}

module.exports = {
    handleLendMoney,
    handleRepayDebt,
    handleGetLendingSummary,
    handlePayBankDebt
};