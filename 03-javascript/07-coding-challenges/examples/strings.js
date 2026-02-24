// ─────────────────────────────────────────────
// Coding Challenges: Строки
// node 03-javascript/07-coding-challenges/examples/strings.js
// ─────────────────────────────────────────────

// ─── FizzBuzz ─────────────────────────────────
console.log("=== FizzBuzz ===");

function fizzBuzz(n) {
  const result = new Array(n);
  for (let i = 1; i <= n; i++) {
    // Проверяем делимость на 15 первой — избегаем лишних вычислений
    if (i % 15 === 0) result[i - 1] = "FizzBuzz";
    else if (i % 3 === 0) result[i - 1] = "Fizz";
    else if (i % 5 === 0) result[i - 1] = "Buzz";
    else result[i - 1] = String(i);
  }
  return result;
}

// Расширяемая версия (легко добавить новые правила)
function fizzBuzzExtendable(n, rules = [[3, "Fizz"], [5, "Buzz"]]) {
  const result = new Array(n);
  for (let i = 1; i <= n; i++) {
    let str = "";
    for (let r = 0; r < rules.length; r++) {
      if (i % rules[r][0] === 0) str += rules[r][1];
    }
    result[i - 1] = str || String(i);
  }
  return result;
}

console.log(fizzBuzz(15).join(", "));
// 1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz

// ─── Палиндром ────────────────────────────────
console.log("\n=== Палиндром ===");

// Строгий: точное совпадение символов
function isPalindrome(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}

// Нестрогий: только буквы и цифры, регистронезависимо
function isPalindromeAlphaNum(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    while (left < right && !isAlphaNum(s[left])) left++;
    while (left < right && !isAlphaNum(s[right])) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}

function isAlphaNum(ch) {
  const code = ch.charCodeAt(0);
  return (code >= 48 && code <= 57) ||  // 0-9
         (code >= 65 && code <= 90) ||  // A-Z
         (code >= 97 && code <= 122);   // a-z
}

console.log("isPalindrome('racecar'):", isPalindrome("racecar"));   // true
console.log("isPalindrome('hello'):", isPalindrome("hello"));       // false
console.log("isPalindromeAlphaNum('A man a plan a canal Panama'):",
  isPalindromeAlphaNum("A man a plan a canal Panama")); // true

// ─── Анаграмма ────────────────────────────────
console.log("\n=== Анаграмма ===");

// O(n): одновременный подсчёт обоих строк за один проход
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

console.log("isAnagram('listen','silent'):", isAnagram("listen", "silent")); // true
console.log("isAnagram('hello','world'):", isAnagram("hello", "world"));     // false

// ─── Реверс строки ────────────────────────────
console.log("\n=== Реверс строки ===");

// O(n), in-place через массив
function reverseString(s) {
  const arr = s.split("");
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const tmp = arr[left];
    arr[left] = arr[right];
    arr[right] = tmp;
    left++;
    right--;
  }
  return arr.join("");
}

// Реверс слов в строке (не символов)
function reverseWords(s) {
  const words = s.trim().split(/\s+/);
  let left = 0, right = words.length - 1;
  while (left < right) {
    const tmp = words[left];
    words[left] = words[right];
    words[right] = tmp;
    left++;
    right--;
  }
  return words.join(" ");
}

console.log("reverseString('hello'):", reverseString("hello")); // "olleh"
console.log("reverseWords('the sky is blue'):", reverseWords("the sky is blue")); // "blue is sky the"

// ─── Все анаграммы в строке (Sliding Window) ─
console.log("\n=== Найти все анаграммы в строке ===");

