/**
 * Use Case: LoadDiagram
 * Handles loading a diagram
 */

class LoadDiagramUseCase {
    constructor(diagramService) {
        this.diagramService = diagramService;
    }

    /**
     * Executes the use case
     * @param {string} id - Diagram ID
     * @returns {Promise<Diagram|null>}
     */
    async execute(id) {
        const diagram = await this.diagramService.loadDiagram(id);
        if (!diagram) {
            throw new Error(`Diagram with ID ${id} not found`);
        }
        return diagram;
    }
}
