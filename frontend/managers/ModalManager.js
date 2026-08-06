import { UI_CONFIG } from '../constants/UIConfig.js';

export class ModalManager {
    constructor() {
        this.modals = new Map();
        this.waitingForAction = false;

        this.minimizedStack = [];
        this.minimizeExcludeIds = new Set([
            'professionModal',
        ]);

        this.setupNotificationContainer();
        this.setupModalStyles();
        this.setupMinimizeUI();
    }

    setupNotificationContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 350px;`;
            document.body.appendChild(container);
        }
    }

    // ==================== Minimize UI ====================

    setupMinimizeUI() {
        // ✅ Floating "restore" button container (bottom-right)
        if (!document.getElementById('minimizedModalDock')) {
            const dock = document.createElement('div');
            dock.id = 'minimizedModalDock';
            dock.style.cssText = `
                position: fixed;
                left: 20px;
                top: 20px;
                z-index: 9998;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(dock);
        }
    }

    /**
     * ✅ Minimize a modal — hides it and adds a floating restore button.
     */
    minimizeModal(id) {
        const modal = this.getModal(id);
        if (!modal) return;
        if (this.minimizeExcludeIds.has(id)) return;

        // Already minimized?
        if (this.minimizedStack.some(m => m.id === id)) return;

        // Snapshot: just hide the modal — DOM stays intact, so all state is preserved
        modal.classList.remove('show');
        modal.classList.add('minimized');
        this.waitingForAction = false;

        // Try to extract a title/label from the modal for the restore button
        const label = this._extractModalLabel(modal);
        const icon  = this._extractModalIcon(modal);

        this.minimizedStack.push({ id, label, icon });
        this._renderMinimizedDock();
        this._notifyChange();
    }

    /**
     * ✅ Restore a minimized modal.
     */
    restoreModal(id) {
        const idx = this.minimizedStack.findIndex(m => m.id === id);
        if (idx === -1) return;

        this.minimizedStack.splice(idx, 1);

        const modal = this.getModal(id);
        if (modal) {
            modal.classList.remove('minimized');
            modal.classList.add('show');
            this.waitingForAction = true;
        }

        this._renderMinimizedDock();
        this._notifyChange();
    }

    /**
     * ✅ Remove from minimized stack without restoring (e.g. server auto-closed).
     */
    dismissMinimized(id) {
        const idx = this.minimizedStack.findIndex(m => m.id === id);
        if (idx === -1) return;
        this.minimizedStack.splice(idx, 1);
        this._renderMinimizedDock();
        this._notifyChange();
    }

    /**
     * ✅ Check if there are any pending minimized modals (used to block end turn).
     */
    hasMinimizedModals() {
        return this.minimizedStack.length > 0;
    }

    getMinimizedCount() {
        return this.minimizedStack.length;
    }

    _renderMinimizedDock() {
        const dock = document.getElementById('minimizedModalDock');
        if (!dock) return;

        dock.innerHTML = '';

        this.minimizedStack.forEach(({ id, label, icon }) => {
            const btn = document.createElement('button');
            btn.style.cssText = `
                background: linear-gradient(135deg, #ff9800, #f57c00);
                color: white;
                padding: 12px 20px;
                border: 2px solid #ffd966;
                border-radius: 30px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 4px 16px rgba(255,152,0,0.6);
                pointer-events: auto;
                animation: minimizedPulse 1.5s ease infinite;
                display: flex; align-items: center; gap: 8px;
                white-space: nowrap;
                max-width: 300px;
                overflow: hidden;
                text-overflow: ellipsis;
            `;

            btn.innerHTML = `
                <span style="font-size: 18px;">${icon}</span>
                <span style="overflow: hidden; text-overflow: ellipsis;">
                    ${label}
                </span>
                <span style="font-size: 11px; opacity: 0.8; margin-left: 4px;">
                    點擊繼續
                </span>
            `;

            btn.onclick = () => this.restoreModal(id);

            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = '0 6px 20px rgba(255,152,0,0.8)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 4px 16px rgba(255,152,0,0.6)';
            };

            dock.appendChild(btn);
        });
    }

    _extractModalLabel(modal) {
        // Try common title selectors
        const titleEl = modal.querySelector('.modal-title')
            || modal.querySelector('[style*="font-size: 22px"][style*="font-weight: bold"]')
            || modal.querySelector('[style*="font-size: 24px"][style*="font-weight: bold"]');

        if (titleEl) {
            const text = titleEl.textContent.trim().substring(0, 40);
            return text || '待處理決定';
        }

        return '待處理決定';
    }

    _extractModalIcon(modal) {
        // Try to grab the first emoji-looking character from the title
        const titleEl = modal.querySelector('.modal-title')
            || modal.querySelector('[style*="font-weight: bold"]');
        if (titleEl) {
            const text = titleEl.textContent.trim();
            // Grab first character/emoji (rough — works for most single emojis)
            const match = text.match(/^([\p{Emoji}]+)/u);
            if (match) return match[1];
        }
        return '📋';
    }

    /**
     * ✅ Inject a minimize button into a modal's DOM.
     * Called automatically on openModal.
     */
    _injectMinimizeButton(modal, id) {
        if (this.minimizeExcludeIds.has(id)) return;
        if (modal.querySelector('.modal-minimize-btn')) return;   // already injected

        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;

        // Make sure content has relative positioning
        const cs = window.getComputedStyle(modalContent);
        if (cs.position === 'static') {
            modalContent.style.position = 'relative';
        }

        const btn = document.createElement('button');
        btn.className = 'modal-minimize-btn';
        btn.title = '暫時關閉（稍後處理）';
        btn.innerHTML = '🔽';
        btn.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 50%;
            background: rgba(255, 152, 0, 0.9);
            color: white;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 10;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;

        btn.onmouseenter = () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.background = 'rgba(255, 152, 0, 1)';
        };
        btn.onmouseleave = () => {
            btn.style.transform = 'scale(1)';
            btn.style.background = 'rgba(255, 152, 0, 0.9)';
        };

        btn.onclick = (e) => {
            e.stopPropagation();
            this.minimizeModal(id);
        };

        modalContent.appendChild(btn);
    }

    _notifyChange() {
        // Trigger button refresh via global client
        if (window.gameClient?.buttonState) {
            window.gameClient.buttonState.refresh(window.gameClient.gameState);
        }
    }

    // ==================== Notifications ====================

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const colors = {
            success: '#4caf50',
            error:   '#f44336',
            info:    '#2196f3',
            warning: '#ff9800'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
            font-size: 14px;
            cursor: pointer;
            transition: opacity 0.5s ease;
        `;
        notification.textContent = message;

        notification.onclick = () => notification.remove();
        container.appendChild(notification);

        // ✅ Use UI_CONFIG
        const duration = UI_CONFIG.notifications[type]
            || UI_CONFIG.notifications.default;
        const fadeOut  = UI_CONFIG.modalFadeOutMs;

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), fadeOut);
        }, duration);
    }

    // ==================== Modal lifecycle ====================

    createModal(id, html) {
        let modal = document.getElementById(id);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = id;
            modal.className = 'modal';
            modal.innerHTML = html;
            document.body.appendChild(modal);
            this.modals.set(id, modal);
        } else {
            // ✅ If modal exists but was minimized, refresh its content
            modal.innerHTML = html;
        }
        return modal;
    }

    openModal(id) {
        const modal = this.getModal(id);
        if (modal) {
            modal.classList.remove('minimized');
            modal.classList.add('show');
            this.waitingForAction = true;

            // ✅ Inject minimize button
            this._injectMinimizeButton(modal, id);
        }
        return modal;
    }

    closeModal(id) {
        const modal = this.getModal(id);
        if (modal) {
            modal.classList.remove('show');
            modal.classList.remove('minimized');
            this.waitingForAction = false;

            // ✅ If it was minimized, also remove from stack
            this.dismissMinimized(id);
        }
        return modal;
    }

    getModal(id) {
        return this.modals.get(id) || document.getElementById(id);
    }

    setupModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes minimizedPulse {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 4px 16px rgba(255,152,0,0.6);
                }
                50% {
                    transform: scale(1.03);
                    box-shadow: 0 6px 24px rgba(255,152,0,0.9),
                                0 0 0 4px rgba(255,152,0,0.2);
                }
            }
            .modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; }
            .modal.show { display: flex; }
            .modal.minimized { display: none !important; }
            .modal-content { background: linear-gradient(135deg, #1a2a3a, #0d1b2a); border-radius: 28px; padding: 24px; max-width: 800px; width: 90%; max-height: 85vh; overflow-y: auto; }
        `;
        document.head.appendChild(style);
    }

    // ==================== Profession modal (unchanged) ====================

    showProfessionModal(professions, gameClient) {
        const modalHtml = `
            <div class="modal-content" style="max-width: 800px; background: linear-gradient(135deg, #1a2a3a, #0d1b2a); border-radius: 28px;">
                <div class="modal-title" style="text-align: center; color: #ffd966; font-size: 26px; margin-bottom: 20px;">🎭 選擇你的職業</div>
                <div class="modal-body" id="professionBody" style="text-align: center;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; padding: 16px;" id="professionButtons"></div>
                </div>
                <div class="modal-buttons" style="justify-content: center; margin: 10px 0 5px 0;">
                    <button class="btn-secondary" id="cancelProfessionBtn" style="background: #9e9e9e; padding: 10px 32px; border-radius: 30px; cursor: pointer;">取消</button>
                </div>
            </div>
        `;

        this.createModal('professionModal', modalHtml);

        const modal = this.getModal('professionModal');
        const buttonsContainer = document.getElementById('professionButtons');
        const cancelBtn = document.getElementById('cancelProfessionBtn');

        if (!modal || !buttonsContainer) return;

        buttonsContainer.innerHTML = '';

        for (const [id, prof] of Object.entries(professions)) {
            const card = document.createElement('div');
            card.style.cssText = `
                cursor: pointer;
                transition: all 0.3s ease;
                background: linear-gradient(135deg, #2a3a2a, #1a2a1a);
                border-radius: 20px;
                padding: 16px;
                text-align: left;
                border: 2px solid #ffb347;
                box-shadow: 0 6px 14px rgba(0,0,0,0.3);
            `;

            const monthlyCF = prof.salary + prof.sideIncome - (prof.livingExpense + prof.tax);
            card.innerHTML = `
                <div style="font-size: 18px; font-weight: bold; color: #ffd966; margin-bottom: 12px;">${prof.name}</div>
                <div style="color: #ffd966; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                    <div>💰 起始現金: ${prof.cash.toLocaleString()}</div>
                    <div>💼 月薪: ${prof.salary.toLocaleString()}</div>
                    <div>💪 副業: ${prof.sideIncome.toLocaleString()}</div>
                    <div>⚡ 精力: ${prof.energy}/${prof.maxEnergy}</div>
                    <div>🏠 生活支出: ${prof.livingExpense.toLocaleString()}</div>
                    <div>📑 稅務: ${prof.tax.toLocaleString()}</div>
                    <div>🔄 月現金流: ${monthlyCF >= 0 ? '+' : ''}${monthlyCF.toLocaleString()}</div>
                </div>
            `;

            card.onclick = () => {
                gameClient.selectedProfession = { id, data: prof };
                gameClient.doConnect();
                this.closeModal('professionModal');
            };

            buttonsContainer.appendChild(card);
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => this.closeModal('professionModal');
        }

        this.openModal('professionModal');
    }
}