# 05 · useReducer & useMemo

## Ключевые концепции

- `useReducer` — когда выбрать вместо `useState`
- Reducer как чистая функция — тестируемость
- `useMemo` — мемоизация значений, тяжёлые вычисления
- `useCallback` — стабильность функций для `memo` дочерних компонентов
- `useLayoutEffect` vs `useEffect` — синхронное vs асинхронное чтение DOM
- `useId` — уникальные accessibility ID

## Вопросы на интервью

1. Когда выбрать `useReducer` вместо `useState`?
2. В чём разница `useMemo` и `useCallback`?
3. Почему преждевременная мемоизация — антипаттерн?
4. Чем `useLayoutEffect` отличается от `useEffect`? Когда нужен?
5. Зачем `useId` — почему нельзя использовать Math.random()?
