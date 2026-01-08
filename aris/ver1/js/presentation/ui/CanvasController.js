/**
 * Presentation: CanvasController
 * Handles canvas/diagram interactions with SVG-based rendering
 * Supports: selection, moving, editing, connections, clipboard operations
 */

class CanvasController {
    constructor(app) {
        this.app = app;
        this.currentDiagram = null;
        this.zoomLevel = 100;
        this.elements = [];
        this.connections = [];
        this.selectedElement = null;
        this.selectedElements = [];
        this.rawXml = null;
        this.clipboard = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isConnecting = false;
        this.connectionStart = null;
        this.connectionStencil = null;
        this.tempConnectionLine = null;
        this.elementIdCounter = 1;
        this.init();
    }

    init() {
        this.canvasContainer = document.getElementById('drawio-container');
        this.canvasTitle = document.querySelector('.canvas-title');
        this.zoomLevelDisplay = document.getElementById('zoom-level');

        this.setupCanvas();
        this.setupEventHandlers();
    }

    setupCanvas() {
        this.canvasContainer.innerHTML = `
            <div class="canvas-wrapper" style="width: 100%; height: 100%; overflow: auto; background: #f5f5f5; position: relative;">
                <div class="canvas-empty" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">
                    <div style="text-align: center;">
                        <p style="font-size: 18px; margin-bottom: 10px;">Холст диаграммы</p>
                        <p style="font-size: 14px;">Выберите элемент из трафаретов или создайте новую диаграмму</p>
                    </div>
                </div>
                <svg id="diagram-svg" class="diagram-svg" style="display: none; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: default;">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
                        </marker>
                        <marker id="arrowhead-dashed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                        </marker>
                        <marker id="arrowhead-thick" markerWidth="12" markerHeight="9" refX="11" refY="4.5" orient="auto">
                            <polygon points="0 0, 12 4.5, 0 9" fill="#333" />
                        </marker>
                        <marker id="arrowhead-gray" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
                        </marker>
                    </defs>
                    <g id="diagram-content"></g>
                    <g id="connection-layer"></g>
                    <g id="connection-points-layer"></g>
                    <g id="temp-connection-layer"></g>
                    <g id="selection-layer"></g>
                </svg>
            </div>
        `;

        this.svg = document.getElementById('diagram-svg');
        this.diagramContent = document.getElementById('diagram-content');
        this.connectionLayer = document.getElementById('connection-layer');
        this.connectionPointsLayer = document.getElementById('connection-points-layer');
        this.tempConnectionLayer = document.getElementById('temp-connection-layer');
        this.selectionLayer = document.getElementById('selection-layer');
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
            const stencilIndex = e.dataTransfer.getData('stencilIndex');
            const notation = e.dataTransfer.getData('notation');
            const isConnection = e.dataTransfer.getData('isConnection') === 'true';

            if (isConnection) {
                // Handle connection drop - need to find elements near drop point
                this.app.setStatus('Для создания связи: кликните на связь в трафарете, затем на начальную и конечную фигуры');
                return;
            }

            if (stencilXml || stencilIndex) {
                const rect = this.svg.getBoundingClientRect();
                const scale = this.zoomLevel / 100;
                const x = (e.clientX - rect.left) / scale;
                const y = (e.clientY - rect.top) / scale;
                this.addElementFromDrop(stencilXml, notation, x, y, stencilIndex);
            }
        });

        // Keyboard events for delete, copy, paste
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedElement) {
                    this.deleteSelectedElement();
                }
            } else if (e.ctrlKey && e.key === 'c') {
                this.copySelected();
            } else if (e.ctrlKey && e.key === 'x') {
                this.cutSelected();
            } else if (e.ctrlKey && e.key === 'v') {
                this.pasteFromClipboard();
            } else if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                this.selectAll();
            } else if (e.key === 'Escape') {
                this.cancelConnectionMode();
                this.deselectAll();
            }
        });

        // Click on canvas to deselect or cancel connection
        this.svg?.addEventListener('click', (e) => {
            if (e.target === this.svg || e.target.id === 'diagram-content') {
                if (this.isConnecting) {
                    this.cancelConnectionMode();
                } else {
                    this.deselectAll();
                }
            }
        });

        // Mouse move for temporary connection line
        this.svg?.addEventListener('mousemove', (e) => {
            if (this.isConnecting && this.connectionStart) {
                const rect = this.svg.getBoundingClientRect();
                const scale = this.zoomLevel / 100;
                const x = (e.clientX - rect.left) / scale;
                const y = (e.clientY - rect.top) / scale;
                this.updateTempConnectionLine(x, y);
            }
        });
    }

    /**
     * Start connection mode to draw connections between shapes
     */
    startConnectionMode(stencilData) {
        this.isConnecting = true;
        this.connectionStencil = stencilData;
        this.connectionStart = null;
        this.svg.style.cursor = 'crosshair';

        // Show connection points on all elements
        this.showAllConnectionPoints();
    }

    /**
     * Cancel connection mode
     */
    cancelConnectionMode() {
        this.isConnecting = false;
        this.connectionStencil = null;
        this.connectionStart = null;
        this.svg.style.cursor = 'default';
        this.hideAllConnectionPoints();
        this.clearTempConnectionLine();
        this.app.setStatus('Режим соединения отменен');
    }

    /**
     * Show connection points on all elements
     */
    showAllConnectionPoints() {
        if (!this.connectionPointsLayer) return;
        this.connectionPointsLayer.innerHTML = '';

        this.elements.forEach(element => {
            const points = this.getConnectionPoints(element);
            points.forEach((point, index) => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', point.x);
                circle.setAttribute('cy', point.y);
                circle.setAttribute('r', '5');
                circle.setAttribute('fill', '#0078d4');
                circle.setAttribute('stroke', '#fff');
                circle.setAttribute('stroke-width', '1');
                circle.setAttribute('class', 'connection-point');
                circle.setAttribute('data-element-id', element.id);
                circle.setAttribute('data-point-index', index);
                circle.style.cursor = 'pointer';

                // Highlight on hover
                circle.addEventListener('mouseenter', () => {
                    circle.setAttribute('r', '7');
                    circle.setAttribute('fill', '#00a2ed');
                });
                circle.addEventListener('mouseleave', () => {
                    circle.setAttribute('r', '5');
                    circle.setAttribute('fill', '#0078d4');
                });

                // Click to select connection point
                circle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleConnectionPointClick(element, point, index);
                });

                this.connectionPointsLayer.appendChild(circle);
            });
        });
    }

    /**
     * Hide all connection points
     */
    hideAllConnectionPoints() {
        if (this.connectionPointsLayer) {
            this.connectionPointsLayer.innerHTML = '';
        }
    }

    /**
     * Get connection points for an element (top, bottom, left, right, center)
     */
    getConnectionPoints(element) {
        const x = element.position?.x || 0;
        const y = element.position?.y || 0;
        const w = element.size?.width || 100;
        const h = element.size?.height || 60;

        return [
            { x: x + w / 2, y: y, name: 'top' },           // Top center
            { x: x + w, y: y + h / 2, name: 'right' },     // Right center
            { x: x + w / 2, y: y + h, name: 'bottom' },    // Bottom center
            { x: x, y: y + h / 2, name: 'left' }           // Left center
        ];
    }

    /**
     * Handle click on a connection point
     */
    handleConnectionPointClick(element, point, pointIndex) {
        if (!this.isConnecting) return;

        if (!this.connectionStart) {
            // First click - set start element
            this.connectionStart = {
                element: element,
                point: point,
                pointIndex: pointIndex
            };
            this.app.setStatus(`Связь от: ${element.name || element.id}. Выберите конечную фигуру.`);
        } else {
            // Second click - create connection
            if (this.connectionStart.element.id === element.id) {
                this.app.setStatus('Нельзя соединить элемент с самим собой');
                return;
            }

            this.createConnectionFromStencil(
                this.connectionStart.element,
                this.connectionStart.point,
                element,
                point
            );

            // Reset connection mode
            this.connectionStart = null;
            this.clearTempConnectionLine();
            this.app.setStatus('Связь создана. Выберите следующую пару фигур или нажмите Escape для выхода.');
        }
    }

    /**
     * Update temporary connection line while connecting
     */
    updateTempConnectionLine(mouseX, mouseY) {
        if (!this.tempConnectionLayer || !this.connectionStart) return;

        this.tempConnectionLayer.innerHTML = '';

        const startX = this.connectionStart.point.x;
        const startY = this.connectionStart.point.y;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', mouseX);
        line.setAttribute('y2', mouseY);
        line.setAttribute('stroke', '#0078d4');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
        line.setAttribute('marker-end', 'url(#arrowhead)');

        this.tempConnectionLayer.appendChild(line);
    }

    /**
     * Clear temporary connection line
     */
    clearTempConnectionLine() {
        if (this.tempConnectionLayer) {
            this.tempConnectionLayer.innerHTML = '';
        }
    }

    /**
     * Create connection from stencil data
     */
    createConnectionFromStencil(sourceElement, sourcePoint, targetElement, targetPoint) {
        const stencil = this.connectionStencil;
        const xml = stencil?.xml || '';

        // Parse connection style from stencil
        const style = {
            strokeColor: '#333',
            strokeWidth: '2',
            dashed: false,
            hasArrow: true
        };

        // Extract style from XML
        const strokeMatch = xml.match(/strokeColor=#([A-Fa-f0-9]{6})/);
        if (strokeMatch) style.strokeColor = '#' + strokeMatch[1];

        const widthMatch = xml.match(/strokeWidth=(\d+)/);
        if (widthMatch) style.strokeWidth = widthMatch[1];

        style.dashed = xml.includes('dashed=1');
        style.hasArrow = xml.includes('endArrow=classic') || xml.includes('endArrow=block');

        // Determine connection type based on stencil title
        const title = stencil?.title || '';
        if (title.includes('predecessor') || title.includes('Поток управления') || title.includes('is predecessor')) {
            style.strokeWidth = '3';  // Thicker for VAD process flow
            style.strokeColor = '#333';
        }

        this.addConnection(
            sourceElement.id,
            targetElement.id,
            style,
            sourcePoint.name,
            targetPoint.name,
            stencil?.title
        );
    }

    setDiagram(diagram) {
        this.currentDiagram = diagram;
        this.canvasTitle.textContent = diagram.name;
        this.elements = diagram.elements || [];
        this.connections = diagram.connections || [];
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

        this.canvasEmpty.style.display = 'none';
        this.svg.style.display = 'block';

        this.diagramContent.innerHTML = '';
        this.connectionLayer.innerHTML = '';
        this.selectionLayer.innerHTML = '';

        const elements = this.elements;

        if (elements.length === 0) {
            this.svg.setAttribute('width', '800');
            this.svg.setAttribute('height', '600');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '400');
            text.setAttribute('y', '300');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#999');
            text.setAttribute('font-size', '16');
            text.textContent = 'Диаграмма пуста. Перетащите элементы из трафаретов.';
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

        const padding = 60;
        const width = Math.max(800, maxX + padding);
        const height = Math.max(600, maxY + padding);
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);

        // Render connections first (so they're behind shapes)
        this.connections.forEach(conn => {
            this.renderConnection(conn);
        });

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

        this.canvasEmpty.style.display = 'none';
        this.svg.style.display = 'block';

        this.diagramContent.innerHTML = '';
        this.connectionLayer.innerHTML = '';

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(this.rawXml, 'text/xml');

            const cells = xmlDoc.querySelectorAll('mxCell');
            const elementMap = new Map();
            const edges = [];

            // First pass: collect all elements
            cells.forEach(cell => {
                const id = cell.getAttribute('id');
                const geometry = cell.querySelector('mxGeometry');

                if (id === '0' || id === '1') return;

                const value = cell.getAttribute('value') || '';
                const style = cell.getAttribute('style') || '';
                const isVertex = cell.getAttribute('vertex') === '1';
                const isEdge = cell.getAttribute('edge') === '1';
                const source = cell.getAttribute('source');
                const target = cell.getAttribute('target');

                if (geometry || isEdge) {
                    const elementData = {
                        id,
                        value,
                        style,
                        isVertex,
                        isEdge,
                        source,
                        target,
                        geometry: geometry ? {
                            x: parseFloat(geometry.getAttribute('x') || '0'),
                            y: parseFloat(geometry.getAttribute('y') || '0'),
                            width: parseFloat(geometry.getAttribute('width') || '100'),
                            height: parseFloat(geometry.getAttribute('height') || '60'),
                            relative: geometry.getAttribute('relative') === '1'
                        } : null,
                        parent: cell.getAttribute('parent')
                    };

                    elementMap.set(id, elementData);

                    if (isEdge) {
                        edges.push(elementData);
                    }
                }
            });

            // Populate this.elements and this.connections for re-rendering support
            this.elements = [];
            this.connections = [];

            // Convert XML elements to internal element format
            elementMap.forEach(el => {
                if (el.isVertex && el.geometry && !el.geometry.relative) {
                    const parsedStyle = this.parseStyle(el.style);
                    const shapeType = this.getShapeType(el.style);
                    // Check if this is a diagram title element (partialRectangle shape)
                    const isDiagramTitle = shapeType === 'partialRect' ||
                        el.style.includes('shape=partialRectangle') ||
                        (el.id && (el.id.includes('title') || el.id.includes('process_title')));
                    this.elements.push({
                        id: el.id,
                        name: el.value,
                        type: shapeType,
                        shapeType: shapeType,
                        position: { x: el.geometry.x, y: el.geometry.y },
                        size: { width: el.geometry.width, height: el.geometry.height },
                        style: parsedStyle,
                        xmlStyle: el.style,
                        isDiagramTitle: isDiagramTitle
                    });
                }
            });

            // Convert edges to internal connection format
            edges.forEach(edge => {
                const parsedStyle = this.parseStyle(edge.style);
                const hasArrow = edge.style.includes('endArrow=classic') || edge.style.includes('endArrow=block');
                const isDashed = edge.style.includes('dashed=1');
                this.connections.push({
                    id: edge.id,
                    sourceId: edge.source,
                    targetId: edge.target,
                    label: edge.value || '',
                    style: {
                        strokeColor: parsedStyle.strokeColor || '#333',
                        strokeWidth: parsedStyle.strokeWidth || '2',
                        dashed: isDashed,
                        hasArrow: hasArrow
                    },
                    sourcePoint: 'right',
                    targetPoint: 'left'
                });
            });

            // Sync with diagram object if available
            if (this.currentDiagram) {
                this.currentDiagram.elements = this.elements;
                this.currentDiagram.connections = this.connections;
            }

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

            const padding = 60;
            const width = Math.max(800, maxX + padding);
            const height = Math.max(600, maxY + padding);
            this.svg.setAttribute('width', width);
            this.svg.setAttribute('height', height);

            // Render connections first (so they're behind shapes)
            this.connections.forEach(conn => {
                this.renderConnection(conn);
            });

            // Render vertices using elements array
            this.elements.forEach(element => {
                this.renderElement(element);
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

    renderXmlEdge(edge, elementMap) {
        const style = this.parseStyle(edge.style);
        const strokeColor = style.strokeColor || '#333';
        const strokeWidth = style.strokeWidth || '2';
        const isDashed = edge.style.includes('dashed=1');

        // Get source and target positions
        const sourceEl = elementMap.get(edge.source);
        const targetEl = elementMap.get(edge.target);

        if (sourceEl?.geometry && targetEl?.geometry) {
            const sg = sourceEl.geometry;
            const tg = targetEl.geometry;

            // Calculate connection points (center of edges)
            const x1 = sg.x + sg.width;
            const y1 = sg.y + sg.height / 2;
            const x2 = tg.x;
            const y2 = tg.y + tg.height / 2;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', strokeColor);
            line.setAttribute('stroke-width', strokeWidth);

            if (isDashed) {
                line.setAttribute('stroke-dasharray', '4 4');
            }

            if (edge.style.includes('endArrow=classic') || edge.style.includes('endArrow=block')) {
                line.setAttribute('marker-end', 'url(#arrowhead)');
            }

            this.connectionLayer.appendChild(line);
        }
    }

    renderXmlElement(el, elementMap) {
        if (!el.geometry || el.geometry.relative) return;

        const { x, y, width, height } = el.geometry;
        const style = this.parseStyle(el.style);
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-id', el.id);
        g.setAttribute('class', 'diagram-element');
        g.setAttribute('transform', `translate(0, 0)`);

        // Determine shape type and render
        const shapeType = this.getShapeType(el.style);
        this.renderShape(g, shapeType, x, y, width, height, style, el.value);

        // Make interactive
        this.makeElementInteractive(g, {
            id: el.id,
            name: el.value,
            type: shapeType,
            position: { x, y },
            size: { width, height },
            style: style
        });

        this.diagramContent.appendChild(g);
    }

    getShapeType(styleString) {
        if (styleString.includes('shape=mxgraph.arrows2.arrow')) return 'chevron';
        if (styleString.includes('shape=hexagon')) return 'hexagon';
        if (styleString.includes('shape=rhombus') || styleString.includes('rhombus')) return 'diamond';
        if (styleString.includes('shape=ellipse') || styleString.includes('ellipse;')) return 'ellipse';
        if (styleString.includes('shape=parallelogram')) return 'parallelogram';
        if (styleString.includes('shape=note')) return 'note';
        if (styleString.includes('swimlane')) return 'swimlane';
        if (styleString.includes('shape=umlActor')) return 'actor';
        if (styleString.includes('rounded=1')) return 'roundedRect';
        if (styleString.includes('shape=partialRectangle')) return 'partialRect';
        if (styleString.includes('text;')) return 'text';
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
            case 'chevron':
                shape = this.createChevron(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'hexagon':
                shape = this.createHexagon(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'diamond':
                shape = this.createDiamond(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'ellipse':
                shape = this.createEllipse(x, y, width, height, fillColor, strokeColor, strokeWidth);
                break;
            case 'parallelogram':
                shape = this.createParallelogram(x, y, width, height, fillColor, strokeColor, strokeWidth);
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
            case 'text':
                // Text-only element
                break;
            default:
                shape = this.createRect(x, y, width, height, fillColor, strokeColor, strokeWidth);
        }

        if (shape) {
            g.appendChild(shape);
        }

        // Add label if not swimlane (swimlane handles its own label)
        if (label && shapeType !== 'swimlane' && shapeType !== 'text') {
            if (shapeType === 'partialRect') {
                // For partial rect (title shapes), use left-aligned text with padding
                const text = this.createLabel(x + 8, y + height / 2, label, { ...style, align: 'left' }, width, height);
                g.appendChild(text);
            } else {
                const text = this.createLabel(x + width / 2, y + height / 2, label, style, width, height);
                g.appendChild(text);
            }
        } else if (shapeType === 'text' && label) {
            const text = this.createLabel(x + width / 2, y + height / 2, label, style, width, height);
            g.appendChild(text);
        }
    }

    createChevron(x, y, width, height, fill, stroke, strokeWidth) {
        // VAD arrow/chevron shape - proper ARIS-style
        const notchDepth = width * 0.1;
        const arrowTip = width * 0.15;

        const points = [
            [x, y],
            [x + width - arrowTip, y],
            [x + width, y + height / 2],
            [x + width - arrowTip, y + height],
            [x, y + height],
            [x + notchDepth, y + height / 2]
        ].map(p => p.join(',')).join(' ');

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', fill);
        polygon.setAttribute('stroke', stroke);
        polygon.setAttribute('stroke-width', strokeWidth);
        return polygon;
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
        // PartialRectangle shape - has only left border (like a title/label bar)
        // Similar to shape=partialRectangle;html=1;right=0;top=0;bottom=0
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Background rect (transparent/light fill)
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', fill === 'none' ? 'transparent' : (fill || 'transparent'));
        rect.setAttribute('stroke', 'none');
        g.appendChild(rect);

        // Left border line only
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', y);
        line.setAttribute('x2', x);
        line.setAttribute('y2', y + height);
        line.setAttribute('stroke', stroke || '#000000');
        line.setAttribute('stroke-width', strokeWidth || '2');
        g.appendChild(line);

        return g;
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

    createParallelogram(x, y, width, height, fill, stroke, strokeWidth) {
        const skew = width * 0.2;
        const points = [
            [x + skew, y],
            [x + width, y],
            [x + width - skew, y + height],
            [x, y + height]
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

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', stroke);
        rect.setAttribute('stroke-width', strokeWidth);
        g.appendChild(rect);

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

        const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        head.setAttribute('cx', cx);
        head.setAttribute('cy', y + headRadius);
        head.setAttribute('r', headRadius);
        head.setAttribute('fill', fill);
        head.setAttribute('stroke', stroke);
        head.setAttribute('stroke-width', strokeWidth);
        g.appendChild(head);

        const body = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        body.setAttribute('x1', cx);
        body.setAttribute('y1', bodyTop);
        body.setAttribute('x2', cx);
        body.setAttribute('y2', bodyBottom);
        body.setAttribute('stroke', stroke);
        body.setAttribute('stroke-width', strokeWidth);
        g.appendChild(body);

        const arms = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arms.setAttribute('x1', x + width * 0.2);
        arms.setAttribute('y1', bodyTop + (bodyBottom - bodyTop) * 0.3);
        arms.setAttribute('x2', x + width * 0.8);
        arms.setAttribute('y2', bodyTop + (bodyBottom - bodyTop) * 0.3);
        arms.setAttribute('stroke', stroke);
        arms.setAttribute('stroke-width', strokeWidth);
        g.appendChild(arms);

        const leftLeg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftLeg.setAttribute('x1', cx);
        leftLeg.setAttribute('y1', bodyBottom);
        leftLeg.setAttribute('x2', x + width * 0.25);
        leftLeg.setAttribute('y2', legBottom);
        leftLeg.setAttribute('stroke', stroke);
        leftLeg.setAttribute('stroke-width', strokeWidth);
        g.appendChild(leftLeg);

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

    createLabel(x, y, text, style, maxWidth = null, maxHeight = null) {
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);

        // Handle text alignment
        const align = style.align || 'center';
        if (align === 'left') {
            textEl.setAttribute('text-anchor', 'start');
        } else if (align === 'right') {
            textEl.setAttribute('text-anchor', 'end');
        } else {
            textEl.setAttribute('text-anchor', 'middle');
        }

        textEl.setAttribute('dominant-baseline', 'middle');
        textEl.setAttribute('font-size', style.fontSize || '12');
        textEl.setAttribute('fill', style.fontColor || '#333');

        // Handle font style (bold)
        if (style.fontStyle === 'bold' || style.fontStyle === '1') {
            textEl.setAttribute('font-weight', 'bold');
        }

        textEl.setAttribute('class', 'element-label');
        textEl.style.pointerEvents = 'none';

        const fontSize = parseInt(style.fontSize || '12');
        const lineHeight = fontSize * 1.3;

        // Handle multiline text from explicit newlines
        let lines = text.split(/\\n|\n/);

        // If we have maxWidth, wrap text to fit
        if (maxWidth && maxWidth > 0) {
            const wrappedLines = [];
            const avgCharWidth = fontSize * 0.6; // Approximate character width
            const maxCharsPerLine = Math.floor((maxWidth - 10) / avgCharWidth);

            lines.forEach(line => {
                if (line.length <= maxCharsPerLine) {
                    wrappedLines.push(line);
                } else {
                    // Word wrap
                    const words = line.split(' ');
                    let currentLine = '';

                    words.forEach(word => {
                        const testLine = currentLine ? currentLine + ' ' + word : word;
                        if (testLine.length <= maxCharsPerLine) {
                            currentLine = testLine;
                        } else {
                            if (currentLine) {
                                wrappedLines.push(currentLine);
                            }
                            // If word is longer than max, split it
                            if (word.length > maxCharsPerLine) {
                                let remaining = word;
                                while (remaining.length > maxCharsPerLine) {
                                    wrappedLines.push(remaining.substring(0, maxCharsPerLine - 1) + '-');
                                    remaining = remaining.substring(maxCharsPerLine - 1);
                                }
                                currentLine = remaining;
                            } else {
                                currentLine = word;
                            }
                        }
                    });
                    if (currentLine) {
                        wrappedLines.push(currentLine);
                    }
                }
            });
            lines = wrappedLines;
        }

        // Limit number of lines if maxHeight is set
        if (maxHeight && maxHeight > 0) {
            const maxLines = Math.floor((maxHeight - 10) / lineHeight);
            if (lines.length > maxLines && maxLines > 0) {
                lines = lines.slice(0, maxLines);
                if (lines.length > 0) {
                    const lastLine = lines[lines.length - 1];
                    lines[lines.length - 1] = lastLine.substring(0, lastLine.length - 3) + '...';
                }
            }
        }

        const totalHeight = lines.length * lineHeight;
        const startY = y - totalHeight / 2 + lineHeight / 2;

        if (lines.length === 1) {
            textEl.textContent = lines[0];
        } else {
            lines.forEach((line, i) => {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.setAttribute('x', x);
                tspan.setAttribute('y', startY + i * lineHeight);
                tspan.textContent = line;
                textEl.appendChild(tspan);
            });
        }

        return textEl;
    }

    renderConnection(conn) {
        const sourceEl = this.elements.find(e => e.id === conn.sourceId);
        const targetEl = this.elements.find(e => e.id === conn.targetId);

        if (!sourceEl || !targetEl) return;

        // Get connection points based on stored point names or calculate optimal
        const sourcePoints = this.getConnectionPoints(sourceEl);
        const targetPoints = this.getConnectionPoints(targetEl);

        let sourcePoint, targetPoint;

        // Find named connection points or use defaults
        if (conn.sourcePoint) {
            sourcePoint = sourcePoints.find(p => p.name === conn.sourcePoint) || sourcePoints[1]; // default right
        } else {
            sourcePoint = sourcePoints[1]; // right
        }

        if (conn.targetPoint) {
            targetPoint = targetPoints.find(p => p.name === conn.targetPoint) || targetPoints[3]; // default left
        } else {
            targetPoint = targetPoints[3]; // left
        }

        const x1 = sourcePoint.x;
        const y1 = sourcePoint.y;
        const x2 = targetPoint.x;
        const y2 = targetPoint.y;

        // Create connection group
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-connection-id', conn.id);
        g.setAttribute('class', 'connection-group');

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', conn.style?.strokeColor || '#333');
        line.setAttribute('stroke-width', conn.style?.strokeWidth || '2');
        line.setAttribute('class', 'connection-line');

        // Determine arrow marker based on style
        if (conn.style?.hasArrow !== false) {
            const strokeWidth = parseInt(conn.style?.strokeWidth) || 2;
            if (strokeWidth >= 3) {
                line.setAttribute('marker-end', 'url(#arrowhead-thick)');
            } else if (conn.style?.dashed) {
                line.setAttribute('marker-end', 'url(#arrowhead-dashed)');
            } else {
                line.setAttribute('marker-end', 'url(#arrowhead)');
            }
        }

        if (conn.style?.dashed) {
            line.setAttribute('stroke-dasharray', '4 4');
        }

        g.appendChild(line);

        // Add connection label if present
        if (conn.label) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', midX);
            label.setAttribute('y', midY - 5);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '10');
            label.setAttribute('fill', '#666');
            label.textContent = conn.label;
            g.appendChild(label);
        }

        // Make connection selectable
        g.style.cursor = 'pointer';
        g.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectConnection(conn, g);
        });

        this.connectionLayer.appendChild(g);
    }

    /**
     * Select a connection
     */
    selectConnection(conn, g) {
        this.deselectAll();
        this.selectedConnection = conn;

        // Highlight the connection
        const line = g.querySelector('line');
        if (line) {
            line.setAttribute('stroke', '#0078d4');
            line.setAttribute('stroke-width', (parseInt(conn.style?.strokeWidth) || 2) + 1);
        }

        this.app.setStatus(`Выбрана связь: ${conn.label || conn.id}`);
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

        const shapeType = element.shapeType || this.getElementShapeType(element.type);
        this.renderShape(g, shapeType, x, y, width, height, {
            fillColor: style.fillColor || '#dae8fc',
            strokeColor: style.strokeColor || '#6c8ebf',
            ...style
        }, element.name);

        // Make interactive
        this.makeElementInteractive(g, element);

        this.diagramContent.appendChild(g);
    }

    makeElementInteractive(g, element) {
        g.style.cursor = 'move';

        // Selection on click
        g.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectElement(element, g);
        });

        // Double-click to edit label
        g.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startEditingLabel(element, g);
        });

        // Drag to move
        g.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.stopPropagation();

            this.selectElement(element, g);
            this.startDragging(e, element, g);
        });
    }

    selectElement(element, g) {
        this.deselectAll();
        this.selectedElement = element;

        // Add selection indicator
        const bbox = g.getBBox();
        const selRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        selRect.setAttribute('x', bbox.x - 3);
        selRect.setAttribute('y', bbox.y - 3);
        selRect.setAttribute('width', bbox.width + 6);
        selRect.setAttribute('height', bbox.height + 6);
        selRect.setAttribute('fill', 'none');
        selRect.setAttribute('stroke', '#0078d4');
        selRect.setAttribute('stroke-width', '2');
        selRect.setAttribute('stroke-dasharray', '4 2');
        selRect.setAttribute('class', 'selection-rect');
        this.selectionLayer.appendChild(selRect);

        // Add resize handles
        this.addResizeHandles(bbox);

        // Update properties panel
        if (this.app.propertiesController) {
            this.app.propertiesController.showElementProperties(element);
        }

        this.app.setStatus(`Выбран элемент: ${element.name || element.id}`);
    }

    addResizeHandles(bbox) {
        const handleSize = 8;
        const positions = [
            { x: bbox.x - handleSize/2, y: bbox.y - handleSize/2 },
            { x: bbox.x + bbox.width/2 - handleSize/2, y: bbox.y - handleSize/2 },
            { x: bbox.x + bbox.width - handleSize/2, y: bbox.y - handleSize/2 },
            { x: bbox.x + bbox.width - handleSize/2, y: bbox.y + bbox.height/2 - handleSize/2 },
            { x: bbox.x + bbox.width - handleSize/2, y: bbox.y + bbox.height - handleSize/2 },
            { x: bbox.x + bbox.width/2 - handleSize/2, y: bbox.y + bbox.height - handleSize/2 },
            { x: bbox.x - handleSize/2, y: bbox.y + bbox.height - handleSize/2 },
            { x: bbox.x - handleSize/2, y: bbox.y + bbox.height/2 - handleSize/2 }
        ];

        positions.forEach(pos => {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            handle.setAttribute('x', pos.x);
            handle.setAttribute('y', pos.y);
            handle.setAttribute('width', handleSize);
            handle.setAttribute('height', handleSize);
            handle.setAttribute('fill', '#0078d4');
            handle.setAttribute('stroke', '#fff');
            handle.setAttribute('stroke-width', '1');
            handle.setAttribute('class', 'resize-handle');
            this.selectionLayer.appendChild(handle);
        });
    }

    deselectAll() {
        this.selectedElement = null;
        this.selectionLayer.innerHTML = '';

        if (this.app.propertiesController) {
            this.app.propertiesController.clear();
        }
    }

    startDragging(e, element, g) {
        this.isDragging = true;
        const scale = this.zoomLevel / 100;
        const rect = this.svg.getBoundingClientRect();

        this.dragOffset = {
            x: (e.clientX - rect.left) / scale - element.position.x,
            y: (e.clientY - rect.top) / scale - element.position.y
        };

        const onMouseMove = (moveEvent) => {
            if (!this.isDragging) return;

            const newX = (moveEvent.clientX - rect.left) / scale - this.dragOffset.x;
            const newY = (moveEvent.clientY - rect.top) / scale - this.dragOffset.y;

            element.position.x = Math.max(0, newX);
            element.position.y = Math.max(0, newY);

            this.renderDiagram();
            this.selectElement(element, this.diagramContent.querySelector(`[data-id="${element.id}"]`));
        };

        const onMouseUp = () => {
            this.isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    startEditingLabel(element, g) {
        const labelEl = g.querySelector('.element-label, text');
        if (!labelEl) return;

        const bbox = labelEl.getBBox();
        const scale = this.zoomLevel / 100;
        const svgRect = this.svg.getBoundingClientRect();

        const input = document.createElement('input');
        input.type = 'text';
        input.value = element.name || '';
        input.style.cssText = `
            position: fixed;
            left: ${svgRect.left + (bbox.x + bbox.width/2) * scale - 50}px;
            top: ${svgRect.top + bbox.y * scale - 10}px;
            width: 100px;
            padding: 4px 8px;
            border: 2px solid #0078d4;
            border-radius: 3px;
            font-size: 12px;
            text-align: center;
            z-index: 3000;
        `;

        document.body.appendChild(input);
        input.focus();
        input.select();

        const finishEditing = () => {
            element.name = input.value;
            document.body.removeChild(input);

            // If editing diagram title element, also update the diagram name
            if (element.isDiagramTitle && this.currentDiagram) {
                this.currentDiagram.name = input.value;
                // Update canvas title
                if (this.canvasTitle) {
                    this.canvasTitle.textContent = input.value;
                }
                // Notify app to update tabs
                if (this.app && this.app.renderTabs) {
                    this.app.renderTabs();
                }
            }

            this.renderDiagram();

            // Reselect the element
            const newG = this.diagramContent.querySelector(`[data-id="${element.id}"]`);
            if (newG) {
                this.selectElement(element, newG);
            }
        };

        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            } else if (e.key === 'Escape') {
                document.body.removeChild(input);
            }
        });
    }

    deleteSelectedElement() {
        if (!this.selectedElement || !this.currentDiagram) return;

        const index = this.elements.findIndex(e => e.id === this.selectedElement.id);
        if (index !== -1) {
            this.elements.splice(index, 1);

            // Also remove connections involving this element
            this.connections = this.connections.filter(
                c => c.sourceId !== this.selectedElement.id && c.targetId !== this.selectedElement.id
            );

            this.deselectAll();
            this.renderDiagram();
            this.app.setStatus('Элемент удален');
        }
    }

    copySelected() {
        if (!this.selectedElement) return;

        this.clipboard = JSON.parse(JSON.stringify(this.selectedElement));
        this.app.setStatus('Элемент скопирован');
    }

    cutSelected() {
        if (!this.selectedElement) return;

        this.copySelected();
        this.deleteSelectedElement();
        this.app.setStatus('Элемент вырезан');
    }

    pasteFromClipboard() {
        if (!this.clipboard || !this.currentDiagram) return;

        const newElement = JSON.parse(JSON.stringify(this.clipboard));
        newElement.id = 'el_' + Date.now();
        newElement.position.x += 20;
        newElement.position.y += 20;

        this.elements.push(newElement);
        this.renderDiagram();

        // Select the pasted element
        const g = this.diagramContent.querySelector(`[data-id="${newElement.id}"]`);
        if (g) {
            this.selectElement(newElement, g);
        }

        this.app.setStatus('Элемент вставлен');
    }

    selectAll() {
        // For now, just select the first element
        if (this.elements.length > 0) {
            const first = this.elements[0];
            const g = this.diagramContent.querySelector(`[data-id="${first.id}"]`);
            if (g) {
                this.selectElement(first, g);
            }
        }
    }

    getElementShapeType(elementType) {
        switch (elementType) {
            case 'baseVAD':
            case 'detailVAD':
            case 'externVAD':
            case 'vad-function':
                return 'chevron';
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
            case 'product':
                return 'parallelogram';
            default:
                return 'rect';
        }
    }

    addElementFromStencil(stencilData) {
        if (!this.currentDiagram) {
            this.app.setStatus('Сначала создайте диаграмму (Файл → Создать)');
            return;
        }

        this.canvasEmpty.style.display = 'none';
        this.svg.style.display = 'block';

        // Parse stencil to get shape type and style
        const shapeType = this.detectShapeType(stencilData.xml);
        const style = this.extractStyleFromXml(stencilData.xml);

        const element = {
            id: 'el_' + (this.elementIdCounter++),
            name: stencilData.title || 'Элемент',
            type: 'shape',
            shapeType: shapeType,
            position: { x: 100 + (this.elements.length % 5) * 20, y: 100 + (this.elements.length % 5) * 20 },
            size: { width: stencilData.w || 100, height: stencilData.h || 60 },
            style: style
        };

        this.elements.push(element);
        this.currentDiagram.elements = this.elements;
        this.renderDiagram();

        // Select the new element
        const g = this.diagramContent.querySelector(`[data-id="${element.id}"]`);
        if (g) {
            this.selectElement(element, g);
        }
    }

    addElementFromDrop(stencilXml, notation, x, y, stencilIndex) {
        if (!this.currentDiagram) {
            this.app.setStatus('Сначала создайте диаграмму');
            return;
        }

        this.canvasEmpty.style.display = 'none';
        this.svg.style.display = 'block';

        // Get stencil data from controller
        let stencilData = null;
        if (this.app.stencilController && this.app.stencilController.currentStencils) {
            stencilData = this.app.stencilController.currentStencils[parseInt(stencilIndex)];
        }

        const shapeType = this.detectShapeType(stencilXml);
        const style = this.extractStyleFromXml(stencilXml);

        const element = {
            id: 'el_' + (this.elementIdCounter++),
            name: stencilData?.title || 'Новый элемент',
            type: 'shape',
            shapeType: shapeType,
            position: { x: Math.max(10, x - 50), y: Math.max(10, y - 30) },
            size: {
                width: stencilData?.w || 100,
                height: stencilData?.h || 60
            },
            style: style
        };

        this.elements.push(element);
        this.currentDiagram.elements = this.elements;
        this.renderDiagram();

        // Select the new element
        const g = this.diagramContent.querySelector(`[data-id="${element.id}"]`);
        if (g) {
            this.selectElement(element, g);
        }

        this.app.setStatus(`Добавлен элемент: ${element.name}`);
    }

    detectShapeType(xml) {
        if (!xml) return 'rect';

        if (xml.includes('shape=mxgraph.arrows2.arrow')) return 'chevron';
        if (xml.includes('shape=hexagon')) return 'hexagon';
        if (xml.includes('shape=rhombus')) return 'diamond';
        if (xml.includes('ellipse')) return 'ellipse';
        if (xml.includes('shape=parallelogram')) return 'parallelogram';
        if (xml.includes('shape=note')) return 'note';
        if (xml.includes('rounded=1')) return 'roundedRect';
        if (xml.includes('endArrow=')) return 'connection';
        if (xml.includes('text;')) return 'text';

        return 'rect';
    }

    extractStyleFromXml(xml) {
        if (!xml) return {};

        const style = {};

        // Extract fillColor
        const fillMatch = xml.match(/fillColor=#([A-Fa-f0-9]{6})/);
        if (fillMatch) {
            style.fillColor = '#' + fillMatch[1];
        }

        // Extract strokeColor
        const strokeMatch = xml.match(/strokeColor=#([A-Fa-f0-9]{6})/);
        if (strokeMatch) {
            style.strokeColor = '#' + strokeMatch[1];
        }

        return style;
    }

    // Connection creation
    addConnection(sourceId, targetId, style = {}, sourcePoint = 'right', targetPoint = 'left', label = '') {
        const connection = {
            id: 'conn_' + Date.now(),
            sourceId,
            targetId,
            sourcePoint: sourcePoint,
            targetPoint: targetPoint,
            label: label,
            style: {
                strokeColor: style.strokeColor || '#333',
                strokeWidth: style.strokeWidth || '2',
                dashed: style.dashed || false,
                hasArrow: style.hasArrow !== false
            }
        };

        this.connections.push(connection);
        if (this.currentDiagram) {
            this.currentDiagram.connections = this.connections;
        }
        this.renderDiagram();

        // Re-show connection points if still in connection mode
        if (this.isConnecting) {
            this.showAllConnectionPoints();
        }
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
        this.elements = [];
        this.connections = [];
        this.selectedElement = null;
        this.setupCanvas();
    }
}
