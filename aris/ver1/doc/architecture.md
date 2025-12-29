# Архитектура ARIS Express Clone

## Обзор

ARIS Express Clone построен на принципах Domain-Driven Design (DDD) и имеет четко разделенные слои.

## Структура проекта

```
aris/ver1/
├── index.html                 # Главная страница приложения
├── config/
│   └── app-config.js         # Конфигурационный файл
├── styles/
│   └── main.css              # Стили приложения
├── js/
│   ├── domain/               # Доменный слой (DDD)
│   │   ├── entities/
│   │   │   ├── Diagram.js
│   │   │   ├── DiagramElement.js
│   │   │   └── Model.js
│   │   ├── value-objects/
│   │   │   ├── Point.js
│   │   │   ├── Size.js
│   │   │   └── Style.js
│   │   └── repositories/
│   │       ├── IDiagramRepository.js
│   │       └── IModelRepository.js
│   ├── application/          # Слой приложения
│   │   ├── services/
│   │   │   ├── DiagramService.js
│   │   │   ├── ModelService.js
│   │   │   └── NotationService.js
│   │   └── use-cases/
│   │       ├── CreateDiagram.js
│   │       ├── SaveDiagram.js
│   │       └── LoadDiagram.js
│   ├── infrastructure/       # Инфраструктурный слой
│   │   ├── repositories/
│   │   │   └── DrawioRepository.js
│   │   ├── persistence/
│   │   │   └── LocalStorageAdapter.js
│   │   └── parsers/
│   │       └── DrawioXmlParser.js
│   ├── presentation/         # Слой представления
│   │   └── ui/
│   │       ├── MenuController.js
│   │       ├── ToolbarController.js
│   │       ├── CanvasController.js
│   │       ├── StencilController.js
│   │       ├── PropertiesController.js
│   │       └── HelpController.js
│   └── app.js                # Главный файл приложения
└── doc/
    ├── functions.md          # Описание функций
    └── architecture.md       # Этот файл
```

## Слои архитектуры

### 1. Domain Layer (Доменный слой)

Содержит бизнес-логику и правила предметной области.

#### Entities (Сущности)

**Diagram** (`js/domain/entities/Diagram.js`)
- Агрегат диаграммы
- Содержит элементы (DiagramElement[])
- Методы валидации
- Управление элементами

**DiagramElement** (`js/domain/entities/DiagramElement.js`)
- Элемент диаграммы (фигура, соединение)
- Свойства: позиция, размер, стиль
- Иерархия (parent-child)

**Model** (`js/domain/entities/Model.js`)
- Коллекция связанных диаграмм
- Представляет проект

#### Value Objects (Объекты-значения)

**Point** - координаты (x, y)
**Size** - размеры (width, height)
**Style** - стили оформления

Особенности:
- Неизменяемые (immutable)
- Сравниваются по значению
- Конвертируются в/из JSON

#### Repository Interfaces (Интерфейсы репозиториев)

**IDiagramRepository** - контракт для сохранения диаграмм
**IModelRepository** - контракт для сохранения моделей

### 2. Application Layer (Слой приложения)

Координирует бизнес-логику и use cases.

#### Services (Сервисы)

**DiagramService**
- Создание, сохранение, загрузка диаграмм
- Валидация
- Экспорт/импорт

**ModelService**
- Управление моделями (коллекциями диаграмм)

**NotationService**
- Работа с нотациями (VAD, EPC, Org, BPMN)
- Управление трафаретами
- Создание элементов по типу

#### Use Cases (Сценарии использования)

**CreateDiagramUseCase** - создание новой диаграммы
**SaveDiagramUseCase** - сохранение с валидацией
**LoadDiagramUseCase** - загрузка диаграммы

### 3. Infrastructure Layer (Инфраструктурный слой)

Технические детали реализации.

#### Repositories (Репозитории)

