# 01 · Типы и приведение типов

[← JavaScript](../README.md)

---

## Содержание

1. [Семь примитивов](#семь-примитивов)
2. [typeof — ловушки](#typeof--ловушки)
3. [Primitive vs Reference](#primitive-vs-reference)
4. [Явное и неявное приведение](#явное-и-неявное-приведение)
5. [`==` vs `===`](#-vs-)
6. [Falsy и Truthy](#falsy-и-truthy)
7. [Вопросы на интервью](#вопросы-на-интервью)

---

## Семь примитивов

```
string | number | bigint | boolean | undefined | null | symbol
```

Всё остальное — объект (включая функции, массивы, Date, RegExp).

```javascript
typeof "hello"     // "string"
typeof 42          // "number"
typeof 42n         // "bigint"
typeof true        // "boolean"
typeof undefined   // "undefined"
typeof null        // "object"  ← историческая ошибка (баг с 1995)
typeof Symbol()    // "symbol"
typeof {}          // "object"
typeof []          // "object"  ← массив — объект
typeof function(){} // "function" ← функция — объект, но typeof возвращает "function"
```

### Проверка null без typeof

```javascript
// typeof null === "object" — нельзя использовать для проверки на null
const isNull = value => value === null;         // ✅ строгое равенство
const isObject = value => typeof value === "object" && value !== null; // ✅
```

---

## Primitive vs Reference

Примитивы хранятся **по значению**, объекты — **по ссылке**.

```javascript
// Примитивы: копирование по значению
let a = 5;
let b = a;
b = 10;
console.log(a); // 5 — не изменился

// Объекты: копирование ссылки
let obj1 = { x: 1 };
let obj2 = obj1;
obj2.x = 99;
console.log(obj1.x); // 99 — изменился!

// Сравнение объектов: по ссылке
console.log({ x: 1 } === { x: 1 }); // false — разные ссылки
console.log([] === []);               // false

// Поверхностная копия: spread
const copy = { ...obj1 };   // новый объект
const arrCopy = [...arr];   // новый массив
```

### Boxing / Unboxing

Когда обращаешься к методу примитива — JS автоматически оборачивает его во временный объект-обёртку (boxing):

```javascript
"hello".toUpperCase();      // String {value: "hello"} → .toUpperCase() → примитив
(42).toFixed(2);            // Number {value: 42} → .toFixed() → примитив
true.toString();            // Boolean {value: true} → .toString() → примитив

// Объекты-обёртки (не использовать как конструктор):
const s = new String("hello"); // тип: object, не string
typeof s === "object";          // true!
s === "hello";                  // false!

// ✅ Используй примитивы, не конструкторы
```

---

## Явное и неявное приведение

### Явное (explicit)

```javascript
// → String
String(42)          // "42"
String(null)        // "null"
String(undefined)   // "undefined"
String(true)        // "true"
String([1, 2])      // "1,2"
String({})          // "[object Object]"
(42).toString()     // "42"
(255).toString(16)  // "ff" (hex)

// → Number
Number("42")        // 42
Number("3.14")      // 3.14
Number("")          // 0   ← ловушка
Number("  ")        // 0   ← ловушка
Number(null)        // 0   ← ловушка
Number(undefined)   // NaN
Number(true)        // 1
Number(false)       // 0
Number([1])         // 1   ← ловушка
Number([1,2])       // NaN
Number({})          // NaN
parseInt("42px")    // 42  (парсит до первого нечисла)
parseFloat("3.14abc") // 3.14

// → Boolean
Boolean(0)          // false
Boolean("")         // false
Boolean(null)       // false
Boolean(undefined)  // false
Boolean(NaN)        // false
Boolean({})         // true  ← пустой объект truthy!
Boolean([])         // true  ← пустой массив truthy!
```

### Неявное (implicit coercion)

```javascript
// Оператор + : если один операнд string → конкатенация
1 + "2"        // "12"  ← number → string
"3" + 4 + 5    // "345" (left-to-right)
3 + 4 + "5"    // "75"  (3+4=7, потом "7"+"5")

// Остальные арифметические: string → number
"5" - 2        // 3
"5" * 2        // 10
"5" / 2        // 2.5
"abc" - 1      // NaN

// Унарный +: приведение к числу
+"42"          // 42
+true          // 1
+false         // 0
+null          // 0
+undefined     // NaN
+""            // 0

// Шаблон: быстрое приведение
const num = +"42";         // 42
const bool = !!value;      // явный boolean
const str = "" + value;    // явный string (лучше String())
```

### Abstract Equality Algorithm (`==`)

Когда типы разные — JS пытается привести:

```javascript
// null == undefined: особый случай — true только между собой
null == undefined  // true
null == 0          // false
null == ""         // false
null == false      // false

// Если один Boolean → конвертировать в Number
false == 0         // true  (false → 0)
true == 1          // true  (true → 1)
true == "1"        // true  (true → 1, "1" → 1)

// Если один String, другой Number → String → Number
"1" == 1           // true  ("1" → 1)
"" == 0            // true  ("" → 0)
" " == 0           // true  (" " → 0)

// Если один Object → ToPrimitive
[] == ![]          // true  (!) ← знаменитый пример
// [] → "" → 0; ![] → false → 0; 0 == 0 → true

[null] == ""       // true
[undefined] == ""  // true
{} == "[object Object]" // true
```

---

## `==` vs `===`

```javascript
// === (Strict Equality): никакого приведения, разные типы → false
1 === "1"          // false
null === undefined // false
NaN === NaN        // false ← NaN не равен себе!

// Проверка NaN
Number.isNaN(NaN)  // true  ✅ (в отличие от глобального isNaN)
Number.isNaN("NaN") // false ✅
isNaN("NaN")       // true  ← глобальный isNaN приводит к числу сначала!

// Object.is: строже ===
Object.is(NaN, NaN)  // true  (единственный способ проверить NaN через сравнение)
Object.is(0, -0)     // false (=== не различает +0 и -0)
0 === -0             // true  ← ловушка
```

**Правило:** Всегда используй `===`. `==` только при явной необходимости (например, `value == null` проверяет и null и undefined одновременно).

---

## Falsy и Truthy

**Falsy** (8 значений):
```javascript
false, 0, -0, 0n, "", '', ``, null, undefined, NaN
```

**Всё остальное truthy**, включая:
```javascript
"0"          // truthy! (непустая строка)
"false"      // truthy!
[]           // truthy! (пустой массив)
{}           // truthy! (пустой объект)
function(){} // truthy!
-1           // truthy!
Infinity     // truthy!
```

```javascript
// Частые ловушки
if ([]) console.log("пустой массив truthy"); // выведет!
if ({}) console.log("пустой объект truthy"); // выведет!

// Проверка что массив непустой:
if (arr.length > 0) { }     // ✅ явно
if (arr.length) { }         // ✅ (0 falsy)

// Опциональные значения
const name = user.name || "Anonymous"; // если name falsy → "Anonymous"
// Проблема: name = "" → тоже "Anonymous"!

// Лучше: Nullish Coalescing
const name2 = user.name ?? "Anonymous"; // только null/undefined → "Anonymous"
```

---

## Вопросы на интервью

1. **`typeof null === "object"` — почему?**
   > Исторический баг JavaScript 1995 года. В первой реализации объекты помечались в памяти тегом `000`, и null (нулевой указатель) тоже имел этот тег. Исправить нельзя — сломает legacy код.

2. **Что выведет: `[] + {}` и `{} + []`?**
   > `[] + {}` → `"[object Object]"` ([] → "" , {} → "[object Object]"). `{} + []` в консоли → `0` (движок интерпретирует `{}` как пустой блок, `+[]` → `+""` → `0`). В выражении: `({}) + []` → `"[object Object]"`.

3. **Разница `Number.isNaN` vs глобальный `isNaN`?**
   > Глобальный `isNaN` сначала приводит аргумент к числу: `isNaN("foo")` → `isNaN(Number("foo"))` → `isNaN(NaN)` → `true`. `Number.isNaN` не приводит: `Number.isNaN("foo")` → `false`. Всегда используй `Number.isNaN`.

4. **Почему `[] == ![]` даёт `true`?**
   > `![]` → `false` (empty array truthy, отрицание → false). `[] == false` → `[] == 0` (false→0) → `"" == 0` ([]→"") → `0 == 0` → `true`. Показывает почему `==` опасен.

5. **Что такое Nullish Coalescing (`??`) и чем лучше `||`?**
   > `||` возвращает правый операнд при любом falsy значении (включая `""`, `0`, `false`). `??` — только при `null` или `undefined`. Используй `??` для опциональных значений где `""` или `0` — валидные значения.

---

## Примеры кода

```bash
node 03-javascript/01-types-and-coercion/examples/types.js
node 03-javascript/01-types-and-coercion/examples/coercion.js
```
