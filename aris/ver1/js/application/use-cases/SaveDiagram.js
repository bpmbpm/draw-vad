/**
 * Use Case: SaveDiagram
 * Handles saving a diagram
 */

class SaveDiagramUseCase {
    constructor(diagramService) {
        this.diagramService = diagramService;
    }

    /**
     * Executes the use case
     * @param {Diagram} diagram
     * @returns {Promise<void>}
     */
    async execute(diagram) {
        // Validate before saving
        const validation = this.diagramService.validateDiagram(diagram);
        if (!validation.isValid) {
            console.warn('Diagram has validation errors:', validation.errors);
        }

        await this.diagramService.saveDiagram(diagram);
    }
}
