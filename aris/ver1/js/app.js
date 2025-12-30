/**
 * Main Application Bootstrap
 * Initializes and coordinates all application components
 */

class ArisExpressApp {
    constructor() {
        this.currentDiagram = null;
        this.currentModel = null;
        this.undoStack = [];
        this.redoStack = [];

        // Multi-tab support
        this.openDiagrams = [];
        this.activeTabId = null;

        // Initialize infrastructure
        this.storageAdapter = new LocalStorageAdapter();
        this.xmlParser = new DrawioXmlParser();
        this.diagramRepository = new DrawioRepository(this.storageAdapter, this.xmlParser);

        // Initialize services
        this.diagramService = new DiagramService(this.diagramRepository);
        this.notationService = new NotationService();

        // Initialize use cases
        this.createDiagramUseCase = new CreateDiagramUseCase(this.diagramService);
        this.saveDiagramUseCase = new SaveDiagramUseCase(this.diagramService);
        this.loadDiagramUseCase = new LoadDiagramUseCase(this.diagramService);

        // Initialize UI controllers
        this.menuController = new MenuController(this);
        this.toolbarController = new ToolbarController(this);
        this.canvasController = new CanvasController(this);
        this.stencilController = new StencilController(this, this.notationService);
        this.propertiesController = new PropertiesController(this);
        this.helpController = new HelpController(this);

        this.init();
    }

    init() {
        console.log('Initializing ARIS Express Clone...');
        this.setStatus('Готов');

        // Initialize model explorer with examples
        this.initModelExplorer();

        // Initialize tab container reference
        this.tabContainer = document.getElementById('diagram-tabs');

        // Load welcome message or last diagram
        this.showWelcome();
    }

    // ========== Tab Management ==========

