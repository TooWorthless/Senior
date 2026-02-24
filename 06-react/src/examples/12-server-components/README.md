# 12 · React Server Components

## Ключевые концепции

- Server vs Client Components — разница, директивы, ограничения
- RSC Payload — формат передачи дерева от сервера к клиенту
- Client/Server boundary — как граница распространяется вниз
- "Donut" паттерн — RSC внутри Client через `children`
- Что сериализуется через границу (Functions нельзя!)
- Server Actions — встроенный RPC, `useActionState`
- React 19: `use()`, `useOptimistic`, `useFormStatus`

## Вопросы на интервью

1. В чём разница RSC и SSR?
2. Почему нельзя передать функцию из Server в Client Component?
3. Как работает "donut" паттерн и зачем он нужен?
4. Что такое Server Actions и как они работают?
5. Зачем нужен `useOptimistic`?
