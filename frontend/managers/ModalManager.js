export class ModalManager {
    constructor() {
        this.modals = new Map();
        this.waitingForAction = false;
        this.setupNotificationContainer();
        this.setupModalStyles();
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

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const colors = { success: '#4caf50', error: '#f44336', info: '#2196f3', warning: '#ff9800' };
        const notification = document.createElement('div');
        notification.style.cssText = `background: ${colors[type]}; color: white; padding: 12px 20px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease; font-size: 14px; cursor: pointer;`;
        notification.textContent = message;
        notification.onclick = () => notification.remove();
        container.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    createModal(id, html) {
        let modal = document.getElementById(id);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = id;
            modal.className = 'modal';
            modal.innerHTML = html;
            document.body.appendChild(modal);
            this.modals.set(id, modal);
        }
        return modal;
    }

    openModal(id) {
        const modal = this.getModal(id);
        if (modal) {
            modal.classList.add('show');
            this.waitingForAction = true;
        }
        return modal;
    }

    closeModal(id) {
        const modal = this.getModal(id);
        if (modal) {
            modal.classList.remove('show');
            this.waitingForAction = false;
        }
        return modal;
    }

    getModal(id) {
        return this.modals.get(id) || document.getElementById(id);
    }

    setupModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); align-items: center; justify-content: center; }
            .modal.show { display: flex; }
            .modal-content { background: linear-gradient(135deg, #1a2a3a, #0d1b2a); border-radius: 28px; padding: 24px; max-width: 800px; width: 90%; max-height: 85vh; overflow-y: auto; }
        `;
        document.head.appendChild(style);
    }

    showProfessionModal(professions, gameClient) {
        const modalHtml = `
            <div class="modal-content" style="max-width: 800px; background: linear-gradient(135deg, #1a2a3a, #0d1b2a); border-radius: 28px;">
                <div class="modal-title" style="text-align: center; color: #ffd966; font-size: 26px; margin-bottom: 20px;">🎭 选择你的职业</div>
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
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                    <div>💰 起始现金: ${prof.cash.toLocaleString()}</div>
                    <div>💼 月薪: ${prof.salary.toLocaleString()}</div>
                    <div>💪 副业: ${prof.sideIncome.toLocaleString()}</div>
                    <div>⚡ 精力: ${prof.energy}/${prof.maxEnergy}</div>
                    <div>🏠 生活支出: ${prof.livingExpense.toLocaleString()}</div>
                    <div>📑 税务: ${prof.tax.toLocaleString()}</div>
                    <div>🔄 月现金流: ${monthlyCF >= 0 ? '+' : ''}${monthlyCF.toLocaleString()}</div>
                    <div>🍀 幸运值: ${prof.luck}</div>
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