**DrawioRepository**
- Реализация IDiagramRepository
- Использует LocalStorageAdapter для хранения
- Использует DrawioXmlParser для конвертации

#### Persistence (Сохранение данных)

**LocalStorageAdapter**
- Адаптер для работы с localStorage
- Асинхронный API
- JSON-сериализация

#### Parsers (Парсеры)

**DrawioXmlParser**
- Конвертация Diagram ↔ draw.io XML
- Парсинг mxGraphModel
- Определение типов элементов по стилям
- Восстановление иерархии

### 4. Presentation Layer (Слой представления)

Пользовательский интерфейс.

#### Controllers (Контроллеры)

**MenuController**
- Обработка команд меню
- Маршрутизация действий

**ToolbarController**
- Панель быстрого доступа

**CanvasController**
- Управление холстом
- Масштабирование
- Отображение диаграмм

**StencilController**
- Панель трафаретов
- Переключение нотаций
- Drag & drop

**PropertiesController**
- Панель свойств
- Редактирование атрибутов элементов

**HelpController**
- Система справки
- Модальные окна

## Поток данных

### Создание диаграммы

```
User Action (Menu)
    ↓
MenuController.handleMenuAction('new-vad')
    ↓
ArisExpressApp.createDiagram('vad')
    ↓
CreateDiagramUseCase.execute('vad')
    ↓
DiagramService.createDiagram('vad')
    ↓
Diagram.createNew('vad')  [Domain Entity]
    ↓
DiagramRepository.save(diagram)
    ↓
LocalStorageAdapter.set(data)
    ↓
CanvasController.setDiagram(diagram)
    ↓
UI Update
```

### Сохранение диаграммы

```
User Action (Save)
    ↓
ArisExpressApp.saveDiagram()
    ↓
SaveDiagramUseCase.execute(diagram)
    ↓
DiagramService.validateDiagram(diagram)  [Validation]
    ↓
DiagramService.saveDiagram(diagram)
    ↓
DrawioRepository.save(diagram)
    ↓
LocalStorageAdapter.set(data)
```

### Импорт из draw.io

```
User selects file
    ↓
ArisExpressApp.importDiagram()
    ↓
FileReader reads XML
    ↓
DiagramService.importFromDrawio(xml)
    ↓
DrawioXmlParser.xmlToDiagram(xml)
    ↓
Parse mxCells → DiagramElements
    ↓
Create Diagram entity
    ↓
CanvasController.setDiagram(diagram)
```

### Добавление элемента из трафарета

```
User clicks stencil item
    ↓
StencilController.attachStencilHandlers()
    ↓
ArisExpressApp.addElementToCanvas(notation, stencilId)
    ↓
NotationService.createElement(notation, stencilId)
    ↓
DiagramElement.create(type, config)
    ↓
Diagram.addElement(element)
    ↓
CanvasController.renderDiagram()
```

## Принципы DDD в проекте

### 1. Ubiquitous Language (Единый язык)

Термины из предметной области используются везде:
- Diagram (Диаграмма)
- Element (Элемент)
- Notation (Нотация)
- Process (Процесс)
- Stencil (Трафарет)

### 2. Bounded Contexts (Ограниченные контексты)

Четкое разделение:
- Domain - бизнес-правила
- Application - оркестрация
- Infrastructure - технические детали
- Presentation - UI

### 3. Aggregates (Агрегаты)

**Diagram** - корень агрегата:
- Владеет DiagramElement[]
- Контролирует добавление/удаление элементов
- Обеспечивает инварианты

### 4. Value Objects

Point, Size, Style - неизменяемые объекты-значения

### 5. Repositories

Абстракция сохранения данных через интерфейсы

### 6. Domain Services

DiagramService, NotationService - для операций, не принадлежащих одной сущности

## Нотации и их конфигурация

### VAD (Value Added Diagram)

