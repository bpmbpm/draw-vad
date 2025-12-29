/**
 * Presentation: PropertiesController
 * Handles properties panel for selected elements
 */

class PropertiesController {
    constructor(app) {
        this.app = app;
        this.selectedElement = null;
        this.init();
    }

    init() {
        this.propertiesContainer = document.getElementById('object-properties');
    }

    showElementProperties(element) {
        this.selectedElement = element;

        if (!element) {
            this.propertiesContainer.innerHTML = '<p class="no-selection">Объект не выбран</p>';
            return;
        }

        let html = `
            <div class="property-row">
                <div class="property-label">ID:</div>
                <input type="text" class="property-input" value="${element.id}" readonly>
            </div>
            <div class="property-row">
                <div class="property-label">Тип:</div>
                <input type="text" class="property-input" value="${element.type}" readonly>
            </div>
            <div class="property-row">
                <div class="property-label">Название:</div>
                <input type="text" class="property-input" id="prop-name" value="${element.name || ''}">
            </div>
            <div class="property-row">
                <div class="property-label">X:</div>
                <input type="number" class="property-input" id="prop-x" value="${element.position.x}">
            </div>
            <div class="property-row">
                <div class="property-label">Y:</div>
                <input type="number" class="property-input" id="prop-y" value="${element.position.y}">
            </div>
            <div class="property-row">
                <div class="property-label">Ширина:</div>
                <input type="number" class="property-input" id="prop-width" value="${element.size.width}">
            </div>
            <div class="property-row">
                <div class="property-label">Высота:</div>
                <input type="number" class="property-input" id="prop-height" value="${element.size.height}">
            </div>
        `;

        // Add VAD-specific properties
        if (element.type.includes('VAD')) {
            html += `
                <div class="property-row">
                    <div class="property-label">Исполнитель (Role):</div>
                    <input type="text" class="property-input" id="prop-role" value="${element.getProperty('role') || ''}">
                </div>
                <div class="property-row">
                    <div class="property-label">Комментарий:</div>
                    <textarea class="property-input" id="prop-comment" rows="3">${element.getProperty('comment') || ''}</textarea>
                </div>
            `;
        }

        this.propertiesContainer.innerHTML = html;

        // Attach change handlers
        this.attachPropertyHandlers();
    }

    attachPropertyHandlers() {
        const inputs = this.propertiesContainer.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            if (!input.readOnly) {
                input.addEventListener('change', () => {
                    this.updateElementProperty(input.id, input.value);
                });
            }
        });
    }

    updateElementProperty(propId, value) {
        if (!this.selectedElement) return;

        switch (propId) {
            case 'prop-name':
                this.selectedElement.name = value;
                break;
            case 'prop-x':
                this.selectedElement.position.x = parseFloat(value);
                break;
            case 'prop-y':
                this.selectedElement.position.y = parseFloat(value);
                break;
            case 'prop-width':
                this.selectedElement.size.width = parseFloat(value);
                break;
            case 'prop-height':
                this.selectedElement.size.height = parseFloat(value);
                break;
            case 'prop-role':
                this.selectedElement.setProperty('role', value);
                break;
            case 'prop-comment':
                this.selectedElement.setProperty('comment', value);
                break;
        }

        // Notify app of changes
        this.app.onElementModified(this.selectedElement);
    }

    clear() {
        this.selectedElement = null;
        this.propertiesContainer.innerHTML = '<p class="no-selection">Объект не выбран</p>';
    }
}
