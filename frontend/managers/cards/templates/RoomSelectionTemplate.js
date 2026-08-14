"use strict";

const MAX_PLAYERS = 8;

export class RoomSelectionTemplate {

    static buildModal() {
        return `
            <div class="modal-content" style="max-width: 640px;
                 background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #4fc3f7;
                 max-height: 85vh; overflow-y: auto;">

                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; color: #4fc3f7; font-weight: bold;">
                        🏠 選擇房間
                    </div>
                    <div style="font-size: 12px; color: #b3e5fc; margin-top: 4px;">
                        加入已有房間或創建新房間 (最多 ${MAX_PLAYERS} 人/房間)
                    </div>
                </div>
                <div style="text-align: center; margin-bottom: 10px; font-weight: bold;  color: #b3e5fc; font-size: 14px;">
                    玩家名稱
                </div>
                <input type="text" id="playerName"
                    placeholder="輸入玩家名稱 (將用於顯示)"
                    maxlength="20"
                    style="width: 100%; padding: 10px; margin-bottom: 10px;
                        border-radius: 8px; border: 2px solid #4caf50;
                        background: rgba(0,0,0,0.5); color: #fff;
                        font-size: 14px; text-align: center;
                        box-sizing: border-box;">                

                <!-- Available Rooms Section -->
                <div style="background: rgba(66,165,245,0.1); padding: 14px;
                            border-radius: 12px; margin-bottom: 16px;
                            border: 1px solid rgba(66,165,245,0.3);">
                    <div style="color: #4fc3f7; font-weight: bold;
                                margin-bottom: 10px; font-size: 14px;">
                        📋 現有房間
                    </div>
                    <div id="roomListContainer"
                         style="max-height: 35vh; overflow-y: auto;">
                        <div style="text-align: center; color: #90a4ae; padding: 20px;">
                            載入中...
                        </div>
                    </div>
                    <button id="refreshRoomsBtn"
                            style="width: 100%; margin-top: 10px;
                                   background: rgba(66,165,245,0.3); color: white;
                                   padding: 8px; border: 1px solid #4fc3f7;
                                   border-radius: 20px; cursor: pointer;
                                   font-size: 12px;">
                        🔄 重新整理
                    </button>
                </div>

                <div style="text-align: center; margin: 16px 0;
                            color: #b3e5fc; font-size: 12px;">
                    ─── 或 ───
                </div>

                <!-- Create/Join Custom Room -->
                <div style="background: rgba(76,175,80,0.1); padding: 14px;
                            border-radius: 12px; margin-bottom: 16px;
                            border: 1px solid rgba(76,175,80,0.3);">
                    <div style="color: #81c784; font-weight: bold;
                                margin-bottom: 10px; font-size: 14px;">
                        ✨ 創建/加入房間 (輸入房間號)
                    </div>

                      <input type="text" id="roomIdInput"
                          placeholder="例如: room1, myroom, ..."
                          maxlength="20"
                          style="width: 100%; padding: 10px;
                              border-radius: 8px; border: 2px solid #4caf50;
                              background: rgba(0,0,0,0.5); color: #fff;
                              font-size: 14px; text-align: center;
                              box-sizing: border-box; margin-bottom: 10px;">
                    <button id="joinCustomRoomBtn"
                            style="width: 100%; background: linear-gradient(135deg, #4caf50, #2e7d32);
                                   color: white; padding: 10px; border: none;
                                   border-radius: 20px; cursor: pointer;
                                   font-size: 14px; font-weight: bold;
                                   box-shadow: 0 4px 12px rgba(76,175,80,0.3);">
                        🚀 加入 / 創建此房間
                    </button>
                </div>

                <div class="modal-buttons" style="justify-content: center; margin-top: 10px;">
                    <button id="cancelRoomSelectionBtn"
                            style="background: #9e9e9e; color: white;
                                   padding: 10px 30px; border: none;
                                   border-radius: 24px; cursor: pointer;
                                   font-size: 13px;">
                        取消
                    </button>
                </div>
            </div>
        `;
    }

