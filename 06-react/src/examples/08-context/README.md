# 08 · Context API

## Ключевые концепции

- Context для глобального состояния: auth, theme, locale
- Split context: Data + Dispatch в разных контекстах
- Мемоизация value через `useMemo`
- Custom hooks как abstraction layer над `useContext`
- Антипаттерны: один большой context, нестабильный value
- Когда Context, когда props, когда state manager

## Вопросы на интервью

1. Почему нужно разделять Data и Dispatch на разные контексты?
2. Как мемоизировать Context value?
3. `memo` не спасает от Context — почему?
4. Когда использовать Context vs Zustand/Redux?
