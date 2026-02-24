// ─────────────────────────────────────────────
// Single-pass идиомы для массивов
// Закон: максимум 1-2 прохода. Map/Set для O(1) lookup.
// node 03-javascript/05-arrays/examples/single-pass.js
// ─────────────────────────────────────────────

// ─── Статистика за один проход ────────────────
console.log("=== Статистика (min, max, sum, avg) — O(n), 1 проход ===");

function stats(arr) {
  if (arr.length === 0) return null;
  let min = arr[0], max = arr[0], sum = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { min, max, sum, avg: sum / arr.length, count: arr.length };
}

console.log(stats([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]));
// { min: 1, max: 9, sum: 44, avg: 4, count: 11 }

// ─── Partition — разделить за один проход ─────
console.log("\n=== Partition — O(n), 1 проход ===");

function partition(arr, pred) {
  const pass = [], fail = [];
  for (let i = 0; i < arr.length; i++) {
    (pred(arr[i]) ? pass : fail).push(arr[i]);
  }
  return [pass, fail];
}

const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const [evens, odds] = partition(nums, x => x % 2 === 0);
console.log("evens:", evens); // [2, 4, 6, 8, 10]
console.log("odds:", odds);   // [1, 3, 5, 7, 9]

// ─── Группировка за один проход ──────────────
console.log("\n=== groupBy — O(n), 1 проход ===");

function groupBy(arr, keyFn) {
  const result = Object.create(null); // чистый dict
  for (let i = 0; i < arr.length; i++) {
    const key = keyFn(arr[i]);
    if (key in result) {
      result[key].push(arr[i]);
    } else {
      result[key] = [arr[i]];
    }
  }
  return result;
}

const people = [
  { name: "Alice", dept: "Eng" },
  { name: "Bob",   dept: "HR" },
  { name: "Carol", dept: "Eng" },
  { name: "Dave",  dept: "HR" },
  { name: "Eve",   dept: "Eng" },
];

const byDept = groupBy(people, p => p.dept);
console.log("Eng:", byDept.Eng.map(p => p.name)); // ["Alice", "Carol", "Eve"]
console.log("HR:", byDept.HR.map(p => p.name));   // ["Bob", "Dave"]

// ─── Подсчёт частот за один проход ───────────
console.log("\n=== Частоты — O(n), 1 проход ===");

function countFrequency(arr) {
  const freq = new Map();
  for (let i = 0; i < arr.length; i++) {
    freq.set(arr[i], (freq.get(arr[i]) ?? 0) + 1);
  }
  return freq;
}

const chars = [..."abracadabra"];
const freq = countFrequency(chars);
console.log([...freq.entries()].sort((a, b) => b[1] - a[1]));
// [['a',5],['b',2],['r',2],['c',1],['d',1]]

// ─── Удаление дубликатов — O(n), 1 проход ─────
console.log("\n=== Dedupe — O(n), порядок сохранён ===");

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

console.log(dedupe([1, 2, 2, 3, 1, 4, 3, 5])); // [1, 2, 3, 4, 5]
console.log(dedupe(["a", "b", "a", "c", "b"])); // ["a", "b", "c"]

// ─── Пересечение двух массивов — O(n+m) ──────
console.log("\n=== Пересечение — O(n+m), 2 прохода ===");

function intersection(a, b) {
  const setB = new Set(b);     // проход 1: построить Set из b
  const result = [];
  for (let i = 0; i < a.length; i++) { // проход 2: O(1) lookup
    if (setB.has(a[i])) result.push(a[i]);
  }
  return result;
}

console.log(intersection([1, 2, 3, 4, 5], [3, 4, 5, 6, 7])); // [3, 4, 5]

// ─── Разница массивов — O(n+m) ────────────────
console.log("\n=== Разница (a - b) — O(n+m) ===");

function difference(a, b) {
  const setB = new Set(b);
  const result = [];
  for (let i = 0; i < a.length; i++) {
    if (!setB.has(a[i])) result.push(a[i]);
  }
  return result;
}

console.log(difference([1, 2, 3, 4, 5], [3, 4])); // [1, 2, 5]

// ─── Flat за один проход (stack-based) ────────
console.log("\n=== Flatten (любая вложенность) — итеративно ===");

function flatten(arr) {
  const result = [];
  const stack = [arr];
  while (stack.length > 0) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      // Пушим в обратном порядке чтобы сохранить порядок
      for (let i = item.length - 1; i >= 0; i--) {
        stack.push(item[i]);
      }
    } else {
      result.push(item);
    }
  }
  return result;
}

console.log(flatten([1, [2, [3, [4, [5]]]]]));           // [1,2,3,4,5]
console.log(flatten([[1, 2], [3, [4, 5]], [6]]));         // [1,2,3,4,5,6]

// ─── Chunk — разбить на части O(n) ───────────
console.log("\n=== Chunk ===");

function chunk(arr, size) {
  if (size <= 0) throw new Error("size must be > 0");
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

console.log(chunk([1, 2, 3, 4, 5, 6, 7], 3)); // [[1,2,3],[4,5,6],[7]]
console.log(chunk([1, 2, 3, 4], 2));           // [[1,2],[3,4]]

// ─── zip — объединить N массивов ─────────────
console.log("\n=== Zip ===");

function zip(...arrays) {
  const minLen = Math.min(...arrays.map(a => a.length));
  const result = new Array(minLen);
  for (let i = 0; i < minLen; i++) {
    result[i] = arrays.map(a => a[i]);
  }
  return result;
}

console.log(zip([1, 2, 3], ["a", "b", "c"], [true, false, true]));
// [[1,"a",true],[2,"b",false],[3,"c",true]]

// ─── Rotation — поворот массива ───────────────
console.log("\n=== Rotate ===");

// Rotate right by k (using reversal algorithm — O(n), in-place)
function rotateRight(arr, k) {
  const n = arr.length;
  if (n === 0) return arr;
  k = ((k % n) + n) % n; // нормализация
  reverse(arr, 0, n - 1);
  reverse(arr, 0, k - 1);
  reverse(arr, k, n - 1);
  return arr;
}

function reverse(arr, left, right) {
  while (left < right) {
    const tmp = arr[left];
    arr[left] = arr[right];
    arr[right] = tmp;
    left++;
    right--;
  }
}

console.log(rotateRight([1, 2, 3, 4, 5], 2)); // [4, 5, 1, 2, 3]
console.log(rotateRight([1, 2, 3, 4, 5], 7)); // [4, 5, 1, 2, 3] (7%5=2)

// ─── Multipass vs Single-pass сравнение ──────
console.log("\n=== Сравнение: multipass vs single-pass ===");

const data = Array.from({ length: 1_000_000 }, (_, i) => i);

console.time("multipass (filter+map+reduce)");
const res1 = data
  .filter(x => x % 2 === 0)          // pass 1
  .map(x => x * x)                   // pass 2
  .reduce((s, x) => s + x, 0);       // pass 3
console.timeEnd("multipass (filter+map+reduce)");

console.time("single-pass (for loop)");
let res2 = 0;
for (let i = 0; i < data.length; i++) {
  if (data[i] % 2 === 0) {
    res2 += data[i] * data[i];
  }
}
console.timeEnd("single-pass (for loop)");

console.log("Результаты совпадают:", res1 === res2); // true
// Single-pass: ~3-5x быстрее и нет промежуточных массивов
