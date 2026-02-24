# 02 · CSS

[← На главную](../README.md)

Модуль по CSS для уровня Senior. Акцент на механики движка браузера, edge cases, производительность и современные возможности языка.

---

## Подмодули

| # | Тема | Ключевые концепции |
|---|------|--------------------|
| 01 | [Каскад и специфичность](./01-cascade-specificity/README.md) | Specificity, cascade layers, `!important`, inheritance |
| 02 | [Блочная модель](./02-box-model/README.md) | box-sizing, margin collapse, formatting contexts |
| 03 | [Flexbox](./03-flexbox/README.md) | flex container/item, alignment, sizing алгоритм |
| 04 | [Grid](./04-grid/README.md) | explicit/implicit grid, auto-placement, subgrid |
| 05 | [Custom Properties](./05-custom-properties/README.md) | Scope, inheritance, dynamic theming, @property |
| 06 | [Селекторы](./06-selectors/README.md) | Псевдоклассы, псевдоэлементы, :has(), :is(), :where() |
| 07 | [Анимации](./07-animations/README.md) | transition vs animation, will-change, composite layers |
| 08 | [Адаптивность](./08-responsive/README.md) | Media queries, container queries, clamp(), fluid type |
| 09 | [Современный CSS](./09-modern-css/README.md) | Nesting, cascade layers, @layer, logical properties |
| 10 | [Производительность](./10-performance/README.md) | Repaint/reflow, GPU layers, contain, content-visibility |
| 11 | [Архитектура CSS](./11-architecture/README.md) | BEM, CSS Modules, CSS-in-JS, utility-first, design tokens |

---

## Типичные вопросы на интервью по CSS

- Как браузер вычисляет специфичность? Что приоритетнее — `#id` или `!important`?
- Что такое margin collapse и когда он происходит?
- В чём разница между `flex-grow`, `flex-shrink` и `flex-basis`?
- Как работает implicit grid? Что такое auto-placement algorithm?
- Чем CSS Custom Properties отличаются от переменных в SASS?
- Какие CSS-свойства вызывают reflow, repaint, composite?
- Что делает `will-change` и когда его применять опасно?
- Как работает `@layer` и какую проблему он решает?
- В чём разница между `:is()` и `:where()` с точки зрения специфичности?

---

## Уровень покрытия

Senior-уровень: предполагается понимание основ. Упор на механику движка, edge cases, CSS 2023-2025, design system паттерны.
