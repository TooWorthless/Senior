// ─────────────────────────────────────────────
// Функции: this, call/apply/bind, arrow
// node 03-javascript/03-functions/examples/functions.js
// ─────────────────────────────────────────────
"use strict";

// ─── Arrow vs Regular: this ──────────────────
console.log("=== this ===");

const regularObj = {
  name: "regularObj",
  method: function() {
    return this.name;
  },
  arrowMethod: () => {
    // this = undefined в strict mode (или global в sloppy)
    return typeof this;
  },
};

console.log(regularObj.method());      // "regularObj"
console.log(regularObj.arrowMethod()); // "undefined" (strict)

// Потеря контекста
const fn = regularObj.method;
try {
  fn(); // TypeError в strict (this = undefined)
} catch(e) {
  console.log("Потеря контекста:", e.message);
}

// ─── call / apply / bind ─────────────────────
console.log("\n=== call / apply / bind ===");

function describe(adjective, excl) {
  return `${this.name} is ${adjective}${excl}`;
}

const cat = { name: "Cat" };
const dog = { name: "Dog" };

console.log(describe.call(cat, "awesome", "!"));    // "Cat is awesome!"
console.log(describe.apply(dog, ["cute", "?"]));    // "Dog is cute?"

const boundCat = describe.bind(cat);
console.log(boundCat("fluffy", "."));               // "Cat is fluffy."

// Частичное применение через bind
const alwaysAwesome = describe.bind(cat, "always awesome");
console.log(alwaysAwesome("!!!"));                  // "Cat is always awesome!!!"

// bind + re-bind
const fn2 = function() { return this.x; };
const b1 = fn2.bind({ x: 1 });
const b2 = b1.bind({ x: 2 }); // игнорируется
console.log(b1()); // 1
console.log(b2()); // 1 — первый bind выигрывает

// ─── Реализация call / apply / bind ──────────
console.log("\n=== Ручная реализация call/apply/bind ===");

Function.prototype.myCall = function(context, ...args) {
  context = context ?? globalThis;
  const sym = Symbol("fn");
  context[sym] = this;
  const result = context[sym](...args);
  delete context[sym];
  return result;
};

Function.prototype.myApply = function(context, args = []) {
  context = context ?? globalThis;
  const sym = Symbol("fn");
  context[sym] = this;
  const result = context[sym](...args);
  delete context[sym];
  return result;
};

Function.prototype.myBind = function(context, ...preArgs) {
  const fn = this;
  return function(...args) {
    return fn.myCall(context, ...preArgs, ...args);
  };
};

const p = { name: "Peter" };
console.log(describe.myCall(p, "great", "!"));    // "Peter is great!"
console.log(describe.myApply(p, ["nice", "?"]));  // "Peter is nice?"

const boundP = describe.myBind(p, "awesome");
console.log(boundP("~"));                          // "Peter is awesome~"

// ─── Arguments vs rest ───────────────────────
console.log("\n=== arguments vs rest ===");

function oldWay() {
  // arguments — псевдомассив
  const args = Array.from(arguments); // нужно конвертировать
  return args.reduce((sum, n) => sum + n, 0);
}
console.log(oldWay(1, 2, 3)); // 6

function newWay(...nums) {
  // rest — настоящий массив
  let sum = 0;
  for (let i = 0; i < nums.length; i++) sum += nums[i];
  return sum;
}
console.log(newWay(1, 2, 3)); // 6

// arguments в arrow — нет!
const arrow = () => {
  try {
    // @ts-ignore
    return arguments; // ReferenceError или внешний arguments
  } catch(e) {
    return "no arguments in arrow";
  }
};
console.log(arrow()); // "no arguments in arrow"

// ─── Default parameters ───────────────────────
console.log("\n=== Default parameters ===");

function createTag(tag = "div", content = "", attrs = {}) {
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join("");
  return `<${tag}${attrStr}>${content}</${tag}>`;
}

console.log(createTag());                            // <div></div>
console.log(createTag("p", "Hello"));               // <p>Hello</p>
console.log(createTag("a", "Link", { href: "#" })); // <a href="#">Link</a>

// undefined триггерит default, null — нет
function greet(name = "World") { return `Hello, ${name}`; }
console.log(greet(undefined)); // "Hello, World" — default
console.log(greet(null));      // "Hello, null"  — не default!

// ─── new: как работает ────────────────────────
console.log("\n=== new ===");

function createPerson(name, age) {
  // При вызове через new:
  // 1. Создаётся новый пустой объект
  // 2. Его [[Prototype]] = createPerson.prototype
  // 3. this = новый объект
  // 4. Выполняется тело функции
  // 5. Если нет явного return object → возвращается this
  this.name = name;
  this.age = age;
}

createPerson.prototype.greet = function() {
  return `Hi, I'm ${this.name}`;
};

const alice = new createPerson("Alice", 30);
console.log(alice.name);     // "Alice"
console.log(alice.greet());  // "Hi, I'm Alice"
console.log(alice instanceof createPerson); // true

// Ручная реализация new
function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype); // шаг 1-2
  const result = Constructor.apply(obj, args);       // шаг 3-4
  return result instanceof Object ? result : obj;    // шаг 5
}

const bob = myNew(createPerson, "Bob", 25);
console.log(bob.name);     // "Bob"
console.log(bob.greet());  // "Hi, I'm Bob"
