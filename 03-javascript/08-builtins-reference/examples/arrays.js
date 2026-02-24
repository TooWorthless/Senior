// ─────────────────────────────────────────────
// Встроенные методы массивов — полный справочник
// node 03-javascript/08-builtins-reference/examples/arrays.js
// ─────────────────────────────────────────────

console.log("=== Создание ===");
console.log(Array.from("hello"));                     // ["h","e","l","l","o"]
console.log(Array.from({length:5}, (_,i) => i*2));   // [0,2,4,6,8]
console.log(Array.from(new Set([1,2,2,3])));          // [1,2,3]  — из Set
console.log(Array.isArray([]));                        // true
console.log(Array.isArray({}));                        // false
console.log(Array.of(1, 2, 3));                        // [1,2,3]
console.log(new Array(3).fill(0));                     // [0,0,0]

console.log("\n=== Мутирующие ===");

const a = [1, 2, 3];
console.log(a.push(4, 5));                // 5      — длина после push
console.log(a);                           // [1,2,3,4,5]
console.log(a.pop());                     // 5      — удалённый элемент
console.log(a);                           // [1,2,3,4]
console.log(a.unshift(0));                // 5      — длина после unshift
console.log(a);                           // [0,1,2,3,4]
console.log(a.shift());                   // 0      — удалённый элемент
console.log(a);                           // [1,2,3,4]

// splice(start, deleteCount, ...insertItems)
const b = [1,2,3,4,5];
console.log(b.splice(1, 2));              // [2,3]  — удалённые элементы
console.log(b);                           // [1,4,5]
b.splice(1, 0, 99, 98);                  // вставка без удаления
console.log(b);                           // [1,99,98,4,5]

// sort — без compareFn → лексикографически!
console.log([10,9,2,100].sort());         // [10,100,2,9]  ← ОПАСНО
console.log([10,9,2,100].sort((a,b)=>a-b)); // [2,9,10,100]

// Стабильная сортировка объектов (V8 гарантирует стабильность с Node 11+)
const people = [{n:"Bob",a:25},{n:"Alice",a:25},{n:"Carol",a:30}];
people.sort((a,b) => a.a - b.a); // сортируем по возрасту, порядок Bob/Alice сохранён
console.log(people.map(p=>p.n));           // ["Bob","Alice","Carol"]

console.log("\n=== reverse / fill / copyWithin ===");
console.log([1,2,3,4].reverse());          // [4,3,2,1] — мутирует!
console.log(new Array(5).fill(0));          // [0,0,0,0,0]
console.log([1,2,3,4,5].fill(0,2,4));      // [1,2,0,0,5]  — fill(v, start, end)
console.log([1,2,3,4,5].copyWithin(0,3)); // [4,5,3,4,5]  — скопировать [3..] → [0..]

console.log("\n=== Поиск ===");
const arr = [1, 2, 3, 4, 3, 2, 1];
console.log(arr.indexOf(3));               // 2      — первый === индекс
console.log(arr.lastIndexOf(3));           // 4      — последний ===
console.log(arr.indexOf(99));              // -1     — не найдено
console.log(arr.includes(3));              // true
console.log([1,2,NaN].includes(NaN));      // true   — SameValueZero
console.log([1,2,NaN].indexOf(NaN));       // -1     — === не сравнивает NaN!

const objs = [{id:1},{id:2},{id:3}];
console.log(objs.find(o => o.id === 2));       // {id:2}
console.log(objs.findIndex(o => o.id === 2));  // 1
console.log(objs.findLast(o => o.id < 3));     // {id:2}
console.log(objs.findLastIndex(o => o.id < 3)); // 1

console.log("\n=== Трансформации ===");
console.log([1,2,3].map(x => x**2));           // [1,4,9]
console.log([1,2,3,4].filter(x => x%2===0));   // [2,4]
console.log([1,2,3,4,5].reduce((acc,x)=>acc+x, 0)); // 15
console.log([1,2,3].reduceRight((acc,x)=>`${acc}${x}`, ""));  // "321"

// flatMap = map + flat(1)
console.log([1,2,3].flatMap(x => [x, -x]));   // [1,-1,2,-2,3,-3]
console.log(["a b","c d"].flatMap(s=>s.split(" "))); // ["a","b","c","d"]

// flat
console.log([1,[2,[3,[4]]]].flat());           // [1,2,[3,[4]]]  — глубина 1
console.log([1,[2,[3,[4]]]].flat(Infinity));   // [1,2,3,4]

// slice — не мутирует
console.log([1,2,3,4,5].slice(1,3));           // [2,3]   — [start, end)
console.log([1,2,3,4,5].slice(-2));            // [4,5]   — с конца
console.log([1,2,3].concat([4,5],[6]));        // [1,2,3,4,5,6]
console.log([1,2,3].join(" | "));              // "1 | 2 | 3"
console.log([1,2,3].toString());               // "1,2,3"

console.log("\n=== Итерация ===");
console.log([...[1,2,3].keys()]);              // [0,1,2]
console.log([...[1,2,3].values()]);            // [1,2,3]
console.log([...[1,2,3].entries()]);           // [[0,1],[1,2],[2,3]]

// forEach — нет return, нет break
[1,2,3].forEach((v, i, arr) => {
  process.stdout.write(`${i}:${v} `);
});
console.log();

// at — отрицательные индексы
console.log([1,2,3,4,5].at(0));               // 1
console.log([1,2,3,4,5].at(-1));              // 5
console.log([1,2,3,4,5].at(-2));              // 4

console.log("\n=== Проверки ===");
console.log([1,2,3].some(x => x > 2));        // true   — хоть один
console.log([1,2,3].every(x => x > 0));       // true   — все
console.log([1,2,3].every(x => x > 1));       // false

console.log("\n=== ES2023 (немутирующие) ===");
const original = [3,1,4,1,5];
console.log(original.toSorted((a,b)=>a-b));  // [1,1,3,4,5]
console.log(original);                        // [3,1,4,1,5] — не изменён!
console.log(original.toReversed());           // [5,1,4,1,3]
console.log(original);                        // [3,1,4,1,5]
console.log(original.toSpliced(2, 1, 99));    // [3,1,99,1,5]
console.log(original.with(1, 99));            // [3,99,4,1,5]

console.log("\n=== Ловушки ===");

// push в forEach меняет длину — потенциально опасно
// НЕ делай такого:
// arr.forEach(() => arr.push(1)); // бесконечный цикл!

// sort мутирует оригинал — всегда копируй если нужно
const nums = [3,1,2];
const sorted = [...nums].sort((a,b)=>a-b); // копия!
console.log(nums);   // [3,1,2] — не изменён
console.log(sorted); // [1,2,3]

// delete оставляет дыры (hole)
const c = [1,2,3];
delete c[1];
console.log(c);          // [1, empty, 3]  — hole!
console.log(c.length);   // 3 — не уменьшился!
console.log(1 in c);     // false — hole != undefined
c.splice(1,1);           // правильное удаление
console.log(c);          // [1,3]
