/**
 * Presentation: StencilController
 * Handles stencil panel and element palette
 */

class StencilController {
    constructor(app, notationService) {
        this.app = app;
        this.notationService = notationService;
        this.currentNotation = 'vad';
        this.init();
    }

    init() {
        this.stencilContainer = document.getElementById('stencil-container');
        this.notationSelect = document.getElementById('notation-select');

        // Handle panel tabs
        this.setupPanelTabs();

        // Handle notation selection
        this.notationSelect.addEventListener('change', (e) => {
            this.currentNotation = e.target.value;
            this.loadStencils(this.currentNotation);
        });

        // Load initial stencils
        this.loadStencils(this.currentNotation);
    }

    setupPanelTabs() {
        const tabs = document.querySelectorAll('.panel-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const panelName = tab.getAttribute('data-panel');
                this.switchPanel(panelName);
            });
        });
    }

    switchPanel(panelName) {
        // Update tabs
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-panel="${panelName}"]`)?.classList.add('active');

        // Update panels
        document.querySelectorAll('.panel-content').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${panelName}-panel`)?.classList.add('active');
    }

    loadStencils(notationType) {
        const stencils = this.notationService.getStencils(notationType);

        if (stencils.length === 0) {
            this.stencilContainer.innerHTML = '<p style="padding: 10px; color: #999;">Трафареты не найдены</p>';
            return;
        }

        let html = '';
        stencils.forEach(stencil => {
            html += `
                <div class="stencil-item" data-stencil-id="${stencil.id}" data-notation="${notationType}">
                    <div class="stencil-icon" style="background-color: ${stencil.config.fillColor}; border: 1px solid ${stencil.config.strokeColor};"></div>
                    <div class="stencil-label">${stencil.name}</div>
                </div>
            `;
        });

        this.stencilContainer.innerHTML = html;

        // Attach drag handlers
        this.attachStencilHandlers();
    }

    attachStencilHandlers() {
        const stencilItems = this.stencilContainer.querySelectorAll('.stencil-item');

        stencilItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const stencilId = item.getAttribute('data-stencil-id');
                const notation = item.getAttribute('data-notation');
                e.dataTransfer.setData('stencilId', stencilId);
                e.dataTransfer.setData('notation', notation);
            });

            item.addEventListener('click', () => {
                const stencilId = item.getAttribute('data-stencil-id');
                const notation = item.getAttribute('data-notation');
                this.app.addElementToCanvas(notation, stencilId);
            });
        });
    }
}
