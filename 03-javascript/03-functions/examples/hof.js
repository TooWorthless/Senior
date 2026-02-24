// ─────────────────────────────────────────────
// Higher-Order Functions, каррирование, compose/pipe
// node 03-javascript/03-functions/examples/hof.js
// ─────────────────────────────────────────────

// ─── Каррирование ─────────────────────────────
console.log("=== Каррирование ===");

function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs]);
    };
  };
}

const add = curry((a, b, c) => a + b + c);
console.log(add(1)(2)(3));    // 6
console.log(add(1, 2)(3));    // 6
console.log(add(1)(2, 3));    // 6
console.log(add(1, 2, 3));    // 6

// Практическое применение
const multiply = curry((factor, num) => factor * num);
const double = multiply(2);
const triple = multiply(3);

const nums = [1, 2, 3, 4, 5];
console.log(nums.map(double)); // [2, 4, 6, 8, 10]
console.log(nums.map(triple)); // [3, 6, 9, 12, 15]

// Фильтрация
const isGreaterThan = curry((min, num) => num > min);
const isPositive = isGreaterThan(0);
const isAdult = isGreaterThan(17);

console.log([-2, -1, 0, 1, 2].filter(isPositive));  // [1, 2]
console.log([15, 17, 18, 19].filter(isAdult));       // [18, 19]

// ─── Compose / Pipe ───────────────────────────
console.log("\n=== Compose / Pipe ===");

const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

// Чистые преобразования
const trim = s => s.trim();
const lower = s => s.toLowerCase();
const split = sep => s => s.split(sep);
const filter = pred => arr => arr.filter(pred);
const join = sep => arr => arr.join(sep);
const replace = (pattern, sub) => s => s.replace(pattern, sub);

// pipe: данные текут слева направо
const normalizeEmail = pipe(
  trim,
  lower,
  replace(/\s+/g, ""),
);

console.log(normalizeEmail("  Alice@EXAMPLE.COM  ")); // "alice@example.com"

// Обработка строки
const tokenize = pipe(
  trim,
  lower,
  split(/\s+/),
  filter(w => w.length > 2),
  join("-"),
);

console.log(tokenize("  The Quick Brown Fox  ")); // "the-quick-brown-fox"

// compose: тот же результат, обратный порядок
const normalizeEmail2 = compose(
  replace(/\s+/g, ""),
  lower,
  trim,
);
console.log(normalizeEmail2("  Alice@EXAMPLE.COM  ")); // "alice@example.com"

// ─── Декораторы функций ───────────────────────
console.log("\n=== Декораторы ===");

// 1. Мемоизация
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

let callCount = 0;
const fib = memoize(function fibonacci(n) {
  callCount++;
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fib(10));  // 55
console.log(`fib(10): ${callCount} вычислений`); // 11

callCount = 0;
console.log(fib(10));  // 55 — из кэша
console.log(`fib(10) повторно: ${callCount} вычислений`); // 0

// 2. Throttle
function throttle(fn, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

// 3. Debounce
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 4. Once
function once(fn) {
  let called = false, result;
  return function(...args) {
    if (!called) { called = true; result = fn.apply(this, args); }
    return result;
  };
}

const onceLog = once(msg => { console.log("Выполнено:", msg); return msg; });
onceLog("first");  // Выполнено: first
onceLog("second"); // не выполнится

// 5. withTiming
function withTiming(fn, label = fn.name) {
  return function(...args) {
    const start = performance.now();
    const result = fn.apply(this, args);
    const elapsed = (performance.now() - start).toFixed(3);
    console.log(`${label}: ${elapsed}ms`);
    return result;
  };
}

// ─── Функциональные утилиты ───────────────────
console.log("\n=== Функциональные утилиты ===");

// tap: для дебага в pipe (пропускает значение, выполняет side effect)
const tap = fn => x => { fn(x); return x; };
const log = tap(x => console.log("  tap:", x));

const result = pipe(
  x => x * 2,
  log,         // логирует промежуточное значение
  x => x + 1,
  log,
  x => `val: ${x}`,
)(5);
console.log(result);

// identity
const identity = x => x;

// constant (always)
const always = x => () => x;
const alwaysTrue = always(true);
const alwaysFalse = always(false);

// negate
const negate = fn => (...args) => !fn(...args);
const isEven = n => n % 2 === 0;
const isOdd = negate(isEven);
console.log([1, 2, 3, 4, 5].filter(isOdd)); // [1, 3, 5]

// ─── Рекурсия и хвостовая рекурсия ────────────
console.log("\n=== Рекурсия ===");

// Обычная рекурсия
function sumArray(arr, i = 0) {
  if (i >= arr.length) return 0;
  return arr[i] + sumArray(arr, i + 1);
}

// Итеративно (лучше для больших данных):
function sumArrayIter(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  return sum;
}

console.log(sumArray([1, 2, 3, 4, 5]));      // 15
console.log(sumArrayIter([1, 2, 3, 4, 5]));  // 15

// Рекурсивная flatten
function flatten(arr) {
  const result = [];
  function walk(item) {
    if (Array.isArray(item)) {
      for (let i = 0; i < item.length; i++) walk(item[i]);
    } else {
      result.push(item);
    }
  }
  walk(arr);
  return result;
}

console.log(flatten([1, [2, [3, [4]], 5]])); // [1, 2, 3, 4, 5]

// Итеративная flatten (stack-based, нет риска stack overflow)
function flattenIterative(arr) {
  const result = [];
  const stack = [...arr];
  while (stack.length > 0) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      for (let i = item.length - 1; i >= 0; i--) {
        stack.push(item[i]);
      }
    } else {
      result.push(item);
    }
  }
  return result;
}

console.log(flattenIterative([1, [2, [3, [4]], 5]])); // [1, 2, 3, 4, 5]
