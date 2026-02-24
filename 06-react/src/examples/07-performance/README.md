# 07 · Performance

## Ключевые концепции

- `React.memo` — shallow compare, custom comparator
- `memo` + нестабильный callback = бесполезно → нужен `useCallback`
- `Profiler` API — измерение actual/base duration
- Re-render причины: state, props, context, parent render
- `memo` не защищает от Context изменений
- Split Context как решение проблемы глобального Context
- Стратегии оптимизации: алгоритм → scope → мемоизация → виртуализация → splitting

## Вопросы на интервью

1. `React.memo` не помогает — почему? (нестабильный callback или Context)
2. Чем `actualDuration` отличается от `baseDuration` в Profiler?
3. Как Context вызывает лишние рендеры и как бороться?
4. В каком порядке применять оптимизации?
