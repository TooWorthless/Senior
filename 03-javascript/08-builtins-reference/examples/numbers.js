// ─────────────────────────────────────────────
// Встроенные методы Number и Math
// node 03-javascript/08-builtins-reference/examples/numbers.js
// ─────────────────────────────────────────────

// ─── Number методы ────────────────────────────
console.log("=== Number: статические методы ===");

// isNaN — без приведения к числу!
console.log(Number.isNaN(NaN));          // true
console.log(Number.isNaN("NaN"));        // false  ← в отличие от глобального isNaN
console.log(isNaN("NaN"));               // true   ← глобальный isNaN приводит к числу

// isFinite — без приведения
console.log(Number.isFinite(42));        // true
console.log(Number.isFinite(Infinity));  // false
console.log(Number.isFinite("42"));      // false  ← строка не число

// isInteger
console.log(Number.isInteger(1));        // true
console.log(Number.isInteger(1.0));      // true   ← 1.0 === 1 в JS
console.log(Number.isInteger(1.1));      // false

// isSafeInteger: -(2^53-1) ≤ n ≤ (2^53-1)
console.log(Number.isSafeInteger(Number.MAX_SAFE_INTEGER));     // true
console.log(Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 1)); // false

// parseInt / parseFloat (те же что глобальные, но без неявного приведения)
console.log(Number.parseInt("42px"));    // 42
console.log(Number.parseInt("px42"));    // NaN  — начинается с нечисла
console.log(Number.parseInt("0xff"));    // 255
console.log(Number.parseInt("10", 2));   // 2    — двоичное
console.log(Number.parseInt("ff", 16));  // 255  — hex
console.log(Number.parseFloat("3.14abc")); // 3.14

console.log("\n=== Number: константы ===");
console.log(Number.EPSILON);             // 2.220446049250313e-16
console.log(Number.MAX_SAFE_INTEGER);    // 9007199254740991  (2^53-1)
console.log(Number.MIN_SAFE_INTEGER);    // -9007199254740991
console.log(Number.MAX_VALUE);           // 1.7976931348623157e+308
console.log(Number.MIN_VALUE);           // 5e-324  — наименьшее положительное
console.log(Number.POSITIVE_INFINITY);   // Infinity
console.log(Number.NEGATIVE_INFINITY);   // -Infinity
console.log(Number.NaN);                 // NaN

console.log("\n=== Number: методы экземпляра ===");
console.log((3.14159).toFixed(2));       // "3.14"   — строка с n знаками
console.log((3.14159).toFixed(0));       // "3"
console.log((0.1 + 0.2).toFixed(1));     // "0.3"    — полезно для вывода
console.log((123.456).toPrecision(5));   // "123.46" — n значимых цифр
console.log((0.0001).toPrecision(2));    // "0.00010"
console.log((255).toString(16));         // "ff"     — hex
console.log((255).toString(2));          // "11111111" — binary
console.log((255).toString(8));          // "377"    — octal
console.log((1234567.89).toLocaleString("ru-RU")); // "1 234 567,89"
console.log((0.25).toLocaleString("en-US", { style: "percent" })); // "25%"

// Ловушка: floating point
console.log(0.1 + 0.2);                 // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);         // false!
// Сравнение float: используй epsilon
const floatEqual = (a, b, eps = Number.EPSILON) => Math.abs(a - b) < eps;
console.log(floatEqual(0.1 + 0.2, 0.3)); // true ✅

// ─── Math методы ─────────────────────────────
console.log("\n=== Math: округление ===");
console.log(Math.floor(3.9));            // 3    — вниз
console.log(Math.floor(-3.1));           // -4   ← ловушка: floor к меньшему
console.log(Math.ceil(3.1));             // 4    — вверх
console.log(Math.ceil(-3.9));            // -3
console.log(Math.round(3.5));            // 4    — по правилам
console.log(Math.round(3.4));            // 3
console.log(Math.round(-3.5));           // -3   ← "banker's rounding" не применяется
console.log(Math.trunc(3.9));            // 3    — отбросить дробь
console.log(Math.trunc(-3.9));           // -3   ← в отличие от floor
console.log(Math.sign(-5));              // -1
console.log(Math.sign(0));              // 0
console.log(Math.sign(5));              // 1

console.log("\n=== Math: степени и корни ===");
console.log(Math.pow(2, 10));            // 1024 — то же что 2 ** 10
console.log(2 ** 10);                    // 1024 — предпочтительно
console.log(Math.sqrt(144));             // 12
console.log(Math.cbrt(27));              // 3
console.log(Math.hypot(3, 4));           // 5    — √(9+16)
console.log(Math.hypot(1, 1, 1));        // 1.732... — 3D расстояние

console.log("\n=== Math: abs, max, min ===");
console.log(Math.abs(-42));              // 42
console.log(Math.max(1, 5, 3, 9, 2));   // 9
console.log(Math.min(1, 5, 3, 9, 2));   // 1
console.log(Math.max());                 // -Infinity  — без аргументов!
console.log(Math.min());                 // Infinity   — без аргументов!
// С массивом:
const arr = [1, 5, 3, 9, 2];
console.log(Math.max(...arr));           // 9
// Для больших массивов spread может вызвать stack overflow!
// Лучше: arr.reduce((a,b) => a > b ? a : b)

console.log("\n=== Math: логарифмы и exp ===");
console.log(Math.log(Math.E));           // 1      — натуральный логарифм
console.log(Math.log(1));                // 0
console.log(Math.log(0));                // -Infinity
console.log(Math.log2(1024));            // 10     — log base 2
console.log(Math.log10(1000));           // 3      — log base 10
console.log(Math.exp(1));                // 2.718... — e^1
console.log(Math.expm1(0));              // 0      — e^x - 1 (точнее для малых x)
console.log(Math.log1p(0));              // 0      — ln(1+x) (точнее для малых x)

console.log("\n=== Math: случайные числа ===");
// Math.random(): [0, 1)
console.log(Math.random());

// Целое в диапазоне [min, max]
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
console.log("random [1..6]:", randomInt(1, 6));
console.log("random [0..100]:", randomInt(0, 100));

// Перемешать массив (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
console.log(shuffle([1,2,3,4,5]));

console.log("\n=== Math: тригонометрия ===");
console.log(Math.PI);                    // 3.14159...
console.log(Math.sin(Math.PI / 2));      // 1
console.log(Math.cos(0));                // 1
console.log(Math.tan(Math.PI / 4));      // 1 (≈0.9999...)
console.log(Math.atan2(1, 1));           // 0.785... (π/4)
console.log(Math.atan2(0, -1));          // 3.14159... (π) — угол к отрицательной X

// Степень двойки через Math.log2
function isPowerOfTwo(n) {
  return n > 0 && Number.isInteger(Math.log2(n));
}
console.log(isPowerOfTwo(16));           // true
console.log(isPowerOfTwo(18));           // false

// Клэмп (ограничение диапазона)
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
console.log(clamp(150, 0, 100));         // 100
console.log(clamp(-50, 0, 100));         // 0
console.log(clamp(42, 0, 100));          // 42
