/**
 * Domain Entity: Model
 * Represents a collection of related diagrams (a project/model)
 */

class Model {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.diagrams = [];
        this.createdAt = new Date();
        this.modifiedAt = new Date();
        this.metadata = {};
    }

    addDiagram(diagram) {
        if (!(diagram instanceof Diagram)) {
            throw new Error('Invalid diagram');
        }
        this.diagrams.push(diagram);
        this.touch();
    }

    removeDiagram(diagramId) {
        const initialLength = this.diagrams.length;
        this.diagrams = this.diagrams.filter(d => d.id !== diagramId);
        if (this.diagrams.length < initialLength) {
            this.touch();
            return true;
        }
        return false;
    }

    findDiagram(diagramId) {
        return this.diagrams.find(d => d.id === diagramId) || null;
    }

    touch() {
        this.modifiedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            diagrams: this.diagrams.map(d => d.toJSON()),
            createdAt: this.createdAt.toISOString(),
            modifiedAt: this.modifiedAt.toISOString(),
            metadata: this.metadata
        };
    }

    static fromJSON(json) {
        const model = new Model(json.id, json.name);
        model.diagrams = json.diagrams ? json.diagrams.map(d => Diagram.fromJSON(d)) : [];
        model.createdAt = new Date(json.createdAt);
        model.modifiedAt = new Date(json.modifiedAt);
        model.metadata = json.metadata || {};
        return model;
    }

    static createNew(name) {
        const id = 'model_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        return new Model(id, name || 'New Model');
    }
}
