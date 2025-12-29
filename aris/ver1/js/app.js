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

        // Load welcome message or last diagram
        this.showWelcome();
    }

    showWelcome() {
        console.log('Application ready');
        this.setStatus('Готов к работе. Выберите Файл → Создать или Модель → Новая диаграмма');
    }

    // ========== File Operations ==========

    createNewDiagram() {
        const notation = AppConfig.notations.default;
        this.createDiagram(notation);
    }

    createDiagram(type) {
        try {
            this.currentDiagram = this.createDiagramUseCase.execute(type);
            this.canvasController.setDiagram(this.currentDiagram);
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
            await this.saveDiagramUseCase.execute(this.currentDiagram);
            this.setStatus(`Диаграмма "${this.currentDiagram.name}" сохранена`);
            console.log('Diagram saved:', this.currentDiagram);
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

        const newName = prompt('Введите новое имя диаграммы:', this.currentDiagram.name);
        if (newName) {
            this.currentDiagram.name = newName;
            this.saveDiagram();
        }
    }

    async openDiagram() {
        try {
            const diagrams = await this.diagramService.listDiagrams();

            if (diagrams.length === 0) {
                alert('Нет сохраненных диаграмм');
                return;
            }

            // Show selection dialog
            const diagramNames = diagrams.map((d, i) => `${i + 1}. ${d.name} (${d.type})`).join('\n');
            const selection = prompt(`Выберите диаграмму:\n${diagramNames}\n\nВведите номер:`);

            if (selection) {
                const index = parseInt(selection) - 1;
                if (index >= 0 && index < diagrams.length) {
                    this.currentDiagram = diagrams[index];
                    this.canvasController.setDiagram(this.currentDiagram);
                    this.setStatus(`Загружена диаграмма: ${this.currentDiagram.name}`);
                }
            }
        } catch (error) {
            console.error('Error opening diagram:', error);
            alert('Ошибка при открытии: ' + error.message);
        }
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
        console.log('Cut not yet implemented');
    }

    copy() {
        console.log('Copy not yet implemented');
    }

    paste() {
        console.log('Paste not yet implemented');
    }

    deleteSelected() {
        console.log('Delete not yet implemented');
    }

    selectAll() {
        console.log('Select all not yet implemented');
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
        const about = `
${AppConfig.app.name}
Версия: ${AppConfig.app.version}

${AppConfig.app.description}

Автор: ${AppConfig.app.author}
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
