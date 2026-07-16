"use strict";

export class GoodCitizenTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 480px;
                 background: linear-gradient(135deg, #4a3d1a, #2a2510);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ffd700;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 26px; color: #ffd700; font-weight: bold;">
                        🏆 救人做好市民
                    </div>
                    <div style="font-size: 12px; color: #fff59d; margin-top: 6px;">
                        你見義勇為協助警方破案，獲頒好市民獎！
                    </div>
                </div>

                <div style="background: rgba(255,215,0,0.15); padding: 14px;
                            border-radius: 12px; margin-bottom: 16px; text-align: center;
                            border: 1px solid rgba(255,215,0,0.3);">
                    <div style="color: #ffd700; font-size: 14px; font-weight: bold;">
                        📌 請選擇你的獎勵
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                    <!-- Volunteer option -->
                    <button id="goodCitizenVolunteerBtn"
                            style="background: linear-gradient(135deg, #4caf50, #388e3c);
                                   color: white; padding: 18px; border: none;
                                   border-radius: 14px; cursor: pointer;
                                   font-size: 15px; font-weight: bold;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 4px 12px rgba(76,175,80,0.3);
                                   text-align: left;">
                        <div style="font-size: 18px; margin-bottom: 6px;">
                            ⭐ 獲得 2 次義工資格
                        </div>
                        <div style="font-size: 11px; opacity: 0.9; font-weight: normal;">
                            可用於抵擋騙子卡傷害，幫助其他玩家
                        </div>
                    </button>

                    <!-- Tip card option -->
                    <button id="goodCitizenTipBtn"
                            style="background: linear-gradient(135deg, #9c27b0, #6a1b9a);
                                   color: white; padding: 18px; border: none;
                                   border-radius: 14px; cursor: pointer;
                                   font-size: 15px; font-weight: bold;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 4px 12px rgba(156,39,176,0.3);
                                   text-align: left;">
                        <div style="font-size: 18px; margin-bottom: 6px;">
                            🎁 抽取 1 張錦囊卡
                        </div>
                        <div style="font-size: 11px; opacity: 0.9; font-weight: normal;">
                            立即抽取一張錦囊卡並自動執行效果
                        </div>
                    </button>
                </div>

                <div style="text-align: center; font-size: 11px; color: #b8a555;">
                    💡 選擇後立即生效，無法反悔
                </div>
            </div>
        `;
    }

    static bindButtons(onVolunteer, onTipCard) {
        const volunteerBtn = document.getElementById('goodCitizenVolunteerBtn');
        const tipBtn       = document.getElementById('goodCitizenTipBtn');

        if (volunteerBtn) {
            volunteerBtn.onclick = () => onVolunteer();
            volunteerBtn.onmouseenter = () => {
                volunteerBtn.style.transform = 'scale(1.03)';
                volunteerBtn.style.boxShadow = '0 6px 20px rgba(76,175,80,0.5)';
            };
            volunteerBtn.onmouseleave = () => {
                volunteerBtn.style.transform = 'scale(1)';
                volunteerBtn.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)';
            };
        }

        if (tipBtn) {
            tipBtn.onclick = () => onTipCard();
            tipBtn.onmouseenter = () => {
                tipBtn.style.transform = 'scale(1.03)';
                tipBtn.style.boxShadow = '0 6px 20px rgba(156,39,176,0.5)';
            };
            tipBtn.onmouseleave = () => {
                tipBtn.style.transform = 'scale(1)';
                tipBtn.style.boxShadow = '0 4px 12px rgba(156,39,176,0.3)';
            };
        }
    }
}