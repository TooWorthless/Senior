# 02 · WebSocket Patterns

[← WebSockets / WebRTC](../README.md)

---

## Содержание

1. [Reconnection с exponential backoff](#reconnection)
2. [Heartbeat / Keep-alive](#heartbeat)
3. [Message queuing](#message-queuing)
4. [Backpressure](#backpressure)
5. [Typed message protocol](#typed-message-protocol)
6. [Binary данные — протоколы](#binary-данные)
7. [Node.js сервер — полная реализация](#nodejs-сервер)
8. [Вопросы на интервью](#вопросы-на-интервью)

---

## Reconnection

```javascript
class ReconnectingWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.protocols = options.protocols ?? [];

    // Backoff настройки
    this.minDelay     = options.minDelay  ?? 1_000;   // 1s
    this.maxDelay     = options.maxDelay  ?? 30_000;  // 30s
    this.maxRetries   = options.maxRetries ?? Infinity;
    this.multiplier   = options.multiplier ?? 2;
    this.jitter       = options.jitter    ?? 0.2;     // ±20%

    this._retries     = 0;
    this._delay       = this.minDelay;
    this._ws          = null;
    this._shouldClose = false; // явное закрытие пользователем
    this._queue       = [];    // сообщения пока нет соединения

    // Публичные обработчики
    this.onopen    = null;
    this.onmessage = null;
    this.onclose   = null;
    this.onerror   = null;
    this.onreconnect = null;

    this._connect();
  }

  _connect() {
    this._ws = new WebSocket(this.url, this.protocols);
    this._ws.binaryType = "arraybuffer";

    this._ws.onopen = (e) => {
      console.log(`Connected (attempt ${this._retries + 1})`);
      this._retries = 0;
      this._delay   = this.minDelay;

      // Дренируем очередь сообщений
      while (this._queue.length) {
        this._ws.send(this._queue.shift());
      }

      this.onopen?.(e);
    };

    this._ws.onmessage = (e) => this.onmessage?.(e);
    this._ws.onerror   = (e) => this.onerror?.(e);

    this._ws.onclose = (e) => {
      this.onclose?.(e);

      if (this._shouldClose) return; // пользователь закрыл намеренно

      if (e.code === 1008 || e.code === 4001) {
        // Policy violation / Unauthorized — не переподключаемся
        console.error("Will not reconnect:", e.code, e.reason);
        return;
      }

      if (this._retries >= this.maxRetries) {
        console.error("Max retries reached");
        return;
      }

      this._scheduleReconnect();
    };
  }

  _scheduleReconnect() {
    this._retries++;
    // Exponential backoff с jitter
    const base = Math.min(this._delay * this.multiplier, this.maxDelay);
    const jitterRange = base * this.jitter;
    const delay = base + (Math.random() * 2 - 1) * jitterRange;
    this._delay = base;

    console.log(`Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this._retries})...`);
    this.onreconnect?.({ attempt: this._retries, delay });

    setTimeout(() => this._connect(), delay);
  }

  send(data) {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(data);
    } else {
      // Буферизуем до переподключения
      this._queue.push(data);
    }
  }

  close(code = 1000, reason = "") {
    this._shouldClose = true;
    this._ws?.close(code, reason);
  }

  get readyState() {
    return this._ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Использование
const ws = new ReconnectingWebSocket("wss://api.example.com/ws", {
  minDelay: 1000,
  maxDelay: 30000,
  maxRetries: 10,
});

ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
ws.onreconnect = ({ attempt, delay }) => {
  showNotification(`Переподключение #${attempt} через ${(delay/1000).toFixed(0)}s...`);
};
ws.send(JSON.stringify({ type: "subscribe", channel: "prices" })); // отправится после connect
```

---

## Heartbeat

Проблема: NAT и прокси могут разрывать "тихие" TCP-соединения через несколько минут.

```javascript
class WebSocketWithHeartbeat {
  constructor(url, { pingInterval = 25_000, pongTimeout = 5_000 } = {}) {
    this.pingInterval = pingInterval;
    this.pongTimeout  = pongTimeout;
    this._pingTimer   = null;
    this._pongTimer   = null;
    this._ws = new WebSocket(url);
    this._setup();
  }

  _setup() {
    this._ws.onopen = () => {
      this._startPing();
    };

    this._ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "pong") {
        // Получили pong — соединение живо
        clearTimeout(this._pongTimer);
        return;
      }
      this.onmessage?.(e);
    };

    this._ws.onclose = () => {
      this._stopPing();
      this.onclose?.();
    };
  }

  _startPing() {
    this._pingTimer = setInterval(() => {
      if (this._ws.readyState !== WebSocket.OPEN) return;

      this._ws.send(JSON.stringify({ type: "ping", ts: Date.now() }));

      // Если pong не пришёл через pongTimeout — соединение мёртвое
      this._pongTimer = setTimeout(() => {
        console.warn("Pong timeout — terminating dead connection");
        this._ws.close(1006, "Heartbeat timeout");
      }, this.pongTimeout);
    }, this.pingInterval);
  }

  _stopPing() {
    clearInterval(this._pingTimer);
    clearTimeout(this._pongTimer);
  }
}

// На сервере (Node.js ws):
// ws.on("message", (data) => {
//   const msg = JSON.parse(data);
//   if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong", ts: msg.ts }));
// });

// Альтернатива: WebSocket protocol-level ping/pong (0x9/0xA frames)
// Браузер автоматически отвечает на Ping → лучше использовать серверный Ping
// Но в браузере нельзя отправить protocol-level Ping вручную — только application-level
```

---

## Message Queuing

```javascript
// Гарантированная доставка при временных разрывах
class ReliableWebSocket {
  #queue = new Map(); // id → { data, attempts, timer }
  #nextId = 0;
  #ws;

  constructor(url) {
    this.#ws = new ReconnectingWebSocket(url);
    this.#ws.onmessage = (e) => this.#handleMessage(JSON.parse(e.data));
  }

  sendReliable(data, { timeout = 5000, maxAttempts = 3 } = {}) {
    const id = ++this.#nextId;
    const envelope = { id, data, type: "message" };

    const attempt = () => {
      if (!this.#queue.has(id)) return; // уже подтверждено или отменено
      const entry = this.#queue.get(id);
      if (entry.attempts >= maxAttempts) {
        this.#queue.delete(id);
        this.onmessagefailed?.(data);
        return;
      }
      entry.attempts++;
      this.#ws.send(JSON.stringify(envelope));
      entry.timer = setTimeout(attempt, timeout);
    };

    this.#queue.set(id, { data, attempts: 0, timer: null });
    attempt();

    return id;
  }

  #handleMessage(msg) {
    if (msg.type === "ack") {
      const entry = this.#queue.get(msg.id);
      if (entry) {
        clearTimeout(entry.timer);
        this.#queue.delete(msg.id);
      }
      return;
    }
    this.onmessage?.(msg);
  }
}
```

---

## Backpressure

```javascript
// Проблема: клиент отправляет данные быстрее чем сеть справляется
// ws.bufferedAmount — сколько байт в очереди

async function sendWithBackpressure(ws, messages) {
  const BUFFER_HIGH_WATER_MARK = 64 * 1024; // 64KB

  for (const msg of messages) {
    // Ждём пока буфер опустеет ниже порога
    while (ws.bufferedAmount > BUFFER_HIGH_WATER_MARK) {
      await new Promise(r => setTimeout(r, 100));
    }
    ws.send(msg);
  }
}

// Паттерн: стриминг данных с контролем давления
class StreamingSender {
  #ws;
  #paused = false;
  #queue = [];

  constructor(ws) {
    this.#ws = ws;
    this.#startDrain();
  }

  #startDrain() {
    setInterval(() => {
      if (this.#paused && this.#ws.bufferedAmount < 16 * 1024) {
        this.#paused = false;
        this.#flush();
      }
    }, 50);
  }

  #flush() {
    while (this.#queue.length && !this.#paused) {
      const msg = this.#queue.shift();
      this.#ws.send(msg);
      if (this.#ws.bufferedAmount > 64 * 1024) {
        this.#paused = true;
        return;
      }
    }
  }

  send(data) {
    this.#queue.push(data);
    if (!this.#paused) this.#flush();
  }
}
```

---

## Typed Message Protocol

```javascript
// JSON-RPC over WebSocket
// Стандартизированный протокол запрос/ответ

class JsonRpcWebSocket {
  #ws;
  #pending = new Map(); // id → { resolve, reject }
  #handlers = new Map();
  #nextId = 0;

  constructor(ws) {
    this.#ws = ws;
    ws.onmessage = (e) => this.#dispatch(JSON.parse(e.data));
  }

  // RPC вызов — ждём ответа
  call(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++this.#nextId;
      this.#pending.set(id, { resolve, reject });
      this.#ws.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));

      // Timeout
      setTimeout(() => {
        if (this.#pending.has(id)) {
          this.#pending.delete(id);
          reject(new Error(`RPC timeout: ${method}`));
        }
      }, 10_000);
    });
  }

  // Уведомление — без ответа (нет id)
  notify(method, params) {
    this.#ws.send(JSON.stringify({ jsonrpc: "2.0", method, params }));
  }

  // Регистрация серверных уведомлений
  on(method, handler) {
    this.#handlers.set(method, handler);
  }

  #dispatch(msg) {
    if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
      // Ответ на наш запрос
      const pending = this.#pending.get(msg.id);
      if (!pending) return;
      this.#pending.delete(msg.id);
      if (msg.error) pending.reject(new Error(msg.error.message));
      else pending.resolve(msg.result);
    } else if (msg.method) {
      // Серверное уведомление
      this.#handlers.get(msg.method)?.(msg.params);
    }
  }
}

