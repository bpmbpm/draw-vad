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

            // Parse stencil library (mxlibrary format is JSON wrapped in XML tags)
            let stencils;
            try {
                stencils = JSON.parse(stencilData);
            } catch (e) {
                // If it's wrapped in <mxlibrary> tags, extract the JSON (use [\s\S]* for multiline matching)
                const match = stencilData.match(/<mxlibrary>([\s\S]*)<\/mxlibrary>/);
                if (match) {
                    stencils = JSON.parse(match[1]);
                } else {
                    throw new Error('Invalid stencil format: not valid JSON and no <mxlibrary> tags found');
                }
            }

            if (!stencils || stencils.length === 0) {
                this.stencilContainer.innerHTML = '<p style="padding: 10px; color: #999;">Трафареты не найдены</p>';
                return;
            }

            // Separate shapes and connections
            const shapes = [];
            const connections = [];
            stencils.forEach((stencil, index) => {
                stencil._originalIndex = index;
                if (this.isConnectionStencil(stencil)) {
                    connections.push(stencil);
                } else {
                    shapes.push(stencil);
                }
            });

            let html = '';

            // Shapes section
            if (shapes.length > 0) {
                html += '<div class="stencil-section"><div class="stencil-section-header">Фигуры (Shapes)</div>';
                html += '<div class="stencil-grid">';
                shapes.forEach((stencil) => {
                    const title = stencil.title || `Элемент`;
                    const previewWidth = Math.min(stencil.w, 70);
                    const previewHeight = Math.min(stencil.h, 50);
                    html += `
                        <div class="stencil-item"
                             data-stencil-index="${stencil._originalIndex}"
                             data-notation="${notationType}"
                             data-is-connection="false"
                             draggable="true"
                             title="${title}">
                            <div class="stencil-preview" style="width: ${previewWidth}px; height: ${previewHeight}px;">
                                ${this.renderStencilPreview(stencil, previewWidth, previewHeight)}
                            </div>
                            <div class="stencil-label">${title}</div>
                        </div>
                    `;
                });
                html += '</div></div>';
            }

            // Connections section
            if (connections.length > 0) {
                html += '<div class="stencil-section"><div class="stencil-section-header">Связи (Connections)</div>';
                html += '<div class="stencil-grid stencil-connections">';
                connections.forEach((stencil) => {
                    const title = stencil.title || `Связь`;
                    html += `
                        <div class="stencil-item stencil-connection-item"
                             data-stencil-index="${stencil._originalIndex}"
                             data-notation="${notationType}"
                             data-is-connection="true"
                             draggable="true"
                             title="${title}">
                            <div class="stencil-preview connection-preview" style="width: 70px; height: 30px;">
                                ${this.renderConnectionPreview(stencil)}
                            </div>
                            <div class="stencil-label">${title}</div>
                        </div>
                    `;
                });
                html += '</div></div>';
            }

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

    /**
     * Check if a stencil is a connection/edge
     */
    isConnectionStencil(stencil) {
        if (!stencil.xml) return false;
        return stencil.xml.includes('edge="1"') ||
               stencil.xml.includes('endArrow=') ||
               stencil.xml.includes('edge=\\"1\\"');
    }

    /**
     * Render the actual shape preview in the stencil panel
     */
    renderStencilPreview(stencil, width, height) {
        const xml = stencil.xml || '';
        const style = this.extractStyleFromXml(xml);
        const shapeType = this.detectShapeType(xml);

        const fillColor = style.fillColor || '#dae8fc';
        const strokeColor = style.strokeColor || '#6c8ebf';

        // Scale to fit preview
        const scale = Math.min(width / stencil.w, height / stencil.h) * 0.9;
        const scaledW = stencil.w * scale;
        const scaledH = stencil.h * scale;
        const offsetX = (width - scaledW) / 2;
        const offsetY = (height - scaledH) / 2;

        let shapeSvg = '';

        switch (shapeType) {
            case 'chevron':
                // ARIS VAD arrow shape
                const notchDepth = scaledW * 0.1;
                const arrowTip = scaledW * 0.15;
                const points = [
                    `${offsetX},${offsetY}`,
                    `${offsetX + scaledW - arrowTip},${offsetY}`,
                    `${offsetX + scaledW},${offsetY + scaledH / 2}`,
                    `${offsetX + scaledW - arrowTip},${offsetY + scaledH}`,
                    `${offsetX},${offsetY + scaledH}`,
                    `${offsetX + notchDepth},${offsetY + scaledH / 2}`
                ].join(' ');
                shapeSvg = `<polygon points="${points}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>`;
                break;

            case 'ellipse':
                shapeSvg = `<ellipse cx="${offsetX + scaledW/2}" cy="${offsetY + scaledH/2}" rx="${scaledW/2}" ry="${scaledH/2}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>`;
                break;

            case 'hexagon':
                const hPoints = [
                    `${offsetX + scaledW * 0.15},${offsetY}`,
                    `${offsetX + scaledW * 0.85},${offsetY}`,
                    `${offsetX + scaledW},${offsetY + scaledH / 2}`,
                    `${offsetX + scaledW * 0.85},${offsetY + scaledH}`,
                    `${offsetX + scaledW * 0.15},${offsetY + scaledH}`,
                    `${offsetX},${offsetY + scaledH / 2}`
                ].join(' ');
                shapeSvg = `<polygon points="${hPoints}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>`;
                break;

            case 'diamond':
                const dPoints = [
                    `${offsetX + scaledW / 2},${offsetY}`,
                    `${offsetX + scaledW},${offsetY + scaledH / 2}`,
                    `${offsetX + scaledW / 2},${offsetY + scaledH}`,
                    `${offsetX},${offsetY + scaledH / 2}`
                ].join(' ');
                shapeSvg = `<polygon points="${dPoints}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>`;
                break;

            case 'parallelogram':
                const skew = scaledW * 0.2;
                const pPoints = [
                    `${offsetX + skew},${offsetY}`,
                    `${offsetX + scaledW},${offsetY}`,
                    `${offsetX + scaledW - skew},${offsetY + scaledH}`,
                    `${offsetX},${offsetY + scaledH}`
                ].join(' ');
                shapeSvg = `<polygon points="${pPoints}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>`;
                break;

            case 'note':
                const foldSize = Math.min(10, scaledW * 0.15);
                const d = `M${offsetX},${offsetY} L${offsetX + scaledW - foldSize},${offsetY} L${offsetX + scaledW},${offsetY + foldSize} L${offsetX + scaledW},${offsetY + scaledH} L${offsetX},${offsetY + scaledH} Z`;
                shapeSvg = `<path d="${d}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>`;
                break;

            case 'roundedRect':
                shapeSvg = `<rect x="${offsetX}" y="${offsetY}" width="${scaledW}" height="${scaledH}" rx="5" ry="5" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>`;
                break;

            case 'actor':
                // UML Actor (stick figure)
                const cx = offsetX + scaledW / 2;
                const headR = scaledH * 0.12;
                const bodyTop = offsetY + headR * 2 + 2;
                const bodyBot = offsetY + scaledH * 0.6;
                const legBot = offsetY + scaledH;
                shapeSvg = `
                    <circle cx="${cx}" cy="${offsetY + headR}" r="${headR}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>
                    <line x1="${cx}" y1="${bodyTop}" x2="${cx}" y2="${bodyBot}" stroke="${strokeColor}" stroke-width="1"/>
                    <line x1="${offsetX + scaledW * 0.2}" y1="${bodyTop + (bodyBot-bodyTop)*0.3}" x2="${offsetX + scaledW * 0.8}" y2="${bodyTop + (bodyBot-bodyTop)*0.3}" stroke="${strokeColor}" stroke-width="1"/>
                    <line x1="${cx}" y1="${bodyBot}" x2="${offsetX + scaledW * 0.25}" y2="${legBot}" stroke="${strokeColor}" stroke-width="1"/>
                    <line x1="${cx}" y1="${bodyBot}" x2="${offsetX + scaledW * 0.75}" y2="${legBot}" stroke="${strokeColor}" stroke-width="1"/>
                `;
                break;

            case 'swimlane':
                const headerH = Math.min(15, scaledH * 0.2);
                shapeSvg = `
                    <rect x="${offsetX}" y="${offsetY}" width="${scaledW}" height="${scaledH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>
                    <rect x="${offsetX}" y="${offsetY}" width="${scaledW}" height="${headerH}" fill="${strokeColor}" stroke="${strokeColor}" stroke-width="1" fill-opacity="0.3"/>
                `;
                break;

            case 'partialRect':
                shapeSvg = `<rect x="${offsetX}" y="${offsetY}" width="${scaledW}" height="${scaledH}" fill="none" stroke="${strokeColor}" stroke-width="1"/>
                            <line x1="${offsetX}" y1="${offsetY}" x2="${offsetX}" y2="${offsetY + scaledH}" stroke="${strokeColor}" stroke-width="2"/>`;
                break;

            case 'text':
                shapeSvg = `<text x="${offsetX + scaledW/2}" y="${offsetY + scaledH/2}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#333">T</text>`;
                break;

            default:
                shapeSvg = `<rect x="${offsetX}" y="${offsetY}" width="${scaledW}" height="${scaledH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>`;
        }

        return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapeSvg}</svg>`;
    }

    /**
     * Render connection/arrow preview
     */
    renderConnectionPreview(stencil) {
        const xml = stencil.xml || '';
        const style = this.extractStyleFromXml(xml);

        const strokeColor = style.strokeColor || '#333333';
        const strokeWidth = style.strokeWidth || '2';
        const isDashed = xml.includes('dashed=1') || xml.includes('dashed=\\"1\\"');
        const hasArrow = xml.includes('endArrow=classic') || xml.includes('endArrow=block') ||
                        xml.includes('endArrow=\\"classic\\"') || xml.includes('endArrow=\\"block\\"');
        const noArrow = xml.includes('endArrow=none') || xml.includes('endArrow=\\"none\\"');

        const dashStyle = isDashed ? 'stroke-dasharray="4 3"' : '';

        // Create arrow marker
        let markerDef = '';
        let markerEnd = '';
        if (hasArrow && !noArrow) {
            const markerId = `arrow-${Math.random().toString(36).substr(2, 9)}`;
            markerDef = `<defs><marker id="${markerId}" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="${strokeColor}"/></marker></defs>`;
            markerEnd = `marker-end="url(#${markerId})"`;
        }

        return `<svg width="70" height="30" viewBox="0 0 70 30">
            ${markerDef}
            <line x1="5" y1="15" x2="60" y2="15" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dashStyle} ${markerEnd}/>
        </svg>`;
    }

    /**
     * Detect shape type from XML style string
     */
    detectShapeType(xml) {
        if (!xml) return 'rect';

        if (xml.includes('shape=mxgraph.arrows2.arrow')) return 'chevron';
        if (xml.includes('shape=hexagon')) return 'hexagon';
        if (xml.includes('shape=rhombus') || xml.includes('rhombus;')) return 'diamond';
        if (xml.includes('shape=ellipse') || xml.includes('ellipse;')) return 'ellipse';
        if (xml.includes('shape=parallelogram')) return 'parallelogram';
        if (xml.includes('shape=note')) return 'note';
        if (xml.includes('swimlane')) return 'swimlane';
        if (xml.includes('shape=umlActor')) return 'actor';
        if (xml.includes('rounded=1')) return 'roundedRect';
        if (xml.includes('shape=partialRectangle')) return 'partialRect';
        if (xml.includes('text;')) return 'text';

        return 'rect';
    }

    /**
     * Extract style properties from XML
     */
    extractStyleFromXml(xml) {
        const style = {};
        if (!xml) return style;

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

        // Extract strokeWidth
        const widthMatch = xml.match(/strokeWidth=(\d+)/);
        if (widthMatch) {
            style.strokeWidth = widthMatch[1];
        }

        return style;
    }

    attachStencilHandlers() {
        const stencilItems = this.stencilContainer.querySelectorAll('.stencil-item');

        stencilItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const stencilIndex = item.getAttribute('data-stencil-index');
                const notation = item.getAttribute('data-notation');
                const isConnection = item.getAttribute('data-is-connection') === 'true';
                const stencilData = this.currentStencils[stencilIndex];

                e.dataTransfer.setData('stencilIndex', stencilIndex);
                e.dataTransfer.setData('notation', notation);
                e.dataTransfer.setData('stencilXml', stencilData.xml);
                e.dataTransfer.setData('isConnection', isConnection ? 'true' : 'false');
                e.dataTransfer.effectAllowed = 'copy';
            });

            item.addEventListener('click', () => {
                const stencilIndex = item.getAttribute('data-stencil-index');
                const notation = item.getAttribute('data-notation');
                const isConnection = item.getAttribute('data-is-connection') === 'true';
                const stencilData = this.currentStencils[stencilIndex];

                if (isConnection) {
                    // For connections, enter connection mode
                    if (this.app.canvasController) {
                        this.app.canvasController.startConnectionMode(stencilData);
                        this.app.setStatus('Режим соединения: выберите начальную фигуру');
                    }
                } else {
                    this.app.addElementFromStencil(notation, stencilData);
                }
            });
        });
    }
}
