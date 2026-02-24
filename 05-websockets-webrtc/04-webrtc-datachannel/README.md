# 04 · WebRTC DataChannel & Media

[← WebSockets / WebRTC](../README.md)

---

## Содержание

1. [RTCDataChannel](#rtcdatachannel)
2. [Ordered vs Unordered](#ordered-vs-unordered)
3. [MediaStream & getUserMedia](#mediastream--getusermedia)
4. [Local loopback demo](#local-loopback)
5. [Screen sharing](#screen-sharing)
6. [Вопросы на интервью](#вопросы-на-интервью)

---

## RTCDataChannel

Двунаправленный канал данных поверх SCTP/DTLS/UDP — без сервера-посредника.

```javascript
// ─── Создание через pc.createDataChannel() ──────
const pc = new RTCPeerConnection(config);
const channel = pc.createDataChannel("chat", {
  // Надёжная доставка (SCTP)
  ordered: true,           // гарантированный порядок сообщений
  maxRetransmits: null,    // бесконечные повторы (надёжно как TCP)
  // ИЛИ:
  maxRetransmits: 0,       // нет повторов (like UDP, минимум latency)
  maxPacketLifeTime: 100,  // максимум 100ms на доставку

  // ID и метки
  id: 0,                   // явный ID (negotiated: true)
  negotiated: false,       // false = создание через offer/answer
  label: "chat",           // имя канала

  protocol: "json",        // опциональный sub-protocol
});

// Нельзя одновременно: maxRetransmits И maxPacketLifeTime

// ─── Принять канал от remote peer ────────────────
pc.ondatachannel = (event) => {
  const channel = event.channel;
  setupChannel(channel);
};

// ─── API канала ──────────────────────────────────
function setupChannel(channel) {
  channel.onopen = () => {
    console.log("Channel open, bufferedAmountLowThreshold:", channel.bufferedAmountLowThreshold);
  };

  channel.onmessage = (event) => {
    if (typeof event.data === "string") {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } else {
      // ArrayBuffer
      handleBinary(event.data);
    }
  };

  channel.onclose = () => console.log("Channel closed");
  channel.onerror = (e) => console.error("Channel error", e.error);

  // Отправка
  channel.send("Hello P2P!");
  channel.send(JSON.stringify({ type: "chat", text: "Hi" }));
  channel.send(new Uint8Array([1, 2, 3])); // бинарные данные

  // Backpressure для DataChannel
  channel.bufferedAmountLowThreshold = 65535; // 64KB порог
  channel.onbufferedamountlow = () => {
    // Можно продолжать отправку
    resumeSending();
  };

  // Свойства
  channel.readyState;        // "connecting" | "open" | "closing" | "closed"
  channel.bufferedAmount;    // байт в очереди
  channel.label;             // "chat"
  channel.ordered;           // boolean
  channel.protocol;          // sub-protocol
  channel.id;                // числовой ID
}

// ─── Negotiated DataChannel ──────────────────────
// Оба пира создают канал с одинаковым id: без обмена в SDP
const dc1 = pc1.createDataChannel("file-transfer", { negotiated: true, id: 0 });
const dc2 = pc2.createDataChannel("file-transfer", { negotiated: true, id: 0 });
// Не нужно слушать ondatachannel — они автоматически связываются
```

---

## Ordered vs Unordered

```javascript
// ORDERED (надёжный, как TCP через SCTP):
// ✅ Гарантированный порядок
// ✅ Гарантированная доставка
// ❌ Head-of-line blocking: потеря пакета блокирует все последующие
// Use case: чат, файлы, gamestate sync

const chat = pc.createDataChannel("chat", { ordered: true });

// UNORDERED (ненадёжный, как UDP через SCTP):
// ✅ Минимальный latency (нет ожидания повторов)
// ✅ Нет head-of-line blocking
// ❌ Пакеты могут прийти не по порядку или пропасть
// Use case: game positions, cursor updates, video keyframes

const gamePos = pc.createDataChannel("game-positions", {
  ordered: false,
  maxRetransmits: 0, // нет повторов
});

// PARTIAL RELIABILITY:
// ordered: false, maxRetransmits: 2  → 2 попытки, не блокирует
// ordered: false, maxPacketLifeTime: 16  → доставить за 16ms или отбросить
// Идеально для real-time данных где свежесть важнее надёжности

const realtime = pc.createDataChannel("updates", {
  ordered: false,
  maxPacketLifeTime: 16, // 16ms = 1 кадр при 60fps
});

// Многоканальная архитектура для игры:
// channel "game-state"  → ordered: true  (важные события: убийство, смерть)
// channel "positions"   → ordered: false, maxPLT: 16ms  (позиции игроков)
// channel "chat"        → ordered: true  (сообщения чата)
```

---

## MediaStream & getUserMedia

```javascript
// Запрос доступа к камере и микрофону
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: "user", // "user" (фронтальная) | "environment" (основная)
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 48000,
  },
});

// Присоединить к <video>
const video = document.querySelector("video");
video.srcObject = stream;
video.play();

// Добавить треки в WebRTC
stream.getTracks().forEach(track => {
  pc.addTrack(track, stream);
});

// Получить треки от удалённого пира
pc.ontrack = (event) => {
  const [remoteStream] = event.streams;
  remoteVideo.srcObject = remoteStream;
};

// MediaStreamTrack управление
const videoTrack = stream.getVideoTracks()[0];
videoTrack.enabled = false;  // mute видео (трек продолжает идти, но чёрный)
videoTrack.stop();           // остановить (освободить камеру)

// Capabilities и settings
const settings = videoTrack.getSettings();
// { width: 1280, height: 720, frameRate: 30, deviceId: "..." }

const capabilities = videoTrack.getCapabilities();
await videoTrack.applyConstraints({ frameRate: { max: 15 } });

// Список устройств
const devices = await navigator.mediaDevices.enumerateDevices();
const cameras = devices.filter(d => d.kind === "videoinput");
const mics = devices.filter(d => d.kind === "audioinput");

// Переключение камеры
const newStream = await navigator.mediaDevices.getUserMedia({
  video: { deviceId: { exact: cameras[1].deviceId } },
});
const sender = pc.getSenders().find(s => s.track?.kind === "video");
await sender.replaceTrack(newStream.getVideoTracks()[0]);
// replaceTrack не требует SDP renegotiation!
```

---

## Local Loopback

Демонстрация WebRTC без реального signaling сервера — оба RTCPeerConnection в одной странице:

```javascript
// Упрощённый local loopback
async function createLoopback() {
  const pc1 = new RTCPeerConnection();
  const pc2 = new RTCPeerConnection();

  // "Signaling" — прямой вызов функций
  pc1.onicecandidate = ({ candidate }) => {
    if (candidate) pc2.addIceCandidate(candidate);
  };
  pc2.onicecandidate = ({ candidate }) => {
    if (candidate) pc1.addIceCandidate(candidate);
  };

  // DataChannel
  const dc1 = pc1.createDataChannel("test");
  pc2.ondatachannel = ({ channel: dc2 }) => {
    dc2.onmessage = (e) => console.log("pc2 received:", e.data);
  };

  // Offer/Answer
  const offer = await pc1.createOffer();
  await pc1.setLocalDescription(offer);
  await pc2.setRemoteDescription(offer);
  const answer = await pc2.createAnswer();
  await pc2.setLocalDescription(answer);
  await pc1.setRemoteDescription(answer);

  // Когда откроется — отправим
  dc1.onopen = () => dc1.send("Hello from pc1!");

  return { pc1, pc2, dc1 };
}
```

---

## Screen Sharing

```javascript
// getDisplayMedia — capture вкладки, окна или экрана
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    cursor: "always",           // показывать курсор
    displaySurface: "monitor",  // "monitor" | "window" | "browser"
    frameRate: { ideal: 15 },   // экран не нужен 60fps
    width: { ideal: 1920 },
  },
  audio: false, // системный аудио (поддержка браузерозависима)
  // audio: true → запись системного звука (только Chrome + Windows/Mac)
});

// Заменить видеодорожку в активном звонке
const screenTrack = screenStream.getVideoTracks()[0];
const sender = pc.getSenders().find(s => s.track?.kind === "video");
await sender.replaceTrack(screenTrack);
screenVideo.srcObject = screenStream;

// Вернуть камеру при остановке sharing
screenTrack.onended = async () => {
  const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
  const camTrack = camStream.getVideoTracks()[0];
  await sender.replaceTrack(camTrack);
};
```

---

## Вопросы на интервью

1. **Разница ordered и unordered DataChannel?**
   > Ordered (`ordered: true`) — SCTP обеспечивает порядок и доставку как TCP. Минус: head-of-line blocking. Unordered (`ordered: false, maxRetransmits: 0`) — как UDP, минимальный latency без блокировки. Partial reliability: `maxPacketLifeTime: 16` — отправить за 16ms или отбросить. В играх: важные события (ordered), позиции (unordered).

2. **Как работает DataChannel без сервера?**
   > После установки WebRTC соединения (offer/answer/ICE) — DataChannel работает через SCTP поверх DTLS поверх UDP. Прямое P2P соединение. Signaling нужен только для начального обмена SDP и ICE — потом канал независим.

3. **replaceTrack vs renegotiation?**
   > `sender.replaceTrack(newTrack)` — меняет трек без новых SDP переговоров, если тип медиа совпадает (видео на видео). Быстро, нет прерывания. SDP renegotiation нужна при: добавлении нового типа медиа, изменении кодеков, добавлении/удалении sender.

4. **Как mute видео/аудио в WebRTC?**
   > `track.enabled = false` — трек продолжает идти (pion/frame), но отправляет чёрное видео/тихое аудио. Удалённый пир не знает что muted. `track.stop()` — останавливает устройство (освобождает камеру). Для локальной отображения: `video.muted = true`. Для скрытия от remote: `enabled = false` на track.

---

## Пример

```
Открой в браузере:
05-websockets-webrtc/04-webrtc-datachannel/examples/datachannel-demo.html
```
