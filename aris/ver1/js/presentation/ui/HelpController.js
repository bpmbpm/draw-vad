/**
 * Presentation: HelpController
 * Handles help system and documentation display
 */

class HelpController {
    constructor(app) {
        this.app = app;
        this.helpPages = this.initializeHelpContent();
    }

    initializeHelpContent() {
        return {
            index: {
                title: 'Справка ARIS Express Clone',
                content: `
                    <h1>Добро пожаловать в ARIS Express Clone</h1>
                    <h2>О программе</h2>
                    <p>ARIS Express Clone - это инструмент для моделирования бизнес-процессов, поддерживающий несколько нотаций.</p>

                    <h2>Поддерживаемые нотации</h2>
                    <ul>
                        <li><strong>VAD (Value Added Diagram)</strong> - Диаграмма добавленной стоимости</li>
                        <li><strong>EPC (Event-driven Process Chain)</strong> - Событийная цепочка процессов</li>
                        <li><strong>Организационные диаграммы</strong> - Структура организации</li>
                        <li><strong>BPMN</strong> - Business Process Model and Notation</li>
                    </ul>

                    <h2>Основные функции</h2>
                    <ul>
                        <li>Создание и редактирование диаграмм</li>
                        <li>Сохранение в формате draw.io</li>
                        <li>Экспорт в различные форматы (PNG, SVG, PDF)</li>
                        <li>Валидация моделей согласно правилам нотаций</li>
                    </ul>

                    <h2>Начало работы</h2>
                    <ol>
                        <li>Выберите нотацию в панели трафаретов</li>
                        <li>Перетащите элементы на холст или кликните по ним</li>
                        <li>Настройте свойства элементов в правой панели</li>
                        <li>Сохраните диаграмму через меню Файл → Сохранить</li>
                    </ol>
                `
            },
            vad: {
                title: 'Справка по VAD',
                content: `
                    <h1>VAD - Value Added Diagram</h1>
                    <h2>Описание нотации</h2>
                    <p>VAD (Value Added Diagram) - нотация для моделирования процессов с акцентом на добавленную стоимость.</p>

                    <h2>Элементы нотации</h2>
                    <h3>1. Базовый процесс (Base Process)</h3>
                    <p>Цвет: светло-зеленый (#B9E0A5)</p>
                    <p>Представляет базовый процесс, который еще не детализирован.</p>

                    <h3>2. Детализированный процесс (Detail Process)</h3>
                    <p>Цвет: зеленый (#B9E0A6)</p>
                    <p>Процесс, который имеет детальную декомпозицию.</p>

                    <h3>3. Внешний процесс (External Process)</h3>
                    <p>Цвет: голубой (#D4E1F5)</p>
                    <p>Процесс, выполняемый вне рассматриваемой системы.</p>

                    <h2>Свойства процессов VAD</h2>
                    <ul>
                        <li><strong>Название:</strong> Код и имя процесса (например, "p1.2.3 Обработка заказа")</li>
                        <li><strong>Исполнитель (Role):</strong> Кто выполняет процесс</li>
                        <li><strong>Комментарий:</strong> Дополнительная информация</li>
                    </ul>

                    <h2>Правила моделирования</h2>
                    <ol>
                        <li>Каждый процесс должен иметь исполнителя</li>
                        <li>Процессы соединяются стрелками последовательности</li>
                        <li>Название процесса должно начинаться с кода (для базовых процессов)</li>
                    </ol>

                    <h2>Примеры использования</h2>
                    <p>VAD используется для:</p>
                    <ul>
                        <li>Анализа цепочек создания стоимости</li>
                        <li>Оптимизации бизнес-процессов</li>
                        <li>Документирования процедур и регламентов</li>
                    </ul>
                `
            },
            epc: {
                title: 'Справка по EPC',
                content: `
                    <h1>EPC - Event-driven Process Chain</h1>
                    <h2>Описание нотации</h2>
                    <p>EPC - нотация для моделирования бизнес-процессов с акцентом на события и функции.</p>

                    <h2>Элементы нотации</h2>
                    <h3>1. Событие (Event)</h3>
                    <p>Форма: шестиугольник</p>
                    <p>Описывает состояние, которое запускает или является результатом функции.</p>

                    <h3>2. Функция (Function)</h3>
                    <p>Форма: прямоугольник</p>
                    <p>Представляет действие или операцию в процессе.</p>

                    <h3>3. Соединитель (Connector)</h3>
                    <p>Форма: ромб</p>
                    <p>Используется для разветвления и объединения потоков (AND, OR, XOR).</p>

                    <h2>Правила моделирования</h2>
                    <ol>
                        <li>Процесс должен начинаться и заканчиваться событием</li>
                        <li>События и функции должны чередоваться</li>
                        <li>Между двумя событиями должна быть функция</li>
                        <li>Между двумя функциями должно быть событие</li>
                    </ol>
                `
            },
            org: {
                title: 'Справка по организационным диаграммам',
                content: `
                    <h1>Организационные диаграммы</h1>
                    <h2>Описание</h2>
                    <p>Организационные диаграммы используются для представления структуры организации.</p>

                    <h2>Элементы нотации</h2>
                    <h3>1. Должность (Position)</h3>
                    <p>Форма: прямоугольник</p>
                    <p>Представляет должность в организации.</p>

                    <h3>2. Подразделение (Department)</h3>
                    <p>Форма: прямоугольник</p>
                    <p>Представляет организационное подразделение.</p>

                    <h3>3. Сотрудник (Person)</h3>
                    <p>Форма: эллипс</p>
                    <p>Представляет конкретного сотрудника.</p>

                    <h2>Типы связей</h2>
                    <ul>
                        <li>Подчинение (иерархическая связь)</li>
                        <li>Функциональная связь</li>
                    </ul>
                `
            }
        };
    }

    showHelp(pageName = 'index') {
        const helpPage = this.helpPages[pageName];

        if (!helpPage) {
            console.warn('Help page not found:', pageName);
            return;
        }

        this.showModal(helpPage.title, helpPage.content);
    }

    showModal(title, content) {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.classList.add('active');

        modalContainer.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-title">${title}</div>
                    <button class="modal-close" id="close-help">&times;</button>
                </div>
                <div class="modal-body help-content">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn" id="help-close-btn">Закрыть</button>
                </div>
            </div>
        `;

        // Attach close handlers
        document.getElementById('close-help').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('help-close-btn').addEventListener('click', () => {
            this.closeModal();
        });

        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.classList.remove('active');
        modalContainer.innerHTML = '';
    }
}
