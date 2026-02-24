# 01 · HTML

[← На главную](../README.md)

Модуль по чистому HTML для уровня Senior. Здесь не будет основ — только темы, которые реально проверяют на собеседованиях: edge cases, a11y, производительность, безопасность.

---

## Подмодули

| # | Тема | Ключевые концепции |
|---|------|--------------------|
| 01 | [Семантика](./01-semantics/README.md) | Document outline, Microdata, JSON-LD, рефакторинг div-супа |
| 02 | [Доступность (a11y)](./02-accessibility/README.md) | ARIA, WCAG 2.2, focus management, screen readers |
| 03 | [Формы](./03-forms/README.md) | Constraint Validation API, autocomplete, FormData |
| 04 | [Производительность](./04-performance/README.md) | Resource hints, async/defer, fetchpriority, CRP |
| 05 | [SEO и метаданные](./05-seo-meta/README.md) | Open Graph, JSON-LD, hreflang, canonical |
| 06 | [Медиа](./06-media/README.md) | Responsive images, srcset/sizes, picture, WebP/AVIF |
| 07 | [Web Components](./07-web-components/README.md) | Custom Elements, Shadow DOM, Templates, Slots |
| 08 | [Document & Head](./08-document-head/README.md) | DOCTYPE, viewport, link rel, Web App Manifest |
| 09 | [Таблицы](./09-tables/README.md) | Доступные таблицы, scope, headers, responsive |
| 10 | [Интернационализация](./10-i18n/README.md) | lang, dir, hreflang, Bidi algorithm |
| 11 | [Безопасность](./11-security/README.md) | sandbox, referrerpolicy, crossorigin, CSP |

---

## Типичные вопросы на интервью по HTML

- В чём разница между `<section>` и `<div>`? Когда использовать `<article>`?
- Что такое ARIA и когда её **не нужно** использовать?
- Как работает Constraint Validation API? Чем отличается от `required`?
- Разница между `async` и `defer`. Что происходит с порядком выполнения?
- Как правильно реализовать responsive images без JavaScript?
- Что даёт Shadow DOM и какие у него ограничения?
- Как `sandbox` на `<iframe>` влияет на безопасность?

---

## Уровень покрытия

Материалы ориентированы на **Senior / Staff** уровень: предполагается знание базы, упор на edge cases, производительность, доступность и системное мышление.
