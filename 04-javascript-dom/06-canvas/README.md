# 06 · Canvas 2D API

[← JavaScript & DOM](../README.md)

---

## Содержание

1. [Canvas basics — контекст и координаты](#canvas-basics)
2. [Примитивы: прямоугольники, пути, дуги](#примитивы)
3. [Стили, градиенты, тени](#стили)
4. [Текст](#текст)
5. [Изображения и трансформации](#изображения-и-трансформации)
6. [Анимация с requestAnimationFrame](#анимация)
7. [Pixel manipulation — ImageData](#pixel-manipulation)
8. [OffscreenCanvas](#offscreencanvas)
9. [Вопросы на интервью](#вопросы-на-интервью)

---

## Canvas basics

```javascript
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d"); // 2D контекст
// Другие контексты: "webgl", "webgl2", "bitmaprenderer"

// Физический vs CSS размер
canvas.width = 800;   // физические пиксели (влияет на качество)
canvas.height = 600;
canvas.style.width = "400px"; // CSS размер (display)
canvas.style.height = "300px";
// Для Retina:
const dpr = window.devicePixelRatio || 1;
canvas.width = 400 * dpr;
canvas.height = 300 * dpr;
canvas.style.width = "400px";
canvas.style.height = "300px";
ctx.scale(dpr, dpr); // масштабировать весь контекст

// Система координат: (0,0) = левый верхний угол
// X растёт вправо, Y растёт вниз

// Очистка
ctx.clearRect(0, 0, canvas.width, canvas.height); // прозрачно
ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);  // цветной фон

// Save / Restore — стек состояния контекста
ctx.save();                    // сохранить: fillStyle, transform, clip, etc.
ctx.fillStyle = "red";
ctx.translate(100, 100);
// ... рисование
ctx.restore();                 // вернуть предыдущее состояние
```

---

## Примитивы

```javascript
// Прямоугольники
ctx.fillRect(x, y, width, height);    // залитый
ctx.strokeRect(x, y, width, height);  // контур
ctx.clearRect(x, y, width, height);   // стереть (прозрачность)

// Пути (Path)
ctx.beginPath();                       // начать новый путь
ctx.moveTo(x, y);                      // переместить "перо" без рисования
ctx.lineTo(x, y);                      // линия до точки
ctx.closePath();                       // закрыть путь (линия к начальной точке)
ctx.stroke();                          // нарисовать контур
ctx.fill();                            // залить

// Дуги и окружности
ctx.arc(cx, cy, radius, startAngle, endAngle, counterClockwise);
// Углы в радианах: 0 = 3 часа, Math.PI/2 = 6 часов
ctx.arc(100, 100, 50, 0, Math.PI * 2); // полная окружность
ctx.arc(100, 100, 50, 0, Math.PI);     // полуокружность

// Кривые Безье
ctx.quadraticCurveTo(cpX, cpY, endX, endY);      // квадратичная (1 точка управления)
ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY); // кубическая (2 точки)

// Rounded rectangle (ES2023)
ctx.roundRect(x, y, w, h, radius);    // или массив радиусов [tl, tr, br, bl]

// Path2D — переиспользуемый путь
const star = new Path2D();
for (let i = 0; i < 5; i++) {
  const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
  star[i === 0 ? "moveTo" : "lineTo"](
    100 + 50 * Math.cos(angle),
    100 + 50 * Math.sin(angle)
  );
}
star.closePath();
ctx.fill(star); // многократно без пересоздания

// Hit testing
ctx.isPointInPath(path, x, y); // курсор внутри пути?
ctx.isPointInStroke(path, x, y);
```

---

## Стили

```javascript
// Цвет и прозрачность
ctx.fillStyle   = "#ff0000";
ctx.fillStyle   = "rgb(255, 0, 0)";
ctx.fillStyle   = "rgba(255, 0, 0, 0.5)";
ctx.fillStyle   = "hsl(0, 100%, 50%)";
ctx.strokeStyle = "blue";
ctx.globalAlpha = 0.7; // глобальная прозрачность

// Линии
ctx.lineWidth    = 2;
ctx.lineCap      = "butt" | "round" | "square";
ctx.lineJoin     = "miter" | "round" | "bevel";
ctx.setLineDash([5, 10]);     // штриховая: 5px штрих, 10px пробел
ctx.lineDashOffset = 0;       // сдвиг паттерна (для анимации "муравьёв")

// Линейный градиент
const linearGrad = ctx.createLinearGradient(x1, y1, x2, y2);
linearGrad.addColorStop(0, "#ff0000");
linearGrad.addColorStop(0.5, "#00ff00");
linearGrad.addColorStop(1, "#0000ff");
ctx.fillStyle = linearGrad;

// Радиальный градиент
const radialGrad = ctx.createRadialGradient(cx1, cy1, r1, cx2, cy2, r2);
radialGrad.addColorStop(0, "white");
radialGrad.addColorStop(1, "black");

// Конический градиент (Chrome 99+)
const conic = ctx.createConicGradient(angle, cx, cy);
conic.addColorStop(0, "red");
conic.addColorStop(0.5, "blue");

// Паттерн
const img = document.getElementById("pattern-img");
const pattern = ctx.createPattern(img, "repeat"); // repeat|repeat-x|repeat-y|no-repeat
ctx.fillStyle = pattern;

// Тень
ctx.shadowColor   = "rgba(0,0,0,0.5)";
ctx.shadowBlur    = 10;
ctx.shadowOffsetX = 5;
ctx.shadowOffsetY = 5;

// Blend modes
ctx.globalCompositeOperation = "source-over"; // default
// Другие: "multiply", "screen", "overlay", "destination-over", "xor", ...
```

---

## Текст

```javascript
ctx.font         = "bold 24px Arial, sans-serif";
ctx.textAlign    = "left" | "center" | "right" | "start" | "end";
ctx.textBaseline = "top" | "middle" | "bottom" | "alphabetic" | "hanging";
ctx.direction    = "ltr" | "rtl";

ctx.fillText("Hello Canvas!", x, y);           // текст
ctx.fillText("Hello", x, y, maxWidth);         // с ограничением ширины
ctx.strokeText("Outline text", x, y);          // контурный текст

// Размер текста
const metrics = ctx.measureText("Hello Canvas!");
metrics.width;                     // ширина
metrics.actualBoundingBoxAscent;   // высота над baseline
metrics.actualBoundingBoxDescent;  // высота под baseline

// Пример центрирования текста
function drawCenteredText(ctx, text, canvasWidth, canvasHeight) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
}
```

---

## Изображения и трансформации

```javascript
// Рисование изображения
ctx.drawImage(img, dx, dy);                    // позиция
ctx.drawImage(img, dx, dy, dw, dh);            // с масштабированием
ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh); // вырезка + масштаб
// img: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap

// Трансформации (матрица)
ctx.translate(x, y);           // сдвиг системы координат
ctx.rotate(angle);             // поворот (радианы)
ctx.scale(sx, sy);             // масштаб
ctx.transform(a, b, c, d, e, f); // произвольная матрица (2×3)
ctx.setTransform(1, 0, 0, 1, 0, 0); // сброс к identity

// Паттерн: save/translate/rotate/draw/restore
function drawRotatedRect(ctx, x, y, w, h, angle) {
  ctx.save();
  ctx.translate(x + w/2, y + h/2); // центр прямоугольника
  ctx.rotate(angle);
  ctx.fillRect(-w/2, -h/2, w, h);  // рисуем от центра
  ctx.restore();
}

// Clip region
ctx.save();
ctx.beginPath();
ctx.arc(100, 100, 80, 0, Math.PI * 2);
ctx.clip(); // всё последующее рисование — только внутри круга
ctx.drawImage(img, 20, 20);
ctx.restore(); // снять clip
```

---

## Анимация

```javascript
// Game loop паттерн
class GameLoop {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d");
    this.W = canvas.width;
    this.H = canvas.height;
    this.rafId = null;
    this.lastTime = 0;

    // Entities
    this.balls = Array.from({ length: 10 }, () => ({
      x: Math.random() * this.W,
      y: Math.random() * this.H,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      r: 10 + Math.random() * 20,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    }));
  }

  update(dt) {
    // dt — время с последнего кадра в секундах (frame-rate independent)
    for (const ball of this.balls) {
      ball.x += ball.vx * dt * 60;
      ball.y += ball.vy * dt * 60;

      if (ball.x < ball.r || ball.x > this.W - ball.r) ball.vx *= -1;
      if (ball.y < ball.r || ball.y > this.H - ball.r) ball.vy *= -1;
    }
  }

  draw() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);

    for (const ball of this.balls) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
    }
  }

  loop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000; // секунды
    this.lastTime = timestamp;
    this.update(Math.min(dt, 0.1)); // не больше 100ms (защита от lag spike)
    this.draw();
    this.rafId = requestAnimationFrame(ts => this.loop(ts));
  }

  start() {
    this.rafId = requestAnimationFrame(ts => {
      this.lastTime = ts;
      this.loop(ts);
    });
  }

  stop() {
    cancelAnimationFrame(this.rafId);
  }
}
```

---

## Pixel manipulation

```javascript
// getImageData — получить пиксели
const imageData = ctx.getImageData(x, y, width, height);
const { data, width, height } = imageData;
// data — Uint8ClampedArray: [R,G,B,A, R,G,B,A, ...]
// Длина: width × height × 4

// Обход пикселей
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];

  // Перевод в grayscale (luminance)
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  data[i]     = gray;
  data[i + 1] = gray;
  data[i + 2] = gray;
}

ctx.putImageData(imageData, x, y); // вернуть обратно

// Позиция пикселя (x, y) в массиве:
function pixelIndex(x, y, width) {
  return (y * width + x) * 4;
}

// Чтение одного пикселя (дорого для частого вызова!)
function getPixel(ctx, x, y) {
  const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
  return { r, g, b, a };
}

// Создание пустого ImageData
const blank = ctx.createImageData(width, height);
// Все пиксели: rgba(0,0,0,0)

// OffscreenCanvas для pixel работы в Worker
// (смотри ниже)
```

---

## OffscreenCanvas

```javascript
// Рендеринг в Web Worker без блокировки main thread
// main.js:
const canvas = document.getElementById("canvas");
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker("render-worker.js");
worker.postMessage({ canvas: offscreen }, [offscreen]);

// render-worker.js:
self.onmessage = ({ data: { canvas } }) => {
  const ctx = canvas.getContext("2d");

  function draw(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ... рисование
    requestAnimationFrame(draw); // работает и в Worker!
  }

  requestAnimationFrame(draw);
};

// OffscreenCanvas без transfer (для создания текстур, обработки изображений)
const oc = new OffscreenCanvas(200, 200);
const octx = oc.getContext("2d");
octx.fillStyle = "red";
octx.fillRect(0, 0, 200, 200);

// Конвертация в blob (асинхронно)
const blob = await oc.convertToBlob({ type: "image/png" });

// Использовать как источник для drawImage
ctx.drawImage(oc, 0, 0);
```

---

## Вопросы на интервью

1. **Canvas vs SVG — когда что?**
   > Canvas: пиксельный растровый рендеринг, идеален для игр/анимаций с тысячами объектов, pixel manipulation, video filters. Минусы: нет DOM-дерева, нет событий на отдельные фигуры, не масштабируется без потери качества. SVG: векторный, масштабируется бесконечно, каждый элемент — DOM-узел (события, CSS, ARIA), лучше для диаграмм, иконок, интерактивных карт. При >1000 интерактивных объектов — Canvas быстрее.

2. **Что такое `devicePixelRatio` и зачем?**
   > На Retina (HiDPI) экранах 1 CSS-пиксель = 2 (или 3) физических. Если не учесть, Canvas выглядит размытым. Решение: `canvas.width = cssWidth * dpr`, затем `ctx.scale(dpr, dpr)` — рисуем в CSS-координатах, но с физическим разрешением.

3. **Как сделать Canvas интерактивным (hit testing)?**
   > Canvas не имеет DOM-объектов. Варианты: 1) `ctx.isPointInPath(path, mx, my)` для проверки курсора внутри пути; 2) Color picking — каждому объекту уникальный цвет, рисовать в offscreen canvas, читать `getImageData` в точке курсора; 3) Хранить геометрию объектов в массиве, проверять вручную при mouse events.

4. **Зачем OffscreenCanvas?**
   > Позволяет рендерить в Web Worker, не блокируя main thread. Критично для тяжёлых игр или обработки изображений. После `canvas.transferControlToOffscreen()` worker полностью контролирует рендеринг. `requestAnimationFrame` доступен и в Workers.

5. **Как реализовать frame-rate independent анимацию?**
   > Использовать `dt` (delta time) — разницу времени между кадрами. Умножать скорость на `dt`: `x += speed * dt`. На 60fps: `dt ≈ 0.016s`. На 120fps: `dt ≈ 0.008s`. Объект проходит одинаковое расстояние за секунду независимо от fps. Защита: `Math.min(dt, 0.1)` против lag spike.

---

## Пример

```
Открой в браузере:
04-javascript-dom/06-canvas/examples/canvas.html
```
