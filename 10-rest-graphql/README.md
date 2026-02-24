# 10 · REST & GraphQL Client

[← На главную](../README.md)

---

## Запуск

```bash
cd 10-rest-graphql
npm install
npm run dev
# → http://localhost:5173
```

Открой React Query DevTools (кнопка снизу справа) — видно состояние кеша в реальном времени.

---

## Стек

```
React 19 + TypeScript strict  ·  Vite 6
TanStack Query v5             ·  Apollo Client 3
axios 1.x                     ·  graphql 16
```

**APIs для демо:**
- [JSONPlaceholder](https://jsonplaceholder.typicode.com) — REST (posts, todos, users)
- [Rick & Morty API](https://rickandmortyapi.com/graphql) — GraphQL

---

## Подмодули

| # | Тема | Ключевые концепции |
|---|------|--------------------|
| 01 | [fetch API](./src/examples/01-fetch/) | AbortController, timeout, error hierarchy, HTTP клиент |
| 02 | [axios](./src/examples/02-axios/) | Instance, interceptors (request/response), retry, cancel |
| 03 | [TanStack Query](./src/examples/03-tanstack-query/) | useQuery, useMutation, cache, staleTime, infinite, optimistic |
| 04 | [GraphQL basics](./src/examples/04-graphql/) | Schema, types, queries, mutations, variables, fragments |
| 05 | [Apollo Client](./src/examples/05-apollo/) | useQuery, useLazyQuery, нормализованный кеш, fetchPolicy |
| 06 | [Patterns](./src/examples/06-patterns/) | Optimistic UI, pagination, error handling, SWR |

---

## Ключевые концепции

### fetch vs axios

| | `fetch` | `axios` |
|--|---------|---------|
| 4xx/5xx | Не кидает! | Кидает ошибку |
| JSON | `res.json()` вручную | Авто в `data` |
| Interceptors | Нет | ✅ |
| Timeout | AbortController | `timeout: 10000` |
| Bundle size | 0 (built-in) | ~13KB |

### TanStack Query — ключевые понятия

```
staleTime   → как долго данные "свежие" (нет фонового рефетча)
gcTime      → как долго в памяти после unmount (был cacheTime)
isLoading   → нет кеша + идёт запрос (первая загрузка)
isFetching  → идёт любой запрос (включая background refetch)
invalidate  → пометить как stale → рефетч при следующем mount
```

### Apollo Cache — нормализация

```
Каждый объект хранится как { __typename + id }
Character:1 → единая запись для всех запросов
При UPDATE mutation → автоматически обновляются все компоненты
```

### fetchPolicy

```
cache-first         → кеш → сеть (default)
cache-and-network   → кеш сразу + фоновый запрос (SWR!)
network-only        → всегда сеть, кешировать ответ
no-cache            → всегда сеть, не кешировать
cache-only          → только кеш
```

---

## Вопросы на интервью

- Почему `fetch` не кидает ошибку на 404/500?
- Чем `isLoading` отличается от `isFetching` в TanStack Query?
- Что такое `staleTime` vs `gcTime`?
- Как работает нормализованный кеш Apollo?
- `fetchPolicy: "cache-first"` vs `"cache-and-network"` — разница?
- Как реализовать optimistic UI с rollback?
- Offset pagination vs cursor-based — когда что?
- Что такое stale-while-revalidate?
- Как централизованно обработать 401 во всём приложении?
- Apollo vs TanStack Query — когда выбирать?
