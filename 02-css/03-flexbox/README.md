# 03 · Flexbox

[← CSS](../README.md)

---

## Содержание

1. [Модель Flexbox: оси и терминология](#модель-flexbox-оси-и-терминология)
2. [Алгоритм размеров: flex-grow, flex-shrink, flex-basis](#алгоритм-размеров)
3. [Выравнивание: полная карта](#выравнивание-полная-карта)
4. [flex shorthand](#flex-shorthand)
5. [Типичные паттерны](#типичные-паттерны)
6. [Вопросы на интервью](#вопросы-на-интервью)
7. [Примеры кода](#примеры-кода)

---

## Модель Flexbox: оси и терминология

```
flex-direction: row (default)

  main axis →
  ┌─────────────────────────────────────────┐
  │  ┌──────┐  ┌──────┐  ┌──────┐          │  ↑
  │  │item 1│  │item 2│  │item 3│          │  cross
  │  └──────┘  └──────┘  └──────┘          │  axis
  └─────────────────────────────────────────┘  ↓
```

| Термин | Определение |
|--------|-------------|
| **main axis** | Направление flex-direction |
| **cross axis** | Перпендикулярно main axis |
| **main size** | width (row) или height (column) |
| **cross size** | height (row) или width (column) |
| **flex container** | Элемент с `display: flex` |
| **flex item** | Прямой дочерний элемент контейнера |

---

## Алгоритм размеров

Это самая сложная часть Flexbox. Браузер вычисляет размеры в несколько шагов.

### Три свойства

```css
.item {
  flex-grow: 0;    /* Как распределить свободное пространство */
  flex-shrink: 1;  /* Как сжиматься при нехватке места */
  flex-basis: auto; /* Базовый размер до применения grow/shrink */
}
```

### `flex-basis`

```css
/* auto: используй width (или height для column) */
/* Если width не задан — берёт max-content */
flex-basis: auto;

/* Конкретный размер: игнорирует width */
flex-basis: 200px;
flex-basis: 30%;
flex-basis: 0;  /* Начальная точка = 0, весь размер от flex-grow */

/* content: явно max-content (новое в CSS) */
flex-basis: content;
```

> ⚠️ **Ловушка:** `flex-basis: 0` vs `flex-basis: auto` — критическое различие при использовании `flex-grow`:
> - `flex-basis: auto`: свободное пространство распределяется поверх существующего контента
> - `flex-basis: 0`: всё пространство считается «свободным», пропорции строго по flex-grow

### `flex-grow`

```css
/*
  Алгоритм grow:
  1. Вычислить свободное пространство = container_size - sum(flex-basis всех items)
  2. Распределить свободное пространство пропорционально flex-grow
*/

.container { width: 500px; }
.item-a { flex-basis: 100px; flex-grow: 1; }
.item-b { flex-basis: 100px; flex-grow: 2; }
.item-c { flex-basis: 100px; flex-grow: 0; }

/*
  Свободное пространство = 500 - (100 + 100 + 100) = 200px
  Единица = 200 / (1 + 2 + 0) = 66.67px
  item-a = 100 + 1 * 66.67 = 166.67px
  item-b = 100 + 2 * 66.67 = 233.33px
  item-c = 100 + 0 * 66.67 = 100px
*/
```

### `flex-shrink`

```css
/*
  Алгоритм shrink (сложнее grow):
  Shrink взвешивается по flex-basis * flex-shrink
  Большие элементы сжимаются больше при одинаковом flex-shrink
*/

.container { width: 400px; }
.item-a { flex-basis: 200px; flex-shrink: 1; }
.item-b { flex-basis: 200px; flex-shrink: 2; }

/*
  Нехватка = 400 - (200 + 200) = -200px (нужно убрать 200px)
  Взвешенный shrink:
  item-a вес = 200 * 1 = 200
  item-b вес = 200 * 2 = 400
  Сумма весов = 600
  
  item-a уменьшится на = (200/600) * 200 = 66.67px → 133.33px
  item-b уменьшится на = (400/600) * 200 = 133.33px → 66.67px
*/
```

> 💬 **Вопрос на интервью:** «В чём разница flex-shrink и flex-grow с точки зрения алгоритма?»

**Ответ:** `flex-grow` распределяет свободное пространство просто пропорционально. `flex-shrink` при сжатии взвешивает вклад каждого элемента как `flex-shrink * flex-basis` — более крупные элементы сжимаются больше при одинаковом flex-shrink.

---

## Выравнивание: полная карта

```
justify-content   — по main axis (контейнер)
align-items       — по cross axis (контейнер, все items)
align-self        — по cross axis (отдельный item, переопределяет align-items)
align-content     — по cross axis (строки при flex-wrap, контейнер)
justify-self      — НЕ РАБОТАЕТ в flexbox (только в Grid)
place-items       — shorthand: align-items + justify-items
place-content     — shorthand: align-content + justify-content
gap               — расстояние между items (row-gap + column-gap)
```

### justify-content (main axis)

```css
.container {
  justify-content: flex-start;    /* default */
  justify-content: flex-end;
  justify-content: center;
  justify-content: space-between; /* равные промежутки между */
  justify-content: space-around;  /* равные промежутки вокруг */
  justify-content: space-evenly;  /* абсолютно равные промежутки */
  justify-content: stretch;       /* растянуть (для Grid, не Flex) */

  /* Новые значения (CSS Box Alignment) */
  justify-content: start;
  justify-content: end;
  justify-content: left;
  justify-content: right;
}
```

### align-items (cross axis)

```css
.container {
  align-items: stretch;     /* default: растянуть по cross axis */
  align-items: flex-start;
  align-items: flex-end;
  align-items: center;
  align-items: baseline;    /* по первой текстовой baseline */
  align-items: last baseline;
}
```

> ⚠️ **Ловушка:** `align-items: stretch` (default) растягивает items по cross axis, только если у них нет явно заданного `height` (в row direction). Если задан `height: 100px` — stretch не работает.

---

## flex shorthand

```css
/* flex: flex-grow flex-shrink flex-basis */

flex: 1;
/* = flex: 1 1 0 */
/* НЕ = flex: 1 1 auto !!! */
/* flex-basis: 0 — всё пространство делится поровну */

flex: auto;
/* = flex: 1 1 auto */
/* Items растут/сжимаются, базовый размер = контент */

flex: none;
/* = flex: 0 0 auto */
/* Rigid: не растёт, не сжимается */

flex: 0;
/* = flex: 0 1 0 */
/* Не растёт, сжимается, базис 0 */

flex: initial;
/* = flex: 0 1 auto (default!) */
/* Не растёт, сжимается, базис = контент */
```

> ⚠️ **Ловушка:** `flex: 1` ≠ `flex-grow: 1`. При `flex: 1` автоматически устанавливается `flex-basis: 0`, что меняет поведение. `flex-grow: 1` при `flex-basis: auto` (default) — другой результат.

---

## Типичные паттерны

### Центрирование

```css
/* Горизонтальное и вертикальное */
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Через margin: auto */
.child {
  margin: auto; /* Сжирает всё свободное пространство со всех сторон */
}

/* Прижать последний item к правому краю */
.nav-item:last-child {
  margin-left: auto;
}
```

### Holy Grail Layout (header, main+sidebar, footer)

```css
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.page-main {
  display: flex;
  flex: 1; /* Занять всё оставшееся место */
}
.sidebar { width: 250px; flex-shrink: 0; }
.content { flex: 1; }
```

### Sticky footer

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
main {
  flex: 1; /* Растянуть main, прижать footer вниз */
}
```

### Равные колонки независимо от контента

```css
.columns {
  display: flex;
}
.column {
  flex: 1; /* = flex: 1 1 0 → одинаковые колонки */
}
/* Если flex: 1 1 auto — колонки будут разными (по ширине контента) */
```

---

## Вопросы на интервью

1. **`flex: 1` vs `flex-grow: 1` — в чём разница?**
   > `flex: 1` → `flex: 1 1 0`. flex-basis = 0, всё пространство считается свободным, делится поровну. `flex-grow: 1` при default `flex-basis: auto` → свободное пространство делится поровну поверх размера контента. Колонки получатся разными.

2. **Как работает `margin: auto` во Flexbox?**
   > Flex item с `margin: auto` на одной стороне поглощает всё свободное пространство в этом направлении. `margin-left: auto` — прижимает элемент вправо. `margin: auto` на всех сторонах — полное центрирование.

3. **Почему `align-items: center` может не работать?**
   > Чаще всего у контейнера нет явной высоты. При `flex-direction: row` align-items выравнивает по cross axis (вертикаль). Если высота контейнера равна высоте содержимого — свободного места нет, центрировать нечего.

4. **Разница align-content и align-items?**
   > `align-items` — выравнивает items внутри каждой строки по cross axis. `align-content` — выравнивает сами строки относительно контейнера (работает только при `flex-wrap: wrap` и нескольких строках).

5. **Что происходит с flex item у которого `min-width: auto`?**
   > По умолчанию flex items имеют `min-width: auto` (или `min-height: auto` для column). Это значит элемент **не сожмётся** меньше своего min-content size, даже при `flex-shrink: 1`. Решение: `min-width: 0` — позволяет тексту переноситься и элементу уменьшаться.

---

## Примеры кода

- [`examples/flex-sizing-algorithm.html`](./examples/flex-sizing-algorithm.html) — визуализация grow/shrink алгоритма
- [`examples/flex-patterns.html`](./examples/flex-patterns.html) — holy grail, sticky footer, nav паттерны
