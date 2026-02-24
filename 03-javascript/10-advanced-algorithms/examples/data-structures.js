// ─────────────────────────────────────────────
// Продвинутые структуры данных: Trie, Union-Find, Fenwick Tree, Bloom Filter
// node 03-javascript/10-advanced-algorithms/examples/data-structures.js
// ─────────────────────────────────────────────

// ─── Trie (Префиксное дерево) ─────────────────
console.log("=== Trie ===");
// Применение: автодополнение, spell check, IP routing

class TrieNode {
  children = new Map();
  isEnd = false;
  count = 0; // сколько слов проходит через этот узел
}

class Trie {
  #root = new TrieNode();

  insert(word) {
    let node = this.#root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch);
      node.count++;
    }
    node.isEnd = true;
  }

  search(word) {
    const node = this.#traverse(word);
    return node !== null && node.isEnd;
  }

  startsWith(prefix) {
    return this.#traverse(prefix) !== null;
  }

  // Все слова с данным префиксом
  autocomplete(prefix, limit = 10) {
    const node = this.#traverse(prefix);
    if (!node) return [];
    const results = [];
    this.#dfs(node, prefix, results, limit);
    return results;
  }

  // Удаление слова
  delete(word) {
    this.#deleteHelper(this.#root, word, 0);
  }

  // Количество слов с данным префиксом
  countWithPrefix(prefix) {
    const node = this.#traverse(prefix);
    return node ? node.count : 0;
  }

  #traverse(str) {
    let node = this.#root;
    for (const ch of str) {
      if (!node.children.has(ch)) return null;
      node = node.children.get(ch);
    }
    return node;
  }

  #dfs(node, current, results, limit) {
    if (results.length >= limit) return;
    if (node.isEnd) results.push(current);
    for (const [ch, child] of node.children) {
      this.#dfs(child, current + ch, results, limit);
    }
  }

  #deleteHelper(node, word, depth) {
    if (depth === word.length) {
      if (!node.isEnd) return false;
      node.isEnd = false;
      return node.children.size === 0; // удалить узел если нет детей
    }
    const ch = word[depth];
    if (!node.children.has(ch)) return false;
    const child = node.children.get(ch);
    child.count--;
    const shouldDelete = this.#deleteHelper(child, word, depth + 1);
    if (shouldDelete) node.children.delete(ch);
    return !node.isEnd && node.children.size === 0;
  }
}

const trie = new Trie();
["apple", "app", "application", "apply", "apt", "banana", "band", "bandana"].forEach(w => trie.insert(w));

console.log("search('app'):", trie.search("app"));           // true
console.log("search('appl'):", trie.search("appl"));         // false
console.log("startsWith('app'):", trie.startsWith("app"));   // true
console.log("startsWith('xyz'):", trie.startsWith("xyz"));   // false
console.log("autocomplete('app'):", trie.autocomplete("app")); // ["app","apple","application","apply"]
console.log("autocomplete('ban'):", trie.autocomplete("ban")); // ["banana","band","bandana"]
console.log("countWithPrefix('app'):", trie.countWithPrefix("app")); // 4

trie.delete("app");
console.log("after delete('app'), search('app'):", trie.search("app"));           // false
console.log("after delete('app'), search('apple'):", trie.search("apple")); // true (не удалено)

// ─── Union-Find / Disjoint Set Union ─────────
console.log("\n=== Union-Find (DSU) ===");
// Применение: граф, кластеризация, Kruskal MST

class UnionFind {
  #parent;
  #rank;
  #size;
  components;

  constructor(n) {
    this.#parent = Array.from({length: n}, (_, i) => i);
    this.#rank = new Array(n).fill(0);
    this.#size = new Array(n).fill(1);
    this.components = n;
  }

  // Path compression: прикрепляем узел сразу к корню
  find(x) {
    if (this.#parent[x] !== x) {
      this.#parent[x] = this.find(this.#parent[x]); // рекурсивное сжатие
    }
    return this.#parent[x];
  }

  // Union by rank: меньшее дерево присоединяем к большему
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false; // уже в одной компоненте

    if (this.#rank[rootX] < this.#rank[rootY]) {
      this.#parent[rootX] = rootY;
      this.#size[rootY] += this.#size[rootX];
    } else if (this.#rank[rootX] > this.#rank[rootY]) {
      this.#parent[rootY] = rootX;
      this.#size[rootX] += this.#size[rootY];
    } else {
      this.#parent[rootY] = rootX;
      this.#size[rootX] += this.#size[rootY];
      this.#rank[rootX]++;
    }
    this.components--;
    return true;
  }

  connected(x, y) { return this.find(x) === this.find(y); }
  sizeOf(x) { return this.#size[this.find(x)]; }
}

const uf = new UnionFind(10);
uf.union(0, 1); uf.union(1, 2); uf.union(3, 4);
uf.union(5, 6); uf.union(6, 7); uf.union(7, 8);

console.log("connected(0,2):", uf.connected(0, 2)); // true
console.log("connected(0,3):", uf.connected(0, 3)); // false
console.log("components:", uf.components);           // 5 (0-2, 3-4, 5-8, 9, + ещё)
console.log("sizeOf(0):", uf.sizeOf(0));             // 3

// Применение: обнаружить цикл в графе
function hasCycle(n, edges) {
  const uf = new UnionFind(n);
  for (const [u, v] of edges) {
    if (!uf.union(u, v)) return true; // уже соединены — цикл!
  }
  return false;
}

