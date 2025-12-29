/**
 * Infrastructure: DrawioXmlParser
 * Handles conversion between Diagram entities and draw.io XML format
 */

class DrawioXmlParser {
    /**
     * Converts a Diagram to draw.io XML format
     * @param {Diagram} diagram
     * @returns {string} XML string
     */
    diagramToXml(diagram) {
        const xmlDoc = document.implementation.createDocument(null, 'mxfile');
        const mxfile = xmlDoc.documentElement;

        // Add diagram metadata
        const diagramNode = xmlDoc.createElement('diagram');
        diagramNode.setAttribute('id', diagram.id);
        diagramNode.setAttribute('name', diagram.name);

        // Create mxGraphModel
        const graphModel = xmlDoc.createElement('mxGraphModel');
        graphModel.setAttribute('dx', '800');
        graphModel.setAttribute('dy', '800');
        graphModel.setAttribute('grid', '1');
        graphModel.setAttribute('gridSize', '10');
        graphModel.setAttribute('guides', '1');
        graphModel.setAttribute('tooltips', '1');
        graphModel.setAttribute('connect', '1');
        graphModel.setAttribute('arrows', '1');
        graphModel.setAttribute('fold', '1');
        graphModel.setAttribute('page', '1');
        graphModel.setAttribute('pageScale', '1');
        graphModel.setAttribute('pageWidth', '850');
        graphModel.setAttribute('pageHeight', '1100');

        // Create root element
        const root = xmlDoc.createElement('root');

        // Add default cells
        const cell0 = xmlDoc.createElement('mxCell');
        cell0.setAttribute('id', '0');
        root.appendChild(cell0);

        const cell1 = xmlDoc.createElement('mxCell');
        cell1.setAttribute('id', '1');
        cell1.setAttribute('parent', '0');
        root.appendChild(cell1);

        // Add diagram elements
        diagram.elements.forEach(element => {
            const cellNode = this._elementToCell(xmlDoc, element);
            root.appendChild(cellNode);

            // Add children elements
            if (element.children && element.children.length > 0) {
                element.children.forEach(child => {
                    const childNode = this._elementToCell(xmlDoc, child);
                    root.appendChild(childNode);
                });
            }
        });

        graphModel.appendChild(root);
        diagramNode.appendChild(graphModel);
        mxfile.appendChild(diagramNode);

        // Serialize to string
        const serializer = new XMLSerializer();
        return serializer.serializeToString(xmlDoc);
    }

    /**
     * Converts draw.io XML to Diagram
     * @param {string} xml
     * @returns {Diagram}
     */
    xmlToDiagram(xml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');

        // Find diagram element
        const diagramNode = xmlDoc.querySelector('diagram');
        if (!diagramNode) {
            throw new Error('Invalid draw.io XML: no diagram element found');
        }

        const diagramId = diagramNode.getAttribute('id') ||
            'diagram_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const diagramName = diagramNode.getAttribute('name') || 'Untitled Diagram';

        // Determine diagram type from elements
        const diagramType = this._inferDiagramType(xmlDoc);

        const diagram = new Diagram(diagramId, diagramName, diagramType);

        // Parse mxCells
        const cells = xmlDoc.querySelectorAll('mxCell');
        const elementMap = {};

        cells.forEach(cell => {
            const cellId = cell.getAttribute('id');

            // Skip default cells
            if (cellId === '0' || cellId === '1') {
                return;
            }

            const element = this._cellToElement(cell);
            if (element) {
                elementMap[cellId] = element;
            }
        });

        // Build parent-child relationships
        cells.forEach(cell => {
            const cellId = cell.getAttribute('id');
            const parentId = cell.getAttribute('parent');

            if (cellId !== '0' && cellId !== '1' && parentId && parentId !== '1') {
                const element = elementMap[cellId];
                const parent = elementMap[parentId];

                if (element && parent) {
                    parent.addChild(element);
                } else if (element) {
                    diagram.addElement(element);
                }
            } else if (elementMap[cellId] && parentId === '1') {
                diagram.addElement(elementMap[cellId]);
            }
        });

        return diagram;
    }

