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

    async loadStencils(notationType) {
        this.stencilContainer.innerHTML = '<p style="padding: 10px; color: #666;">Загрузка трафаретов...</p>';

        try {
            // Load stencil file from stencils folder
            const stencilPath = `stencils/${notationType}.xml`;
            const response = await fetch(stencilPath);

            if (!response.ok) {
                throw new Error(`Failed to load stencil file: ${stencilPath}`);
            }

            const stencilData = await response.text();

            // Parse stencil library (mxlibrary format is JSON)
            let stencils;
            try {
                stencils = JSON.parse(stencilData);
            } catch (e) {
                // If it's wrapped in <mxlibrary> tags, extract the JSON
                const match = stencilData.match(/<mxlibrary>(.*)<\/mxlibrary>/);
                if (match) {
                    stencils = JSON.parse(match[1]);
                } else {
                    stencils = JSON.parse(stencilData);
                }
            }

            if (!stencils || stencils.length === 0) {
                this.stencilContainer.innerHTML = '<p style="padding: 10px; color: #999;">Трафареты не найдены</p>';
                return;
            }

            let html = '<div class="stencil-grid">';
            stencils.forEach((stencil, index) => {
                const title = stencil.title || `Элемент ${index + 1}`;
                html += `
                    <div class="stencil-item"
                         data-stencil-index="${index}"
                         data-notation="${notationType}"
                         draggable="true"
                         title="${title}">
                        <div class="stencil-preview" style="width: ${Math.min(stencil.w, 80)}px; height: ${Math.min(stencil.h, 60)}px;">
                            <svg width="${stencil.w}" height="${stencil.h}" viewBox="0 0 ${stencil.w} ${stencil.h}"></svg>
                        </div>
                        <div class="stencil-label">${title}</div>
                    </div>
                `;
            });
            html += '</div>';

            this.stencilContainer.innerHTML = html;

            // Store stencil data for drag-and-drop
            this.currentStencils = stencils;

            // Attach drag handlers
            this.attachStencilHandlers();

        } catch (error) {
            console.error('Error loading stencils:', error);
            this.stencilContainer.innerHTML = `<p style="padding: 10px; color: #c00;">Ошибка загрузки трафаретов: ${error.message}</p>`;
        }
    }

    attachStencilHandlers() {
        const stencilItems = this.stencilContainer.querySelectorAll('.stencil-item');

        stencilItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const stencilIndex = item.getAttribute('data-stencil-index');
                const notation = item.getAttribute('data-notation');
                const stencilData = this.currentStencils[stencilIndex];

                e.dataTransfer.setData('stencilIndex', stencilIndex);
                e.dataTransfer.setData('notation', notation);
                e.dataTransfer.setData('stencilXml', stencilData.xml);
                e.dataTransfer.effectAllowed = 'copy';
            });

            item.addEventListener('click', () => {
                const stencilIndex = item.getAttribute('data-stencil-index');
                const notation = item.getAttribute('data-notation');
                const stencilData = this.currentStencils[stencilIndex];
                this.app.addElementFromStencil(notation, stencilData);
            });
        });
    }
}
