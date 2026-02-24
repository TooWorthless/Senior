# 10 · Производительность CSS

[← CSS](../README.md)

---

## Содержание

1. [Reflow, Repaint, Composite](#reflow-repaint-composite)
2. [Что вызывает что](#что-вызывает-что)
3. [`contain` property](#contain-property)
4. [`content-visibility`](#content-visibility)
5. [CSS и Critical Rendering Path](#css-и-critical-rendering-path)
6. [Вопросы на интервью](#вопросы-на-интервью)

---

## Reflow, Repaint, Composite

```
Layout (Reflow):
  Пересчёт размеров и положения всех элементов в потоке.
  Дорогой: затрагивает часть или весь документ.
  Вызывается: изменение size/position свойств

    ↓

Paint (Repaint):
  Заполнение пикселей в памяти (CPU → Raster).
  Дорогой: особенно для больших/сложных областей.
  Вызывается: изменение визуальных свойств без layout

    ↓

Composite:
  Объединение слоёв GPU (Compositor Thread).
  Дёшевый: отдельный поток от main thread.
  Вызывается: transform, opacity
```

---

## Что вызывает что

### Reflow (Layout) + Repaint + Composite

```css
/* Изменение этих свойств вызывает полный пересчёт */
width, height
margin, padding
border (меняет размер)
top, left, right, bottom
display, position
font-size, font-weight
overflow
flex-*, grid-*
```

### Только Repaint (без Reflow)

```css
color, background-color
border-color, border-radius
box-shadow
outline
visibility /* visibility: hidden не меняет layout */
text-decoration
```

### Только Composite (GPU, без main thread)

```css
transform   /* translate, scale, rotate, skew */
opacity
filter      /* blur, brightness, etc. */
clip-path   /* в некоторых браузерах */
```

### Принудительный Reflow из JavaScript

```javascript
/* Чтение layout-свойств вызывает принудительный flush */
/* Layout Thrashing: чередование чтения и записи */

// ❌ Layout Thrashing: 3 reflow
element.style.width = '100px';
const h = element.offsetHeight; // flush!
element.style.height = h + 'px';
const w = element.offsetWidth;  // flush!
element.style.margin = w + 'px';

// ✅ Батчинг: 1 reflow
const h = element.offsetHeight; // читаем все сразу
const w = element.offsetWidth;
element.style.width = '100px';  // потом пишем
element.style.height = h + 'px';
element.style.margin = w + 'px';

// ✅ requestAnimationFrame для записи
requestAnimationFrame(() => {
  element.style.transform = `translateX(${x}px)`;
});
```

---

## `contain` property

Сообщает браузеру что поддерево элемента изолировано — оптимизация reflow/repaint.

```css
.component {
  contain: layout;   /* Изменения внутри не влияют на внешний layout */
  contain: paint;    /* Дочерние не рисуются вне границ элемента */
  contain: size;     /* Размер не зависит от содержимого */
  contain: style;    /* CSS-счётчики изолированы */
  contain: strict;   /* = size layout paint style */
  contain: content;  /* = layout paint style */
}
```

```css
/* Практика: компоненты с тяжёлым содержимым */
.infinite-list-item {
  contain: layout style paint; /* = content */
  /* Изменение одного item не вызывает reflow всего списка */
}
```

---

## `content-visibility`

Пропускает rendering для off-screen контента:

```css
.article-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px; /* Резервируем место (предотвращает CLS) */
}
/* Браузер не рендерит секцию пока она не появится в viewport */
/* Огромный прирост для длинных страниц */
```

---

## CSS и Critical Rendering Path

```html
<!-- CSS — render-blocking: браузер ждёт CSSOM до первого рендера -->
<link rel="stylesheet" href="/styles.css">

<!-- Не render-blocking: print не применяется к screen -->
<link rel="stylesheet" href="/print.css" media="print">

<!-- Не render-blocking для текущего экрана: -->
<link rel="stylesheet" href="/wide.css" media="(min-width: 1200px)">
<!-- Но загружается всегда! -->

<!-- Техника: inline critical CSS -->
<style>
  /* Минимальный CSS для above-the-fold */
  body { margin: 0; font-family: sans-serif; }
  .hero { min-height: 100vh; }
</style>
<!-- Остальной CSS async (через JS или preload trick) -->
<link rel="preload" href="/styles.css" as="style" onload="this.rel='stylesheet'">
```

---

## Вопросы на интервью

1. **Разница Reflow, Repaint, Composite?**
   > Reflow — пересчёт layout всего документа (дорогой). Repaint — перерисовка пикселей без layout (средний). Composite — объединение GPU слоёв (дёшево, отдельный поток). Анимировать нужно только composite-only свойства (transform, opacity).

2. **Что такое Layout Thrashing?**
   > Чередование чтения layout-свойств (offsetWidth, getBoundingClientRect) и их изменения в цикле. Каждое чтение после записи вызывает принудительный synchronous reflow. Решение: батчить чтения, потом записи, или использовать rAF.

3. **Что такое `contain` и зачем нужен?**
   > CSS containment — подсказка браузеру что содержимое элемента изолировано. `contain: layout` — изменения внутри не вызывают reflow снаружи. Полезно для компонентов в бесконечных списках, виджетов, независимых блоков.

4. **Чем `visibility: hidden` отличается от `display: none` с точки зрения rendering?**
   > `display: none` — элемент выпадает из layout (reflow), место не занимает. `visibility: hidden` — элемент остаётся в layout (место занимает), только не отрисовывается (repaint). `opacity: 0` — остаётся в layout И рисуется (просто прозрачный), участвует в pointer-events.

---

## Примеры кода

- [`examples/rendering-pipeline.html`](./examples/rendering-pipeline.html) — визуализация reflow vs repaint, layout thrashing
