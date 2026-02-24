// ─────────────────────────────────────────────
// Алгоритмические паттерны: Boyer-Moore, Reservoir Sampling, Topological Sort
// node 03-javascript/10-advanced-algorithms/examples/patterns.js
// ─────────────────────────────────────────────

// ─── Boyer-Moore Voting Algorithm ────────────
console.log("=== Boyer-Moore Voting ===");
// Найти мажоритарный элемент (встречается > n/2 раз) — O(n), O(1)

function majorityElement(nums) {
  let candidate = null, count = 0;
  for (let i = 0; i < nums.length; i++) {
    if (count === 0) candidate = nums[i];
    count += nums[i] === candidate ? 1 : -1;
  }
  // Проверка (если не гарантировано что мажоритарный существует)
  let verify = 0;
  for (let i = 0; i < nums.length; i++) if (nums[i] === candidate) verify++;
  return verify > nums.length / 2 ? candidate : null;
}

console.log(majorityElement([3,2,3]));         // 3
console.log(majorityElement([2,2,1,1,1,2,2])); // 2
console.log(majorityElement([1,2,3,4]));        // null (нет мажоритарного)

// Расширение: элементы встречающиеся > n/3 раз (максимум 2 таких)
function majorityElementsN3(nums) {
  let cand1 = null, cand2 = null, cnt1 = 0, cnt2 = 0;
  for (const n of nums) {
    if (n === cand1) { cnt1++; }
    else if (n === cand2) { cnt2++; }
    else if (cnt1 === 0) { cand1 = n; cnt1 = 1; }
    else if (cnt2 === 0) { cand2 = n; cnt2 = 1; }
    else { cnt1--; cnt2--; }
  }
  // Верификация
  cnt1 = 0; cnt2 = 0;
  for (const n of nums) {
    if (n === cand1) cnt1++;
    else if (n === cand2) cnt2++;
  }
  const result = [];
  if (cnt1 > nums.length / 3) result.push(cand1);
  if (cnt2 > nums.length / 3) result.push(cand2);
  return result;
}

console.log(majorityElementsN3([3,2,3]));              // [3]
console.log(majorityElementsN3([1,1,1,3,3,2,2,2]));   // [1,2]

// ─── Reservoir Sampling ────────────────────────
console.log("\n=== Reservoir Sampling ===");
// Выбрать k случайных элементов из потока неизвестной длины.
// Каждый элемент имеет вероятность k/n попасть в выборку.

function reservoirSample(stream, k) {
  const reservoir = [];
  let i = 0;

  for (const item of stream) {
    if (i < k) {
      reservoir.push(item);               // первые k сразу в резервуар
    } else {
      const j = Math.floor(Math.random() * (i + 1)); // случайный индекс [0..i]
      if (j < k) reservoir[j] = item;    // с вероятностью k/(i+1) заменяем
    }
    i++;
  }
  return reservoir;
}

// Генератор потока (имитация бесконечного потока)
function* infiniteStream(n) {
  for (let i = 1; i <= n; i++) yield i;
}

// Тест: берём 3 из 10, каждый должен встречаться ~3/10 = 30% раз
const samples = Array.from({length: 10000}, () =>
  reservoirSample(infiniteStream(10), 3)
);
const freq = {};
for (const s of samples) for (const v of s) freq[v] = (freq[v] ?? 0) + 1;
console.log("Распределение (ожидаем ~3000 для каждого из 10):");
console.log(Object.fromEntries(Object.entries(freq).sort((a,b) => +a[0] - +b[0])));

// Weighted Reservoir Sampling (Алгоритм A-Res)
function weightedReservoirSample(items, weights, k) {
  // Каждый элемент получает ключ: r^(1/w) где r = random, w = weight
  const reservoir = [];
  let minKey = Infinity;
  let minIdx = -1;

  for (let i = 0; i < items.length; i++) {
    const key = Math.random() ** (1 / weights[i]);
    if (reservoir.length < k) {
      reservoir.push({ item: items[i], key });
      if (key < minKey) { minKey = key; minIdx = reservoir.length - 1; }
    } else if (key > minKey) {
      reservoir[minIdx] = { item: items[i], key };
      // Пересчитываем минимум
      minKey = Infinity;
      for (let j = 0; j < reservoir.length; j++) {
        if (reservoir[j].key < minKey) { minKey = reservoir[j].key; minIdx = j; }
      }
    }
  }
  return reservoir.map(r => r.item);
}

const items = ["A","B","C","D","E"];
const weights = [1, 5, 2, 8, 1]; // B и D должны встречаться чаще

const wFreq = {};
for (let i = 0; i < 10000; i++) {
  const s = weightedReservoirSample(items, weights, 2);
  for (const v of s) wFreq[v] = (wFreq[v] ?? 0) + 1;
}
console.log("\nWeighted Reservoir Sample (вес B=5, D=8 должны преобладать):", wFreq);

// ─── Topological Sort ─────────────────────────
console.log("\n=== Topological Sort ===");

// Граф зависимостей: {node: [dependencies]}
// npm-like dependency resolution

class DependencyGraph {
  #deps = new Map();

