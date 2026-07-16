"use strict";

export class PoliceMoveTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 500px;
                 background: linear-gradient(135deg, #1a3a2b, #0d2b1a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #4caf50;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #81c784; font-weight: bold;">
                        👮 警察卡 - 移動玩家
                    </div>
                    <div id="policeMoveHint"
                         style="font-size: 12px; color: #a5d6a7; margin-top: 4px;">
                    </div>
                </div>

                <div style="background: rgba(76,175,80,0.15); padding: 12px;
                            border-radius: 12px; margin-bottom: 14px; text-align: center;">
                    <div style="color: #fff; font-size: 14px;">選擇要移動的玩家</div>
                </div>

                <div id="policeMovePlayerList"
                     style="display: flex; flex-direction: column; gap: 10px;
                            margin-bottom: 16px;">
                </div>

                <div id="policeMoveDirectionArea"
                     style="display: none; background: rgba(0,0,0,0.3);
                            padding: 14px; border-radius: 12px; margin-bottom: 16px;">
                    <div style="text-align: center; color: #ffd966;
                                font-size: 14px; margin-bottom: 10px;"
                         id="policeMoveSelectedText">
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button id="policeMoveBackwardBtn"
                                style="flex: 1; background: #f44336; color: white;
                                       padding: 12px; border: none; border-radius: 24px;
                                       cursor: pointer; font-size: 14px; font-weight: bold;
                                       transition: all 0.2s ease;">
                            ⬅️ 向後 3 格
                        </button>
                        <button id="policeMoveForwardBtn"
                                style="flex: 1; background: #4caf50; color: white;
                                       padding: 12px; border: none; border-radius: 24px;
                                       cursor: pointer; font-size: 14px; font-weight: bold;
                                       transition: all 0.2s ease;">
                            ➡️ 向前 3 格
                        </button>
                    </div>
                </div>

                <div style="text-align: center;">
                    <button id="policeMoveCancelBtn"
                            style="background: #9e9e9e; color: white; padding: 10px 30px;
                                   border: none; border-radius: 24px; cursor: pointer;
                                   font-size: 14px;">
                        取消
                    </button>
                </div>
            </div>
        `;
    }

    static populate(message, escapeHtml) {
        const hintEl = document.getElementById('policeMoveHint');
        if (hintEl) {
            hintEl.textContent = `選擇玩家並決定移動方向 (${message.steps} 格)`;
        }

        const listEl = document.getElementById('policeMovePlayerList');
        if (!listEl) return;
        listEl.innerHTML = '';

        if (message.otherPlayers.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; color: #90a4ae; padding: 20px;">
                    無其他玩家可以移動
                </div>
            `;
            return;
        }

        message.otherPlayers.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'police-move-player-btn';
            btn.dataset.playerId = p.playerId;
            btn.dataset.playerName = p.playerName;

            const layerLabel = p.inFlow ? '順流層' : p.inReverse ? '逆流層' : '平流層';
            const layerColor = p.inFlow ? '#4fc3f7' : p.inReverse ? '#ff5252' : '#ffb74d';

            btn.style.cssText = `
                background: linear-gradient(135deg, #2a3a4a, #1a2a3a);
                color: white; padding: 12px; border: 2px solid #4caf50;
                border-radius: 12px; cursor: pointer; font-size: 14px;
                transition: all 0.2s ease;
                display: flex; justify-content: space-between; align-items: center;
            `;
            btn.innerHTML = `
                <span>👤 ${escapeHtml(p.playerName)}</span>
                <span style="font-size: 11px; color: ${layerColor};">📍 ${layerLabel}</span>
            `;

            listEl.appendChild(btn);
        });
    }

    static bindPlayerSelect(onSelectPlayer) {
        document.querySelectorAll('.police-move-player-btn').forEach(btn => {
            btn.onclick = () => {
                // Visual selection
                document.querySelectorAll('.police-move-player-btn').forEach(b => {
                    b.style.background = 'linear-gradient(135deg, #2a3a4a, #1a2a3a)';
                    b.style.borderColor = '#4caf50';
                });
                btn.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
                btn.style.borderColor = '#81c784';

                onSelectPlayer(btn.dataset.playerId, btn.dataset.playerName);
            };
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.02)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        });
    }

    static showDirectionButtons(playerName, onDirection) {
        const area = document.getElementById('policeMoveDirectionArea');
        const text = document.getElementById('policeMoveSelectedText');

        if (area) area.style.display = 'block';
        if (text) text.textContent = `已選擇: ${playerName}`;

        const forwardBtn  = document.getElementById('policeMoveForwardBtn');
        const backwardBtn = document.getElementById('policeMoveBackwardBtn');

        if (forwardBtn) {
            forwardBtn.onclick = () => onDirection('forward');
            forwardBtn.onmouseenter = () => { forwardBtn.style.transform = 'scale(1.03)'; };
            forwardBtn.onmouseleave = () => { forwardBtn.style.transform = 'scale(1)'; };
        }

        if (backwardBtn) {
            backwardBtn.onclick = () => onDirection('backward');
            backwardBtn.onmouseenter = () => { backwardBtn.style.transform = 'scale(1.03)'; };
            backwardBtn.onmouseleave = () => { backwardBtn.style.transform = 'scale(1)'; };
        }
    }

    static bindCancel(onCancel) {
        const btn = document.getElementById('policeMoveCancelBtn');
        if (btn) {
            btn.onclick = () => onCancel();
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.02)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        }
    }
}