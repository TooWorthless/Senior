// ─────────────────────────────────────────────
// Generators, итераторы, async generators
// node 03-javascript/11-async-event-loop/examples/generators.js
// ─────────────────────────────────────────────

// ─── Итерируемые объекты ──────────────────────
console.log("=== Итерируемые объекты ===");

// Протокол итерации: Symbol.iterator → функция → { next() → { value, done } }

class Range {
  constructor(start, end, step = 1) {
    this.start = start;
    this.end = end;
    this.step = step;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const { end, step } = this;
    return {
      next() {
        if (current <= end) {
          const value = current;
          current += step;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
      [Symbol.iterator]() { return this; } // сам итерируемый (для for...of)
    };
  }
}

const range = new Range(1, 10, 2);
console.log([...range]);                     // [1, 3, 5, 7, 9]
for (const n of range) process.stdout.write(n + " ");
console.log();

const [first, second, ...rest] = new Range(1, 10);
console.log("first:", first, "second:", second, "rest:", rest);

// ─── Generators ───────────────────────────────
console.log("\n=== Generators ===");

// function* — возвращает Generator (который и итерируемый, и итератор)
function* fibonacci() {
  let a = 0, b = 1;
  while (true) {
    yield a;           // возвращает a, приостанавливается
    [a, b] = [b, a + b];
  }
}

function take(gen, n) {
  const result = [];
  for (const v of gen) {
    result.push(v);
    if (result.length >= n) break; // break корректно завершает генератор!
  }
  return result;
}

console.log("fib(10):", take(fibonacci(), 10));
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

// Двусторонняя связь: next(value) передаёт значение в yield
function* calculator() {
  let result = 0;
  while (true) {
    const input = yield result;   // получаем значение от next()
    if (input === null) return result; // завершение
    result += input;
  }
}

const calc = calculator();
calc.next();        // { value: 0, done: false } — старт
calc.next(10);      // { value: 10, done: false }
calc.next(20);      // { value: 30, done: false }
calc.next(5);       // { value: 35, done: false }
const final = calc.next(null); // { value: 35, done: true }
console.log("calculator result:", final.value); // 35

// yield*: делегация другому итерируемому
function* concat(...iterables) {
  for (const it of iterables) yield* it;
}

console.log([...concat([1,2], [3,4], [5])]);   // [1,2,3,4,5]
console.log([...concat("ab", [3], "cd")]);      // ["a","b",3,"c","d"]

// throw() и return() для генераторов
function* guardedGen() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } catch(e) {
    console.log("Generator caught:", e.message);
    yield -1; // можно продолжить!
  } finally {
    console.log("Generator finally");
  }
}

const g = guardedGen();
console.log(g.next());           // { value: 1, done: false }
console.log(g.throw(new Error("oops"))); // Generator caught: oops, { value: -1, done: false }
console.log(g.next());           // Generator finally, { value: undefined, done: true }

// ─── Бесконечные последовательности ─────────
console.log("\n=== Бесконечные последовательности ===");

function* naturals(start = 0) { while (true) yield start++; }
function* map(gen, fn) { for (const v of gen) yield fn(v); }
function* filter(gen, pred) { for (const v of gen) if (pred(v)) yield v; }
function* takeWhile(gen, pred) {
  for (const v of gen) {
    if (!pred(v)) return;
    yield v;
  }
}

// Цепочка ленивых операций (lazy evaluation)
const evenSquares = filter(
  map(naturals(1), x => x * x),  // 1, 4, 9, 16, 25, ...
  x => x % 2 === 0               // фильтр чётных
);

console.log("First 5 even squares:", take(evenSquares, 5));
// [4, 16, 36, 64, 100]

// Простые числа — решето через генераторы
function* primes() {
  const composites = new Set();
  for (const n of naturals(2)) {
    if (!composites.has(n)) {
      yield n;
      for (let multiple = n * n; multiple < 10000; multiple += n) {
        composites.add(multiple);
      }
    }
  }
}

console.log("First 10 primes:", take(primes(), 10));
// [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]

// ─── Async Generators ─────────────────────────
console.log("\n=== Async Generators ===");

// Стриминг данных с пагинацией
async function* paginatedFetch(baseUrl, limit = 10) {
  let page = 1;
  while (true) {
    // Имитация API
    await new Promise(r => setTimeout(r, 10));
    const items = Array.from({length: limit}, (_, i) => ({
      id: (page - 1) * limit + i + 1,
      page,
    }));
    const hasMore = page < 3; // 3 страницы
    for (const item of items) yield item;
    if (!hasMore) return;
    page++;
  }
}

// for await...of — для async iterables
(async () => {
  let count = 0;
  for await (const item of paginatedFetch("/api/items")) {
    count++;
    if (count <= 3 || count === 30) {
      console.log(`  page=${item.page}, id=${item.id}`);
    }
  }
  console.log(`Total items streamed: ${count}`);
})();

// Async generator для трансформации потока
async function* transform(source, fn) {
  for await (const item of source) {
    yield await fn(item);
  }
}

// Pipeline через async generators
async function* pipeline(...transforms) {
  // Первый элемент — источник, остальные — трансформации
  // Упрощённая версия
}

// ─── Generator как конечный автомат ──────────
console.log("\n=== Конечный автомат (State Machine) ===");

function* trafficLight() {
  while (true) {
    yield "RED";    // остановись
    yield "GREEN";  // езди
    yield "YELLOW"; // замедлись
  }
}

const light = trafficLight();
for (let i = 0; i < 7; i++) {
  const { value } = light.next();
  process.stdout.write(value + " → ");
}
console.log("...");

// ─── Coroutines через generators ─────────────
console.log("\n=== Coroutines ===");

// scheduler простых корутин
function run(...generators) {
  const queue = generators.map(g => g());
  let i = 0;

  function step() {
    if (queue.length === 0) return;
    const { value, done } = queue[i % queue.length].next();
    if (done) {
      queue.splice(i % queue.length, 1);
      if (queue.length === 0) return;
    }
    i++;
    setImmediate(step); // yield control
  }
  step();
}

function* task(name, steps) {
  for (let i = 1; i <= steps; i++) {
    process.stdout.write(`${name}[${i}] `);
    yield; // передать управление
  }
  process.stdout.write(`\n${name} done `);
}

setTimeout(() => {
  console.log("\nCoroutines interleaving:");
  run(
    () => task("A", 3),
    () => task("B", 3),
    () => task("C", 2),
  );
  // A[1] B[1] C[1] A[2] B[2] C[2] A[3] B[3] A done B done C done
}, 100);
