// ─────────────────────────────────────────────
// Приведение типов: явное и неявное
// node 03-javascript/01-types-and-coercion/examples/coercion.js
// ─────────────────────────────────────────────

// ─── Явное приведение → String ───────────────
console.log("=== → String ===");
console.log(String(42));          // "42"
console.log(String(-0));          // "0"  ← ловушка! -0 превращается в "0"
console.log(String(null));        // "null"
console.log(String(undefined));   // "undefined"
console.log(String(true));        // "true"
console.log(String([1, 2, 3]));   // "1,2,3"
console.log(String({}));          // "[object Object]"
console.log(String({ toString() { return "custom"; } })); // "custom"

// ─── Явное приведение → Number ────────────────
console.log("\n=== → Number ===");
console.log(Number("42"));        // 42
console.log(Number("  42  "));   // 42 (пробелы обрезаются)
console.log(Number(""));          // 0  ← ловушка
console.log(Number("  "));        // 0  ← ловушка
console.log(Number(null));        // 0  ← ловушка
console.log(Number(undefined));   // NaN
console.log(Number(true));        // 1
console.log(Number(false));       // 0
console.log(Number([1]));         // 1  ← ловушка
console.log(Number([1, 2]));      // NaN
console.log(Number({}));          // NaN
console.log(Number("0x1F"));      // 31 (hex)
console.log(Number("0b101"));     // 5  (binary)

// Разница parseInt / parseFloat
console.log("\n--- parseInt vs parseFloat ---");
console.log(parseInt("42px"));      // 42  (парсит до нечисла)
console.log(parseInt("px42"));      // NaN (начинается с нечисла)
console.log(parseFloat("3.14abc")); // 3.14
console.log(parseInt("10", 2));     // 2   (binary)
console.log(parseInt("ff", 16));    // 255 (hex)
// ОБЯЗАТЕЛЬНО передавай radix! parseInt("08") в старых движках = 0

// ─── Неявное приведение ────────────────────────
console.log("\n=== Неявное: + оператор ===");
console.log(1 + "2");         // "12"  (number → string)
console.log("1" + 2);         // "12"
console.log(3 + 4 + "5");     // "75"  (3+4=7, "7"+"5"="75")
console.log("3" + 4 + 5);     // "345"
console.log(1 + null);        // 1     (null → 0)
console.log(1 + undefined);   // NaN   (undefined → NaN)
console.log(1 + true);        // 2     (true → 1)
console.log(1 + false);       // 1     (false → 0)
console.log("" + null);       // "null"

console.log("\n=== Неявное: -, *, / операторы ===");
console.log("5" - 2);         // 3    (string → number)
console.log("5" * "2");       // 10
console.log("5" / "2");       // 2.5
console.log(null - 1);        // -1   (null → 0)
console.log(true + true);     // 2    (true → 1)
console.log([] - 1);          // -1   ([] → "" → 0)
console.log([3] - 1);         // 2    ([3] → "3" → 3)

// ─── Abstract Equality ────────────────────────
console.log("\n=== == (Abstract Equality) ===");
console.log(null == undefined);  // true  ← только они равны друг другу
console.log(null == 0);          // false
console.log(null == "");         // false
console.log(null == false);      // false

console.log(false == 0);         // true  (false → 0)
console.log(true == 1);          // true
console.log(true == "1");        // true  (true→1, "1"→1)
console.log(true == 2);          // false (true→1 ≠ 2)

console.log("" == 0);            // true  ("" → 0)
console.log(" " == 0);           // true  (" " → 0)
console.log("0" == false);       // true  (false→0, "0"→0)

// Самый известный пример
console.log([] == ![]);          // true  ← !!! 
// [] == false → [] == 0 → "" == 0 → 0 == 0 → true
console.log([] == false);        // true
console.log([] == 0);            // true
console.log([] == "");           // true
console.log([null] == "");       // true  ([null].toString() = "")
console.log([undefined] == "");  // true

// ─── Strict Equality ──────────────────────────
console.log("\n=== === (Strict Equality) ===");
console.log(1 === 1);           // true
console.log(1 === "1");         // false (разные типы)
console.log(null === null);     // true
console.log(undefined === undefined); // true
console.log(null === undefined);// false
console.log(NaN === NaN);       // false!

// ─── Falsy / Truthy ────────────────────────────
console.log("\n=== Falsy values ===");
const falsy = [false, 0, -0, 0n, "", '', ``, null, undefined, NaN];
falsy.forEach(v => {
  console.log(`!!${JSON.stringify(v) ?? String(v)} → ${!!v}`);
});

console.log("\n=== Truthy ловушки ===");
const traps = ["0", "false", [], {}, -1, Infinity, function(){}];
traps.forEach(v => {
  console.log(`!!${JSON.stringify(v)} → ${!!v}`);
});

// ─── || vs ?? ─────────────────────────────────
console.log("\n=== || vs ?? ===");
const a = null;
const b = "";
const c = 0;
const d = false;

console.log("|| null:", a || "default");      // "default"
console.log("|| '':", b || "default");        // "default" ← строка игнорируется!
console.log("|| 0:", c || "default");         // "default" ← 0 игнорируется!
console.log("|| false:", d || "default");     // "default"

console.log("?? null:", a ?? "default");      // "default"
console.log("?? '':", b ?? "default");        // ""  ← пустая строка — валидное значение
console.log("?? 0:", c ?? "default");         // 0   ← 0 — валидное значение
console.log("?? false:", d ?? "default");     // false

// ─── Практика: безопасные проверки ────────────
console.log("\n=== Безопасные паттерны ===");

// Проверка null/undefined
const isNullish = v => v == null;             // == захватывает оба
console.log("isNullish(null):", isNullish(null));         // true
console.log("isNullish(undefined):", isNullish(undefined)); // true
console.log("isNullish(0):", isNullish(0));               // false
console.log("isNullish(''):", isNullish(""));              // false

// Безопасный доступ к числу
const toNumber = v => {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};
console.log("toNumber('42'):", toNumber("42"));   // 42
console.log("toNumber('abc'):", toNumber("abc")); // null
console.log("toNumber(''):", toNumber(""));       // 0
