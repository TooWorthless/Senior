# 03 · useState & useRef

## Ключевые концепции

- Как `useState` работает под капотом (Fiber linked list)
- Functional update vs direct update — closure trap
- State shape — flat vs nested объекты
- `useRef` — DOM reference и mutable value без re-render
- Batching (React 18) — автоматическая группировка обновлений
- `flushSync` — когда нужен синхронный рендер

## Вопросы на интервью

1. Почему `setCount(count + 1)` три раза подряд даёт +1, а не +3?
2. В чём разница `useRef` и `useState`?
3. Что изменилось в batching между React 17 и React 18?
4. Когда использовать `flushSync`?
5. Почему нельзя мутировать объект в state напрямую?
