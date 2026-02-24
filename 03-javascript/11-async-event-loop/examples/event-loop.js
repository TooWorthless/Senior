// ─────────────────────────────────────────────
// Event Loop: порядок выполнения, microtask vs macrotask
// node 03-javascript/11-async-event-loop/examples/event-loop.js
// ─────────────────────────────────────────────

// ─── Классический вопрос ─────────────────────
console.log("=== Порядок выполнения #1 ===");

console.log("1: sync start");

setTimeout(() => console.log("2: setTimeout 0"), 0);        // macrotask

Promise.resolve()
  .then(() => console.log("3: Promise.then"))               // microtask
  .then(() => console.log("4: Promise.then chained"));      // microtask после 3

queueMicrotask(() => console.log("5: queueMicrotask"));    // microtask

console.log("6: sync end");

// Ожидаемый вывод:
// 1: sync start
// 6: sync end
// 3: Promise.then     ← microtask
// 5: queueMicrotask   ← microtask
// 4: Promise.then chained ← microtask (добавлен когда "3" завершился)
// 2: setTimeout 0     ← macrotask

// ─── Демо: microtasks очищаются ВСЕ перед macrotask ─
setTimeout(() => {
  console.log("\n=== Порядок выполнения #2 ===");

  setTimeout(() => console.log("macro-2"), 0);

  Promise.resolve()
    .then(() => {
      console.log("micro-1");
      Promise.resolve().then(() => console.log("micro-3")); // добавлено во время microtask
    })
    .then(() => console.log("micro-2"));

  // Вывод:
  // micro-1
  // micro-2
  // micro-3  ← добавленный во время выполнения microtasks тоже выполнится ДО macro-2!
  // macro-2
}, 100);

// ─── process.nextTick vs Promise (Node.js) ───
setTimeout(() => {
  console.log("\n=== process.nextTick vs Promise ===");

  process.nextTick(() => console.log("nextTick 1"));
  process.nextTick(() => console.log("nextTick 2"));
  Promise.resolve().then(() => console.log("Promise 1"));
  Promise.resolve().then(() => console.log("Promise 2"));
  process.nextTick(() => console.log("nextTick 3")); // позже, но nextTick queue первая

  // Вывод:
  // nextTick 1
  // nextTick 2
  // nextTick 3  ← все nextTick сначала (nextTick queue)
  // Promise 1
  // Promise 2   ← затем microtasks
}, 200);

// ─── Бесконечные microtasks — блокировка ─────
// ДЕМОНСТРАЦИЯ: НЕ ЗАПУСКАЙ этот код в реальном приложении!
// setTimeout(() => {
//   function forever() {
//     return Promise.resolve().then(forever); // microtask добавляет microtask
//   }
//   forever(); // Event Loop заблокирован навсегда!
// }, 300);

// ─── setTimeout(0) — не значит "сразу" ───────
setTimeout(() => {
  console.log("\n=== setTimeout(0) задержка ===");

  const start = Date.now();
  for (let i = 0; i < 1_000_000; i++) { /* тяжёлая работа */ }
  const syncTime = Date.now() - start;

  const t0 = Date.now();
  setTimeout(() => {
    console.log(`setTimeout(0) реально выполнился через ~${Date.now() - t0}ms`);
    // Не 0ms! Минимум 1ms в browsers, зависит от нагрузки
  }, 0);

  console.log(`Синхронная работа заняла: ${syncTime}ms`);
}, 300);

// ─── Starvation: setTimeout задерживается при microtask storm ─
setTimeout(() => {
  console.log("\n=== Microtask storm (starvation) ===");
  let macroFired = false;

  setTimeout(() => {
    macroFired = true;
    console.log("setTimeout выполнился");
  }, 0);

  // 100 microtask'ов — setTimeout ждёт
  let chain = Promise.resolve();
  for (let i = 0; i < 100; i++) {
    chain = chain.then(() => {
      // ничего не делаем, просто добавляем microtask
    });
  }
  chain.then(() => console.log("После 100 microtasks, macroFired =", macroFired));
  // macroFired = false — setTimeout ещё не выполнился!
}, 500);

// ─── Разница: sync throw vs async throw ──────
setTimeout(() => {
  console.log("\n=== Sync vs Async throw ===");

  // Глобальные handlers — ставим ДО демонстрации
  process.once("uncaughtException", (e) => {
    console.log("uncaughtException поймал:", e.message);
  });
  process.on("unhandledRejection", (reason) => {
    console.log("Unhandled rejection:", reason.message);
  });

  // Sync: try/catch работает
  try {
    throw new Error("sync error");
  } catch(e) {
    console.log("Поймали sync:", e.message);
  }

  // Async: try/catch НЕ поймает (выброс в другой итерации Event Loop)
  try {
    setTimeout(() => {
      throw new Error("async error"); // try/catch не работает! → uncaughtException
    }, 0);
  } catch(e) {
    console.log("Это не выполнится:", e.message);
  }

  // Promise rejection: нельзя поймать sync try/catch
  try {
    Promise.reject(new Error("promise rejection")); // → unhandledRejection
  } catch(e) {
    console.log("Это не выполнится для Promise");
  }

  // Правильный способ для Promise:
  Promise.reject(new Error("caught rejection"))
    .catch(e => console.log("Поймали .catch():", e.message));
}, 600);
