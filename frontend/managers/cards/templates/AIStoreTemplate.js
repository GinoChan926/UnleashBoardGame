"use strict";

export class AIStoreTemplate {

    static buildPickModal() {
        return `
            <div class="modal-content" style="max-width: 700px;
                 background: linear-gradient(135deg, #1a2a3a, #0d1b2a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #ff9800;">

                <div class="modal-title" style="text-align: center;
                     color: #ff9800; font-size: 22px; margin-bottom: 12px;">
                    🏪 AI無人便利店 - 選卡
                </div>

                <div id="aiStoreMessage" style="text-align: center;
                     color: #ffd966; font-size: 14px; margin-bottom: 16px;">
                </div>

                <div id="aiStoreCards" style="display: grid;
                     grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                     gap: 12px; max-height: 60vh; overflow-y: auto; padding: 8px;">
                </div>
            </div>
        `;
    }

    static buildCardTile(cardEntry, escapeHtml) {
        const div = document.createElement('div');
        const { index, taken, card } = cardEntry;

        if (taken) {
            div.style.cssText = `
                background: rgba(0,0,0,0.5); border-radius: 12px;
                padding: 12px; text-align: center; opacity: 0.4;
                border: 2px dashed #555;
            `;
            div.innerHTML = `
                <div style="font-size: 40px;">🚫</div>
                <div style="color: #888; font-size: 12px; margin-top: 6px;">已被選取</div>
            `;
            return div;
        }

        div.style.cssText = `
            background: linear-gradient(135deg, #2a3a4a, #1a2a3a);
            border-radius: 12px; padding: 12px; text-align: center;
            cursor: pointer; transition: all 0.2s ease;
            border: 2px solid #ff9800;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        div.dataset.cardIndex = index;

        let imageUrl = card.image || '';
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = '/' + imageUrl;
        }

        div.innerHTML = `
            <img src="${imageUrl}"
                 style="width: 100%; height: 100px; object-fit: contain;
                        border-radius: 8px; background: rgba(0,0,0,0.3);"
                 onerror="this.style.display='none';">
            <div style="color: #ffd966; font-size: 13px; font-weight: bold;
                        margin-top: 8px;">
                ${escapeHtml(card.name)}
            </div>
            <div style="color: #b0bec5; font-size: 10px; margin-top: 4px;
                        max-height: 40px; overflow: hidden;">
                ${escapeHtml((card.description || '').substring(0, 50))}
            </div>
        `;

        div.onmouseenter = () => {
            div.style.transform = 'scale(1.04)';
            div.style.boxShadow = '0 6px 20px rgba(255,152,0,0.4)';
        };
        div.onmouseleave = () => {
            div.style.transform = 'scale(1)';
            div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        };

        return div;
    }

    static populateGrid(container, availableCards, escapeHtml, onPick) {
        if (!container) return;
        container.innerHTML = '';

        availableCards.forEach(entry => {
            const tile = this.buildCardTile(entry, escapeHtml);
            if (!entry.taken) {
                tile.onclick = () => onPick(entry.index);
            }
            container.appendChild(tile);
        });
    }
}