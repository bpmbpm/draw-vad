/**
 * Presentation: PropertiesController
 * Handles properties panel for selected elements and model properties
 */

class PropertiesController {
    constructor(app) {
        this.app = app;
        this.selectedElement = null;
        this.init();
    }

    init() {
        this.propertiesContainer = document.getElementById('object-properties');
        this.setupPropertiesPanel();
    }

    setupPropertiesPanel() {
        // Expand the properties panel to show model properties section too
        const container = document.getElementById('properties-container');
        if (container && !document.getElementById('model-properties')) {
            container.innerHTML = `
                <div class="property-section">
                    <h3>Свойства объекта</h3>
                    <div id="object-properties">
                        <p class="no-selection">Объект не выбран</p>
                    </div>
                </div>
                <div class="property-section" style="margin-top: 20px;">
                    <h3>Свойства модели</h3>
                    <div id="model-properties">
                        <p class="no-selection">Модель не открыта</p>
                    </div>
                </div>
            `;
            this.propertiesContainer = document.getElementById('object-properties');
        }
    }

    showElementProperties(element) {
        this.selectedElement = element;

        if (!element) {
            this.propertiesContainer.innerHTML = '<p class="no-selection">Объект не выбран</p>';
            return;
        }

        // Determine element type display name
        const typeDisplayName = this.getTypeDisplayName(element.type, element.shapeType);

        let html = `
            <div class="property-row">
                <div class="property-label">ID:</div>
                <input type="text" class="property-input" value="${element.id}" readonly>
            </div>
            <div class="property-row">
                <div class="property-label">Тип:</div>
                <input type="text" class="property-input" value="${typeDisplayName}" readonly>
            </div>
            <div class="property-row">
                <div class="property-label">Форма:</div>
                <input type="text" class="property-input" value="${this.getShapeDisplayName(element.shapeType)}" readonly>
            </div>
            <div class="property-row">
                <div class="property-label">Название:</div>
                <input type="text" class="property-input" id="prop-name" value="${element.name || ''}">
            </div>
            <div class="property-row">
                <div class="property-label">X:</div>
                <input type="number" class="property-input" id="prop-x" value="${Math.round(element.position?.x || 0)}">
            </div>
            <div class="property-row">
                <div class="property-label">Y:</div>
                <input type="number" class="property-input" id="prop-y" value="${Math.round(element.position?.y || 0)}">
            </div>
            <div class="property-row">
                <div class="property-label">Ширина:</div>
                <input type="number" class="property-input" id="prop-width" value="${element.size?.width || 100}">
            </div>
            <div class="property-row">
                <div class="property-label">Высота:</div>
                <input type="number" class="property-input" id="prop-height" value="${element.size?.height || 60}">
            </div>
        `;

        // Add style properties
        if (element.style) {
            html += `
                <div class="property-row">
                    <div class="property-label">Цвет заливки:</div>
                    <input type="color" class="property-input" id="prop-fill" value="${element.style.fillColor || '#dae8fc'}" style="height: 30px;">
                </div>
                <div class="property-row">
                    <div class="property-label">Цвет контура:</div>
                    <input type="color" class="property-input" id="prop-stroke" value="${element.style.strokeColor || '#6c8ebf'}" style="height: 30px;">
                </div>
            `;
        }

        // Add delete button
        html += `
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd;">
                <button class="btn btn-secondary" id="btn-delete-element" style="width: 100%; color: #c00;">Удалить элемент</button>
            </div>
        `;

        this.propertiesContainer.innerHTML = html;

        // Attach change handlers
        this.attachPropertyHandlers();
    }

