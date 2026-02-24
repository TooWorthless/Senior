// ─────────────────────────────────────────────
// Встроенные методы объектов — полный справочник
// node 03-javascript/08-builtins-reference/examples/objects.js
// ─────────────────────────────────────────────

// ─── Ключи, значения, записи ─────────────────
console.log("=== Ключи / Значения / Записи ===");

const obj = { a: 1, b: 2, c: 3 };

console.log(Object.keys(obj));              // ["a","b","c"]  — перечислимые string-ключи
console.log(Object.values(obj));            // [1,2,3]
console.log(Object.entries(obj));           // [["a",1],["b",2],["c",3]]

// fromEntries — обратная операция
console.log(Object.fromEntries([["x",10],["y",20]]));  // {x:10, y:20}
console.log(Object.fromEntries(new Map([["a",1],["b",2]]))); // {a:1, b:2}

// Трансформация объекта через entries (обходим отсутствие Object.map)
const doubled = Object.fromEntries(
  Object.entries(obj).map(([k,v]) => [k, v*2])
);
console.log(doubled);                       // {a:2, b:4, c:6}

// ─── Копирование и слияние ────────────────────
console.log("\n=== Копирование / Слияние ===");

// Object.assign: мутирует target, последний источник перекрывает предыдущие
const target = { a: 1 };
const result = Object.assign(target, { b: 2 }, { b: 99, c: 3 });
console.log(result);                        // {a:1, b:99, c:3}
console.log(target === result);             // true — target мутирован!

// Shallow copy через assign
const copy = Object.assign({}, obj);
copy.a = 999;
console.log(obj.a);                         // 1 — оригинал не изменён

// Spread — предпочтительнее для копирования
const spread = { ...obj, d: 4 };
console.log(spread);                        // {a:1, b:2, c:3, d:4}

// Оба — поверхностные копии!
const nested = { inner: { x: 1 } };
const shallowCopy = { ...nested };
shallowCopy.inner.x = 999;
console.log(nested.inner.x);               // 999 — изменился!

// ─── Создание с прототипом ────────────────────
console.log("\n=== Object.create ===");

const proto = {
  greet() { return `Hello, I'm ${this.name}`; },
  toString() { return `[${this.constructor?.name}: ${this.name}]`; },
};

const user = Object.create(proto);
user.name = "Alice";
console.log(user.greet());                  // "Hello, I'm Alice"
console.log(Object.getPrototypeOf(user) === proto); // true

// Object.create(null) — без прототипа
const dict = Object.create(null);
dict.toString = "можно без конфликта";      // не конфликтует с Object.prototype
console.log(Object.getPrototypeOf(dict));   // null

// ─── Заморозка / Запечатывание ────────────────
console.log("\n=== freeze / seal ===");

const frozen = Object.freeze({ x: 1, y: 2 });
frozen.x = 99;              // silently fails (или TypeError в strict mode)
// @ts-ignore
frozen.z = 3;               // silently fails
console.log(frozen);        // { x:1, y:2 } — не изменился
console.log(Object.isFrozen(frozen)); // true

// Важно: freeze — SHALLOW!
const deepObj = Object.freeze({ inner: { x: 1 } });
deepObj.inner.x = 999;      // работает! inner не заморожен
console.log(deepObj.inner.x); // 999

const sealed = Object.seal({ x: 1, y: 2 });
sealed.x = 99;              // ✅ изменение существующего свойства — ok
// @ts-ignore
sealed.z = 3;               // ❌ добавление нового — silently fails
delete sealed.x;            // ❌ удаление — silently fails
console.log(sealed);        // { x:99, y:2 }
console.log(Object.isSealed(sealed)); // true

// ─── Property Descriptors ─────────────────────
console.log("\n=== defineProperty / getOwnPropertyDescriptor ===");

const config = {};
Object.defineProperty(config, "VERSION", {
  value: "2.0.0",
  writable: false,       // нельзя перезаписать
  enumerable: true,      // попадает в Object.keys
  configurable: false,   // нельзя удалить / переопределить descriptor
});

Object.defineProperty(config, "_internal", {
  value: "secret",
  writable: false,
  enumerable: false,     // НЕ попадает в Object.keys, for...in, JSON.stringify
  configurable: false,
});

console.log(config.VERSION);              // "2.0.0"
console.log(config._internal);            // "secret"
console.log(Object.keys(config));         // ["VERSION"]  — _internal скрыт
console.log(JSON.stringify(config));      // '{"VERSION":"2.0.0"}'

// Getter/setter через defineProperty
const temperature = { _c: 0 };
Object.defineProperty(temperature, "fahrenheit", {
  get() { return this._c * 9/5 + 32; },
  set(f) { this._c = (f - 32) * 5/9; },
  enumerable: true,
  configurable: true,
});

temperature.fahrenheit = 212;
console.log(temperature._c);              // 100
console.log(temperature.fahrenheit);      // 212

// Получить дескриптор
const desc = Object.getOwnPropertyDescriptor(config, "VERSION");
console.log(desc);
// { value:"2.0.0", writable:false, enumerable:true, configurable:false }

// Все дескрипторы
const allDescs = Object.getOwnPropertyDescriptors(config);
console.log(Object.keys(allDescs));       // ["VERSION","_internal"]

// ─── Проверки свойств ─────────────────────────
console.log("\n=== Проверки свойств ===");

const o = { a: 1 };
const child = Object.create(o);
child.b = 2;

// hasOwn (ES2022) — предпочтительно
console.log(Object.hasOwn(child, "b"));   // true  — собственное
console.log(Object.hasOwn(child, "a"));   // false — в прототипе

// hasOwnProperty — старый вариант (опасен если объект без прототипа)
console.log(child.hasOwnProperty("b"));   // true
// Object.create(null).hasOwnProperty("x") // TypeError!

// in — проверяет всю цепочку прототипов
console.log("a" in child);                // true  — в прототипе
console.log("b" in child);                // true  — собственное
console.log("c" in child);                // false

// ─── Прочее ───────────────────────────────────
console.log("\n=== Прочее ===");

// Object.is — строже ===
console.log(Object.is(NaN, NaN));         // true  (=== → false!)
console.log(Object.is(0, -0));            // false (=== → true!)
console.log(Object.is(1, 1));             // true

// getOwnPropertyNames — все свои ключи (включая non-enumerable)
const o2 = Object.defineProperty({a:1}, "b", {value:2, enumerable:false});
console.log(Object.keys(o2));                          // ["a"]
console.log(Object.getOwnPropertyNames(o2));           // ["a","b"]

// getOwnPropertySymbols
const sym = Symbol("tag");
const o3 = { [sym]: "value", a: 1 };
console.log(Object.keys(o3));                          // ["a"]  — Symbol не виден
console.log(Object.getOwnPropertySymbols(o3));         // [Symbol(tag)]

// Reflect.ownKeys = собственные строки + Symbol
console.log(Reflect.ownKeys(o3));                      // ["a", Symbol(tag)]

// getPrototypeOf / setPrototypeOf
console.log(Object.getPrototypeOf([]));                // Array.prototype
console.log(Object.getPrototypeOf(Object.create(null))); // null
