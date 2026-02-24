# 05 · Browser APIs

[← JavaScript & DOM](../README.md)

---

## Содержание

1. [Web Storage (localStorage / sessionStorage)](#web-storage)
2. [IndexedDB](#indexeddb)
3. [History API](#history-api)
4. [URL & URLSearchParams](#url--urlsearchparams)
5. [Web Workers](#web-workers)
6. [BroadcastChannel](#broadcastchannel)
7. [Clipboard API](#clipboard-api)
8. [Вопросы на интервью](#вопросы-на-интервью)

---

## Web Storage

```javascript
// localStorage — постоянное хранилище (до явного удаления)
localStorage.setItem("key", "value");
localStorage.getItem("key");          // "value" | null
localStorage.removeItem("key");
localStorage.clear();
localStorage.length;                  // количество записей
localStorage.key(0);                  // ключ по индексу

// sessionStorage — только до закрытия вкладки
// API идентичен localStorage, но данные изолированы по вкладкам
sessionStorage.setItem("token", "abc");

// Важно: хранит только СТРОКИ
localStorage.setItem("num", 42);
typeof localStorage.getItem("num"); // "string"!

// Правильная работа с объектами:
const user = { name: "Alice", age: 30 };
localStorage.setItem("user", JSON.stringify(user));
const restored = JSON.parse(localStorage.getItem("user"));

// Типобезопасная обёртка
const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string) => localStorage.removeItem(key),
};

// storage event — синхронизация между вкладками
window.addEventListener("storage", (e) => {
  console.log(e.key);        // изменённый ключ
  console.log(e.oldValue);   // старое значение
  console.log(e.newValue);   // новое значение
  console.log(e.url);        // URL страницы которая изменила
  console.log(e.storageArea); // localStorage или sessionStorage
  // NB: событие НЕ срабатывает в той же вкладке что изменила!
});

// Ограничения:
// - ~5MB на origin (зависит от браузера)
// - Синхронный API — блокирует main thread при больших данных
// - Только same-origin
// - Нет индексации, нет транзакций → для структурированных данных: IndexedDB
```

---

## IndexedDB

Полноценная клиентская БД: асинхронная, транзакционная, поддерживает индексы.

```javascript
// Открытие БД
const request = indexedDB.open("MyDB", 1); // name, version

request.onupgradeneeded = (e) => {
  const db = e.target.result;

  // Создание хранилища (object store = таблица)
  const store = db.createObjectStore("users", {
    keyPath: "id",        // первичный ключ — поле объекта
    autoIncrement: false, // или true для автоинкремента
  });

  // Индексы для поиска
  store.createIndex("byEmail", "email", { unique: true });
  store.createIndex("byAge",   "age",   { unique: false });
};

request.onsuccess = (e) => {
  const db = e.target.result;

  // Запись
  const tx = db.transaction("users", "readwrite");
  const store = tx.objectStore("users");
  store.add({ id: 1, name: "Alice", email: "a@b.com", age: 30 });
  store.put({ id: 1, name: "Alice Updated", email: "a@b.com", age: 30 }); // upsert

  // Чтение по ключу
  const getReq = store.get(1);
  getReq.onsuccess = () => console.log(getReq.result);

  // Чтение по индексу
  const idx = store.index("byEmail");
  idx.get("a@b.com").onsuccess = (e) => console.log(e.target.result);

  // Cursor — итерация
  store.openCursor().onsuccess = function(e) {
    const cursor = e.target.result;
    if (cursor) {
      console.log(cursor.value);
      cursor.continue();
    }
  };

  tx.oncomplete = () => console.log("Transaction done");
  tx.onerror = (e) => console.error(e.target.error);
};

// Промис-обёртка (упрощённая)
function idbGet(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// На практике используй idb (Jakub Kulhan) или Dexie.js
// import { openDB } from "idb";
// const db = await openDB("MyDB", 1, { upgrade(db) { db.createObjectStore("users"); } });
// await db.put("users", { id: 1, name: "Alice" });
// const user = await db.get("users", 1);
```

---

## History API

```javascript
// Чтение текущего состояния
window.location.href;       // "https://example.com/page?q=1#hash"
window.location.pathname;   // "/page"
window.location.search;     // "?q=1"
window.location.hash;       // "#hash"
window.location.origin;     // "https://example.com"

// Навигация
window.location.href = "/new-page";     // переход (в history)
window.location.replace("/page");       // замена (НЕ в history — нельзя Back)
window.location.reload();               // перезагрузка

// History API — для SPA без перезагрузки страницы
history.pushState(state, title, url);   // добавить запись
history.replaceState(state, title, url); // заменить текущую
history.back();                          // назад
history.forward();                       // вперёд
history.go(-2);                          // на 2 шага назад
history.length;                          // количество записей в стеке

// state — произвольный объект (до 640KB в некоторых браузерах)
history.pushState({ userId: 42, scroll: 300 }, "", "/users/42");

// popstate — срабатывает при back/forward или history.go()
// НЕ срабатывает при pushState/replaceState!
window.addEventListener("popstate", (e) => {
  console.log("state:", e.state);
  renderPage(window.location.pathname);
});

// Простой SPA router
const Router = {
  routes: {},
  
  add(path, handler) {
    this.routes[path] = handler;
    return this;
  },

  navigate(path, state = {}) {
    history.pushState(state, "", path);
    this.dispatch(path, state);
  },

  dispatch(path, state) {
    const handler = this.routes[path] ?? this.routes["*"];
    handler?.(state);
  },

  init() {
    window.addEventListener("popstate", (e) => {
      this.dispatch(window.location.pathname, e.state);
    });
    this.dispatch(window.location.pathname, history.state);
  },
};

Router
  .add("/",       () => renderHome())
  .add("/about",  () => renderAbout())
  .add("*",       () => render404())
  .init();
```

---

## URL & URLSearchParams

```javascript
// URL — парсинг и построение URL
const url = new URL("https://example.com/search?q=hello&page=2#results");
url.protocol;   // "https:"
url.host;       // "example.com"
url.hostname;   // "example.com" (без порта)
url.port;       // "" (если стандартный)
url.pathname;   // "/search"
url.search;     // "?q=hello&page=2"
url.hash;       // "#results"
url.href;       // полный URL

// Изменение URL
url.searchParams.set("q", "world");
url.searchParams.append("filter", "new");
url.href; // "https://example.com/search?q=world&page=2&filter=new#results"

// URLSearchParams — работа с query string
const params = new URLSearchParams("q=hello&page=2&tag=js&tag=ts");
params.get("q");           // "hello"
params.getAll("tag");      // ["js", "ts"]
params.has("page");        // true
params.set("page", "3");
params.append("sort", "date");
params.delete("q");
params.toString();         // "page=3&tag=js&tag=ts&sort=date"

// Итерация
for (const [key, val] of params) { console.log(key, val); }
params.forEach((val, key) => {});
[...params.entries()]; // [["page","3"], ...]
[...params.keys()];
[...params.values()];

// Из объекта
const p = new URLSearchParams({ search: "hello", page: "1" });

// В роутере / API клиенте:
function buildUrl(base, path, query) {
  const url = new URL(path, base);
  Object.entries(query).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, v);
  });
  return url.href;
}

buildUrl("https://api.example.com", "/users", { page: 1, limit: 20, search: "alice" });
// "https://api.example.com/users?page=1&limit=20&search=alice"
```

---

## Web Workers

Выполнение тяжёлого JS в отдельном потоке без блокировки main thread.

```javascript
// main.js — создание worker
const worker = new Worker("worker.js");

// Отправка сообщения → worker
worker.postMessage({ type: "compute", data: [1, 2, 3, 4, 5] });

// Получение результата
worker.onmessage = (e) => {
  console.log("Результат от worker:", e.data);
};

worker.onerror = (e) => {
  console.error("Worker error:", e.message);
};

// Завершение worker
worker.terminate();

// worker.js — код в отдельном потоке
self.onmessage = (e) => {
  const { type, data } = e.data;
  if (type === "compute") {
    // Тяжёлая синхронная операция — не блокирует main thread
    const result = heavyComputation(data);
    self.postMessage({ type: "result", data: result });
  }
};

// Передача данных: structured clone (по умолчанию) vs Transferable
// Structured clone — копия (медленно для больших данных)
// Transferable — передача владения (нуль-копий!)

// Transferable пример:
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
worker.postMessage({ buffer }, [buffer]); // buffer ПЕРЕДАН worker'у
// buffer в main уже нет (detached)!

// Worker из Blob (inline worker без отдельного файла)
const code = `
  self.onmessage = (e) => {
    const result = e.data.reduce((a, b) => a + b, 0);
    self.postMessage(result);
  };
`;
const blob = new Blob([code], { type: "application/javascript" });
const inlineWorker = new Worker(URL.createObjectURL(blob));

// SharedWorker — один worker для нескольких вкладок
const shared = new SharedWorker("shared-worker.js");
shared.port.start();
shared.port.postMessage("hello");
shared.port.onmessage = (e) => console.log(e.data);

// ServiceWorker — перехват сетевых запросов (PWA, кэширование)
// navigator.serviceWorker.register("/sw.js")
// Отличается: жизненный цикл install/activate/fetch
```

---

## BroadcastChannel

Коммуникация между вкладками/воркерами одного origin.

```javascript
// Вкладка 1 — отправитель
const channel = new BroadcastChannel("app-channel");
channel.postMessage({ type: "auth", status: "logged-in", userId: 42 });

// Вкладка 2 — получатель (тот же channel name)
const ch2 = new BroadcastChannel("app-channel");
ch2.onmessage = (e) => {
  if (e.data.type === "auth" && e.data.status === "logged-in") {
    // Обновляем UI в этой вкладке
    updateAuthState(e.data.userId);
  }
};

ch2.close(); // закрыть канал

// Паттерн: синхронизация logout между вкладками
const authChannel = new BroadcastChannel("auth");

function logout() {
  clearUserData();
  authChannel.postMessage({ type: "logout" });
  // Эта вкладка уже разлогинилась,
  // сообщение получат все другие вкладки
}

authChannel.onmessage = (e) => {
  if (e.data.type === "logout") {
    clearUserData();
    redirectToLogin();
  }
};
```

---

## Clipboard API

```javascript
// Запись в буфер обмена (требует user gesture или Permission API)
await navigator.clipboard.writeText("Hello, World!");

await navigator.clipboard.write([
  new ClipboardItem({
    "text/plain": new Blob(["Hello"], { type: "text/plain" }),
    "text/html":  new Blob(["<b>Hello</b>"], { type: "text/html" }),
  }),
]);

// Чтение из буфера обмена
const text = await navigator.clipboard.readText();

const items = await navigator.clipboard.read();
for (const item of items) {
  for (const type of item.types) {
    const blob = await item.getType(type);
    if (type === "image/png") {
      const url = URL.createObjectURL(blob);
      img.src = url;
    }
  }
}

// Обработка paste event (без явного запроса Permission)
document.addEventListener("paste", async (e) => {
  const text = e.clipboardData.getData("text/plain");
  const files = [...e.clipboardData.files]; // вставленные файлы/изображения
  e.preventDefault();
});
```

---

## Вопросы на интервью

1. **localStorage vs sessionStorage vs IndexedDB vs cookie?**
   > `localStorage`: ~5MB, постоянно, синхронный, только строки, события между вкладками. `sessionStorage`: ~5MB, только текущая вкладка, не сохраняется. `IndexedDB`: гигабайты, асинхронный, транзакции, индексы, любые типы. `cookie`: ~4KB, отправляется с каждым HTTP-запросом, `HttpOnly`/`Secure`/`SameSite` атрибуты, доступен серверу.

2. **Для чего Web Worker и когда НЕ нужен?**
   > Worker для CPU-intensive задач: парсинг CSV/JSON, криптография, сжатие, сложные вычисления. Не нужен: запросы к API (асинхронные, не блокируют), простая обработка данных (JS V8 очень быстр). Ограничения: нет доступа к DOM, `window`, `document`. Коммуникация через `postMessage` — копирование данных.

3. **Как SPA управляет маршрутами без перезагрузки?**
   > `history.pushState(state, "", "/path")` меняет URL без запроса к серверу. Событие `popstate` срабатывает при back/forward — там рендеришь нужный компонент. При первом переходе и прямом URL нужен сервер который отдаёт `index.html` для всех маршрутов (catch-all).

4. **Structured clone vs Transferable в Web Workers?**
   > Structured clone: копирует данные (deep copy), оба потока имеют свою копию, медленно для больших буферов. Transferable: передаёт "владение" (zero-copy, AtomicsCopy), исходный `ArrayBuffer` становится detached — нет копирования. Для ImageData, AudioBuffer и других больших бинарных данных всегда Transferable.

5. **Как реализовать синхронизацию состояния между вкладками?**
   > `BroadcastChannel` — простой pub/sub между вкладками того же origin. `storage` event на `window` — срабатывает при изменении localStorage в ДРУГОЙ вкладке. `SharedWorker` — один воркер на несколько вкладок (сложнее, но мощнее). `SharedArrayBuffer` + `Atomics` — разделяемая память для Worker/SharedWorker.

---

## Пример

```
Открой в браузере:
04-javascript-dom/05-browser-apis/examples/browser-apis.html
```