    getTypeDisplayName(type, shapeType) {
        const typeMap = {
            'shape': 'Фигура',
            'baseVAD': 'VAD Функция',
            'detailVAD': 'VAD Детализированная функция',
            'externVAD': 'VAD Внешняя функция',
            'event': 'Событие EPC',
            'function': 'Функция EPC',
            'connector': 'Соединитель',
            'gateway': 'Шлюз',
            'person': 'Сотрудник',
            'orgUnit': 'Организационная единица',
            'note': 'Примечание',
            'task': 'Задача BPMN'
        };

        return typeMap[type] || typeMap[shapeType] || type || 'Фигура';
    }

    getShapeDisplayName(shapeType) {
        const shapeMap = {
            'chevron': 'Стрелка (Chevron)',
            'rect': 'Прямоугольник',
            'roundedRect': 'Скругленный прямоугольник',
            'hexagon': 'Шестиугольник',
            'diamond': 'Ромб',
            'ellipse': 'Эллипс',
            'parallelogram': 'Параллелограмм',
            'note': 'Примечание',
            'actor': 'Исполнитель (Actor)',
            'swimlane': 'Дорожка (Swimlane)'
        };

        return shapeMap[shapeType] || shapeType || 'Прямоугольник';
    }

    attachPropertyHandlers() {
        const inputs = this.propertiesContainer.querySelectorAll('input:not([readonly])');

        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateElementProperty(input.id, input.value);
            });
        });

        // Delete button
        const deleteBtn = document.getElementById('btn-delete-element');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.app.canvasController) {
                    this.app.canvasController.deleteSelectedElement();
                }
            });
        }
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
            case 'prop-fill':
                if (!this.selectedElement.style) this.selectedElement.style = {};
                this.selectedElement.style.fillColor = value;
                break;
            case 'prop-stroke':
                if (!this.selectedElement.style) this.selectedElement.style = {};
                this.selectedElement.style.strokeColor = value;
                break;
        }

        // Re-render the diagram
        if (this.app.canvasController) {
            this.app.canvasController.renderDiagram();
            // Re-select the element to update selection visual
            const g = this.app.canvasController.diagramContent.querySelector(`[data-id="${this.selectedElement.id}"]`);
            if (g) {
                this.app.canvasController.selectElement(this.selectedElement, g);
            }
        }
    }

    showModelProperties(diagram, filename = null) {
        const modelProps = document.getElementById('model-properties');
        if (!modelProps) return;

        if (!diagram) {
            modelProps.innerHTML = '<p class="no-selection">Модель не открыта</p>';
            return;
        }

        const elementsCount = diagram.elements?.length || 0;
        const connectionsCount = diagram.connections?.length || 0;

        modelProps.innerHTML = `
            <div class="property-row">
                <div class="property-label">Имя диаграммы:</div>
                <input type="text" class="property-input" id="model-name" value="${diagram.name || 'Без названия'}">
            </div>
            ${filename ? `
            <div class="property-row">
                <div class="property-label">Имя файла:</div>
                <input type="text" class="property-input" value="${filename}" readonly>
            </div>
            ` : ''}
            <div class="property-row">
                <div class="property-label">Тип:</div>
                <input type="text" class="property-input" value="${(diagram.type || 'vad').toUpperCase()}" readonly>
            </div>
            <div class="property-row">
                <div class="property-label">Элементов:</div>
                <input type="text" class="property-input" value="${elementsCount}" readonly>
            </div>
            <div class="property-row">
                <div class="property-label">Соединений:</div>
                <input type="text" class="property-input" value="${connectionsCount}" readonly>
            </div>
        `;

        // Attach model name change handler
        const modelNameInput = document.getElementById('model-name');
        if (modelNameInput) {
            modelNameInput.addEventListener('change', () => {
                diagram.name = modelNameInput.value;
                if (this.app.canvasController) {
                    const titleEl = document.querySelector('.canvas-title');
                    if (titleEl) {
                        titleEl.textContent = diagram.name;
                    }
                }
            });
        }
    }

    clear() {
        this.selectedElement = null;
        this.propertiesContainer.innerHTML = '<p class="no-selection">Объект не выбран</p>';
    }
}
