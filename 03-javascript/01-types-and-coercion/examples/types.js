// ─────────────────────────────────────────────
// Типы JavaScript: запусти и смотри результаты
// node 03-javascript/01-types-and-coercion/examples/types.js
// ─────────────────────────────────────────────

// ─── typeof ──────────────────────────────────
console.log("=== typeof ===");
console.log(typeof "hello");      // "string"
console.log(typeof 42);           // "number"
console.log(typeof 42n);          // "bigint"
console.log(typeof true);         // "boolean"
console.log(typeof undefined);    // "undefined"
console.log(typeof null);         // "object"  ← баг!
console.log(typeof Symbol());     // "symbol"
console.log(typeof {});           // "object"
console.log(typeof []);           // "object"  ← массив — объект
console.log(typeof function(){}); // "function"
console.log(typeof class {});     // "function" ← класс — тоже function

// ─── Правильные проверки типов ───────────────
console.log("\n=== Правильные проверки ===");

const isNull = v => v === null;
const isArray = v => Array.isArray(v);
const isObject = v => typeof v === "object" && v !== null && !Array.isArray(v);
const isFunction = v => typeof v === "function";
const isNaN_ = v => Number.isNaN(v);   // НЕ глобальный isNaN

console.log("isNull(null):", isNull(null));         // true
console.log("isNull(0):", isNull(0));               // false
console.log("isArray([]):", isArray([]));           // true
console.log("isArray({}):", isArray({}));           // false
console.log("isObject({}):", isObject({}));         // true
console.log("isObject([]):", isObject([]));         // false
console.log("isObject(null):", isObject(null));     // false

// ─── Object.prototype.toString — точное определение типа ─
console.log("\n=== Object.prototype.toString (точное) ===");
const typeOf = v => Object.prototype.toString.call(v).slice(8, -1);
console.log(typeOf(null));          // "Null"
console.log(typeOf(undefined));     // "Undefined"
console.log(typeOf([]));            // "Array"
console.log(typeOf({}));            // "Object"
console.log(typeOf(new Date()));    // "Date"
console.log(typeOf(/regex/));       // "RegExp"
console.log(typeOf(42));            // "Number"

// ─── Primitive vs Reference ───────────────────
console.log("\n=== Primitive vs Reference ===");

// Примитивы: по значению
let a = 5;
let b = a;
b = 10;
console.log("a после b=10:", a); // 5

// Объекты: по ссылке
let obj1 = { x: 1 };
let obj2 = obj1;
obj2.x = 99;
console.log("obj1.x после obj2.x=99:", obj1.x); // 99

// Поверхностная копия
let obj3 = { ...obj1 };
obj3.x = 0;
console.log("obj1.x после изменения копии:", obj1.x); // 99

// Проблема поверхностной копии
let nested = { a: { b: 1 } };
let shallowCopy = { ...nested };
shallowCopy.a.b = 999;
console.log("nested.a.b после shallow copy изменения:", nested.a.b); // 999!

// Глубокая копия (structuredClone — Node 17+)
let deepCopy = structuredClone(nested);
deepCopy.a.b = 0;
console.log("nested.a.b после deep copy изменения:", nested.a.b); // 999 (не изменился)

// ─── NaN ─────────────────────────────────────
console.log("\n=== NaN ===");
console.log(NaN === NaN);              // false!
console.log(Number.isNaN(NaN));        // true ✅
console.log(Number.isNaN("NaN"));      // false ✅
console.log(isNaN("NaN"));             // true ← глобальный (небезопасный)
console.log(Object.is(NaN, NaN));      // true ✅
console.log(Object.is(0, -0));         // false
console.log(0 === -0);                 // true ← ловушка

// ─── Boxing ──────────────────────────────────
console.log("\n=== Boxing ===");
// Примитив получает методы через временный объект-обёртку
console.log("hello".toUpperCase()); // "HELLO" — autoboxing
console.log((42).toFixed(2));       // "42.00" — autoboxing

// Не используй конструкторы обёрток
const s1 = "hello";
const s2 = new String("hello");
console.log(typeof s1);             // "string"
console.log(typeof s2);             // "object" ← не то что ожидаешь
console.log(s1 === "hello");        // true
console.log(s2 === "hello");        // false ← ловушка