    /**
     * Converts DiagramElement to mxCell
     * @private
     */
    _elementToCell(xmlDoc, element) {
        const cell = xmlDoc.createElement('mxCell');

        cell.setAttribute('id', element.id);
        cell.setAttribute('value', element.name || '');
        cell.setAttribute('style', element.style.toDrawioStyle());

        if (element.parentId) {
            cell.setAttribute('parent', element.parentId);
        } else {
            cell.setAttribute('parent', '1');
        }

        cell.setAttribute('vertex', element.isShape() ? '1' : '0');
        cell.setAttribute('edge', element.isConnection() ? '1' : '0');

        // Add geometry
        const geometry = xmlDoc.createElement('mxGeometry');
        geometry.setAttribute('x', element.position.x.toString());
        geometry.setAttribute('y', element.position.y.toString());
        geometry.setAttribute('width', element.size.width.toString());
        geometry.setAttribute('height', element.size.height.toString());
        geometry.setAttribute('as', 'geometry');

        cell.appendChild(geometry);

        return cell;
    }

    /**
     * Converts mxCell to DiagramElement
     * @private
     */
    _cellToElement(cell) {
        const id = cell.getAttribute('id');
        const value = cell.getAttribute('value') || '';
        const styleString = cell.getAttribute('style') || '';
        const isVertex = cell.getAttribute('vertex') === '1';
        const isEdge = cell.getAttribute('edge') === '1';

        // Parse geometry
        const geometryNode = cell.querySelector('mxGeometry');
        if (!geometryNode && isVertex) {
            return null; // Skip elements without geometry
        }

        const x = parseFloat(geometryNode?.getAttribute('x') || '0');
        const y = parseFloat(geometryNode?.getAttribute('y') || '0');
        const width = parseFloat(geometryNode?.getAttribute('width') || '100');
        const height = parseFloat(geometryNode?.getAttribute('height') || '60');

        const position = new Point(x, y);
        const size = new Size(width, height);
        const style = Style.fromDrawioStyle(styleString);

        // Determine element type from style
        const type = this._inferElementType(styleString, isEdge);

        const element = new DiagramElement(id, type, value, position, size, style);

        // Store original parent ID for later relationship building
        const parentId = cell.getAttribute('parent');
        if (parentId && parentId !== '1') {
            element.parentId = parentId;
        }

        return element;
    }

    /**
     * Infers element type from style string
     * @private
     */
    _inferElementType(styleString, isEdge) {
        if (isEdge || styleString.includes('endArrow')) {
            return 'hasNext';
        }

        // VAD types
        if (styleString.includes('#B9E0A5')) return 'baseVAD';
        if (styleString.includes('#B9E0A6')) return 'detailVAD';
        if (styleString.includes('#D4E1F5')) return 'externVAD';

        // EPC types
        if (styleString.includes('hexagon')) return 'event';
        if (styleString.includes('rhombus')) return 'connector';

        // Org types
        if (styleString.includes('ellipse')) return 'person';

        // Default
        if (styleString.includes('note')) return 'note';
        if (styleString.includes('rectangle')) return 'function';

        return 'shape';
    }

    /**
     * Infers diagram type from content
     * @private
     */
    _inferDiagramType(xmlDoc) {
        const cells = xmlDoc.querySelectorAll('mxCell');
        let hasVAD = false;
        let hasEPC = false;
        let hasOrg = false;

        cells.forEach(cell => {
            const styleString = cell.getAttribute('style') || '';

            if (styleString.includes('#B9E0A5') || styleString.includes('#B9E0A6') ||
                styleString.includes('#D4E1F5')) {
                hasVAD = true;
            }

            if (styleString.includes('hexagon') && styleString.includes('#ffe6cc')) {
                hasEPC = true;
            }

            if (styleString.includes('ellipse') && !styleString.includes('BPMN')) {
                hasOrg = true;
            }
        });

        if (hasVAD) return 'vad';
        if (hasEPC) return 'epc';
        if (hasOrg) return 'org';

        return 'vad'; // default
    }
}
