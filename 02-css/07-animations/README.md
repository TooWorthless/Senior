# 07 · Анимации и переходы

[← CSS](../README.md)

---

## Содержание

1. [transition vs animation](#transition-vs-animation)
2. [Какие свойства можно анимировать](#какие-свойства-можно-анимировать)
3. [will-change — правильное использование](#will-change--правильное-использование)
4. [Compositor-only свойства](#compositor-only-свойства)
5. [Prefers-reduced-motion](#prefers-reduced-motion)
6. [Вопросы на интервью](#вопросы-на-интервью)
7. [Примеры кода](#примеры-кода)

---

## transition vs animation

| | `transition` | `animation` |
|---|---|---|
| Триггер | Смена значения свойства | Автоматически / JS |
| Направление | A → B (один раз) | Keyframes (многократно) |
| Контроль | Нет | Полный (delay, iteration, direction) |
| JS управление | Нет | `element.getAnimations()` |
| Паузирование | Нет | `animation-play-state: paused` |

```css
/* transition: срабатывает при смене состояния */
.button {
  background: blue;
  transition: background 300ms ease, transform 200ms ease;
}
.button:hover {
  background: darkblue;
  transform: scale(1.05);
}

/* animation: запускается автоматически */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
  /* name duration timing-function delay iteration-count direction fill-mode */
}

/* Полный синтаксис */
.element {
  animation:
    fadeIn 300ms ease-out forwards,      /* несколько анимаций */
    slideUp 400ms ease-out 100ms both;   /* с задержкой */
}
```

### `animation-fill-mode`

```css
/* none: default — нет эффекта до/после анимации */
/* forwards: сохранить состояние последнего keyframe */
/* backwards: применить 0% keyframe в период delay */
/* both: forwards + backwards */
```

---

## Какие свойства можно анимировать

### Уровни анимируемости (по стоимости)

```
Composite (только GPU):
  transform, opacity, filter (частично)
  → Не вызывают Layout или Paint
  → Плавные 60fps даже при нагрузке

Paint (GPU + CPU):
  color, background-color, box-shadow, border-radius, outline
  → Вызывают Repaint (перерисовку)
  → Обычно OK если элемент не огромный

Layout (самые дорогие):
  width, height, margin, padding, top, left, font-size, display
  → Вызывают Reflow (пересчёт layout) → Repaint → Composite
  → Анимировать нужно через transform
```

```css
/* ❌ Дорого: вызывает reflow */
.slide-in {
  animation: slideInBad 300ms ease;
}
@keyframes slideInBad {
  from { left: -200px; }    /* layout property */
  to   { left: 0; }
}

/* ✅ Дёшево: только composite */
.slide-in {
  animation: slideInGood 300ms ease;
}
@keyframes slideInGood {
  from { transform: translateX(-200px); }
  to   { transform: translateX(0); }
}
```

---

## will-change — правильное использование

`will-change` создаёт новый compositor layer в GPU — браузер готовится к анимации заранее.

```css
/* ✅ Корректное использование: только перед анимацией */
.card {
  transition: transform 300ms;
}
.card:hover {
  will-change: transform; /* Применять только при hover */
  transform: scale(1.02);
}

/* ❌ Антипаттерн: на всех элементах всегда */
* { will-change: transform; }         /* Не делай так */
.card { will-change: transform; }     /* Без причины — waste памяти */

/* ✅ Через JS: ставим/снимаем */
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform';
});
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto'; /* Освободить ресурсы */
});
```

**Последствия злоупотребления:**
- Каждый `will-change: transform` = новый compositor layer = **память GPU**
- На мобильных устройствах лимит GPU памяти → падение производительности или крэш
- Создаёт Stacking Context (влияет на z-index)

---

## Compositor-only свойства

Только эти свойства анимируются без reflow/repaint:

```css
/* transform: весь спектр трансформаций */
transform: translate(x, y);       /* движение */
transform: scale(x, y);           /* масштаб */
transform: rotate(deg);           /* поворот */
transform: skew(x, y);            /* наклон */
transform: translateZ(0);         /* создать compositor layer */
transform: translate3d(x, y, z);  /* аппаратное ускорение */

/* opacity: прозрачность */
opacity: 0;   /* скрыть */
opacity: 1;   /* показать */

/* filter: некоторые, не все */
filter: blur(4px);
filter: brightness(1.1);

/* clip-path: с поддержкой Chrome/FF */
clip-path: circle(50%);
```

### Паттерны анимации элементов

```css
/* Fade in/out вместо display: none */
.hidden {
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms;
}
.visible {
  opacity: 1;
  pointer-events: auto;
}

/* Slide вместо height: 0 / height: auto */
.slide {
  transform: translateY(-100%);
  transition: transform 300ms ease;
}
.slide.open {
  transform: translateY(0);
}

/* height: auto анимация — через grid trick */
.expandable {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease;
}
.expandable.open {
  grid-template-rows: 1fr;
}
.expandable > * {
  overflow: hidden; /* Обязательно */
}
```

---

## Prefers-reduced-motion

WCAG 2.3.3 (AAA): движение должно быть контролируемым. Многие пользователи (вестибулярные расстройства, эпилепсия) страдают от анимаций.

```css
/* Базовая защита */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Тонкая настройка: отключить decorative, сохранить functional */
@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; }         /* декоративный спиннер */
  .loading { opacity: 0.7; }           /* альтернативное состояние */
}

/* Предпочтительный подход: opt-in анимации */
.animated {
  /* Нет анимации по умолчанию */
}
@media (prefers-reduced-motion: no-preference) {
  .animated {
    animation: fadeIn 300ms ease;
  }
}
```

---

## Вопросы на интервью

1. **Почему `left/top` нельзя анимировать производительно?**
   > `left`/`top` вызывают **reflow** — браузер пересчитывает расположение всех элементов в потоке, затем repaint, затем composite. Это блокирует main thread. `transform: translate()` работает только на compositor layer в GPU — main thread не задействован, 60fps даже при нагрузке.

2. **Что делает `will-change` и когда он вредит?**
   > `will-change` создаёт compositor layer заранее — браузер готовится к анимации. Вредит когда применяется на многих элементах без причины: каждый layer занимает GPU память. На мобильных с ограниченной памятью — снижение производительности или крэш вкладки.

3. **Как анимировать `height: auto`?**
   > Нельзя напрямую (браузер не может интерполировать `auto`). Паттерны: Grid trick (`grid-template-rows: 0fr → 1fr`), `max-height` с завышенным значением (неточное время), FLIP animation через JS, Web Animations API.

4. **`animation-fill-mode: both` vs `forwards`?**
   > `forwards`: после окончания — применять финальный keyframe. `backwards`: во время `animation-delay` — применять начальный keyframe. `both` = forwards + backwards. Важно при использовании `delay` — без `backwards` элемент будет в исходном состоянии во время задержки.

5. **Как соблюдать `prefers-reduced-motion` в React-компонентах?**
   > `const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches` — или хук, который слушает изменения. В Framer Motion: `useReducedMotion()`. Принцип: отключать decorative анимации, сохранять functional (progress bars, loading states).

---

## Примеры кода

- [`examples/animations.html`](./examples/animations.html) — transition, keyframes, compositor-only, height: auto, reduced-motion
