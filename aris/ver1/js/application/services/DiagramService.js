/**
 * Application Service: DiagramService
 * Handles diagram-related business logic
 */

class DiagramService {
    constructor(diagramRepository) {
        this.repository = diagramRepository;
    }

    /**
     * Creates a new diagram
     * @param {string} type - Diagram type (vad, epc, org, bpmn)
     * @returns {Diagram}
     */
    createDiagram(type) {
        const diagram = Diagram.createNew(type);
        this.repository.save(diagram);
        return diagram;
    }

    /**
     * Saves a diagram
     * @param {Diagram} diagram
     * @returns {Promise<void>}
     */
    async saveDiagram(diagram) {
        diagram.touch();
        await this.repository.save(diagram);
    }

    /**
     * Loads a diagram by ID
     * @param {string} id
     * @returns {Promise<Diagram|null>}
     */
    async loadDiagram(id) {
        return await this.repository.findById(id);
    }

    /**
     * Deletes a diagram
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async deleteDiagram(id) {
        return await this.repository.delete(id);
    }

    /**
     * Lists all diagrams
     * @returns {Promise<Diagram[]>}
     */
    async listDiagrams() {
        return await this.repository.findAll();
    }

    /**
     * Validates a diagram
     * @param {Diagram} diagram
     * @returns {Object} Validation result
     */
    validateDiagram(diagram) {
        return diagram.validate();
    }

    /**
     * Exports diagram to draw.io XML format
     * @param {Diagram} diagram
     * @returns {string} XML string
     */
    exportToDrawio(diagram) {
        // This will be implemented by the infrastructure layer
        const parser = new DrawioXmlParser();
        return parser.diagramToXml(diagram);
    }

    /**
     * Imports diagram from draw.io XML
     * @param {string} xml
     * @returns {Diagram}
     */
    importFromDrawio(xml) {
        const parser = new DrawioXmlParser();
        return parser.xmlToDiagram(xml);
    }
}
