# 02 · Переменные и область видимости

[← JavaScript](../README.md)

---

## Содержание

1. [var / let / const — различия](#var--let--const)
2. [Hoisting (поднятие)](#hoisting)
3. [Temporal Dead Zone (TDZ)](#temporal-dead-zone-tdz)
4. [Scope chain](#scope-chain)
5. [Closures](#closures)
6. [Классическая ловушка: var в цикле](#классическая-ловушка-var-в-цикле)
7. [Вопросы на интервью](#вопросы-на-интервью)

---

## var / let / const

| | `var` | `let` | `const` |
|---|---|---|---|
| Scope | Function | Block | Block |
| Hoisting | ✅ (undefined) | ✅ (TDZ) | ✅ (TDZ) |
| Re-declare | ✅ | ❌ | ❌ |
| Re-assign | ✅ | ✅ | ❌ |
| Global property | ✅ (`window.x`) | ❌ | ❌ |

```javascript
// var: function scope, hoisted с undefined
function example() {
  console.log(x); // undefined (не ReferenceError!)
  var x = 5;
  console.log(x); // 5
}

// let/const: block scope
{
  let a = 1;
  const b = 2;
}
// console.log(a); // ReferenceError: a is not defined

// const: нельзя reassign, но объект мутировать можно
const obj = { x: 1 };
obj.x = 2;      // ✅ мутация объекта — ок
// obj = {};    // ❌ TypeError: Assignment to constant variable
```

---

## Hoisting

При компиляции JS-движок поднимает **объявления** наверх области видимости. Не присваивания.

```javascript
// Function declaration: поднимается целиком (имя + тело)
sayHello(); // "Hello!" — работает до объявления
function sayHello() { console.log("Hello!"); }

// Function expression: только переменная (var → undefined)
// sayBye(); // TypeError: sayBye is not a function
var sayBye = function() { console.log("Bye"); };

// Arrow function — то же что expression
// greet(); // ReferenceError (let) или TypeError (var)
const greet = () => "hi";

// var declaration: поднимается как undefined
console.log(a); // undefined
var a = 5;
console.log(a); // 5

// Что реально происходит под капотом:
// var a;         ← поднимается сюда
// console.log(a); // undefined
// a = 5;
// console.log(a); // 5
```

### Порядок hoisting

```javascript
// 1. Function declarations (высший приоритет)
// 2. var declarations
// 3. let/const declarations (TDZ, не инициализируются)

// Пример: function vs var hoisting
var foo = "bar";
function foo() { return "function"; }
console.log(typeof foo); // "string" — var присваивание после function declaration
```

---

## Temporal Dead Zone (TDZ)

`let` и `const` поднимаются (hoisted) но **не инициализируются**. Обращение до объявления — `ReferenceError`.

```javascript
// TDZ: зона от начала блока до строки объявления
{
  // TDZ для x начинается здесь
  console.log(typeof x); // ReferenceError! (в отличие от var → undefined)
  let x = 5;             // TDZ заканчивается здесь
  console.log(x);        // 5
}

// typeof не защищает от TDZ (в отличие от необъявленных переменных)
// typeof undeclaredVar → "undefined" (безопасно)
// typeof letVar → ReferenceError если в TDZ

// TDZ с параметрами по умолчанию
function init(x = y, y = 2) {} // ReferenceError: y used before declaration
```

---

## Scope Chain

```javascript
const global = "global";

function outer() {
  const outerVar = "outer";

  function inner() {
    const innerVar = "inner";

    // inner видит: innerVar, outerVar, global
    console.log(innerVar);   // "inner"
    console.log(outerVar);   // "outer"   ← через scope chain
    console.log(global);     // "global"  ← через scope chain
  }

  inner();
  // outer НЕ видит innerVar
}

// Lexical scope: scope определяется местом НАПИСАНИЯ кода, не вызова
function makeCounter() {
  let count = 0;
  return function() { return ++count; }; // count из лексического scope
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3
// count не доступен снаружи
```

---

## Closures

Замыкание — функция + ссылка на лексическое окружение в котором она создана.

```javascript
// Базовый паттерн
function createAdder(x) {
  return function(y) {
    return x + y; // x захвачен из внешнего scope
  };
}

const add5 = createAdder(5);
const add10 = createAdder(10);
add5(3);  // 8
add10(3); // 13

// Closure для инкапсуляции (паттерн модуля)
function createCounter(initial = 0) {
  let count = initial; // приватная переменная

  return {
    increment: () => ++count,
    decrement: () => --count,
    reset: () => { count = initial; },
    value: () => count,
  };
}

const c = createCounter(10);
c.increment(); // 11
c.increment(); // 12
c.decrement(); // 11
c.value();     // 11
// count недоступен снаружи — настоящая приватность!

// Closure сохраняет ссылку, не значение
function makeFunctions() {
  const fns = [];
  for (let i = 0; i < 3; i++) {       // let — каждая итерация новый binding
    fns.push(() => i);
  }
  return fns;
}

const fns = makeFunctions();
fns[0](); // 0
fns[1](); // 1
fns[2](); // 2

// С var было бы иначе (см. следующий раздел)
```

---

## Классическая ловушка: var в цикле

```javascript
// ❌ Ловушка: var + setTimeout/async
const buttons = [];
for (var i = 0; i < 3; i++) {
  buttons.push(function() { return i; }); // все захватывают ОДНУ переменную i
}
buttons[0](); // 3 (не 0!)
buttons[1](); // 3 (не 1!)
buttons[2](); // 3

// Почему? var имеет function scope, одна i для всего цикла.
// К моменту вызова i = 3.

// ✅ Решение 1: let (новый binding на каждую итерацию)
const buttons2 = [];
for (let i = 0; i < 3; i++) {
  buttons2.push(() => i); // каждая функция захватывает свою i
}
buttons2[0](); // 0
buttons2[1](); // 1
buttons2[2](); // 2

// ✅ Решение 2: IIFE (создаёт новый scope для каждой итерации)
const buttons3 = [];
for (var i = 0; i < 3; i++) {
  buttons3.push((function(j) { return () => j; })(i)); // j — локальная копия
}
buttons3[0](); // 0

// ✅ Решение 3: bind (сохраняет значение)
const buttons4 = [];
function getValue(val) { return val; }
for (var i = 0; i < 3; i++) {
  buttons4.push(getValue.bind(null, i));
}
buttons4[0](); // 0
```

---

## Вопросы на интервью

1. **Что такое TDZ и чем отличается от hoisting var?**
   > `var` поднимается и инициализируется `undefined` — обращение до объявления безопасно. `let`/`const` поднимаются (binding создаётся), но остаются неинициализированными (TDZ). Обращение в TDZ → `ReferenceError`. TDZ существует с начала блока до строки объявления.

2. **Что выведет: `console.log(foo)` до `var foo = "bar"` и `let foo = "bar"`?**
   > `var` → `undefined` (hoisted). `let` → `ReferenceError` (TDZ).

3. **Что такое замыкание?**
   > Функция + ссылка на лексическое окружение в котором она была создана. Функция «помнит» переменные из внешнего scope даже когда внешняя функция завершила выполнение. Используется для: инкапсуляции, паттерна модуля, мемоизации, каррирования.

4. **Почему функции в цикле с var ведут себя не так как ожидается?**
   > `var` имеет function scope — одна переменная для всего цикла. Все функции захватывают ссылку на одну и ту же `i`. К моменту вызова цикл завершён, `i` = финальному значению. `let` создаёт новый binding для каждой итерации — каждая функция захватывает свою копию.

5. **Разница Function Declaration vs Function Expression с точки зрения hoisting?**
   > Declaration: поднимается целиком (имя + тело), вызывать можно до объявления. Expression: поднимается только переменная (`undefined` для `var`, TDZ для `let/const`), вызов до объявления → TypeError или ReferenceError.

---

## Примеры кода

```bash
node 03-javascript/02-variables-and-scope/examples/scope.js
node 03-javascript/02-variables-and-scope/examples/closures.js
```
