// ─────────────────────────────────────────────
// Встроенные методы строк — полный справочник
// node 03-javascript/08-builtins-reference/examples/strings.js
// ─────────────────────────────────────────────

const s = "Hello, World!";

console.log("=== Базовые ===");
console.log(s.length);                        // 13          — длина
console.log(s.at(0));                         // "H"         — символ по индексу
console.log(s.at(-1));                        // "!"         — отрицательный индекс
console.log(s.charAt(7));                     // "W"         — символ (старый вариант)
console.log(s.charCodeAt(0));                 // 72          — UTF-16 код символа
console.log("😀".codePointAt(0));            // 128512      — Unicode code point
console.log(String.fromCharCode(72));         // "H"         — символ из кода
console.log(String.fromCodePoint(128512));    // "😀"        — символ из code point

console.log("\n=== Поиск ===");
console.log(s.indexOf("o"));                  // 4           — первое вхождение
console.log(s.indexOf("o", 5));               // 8           — поиск с позиции 5
console.log(s.lastIndexOf("o"));              // 8           — последнее вхождение
console.log(s.includes("World"));             // true        — содержит подстроку
console.log(s.startsWith("Hello"));           // true        — начинается с
console.log(s.endsWith("!"));                 // true        — заканчивается на
console.log(s.search(/\w+/));                 // 0           — индекс совпадения RegExp

console.log("\n=== Извлечение ===");
console.log(s.slice(7, 12));                  // "World"     — подстрока [7, 12)
console.log(s.slice(-6, -1));                 // "World"     — отрицательные индексы
console.log(s.slice(7));                      // "World!"    — до конца
console.log(s.substring(7, 12));              // "World"     — подстрока (нет отрицательных)
console.log(s.split(", "));                   // ["Hello","World!"]
console.log(s.split(""));                     // массив символов
console.log("a.b.c".split(".", 2));           // ["a","b"]   — лимит

console.log("\n=== Замена ===");
console.log("aaa".replace("a", "x"));         // "xaa"       — заменить первое
console.log("aaa".replaceAll("a", "x"));      // "xxx"       — заменить все
console.log("hello".replace(/l+/, "L"));      // "heLo"      — RegExp
console.log("hello".replace(/l/g, "L"));      // "heLLo"     — глобальный RegExp

// replace с функцией
console.log("2024-01-15".replace(/(\d{4})-(\d{2})-(\d{2})/, (_, y, m, d) => `${d}/${m}/${y}`));
// "15/01/2024"

console.log("\n=== Поиск с RegExp ===");
const str = "price: 100, qty: 5, total: 500";
console.log(str.match(/\d+/));                 // ["100", index:7, ...]   — первое
console.log(str.match(/\d+/g));                // ["100","5","500"]       — все (g)

// matchAll — все совпадения с группами
const matches = [...str.matchAll(/(\w+): (\d+)/g)];
matches.forEach(m => console.log(`key="${m[1]}", val="${m[2]}"`));
// key="price", val="100"
// key="qty", val="5"
// key="total", val="500"

console.log("\n=== Регистр и пробелы ===");
console.log("hello".toUpperCase());           // "HELLO"
console.log("HELLO".toLowerCase());           // "hello"
console.log("  hello  ".trim());              // "hello"
console.log("  hello  ".trimStart());         // "hello  "
console.log("  hello  ".trimEnd());           // "  hello"

console.log("\n=== Дополнение и повтор ===");
console.log("5".padStart(5, "0"));            // "00005"     — дополнить слева
console.log("5".padEnd(5, "0"));              // "50000"     — дополнить справа
console.log("42".padStart(5));                // "   42"     — пробелами по умолчанию
console.log("ab".repeat(3));                  // "ababab"    — повторить

console.log("\n=== Сравнение и нормализация ===");
console.log("b".localeCompare("a"));          // 1           — b > a
console.log("a".localeCompare("b"));          // -1          — a < b
console.log("a".localeCompare("a"));          // 0           — равны
// Сортировка с учётом локали:
const words = ["ёлка", "апельсин", "банан", "арбуз"];
console.log(words.sort((a, b) => a.localeCompare(b, "ru")));
// ["апельсин", "арбуз", "банан", "ёлка"]

console.log("\n=== Строка как итерируемая ===");
console.log([..."hello"]);                    // ["h","e","l","l","o"]
console.log([..."😀👋"]);                    // ["😀","👋"]  — правильно обрабатывает emoji!
// vs
console.log("😀👋".split(""));              // ["😀","👋"] — в современных движках тоже ок
// Для старых движков spread безопаснее

console.log("\n=== Template literal ===");
const name = "World";
console.log(`Hello, ${name}!`);              // "Hello, World!"
console.log(`2 + 2 = ${2 + 2}`);            // "2 + 2 = 4"
// Tagged template
function tag(strings, ...values) {
  return strings.raw.join("") + values.join(",");
}
console.log(tag`hello ${1} world ${2}`);

console.log("\n=== Ловушки ===");
// slice vs substring при отрицательных аргументах
console.log("hello".slice(-3));              // "llo"  — slice: от конца
console.log("hello".substring(-3));          // "hello" — substring: -3 → 0

// split с RegExp
console.log("a1b2c3".split(/\d/));          // ["a","b","c",""]

// includes чувствителен к регистру
console.log("Hello".includes("hello"));     // false!
console.log("Hello".toLowerCase().includes("hello")); // true ✅
