# 07 · Web Components

[← HTML](../README.md)

---

## Содержание

1. [Что такое Web Components](#что-такое-web-components)
2. [Custom Elements](#custom-elements)
3. [Shadow DOM](#shadow-dom)
4. [HTML Templates и Slots](#html-templates-и-slots)
5. [Lifecycle Callbacks](#lifecycle-callbacks)
6. [Интеграция с React/Vue](#интеграция-с-reactvue)
7. [Когда использовать Web Components](#когда-использовать-web-components)
8. [Вопросы на интервью](#вопросы-на-интервью)
9. [Примеры кода](#примеры-кода)

---

## Что такое Web Components

Web Components — набор нативных браузерных API для создания переиспользуемых компонентов:

1. **Custom Elements** — определение новых HTML-элементов
2. **Shadow DOM** — инкапсуляция DOM и стилей
3. **HTML Templates** — `<template>` и `<slot>`

Ключевое отличие от React/Vue: работают нативно в браузере без фреймворка.

---

## Custom Elements

### Autonomous Custom Elements

```javascript
class MyButton extends HTMLElement {
  // Список атрибутов, изменение которых вызывает attributeChangedCallback
  static get observedAttributes() {
    return ['disabled', 'variant'];
  }

  constructor() {
    super(); // ВСЕГДА первым
    // В constructor нельзя читать атрибуты и дочерние элементы
    // Можно создавать Shadow DOM
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Элемент добавлен в DOM
    // Здесь безопасно читать атрибуты и дочерние элементы
    this.render();
    this._setupListeners();
  }

  disconnectedCallback() {
    // Элемент удалён из DOM
    // Чистить event listeners, timers, subscriptions
    this._teardownListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this.render();
  }

  adoptedCallback() {
    // Элемент перемещён в другой документ (редко используется)
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        button {
          padding: 0.5rem 1rem;
          cursor: pointer;
        }
        :host([disabled]) button {
          opacity: 0.6;
          cursor: not-allowed;
        }
      </style>
      <button
        ${this.hasAttribute('disabled') ? 'disabled' : ''}
        part="button"
      >
        <slot></slot>
      </button>
    `;
  }
}

// Имя ДОЛЖНО содержать дефис — отличает от нативных элементов
customElements.define('my-button', MyButton);
```

```html
<my-button variant="primary">Сохранить</my-button>
<my-button disabled>Заблокировано</my-button>
```

### Customized Built-in Elements

Расширение существующих элементов:

```javascript
class FancyButton extends HTMLButtonElement {
  connectedCallback() {
    this.classList.add('fancy');
  }
}

customElements.define('fancy-button', FancyButton, { extends: 'button' });
```

```html
<button is="fancy-button">Кнопка</button>
```

> ⚠️ **Ловушка:** Customized built-in elements не поддерживаются в Safari (WebKit отказался реализовывать). Нужен polyfill или избегать этого паттерна.

### `customElements.whenDefined()`

```javascript
// Ждём пока custom element зарегистрируется
customElements.whenDefined('my-button').then(() => {
  console.log('my-button готов');
});

// Апгрейд существующих элементов в DOM
customElements.upgrade(document.querySelector('my-button'));
```

---

## Shadow DOM

Shadow DOM создаёт изолированное поддерево DOM с собственными стилями.

### `attachShadow({ mode })`

| mode | Доступ к shadowRoot | Когда |
|------|---------------------|-------|
| `'open'` | `element.shadowRoot` | Большинство случаев |
| `'closed'` | `null` | Для полной инкапсуляции (редко, например платёжные формы) |

### Стили в Shadow DOM

```javascript
// Стили внутри Shadow DOM не вытекают наружу
// Глобальные стили не проникают внутрь (кроме наследуемых)
this.shadowRoot.innerHTML = `
  <style>
    /* Стили видны только внутри shadow DOM */
    :host {
      display: block; /* custom elements по умолчанию inline */
    }

    /* :host с условием */
    :host([hidden]) {
      display: none;
    }

    /* :host-context: стили в зависимости от родителя */
    :host-context(.dark-theme) {
      color: white;
    }

    /* ::slotted: стили для содержимого переданного через slot */
    ::slotted(p) {
      margin: 0;
    }
    ::slotted(*) { /* любой элемент в slot */ }

    /* Наследуемые CSS-свойства проходят сквозь shadow boundary */
    /* color, font-family, font-size, line-height... */
  </style>
`;
```

### CSS Custom Properties сквозь Shadow DOM

Наследуемые свойства и CSS переменные проходят через shadow boundary:

```css
/* Снаружи: определяем переменные */
my-button {
  --btn-background: #0066cc;
  --btn-color: white;
  --btn-padding: 0.5rem 1rem;
}
```

```javascript
// Внутри Shadow DOM: используем переменные
this.shadowRoot.innerHTML = `
  <style>
    button {
      background: var(--btn-background, #ccc);
      color: var(--btn-color, #000);
      padding: var(--btn-padding, 0.25rem 0.5rem);
    }
  </style>
  <button><slot></slot></button>
`;
```

### `part` и `::part()`

Позволяет стилизовать элементы Shadow DOM снаружи — явный API для кастомизации:

```javascript
// Внутри компонента: помечаем part
this.shadowRoot.innerHTML = `
  <button part="button">
    <slot></slot>
  </button>
`;
```

```css
/* Снаружи: стилизуем через ::part() */
my-button::part(button) {
  border-radius: 8px;
  font-weight: bold;
}
```

---

## HTML Templates и Slots

### `<template>` — инертный фрагмент DOM

```html
<!--
  <template> не рендерится, не выполняет скрипты, не загружает ресурсы.
  Клонируется при необходимости.
-->
<template id="card-template">
  <div class="card">
    <img class="card-image" alt="">
    <div class="card-body">
      <h2 class="card-title"></h2>
      <p class="card-description"></p>
    </div>
  </div>
</template>

<script>
  const template = document.getElementById('card-template');
  const clone = template.content.cloneNode(true); // deep clone
  clone.querySelector('.card-title').textContent = 'Заголовок';
  document.body.appendChild(clone);
</script>
```

### `<slot>` — точки вставки контента

```javascript
class MyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .card { border: 1px solid #ccc; padding: 1rem; }
      </style>
      <div class="card">
        <!-- Именованный slot -->
        <header>
          <slot name="title">Заголовок по умолчанию</slot>
        </header>
        <!-- Безымянный slot — все остальные дочерние элементы -->
        <div class="content">
          <slot></slot>
        </div>
        <!-- Slot с fallback контентом -->
        <footer>
          <slot name="footer">
            <small>© 2025</small>
          </slot>
        </footer>
      </div>
    `;
  }
}
customElements.define('my-card', MyCard);
```

```html
<my-card>
  <h2 slot="title">Мой заголовок</h2>
  <p>Основной контент</p>
  <p>Ещё контент — тоже попадёт в безымянный slot</p>
  <small slot="footer">Кастомный footer</small>
</my-card>
```

---

## Lifecycle Callbacks

```
constructor()                    → элемент создан
    ↓
connectedCallback()              → добавлен в DOM
    ↓
attributeChangedCallback()       → атрибут изменён (если в observedAttributes)
    ↓
disconnectedCallback()           → удалён из DOM
    ↓
adoptedCallback()                → перемещён в другой документ
```

> ⚠️ **Ловушка:** `constructor` вызывается ДО того, как атрибуты и дочерние элементы доступны. Не читай их в конструкторе — читай в `connectedCallback`.

> ⚠️ **Ловушка:** `disconnectedCallback` не гарантирует вызов при закрытии вкладки. Для cleanup важных ресурсов используй также `beforeunload` или `pagehide`.

---

## Интеграция с React/Vue

### Web Components в React

```jsx
// React 19: нативная поддержка custom elements
function App() {
  return (
    <my-button
      variant="primary"
      // camelCase атрибуты React автоматически конвертирует
      onMyEvent={(e) => console.log(e.detail)}
    >
      Click me
    </my-button>
  );
}

// React < 18: иногда нужен ref-паттерн
function MyButtonWrapper({ onClick, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    el.addEventListener('my-click', onClick);
    return () => el.removeEventListener('my-click', onClick);
  }, [onClick]);

  return <my-button ref={ref}>{children}</my-button>;
}
```

### Диспатч кастомных событий из Web Component

```javascript
// Внутри Web Component
class MyInput extends HTMLElement {
  _handleChange(e) {
    this.dispatchEvent(new CustomEvent('my-change', {
      detail: { value: e.target.value },
      bubbles: true,      // всплывает через shadow boundary если composed: true
      composed: true,     // проходит через shadow boundary
    }));
  }
}
```

---

## Когда использовать Web Components

### Хорошие кейсы

- **Design System / UI библиотека** — нейтральный по фреймворку, работает везде
- **Микрофронтенды** — изолированные виджеты между командами
- **Встраиваемые виджеты** — для сторонних сайтов (чат, форма)
- **Элементы с нативным поведением** — когда нужна нативная семантика

### Плохие кейсы

- **SPA с одним фреймворком** — React/Vue/Angular справляются лучше
- **SEO-критичный контент** — Shadow DOM усложняет индексирование
- **Сложное state management** — нет экосистемы как у React
- **Команда знает React** — переключение контекста на другой API

> 💬 **Вопрос на интервью:** «Почему крупные компании используют Web Components для Design Systems?»

**Ответ:** Компоненты независимы от фреймворка. Одна кнопка работает в React, Angular, Vue и без фреймворка. Google Material Web, Adobe Spectrum — примеры. Критично для больших организаций с несколькими командами и стеками.

---

## Вопросы на интервью

1. **`mode: 'open'` vs `mode: 'closed'` в Shadow DOM?**
   > `open`: `element.shadowRoot` возвращает ссылку — JS снаружи может обратиться к Shadow DOM. `closed`: `element.shadowRoot` === `null` — полная инкапсуляция. На практике `closed` редко нужен и его можно обойти (DevTools всегда видит shadow).

2. **Как CSS проникает через Shadow DOM?**
   > 1. Наследуемые свойства (color, font). 2. CSS переменные (`var(--token)`). 3. `::part()` псевдоэлемент — явный API кастомизации. 4. `::slotted()` — стили для slotted-контента снаружи или изнутри. Это по-дизайну — shadow boundary создаёт API через переменные и parts.

3. **Когда вызывается `constructor` vs `connectedCallback`?**
   > `constructor` — при создании элемента (в том числе через `document.createElement`), до вставки в DOM. Атрибуты и дочерние элементы недоступны. `connectedCallback` — после вставки в DOM. Здесь безопасно всё читать.

4. **Что такое composed event и зачем нужен?**
   > `composed: true` позволяет событию пройти через shadow boundary и всплыть в light DOM. По умолчанию события остаются внутри shadow root. Критично для кастомных событий которые должны обрабатываться родительским компонентом или React-обработчиком.

---

## Примеры кода

- [`examples/custom-element.html`](./examples/custom-element.html) — полный Custom Element с Shadow DOM, slots, CSS variables
- [`examples/template-slot.html`](./examples/template-slot.html) — `<template>` и `<slot>` паттерны
