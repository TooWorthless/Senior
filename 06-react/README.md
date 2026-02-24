# 06 · React

[← На главную](../README.md)

---

## Запуск

```bash
cd 06-react
npm install
npm run dev
# → http://localhost:5173
```

Все примеры доступны через навигатор в боковой панели. Каждый пример — интерактивный компонент с демо, объяснениями и типичными вопросами на интервью.

---

## Подмодули

| # | Тема | Ключевые концепции |
|---|------|--------------------|
| 01 | [JSX & Rendering](./src/examples/01-jsx-rendering/README.md) | JSX transform, Virtual DOM, Fiber, reconciliation, keys |
| 02 | [Class Components](./src/examples/02-class-components/README.md) | Lifecycle, getDerivedState, shouldComponentUpdate, ErrorBoundary |
| 03 | [useState & useRef](./src/examples/03-hooks-state/README.md) | State shape, batching, functional updates, ref vs state |
| 04 | [useEffect](./src/examples/04-hooks-effects/README.md) | Deps array, cleanup, race conditions, ловушки |
| 05 | [useReducer & useMemo](./src/examples/05-hooks-advanced/README.md) | useReducer, useMemo, useCallback, useLayoutEffect, useId |
| 06 | [Custom Hooks](./src/examples/06-custom-hooks/README.md) | useFetch, useDebounce, useLocalStorage, useIntersection |
| 07 | [Performance](./src/examples/07-performance/README.md) | React.memo, Profiler, re-render детектор, lazy, code splitting |
| 08 | [Context API](./src/examples/08-context/README.md) | Правильный Context, split context, анти-паттерны |
| 09 | [Patterns](./src/examples/09-patterns/README.md) | Compound components, render props, HOC, composition |
| 10 | [Lists & Media](./src/examples/10-lists-media/README.md) | Keys, виртуализация, lazy images, video, оптимизация |
| 11 | [Suspense & Errors](./src/examples/11-suspense-errors/README.md) | Suspense, ErrorBoundary, lazy, useTransition, useDeferredValue |
| 12 | [Server Components](./src/examples/12-server-components/README.md) | RSC концепция, Client/Server boundary, serialization |

---

## Версия React

Все примеры используют **React 19** — актуальная версия на момент написания.

Ключевые изменения в React 19:
- `use()` hook — await Promise/Context в render
- React Compiler (experimental) — автоматическая мемоизация
- Actions — встроенная обработка async transitions
- `ref` как prop (не нужен forwardRef)
- `useActionState`, `useFormStatus`, `useOptimistic`

---

## Стек проекта

```
React 19 + TypeScript (strict)
Vite 6 (dev server + HMR)
```
