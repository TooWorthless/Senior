// ─────────────────────────────────────────────
// Методы массивов: примеры и ловушки
// node 03-javascript/05-arrays/examples/array-methods.js
// ─────────────────────────────────────────────

// ─── Мутирующие методы ────────────────────────
console.log("=== Мутирующие методы ===");

const arr = [1, 2, 3, 4, 5];

// splice: удалить и/или вставить
const removed = arr.splice(1, 2, 10, 20); // удалить 2 с позиции 1, вставить 10,20
console.log("после splice:", arr);     // [1, 10, 20, 4, 5]
console.log("removed:", removed);      // [2, 3]

// Вставка без удаления
arr.splice(2, 0, 99, 98); // вставить 99,98 на позицию 2
console.log("после вставки:", arr);    // [1, 10, 99, 98, 20, 4, 5]

// sort без compareFn — строковая сортировка!
const nums = [10, 9, 1, 100, 20, 2];
const badSort = [...nums].sort();
console.log("sort() без fn (опасно):", badSort); // [1, 10, 100, 2, 20, 9]

const goodSort = [...nums].sort((a, b) => a - b);
console.log("sort((a,b)=>a-b):", goodSort); // [1, 2, 9, 10, 20, 100]

// Стабильная сортировка объектов
const users = [
  { name: "Charlie", age: 25 },
  { name: "Alice",   age: 30 },
  { name: "Bob",     age: 25 },
];
const sorted = [...users].sort((a, b) => {
  if (a.age !== b.age) return a.age - b.age;
  return a.name.localeCompare(b.name); // stable: по имени при равном возрасте
});
console.log("sorted:", sorted.map(u => u.name)); // ["Bob", "Charlie", "Alice"]

// ─── Поиск ────────────────────────────────────
console.log("\n=== Поиск ===");

const items = [
  { id: 1, name: "apple",  active: true },
  { id: 2, name: "banana", active: false },
  { id: 3, name: "cherry", active: true },
];

// find: первый подходящий
const found = items.find(item => item.active && item.name.startsWith("c"));
console.log("find:", found?.name); // "cherry"

// findIndex
const idx = items.findIndex(item => item.id === 2);
console.log("findIndex:", idx); // 1

// includes — точное сравнение ===
console.log([1, 2, NaN].includes(NaN)); // true (includes использует SameValueZero)
console.log([1, 2, NaN].indexOf(NaN));  // -1 (indexOf использует ===)

// ─── Трансформации ────────────────────────────
console.log("\n=== Трансформации ===");

// map
console.log([1, 2, 3].map(x => x ** 2)); // [1, 4, 9]

// flatMap: map + flat(1) — эффективнее чем map().flat()
const sentences = ["Hello World", "Foo Bar Baz"];
const words = sentences.flatMap(s => s.split(" "));
console.log("flatMap:", words); // ["Hello", "World", "Foo", "Bar", "Baz"]

// Array.from с mapFn
const squares = Array.from({ length: 5 }, (_, i) => (i + 1) ** 2);
console.log("Array.from:", squares); // [1, 4, 9, 16, 25]

// ─── reduce — правильное использование ────────
console.log("\n=== reduce ===");

// Простая сумма (лучше for, но для демо)
const sum = [1, 2, 3, 4, 5].reduce((acc, x) => acc + x, 0);
console.log("sum:", sum); // 15

// Построение объекта из массива
const keyedById = items.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});
console.log("keyedById:", keyedById);

// Транспозиция: flat массив записей в объект
const pairs = [["a", 1], ["b", 2], ["c", 3]];
const obj = pairs.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
console.log("из pairs:", obj); // { a: 1, b: 2, c: 3 }

// Важно: reduce не для всего! Если нужен ранний выход — используй for:
// Пример: найти первый элемент > 3 (reduce всегда идёт до конца!)
const arr2 = [1, 2, 3, 4, 5];
let firstBig; // O(n) но с возможностью break:
for (let i = 0; i < arr2.length; i++) {
  if (arr2[i] > 3) { firstBig = arr2[i]; break; }
}
console.log("firstBig (with break):", firstBig); // 4

// ─── ES2023 методы (немутирующие версии) ─────
console.log("\n=== ES2023 немутирующие методы ===");

const original = [3, 1, 4, 1, 5, 9];
console.log("original:", original);

// toSorted — не мутирует
const sorted2 = original.toSorted((a, b) => a - b);
console.log("toSorted:", sorted2);      // [1, 1, 3, 4, 5, 9]
console.log("original:", original);     // [3, 1, 4, 1, 5, 9] — не изменён!

// toReversed
const reversed = original.toReversed();
console.log("toReversed:", reversed);   // [9, 5, 1, 4, 1, 3]
console.log("original:", original);     // не изменён

// toSpliced
const spliced = original.toSpliced(2, 1, 99); // удалить 1 с позиции 2, вставить 99
console.log("toSpliced:", spliced);     // [3, 1, 99, 1, 5, 9]
console.log("original:", original);     // не изменён

// with — заменить элемент по индексу
const withVal = original.with(0, 100);
console.log("with:", withVal);          // [100, 1, 4, 1, 5, 9]
console.log("original:", original);     // не изменён

// at — отрицательные индексы
console.log("at(-1):", original.at(-1)); // 9
console.log("at(-2):", original.at(-2)); // 5

// ─── Ловушки ──────────────────────────────────
console.log("\n=== Ловушки ===");

// Дыры в массиве (sparse array)
const sparse = [1, , 3]; // элемент на индексе 1 отсутствует (hole)
console.log("sparse.length:", sparse.length); // 3
console.log("sparse[1]:", sparse[1]);          // undefined
console.log("1 in sparse:", 1 in sparse);      // false (hole ≠ undefined)

// forEach / map пропускают дыры
sparse.forEach((v, i) => console.log(i, v)); // 0 1, 2 3 (пропустил 1)

// Изменение длины
const a = [1, 2, 3, 4, 5];
a.length = 3;
console.log("после length=3:", a); // [1, 2, 3] — остальное удалено!

// delete не уменьшает length!
const b = [1, 2, 3, 4, 5];
delete b[2];
console.log("после delete[2]:", b);        // [1, 2, empty, 4, 5]
console.log("b.length:", b.length);         // 5 (не изменилась!)
console.log("b[2]:", b[2]);                  // undefined

// Используй splice для удаления:
b.splice(2, 1);
console.log("после splice:", b);            // [1, 2, 4, 5]
