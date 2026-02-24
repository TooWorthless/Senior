/**
 * WebSocket Server — Production-ready паттерны
 *
 * Включает:
 *   - Room management
 *   - Heartbeat (ping/pong)
 *   - JSON-RPC dispatch
 *   - Graceful shutdown
 *   - Presence (кто онлайн)
 *
 * Запуск:
 *   npm install ws
 *   node ws-server.js
 */

const { WebSocketServer, WebSocket } = require("ws");

const PORT = 8081;
const wss = new WebSocketServer({ port: PORT });

// ─── Хранилище состояния ─────────────────────────
const rooms = new Map(); // roomId → Set<clientId>
const clients = new Map(); // clientId → { ws, name, rooms: Set, lastPing }
let clientIdCounter = 0;

// ─── Утилиты ─────────────────────────────────────
function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

function broadcast(roomId, obj, excludeId = null) {
  const room = rooms.get(roomId);
  if (!room) return 0;
  let count = 0;
  for (const cid of room) {
    if (cid === excludeId) continue;
    const client = clients.get(cid);
    if (client) { send(client.ws, obj); count++; }
  }
  return count;
}

function getRoomPresence(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return [...room].map(cid => {
    const c = clients.get(cid);
    return c ? { id: cid, name: c.name } : null;
  }).filter(Boolean);
}

// ─── JSON-RPC handlers ────────────────────────────
const handlers = {
  // Установить имя пользователя
  setName({ clientId, params: { name } }) {
    const client = clients.get(clientId);
    if (!client) return { error: "Not found" };
    client.name = name;
    return { ok: true, name };
  },

  // Войти в комнату
  joinRoom({ clientId, params: { room } }) {
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(clientId);
    clients.get(clientId).rooms.add(room);

    // Уведомить других в комнате
    broadcast(room, {
      type: "event",
      event: "userJoined",
      room,
      user: { id: clientId, name: clients.get(clientId)?.name },
    }, clientId);

    return { ok: true, room, members: getRoomPresence(room) };
  },

  // Выйти из комнаты
  leaveRoom({ clientId, params: { room } }) {
    rooms.get(room)?.delete(clientId);
    clients.get(clientId)?.rooms.delete(room);

    broadcast(room, {
      type: "event",
      event: "userLeft",
      room,
      user: { id: clientId, name: clients.get(clientId)?.name },
    });

    return { ok: true };
  },

  // Отправить сообщение в комнату
  sendMessage({ clientId, params: { room, text } }) {
    const client = clients.get(clientId);
    if (!client?.rooms.has(room)) return { error: "Not in room" };

    const msg = {
      type: "message",
      room,
      from: { id: clientId, name: client.name },
      text,
      ts: Date.now(),
    };

    broadcast(room, msg); // включая отправителя
    return { ok: true, ts: msg.ts };
  },

  // Получить список комнат
  listRooms() {
    return [...rooms.entries()].map(([id, members]) => ({
      id,
      memberCount: members.size,
    }));
  },

  // Серверные stats
  stats({ clientId }) {
    return {
      connectedClients: clients.size,
      rooms: rooms.size,
      serverUptime: process.uptime().toFixed(1) + "s",
      ts: Date.now(),
    };
  },

  // Application-level ping
  ping({ params }) {
    return { pong: true, ts: params?.ts, serverTs: Date.now() };
  },
};

// ─── Connection handler ───────────────────────────
wss.on("connection", (ws, req) => {
  const clientId = ++clientIdCounter;
  clients.set(clientId, { ws, name: `Guest-${clientId}`, rooms: new Set(), lastPing: Date.now() });

  console.log(`[${clientId}] Connected. Total: ${clients.size}`);

  // Приветствие
  send(ws, { type: "welcome", clientId, serverTime: Date.now() });

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      send(ws, { error: "Invalid JSON" });
      return;
    }

    // JSON-RPC формат: { jsonrpc: "2.0", id, method, params }
    const { jsonrpc, id, method, params } = msg;
    if (jsonrpc !== "2.0" || !method) {
      send(ws, { error: "Expected JSON-RPC 2.0" });
      return;
    }

    const handler = handlers[method];
    if (!handler) {
      if (id !== undefined) {
        send(ws, { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
      }
      return;
    }

    try {
      const result = handler({ clientId, params: params ?? {} });
      if (id !== undefined) {
        send(ws, { jsonrpc: "2.0", id, result });
      }
    } catch (e) {
      if (id !== undefined) {
        send(ws, { jsonrpc: "2.0", id, error: { code: -32000, message: e.message } });
      }
    }
  });

  ws.on("pong", () => {
    const client = clients.get(clientId);
    if (client) client.lastPing = Date.now();
  });

  ws.on("close", (code, reason) => {
    const client = clients.get(clientId);
    if (client) {
      // Выйти из всех комнат
      for (const room of client.rooms) {
        rooms.get(room)?.delete(clientId);
        broadcast(room, {
          type: "event",
          event: "userLeft",
          room,
          user: { id: clientId, name: client.name },
        });
      }
    }
    clients.delete(clientId);
    console.log(`[${clientId}] Disconnected (${code}). Total: ${clients.size}`);
  });
});

// ─── Heartbeat ────────────────────────────────────
const heartbeat = setInterval(() => {
  const now = Date.now();
  for (const [id, client] of clients) {
    if (client.ws.readyState !== WebSocket.OPEN) continue;

    if (now - client.lastPing > 60_000) {
      console.log(`[${id}] No pong for 60s, terminating`);
      client.ws.terminate();
      continue;
    }

    client.ws.ping();
  }
}, 25_000);

// ─── Graceful shutdown ────────────────────────────
function shutdown() {
  console.log("\nGraceful shutdown...");
  clearInterval(heartbeat);

  for (const [, client] of clients) {
    client.ws.close(1001, "Server shutting down");
  }

  wss.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force exit после 5s
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

wss.on("listening", () => {
  console.log(`WebSocket server on ws://localhost:${PORT}`);
  console.log("Методы JSON-RPC: setName, joinRoom, leaveRoom, sendMessage, listRooms, stats, ping");
  console.log("Пример из DevTools Console:");
  console.log(`  const ws = new WebSocket("ws://localhost:${PORT}");`);
  console.log('  ws.onmessage = e => console.log(JSON.parse(e.data));');
  console.log('  ws.onopen = () => ws.send(JSON.stringify({jsonrpc:"2.0",id:1,method:"stats"}));');
});
