// ─────────────────────────────────────────────
// Coding Challenges: Массивы и структуры данных
// node 03-javascript/07-coding-challenges/examples/challenges.js
// ─────────────────────────────────────────────

// ─── Product of Array Except Self ─────────────
console.log("=== Product except self — O(n), без деления ===");

// Для каждого i: произведение всех элементов кроме arr[i]
// Нельзя использовать деление!
// Идея: prefix (левое произведение) × suffix (правое произведение)
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n);

  // Проход 1 (лево→право): result[i] = произведение всех слева от i
  result[0] = 1;
  for (let i = 1; i < n; i++) {
    result[i] = result[i - 1] * nums[i - 1];
  }

  // Проход 2 (право→лево): умножаем на произведение всех справа от i
  let rightProduct = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= rightProduct;
    rightProduct *= nums[i];
  }

  return result;
}

console.log(productExceptSelf([1, 2, 3, 4]));    // [24, 12, 8, 6]
console.log(productExceptSelf([-1, 1, 0, -3, 3])); // [0, 0, 9, 0, 0]

// ─── Дубликат в массиве ───────────────────────
console.log("\n=== Найти дубликат — O(n) ===");

// Версия 1: HashMap — O(n) время, O(n) память
function findDuplicateHash(nums) {
  const seen = new Set();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(nums[i])) return nums[i];
    seen.add(nums[i]);
  }
  return -1;
}

// Версия 2: Floyd's Cycle Detection — O(n) время, O(1) память
// Применимо когда числа от 1 до n в массиве длины n+1
function findDuplicateFloyd(nums) {
  let slow = nums[0], fast = nums[0];
  // Фаза 1: найти точку входа в цикл
  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);
  // Фаза 2: найти начало цикла
  slow = nums[0];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }
  return slow;
}

console.log("hash [1,3,4,2,2]:", findDuplicateHash([1, 3, 4, 2, 2]));    // 2
console.log("floyd [3,1,3,4,2]:", findDuplicateFloyd([3, 1, 3, 4, 2])); // 3

// ─── Move Zeros ───────────────────────────────
console.log("\n=== Move Zeros in-place — O(n) ===");

// Перенести все нули в конец, сохранить порядок ненулевых
function moveZeros(nums) {
  let write = 0;
  // Пишем ненулевые в начало
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      nums[write++] = nums[read];
    }
  }
  // Заполняем хвост нулями
  while (write < nums.length) {
    nums[write++] = 0;
  }
  return nums;
}

console.log(moveZeros([0, 1, 0, 3, 12]));   // [1, 3, 12, 0, 0]
console.log(moveZeros([0, 0, 1]));           // [1, 0, 0]

// ─── Merge Intervals ─────────────────────────
console.log("\n=== Merge Intervals — O(n log n) ===");

function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;
  // Сортируем по начальной точке
  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    const curr = intervals[i];
    if (curr[0] <= last[1]) {
      // Пересечение: расширяем последний интервал
      last[1] = Math.max(last[1], curr[1]);
    } else {
      result.push(curr);
    }
  }
  return result;
}

console.log(mergeIntervals([[1,3],[2,6],[8,10],[15,18]]));  // [[1,6],[8,10],[15,18]]
console.log(mergeIntervals([[1,4],[4,5]]));                  // [[1,5]]

// ─── Deep Equal ───────────────────────────────
console.log("\n=== Deep Equal — O(n) ===");

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  const isArrayA = Array.isArray(a);
  const isArrayB = Array.isArray(b);
  if (isArrayA !== isArrayB) return false;

  if (isArrayA) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

console.log(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })); // true
console.log(deepEqual([1, [2, 3]], [1, [2, 3]]));                       // true
console.log(deepEqual({ a: 1 }, { a: 2 }));                             // false
console.log(deepEqual(null, null));                                      // true
console.log(deepEqual(NaN, NaN));                                        // false (NaN !== NaN)

// ─── Flatten объекта ─────────────────────────
console.log("\n=== Flatten объекта ===");

