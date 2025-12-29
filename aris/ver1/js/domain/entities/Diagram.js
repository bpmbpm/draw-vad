/**
 * Domain Entity: Diagram
 *
 * Represents a business process diagram in the ARIS Express system.
 * This is an aggregate root in DDD terms.
 */

class Diagram {
    /**
     * Creates a new Diagram instance
     * @param {string} id - Unique identifier
     * @param {string} name - Diagram name
     * @param {string} type - Diagram type (vad, epc, org, bpmn)
     * @param {DiagramElement[]} elements - Array of diagram elements
     */
    constructor(id, name, type, elements = []) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.elements = elements;
        this.createdAt = new Date();
        this.modifiedAt = new Date();
        this.metadata = {};
    }

    /**
     * Adds an element to the diagram
     * @param {DiagramElement} element
     */
    addElement(element) {
        if (!element || !(element instanceof DiagramElement)) {
            throw new Error('Invalid diagram element');
        }
        this.elements.push(element);
        this.touch();
    }

    /**
     * Removes an element from the diagram
     * @param {string} elementId
     * @returns {boolean} True if element was removed
     */
    removeElement(elementId) {
        const initialLength = this.elements.length;
        this.elements = this.elements.filter(el => el.id !== elementId);
        if (this.elements.length < initialLength) {
            this.touch();
            return true;
        }
        return false;
    }

    /**
     * Finds an element by ID
     * @param {string} elementId
     * @returns {DiagramElement|null}
     */
    findElement(elementId) {
        return this.elements.find(el => el.id === elementId) || null;
    }

    /**
     * Gets all elements of a specific type
     * @param {string} type
     * @returns {DiagramElement[]}
     */
    getElementsByType(type) {
        return this.elements.filter(el => el.type === type);
    }

    /**
     * Updates the modification timestamp
     */
    touch() {
        this.modifiedAt = new Date();
    }

    /**
     * Sets metadata property
     * @param {string} key
     * @param {any} value
     */
    setMetadata(key, value) {
        this.metadata[key] = value;
        this.touch();
    }

    /**
     * Gets metadata property
     * @param {string} key
     * @returns {any}
     */
    getMetadata(key) {
        return this.metadata[key];
    }

    /**
     * Validates the diagram according to notation rules
     * @returns {Object} Validation result with errors and warnings
     */
    validate() {
        const errors = [];
        const warnings = [];

        // Basic validation
        if (!this.name || this.name.trim() === '') {
            errors.push('Diagram must have a name');
        }

        if (!this.type) {
            errors.push('Diagram must have a type');
        }

        // Notation-specific validation
        if (this.type === 'vad') {
            const vadValidation = this._validateVAD();
            errors.push(...vadValidation.errors);
            warnings.push(...vadValidation.warnings);
        } else if (this.type === 'epc') {
            const epcValidation = this._validateEPC();
            errors.push(...epcValidation.errors);
            warnings.push(...epcValidation.warnings);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * VAD-specific validation
     * @private
     */
    _validateVAD() {
        const errors = [];
        const warnings = [];

        // Check that VAD processes have roles
        const vadProcesses = this.elements.filter(el =>
            el.type === 'baseVAD' || el.type === 'detailVAD' || el.type === 'externVAD'
        );

        vadProcesses.forEach(process => {
            const role = process.getProperty('role');
            if (!role || role.trim() === '') {
                warnings.push(`Process "${process.name}" has no executor role assigned`);
            }
        });

        return { errors, warnings };
    }

    /**
     * EPC-specific validation
     * @private
     */
    _validateEPC() {
        const errors = [];
        const warnings = [];

        // EPC should alternate between events and functions
        // This is a simplified validation
        const events = this.getElementsByType('event');
        const functions = this.getElementsByType('function');

        if (events.length === 0 && functions.length > 0) {
            warnings.push('EPC should have at least one event');
        }

        if (functions.length === 0 && events.length > 0) {
            warnings.push('EPC should have at least one function');
        }

        return { errors, warnings };
    }

    /**
     * Converts diagram to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            elements: this.elements.map(el => el.toJSON()),
            createdAt: this.createdAt.toISOString(),
            modifiedAt: this.modifiedAt.toISOString(),
            metadata: this.metadata
        };
    }

    /**
     * Creates a Diagram from JSON
     * @param {Object} json
     * @returns {Diagram}
     */
    static fromJSON(json) {
        const diagram = new Diagram(
            json.id,
            json.name,
            json.type,
            json.elements ? json.elements.map(el => DiagramElement.fromJSON(el)) : []
        );
        diagram.createdAt = new Date(json.createdAt);
        diagram.modifiedAt = new Date(json.modifiedAt);
        diagram.metadata = json.metadata || {};
        return diagram;
    }

    /**
     * Creates a new empty diagram
     * @param {string} type - Diagram type
     * @returns {Diagram}
     */
    static createNew(type) {
        const id = 'diagram_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const name = `New ${type.toUpperCase()} Diagram`;
        return new Diagram(id, name, type);
    }
}
