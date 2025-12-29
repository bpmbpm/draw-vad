/**
 * Domain Entity: DiagramElement
 *
 * Represents an element (shape, connection, etc.) in a diagram
 */

class DiagramElement {
    /**
     * Creates a new DiagramElement
     * @param {string} id - Unique identifier
     * @param {string} type - Element type (baseVAD, event, function, etc.)
     * @param {string} name - Element name/label
     * @param {Point} position - Element position
     * @param {Size} size - Element size
     * @param {Style} style - Element style
     */
    constructor(id, type, name, position, size, style) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.position = position;
        this.size = size;
        this.style = style;
        this.properties = {};
        this.children = [];
        this.parentId = null;
    }

    /**
     * Sets a property value
     * @param {string} key
     * @param {any} value
     */
    setProperty(key, value) {
        this.properties[key] = value;
    }

    /**
     * Gets a property value
     * @param {string} key
     * @returns {any}
     */
    getProperty(key) {
        return this.properties[key];
    }

    /**
     * Adds a child element
     * @param {DiagramElement} child
     */
    addChild(child) {
        if (!child || !(child instanceof DiagramElement)) {
            throw new Error('Invalid child element');
        }
        child.parentId = this.id;
        this.children.push(child);
    }

    /**
     * Removes a child element
     * @param {string} childId
     * @returns {boolean}
     */
    removeChild(childId) {
        const initialLength = this.children.length;
        this.children = this.children.filter(child => child.id !== childId);
        return this.children.length < initialLength;
    }

    /**
     * Checks if this is a connection/edge
     * @returns {boolean}
     */
    isConnection() {
        return this.type === 'hasNext' || this.type === 'connection' ||
               this.style.style.includes('endArrow');
    }

    /**
     * Checks if this is a shape
     * @returns {boolean}
     */
    isShape() {
        return !this.isConnection();
    }

    /**
     * Moves element to new position
     * @param {Point} newPosition
     */
    moveTo(newPosition) {
        if (!(newPosition instanceof Point)) {
            throw new Error('Invalid position');
        }
        this.position = newPosition;
    }

    /**
     * Resizes element
     * @param {Size} newSize
     */
    resize(newSize) {
        if (!(newSize instanceof Size)) {
            throw new Error('Invalid size');
        }
        this.size = newSize;
    }

    /**
     * Updates style
     * @param {Style} newStyle
     */
    updateStyle(newStyle) {
        if (!(newStyle instanceof Style)) {
            throw new Error('Invalid style');
        }
        this.style = newStyle;
    }

    /**
     * Converts element to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            position: this.position.toJSON(),
            size: this.size.toJSON(),
            style: this.style.toJSON(),
            properties: this.properties,
            children: this.children.map(child => child.toJSON()),
            parentId: this.parentId
        };
    }

    /**
     * Creates DiagramElement from JSON
     * @param {Object} json
     * @returns {DiagramElement}
     */
    static fromJSON(json) {
        const element = new DiagramElement(
            json.id,
            json.type,
            json.name,
            Point.fromJSON(json.position),
            Size.fromJSON(json.size),
            Style.fromJSON(json.style)
        );
        element.properties = json.properties || {};
        element.parentId = json.parentId || null;
        element.children = json.children ?
            json.children.map(child => DiagramElement.fromJSON(child)) : [];
        return element;
    }

    /**
     * Creates a new element
     * @param {string} type - Element type
     * @param {Object} config - Configuration from AppConfig.notations
     * @returns {DiagramElement}
     */
    static create(type, config) {
        const id = 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const name = config.name || 'New Element';

        const position = new Point(100, 100);
        const size = new Size(
            config.defaultWidth || 100,
            config.defaultHeight || 60
        );

        const styleObj = {
            fillColor: config.fillColor || '#ffffff',
            strokeColor: config.strokeColor || '#000000',
            shape: config.shape || 'rectangle'
        };
        const style = new Style(styleObj);

        return new DiagramElement(id, type, name, position, size, style);
    }
}
