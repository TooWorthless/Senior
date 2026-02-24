// ─────────────────────────────────────────────
// Сортировки сравнением: Bubble, Insertion, Selection, Merge, Quick, Heap
// node 03-javascript/09-sorting/examples/comparison-sorts.js
// ─────────────────────────────────────────────

// ─── Утилиты ──────────────────────────────────
function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

function swap(arr, i, j) {
  const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
}

const input = [38, 27, 43, 3, 9, 82, 10, 64, 1, 55, 17];

// ─── Bubble Sort — O(n²) ─────────────────────
function bubbleSort(arr) {
  const a = [...arr];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) { // n-1-i: правая часть уже отсортирована
      if (a[j] > a[j + 1]) {
        swap(a, j, j + 1);
        swapped = true;
      }
    }
    if (!swapped) break; // оптимизация: выход если уже отсортировано
  }
  return a;
}

// ─── Insertion Sort — O(n²), O(n) для почти отсортированных ─
function insertionSort(arr) {
  const a = [...arr];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    // Сдвигаем элементы правее пока они больше key
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j]; // сдвиг, не swap — меньше операций
      j--;
    }
    a[j + 1] = key;
  }
  return a;
}

// ─── Selection Sort — O(n²), минимум swap'ов ─
function selectionSort(arr) {
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) swap(a, i, minIdx); // максимум n-1 swap'ов!
  }
  return a;
}

// ─── Merge Sort — O(n log n), стабильный ─────
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = arr.length >> 1;
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = new Array(left.length + right.length);
  let i = 0, j = 0, k = 0;
  while (i < left.length && j < right.length) {
    // <= обеспечивает стабильность (равные элементы из left идут первыми)
    result[k++] = left[i] <= right[j] ? left[i++] : right[j++];
  }
  while (i < left.length) result[k++] = left[i++];
  while (j < right.length) result[k++] = right[j++];
  return result;
}

// Merge Sort итеративный (bottom-up) — без рекурсии, без риска stack overflow
function mergeSortIterative(arr) {
  const a = [...arr];
  const n = a.length;
  const tmp = new Array(n);

  for (let size = 1; size < n; size *= 2) {
    for (let start = 0; start < n; start += size * 2) {
      const mid = Math.min(start + size, n);
      const end = Math.min(start + size * 2, n);
      mergeInPlace(a, tmp, start, mid, end);
    }
  }
  return a;
}

function mergeInPlace(arr, tmp, start, mid, end) {
  let i = start, j = mid, k = start;
  while (i < mid && j < end) {
    tmp[k++] = arr[i] <= arr[j] ? arr[i++] : arr[j++];
  }
  while (i < mid) tmp[k++] = arr[i++];
  while (j < end) tmp[k++] = arr[j++];
  for (let x = start; x < end; x++) arr[x] = tmp[x];
}

// ─── Quick Sort — O(n log n) avg, O(n²) worst ─
// Lomuto partition с random pivot
function quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo < hi) {
    const pivotIdx = partition(arr, lo, hi);
    quickSort(arr, lo, pivotIdx - 1);
    quickSort(arr, pivotIdx + 1, hi);
  }
  return arr;
}

function partition(arr, lo, hi) {
  // Random pivot — защита от O(n²) на отсортированных данных
  const pivotIdx = lo + Math.floor(Math.random() * (hi - lo + 1));
  swap(arr, pivotIdx, hi); // перемещаем pivot в конец
  const pivot = arr[hi];
  let write = lo;
  for (let i = lo; i < hi; i++) {
    if (arr[i] <= pivot) swap(arr, i, write++);
  }
  swap(arr, write, hi);
  return write;
}

// 3-way Quick Sort (Dutch National Flag) — оптимален при дубликатах
function quickSort3Way(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return arr;
  const pivot = arr[lo + Math.floor(Math.random() * (hi - lo + 1))];
  let lt = lo, gt = hi, i = lo;
  while (i <= gt) {
    if      (arr[i] < pivot) swap(arr, lt++, i++);
    else if (arr[i] > pivot) swap(arr, i, gt--);
    else                     i++;
  }
  // arr[lo..lt-1] < pivot = arr[lt..gt] < arr[gt+1..hi]
  quickSort3Way(arr, lo, lt - 1);
  quickSort3Way(arr, gt + 1, hi);
  return arr;
}

// ─── Heap Sort — O(n log n), O(1) память ──────
function heapSort(arr) {
  const a = [...arr];
  const n = a.length;

  // Шаг 1: Построить max-heap за O(n) (heapify снизу вверх)
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    siftDown(a, i, n);
  }

  // Шаг 2: Последовательно извлекать максимум
  for (let end = n - 1; end > 0; end--) {
    swap(a, 0, end);       // корень (макс) → в конец
    siftDown(a, 0, end);   // восстановить heap для [0..end-1]
  }
  return a;
}

function siftDown(arr, i, heapSize) {
  while (true) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < heapSize && arr[left] > arr[largest]) largest = left;
    if (right < heapSize && arr[right] > arr[largest]) largest = right;
    if (largest === i) break;
    swap(arr, i, largest);
    i = largest;
  }
}

// ─── Тесты и сравнение ────────────────────────
console.log("Входные данные:", input);
console.log();

const algorithms = [
  ["Bubble Sort", () => bubbleSort(input)],
  ["Insertion Sort", () => insertionSort(input)],
  ["Selection Sort", () => selectionSort(input)],
  ["Merge Sort (recursive)", () => mergeSort(input)],
  ["Merge Sort (iterative)", () => mergeSortIterative(input)],
  ["Quick Sort (random pivot)", () => quickSort([...input])],
  ["Quick Sort (3-way)", () => quickSort3Way([...input])],
  ["Heap Sort", () => heapSort(input)],
  ["Built-in .sort()", () => [...input].sort((a,b)=>a-b)],
];

for (const [name, fn] of algorithms) {
  const start = performance.now();
  const result = fn();
  const time = (performance.now() - start).toFixed(4);
  const ok = isSorted(result) ? "✅" : "❌";
  console.log(`${ok} ${name.padEnd(28)} [${result.join(",")}]  (${time}ms)`);
}

// ─── Стабильность сортировки ─────────────────
console.log("\n=== Стабильность ===");
const people = [
  {name:"Charlie",age:25},{name:"Alice",age:25},{name:"Bob",age:30},
  {name:"Dave",age:25},{name:"Eve",age:30}
];

// Стабильная: порядок Charlie, Alice, Dave сохранён
const stableSort = [...people].sort((a,b) => a.age - b.age);
// Или Merge Sort:
const mergedPeople = mergeSort(people.map((_,i)=>i)) // индексы сохраняют порядок
  .map(i => people[i]);

console.log("Sorted by age (stable):", stableSort.map(p=>p.name).join(", "));
// Charlie, Alice, Dave, Bob, Eve — порядок равных сохранён

// ─── Benchmark на больших данных ─────────────
console.log("\n=== Benchmark (n=10_000) ===");
const big = Array.from({length:10_000}, () => Math.floor(Math.random()*100_000));

for (const [name, getFn] of [
  ["Insertion Sort", () => insertionSort(big)],
  ["Merge Sort", () => mergeSort(big)],
  ["Quick Sort", () => quickSort([...big])],
  ["Heap Sort", () => heapSort(big)],
  ["Built-in .sort()", () => [...big].sort((a,b)=>a-b)],
]) {
  const t0 = performance.now();
  const r = getFn();
  const t = (performance.now() - t0).toFixed(2);
  console.log(`${isSorted(r)?"✅":"❌"} ${name.padEnd(20)} ${t}ms`);
}
