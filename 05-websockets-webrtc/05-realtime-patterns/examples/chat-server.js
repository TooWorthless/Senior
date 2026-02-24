/**
 * Real-time Chat Server — все паттерны в одном
 *
 * Включает: Presence, Rooms, Typing indicator,
 *           Optimistic UI confirmation, Message history (in-memory)
 *
 * Запуск:
 *   npm install ws
 *   node chat-server.js
 *
 * Затем открой chat-demo.html
 */

const { WebSocketServer, WebSocket } = require("ws");
const { randomUUID } = require("crypto");

const PORT = 8082;
const wss = new WebSocketServer({ port: PORT });

// ─── In-memory хранилище ─────────────────────────
const clients = new Map();   // clientId → { ws, name, rooms, status }
const rooms = new Map();     // roomId → { members: Set<clientId>, history: Message[] }
const typing = new Map();    // `${roomId}:${clientId}` → timeout

const HISTORY_LIMIT = 100;

// Создаём дефолтные комнаты
["general", "random", "tech"].forEach(id => {
  rooms.set(id, { members: new Set(), history: [] });
});

// ─── Утилиты ─────────────────────────────────────
function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function broadcastRoom(roomId, obj, excludeId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const cid of room.members) {
    if (cid === excludeId) continue;
    const c = clients.get(cid);
    if (c) send(c.ws, obj);
  }
}

function broadcastAll(obj, excludeId = null) {
  for (const [cid, c] of clients) {
    if (cid === excludeId) continue;
    send(c.ws, obj);
  }
}

function getPresenceList() {
  return [...clients.values()].map(({ name, status }) => ({ name, status }));
}

function getRoomMembers(roomId) {
  const room = rooms.get(roomId);
  return room ? [...room.members].map(cid => ({
    id: cid,
    name: clients.get(cid)?.name || "Unknown",
    status: clients.get(cid)?.status || "online",
  })) : [];
}

function saveMessage(roomId, msg) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.history.push(msg);
  if (room.history.length > HISTORY_LIMIT) room.history.shift();
}

function generateId() {
  // Простой ULID-like (timestamp + random)
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Обработчики сообщений ────────────────────────
const handlers = {
  // Инициализация: клиент представляется
  init({ clientId, ws, params: { name } }) {
    const c = clients.get(clientId);
    if (c) {
      c.name = name || `User-${clientId.slice(0, 4)}`;
    }
    // Отправить текущее состояние
    send(ws, {
      type: "init_ack",
      clientId,
      name: c?.name,
      presence: getPresenceList(),
      rooms: [...rooms.keys()].map(id => ({
        id,
        memberCount: rooms.get(id).members.size,
      })),
    });
    // Уведомить других о новом пользователе
    broadcastAll({ type: "presence", event: "join", name: c?.name, presence: getPresenceList() }, clientId);
  },

  // Войти в комнату
  joinRoom({ clientId, ws, params: { room } }) {
    if (!rooms.has(room)) return { error: `Room '${room}' not found` };
    rooms.get(room).members.add(clientId);
    clients.get(clientId)?.rooms.add(room);

    // История комнаты
    send(ws, {
      type: "room_joined",
      room,
      history: rooms.get(room).history.slice(-50),
      members: getRoomMembers(room),
    });

    // Уведомить других
    const name = clients.get(clientId)?.name;
    broadcastRoom(room, { type: "user_joined", room, name }, clientId);
  },

  // Покинуть комнату
  leaveRoom({ clientId, params: { room } }) {
    rooms.get(room)?.members.delete(clientId);
    clients.get(clientId)?.rooms.delete(room);
    broadcastRoom(room, {
      type: "user_left",
      room,
      name: clients.get(clientId)?.name,
    });
  },

  // Отправить сообщение
  sendMessage({ clientId, ws, params: { room, text, tempId } }) {
    const client = clients.get(clientId);
    if (!client?.rooms.has(room)) return { error: "Not in room" };
    if (!text?.trim()) return { error: "Empty message" };

    const msg = {
      id: generateId(),
      room,
      from: { id: clientId, name: client.name },
      text: text.trim(),
      ts: Date.now(),
    };

    saveMessage(room, msg);

    // Подтверждение отправителю (optimistic UI confirmation)
    if (tempId) {
      send(ws, { type: "message_ack", tempId, messageId: msg.id, ts: msg.ts });
    }

    // Broadcast всем в комнате
    broadcastRoom(room, { type: "message", ...msg });
  },

  // Typing indicator
  typing({ clientId, params: { room } }) {
    const name = clients.get(clientId)?.name;
    broadcastRoom(room, { type: "typing", name, room }, clientId);

    // Auto-stop через 3s
    const key = `${room}:${clientId}`;
    clearTimeout(typing.get(key));
    typing.set(key, setTimeout(() => {
      broadcastRoom(room, { type: "stop_typing", name, room }, clientId);
      typing.delete(key);
    }, 3000));
  },

  stopTyping({ clientId, params: { room } }) {
    const key = `${room}:${clientId}`;
    clearTimeout(typing.get(key));
    typing.delete(key);
    broadcastRoom(room, {
      type: "stop_typing",
      name: clients.get(clientId)?.name,
      room,
    }, clientId);
  },

  // Изменить статус
  setStatus({ clientId, params: { status } }) {
    const c = clients.get(clientId);
    if (c) c.status = status;
    broadcastAll({ type: "presence", event: "status", presence: getPresenceList() });
  },

  // Статистика сервера
  serverStats({ ws }) {
    send(ws, {
      type: "stats",
      clients: clients.size,
      rooms: [...rooms.entries()].map(([id, r]) => ({ id, members: r.members.size })),
      uptime: process.uptime().toFixed(0) + "s",
    });
  },
};

// ─── Connection handler ───────────────────────────
wss.on("connection", (ws) => {
  const clientId = generateId();
  clients.set(clientId, { ws, name: `Guest-${clientId.slice(0,4)}`, rooms: new Set(), status: "online" });
  console.log(`[+] ${clientId} connected. Total: ${clients.size}`);

  // Welcome
  send(ws, { type: "welcome", clientId });

  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }
    const { type, params = {}, tempId } = msg;
    const handler = handlers[type];
    if (!handler) return send(ws, { type: "error", error: `Unknown type: ${type}` });
    try {
      const result = handler({ clientId, ws, params: { ...params, tempId } });
      if (result?.error) send(ws, { type: "error", error: result.error });
    } catch(e) {
      send(ws, { type: "error", error: e.message });
    }
  });

  ws.on("close", () => {
    const c = clients.get(clientId);
    if (c) {
      for (const room of c.rooms) {
        rooms.get(room)?.members.delete(clientId);
        broadcastRoom(room, { type: "user_left", room, name: c.name });
      }
      clients.delete(clientId);
      broadcastAll({ type: "presence", event: "leave", name: c.name, presence: getPresenceList() });
    }
    console.log(`[-] ${clientId} disconnected. Total: ${clients.size}`);
  });
});

wss.on("listening", () => {
  console.log(`Chat Server on ws://localhost:${PORT}`);
  console.log("Комнаты:", [...rooms.keys()].join(", "));
  console.log("Открой chat-demo.html в браузере");
});