    static renderRoomList(rooms, onJoinRoom) {
        const container = document.getElementById('roomListContainer');
        if (!container) return;

        if (!rooms || rooms.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #90a4ae; padding: 20px;">
                    📭 目前沒有房間，請創建一個新的房間
                </div>
            `;
            return;
        }

        container.innerHTML = rooms.map(room => this._buildRoomEntry(room)).join('');

        container.querySelectorAll('.room-entry-btn').forEach(btn => {
            btn.onclick = () => {
                const roomId = btn.dataset.roomId;
                const isFull = btn.dataset.isFull === 'true';
                if (isFull) return;
                const nameInput = document.getElementById('playerName');
                const playerName = nameInput ? nameInput.value.trim() : '';
                onJoinRoom(roomId, playerName);
            };
        });
    }

    static bindEvents(callbacks) {
        const refreshBtn = document.getElementById('refreshRoomsBtn');
        if (refreshBtn) {
            refreshBtn.onclick = () => callbacks.onRefresh();
            refreshBtn.onmouseenter = () => { refreshBtn.style.background = 'rgba(66,165,245,0.5)'; };
            refreshBtn.onmouseleave = () => { refreshBtn.style.background = 'rgba(66,165,245,0.3)'; };
        }

        const joinBtn = document.getElementById('joinCustomRoomBtn');
        const input   = document.getElementById('roomIdInput');
        if (joinBtn && input) {
            const submitCustom = () => {
                const roomId = input.value.trim();
                if (!roomId) {
                    alert('請輸入房間號');
                    return;
                }
                if (!/^[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/.test(roomId)) {
                    alert('房間號只能包含英文字母、數字、中文、_ 和 -');
                    return;
                }
                const nameInput = document.getElementById('playerName');
                const playerName = nameInput ? nameInput.value.trim() : '';
                callbacks.onJoinRoom(roomId, playerName);
            };

            joinBtn.onclick = submitCustom;
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') submitCustom();
            });
        }

        const cancelBtn = document.getElementById('cancelRoomSelectionBtn');
        if (cancelBtn) {
            cancelBtn.onclick = () => callbacks.onCancel();
        }
    }

    // ==================== Private ====================

    static _buildRoomEntry(room) {
        const isFull     = room.isFull || room.playerCount >= (room.maxPlayers || MAX_PLAYERS);
        const bgColor    = isFull ? 'rgba(244,67,54,0.15)' : 'rgba(76,175,80,0.15)';
        const borderCol  = isFull ? '#f44336' : '#4caf50';
        const statusIcon = isFull ? '🔒' : '✅';
        const statusText = isFull ? '已滿' : '可加入';

        const playerNames = (room.players || [])
                .map(p => p.playerName)
                .join(', ')
            || '(空)';

        return `
            <button class="room-entry-btn"
                    data-room-id="${room.roomId}"
                    data-is-full="${isFull}"
                    style="width: 100%; text-align: left;
                           background: ${bgColor};
                           border: 1px solid ${borderCol};
                           border-radius: 10px; padding: 12px;
                           margin-bottom: 8px;
                           cursor: ${isFull ? 'not-allowed' : 'pointer'};
                           opacity: ${isFull ? '0.6' : '1'};
                           transition: all 0.2s ease;
                           color: white;">
                <div style="display: flex; justify-content: space-between;
                            align-items: center; margin-bottom: 4px;">
                    <div style="font-weight: bold; font-size: 14px;">
                        🏠 ${room.roomId}
                    </div>
                    <div style="font-size: 12px;">
                        ${statusIcon} ${statusText}
                        (<strong>${room.playerCount}</strong>/${room.maxPlayers || MAX_PLAYERS})
                    </div>
                </div>
                <div style="font-size: 11px; color: #b0bec5;">
                    👥 ${playerNames}
                </div>
            </button>
        `;
    }
}