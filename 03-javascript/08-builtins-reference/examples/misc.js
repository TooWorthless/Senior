// ─────────────────────────────────────────────
// Map, Set, JSON, Date, Intl, Symbol, итераторы
// node 03-javascript/08-builtins-reference/examples/misc.js
// ─────────────────────────────────────────────

// ─── Map ──────────────────────────────────────
console.log("=== Map ===");

const map = new Map();

// set возвращает сам Map — можно цепочкой
map.set("name", "Alice").set("age", 30).set(42, "number key");

console.log(map.get("name"));            // "Alice"
console.log(map.get(42));               // "number key"
console.log(map.has("age"));            // true
console.log(map.has("missing"));        // false
console.log(map.size);                  // 3

map.delete("age");
console.log(map.size);                  // 2

// Итерация — порядок insertion order!
for (const [key, value] of map) {
  console.log(`  ${String(key)}: ${value}`);
}
console.log([...map.keys()]);           // ["name", 42]
console.log([...map.values()]);         // ["Alice", "number key"]
console.log([...map.entries()]);        // [["name","Alice"],[42,"number key"]]

// forEach: (value, key, map) — порядок value, key!
map.forEach((value, key) => {
  process.stdout.write(`${String(key)}=${value} `);
});
console.log();

// Создание из iterable
const map2 = new Map([["a", 1], ["b", 2], ["c", 3]]);
console.log(Object.fromEntries(map2));  // {a:1, b:2, c:3}

// Ключи — любой тип
const objKey = { id: 1 };
const fnKey = () => {};
const m3 = new Map([[objKey, "obj"], [fnKey, "fn"], [null, "null"]]);
console.log(m3.get(objKey));            // "obj"
console.log(m3.get(null));              // "null"

map.clear();
console.log(map.size);                  // 0

// ─── Set ──────────────────────────────────────
console.log("\n=== Set ===");

const set = new Set([1, 2, 2, 3, 3, 3]);
console.log(set.size);                  // 3  — уникальные
console.log([...set]);                  // [1, 2, 3]

set.add(4).add(4).add(5);              // add возвращает Set
console.log(set.size);                  // 5

console.log(set.has(3));               // true
console.log(set.has(99));              // false

set.delete(2);
console.log([...set]);                  // [1, 3, 4, 5]

// Итерация
for (const v of set) process.stdout.write(`${v} `);
console.log();

// Set из строки
const chars = new Set("mississippi");
console.log([...chars].sort().join(""));  // "imps"

// Операции над множествами
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);

const union = new Set([...a, ...b]);
console.log("union:", [...union]);        // [1,2,3,4,5,6]

const intersection = new Set([...a].filter(x => b.has(x)));
console.log("intersection:", [...intersection]); // [3,4]

const difference = new Set([...a].filter(x => !b.has(x)));
console.log("difference a-b:", [...difference]); // [1,2]

// ES2025: Set методы (проверяй версию Node)
// a.union(b), a.intersection(b), a.difference(b), a.symmetricDifference(b)
// a.isSubsetOf(b), a.isSupersetOf(b), a.isDisjointFrom(b)

// ─── JSON ──────────────────────────────────────
console.log("\n=== JSON ===");

const data = {
  id: 1,
  name: "Alice",
  active: true,
  scores: [10, 20, 30],
  meta: { created: "2024-01-01" },
};

// stringify — базовый
console.log(JSON.stringify(data));

// stringify с отступом
console.log(JSON.stringify(data, null, 2));

// stringify с whitelist ключей
console.log(JSON.stringify(data, ["id", "name"]));  // {"id":1,"name":"Alice"}

// stringify с replacer функцией
const withTypes = JSON.stringify(data, (key, value) => {
  if (typeof value === "number") return `NUM:${value}`;
  return value;
});
console.log(withTypes);

// Что НЕ сериализуется:
const tricky = {
  fn: () => "function",           // ← пропускается
  sym: Symbol("s"),               // ← пропускается
  undef: undefined,               // ← пропускается
  inf: Infinity,                  // ← null
  nan: NaN,                       // ← null
  date: new Date("2024-01-01"),   // ← строка ISO
  regexp: /abc/,                  // ← {}
};
console.log(JSON.stringify(tricky));
// {"inf":null,"nan":null,"date":"2024-01-01T00:00:00.000Z","regexp":{}}

