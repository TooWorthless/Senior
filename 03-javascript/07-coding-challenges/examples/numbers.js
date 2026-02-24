// ─────────────────────────────────────────────
// Coding Challenges: Числа и математика
// node 03-javascript/07-coding-challenges/examples/numbers.js
// ─────────────────────────────────────────────

// ─── Числа Фибоначчи ─────────────────────────
console.log("=== Фибоначчи ===");

// O(n), O(1) — итеративно, только 2 переменные
function fib(n) {
  if (n <= 1) return n;
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}

// С мемоизацией — для рекурсивного варианта
function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}

for (let i = 0; i <= 10; i++) process.stdout.write(fib(i) + (i < 10 ? ", " : "\n"));
// 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55

console.log("fib(50):", fib(50));         // 12586269025
console.log("fibMemo(50):", fibMemo(50)); // 12586269025

// ─── Простое число ────────────────────────────
console.log("\n=== Простое число ===");

// O(√n): проверяем только до √n
function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  // Проверяем только нечётные делители до √n
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

const primes = [];
for (let i = 2; i <= 50; i++) {
  if (isPrime(i)) primes.push(i);
}
console.log("Primes up to 50:", primes.join(", "));
// 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47

// ─── Решето Эратосфена ───────────────────────
console.log("\n=== Решето Эратосфена — O(n log log n) ===");

function sieveOfEratosthenes(n) {
  const isComposite = new Uint8Array(n + 1); // 0 = prime, 1 = composite
  isComposite[0] = isComposite[1] = 1;

  for (let i = 2; i * i <= n; i++) {
    if (!isComposite[i]) {
      // Все кратные i начиная с i² — составные
      for (let j = i * i; j <= n; j += i) {
        isComposite[j] = 1;
      }
    }
  }

  const primes = [];
  for (let i = 2; i <= n; i++) {
    if (!isComposite[i]) primes.push(i);
  }
  return primes;
}

const sievePrimes = sieveOfEratosthenes(100);
console.log(`Primes up to 100 (${sievePrimes.length}):`, sievePrimes.join(", "));

// ─── Реверс числа ─────────────────────────────
console.log("\n=== Реверс числа ===");

// O(log n): извлекаем цифры одну за другой
function reverseInt(n) {
  const sign = n < 0 ? -1 : 1;
  let abs = Math.abs(n);
  let reversed = 0;
  while (abs > 0) {
    reversed = reversed * 10 + (abs % 10);
    abs = Math.floor(abs / 10);
  }
  return sign * reversed;
}

console.log("reverseInt(123):", reverseInt(123));   // 321
console.log("reverseInt(-456):", reverseInt(-456)); // -654
console.log("reverseInt(120):", reverseInt(120));   // 21

// ─── Является ли степенью 2 ───────────────────
console.log("\n=== Степень двойки — O(1) ===");

// Битовый трюк: у степени двойки ровно один бит установлен
// n & (n-1) обнуляет младший установленный бит
// Если n = 2^k, то после обнуления = 0
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

// Степень тройки: нет простого битового трюка, делим
function isPowerOfThree(n) {
  if (n <= 0) return false;
  while (n % 3 === 0) n /= 3;
  return n === 1;
}

console.log("isPowerOfTwo(1):", isPowerOfTwo(1));   // true (2^0)
console.log("isPowerOfTwo(16):", isPowerOfTwo(16)); // true (2^4)
console.log("isPowerOfTwo(18):", isPowerOfTwo(18)); // false
console.log("isPowerOfThree(27):", isPowerOfThree(27)); // true
console.log("isPowerOfThree(10):", isPowerOfThree(10)); // false

// ─── НОД — алгоритм Евклида ───────────────────
console.log("\n=== НОД (GCD) — O(log min(a,b)) ===");

function gcd(a, b) {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

function lcm(a, b) {
  return (a / gcd(a, b)) * b; // Деление перед умножением — избегаем overflow
}

console.log("gcd(48, 18):", gcd(48, 18));       // 6
console.log("gcd(252, 105):", gcd(252, 105));   // 21
console.log("lcm(4, 6):", lcm(4, 6));           // 12
console.log("lcm(12, 18):", lcm(12, 18));       // 36

// ─── Число цифр и сумма цифр ─────────────────
console.log("\n=== Работа с цифрами ===");

function digitSum(n) {
  let abs = Math.abs(n), sum = 0;
  while (abs > 0) {
    sum += abs % 10;
    abs = Math.floor(abs / 10);
  }
  return sum;
}

function numDigits(n) {
  if (n === 0) return 1;
  let count = 0, abs = Math.abs(n);
  while (abs > 0) { count++; abs = Math.floor(abs / 10); }
  return count;
}

// Число Армстронга: сумма цифр в степени кол-ва цифр = само число
function isArmstrong(n) {
  const digits = numDigits(n);
  let sum = 0, tmp = n;
  while (tmp > 0) {
    sum += Math.pow(tmp % 10, digits);
    tmp = Math.floor(tmp / 10);
  }
  return sum === n;
}

console.log("digitSum(1234):", digitSum(1234));   // 10
console.log("numDigits(12345):", numDigits(12345)); // 5
console.log("isArmstrong(153):", isArmstrong(153)); // true (1³+5³+3³=153)
console.log("isArmstrong(370):", isArmstrong(370)); // true (3³+7³+0³=370)
console.log("isArmstrong(371):", isArmstrong(371)); // true
console.log("isArmstrong(100):", isArmstrong(100)); // false

// ─── Roman numerals ───────────────────────────
console.log("\n=== Roman numerals ===");

function toRoman(num) {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}

function fromRoman(s) {
  const map = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  let result = 0;
  for (let i = 0; i < s.length; i++) {
    const curr = map[s[i]];
    const next = map[s[i + 1]] ?? 0;
    result += curr < next ? -curr : curr;
  }
  return result;
}

console.log("toRoman(1994):", toRoman(1994));     // "MCMXCIV"
console.log("toRoman(58):", toRoman(58));         // "LVIII"
console.log("fromRoman('MCMXCIV'):", fromRoman("MCMXCIV")); // 1994
console.log("fromRoman('LVIII'):", fromRoman("LVIII"));     // 58
