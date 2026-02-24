# 03 · DOM Manipulation

[← JavaScript & DOM](../README.md)

---

## Содержание

1. [Создание и вставка элементов](#создание-и-вставка)
2. [innerHTML vs textContent — что выбрать](#innerhtml-vs-textcontent)
3. [DocumentFragment — batch insert](#documentfragment)
4. [insertAdjacentHTML / Element](#insertadjacenthtml)
5. [Клонирование и удаление](#клонирование-и-удаление)
6. [Reflow / Repaint — как избегать](#reflow--repaint)
7. [Виртуальный DOM — идея](#виртуальный-dom)
8. [Вопросы на интервью](#вопросы-на-интервью)

---

## Создание и вставка

```javascript
// Создание
const el = document.createElement("div");
el.className = "card";
el.textContent = "Hello";

const text = document.createTextNode("Hello");

// Вставка (современные методы — предпочтительны)
parent.append(el, "text", another);    // в конец, принимает Node и строки
parent.prepend(el);                     // в начало
el.before(newEl);                       // перед элементом
el.after(newEl);                        // после элемента
el.replaceWith(newEl);                  // заменить элемент

// Старые методы (всё ещё нужны для глубокой совместимости)
parent.appendChild(el);                 // в конец, только Node
parent.insertBefore(el, referenceNode); // перед referenceNode
parent.replaceChild(newEl, oldEl);      // замена

// Вставка HTML-строки в конкретное место
el.insertAdjacentHTML("beforebegin", "<p>before el</p>");
el.insertAdjacentHTML("afterbegin",  "<p>first child</p>");
el.insertAdjacentHTML("beforeend",   "<p>last child</p>");
el.insertAdjacentHTML("afterend",    "<p>after el</p>");
//    beforebegin → <div> → afterbegin ... beforeend → </div> → afterend
```

---

## innerHTML vs textContent

```javascript
const el = document.getElementById("output");
const userInput = '<img src=x onerror="alert(\'XSS\')">';

// ❌ ОПАСНО: innerHTML парсит HTML — XSS уязвимость при user input!
el.innerHTML = userInput; // выполнит XSS!

// ✅ БЕЗОПАСНО: textContent — только текст, не парсит HTML
el.textContent = userInput; // покажет строку как есть

// Когда innerHTML нормально:
// — вставка доверенного статического HTML
// — очистка элемента: el.innerHTML = ""
// — создание структуры из шаблона (без user input)

// Безопасная альтернатива innerHTML для динамического HTML:
// 1. DOMParser
const doc = new DOMParser().parseFromString(trustedHtml, "text/html");
el.append(...doc.body.childNodes);

// 2. Template element (безопасен от XSS, не исполняет скрипты)
const template = document.getElementById("card-template");
const clone = template.content.cloneNode(true);
clone.querySelector(".title").textContent = user.name; // безопасно!
el.append(clone);

// 3. sanitize перед вставкой (проект Sanitizer API — Chrome 105+)
el.setHTML(userInput); // встроенная санитизация (не везде поддерживается)

// innerText vs textContent:
// textContent: всё содержимое включая display:none, быстрее
// innerText: только видимый текст, учитывает CSS, вызывает REFLOW
```

---

## DocumentFragment

Вставка 1000 элементов по одному = 1000 reflow. Fragment = один reflow.

```javascript
// ❌ Плохо: 1000 операций вставки → 1000 reflow
const list = document.getElementById("list");
for (let i = 0; i < 1000; i++) {
  const li = document.createElement("li");
  li.textContent = `Item ${i}`;
  list.appendChild(li); // каждый вызов может вызвать reflow!
}

// ✅ Хорошо: 1 операция вставки → 1 reflow
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement("li");
  li.textContent = `Item ${i}`;
  fragment.appendChild(li); // только в памяти, не в DOM
}
list.appendChild(fragment); // один reflow

// Альтернативы для batch-вставки:
// 1. innerHTML (если данные доверенные)
list.innerHTML = items.map(item => `<li>${item.name}</li>`).join("");

// 2. insertAdjacentHTML
list.insertAdjacentHTML("beforeend",
  items.map(item => `<li>${item.name}</li>`).join("")
);

// 3. replaceChildren (ES2021) — заменяет все дочерние
list.replaceChildren(...newItems); // принимает Node и строки
```

---

## insertAdjacentHTML

```javascript
// Самый быстрый способ вставить HTML-строку в нужное место
// НЕ пересоздаёт существующие элементы (в отличие от innerHTML)
// НЕ теряет event listeners на существующих детях

const container = document.getElementById("container");

// 4 позиции:
container.insertAdjacentHTML("beforebegin", "<div>Before container</div>");
container.insertAdjacentHTML("afterbegin",  "<div>First child</div>");
container.insertAdjacentHTML("beforeend",   "<div>Last child</div>");
container.insertAdjacentHTML("afterend",    "<div>After container</div>");

// Аналог для Element (не HTML):
container.insertAdjacentElement("beforeend", newEl);
container.insertAdjacentText("beforeend", "plain text");

// Производительность:
// innerHTML = "" → парсит заново весь контент, теряет listeners
// insertAdjacentHTML → добавляет к существующему, listeners сохраняются
```

---

## Клонирование и удаление

```javascript
// Клонирование
const clone = el.cloneNode(false); // мелкое — только сам элемент
const deep = el.cloneNode(true);   // глубокое — со всеми потомками
// Внимание: cloneNode НЕ копирует event listeners!

// Удаление
el.remove();                        // современный способ
parent.removeChild(el);             // старый способ (если нет ссылки на parent)
parent.replaceChild(newEl, el);     // удаление + замена
parent.innerHTML = "";              // удалить всех детей (теряет listeners)
parent.replaceChildren();           // удалить всех детей (ES2021, сохраняет структуру)

// Проверка в DOM
document.contains(el);             // true если el в document
el.isConnected;                     // true если el в документе (ES2017)
```

---

## Reflow / Repaint

```javascript
// Что вызывает Reflow (дорого!):
// Изменение геометрии: width, height, margin, padding, top, left
// Добавление/удаление элементов
// Чтение геометрии: getBoundingClientRect(), offsetWidth, scrollTop...

// Layout Thrashing: чередование чтения и записи геометрии
// Каждый раз браузер принудительно считает layout

// ❌ Layout Thrashing
const boxes = document.querySelectorAll(".box");
for (const box of boxes) {
  const width = box.offsetWidth;       // ЧТЕНИЕ → reflow
  box.style.width = width * 2 + "px"; // ЗАПИСЬ → инвалидирует layout
  // следующая итерация → чтение снова → ещё один reflow
}

// ✅ Batch: сначала все чтения, потом все записи
const widths = [...boxes].map(box => box.offsetWidth); // все чтения
for (let i = 0; i < boxes.length; i++) {
  boxes[i].style.width = widths[i] * 2 + "px"; // все записи
}

// ✅ requestAnimationFrame для анимаций
function animate() {
  const width = el.offsetWidth; // чтение
  el.style.width = width + 1 + "px"; // запись
  if (width < 300) requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// CSS переходы вместо JS анимации
el.style.transition = "width 0.3s";
el.style.width = "300px"; // браузер анимирует на GPU

// will-change: подсказка браузеру создать отдельный слой
el.style.willChange = "transform"; // ДО анимации
// После: el.style.willChange = "auto"; // очистить!
```

---

## Виртуальный DOM

**Проблема:** Частые DOM-операции дорогие. Как минимизировать реальные изменения?

**Идея Virtual DOM (React):**
1. Держать лёгкое JS-представление DOM (vDOM)
2. При изменении state — пересоздать vDOM
3. Сравнить старый и новый vDOM (diffing / reconciliation)
4. Применить только МИНИМАЛЬНЫЕ изменения к реальному DOM (patching)

```javascript
// Упрощённая концепция:

// vNode — просто объект
const vNode = (tag, props, ...children) => ({ tag, props, children });

// Создание реального DOM из vNode
function render(vnode) {
  if (typeof vnode === "string") return document.createTextNode(vnode);
  const el = document.createElement(vnode.tag);
  for (const [k, v] of Object.entries(vnode.props || {})) {
    if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  vnode.children.flat().forEach(child => el.append(render(child)));
  return el;
}

// Diff: сравнение двух vNode деревьев
function diff(oldVNode, newVNode) {
  if (!oldVNode) return { type: "CREATE", newVNode };
  if (!newVNode) return { type: "REMOVE" };
  if (oldVNode.tag !== newVNode.tag) return { type: "REPLACE", newVNode };
  if (typeof oldVNode === "string") {
    return oldVNode !== newVNode ? { type: "TEXT", newVNode } : null;
  }
  // Сравниваем props и рекурсивно детей...
  return { type: "UPDATE", props: diffProps(oldVNode, newVNode) };
}

// React Fiber — современная реализация (incremental rendering)
// Разбивает reconciliation на маленькие куски
// Может прерываться (yield к браузеру) для отзывчивого UI
// Использует двусвязный список (fiber tree) вместо стека рекурсии
```

---

## Вопросы на интервью

1. **`innerHTML` vs `textContent` — когда что?**
   > `innerHTML` парсит вставляемую строку как HTML — быстро для создания структуры, но XSS-риск при пользовательском вводе. `textContent` записывает как plain text — всегда безопасно. Правило: user input → только `textContent`. Структура из доверенного шаблона → `innerHTML` или `insertAdjacentHTML`.

2. **Зачем DocumentFragment?**
   > Позволяет собрать DOM-структуру в памяти без вставки в документ (нет reflow). Один `appendChild(fragment)` вместо N отдельных вставок = один reflow. Актуально при рендеринге больших списков. Альтернатива — `innerHTML` с готовой строкой.

3. **Что такое Layout Thrashing?**
   > Чередование операций чтения и записи геометрии в цикле. Каждое чтение (`offsetWidth`, `getBoundingClientRect`) после записи вынуждает браузер синхронно пересчитывать layout. Решение: сначала все чтения, потом все записи. Или использовать `requestAnimationFrame`.

4. **Как React Virtual DOM улучшает производительность?**
   > vDOM сам по себе не быстрее — он дополнительная работа. Преимущество в том, что **diffing дешевле чем реальные DOM-операции**. React минимизирует изменения реального DOM: вместо перерендера всего списка — обновляет только изменившиеся элементы. React Fiber добавляет приоритезацию и прерываемость.

5. **`cloneNode` копирует event listeners?**
   > Нет. `cloneNode(true)` копирует структуру и атрибуты, но не event listeners. Их нужно навешивать заново. Это одна из причин почему делегирование событий удобнее — не нужно беспокоиться о listeners на клонах.

---

## Пример

```
Открой в браузере:
04-javascript-dom/03-dom-manipulation/examples/manipulation.html
```
