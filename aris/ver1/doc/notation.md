# Notation Reference / Справочник нотаций

This document describes all available diagram elements and connections for each supported notation type.

---

## VAD - Value Added Chain Diagram
**Диаграмма цепочки добавленной стоимости**

VAD notation is used to model business processes at a high level, showing the flow of value-adding activities.

### Elements / Элементы

| Element | Description | Shape | Color |
|---------|-------------|-------|-------|
| **Функция VAD** (Value-added chain function) | Main process/function block | Chevron (arrow shape) | Green (#B9E0A6) |
| **Детализированная функция VAD** | Detailed/sub-process block | Chevron (arrow shape) | Light blue (#D4E1F5) |
| **Организационная единица** (Organizational unit) | Department or organizational entity | Ellipse | Orange (#FFE6CC) |
| **Название схемы** (Diagram title) | Title/header for the diagram | Partial rectangle | No fill |
| **Кластер/Информация** (Cluster) | Information cluster or data group | Rectangle | Blue (#DAE8FC) |
| **Продукт/Услуга** (Product/Service) | Product or service output | Parallelogram | Purple (#E1D5E7) |
| **Примечание** (Note) | Comment or annotation | Note shape | Yellow (#FFF4C3) |
| **Текст** (Text) | Plain text element | None | None |

### Connections / Связи

| Connection | Description | Style |
|------------|-------------|-------|
| **Поток VAD-функций** (is predecessor of) | Sequence flow between VAD functions | Solid thick arrow (3px), black |
| **Связь исполнитель-функция** (executes) | Links org unit to function it executes | Dashed line, no arrow, gray |
| **Информационный поток** (is input for) | Information/data flow | Dashed arrow, thin, gray |

---

## EPC - Event-driven Process Chain
**Событийная цепочка процессов**

EPC notation models detailed business processes with events and functions in an alternating sequence.

### Elements / Элементы

| Element | Description | Shape | Color |
|---------|-------------|-------|-------|
| **Событие** (Event) | Business event triggering/resulting from function | Hexagon | Pink (#E6D0DE) |
| **Функция** (Function) | Activity or task to be performed | Rounded rectangle | Green (#D5E8D4) |
| **AND коннектор** (∧) | All paths must be taken/completed | Circle with ∧ | White |
| **XOR коннектор** (×) | Exactly one path is taken | Circle with × | White |
| **OR коннектор** (∨) | One or more paths can be taken | Circle with ∨ | White |
| **Организационная единица** (Org. unit) | Department or role | Ellipse | Orange (#FFE6CC) |
| **Позиция** (Position) | Job position or role | Rectangle | Orange (#FFE6CC) |
| **Информационный объект** (Information carrier) | Document or data object | Rectangle | Blue (#DAE8FC) |
| **Приложение** (Application system) | IT system or application | Rectangle | Gray (#F5F5F5) |
| **Примечание** (Note) | Comment or annotation | Note shape | Yellow (#FFF4C3) |

### Connections / Связи

| Connection | Description | Style |
|------------|-------------|-------|
| **Поток управления** (Control flow) | Sequence of execution | Solid arrow (2px), black |
| **Назначение** (carries out) | Links org unit/position to function | Dashed line, no arrow, gray |

### Rules / Правила
- Events and Functions must alternate in sequence
- Events have exactly one incoming and one outgoing connection
- Functions have exactly one incoming and one outgoing connection
- Connectors can have multiple incoming or outgoing connections

---

## ORG - Organizational Chart
**Организационная структура**

ORG notation models organizational hierarchies and reporting structures.

### Elements / Элементы

| Element | Description | Shape | Color |
|---------|-------------|-------|-------|
| **Организационная единица** (Organizational unit) | Department or division | Ellipse | Orange (#FFE6CC) |
| **Должность** (Position) | Job position or role | Rectangle | Orange (#FFE6CC) |
| **Сотрудник** (Person/Internal person) | Individual employee | Stick figure (UML Actor) | Blue (#DAE8FC) |
| **Группа** (Group) | Team or group of people | Ellipse | Green (#D5E8D4) |
| **Роль** (Role) | Business role | Rounded rectangle | Red (#F8CECC) |
| **Местоположение** (Location) | Physical location | Hexagon | Purple (#E1D5E7) |
| **Примечание** (Note) | Comment or annotation | Note shape | Yellow (#FFF4C3) |

### Connections / Связи

| Connection | Description | Style |
|------------|-------------|-------|
| **Иерархическая связь** (is superior) | Hierarchical reporting relationship | Solid arrow (2px), black |
| **Занимает должность** (occupies) | Person occupies a position | Dashed line, no arrow, gray |
| **Управляет** (is organization manager for) | Manager relationship | Dashed arrow, thin, gray |

---

## BPMN - Business Process Model and Notation
**Модель бизнес-процессов**

BPMN is an industry-standard notation for detailed process modeling with events, activities, and gateways.

### Elements / Элементы

| Element | Description | Shape | Color |
|---------|-------------|-------|-------|
| **Задача** (Task) | Activity or work item | Rounded rectangle | Blue (#DAE8FC) |
| **Начальное событие** (Start Event) | Process start point | Circle (thin border) | Green (#D5E8D4) |
| **Конечное событие** (End Event) | Process end point | Circle (thick border) | Red (#F8CECC) |
| **Промежуточное событие** (Intermediate Event) | Mid-process event | Circle (medium border) | Yellow (#FFF4C3) |
| **Эксклюзивный шлюз** (Exclusive Gateway) | XOR decision point | Diamond with X | White |
| **Параллельный шлюз** (Parallel Gateway) | AND split/join | Diamond with + | White |
| **Инклюзивный шлюз** (Inclusive Gateway) | OR split/join | Diamond with O | White |
| **Пул** (Pool) | Participant or organization | Horizontal swimlane | White |
| **Дорожка** (Lane) | Subdivision within pool | Horizontal lane | White |
| **Подпроцесс** (Sub-Process) | Embedded sub-process | Rounded rectangle with + | Purple (#E1D5E7) |
| **Объект данных** (Data Object) | Data input/output | Parallelogram | Blue (#DAE8FC) |
| **Аннотация** (Text Annotation) | Comment or note | Note shape | Yellow (#FFF4C3) |

### Connections / Связи

| Connection | Description | Style |
|------------|-------------|-------|
| **Поток операций** (Sequence Flow) | Order of activities within pool | Solid arrow (2px), black |
| **Поток сообщений** (Message Flow) | Communication between pools | Dashed arrow, gray |

---

## Common Conventions / Общие соглашения

### Colors / Цвета

| Color | Hex Code | Usage |
|-------|----------|-------|
| Green | #B9E0A6, #D5E8D4 | Functions, activities, positive states |
| Blue | #DAE8FC, #D4E1F5 | Information, data, sub-processes |
| Orange | #FFE6CC | Organizational elements |
| Purple | #E1D5E7 | Products, services, special elements |
| Yellow | #FFF4C3 | Notes, annotations, intermediate events |
| Red/Pink | #F8CECC, #E6D0DE | End events, errors, important alerts |
| Gray | #F5F5F5 | Applications, system elements |
| White | #FFFFFF | Connectors, gateways |

### Connection Types / Типы связей

| Type | Line Style | Arrow | Usage |
|------|------------|-------|-------|
| Sequence Flow | Solid | Arrow | Primary process flow |
| Information Flow | Dashed | Arrow | Data/information movement |
| Association | Dashed | None | Non-directional relationship |
| Hierarchy | Solid | Arrow | Organizational reporting |

---

## Usage Tips / Рекомендации

1. **Start with VAD** for high-level process overview
2. **Use EPC** for detailed process logic with events
3. **Use BPMN** for industry-standard process documentation
4. **Use ORG** to document organizational structure
5. **Combine notations** - link VAD functions to detailed EPC/BPMN diagrams
6. **Use consistent colors** within each notation type
7. **Add notes** to clarify complex logic or requirements
