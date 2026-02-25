# 08 · Document & Head

[← HTML](../README.md)

---

## Содержание

1. [DOCTYPE](#doctype)
2. [Charset и кодировка](#charset-и-кодировка)
3. [Viewport meta](#viewport-meta)
4. [`<link>` rel типы](#link-rel-типы)
5. [`<base>` элемент](#base-элемент)
6. [Web App Manifest](#web-app-manifest)
7. [`<meta http-equiv>`](#meta-http-equiv)
8. [Вопросы на интервью](#вопросы-на-интервью)
9. [Примеры кода](#примеры-кода)

---

## DOCTYPE

```html
<!DOCTYPE html>
```

В 2025 году `<!DOCTYPE html>` — это не объявление версии HTML. Это **обязательный пролог** который переключает браузер из quirks mode в standards mode.

**Без DOCTYPE:** браузер использует `quirks mode` — режим обратной совместимости с браузерами 1990-х. Box model, вертикальное выравнивание и другие вещи ведут себя по-другому.

**С `<!DOCTYPE html>`:** включается `standards mode` (или `almost standards mode` для некоторых случаев).

> 💬 **Вопрос на интервью:** «Зачем DOCTYPE в HTML5 если он не указывает версию?»

**Ответ:** Исключительно для переключения в standards mode. Без него браузер активирует quirks mode для совместимости с IE6-эрой. Кратчайший HTML5 DOCTYPE (`<!DOCTYPE html>`) — результат реверс-инжиниринга того, что нужно только для переключения режима.

---

## Charset и кодировка

```html
<!-- ПЕРВЫМ тегом в <head>, до любого текстового контента -->
<meta charset="UTF-8">
```

> 💡 **Практика:** см. полный шаблон документа с DOCTYPE, `<meta charset>` и остальными тегами в [`examples/full-head-boilerplate.html`](./examples/full-head-boilerplate.html).

**Почему первым:** Браузер начинает интерпретировать HTML как символы. Если встречает нелатинские символы до объявления кодировки — может применить неверную кодировку. UTF-8 должен быть объявлен в первых 1024 байтах документа (требование спецификации).

**HTTP заголовок vs meta charset:**
Если сервер отправляет `Content-Type: text/html; charset=UTF-8`, это приоритетнее meta charset. Оба должны совпадать — расхождение приводит к проблемам с отображением.

---

## Viewport meta

```html
<!-- Стандартный viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### Параметры viewport

| Параметр | Значение | Описание |
|----------|----------|----------|
| `width` | `device-width` или число | Ширина viewport |
| `initial-scale` | `1.0` | Начальный масштаб |
| `minimum-scale` | `0.1` | Минимальный масштаб |
| `maximum-scale` | `5.0` | Максимальный масштаб |
| `user-scalable` | `yes` / `no` | Разрешить zoom пользователю |
| `viewport-fit` | `cover` / `contain` | Для устройств с notch (iPhone X+) |
| `interactive-widget` | `resizes-visual` / `resizes-content` / `overlays-content` | Поведение при появлении виртуальной клавиатуры |

```html
<!-- Для PWA на iPhone с notch/Dynamic Island -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
/* Safe area insets для iPhone X+ notch */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

> ⚠️ **Ловушка:** `user-scalable=no` и `maximum-scale=1` нарушают WCAG 1.4.4 (Resize Text, уровень AA) и доступность для людей с нарушениями зрения. iOS 10+ игнорирует `user-scalable=no` для пользователей с настройками доступности.

---

## `<link>` rel типы

```html
<!-- Стили -->
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/print.css" media="print">

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Web App Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Canonical -->
<link rel="canonical" href="https://example.com/page">

<!-- Alternate: RSS -->
<link rel="alternate" type="application/rss+xml" href="/feed.xml" title="RSS Feed">

<!-- Alternate: hreflang -->
<link rel="alternate" hreflang="en" href="https://example.com/en/page">

<!-- Preload / Resource Hints (см. модуль 04-performance) -->
<link rel="preload" href="/font.woff2" as="font" crossorigin>
<link rel="preconnect" href="https://cdn.example.com">
<link rel="prefetch" href="/next-page">
<link rel="dns-prefetch" href="https://api.example.com">

<!-- Pingback (устаревший) -->
<!-- <link rel="pingback" href="/xmlrpc.php"> -->

<!-- rel="me" — для идентификации профилей (Mastodon, IndieWeb) -->
<link rel="me" href="https://mastodon.social/@username">
```

### Типы медиа для `<link rel="stylesheet">`

```html
<!-- Загружается всегда, применяется только при печати -->
<!-- print стиль не является render-blocking для screen -->
<link rel="stylesheet" href="/print.css" media="print">

<!-- Только для широких экранов -->
<link rel="stylesheet" href="/wide.css" media="(min-width: 1200px)">

<!-- Только для тёмной темы системы -->
<link rel="stylesheet" href="/dark.css" media="(prefers-color-scheme: dark)">
```

> ⚠️ **Ловушка:** Все `<link rel="stylesheet">` загружаются (Download), но render-blocking только те, media которых совпадает с текущим контекстом. Это частый вопрос на интервью: «блокирует ли print CSS рендеринг?» — **нет**, но загружается всегда.

---

## `<base>` элемент

Устанавливает базовый URL для всех относительных ссылок на странице:

```html
<head>
  <base href="https://example.com/blog/" target="_blank">
</head>
```

```html
<!-- С base href="https://example.com/blog/" -->
<a href="post.html"><!-- → https://example.com/blog/post.html --></a>
<img src="image.jpg"><!-- → https://example.com/blog/image.jpg -->
<a href="#section"><!-- → https://example.com/blog/CURRENT_PAGE#section --></a>
```

> ⚠️ **Ловушка:** `<base>` с `href` меняет поведение **всех** относительных ссылок включая якорные (`#id`). Якорная ссылка `<a href="#section">` с `<base href="...">` ведёт на `base_url + current_page + #section`, а не просто прокручивает страницу. Это классический баг.

> ⚠️ **Ловушка:** Только один `<base>` разрешён в документе. Второй игнорируется.

---

## Web App Manifest

Делает веб-приложение устанавливаемым как PWA.

```json
{
  "name": "Frontend Blog",
  "short_name": "FE Blog",
  "description": "Материалы для подготовки к собеседованию",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066cc",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/home.jpg", "sizes": "1280x720", "type": "image/jpeg", "form_factor": "wide" }
  ]
}
```

### `display` режимы

| Значение | Поведение |
|----------|-----------|
| `browser` | Обычная вкладка браузера |
| `minimal-ui` | Браузерные кнопки назад/вперёд/обновить |
| `standalone` | Как нативное приложение, без адресной строки |
| `fullscreen` | Полный экран |

---

## `<meta http-equiv>`

Симуляция HTTP-заголовков через HTML:

```html
<!-- Устаревший: refresh страницы (антипаттерн — WCAG 2.2.1 нарушение) -->
<!-- <meta http-equiv="refresh" content="5; url=https://example.com"> -->

<!-- Content Security Policy через meta (ограниченная поддержка) -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">

<!-- X-UA-Compatible: историческая реликвия для IE -->
<!-- <meta http-equiv="X-UA-Compatible" content="IE=edge"> -->

<!-- Кэш: НЕ рекомендуется, используй HTTP заголовки -->
<!-- <meta http-equiv="Cache-Control" content="no-cache"> -->
```

> ⚠️ **Ловушка:** `<meta http-equiv="Content-Security-Policy">` не поддерживает `frame-ancestors` и `report-uri`. Для полного CSP используй HTTP заголовок.

---

## Вопросы на интервью

1. **Что произойдёт без `<!DOCTYPE html>`?**
   > Браузер активирует quirks mode. Box model, CSS поведение, рендеринг таблиц — всё ведёт себя по-другому для совместимости с IE5-эрой. Страница может выглядеть и работать непредсказуемо.

2. **Почему `<meta charset>` должен быть первым тегом?**
   > Браузер буферизует начало документа и определяет кодировку до парсинга. Если кодировка объявлена поздно, браузер мог уже неверно интерпретировать символы до этой точки.

3. **Чем отличается `<link rel="preload">` от `<link rel="stylesheet">`?**
   > `<link rel="stylesheet">` — загружает и применяет CSS, render-blocking. `<link rel="preload" as="style">` — только загружает в кэш с высоким приоритетом, не применяет автоматически. Используется для: загрузить CSS, потом применить через JS, или для non-blocking font/script loading.

4. **Когда `<base>` ломает страницу?**
   > При использовании якорных ссылок `<a href="#section">`. С `<base>` якорь резолвится как `base_url#section`, браузер делает переход на новый URL вместо прокрутки. Также ломает относительные URL в `<script src>`, `<img src>`, `<form action>`.

---

## Примеры кода

- [`examples/full-head-boilerplate.html`](./examples/full-head-boilerplate.html) — полный шаблон `<head>` с комментариями
- [`examples/manifest.json`](./examples/manifest.json) — Web App Manifest для PWA
