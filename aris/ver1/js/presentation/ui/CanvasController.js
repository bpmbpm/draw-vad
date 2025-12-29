/**
 * Presentation: CanvasController
 * Handles canvas/diagram interactions with SVG-based rendering
 */

class CanvasController {
    constructor(app) {
        this.app = app;
        this.currentDiagram = null;
        this.zoomLevel = 100;
        this.elements = [];
        this.selectedElement = null;
        this.rawXml = null; // Store raw XML for rendering
        this.init();
    }

    init() {
        this.canvasContainer = document.getElementById('drawio-container');
        this.canvasTitle = document.querySelector('.canvas-title');
        this.zoomLevelDisplay = document.getElementById('zoom-level');

        // Initialize canvas
        this.setupCanvas();
        this.setupEventHandlers();
    }

    setupCanvas() {
        // Create SVG-based canvas
        this.canvasContainer.innerHTML = `
            <div class="canvas-wrapper" style="width: 100%; height: 100%; overflow: auto; background: #f5f5f5; position: relative;">
                <div class="canvas-empty" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">
                    <div style="text-align: center;">
                        <p style="font-size: 18px; margin-bottom: 10px;">Холст диаграммы</p>
                        <p style="font-size: 14px;">Выберите элемент из трафаретов или создайте новую диаграмму</p>
                    </div>
                </div>
                <svg id="diagram-svg" class="diagram-svg" style="display: none; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
                        </marker>
                    </defs>
                    <g id="diagram-content"></g>
                </svg>
            </div>
        `;

        this.svg = document.getElementById('diagram-svg');
        this.diagramContent = document.getElementById('diagram-content');
        this.canvasWrapper = this.canvasContainer.querySelector('.canvas-wrapper');
        this.canvasEmpty = this.canvasContainer.querySelector('.canvas-empty');
    }

