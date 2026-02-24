# 05 · WebSockets / WebRTC

[← На главную](../README.md)

Real-time коммуникация в вебе — от простого WebSocket до peer-to-peer видеозвонка.

> **Запуск примеров:**
> - HTML файлы → открывай в браузере
> - Node.js серверы → `npm install ws` затем `node server.js`

---

## Подмодули

| # | Тема | Ключевые концепции |
|---|------|--------------------|
| 01 | [WebSocket Protocol](./01-websocket-protocol/README.md) | HTTP Upgrade handshake, фреймы, готовые состояния, browser API |
| 02 | [WebSocket Patterns](./02-websocket-patterns/README.md) | Reconnection, heartbeat, backpressure, бинарные данные, Node.js сервер |
| 03 | [WebRTC Basics](./03-webrtc-basics/README.md) | RTCPeerConnection, SDP, ICE, STUN/TURN, NAT traversal |
| 04 | [WebRTC Data Channel](./04-webrtc-datachannel/README.md) | RTCDataChannel, local loopback demo, MediaStream |
| 05 | [Real-time Patterns](./05-realtime-patterns/README.md) | Presence, rooms, pub/sub, chat архитектура, scaling |

---

## Карта технологий

```
Клиент ←──────────────────────────────── Сервер
        WebSocket (full-duplex, TCP)
        SSE (Server-Sent Events, HTTP/1.1)
        Long Polling (HTTP, legacy)
        HTTP/2 Server Push

Клиент ←──────────────────────────────── Клиент
        WebRTC (peer-to-peer, UDP/DTLS)
        ├── MediaStream (video/audio)
        ├── RTCDataChannel (binary/text)
        └── STUN/TURN (NAT traversal)
```

---

## Сравнение протоколов реального времени

| Протокол | Направление | Транспорт | Latency | Use case |
|----------|-------------|-----------|---------|----------|
| WebSocket | Bidirectional | TCP | ~10-50ms | Чат, игры, trading |
| SSE | Server→Client | HTTP | ~50-100ms | Live feed, уведомления |
| Long Polling | Server→Client | HTTP | 100-500ms | Legacy, fallback |
| WebRTC Data | Peer-to-peer | UDP/SCTP | ~1-20ms | P2P чат, file transfer |
| WebRTC Media | Peer-to-peer | UDP/RTP | ~1-20ms | Video/audio calls |

---

## Топ вопросов на интервью

```
WebSocket:  Как устроен WebSocket handshake?
            Что такое masking и зачем он нужен?
            Как реализовать reconnection с backoff?
            Почему WebSocket НЕ использует HTTP после handshake?

WebRTC:     Что такое SDP? Что в нём содержится?
            Как работает ICE и NAT traversal?
            STUN vs TURN — в чём разница?
            Что такое signaling server и почему WebRTC его не включает?
            Разница между RTCDataChannel (ordered) и (unordered)?

Architecture: Как масштабировать WebSocket сервер горизонтально?
              Что такое sticky sessions и зачем они нужны?
              Как реализовать presence system?
              Чем отличается fan-out от pub/sub?
```
