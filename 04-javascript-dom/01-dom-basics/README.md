# 01 · DOM Basics

[← JavaScript & DOM](../README.md)

---

## Содержание

1. [DOM — что это](#dom--что-это)
2. [Типы узлов (Node types)](#типы-узлов)
3. [Доступ к элементам (selectors)](#доступ-к-элементам)
4. [Live vs Static коллекции](#live-vs-static-коллекции)
5. [Обход дерева (traversal)](#обход-дерева)
6. [Свойства элементов](#свойства-элементов)
7. [Вопросы на интервью](#вопросы-на-интервью)

---

## DOM — что это

**Document Object Model** — живое дерево объектов, которое браузер строит из HTML. Каждый тег, текст, комментарий — узел (Node).

```
document
└── <html>
    ├── <head>
    │   └── <title>Page</title>
    └── <body>
        ├── <!-- comment -->   ← CommentNode
        ├── <h1>Hello</h1>     ← ElementNode + TextNode внутри
        └── <p>World</p>
```

**Живое** — изменение DOM мгновенно отражается в браузере. Это не снимок, а ссылка на внутреннее представление браузера.

---

## Типы узлов

```javascript
// Node.nodeType — числовая константа
Node.ELEMENT_NODE        // 1 — <div>, <p>, <span>...
Node.TEXT_NODE           // 3 — текстовое содержимое
Node.COMMENT_NODE        // 8 — <!-- comment -->
Node.DOCUMENT_NODE       // 9 — document
Node.DOCUMENT_TYPE_NODE  // 10 — <!DOCTYPE html>
Node.DOCUMENT_FRAGMENT_NODE // 11 — фрагмент

// Проверка типа
const el = document.querySelector("p");
el.nodeType === Node.ELEMENT_NODE;   // true
el.nodeName;                          // "P" (всегда UPPER для элементов)
el instanceof Element;                // true
el instanceof HTMLElement;            // true (браузерный элемент)
el instanceof Node;                   // true (элемент — это Node)
```

**Node vs Element:**
- `Node` — базовый интерфейс для всех узлов (текст, комментарии, элементы)
- `Element` — подтип Node, только HTML/SVG/XML элементы (с тегами)
- `HTMLElement` — Element в HTML документе

---

## Доступ к элементам

```javascript
// По CSS-селектору — предпочтительный способ
document.querySelector(".btn");              // первый совпавший
document.querySelector("#app > .item:first-child");
document.querySelectorAll("li.active");      // NodeList (static!)
document.querySelectorAll("[data-id]");      // по data-атрибуту

// Контекстный поиск (внутри элемента)
const list = document.querySelector("ul");
list.querySelectorAll("li");                 // только внутри list

// Классические методы (быстрее, но менее гибкие)
document.getElementById("app");             // HTMLElement | null
document.getElementsByClassName("btn");     // HTMLCollection (LIVE!)
document.getElementsByTagName("p");         // HTMLCollection (LIVE!)
document.getElementsByName("email");        // NodeList (form elements)

// Специальные
document.documentElement;   // <html>
document.head;               // <head>
document.body;               // <body>
document.title;              // <title> текст
document.forms;              // HTMLCollection всех форм
document.images;             // HTMLCollection всех img
document.links;              // HTMLCollection всех <a href>

// Элемент под курсором/в точке
document.elementFromPoint(x, y);
document.elementsFromPoint(x, y); // все на стеке

// Ближайший предок по селектору
el.closest(".container");    // идёт вверх по дереву
el.closest("[data-modal]");  // null если не найдено

// Проверка совпадения с селектором
el.matches(".btn.active");   // boolean
el.matches(":hover");        // работает!
```

---

## Live vs Static коллекции

Одна из самых частых ловушек на интервью.

```javascript
// LIVE коллекция: обновляется при изменении DOM
const live = document.getElementsByClassName("item"); // HTMLCollection
console.log(live.length); // 3

document.querySelector(".item").remove();
console.log(live.length); // 2 — изменилась сама!

// STATIC коллекция: снимок на момент вызова
const static_ = document.querySelectorAll(".item"); // NodeList
console.log(static_.length); // 2 (после удаления выше)

document.body.appendChild(document.createElement("div")).className = "item";
console.log(static_.length); // 2 — НЕ изменилась
console.log(document.querySelectorAll(".item").length); // 3 — новый вызов

// Ловушка: итерация по live-коллекции с удалением
const items = document.getElementsByClassName("item"); // LIVE
while (items.length > 0) {
  items[0].remove(); // каждый remove сразу меняет items!
}
// Безопасно: конвертировать в array сначала
[...document.getElementsByClassName("item")].forEach(el => el.remove());
// Или:
Array.from(document.getElementsByClassName("item")).forEach(el => el.remove());
```

**Итого:**
| Метод | Тип | Live |
|-------|-----|------|
| `getElementsBy*` | HTMLCollection | ✅ |
| `querySelectorAll` | NodeList | ❌ |
| `childNodes` | NodeList | ✅ |
| `children` | HTMLCollection | ✅ |

---

## Обход дерева

```javascript
const el = document.querySelector(".parent");

// Перемещение по узлам (Node — включает текст и комментарии)
el.parentNode;          // родительский Node
el.childNodes;          // все дочерние Nodes (live, включая TextNodes!)
el.firstChild;          // первый дочерний Node (может быть TextNode!)
el.lastChild;           // последний дочерний Node
el.previousSibling;     // предыдущий сосед Node
el.nextSibling;         // следующий сосед Node

// Перемещение по элементам (Element — только теги, без текста)
el.parentElement;       // родительский Element (null у <html>)
el.children;            // дочерние Elements (live HTMLCollection)
el.firstElementChild;   // первый дочерний Element
el.lastElementChild;    // последний дочерний Element
el.previousElementSibling; // предыдущий Element-сосед
el.nextElementSibling;  // следующий Element-сосед
el.childElementCount;   // количество дочерних элементов

// Позиция в документе
el.contains(other);     // является ли other потомком el
el.compareDocumentPosition(other); // битовая маска позиции
// Биты: DISCONNECTED=1, PRECEDING=2, FOLLOWING=4, CONTAINS=8, CONTAINED_BY=16
```

**Рекомендация:** Всегда используй `*Element*` версии (не `*Node*`), если не нужны текстовые узлы.

---

## Свойства элементов

```javascript
const el = document.querySelector("div");

// Идентификаторы
el.id;                   // атрибут id
el.className;            // строка всех классов "btn active"
el.classList;            // DOMTokenList — удобный API
el.tagName;              // "DIV" (всегда upper case в HTML)
el.localName;            // "div" (lower case)

// classList — лучше чем className
el.classList.add("active");
el.classList.remove("hidden");
el.classList.toggle("open");
el.classList.toggle("open", condition); // добавить если condition true
el.classList.contains("active");        // boolean
el.classList.replace("old", "new");
el.classList.forEach(cls => {});
[...el.classList];                       // в массив

// Атрибуты
el.getAttribute("href");
el.setAttribute("href", "#");
el.removeAttribute("disabled");
el.hasAttribute("data-id");
el.toggleAttribute("disabled");         // добавить/удалить boolean атрибут

// data-* атрибуты
// <div data-user-id="42" data-is-active="true">
el.dataset.userId;                       // "42" (camelCase!)
el.dataset.isActive;                     // "true"
el.dataset.newProp = "value";            // устанавливает data-new-prop
delete el.dataset.userId;                // удаляет data-user-id

// Геометрия (вызывает reflow!)
el.getBoundingClientRect();   // { top, left, right, bottom, width, height, x, y }
el.clientWidth;               // ширина без border (включая padding)
el.clientHeight;
el.offsetWidth;               // ширина с border
el.offsetHeight;
el.scrollWidth;               // полная ширина контента (с overflow)
el.scrollHeight;
el.offsetTop;                 // позиция относительно offsetParent
el.offsetLeft;
el.offsetParent;              // ближайший positioned предок

// Содержимое
el.innerHTML;                // HTML-строка содержимого (XSS риск!)
el.outerHTML;                // HTML-строка с самим элементом
el.textContent;              // текст всех потомков (безопасно)
el.innerText;                // видимый текст (учитывает CSS, вызывает reflow!)

// Стили
el.style.color = "red";               // inline style
el.style.backgroundColor = "blue";    // camelCase!
el.style.cssText = "color:red;font-size:16px"; // batch update
getComputedStyle(el).color;           // итоговый computed стиль
getComputedStyle(el).getPropertyValue("--my-var"); // CSS переменные
```

---

## Вопросы на интервью

1. **Разница `Node` и `Element`?**
   > `Node` — базовый тип для всего в DOM: элементов, текстовых узлов, комментариев, document. `Element` — подтип `Node`, представляет только HTML/SVG элементы (с тегами). `TextNode` — тоже `Node`, но не `Element`. Именно поэтому `firstChild` может вернуть текстовый узел (пробел/перенос), а `firstElementChild` — всегда тег.

2. **Что такое live-коллекция? Ловушка?**
   > `getElementsBy*` и `children` возвращают живые коллекции — они автоматически обновляются при изменении DOM. `querySelectorAll` — статический снимок. Классическая ловушка: удалять элементы итерируясь по live-коллекции — сдвигаются индексы. Решение: конвертировать в Array перед итерацией.

3. **`textContent` vs `innerHTML` vs `innerText`?**
   > `textContent` — весь текст потомков, игнорирует HTML-теги, не вызывает reflow, безопасен от XSS. `innerHTML` — HTML-строка содержимого, парсится браузером, XSS-риск при вставке user input. `innerText` — только видимый текст (учитывает CSS `display:none`), вызывает reflow для вычисления layout.

4. **Зачем `closest()` и как отличается от `querySelector`?**
   > `querySelector` ищет вниз по дереву (потомков). `closest` ищет вверх по дереву (предков включая сам элемент). Используется в event delegation: `event.target.closest('.btn')` — найти кнопку на которую кликнули даже если клик был на вложенном элементе.

5. **`getBoundingClientRect()` vs `offsetTop/offsetLeft`?**
   > `getBoundingClientRect` — координаты относительно viewport (видимой области), обновляются при скролле. `offsetTop/offsetLeft` — относительно `offsetParent` (ближайший positioned предок). Для позиции на странице: `getBoundingClientRect().top + window.scrollY`.

---

## Пример

```bash
# Открой в браузере:
04-javascript-dom/01-dom-basics/examples/dom-basics.html
04-javascript-dom/01-dom-basics/examples/traversal.html
```
