# 03 · Функции

[← JavaScript](../README.md)

---

## Содержание

1. [Виды объявлений](#виды-объявлений)
2. [Arrow functions — отличия](#arrow-functions--отличия)
3. [this — контекст](#this--контекст)
4. [call / apply / bind](#call--apply--bind)
5. [Аргументы: rest, arguments](#аргументы-rest-arguments)
6. [First-class functions и HOF](#first-class-functions-и-hof)
7. [Каррирование и compose/pipe](#каррирование-и-composepipe)
8. [IIFE](#iife)
9. [Вопросы на интервью](#вопросы-на-интервью)

---

## Виды объявлений

```javascript
// 1. Function Declaration — hoisting, именованная
function greet(name) { return `Hello, ${name}`; }

// 2. Function Expression — значение, нет hoisting
const greet2 = function(name) { return `Hello, ${name}`; };

// 3. Named Function Expression — имя доступно только внутри (рекурсия, стеки)
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1); // fact доступно внутри
};

// 4. Arrow Function — лексический this, нет arguments, нет prototype
const greet3 = (name) => `Hello, ${name}`;
const greet4 = name => `Hello, ${name}`;     // 1 параметр — без скобок
const getValue = () => ({ key: "value" });    // объект — оберни в ()

// 5. Generator Function
function* gen() { yield 1; yield 2; yield 3; }

// 6. Async Function — отдельный модуль
```

---

## Arrow Functions — отличия

| | `function` | Arrow `=>` |
|---|---|---|
| `this` | dynamic (context) | lexical (outer) |
| `arguments` | ✅ | ❌ |
| `new` | ✅ | ❌ TypeError |
| `prototype` | ✅ | ❌ |
| `super` | ✅ | ❌ |
| Метод класса | ✅ (рискованно) | ✅ (безопасно) |

```javascript
// this: dynamic в function
const obj = {
  name: "obj",
  regularMethod() {
    console.log(this.name); // "obj" — this = obj при вызове obj.method()
  },
  arrowMethod: () => {
    console.log(this); // undefined (strict) или global — this из внешнего scope
  },
};

// Проблема в callbacks
const obj2 = {
  name: "obj2",
  values: [1, 2, 3],
  printAll() {
    this.values.forEach(function(v) {
      // this тут = undefined (strict mode) или global
      // console.log(this.name, v); // TypeError!
    });
    this.values.forEach(v => {
      console.log(this.name, v); // ✅ arrow захватывает this из printAll
    });
  },
};
obj2.printAll();

// new с arrow — невозможно
try {
  const Arr = () => {};
  new Arr(); // TypeError: Arr is not a constructor
} catch(e) {
  console.log("arrow + new:", e.message);
}
```

---

## this — контекст

`this` определяется **способом вызова**, не местом написания (кроме arrow).

```javascript
// 1. Метод объекта: this = объект
const user = {
  name: "Alice",
  greet() { return this.name; },
};
user.greet(); // "Alice"

// 2. Отдельный вызов: this = undefined (strict) / global (sloppy)
const fn = user.greet;    // потеря контекста!
// fn(); // TypeError в strict mode

// 3. call/apply/bind: явный this (см. следующий раздел)

// 4. new: this = новый объект
function Person(name) { this.name = name; }
const p = new Person("Bob"); // this = новый объект

// 5. Arrow: this из лексического окружения — не меняется

// Порядок приоритета:
// new > bind > call/apply > method > implicit > default global
```

---

## call / apply / bind

```javascript
function introduce(greeting, punctuation) {
  return `${greeting}, I'm ${this.name}${punctuation}`;
}

const person = { name: "Alice" };

// call: вызов немедленно, аргументы через запятую
introduce.call(person, "Hello", "!");    // "Hello, I'm Alice!"

// apply: вызов немедленно, аргументы массивом
introduce.apply(person, ["Hello", "!"]); // "Hello, I'm Alice!"

// bind: возвращает новую функцию с привязанным this
const boundFn = introduce.bind(person);
boundFn("Hi", "?");                      // "Hi, I'm Alice?"

// Частичное применение через bind
const boundGreet = introduce.bind(person, "Hey"); // фиксируем greeting
boundGreet(".");  // "Hey, I'm Alice."

// Применение: Math.max для массива
const nums = [1, 5, 3, 9, 2];
Math.max(...nums);            // 9 — spread (предпочтительно)
Math.max.apply(null, nums);   // 9 — через apply (старый способ)

// bind не перебивается
function fn() { return this.x; }
const bound = fn.bind({ x: 1 });
const rebound = bound.bind({ x: 2 }); // bind игнорируется
rebound(); // 1 — первый bind "выигрывает"
```

---

## Аргументы: rest, arguments

```javascript
// arguments — псевдомассив, нет у arrow
function sum() {
  let total = 0;
  for (let i = 0; i < arguments.length; i++) {
    total += arguments[i];
  }
  return total;
}
sum(1, 2, 3); // 6

// ✅ Используй rest parameters вместо arguments
function sum2(...nums) {
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    total += nums[i];
  }
  return total;
}
sum2(1, 2, 3, 4); // 10

// Значения по умолчанию
function greet(name = "World", greeting = "Hello") {
  return `${greeting}, ${name}!`;
}
greet();            // "Hello, World!"
greet("Alice");     // "Hello, Alice!"
greet(undefined);   // "Hello, World!" ← undefined триггерит default
greet(null);        // "Hello, null!" ← null НЕ триггерит default

// Destructuring в параметрах
function render({ title, body = "", isPublic = false } = {}) {
  return { title, body, isPublic };
}
render({ title: "Post" }); // { title: "Post", body: "", isPublic: false }
render();                  // {} — дефолт {} предотвращает TypeError
```

---

## First-class functions и HOF

```javascript
// Функции — первоклассные значения: передаются, возвращаются, хранятся

// HOF: принимает или возвращает функцию
function withLogging(fn) {
  return function(...args) {
    console.log(`Вызов ${fn.name} с`, args);
    const result = fn(...args);
    console.log(`${fn.name} вернул`, result);
    return result;
  };
}

const add = (a, b) => a + b;
const loggedAdd = withLogging(add);
loggedAdd(2, 3); // логирует и возвращает 5

// Декоратор: retry
function withRetry(fn, maxAttempts = 3) {
  return async function(...args) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch(e) {
        lastError = e;
        console.log(`Попытка ${attempt} не удалась:`, e.message);
      }
    }
    throw lastError;
  };
}
```

---

## Каррирование и compose/pipe

```javascript
// Каррирование: f(a, b, c) → f(a)(b)(c)
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}

const curriedAdd = curry((a, b, c) => a + b + c);
curriedAdd(1)(2)(3);    // 6
curriedAdd(1, 2)(3);    // 6
curriedAdd(1)(2, 3);    // 6
curriedAdd(1, 2, 3);    // 6

// Практическое применение
const multiply = curry((factor, num) => factor * num);
const double = multiply(2);
const triple = multiply(3);
[1, 2, 3, 4].map(double); // [2, 4, 6, 8]
[1, 2, 3, 4].map(triple); // [3, 6, 9, 12]

// compose: f(g(h(x))) — right-to-left
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);

// pipe: h(g(f(x))) — left-to-right (data pipeline)
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const transform = pipe(
  x => x * 2,         // сначала удвоить
  x => x + 1,         // потом прибавить 1
  x => `Result: ${x}` // потом строку
);
transform(5); // "Result: 11"
```

---

## IIFE

```javascript
// Immediately Invoked Function Expression
// Создаёт изолированный scope (до ES modules / let)

(function() {
  var private = "не виден снаружи";
  // ... код ...
})();

// Arrow IIFE
(() => {
  const config = {};
  // ...
})();

// IIFE с результатом
const result = (() => {
  const x = 10;
  const y = 20;
  return x + y;
})();
console.log(result); // 30

// Современная альтернатива: блочный scope с let/const
{
  const private2 = "тоже изолировано";
  // ...
}
```

---

## Вопросы на интервью

1. **Разница между `function declaration` и `function expression`?**
   > Declaration hoisted целиком — вызывать можно до объявления. Expression — только переменная hoisted. Named function expression: имя видно только внутри функции, полезно для рекурсии и стека вызовов.

2. **Как работает `this` в обычной функции vs arrow?**
   > Обычная: `this` = контекст вызова (кто слева от точки, или explicit через `call`/`apply`/`bind`). Arrow: `this` лексический — из внешнего scope на момент создания, не меняется ничем.

3. **Разница `call`, `apply`, `bind`?**
   > `call(ctx, a, b)` — немедленный вызов, аргументы перечислением. `apply(ctx, [a, b])` — немедленный вызов, аргументы массивом. `bind(ctx, a)` — возвращает новую функцию, не вызывает. Первый bind "выигрывает" — re-bind игнорируется.

4. **Реализуй curry?**
   > Функция, принимающая функцию. Возвращает `curried`. Если аргументов >= fn.length — вызывает оригинал. Иначе — рекурсивно возвращает новую curried с накопленными аргументами.

5. **Что такое `compose` и `pipe`, чем отличаются?**
   > `compose(f, g, h)(x)` = `f(g(h(x)))` — правая выполняется первой. `pipe(f, g, h)(x)` = `f` первая. `pipe` — data pipeline, удобен для чтения (слева направо). `compose` — математическое соглашение.

---

## Примеры кода

```bash
node 03-javascript/03-functions/examples/functions.js
node 03-javascript/03-functions/examples/hof.js
```
