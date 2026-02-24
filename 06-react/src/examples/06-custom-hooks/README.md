# 06 · Custom Hooks

## Реализованные хуки

- `useFetch<T>` — fetch с race condition protection, refetch, error state
- `useLocalStorage<T>` — persist state в localStorage
- `useDebounce<T>` — задержка обновления value
- `useThrottle<T>` — rate limiting обновлений
- `useIntersectionObserver` — lazy loading, scroll animations
- `usePrevious<T>` — предыдущее значение
- `useEventListener` — типобезопасный addEventListener с auto-cleanup

## Вопросы на интервью

1. Как правильно предотвратить race condition в useFetch?
2. В чём разница debounce и throttle? Когда какой?
3. Почему `useEventListener` использует `useRef` для handler вместо прямого deps?
4. Как сделать `useLocalStorage` SSR-совместимым?