// Использование
const rpc = new JsonRpcWebSocket(ws);

// Запрос
const user = await rpc.call("getUser", { id: 42 });

// Подписка
rpc.on("priceUpdate", ({ symbol, price }) => {
  updateChart(symbol, price);
});

// Уведомление без ответа
rpc.notify("userTyping", { room: "general" });
```

---

## Binary данные

```javascript
// Protocol Buffers-подобная ручная сериализация
// Или MessagePack, CBOR для production

// Простой бинарный протокол:
// [1 byte: type][4 bytes: length][N bytes: payload]

const MSG_TYPES = { TEXT: 1, IMAGE: 2, AUDIO: 3, LOCATION: 4 };

function encodeMessage(type, payload) {
  const payloadBuffer = typeof payload === "string"
    ? new TextEncoder().encode(payload)
    : payload;

  const buffer = new ArrayBuffer(5 + payloadBuffer.byteLength);
  const view = new DataView(buffer);
  view.setUint8(0, type);                        // тип (1 байт)
  view.setUint32(1, payloadBuffer.byteLength);    // длина (4 байта big-endian)
  new Uint8Array(buffer, 5).set(payloadBuffer);   // payload

  return buffer;
}

function decodeMessage(buffer) {
  const view = new DataView(buffer);
  const type = view.getUint8(0);
  const length = view.getUint32(1);
  const payload = new Uint8Array(buffer, 5, length);
  return { type, payload };
}

