# 11 · Безопасность HTML

[← HTML](../README.md)

---

## Содержание

1. [iframe sandbox](#iframe-sandbox)
2. [referrerpolicy](#referrerpolicy)
3. [crossorigin](#crossorigin)
4. [`rel="noopener noreferrer"`](#relnoopener-noreferrer)
5. [Content Security Policy в HTML](#content-security-policy-в-html)
6. [XSS через HTML-атрибуты](#xss-через-html-атрибуты)
7. [Формы и CSRF](#формы-и-csrf)
8. [Вопросы на интервью](#вопросы-на-интервью)
9. [Примеры кода](#примеры-кода)

---

## iframe sandbox

`sandbox` — ключевой атрибут для безопасного встраивания контента третьих сторон.

### Без sandbox (опасно)

```html
<!-- Встроенный контент имеет те же права что и родительская страница -->
<iframe src="https://untrusted.example.com/widget"></iframe>
```

### Максимальная изоляция

```html
<!-- sandbox без значений: запрещает ВСЁ -->
<iframe
  src="https://untrusted.example.com"
  sandbox
  title="Изолированный виджет"
></iframe>
```

### Флаги sandbox

| Флаг | Разрешает |
|------|-----------|
| `allow-scripts` | Выполнение JavaScript |
| `allow-forms` | Отправку форм |
| `allow-same-origin` | Считать контент same-origin (опасно с allow-scripts!) |
| `allow-popups` | Открывать попапы (`window.open`, `<a target="_blank">`) |
| `allow-popups-to-escape-sandbox` | Попапы не наследуют sandbox |
| `allow-top-navigation` | Навигацию в top-level browsing context |
| `allow-top-navigation-by-user-activation` | То же, но только по жесту пользователя |
| `allow-downloads` | Скачивание файлов |
| `allow-modals` | `alert()`, `confirm()`, `prompt()` |
| `allow-orientation-lock` | Блокировку ориентации экрана |
| `allow-presentation` | Presentation API |
| `allow-storage-access-by-user-activation` | Storage Access API |

```html
<!-- Типичный виджет: скрипты + формы, но без same-origin -->
<iframe
  src="https://widget.example.com"
  sandbox="allow-scripts allow-forms"
  title="Форма записи"
></iframe>

<!-- Встроенная карта: только отображение -->
<iframe
  src="https://maps.example.com/embed"
  sandbox="allow-scripts"
  loading="lazy"
  title="Карта расположения офиса"
></iframe>

<!-- YouTube embed -->
<iframe
  src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
  sandbox="allow-scripts allow-same-origin allow-presentation"
  allow="accelerometer; autoplay; encrypted-media; gyroscope"
  allowfullscreen
  loading="lazy"
  title="Видео: название"
></iframe>
```

> ⚠️ **Ловушка:** `sandbox="allow-scripts allow-same-origin"` — ОПАСНАЯ комбинация. JavaScript внутри iframe с same-origin правами может удалить атрибут sandbox через `parent.document` и выйти из изоляции. Эти два флага нельзя комбинировать для недоверенного контента.

---

## referrerpolicy

Управляет какой `Referer` заголовок отправляется при переходе по ссылке или загрузке ресурса.

### Значения

| Значение | Поведение |
|----------|-----------|
| `no-referrer` | Referer не отправляется никогда |
| `no-referrer-when-downgrade` | Не отправлять с HTTPS на HTTP (default браузера) |
| `origin` | Только origin (`https://example.com`), без пути |
| `origin-when-cross-origin` | Full URL same-origin, только origin для cross-origin |
| `same-origin` | Full URL только для same-origin, ничего для cross-origin |
| `strict-origin` | Только origin, не отправлять с HTTPS на HTTP |
| `strict-origin-when-cross-origin` | **Рекомендуемый default с 2021** |
| `unsafe-url` | Full URL всегда (включая HTTP, скрытые пути) |

```html
<!-- Ссылка на внешний сайт: не раскрывать путь -->
<a
  href="https://external.example.com"
  referrerpolicy="no-referrer"
>
  Внешняя ссылка
</a>

<!-- Изображение: только origin -->
<img
  src="https://cdn.example.com/image.jpg"
  referrerpolicy="origin"
>

<!-- Через meta для всей страницы -->
<meta name="referrer" content="strict-origin-when-cross-origin">
```

### Когда это критично

- Страницы с токенами в URL (`/reset-password?token=abc123`) — `no-referrer` или `origin`
- Внутренние URL которые не должны утекать наружу
- GDPR: логи Referer могут содержать PII

---

## crossorigin

Управляет CORS-режимом для внешних ресурсов.

```html
<!-- anonymous: CORS запрос без credentials -->
<img src="https://cdn.example.com/image.jpg" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.example.com/styles.css" crossorigin="anonymous">
<script src="https://cdn.example.com/app.js" crossorigin="anonymous"></script>

<!-- use-credentials: CORS запрос с cookies/auth headers -->
<img src="https://api.example.com/avatar" crossorigin="use-credentials">
```

### Зачем crossorigin на скриптах

```html
<!--
  Без crossorigin: при ошибке в скрипте с другого домена
  window.onerror получает только "Script error." без деталей.
  Это мера безопасности браузера против утечки информации.

  С crossorigin="anonymous": полный stack trace доступен
  при условии что сервер отвечает с Access-Control-Allow-Origin.
-->
<script
  src="https://cdn.example.com/app.js"
  crossorigin="anonymous"
></script>
```

### crossorigin на `<link rel="preload">` для шрифтов

```html
<!--
  Запросы шрифтов делаются с anonymous CORS режимом.
  preload без crossorigin — другой cache key → двойная загрузка.
  crossorigin на preload ОБЯЗАТЕЛЕН для шрифтов.
-->
<link
  rel="preload"
  href="/fonts/Inter.woff2"
  as="font"
  type="font/woff2"
  crossorigin
>
```

---

## rel="noopener noreferrer"

```html
<!--
  target="_blank" без noopener: открытая вкладка имеет
  доступ к window.opener (opener.location = "phishing-site.com")
  Это называется reverse tabnapping.
-->

<!-- ❌ Уязвимо: -->
<a href="https://external.example.com" target="_blank">Внешняя ссылка</a>

<!-- ✅ Безопасно: -->
<a
  href="https://external.example.com"
  target="_blank"
  rel="noopener noreferrer"
>
  Внешняя ссылка
</a>
```

| rel значение | Эффект |
|---|---|
| `noopener` | `window.opener === null` — изолирует вкладку |
| `noreferrer` | Включает noopener + не отправляет Referer |
| `nofollow` | Подсказка поисковику: не передавать link equity |
| `sponsored` | Платная/рекламная ссылка |
| `ugc` | User Generated Content |

> ⚠️ **Ловушка:** Современные браузеры (Chrome 88+) автоматически добавляют `noopener` к `target="_blank"`. Но `noreferrer` (для скрытия URL) и поддержка старых браузеров требует явного указания. В 2025 году всё равно добавляй явно — это документирует намерение.

---

## Content Security Policy в HTML

```html
<!--
  CSP через meta: работает, но с ограничениями.
  Не поддерживает: frame-ancestors, report-uri, sandbox (как директиву).
  Предпочтителен HTTP заголовок Content-Security-Policy.
  Используй meta как fallback или для статических HTML-файлов.
-->
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' https://cdn.example.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.example.com;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self'
  "
>
```

### Nonce для inline скриптов

```html
<!--
  Если нужны inline скрипты с CSP: используй nonce.
  Сервер генерирует случайный nonce для каждого запроса.
  'unsafe-inline' заменяется nonce → строже.
-->

<!-- HTTP заголовок: Content-Security-Policy: script-src 'nonce-RANDOM_VALUE' -->
<script nonce="RANDOM_VALUE_FROM_SERVER">
  // Этот inline скрипт разрешён
  const config = { apiUrl: '/api' };
</script>
```

---

## XSS через HTML-атрибуты

```html
<!--
  Опасные атрибуты для инъекций при вставке непроверенных данных:
-->

<!-- href может содержать javascript: -->
<a href="javascript:alert(1)">XSS</a>
<!-- Защита: проверять что href начинается с http:// или https:// -->

<!-- src может содержать javascript: (в старых браузерах) -->
<!-- onerror/onload — event handlers -->
<img src="x" onerror="alert(1)">

<!-- srcdoc в iframe -->
<iframe srcdoc="<script>alert(1)</script>"></iframe>

<!-- data: URI -->
<a href="data:text/html,<script>alert(1)</script>">Click</a>
```

### Защита

```javascript
// Никогда не вставляй пользовательские данные в HTML без экранирования
// ❌ Опасно:
element.innerHTML = userInput;
document.write(userInput);

// ✅ Безопасно:
element.textContent = userInput;  // автоматическое экранирование

// Для атрибутов: setAttribute экранирует
element.setAttribute('title', userInput);

// Для href: проверяем схему
function safeHref(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? url : '#';
  } catch {
    return '#';
  }
}
```

---

## Формы и CSRF

### CSRF-защита через SameSite cookie

```html
<!--
  Современная защита от CSRF: SameSite cookie attribute.
  Сервер устанавливает: Set-Cookie: session=...; SameSite=Strict
  
  SameSite=Strict: cookie не отправляется с cross-site запросов вообще
  SameSite=Lax: только с top-level navigation GET запросами
  SameSite=None; Secure: всегда (для cross-site, требует HTTPS)
  
  В HTML: CSRF токен в hidden поле — классическая защита
-->
<form method="POST" action="/api/transfer">
  <!-- CSRF токен: генерируется сервером, уникален для сессии -->
  <input type="hidden" name="_csrf" value="{{ csrf_token }}">
  <input type="number" name="amount" required>
  <button type="submit">Перевести</button>
</form>
```

### formaction и formmethod — переопределение формы

```html
<!--
  formaction/formmethod/formenctype на кнопках переопределяют атрибуты формы.
  Безопасны при использовании по назначению, но нужно валидировать на сервере.
-->
<form action="/api/post" method="POST">
  <textarea name="content"></textarea>
  <button type="submit">Опубликовать</button>
  <!-- Другой endpoint для сохранения черновика -->
  <button type="submit" formaction="/api/draft">Сохранить черновик</button>
</form>
```

---

## Вопросы на интервью

1. **Почему `sandbox="allow-scripts allow-same-origin"` опасно?**
   > JS внутри iframe с same-origin правами может получить доступ к родительскому документу и удалить атрибут sandbox: `parent.document.querySelector('iframe').removeAttribute('sandbox')`. После этого iframe полностью выходит из изоляции.

2. **Что такое reverse tabnapping и как защититься?**
   > `target="_blank"` без `noopener` даёт открытой вкладке доступ к `window.opener`. Вредоносный сайт может перенаправить `opener.location` на фишинговую страницу пока пользователь на другой вкладке. Защита: `rel="noopener noreferrer"` или `<meta name="referrer">`.

3. **Разница между CSP через meta и HTTP заголовок?**
   > HTTP заголовок полнофункциональный: все директивы включая `frame-ancestors`, `report-uri`, `sandbox`. Meta не поддерживает эти директивы. Кроме того, HTTP заголовок применяется до парсинга HTML, meta — в процессе. Для полной защиты нужен HTTP заголовок.

4. **Как nonce делает CSP строже чем `unsafe-inline`?**
   > `unsafe-inline` разрешает любой inline скрипт. Nonce — случайное значение на каждый запрос, встроенное в тег скрипта. Только скрипты с правильным nonce выполняются. Инъектированный злоумышленником скрипт не знает nonce → не выполнится.

5. **Почему `element.textContent` безопаснее `innerHTML`?**
   > `textContent` устанавливает текст как есть, автоматически экранируя HTML-символы (`<`, `>`, `&`). `innerHTML` парсит строку как HTML — любые теги и атрибуты выполнятся. `innerHTML` с пользовательскими данными — прямой путь к XSS.

---

## Примеры кода

- [`examples/iframe-sandbox.html`](./examples/iframe-sandbox.html) — iframe с разными комбинациями sandbox
- [`examples/security-checklist.html`](./examples/security-checklist.html) — чеклист безопасности в HTML с примерами
