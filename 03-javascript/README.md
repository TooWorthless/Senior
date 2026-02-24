# 03 · JavaScript

[← На главную](../README.md)

Модуль по чистому JavaScript. Без DOM, без async/await, без браузерных API — только движок, типы, алгоритмы и паттерны которые проверяют на senior-интервью.

---

## Как запускать примеры

Все файлы запускаются через Node.js:

```bash
node 03-javascript/01-types-and-coercion/examples/coercion.js
```

Требуется Node.js >= 18. Проверить: `node --version`.

---

## Главное правило: минимум проходов

> **Закон:** Одна задача = максимум один-два прохода по данным.
>
> `arr.filter(...).map(...).reduce(...)` — это **три прохода**. Всегда замени одним `for` с нужной логикой внутри.
>
> Используй `Map` / `Set` / `{}` для O(1) lookup вместо `indexOf`, `includes` внутри цикла.

---

## Подмодули

| # | Тема | Ключевые концепции |
|---|------|--------------------|
| 01 | [Типы и приведение](./01-types-and-coercion/README.md) | typeof, primitive vs reference, coercion, == vs === |
| 02 | [Переменные и область видимости](./02-variables-and-scope/README.md) | var/let/const, hoisting, TDZ, closure, scope chain |
| 03 | [Функции](./03-functions/README.md) | declaration vs expression, first-class, HOF, closure, IIFE, currying |
| 04 | [Объекты и прототипы](./04-objects-and-prototypes/README.md) | prototype chain, class, Object methods, spread/rest |
| 05 | [Массивы: паттерны и методы](./05-arrays/README.md) | Single-pass идиомы, методы, деструктуризация |
| 06 | [Основы алгоритмов](./06-algorithms-basics/README.md) | Big O, hash map, two pointers, sliding window, рекурсия |
| 07 | [Coding Challenges](./07-coding-challenges/README.md) | 25+ задач с оптимальными решениями (O(n)) |
| 08 | [Справочник встроенных методов](./08-builtins-reference/README.md) | String, Array, Object, Number/Math, Map/Set, JSON, Intl, Symbol |
| 09 | [Алгоритмы сортировки](./09-sorting/README.md) | Bubble, Insertion, Merge, Quick, Heap, Counting, Radix, Tim Sort |
| 10 | [Продвинутые алгоритмы](./10-advanced-algorithms/README.md) | Consistent Hashing, Trie, Union-Find, Fenwick Tree, Bloom Filter, Boyer-Moore, Reservoir Sampling |
| 11 | [Асинхронность и Event Loop](./11-async-event-loop/README.md) | Event Loop, microtask/macrotask, Promise, async/await, Generators, Node.js |

---

## Что не входит в этот модуль

- ❌ Async/await, Promise, Event Loop — отдельный модуль
- ❌ DOM, Browser API — отдельный модуль
- ❌ Сортировки (merge sort, quick sort) — в алгоритмах будет отдельно
- ❌ TypeScript — отдельный модуль

---

## Топ вопросов на интервью

```
Типы:      Что выведет: null == undefined? typeof null?
           Почему {} + [] !== [] + {}?
           Что такое boxing/unboxing?

Scope:     Что такое Temporal Dead Zone?
           Как работает замыкание? Классическая ловушка с var в цикле.

Функции:   Разница call/apply/bind?
           Что такое каррирование? Реализуй compose/pipe.

Объекты:   Что такое prototype chain? Как работает new?
           Разница Object.create() vs new vs {...}?

Алгоритмы: Two Sum за O(n). Найди дубликат за один проход.
           Максимальная подстрока без повторов (sliding window).
```
