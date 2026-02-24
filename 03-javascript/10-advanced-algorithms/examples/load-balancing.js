// ─────────────────────────────────────────────
// Алгоритмы балансировки нагрузки
// node 03-javascript/10-advanced-algorithms/examples/load-balancing.js
// ─────────────────────────────────────────────

// ─── Round-Robin ──────────────────────────────
console.log("=== Round-Robin ===");

class RoundRobin {
  #servers;
  #index = 0;

  constructor(servers) { this.#servers = [...servers]; }

  next() {
    const server = this.#servers[this.#index];
    this.#index = (this.#index + 1) % this.#servers.length;
    return server;
  }

  addServer(s) { this.#servers.push(s); }
  removeServer(s) {
    const idx = this.#servers.indexOf(s);
    if (idx !== -1) {
      this.#servers.splice(idx, 1);
      this.#index = this.#index % this.#servers.length;
    }
  }
}

const rr = new RoundRobin(["server-1", "server-2", "server-3"]);
const rrDist = {};
for (let i = 0; i < 9; i++) {
  const s = rr.next();
  rrDist[s] = (rrDist[s] ?? 0) + 1;
}
console.log("Round-Robin distribution:", rrDist);
// { "server-1": 3, "server-2": 3, "server-3": 3 }

// ─── Weighted Round-Robin ─────────────────────
console.log("\n=== Weighted Round-Robin ===");

class WeightedRoundRobin {
  #servers;
  #weights;
  #current = 0;
  #currentWeight = 0;
  #maxWeight;
  #gcd;

  constructor(servers) {
    // servers: [{name, weight}]
    this.#servers = servers.map(s => s.name);
    this.#weights = servers.map(s => s.weight);
    this.#maxWeight = Math.max(...this.#weights);
    this.#gcd = this.#weights.reduce(gcd);
  }

  next() {
    const n = this.#servers.length;
    while (true) {
      this.#current = (this.#current + 1) % n;
      if (this.#current === 0) {
        this.#currentWeight -= this.#gcd;
        if (this.#currentWeight <= 0) this.#currentWeight = this.#maxWeight;
      }
      if (this.#weights[this.#current] >= this.#currentWeight) {
        return this.#servers[this.#current];
      }
    }
  }
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

const wrr = new WeightedRoundRobin([
  { name: "server-1", weight: 3 }, // получает 3 из 6 запросов
  { name: "server-2", weight: 2 }, // получает 2 из 6
  { name: "server-3", weight: 1 }, // получает 1 из 6
]);

const wrrDist = {};
for (let i = 0; i < 18; i++) {
  const s = wrr.next();
  wrrDist[s] = (wrrDist[s] ?? 0) + 1;
}
console.log("Weighted RR distribution:", wrrDist);
// { "server-1": ~9, "server-2": ~6, "server-3": ~3 }

// ─── Least Connections ─────────────────────────
console.log("\n=== Least Connections ===");

class LeastConnections {
  #servers; // Map: serverName → activeConnections

  constructor(serverNames) {
    this.#servers = new Map(serverNames.map(n => [n, 0]));
  }

  // Получить сервер с наименьшим числом соединений
  acquire() {
    let minConn = Infinity, chosen = null;
    for (const [server, conns] of this.#servers) {
      if (conns < minConn) { minConn = conns; chosen = server; }
    }
    this.#servers.set(chosen, this.#servers.get(chosen) + 1);
    return chosen;
  }

  release(server) {
    const curr = this.#servers.get(server) ?? 0;
    this.#servers.set(server, Math.max(0, curr - 1));
  }

  stats() { return Object.fromEntries(this.#servers); }
}

const lc = new LeastConnections(["s1", "s2", "s3"]);

// Симуляция: запросы с разным временем выполнения
const requests = [];
for (let i = 0; i < 10; i++) {
  const server = lc.acquire();
  requests.push(server);
  // Быстрые запросы освобождают сервер сразу
  if (i % 3 === 0) lc.release(server);
}
console.log("LC connections after 10 requests:", lc.stats());
console.log("Requests went to:", requests.join(", "));

// ─── Consistent Hashing ───────────────────────
console.log("\n=== Consistent Hashing ===");

// Простая хэш-функция (в реале используй murmurhash / fnv)
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % (2 ** 32);
}

class ConsistentHashing {
  #ring = new Map();         // hash → serverName
  #sortedHashes = [];        // отсортированные хэши
  #virtualNodes;

  constructor(virtualNodes = 150) {
    this.#virtualNodes = virtualNodes;
  }

  addServer(server) {
    for (let i = 0; i < this.#virtualNodes; i++) {
      const hash = hashCode(`${server}:vnode:${i}`);
      this.#ring.set(hash, server);
      this.#sortedHashes.push(hash);
    }
    this.#sortedHashes.sort((a, b) => a - b);
  }

  removeServer(server) {
    for (let i = 0; i < this.#virtualNodes; i++) {
      const hash = hashCode(`${server}:vnode:${i}`);
      this.#ring.delete(hash);
      const idx = this.#sortedHashes.indexOf(hash);
      if (idx !== -1) this.#sortedHashes.splice(idx, 1);
    }
  }

  // Найти ответственный сервер для ключа (первый по часовой стрелке)
  getServer(key) {
    if (this.#ring.size === 0) return null;
    const hash = hashCode(key);

    // Binary search: первый хэш >= hash
    let lo = 0, hi = this.#sortedHashes.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.#sortedHashes[mid] < hash) lo = mid + 1;
      else hi = mid;
    }

    // Если прошли по кругу — берём первый
    const targetHash = this.#sortedHashes[lo] >= hash
      ? this.#sortedHashes[lo]
      : this.#sortedHashes[0];

    return this.#ring.get(targetHash);
  }

  // Статистика распределения
  distribution(keys) {
    const dist = {};
    for (const key of keys) {
      const s = this.getServer(key);
      dist[s] = (dist[s] ?? 0) + 1;
    }
    return dist;
  }
}

const ch = new ConsistentHashing(150);
ch.addServer("node-1");
ch.addServer("node-2");
ch.addServer("node-3");

// 1000 тестовых ключей
const testKeys = Array.from({length: 1000}, (_, i) => `user:${i}`);
const dist3 = ch.distribution(testKeys);
console.log("Распределение по 3 серверам:", dist3);
// Должно быть ~333 на каждый

// Добавляем 4-й сервер — должны переехать ~250 ключей (1/4)
ch.addServer("node-4");
const dist4 = ch.distribution(testKeys);
console.log("После добавления node-4:", dist4);

// Считаем сколько ключей переехало
let moved = 0;
for (const key of testKeys) {
  ch.removeServer("node-4"); const before = ch.getServer(key); ch.addServer("node-4");
  const after = ch.getServer(key);
  if (before !== after) moved++;
}
console.log(`Переехало ключей: ${moved}/1000 (~${(moved/10).toFixed(1)}%)`);
// Должно быть ~25% — это главное преимущество Consistent Hashing!
