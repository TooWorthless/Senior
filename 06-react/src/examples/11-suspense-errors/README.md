# 11 · Suspense & Errors

## Ключевые концепции

- `Suspense` — перехват Promise, fallback UI
- `lazy()` — code splitting, отдельные chunks
- `ErrorBoundary` — изоляция ошибок рендера
- `useTransition` — несрочные обновления, `isPending`
- `useDeferredValue` — отложенное значение из props

## Вопросы на интервью

1. Как Suspense знает когда показывать fallback?
2. В чём разница `useTransition` и `useDeferredValue`?
3. Что происходит при ошибке fetch внутри Suspense?
4. Как организовать вложенные Suspense для гранулярного контроля?
