/**
 * WebSocket Echo Server (Node.js)
 *
 * Запуск:
 *   npm install ws
 *   node echo-server.js
 *
 * Затем открой ws-client.html в браузере
 */

const { WebSocketServer, WebSocket } = require("ws");

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

// Счётчик клиентов
let clientIdCounter = 0;

wss.on("listening", () => {
  console.log(`WebSocket Echo Server listening on ws://localhost:${PORT}`);
});

wss.on("connection", (ws, req) => {
  const id = ++clientIdCounter;
  const ip = req.socket.remoteAddress;
  console.log(`[${id}] Connected from ${ip}`);

  // Отправляем приветствие
  ws.send(JSON.stringify({
    type: "welcome",
    clientId: id,
    serverTime: Date.now(),
    message: `Hello, Client #${id}!`,
  }));

  // Heartbeat
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (data, isBinary) => {
    if (isBinary) {
      // Бинарные данные — просто эхо с инфо
      console.log(`[${id}] Binary message: ${data.length} bytes`);
      ws.send(data, { binary: true }); // эхо бинарных данных
      return;
    }

    const text = data.toString();
    console.log(`[${id}] Message: ${text.slice(0, 100)}`);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Не JSON — просто эхо
      ws.send(JSON.stringify({
        type: "echo",
        data: text,
        serverTime: Date.now(),
      }));
      return;
    }

    // Обработка команд
    if (parsed.type === "ping") {
      ws.send(JSON.stringify({ type: "pong", ts: parsed.ts, serverTs: Date.now() }));
      return;
    }

    if (parsed.type === "broadcast") {
      // Разослать всем подключённым клиентам
      let count = 0;
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "broadcast",
            from: id,
            data: parsed.data,
            serverTime: Date.now(),
          }));
          count++;
        }
      });
      ws.send(JSON.stringify({ type: "broadcast_ack", recipients: count }));
      return;
    }

    if (parsed.type === "stats") {
      ws.send(JSON.stringify({
        type: "stats",
        connectedClients: wss.clients.size,
        serverUptime: process.uptime().toFixed(1) + "s",
        serverTime: Date.now(),
      }));
      return;
    }

    // Default: echo
    ws.send(JSON.stringify({
      type: "echo",
      original: parsed,
      serverTime: Date.now(),
      connectedClients: wss.clients.size,
    }));
  });

  ws.on("close", (code, reason) => {
    console.log(`[${id}] Disconnected — code: ${code}, reason: "${reason.toString()}"`);
  });

  ws.on("error", (err) => {
    console.error(`[${id}] Error:`, err.message);
  });
});

// Heartbeat интервал — проверяем что клиенты живы
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log("Client not responding to ping, terminating");
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30_000);

wss.on("close", () => clearInterval(heartbeatInterval));

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  wss.close(() => process.exit(0));
});
