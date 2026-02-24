# 04 · CSS Grid

[← CSS](../README.md)

---

## Содержание

1. [Explicit vs Implicit Grid](#explicit-vs-implicit-grid)
2. [Единица `fr` и `minmax()`](#единица-fr-и-minmax)
3. [Auto-placement Algorithm](#auto-placement-algorithm)
4. [Named Lines и Named Areas](#named-lines-и-named-areas)
5. [Subgrid](#subgrid)
6. [Grid vs Flexbox — когда что](#grid-vs-flexbox)
7. [Вопросы на интервью](#вопросы-на-интервью)
8. [Примеры кода](#примеры-кода)

---

## Explicit vs Implicit Grid

### Explicit Grid — явно заданные треки

```css
.grid {
  display: grid;

  /* Явные колонки: 3 колонки */
  grid-template-columns: 200px 1fr 1fr;

  /* Явные строки: 2 строки */
  grid-template-rows: 100px auto;

  gap: 1rem; /* row-gap + column-gap */
}
```

### Implicit Grid — автоматически созданные треки

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* Строки не заданы */

  /* Если items больше чем explicit rows → создаются implicit rows */
  /* По умолчанию их размер = auto */

  /* Управление размером implicit треков: */
  grid-auto-rows: 150px;
  grid-auto-rows: minmax(100px, auto); /* не меньше 100px, растягивается */

  /* Направление auto-placement */
  grid-auto-flow: row;     /* default: заполнять строки */
  grid-auto-flow: column;  /* заполнять колонки */
  grid-auto-flow: row dense; /* плотная упаковка (заполняет дыры) */
}
```

> ⚠️ **Ловушка:** `grid-auto-flow: dense` заполняет дыры, но **меняет визуальный порядок** элементов относительно DOM порядка. Это нарушает WCAG 1.3.2 (Meaningful Sequence) и ломает keyboard navigation.

---

## Единица `fr` и `minmax()`

### `fr` — fractional unit

```css
/* fr: доля свободного пространства */
grid-template-columns: 1fr 2fr 1fr;
/* Свободное пространство делится 1:2:1 */
/* При контейнере 600px: 150px 300px 150px */

/* fr и px: px вычитаются первыми, fr делит остаток */
grid-template-columns: 200px 1fr 1fr;
/* 600px контейнер: 200px, 200px, 200px */
```

> ⚠️ **Ловушка:** `1fr` ≠ `minmax(0, 1fr)`. По умолчанию `fr` ведёт себя как `minmax(auto, 1fr)` — не уменьшится меньше min-content содержимого. Для истинно равных колонок с переполнением нужно `minmax(0, 1fr)`:

```css
/* Проблема: колонка с длинным словом растягивает грид */
grid-template-columns: repeat(3, 1fr);

/* Решение: */
grid-template-columns: repeat(3, minmax(0, 1fr));
```

### `minmax(min, max)`

```css
/* Минимум 200px, максимум 1fr */
grid-template-columns: repeat(3, minmax(200px, 1fr));

/* auto-fill vs auto-fit */
/* auto-fill: создаёт столько колонок, сколько поместится, сохраняя пустые */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

/* auto-fit: схлопывает пустые колонки → оставшиеся растягиваются */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```

```
auto-fill (5 items, 8 возможных колонок):
[item][item][item][item][item][    ][    ][    ]
→ пустые колонки остаются

auto-fit (5 items, 8 возможных колонок):
[item ][item ][item ][item ][item ]
→ пустые схлопываются, items растягиваются
```

> 💬 **Вопрос на интервью:** «Responsive grid без media queries?»

```css
/* RAM паттерн: Repeat, Auto-fit, Minmax */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 1rem;
}
/* min(100%, 300px): на маленьком экране 100vw (одна колонка), на большом — 300px */
```

---

## Auto-placement Algorithm

Алгоритм браузера для размещения items без явного `grid-column`/`grid-row`:

```
1. Начать с первой незанятой ячейки
2. Разместить следующий item
3. Если item занимает несколько ячеек (span) — найти место с достаточным пространством
4. Перейти к следующей позиции
```

```css
/* grid-column и grid-row: явное размещение */
.item {
  grid-column: 1 / 3;      /* от line 1 до line 3 */
  grid-column: 1 / span 2; /* от line 1, занять 2 треки */
  grid-column: span 2;     /* занять 2 треки (auto-placed) */
  grid-row: 2 / 4;
}

/* Шортхенды */
.item {
  grid-area: 1 / 1 / 3 / 4; /* row-start / col-start / row-end / col-end */
}
```

---

## Named Lines и Named Areas

### Named Lines

```css
.grid {
  grid-template-columns:
    [sidebar-start] 250px [sidebar-end content-start] 1fr [content-end];
  grid-template-rows:
    [header-start] 80px [header-end main-start] 1fr [main-end footer-start] 60px [footer-end];
}

.sidebar {
  grid-column: sidebar-start / sidebar-end;
  /* или: */
  grid-column: sidebar; /* если линии называются foo-start и foo-end */
}
```

### Named Areas

```css
.grid {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 80px 1fr 60px;
  grid-template-areas:
    "header  header"
    "sidebar content"
    "footer  footer";
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.footer  { grid-area: footer; }

/* . для пустой ячейки */
grid-template-areas:
  "header  header"
  "sidebar content"
  ".       footer";
```

---

## Subgrid

`subgrid` позволяет дочернему grid элементу использовать треки родительского грида.

```css
/* Родитель */
.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* Ребёнок занимает все 3 колонки и использует их треки */
.child {
  grid-column: 1 / -1; /* span все 3 колонки */
  display: grid;
  grid-template-columns: subgrid; /* использует треки родителя */
}

/* Внук выравнивается по column tracks родителя */
.grandchild {
  /* Теперь может занимать точные колонки деда */
}
```

**Типичный кейс:** карточки с кнопкой «Купить» всегда на одном уровне:

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3; /* image / content / button */
}
/* Теперь все кнопки на одном уровне независимо от длины текста */
```

---

## Grid vs Flexbox — когда что

| Сценарий | Что использовать |
|----------|-----------------|
| 1D layout (строка ИЛИ колонка) | Flexbox |
| 2D layout (строки И колонки) | Grid |
| Компоненты (nav, card, form) | Flexbox |
| Layout страницы | Grid |
| Items неизвестного размера | Flexbox |
| Выравнивание по сетке | Grid |
| Responsive без media queries | Grid (auto-fit/auto-fill) |
| Вложенные компоненты | Часто оба |

> Они дополняют друг друга. Grid для macro-layout, Flexbox для micro-layout компонентов внутри grid cells.

---

## Вопросы на интервью

1. **`fr` и `minmax(0, 1fr)` — зачем явно указывать `0`?**
   > По умолчанию `1fr` = `minmax(auto, 1fr)`. `auto` как минимум = `min-content`. Это значит колонка не сожмётся меньше своего контента. `minmax(0, 1fr)` разрешает сжатие до нуля — нужно для равных колонок с переполняющимся содержимым.

2. **`auto-fill` vs `auto-fit`?**
   > Оба создают столько колонок, сколько помещается при минимальном размере. `auto-fill` сохраняет пустые колонки (они занимают место). `auto-fit` схлопывает пустые → заполненные растягиваются на весь контейнер. `auto-fit` лучше для адаптивных сеток без media queries.

3. **Как разместить элемент в последней колонке без знания числа колонок?**
   > `grid-column: -1` — отрицательные значения отсчитываются с конца. `grid-column: 1 / -1` — span на все колонки. Работает только для explicit grid (заданного через `grid-template-columns`).

4. **Что такое subgrid и какую проблему он решает?**
   > Subgrid позволяет дочернему grid участвовать в треках родительского грида. До subgrid невозможно было выровнять элементы в card компонентах по общей сетке. Теперь карточки с разной длиной текста имеют кнопки на одном уровне без JavaScript.

5. **`grid-auto-flow: dense` — когда опасен?**
   > Dense заполняет дыры в гриде, что меняет визуальный порядок относительно DOM порядка. Нарушает WCAG 1.3.2 (Meaningful Sequence) — tab order и screen reader идут по DOM, а визуально элементы в другом порядке.

---

## Примеры кода

- [`examples/grid-concepts.html`](./examples/grid-concepts.html) — explicit/implicit, named areas, auto-fit/fill
- [`examples/grid-patterns.html`](./examples/grid-patterns.html) — page layout, card grid с subgrid, masonry-like
