/**
 * Presentation: ToolbarController
 * Handles toolbar button interactions
 */

class ToolbarController {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        // Attach event listeners to toolbar buttons
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.getAttribute('data-action');
                this.handleToolAction(action);
            });
        });
    }

    handleToolAction(action) {
        console.log('Tool action:', action);

        switch (action) {
            case 'new':
                this.app.createNewDiagram();
                break;
            case 'open':
                this.app.openDiagram();
                break;
            case 'save':
                this.app.saveDiagram();
                break;
            case 'undo':
                this.app.undo();
                break;
            case 'redo':
                this.app.redo();
                break;
            case 'zoom-in':
                this.app.zoomIn();
                break;
            case 'zoom-out':
                this.app.zoomOut();
                break;
            case 'zoom-fit':
                this.app.zoomFit();
                break;
            default:
                console.warn('Unknown tool action:', action);
        }
    }
}
