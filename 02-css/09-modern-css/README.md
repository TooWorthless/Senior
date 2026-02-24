# 09 · Современный CSS (2023–2025)

[← CSS](../README.md)

---

## Содержание

1. [CSS Nesting](#css-nesting)
2. [`@layer` (recap + advanced)](#layer-recap--advanced)
3. [`:has()` (recap)](#has-recap)
4. [`@scope`](#scope)
5. [Anchor Positioning](#anchor-positioning)
6. [View Transitions API](#view-transitions-api)
7. [Вопросы на интервью](#вопросы-на-интервью)

---

## CSS Nesting

Нативный CSS нестинг (без препроцессоров). Поддержка: Chrome 112+, Firefox 117+, Safari 16.5+.

```css
/* Нативный нестинг */
.card {
  padding: 1rem;
  border-radius: 8px;

  /* Вложенный селектор: & — ссылка на родителя */
  & .title {
    font-size: 1.25rem;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  &.featured {
    border: 2px solid gold;
  }

  /* Media query внутри правила */
  @media (width >= 768px) {
    padding: 2rem;
  }

  /* Псевдоэлементы */
  &::before {
    content: '';
  }

  /* Descendant без & — работает, но с ограничениями */
  /* .title — такой же как & .title */
}
```

> ⚠️ **Ловушка:** Без `&` нестинг работает как descendant selector (`& .child`), но вложенный элемент нельзя использовать как element-only selector без `&`. `.card { button { } }` = `.card button {}` — это OK. `.card { p { } }` тоже OK. НО: `.card { button.active { } }` требует `& button.active`.

### Отличие от SASS

```scss
/* SASS: & конкатенируется */
.block {
  &__element { }    /* → .block__element */
  &--modifier { }   /* → .block--modifier */
}

/* Нативный CSS: & это ссылка на родительский селектор целиком */
.block {
  &__element { }    /* НЕ работает как BEM! = .block __element (невалидно) */
  /* Нужно: */
}
.block__element { } /* BEM в нативном CSS — не нестить */
```

---

## @scope

Ограничивает применение стилей до конкретного поддерева DOM:

```css
/* Стили применяются только внутри .card */
@scope (.card) {
  p { color: blue; } /* Только <p> внутри .card */
  h2 { font-size: 1.25rem; }
}

/* С исключениями: внутри .card, но не внутри .widget */
@scope (.card) to (.widget) {
  p { color: blue; } /* Не применится к p внутри .card .widget */
}

/* Inline @scope через style attribute */
/* <div><style>@scope { p { color: red } }</style><p>Красный</p></div> */
```

---

## Anchor Positioning

Позиционирование элемента относительно другого (anchor) элемента. Решает задачу тултипов, дропдаунов без JavaScript.

```css
/* Объявить якорь */
.button {
  anchor-name: --my-button;
}

/* Позиционировать относительно якоря */
.tooltip {
  position: absolute;
  position-anchor: --my-button;

  /* inset-area: позиция относительно якоря */
  inset-area: block-start center; /* над кнопкой, по центру */

  /* или через anchor() */
  bottom: anchor(top);
  left: anchor(center);
  translate: -50% 0;
}
```

---

## View Transitions API

Анимированные переходы между состояниями страницы (SPA и MPA).

```javascript
// SPA: оборачиваем изменение состояния
document.startViewTransition(() => {
  // DOM изменения здесь
  updateDOM();
});
```

```css
/* CSS: кастомизация переходов */
::view-transition-old(root) {
  animation: fade-out 300ms ease;
}
::view-transition-new(root) {
  animation: fade-in 300ms ease 300ms both;
}

/* Именованные transitions для отдельных элементов */
.hero-image {
  view-transition-name: hero; /* Уникальное имя */
}

::view-transition-group(hero) {
  animation-duration: 500ms;
}
```

---

## Вопросы на интервью

1. **Нативный CSS Nesting vs SASS Nesting — отличия?**
   > В SASS `&` конкатенируется (`.block__element`). В CSS `&` — ссылка на родительский селектор целиком. BEM через нативный нестинг не работает. Зато нативный поддерживает вложенные `@media` и работает в браузере без компиляции.

2. **Что такое `@scope` и какую проблему решает?**
   > Ограничивает стили конкретным поддеревом DOM без высокой специфичности. Аналог CSS Modules, но нативный. Решает проблему «утечки» стилей компонентов на другие элементы.

3. **View Transitions API — как работает?**
   > Браузер делает скриншот старого состояния, применяет DOM изменения, делает скриншот нового состояния, анимирует переход между ними через псевдоэлементы `::view-transition-*`. Работает без JS-анимаций, производительно.

---

## Примеры кода

- [`examples/nesting.html`](./examples/nesting.html) — нативный нестинг + @scope
- [`examples/view-transitions.html`](./examples/view-transitions.html) — View Transitions API
