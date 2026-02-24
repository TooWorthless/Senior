// ─────────────────────────────────────────────
// Замыкания: паттерны и практика
// node 03-javascript/02-variables-and-scope/examples/closures.js
// ─────────────────────────────────────────────

// ─── Базовое замыкание ────────────────────────
console.log("=== Базовое замыкание ===");

function makeMultiplier(factor) {
  return function(num) {
    return num * factor; // factor захвачен из внешнего scope
  };
}

const double = makeMultiplier(2);
const triple = makeMultiplier(3);

console.log(double(5));   // 10
console.log(triple(5));   // 15
console.log(double(10));  // 20

// ─── Паттерн модуля (Module Pattern) ─────────
console.log("\n=== Module Pattern ===");

function createBankAccount(initialBalance) {
  let balance = initialBalance; // приватное состояние
  const history = [];           // приватный массив операций

  function record(op, amount) {
    history.push({ op, amount, balance });
  }

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Сумма должна быть положительной");
      balance += amount;
      record("deposit", amount);
      return this;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error("Недостаточно средств");
      balance -= amount;
      record("withdraw", amount);
      return this;
    },
    getBalance: () => balance,
    getHistory: () => [...history], // копия, не ссылка
  };
}

const account = createBankAccount(1000);
account.deposit(500).withdraw(200);
console.log("Баланс:", account.getBalance()); // 1300
console.log("История:", account.getHistory());

// ─── Мемоизация через замыкание ───────────────
console.log("\n=== Мемоизация ===");

function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);    // ключ из аргументов
    if (cache.has(key)) {
      console.log(`  [cache hit] key: ${key}`);
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize(function(n) {
  console.log(`  [compute] n=${n}`);
  // Имитация тяжёлых вычислений
  let result = 0;
  for (let i = 0; i <= n; i++) result += i;
  return result;
});

console.log(expensiveCalc(100));  // compute
console.log(expensiveCalc(100));  // cache hit
console.log(expensiveCalc(200));  // compute

// ─── Счётчик с замыканием ─────────────────────
console.log("\n=== Счётчик ===");

function createCounter(start = 0, step = 1) {
  let count = start;

  return {
    next: () => { count += step; return count; },
    prev: () => { count -= step; return count; },
    reset: () => { count = start; return count; },
    peek: () => count,
    [Symbol.iterator]() {
      return {
        next: () => ({ value: count++, done: false }),
      };
    },
  };
}

const counter = createCounter(0, 2);
console.log(counter.next()); // 2
console.log(counter.next()); // 4
console.log(counter.prev()); // 2
console.log(counter.peek()); // 2

// ─── Частичное применение через замыкание ─────
console.log("\n=== Частичное применение ===");

function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

const log = (level, message) => `[${level}] ${message}`;
const logInfo = partial(log, "INFO");
const logError = partial(log, "ERROR");

console.log(logInfo("Сервер запущен"));    // [INFO] Сервер запущен
console.log(logError("Соединение упало")); // [ERROR] Соединение упало

// ─── Once: функция выполняется один раз ───────
console.log("\n=== Once ===");

function once(fn) {
  let called = false;
  let result;
  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

const initialize = once(function() {
  console.log("  Инициализация...");
  return { initialized: true };
});

const r1 = initialize(); // Инициализация... (выполнился)
const r2 = initialize(); // (не выполнился)
const r3 = initialize(); // (не выполнился)
console.log("r1 === r2:", r1 === r2); // true (тот же объект)

// ─── Замыкание сохраняет ссылку, не снимок ────
console.log("\n=== Замыкание: ссылка vs снимок ===");

function createObject() {
  let data = { count: 0 };

  return {
    mutate: () => { data.count++; },      // изменяет объект по ссылке
    reassign: () => { data = { count: 0 }; }, // меняет ссылку
    get: () => data,
  };
}

const obj = createObject();
obj.mutate();
obj.mutate();
console.log("После mutate:", obj.get().count); // 2
obj.reassign();
console.log("После reassign:", obj.get().count); // 0
