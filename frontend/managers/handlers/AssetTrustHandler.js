"use strict";

export class AssetTrustHandler {
    constructor(client) {
        this.client = client;
    }

    handleAssetTrustPrompt(message) {
        const { client } = this;

        const old = document.getElementById('assetTrustModal');
        if (old) old.remove();

        const setupFee        = message.setupFee        || 1000000;
        const protectionFloor = message.protectionFloor || 10000000;
        const currentCash     = message.currentCash     || 0;
        const canAfford       = currentCash >= setupFee;

        const modalHtml = `
            <div class="modal-content" style="max-width: 480px;
                 background: linear-gradient(135deg, #2c1f3d, #1a1428);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ba68c8; text-align: center;">

                <div style="font-size: 24px; color: #ce93d8;
                            font-weight: bold; margin-bottom: 8px;">
                    🏦 資產信託設立
                </div>
                <div style="font-size: 12px; color: #e1bee7; margin-bottom: 16px;">
                    順流層專屬｜風險隔離保護
                </div>

                <div style="background: rgba(186,104,200,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 14px;
                            border: 1px solid rgba(186,104,200,0.3);
                            text-align: left; font-size: 13px; color: #e1bee7;">
                    <div style="margin-bottom: 8px;">
                        🛡️ <strong>保障機制</strong>
                    </div>
                    <div style="padding-left: 18px; margin-bottom: 10px;">
                        逆境事件（破產、生意失敗、股災等）發生時，
                        保證現金不低於
                        <strong style="color: #ffd966;">
                            $${protectionFloor.toLocaleString()}
                        </strong>
                    </div>
                    <div style="margin-bottom: 8px;">
                        💵 <strong>手續費</strong>
                    </div>
                    <div style="padding-left: 18px; margin-bottom: 10px;">
                        <strong style="color: #ffd966;">
                            $${setupFee.toLocaleString()}
                        </strong>
                        （僅使用現金，貸款金不可用）
                    </div>
                    <div style="margin-bottom: 8px;">
                        ⏰ <strong>期限</strong>
                    </div>
                    <div style="padding-left: 18px;">
                        一次設立，永久有效
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.4); padding: 10px;
                            border-radius: 10px; margin-bottom: 14px;
                            text-align: left; font-size: 13px;">
                    <div>💵 目前現金:
                        <strong style="color: ${canAfford ? '#4caf50' : '#ff6b6b'};">
                            $${currentCash.toLocaleString()}
                        </strong>
                    </div>
                    <div>💸 手續費:
                        <strong style="color: #ffd966;">
                            $${setupFee.toLocaleString()}
                        </strong>
                    </div>
                    <div>💰 設立後現金:
                        <strong>
                            $${Math.max(0, currentCash - setupFee).toLocaleString()}
                        </strong>
                    </div>
                </div>

                ${!canAfford ? `
                    <div style="color: #ff6b6b; font-weight: bold;
                                margin-bottom: 14px; font-size: 13px;">
                        ⚠️ 現金不足，無法設立
                    </div>
                ` : ''}

                <div style="display: flex; gap: 10px;">
                    <button id="assetTrustCancelBtn"
                            style="flex: 1; background: #9e9e9e; color: white;
                                   padding: 10px; border: none;
                                   border-radius: 20px; cursor: pointer;
                                   font-size: 14px;">
                        暫不設立
                    </button>
                    <button id="assetTrustConfirmBtn"
                            style="flex: 2; background: ${canAfford
            ? 'linear-gradient(135deg, #ba68c8, #8e24aa)'
            : '#616161'};
                                   color: white; padding: 10px; border: none;
                                   border-radius: 20px;
                                   cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                                   font-size: 14px; font-weight: bold;
                                   opacity: ${canAfford ? '1' : '0.5'};"
                            ${canAfford ? '' : 'disabled'}>
                        🏦 確認設立
                    </button>
                </div>
            </div>
        `;

        client.modalManager.createModal('assetTrustModal', modalHtml);
        client.modalManager.openModal('assetTrustModal');

        setTimeout(() => {
            const confirmBtn = document.getElementById('assetTrustConfirmBtn');
            const cancelBtn  = document.getElementById('assetTrustCancelBtn');

            if (confirmBtn && canAfford) {
                confirmBtn.onclick = () => {
                    client.connection.send({
                        type: 'asset_trust_setup'
                    });
                    client.modalManager.closeModal('assetTrustModal');
                    client.logManager.addLog('🏦 確認設立資產信託', 'success');
                };
            }

            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    client.modalManager.closeModal('assetTrustModal');
                    client.logManager.addLog('🏦 稍後再設立資產信託', 'info');
                };
            }
        }, 100);

        client.logManager.addLog(message.message || '🏦 資產信託設立提示', 'event');
    }
}