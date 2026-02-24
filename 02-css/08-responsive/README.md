# 08 · Адаптивность

[← CSS](../README.md)

---

## Содержание

1. [Media Queries: синтаксис и range syntax](#media-queries)
2. [Container Queries](#container-queries)
3. [clamp() и fluid typography](#clamp-и-fluid-typography)
4. [Логические свойства](#логические-свойства)
5. [Вопросы на интервью](#вопросы-на-интервью)
6. [Примеры кода](#примеры-кода)

---

## Media Queries

### Синтаксис Level 4 (range syntax)

```css
/* Старый синтаксис */
@media (min-width: 768px) { }
@media (max-width: 1023px) { }
@media (min-width: 768px) and (max-width: 1023px) { }

/* Новый Range синтаксис (Level 4, Chrome 104+, Firefox 63+) */
@media (width >= 768px) { }
@media (width <= 1023px) { }
@media (768px <= width <= 1023px) { }

/* Медиа типы */
@media screen { }
@media print { }
@media (prefers-color-scheme: dark) { }
@media (prefers-color-scheme: light) { }
@media (prefers-reduced-motion: reduce) { }
@media (prefers-contrast: high) { }
@media (forced-colors: active) { }  /* Windows High Contrast Mode */
@media (hover: hover) { }           /* устройство поддерживает hover */
@media (pointer: fine) { }         /* точный указатель (мышь) */
@media (pointer: coarse) { }       /* неточный (тач) */
@media (orientation: landscape) { }
@media (display-mode: standalone) { } /* PWA */

/* Комбинирование */
@media (width >= 768px) and (hover: hover) { }
@media screen and (width >= 768px) { }
```

### Mobile-first vs Desktop-first

```css
/* Mobile-first: базовые стили для mobile, расширяем для больших */
.grid {
  display: flex;
  flex-direction: column;
}
@media (width >= 768px) {
  .grid { flex-direction: row; }
}
@media (width >= 1200px) {
  .grid { gap: 2rem; }
}

/* Desktop-first: базовые для desktop, уменьшаем */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
@media (width <= 767px) {
  .grid { grid-template-columns: 1fr; }
}
```

> 💬 **Вопрос:** «Mobile-first vs desktop-first — что предпочтительнее?»

**Ответ:** Mobile-first — industry standard. Причины: прогрессивное улучшение (базовый CSS работает везде), меньше CSS для медленных соединений, дисциплинирует приоритизировать контент. Технически: `min-width` queries применяются браузером по порядку — лучше для производительности.

---

## Container Queries

Реагируют на размер **контейнера**, не viewport. Решает проблему компонентов которые должны адаптироваться где бы ни находились.

```css
/* Объявить контейнер */
.card-wrapper {
  container-type: inline-size; /* отслеживать inline (ширину) */
  container-name: card;        /* опционально: именованный контейнер */
}

/* Запрос к контейнеру */
@container (width >= 400px) {
  .card {
    flex-direction: row; /* горизонтальная карточка */
  }
}

/* Именованный контейнер */
@container card (width >= 600px) {
  .card-title { font-size: 1.5rem; }
}

/* Container query units */
.element {
  font-size: 4cqi;  /* 4% от inline-size контейнера */
  width: 50cqb;     /* 50% от block-size контейнера */
  padding: 2cqmin;  /* 2% от меньшего измерения */
}
```

### Разница с Media Queries

```
Media Query: компонент адаптируется к viewport
→ Проблема: один компонент в narrow sidebar ≠ один в wide main content

Container Query: компонент адаптируется к своему контейнеру
→ Компонент работает корректно в любом месте
```

```css
/* БЕЗ container queries: sidebar-компонент сломан */
.card { }
@media (min-width: 768px) {
  .card { flex-direction: row; }
  /* Но если .card в сайдбаре шириной 300px — row неуместен */
}

/* С container queries: всегда правильно */
.card-container { container-type: inline-size; }
@container (width >= 400px) {
  .card { flex-direction: row; }
  /* Адаптируется к реальному доступному пространству */
}
```

---

## clamp() и fluid typography

```css
/* clamp(min, preferred, max) */
font-size: clamp(1rem, 2.5vw, 2rem);
/* На маленьком: 1rem (min)
   На среднем: 2.5vw (предпочтительный, fluid)
   На большом: 2rem (max) */

/* Fluid spacing */
padding: clamp(1rem, 5vw, 3rem);
gap: clamp(0.5rem, 2vw, 1.5rem);

/* Fluid width */
width: clamp(300px, 50%, 800px);

/* min() и max() */
width: min(90%, 1200px);    /* не более 1200px, но адаптируется */
font-size: max(1rem, 2vw);  /* не меньше 1rem */
```

### Формула fluid typography

```css
/* Задача: 16px на 320px, 24px на 1440px */
/* Формула: clamp(min, viewport-relative, max) */
/* preferred = min + (max - min) * (100vw - min-vw) / (max-vw - min-vw) */
/* = 16px + 8 * (100vw - 320px) / (1440 - 320) */
/* = 1rem + 0.714vw (приближённо) */

font-size: clamp(1rem, 1rem + 0.714vw, 1.5rem);

/* Автоматический расчёт: https://utopia.fyi/type/calculator */
```

---

## Логические свойства

Физические свойства (left, right, top, bottom) зависят от направления текста. Логические адаптируются автоматически для RTL и вертикальных письмен.

```css
/* Физические → Логические */
margin-top        → margin-block-start
margin-bottom     → margin-block-end
margin-left       → margin-inline-start
margin-right      → margin-inline-end

padding-top       → padding-block-start
border-left       → border-inline-start

width             → inline-size
height            → block-size
min-width         → min-inline-size
max-height        → max-block-size

top               → inset-block-start
left              → inset-inline-start
inset: 0          → все четыре стороны (физическое и логическое)

text-align: left  → text-align: start
text-align: right → text-align: end

/* Shorthand'ы */
margin-block: 1rem 2rem;          /* top bottom */
margin-inline: auto;              /* left right: auto */
padding-block: 1rem;
border-inline: 1px solid;
inset-block: 0;
```

```css
/* Пример: работает в LTR и RTL без изменений */
.nav-item {
  padding-inline: 1rem;            /* не padding-left/right */
  border-inline-end: 1px solid;   /* не border-right */
  margin-inline-start: auto;      /* не margin-left */
}
```

---

## Вопросы на интервью

1. **Container Queries vs Media Queries — в чём ключевое отличие?**
   > MQ реагируют на viewport. CQ — на размер контейнера. Компонент с CQ адаптируется корректно в сайдбаре, в main content, в модальном окне — везде, где оказывается. MQ — глобальные, CQ — component-scoped.

2. **Что такое `container-type: inline-size` vs `size`?**
   > `inline-size` — отслеживать только ширину (ось inline). `size` — ширину и высоту. `inline-size` предпочтительнее — `size` создаёт дополнительные ограничения на высоту.

3. **Как `clamp()` реализует fluid typography?**
   > `clamp(min, preferred, max)` — значение зажато между min и max, посередине — fluid значение (обычно viewport-relative). Позволяет плавно масштабировать типографику без breakpoints.

4. **Зачем логические свойства в 2025?**
   > Для RTL языков (арабский, иврит) и вертикальных письмен (японский). Логические свойства автоматически адаптируются к `direction` и `writing-mode`. Без них RTL требует дублирование стилей или `[dir="rtl"]` оверрайды.

---

## Примеры кода

- [`examples/container-queries.html`](./examples/container-queries.html) — CQ: карточки в разных контейнерах
- [`examples/fluid-typography.html`](./examples/fluid-typography.html) — clamp(), fluid scale, логические свойства
