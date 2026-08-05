"use strict";

export class TipCardPickTemplate {

    static buildPickModal() {
        return `
            <div class="modal-content" style="max-width: 750px;
                 background: linear-gradient(135deg, #4a2a5a, #2a1a3a);
                 border-radius: 24px; padding: 24px;
                 border: 2px solid #9c27b0;">

                <div class="modal-title" style="text-align: center;
                     color: #ce93d8; font-size: 22px; margin-bottom: 8px;">
                    🎁 錦囊卡 - 抽選
                </div>

                <div id="tipCardMessage" style="text-align: center;
                     color: #e1bee7; font-size: 14px; margin-bottom: 16px;">
                </div>

                <div style="background: rgba(0,0,0,0.3); padding: 10px;
                     border-radius: 10px; margin-bottom: 14px; text-align: center;">
                    <span style="color: #ffd966; font-size: 13px;" id="tipCardProgress">
                    </span>
                </div>

                <div id="tipCardGrid" style="display: grid;
                     grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                     gap: 14px; max-height: 55vh; overflow-y: auto; padding: 8px;">
                </div>

                <div class="modal-buttons" style="justify-content: center;
                     margin-top: 16px;">
                    <button id="tipCardCancelBtn"
                            style="background: #9e9e9e; color: white;
                                   padding: 10px 30px; border: none;
                                   border-radius: 30px; cursor: pointer;
                                   font-size: 14px; transition: all 0.2s ease;">
                        放棄選取
                    </button>
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
            padding: 14px; text-align: center; opacity: 0.3;
            border: 2px dashed #666; min-height: 200px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
        `;
            div.innerHTML = `
            <div style="font-size: 48px;">✅</div>
            <div style="color: #888; font-size: 12px; margin-top: 8px;">已選取</div>
        `;
            return div;
        }

        div.style.cssText = `
        background: linear-gradient(135deg, #5a3a6a, #3a2a4a);
        border-radius: 12px; padding: 14px; text-align: center;
        cursor: pointer; transition: all 0.2s ease;
        border: 2px solid #ba68c8;
        box-shadow: 0 4px 12px rgba(156,39,176,0.3);
    `;
        div.dataset.cardIndex = index;

        // ✅ Fix path resolution
        let imageUrl = card.image || '';
        imageUrl = imageUrl.replace(/^(\.\.\/)+/, '/');
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = '/' + imageUrl;
        }

        const scopeBadge = card.scope === 'team'
            ? '<span style="display:inline-block; padding:2px 8px;' +
            ' background:#ff9800; color:white; border-radius:10px;' +
            ' font-size:10px; margin-top:6px;">🌟 團隊</span>'
            : '';

        div.innerHTML = `
        <img src="${imageUrl}"
             style="width:100%; height:110px; object-fit:contain;
                    border-radius:8px; background:rgba(0,0,0,0.3);"
             onerror="this.src='data:image/svg+xml,\
<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'>\
<rect width=\\'100\\' height=\\'100\\' fill=\\'%239c27b0\\'/>\
<text x=\\'50\\' y=\\'55\\' text-anchor=\\'middle\\' fill=\\'white\\' font-size=\\'30\\'>🎁</text>\
</svg>'">
        <div style="color:#ffd966; font-size:14px; font-weight:bold;
                    margin-top:8px;">
            ${escapeHtml(card.name)}
        </div>
        <div style="color:#e1bee7; font-size:11px; margin-top:6px;
                    line-height:1.4; max-height:45px; overflow:hidden;">
            ${escapeHtml((card.description || '').substring(0, 70))}
        </div>
        ${scopeBadge}
    `;

        div.onmouseenter = () => {
            div.style.transform   = 'scale(1.04)';
            div.style.boxShadow   = '0 8px 24px rgba(156,39,176,0.5)';
            div.style.borderColor = '#e91e63';
        };
        div.onmouseleave = () => {
            div.style.transform   = 'scale(1)';
            div.style.boxShadow   = '0 4px 12px rgba(156,39,176,0.3)';
            div.style.borderColor = '#ba68c8';
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

    static bindCancel(onCancel) {
        const btn = document.getElementById('tipCardCancelBtn');
        if (btn) {
            btn.onclick = () => onCancel();
            btn.onmouseenter = () => { btn.style.transform = 'scale(1.03)'; };
            btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        }
    }

    static updateProgress(remainingCount) {
        const el = document.getElementById('tipCardProgress');
        if (el) {
            el.innerHTML = `📌 還需選 <strong style="color: #ff9800;">${remainingCount}</strong> 張`;
        }
    }
}