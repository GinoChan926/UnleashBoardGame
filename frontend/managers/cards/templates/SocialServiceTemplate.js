"use strict";

export class SocialServiceTemplate {
    static buildCardModal() {
        return `
            <div class="modal-content" style="max-width: 580px; background: linear-gradient(135deg, #1a2a3a, #0d1b2a); border-radius: 28px; text-align: center; border: 2px solid #ffb347; padding: 24px;">
                <div class="modal-title" style="color: #ffd966; font-size: 24px; text-align: center; margin-bottom: 16px;">🏛️ 社會服務中心</div>
                
                <div class="modal-body" id="socialServiceBody" style="color: #ffefc0; text-align: center; font-size: 14px; line-height: 1.8; margin-bottom: 20px;"></div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px;">
                    <!-- 項目投資卡 -->
                    <div id="socialChoiceInvestment" style="cursor: pointer; transition: all 0.3s ease; border-radius: 16px; overflow: hidden; border: 2px solid #ff6f00; background: rgba(255,111,0,0.1);">
                        <div style="padding: 12px; background: rgba(0,0,0,0.5); text-align: center;">
                            <div style="font-size: 14px; color: #ffd966; font-weight: bold;">🏗️ 項目投資卡</div>
                        </div>
                        <div style="padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 120px; background: rgba(0,0,0,0.3);">
                            <img src="/cards/cover/investment.png" alt="項目投資卡" 
                                 style="width: 100%; max-width: 140px; height: auto; border-radius: 8px; border: 1px solid #ff6f00;"
                                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'font-size: 48px;\\'>🏗️</div><div style=\\'font-size: 12px; color: #ffd966;\\'>項目投資</div>'">
                        </div>
                        <div style="padding: 10px; background: rgba(0,0,0,0.4); text-align: center; font-size: 12px; color: #aaa;">大型投資項目 · 高回报</div>
                    </div>

                    <!-- 服務社會卡 -->
                    <div id="socialChoiceSocial" style="cursor: pointer; transition: all 0.3s ease; border-radius: 16px; overflow: hidden; border: 2px solid #2e7d32; background: rgba(46,125,50,0.1);">
                        <div style="padding: 12px; background: rgba(0,0,0,0.5); text-align: center;">
                            <div style="font-size: 14px; color: #81c784; font-weight: bold;">🤝 服務社會卡</div>
                        </div>
                        <div style="padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 120px; background: rgba(0,0,0,0.3);">
                            <img src="/cards/cover/social.png" alt="服務社會卡" 
                                 style="width: 100%; max-width: 140px; height: auto; border-radius: 8px; border: 1px solid #2e7d32;"
                                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'font-size: 48px;\\'>🤝</div><div style=\\'font-size: 12px; color: #81c784;\\'>服務社會</div>'">
                        </div>
                        <div style="padding: 10px; background: rgba(0,0,0,0.4); text-align: center; font-size: 12px; color: #aaa;">社會公益 · 造福人群</div>
                    </div>
                </div>

                <div style="margin-top: 18px; display: flex; justify-content: center; gap: 15px;">
                    <button class="btn-secondary" id="socialServiceCancelBtn" style="background: #9e9e9e; padding: 10px 30px; border-radius: 30px; cursor: pointer; font-size: 14px; border: none; color: #333;">取消</button>
                </div>
                
                <div style="margin-top: 10px; font-size: 11px; color: #666; text-align: center;">💡 點擊上方卡片選擇類型</div>
            </div>
        `;
    }
}