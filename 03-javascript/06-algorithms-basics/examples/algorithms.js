// ─────────────────────────────────────────────
// Алгоритмические паттерны: HashMap, Two Pointers, Sliding Window, Binary Search
// node 03-javascript/06-algorithms-basics/examples/algorithms.js
// ─────────────────────────────────────────────

// ─── HashMap паттерн ──────────────────────────
console.log("=== HashMap паттерн ===");

// Two Sum: O(n) через Map
function twoSum(arr, target) {
  const seen = new Map(); // value → index
  for (let i = 0; i < arr.length; i++) {
    const complement = target - arr[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(arr[i], i);
  }
  return null;
}

console.log("twoSum([2,7,11,15], 9):", twoSum([2, 7, 11, 15], 9));  // [0, 1]
console.log("twoSum([3,2,4], 6):", twoSum([3, 2, 4], 6));           // [1, 2]
console.log("twoSum([1,2,3], 10):", twoSum([1, 2, 3], 10));         // null

// Анаграмма: одинаковые символы разного порядка
function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  const count = new Map();
  for (let i = 0; i < a.length; i++) {
    count.set(a[i], (count.get(a[i]) ?? 0) + 1);
    count.set(b[i], (count.get(b[i]) ?? 0) - 1);
  }
  for (const v of count.values()) {
    if (v !== 0) return false;
  }
  return true;
}

console.log("\nisAnagram('anagram','nagaram'):", isAnagram("anagram", "nagaram")); // true
console.log("isAnagram('rat','car'):", isAnagram("rat", "car"));                   // false

// Наиболее частый элемент
function mostFrequent(arr) {
  const freq = new Map();
  let maxCount = 0, result = null;
  for (let i = 0; i < arr.length; i++) {
    const count = (freq.get(arr[i]) ?? 0) + 1;
    freq.set(arr[i], count);
    if (count > maxCount) {
      maxCount = count;
      result = arr[i];
    }
  }
  return result;
}

console.log("mostFrequent([1,3,3,2,1,3]):", mostFrequent([1, 3, 3, 2, 1, 3])); // 3

// ─── Two Pointers ─────────────────────────────
console.log("\n=== Two Pointers ===");

// Проверка палиндрома
function isPalindrome(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}

console.log("isPalindrome('racecar'):", isPalindrome("racecar")); // true
console.log("isPalindrome('hello'):", isPalindrome("hello"));     // false
console.log("isPalindrome('abba'):", isPalindrome("abba"));       // true

// Удаление дубликатов из отсортированного массива in-place
function removeDuplicatesSorted(arr) {
  if (arr.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < arr.length; read++) {
    if (arr[read] !== arr[read - 1]) {
      arr[write++] = arr[read];
    }
  }
  return write;
}

const dupArr = [1, 1, 2, 3, 3, 4, 5, 5];
const len = removeDuplicatesSorted(dupArr);
console.log("removeDuplicates:", dupArr.slice(0, len)); // [1, 2, 3, 4, 5]

// Two Sum для ОТСОРТИРОВАННОГО массива — O(n), O(1) памяти
function twoSumSorted(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null;
}

console.log("twoSumSorted([1,2,3,4,6], 6):", twoSumSorted([1, 2, 3, 4, 6], 6)); // [1, 3]

// Merge двух отсортированных массивов
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

console.log("mergeSorted:", mergeSorted([1, 3, 5, 7], [2, 4, 6, 8]));
// [1, 2, 3, 4, 5, 6, 7, 8]

// Container with most water: два указателя с двух концов
function maxWater(heights) {
  let left = 0, right = heights.length - 1;
  let maxArea = 0;
  while (left < right) {
    const width = right - left;
    const height = Math.min(heights[left], heights[right]);
    const area = width * height;
    if (area > maxArea) maxArea = area;
    // Двигаем указатель с меньшей высотой
    if (heights[left] < heights[right]) left++;
    else right--;
  }
  return maxArea;
}

console.log("maxWater([1,8,6,2,5,4,8,3,7]):", maxWater([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49

// ─── Sliding Window ───────────────────────────
console.log("\n=== Sliding Window ===");

// Максимальная сумма подмассива длины k (фиксированное окно)
function maxSumSubarray(arr, k) {
  if (arr.length < k) return null;
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += arr[i];
  let maxSum = windowSum;
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k]; // сдвиг окна: убираем левый, добавляем правый
    if (windowSum > maxSum) maxSum = windowSum;
  }
  return maxSum;
}

console.log("maxSumSubarray([2,1,5,1,3,2], 3):", maxSumSubarray([2, 1, 5, 1, 3, 2], 3)); // 9

// Самая длинная подстрока без повторов (переменное окно)
function longestUniqueSubstring(s) {
  const lastSeen = new Map();
  let maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {
      left = lastSeen.get(ch) + 1;
    }
    lastSeen.set(ch, right);
    const len = right - left + 1;
    if (len > maxLen) maxLen = len;
  }
  return maxLen;
}

