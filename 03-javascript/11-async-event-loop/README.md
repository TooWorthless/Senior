# 11 · Асинхронность и Event Loop

[← JavaScript](../README.md)

JavaScript — **однопоточный**, но **неблокирующий**. Event Loop — это механизм который делает это возможным.

---

## Содержание

1. [Архитектура: Call Stack, Heap, Queues](#архитектура)
2. [Event Loop — алгоритм](#event-loop-алгоритм)
3. [Macrotask vs Microtask](#macrotask-vs-microtask)
4. [Promise — внутренности](#promise-внутренности)
5. [async / await — desugaring](#async--await)
6. [Generators и итераторы](#generators)
7. [Node.js специфика: nextTick, setImmediate, libuv](#nodejs-специфика)
8. [Паттерны и антипаттерны](#паттерны)
9. [Вопросы на интервью](#вопросы-на-интервью)

```bash
node 03-javascript/11-async-event-loop/examples/event-loop.js
node 03-javascript/11-async-event-loop/examples/promises.js
node 03-javascript/11-async-event-loop/examples/async-patterns.js
node 03-javascript/11-async-event-loop/examples/generators.js
```

---

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    JS Engine (V8)                        │
│                                                          │
│  ┌─────────────┐   ┌─────────────────────────────────┐  │
│  │  Call Stack │   │           Memory Heap            │  │
│  │             │   │  (объекты, замыкания, функции)   │  │
│  │  [frame 3]  │   │                                  │  │
│  │  [frame 2]  │   └─────────────────────────────────┘  │
│  │  [frame 1]  │                                         │
│  └─────────────┘                                         │
└─────────────────────────────────────────────────────────┘
          ↕ (Web API / Node.js API)
┌─────────────────────────────────────────────────────────┐
│              Node.js / Browser Runtime                    │
│                                                          │
│  setTimeout, setInterval, fetch, fs.readFile, ...        │
│  (выполняются вне Call Stack — в libuv / browser C++)    │
└─────────────────────────────────────────────────────────┘
          ↕
┌────────────────────┐   ┌────────────────────┐
│  Microtask Queue   │   │   Macrotask Queue  │
│  (приоритет выше)  │   │   (Task Queue)     │
│                    │   │                    │
│  • Promise.then    │   │  • setTimeout      │
│  • queueMicrotask  │   │  • setInterval     │
│  • MutationObserver│   │  • setImmediate     │
│  • process.nextTick│   │  • I/O callbacks   │
│    (Node, выше всех│   │  • UI rendering    │
│    микрозадач!)    │   │                    │
└────────────────────┘   └────────────────────┘
```

---

## Event Loop — алгоритм

```
while (true) {
  // 1. Выполняем текущий macrotask (или скрипт при старте)
  executeMacrotask();

  // 2. Очищаем ВСЮ очередь microtasks (до последней!)
  while (microtaskQueue.length > 0) {
    executeMicrotask();
    // Новые microtasks добавленные во время выполнения — тоже выполняются!
  }

  // 3. Rendering (browser: если нужно)
  // 4. Берём следующий macrotask
}
```

**Ключевые правила:**
1. **Microtasks вычищаются полностью** перед следующим macrotask
2. **Один macrotask за итерацию** Event Loop
3. **Бесконечный цикл microtasks** заблокирует Event Loop навсегда

```javascript
// Порядок выполнения — классический вопрос на интервью
console.log("1");                              // sync

setTimeout(() => console.log("2"), 0);        // macrotask

Promise.resolve()
  .then(() => console.log("3"))               // microtask
  .then(() => console.log("4"));              // microtask (добавляется когда "3" выполнен)

console.log("5");                              // sync

// Вывод: 1, 5, 3, 4, 2
```

---

## Macrotask vs Microtask

### Macrotasks (Tasks)
```javascript
setTimeout(fn, delay)     // не раньше чем через delay мс, не точно
setInterval(fn, delay)    // повторяется с интервалом
setImmediate(fn)          // Node.js: после I/O callbacks
MessageChannel            // postMessage
I/O callbacks             // Node.js: fs, net, ...
```

### Microtasks
```javascript
Promise.then/catch/finally   // самые частые
queueMicrotask(fn)           // явная постановка в очередь
MutationObserver (browser)
process.nextTick(fn)         // Node.js: ДО остальных microtasks!
```

```javascript
// process.nextTick имеет наивысший приоритет в Node.js
process.nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("Promise"));
setImmediate(() => console.log("setImmediate"));
setTimeout(() => console.log("setTimeout"), 0);

// Вывод в Node.js:
// nextTick (nextTick queue — раньше microtasks!)
// Promise
// setTimeout (или setImmediate — порядок зависит от I/O phase)
// setImmediate
```

---

## Promise — внутренности

```javascript
// Три состояния: pending → fulfilled | rejected
// Переход — одноразовый и необратимый

// Упрощённая внутренняя реализация:
class MyPromise {
  #state = "pending";
  #value;
  #callbacks = []; // { onFulfilled, onRejected, resolve, reject }

  constructor(executor) {
    const resolve = (value) => {
      if (this.#state !== "pending") return;
      this.#state = "fulfilled";
      this.#value = value;
      // Callbacks выполняются АСИНХРОННО (microtask!)
      queueMicrotask(() => this.#callbacks.forEach(cb => cb.onFulfilled?.(value)));
    };
    const reject = (reason) => { /* аналогично */ };
    try { executor(resolve, reject); } catch(e) { reject(e); }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this.#callbacks.push({
        onFulfilled: v => { try { resolve(onFulfilled(v)); } catch(e) { reject(e); } },
        onRejected:  r => { try { resolve(onRejected?.(r)); } catch(e) { reject(e); } },
      });
    });
  }
}

// Promise.all, race, allSettled, any
Promise.all([p1, p2, p3]);       // rejected если хоть один rejected
Promise.allSettled([p1, p2, p3]);// всегда fulfilled, массив {status,value|reason}
Promise.race([p1, p2, p3]);      // первый завершившийся (fulfilled или rejected)
Promise.any([p1, p2, p3]);       // первый fulfilled, AggregateError если все rejected
```

---

## async / await

`async/await` — синтаксический сахар над Promise + generator.

```javascript
// async функция ВСЕГДА возвращает Promise
async function fetchUser(id) {
  const user = await fetch(`/api/users/${id}`); // await = .then() + приостановка
  return user.json();
}

// Эквивалентный код на Promise:
function fetchUser(id) {
  return fetch(`/api/users/${id}`).then(user => user.json());
}

// Desugaring (примерно):
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    fetch(`/api/users/${id}`)
      .then(user => resolve(user.json()))
      .catch(reject);
  });
}

// await внутри приостанавливает функцию, но НЕ блокирует Event Loop!
// Под капотом — это generator.next() + обёртка в Promise
```

### Распространённые ошибки

```javascript
// ❌ Забыть await
async function wrong() {
  const data = fetchData(); // не ждём! data = Promise, не значение
  console.log(data.result); // undefined
}

// ❌ Последовательно там где можно параллельно
async function slow() {
  const a = await fetchA(); // 500ms
  const b = await fetchB(); // ещё 500ms → итого 1000ms
  return [a, b];
}

// ✅ Параллельно
async function fast() {
  const [a, b] = await Promise.all([fetchA(), fetchB()]); // 500ms
  return [a, b];
}

// ❌ forEach + async
async function wrongForEach() {
  items.forEach(async item => { // forEach не ждёт async callbacks!
    await process(item);
  });
  // здесь обработка ещё идёт!
}

// ✅ for...of + await
async function correctForOf() {
  for (const item of items) {
    await process(item); // последовательно
  }
}

// ✅ или параллельно
async function parallelAll() {
  await Promise.all(items.map(item => process(item)));
}
```

---

## Generators

```javascript
// function* — создаёт генератор (итератор)
// yield — возвращает значение и приостанавливает
// .next(val) — возобновляет, передаёт val как результат yield

function* counter(start = 0) {
  while (true) {
    const reset = yield start++;
    if (reset) start = 0;
  }
}

const gen = counter(10);
gen.next();       // { value: 10, done: false }
gen.next();       // { value: 11, done: false }
gen.next(true);   // { value: 0, done: false }  ← reset!

// Generators + async: корни async/await
function* asyncGenerator() {
  const data = yield fetch("/api/data");   // yield Promise
  console.log(data);                        // значение когда Promise resolved
}

// Именно так работает async/await под капотом:
// - генератор приостанавливается на yield
// - runtime awaits Promise
// - вызывает .next(resolvedValue)
```

---

## Node.js специфика

```
Node.js Event Loop фазы (libuv):

   ┌──────────────────────────────────────────────────┐
   │                   timers                          │
   │          (setTimeout, setInterval callbacks)       │
   └──────────────────┬───────────────────────────────┘
                      │
   ┌──────────────────▼───────────────────────────────┐
   │             pending callbacks                     │
   │          (I/O errors из предыдущего цикла)        │
   └──────────────────┬───────────────────────────────┘
                      │
   ┌──────────────────▼───────────────────────────────┐
   │                idle, prepare                      │
   └──────────────────┬───────────────────────────────┘
                      │
   ┌──────────────────▼───────────────────────────────┐
   │                   poll                            │
   │          (новые I/O events, блокирует если нет)   │
   └──────────────────┬───────────────────────────────┘
                      │
   ┌──────────────────▼───────────────────────────────┐
   │                  check                            │
   │          (setImmediate callbacks)                  │
   └──────────────────┬───────────────────────────────┘
                      │
   ┌──────────────────▼───────────────────────────────┐
   │             close callbacks                       │
   │          (socket.on('close', ...))                │
   └──────────────────┬───────────────────────────────┘
                      │
      После КАЖДОЙ ФАЗЫ: nextTick queue → microtask queue
```

---

## Паттерны

```javascript
// Timeout + Promise
function withTimeout(promise, ms) {
  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(`Timeout: ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
}

// Retry с экспоненциальным backoff
async function withRetry(fn, { retries = 3, delay = 1000, factor = 2 } = {}) {
  let attempt = 0;
  while (true) {
    try { return await fn(); }
    catch (err) {
      if (++attempt >= retries) throw err;
      await sleep(delay * factor ** (attempt - 1));
    }
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Concurrency limiting (не запустить более N параллельных)
async function limitedConcurrency(tasks, limit) {
  const results = [];
  const running = new Set();
  for (const [i, task] of tasks.entries()) {
    const promise = task().then(r => { results[i] = r; running.delete(promise); });
    running.add(promise);
    if (running.size >= limit) await Promise.race(running);
  }
  await Promise.all(running);
  return results;
}
```

---

## Вопросы на интервью

1. **Что такое Event Loop и как он работает?**
   > Event Loop — бесконечный цикл, который: 1) берёт macrotask из очереди, 2) выполняет его через Call Stack, 3) после выполнения очищает ВСЮ очередь microtasks, 4) (browser) рендерит если нужно, 5) переходит к следующему macrotask.

2. **Какой порядок: setTimeout(0), Promise.resolve().then, queueMicrotask, process.nextTick?**
   > Node.js: nextTick (nextTick queue) → Promise/queueMicrotask (microtask queue) → setTimeout (macrotask). Browser: Promise/queueMicrotask → setTimeout.

3. **Почему `await` не блокирует Event Loop?**
   > `await` приостанавливает только текущую async функцию (как generator yield), не поток. Остаток функции помещается в microtask queue как callback Promise. Event Loop продолжает работать, обрабатывает другие задачи.

4. **Почему `forEach` + `async/await` не работает?**
   > `forEach` вызывает callback синхронно и не ожидает возвращённый Promise. Все callback запускаются параллельно без awaiting. Используй `for...of` для последовательного или `Promise.all(arr.map())` для параллельного.

5. **Разница `Promise.all` vs `Promise.allSettled` vs `Promise.any` vs `Promise.race`?**
   > `all`: fulfilled когда все fulfilled, rejected при первой ошибке. `allSettled`: всегда fulfilled, массив {status, value/reason} — для независимых операций. `race`: первый завершившийся (fulfilled или rejected). `any`: первый успешный, AggregateError если все rejected.

---
