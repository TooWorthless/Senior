// ─────────────────────────────────────────────
// Promise: внутренности, методы, паттерны
// node 03-javascript/11-async-event-loop/examples/promises.js
// ─────────────────────────────────────────────

// ─── Ручная реализация Promise ────────────────
console.log("=== Реализация Promise ===");

class MyPromise {
  #state = "pending";  // pending | fulfilled | rejected
  #value;
  #handlers = [];      // {onFulfilled, onRejected, resolve, reject}

  constructor(executor) {
    const resolve = (value) => {
      if (this.#state !== "pending") return;
      // Если value — тоже Promise, ждём его
      if (value instanceof MyPromise) {
        value.then(resolve, reject);
        return;
      }
      this.#state = "fulfilled";
      this.#value = value;
      queueMicrotask(() => this.#notify());
    };
    const reject = (reason) => {
      if (this.#state !== "pending") return;
      this.#state = "rejected";
      this.#value = reason;
      queueMicrotask(() => this.#notify());
    };
    try { executor(resolve, reject); }
    catch(e) { reject(e); }
  }

  #notify() {
    for (const { onFulfilled, onRejected, resolve, reject } of this.#handlers) {
      if (this.#state === "fulfilled") {
        if (typeof onFulfilled === "function") {
          try { resolve(onFulfilled(this.#value)); }
          catch(e) { reject(e); }
        } else {
          resolve(this.#value); // pass-through
        }
      } else {
        if (typeof onRejected === "function") {
          try { resolve(onRejected(this.#value)); }
          catch(e) { reject(e); }
        } else {
          reject(this.#value); // propagate rejection
        }
      }
    }
    this.#handlers = [];
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handler = { onFulfilled, onRejected, resolve, reject };
      if (this.#state === "pending") {
        this.#handlers.push(handler);
      } else {
        queueMicrotask(() => {
          this.#handlers.push(handler);
          this.#notify();
        });
      }
    });
  }

  catch(onRejected) { return this.then(undefined, onRejected); }

  finally(fn) {
    return this.then(
      value => MyPromise.resolve(fn()).then(() => value),
      reason => MyPromise.resolve(fn()).then(() => { throw reason; })
    );
  }

  static resolve(value) { return new MyPromise(resolve => resolve(value)); }
  static reject(reason) { return new MyPromise((_, reject) => reject(reason)); }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = new Array(promises.length);
      let remaining = promises.length;
      if (remaining === 0) { resolve(results); return; }
      promises.forEach((p, i) => {
        MyPromise.resolve(p).then(v => {
          results[i] = v;
          if (--remaining === 0) resolve(results);
        }, reject);
      });
    });
  }
}

// Тест
const p1 = new MyPromise((resolve) => setTimeout(() => resolve("A"), 10));
const p2 = new MyPromise((resolve) => setTimeout(() => resolve("B"), 20));
const p3 = new MyPromise((resolve, reject) => setTimeout(() => reject("C failed"), 15));

p1.then(v => console.log("p1:", v));
p2.then(v => console.log("p2:", v));
p3.catch(e => console.log("p3 catch:", e));

MyPromise.all([p1, p2]).then(([a, b]) => console.log("all:", a, b));

// ─── Promise методы ───────────────────────────
console.log("\n=== Promise.all / allSettled / race / any ===");

const slow = (label, ms, fail = false) => new Promise((resolve, reject) => {
  setTimeout(fail ? () => reject(new Error(label)) : () => resolve(label), ms);
});

// all: ждёт всех, отваливается на первой ошибке
Promise.all([slow("A",100), slow("B",200), slow("C",50)])
  .then(r => console.log("all success:", r))
  .catch(e => console.log("all fail:", e.message));

Promise.all([slow("A",100), slow("B",200), slow("C",50,true)])
  .then(r => console.log("all should not reach"))
  .catch(e => console.log("all with error:", e.message)); // "C"

// allSettled: всегда успешен, отдаёт все результаты
Promise.allSettled([slow("X",100), slow("Y",200,true), slow("Z",50)])
  .then(results => results.forEach(r =>
    console.log("allSettled:", r.status, r.value ?? r.reason?.message)
  ));

// race: первый кто завершился (success OR error)
Promise.race([slow("fast",50), slow("slow",200)])
  .then(r => console.log("race winner:", r));

// any: первый SUCCESS, AggregateError если все провалились
Promise.any([slow("A",100,true), slow("B",50), slow("C",200)])
  .then(r => console.log("any first success:", r));

Promise.any([slow("A",100,true), slow("B",50,true)])
  .catch(e => console.log("any all failed:", e.constructor.name)); // AggregateError

// ─── Promise chaining vs nesting ─────────────
setTimeout(() => {
  console.log("\n=== Chaining vs Nesting ===");

  const fetchUser = (id) => Promise.resolve({ id, name: "Alice" });
  const fetchPosts = (user) => Promise.resolve([{ id: 1, title: "Post 1", userId: user.id }]);
  const fetchComments = (post) => Promise.resolve([{ id: 1, text: "Nice!" }]);

  // ❌ Promise hell (callback hell с Promise)
  fetchUser(1).then(user => {
    fetchPosts(user).then(posts => {
      fetchComments(posts[0]).then(comments => {
        // глубокая вложенность — плохо
      });
    });
  });

  // ✅ Chaining
  fetchUser(1)
    .then(user => fetchPosts(user))
    .then(posts => fetchComments(posts[0]))
    .then(comments => console.log("chained:", comments[0].text));

  // ✅ async/await (лучше всего читается)
  (async () => {
    const user = await fetchUser(1);
    const posts = await fetchPosts(user);
    const comments = await fetchComments(posts[0]);
    console.log("async/await:", comments[0].text);
  })();
}, 500);

// ─── Промисификация callback-функций ─────────
setTimeout(() => {
  console.log("\n=== Promisify ===");

  // Стандарт Node.js: callback(error, result)
  function callbackFn(data, callback) {
    setTimeout(() => {
      if (!data) callback(new Error("no data"));
      else callback(null, `processed: ${data}`);
    }, 10);
  }

  function promisify(fn) {
    return function(...args) {
      return new Promise((resolve, reject) => {
        fn(...args, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };
  }

  const promisifiedFn = promisify(callbackFn);
  promisifiedFn("hello").then(r => console.log("promisify:", r));
  promisifiedFn(null).catch(e => console.log("promisify error:", e.message));

  // Node.js util.promisify делает то же самое
  // const { promisify } = require("util");
  // const readFile = promisify(fs.readFile);
}, 600);
