# Senior Frontend Interview Prep

Репозиторий с материалами для подготовки к собеседованию на уровень Senior / Staff Frontend Engineer.

Каждый модуль содержит: теорию, примеры кода, типичные вопросы на интервью, разбор ошибок и trade-off'ы.

---

## Модули

### Основы платформы

| # | Модуль | Ключевые темы | Статус |
|---|--------|---------------|--------|
| 01 | [HTML](./01-html/README.md) | Семантика, a11y, формы, Web Components, SEO, безопасность | ✅ Готов |
| 02 | [CSS](./02-css/README.md) | Cascade, Flexbox, Grid, Custom Properties, анимации, архитектура | ✅ Готов |
| 03 | [JavaScript](./03-javascript/README.md) | Типы, scope, async, Event Loop, алгоритмы, сортировки | ✅ Готов |
| 04 | [JavaScript & DOM](./04-javascript-dom/README.md) | DOM API, Events, Virtual DOM, MutationObserver, Canvas/WebGL | ✅ Готов |
| 05 | [WebSockets / WebRTC](./05-websockets-webrtc/README.md) | ws протокол, Reconnection, WebRTC P2P, STUN/TURN, signaling, real-time patterns | ✅ Готов |

### Фреймворки и UI

| # | Модуль | Ключевые темы | Статус |
|---|--------|---------------|--------|
| 06 | [React](./06-react/README.md) | Fiber, Reconciliation, Hooks, Class Components, Patterns, Performance, RSC | ✅ Готов |
| 07 | [React Native + Expo](./07-react-native/README.md) | Expo Router, Core Components, Styling, Gestures, Reanimated, Storage, New Architecture (JSI/Fabric/TurboModules/Hermes) | ✅ Готов |
| 08 | Reanimated + Skia | Worklets, shared values, анимации на UI thread, 2D-рендеринг | ⏳ Планируется |

### Управление состоянием

| # | Модуль | Ключевые темы | Статус |
|---|--------|---------------|--------|
| 09 | Redux / MobX / Zustand | Flux, middleware, реактивность, паттерны, trade-off'ы | ⏳ Планируется |

### Сеть и данные

| # | Модуль | Ключевые темы | Статус |
|---|--------|---------------|--------|
| 10 | [REST & GraphQL клиент](./10-rest-graphql/README.md) | fetch, axios, TanStack Query v5, Apollo Client, нормализованный кеш, optimistic UI | ✅ Готов |
| 11 | Web3.js | Ethereum, контракты, ABI, MetaMask, подписи, IPFS | ⏳ Планируется |

### Тестирование

| # | Модуль | Ключевые темы | Статус |
|---|--------|---------------|--------|
| 12 | Тестирование | Unit (Jest/Vitest), RTL, E2E (Playwright/Detox), MSW, TDD, coverage | ⏳ Планируется |

### Архитектура и инфраструктура

| # | Модуль | Ключевые темы | Статус |
|---|--------|---------------|--------|
| 13 | Архитектура фронтенда | FSD, модульная архитектура, Monorepo, micro-frontends, DDD на фронте | ⏳ Планируется |
| 14 | Производительность | CRP, LCP/CLS/FID, bundle, code splitting, profiling | ⏳ Планируется |
| 15 | Безопасность веба | XSS, CSRF, CSP, Auth flows, JWT, OAuth2 | ⏳ Планируется |
| 16 | System Design (Frontend) | CDN, кэширование, масштабирование, real-time, offline-first | ⏳ Планируется |
| 17 | Behavioral / Soft Skills | STAR, системное мышление, leadership, архитектурные решения | ⏳ Планируется |

---

## Как пользоваться

- Каждый модуль — отдельная папка с `README.md` и подмодулями.
- В каждом подмодуле: теория в `README.md`, код в `examples/`.
- Вопросы для интервью выделены блоком `> 💬 Вопрос на интервью`.
- Ответы-ловушки и распространённые ошибки выделены блоком `> ⚠️ Ловушка`.

---

## Стек

`React` · `React Native (Expo)` · `Reanimated` · `Skia` · `Redux / MobX / Zustand` · `Apollo GraphQL` · `Web3.js` · `WebSockets / WebRTC` · `REST / GraphQL`
