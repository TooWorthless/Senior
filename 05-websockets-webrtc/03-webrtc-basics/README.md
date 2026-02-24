# 03 · WebRTC Basics

[← WebSockets / WebRTC](../README.md)

---

## Содержание

1. [Архитектура WebRTC](#архитектура-webrtc)
2. [SDP — Session Description Protocol](#sdp)
3. [ICE — Interactive Connectivity Establishment](#ice)
4. [STUN и TURN серверы](#stun-и-turn)
5. [Signaling — обмен SDP и ICE](#signaling)
6. [RTCPeerConnection API](#rtcpeerconnection-api)
7. [NAT Traversal](#nat-traversal)
8. [Вопросы на интервью](#вопросы-на-интервью)

---

## Архитектура WebRTC

```
Peer A                    Signaling Server              Peer B
  │                            │                           │
  │──── offer (SDP) ──────────►│──── offer (SDP) ─────────►│
  │                            │                           │
  │◄─── answer (SDP) ──────────│◄─── answer (SDP) ─────────│
  │                            │                           │
  │──── ICE candidate ────────►│──── ICE candidate ───────►│
  │◄─── ICE candidate ─────────│◄─── ICE candidate ────────│
  │                            │                           │
  │◄══════════════════════════════════════════════════════►│
            Прямое P2P соединение (UDP/DTLS/SRTP)
         (signaling server больше не нужен)
```

**Компоненты:**
- **Signaling** — обмен SDP и ICE через любой канал (WebSocket, HTTP, QR-код — WebRTC не определяет)
- **STUN** — узнать свой публичный IP/порт
- **TURN** — relay сервер когда прямое соединение невозможно
- **ICE** — алгоритм поиска лучшего пути между пирами
- **DTLS** — шифрование (поверх UDP, аналог TLS)
- **SRTP** — шифрованный медиа-трафик
- **SCTP** — надёжные/упорядоченные данные (для DataChannel)

---

## SDP

**Session Description Protocol** — текстовый формат описания медиасессии.

```
v=0
o=- 1234567890 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=msid-semantic: WMS stream1

m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:some_ufrag
a=ice-pwd:some_password_here
a=fingerprint:sha-256 AB:CD:EF:...
a=setup:actpass
a=mid:0
a=rtpmap:111 opus/48000/2     ← кодек Opus для аудио
a=rtpmap:103 ISAC/16000
a=ssrc:1234 cname:stream1

m=video 9 UDP/TLS/RTP/SAVPF 96 97 98
...
a=rtpmap:96 VP8/90000          ← кодек VP8 для видео
a=rtpmap:97 VP9/90000
a=rtpmap:98 H264/90000
```

**SDP содержит:**
- Медиа типы (audio, video, data)
- Кодеки и их параметры
- ICE credentials (ufrag + password)
- DTLS fingerprint (для проверки сертификата)
- Направление потока: `sendrecv`, `sendonly`, `recvonly`, `inactive`

**Offer/Answer модель:**
```
1. Caller создаёт offer SDP (с поддерживаемыми кодеками)
2. Callee получает offer, создаёт answer SDP (выбирает пересечение кодеков)
3. После обмена — оба знают что использовать
```

---

## ICE

**Interactive Connectivity Establishment** — алгоритм поиска рабочего пути.

```
ICE Candidate типы:
┌─────────────────────────────────────────────────────────────┐
│ host      — локальный IP (192.168.1.5:54321)                │
│ srflx     — server-reflexive: публичный IP через STUN       │
│             (203.0.113.1:45678 через stun.google.com)       │
│ prflx     — peer-reflexive: обнаружен в процессе проверки   │
│ relay     — TURN relay (только если host/srflx не сработали)│
└─────────────────────────────────────────────────────────────┘

Приоритет: host > srflx > prflx > relay
```

**ICE процесс:**
```
1. Gather phase: собрать все кандидаты (host + STUN + TURN)
2. Exchange: передать кандидаты через signaling
3. Connectivity checks: проверить все пары кандидатов (UDP packets)
4. Select: выбрать рабочую пару с наивысшим приоритетом
5. Nominate: зафиксировать выбранный путь
```

**Trickle ICE** — отправлять кандидаты по мере их получения (не ждать завершения сбора):

```javascript
// Trickle ICE — лучший UX: не ждём полный gather
pc.onicecandidate = (e) => {
  if (e.candidate) {
    // Немедленно отправляем через signaling
    signalingChannel.send({ type: "ice-candidate", candidate: e.candidate });
  } else {
    // e.candidate === null → сбор завершён
    console.log("ICE gathering complete");
  }
};
```

---

## STUN и TURN

```
╔══════════════════════════════════════════════════════╗
║  STUN (Session Traversal Utilities for NAT)          ║
║                                                      ║
║  Клиент ──────────────────► STUN Server              ║
║  192.168.1.5:54321     "Кто я снаружи?"              ║
║                             │                        ║
║  Клиент ◄────────────────── STUN Server              ║
║  "Твой публичный адрес: 203.0.113.1:45678"           ║
║                                                      ║
║  Бесплатный: stun:stun.l.google.com:19302            ║
╚══════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════╗
║  TURN (Traversal Using Relays around NAT)            ║
║                                                      ║
║  Peer A ──────► TURN Server ◄────── Peer B           ║
║                     │                               ║
║              Relay для трафика                       ║
║                                                      ║
║  Нужен когда: симметричный NAT, корпоративный        ║
║  файрвол, мобильная сеть                             ║
║  Платный (трафик через сервер): Twilio, Coturn       ║
╚══════════════════════════════════════════════════════╝
```

```javascript
// Конфигурация ICE серверов
const config = {
  iceServers: [
    // STUN (бесплатно, только публичный IP)
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },

    // TURN (платно, гарантированное соединение)
    {
      urls: "turn:turn.example.com:3478",
      username: "user",
      credential: "password",
    },
    // TURN over TLS (для жёстких файрволов)
    {
      urls: "turns:turn.example.com:5349",
      username: "user",
      credential: "password",
    },
  ],
  // Политика ICE transport
  iceTransportPolicy: "all", // "all" | "relay" (принудительно через TURN)
  // "relay" используй для debugging или когда P2P запрещён политикой
  bundlePolicy: "max-bundle",   // объединить всё в один UDP порт
  rtcpMuxPolicy: "require",
};

const pc = new RTCPeerConnection(config);
```

---

## Signaling

WebRTC не определяет signaling — ты выбираешь сам. Главное: передать SDP и ICE кандидаты.

```javascript
// Типичная signaling реализация через WebSocket

// ─── Caller (инициатор звонка) ─────────────────────
const pc = new RTCPeerConnection(iceConfig);

// 1. Создать offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

// 2. Отправить offer через signaling
signalingWs.send(JSON.stringify({
  type: "offer",
  sdp: offer,
  to: "bob",
}));

// 3. Получить answer
signalingWs.onmessage = async (e) => {
  const msg = JSON.parse(e.data);

  if (msg.type === "answer") {
    await pc.setRemoteDescription(msg.sdp);
  }
  if (msg.type === "ice-candidate") {
    await pc.addIceCandidate(msg.candidate);
  }
};

// 4. Trickle ICE — отправлять кандидаты сразу
pc.onicecandidate = ({ candidate }) => {
  if (candidate) {
    signalingWs.send(JSON.stringify({
      type: "ice-candidate",
      candidate,
      to: "bob",
    }));
  }
};

// ─── Callee (принимает звонок) ─────────────────────
signalingWs.onmessage = async (e) => {
  const msg = JSON.parse(e.data);

  if (msg.type === "offer") {
    const pc = new RTCPeerConnection(iceConfig);

    await pc.setRemoteDescription(msg.sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    signalingWs.send(JSON.stringify({
      type: "answer",
      sdp: answer,
      to: msg.from,
    }));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) signalingWs.send(JSON.stringify({ type: "ice-candidate", candidate }));
    };
  }
};
```

---

## RTCPeerConnection API

```javascript
const pc = new RTCPeerConnection(config);

// ─── Медиа ────────────────────────────────────────
// Получить доступ к камере/микрофону
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

// Добавить треки в соединение
stream.getTracks().forEach(track => pc.addTrack(track, stream));

// Получить треки от удалённого пира
pc.ontrack = (e) => {
  remoteVideo.srcObject = e.streams[0];
};

// Screen sharing
const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
const [screenTrack] = screenStream.getVideoTracks();
const sender = pc.getSenders().find(s => s.track?.kind === "video");
await sender.replaceTrack(screenTrack); // заменить камеру на экран (без renegotiation)

// ─── Data Channel ─────────────────────────────────
const dataChannel = pc.createDataChannel("chat", {
  ordered: true,      // гарантированный порядок (SCTP)
  maxRetransmits: 3,  // или maxPacketLifeTime (мс)
});
// Или принять от другого пира:
pc.ondatachannel = (e) => { const ch = e.channel; };

// ─── ICE состояния ────────────────────────────────
pc.oniceconnectionstatechange = () => {
  // "new" → "checking" → "connected" → "completed"
  // "failed" → (iceRestart)
  // "disconnected" → (временный разрыв)
  console.log("ICE:", pc.iceConnectionState);
  if (pc.iceConnectionState === "failed") {
    pc.restartIce(); // пересобрать ICE кандидаты
  }
};

pc.onconnectionstatechange = () => {
  // "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed"
  console.log("Connection:", pc.connectionState);
};

pc.onsignalingstatechange = () => {
  // "stable" | "have-local-offer" | "have-remote-offer" | ...
  console.log("Signaling:", pc.signalingState);
};

// ─── Статистика ───────────────────────────────────
const stats = await pc.getStats();
stats.forEach(report => {
  if (report.type === "inbound-rtp") {
    console.log("Received:", report.bytesReceived, "bytes,", report.packetsLost, "lost");
  }
  if (report.type === "outbound-rtp") {
    console.log("Sent:", report.bytesSent, "bytes");
  }
  if (report.type === "candidate-pair" && report.state === "succeeded") {
    console.log("RTT:", report.currentRoundTripTime * 1000, "ms");
  }
});

// Закрытие
pc.close();
```

---

## NAT Traversal

```
Типы NAT (от простого к сложному):

1. Full Cone NAT
   Внутренний порт → всегда один внешний порт
   Любой внешний хост может слать пакеты на этот порт
   → Легко пробить через STUN

2. Restricted Cone NAT
   Только хосты, к которым уже обращался клиент
   → Пробивается hole punching

3. Port Restricted Cone NAT
   Только конкретный хост:порт
   → Пробивается hole punching (одновременно с обеих сторон)

4. Symmetric NAT ← САМЫЙ СЛОЖНЫЙ
   Каждое новое соединение → новый внешний порт
   STUN узнаёт неправильный порт
   → Нужен TURN (relay)

Hole Punching (UDP):
  Peer A (192.168.1.5) → NAT A (1.2.3.4:1111)
  Peer B (10.0.0.5)   → NAT B (5.6.7.8:2222)

  A отправляет UDP на 5.6.7.8:2222 → "пробивает дыру" в NAT A
  B отправляет UDP на 1.2.3.4:1111 → проходит через открытую дыру!
  Соединение установлено без сервера-посредника
```

---

## Вопросы на интервью

1. **Что такое SDP и что в нём содержится?**
   > SDP (Session Description Protocol) — текстовый формат описания медиасессии. Содержит: поддерживаемые кодеки (Opus, VP8, H.264), медиа типы (audio/video/data), ICE credentials (ufrag + password для проверки кандидатов), DTLS fingerprint (хэш сертификата для шифрования), направление потока (sendrecv/sendonly/recvonly). Offer — от инициатора, Answer — ответ с выбранными параметрами (пересечение возможностей).

2. **Как работает ICE и NAT traversal?**
   > ICE собирает кандидатов: host (локальный IP), srflx (публичный IP через STUN), relay (TURN). Проверяет все пары кандидатов (connectivity checks — UDP пакеты). Выбирает лучший рабочий путь (приоритет: host > srflx > relay). Hole punching — оба пира одновременно отправляют UDP друг другу, NAT открывает "дыру" для входящих пакетов.

3. **STUN vs TURN — в чём разница?**
   > STUN — узнать свой публичный IP/порт (NAT mapping). Трафик НЕ идёт через сервер. Работает для большинства NAT типов. Бесплатный (google: stun.l.google.com:19302). TURN — relay: весь трафик идёт через сервер. Нужен при symmetric NAT, корпоративных файрволах. Дорогой (bandwidth). Всегда работает. Production конфигурация: STUN + TURN как fallback.

4. **Что такое signaling и почему WebRTC его не включает?**
   > Signaling — обмен SDP и ICE кандидатами до установки прямого соединения. WebRTC умышленно не определяет протокол signaling — это позволяет использовать любой канал (WebSocket, HTTP, имейл, QR-код). Разделение ответственности: WebRTC — прямая P2P связь, signaling — выбор разработчика.

5. **Почему WebRTC использует UDP а не TCP?**
   > Для медиа (аудио/видео) потеря пакетов лучше задержки. TCP при потере перепосылает → jitter и задержки → неприемлемо для real-time. UDP с SRTP и встроенной коррекцией ошибок (NACK, FEC) обеспечивает лучший real-time experience. RTCDataChannel с ordered=true использует SCTP поверх UDP — надёжность реализована на уровне приложения без блокировки.

---

## Пример

```
Открой в браузере:
05-websockets-webrtc/03-webrtc-basics/examples/webrtc-concepts.html
```