ws.binaryType = "arraybuffer";
ws.onmessage = (e) => {
  if (e.data instanceof ArrayBuffer) {
    const { type, payload } = decodeMessage(e.data);
    if (type === MSG_TYPES.TEXT) {
      console.log(new TextDecoder().decode(payload));
    }
  }
};

ws.send(encodeMessage(MSG_TYPES.TEXT, "Hello binary world!"));

// MessagePack пример (npm i msgpack-lite):
// import { encode, decode } from "msgpack-lite";
// ws.send(encode({ type: "update", data: complexObject }));
// ws.onmessage = (e) => { const msg = decode(new Uint8Array(e.data)); };
// ~30% компактнее JSON, без строкового парсинга
```

---

## Node.js сервер

```
Запуск: npm install ws && node server.js
```

Смотри файл `examples/ws-server.js` — полная реализация с:
- Room management
- Heartbeat (ping/pong)
- Graceful shutdown
- JSON-RPC dispatch

---

## Вопросы на интервью

1. **Как реализовать надёжное переподключение?**
   > Exponential backoff с jitter: первая задержка 1s, удваивать до 30s, добавить ±20% рандомизацию чтобы не все клиенты переподключались одновременно (thundering herd). Не переподключаться при кодах 1008/4001 (авторизация). Буферизовать сообщения во время переподключения.

2. **Почему нужен heartbeat? Разве TCP не гарантирует соединение?**
   > TCP keepalive существует, но NAT и прокси могут молча разрывать "тихие" TCP-соединения через 30-300 секунд. Приложение не узнает об этом. Heartbeat на уровне приложения (ping/pong каждые 20-25s) выявляет мёртвые соединения быстро. WebSocket protocol-level ping (opcode 0x9) — лучше, но браузер отправить его вручную не может.

3. **Что такое backpressure в WebSocket?**
   > `bufferedAmount` показывает сколько данных ждёт отправки в сети. Если быстро вызывать `send()` — буфер растёт, клиент перегружается. Backpressure: проверять `bufferedAmount` перед отправкой, делать паузу пока буфер не опустеет. Особенно важно при стриминге медиа или больших файлов.

4. **JSON vs бинарный протокол — когда что?**
   > JSON: простота отладки, human-readable, достаточно для большинства случаев. Бинарный (MessagePack, CBOR, Protobuf): на 30-60% меньше размер, быстрее сериализация/десериализация, строгая типизация. Бинарный нужен: high-frequency trading, игры (позиции, состояние), медиастриминг, IoT с ограниченным каналом.

---

## Примеры

```
Открой в браузере:
05-websockets-webrtc/02-websocket-patterns/examples/reconnect-demo.html

Node.js сервер:
cd 05-websockets-webrtc/02-websocket-patterns/examples/
npm install ws
node ws-server.js
```
