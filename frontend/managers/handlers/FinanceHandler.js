"use strict";

export class FinanceHandler {
    constructor(client) {
        this.client = client;
    }

    // ==================== Loan flow ====================

    /**
     * ✅ NEW — Show the loan application modal with full financial info.
     */
    async handleLoanInfo(message) {
        const { client } = this;

        // ✅ If we came from repayLoan, show repay modal instead
        if (client._pendingRepayMode) {
            client._pendingRepayMode = false;

            // If no active loan, show error
            if (!message.currentLoan || message.currentLoan <= 0) {
                client.logManager.addLog('💰 你目前沒有未償還的貸款', 'warning');
                client.logManager.showNotification('💰 你目前沒有未償還的貸款', 'warning');
                return;
            }

            const { LoanTemplate } = await import('../cards/templates/LoanTemplate.js');
            const old = document.getElementById('loanRepayModal');
            if (old) old.remove();

            client.modalManager.createModal(
                'loanRepayModal',
                LoanTemplate.buildRepayModal()
            );
            client.modalManager.openModal('loanRepayModal');

            LoanTemplate.populateRepay(message, {
                onConfirm: (amount) => {
                    client.connection.send({
                        type:   'repay_loan',
                        amount
                    });
                    client.modalManager.closeModal('loanRepayModal');
                    client.logManager.addLog(
                        `💰 提交還款請求 $${amount.toLocaleString()}`,
                        'info'
                    );
                },
                onCancel: () => {
                    client.modalManager.closeModal('loanRepayModal');
                }
            });

            return;
        }

        // ── Normal loan application flow ─────────────────────────────────────
        const { LoanTemplate } = await import('../cards/templates/LoanTemplate.js');

        const old = document.getElementById('loanModal');
        if (old) old.remove();

        client.modalManager.createModal('loanModal', LoanTemplate.buildModal());
        client.modalManager.openModal('loanModal');

        LoanTemplate.populate(message, {
            onConfirm: (amount) => {
                client.connection.send({
                    type:   'apply_loan',
                    amount
                });
                client.modalManager.closeModal('loanModal');
                client.logManager.addLog(
                    `🏦 申請貸款 $${amount.toLocaleString()}`,
                    'info'
                );
            },
            onCancel: () => {
                client.modalManager.closeModal('loanModal');
            }
        });
    }

    handleLoanApproved(message) {
        this._applyMyState(message);

        const { client } = this;
        const msg = `🏦 貸款批准！\n` +
            `💰 貸款金額: $${message.loanAmount.toLocaleString()}\n` +
            `💸 月利息: $${message.interestAmount.toLocaleString()}` +
            ` (${(message.monthlyRate * 100).toFixed(1)}%)\n` +
            `📊 貸款後月現金流: $${message.cashflowAfter.toLocaleString()}`;

        client.logManager.addLog(msg, 'success');
        client.logManager.showNotification(
            `🏦 貸款 $${message.loanAmount.toLocaleString()} 已批准！`,
            'success'
        );
    }

    handleLoanRepaid(message) {
        this._applyMyState(message);

        const { client } = this;
        const isFully = message.isFullyPaid !== false;

        let msg;
        if (isFully) {
            msg = `💰 貸款已還清！\n` +
                `💸 累積利息: $${message.repaidInterest.toLocaleString()}\n` +
                `📤 本金: $${message.repaidPrincipal.toLocaleString()}\n` +
                `💵 總還款: $${message.totalRepaid.toLocaleString()}`;

            if (message.loanCashReturned > 0) {
                msg += `\n🏦 返還未用貸款金: $${message.loanCashReturned.toLocaleString()}\n` +
                    `💵 實付現金: $${message.cashPaid.toLocaleString()}`;
            }
        } else {
            msg = `💰 部分還款成功！\n` +
                `💸 償還利息: $${message.repaidInterest.toLocaleString()}\n` +
                `📤 償還本金: $${message.repaidPrincipal.toLocaleString()}\n` +
                `💵 本次還款: $${message.totalRepaid.toLocaleString()}\n` +
                `📊 剩餘本金: $${message.remainingPrincipal.toLocaleString()}\n` +
                `💸 剩餘累積利息: $${message.remainingInterest.toLocaleString()}`;
        }

        client.logManager.addLog(msg, 'success');
        client.logManager.showNotification(
            isFully
                ? `💰 已還清貸款 $${message.totalRepaid.toLocaleString()}`
                : `💰 還款 $${message.totalRepaid.toLocaleString()}，剩餘欠款 $${(message.remainingPrincipal + message.remainingInterest).toLocaleString()}`,
            'success'
        );
    }

    handleLoanRejected(message) {
        const { client } = this;
        const reason = message.reason || '貸款申請被拒絕';
        client.logManager.addLog(message.reason || '貸款申請被拒絕', 'error');
        client.logManager.showNotification(message.reason || '貸款申請被拒絕', 'error');
    }

    handleForcedRepayment(message) {
        this._applyMyState(message);
        this.client.logManager.addLog(`⚠️ 強制還款: ${message.message}`, 'warning');
        this.client.logManager.showNotification(message.message, 'warning');
    }

    handleSettlementReminder(message) {
        this.client.logManager.addLog(`📅 ${message.message}`, 'info');
    }

    // ==================== Settlement flow ====================

    async handleSettlement(message) {
        const { client } = this;

        const isMe = message.playerId === client.playerId;

        if (message.gameState && isMe) {
            client.gameState = message.gameState;
            client.updateUI();
        }

        const playerLabel = isMe ? '你' : (message.playerName || '玩家');
        const income      = (message.totalIncome  || 0).toLocaleString();
        const expense     = (message.totalExpense || 0).toLocaleString();
        const reduction   = message.expenseReductionMessage || '';
        const teaFee      = message.teaRestaurantMessage    || '';
        const exactHint   = message.isExactLanding ? '（正好踩中，擲骰得精力）' : '';

        let logMsg = `🏁 ${playerLabel} 結算日：收入 ${income} 元，支出 ${expense} 元${reduction}${exactHint}`;
        if (teaFee) logMsg += ` | ${teaFee}`;

        client.logManager.addLog(logMsg, 'event');

        if (isMe) {
            let notifMsg = `💰 結算日！收入 ${income} 元，支出 ${expense} 元${reduction}`;
            if (teaFee) notifMsg += `\n${teaFee}`;
            client.logManager.showNotification(notifMsg, 'success');
        }

        if (isMe && message.pendingSettlementRoll) {
            setTimeout(() => {
                client.showSettlementRoll();
            }, 800);
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    _applyMyState(message) {
        const { client } = this;
        if (message.gameState && message.playerId === client.playerId) {
            client.gameState = message.gameState;
            client.updateUI();
        }
    }
}