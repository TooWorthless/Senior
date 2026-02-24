# 02 · Блочная модель

[← CSS](../README.md)

---

## Содержание

1. [content-box vs border-box](#content-box-vs-border-box)
2. [Margin Collapse](#margin-collapse)
3. [Formatting Contexts (BFC, IFC, FFC, GFC)](#formatting-contexts)
4. [display: contents](#display-contents)
5. [Вопросы на интервью](#вопросы-на-интервью)
6. [Примеры кода](#примеры-кода)

---

## content-box vs border-box

```css
/* content-box (default): width = только контент */
/* Total width = width + padding-left + padding-right + border-left + border-right */
.box-content {
  box-sizing: content-box;
  width: 200px;
  padding: 20px;
  border: 2px solid;
  /* Реальная ширина в layout: 200 + 40 + 4 = 244px */
}

/* border-box: width = контент + padding + border */
/* Total width = width (padding и border включены) */
.box-border {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 2px solid;
  /* Реальная ширина в layout: 200px (контент = 200 - 40 - 4 = 156px) */
}
```

### Глобальный сброс (стандарт индустрии)

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

> 💬 **Вопрос на интервью:** «Почему `border-box` удобнее для разработки?**

**Ответ:** При `border-box` размер элемента предсказуем — `width: 100%` всегда займёт 100% родителя независимо от padding и border. При `content-box` добавление padding ломает layout.

---

## Margin Collapse

Вертикальные margins соседних блоков **схлопываются** в один — берётся наибольший. Это фича, не баг.

### Три сценария

**1. Смежные блоки (siblings)**

```html
<p style="margin-bottom: 20px">Первый</p>
<p style="margin-top: 30px">Второй</p>
<!-- Расстояние между ними: 30px, а не 50px -->
```

**2. Родитель и первый/последний дочерний элемент**

```html
<div style="margin-top: 20px">
  <p style="margin-top: 30px">Параграф</p>
</div>
<!-- margin-top div поглощает margin-top параграфа → 30px -->
<!-- НЕ 50px -->
```

**3. Пустые блоки**

```html
<div style="margin-top: 20px; margin-bottom: 30px"></div>
<!-- Пустой блок: margin схлопывается в один → 30px -->
```

### Когда collapse НЕ происходит

```css
/* Любой из этих сценариев предотвращает collapse: */

/* 1. BFC на родителе */
.parent {
  overflow: hidden;      /* Создаёт BFC */
  display: flow-root;    /* Явный BFC (лучший способ) */
  display: flex;         /* FFC — не BFC, тоже предотвращает */
  display: grid;
  contain: layout;
}

/* 2. Разделитель между блоками */
.parent {
  padding: 1px;   /* padding предотвращает collapse родитель-ребёнок */
  border: 1px solid transparent;
}

/* 3. Горизонтальные margins — не схлопываются НИКОГДА */
/* 4. Flexbox и Grid children — не схлопываются */
/* 5. Позиционированные элементы (absolute/fixed) — не участвуют */
/* 6. Floating элементы — не участвуют */
```

> ⚠️ **Ловушка:** Margin collapse происходит только в **нормальном потоке** (flow layout) и только **вертикально**. Flex/grid children не имеют margin collapse.

> ⚠️ **Ловушка:** Отрицательные margins тоже схлопываются: если `margin-bottom: -20px` и `margin-top: 30px`, результат = `30 + (-20) = 10px`.

---

## Formatting Contexts

Formatting Context (FC) — среда которая определяет правила расположения элементов.

### Block Formatting Context (BFC)

Независимый блочный контейнер. Ключевые свойства:
- Содержит float-ы (clearfix больше не нужен)
- Предотвращает margin collapse с дочерними
- Не перекрывается с float-ами

**Что создаёт BFC:**

```css
.creates-bfc {
  overflow: hidden;          /* классика (но скрывает контент) */
  overflow: auto;            /* тоже BFC, но лучше */
  display: flow-root;        /* ✅ явный BFC без побочных эффектов */
  display: flex;             /* Flex Formatting Context */
  display: grid;             /* Grid Formatting Context */
  display: inline-block;
  position: absolute;
  position: fixed;
  float: left;
  contain: layout;           /* или paint, strict, content */
  column-count: 1;           /* любое multi-column */
}
```

```css
/* ✅ Современный clearfix через BFC */
.contains-floats {
  display: flow-root; /* Содержит все float children */
}

/* ❌ Устаревший clearfix хак */
.clearfix::after {
  content: '';
  display: table;
  clear: both;
}
```

### Inline Formatting Context (IFC)

Создаётся блочным контейнером который содержит только inline-level контент. Элементы выстраиваются горизонтально в **line boxes**.

```css
/* Высота line box определяется line-height, не height */
/* vertical-align работает внутри IFC */
span {
  vertical-align: middle;  /* Выравнивает по baseline line box */
}
```

> ⚠️ **Ловушка:** Загадочный gap под `<img>`. Изображение — inline element. Оно выравнивается по baseline строки (IFC). Ниже baseline есть пространство для «опускателей» букв (g, p, y). Решение: `img { display: block; }` или `vertical-align: bottom`.

### Stacking Context

Не Formatting Context, но важная концепция: определяет порядок по оси Z.

**Что создаёт Stacking Context:**

```css
.creates-stacking-context {
  position: relative; /* + z-index != auto */
  position: fixed;
  position: sticky;
  opacity: 0.99;          /* opacity < 1 */
  transform: translateZ(0); /* любой transform */
  will-change: transform;
  filter: blur(0);
  isolation: isolate;     /* явное создание SC без побочных эффектов */
  mix-blend-mode: (не normal);
  contain: paint;
}
```

```css
/* isolation: isolate — явный способ создать Stacking Context */
/* Изолирует z-index children от внешнего мира */
.modal-container {
  isolation: isolate;
  /* Теперь z-index внутри .modal-container соревнуются только между собой */
}
```

> ⚠️ **Ловушка:** `z-index` работает только внутри своего Stacking Context. Если родитель создаёт SC с `z-index: 1`, дочерний элемент с `z-index: 9999` не выйдет поверх элемента с `z-index: 2` из другого SC на том же уровне.

---

## display: contents

```css
.wrapper {
  display: contents;
}
```

Элемент «исчезает» из layout но его дочерние элементы остаются. Полезно для семантической обёртки без layout-эффекта.

```html
<ul>
  <li class="group">
    <!--
      Нужна семантическая группировка, но <li> не должен влиять на grid/flex layout
    -->
    <ul display="contents">  <!-- ul исчезает из flex layout -->
      <li>Пункт A</li>
      <li>Пункт B</li>
    </ul>
  </li>
</ul>
```

> ⚠️ **Ловушка:** `display: contents` имеет баги в некоторых браузерах с элементами которые имеют роли: `<button>`, `<a>`, `<summary>`. Применение `display: contents` на них может убрать accessibility роль. Тестируй.

---

## Вопросы на интервью

1. **Почему `* { box-sizing: border-box }` — стандарт индустрии?**
   > Делает поведение width/height предсказуемым: ширина = видимый размер, padding и border включены. Без этого добавление padding ломает percent-based layouts. Нет performance-проблем — это вычисляется в layout, не rendering.

2. **Когда margin collapse НЕ происходит?**
   > В flex/grid контейнерах, у float элементов, у absolute/fixed позиционированных, при наличии BFC на родителе, при горизонтальных margins, при наличии padding или border между родителем и ребёнком.

3. **Зачем `display: flow-root` лучше `overflow: hidden` для clearfix?**
   > Оба создают BFC, но `overflow: hidden` имеет побочный эффект — обрезает содержимое выходящее за границы. `display: flow-root` создаёт BFC без побочных эффектов. Именно для этого он и создан.

4. **Почему `z-index: 9999` иногда не работает?**
   > `z-index` работает только внутри Stacking Context. Если родитель создаёт SC с низким `z-index`, все дочерние элементы будут ниже элементов из SC с более высоким z-index, независимо от собственного z-index значения.

5. **Что такое gap под inline изображением и как его убрать?**
   > Это IFC (Inline Formatting Context) поведение. Изображение — inline-element, выравнивается по baseline. Браузер резервирует место для descenders (g, y, p) ниже baseline. Решения: `img { display: block }`, `vertical-align: bottom`, `line-height: 0` на родителе.

---

## Примеры кода

- [`examples/box-model.html`](./examples/box-model.html) — content-box vs border-box, margin collapse визуализация
- [`examples/formatting-contexts.html`](./examples/formatting-contexts.html) — BFC, Stacking Context, z-index ловушки
