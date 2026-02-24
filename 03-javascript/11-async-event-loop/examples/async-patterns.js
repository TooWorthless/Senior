// ─────────────────────────────────────────────
// async/await: паттерны, антипаттерны, продвинутые техники
// node 03-javascript/11-async-event-loop/examples/async-patterns.js
// ─────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fetchMock = (id, ms = 100) => sleep(ms).then(() => ({ id, data: `item-${id}` }));
const fetchFail = (id) => sleep(50).then(() => { throw new Error(`fail-${id}`); });

// ─── Последовательно vs Параллельно ──────────
console.log("=== Sequential vs Parallel ===");

(async () => {
  // ❌ Последовательно (когда можно параллельно)
  const t0 = Date.now();
  const a = await fetchMock(1, 100);
  const b = await fetchMock(2, 100);
  const c = await fetchMock(3, 100);
  console.log(`Sequential: ${Date.now()-t0}ms (~300ms)`); // ~300ms

  // ✅ Параллельно через Promise.all
  const t1 = Date.now();
  const [x, y, z] = await Promise.all([
    fetchMock(1, 100),
    fetchMock(2, 100),
    fetchMock(3, 100),
  ]);
  console.log(`Parallel: ${Date.now()-t1}ms (~100ms)`); // ~100ms

  // ✅ Запустить вместе, await позже
  const t2 = Date.now();
  const p1 = fetchMock(1, 100); // старт немедленно
  const p2 = fetchMock(2, 150); // старт немедленно
  const r1 = await p1;          // ждём
  const r2 = await p2;          // уже почти готов
  console.log(`Staggered await: ${Date.now()-t2}ms (~150ms)`);
})();

// ─── for...of vs forEach + async ─────────────
setTimeout(async () => {
  console.log("\n=== forEach vs for...of ===");
  const ids = [1, 2, 3];

  // ❌ forEach не ждёт async callbacks
  const results1 = [];
  ids.forEach(async id => {
    await sleep(50);
    results1.push(id);
  });
  await sleep(10); // слишком мало — forEach уже запустил все, но не ждёт
  console.log("forEach results (до выполнения):", results1); // []

  await sleep(100); // теперь все выполнились
  console.log("forEach results (после):", results1); // [1,2,3] (но порядок непредсказуем)

  // ✅ for...of — последовательно
  const results2 = [];
  for (const id of ids) {
    await sleep(20);
    results2.push(id);
  }
  console.log("for..of sequential:", results2); // [1, 2, 3]

  // ✅ Promise.all — параллельно
  const results3 = await Promise.all(
    ids.map(async id => { await sleep(20); return id; })
  );
  console.log("Promise.all parallel:", results3); // [1, 2, 3]
}, 500);

// ─── Error handling ───────────────────────────
setTimeout(async () => {
  console.log("\n=== Error handling ===");

  // ✅ try/catch для одиночного вызова
  try {
    await fetchFail(1);
  } catch(e) {
    console.log("caught:", e.message);
  }

  // ✅ try/catch для Promise.all (одна ошибка отменяет всё)
  try {
    await Promise.all([fetchMock(1), fetchFail(2), fetchMock(3)]);
  } catch(e) {
    console.log("all failed:", e.message);
  }

  // ✅ allSettled — продолжаем даже если часть провалилась
  const results = await Promise.allSettled([
    fetchMock(1), fetchFail(2), fetchMock(3)
  ]);
  results.forEach((r, i) => {
    if (r.status === "fulfilled") console.log(`  #${i+1} ok:`, r.value.data);
    else console.log(`  #${i+1} fail:`, r.reason.message);
  });

  // Паттерн: обернуть в [error, result]
  async function safeAsync(promise) {
    try { return [null, await promise]; }
    catch(e) { return [e, null]; }
  }

  const [err, data] = await safeAsync(fetchFail(99));
  console.log("safeAsync err:", err?.message, "data:", data);
}, 1000);

// ─── Concurrency Control ──────────────────────
setTimeout(async () => {
  console.log("\n=== Concurrency Limiter ===");

  // Запускаем не более N промисов одновременно
  async function withConcurrency(tasks, concurrency) {
    const results = new Array(tasks.length);
    const executing = new Set();
    let idx = 0;

    async function runNext() {
      if (idx >= tasks.length) return;
      const i = idx++;
      const promise = tasks[i]().then(r => {
        results[i] = r;
        executing.delete(promise);
      });
      executing.add(promise);
      if (executing.size >= concurrency) await Promise.race(executing);
      await runNext(); // рекурсивно берём следующую
    }

    const starters = [];
    for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
      starters.push(runNext());
    }
    await Promise.all(starters);
    await Promise.all(executing);
    return results;
  }

  const tasks = Array.from({length:10}, (_, i) => () => fetchMock(i, 100));

  const t0 = Date.now();
  const res = await withConcurrency(tasks, 3); // не более 3 параллельно
  console.log(`10 tasks, concurrency=3: ${Date.now()-t0}ms (~400ms)`);
  // 10 задач по 100ms с лимитом 3 → Math.ceil(10/3) ≈ 4 батча → ~400ms
  console.log("results count:", res.length);
}, 1500);

// ─── Timeout wrapper ──────────────────────────
setTimeout(async () => {
  console.log("\n=== withTimeout ===");

  function withTimeout(promise, ms, message = `Timeout after ${ms}ms`) {
    let timerId;
    const timeout = new Promise((_, reject) => {
      timerId = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
  }

  // Успех за 50ms, timeout 200ms
  try {
    const result = await withTimeout(fetchMock(1, 50), 200);
    console.log("withTimeout success:", result.data);
  } catch(e) {
    console.log("withTimeout failed:", e.message);
  }

  // Timeout: операция 500ms, лимит 100ms
  try {
    const result = await withTimeout(fetchMock(1, 500), 100);
    console.log("should not reach");
  } catch(e) {
    console.log("withTimeout expired:", e.message);
  }
}, 2000);

// ─── Retry с backoff ──────────────────────────
setTimeout(async () => {
  console.log("\n=== Retry с exponential backoff ===");

  async function withRetry(fn, options = {}) {
    const { retries = 3, delay = 100, factor = 2, onRetry } = options;
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn(attempt);
      } catch(err) {
        lastError = err;
        if (attempt < retries) {
          const waitMs = delay * factor ** attempt;
          onRetry?.(err, attempt + 1, waitMs);
          await sleep(waitMs);
        }
      }
    }
    throw lastError;
  }

  let callCount = 0;
  const unreliable = async () => {
    callCount++;
    if (callCount < 3) throw new Error(`attempt ${callCount} failed`);
    return `success on attempt ${callCount}`;
  };

  try {
    const result = await withRetry(unreliable, {
      retries: 4,
      delay: 10,
      factor: 2,
      onRetry: (err, n, ms) => console.log(`  Retry #${n} in ${ms}ms: ${err.message}`),
    });
    console.log("withRetry result:", result);
  } catch(e) {
    console.log("withRetry failed:", e.message);
  }
}, 2300);
