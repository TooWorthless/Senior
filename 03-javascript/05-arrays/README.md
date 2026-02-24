# 05 · Массивы: паттерны и методы

[← JavaScript](../README.md)

---

## Содержание

1. [Методы массивов](#методы-массивов)
2. [Single-pass идиомы — главное правило](#single-pass-идиомы)
3. [Итерация: for vs forEach vs for...of](#итерация)
4. [Деструктуризация и spread](#деструктуризация-и-spread)
5. [Типизированные массивы](#типизированные-массивы)
6. [Вопросы на интервью](#вопросы-на-интервью)

---

## Методы массивов

### Мутирующие (изменяют оригинал)

```javascript
const arr = [1, 2, 3];
arr.push(4);          // добавить в конец → [1,2,3,4], returns length
arr.pop();            // удалить с конца → returns 4
arr.unshift(0);       // добавить в начало → [0,1,2,3], returns length
arr.shift();          // удалить с начала → returns 0
arr.splice(1, 1, 99); // splice(start, deleteCount, ...items)
arr.sort();           // сортировка на месте (опасно без compareFn!)
arr.reverse();        // разворот
arr.fill(0, 1, 3);    // fill(value, start, end)
arr.copyWithin(0, 2); // copyWithin(target, start)
```

### Немутирующие (возвращают новый / значение)

```javascript
const arr = [1, 2, 3, 4, 5];
arr.map(x => x * 2);           // [2,4,6,8,10]  — трансформация
arr.filter(x => x > 2);        // [3,4,5]        — фильтрация
arr.reduce((acc, x) => acc + x, 0); // 15        — свёртка
arr.reduceRight((acc, x) => acc + x, 0); // справа налево
arr.find(x => x > 3);          // 4              — первый подходящий
arr.findIndex(x => x > 3);     // 3              — индекс первого
arr.findLast(x => x < 4);      // 3              — последний
arr.findLastIndex(x => x < 4); // 2
arr.some(x => x > 4);          // true           — хоть один
arr.every(x => x > 0);         // true           — все
arr.includes(3);                // true
arr.indexOf(3);                 // 2 (или -1)
arr.lastIndexOf(3);             // 2
arr.flat();                     // на 1 уровень
arr.flat(Infinity);             // полностью
arr.flatMap(x => [x, x * 2]);  // map + flat(1)
arr.slice(1, 3);               // [2,3]          — подмассив
arr.concat([6, 7]);             // [1,2,3,4,5,6,7]
arr.join("-");                  // "1-2-3-4-5"
arr.toString();                 // "1,2,3,4,5"
Array.from({ length: 5 }, (_, i) => i); // [0,1,2,3,4]
Array.isArray(arr);             // true
arr.at(-1);                     // 5 (с конца)
arr.toSorted();                 // ES2023: немутирующий sort
arr.toReversed();               // ES2023: немутирующий reverse
arr.toSpliced(1, 1);            // ES2023: немутирующий splice
arr.with(2, 99);                // ES2023: немутирующий замена элемента
```

---

## Single-pass идиомы

> **Закон:** Любая задача которую можно решить несколькими проходами — можно решить одним. Используй накопители: `Map`, `Set`, объект, несколько переменных в одном цикле.

### ❌ Антипаттерн vs ✅ Single-pass

```javascript
const users = [
  { name: "Alice", age: 25, active: true },
  { name: "Bob",   age: 17, active: false },
  { name: "Carol", age: 32, active: true },
  { name: "Dave",  age: 28, active: true },
];

// ❌ 3 прохода: filter → map → reduce
const avgAge = users
  .filter(u => u.active)
  .map(u => u.age)
  .reduce((sum, age, _, arr) => sum + age / arr.length, 0);

// ✅ 1 проход: всё в одном цикле
function avgAgeOfActive(users) {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < users.length; i++) {
    if (users[i].active) {
      sum += users[i].age;
      count++;
    }
  }
  return count === 0 ? 0 : sum / count;
}
```

### Паттерн: Многозадачная свёртка (multi-accumulator)

```javascript
// Получить за один проход: min, max, sum, count, среднее
function stats(arr) {
  if (arr.length === 0) return null;
  let min = arr[0], max = arr[0], sum = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { min, max, sum, avg: sum / arr.length, count: arr.length };
}

stats([3, 1, 4, 1, 5, 9, 2, 6]); // { min:1, max:9, sum:31, avg:3.875, count:8 }
```

### Паттерн: Hash map вместо вложенного цикла

```javascript
// ❌ O(n²): indexOf внутри цикла — это двойной проход!
function hasDuplicateSlow(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr.indexOf(arr[i]) !== i) return true; // indexOf = O(n) проход
  }
  return false;
}

// ✅ O(n): Set за один проход
function hasDuplicate(arr) {
  const seen = new Set();
  for (let i = 0; i < arr.length; i++) {
    if (seen.has(arr[i])) return true;
    seen.add(arr[i]);
  }
  return false;
}
```

### Паттерн: Partition (разделить за один проход)

```javascript
// ❌ 2 прохода
const evens = arr.filter(x => x % 2 === 0);
const odds = arr.filter(x => x % 2 !== 0);

// ✅ 1 проход
function partition(arr, pred) {
  const truthy = [], falsy = [];
  for (let i = 0; i < arr.length; i++) {
    (pred(arr[i]) ? truthy : falsy).push(arr[i]);
  }
  return [truthy, falsy];
}

const [evens2, odds2] = partition([1, 2, 3, 4, 5, 6], x => x % 2 === 0);
```

---

## Итерация

```javascript
const arr = [10, 20, 30];

// for: самый гибкий, самый быстрый, break/continue работают
for (let i = 0; i < arr.length; i++) { }

// for...of: чистый синтаксис, break/continue работают, нет индекса
for (const item of arr) { }

// for...of с индексом через entries()
for (const [i, item] of arr.entries()) {
  console.log(i, item);
}

// forEach: без break, нет await (async не работает как ожидается!)
arr.forEach((item, index) => { });

// Сравнение производительности:
// for (let i) > for...of > forEach > map/filter/reduce
// Для критичного кода: for (let i)
// Для читаемости: for...of

// ⚠️ Ловушка: forEach + async
async function wrongAsync() {
  [1, 2, 3].forEach(async (n) => {
    // await не ждёт — все запускаются параллельно!
    await someAsyncOp(n);
  });
  // Здесь операции ещё выполняются
}

async function correctAsync() {
  for (const n of [1, 2, 3]) {
    await someAsyncOp(n); // последовательно
  }
}
```

---

## Деструктуризация и spread

```javascript
// Деструктуризация с пропуском
const [first, , third, ...rest] = [1, 2, 3, 4, 5];
// first=1, third=3, rest=[4,5]

// Swap
let x = 1, y = 2;
[x, y] = [y, x];

// Параметры функции
function first2([head, ...tail]) {
  return { head, tail };
}
first2([1, 2, 3]); // { head: 1, tail: [2, 3] }

// Spread: копирование / spread в вызов функции
const copy = [...arr];
const nums = [1, 5, 3, 9, 2];
Math.max(...nums); // 9

// flat через spread (1 уровень)
const nested = [[1, 2], [3, 4], [5]];
const flat = [].concat(...nested); // [1, 2, 3, 4, 5]
// или arr.flat()

// Array.from
Array.from("hello");         // ['h','e','l','l','o']
Array.from({length: 3}, (_, i) => i + 1); // [1, 2, 3]
Array.from(new Set([1, 2, 2, 3])); // [1, 2, 3]
```

---

## Вопросы на интервью

1. **Почему `arr.sort()` без функции опасен?**
   > По умолчанию сортирует как строки: `[10, 9, 2].sort()` → `[10, 2, 9]`. Нужно передавать compareFn: `arr.sort((a, b) => a - b)`.

2. **Чем `find` отличается от `filter`?**
   > `find` — возвращает первый подходящий элемент или `undefined`. Останавливается при первом совпадении (O(k) где k — позиция). `filter` — возвращает массив всех подходящих, всегда проходит весь массив.

3. **Когда `reduce` хуже чем `for`?**
   > Когда нужен ранний выход (break). `reduce` всегда проходит весь массив. Также: `reduce` сложнее читать, плохо дебажится, хуже производительность из-за накладных расходов на callback per element.

4. **`forEach` vs `map` — разница?**
   > `forEach` — для side effects, возвращает `undefined`. `map` — для трансформации, возвращает новый массив той же длины. Используй `forEach` когда результат не нужен, `map` когда нужен новый массив.

5. **Почему нельзя `break` из `forEach`?**
   > `forEach` — это метод который сам вызывает callback для каждого элемента. `break` работает только внутри циклов (`for`, `while`, `for...of`). Для раннего выхода из forEach нужно бросить исключение — это антипаттерн. Используй `for...of` или `for`.

---

## Примеры кода

```bash
node 03-javascript/05-arrays/examples/array-methods.js
node 03-javascript/05-arrays/examples/single-pass.js
```