// O(n): найти все позиции в s где начинается анаграмма p
function findAnagrams(s, p) {
  if (s.length < p.length) return [];
  const result = [];
  const need = new Array(26).fill(0);
  const window = new Array(26).fill(0);
  const base = "a".charCodeAt(0);

  for (let i = 0; i < p.length; i++) {
    need[p.charCodeAt(i) - base]++;
    window[s.charCodeAt(i) - base]++;
  }

  let matches = 0;
  for (let i = 0; i < 26; i++) {
    if (need[i] === window[i]) matches++;
  }

  for (let right = p.length; right < s.length; right++) {
    if (matches === 26) result.push(right - p.length);

    // Добавляем правый символ
    const addIdx = s.charCodeAt(right) - base;
    if (window[addIdx] === need[addIdx]) matches--;
    window[addIdx]++;
    if (window[addIdx] === need[addIdx]) matches++;

    // Убираем левый символ
    const removeIdx = s.charCodeAt(right - p.length) - base;
    if (window[removeIdx] === need[removeIdx]) matches--;
    window[removeIdx]--;
    if (window[removeIdx] === need[removeIdx]) matches++;
  }

  if (matches === 26) result.push(s.length - p.length);
  return result;
}

console.log("findAnagrams('cbaebabacd','abc'):", findAnagrams("cbaebabacd", "abc")); // [0, 6]
console.log("findAnagrams('abab','ab'):", findAnagrams("abab", "ab")); // [0, 1, 2]

// ─── Сжатие строки ────────────────────────────
console.log("\n=== Сжатие строки ===");

// "aaabbbcc" → "a3b3c2"  |  "abc" → "abc" (если не короче — оригинал)
function compress(s) {
  let result = "";
  let i = 0;
  while (i < s.length) {
    const char = s[i];
    let count = 1;
    while (i + count < s.length && s[i + count] === char) count++;
    result += count > 1 ? char + count : char;
    i += count;
  }
  return result.length < s.length ? result : s;
}

console.log("compress('aaabbbcc'):", compress("aaabbbcc")); // "a3b3c2"
console.log("compress('aabbcc'):", compress("aabbcc"));     // "aabbcc" (не короче)
console.log("compress('aaaaa'):", compress("aaaaa"));       // "a5"
console.log("compress('abc'):", compress("abc"));           // "abc"

// ─── Валидные скобки ──────────────────────────
console.log("\n=== Валидные скобки ===");

function isValidBrackets(s) {
  const stack = [];
  const map = { ")": "(", "]": "[", "}": "{" };
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
    } else {
      if (stack.length === 0 || stack[stack.length - 1] !== map[ch]) return false;
      stack.pop();
    }
  }
  return stack.length === 0;
}

console.log("isValid('()[]{}'):", isValidBrackets("()[]{}"));   // true
console.log("isValid('([{}])'):", isValidBrackets("([{}])"));   // true
console.log("isValid('(]'):", isValidBrackets("(]"));           // false
console.log("isValid('([)'):", isValidBrackets("([)"));         // false

// ─── Первый уникальный символ ─────────────────
console.log("\n=== Первый уникальный символ ===");

function firstUniqueChar(s) {
  const count = new Map();
  // Проход 1: подсчёт частот
  for (let i = 0; i < s.length; i++) {
    count.set(s[i], (count.get(s[i]) ?? 0) + 1);
  }
  // Проход 2: найти первый с count=1
  for (let i = 0; i < s.length; i++) {
    if (count.get(s[i]) === 1) return i;
  }
  return -1;
}

console.log("firstUniqueChar('leetcode'):", firstUniqueChar("leetcode")); // 0 (l)
console.log("firstUniqueChar('aabb'):", firstUniqueChar("aabb"));         // -1
console.log("firstUniqueChar('loveleet'):", firstUniqueChar("loveleet")); // 2 (v)

// ─── Longest Common Prefix ────────────────────
console.log("\n=== Longest Common Prefix ===");

function longestCommonPrefix(strs) {
  if (strs.length === 0) return "";
  // Берём первую строку как эталон, сравниваем с остальными
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    // Обрезаем prefix пока он не станет префиксом strs[i]
    while (strs[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (prefix === "") return "";
    }
  }
  return prefix;
}

console.log("lcp(['flower','flow','flight']):", longestCommonPrefix(["flower", "flow", "flight"])); // "fl"
console.log("lcp(['dog','racecar','car']):", longestCommonPrefix(["dog", "racecar", "car"]));       // ""
