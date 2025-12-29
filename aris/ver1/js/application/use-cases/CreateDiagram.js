/**
 * Use Case: CreateDiagram
 * Handles the creation of a new diagram
 */

class CreateDiagramUseCase {
    constructor(diagramService) {
        this.diagramService = diagramService;
    }

    /**
     * Executes the use case
     * @param {string} type - Diagram type
     * @param {string} name - Optional diagram name
     * @returns {Diagram}
     */
    execute(type, name = null) {
        const diagram = this.diagramService.createDiagram(type);
        if (name) {
            diagram.name = name;
        }
        return diagram;
    }
}