console.log("longestUnique('abcabcbb'):", longestUniqueSubstring("abcabcbb")); // 3
console.log("longestUnique('bbbbb'):", longestUniqueSubstring("bbbbb"));       // 1
console.log("longestUnique('pwwkew'):", longestUniqueSubstring("pwwkew"));     // 3

// Minimum window substring: минимальное окно содержащее все символы t
function minWindowSubstring(s, t) {
  if (s.length < t.length) return "";

  const need = new Map();
  for (let i = 0; i < t.length; i++) {
    need.set(t[i], (need.get(t[i]) ?? 0) + 1);
  }

  let have = 0, required = need.size;
  const window = new Map();
  let minLen = Infinity, minStart = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    window.set(ch, (window.get(ch) ?? 0) + 1);

    if (need.has(ch) && window.get(ch) === need.get(ch)) have++;

    while (have === required) {
      const len = right - left + 1;
      if (len < minLen) { minLen = len; minStart = left; }

      const leftCh = s[left];
      window.set(leftCh, window.get(leftCh) - 1);
      if (need.has(leftCh) && window.get(leftCh) < need.get(leftCh)) have--;
      left++;
    }
  }

  return minLen === Infinity ? "" : s.slice(minStart, minStart + minLen);
}

console.log("minWindow('ADOBECODEBANC','ABC'):", minWindowSubstring("ADOBECODEBANC", "ABC")); // "BANC"

// ─── Binary Search ────────────────────────────
console.log("\n=== Binary Search ===");

function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
console.log("binarySearch(sorted, 7):", binarySearch(sorted, 7));   // 3
console.log("binarySearch(sorted, 10):", binarySearch(sorted, 10)); // -1
console.log("binarySearch(sorted, 1):", binarySearch(sorted, 1));   // 0
console.log("binarySearch(sorted, 19):", binarySearch(sorted, 19)); // 9

// Search in rotated sorted array: [4,5,6,7,0,1,2]
function searchRotated(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] === target) return mid;
    // Левая половина отсортирована?
    if (arr[lo] <= arr[mid]) {
      if (arr[lo] <= target && target < arr[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      // Правая половина отсортирована
      if (arr[mid] < target && target <= arr[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

console.log("searchRotated([4,5,6,7,0,1,2], 0):", searchRotated([4, 5, 6, 7, 0, 1, 2], 0)); // 4
console.log("searchRotated([4,5,6,7,0,1,2], 3):", searchRotated([4, 5, 6, 7, 0, 1, 2], 3)); // -1

// ─── Kadane's Algorithm — максимальная сумма подмассива ─
console.log("\n=== Kadane's Algorithm (max subarray sum) ===");

function maxSubarraySum(arr) {
  let maxSoFar = arr[0];
  let maxEndingHere = arr[0];
  let start = 0, end = 0, tempStart = 0;

  for (let i = 1; i < arr.length; i++) {
    if (maxEndingHere + arr[i] < arr[i]) {
      maxEndingHere = arr[i];
      tempStart = i;
    } else {
      maxEndingHere += arr[i];
    }
    if (maxEndingHere > maxSoFar) {
      maxSoFar = maxEndingHere;
      start = tempStart;
      end = i;
    }
  }
  return { sum: maxSoFar, subarray: arr.slice(start, end + 1) };
}

console.log(maxSubarraySum([-2, 1, -3, 4, -1, 2, 1, -5, 4]));
// { sum: 6, subarray: [4, -1, 2, 1] }
console.log(maxSubarraySum([-1, -2, -3]));
// { sum: -1, subarray: [-1] }

// ─── Сравнение сложностей на практике ────────
console.log("\n=== Сравнение O(n²) vs O(n) ===");

function generateArray(n) {
  return Array.from({ length: n }, (_, i) => i);
}

const n = 50_000;
const testArr = generateArray(n);

// O(n²): вложенный цикл (проверка дубликатов)
console.time(`O(n²) n=${n}`);
let found = false;
outer: for (let i = 0; i < testArr.length; i++) {
  for (let j = i + 1; j < testArr.length; j++) {
    if (testArr[i] === testArr[j]) { found = true; break outer; }
  }
}
console.timeEnd(`O(n²) n=${n}`);

// O(n): Set
console.time(`O(n) Set n=${n}`);
const seenSet = new Set();
let foundFast = false;
for (let i = 0; i < testArr.length; i++) {
  if (seenSet.has(testArr[i])) { foundFast = true; break; }
  seenSet.add(testArr[i]);
}
console.timeEnd(`O(n) Set n=${n}`);
// O(n) будет в 100-1000x быстрее
