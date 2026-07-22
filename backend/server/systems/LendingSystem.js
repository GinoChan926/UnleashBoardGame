"use strict";

const { addTransactionRecord } = require('../records/TransactionRecorder.js');

/**
 * Player A lends money to Player B.
 * Anyone can lend at any time, not just on their turn.
 */
function handleLendMoney(ws, data, roomId, rooms, broadcastToRoom) {
    const room   = rooms.get(roomId);
    const lender = room?.players.get(ws);
    if (!room || !lender) return;

    const { targetPlayerId, amount, note } = data;
    const lendAmount = parseInt(amount);

    if (!targetPlayerId) {
        ws.send(JSON.stringify({ type: 'error', message: '請選擇借款對象' }));
        return;
    }

    if (!lendAmount || lendAmount < 1) {
        ws.send(JSON.stringify({ type: 'error', message: '請輸入有效金額' }));
        return;
    }

    if (lender.gameState.cash < lendAmount) {
        ws.send(JSON.stringify({ type: 'error', message: `現金不足 $${lendAmount.toLocaleString()}` }));
        return;
    }

    // Find target
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

    // Transfer money
    lender.gameState.cash   -= lendAmount;
    borrower.gameState.cash += lendAmount;

    // Create debt record
    const debtId = `lend_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const trimmedNote = (note || '').substring(0, 100);

    // Lender's side (money going out)
    lender.gameState.lentOut = lender.gameState.lentOut || [];
    lender.gameState.lentOut.push({
        debtId,
        to:             borrower.playerName,
        toPlayerId:     borrower.playerId,
        amount:         lendAmount,
        originalAmount: lendAmount,
        note:           trimmedNote,
        timestamp:      Date.now()
    });

    // Borrower's side (money coming in as debt)
    borrower.gameState.debtsOwed = borrower.gameState.debtsOwed || [];
    borrower.gameState.debtsOwed.push({
        debtId,
        from:           lender.playerName,
        fromPlayerId:   lender.playerId,
        amount:         lendAmount,
        originalAmount: lendAmount,
        note:           trimmedNote,
        timestamp:      Date.now()
    });

    // Records
    addTransactionRecord(
        lender.playerName,
        { name: `借出金錢 → ${borrower.playerName}`, type: 'lending', id: 'LEND' },
        '借出金錢', -lendAmount,
        `借出 $${lendAmount.toLocaleString()} 給 ${borrower.playerName}${trimmedNote ? ` (${trimmedNote})` : ''}`,
        null, lender.gameState
    );
    addTransactionRecord(
        borrower.playerName,
        { name: `借入金錢 ← ${lender.playerName}`, type: 'lending', id: 'BORROW' },
        '借入金錢', lendAmount,
        `從 ${lender.playerName} 借入 $${lendAmount.toLocaleString()}${trimmedNote ? ` (${trimmedNote})` : ''}`,
        null, borrower.gameState
    );

    // Notify both parties
    ws.send(JSON.stringify({
        type: 'lending_success',
        role: 'lender',
        message: `💸 已借出 $${lendAmount.toLocaleString()} 給 ${borrower.playerName}`,
        gameState: lender.gameState
    }));

    if (borrowerWs && borrowerWs.readyState === 1) {
        borrowerWs.send(JSON.stringify({
            type: 'lending_received',
            fromPlayer: lender.playerName,
            amount: lendAmount,
            note: trimmedNote,
            message: `💰 ${lender.playerName} 借了 $${lendAmount.toLocaleString()} 給你${trimmedNote ? ` (${trimmedNote})` : ''}`,
            gameState: borrower.gameState
        }));
    }

    // Broadcast to all
    broadcastToRoom(roomId, {
        type: 'notification',
        message: `💸 ${lender.playerName} 借出 $${lendAmount.toLocaleString()} 給 ${borrower.playerName}`
    });

    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: lender.playerId, gameState: lender.gameState
    });
    broadcastToRoom(roomId, {
        type: 'state_updated', playerId: borrower.playerId, gameState: borrower.gameState
    });

    console.log(`💸 ${lender.playerName} → ${borrower.playerName}: $${lendAmount.toLocaleString()}`);
}

/**
 * Borrower pays back all or part of a debt.
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

    // Find the debt in borrower's list
    const debt = (borrower.gameState.debtsOwed || []).find(d => d.debtId === debtId);
    if (!debt) {
        ws.send(JSON.stringify({ type: 'error', message: '找不到此債務' }));
        return;
    }

    if (borrower.gameState.cash < payAmount) {
        ws.send(JSON.stringify({ type: 'error', message: `現金不足 $${payAmount.toLocaleString()}` }));
        return;
    }

    // Cap payment at remaining debt amount
    const actualPayment = Math.min(payAmount, debt.amount);

    // Find lender in room
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

    // Transfer money
    borrower.gameState.cash -= actualPayment;
    lender.gameState.cash   += actualPayment;

    // Update debt records on both sides
    debt.amount -= actualPayment;

    const lenderDebt = (lender.gameState.lentOut || []).find(d => d.debtId === debtId);
    if (lenderDebt) lenderDebt.amount -= actualPayment;

    // Remove if fully paid
    const wasFullyPaid = debt.amount <= 0;
    if (wasFullyPaid) {
        borrower.gameState.debtsOwed = borrower.gameState.debtsOwed.filter(d => d.debtId !== debtId);
        lender.gameState.lentOut = lender.gameState.lentOut.filter(d => d.debtId !== debtId);
    }

    const noteText = debt.note ? ` (${debt.note})` : '';

    // Records
    addTransactionRecord(
        borrower.playerName,
        { name: `還款給 ${lender.playerName}`, type: 'lending', id: 'REPAY' },
        '還款', -actualPayment,
        `還 $${actualPayment.toLocaleString()} 給 ${lender.playerName}${noteText}${wasFullyPaid ? '（已還清）' : `（剩餘 $${debt.amount.toLocaleString()}）`}`,
        null, borrower.gameState
    );
    addTransactionRecord(
        lender.playerName,
        { name: `收到還款 ${borrower.playerName}`, type: 'lending', id: 'REPAY_RECEIVED' },
        '收到還款', actualPayment,
        `收到 ${borrower.playerName} 還款 $${actualPayment.toLocaleString()}${noteText}${wasFullyPaid ? '（已還清）' : `（剩餘 $${debt.amount.toLocaleString()}）`}`,
        null, lender.gameState
    );

    // Notify borrower
    ws.send(JSON.stringify({
        type: 'repay_success',
        message: wasFullyPaid
            ? `✅ 已還清欠 ${lender.playerName} 的 $${debt.originalAmount.toLocaleString()}！`
            : `💰 已還 $${actualPayment.toLocaleString()} 給 ${lender.playerName}，剩餘欠款 $${debt.amount.toLocaleString()}`,
        gameState: borrower.gameState
    }));

    // Notify lender
    if (lenderWs && lenderWs.readyState === 1) {
        lenderWs.send(JSON.stringify({
            type: 'repay_received',
            message: wasFullyPaid
                ? `✅ ${borrower.playerName} 已還清欠款 $${debt.originalAmount.toLocaleString()}！`
                : `💰 收到 ${borrower.playerName} 還款 $${actualPayment.toLocaleString()}，剩餘 $${debt.amount.toLocaleString()}`,
            gameState: lender.gameState
        }));
    }

    // Broadcast
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

/**
 * Player requests summary of all lending/borrowing.
 */
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
        type: 'lending_summary',
        cash:        player.gameState.cash,
        lentOut:     player.gameState.lentOut   || [],
        debtsOwed:   player.gameState.debtsOwed || [],
        otherPlayers
    }));
}

module.exports = {
    handleLendMoney,
    handleRepayDebt,
    handleGetLendingSummary
};