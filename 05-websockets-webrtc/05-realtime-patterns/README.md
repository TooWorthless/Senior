# 05 · Real-time Patterns

[← WebSockets / WebRTC](../README.md)

---

## Содержание

1. [Presence система](#presence-система)
2. [Rooms & Fan-out](#rooms--fan-out)
3. [Pub/Sub паттерн](#pubsub-паттерн)
4. [Chat архитектура](#chat-архитектура)
5. [Масштабирование WebSocket серверов](#масштабирование)
6. [SSE vs WebSocket](#sse-vs-websocket)
7. [Вопросы на интервью](#вопросы-на-интервью)

---

## Presence система

"Кто сейчас онлайн?" — один из самых частых вопросов на интервью по real-time.

```javascript
// ─── Сервер (Node.js + ws) ────────────────────────────
class PresenceServer {
  constructor(wss) {
    this.presence = new Map(); // userId → { ws, name, status, lastSeen }
    this.wss = wss;
    wss.on("connection", this.handleConnection.bind(this));
  }

  handleConnection(ws, req) {
    // userId из auth token в заголовке/query
    const userId = parseUserId(req);
    if (!userId) return ws.close(4001, "Unauthorized");

    const existing = this.presence.get(userId);
    if (existing) {
      // Уже онлайн — закрываем старое соединение (например, вторая вкладка)
      existing.ws.close(4000, "Replaced by new connection");
    }

    this.presence.set(userId, { ws, name: null, status: "online", lastSeen: Date.now() });
    this.broadcastPresence("join", userId);

    ws.on("message", (data) => this.handleMessage(ws, userId, JSON.parse(data)));
    ws.on("close", () => this.handleDisconnect(userId));
  }

  handleMessage(ws, userId, msg) {
    if (msg.type === "status") {
      // Изменить статус: "online" | "away" | "busy" | "offline"
      const user = this.presence.get(userId);
      if (user) user.status = msg.status;
      this.broadcastPresence("status", userId);
    }
  }

  handleDisconnect(userId) {
    const user = this.presence.get(userId);
    if (user) user.lastSeen = Date.now();
    // Не удаляем сразу — даём grace period (переподключение)
    setTimeout(() => {
      if (this.presence.get(userId)?.ws.readyState !== WebSocket.OPEN) {
        this.presence.delete(userId);
        this.broadcastPresence("leave", userId);
      }
    }, 5000); // 5s grace period
  }

  broadcastPresence(event, userId) {
    const msg = JSON.stringify({
      type: "presence",
      event,   // "join" | "leave" | "status"
      userId,
      users: this.getOnlineUsers(), // текущий список
    });
    this.wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  }

  getOnlineUsers() {
    return [...this.presence.entries()].map(([id, data]) => ({
      id,
      name: data.name,
      status: data.status,
    }));
  }
}

// ─── Клиент ──────────────────────────────────────────
const presenceStore = new Map();

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === "presence") {
    // Обновить локальный список
    presenceStore.clear();
    msg.users.forEach(u => presenceStore.set(u.id, u));
    renderOnlineUsers(presenceStore);
  }
};

// Typing indicator (временное присутствие)
let typingTimer;
msgInput.addEventListener("input", () => {
  ws.send(JSON.stringify({ type: "typing", roomId: "general" }));
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    ws.send(JSON.stringify({ type: "stopTyping", roomId: "general" }));
  }, 2000);
});
```

---

## Rooms & Fan-out

```javascript
// ─── Сервер: управление комнатами ────────────────────
class RoomManager {
  rooms = new Map(); // roomId → Set<clientId>
  clients = new Map(); // clientId → { ws, rooms: Set }

  join(clientId, roomId) {
    if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Set());
    this.rooms.get(roomId).add(clientId);
    this.clients.get(clientId)?.rooms.add(roomId);
  }

  leave(clientId, roomId) {
    this.rooms.get(roomId)?.delete(clientId);
    this.clients.get(clientId)?.rooms.delete(roomId);
    // Удалить пустую комнату
    if (this.rooms.get(roomId)?.size === 0) this.rooms.delete(roomId);
  }

  leaveAll(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;
    for (const roomId of client.rooms) {
      this.rooms.get(roomId)?.delete(clientId);
    }
    this.clients.delete(clientId);
  }

  // Fan-out: разослать сообщение всем в комнате
  broadcast(roomId, msg, excludeId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return 0;
    let sent = 0;
    for (const cid of room) {
      if (cid === excludeId) continue;
      const client = this.clients.get(cid);
      if (client?.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(msg));
        sent++;
      }
    }
    return sent;
  }

  // Отправить одному пользователю (direct message)
  sendToClient(clientId, msg) {
    const client = this.clients.get(clientId);
    if (client?.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }
}

// Иерархические комнаты (channel → thread)
// "room:general" → "room:general:thread:123"
// Можно использовать префикс-матчинг для broadcast
```

---

## Pub/Sub паттерн

```javascript
// ─── In-memory Pub/Sub для WebSocket сервера ─────────
class PubSub {
  #subscriptions = new Map(); // topic → Set<handler>

  subscribe(topic, handler) {
    if (!this.#subscriptions.has(topic)) {
      this.#subscriptions.set(topic, new Set());
    }
    this.#subscriptions.get(topic).add(handler);
    return () => this.unsubscribe(topic, handler); // unsubscribe fn
  }

  unsubscribe(topic, handler) {
    this.#subscriptions.get(topic)?.delete(handler);
  }

  publish(topic, data) {
    const handlers = this.#subscriptions.get(topic);
    if (!handlers) return 0;
    for (const handler of handlers) handler(data);
    return handlers.size;
  }

  // Wildcard: "price.*" подходит для "price.BTC", "price.ETH"
  publishPattern(pattern, data) {
    const regex = new RegExp(
      "^" + pattern.replace(".", "\\.").replace("*", "[^.]+").replace("#", ".*") + "$"
    );
    let count = 0;
    for (const [topic, handlers] of this.#subscriptions) {
      if (regex.test(topic)) {
        for (const h of handlers) h(data);
        count += handlers.size;
      }
    }
    return count;
  }
}

// ─── WebSocket + PubSub на сервере ───────────────────
const pubsub = new PubSub();

wss.on("connection", (ws) => {
  const subs = new Set(); // для cleanup при disconnect

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    if (msg.type === "subscribe") {
      const unsub = pubsub.subscribe(msg.topic, (payload) => {
        ws.send(JSON.stringify({ type: "message", topic: msg.topic, payload }));
      });
      subs.add(unsub);
    }

    if (msg.type === "unsubscribe") {
      // Найти и удалить подписку по topic
    }

    if (msg.type === "publish") {
      pubsub.publish(msg.topic, msg.payload);
    }
  });

  ws.on("close", () => {
    subs.forEach(unsub => unsub()); // отписаться от всего
  });
});

// ─── Клиент ──────────────────────────────────────────
ws.send(JSON.stringify({ type: "subscribe", topic: "price.BTC" }));
ws.send(JSON.stringify({ type: "subscribe", topic: "chat.general" }));

ws.onmessage = (e) => {
  const { topic, payload } = JSON.parse(e.data);
  handlers.get(topic)?.(payload);
};
```

---

## Chat архитектура

```
Простой чат (монолит):
┌────────────────────────────────────────┐
│  WebSocket Server                      │
│  ┌──────────┐  ┌──────────────────┐    │
│  │ Clients  │  │  In-Memory Rooms │    │
│  └──────────┘  └──────────────────┘    │
│            Broadcast                   │
└────────────────────────────────────────┘
+ История: PostgreSQL / MongoDB
+ Push уведомления: FCM / APNs

Производственный масштаб (multi-server):
┌──────┐    ┌──────┐    ┌──────┐
│ WS-1 │    │ WS-2 │    │ WS-3 │
│100k  │    │100k  │    │100k  │
│conns │    │conns │    │conns │
└──┬───┘    └──┬───┘    └──┬───┘
   │           │           │
   └───────────┼───────────┘
               │
         ┌─────▼──────┐
         │   Redis     │
         │   Pub/Sub   │  ← fan-out между серверами
         │   (Cluster) │
         └─────────────┘
               │
     ┌─────────▼──────────┐
     │  Message Database  │
     │  (Cassandra/PG)    │
     └────────────────────┘

Message ID: Snowflake (Twitter) или ULID
  - Время-упорядоченный
  - Уникален глобально
  - Без координации между серверами
```

```javascript
// Сообщение чата — схема
interface ChatMessage {
  id: string;           // ULID: "01HQ..."
  roomId: string;
  userId: string;
  text: string;
  ts: number;           // Unix ms
  editedAt?: number;    // если редактировалось
  replyTo?: string;     // id родительского сообщения
  reactions?: Record<string, string[]>; // "👍" → [userId, ...]
  status: "sending" | "delivered" | "read";
}

// Optimistic UI — показать сообщение до подтверждения сервера
function sendMessage(text) {
  const tempId = `temp-${Date.now()}`;
  const msg = { id: tempId, text, status: "sending", ts: Date.now() };

  // Показать сразу
  appendMessage(msg);

  // Отправить на сервер
  ws.send(JSON.stringify({ type: "sendMessage", tempId, text, roomId }));
}

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === "messageConfirmed") {
    // Заменить временное сообщение на подтверждённое с реальным id
    replaceMessage(msg.tempId, { ...msg, status: "delivered" });
  }
};

// Пагинация истории — курсорная (не offset)
async function loadMore(beforeId) {
  const messages = await api.get(`/rooms/${roomId}/messages?before=${beforeId}&limit=50`);
  prependMessages(messages);
}
```

---

## Масштабирование

```
Проблема: WebSocket соединение → конкретный сервер.
Если пользователь A на WS-1, пользователь B на WS-2 → как B получит сообщение от A?

Решение 1: Redis Pub/Sub
WS-1 получает сообщение от A → публикует в Redis → WS-2 подписан → отправляет B

Решение 2: Sticky Sessions (не рекомендуется для масштабирования)
Load Balancer → всегда направляет одного пользователя на один сервер
Минус: при падении сервера теряем всех его клиентов

Решение 3: Message Queue (Kafka / RabbitMQ)
Более надёжно чем Redis Pub/Sub: персистентность, replay, at-least-once delivery
```

```javascript
// Redis Pub/Sub для fan-out между WS серверами
// На каждом WS сервере:
const redis = new Redis();
const pubClient = redis.duplicate(); // отдельное соединение для publish

// Подписаться на канал при старте
redis.subscribe("chat:general");
redis.on("message", (channel, message) => {
  // Разослать всем подключённым клиентам на ЭТОМ сервере
  const msg = JSON.parse(message);
  roomManager.broadcast(channel.replace("chat:", ""), msg);
});

// При получении сообщения от клиента:
wss.on("message", (ws, data) => {
  const msg = JSON.parse(data);
  if (msg.type === "sendMessage") {
    // Сохранить в DB
    await db.save(msg);
    // Опубликовать в Redis → все WS серверы получат и разошлют своим клиентам
    pubClient.publish(`chat:${msg.roomId}`, JSON.stringify({
      type: "message",
      ...msg,
    }));
  }
});

// Горизонтальное масштабирование:
// 300k клиентов = 3 сервера × 100k
// Redis cluster для Pub/Sub
// Cassandra / PostgreSQL с шардингом для истории
```

---

## SSE vs WebSocket

```javascript
// Server-Sent Events — только Server→Client, простейший API
// Преимущества: автоматическое reconnection, работает через HTTP/2
// Недостатки: только одно направление, нет бинарных данных

// Сервер (Express):
app.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n`);
    res.write(`id: ${Date.now()}\n`);
    res.write("\n"); // пустая строка = конец события
  };

  send("connected", { userId: req.user.id });
  const intervalId = setInterval(() => send("ping", { ts: Date.now() }), 15_000);
  req.on("close", () => clearInterval(intervalId));
});

// Клиент:
const sse = new EventSource("/events", { withCredentials: true });
sse.addEventListener("message", (e) => console.log(JSON.parse(e.data)));
sse.addEventListener("ping", (e) => {});
sse.addEventListener("error", () => {
  // Браузер автоматически переподключится!
  // Заголовок Last-Event-ID отправится серверу
});

// Когда SSE лучше WebSocket:
// — Live feeds, уведомления (только server push)
// — Простота реализации
// — HTTP/2 multiplexing (нет лимита 6 соединений)
// — CDN/прокси friendly

// Когда WebSocket:
// — Двунаправленная связь (чат, игры, collaboration)
// — Низкий latency (нет HTTP overhead)
// — Бинарные данные
```

---

## Вопросы на интервью

1. **Как масштабировать WebSocket сервер горизонтально?**
   > Проблема: WS соединение привязано к конкретному серверу. Решение: Redis Pub/Sub — при получении сообщения публикуем в Redis, все WS серверы подписаны и рассылают своим клиентам. Load balancer без sticky sessions. Для персистентности: Kafka/RabbitMQ вместо Redis (at-least-once доставка, replay).

2. **Что такое sticky sessions и почему они плохи?**
   > Sticky sessions — LB всегда направляет клиента на один сервер. Проблемы: при падении сервера все его клиенты теряют соединение, неравномерное распределение нагрузки. Лучше: stateless WS серверы + Redis для состояния.

3. **Как реализовать presence (онлайн/офлайн) надёжно?**
   > Не удалять сразу при disconnect — grace period (5-10s) для переподключения. Heartbeat: если клиент не отвечает на ping — offline. При reconnect: отправить накопленные события. В distributed системе: TTL ключи в Redis (expire через 30s, клиент обновляет каждые 15s).

4. **Typing indicator — как реализовать?**
   > Клиент отправляет `typing` event при `input`. Debounce `stopTyping` через 2-3s. Сервер broadcast в комнату. Клиенты показывают "Alice is typing..." Не надо хранить в БД. Потеря события при reconnect — OK, пользователь снова начнёт печатать.

5. **SSE или WebSocket для push уведомлений?**
   > SSE если только server→client: уведомления, live feed, dashboard updates. Проще (HTTP), автоматический reconnect, работает через HTTP/2 multiplex. WebSocket если нужна двунаправленность или бинарные данные. Для мобильного push — FCM/APNs (не WebSocket вообще).

---

## Примеры

```
Открой в браузере:
05-websockets-webrtc/05-realtime-patterns/examples/chat-demo.html

Node.js чат сервер:
cd 05-websockets-webrtc/05-realtime-patterns/examples/
npm install ws
node chat-server.js
```
