# 02 · Class Components

## Ключевые концепции

- Полный жизненный цикл (mounting, updating, unmounting)
- `PureComponent` vs `Component` — shallow compare
- `getDerivedStateFromProps` — когда нужен и когда антипаттерн
- `getSnapshotBeforeUpdate` — чтение DOM перед обновлением
- `ErrorBoundary` — единственное применение class в современном React

## Вопросы на интервью

1. Чем `PureComponent` отличается от `Component`?
2. Что такое `getDerivedStateFromProps` и почему его почти не нужно использовать?
3. Почему `ErrorBoundary` можно реализовать только через class component?
4. Как `componentDidCatch` и `getDerivedStateFromError` работают вместе?
5. Эквивалент `componentDidUpdate` на хуках — как правильно написать?
