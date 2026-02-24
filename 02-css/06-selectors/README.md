# 06 · Селекторы

[← CSS](../README.md)

---

## Содержание

1. [Pseudo-classes: состояние и структура](#pseudo-classes)
2. [Pseudo-elements](#pseudo-elements)
3. [`:is()`, `:where()`, `:not()`](#is-where-not)
4. [`:has()` — parent selector](#has--parent-selector)
5. [Attribute Selectors](#attribute-selectors)
6. [Вопросы на интервью](#вопросы-на-интервью)
7. [Примеры кода](#примеры-кода)

---

## Pseudo-classes

### Состояние элемента

```css
a:link       { }  /* непосещённая ссылка */
a:visited    { }  /* посещённая */
a:hover      { }  /* курсор над элементом */
a:active     { }  /* в момент клика */
/* Порядок LVHA важен: Link → Visited → Hover → Active */

:focus       { }  /* получил фокус */
:focus-within { } /* или любой потомок получил фокус */
:focus-visible { } /* фокус через клавиатуру (не мышь) */
/* focus-visible — предпочтительно для кастомного focus стиля */

:disabled    { }
:enabled     { }
:checked     { }  /* input[type=checkbox/radio] */
:indeterminate { }
:required    { }
:optional    { }
:valid       { }
:invalid     { }
:user-valid  { }  /* invalid только после взаимодействия */
:user-invalid { } /* лучше чем :invalid для UX */
:placeholder-shown { }
:read-only   { }
:read-write  { }
```

### Структурные

```css
:first-child      /* первый ребёнок родителя */
:last-child
:only-child       /* единственный ребёнок */
:nth-child(n)     /* n-й ребёнок */
:nth-last-child(n)

/* nth-child с типом (CSS 4) */
:nth-child(2 of .highlight) /* 2-й элемент с классом .highlight */

:first-of-type    /* первый <p> среди братьев */
:last-of-type
:only-of-type
:nth-of-type(n)

:empty            /* нет дочерних элементов (включая пробелы!) */
:root             /* <html> элемент */
:target           /* элемент, на который указывает URL #hash */
:scope            /* точка отсчёта, в CSS = :root, в JS querySelector — элемент */
```

### Формулы для nth-child

```css
:nth-child(2n)     /* чётные: 2, 4, 6... */
:nth-child(odd)    /* нечётные: 1, 3, 5... */
:nth-child(even)   /* чётные: 2, 4, 6... */
:nth-child(3n+1)   /* 1, 4, 7, 10... */
:nth-child(-n+3)   /* первые 3: 1, 2, 3 */
:nth-child(n+4)    /* с 4-го до конца */
```

---

## Pseudo-elements

```css
::before          /* вставляет контент до содержимого */
::after           /* вставляет контент после содержимого */

/* content обязателен для before/after */
.element::before {
  content: '';        /* пустая строка для декоративных */
  content: '→';       /* текст */
  content: attr(data-label); /* значение атрибута */
  content: counter(section); /* счётчик */
}

::placeholder     /* стиль placeholder */
::selection       /* выделенный пользователем текст */
::marker          /* маркер <li> */
::backdrop        /* фон за <dialog>.showModal() */
::file-selector-button /* кнопка input[type=file] */
::cue             /* WebVTT субтитры в <track> */
::slotted()       /* в Shadow DOM */
::part()          /* в Shadow DOM */
::first-line      /* первая строка текстового блока */
::first-letter    /* первая буква */
```

---

## `:is()`, `:where()`, `:not()`

### `:is()` — список с наследованием специфичности

```css
/* Без :is(): повторение */
header p, main p, footer p { color: blue; }

/* С :is(): компактно, специфичность = наибольшего аргумента */
:is(header, main, footer) p { color: blue; }
/* Специфичность: (0,0,2) — p=(0,0,1) + :is(header...)=(0,0,1) */

/* Прощение невалидных селекторов */
:is(:unknown-pseudo, .valid-class) { color: red; }
/* :is() игнорирует невалидные, весь блок работает */
/* Без :is(): один невалидный → весь список игнорируется */
```

### `:where()` — нулевая специфичность

```css
/* Для reset и base стилей библиотек */
:where(h1, h2, h3, h4, h5, h6) {
  font-weight: bold;
  line-height: 1.2;
}
/* Специфичность (0,0,0) → пользователь легко переопределит */

/* В design system: utility layer */
:where(.container) {
  max-width: 1200px;
  margin: 0 auto;
}
```

### `:not()` — исключение

```css
/* Одиночный */
p:not(.special) { }          /* (0,1,1) */
input:not([type="hidden"]) { } /* (0,1,1) */

/* Список (CSS 4) */
p:not(.special, .featured) { } /* = :not(.special):not(.featured) */

/* С вложением */
:not(nav) a { }
```

---

## `:has()` — parent selector

Самый значимый CSS-селектор за последнее десятилетие. Позволяет стилизовать родителя на основе содержимого.

```css
/* Стилизовать form если в нём есть невалидный input */
form:has(input:invalid) {
  border: 2px solid red;
}

/* Card с изображением — другой стиль */
.card:has(img) {
  padding: 0;
}
.card:not(:has(img)) {
  padding: 1.5rem;
}

/* Таблица с чекбоксом в строке */
tr:has(input[type="checkbox"]:checked) {
  background: #e3f2fd;
}

/* Sibling selector через :has (CSS 4) */
/* Элемент ДО .active */
li:has(+ .active) {
  border-right: 2px solid blue;
}

/* Элемент ПОСЛЕ .active (уже был :) */
.active + li { }

/* Layout: если sidebar нет — content на всю ширину */
.layout:not(:has(.sidebar)) .content {
  grid-column: 1 / -1;
}

/* Медиа-like без медиазапросов: если поддерживается hover */
.button:has(:hover) { }
```

> 💬 **Вопрос на интервью:** «Что такое `:has()` и почему это революция?»

**Ответ:** `:has()` — первый способ выбирать элемент по его потомкам на чистом CSS. До этого нужен был JavaScript. Позволяет: parent selector, sibling-before selector, conditional layout без JS.

> ⚠️ **Ловушка:** `:has()` — мощный инструмент, но дорог для браузерного движка. Не используй `:has()` на глобальных правилах типа `:has(.active)` — браузеру нужно проверять каждый элемент в DOM. Применяй к конкретным контейнерам.

---

## Attribute Selectors

```css
[attr]             /* Атрибут существует */
[attr="value"]     /* Точное совпадение */
[attr^="value"]    /* Начинается с */
[attr$="value"]    /* Заканчивается на */
[attr*="value"]    /* Содержит подстроку */
[attr~="value"]    /* Содержит слово (space-separated) */
[attr|="value"]    /* Равен или начинается с "value-" */
[attr="value" i]   /* Case-insensitive */
[attr="value" s]   /* Case-sensitive (default) */

/* Примеры */
a[href^="https"] { /* HTTPS ссылки */ }
a[href^="http"]:not([href^="https"]) { /* Небезопасные HTTP */ }
img[alt=""] { border: 2px solid red; } /* Пустой alt — декоративные */
[data-component] { /* Все компоненты */ }
[lang|="en"] { /* en, en-US, en-GB... */ }
```

---

## Вопросы на интервью

1. **`:focus` vs `:focus-visible`?**
   > `:focus` срабатывает при любом фокусе (мышь + клавиатура). `:focus-visible` — только когда браузер считает что визуальный индикатор нужен (обычно клавиатурная навигация). Позволяет скрыть outline для мышиного клика, сохранив для клавиатуры. WCAG 2.4.11 требует видимый focus indicator.

2. **`:nth-child(2 of .class)` — что нового в CSS 4?**
   > Позволяет фильтровать nth-child по типу/классу. `:nth-child(2 of .active)` — второй элемент с классом `.active` среди братьев. До этого `:nth-child` считал все дочерние элементы независимо от класса.

3. **Как `:has()` решает проблему «previous sibling selector»?**
   > `li:has(+ .active)` — выбирает `<li>` который непосредственно предшествует `.active`. До `:has()` предыдущий sibling нельзя было выбрать на CSS. Только `prev + next` (следующий после предыдущего) работало.

4. **`:user-invalid` vs `:invalid`?**
   > `:invalid` срабатывает сразу при загрузке для полей с `required` или `pattern` — пустое обязательное поле сразу красное. `:user-invalid` (CSS 4) срабатывает только после взаимодействия пользователя. Лучше для UX.

---

## Примеры кода

- [`examples/modern-selectors.html`](./examples/modern-selectors.html) — `:has()`, `:is()`, `:where()`, nth-child паттерны
