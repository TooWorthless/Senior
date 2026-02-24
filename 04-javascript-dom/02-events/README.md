# 02 · События (Events)

[← JavaScript & DOM](../README.md)

---

## Содержание

1. [Модель событий: три фазы](#модель-событий)
2. [addEventListener — параметры](#addeventlistener)
3. [Event object — свойства](#event-object)
4. [Делегирование событий](#делегирование-событий)
5. [Удаление обработчиков](#удаление-обработчиков)
6. [CustomEvent](#customevent)
7. [Часто используемые события](#часто-используемые-события)
8. [Вопросы на интервью](#вопросы-на-интервью)

---

## Модель событий

Событие проходит три фазы:

```
document
  └── html
        └── body
              └── div.container  ← capture фаза (сверху вниз)
                    └── button   ← target фаза
                    └── button   ← bubble фаза (снизу вверх)
              └── div.container
        └── body
  └── html
document
```

```javascript
// capture: обработчик срабатывает на пути ВНИЗ (к target)
el.addEventListener("click", handler, { capture: true }); // или просто true

// bubble (default): срабатывает на пути ВВЕРХ (от target)
el.addEventListener("click", handler);                    // capture: false

// Почти все события всплывают — но не все:
// НЕ всплывают: focus, blur, load, unload, scroll (в старых браузерах)
// focusin, focusout — всплывают (аналоги focus/blur)
```

---

## addEventListener

```javascript
el.addEventListener(type, handler, options);

// options:
{
  capture: false,     // фаза: true = capture, false = bubble
  once: true,         // удалить обработчик после первого срабатывания
  passive: true,      // handler не вызовет preventDefault() — оптимизация scroll
  signal: abortController.signal, // AbortController для удаления
}

// passive: ВАЖНО для touch/wheel событий
// Браузер не будет ждать handler перед прокруткой → плавный scroll
window.addEventListener("touchstart", handler, { passive: true });
window.addEventListener("wheel", handler, { passive: true });

// once: автоматическое удаление
button.addEventListener("click", () => {
  console.log("Сработает только один раз");
}, { once: true });
```

---

## Event object

```javascript
el.addEventListener("click", (event) => {
  // Информация о событии
  event.type;           // "click"
  event.target;         // элемент на который кликнули (ИСТОЧНИК)
  event.currentTarget;  // элемент с обработчиком (где слушаем)
  event.bubbles;        // true — событие всплывает
  event.cancelable;     // true — можно отменить
  event.timeStamp;      // время в ms от начала страницы

  // Управление распространением
  event.stopPropagation();        // остановить всплытие/погружение
  event.stopImmediatePropagation(); // + остановить другие обработчики на этом элементе
  event.preventDefault();          // отменить действие браузера (submit, navigation...)

  // target vs currentTarget (КЛЮЧЕВОЕ ОТЛИЧИЕ)
  // При клике на <span> внутри <button>:
  // event.target = <span>     ← реальный источник
  // event.currentTarget = <button> ← где стоит обработчик
});

// Mouse events
el.addEventListener("click", (e) => {
  e.clientX; e.clientY;  // координаты в viewport
  e.pageX; e.pageY;      // координаты на странице (с учётом scroll)
  e.offsetX; e.offsetY;  // координаты внутри элемента
  e.button;               // 0=left, 1=middle, 2=right
  e.buttons;              // битовая маска нажатых кнопок
  e.ctrlKey; e.shiftKey; e.altKey; e.metaKey; // модификаторы
});

// Keyboard events
el.addEventListener("keydown", (e) => {
  e.key;     // "Enter", "a", "ArrowLeft", " " (space)
  e.code;    // "Enter", "KeyA", "ArrowLeft", "Space" (физическая клавиша)
  e.repeat;  // true если клавиша удерживается
  // key зависит от раскладки, code — нет
  // Для hotkeys используй e.code
});
```

---

## Делегирование событий

**Проблема:** 1000 элементов × обработчик = 1000 обработчиков в памяти.

**Решение:** Один обработчик на родителе + `event.target.closest()`.

```javascript
// ❌ Плохо: обработчик на каждый элемент
document.querySelectorAll(".btn").forEach(btn => {
  btn.addEventListener("click", handleClick);
});

// ✅ Делегирование: один обработчик на контейнере
document.querySelector(".list").addEventListener("click", (e) => {
  // closest ищет вверх от target — работает даже если клик на вложенный элемент
  const btn = e.target.closest(".btn");
  if (!btn) return; // клик не на кнопку
  const id = btn.dataset.id;
  handleClick(id);
});

// Работает с динамически добавленными элементами!
// Не надо вешать/снимать обработчики при добавлении/удалении элементов

// Реальный пример: таблица с кнопками удаления
document.querySelector("tbody").addEventListener("click", (e) => {
  const deleteBtn = e.target.closest("[data-action='delete']");
  if (!deleteBtn) return;
  const row = deleteBtn.closest("tr");
  const id = row.dataset.id;
  deleteRow(id);
  row.remove();
});
```

---

## Удаление обработчиков

```javascript
// Способ 1: removeEventListener (нужна ссылка на ту же функцию!)
function handler(e) { console.log(e.type); }
el.addEventListener("click", handler);
el.removeEventListener("click", handler); // ✅

// ❌ Не сработает — анонимная функция, разные ссылки!
el.addEventListener("click", (e) => console.log(e));
el.removeEventListener("click", (e) => console.log(e)); // не удалит

// Способ 2: AbortController — современный подход
const ac = new AbortController();

el.addEventListener("click", handler1, { signal: ac.signal });
el.addEventListener("mouseover", handler2, { signal: ac.signal });
document.addEventListener("keydown", handler3, { signal: ac.signal });

// Одним вызовом убираем ВСЕ обработчики!
ac.abort();

// Идеально для cleanup в React useEffect:
function useClickOutside(ref, callback) {
  useEffect(() => {
    const ac = new AbortController();
    document.addEventListener("mousedown", (e) => {
      if (!ref.current.contains(e.target)) callback();
    }, { signal: ac.signal });
    return () => ac.abort(); // cleanup
  }, []);
}

// Способ 3: { once: true } — автоматическое удаление
el.addEventListener("click", handler, { once: true });
```

---

## CustomEvent

```javascript
// Создание кастомного события
const event = new CustomEvent("user:login", {
  bubbles: true,      // всплывать?
  cancelable: true,   // можно отменить?
  detail: {           // передаём данные
    userId: 42,
    name: "Alice",
  },
});

// Отправка
document.querySelector(".login-btn").dispatchEvent(event);

// Слушаем
document.addEventListener("user:login", (e) => {
  console.log("Вошёл:", e.detail.name);
  console.log("ID:", e.detail.userId);
});

// Паттерн: Event Bus через CustomEvent
const EventBus = {
  emit(event, detail) {
    document.dispatchEvent(new CustomEvent(event, { detail, bubbles: true }));
  },
  on(event, handler, options) {
    document.addEventListener(event, handler, options);
    return () => document.removeEventListener(event, handler);
  },
};

const unsub = EventBus.on("cart:updated", (e) => {
  updateCartUI(e.detail.items);
});
EventBus.emit("cart:updated", { items: [1, 2, 3] });
unsub(); // отписка
```

---

## Часто используемые события

```javascript
// Мышь
"click", "dblclick", "contextmenu"
"mousedown", "mouseup", "mousemove"
"mouseenter", "mouseleave"   // НЕ всплывают
"mouseover", "mouseout"      // всплывают
"wheel"

// Клавиатура
"keydown", "keyup"
// keypress — устарел!

// Фокус
"focus", "blur"        // НЕ всплывают
"focusin", "focusout"  // всплывают (для делегирования)

// Форма
"submit", "reset", "change", "input"
// input — каждый символ, change — после потери фокуса

// Окно / документ
"DOMContentLoaded"  // DOM построен, до загрузки img/css
"load"              // всё загружено
"beforeunload"      // перед закрытием вкладки
"resize"            // изменение размера окна
"scroll"            // прокрутка

// Drag & Drop
"dragstart", "drag", "dragend"
"dragenter", "dragleave", "dragover", "drop"
// e.dataTransfer для данных

// Touch
"touchstart", "touchmove", "touchend", "touchcancel"
// e.touches, e.changedTouches — список точек касания

// Pointer API (объединяет mouse + touch + stylus)
"pointerdown", "pointermove", "pointerup", "pointercancel"
"pointerenter", "pointerleave"
// e.pointerType: "mouse" | "touch" | "pen"
// e.pressure, e.tiltX, e.tiltY — для stylus
```

---

## Вопросы на интервью

1. **Три фазы события — что это?**
   > Capture (погружение): событие идёт от `document` вниз к `target`. Target: срабатывает на самом элементе. Bubble (всплытие): событие идёт от `target` вверх к `document`. По умолчанию обработчики слушают bubble фазу. capture используется редко — когда нужно перехватить событие до того как оно достигнет target.

2. **`event.target` vs `event.currentTarget`?**
   > `target` — элемент на котором произошло событие (источник, может быть глубоко вложенным). `currentTarget` — элемент на котором стоит обработчик. При делегировании они разные: обработчик на `ul`, клик по `li` → `target = li`, `currentTarget = ul`.

3. **Зачем делегирование и как реализовать?**
   > Один обработчик на контейнере вместо N обработчиков на каждом элементе. Преимущества: меньше памяти, работает с динамическими элементами. Реализация: `addEventListener` на контейнере, в обработчике `e.target.closest(selector)` для нахождения нужного элемента.

4. **Почему нельзя удалить анонимный обработчик через `removeEventListener`?**
   > `removeEventListener` ищет обработчик по ссылке. Две анонимные функции — две разные ссылки, хотя код одинаков. Решения: сохранить ссылку в переменную, использовать `{ once: true }`, использовать `AbortController.abort()`.

5. **`stopPropagation` vs `stopImmediatePropagation`?**
   > `stopPropagation` — останавливает переход события к другим элементам (следующие фазы/родители). Другие обработчики на ЭТОМ элементе ещё выполнятся. `stopImmediatePropagation` — то же плюс отменяет все оставшиеся обработчики на этом же элементе.

---

## Примеры

```
Открой в браузере:
04-javascript-dom/02-events/examples/events.html
```
