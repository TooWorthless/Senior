# 04 · JavaScript & DOM

[← На главную](../README.md)

DOM — это **живое дерево объектов**, которое браузер строит из HTML. JS манипулирует им через Web API. Этот модуль — всё что происходит между JS-движком и пикселями на экране.

> **Запуск примеров:** Все файлы — HTML. Открывай в браузере напрямую или через Live Server. DevTools Console покажет вывод.
>
> ```bash
> # Если есть Node.js + live-server:
> npx live-server 04-javascript-dom/
> # Или просто открой нужный .html файл в браузере
> ```

---

## Подмодули

| # | Тема | Ключевые концепции |
|---|------|--------------------|
| 01 | [DOM basics](./01-dom-basics/README.md) | Node types, document, traversal, live vs static collections |
| 02 | [Events](./02-events/README.md) | Bubbling/capturing, delegation, CustomEvent, AbortController |
| 03 | [DOM manipulation](./03-dom-manipulation/README.md) | createElement, DocumentFragment, innerHTML vs textContent, виртуальный DOM |
| 04 | [Observers & rAF](./04-observers/README.md) | IntersectionObserver, MutationObserver, ResizeObserver, requestAnimationFrame |
| 05 | [Browser APIs](./05-browser-apis/README.md) | Storage, History, URL, Web Workers, BroadcastChannel, Clipboard |
| 06 | [Canvas](./06-canvas/README.md) | Canvas 2D API, анимация, pixel manipulation, offscreen canvas |

---

## Архитектура браузера (кратко)

```
HTML → Parse → DOM Tree
CSS  → Parse → CSSOM Tree
               ↓
         Render Tree (DOM + CSSOM без display:none)
               ↓
          Layout (Reflow) — вычисление геометрии
               ↓
          Paint (Repaint) — пиксели слоёв
               ↓
          Composite — слои → экран (GPU)
```

**Что дорого:**
- **Reflow** (Layout) — изменение геометрии (`width`, `height`, `top`, `margin`)
- **Repaint** — изменение внешнего вида без геометрии (`color`, `background`)
- **Composite** — только `transform`, `opacity` — GPU, дёшево

---

## Топ вопросов на интервью

```
DOM:       Разница Node vs Element?
           live vs static коллекция — что это?
           Что такое reflow и как его избежать?

Events:    Фазы событий: capture → target → bubble
           Как работает делегирование событий?
           Разница removeEventListener vs AbortController?

Manipulation: innerHTML vs textContent vs innerText?
              Зачем DocumentFragment?
              Как React реализует Virtual DOM?

Observers: Как сделать lazy loading без scroll event?
           Зачем MutationObserver вместо DOMSubtreeModified?

Workers:   Что такое Web Worker и когда применять?
           Разница Worker vs SharedWorker vs ServiceWorker?

Storage:   Отличия localStorage / sessionStorage / IndexedDB / cookie?
           Что такое same-origin policy для storage?
```
