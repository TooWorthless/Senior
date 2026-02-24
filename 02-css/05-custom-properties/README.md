# 05 · CSS Custom Properties

[← CSS](../README.md)

---

## Содержание

1. [Scope и наследование](#scope-и-наследование)
2. [CSS Custom Properties vs SASS переменные](#css-custom-properties-vs-sass-переменные)
3. [Dynamic theming паттерны](#dynamic-theming-паттерны)
4. [`@property` — типизированные переменные](#property--типизированные-переменные)
5. [Использование в JavaScript](#использование-в-javascript)
6. [Вопросы на интервью](#вопросы-на-интервью)
7. [Примеры кода](#примеры-кода)

---

## Scope и наследование

```css
/* Объявление: двойное тире, camelCase или kebab-case */
:root {
  --color-primary: #0066cc;
  --spacing-base: 8px;
  --font-size-lg: 1.25rem;
}

/* Использование */
.button {
  background: var(--color-primary);
  padding: calc(var(--spacing-base) * 2) calc(var(--spacing-base) * 3);
}

/* Fallback (второй аргумент var()) */
.element {
  color: var(--text-color, #333);         /* простой fallback */
  color: var(--text-color, var(--color-primary, black)); /* вложенный fallback */
}
```

### Наследование

CSS Custom Properties **наследуются** как все CSS свойства. Значение берётся от ближайшего предка, где переменная определена:

```html
<div style="--color: red">
  <p style="--color: blue">
    <span>Синий (ближайший --color)</span>
  </p>
  <span>Красный (ближайший --color)</span>
</div>
```

### Scope через селекторы

```css
/* Глобальные токены */
:root {
  --btn-bg: #0066cc;
  --btn-color: white;
}

/* Переопределение в компоненте */
.card {
  --btn-bg: #333;
  --btn-color: #eee;
}

/* Кнопка внутри .card получит тёмный стиль */
.button {
  background: var(--btn-bg);
  color: var(--btn-color);
}
```

> ⚠️ **Ловушка:** CSS Custom Properties наследуются. Если объявить `--spacing: 8px` на `.parent` а потом переопределить на `.child`, все элементы внутри `.child` используют новое значение — даже те, которые не ожидали изменения. Это feature, но требует осторожности в больших системах.

---

## CSS Custom Properties vs SASS переменные

| | CSS Custom Properties | SASS переменные |
|---|---|---|
| Время вычисления | Runtime (в браузере) | Compile time |
| Доступ из JS | ✅ `getComputedStyle` | ❌ |
| Изменение из JS | ✅ `element.style.setProperty` | ❌ |
| Наследование | ✅ Каскад | ❌ (статические) |
| Media queries | ✅ Меняются динамически | Нужен отдельный блок |
| Типизация | ❌ (строка) / ✅ через @property | ✅ (число, цвет, строка) |
| Анимируемость | ✅ через @property | ❌ |
| Поддержка | 97%+ | 100% (компилируется) |

```css
/* SASS: вычисляется при компиляции, нельзя изменить в runtime */
$primary: #0066cc;
.button { background: $primary; }

/* CSS: вычисляется в браузере, можно менять */
:root { --primary: #0066cc; }
.button { background: var(--primary); }

/* В runtime: */
/* document.documentElement.style.setProperty('--primary', '#cc0066'); */
```

---

## Dynamic Theming паттерны

### Тёмная тема через CSS Custom Properties

```css
/* Светлая тема (default) */
:root {
  --color-bg: #ffffff;
  --color-surface: #f5f5f5;
  --color-text: #1a1a1a;
  --color-text-secondary: #666666;
  --color-primary: #0066cc;
  --color-border: #e0e0e0;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Тёмная тема */
:root[data-theme="dark"],
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #121212;
    --color-surface: #1e1e1e;
    --color-text: #f5f5f5;
    --color-text-secondary: #aaaaaa;
    --color-primary: #4da6ff;
    --color-border: #333333;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
  }
}

/* Компоненты используют токены — не меняются */
body {
  background: var(--color-bg);
  color: var(--color-text);
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}
```

```javascript
// Переключение темы без перезагрузки
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}

// Загрузка сохранённой темы
const saved = localStorage.getItem('theme');
if (saved) document.documentElement.dataset.theme = saved;
```

### Component-level theming

```css
/* Компонент определяет свои переменные */
.button {
  --_btn-bg: var(--btn-bg, var(--color-primary));
  --_btn-color: var(--btn-color, white);
  --_btn-padding: var(--btn-padding, 0.5rem 1rem);
  --_btn-radius: var(--btn-radius, 6px);

  background: var(--_btn-bg);
  color: var(--_btn-color);
  padding: var(--_btn-padding);
  border-radius: var(--_btn-radius);
}

/* Кастомизация через внешние переменные */
.button-danger {
  --btn-bg: #dc3545;
}

/* В контексте Dark Mode */
.dark-section {
  --btn-bg: #444;
  --btn-color: #eee;
}
```

Prefix `_` — соглашение для «private» переменных (только для внутреннего использования компонента).

---

## `@property` — типизированные переменные

`@property` (CSS Houdini) позволяет объявить тип, initial value и поведение наследования.

```css
@property --rotation {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@property --gradient-stop {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}

@property --card-opacity {
  syntax: '<number>';
  initial-value: 1;
  inherits: true;
}
```

### Анимация Custom Properties через @property

Без `@property` Custom Properties нельзя анимировать (они строки):

```css
/* ❌ Не анимируется: браузер не знает тип */
.element {
  --hue: 0;
  background: hsl(var(--hue), 70%, 50%);
  transition: --hue 1s; /* не работает */
}

/* ✅ С @property: анимируется */
@property --hue {
  syntax: '<number>';
  initial-value: 0;
  inherits: false;
}

.element {
  background: hsl(var(--hue), 70%, 50%);
  transition: --hue 1s; /* работает! */
}

.element:hover {
  --hue: 270;
}
```

```css
/* Анимация градиента — без @property невозможно */
@property --stop-1 {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}
@property --stop-2 {
  syntax: '<percentage>';
  initial-value: 100%;
  inherits: false;
}

.gradient-button {
  background: linear-gradient(45deg,
    #0066cc var(--stop-1),
    #cc0066 var(--stop-2)
  );
  transition: --stop-1 0.5s, --stop-2 0.5s;
}

.gradient-button:hover {
  --stop-1: 40%;
  --stop-2: 60%;
}
```

---

## Использование в JavaScript

```javascript
// Чтение
const root = document.documentElement;
const value = getComputedStyle(root).getPropertyValue('--color-primary').trim();
// → " #0066cc" (обратите внимание на пробелы — trim() обязателен)

// Чтение с конкретного элемента
const el = document.querySelector('.card');
const spacing = getComputedStyle(el).getPropertyValue('--spacing').trim();

// Запись на :root (глобально)
root.style.setProperty('--color-primary', '#cc0066');

// Запись на конкретный элемент (scope)
el.style.setProperty('--card-bg', 'red');

// Удаление (возврат к inherited/initial)
el.style.removeProperty('--card-bg');

// Паттерн: JS-driven анимация через custom property
function updateProgress(percent) {
  document.querySelector('.progress').style.setProperty('--progress', `${percent}%`);
}
```

---

## Вопросы на интервью

1. **Чем CSS Custom Properties отличаются от SASS переменных?**
   > CSS Custom Properties — runtime, наследуются через каскад, доступны из JS, меняются в response на медиазапросы без перекомпиляции. SASS переменные — compile time, не существуют в браузере, не читаются из JS, не реагируют динамически.

2. **Почему CSS Custom Property нельзя анимировать и как решить?**
   > Браузер воспринимает custom property как строку и не знает как интерполировать. `@property` регистрирует тип (`<color>`, `<number>`, `<angle>`) — браузер знает как анимировать. `transition` и `@keyframes` начинают работать.

3. **Что такое «private» CSS custom property (с `_`)?**
   > Конвенция, не спецификация. `--_name` — сигнал что переменная для внутреннего использования компонента. Снаружи её не должны переопределять. Компонент сначала читает публичную переменную, если нет — использует дефолт через fallback.

4. **Как реализовать тёмную тему с учётом системных настроек и ручного переключения?**
   > `@media (prefers-color-scheme: dark)` + атрибут `data-theme` на `:root`. Приоритет: явный `data-theme` > системные настройки. Значение сохранять в `localStorage`. При отсутствии явного значения — следовать системным.

---

## Примеры кода

- [`examples/theming.html`](./examples/theming.html) — dark mode, component theming, переключение через JS
- [`examples/property-animation.html`](./examples/property-animation.html) — `@property` анимации: градиент, цвет, угол