    setupEventHandlers() {
        // Handle drop events for drag-and-drop from stencils
        this.canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvasContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const stencilXml = e.dataTransfer.getData('stencilXml');
            const notation = e.dataTransfer.getData('notation');

            if (stencilXml) {
                const rect = this.canvasContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.addElementFromDrop(stencilXml, notation, x, y);
            }
        });
    }

    setDiagram(diagram) {
        this.currentDiagram = diagram;
        this.canvasTitle.textContent = diagram.name;
        this.renderDiagram();
    }

    setRawXml(xml) {
        this.rawXml = xml;
        this.renderFromXml();
    }

    renderDiagram() {
        if (!this.currentDiagram) {
            return;
        }

        // Show SVG canvas, hide empty message
        this.canvasEmpty.style.display = 'none';
        this.svg.style.display = 'block';

        // Clear previous content
        this.diagramContent.innerHTML = '';

        // Render each element from the diagram
        const elements = this.currentDiagram.elements || [];

        if (elements.length === 0) {
            // Show empty diagram message
            this.svg.setAttribute('width', '800');
            this.svg.setAttribute('height', '600');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '400');
            text.setAttribute('y', '300');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#999');
            text.setAttribute('font-size', '16');
            text.textContent = 'Диаграмма пуста. Добавьте элементы из трафаретов.';
            this.diagramContent.appendChild(text);
            return;
        }

        // Calculate bounding box
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        elements.forEach(element => {
            const x = element.position?.x || 0;
            const y = element.position?.y || 0;
            const w = element.size?.width || 100;
            const h = element.size?.height || 60;

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
        });

        // Set SVG dimensions with padding
        const padding = 40;
        const width = Math.max(800, maxX + padding);
        const height = Math.max(600, maxY + padding);
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);

        // Render each element
        elements.forEach(element => {
            this.renderElement(element);
        });

        this.applyZoom();
    }

    renderFromXml() {
        if (!this.rawXml) {
            return;
        }

        // Show SVG canvas, hide empty message
        this.canvasEmpty.style.display = 'none';
        this.svg.style.display = 'block';

        // Clear previous content
        this.diagramContent.innerHTML = '';

        try {
            // Parse the XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(this.rawXml, 'text/xml');

            // Find all mxCell elements with geometry
            const cells = xmlDoc.querySelectorAll('mxCell');
            const elementMap = new Map();

            // First pass: collect all elements
            cells.forEach(cell => {
                const id = cell.getAttribute('id');
                const geometry = cell.querySelector('mxGeometry');

                if (id === '0' || id === '1') return;

                const value = cell.getAttribute('value') || '';
                const style = cell.getAttribute('style') || '';
                const isVertex = cell.getAttribute('vertex') === '1';
                const isEdge = cell.getAttribute('edge') === '1';

                if (geometry || isEdge) {
                    elementMap.set(id, {
                        id,
                        value,
                        style,
                        isVertex,
                        isEdge,
                        geometry: geometry ? {
                            x: parseFloat(geometry.getAttribute('x') || '0'),
                            y: parseFloat(geometry.getAttribute('y') || '0'),
                            width: parseFloat(geometry.getAttribute('width') || '100'),
                            height: parseFloat(geometry.getAttribute('height') || '60'),
                            relative: geometry.getAttribute('relative') === '1'
                        } : null,
                        parent: cell.getAttribute('parent')
                    });
                }
            });

            // Calculate bounding box
            let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
            elementMap.forEach(el => {
                if (el.geometry && !el.geometry.relative && el.isVertex) {
                    const x = el.geometry.x;
                    const y = el.geometry.y;
                    const w = el.geometry.width;
                    const h = el.geometry.height;

                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x + w);
                    maxY = Math.max(maxY, y + h);
                }
            });

            // Set SVG dimensions with padding
            const padding = 60;
            const width = Math.max(800, maxX + padding);
            const height = Math.max(600, maxY + padding);
            this.svg.setAttribute('width', width);
            this.svg.setAttribute('height', height);

            // Render each element
            elementMap.forEach(el => {
                this.renderXmlElement(el, elementMap);
            });

        } catch (error) {
            console.error('Error rendering XML:', error);
            this.diagramContent.innerHTML = '';
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '400');
            text.setAttribute('y', '300');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#c00');
            text.textContent = 'Ошибка отображения диаграммы';
            this.diagramContent.appendChild(text);
        }

        this.applyZoom();
    }

    renderXmlElement(el, elementMap) {
        if (!el.geometry || el.geometry.relative) return;

        const { x, y, width, height } = el.geometry;
        const style = this.parseStyle(el.style);
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-id', el.id);
        g.setAttribute('class', 'diagram-element');

        if (el.isEdge) {
            // Render edge/connection
            this.renderEdge(g, el, elementMap);
        } else if (el.isVertex) {
            // Determine shape type and render
            const shapeType = this.getShapeType(el.style);
            this.renderShape(g, shapeType, x, y, width, height, style, el.value);
        }

        this.diagramContent.appendChild(g);
    }

    getShapeType(styleString) {
        if (styleString.includes('shape=hexagon')) return 'hexagon';
        if (styleString.includes('shape=rhombus')) return 'diamond';
        if (styleString.includes('shape=ellipse') || styleString.includes('ellipse')) return 'ellipse';
        if (styleString.includes('shape=mxgraph.arrows2.arrow')) return 'arrow';
        if (styleString.includes('shape=note')) return 'note';
        if (styleString.includes('swimlane')) return 'swimlane';
        if (styleString.includes('shape=umlActor')) return 'actor';
        if (styleString.includes('rounded=1')) return 'roundedRect';
        if (styleString.includes('shape=partialRectangle')) return 'partialRect';
        return 'rect';
    }

    parseStyle(styleString) {
        const style = {};
        if (!styleString) return style;

        styleString.split(';').forEach(part => {
            const [key, value] = part.split('=');
            if (key && value) {
                style[key.trim()] = value.trim();
            }
        });

        return style;
    }

    renderShape(g, shapeType, x, y, width, height, style, label) {
        const fillColor = style.fillColor || '#ffffff';
        const strokeColor = style.strokeColor || '#000000';
        const strokeWidth = style.strokeWidth || '1';

        let shape;

        switch (shapeType) {
            case 'hexagon':
                shape = this.createHexagon(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'diamond':
                shape = this.createDiamond(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'ellipse':
                shape = this.createEllipse(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'arrow':
                shape = this.createArrow(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'note':
                shape = this.createNote(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'swimlane':
                shape = this.createSwimlane(x, y, width, height, fillColor, strokeColor, strokeWidth, label);
                break;
            case 'actor':
                shape = this.createActor(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'roundedRect':
                shape = this.createRoundedRect(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'partialRect':
                shape = this.createPartialRect(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            default:
                shape = this.createRect(x, y, width, height, fillColor, strokeColor, strokeWidth);
        }

        g.appendChild(shape);

        // Add label if not swimlane (swimlane handles its own label)
        if (label && shapeType !== 'swimlane') {
            const text = this.createLabel(x + width / 2, y + height / 2, label, style);
            g.appendChild(text);
        }
    }

    createRect(x, y, width, height, fill, stroke, strokeWidth) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', stroke);
        rect.setAttribute('stroke-width', strokeWidth);
        return rect;
    }

    createRoundedRect(x, y, width, height, fill, stroke, strokeWidth) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('rx', '10');
        rect.setAttribute('ry', '10');
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', stroke);
        rect.setAttribute('stroke-width', strokeWidth);
        return rect;
    }

    createPartialRect(x, y, width, height, fill, stroke, strokeWidth) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', fill === 'none' ? 'transparent' : fill);
        rect.setAttribute('stroke', stroke);
        rect.setAttribute('stroke-width', strokeWidth);
        return rect;
    }

    createHexagon(x, y, width, height, fill, stroke, strokeWidth) {
        const points = [
            [x + width * 0.15, y],
            [x + width * 0.85, y],
            [x + width, y + height / 2],
            [x + width * 0.85, y + height],
            [x + width * 0.15, y + height],
            [x, y + height / 2]
        ].map(p => p.join(',')).join(' ');

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', fill);
        polygon.setAttribute('stroke', stroke);
        polygon.setAttribute('stroke-width', strokeWidth);
        return polygon;
    }

    createDiamond(x, y, width, height, fill, stroke, strokeWidth) {
        const points = [
            [x + width / 2, y],
            [x + width, y + height / 2],
            [x + width / 2, y + height],
            [x, y + height / 2]
        ].map(p => p.join(',')).join(' ');

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', fill);
        polygon.setAttribute('stroke', stroke);
        polygon.setAttribute('stroke-width', strokeWidth);
        return polygon;
    }

    createEllipse(x, y, width, height, fill, stroke, strokeWidth) {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', x + width / 2);
        ellipse.setAttribute('cy', y + height / 2);
        ellipse.setAttribute('rx', width / 2);
        ellipse.setAttribute('ry', height / 2);
        ellipse.setAttribute('fill', fill);
        ellipse.setAttribute('stroke', stroke);
        ellipse.setAttribute('stroke-width', strokeWidth);
        return ellipse;
    }

    createArrow(x, y, width, height, fill, stroke, strokeWidth) {
        // VAD arrow/chevron shape
        const notch = width * 0.1;
        const dx = width * 0.15;

        const points = [
            [x, y],
            [x + width - dx, y],
            [x + width, y + height / 2],
            [x + width - dx, y + height],
            [x, y + height],
            [x + notch, y + height / 2]
        ].map(p => p.join(',')).join(' ');

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', fill);
        polygon.setAttribute('stroke', stroke);
        polygon.setAttribute('stroke-width', strokeWidth);
        return polygon;
    }

    createNote(x, y, width, height, fill, stroke, strokeWidth) {
        const foldSize = 15;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M${x},${y} L${x + width - foldSize},${y} L${x + width},${y + foldSize} L${x + width},${y + height} L${x},${y + height} Z M${x + width - foldSize},${y} L${x + width - foldSize},${y + foldSize} L${x + width},${y + foldSize}`;
        path.setAttribute('d', d);
        path.setAttribute('fill', fill);
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', strokeWidth);
        return path;
    }

    createSwimlane(x, y, width, height, fill, stroke, strokeWidth, label) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Main container
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', stroke);
        rect.setAttribute('stroke-width', strokeWidth);
        g.appendChild(rect);

        // Header
        const headerHeight = 25;
        const header = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        header.setAttribute('x', x);
        header.setAttribute('y', y);
        header.setAttribute('width', width);
        header.setAttribute('height', headerHeight);
        header.setAttribute('fill', fill);
        header.setAttribute('stroke', stroke);
        header.setAttribute('stroke-width', strokeWidth);
        g.appendChild(header);

        // Label
        if (label) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + 10);
            text.setAttribute('y', y + 17);
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#333');
            text.textContent = label;
            g.appendChild(text);
        }

        return g;
    }

    createActor(x, y, width, height, fill, stroke, strokeWidth) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const cx = x + width / 2;
        const headRadius = height * 0.15;
        const bodyTop = y + headRadius * 2 + 2;
        const bodyBottom = y + height * 0.7;
        const legBottom = y + height;

        // Head
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        head.setAttribute('cx', cx);
        head.setAttribute('cy', y + headRadius);
        head.setAttribute('r', headRadius);
        head.setAttribute('fill', fill);
        head.setAttribute('stroke', stroke);
        head.setAttribute('stroke-width', strokeWidth);
        g.appendChild(head);

        // Body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        body.setAttribute('x1', cx);
        body.setAttribute('y1', bodyTop);
        body.setAttribute('x2', cx);
        body.setAttribute('y2', bodyBottom);
        body.setAttribute('stroke', stroke);
        body.setAttribute('stroke-width', strokeWidth);
        g.appendChild(body);

        // Arms
        const arms = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arms.setAttribute('x1', x + width * 0.2);
        arms.setAttribute('y1', bodyTop + (bodyBottom - bodyTop) * 0.3);
        arms.setAttribute('x2', x + width * 0.8);
        arms.setAttribute('y2', bodyTop + (bodyBottom - bodyTop) * 0.3);
        arms.setAttribute('stroke', stroke);
        arms.setAttribute('stroke-width', strokeWidth);
        g.appendChild(arms);

        // Left leg
        const leftLeg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftLeg.setAttribute('x1', cx);
        leftLeg.setAttribute('y1', bodyBottom);
        leftLeg.setAttribute('x2', x + width * 0.25);
        leftLeg.setAttribute('y2', legBottom);
        leftLeg.setAttribute('stroke', stroke);
        leftLeg.setAttribute('stroke-width', strokeWidth);
        g.appendChild(leftLeg);

        // Right leg
        const rightLeg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightLeg.setAttribute('x1', cx);
        rightLeg.setAttribute('y1', bodyBottom);
        rightLeg.setAttribute('x2', x + width * 0.75);
        rightLeg.setAttribute('y2', legBottom);
        rightLeg.setAttribute('stroke', stroke);
        rightLeg.setAttribute('stroke-width', strokeWidth);
        g.appendChild(rightLeg);

        return g;
    }

    renderEdge(g, el, elementMap) {
        // Simplified edge rendering - draw a line with arrow
        const style = this.parseStyle(el.style);
        const strokeColor = style.strokeColor || '#333';
        const strokeWidth = style.strokeWidth || '2';

        // For now, just indicate edge exists
        // In a full implementation, we would calculate actual positions from source/target
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', '0');
        line.setAttribute('x2', '100');
        line.setAttribute('y2', '0');
        line.setAttribute('stroke', strokeColor);
        line.setAttribute('stroke-width', strokeWidth);
        line.setAttribute('marker-end', 'url(#arrowhead)');
        g.appendChild(line);
    }

    createLabel(x, y, text, style) {
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('dominant-baseline', 'middle');
        textEl.setAttribute('font-size', style.fontSize || '12');
        textEl.setAttribute('fill', style.fontColor || '#333');

        // Handle multiline text
        const lines = text.split('\n');
        if (lines.length === 1) {
            textEl.textContent = text;
        } else {
            lines.forEach((line, i) => {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.setAttribute('x', x);
                tspan.setAttribute('dy', i === 0 ? '0' : '1.2em');
                tspan.textContent = line;
                textEl.appendChild(tspan);
            });
        }

        return textEl;
    }

    renderElement(element) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-id', element.id);
        g.setAttribute('class', 'diagram-element');

        const x = element.position?.x || 0;
        const y = element.position?.y || 0;
        const width = element.size?.width || 100;
        const height = element.size?.height || 60;
        const style = element.style || {};

        const shapeType = this.getElementShapeType(element.type);
        this.renderShape(g, shapeType, x, y, width, height, {
            fillColor: style.fillColor || '#dae8fc',
            strokeColor: style.strokeColor || '#6c8ebf'
        }, element.name);

        this.diagramContent.appendChild(g);
    }

    getElementShapeType(elementType) {
        switch (elementType) {
            case 'baseVAD':
            case 'detailVAD':
            case 'externVAD':
                return 'arrow';
            case 'event':
                return 'hexagon';
            case 'connector':
            case 'gateway':
                return 'diamond';
            case 'person':
            case 'orgUnit':
                return 'ellipse';
            case 'note':
                return 'note';
            case 'function':
            case 'task':
                return 'roundedRect';
            default:
                return 'rect';
        }
    }

    addElementFromStencil(stencilData) {
        if (!this.currentDiagram) {
            console.warn('No diagram to add element to');
            return;
        }

        // Show canvas if hidden
        this.canvasEmpty.style.display = 'none';
        this.svg.style.display = 'block';

        // Parse stencil XML and add to canvas
        const element = {
            id: 'el_' + Date.now(),
            name: stencilData.title || 'Element',
            type: 'shape',
            position: { x: 100, y: 100 },
            size: { width: stencilData.w || 100, height: stencilData.h || 60 },
            style: {}
        };

        this.currentDiagram.elements.push(element);
        this.renderDiagram();
    }

    addElementFromDrop(stencilXml, notation, x, y) {
        if (!this.currentDiagram) {
            console.warn('No diagram to add element to');
            return;
        }

        // Decode and add element at drop position
        const element = {
            id: 'el_' + Date.now(),
            name: 'New Element',
            type: 'shape',
            position: { x: Math.max(0, x - 50), y: Math.max(0, y - 30) },
            size: { width: 100, height: 60 },
            style: {}
        };

        this.currentDiagram.elements.push(element);
        this.renderDiagram();
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
        if (this.svg) {
            const scale = this.zoomLevel / 100;
            this.svg.style.transform = `scale(${scale})`;
            this.svg.style.transformOrigin = 'top left';
        }
    }

    clear() {
        this.currentDiagram = null;
        this.rawXml = null;
        this.setupCanvas();
    }
}