**Элементы:**
- baseVAD - Базовый процесс (#B9E0A5)
- detailVAD - Детализированный процесс (#B9E0A6)
- externVAD - Внешний процесс (#D4E1F5)
- note - Примечание

**Свойства:**
- role - Исполнитель
- comment - Комментарий

**Правила валидации:**
- Процессы должны иметь роль
- Проверка именования

### EPC (Event-driven Process Chain)

**Элементы:**
- event - Событие (шестиугольник)
- function - Функция (прямоугольник)
- connector - Соединитель (ромб)
- orgUnit - Орг. единица (эллипс)

**Правила валидации:**
- Чередование событий и функций
- События имеют имена

### Organizational (Орг. структура)

**Элементы:**
- position - Должность
- department - Подразделение
- person - Сотрудник

### BPMN (базовая поддержка)

**Элементы:**
- task - Задача
- gateway - Шлюз
- event - Событие

## Интеграция с draw.io

### Формат данных

Используется стандартный формат draw.io (mxGraphModel):

```xml
<mxfile>
  <diagram id="..." name="...">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="element1" value="..." style="..." vertex="1" parent="1">
          <mxGeometry x="..." y="..." width="..." height="..." as="geometry"/>
        </mxCell>
        <!-- ... -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Определение типов элементов

Типы определяются по:
- Цвету заливки (fillColor)
- Форме (shape)
- Наличию endArrow (для соединений)

### Сохранение иерархии

- parent-child связи через parent="id"
- Специальные элементы (role, comment) как дочерние

## Расширяемость

### Добавление новой нотации

1. Добавить конфигурацию в `config/app-config.js`:
```javascript
AppConfig.notations.myNotation = {
    enabled: true,
    name: 'My Notation',
    shapes: { ... }
};
```

2. Добавить правила валидации в `Diagram._validateMyNotation()`

3. Добавить справку в `HelpController.helpPages.myNotation`

4. Обновить UI (меню, селектор нотаций)

### Добавление нового формата экспорта

1. Создать новый парсер в `js/infrastructure/parsers/`
2. Добавить метод в `DiagramService`
3. Добавить пункт меню

### Добавление нового хранилища

1. Реализовать интерфейс `IDiagramRepository`
2. Создать адаптер (например, `FirebaseAdapter`)
3. Заменить в `ArisExpressApp.constructor()`

## Тестирование

Структура позволяет легко тестировать:

**Unit тесты:**
- Domain entities (чистая логика)
- Value objects
- Services

**Integration тесты:**
- Repositories с mock storage
- Parsers с примерами XML
- Use cases

**E2E тесты:**
- Пользовательские сценарии
- Интеграция всех слоев

## Производительность

### Оптимизации

1. **Ленивая загрузка** трафаретов
2. **Кэширование** парсинга XML
3. **Виртуализация** больших списков
4. **Debouncing** изменений свойств

### Масштабируемость

- LocalStorage → IndexedDB для больших диаграмм
- Web Workers для парсинга
- Canvas → SVG rendering для сложных диаграмм

## Безопасность

1. **XSS защита** при парсинге XML
2. **Валидация** пользовательского ввода
3. **CSP** headers для production
4. **Sanitization** перед рендерингом

## Deployment

### Production build

1. Минификация JS/CSS
2. Объединение файлов
3. Оптимизация изображений
4. Service Worker для offline

### CDN зависимости

- jQuery (3.6.0)
- jstree (3.3.15)
- draw.io viewer

## Совместимость

- Современные браузеры (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript
- localStorage API
- FileReader API
- XMLParser/Serializer

## Будущие улучшения

1. Real-time collaboration
2. Cloud storage (GitHub, Google Drive)
3. Расширенная валидация
4. Автоматическая компоновка
5. Экспорт в PDF/PNG/SVG
6. Импорт из других форматов (Visio, BPMN XML)
7. Плагинная система
8. Темная тема
9. Мультиязычность
10. Accessibility (ARIA)
