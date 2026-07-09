"use strict";

export class LogManager {
    constructor(modalManager) {
        this.modalManager = modalManager;
        this.setupNotificationContainer();
    }

    setupNotificationContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 350px;
            `;
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info') {
        this.modalManager.showNotification(message, type);
    }

    addLog(msg, type = 'default') {
        const logDiv = document.getElementById('logContainer');
        if (!logDiv) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;

        const timestamp = new Date().toLocaleTimeString();
        entry.innerText = `[${timestamp}] ${msg}`;

        if (type === 'success')      entry.style.color = '#4caf50';
        else if (type === 'error')   entry.style.color = '#ff6b6b';
        else if (type === 'event')   entry.style.color = '#ffb347';
        else if (type === 'warning') entry.style.color = '#ff9800';

        logDiv.appendChild(entry);
        logDiv.scrollTop = logDiv.scrollHeight;

        // Keep log entries manageable
        while (logDiv.children.length > 80) {
            logDiv.removeChild(logDiv.firstChild);
        }
    }
}