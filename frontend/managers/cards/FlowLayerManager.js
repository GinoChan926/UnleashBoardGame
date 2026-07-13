"use strict";

import { BaseCardManager }    from './BaseCardManager.js';
import { FlowLayerTemplate }  from './templates/FlowLayerTemplate.js';

export class FlowLayerManager extends BaseCardManager {
    constructor(modalManager, gameClient) {
        super(modalManager, gameClient);
        this._ensureModal();
    }

    showFlowLayerChoiceModal(message) {
        this._ensureModal();

        const body = document.getElementById('flowLayerChoiceBody');
        if (!body) return;

        // Inject body content from template
        body.innerHTML = FlowLayerTemplate.buildBody(message);

        // Open modal
        this.modalManager.openModal('flowLayerChoiceModal');

        // Bind events - pure logic callbacks, no HTML
        FlowLayerTemplate.bindEvents(
            // On enter flow layer
            () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'flow_layer_choice', willEnter: true });
                }
                this.modalManager.closeModal('flowLayerChoiceModal');
                this.ui.addLog('🎉 你選擇進入順流層！', 'success');
            },

            // On stay in streamline
            () => {
                if (this.ws && this.ws.isReady()) {
                    this.ws.send({ type: 'flow_layer_choice', willEnter: false });
                }
                this.modalManager.closeModal('flowLayerChoiceModal');
                this.ui.addLog('📌 你選擇暫時留在平流層', 'info');
            }
        );
    }

    // ── Private ───────────────────────────────────────────────────────────

    _ensureModal() {
        if (!document.getElementById('flowLayerChoiceModal')) {
            this.modalManager.createModal(
                'flowLayerChoiceModal',
                FlowLayerTemplate.buildModal()
            );
        }
    }
}