// ─────────────────────────────────────────────
// Объекты: методы, деструктуризация, Map, Set
// node 03-javascript/04-objects-and-prototypes/examples/objects.js
// ─────────────────────────────────────────────

// ─── Object методы ────────────────────────────
console.log("=== Object методы ===");

const user = { name: "Alice", age: 30, role: "admin" };

console.log(Object.keys(user));    // ["name", "age", "role"]
console.log(Object.values(user));  // ["Alice", 30, "admin"]
console.log(Object.entries(user)); // [["name","Alice"],["age",30],["role","admin"]]

// Трансформация объекта за один проход через entries
const doubled = Object.fromEntries(
  Object.entries({ a: 1, b: 2, c: 3 }).map(([k, v]) => [k, v * 2])
);
console.log("doubled:", doubled); // { a: 2, b: 4, c: 6 }

// Слияние
const defaults = { theme: "light", lang: "en", notifications: true };
const userPrefs = { theme: "dark", lang: "ru" };
const config = { ...defaults, ...userPrefs }; // правый перекрывает
console.log("config:", config);
// { theme: "dark", lang: "ru", notifications: true }

// Object.assign с side effects
const target = { a: 1 };
const source1 = { b: 2 };
const source2 = { c: 3, b: 99 }; // b перекрывает
const result = Object.assign(target, source1, source2);
console.log("assign result:", result);
console.log("target изменён:", target); // target мутирован!
// { a: 1, b: 99, c: 3 }

// ─── Property descriptors ─────────────────────
console.log("\n=== Property descriptors ===");

const config2 = {};
Object.defineProperties(config2, {
  VERSION: {
    value: "1.0.0",
    writable: false,
    enumerable: true,
    configurable: false,
  },
  _secret: {
    value: "s3cr3t",
    writable: false,
    enumerable: false, // не будет в Object.keys / for...in
    configurable: false,
  },
});

console.log(config2.VERSION);          // "1.0.0"
console.log(config2._secret);          // "s3cr3t"
console.log(Object.keys(config2));     // ["VERSION"] — _secret скрыт
console.log(JSON.stringify(config2));  // {"VERSION":"1.0.0"}

// Descriptor
const desc = Object.getOwnPropertyDescriptor(config2, "VERSION");
console.log("descriptor:", desc);
// { value: "1.0.0", writable: false, enumerable: true, configurable: false }

// ─── Деструктуризация ─────────────────────────
console.log("\n=== Деструктуризация ===");

// Переименование + default
const { name: userName = "anon", city = "Moscow", age: userAge } = user;
console.log(userName, city, userAge); // "Alice" "Moscow" 30

// Вложенная деструктуризация
const data = {
  user: {
    profile: {
      firstName: "John",
      lastName: "Doe",
    },
    settings: {
      theme: "dark",
    },
  },
};

const {
  user: {
    profile: { firstName, lastName },
    settings: { theme = "light" },
  },
} = data;
console.log(firstName, lastName, theme); // "John" "Doe" "dark"

// В параметрах функции
function createUser({ name = "Guest", role = "user", age = 18 } = {}) {
  return { name, role, age };
}
console.log(createUser({ name: "Bob", role: "admin" }));
console.log(createUser()); // без аргументов — дефолт {}

// Swap
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b); // 2 1

// ─── Map ──────────────────────────────────────
console.log("\n=== Map ===");

const map = new Map([
  ["name", "Alice"],
  ["age", 30],
  [42, "number key"],
  [{ id: 1 }, "object key"],
]);

console.log("size:", map.size);             // 4
console.log("name:", map.get("name"));      // "Alice"
console.log("has age:", map.has("age"));    // true

// Итерация (порядок — insertion order)
for (const [key, value] of map) {
  if (typeof key === "string") {
    console.log(`  ${key}: ${value}`);
  }
}

// Группировка за один проход (O(n))
const people = [
  { name: "Alice", dept: "Engineering" },
  { name: "Bob", dept: "Marketing" },
  { name: "Carol", dept: "Engineering" },
  { name: "Dave", dept: "Marketing" },
  { name: "Eve", dept: "Engineering" },
];

function groupBy(arr, keyFn) {
  const groups = new Map();
  for (let i = 0; i < arr.length; i++) {
    const key = keyFn(arr[i]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(arr[i]);
  }
  return groups;
}

const byDept = groupBy(people, p => p.dept);
byDept.forEach((members, dept) => {
  console.log(`${dept}: ${members.map(m => m.name).join(", ")}`);
});

// ─── Set ──────────────────────────────────────
console.log("\n=== Set ===");

const set = new Set([1, 2, 3, 2, 1, 3]);
console.log("size:", set.size); // 3 (уникальные)
console.log([...set]);          // [1, 2, 3]

// Удаление дубликатов (O(n))
function dedupe(arr) {
  const seen = new Set();
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (!seen.has(arr[i])) {
      seen.add(arr[i]);
      result.push(arr[i]);
    }
  }
  return result;
}

console.log(dedupe([1, 2, 2, 3, 1, 4, 3])); // [1, 2, 3, 4]

// Операции теории множеств
function setUnion(a, b) {
  const result = new Set(a);
  for (const v of b) result.add(v);
  return result;
}

function setIntersection(a, b) {
  const result = new Set();
  for (const v of a) {
    if (b.has(v)) result.add(v);
  }
  return result;
}

function setDifference(a, b) {
  const result = new Set();
  for (const v of a) {
    if (!b.has(v)) result.add(v);
  }
  return result;
}

const s1 = new Set([1, 2, 3, 4]);
const s2 = new Set([3, 4, 5, 6]);

console.log("union:", [...setUnion(s1, s2)]);        // [1,2,3,4,5,6]
console.log("intersection:", [...setIntersection(s1, s2)]); // [3,4]
console.log("difference:", [...setDifference(s1, s2)]);     // [1,2]

// ─── WeakMap / WeakRef ────────────────────────
console.log("\n=== WeakMap ===");

// WeakMap: ключи — только объекты, не мешает GC
// Применение: приватные данные для объектов без утечек памяти

const privateData = new WeakMap();

class SecureUser {
  constructor(name, password) {
    privateData.set(this, { password }); // привязано к экземпляру
    this.name = name;
  }

  authenticate(pwd) {
    return privateData.get(this).password === pwd;
  }
}

const u = new SecureUser("Alice", "secret123");
console.log(u.authenticate("secret123")); // true
console.log(u.authenticate("wrong"));     // false
console.log(privateData.get(u));          // { password: "secret123" }
// Когда u будет GC — данные автоматически удалятся из WeakMap
