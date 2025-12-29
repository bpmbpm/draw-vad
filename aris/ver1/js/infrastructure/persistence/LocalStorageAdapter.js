/**
 * Infrastructure: LocalStorageAdapter
 * Provides localStorage persistence
 */

class LocalStorageAdapter {
    /**
     * Stores data in localStorage
     * @param {string} key
     * @param {any} value
     * @returns {Promise<void>}
     */
    async set(key, value) {
        try {
            const jsonString = JSON.stringify(value);
            localStorage.setItem(key, jsonString);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw new Error('Failed to save data');
        }
    }

    /**
     * Retrieves data from localStorage
     * @param {string} key
     * @returns {Promise<any|null>}
     */
    async get(key) {
        try {
            const jsonString = localStorage.getItem(key);
            if (!jsonString) {
                return null;
            }
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    /**
     * Removes data from localStorage
     * @param {string} key
     * @returns {Promise<void>}
     */
    async remove(key) {
        localStorage.removeItem(key);
    }

    /**
     * Clears all data from localStorage
     * @returns {Promise<void>}
     */
    async clear() {
        localStorage.clear();
    }

    /**
     * Checks if a key exists
     * @param {string} key
     * @returns {Promise<boolean>}
     */
    async has(key) {
        return localStorage.getItem(key) !== null;
    }
}
