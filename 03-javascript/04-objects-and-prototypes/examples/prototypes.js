// ─────────────────────────────────────────────
// Прототипы: цепочка, наследование, class
// node 03-javascript/04-objects-and-prototypes/examples/prototypes.js
// ─────────────────────────────────────────────

// ─── Prototype chain ─────────────────────────
console.log("=== Prototype chain ===");

function Vehicle(type, speed) {
  this.type = type;
  this.speed = speed;
}
Vehicle.prototype.describe = function() {
  return `${this.type} at ${this.speed}km/h`;
};
Vehicle.prototype.toString = function() {
  return `[Vehicle: ${this.type}]`;
};

function Car(brand, speed) {
  Vehicle.call(this, "car", speed); // super
  this.brand = brand;
}

Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car;

Car.prototype.honk = function() {
  return `${this.brand}: Beep!`;
};

const car = new Car("Toyota", 120);
console.log(car.describe()); // "car at 120km/h" — из Vehicle.prototype
console.log(car.honk());     // "Toyota: Beep!"  — из Car.prototype
console.log(car.toString()); // "[Vehicle: car]"  — из Vehicle.prototype

// Проверки
console.log("own 'brand':", car.hasOwnProperty("brand"));   // true
console.log("own 'honk':", car.hasOwnProperty("honk"));     // false (в прото)
console.log("'honk' in car:", "honk" in car);               // true
console.log("car instanceof Car:", car instanceof Car);      // true
console.log("car instanceof Vehicle:", car instanceof Vehicle); // true

// Цепочка прототипов
console.log("\n--- Цепочка прототипов ---");
let proto = Object.getPrototypeOf(car);
while (proto !== null) {
  console.log(proto.constructor?.name || "anonymous", "→");
  proto = Object.getPrototypeOf(proto);
}
// Car → Vehicle → Object → null

// ─── Object.create ────────────────────────────
console.log("\n=== Object.create ===");

const baseUser = {
  greet() { return `Hello, ${this.name}`; },
  toString() { return `[User: ${this.name}]`; },
};

const admin = Object.create(baseUser);
admin.name = "Admin";
admin.role = "admin";
admin.deleteUser = function(id) { return `Deleted user ${id}`; };

console.log(admin.greet());         // "Hello, Admin"
console.log(admin instanceof Object); // true
console.log(Object.getPrototypeOf(admin) === baseUser); // true

// Object.create(null) — чистый словарь
const dict = Object.create(null);
dict["key"] = "value";
dict["toString"] = "overwrite without conflict!"; // безопасно
console.log("dict keys:", Object.keys(dict));
console.log("dict has proto:", Object.getPrototypeOf(dict)); // null

// ─── class (современный синтаксис) ────────────
console.log("\n=== class ===");

class Shape {
  #color; // private field

  constructor(color) {
    this.#color = color;
  }

  get color() { return this.#color; }

  area() {
    throw new Error("area() must be implemented");
  }

  toString() {
    return `[${this.constructor.name}: area=${this.area().toFixed(2)}, color=${this.#color}]`;
  }

  static fromConfig({ color }) {
    return new Shape(color);
  }
}

class Circle extends Shape {
  #radius;

  constructor(radius, color = "black") {
    super(color);
    this.#radius = radius;
  }

  area() {
    return Math.PI * this.#radius ** 2;
  }

  get radius() { return this.#radius; }
}

class Rectangle extends Shape {
  constructor(width, height, color = "black") {
    super(color);
    this.width = width;
    this.height = height;
  }

  area() { return this.width * this.height; }
}

const circle = new Circle(5, "red");
const rect = new Rectangle(4, 6, "blue");

console.log(circle.toString());  // [Circle: area=78.54, color=red]
console.log(rect.toString());    // [Rectangle: area=24.00, color=blue]
console.log(circle instanceof Shape); // true

// Методы non-enumerable
console.log("circle own keys:", Object.keys(circle));
// Методы в прото — не перечислимы!

// ─── Ручная реализация instanceof ────────────
console.log("\n=== instanceof реализация ===");

function myInstanceof(obj, Constructor) {
  let proto = Object.getPrototypeOf(obj);
  const target = Constructor.prototype;
  while (proto !== null) {
    if (proto === target) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

console.log(myInstanceof(circle, Circle));  // true
console.log(myInstanceof(circle, Shape));   // true
console.log(myInstanceof(circle, Array));   // false
