# 04 · Производительность HTML

[← HTML](../README.md)

---

## Содержание

1. [Critical Rendering Path](#critical-rendering-path)
2. [Scripts: async vs defer vs module](#scripts-async-vs-defer-vs-module)
3. [Resource Hints](#resource-hints)
4. [fetchpriority — Priority Hints](#fetchpriority--priority-hints)
5. [loading attribute](#loading-attribute)
6. [Вопросы на интервью](#вопросы-на-интервью)
7. [Примеры кода](#примеры-кода)

---

## Critical Rendering Path

CRP — последовательность шагов браузера от получения HTML до отрисовки пикселей:

```
HTML → DOM → CSSOM → Render Tree → Layout → Paint → Composite
```

Что блокирует CRP:
- CSS в `<head>` — блокирует **rendering** (ждёт CSSOM)
- `<script>` без `async`/`defer` — блокирует **parsing HTML** и rendering

Метрики, на которые влияет HTML-разметка:
- **FCP** (First Contentful Paint) — когда появился первый контент
- **LCP** (Largest Contentful Paint) — когда загрузился главный контент
- **TBT** (Total Blocking Time) — время блокировки main thread
- **CLS** (Cumulative Layout Shift) — визуальная стабильность

---

## Scripts: async vs defer vs module

Самый частый вопрос на интервью по HTML-производительности.

### Визуальная схема

```
NORMAL:
HTML:   =====[STOP]====[parsing]=========[STOP]====[parsing]====>
Script:       [download+execute  ]       [download+execute]

DEFER:
HTML:   =====[parse continuously................]===>[DOMContentLoaded]
Script:       [download    ]                   [execute after parse]
Script2:             [download        ]              [execute in order]

ASYNC:
HTML:   =====[parse...][STOP][parse...][STOP][parse...]============>
Script:       [download ][exec]
Script2:              [download    ][exec]

MODULE (type="module"):
HTML:   =====[parse continuously..........]===>[DOMContentLoaded]
Script:       [download    ]                 [execute after parse, in order]
             (как defer, но scope изолирован)
```

### Сравнение

| | Обычный | `defer` | `async` | `type="module"` |
|---|---------|---------|---------|-----------------|
| Блокирует парсинг при загрузке | ❌ Да | ✅ Нет | ✅ Нет | ✅ Нет |
| Блокирует парсинг при выполнении | ❌ Да | — | ❌ Да | — |
| Выполняется после парсинга | — | ✅ Да | ❌ Нет | ✅ Да |
| Гарантирует порядок | — | ✅ Да | ❌ Нет | ✅ Да |
| DOMContentLoaded ждёт | ❌ Да | ✅ Да | ❌ Нет | ✅ Да |
| Работает только с `src` | — | ✅ Да | ✅ Да | ❌ (есть inline) |
| Изолированный scope | ❌ | ❌ | ❌ | ✅ |
| `use strict` по умолчанию | ❌ | ❌ | ❌ | ✅ |
| CORS для cross-origin | ❌ | ❌ | ❌ | ✅ |

### Когда что использовать

```html
<!-- defer: скрипты которые нужны после загрузки DOM, порядок важен -->
<script src="vendor.js" defer></script>
<script src="app.js" defer></script>  <!-- выполнится после vendor.js -->

<!-- async: независимые скрипты без зависимостей (аналитика, реклама) -->
<script src="analytics.js" async></script>

<!-- module: современные ES-модули -->
<script type="module" src="app.js"></script>

<!-- module inline: нет src, defer поведение автоматически -->
<script type="module">
  import { init } from './app.js';
  init();
</script>
```

> 💬 **Вопрос на интервью:** «Два `defer` скрипта — в каком порядке выполнятся?»

**Ответ:** В порядке объявления в HTML. `defer` гарантирует порядок. `async` — нет, выполняется по готовности загрузки.

> ⚠️ **Ловушка:** `async` на `<script>` в `<head>` с `DOMContentLoaded` — опасная комбинация. Если async-скрипт загрузится до парсинга DOM, `DOMContentLoaded` ещё не сработает, но DOM может быть неполным.

---

## Resource Hints

Подсказки браузеру для упреждающей загрузки ресурсов.

### `preload` — загрузить сейчас, использовать позже

Высокий приоритет. Для ресурсов текущей страницы которые нужны скоро.

```html
<!-- Шрифт — обязательно crossorigin, даже для same-origin -->
<link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin>

<!-- Критический CSS для above-the-fold -->
<link rel="preload" href="/styles/critical.css" as="style">

<!-- LCP изображение -->
<link rel="preload" href="/hero.webp" as="image">

<!-- JS-скрипт который нужен сразу -->
<link rel="preload" href="/app.js" as="script">

<!-- Видео автоплей -->
<link rel="preload" href="/intro.mp4" as="video" type="video/mp4">
```

> ⚠️ **Ловушка:** `preload` без использования ресурса в течение 3 секунд вызывает предупреждение в консоли и впустую занимает пропускную способность. Preload только то, что точно нужно на текущей странице.

> ⚠️ **Ловушка:** `<link rel="preload" as="font">` без `crossorigin` загружает шрифт дважды — один раз по preload, второй раз по нормальному запросу с CORS. Это баг, который легко пропустить.

### `prefetch` — загрузить для следующей страницы

Низкий приоритет. Браузер загружает в idle time.

```html
<!-- Страница которую пользователь, вероятно, откроет следующей -->
<link rel="prefetch" href="/checkout">
<link rel="prefetch" href="/products/detail.js" as="script">
```

### `preconnect` — установить соединение заранее

DNS lookup + TCP + TLS handshake. Для third-party доменов.

```html
<!-- CDN для шрифтов -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- API endpoint -->
<link rel="preconnect" href="https://api.example.com">

<!-- Аналитика -->
<link rel="preconnect" href="https://www.google-analytics.com">
```

### `dns-prefetch` — только DNS

Более легковесный чем `preconnect`. Для браузеров без поддержки preconnect или как fallback.

```html
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
```

### `modulepreload` — preload для ES-модулей

Загружает модуль и его граф зависимостей.

```html
<link rel="modulepreload" href="/app.js">
<link rel="modulepreload" href="/utils.js">
```

### Сравнение resource hints

| Hint | Приоритет | Что делает | Когда использовать |
|------|-----------|------------|-------------------|
| `preload` | Высокий | Загружает ресурс | Критические ресурсы текущей страницы |
| `prefetch` | Низкий | Кэширует ресурс | Ресурсы следующей страницы |
| `preconnect` | Средний | DNS+TCP+TLS | Third-party домены с важными ресурсами |
| `dns-prefetch` | Низкий | Только DNS | Много третьих доменов |
| `modulepreload` | Высокий | ES-модуль + зависимости | ES-модули на текущей странице |

---

## fetchpriority — Priority Hints

Новый атрибут (2023+, Chromium, Safari 17.2+). Управляет приоритетом загрузки ресурса.

```html
<!-- LCP изображение: поднимаем приоритет -->
<img
  src="/hero.webp"
  alt="Главный баннер"
  fetchpriority="high"
  loading="eager"
>

<!-- Изображения ниже fold: понижаем -->
<img src="/product-1.webp" alt="..." fetchpriority="low" loading="lazy">

<!-- Preload с fetchpriority -->
<link rel="preload" href="/font.woff2" as="font" fetchpriority="high" crossorigin>

<!-- Скрипт аналитики — явно низкий приоритет -->
<script src="analytics.js" async fetchpriority="low"></script>

<!-- Fetch API -->
<script>
  fetch('/api/critical', { priority: 'high' });
  fetch('/api/secondary', { priority: 'low' });
</script>
```

Значения: `"high"`, `"low"`, `"auto"` (по умолчанию).

---

## loading attribute

### Изображения

```html
<!-- loading="lazy": откладывает загрузку до приближения к viewport -->
<img src="/product.webp" alt="Товар" loading="lazy" width="300" height="200">

<!-- loading="eager": загружает немедленно (поведение по умолчанию) -->
<!-- Явно указывайте для LCP-изображения чтобы отменить lazy если оно установлено глобально -->
<img src="/hero.webp" alt="Баннер" loading="eager" fetchpriority="high">
```

> ⚠️ **Ловушка:** `loading="lazy"` на LCP-изображении — критическая ошибка производительности. Браузер будет ждать пока изображение войдёт в viewport, что задержит LCP. Первые 2-3 изображения в видимой части страницы должны быть `loading="eager"` или без атрибута.

> ⚠️ **Ловушка:** Изображение без атрибутов `width` и `height` при `loading="lazy"` вызывает CLS — браузер не резервирует место, страница «прыгает» когда изображение загружается.

### Iframe

```html
<iframe src="/map" loading="lazy" title="Карта офиса"></iframe>
```

---

## Вопросы на интервью

1. **В чём разница между `preload` и `prefetch`?**
   > `preload` — высокий приоритет, для ресурсов текущей страницы, загружается немедленно. `prefetch` — низкий приоритет, для ресурсов следующей страницы, загружается в idle time.

2. **Почему `<link rel="preload" as="font">` требует атрибут `crossorigin`?**
   > Запросы шрифтов браузер делает с CORS (анонимным режимом). Если preload-запрос сделан без `crossorigin`, а последующий запрос — с CORS, они не совпадут в кэше, и шрифт загрузится дважды.

3. **Как `async` и `defer` влияют на DOMContentLoaded?**
   > `async` не ждёт DOMContentLoaded, выполняется когда загрузится. `defer` — выполняется строго до DOMContentLoaded. Обычный `<script>` блокирует парсинг и DOMContentLoaded ждёт его.

4. **Что такое render-blocking resource и как с ним бороться?**
   > CSS в `<head>` блокирует rendering — браузер не рисует страницу до построения CSSOM. Решения: inline critical CSS, `<link rel="preload" as="style">`, загрузка некритического CSS через JS.

5. **Как `fetchpriority` отличается от `preload`?**
   > `preload` говорит «загрузи этот ресурс раньше». `fetchpriority` говорит «с каким приоритетом его загружать». Они дополняют друг друга: `<link rel="preload" fetchpriority="high">`.

---

## Примеры кода

- [`examples/script-loading.html`](./examples/script-loading.html) — async, defer, module: порядок выполнения
- [`examples/resource-hints.html`](./examples/resource-hints.html) — полный набор resource hints в контексте страницы
