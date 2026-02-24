# 04 · Объекты и прототипы

[← JavaScript](../README.md)

---

## Содержание

1. [Создание объектов](#создание-объектов)
2. [Prototype chain](#prototype-chain)
3. [class — синтаксический сахар](#class--синтаксический-сахар)
4. [Object методы](#object-методы)
5. [Деструктуризация, spread, rest](#деструктуризация-spread-rest)
6. [Property descriptors](#property-descriptors)
7. [Map vs Object](#map-vs-object)
8. [Вопросы на интервью](#вопросы-на-интервью)

---

## Создание объектов

```javascript
// 1. Object literal
const obj = { x: 1, y: 2 };

// 2. Object.create(proto) — явный прототип
const base = { greet() { return `Hi, ${this.name}`; } };
const child = Object.create(base);
child.name = "Alice";
child.greet(); // "Hi, Alice"

// 3. new + Constructor Function
function Person(name) { this.name = name; }
Person.prototype.greet = function() { return `Hi, ${this.name}`; };
const alice = new Person("Alice");

// 4. class (синтаксический сахар над 3)
class PersonClass {
  constructor(name) { this.name = name; }
  greet() { return `Hi, ${this.name}`; }
}

// Сравнение: Object.create vs new vs {}
const proto = { type: "base" };
const a = Object.create(proto);    // [[Prototype]] = proto
const b = Object.create(null);     // нет прототипа вообще (dict)
const c = {};                      // [[Prototype]] = Object.prototype
```

---

## Prototype chain

```javascript
// Каждый объект имеет [[Prototype]] (внутренний слот)
// Поиск свойства: own → [[Prototype]] → [[Prototype]].[[Prototype]] → ... → null

function Animal(name) { this.name = name; }
Animal.prototype.speak = function() { return `${this.name} makes a sound`; };

function Dog(name, breed) {
  Animal.call(this, name); // super()
  this.breed = breed;
}

// Настройка цепочки прототипов
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog; // восстанавливаем constructor

Dog.prototype.bark = function() { return `${this.name} barks!`; };

const rex = new Dog("Rex", "Labrador");
rex.bark();   // "Rex barks!"    — из Dog.prototype
rex.speak();  // "Rex makes a sound" — из Animal.prototype через цепочку

// Проверки
console.log(rex instanceof Dog);     // true
console.log(rex instanceof Animal);  // true
console.log(rex.hasOwnProperty("name"));   // true  (own property)
console.log(rex.hasOwnProperty("bark"));   // false (в прототипе)
console.log("bark" in rex);                // true  (own + prototype chain)

// Цепочка прототипов
// rex → Dog.prototype → Animal.prototype → Object.prototype → null

// __proto__ vs prototype
// obj.__proto__ = [[Prototype]] объекта (deprecated, но работает)
// Constructor.prototype = объект, который станет [[Prototype]] экземпляров
```

---

## class — синтаксический сахар

```javascript
class Animal {
  #sound; // private field (ES2022)

  constructor(name, sound) {
    this.name = name;
    this.#sound = sound;
  }

  speak() {                           // prototype method
    return `${this.name} says ${this.#sound}`;
  }

  get info() {                        // getter
    return `${this.name} (${this.#sound})`;
  }

  static create(name, sound) {        // static method
    return new Animal(name, sound);
  }

  static #count = 0;                  // private static field
}

class Dog extends Animal {
  #tricks = [];

  constructor(name) {
    super(name, "Woof");              // обязательно перед this
  }

  learn(trick) {
    this.#tricks.push(trick);
    return this;
  }

  perform() {
    return this.#tricks.map(t => `${this.name} performs: ${t}`);
  }

  // override
  speak() {
    return super.speak() + "!";       // super вызывает метод родителя
  }
}

const dog = new Dog("Rex");
dog.learn("sit").learn("shake");
dog.perform(); // ["Rex performs: sit", "Rex performs: shake"]
dog.speak();   // "Rex says Woof!"

// class vs function: ключевые отличия
// 1. class — всегда strict mode
// 2. class не hoisted (TDZ)
// 3. class нельзя вызвать без new
// 4. Методы класса не перечислимы (enumerable: false)
// 5. extends настраивает цепочку прототипов автоматически
```

---

## Object методы

```javascript
const obj = { a: 1, b: 2, c: 3 };

// Итерация
Object.keys(obj);    // ["a", "b", "c"]  — только string ключи
Object.values(obj);  // [1, 2, 3]
Object.entries(obj); // [["a", 1], ["b", 2], ["c", 3]]

// Создание из entries
Object.fromEntries([["a", 1], ["b", 2]]); // { a: 1, b: 2 }
Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v * 2])); // { a: 2, b: 4, c: 6 }
// Мутация значений за один проход с fromEntries

// Копирование / Merge
Object.assign({}, obj, { d: 4 });      // { a:1, b:2, c:3, d:4 } (shallow)
const merged = { ...obj, d: 4 };        // то же через spread

// Freeze / Seal
const frozen = Object.freeze({ x: 1, nested: { y: 2 } });
// frozen.x = 999;         // silently fails (strict → TypeError)
// frozen.nested.y = 999;  // работает! freeze — shallow

const sealed = Object.seal({ x: 1 });
sealed.x = 99;    // ✅ существующие свойства можно менять
// sealed.z = 1;  // ❌ новые добавить нельзя

// Проверки
Object.isFrozen(frozen); // true
Object.isSealed(sealed); // true

// Дескрипторы (см. следующий раздел)
Object.getOwnPropertyDescriptor(obj, "a");
Object.defineProperty(obj, "hidden", { value: 42, enumerable: false });
```

---

## Деструктуризация, spread, rest

```javascript
// Объект
const { a, b, c = 10 } = { a: 1, b: 2 };
// a=1, b=2, c=10 (default)

// Переименование + default
const { name: userName = "anon", age: userAge = 0 } = {};
// userName="anon", userAge=0

// Вложенная
const { address: { city, zip = "00000" } } = { address: { city: "Moscow" } };
// city="Moscow", zip="00000"

// Rest в объекте
const { a: first, ...rest } = { a: 1, b: 2, c: 3 };
// first=1, rest={ b:2, c:3 }

// Массив
const [x, y, , z = 99] = [1, 2, 3];  // пропуск элемента
// x=1, y=2, z=99 (пропущен 3, нет 4 → default)

const [head, ...tail] = [1, 2, 3, 4];
// head=1, tail=[2,3,4]

// Swap через деструктуризацию
let m = 1, n = 2;
[m, n] = [n, m];  // m=2, n=1

// Spread: копирование / слияние
const arr1 = [1, 2];
const arr2 = [3, 4];
const combined = [...arr1, ...arr2];   // [1, 2, 3, 4]

const obj1 = { a: 1 };
const obj2 = { b: 2, a: 99 };
const merged2 = { ...obj1, ...obj2 }; // { a: 99, b: 2 } — правый перекрывает
```

---

## Property descriptors

```javascript
// Каждое свойство имеет descriptor
const obj = {};
Object.defineProperty(obj, "id", {
  value: 42,
  writable: false,      // нельзя перезаписать
  enumerable: false,    // не попадает в for...in, Object.keys
  configurable: false,  // нельзя удалить или переопределить descriptor
});

console.log(obj.id);        // 42
obj.id = 99;                // silently fails (или TypeError в strict)
console.log(obj.id);        // 42

// Accessor descriptor (get/set)
const person = { _age: 0 };
Object.defineProperty(person, "age", {
  get() { return this._age; },
  set(v) {
    if (v < 0 || v > 150) throw new RangeError("Invalid age");
    this._age = v;
  },
  enumerable: true,
  configurable: true,
});

person.age = 30;
console.log(person.age); // 30

// Getter/setter через class (то же, удобнее)
class Temperature {
  #celsius = 0;
  get fahrenheit() { return this.#celsius * 9/5 + 32; }
  set fahrenheit(f) { this.#celsius = (f - 32) * 5/9; }
}
```

---

## Map vs Object

| | `Object` | `Map` |
|---|---|---|
| Ключи | String/Symbol | Любой тип |
| Порядок | Не гарантирован* | Insertion order |
| Размер | `Object.keys(o).length` | `map.size` |
| Итерация | `for...in`, `Object.keys` | `for...of`, `.forEach` |
| Prototype pollution | ⚠️ | ❌ (безопасно) |
| JSON.stringify | ✅ | ❌ (нужно конвертировать) |
| Производительность | Хуже при частых add/delete | Лучше |

```javascript
// Когда использовать Map:
// — ключи не строки (объекты, числа, функции)
// — частые операции add/delete
// — нужен гарантированный порядок
// — нужен .size без вычислений
// — нельзя допустить prototype pollution

const map = new Map();
map.set("name", "Alice");
map.set(42, "age key");
map.set({ id: 1 }, "object key");

map.has("name");     // true
map.get("name");     // "Alice"
map.size;            // 3
map.delete("name");
map.clear();

// Итерация
for (const [key, value] of map) { }
map.forEach((value, key) => { });
[...map.keys()];
[...map.values()];
[...map.entries()];

// Группировка (single pass!)
function groupBy(arr, keyFn) {
  const result = new Map();
  for (let i = 0; i < arr.length; i++) {
    const key = keyFn(arr[i]);
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(arr[i]);
  }
  return result;
}
```

---

## Вопросы на интервью

1. **Что такое prototype chain? Как происходит поиск свойства?**
   > При обращении к свойству: сначала ищем в самом объекте (own properties). Если не найдено — переходим к `[[Prototype]]`, потом к его `[[Prototype]]` и так до `null`. Это цепочка прототипов. `in` оператор ищет по всей цепочке, `hasOwnProperty` — только own.

2. **Чем `class` отличается от function constructor?**
   > `class` — синтаксический сахар. Ключевые отличия: 1) всегда strict mode, 2) не hoisted (TDZ), 3) нельзя вызвать без `new`, 4) методы non-enumerable, 5) private fields (#), 6) `extends` автоматически настраивает оба прототипа.

3. **`Object.create(null)` — зачем?**
   > Создаёт объект без прототипа (нет `toString`, `hasOwnProperty`, etc.). Идеально для словарей/хэш-мап — нет риска prototype pollution. Быстрее для lookup, так как нет цепочки.

4. **Когда Map лучше Object?**
   > Если ключи не строки, нужен `.size`, гарантированный порядок, частые add/delete, или нужна защита от prototype pollution. Object лучше для JSON, статичных конфигов, когда ключи всегда строки.

5. **В чём разница spread `{...obj}` vs `Object.assign({}, obj)`?**
   > Оба делают shallow copy. Отличия: spread более лаконичен, работает только со своими перечислимыми свойствами. `Object.assign` возвращает target, триггерит setters. `{...obj}` — pure expression, всегда новый объект.

---

## Примеры кода

```bash
node 03-javascript/04-objects-and-prototypes/examples/prototypes.js
node 03-javascript/04-objects-and-prototypes/examples/objects.js
```
