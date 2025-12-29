/**
 * Infrastructure: DrawioRepository
 * Implements diagram persistence using draw.io format and localStorage
 */

class DrawioRepository extends IDiagramRepository {
    constructor(storageAdapter, xmlParser) {
        super();
        this.storage = storageAdapter;
        this.parser = xmlParser;
        this.storageKey = 'aris_diagrams';
    }

    /**
     * Saves a diagram
     * @param {Diagram} diagram
     * @returns {Promise<void>}
     */
    async save(diagram) {
        const diagrams = await this.findAll();
        const index = diagrams.findIndex(d => d.id === diagram.id);

        if (index >= 0) {
            diagrams[index] = diagram;
        } else {
            diagrams.push(diagram);
        }

        const data = diagrams.map(d => d.toJSON());
        await this.storage.set(this.storageKey, data);
    }

    /**
     * Finds a diagram by ID
     * @param {string} id
     * @returns {Promise<Diagram|null>}
     */
    async findById(id) {
        const diagrams = await this.findAll();
        return diagrams.find(d => d.id === id) || null;
    }

    /**
     * Finds all diagrams
     * @returns {Promise<Diagram[]>}
     */
    async findAll() {
        const data = await this.storage.get(this.storageKey);
        if (!data || !Array.isArray(data)) {
            return [];
        }
        return data.map(d => Diagram.fromJSON(d));
    }

    /**
     * Deletes a diagram
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const diagrams = await this.findAll();
        const filteredDiagrams = diagrams.filter(d => d.id !== id);

        if (filteredDiagrams.length < diagrams.length) {
            const data = filteredDiagrams.map(d => d.toJSON());
            await this.storage.set(this.storageKey, data);
            return true;
        }
        return false;
    }

    /**
     * Exports diagram to draw.io XML format
     * @param {Diagram} diagram
     * @returns {string}
     */
    exportToXml(diagram) {
        return this.parser.diagramToXml(diagram);
    }

    /**
     * Imports diagram from draw.io XML
     * @param {string} xml
     * @returns {Diagram}
     */
    importFromXml(xml) {
        return this.parser.xmlToDiagram(xml);
    }
}
