# 04 · useEffect

## Ключевые концепции

- Три формы deps array и когда использовать каждую
- Cleanup — предотвращение утечек памяти и подписок
- Race condition при fetch и решения (ignore flag, AbortController)
- Stale closure и functional update как решение
- Бесконечный цикл — объект в deps
- Когда useEffect НЕ нужен (производные данные)

## Вопросы на интервью

1. Чем отличается `useEffect` без deps, с `[]`, и с `[value]`?
2. Как предотвратить race condition при fetch?
3. Почему объект в deps вызывает бесконечный цикл?
4. Что такое stale closure в useEffect и как с этим бороться?
5. Когда НЕ нужно использовать useEffect?
