/**
 * Application Service: NotationService
 * Handles notation-specific operations and stencil management
 */

class NotationService {
    constructor() {
        this.config = AppConfig.notations;
    }

    /**
     * Gets available notations
     * @returns {Array} List of available notations
     */
    getAvailableNotations() {
        const notations = [];
        for (const [key, config] of Object.entries(this.config)) {
            if (config.enabled && key !== 'default') {
                notations.push({
                    id: key,
                    name: config.name,
                    description: config.description
                });
            }
        }
        return notations;
    }

    /**
     * Gets stencils for a notation
     * @param {string} notationType - Type of notation (vad, epc, org, bpmn)
     * @returns {Array} List of stencils
     */
    getStencils(notationType) {
        const notation = this.config[notationType];
        if (!notation || !notation.enabled) {
            return [];
        }

        const stencils = [];
        if (notation.shapes) {
            for (const [key, shapeConfig] of Object.entries(notation.shapes)) {
                stencils.push({
                    id: key,
                    type: shapeConfig.type,
                    name: this._getShapeName(key, notationType),
                    config: shapeConfig
                });
            }
        }

        return stencils;
    }

    /**
     * Creates an element from stencil
     * @param {string} notationType
     * @param {string} stencilId
     * @returns {DiagramElement}
     */
    createElement(notationType, stencilId) {
        const notation = this.config[notationType];
        if (!notation || !notation.enabled) {
            throw new Error(`Notation ${notationType} not available`);
        }

        const shapeConfig = notation.shapes[stencilId];
        if (!shapeConfig) {
            throw new Error(`Stencil ${stencilId} not found in ${notationType}`);
        }

        return DiagramElement.create(shapeConfig.type, shapeConfig);
    }

    /**
     * Gets human-readable shape name
     * @private
     */
    _getShapeName(key, notationType) {
        const names = {
            vad: {
                baseProcess: 'Базовый процесс',
                detailProcess: 'Детализированный процесс',
                externalProcess: 'Внешний процесс',
                note: 'Примечание'
            },
            epc: {
                event: 'Событие',
                function: 'Функция',
                connector: 'Соединитель',
                organizationalUnit: 'Организационная единица'
            },
            org: {
                position: 'Должность',
                department: 'Подразделение',
                person: 'Сотрудник'
            },
            bpmn: {
                task: 'Задача',
                gateway: 'Шлюз',
                event: 'Событие'
            }
        };

        return names[notationType]?.[key] || key;
    }

    /**
     * Validates element according to notation rules
     * @param {DiagramElement} element
     * @param {string} notationType
     * @returns {Object} Validation result
     */
    validateElement(element, notationType) {
        const errors = [];
        const warnings = [];

        const notation = this.config[notationType];
        if (!notation) {
            errors.push('Unknown notation type');
            return { isValid: false, errors, warnings };
        }

        // Notation-specific validation
        if (notationType === 'vad') {
            if (element.type.includes('VAD')) {
                const role = element.getProperty('role');
                if (!role || role.trim() === '') {
                    warnings.push('Process should have an executor role');
                }
            }
        } else if (notationType === 'epc') {
            // EPC-specific validation
            if (element.type === 'event' && !element.name) {
                errors.push('Event must have a name');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}
