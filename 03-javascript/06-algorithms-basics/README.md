# 06 · Основы алгоритмов

[← JavaScript](../README.md)

---

## Содержание

1. [Big O: нотация и правила](#big-o)
2. [Hash Map паттерн — O(1) lookup](#hash-map-паттерн)
3. [Two Pointers](#two-pointers)
4. [Sliding Window](#sliding-window)
5. [Рекурсия и стек вызовов](#рекурсия)
6. [Binary Search](#binary-search)
7. [Вопросы на интервью](#вопросы-на-интервью)

---

## Big O

**Big O** — описывает как растёт время/память алгоритма при росте входных данных.

```
O(1)       — константа:   HashMap lookup, array[i]
O(log n)   — логарифм:    Binary search, дерево поиска
O(n)       — линейно:     Один проход по массиву
O(n log n) — квазилинейно: Хорошие сортировки (mergesort, quicksort avg)
O(n²)      — квадратично: Вложенный цикл
O(2ⁿ)      — экспоненциально: Рекурсия без мемоизации (fib наивный)
O(n!)      — факториально: Перебор перестановок
```

### Правила вычисления

```javascript
// 1. Константы убираем
O(3n + 5) → O(n)

// 2. Берём старший член
O(n² + n + 100) → O(n²)

// 3. Параллельные блоки складываем
for (let i = 0; i < n; i++) { }  // O(n)
for (let j = 0; j < m; j++) { }  // O(m)
// Итого: O(n + m)

// 4. Вложенные блоки перемножаем
for (let i = 0; i < n; i++) {        // O(n)
  for (let j = 0; j < n; j++) { }   // × O(n)
}
// Итого: O(n²)

// 5. O(log n): каждый шаг уменьшает задачу вдвое
// Binary search: [1..n] → [1..n/2] → [1..n/4] → ... → 1
// Количество шагов = log₂(n)
```

### Оценка сложностей

```javascript
// O(1): не зависит от n
function getFirst(arr) { return arr[0]; }
const map = new Map(); map.get("key"); // O(1)

// O(n): один проход
function sum(arr) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s;
}

// O(n²): вложенный цикл
function hasDuplicateSlow(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}

// O(n): тот же результат через Set
function hasDuplicateFast(arr) {
  const seen = new Set();
  for (let i = 0; i < arr.length; i++) {
    if (seen.has(arr[i])) return true;
    seen.add(arr[i]);
  }
  return false;
}

// O(log n): делим пространство пополам
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1; // беззнаковый сдвиг = Math.floor((lo+hi)/2)
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```

---

## Hash Map паттерн

Заменяет вложенные циклы O(n²) → O(n). Строим Map/Set при первом проходе, используем при втором.

```javascript
// Задача: найти все пары с суммой = target
// Наивно — O(n²)
function twoSumSlow(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] + arr[j] === target) return [i, j];
    }
  }
  return null;
}

// Оптимально — O(n): один проход, Map для complement
function twoSum(arr, target) {
  const seen = new Map(); // value → index
  for (let i = 0; i < arr.length; i++) {
    const complement = target - arr[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(arr[i], i);
  }
  return null;
}
twoSum([2, 7, 11, 15], 9); // [0, 1]
```

---

## Two Pointers

Два указателя движутся навстречу или в одном направлении. Обычно применяется к **отсортированному** массиву или строке. Заменяет O(n²) → O(n).

```javascript
// Паттерн 1: с двух концов (opposite direction)
function isPalindrome(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}

// Паттерн 2: в одном направлении (fast/slow)
// Удалить дубликаты из отсортированного массива in-place
function removeDuplicates(arr) {
  if (arr.length === 0) return 0;
  let write = 1; // указатель записи
  for (let read = 1; read < arr.length; read++) {
    if (arr[read] !== arr[read - 1]) {
      arr[write] = arr[read];
      write++;
    }
  }
  return write; // длина уникальной части
}

// Паттерн 3: merge двух отсортированных массивов — O(n+m)
function mergeSorted(a, b) {
  const result = new Array(a.length + b.length);
  let i = 0, j = 0, k = 0;
  while (i < a.length && j < b.length) {
    result[k++] = a[i] <= b[j] ? a[i++] : b[j++];
  }
  while (i < a.length) result[k++] = a[i++];
  while (j < b.length) result[k++] = b[j++];
  return result;
}
mergeSorted([1, 3, 5], [2, 4, 6]); // [1, 2, 3, 4, 5, 6]
```

---

## Sliding Window

Окно фиксированного или переменного размера скользит по массиву/строке. O(n) вместо O(n²) для задач с подмассивами/подстроками.

```javascript
// Фиксированное окно: max сумма подмассива длины k
function maxSumSubarray(arr, k) {
  if (arr.length < k) return null;
  let windowSum = 0;
  // Инициализируем первое окно
  for (let i = 0; i < k; i++) windowSum += arr[i];
  let maxSum = windowSum;
  // Скользим: убираем левый, добавляем правый
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    if (windowSum > maxSum) maxSum = windowSum;
  }
  return maxSum;
}

// Переменное окно: самая длинная подстрока без повторяющихся символов
function lengthOfLongestSubstring(s) {
  const lastSeen = new Map(); // char → last index
  let maxLen = 0;
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    // Если символ уже в окне — двигаем левую границу
    if (lastSeen.has(char) && lastSeen.get(char) >= left) {
      left = lastSeen.get(char) + 1;
    }
    lastSeen.set(char, right);
    const len = right - left + 1;
    if (len > maxLen) maxLen = len;
  }
  return maxLen;
}
lengthOfLongestSubstring("abcabcbb"); // 3 ("abc")
lengthOfLongestSubstring("pwwkew");   // 3 ("wke")
```

---

## Рекурсия

```javascript
// Принцип: базовый случай + рекурсивный случай
// Каждый рекурсивный вызов должен двигаться к базовому случаю

// Мощность: O(log n) через быстрое возведение
function pow(base, exp) {
  if (exp === 0) return 1;
  if (exp % 2 === 0) {
    const half = pow(base, exp / 2);
    return half * half; // вычисляем половину один раз!
  }
  return base * pow(base, exp - 1);
}

// Глубокое клонирование объекта (без циклических ссылок)
function deepClone(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    const arr = new Array(value.length);
    for (let i = 0; i < value.length; i++) arr[i] = deepClone(value[i]);
    return arr;
  }
  const obj = {};
  for (const key of Object.keys(value)) obj[key] = deepClone(value[key]);
  return obj;
}

// Трансформация дерева (рекурсия по структуре)
function sumTree(node) {
  if (!node) return 0;
  return node.value + sumTree(node.left) + sumTree(node.right);
}

// Рекурсия → итерация через стек (избегаем stack overflow)
function dfsIterative(root) {
  const result = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    result.push(node.value);
    stack.push(node.right); // right сначала (LIFO — left обработается первым)
    stack.push(node.left);
  }
  return result;
}
```

---

## Binary Search

O(log n) поиск в **отсортированном** массиве.

```javascript
// Стандартный binary search
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1; // без overflow (vs Math.floor)
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1; // не найдено
}

// Lower bound: первая позиция >= target (leftmost position)
function lowerBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Upper bound: первая позиция > target
function upperBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Применение: count occurrences of target
function countOccurrences(arr, target) {
  return upperBound(arr, target) - lowerBound(arr, target);
}

// Binary search по условию: ответ — монотонная функция
// Найти минимальный x такой что f(x) = true
function binarySearchCondition(lo, hi, condition) {
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (condition(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
```

---

## Вопросы на интервью

1. **O(n log n) vs O(n²) — в чём разница на практике?**
   > При n=1000: O(n log n) ≈ 10 000 операций, O(n²) = 1 000 000. При n=1M: O(n log n) ≈ 20M, O(n²) = 10¹². Разница критическая. Любую задачу с вложенным циклом стоит рассматривать на предмет оптимизации через HashMap или два указателя.

2. **Когда использовать рекурсию, когда итерацию?**
   > Рекурсия читаемее для древовидных/рекурсивных структур (дерево, граф, DFS). Итерация эффективнее: нет overhead стека вызовов, нет риска stack overflow (по умолчанию ~10K-15K кадров). Глубокое дерево → итерация со своим стеком.

3. **Two Sum за O(n) — как?**
   > Один проход. Для каждого элемента x вычислить `complement = target - x`. Если complement уже в HashMap — нашли пару. Иначе — добавить x в HashMap. O(n) времени, O(n) памяти.

4. **Что такое sliding window? Когда применять?**
   > Техника для задач с подмассивом/подстрокой. Поддерживаем окно [left, right] и двигаем границы, не пересчитывая всё с нуля. Применять когда: "найти подмассив/подстроку с максимальной/минимальной длиной / суммой удовлетворяющий условию".

5. **Почему `(lo + hi) >>> 1` вместо `Math.floor((lo + hi) / 2)`?**
   > В JavaScript числа 64-bit float, поэтому overflow как в других языках невозможен, но `>>> 1` (unsigned right shift) работает быстрее как операция и гарантирует целое число без вызова Math.floor. Стандартная практика.

---

## Примеры кода

```bash
node 03-javascript/06-algorithms-basics/examples/algorithms.js
```
