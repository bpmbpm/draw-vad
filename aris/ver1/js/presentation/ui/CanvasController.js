/**
 * Presentation: CanvasController
 * Handles canvas/diagram interactions
 */

class CanvasController {
    constructor(app) {
        this.app = app;
        this.currentDiagram = null;
        this.zoomLevel = 100;
        this.init();
    }

    init() {
        this.canvasContainer = document.getElementById('drawio-container');
        this.canvasTitle = document.querySelector('.canvas-title');
        this.zoomLevelDisplay = document.getElementById('zoom-level');

        // Initialize canvas
        this.setupCanvas();
    }

    setupCanvas() {
        // Create a simple canvas for now
        // In production, this would integrate with draw.io editor
        this.canvasContainer.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999;">
                <div style="text-align: center;">
                    <p style="font-size: 18px; margin-bottom: 10px;">Холст диаграммы</p>
                    <p style="font-size: 14px;">Выберите элемент из трафаретов или создайте новую диаграмму</p>
                </div>
            </div>
        `;
    }

    setDiagram(diagram) {
        this.currentDiagram = diagram;
        this.canvasTitle.textContent = diagram.name;
        this.renderDiagram();
    }

    renderDiagram() {
        if (!this.currentDiagram) {
            return;
        }

        // This would integrate with draw.io viewer/editor
        // For now, just show a placeholder
        this.canvasContainer.innerHTML = `
            <div style="width: 100%; height: 100%; padding: 20px;">
                <h3>${this.currentDiagram.name}</h3>
                <p>Type: ${this.currentDiagram.type.toUpperCase()}</p>
                <p>Elements: ${this.currentDiagram.elements.length}</p>
                <p style="margin-top: 20px; color: #666;">
                    <em>Canvas интеграция с draw.io будет здесь</em>
                </p>
            </div>
        `;
    }

    setZoom(level) {
        this.zoomLevel = Math.max(25, Math.min(400, level));
        this.zoomLevelDisplay.textContent = this.zoomLevel + '%';
        this.applyZoom();
    }

    zoomIn() {
        this.setZoom(this.zoomLevel + 25);
    }

    zoomOut() {
        this.setZoom(this.zoomLevel - 25);
    }

    zoomToFit() {
        this.setZoom(100);
    }

    zoomToActual() {
        this.setZoom(100);
    }

    applyZoom() {
        // Apply zoom transformation to canvas
        if (this.canvasContainer) {
            const scale = this.zoomLevel / 100;
            this.canvasContainer.style.transform = `scale(${scale})`;
            this.canvasContainer.style.transformOrigin = 'top left';
        }
    }

    clear() {
        this.currentDiagram = null;
        this.setupCanvas();
    }
}
