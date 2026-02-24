// ─────────────────────────────────────────────
// Не-сравнительные сортировки: Counting, Radix, Tim Sort (концепт)
// node 03-javascript/09-sorting/examples/non-comparison-sorts.js
// ─────────────────────────────────────────────

function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) if (arr[i] < arr[i-1]) return false;
  return true;
}

// ─── Counting Sort — O(n + k) ─────────────────
// Только для целых неотрицательных чисел в известном диапазоне [0..k]
function countingSort(arr, maxVal) {
  const count = new Array(maxVal + 1).fill(0);

  // Шаг 1: считаем количество каждого значения
  for (let i = 0; i < arr.length; i++) count[arr[i]]++;

  // Шаг 2: превращаем в накопленные суммы (prefix sum)
  // count[i] теперь = количество элементов ≤ i
  for (let i = 1; i <= maxVal; i++) count[i] += count[i - 1];

  // Шаг 3: строим результат справа налево (для стабильности!)
  const result = new Array(arr.length);
  for (let i = arr.length - 1; i >= 0; i--) {
    result[--count[arr[i]]] = arr[i];
  }
  return result;
}

// Counting Sort для произвольного диапазона [min..max]
function countingSortRange(arr) {
  if (arr.length === 0) return arr;
  let min = arr[0], max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
    if (arr[i] > max) max = arr[i];
  }
  const offset = min;
  const count = new Array(max - min + 1).fill(0);
  for (let i = 0; i < arr.length; i++) count[arr[i] - offset]++;
  for (let i = 1; i < count.length; i++) count[i] += count[i - 1];
  const result = new Array(arr.length);
  for (let i = arr.length - 1; i >= 0; i--) {
    result[--count[arr[i] - offset]] = arr[i];
  }
  return result;
}

const arr1 = [4, 2, 2, 8, 3, 3, 1, 7, 5, 6, 2];
console.log("Counting Sort:", countingSort(arr1, 8));
// [1, 2, 2, 2, 3, 3, 4, 5, 6, 7, 8]
console.log("Counting Sort (range [-3..5]):", countingSortRange([-3,-1,2,0,-2,1,5,3,-3]));

// ─── Radix Sort — O(d × n) ────────────────────
// Сортируем поцифрово от младшего разряда к старшему (LSD)
// На каждом проходе используем стабильный Counting Sort

function radixSort(arr) {
  if (arr.length <= 1) return [...arr];
  const a = [...arr];

  // Найти максимум для определения количества разрядов
  let max = a[0];
  for (let i = 1; i < a.length; i++) if (a[i] > max) max = a[i];

  // Для каждого разряда делаем counting sort
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    countingByDigit(a, exp);
  }
  return a;
}

function countingByDigit(arr, exp) {
  const n = arr.length;
  const output = new Array(n);
  const count = new Array(10).fill(0);

  // Считаем количество элементов по текущей цифре
  for (let i = 0; i < n; i++) count[Math.floor(arr[i] / exp) % 10]++;

  // Накопленные суммы
  for (let i = 1; i < 10; i++) count[i] += count[i - 1];

  // Строим результат (справа налево для стабильности)
  for (let i = n - 1; i >= 0; i--) {
    const digit = Math.floor(arr[i] / exp) % 10;
    output[--count[digit]] = arr[i];
  }

  // Копируем обратно
  for (let i = 0; i < n; i++) arr[i] = output[i];
}

const arr2 = [170, 45, 75, 90, 802, 24, 2, 66];
console.log("\nRadix Sort:", radixSort(arr2));
// [2, 24, 45, 66, 75, 90, 170, 802]

// Radix Sort для строк одинаковой длины (LSD)
function radixSortStrings(arr) {
  if (arr.length === 0) return arr;
  const W = arr[0].length; // предполагаем одинаковую длину
  const R = 256; // ASCII

  let a = [...arr];
  for (let d = W - 1; d >= 0; d--) { // от последнего символа к первому
    const count = new Array(R + 1).fill(0);
    for (let i = 0; i < a.length; i++) count[a[i].charCodeAt(d) + 1]++;
    for (let r = 0; r < R; r++) count[r + 1] += count[r];
    const aux = new Array(a.length);
    for (let i = 0; i < a.length; i++) aux[count[a[i].charCodeAt(d)]++] = a[i];
    a = aux;
  }
  return a;
}

const words = ["dab", "add", "cab", "fad", "fee", "bad", "dad", "bee", "fed", "bed"];
console.log("Radix Sort strings:", radixSortStrings(words));
// ["add","bad","bed","bee","cab","dab","dad","fab","fad","fed","fee"] (sorted)

// ─── Tim Sort — концепция ─────────────────────
// То что делает V8 под капотом при .sort()
// Hybrid: Insertion Sort для малых runs + Merge Sort для слияния runs

const MIN_RUN = 32; // минимальный размер run

function timSort(arr) {
  const a = [...arr];
  const n = a.length;

  // Шаг 1: сортируем runs (куски MIN_RUN) через Insertion Sort
  for (let start = 0; start < n; start += MIN_RUN) {
    insertionSortRange(a, start, Math.min(start + MIN_RUN - 1, n - 1));
  }

  // Шаг 2: последовательно сливаем runs
  for (let size = MIN_RUN; size < n; size *= 2) {
    for (let left = 0; left < n; left += size * 2) {
      const mid = Math.min(left + size - 1, n - 1);
      const right = Math.min(left + size * 2 - 1, n - 1);
      if (mid < right) mergeRuns(a, left, mid, right);
    }
  }
  return a;
}

function insertionSortRange(arr, left, right) {
  for (let i = left + 1; i <= right; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= left && arr[j] > key) { arr[j + 1] = arr[j]; j--; }
    arr[j + 1] = key;
  }
}

function mergeRuns(arr, left, mid, right) {
  const leftPart = arr.slice(left, mid + 1);
  const rightPart = arr.slice(mid + 1, right + 1);
  let i = 0, j = 0, k = left;
  while (i < leftPart.length && j < rightPart.length) {
    arr[k++] = leftPart[i] <= rightPart[j] ? leftPart[i++] : rightPart[j++];
  }
  while (i < leftPart.length) arr[k++] = leftPart[i++];
  while (j < rightPart.length) arr[k++] = rightPart[j++];
}

// ─── Итоговое сравнение ───────────────────────
console.log("\n=== Итоговое сравнение (n=50_000) ===");

const bigArr = Array.from({length:50_000}, () => Math.floor(Math.random()*1_000_000));
const sortedArr = [...bigArr].sort((a,b)=>a-b); // уже отсортированный

const tests = [
  ["Random → Counting Sort",   () => countingSortRange([...bigArr])],
  ["Random → Radix Sort",      () => radixSort([...bigArr])],
  ["Random → Tim Sort",        () => timSort([...bigArr])],
  ["Random → built-in .sort()",() => [...bigArr].sort((a,b)=>a-b)],
  ["Sorted → Tim Sort",        () => timSort([...sortedArr])],   // Tim: O(n)!
  ["Sorted → built-in .sort()",() => [...sortedArr].sort((a,b)=>a-b)],
];

for (const [label, fn] of tests) {
  const t0 = performance.now();
  const r = fn();
  const t = (performance.now() - t0).toFixed(2);
  console.log(`${isSorted(r)?"✅":"❌"} ${label.padEnd(35)} ${t}ms`);
}
