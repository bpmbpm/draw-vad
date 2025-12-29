/**
 * Presentation: MenuController
 * Handles menu interactions and commands
 */

class MenuController {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        // Attach event listeners to menu items
        const menuItems = document.querySelectorAll('.dropdown-menu a');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = item.getAttribute('data-action');
                this.handleMenuAction(action);
            });
        });
    }

    handleMenuAction(action) {
        console.log('Menu action:', action);

        switch (action) {
            // File menu
            case 'new':
                this.app.createNewDiagram();
                break;
            case 'open':
                this.app.openDiagram();
                break;
            case 'save':
                this.app.saveDiagram();
                break;
            case 'saveas':
                this.app.saveDiagramAs();
                break;
            case 'import':
                this.app.importDiagram();
                break;
            case 'export':
                this.app.exportDiagram();
                break;
            case 'print':
                this.app.printDiagram();
                break;
            case 'exit':
                this.app.exit();
                break;

            // Edit menu
            case 'undo':
                this.app.undo();
                break;
            case 'redo':
                this.app.redo();
                break;
            case 'cut':
                this.app.cut();
                break;
            case 'copy':
                this.app.copy();
                break;
            case 'paste':
                this.app.paste();
                break;
            case 'delete':
                this.app.deleteSelected();
                break;
            case 'selectall':
                this.app.selectAll();
                break;

            // View menu
            case 'zoom-in':
                this.app.zoomIn();
                break;
            case 'zoom-out':
                this.app.zoomOut();
                break;
            case 'zoom-fit':
                this.app.zoomFit();
                break;
            case 'zoom-100':
                this.app.zoomToActual();
                break;
            case 'grid':
                this.app.toggleGrid();
                break;
            case 'snap':
                this.app.toggleSnap();
                break;
            case 'panels':
                this.app.showPanelSettings();
                break;

            // Model menu
            case 'new-vad':
                this.app.createDiagram('vad');
                break;
            case 'new-epc':
                this.app.createDiagram('epc');
                break;
            case 'new-org':
                this.app.createDiagram('org');
                break;
            case 'properties':
                this.app.showModelProperties();
                break;
            case 'validate':
                this.app.validateModel();
                break;

            // Format menu
            case 'format-shape':
                this.app.formatShape();
                break;
            case 'format-line':
                this.app.formatLine();
                break;
            case 'format-text':
                this.app.formatText();
                break;
            case 'align':
                this.app.align();
                break;
            case 'distribute':
                this.app.distribute();
                break;
            case 'bring-front':
                this.app.bringToFront();
                break;
            case 'send-back':
                this.app.sendToBack();
                break;

            // Tools menu
            case 'settings':
                this.app.showSettings();
                break;
            case 'configure':
                this.app.showConfiguration();
                break;

            // Help menu
            case 'help-contents':
                this.app.showHelp('index');
                break;
            case 'help-vad':
                this.app.showHelp('vad');
                break;
            case 'help-epc':
                this.app.showHelp('epc');
                break;
            case 'help-org':
                this.app.showHelp('org');
                break;
            case 'about':
                this.app.showAbout();
                break;

            default:
                console.warn('Unknown menu action:', action);
        }
    }

    updateStatus(message) {
        const statusElement = document.getElementById('status-message');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
}
