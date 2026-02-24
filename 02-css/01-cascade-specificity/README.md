# 01 · Каскад и специфичность

[← CSS](../README.md)

---

## Содержание

1. [Как работает каскад](#как-работает-каскад)
2. [Specificity: вычисление](#specificity-вычисление)
3. [`!important` — механика и ловушки](#important--механика-и-ловушки)
4. [Inheritance: наследование](#inheritance-наследование)
5. [Cascade Layers (@layer)](#cascade-layers-layer)
6. [Вопросы на интервью](#вопросы-на-интервью)
7. [Примеры кода](#примеры-кода)

---

## Как работает каскад

Каскад — алгоритм разрешения конфликтов когда несколько правил претендуют на одно свойство одного элемента.

Приоритет (от высшего к низшему):

```
1. Transition declarations
2. !important — User Agent
3. !important — User (настройки браузера)
4. !important — Author (CSS разработчика)  ← здесь @layer влияет в обратном порядке
5. Animation declarations
6. Normal — Author
   6a. @layer (последний объявленный — высший приоритет)
   6b. Unlayered styles (выше всех @layer!)
   6c. @layer (первый объявленный — низший приоритет)
7. Normal — User
8. Normal — User Agent (браузерные стили)
```

Если origin и важность одинаковы → **specificity**.
Если specificity одинакова → **порядок в источнике** (последнее правило побеждает).

> 💬 **Вопрос на интервью:** «Что побеждает: `#id { color: red }` или `element { color: blue !important }`?»

**Ответ:** `!important` автора (уровень 4) побеждает любые нормальные author-стили (уровень 6) вне зависимости от специфичности. `!important` всегда выигрывает у нормальных стилей того же origin.

---

## Specificity: вычисление

Специфичность — трёхкомпонентный вектор: **(A, B, C)**.

| Компонент | Что считается | Примеры |
|-----------|--------------|---------|
| **A** — ID | `#id` | `#header` → (1,0,0) |
| **B** — Class, Attribute, Pseudo-class | `.class`, `[attr]`, `:hover`, `:nth-child()` | `.btn:hover` → (0,2,0) |
| **C** — Element, Pseudo-element | `div`, `p`, `::before` | `div p::before` → (0,0,3) |

Сравнение: сначала A, потом B, потом C. Первое ненулевое различие побеждает.

```css
/* Specificity: (0,0,1) */
p { color: red; }

/* Specificity: (0,1,1) */
p.intro { color: blue; }

/* Specificity: (1,0,0) */
#main { color: green; }

/* Specificity: (1,1,1) */
#main p.intro { color: purple; }
```

### Что НЕ учитывается

```css
/* * — универсальный селектор: (0,0,0) */
* { box-sizing: border-box; }

/* :is(), :not(), :has() — берут специфичность наибольшего аргумента */
:is(#id, .class) { }  /* → (1,0,0) из-за #id */
:is(.class, p) { }    /* → (0,1,0) из-за .class */

/* :where() — всегда (0,0,0), обнуляет специфичность */
:where(#id, .class) { }  /* → (0,0,0) */

/* :not() — берёт специфичность аргумента */
:not(p) { }            /* → (0,0,1) */
:not(#main) { }        /* → (1,0,0) */

/* Inline style — выше любого селектора в author styles, ниже !important */
/* <div style="color: red"> */  /* → (1,0,0,0) — отдельный уровень */
```

### Ловушка: specificity НЕ складывается через запятую

```css
/* Каждый селектор в списке имеет свою специфичность */
.a, .b, .c { color: red; }
/* .a → (0,1,0), .b → (0,1,0), .c → (0,1,0) — НЕ суммируются */
```

> ⚠️ **Ловушка:** `:is(#id)` в списке заражает специфичностью весь селектор. `:is(.a, #id, p) { }` — весь блок имеет специфичность (1,0,0) даже для элементов которые попали под `.a` или `p`.

### Specificity Wars — антипаттерн

```css
/* Escalation: попытка победить → поднять специфичность */
.button { }                    /* (0,1,0) */
.container .button { }        /* (0,2,0) */
#page .container .button { }  /* (1,2,0) */
#page #nav .container .button { } /* (2,2,0) */

/* Итог: невозможно переопределить без !important */
/* Решение: flat архитектура, @layer, :where() для reset */
```

---

## `!important` — механика и ловушки

```css
/* !important поднимает объявление в отдельный слой каскада */
.button { color: blue !important; }

/* Единственный способ победить !important автора — другой !important с более высокой специфичностью */
#button { color: red !important; } /* побеждает */
```

### Легитимные кейсы для `!important`

```css
/* 1. Utility классы — должны побеждать всегда */
.hidden { display: none !important; }
.sr-only { position: absolute !important; /* ... */ }

/* 2. Tailwind / atomic CSS — вся система на !important */
/* .text-red-500 { color: rgb(239,68,68) !important; } */

/* 3. Переопределение third-party стилей которые нельзя изменить */
/* Например: переопределение стилей встроенного виджета */
```

> ⚠️ **Ловушка:** `!important` в компонентных стилях — признак архитектурной проблемы. Если нужен `!important` чтобы стиль «просто работал» — скорее всего проблема в специфичности структуры.

---

## Inheritance: наследование

Не все свойства наследуются. Наследуемые — в основном типографические.

### Наследуемые (по умолчанию)

`color`, `font-*`, `line-height`, `letter-spacing`, `text-*`, `word-*`, `list-*`, `cursor`, `visibility`, `direction`, `quotes`...

### Не наследуемые (по умолчанию)

`margin`, `padding`, `border`, `background`, `display`, `position`, `width`, `height`, `overflow`, `opacity`, `z-index`, `flex-*`, `grid-*`...

### Ключевые слова наследования

```css
.child {
  color: inherit;   /* Взять значение от родителя */
  color: initial;   /* Сбросить до initial value (из CSS spec, не браузерного default) */
  color: unset;     /* inherit если наследуемое, initial если нет */
  color: revert;    /* Сбросить до User Agent stylesheet */
  color: revert-layer; /* Сбросить до предыдущего @layer */
}

/* Сброс всех свойств */
.reset {
  all: unset;    /* Сбрасывает все свойства */
  all: revert;   /* Сбрасывает до UA стилей */
}
```

> 💬 **Вопрос на интервью:** «Разница между `initial` и `revert`?»

**Ответ:** `initial` — значение из CSS-спецификации (например, `display: initial` = `inline` для `<div>`). `revert` — значение из User Agent stylesheet (браузерных стилей), то есть `display: revert` для `<div>` = `block`. Это важное отличие: `initial` не знает о браузерных дефолтах.

---

## Cascade Layers (@layer)

`@layer` — механизм явного управления порядком каскада. Решает specificity wars.

### Базовое использование

```css
/* Объявляем порядок слоёв (от низшего к высшему приоритету) */
@layer reset, base, components, utilities;

/* Стили в каждом слое */
@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }
}

@layer base {
  h1 { font-size: 2rem; }
  a { color: blue; }
}

@layer components {
  .button { padding: 0.5rem 1rem; background: blue; color: white; }
}

@layer utilities {
  .mt-4 { margin-top: 1rem; }
}
```

### Критически важное правило: unlayered > @layer

```css
@layer base {
  h1 { color: red; }  /* в слое */
}

h1 { color: blue; }   /* НЕ в слое — побеждает, даже с меньшей специфичностью! */
```

Стили вне `@layer` автоматически имеют наивысший приоритет среди author styles.

### `!important` + `@layer` — обратный порядок

```css
@layer reset, base;

@layer reset {
  h1 { color: red !important; }  /* !important в первом слое */
}
@layer base {
  h1 { color: blue !important; } /* !important во втором слое */
}

/* h1 будет красным! */
/* Для !important порядок слоёв инвертирован: первый слой побеждает */
```

> ⚠️ **Ловушка:** `!important` в `@layer` ведёт себя противоположно нормальным стилям. Первый объявленный `@layer` имеет наивысший приоритет для `!important`. Это интуитивно неочевидно и важно знать.

### Вложенные слои

```css
@layer framework {
  @layer base {
    /* framework.base */
  }
  @layer components {
    /* framework.components */
  }
}

/* Обращение через точку */
@layer framework.base {
  body { font-family: sans-serif; }
}
```

### Подключение CSS с @layer

```css
/* Импортировать third-party CSS в слой с низким приоритетом */
@import url("bootstrap.css") layer(bootstrap);
@import url("normalize.css") layer(reset);

/* Наш код вне слоя — выше всего */
.my-component { }
```

---

## Вопросы на интервью

1. **Что такое каскад и из каких этапов он состоит?**
   > Алгоритм разрешения конфликтов. Порядок: origin + importance → cascade layers → specificity → source order. Браузер проходит каждый этап только если предыдущий не дал однозначный ответ.

2. **Почему `* { }` иногда переопределяет `h1 { }`?**
   > `*` имеет специфичность (0,0,0). `h1` — (0,0,1). `h1` побеждает. НО: если `*` стоит в `@layer` с более высоким приоритетом или после `h1` без `@layer` — может выиграть из-за `@layer` механики, не специфичности.

3. **Чем `:where()` отличается от `:is()` и когда это важно?**
   > `:is()` берёт специфичность наибольшего аргумента. `:where()` всегда (0,0,0). Используй `:where()` в библиотеках/фреймворках где важно не «засорять» специфичность — пользователь легко переопределит.

4. **Зачем `@layer` если есть `!important` и специфичность?**
   > `@layer` позволяет управлять приоритетом блоков стилей независимо от специфичности селекторов. Идеально для: impорт third-party CSS с низким приоритетом, разделение reset/base/components/utilities, избежание specificity wars.

5. **Что значит `all: revert`?**
   > Сбрасывает все свойства элемента до User Agent stylesheet значений. Например, `<div style="all: revert">` — div снова будет `display: block` (UA default), а не `display: initial` (inline). Полезно для компонентов с нулевой зависимостью от глобальных стилей.

---

## Примеры кода

- [`examples/specificity-calculator.html`](./examples/specificity-calculator.html) — визуальный разбор вычисления специфичности
- [`examples/cascade-layers.html`](./examples/cascade-layers.html) — `@layer`: порядок, unlayered, `!important` инверсия
- [`examples/inheritance-keywords.html`](./examples/inheritance-keywords.html) — inherit, initial, unset, revert в действии