    renderTabs() {
        if (!this.tabContainer) return;

        if (this.openDiagrams.length === 0) {
            this.tabContainer.innerHTML = '';
            return;
        }

        const tabsHtml = this.openDiagrams.map(diagram => {
            const isActive = diagram.id === this.activeTabId;
            const icon = this.getNotationIcon(diagram.type);
            return `
                <div class="diagram-tab ${isActive ? 'active' : ''}" data-tab-id="${diagram.id}">
                    <span class="diagram-tab-icon">${icon}</span>
                    <span class="diagram-tab-title">${diagram.name}</span>
                    <span class="diagram-tab-close" data-close-id="${diagram.id}">&times;</span>
                </div>
            `;
        }).join('');

        this.tabContainer.innerHTML = tabsHtml;

        // Attach tab click handlers
        this.tabContainer.querySelectorAll('.diagram-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (!e.target.classList.contains('diagram-tab-close')) {
                    const tabId = tab.getAttribute('data-tab-id');
                    this.switchToTab(tabId);
                }
            });
        });

        // Attach close button handlers
        this.tabContainer.querySelectorAll('.diagram-tab-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tabId = btn.getAttribute('data-close-id');
                this.closeTab(tabId);
            });
        });
    }

    addTab(diagram) {
        // Check if diagram is already open
        const existing = this.openDiagrams.find(d => d.id === diagram.id);
        if (!existing) {
            this.openDiagrams.push(diagram);
        }

        this.activeTabId = diagram.id;
        this.currentDiagram = diagram;
        this.renderTabs();
    }

    switchToTab(tabId) {
        const diagram = this.openDiagrams.find(d => d.id === tabId);
        if (diagram) {
            this.activeTabId = tabId;
            this.currentDiagram = diagram;
            this.canvasController.setDiagram(diagram);
            this.renderTabs();

            // Update notation stencil
            this.setNotationStencil(diagram.type);

            this.setStatus(`Активна диаграмма: ${diagram.name}`);
        }
    }

    closeTab(tabId) {
        const index = this.openDiagrams.findIndex(d => d.id === tabId);
        if (index === -1) return;

        // Remove the diagram from open list
        this.openDiagrams.splice(index, 1);

        // If we're closing the active tab, switch to another
        if (tabId === this.activeTabId) {
            if (this.openDiagrams.length > 0) {
                // Switch to the previous tab or the first one
                const newIndex = Math.min(index, this.openDiagrams.length - 1);
                this.switchToTab(this.openDiagrams[newIndex].id);
            } else {
                // No more tabs open
                this.activeTabId = null;
                this.currentDiagram = null;
                this.canvasController.setDiagram(null);
                this.setStatus('Нет открытых диаграмм');
            }
        }

        this.renderTabs();
    }

    getNotationIcon(type) {
        const icons = {
            'vad': '📊',
            'epc': '🔄',
            'bpmn': '📋',
            'org': '👥'
        };
        return icons[type] || '📄';
    }

    initModelExplorer() {
        const modelTree = document.getElementById('model-tree');
        if (!modelTree) return;

        // Hierarchical structure for examples
        const examplesTree = {
            name: 'Примеры',
            icon: '📁',
            expanded: true,
            children: [
                {
                    name: 'VAD',
                    icon: '📊',
                    expanded: false,
                    children: [
                        { name: 'Управление заказами', file: 'examples/vad_example_1.drawio', type: 'vad', icon: '📄' },
                        { name: 'Производственный цикл', file: 'examples/vad_example_2.drawio', type: 'vad', icon: '📄' }
                    ]
                },
                {
                    name: 'EPC',
                    icon: '🔄',
                    expanded: false,
                    children: [
                        { name: 'Обработка заявки', file: 'examples/epc_example_1.drawio', type: 'epc', icon: '📄' },
                        { name: 'Обработка заказа', file: 'examples/epc_example_2.drawio', type: 'epc', icon: '📄' }
                    ]
                },
                {
                    name: 'BPMN',
                    icon: '📋',
                    expanded: false,
                    children: [
                        { name: 'Простой процесс', file: 'examples/bpmn_example_1.drawio', type: 'bpmn', icon: '📄' },
                        { name: 'Процесс с пулами', file: 'examples/bpmn_example_2.drawio', type: 'bpmn', icon: '📄' }
                    ]
                },
                {
                    name: 'ORG',
                    icon: '👥',
                    expanded: false,
                    children: [
                        { name: 'Структура компании', file: 'examples/org_example_1.drawio', type: 'org', icon: '📄' },
                        { name: 'IT Отдел', file: 'examples/org_example_2.drawio', type: 'org', icon: '📄' }
                    ]
                }
            ]
        };

        // User diagrams section (for newly created diagrams)
        this.userDiagrams = [];

        // Build the tree HTML
        const buildTreeHtml = (node, level = 0) => {
            const indent = level * 15;
            let html = '';

            if (node.children) {
                // Folder node
                const expandIcon = node.expanded ? '▼' : '▶';
                html += `
                    <div class="tree-folder ${node.expanded ? 'expanded' : ''}"
                         data-folder="${node.name}"
                         style="padding-left: ${indent}px;">
                        <span class="tree-expand">${expandIcon}</span>
                        <span class="tree-icon">${node.icon || '📁'}</span>
                        <span class="tree-label">${node.name}</span>
                    </div>
                    <div class="tree-children" style="display: ${node.expanded ? 'block' : 'none'};">
                `;
                node.children.forEach(child => {
                    html += buildTreeHtml(child, level + 1);
                });
                html += '</div>';
            } else if (node.file) {
                // File node
                html += `
                    <div class="tree-item"
                         data-file="${node.file}"
                         data-type="${node.type}"
                         style="padding-left: ${indent}px;">
                        <span class="tree-icon">${node.icon || '📄'}</span>
                        <span class="tree-label">${node.name}</span>
                    </div>
                `;
            }

            return html;
        };

        // Build user diagrams section
        const userDiagramsHtml = `
            <div class="model-tree-section">
                <div class="tree-folder expanded" data-folder="user-diagrams">
                    <span class="tree-expand">▼</span>
                    <span class="tree-icon">📂</span>
                    <span class="tree-label">Мои диаграммы</span>
                </div>
                <div class="tree-children" id="user-diagrams-container">
                    <div class="tree-empty" style="padding: 8px 15px; color: #999; font-size: 12px; font-style: italic;">
                        Нет созданных диаграмм
                    </div>
                </div>
            </div>
        `;

        modelTree.innerHTML = userDiagramsHtml + '<div class="model-tree-section">' + buildTreeHtml(examplesTree) + '</div>';

        // Attach folder toggle handlers
        modelTree.querySelectorAll('.tree-folder').forEach(folder => {
            folder.addEventListener('click', (e) => {
                const children = folder.nextElementSibling;
                const expandIcon = folder.querySelector('.tree-expand');
                if (children && children.classList.contains('tree-children')) {
                    const isExpanded = children.style.display !== 'none';
                    children.style.display = isExpanded ? 'none' : 'block';
                    expandIcon.textContent = isExpanded ? '▶' : '▼';
                    folder.classList.toggle('expanded', !isExpanded);
                }
            });
        });

        // Attach file click handlers
        modelTree.querySelectorAll('.tree-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const file = item.getAttribute('data-file');
                const type = item.getAttribute('data-type');
                if (file) {
                    this.loadExampleDiagram(file, type);

                    // Highlight selected item
                    modelTree.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                }
            });
        });

        // Store examples list for compatibility
        this.examplesList = [
            { name: 'VAD Пример 1 - Управление заказами', file: 'examples/vad_example_1.drawio', type: 'vad' },
            { name: 'VAD Пример 2 - Производственный цикл', file: 'examples/vad_example_2.drawio', type: 'vad' },
            { name: 'EPC Пример 1 - Обработка заявки', file: 'examples/epc_example_1.drawio', type: 'epc' },
            { name: 'EPC Пример 2 - Обработка заказа', file: 'examples/epc_example_2.drawio', type: 'epc' },
            { name: 'BPMN Пример 1 - Простой процесс', file: 'examples/bpmn_example_1.drawio', type: 'bpmn' },
            { name: 'BPMN Пример 2 - Процесс с пулами', file: 'examples/bpmn_example_2.drawio', type: 'bpmn' },
            { name: 'Org Пример 1 - Структура компании', file: 'examples/org_example_1.drawio', type: 'org' },
            { name: 'Org Пример 2 - IT Отдел', file: 'examples/org_example_2.drawio', type: 'org' }
        ];
    }

    addDiagramToExplorer(diagram) {
        const container = document.getElementById('user-diagrams-container');
        if (!container) return;

        // Remove "no diagrams" message if present
        const emptyMsg = container.querySelector('.tree-empty');
        if (emptyMsg) {
            emptyMsg.remove();
        }

        // Check if diagram already exists
        const existing = container.querySelector(`[data-diagram-id="${diagram.id}"]`);
        if (existing) {
            existing.querySelector('.tree-label').textContent = diagram.name;
            return;
        }

        // Add new diagram to tree
        const itemHtml = `
            <div class="tree-item" data-diagram-id="${diagram.id}" data-type="${diagram.type}">
                <span class="tree-icon">${this.getNotationIcon(diagram.type)}</span>
                <span class="tree-label">${diagram.name}</span>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', itemHtml);

        // Attach click handler
        const newItem = container.querySelector(`[data-diagram-id="${diagram.id}"]`);
        if (newItem) {
            newItem.addEventListener('click', (e) => {
                e.stopPropagation();
                this.canvasController.setDiagram(diagram);
                this.currentDiagram = diagram;

                // Highlight selected
                document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
                newItem.classList.add('selected');
            });
        }
    }

    async loadExampleDiagram(filePath, diagramType = null) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load example: ${filePath}`);
            }

            const xml = await response.text();
            this.currentDiagram = this.diagramService.importFromDrawio(xml);
            this.canvasController.setDiagram(this.currentDiagram);

            // Also set raw XML for direct rendering
            this.canvasController.setRawXml(xml);

            // Determine diagram type from file path or provided type
            let notationType = diagramType;
            if (!notationType) {
                // Try to detect type from file path
                if (filePath.includes('vad')) notationType = 'vad';
                else if (filePath.includes('epc')) notationType = 'epc';
                else if (filePath.includes('org')) notationType = 'org';
                else if (filePath.includes('bpmn')) notationType = 'bpmn';
                else notationType = 'vad'; // default
            }

            // Set diagram type
            this.currentDiagram.type = notationType;

            // Auto-select the matching stencil
            this.setNotationStencil(notationType);

            // Add as tab for multi-tab editing
            this.addTab(this.currentDiagram);

            this.setStatus(`Загружен пример: ${this.currentDiagram.name || filePath}`);
        } catch (error) {
            console.error('Error loading example:', error);
            alert('Ошибка при загрузке примера: ' + error.message);
        }
    }

    /**
     * Set the notation stencil to match the diagram type
     */
    setNotationStencil(notationType) {
        const notationSelect = document.getElementById('notation-select');
        if (notationSelect) {
            notationSelect.value = notationType;
            // Trigger change event to load stencils
            notationSelect.dispatchEvent(new Event('change'));
        }
        // Switch to stencils panel
        this.stencilController.switchPanel('stencils');
    }

    showWelcome() {
        console.log('Application ready');
        this.setStatus('Готов к работе. Выберите Файл → Создать или Модель → Новая диаграмма, либо откройте пример из Проводника моделей');
    }

    // ========== File Operations ==========

    createNewDiagram() {
        // Show dialog asking for diagram type
        this.showCreateDiagramDialog();
    }

    showCreateDiagramDialog() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div class="modal-overlay" onclick="app.closeModal()">
                <div class="modal-dialog" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Создать новую диаграмму</h3>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="diagram-name" style="display: block; margin-bottom: 5px; font-weight: 600; color: #333;">Название схемы:</label>
                            <input type="text" id="diagram-name" placeholder="Введите название схемы" style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;" value="Новая схема">
                        </div>
                        <p style="margin-bottom: 15px; color: #666;">Выберите тип диаграммы:</p>
                        <div class="diagram-type-list">
                            <div class="diagram-type-item" onclick="app.selectDiagramType('vad')">
                                <input type="radio" name="diagram-type" value="vad" id="type-vad" checked style="margin-right: 10px;">
                                <span class="type-icon">📊</span>
                                <div class="type-info">
                                    <span class="type-name">VAD - Value Added Chain Diagram</span>
                                    <span class="type-desc">Диаграмма цепочки добавленной стоимости</span>
                                </div>
                            </div>
                            <div class="diagram-type-item" onclick="app.selectDiagramType('epc')">
                                <input type="radio" name="diagram-type" value="epc" id="type-epc" style="margin-right: 10px;">
                                <span class="type-icon">🔄</span>
                                <div class="type-info">
                                    <span class="type-name">EPC - Event-driven Process Chain</span>
                                    <span class="type-desc">Событийная цепочка процессов</span>
                                </div>
                            </div>
                            <div class="diagram-type-item" onclick="app.selectDiagramType('bpmn')">
                                <input type="radio" name="diagram-type" value="bpmn" id="type-bpmn" style="margin-right: 10px;">
                                <span class="type-icon">📋</span>
                                <div class="type-info">
                                    <span class="type-name">BPMN - Business Process Model</span>
                                    <span class="type-desc">Модель бизнес-процессов</span>
                                </div>
                            </div>
                            <div class="diagram-type-item" onclick="app.selectDiagramType('org')">
                                <input type="radio" name="diagram-type" value="org" id="type-org" style="margin-right: 10px;">
                                <span class="type-icon">👥</span>
                                <div class="type-info">
                                    <span class="type-name">ORG - Organizational Chart</span>
                                    <span class="type-desc">Организационная структура</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-top: 20px; text-align: right;">
                            <button class="btn btn-secondary" onclick="app.closeModal()" style="margin-right: 10px;">Отмена</button>
                            <button class="btn btn-primary" onclick="app.createDiagramFromDialog()">Создать</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        modalContainer.style.display = 'block';

        // Focus on name input
        setTimeout(() => {
            const nameInput = document.getElementById('diagram-name');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        }, 100);
    }

    selectDiagramType(type) {
        document.getElementById('type-' + type).checked = true;
    }

    createDiagramFromDialog() {
        const nameInput = document.getElementById('diagram-name');
        const name = nameInput ? nameInput.value.trim() : 'Новая схема';

        const selectedType = document.querySelector('input[name="diagram-type"]:checked');
        const type = selectedType ? selectedType.value : 'vad';

        this.closeModal();
        this.createDiagram(type, name);
    }

    createDiagramOfType(type) {
        this.closeModal();
        this.createDiagram(type);
    }

    createDiagram(type, name = null) {
        try {
            this.currentDiagram = this.createDiagramUseCase.execute(type);

            // Set custom name if provided
            if (name) {
                this.currentDiagram.name = name;
            }

            this.canvasController.setDiagram(this.currentDiagram);

            // Auto-select the matching stencil
            this.setNotationStencil(type);

            // Add to model explorer
            this.addDiagramToExplorer(this.currentDiagram);

            // Add as tab for multi-tab editing
            this.addTab(this.currentDiagram);

            // Update model properties
            if (this.propertiesController) {
                this.propertiesController.showModelProperties(this.currentDiagram);
            }

            this.setStatus(`Создана новая ${type.toUpperCase()} диаграмма: ${this.currentDiagram.name}`);
            console.log('Created diagram:', this.currentDiagram);
        } catch (error) {
            console.error('Error creating diagram:', error);
            alert('Ошибка при создании диаграммы: ' + error.message);
        }
    }

    async saveDiagram() {
        if (!this.currentDiagram) {
            alert('Нет открытой диаграммы для сохранения');
            return;
        }

        try {
            // Use Save As dialog to let user choose location
            const xml = this.diagramService.exportToDrawio(this.currentDiagram);
            const blob = new Blob([xml], { type: 'application/xml' });

            // Use the File System Access API if available, otherwise fallback to download
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: `${this.currentDiagram.name || 'diagram'}.drawio`,
                        types: [{
                            description: 'Draw.io Diagram',
                            accept: { 'application/xml': ['.drawio', '.xml'] }
                        }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();

                    this.currentFilename = handle.name;
                    this.setStatus(`Диаграмма сохранена: ${handle.name}`);

                    // Update model properties with filename
                    if (this.propertiesController) {
                        this.propertiesController.showModelProperties(this.currentDiagram, handle.name);
                    }
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        throw err;
                    }
                }
            } else {
                // Fallback: download file
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${this.currentDiagram.name || 'diagram'}.drawio`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.setStatus(`Диаграмма "${this.currentDiagram.name}" сохранена (загружена)`);
            }
        } catch (error) {
            console.error('Error saving diagram:', error);
            alert('Ошибка при сохранении: ' + error.message);
        }
    }

    saveDiagramAs() {
        if (!this.currentDiagram) {
            alert('Нет открытой диаграммы');
            return;
        }

        const newName = prompt('Введите имя файла для сохранения:', this.currentDiagram.name);
        if (newName) {
            try {
                // Export diagram to DrawIO XML format
                const xml = this.diagramService.exportToDrawio(this.currentDiagram);
                const blob = new Blob([xml], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);

                // Create download link and trigger download
                const a = document.createElement('a');
                a.href = url;
                a.download = `${newName}.drawio`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                URL.revokeObjectURL(url);
                this.setStatus(`Диаграмма сохранена как "${newName}.drawio"`);
            } catch (error) {
                console.error('Error saving diagram:', error);
                alert('Ошибка при сохранении: ' + error.message);
            }
        }
    }

    async openDiagram() {
        // Show example files picker modal
        this.showExampleFilesModal();
    }

    showExampleFilesModal() {
        const examples = this.examplesList || [
            { name: 'VAD Пример 1 - Управление заказами', file: 'examples/vad_example_1.drawio', type: 'vad' },
            { name: 'VAD Пример 2 - Производственный цикл', file: 'examples/vad_example_2.drawio', type: 'vad' },
            { name: 'EPC Пример 1 - Обработка заявки', file: 'examples/epc_example_1.drawio', type: 'epc' },
            { name: 'EPC Пример 2 - Обработка заказа', file: 'examples/epc_example_2.drawio', type: 'epc' },
            { name: 'BPMN Пример 1 - Простой процесс', file: 'examples/bpmn_example_1.drawio', type: 'bpmn' },
            { name: 'BPMN Пример 2 - Процесс с пулами', file: 'examples/bpmn_example_2.drawio', type: 'bpmn' },
            { name: 'Org Пример 1 - Структура компании', file: 'examples/org_example_1.drawio', type: 'org' },
            { name: 'Org Пример 2 - IT Отдел', file: 'examples/org_example_2.drawio', type: 'org' }
        ];

        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div class="modal-overlay" onclick="app.closeModal()">
                <div class="modal-dialog" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Открыть файл - примеры диаграмм</h3>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 15px; color: #666;">Папка: <code>draw-vad/aris/ver1/examples/</code></p>
                        <div class="file-list">
                            ${examples.map((example, i) => `
                                <div class="file-item" onclick="app.selectExampleFile(${i})" data-index="${i}">
                                    <span class="file-icon">${this.getNotationIcon(example.type)}</span>
                                    <span class="file-name">${example.name}</span>
                                    <span class="file-type">${example.type.toUpperCase()}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                            <button class="btn btn-secondary" onclick="app.importDiagram(); app.closeModal();">
                                Открыть другой файл...
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        modalContainer.style.display = 'block';
    }

    getNotationIcon(type) {
        switch(type) {
            case 'vad': return '📊';
            case 'epc': return '🔄';
            case 'bpmn': return '📋';
            case 'org': return '👥';
            default: return '📄';
        }
    }

    selectExampleFile(index) {
        const examples = this.examplesList || [];
        if (index >= 0 && index < examples.length) {
            const example = examples[index];
            this.loadExampleDiagram(example.file, example.type);
            this.closeModal();
        }
    }

    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.style.display = 'none';
        modalContainer.innerHTML = '';
    }

    importDiagram() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.drawio,.xml';

        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const xml = event.target.result;
                    this.currentDiagram = this.diagramService.importFromDrawio(xml);
                    this.canvasController.setDiagram(this.currentDiagram);
                    this.setStatus(`Импортирована диаграмма: ${this.currentDiagram.name}`);
                } catch (error) {
                    console.error('Error importing:', error);
                    alert('Ошибка при импорте: ' + error.message);
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    exportDiagram() {
        if (!this.currentDiagram) {
            alert('Нет диаграммы для экспорта');
            return;
        }

        try {
            const xml = this.diagramService.exportToDrawio(this.currentDiagram);
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentDiagram.name}.drawio`;
            a.click();

            URL.revokeObjectURL(url);
            this.setStatus('Диаграмма экспортирована');
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Ошибка при экспорте: ' + error.message);
        }
    }

    printDiagram() {
        if (!this.currentDiagram) {
            alert('Нет диаграммы для печати');
            return;
        }

        window.print();
    }

    exit() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            window.close();
        }
    }

    // ========== Edit Operations ==========

    undo() {
        // TODO: Implement undo logic
        console.log('Undo not yet implemented');
        this.setStatus('Отмена не реализована');
    }

    redo() {
        // TODO: Implement redo logic
        console.log('Redo not yet implemented');
        this.setStatus('Повтор не реализован');
    }

    cut() {
        if (this.canvasController) {
            this.canvasController.cutSelected();
        }
    }

    copy() {
        if (this.canvasController) {
            this.canvasController.copySelected();
        }
    }

    paste() {
        if (this.canvasController) {
            this.canvasController.pasteFromClipboard();
        }
    }

    deleteSelected() {
        if (this.canvasController) {
            this.canvasController.deleteSelectedElement();
        }
    }

    selectAll() {
        if (this.canvasController) {
            this.canvasController.selectAll();
        }
    }

    // ========== View Operations ==========

    zoomIn() {
        this.canvasController.zoomIn();
        this.setStatus('Увеличение');
    }

    zoomOut() {
        this.canvasController.zoomOut();
        this.setStatus('Уменьшение');
    }

    zoomFit() {
        this.canvasController.zoomToFit();
        this.setStatus('По размеру страницы');
    }

    zoomToActual() {
        this.canvasController.zoomToActual();
        this.setStatus('100%');
    }

    toggleGrid() {
        AppConfig.ui.grid.enabled = !AppConfig.ui.grid.enabled;
        this.setStatus(`Сетка: ${AppConfig.ui.grid.enabled ? 'включена' : 'выключена'}`);
    }

    toggleSnap() {
        AppConfig.ui.grid.snapToGrid = !AppConfig.ui.grid.snapToGrid;
        this.setStatus(`Привязка к сетке: ${AppConfig.ui.grid.snapToGrid ? 'включена' : 'выключена'}`);
    }

    showPanelSettings() {
        alert('Настройка панелей пока не реализована');
    }

    // ========== Model Operations ==========

    showModelProperties() {
        if (!this.currentDiagram) {
            alert('Нет открытой диаграммы');
            return;
        }

        const info = `
Диаграмма: ${this.currentDiagram.name}
Тип: ${this.currentDiagram.type.toUpperCase()}
Элементов: ${this.currentDiagram.elements.length}
Создано: ${this.currentDiagram.createdAt.toLocaleString()}
Изменено: ${this.currentDiagram.modifiedAt.toLocaleString()}
        `;

        alert(info);
    }

    validateModel() {
        if (!this.currentDiagram) {
            alert('Нет диаграммы для проверки');
            return;
        }

        const validation = this.diagramService.validateDiagram(this.currentDiagram);

        let message = `Результаты проверки:\n\n`;

        if (validation.isValid) {
            message += '✓ Диаграмма валидна\n';
        } else {
            message += `✗ Найдено ошибок: ${validation.errors.length}\n`;
            validation.errors.forEach(err => {
                message += `  - ${err}\n`;
            });
        }

        if (validation.warnings.length > 0) {
            message += `\nПредупреждения: ${validation.warnings.length}\n`;
            validation.warnings.forEach(warn => {
                message += `  - ${warn}\n`;
            });
        }

        alert(message);
    }

    showMetaModelEditor() {
        const modalContainer = document.getElementById('modal-container');
        const currentNotation = this.stencilController?.currentNotation || 'vad';

        modalContainer.innerHTML = `
            <div class="modal-overlay" onclick="app.closeModal()">
                <div class="modal-dialog" style="max-width: 800px;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Редактор метамодели - ${currentNotation.toUpperCase()}</h3>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 20px;">
                            <label style="font-weight: 600;">Выберите нотацию:</label>
                            <select id="meta-notation-select" style="margin-left: 10px; padding: 5px;">
                                <option value="vad" ${currentNotation === 'vad' ? 'selected' : ''}>VAD - Value Added Diagram</option>
                                <option value="epc" ${currentNotation === 'epc' ? 'selected' : ''}>EPC - Event-driven Process Chain</option>
                                <option value="org" ${currentNotation === 'org' ? 'selected' : ''}>ORG - Organizational Structure</option>
                                <option value="bpmn" ${currentNotation === 'bpmn' ? 'selected' : ''}>BPMN</option>
                            </select>
                        </div>

                        <div style="display: flex; gap: 20px;">
                            <div style="flex: 1;">
                                <h4 style="margin-bottom: 10px; color: #333;">Фигуры (Shapes)</h4>
                                <div id="meta-shapes-list" style="border: 1px solid #ddd; padding: 10px; min-height: 200px; background: #f9f9f9;">
                                    <p style="color: #666; font-size: 12px;">Загрузка...</p>
                                </div>
                                <button class="btn btn-secondary" style="margin-top: 10px;" onclick="app.addMetaShape()">+ Добавить фигуру</button>
                            </div>
                            <div style="flex: 1;">
                                <h4 style="margin-bottom: 10px; color: #333;">Связи (Connections)</h4>
                                <div id="meta-connections-list" style="border: 1px solid #ddd; padding: 10px; min-height: 200px; background: #f9f9f9;">
                                    <p style="color: #666; font-size: 12px;">Загрузка...</p>
                                </div>
                                <button class="btn btn-secondary" style="margin-top: 10px;" onclick="app.addMetaConnection()">+ Добавить связь</button>
                            </div>
                        </div>

                        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-size: 13px;">
                                <strong>Примечание:</strong> Редактирование метамодели позволяет добавлять или изменять фигуры и связи в текущей нотации.
                                Изменения сохраняются в файл трафаретов stencils/${currentNotation}.xml.
                            </p>
                        </div>
                    </div>
                    <div style="padding: 15px 20px; background: #f8f8f8; border-top: 1px solid #ddd; text-align: right;">
                        <button class="btn btn-secondary" onclick="app.closeModal()">Отмена</button>
                        <button class="btn btn-primary" style="margin-left: 10px;" onclick="app.saveMetaModel()">Сохранить изменения</button>
                    </div>
                </div>
            </div>
        `;
        modalContainer.style.display = 'block';

        // Load current stencil data
        this.loadMetaModelData(currentNotation);

        // Handle notation change
        document.getElementById('meta-notation-select').addEventListener('change', (e) => {
            this.loadMetaModelData(e.target.value);
        });
    }

    async loadMetaModelData(notation) {
        try {
            const response = await fetch(`stencils/${notation}.xml`);
            const stencilData = await response.text();

            let stencils;
            const match = stencilData.match(/<mxlibrary>([\s\S]*)<\/mxlibrary>/);
            if (match) {
                stencils = JSON.parse(match[1]);
            } else {
                stencils = JSON.parse(stencilData);
            }

            // Separate shapes and connections
            const shapes = [];
            const connections = [];
            stencils.forEach((stencil, index) => {
                const isConnection = stencil.xml && (stencil.xml.includes('edge="1"') || stencil.xml.includes('endArrow='));
                if (isConnection) {
                    connections.push({ ...stencil, index });
                } else {
                    shapes.push({ ...stencil, index });
                }
            });

            // Render shapes list
            const shapesHtml = shapes.map(s => `
                <div style="padding: 8px; margin-bottom: 5px; background: #fff; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px;">${s.title}</span>
                    <span style="font-size: 10px; color: #666;">${s.w}x${s.h}</span>
                </div>
            `).join('');
            document.getElementById('meta-shapes-list').innerHTML = shapesHtml || '<p style="color: #999;">Нет фигур</p>';

            // Render connections list
            const connectionsHtml = connections.map(c => `
                <div style="padding: 8px; margin-bottom: 5px; background: #fff; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px;">${c.title}</span>
                </div>
            `).join('');
            document.getElementById('meta-connections-list').innerHTML = connectionsHtml || '<p style="color: #999;">Нет связей</p>';

        } catch (error) {
            console.error('Error loading meta model data:', error);
            document.getElementById('meta-shapes-list').innerHTML = '<p style="color: #c00;">Ошибка загрузки</p>';
            document.getElementById('meta-connections-list').innerHTML = '<p style="color: #c00;">Ошибка загрузки</p>';
        }
    }

    addMetaShape() {
        alert('Добавление новых фигур пока не реализовано.\nДля добавления фигур отредактируйте файл stencils/*.xml вручную.');
    }

    addMetaConnection() {
        alert('Добавление новых связей пока не реализовано.\nДля добавления связей отредактируйте файл stencils/*.xml вручную.');
    }

    saveMetaModel() {
        alert('Сохранение метамодели пока не реализовано.\nИзменения необходимо вносить вручную в файлы stencils/*.xml.');
        this.closeModal();
    }

    // ========== Format Operations ==========

    formatShape() {
        alert('Форматирование фигур пока не реализовано');
    }

    formatLine() {
        alert('Форматирование линий пока не реализовано');
    }

    formatText() {
        alert('Форматирование текста пока не реализовано');
    }

    align() {
        alert('Выравнивание пока не реализовано');
    }

    distribute() {
        alert('Распределение пока не реализовано');
    }

    bringToFront() {
        alert('На передний план - пока не реализовано');
    }

    sendToBack() {
        alert('На задний план - пока не реализовано');
    }

    // ========== Tools Operations ==========

    showSettings() {
        alert('Настройки пока не реализованы');
    }

    showConfiguration() {
        alert('Конфигурация пока не реализована');
    }

    // ========== Help Operations ==========

    showHelp(page) {
        this.helpController.showHelp(page);
    }

    showAbout() {
        const update = AppConfig.app.lastUpdate;
        const about = `
${AppConfig.app.name}
Версия: ${AppConfig.app.version}

${AppConfig.app.description}

Автор: ${AppConfig.app.author}

Последнее обновление:
  Issue #${update.issueNumber}: ${update.issueTitle}
  PR #${update.prNumber}: ${update.prTitle}

  Изменения:
  - Улучшен drag-and-drop для ARIS-фигур (chevron, etc.)
  - Добавлена поддержка соединений (стрелок) между фигурами
  - Реализовано редактирование надписей на фигурах
  - Исправлены кнопки Вырезать/Копировать/Вставить
  - Добавлено выделение, перемещение и удаление элементов
  - Реализована панель свойств для выбранных объектов
  - Иерархический проводник моделей с примерами
  - Исправлена функция сохранения файлов

GitHub: https://github.com/bpmbpm/draw-vad
        `;
        alert(about);
    }

    // ========== Canvas Operations ==========

    addElementToCanvas(notation, stencilId) {
        if (!this.currentDiagram) {
            alert('Сначала создайте диаграмму');
            return;
        }

        try {
            const element = this.notationService.createElement(notation, stencilId);
            this.currentDiagram.addElement(element);
            this.canvasController.renderDiagram();
            this.setStatus(`Добавлен элемент: ${element.name}`);
        } catch (error) {
            console.error('Error adding element:', error);
            alert('Ошибка при добавлении элемента: ' + error.message);
        }
    }

    addElementFromStencil(notation, stencilData) {
        if (!this.currentDiagram) {
            alert('Сначала создайте диаграмму');
            return;
        }

        try {
            // Add element from stencil XML data to canvas
            this.canvasController.addElementFromStencil(stencilData);
            this.setStatus(`Добавлен элемент: ${stencilData.title || 'элемент'}`);
        } catch (error) {
            console.error('Error adding element from stencil:', error);
            alert('Ошибка при добавлении элемента: ' + error.message);
        }
    }

    onElementModified(element) {
        if (this.currentDiagram) {
            this.currentDiagram.touch();
            this.canvasController.renderDiagram();
            this.setStatus('Элемент изменен');
        }
    }

    // ========== Utility Methods ==========

    setStatus(message) {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
        }
        console.log('Status:', message);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ArisExpressApp();
    console.log('Application initialized');
});
