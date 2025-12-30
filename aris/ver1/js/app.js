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

        // Load welcome message or last diagram
        this.showWelcome();
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

            // Auto-select the matching stencil
            this.setNotationStencil(notationType);

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
                        <p style="margin-bottom: 15px; color: #666;">Выберите тип диаграммы:</p>
                        <div class="diagram-type-list">
                            <div class="diagram-type-item" onclick="app.createDiagramOfType('vad')">
                                <span class="type-icon">📊</span>
                                <div class="type-info">
                                    <span class="type-name">VAD - Value Added Chain Diagram</span>
                                    <span class="type-desc">Диаграмма цепочки добавленной стоимости</span>
                                </div>
                            </div>
                            <div class="diagram-type-item" onclick="app.createDiagramOfType('epc')">
                                <span class="type-icon">🔄</span>
                                <div class="type-info">
                                    <span class="type-name">EPC - Event-driven Process Chain</span>
                                    <span class="type-desc">Событийная цепочка процессов</span>
                                </div>
                            </div>
                            <div class="diagram-type-item" onclick="app.createDiagramOfType('bpmn')">
                                <span class="type-icon">📋</span>
                                <div class="type-info">
                                    <span class="type-name">BPMN - Business Process Model</span>
                                    <span class="type-desc">Модель бизнес-процессов</span>
                                </div>
                            </div>
                            <div class="diagram-type-item" onclick="app.createDiagramOfType('org')">
                                <span class="type-icon">👥</span>
                                <div class="type-info">
                                    <span class="type-name">ORG - Organizational Chart</span>
                                    <span class="type-desc">Организационная структура</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        modalContainer.style.display = 'block';
    }

    createDiagramOfType(type) {
        this.closeModal();
        this.createDiagram(type);
    }

    createDiagram(type) {
        try {
            this.currentDiagram = this.createDiagramUseCase.execute(type);
            this.canvasController.setDiagram(this.currentDiagram);

            // Auto-select the matching stencil
            this.setNotationStencil(type);

            // Add to model explorer
            this.addDiagramToExplorer(this.currentDiagram);

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
