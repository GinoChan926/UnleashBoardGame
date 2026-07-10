"use strict";

/**
 * Renders the sidebar players list only.
 */
export class PlayersListRenderer {
    constructor(escapeHtml) {
        // accept escapeHtml as a dependency so this class has no
        // reference to the full GameClient
        this._escape = escapeHtml;
    }

    render(myState, otherPlayers) {
        const list = document.getElementById('playersList');
        if (!list) return;
        list.innerHTML = '';

        if (myState) {
            list.appendChild(this._buildItem(myState, true, 0));
        }

        let idx = 1;
        otherPlayers.forEach((state) => {
            list.appendChild(this._buildItem(state, false, idx++));
        });
    }

    // ── Private ───────────────────────────────────────────────────────────

    _buildItem(state, isMe, index) {
        const avatarPath = state.avatar
            ? `../cards/players/${state.avatar}`
            : `../cards/players/player${isMe ? 1 : 2}.png`;

        const label = isMe
            ? `<strong>👤 ${this._escape(state.playerName)} (你)</strong>`
            : `<strong>👤 ${this._escape(state.playerName)}</strong>`;

        const item = document.createElement('div');
        item.className = 'player-item';
        if (!isMe) item.dataset.playerIndex = index;

        item.innerHTML = `
            ${label}<br>
            <img src="${avatarPath}"
                 style="width:24px;height:24px;border-radius:50%;vertical-align:middle;"
                 onerror="this.style.display='none';">
            💰 ${state.cash.toLocaleString()} 元 | ⚡ ${state.energy}/${state.maxEnergy}<br>
            🍀 四葉草: ${state.fourLeafClover || 0} | ⭐ 幸運星: ${state.luckyStarCount || 0}
        `;
        return item;
    }
}