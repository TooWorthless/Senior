# 04 · Observers & requestAnimationFrame

[← JavaScript & DOM](../README.md)

---

## Содержание

1. [IntersectionObserver](#intersectionobserver)
2. [MutationObserver](#mutationobserver)
3. [ResizeObserver](#resizeobserver)
4. [PerformanceObserver](#performanceobserver)
5. [requestAnimationFrame](#requestanimationframe)
6. [Вопросы на интервью](#вопросы-на-интервью)

---

## IntersectionObserver

Отслеживает пересечение элемента с viewport или другим элементом — **без scroll events**.

```javascript
// Базовое использование — lazy loading
const observer = new IntersectionObserver((entries, obs) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;     // загружаем изображение
      obs.unobserve(img);            // больше не следим
    }
  }
}, {
  root: null,         // null = viewport
  rootMargin: "0px",  // расширить/сжать область пересечения
  threshold: 0,       // 0 = первый пиксель, 1 = полностью виден
});

document.querySelectorAll("img[data-src]").forEach(img => {
  observer.observe(img);
});

// threshold: число или массив
// 0    — любое пересечение
// 0.5  — 50% элемента видно
// 1.0  — весь элемент виден
// [0, 0.25, 0.5, 0.75, 1] — callback при каждом из этих порогов

// Infinite scroll
const sentinel = document.getElementById("sentinel"); // элемент-маркер внизу страницы
const loadMore = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) loadNextPage();
}, { rootMargin: "200px" }); // начать загрузку за 200px до маркера

loadMore.observe(sentinel);

// Entry properties
entry.isIntersecting;      // boolean — виден сейчас
entry.intersectionRatio;   // 0..1 — какая часть видна
entry.boundingClientRect;  // размер элемента
entry.intersectionRect;    // размер пересечения
entry.rootBounds;          // размер root (viewport)
entry.target;              // наблюдаемый элемент
entry.time;                // timestamp

// Анимации при появлении
const animObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    entry.target.classList.toggle("visible", entry.isIntersecting);
  });
}, { threshold: 0.1 });

document.querySelectorAll(".animate-on-scroll").forEach(el => animObs.observe(el));
```

---

## MutationObserver

Реагирует на изменения в DOM-дереве. Замена устаревшего `DOMSubtreeModified`.

```javascript
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    console.log(mutation.type); // "childList" | "attributes" | "characterData"

    if (mutation.type === "childList") {
      mutation.addedNodes;   // NodeList добавленных узлов
      mutation.removedNodes; // NodeList удалённых узлов
    }

    if (mutation.type === "attributes") {
      mutation.attributeName; // имя изменённого атрибута
      mutation.oldValue;      // старое значение (если attributeOldValue: true)
      mutation.target.getAttribute(mutation.attributeName); // новое
    }

    if (mutation.type === "characterData") {
      mutation.oldValue; // старый текст (если characterDataOldValue: true)
      mutation.target.textContent; // новый
    }
  }
});

observer.observe(targetElement, {
  childList: true,          // добавление/удаление дочерних узлов
  subtree: true,             // рекурсивно весь подтор
  attributes: true,          // изменения атрибутов
  attributeFilter: ["class", "data-id"], // только эти атрибуты
  attributeOldValue: true,   // записывать старое значение атрибута
  characterData: true,       // изменения текстовых узлов
  characterDataOldValue: true,
});

observer.disconnect(); // остановить наблюдение
const pending = observer.takeRecords(); // получить накопленные mutations синхронно

// Паттерны использования:
// 1. Автоматическое обновление UI при изменении DOM (headless CMS, виджеты)
// 2. Логирование изменений (accessibility tree monitors)
// 3. React DevTools — именно так отслеживает изменения
// 4. Перехват динамически вставленных скриптов (CSP enforcement)
// 5. Отслеживание изменений атрибутов (custom elements, directives)

// Пример: наблюдение за добавлением элементов в список
const listObserver = new MutationObserver((mutations) => {
  mutations
    .filter(m => m.type === "childList")
    .flatMap(m => [...m.addedNodes])
    .filter(n => n.nodeType === Node.ELEMENT_NODE)
    .forEach(el => {
      el.classList.add("fade-in");
    });
});

listObserver.observe(document.querySelector(".dynamic-list"), {
  childList: true,
});
```

---

## ResizeObserver

Отслеживает изменение размеров элемента (не только window resize).

```javascript
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    // Размеры в разных системах единиц
    const { width, height } = entry.contentRect;          // content box
    entry.borderBoxSize[0].inlineSize;   // с border и padding
    entry.contentBoxSize[0].inlineSize;  // без padding
    entry.devicePixelContentBoxSize[0];  // в физических пикселях

    console.log(`${entry.target.id}: ${width}px × ${height}px`);

    // Адаптивная логика на уровне компонента (Container Queries до CSS)
    if (width < 400) entry.target.classList.add("compact");
    else entry.target.classList.remove("compact");
  }
});

ro.observe(document.querySelector(".resizable"));
ro.unobserve(el); // перестать следить за конкретным
ro.disconnect();   // остановить всё

// ВАЖНО: ResizeObserver работает синхронно с layout
// Не вызывает бесконечный цикл если изменяешь стили внутри callback
// (браузер оптимизирует это)
```

---

## PerformanceObserver

Наблюдает за метриками производительности (Web Vitals, ресурсы, long tasks).

```javascript
// Long Tasks (> 50ms блокируют main thread)
const longTaskObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn(`Long task: ${entry.duration.toFixed(0)}ms`, entry.attribution);
  }
});
longTaskObserver.observe({ type: "longtask", buffered: true });

// Core Web Vitals — LCP
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const last = entries[entries.length - 1];
  console.log("LCP:", last.startTime.toFixed(0), "ms");
}).observe({ type: "largest-contentful-paint", buffered: true });

// CLS
let cls = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) cls += entry.value;
  }
  console.log("CLS:", cls.toFixed(3));
}).observe({ type: "layout-shift", buffered: true });

// Загрузка ресурсов
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.duration.toFixed(0) + "ms", entry.initiatorType);
  }
}).observe({ type: "resource", buffered: true });

// Navigation timing
new PerformanceObserver((list) => {
  const [nav] = list.getEntries();
  console.log({
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    tcp: nav.connectEnd - nav.connectStart,
    ttfb: nav.responseStart - nav.requestStart,
    domLoad: nav.domContentLoadedEventEnd - nav.fetchStart,
    total: nav.loadEventEnd - nav.fetchStart,
  });
}).observe({ type: "navigation", buffered: true });
```

---

## requestAnimationFrame

Выполняет callback перед следующей отрисовкой браузера (~60fps = каждые 16ms).

```javascript
// Базовый loop
let id;
function animate(timestamp) {
  // timestamp — DOMHighResTimeStamp (ms с начала страницы)
  el.style.transform = `translateX(${Math.sin(timestamp / 1000) * 100}px)`;
  id = requestAnimationFrame(animate); // следующий кадр
}
id = requestAnimationFrame(animate);
// Остановить:
cancelAnimationFrame(id);

// Отличие от setInterval(fn, 16):
// - rAF синхронизирован с частотой экрана (60/120/144fps)
// - rAF автоматически паузится когда вкладка не активна (экономия батареи)
// - rAF выполняется ДО рисования кадра (изменения видны в этом кадре)
// - setInterval может накапливать задержку, rAF — нет

// Плавная анимация с easing
function animateTo(el, targetX, duration = 300) {
  const startX = parseFloat(el.style.transform.match(/-?\d+/) ?? 0);
  const startTime = performance.now();

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    el.style.transform = `translateX(${startX + (targetX - startX) * eased}px)`;
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

// requestIdleCallback — низкоприоритетная работа когда браузер свободен
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && queue.length > 0) {
    processItem(queue.shift());
  }
  if (queue.length > 0) requestIdleCallback(arguments.callee);
}, { timeout: 2000 }); // максимум 2 секунды ждать
```

---

## Вопросы на интервью

1. **Как реализовать lazy loading без scroll event?**
   > `IntersectionObserver` — отслеживает пересечение с viewport без постоянного polling. Преимущества: нет throttling/debounce scroll event, работает вне main thread (observer API), точнее (учитывает transform, overflow). Пример: `observer.observe(img)`, при `entry.isIntersecting` заменить `data-src` → `src`.

2. **Зачем MutationObserver? Что было до?**
   > До MutationObserver существовали Mutation Events (`DOMSubtreeModified`, `DOMNodeInserted`) — синхронные события на каждое изменение, блокировали main thread. MutationObserver — асинхронный, батчит изменения, не блокирует. Используется в React DevTools, accessibility tools, custom elements, polyfill'ах.

3. **ResizeObserver vs window resize event?**
   > `window.addEventListener("resize")` — только для изменения размера всего окна, не отдельных элементов. `ResizeObserver` — следит за конкретным элементом, работает для: flexbox перераспределения, DOM вставки, CSS-анимаций меняющих размер. Замена "Container Queries" до нативной поддержки.

4. **requestAnimationFrame vs setInterval(fn, 16)?**
   > rAF: синхронизирован с экраном (точная частота), автоматически паузится на неактивных вкладках, callback получает точный timestamp, изменения видны в текущем кадре. `setInterval` с 16ms накапливает задержку, не паузится, не знает о частоте экрана. Для анимаций всегда rAF.

5. **Когда использовать requestIdleCallback?**
   > Для некритичной фоновой работы: аналитика, prefetch, garbage collection, кэширование. Выполняется когда main thread простаивает. `deadline.timeRemaining()` показывает сколько ms осталось до следующего кадра. `timeout` параметр — максимальное ожидание.

---

## Пример

```
Открой в браузере:
04-javascript-dom/04-observers/examples/observers.html
```