console.log("hasCycle (no cycle):", hasCycle(4, [[0,1],[1,2],[2,3]]));        // false
console.log("hasCycle (has cycle):", hasCycle(4, [[0,1],[1,2],[2,0],[2,3]])); // true

// ─── Fenwick Tree (Binary Indexed Tree) ──────
console.log("\n=== Fenwick Tree (BIT) ===");
// Prefix sums: update O(log n), query O(log n)

class FenwickTree {
  #tree;
  #n;

  constructor(n) {
    this.#n = n;
    this.#tree = new Array(n + 1).fill(0);
  }

  // Добавить delta к позиции i (1-indexed)
  update(i, delta) {
    for (; i <= this.#n; i += i & (-i)) { // i & (-i) = младший установленный бит
      this.#tree[i] += delta;
    }
  }

  // Сумма [1..i]
  prefixSum(i) {
    let sum = 0;
    for (; i > 0; i -= i & (-i)) {
      sum += this.#tree[i];
    }
    return sum;
  }

  // Сумма [l..r] (1-indexed)
  rangeSum(l, r) {
    return this.prefixSum(r) - this.prefixSum(l - 1);
  }

  // Построить из массива за O(n)
  static fromArray(arr) {
    const bit = new FenwickTree(arr.length);
    for (let i = 0; i < arr.length; i++) bit.update(i + 1, arr[i]);
    return bit;
  }
}

const bit = FenwickTree.fromArray([3, 2, -1, 6, 5, 4, -3, 3, 7, 2]);
console.log("prefixSum(5):", bit.prefixSum(5));     // 3+2-1+6+5 = 15
console.log("rangeSum(3,7):", bit.rangeSum(3, 7)); // -1+6+5+4-3 = 11

bit.update(3, 2); // arr[2] += 2 → было -1, стало 1
console.log("После update(3,+2), rangeSum(3,7):", bit.rangeSum(3, 7)); // 13

// Применение: подсчёт инверсий в массиве
function countInversions(arr) {
  const sorted = [...arr].sort((a,b)=>a-b);
  const rank = new Map(sorted.map((v,i) => [v, i+1]));
  const bit = new FenwickTree(arr.length);
  let inversions = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    const r = rank.get(arr[i]);
    inversions += bit.prefixSum(r - 1); // сколько уже добавленных элементов < текущего
    bit.update(r, 1);
  }
  return inversions;
}

console.log("inversions([2,4,1,3,5]):", countInversions([2,4,1,3,5])); // 3
// (2,1),(4,1),(4,3) — три инверсии

// ─── Bloom Filter ─────────────────────────────
console.log("\n=== Bloom Filter ===");
// Probabilistic: нет false negatives, есть false positives
// Применение: проверка URL в Chrome, фильтрация кэш-промахов

class BloomFilter {
  #bits;
  #size;
  #hashCount;

  constructor(size = 1024, hashCount = 3) {
    this.#size = size;
    this.#hashCount = hashCount;
    this.#bits = new Uint8Array(Math.ceil(size / 8));
  }

  // k разных хэш-функций через двойное хэширование
  #hashes(item) {
    const h1 = this.#hash1(item);
    const h2 = this.#hash2(item);
    return Array.from({length: this.#hashCount}, (_, i) =>
      Math.abs((h1 + i * h2)) % this.#size
    );
  }

  #hash1(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  #hash2(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = (Math.imul(33, h) ^ str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  #setBit(pos) { this.#bits[pos >> 3] |= 1 << (pos & 7); }
  #getBit(pos) { return (this.#bits[pos >> 3] >> (pos & 7)) & 1; }

  add(item) {
    for (const h of this.#hashes(item)) this.#setBit(h);
  }

  // Возвращает: false = ТОЧНО нет, true = ВЕРОЯТНО есть
  has(item) {
    return this.#hashes(item).every(h => this.#getBit(h) === 1);
  }

  // Процент заполненности (для оценки false positive rate)
  get fillRate() {
    let set = 0;
    for (let i = 0; i < this.#size; i++) if (this.#getBit(i)) set++;
    return (set / this.#size * 100).toFixed(1) + "%";
  }

  // Теоретический false positive rate = (1 - e^(-k*n/m))^k
  falsePositiveRate(n) {
    const k = this.#hashCount, m = this.#size;
    return Math.pow(1 - Math.exp(-k * n / m), k);
  }
}

const bf = new BloomFilter(2048, 5);
const urls = ["google.com","evil.com","malware.net","phishing.io","trusted.org"];
urls.forEach(url => bf.add(url));

console.log("has('evil.com'):", bf.has("evil.com"));     // true
console.log("has('google.com'):", bf.has("google.com")); // true
console.log("has('safe.net'):", bf.has("safe.net"));     // false (точно нет)
console.log("fill rate:", bf.fillRate);
console.log("false positive rate (5 items):", (bf.falsePositiveRate(5) * 100).toFixed(4) + "%");

// Тест false positives
const bf2 = new BloomFilter(1000, 3);
const known = Array.from({length:100}, (_, i) => `item-${i}`);
known.forEach(item => bf2.add(item));

let fp = 0;
for (let i = 100; i < 200; i++) {
  if (bf2.has(`item-${i}`)) fp++; // это не добавлено — false positive!
}
console.log(`False positives: ${fp}/100`);
