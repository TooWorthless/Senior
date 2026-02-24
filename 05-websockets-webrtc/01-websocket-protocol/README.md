# 01 · WebSocket Protocol

[← WebSockets / WebRTC](../README.md)

---

## Содержание

1. [Протокол — как это работает](#протокол)
2. [HTTP Upgrade Handshake](#http-upgrade-handshake)
3. [Фреймы (framing)](#фреймы)
4. [Browser API](#browser-api)
5. [Ready States](#ready-states)
6. [Subprotocols & Extensions](#subprotocols--extensions)
7. [Вопросы на интервью](#вопросы-на-интервью)

---

## Протокол

WebSocket — **полнодуплексный** протокол поверх TCP (RFC 6455, 2011).

```
HTTP:      Client  →→→  Request  →→→  Server
           Client  ←←←  Response ←←←  Server
           (новое соединение на каждый запрос)

WebSocket: Client  ←══════════════════  Server
           (одно соединение, данные в обе стороны одновременно)
```

**Что даёт WebSocket по сравнению с HTTP polling:**
- Нет HTTP-заголовков на каждое сообщение → меньше overhead
- Нет задержки открытия TCP-соединения
- Сервер сам инициирует отправку данных (push)
- Framing на уровне протокола — сообщения, а не байтовый поток

---

## HTTP Upgrade Handshake

WebSocket начинается как HTTP-запрос, затем "апгрейдится":

```
── Клиент отправляет HTTP/1.1 GET ─────────────────────────
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket               ← ключевой заголовок
Connection: Upgrade              ← ключевой заголовок
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==  ← random base64
Sec-WebSocket-Version: 13
Sec-WebSocket-Protocol: chat, superchat  ← запрошенные subprotocols (опц.)
Sec-WebSocket-Extensions: permessage-deflate  ← сжатие (опц.)
Origin: http://example.com

── Сервер отвечает 101 Switching Protocols ─────────────────
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: chat
```

**`Sec-WebSocket-Accept`** = Base64(SHA1(`Sec-WebSocket-Key` + `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`))

Это "magic string" RFC 6455 — защита от случайного соединения не-WebSocket клиентов.

После 101 — TCP-соединение остаётся открытым, HTTP больше не используется.

---

## Фреймы

WebSocket передаёт данные фреймами (не сырым потоком байт):

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |                               |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+-------------------------------+
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - -+-------------------------------+
|                               | Masking-key, if MASK set to 1 |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+---------------------------------------------------------------+
```

**Opcode типы фреймов:**
```
0x0  Continuation frame
0x1  Text frame (UTF-8)
0x2  Binary frame
0x8  Close
0x9  Ping
0xA  Pong (ответ на Ping)
```

**Masking:** Клиент → Сервер: данные ОБЯЗАТЕЛЬНО маскируются (4-byte key XOR с payload). Сервер → Клиент: без маски. Защита от cache-poisoning атак через промежуточные прокси.

**Fragmentation:** Большие сообщения разбиваются на фреймы: первый с opcode, остальные с opcode 0x0 (continuation), последний с FIN=1.

---

## Browser API

```javascript
// Создание соединения
const ws = new WebSocket("wss://example.com/socket");
// wss:// — TLS (аналог HTTPS), ws:// — без шифрования

// С subprotocol
const ws = new WebSocket("wss://example.com/socket", "json-rpc");
// или несколько вариантов:
const ws = new WebSocket("wss://example.com/socket", ["json-rpc", "graphql-ws"]);

// ─── События ─────────────────────────────────────
ws.onopen = (event) => {
  console.log("Соединение установлено");
  console.log("Subprotocol:", ws.protocol); // выбранный сервером
  console.log("Extensions:", ws.extensions);
};

ws.onmessage = (event) => {
  // event.data: string | Blob | ArrayBuffer (зависит от binaryType)
  if (typeof event.data === "string") {
    const msg = JSON.parse(event.data);
    handleMessage(msg);
  } else {
    handleBinary(event.data);
  }
};

ws.onerror = (event) => {
  // event — просто Event, не содержит детальной информации об ошибке
  // Причина ошибки доступна только в onclose
  console.error("WebSocket error");
};

ws.onclose = (event) => {
  console.log("Закрыто:", event.code, event.reason, event.wasClean);
  // event.wasClean: true = корректное закрытие (Close frame обменялись)
};

// addEventListener версия
ws.addEventListener("message", handler);

// ─── Отправка данных ─────────────────────────────
ws.send("Hello, Server!"); // string
ws.send(JSON.stringify({ type: "ping" }));
ws.send(new Uint8Array([1, 2, 3])); // binary — ArrayBuffer/TypedArray/Blob
ws.send(new Blob([file]));

// ─── Бинарный тип ─────────────────────────────────
ws.binaryType = "arraybuffer"; // default: "blob"
// "arraybuffer" → event.data = ArrayBuffer (удобнее для обработки)
// "blob" → event.data = Blob (лучше для файлов)

// ─── Буферизация ──────────────────────────────────
ws.bufferedAmount; // байт в очереди на отправку
// Если bufferedAmount растёт → backpressure: клиент отправляет быстрее чем сеть

// ─── Закрытие ─────────────────────────────────────
ws.close();           // без кода и причины
ws.close(1000, "Done"); // нормальное закрытие
ws.close(1001, "Going Away");
// Коды:
// 1000 — нормальное завершение
// 1001 — endpoint уходит (закрытие страницы)
// 1006 — аномальное закрытие (нет Close frame, например разрыв TCP)
// 1011 — сервер столкнулся с ошибкой
// 4000-4999 — приложение-специфичные коды (зарезервированы для приложений)
```

---

## Ready States

```javascript
ws.readyState; // текущее состояние

WebSocket.CONNECTING === 0; // 0 — устанавливается соединение
WebSocket.OPEN       === 1; // 1 — соединение открыто, можно send()
WebSocket.CLOSING    === 2; // 2 — идёт процедура закрытия
WebSocket.CLOSED     === 3; // 3 — соединение закрыто

// Безопасная отправка
function safeSend(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(typeof data === "string" ? data : JSON.stringify(data));
    return true;
  }
  return false;
}

// Ловушка: ws.send() до OPEN бросает InvalidStateError!
const ws = new WebSocket(url);
ws.send("hello"); // ❌ Error: readyState=CONNECTING

// Правильно: дождаться onopen
ws.onopen = () => ws.send("hello"); // ✅
```

---

## Subprotocols & Extensions

```javascript
// Subprotocol — согласованный формат сообщений поверх WebSocket
// Зарезервированные протоколы: "soap", "wamp", "mqtt"
// Популярные: "graphql-ws", "graphql-transport-ws", "json-rpc"

const ws = new WebSocket(url, "graphql-ws");
ws.onopen = () => {
  // Инициализация согласно протоколу graphql-ws
  ws.send(JSON.stringify({ type: "connection_init" }));
};

// Extensions — переговоры о сжатии/мультиплексировании
// permessage-deflate — сжатие полезной нагрузки (RFC 7692)
// Браузер предлагает: "permessage-deflate; client_max_window_bits"
// Сервер принимает или отклоняет
```

---

## Вопросы на интервью

1. **Чем WebSocket отличается от HTTP long polling?**
   > Long polling: клиент делает HTTP-запрос, сервер держит его открытым до появления данных, затем закрывает. Клиент сразу делает следующий запрос. Много overhead заголовков, задержка на каждый цикл. WebSocket: одно TCP-соединение, сервер push-ает данные когда нужно, минимальный overhead фрейма (~2-14 байт вместо сотен байт HTTP-заголовков).

2. **Что такое `Sec-WebSocket-Key` и зачем он нужен?**
   > Случайное base64-значение от клиента. Сервер вычисляет `SHA1(key + magic-string)` и возвращает в `Sec-WebSocket-Accept`. Это подтверждает что сервер понимает WebSocket протокол (не просто эхо HTTP). Защищает от случайного открытия WS соединения через обычный HTTP cache proxy.

3. **Почему клиент должен маскировать данные, а сервер нет?**
   > Masking защищает от cache-poisoning атак через промежуточные прокси (RFC 6455 §10.3). Атакующий скрипт на веб-странице мог бы отправить специально сформированный "HTTP-ответ" через WebSocket, который промежуточный прокси кэширует. Маскирование рандомным ключом предотвращает это. Сервер→клиент: нет промежуточных прокси, которые кэшируют ответы сервера таким образом.

4. **Что такое `bufferedAmount`?**
   > Количество байт в очереди на отправку (ещё не ушли в сеть). Если клиент вызывает `send()` быстрее чем данные уходят → `bufferedAmount` растёт → backpressure. Нужно проверять перед отправкой больших потоков данных, чтобы не переполнить буфер.

5. **Какие close коды ты знаешь?**
   > 1000 — нормальное завершение. 1001 — endpoint уходит (закрытие страницы/перезапуск сервера). 1002 — ошибка протокола. 1003 — неподдерживаемый тип данных. 1006 — аномальное (нет Close frame, сеть обрезана). 1011 — неожиданная ошибка на сервере. 4000-4999 — для приложений (например 4001 = "не авторизован").

---

## Примеры

```
Открой в браузере:
05-websockets-webrtc/01-websocket-protocol/examples/ws-client.html

Для работы с реальным сервером:
cd 05-websockets-webrtc/01-websocket-protocol/examples/
npm install ws
node echo-server.js
```
