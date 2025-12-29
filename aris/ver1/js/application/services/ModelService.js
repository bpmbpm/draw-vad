/**
 * Application Service: ModelService
 * Handles model-related business logic
 */

class ModelService {
    constructor(modelRepository) {
        this.repository = modelRepository;
    }

    /**
     * Creates a new model
     * @param {string} name
     * @returns {Model}
     */
    createModel(name) {
        const model = Model.createNew(name);
        this.repository.save(model);
        return model;
    }

    /**
     * Saves a model
     * @param {Model} model
     * @returns {Promise<void>}
     */
    async saveModel(model) {
        model.touch();
        await this.repository.save(model);
    }

    /**
     * Loads a model by ID
     * @param {string} id
     * @returns {Promise<Model|null>}
     */
    async loadModel(id) {
        return await this.repository.findById(id);
    }

    /**
     * Deletes a model
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async deleteModel(id) {
        return await this.repository.delete(id);
    }

    /**
     * Lists all models
     * @returns {Promise<Model[]>}
     */
    async listModels() {
        return await this.repository.findAll();
    }
}