  addPackage(name, deps = []) {
    this.#deps.set(name, deps);
    for (const dep of deps) {
      if (!this.#deps.has(dep)) this.#deps.set(dep, []);
    }
  }

  // Kahn's Algorithm (BFS): обнаруживает циклы
  topoSort() {
    const inDegree = new Map();
    const graph = new Map(); // node → [dependents]

    for (const [node] of this.#deps) { inDegree.set(node, 0); graph.set(node, []); }

    for (const [node, deps] of this.#deps) {
      for (const dep of deps) {
        graph.get(dep).push(node);        // dep должен быть до node
        inDegree.set(node, (inDegree.get(node) ?? 0) + 1);
      }
    }

    // Начинаем с узлов без зависимостей
    const queue = [];
    for (const [node, deg] of inDegree) if (deg === 0) queue.push(node);

    const result = [];
    while (queue.length > 0) {
      const node = queue.shift();
      result.push(node);
      for (const dependent of graph.get(node)) {
        const newDeg = inDegree.get(dependent) - 1;
        inDegree.set(dependent, newDeg);
        if (newDeg === 0) queue.push(dependent);
      }
    }

    if (result.length !== this.#deps.size) {
      throw new Error("Circular dependency detected!");
    }
    return result;
  }

  // DFS вариант: более компактный
  topoSortDFS() {
    const visited = new Set();
    const stack = [];
    const inStack = new Set(); // для обнаружения циклов

    const dfs = (node) => {
      if (inStack.has(node)) throw new Error(`Cycle: ${node}`);
      if (visited.has(node)) return;
      inStack.add(node);
      for (const dep of this.#deps.get(node) ?? []) dfs(dep);
      inStack.delete(node);
      visited.add(node);
      stack.push(node);
    };

    for (const [node] of this.#deps) dfs(node);
    return stack; // уже в нужном порядке (post-order)
  }
}

const graph = new DependencyGraph();
graph.addPackage("app", ["react", "lodash", "axios"]);
graph.addPackage("react", ["react-dom"]);
graph.addPackage("react-dom", []);
graph.addPackage("axios", []);
graph.addPackage("lodash", []);

console.log("Порядок установки (Kahn's):", graph.topoSort());
// ["react-dom", "axios", "lodash", "react", "app"] или похожий порядок
console.log("Порядок установки (DFS):", graph.topoSortDFS());

// Тест на цикл
const cyclic = new DependencyGraph();
cyclic.addPackage("A", ["B"]);
cyclic.addPackage("B", ["C"]);
cyclic.addPackage("C", ["A"]); // цикл!
try {
  cyclic.topoSort();
} catch (e) {
  console.log("Циклическая зависимость:", e.message);
}

// ─── Bonus: Skip List (для понимания Redis ZSET) ─
console.log("\n=== Skip List (концепт Redis ZSET) ===");
// Redis Sorted Sets используют Skip List для O(log n) операций

class SkipListNode {
  constructor(key, value, level) {
    this.key = key;
    this.value = value;
    this.forward = new Array(level + 1).fill(null);
  }
}

class SkipList {
  #maxLevel = 16;
  #p = 0.5; // вероятность повышения уровня
  #level = 0;
  #head = new SkipListNode(-Infinity, null, 16);
  #size = 0;

  #randomLevel() {
    let level = 0;
    while (Math.random() < this.#p && level < this.#maxLevel) level++;
    return level;
  }

  insert(key, value) {
    const update = new Array(this.#maxLevel + 1).fill(null);
    let current = this.#head;

    for (let i = this.#level; i >= 0; i--) {
      while (current.forward[i] && current.forward[i].key < key) {
        current = current.forward[i];
      }
      update[i] = current;
    }

    current = current.forward[0];

    if (current && current.key === key) {
      current.value = value; // обновление
      return;
    }

    const newLevel = this.#randomLevel();
    if (newLevel > this.#level) {
      for (let i = this.#level + 1; i <= newLevel; i++) update[i] = this.#head;
      this.#level = newLevel;
    }

    const newNode = new SkipListNode(key, value, newLevel);
    for (let i = 0; i <= newLevel; i++) {
      newNode.forward[i] = update[i].forward[i];
      update[i].forward[i] = newNode;
    }
    this.#size++;
  }

  search(key) {
    let current = this.#head;
    for (let i = this.#level; i >= 0; i--) {
      while (current.forward[i] && current.forward[i].key < key) {
        current = current.forward[i];
      }
    }
    current = current.forward[0];
    return current && current.key === key ? current.value : null;
  }

  // Range query: все элементы в [min, max] — O(log n + k)
  range(min, max) {
    const result = [];
    let current = this.#head;
    for (let i = this.#level; i >= 0; i--) {
      while (current.forward[i] && current.forward[i].key < min) {
        current = current.forward[i];
      }
    }
    current = current.forward[0];
    while (current && current.key <= max) {
      result.push({ key: current.key, value: current.value });
      current = current.forward[0];
    }
    return result;
  }

  get size() { return this.#size; }
}

// Пример: Redis ZSET — sorted set (score → member)
const leaderboard = new SkipList();
leaderboard.insert(1500, "Alice");
leaderboard.insert(2300, "Bob");
leaderboard.insert(1800, "Carol");
leaderboard.insert(900, "Dave");
leaderboard.insert(2100, "Eve");

console.log("Поиск score=1800:", leaderboard.search(1800)); // "Carol"
console.log("Топ игроки [1500..2300]:", leaderboard.range(1500, 2300));
// [{key:1500,value:"Alice"},{key:1800,value:"Carol"},{key:2100,value:"Eve"},{key:2300,value:"Bob"}]
console.log("Размер:", leaderboard.size); // 5
