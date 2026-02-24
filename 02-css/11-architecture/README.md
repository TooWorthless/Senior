# 11 · Архитектура CSS

[← CSS](../README.md)

---

## Содержание

1. [BEM](#bem)
2. [CSS Modules](#css-modules)
3. [CSS-in-JS](#css-in-js)
4. [Utility-first (Tailwind)](#utility-first-tailwind)
5. [Design Tokens](#design-tokens)
6. [Сравнение подходов](#сравнение-подходов)
7. [Вопросы на интервью](#вопросы-на-интервью)

---

## BEM

Block–Element–Modifier. Методология именования классов.

```html
<!-- Block: самостоятельный компонент -->
<div class="card">

  <!-- Element: часть блока (двойное подчёркивание) -->
  <img class="card__image" src="..." alt="...">
  <div class="card__body">
    <h2 class="card__title">Заголовок</h2>
    <p class="card__description">Текст</p>

    <!-- Modifier: вариант блока или элемента (двойное тире) -->
    <button class="button button--primary button--large">
      Действие
    </button>
  </div>

</div>

<!-- Modifier на блоке -->
<div class="card card--featured card--horizontal">
```

```css
/* BEM CSS: низкая специфичность, предсказуемость */
.card { }
.card__image { }
.card__body { }
.card__title { }
.card--featured { }
.card--horizontal .card__image { /* Modifier меняет Element */ }

/* НЕ нестить в CSS (теряет смысл BEM) */
/* ❌ .card .card__title { } */
/* ✅ .card__title { } */
```

**Проблемы BEM:**
- Длинные имена классов (`block__element--modifier`)
- Нет инкапсуляции (global namespace)
- Нет dead code elimination

---

## CSS Modules

Локальный scope через автогенерацию уникальных имён классов. Стандарт в React-экосистеме.

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.primary {
  background: var(--color-primary);
  color: white;
}

.large {
  font-size: 1.125rem;
  padding: 0.75rem 1.5rem;
}

/* Глобальный стиль (escape hatch) */
:global(.third-party-class) { }
```

```jsx
// Button.tsx
import styles from './Button.module.css';

function Button({ variant, size, children }) {
  return (
    <button className={`${styles.button} ${styles[variant]} ${styles[size]}`}>
      {children}
    </button>
  );
}
// В DOM: class="Button_button__xK2i Button_primary__3mNq"
```

**Преимущества:**
- Локальный scope — нет конфликтов имён
- Dead code elimination (Webpack/Vite видит что не используется)
- TypeScript типы через `typed-css-modules`
- Близко к стандартному CSS

---

## CSS-in-JS

Стили определяются в JavaScript файлах.

### styled-components / emotion

```typescript
import styled from 'styled-components';
import { css } from '@emotion/react';

const Button = styled.button<{ $variant: 'primary' | 'ghost' }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;

  ${({ $variant }) => $variant === 'primary' && css`
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  `}

  ${({ $variant }) => $variant === 'ghost' && css`
    background: transparent;
    border: 1px solid currentColor;
  `}
`;
```

### Zero-runtime CSS-in-JS

Генерирует CSS во время сборки, не в runtime:
- **Vanilla Extract** — TypeScript, нет runtime overhead
- **Linaria** — JSX-подобный синтаксис, zero runtime
- **Panda CSS** — design system focused

```typescript
// Vanilla Extract
import { style } from '@vanilla-extract/css';

export const button = style({
  padding: '0.5rem 1rem',
  borderRadius: '6px',
});

export const primary = style([button, {
  background: '#0066cc',
  color: 'white',
}]);
```

**Runtime CSS-in-JS проблемы:**
- Serialization стилей при каждом рендере
- Блокирует SSR гидратацию
- Большой bundle (styled-components: ~15kB gzip)
- React concurrent mode проблемы

---

## Utility-first (Tailwind)

Минимальные utility классы, компонуемые напрямую в HTML.

```html
<button class="px-4 py-2 bg-blue-600 text-white rounded-md
               hover:bg-blue-700 focus:outline-none focus:ring-2
               focus:ring-blue-500 focus:ring-offset-2
               transition-colors duration-200">
  Кнопка
</button>
```

```javascript
// tailwind.config.js — design tokens
module.exports = {
  theme: {
    colors: {
      primary: {
        DEFAULT: '#0066cc',
        hover: '#0052a3',
      }
    },
    spacing: {
      1: '4px', 2: '8px', 4: '16px', 8: '32px',
    }
  }
}
```

**Преимущества:**
- Нет naming cognitive load
- Минимальный CSS bundle (tree-shaking)
- Design system из коробки
- Быстрая итерация

**Проблемы:**
- Длинные строки классов → читаемость
- Кастомные компоненты требуют @apply или extract компонентов
- Vendor lock-in на Tailwind систему

---

## Design Tokens

Единый источник дизайн-значений, используемый во всех слоях.

```json
// tokens.json (Style Dictionary формат)
{
  "color": {
    "primary": { "value": "#0066cc", "type": "color" },
    "text-base": { "value": "#1a1a1a", "type": "color" }
  },
  "spacing": {
    "4": { "value": "16px", "type": "dimension" }
  },
  "typography": {
    "body": {
      "font-size": { "value": "1rem" },
      "line-height": { "value": "1.5" }
    }
  }
}
```

Инструменты трансформации: **Style Dictionary**, **Token Studio**, **Theo**.

Выходные форматы: CSS Custom Properties, SASS variables, JS объекты, iOS/Android нативные.

---

## Сравнение подходов

| | BEM | CSS Modules | CSS-in-JS (runtime) | Utility-first |
|---|---|---|---|---|
| Инкапсуляция | ❌ | ✅ | ✅ | ❌ |
| Производительность | Высокая | Высокая | Средняя | Высокая |
| Bundle size | Зависит | Мало | Большой runtime | Минимальный |
| SSR | ✅ | ✅ | Сложно | ✅ |
| TypeScript | ❌ | Частично | ✅ | Через IntelliSense |
| Dead code | Нет | ✅ | ✅ | ✅ |
| Learning curve | Низкая | Низкая | Средняя | Средняя |
| Применение | Legacy, любой стек | React/Vue SPA | React-heavy | Design system |

---

## Вопросы на интервью

1. **Почему runtime CSS-in-JS проблематично в React 18+?**
   > Concurrent mode рендерит компоненты без commit — runtime CSS-in-JS вставляет `<style>` при commit. Это вызывает FOUC (flash of unstyled content) и проблемы с серверным рендерингом. Решение: zero-runtime (Vanilla Extract, Linaria) или CSS Modules.

2. **BEM vs CSS Modules — что выбрать для нового проекта?**
   > CSS Modules для React/Vue — нет конфликтов имён, dead code elimination, TypeScript. BEM для multi-framework или статических сайтов, CMS. BEM + CSS Modules возможны вместе (BEM как соглашение внутри модуля).

3. **Что такое Design Tokens и почему это важно?**
   > Единый источник истины для дизайн-значений: цвета, отступы, типографика. Генерируется во все форматы (CSS, SASS, iOS, Android). Синхронизирует дизайн и разработку. Один JSON изменяет весь продукт.

4. **Tailwind: как бороться с длинными строками классов?**
   > Экстракт компонентов через `@apply` (но это против философии), компонентизация через JSX/framework компоненты, `clsx`/`classnames` утилиты для условных классов, Tailwind Variants/CVA для variant-based компонентов.

---

## Примеры кода

- [`examples/bem-naming.html`](./examples/bem-naming.html) — BEM структура и CSS, антипаттерны
- [`examples/design-tokens.css`](./examples/design-tokens.css) — design tokens через CSS Custom Properties