// В массивах undefined/fn/Symbol → null
console.log(JSON.stringify([1, undefined, () => {}, Symbol(), 5]));
// [1,null,null,null,5]

// parse
const parsed = JSON.parse('{"a":1,"b":[2,3]}');
console.log(parsed.b[1]);               // 3

// parse с reviver
const withDates = JSON.parse('{"date":"2024-01-01","value":42}', (key, value) => {
  if (key === "date") return new Date(value);
  return value;
});
console.log(withDates.date instanceof Date); // true

// toJSON: кастомная сериализация
class Money {
  constructor(amount, currency) {
    this.amount = amount;
    this.currency = currency;
  }
  toJSON() {
    return `${this.amount} ${this.currency}`;
  }
}
console.log(JSON.stringify(new Money(100, "USD"))); // '"100 USD"'

// ─── Intl ──────────────────────────────────────
console.log("\n=== Intl ===");

// Числа
const numFmt = new Intl.NumberFormat("ru-RU");
console.log(numFmt.format(1234567.89));   // "1 234 567,89"

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
console.log(currency.format(1234.5));     // "$1,234.50"

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
console.log(percent.format(0.1234));      // "12.3%"

// Даты
const dateFmt = new Intl.DateTimeFormat("ru-RU", { dateStyle: "full", timeStyle: "short" });
console.log(dateFmt.format(new Date("2024-03-15")));
// "пятница, 15 марта 2024 г. в 00:00"

// Относительное время
const relFmt = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });
console.log(relFmt.format(-1, "day"));    // "вчера"
console.log(relFmt.format(2, "week"));    // "через 2 недели"
console.log(relFmt.format(-3, "month"));  // "3 месяца назад"

// Сортировка строк с учётом локали
const words = ["ёж", "апельсин", "Арбуз", "банан", "Ёлка"];
console.log(words.sort(new Intl.Collator("ru", { caseFirst: "upper" }).compare));

// Определение языка / разбор тега
// Intl.DisplayNames
const lang = new Intl.DisplayNames(["ru"], { type: "language" });
console.log(lang.of("en"));              // "английский"
console.log(lang.of("ja"));              // "японский"

// ─── Symbol ───────────────────────────────────
console.log("\n=== Symbol ===");

const sym1 = Symbol("tag");
const sym2 = Symbol("tag");
console.log(sym1 === sym2);             // false — каждый Symbol уникален

// Глобальный реестр Symbol.for
const global1 = Symbol.for("shared");
const global2 = Symbol.for("shared");
console.log(global1 === global2);       // true — один и тот же

console.log(Symbol.keyFor(global1));    // "shared"
console.log(Symbol.keyFor(sym1));       // undefined — не в реестре

// Symbol как ключ объекта
const KEY = Symbol("key");
const obj = { [KEY]: "private-ish", visible: "public" };
console.log(obj[KEY]);                  // "private-ish"
console.log(Object.keys(obj));          // ["visible"] — Symbol не виден!
console.log(JSON.stringify(obj));       // {"visible":"public"}

// Встроенные well-known Symbols
class Range {
  constructor(start, end) { this.start = start; this.end = end; }

  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;
    return {
      next() {
        return current <= end
          ? { value: current++, done: false }
          : { value: undefined, done: true };
      },
    };
  }

  get [Symbol.toStringTag]() { return "Range"; }
}

const range = new Range(1, 5);
console.log([...range]);                // [1,2,3,4,5]
console.log(Object.prototype.toString.call(range)); // "[object Range]"
for (const n of range) process.stdout.write(`${n} `);
console.log();

// ─── Date ──────────────────────────────────────
console.log("\n=== Date (кратко) ===");

const now = new Date();
const specific = new Date("2024-03-15T10:30:00.000Z");

console.log(Date.now());                // Unix ms
console.log(specific.getFullYear());    // 2024
console.log(specific.getMonth());       // 2  (0-indexed! март = 2)
console.log(specific.getDate());        // 15
console.log(specific.getDay());         // 5  (0=вс, 5=пт)
console.log(specific.getHours());       // зависит от локали
console.log(specific.getTime());        // Unix ms
console.log(specific.toISOString());    // "2024-03-15T10:30:00.000Z"

// Разница в днях
function daysBetween(a, b) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round(Math.abs(b - a) / MS_PER_DAY);
}
const d1 = new Date("2024-01-01");
const d2 = new Date("2024-03-15");
console.log(`Дней между датами: ${daysBetween(d1, d2)}`); // 74