function flattenObject(obj, prefix = "", result = {}) {
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      flattenObject(val, fullKey, result);
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

const nested = {
  a: 1,
  b: { c: 2, d: { e: 3 } },
  f: [1, 2, 3],
};
console.log(flattenObject(nested));
// { a: 1, "b.c": 2, "b.d.e": 3, f: [1, 2, 3] }

// Обратная операция: unflatten
function unflattenObject(flat) {
  const result = {};
  for (const key of Object.keys(flat)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = flat[key];
  }
  return result;
}

const flat = { "a.b.c": 1, "a.b.d": 2, "e": 3 };
console.log(JSON.stringify(unflattenObject(flat)));
// {"a":{"b":{"c":1,"d":2}},"e":3}

// ─── LRU Cache ────────────────────────────────
console.log("\n=== LRU Cache — O(1) get/put ===");

// Doubly Linked List + HashMap
// Map в JS сохраняет insertion order — используем это!
class LRUCache {
  #capacity;
  #cache; // Map: key → value (в порядке от давних к свежим)

  constructor(capacity) {
    this.#capacity = capacity;
    this.#cache = new Map();
  }

  get(key) {
    if (!this.#cache.has(key)) return -1;
    // "Освежаем" — удаляем и вставляем в конец
    const value = this.#cache.get(key);
    this.#cache.delete(key);
    this.#cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.#cache.has(key)) {
      this.#cache.delete(key);
    } else if (this.#cache.size >= this.#capacity) {
      // Удаляем самый давний (первый ключ в Map)
      this.#cache.delete(this.#cache.keys().next().value);
    }
    this.#cache.set(key, value);
  }

  toString() {
    return [...this.#cache.entries()].map(([k, v]) => `${k}:${v}`).join(" → ");
  }
}

const cache = new LRUCache(3);
cache.put(1, 1);
cache.put(2, 2);
cache.put(3, 3);
console.log("after put 1,2,3:", cache.toString()); // 1:1 → 2:2 → 3:3

cache.get(1);  // 1 становится свежим
console.log("after get(1):", cache.toString());    // 2:2 → 3:3 → 1:1

cache.put(4, 4); // вытесняет 2 (самый давний)
console.log("after put(4):", cache.toString());    // 3:3 → 1:1 → 4:4

console.log("get(2):", cache.get(2));   // -1 (вытеснен)
console.log("get(3):", cache.get(3));   // 3

// ─── Глубокий merge объектов ─────────────────
console.log("\n=== Deep Merge ===");

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = result[key];
    if (
      srcVal !== null &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal, srcVal);
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}

const defaults = { theme: "light", db: { host: "localhost", port: 5432 }, debug: false };
const override = { theme: "dark", db: { port: 5433, name: "mydb" } };
console.log(JSON.stringify(deepMerge(defaults, override), null, 2));
// { theme: "dark", db: { host: "localhost", port: 5433, name: "mydb" }, debug: false }

// ─── Top K Frequent Elements — O(n) ─────────
console.log("\n=== Top K Frequent — O(n) через bucket sort ===");

function topKFrequent(nums, k) {
  // Шаг 1: подсчёт частот O(n)
  const freq = new Map();
  for (let i = 0; i < nums.length; i++) {
    freq.set(nums[i], (freq.get(nums[i]) ?? 0) + 1);
  }

  // Шаг 2: Bucket sort — bucket[i] = числа с частотой i
  const bucket = new Array(nums.length + 1);
  for (const [num, count] of freq) {
    if (!bucket[count]) bucket[count] = [];
    bucket[count].push(num);
  }

  // Шаг 3: собираем k элементов с наибольшими частотами (справа налево)
  const result = [];
  for (let i = bucket.length - 1; i >= 0 && result.length < k; i--) {
    if (bucket[i]) {
      for (let j = 0; j < bucket[i].length && result.length < k; j++) {
        result.push(bucket[i][j]);
      }
    }
  }
  return result;
}

console.log("topKFrequent([1,1,1,2,2,3], 2):", topKFrequent([1, 1, 1, 2, 2, 3], 2)); // [1, 2]
console.log("topKFrequent([4,1,4,2,2,2], 1):", topKFrequent([4, 1, 4, 2, 2, 2], 1)); // [2]
