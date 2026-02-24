// ─────────────────────────────────────────────
// Область видимости, hoisting, TDZ
// node 03-javascript/02-variables-and-scope/examples/scope.js
// ─────────────────────────────────────────────

// ─── Hoisting: function declaration ──────────
console.log("=== Hoisting ===");

// Вызов до объявления — работает
console.log(add(2, 3)); // 5
function add(a, b) { return a + b; }

// Function expression: только переменная hoisted
try {
  // @ts-ignore
  console.log(multiply(2, 3)); // TypeError
} catch(e) {
  console.log("multiply до объявления:", e.message);
}
var multiply = (a, b) => a * b;

// var hoisting
console.log("\n--- var hoisting ---");
console.log(x);       // undefined (не ReferenceError!)
var x = 10;
console.log(x);       // 10

// ─── TDZ ─────────────────────────────────────
console.log("\n=== Temporal Dead Zone ===");

try {
  console.log(y);     // ReferenceError
  let y = 5;
} catch(e) {
  console.log("TDZ let:", e.message);
}

// typeof с необъявленной переменной — безопасно
console.log("typeof undeclared:", typeof undeclaredVariable); // "undefined"

// typeof в TDZ — НЕ безопасно
try {
  // @ts-ignore
  console.log(typeof tdz); // ReferenceError
  let tdz = 1;
} catch(e) {
  console.log("typeof в TDZ:", e.message);
}

// ─── Block scope ─────────────────────────────
console.log("\n=== Block scope ===");
{
  var blockVar = "var виден снаружи";
  let blockLet = "let не виден снаружи";
  const blockConst = "const не виден снаружи";
}

console.log(blockVar);      // "var виден снаружи"
try { console.log(blockLet); } catch(e) { console.log("blockLet:", e.message); }
try { console.log(blockConst); } catch(e) { console.log("blockConst:", e.message); }

// ─── Function scope vs Block scope ────────────
console.log("\n=== Function scope ===");
function funcScope() {
  var local = "функция";
  if (true) {
    var innerVar = "var — function scope"; // виден во всей функции
    let innerLet = "let — block scope";    // виден только в if-блоке
  }
  console.log(innerVar);  // "var — function scope"
  try { console.log(innerLet); } catch(e) { console.log("innerLet:", e.message); }
}
funcScope();

// ─── Scope chain ─────────────────────────────
console.log("\n=== Scope chain ===");
const GLOBAL = "GLOBAL";

function level1() {
  const L1 = "L1";
  function level2() {
    const L2 = "L2";
    function level3() {
      // Видит: L3, L2 (через chain), L1 (через chain), GLOBAL (через chain)
      const L3 = "L3";
      console.log(L3, L2, L1, GLOBAL);
    }
    level3();
  }
  level2();
}
level1();

// ─── Shadowing ────────────────────────────────
console.log("\n=== Shadowing ===");
const value = "outer";
{
  const value = "inner"; // shadows outer value
  console.log(value);    // "inner"
}
console.log(value);      // "outer"

function shadowExample() {
  const name = "function scope"; // shadows outer 'name' if existed
  {
    let name = "block scope";    // shadows function scope
    console.log(name);           // "block scope"
  }
  console.log(name);             // "function scope"
}
shadowExample();

// ─── Var в цикле — ловушка ────────────────────
console.log("\n=== var в цикле (ловушка) ===");
const funcsVar = [];
for (var i = 0; i < 3; i++) {
  funcsVar.push(() => i); // все захватывают одну i
}
console.log("var:", funcsVar.map(f => f())); // [3, 3, 3]

const funcsLet = [];
for (let j = 0; j < 3; j++) {
  funcsLet.push(() => j); // каждая захватывает свою j
}
console.log("let:", funcsLet.map(f => f())); // [0, 1, 2]
