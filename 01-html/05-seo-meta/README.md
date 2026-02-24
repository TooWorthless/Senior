# 05 · SEO и метаданные

[← HTML](../README.md)

---

## Содержание

1. [Meta теги](#meta-теги)
2. [Open Graph Protocol](#open-graph-protocol)
3. [Twitter Cards](#twitter-cards)
4. [Структурированные данные (JSON-LD)](#структурированные-данные-json-ld)
5. [Canonical и дублирующийся контент](#canonical-и-дублирующийся-контент)
6. [hreflang — мультиязычные сайты](#hreflang--мультиязычные-сайты)
7. [robots: meta vs HTTP header](#robots-meta-vs-http-header)
8. [Вопросы на интервью](#вопросы-на-интервью)
9. [Примеры кода](#примеры-кода)

---

## Meta теги

### Обязательные для каждой страницы

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Уникальный заголовок страницы (50-60 символов)</title>
  <meta name="description" content="Описание страницы (150-160 символов). Влияет на CTR в выдаче.">
</head>
```

### `<title>`

- Уникальный для каждой страницы
- 50-60 символов (Google обрезает ~600px)
- Паттерн: `Ключевое слово — Название сайта`
- Для главной: `Название сайта — Основная ценность`

### `meta description`

- Не является прямым фактором ранжирования
- Влияет на CTR — Google может использовать его как snippet
- Google может заменить описание фрагментом со страницы
- 150-160 символов

### `meta robots`

```html
<!-- Поведение по умолчанию: индексировать, следовать по ссылкам -->
<meta name="robots" content="index, follow">

<!-- Не индексировать страницу -->
<meta name="robots" content="noindex">

<!-- Не следовать по ссылкам -->
<meta name="robots" content="nofollow">

<!-- Полный запрет -->
<meta name="robots" content="noindex, nofollow">

<!-- Запрет для конкретного бота -->
<meta name="googlebot" content="noindex">
<meta name="bingbot" content="noindex">

<!-- Не показывать сниппет, не кэшировать -->
<meta name="robots" content="nosnippet, nocache">

<!-- Ограничить длину сниппета -->
<meta name="robots" content="max-snippet:150, max-image-preview:large">
```

### `meta viewport`

```html
<!-- Стандартный -->
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- Запрещать zoom — НАРУШАЕТ WCAG 1.4.4 (Resize Text, AA) -->
<!-- ❌ НИКОГДА не делать: -->
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
```

> ⚠️ **Ловушка:** `user-scalable=no` и `maximum-scale=1` нарушают WCAG 1.4.4 (уровень AA). Пользователи с плохим зрением не смогут увеличить страницу. Многие компании получали судебные иски за это.

---

## Open Graph Protocol

OG-теги определяют как страница выглядит при шаринге в социальных сетях.

```html
<head>
  <!-- Обязательные OG теги -->
  <meta property="og:title"       content="Заголовок для шаринга">
  <meta property="og:description" content="Описание (150-200 символов)">
  <meta property="og:image"       content="https://example.com/og-image.jpg">
  <meta property="og:url"         content="https://example.com/page">
  <meta property="og:type"        content="website">

  <!-- Дополнительные -->
  <meta property="og:site_name"   content="Название сайта">
  <meta property="og:locale"      content="ru_RU">
  <meta property="og:locale:alternate" content="en_US">

  <!-- Изображение: рекомендуемые параметры -->
  <meta property="og:image:width"  content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type"   content="image/jpeg">
  <meta property="og:image:alt"    content="Описание изображения">
</head>
```

### og:type для разных страниц

```html
<!-- Статья/пост -->
<meta property="og:type" content="article">
<meta property="article:author"        content="https://example.com/author">
<meta property="article:published_time" content="2025-01-15T10:00:00+03:00">
<meta property="article:modified_time"  content="2025-01-20T12:00:00+03:00">
<meta property="article:section"       content="Технологии">
<meta property="article:tag"           content="HTML">
<meta property="article:tag"           content="SEO">

<!-- Товар (для некоторых платформ) -->
<meta property="og:type" content="product">

<!-- Профиль -->
<meta property="og:type" content="profile">
<meta property="profile:first_name" content="Иван">
<meta property="profile:last_name"  content="Петров">
```

### Требования к OG-изображению

| Платформа | Рекомендуемый размер | Минимальный | Формат |
|-----------|---------------------|-------------|--------|
| Facebook/OG | 1200×630 | 600×315 | JPG, PNG |
| LinkedIn | 1200×627 | — | JPG, PNG |
| VK | 1200×630 | 537×240 | JPG, PNG |
| Telegram | 1200×630 | — | JPG, PNG |

---

## Twitter Cards

Twitter/X использует свои мета-теги, хотя и fallback-ает на OG.

```html
<!-- Summary с изображением — для большинства страниц -->
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:site"        content="@youraccount">
<meta name="twitter:creator"     content="@authoraccount">
<meta name="twitter:title"       content="Заголовок">
<meta name="twitter:description" content="Описание">
<meta name="twitter:image"       content="https://example.com/twitter-card.jpg">
<meta name="twitter:image:alt"   content="Описание изображения">

<!-- Типы карточек -->
<!-- summary: маленькое изображение слева -->
<!-- summary_large_image: большое изображение (рекомендуется) -->
<!-- app: для мобильных приложений -->
<!-- player: для видео/аудио -->
```

---

## Структурированные данные (JSON-LD)

Детальные примеры — в [01-semantics](../01-semantics/README.md#микроразметка).

Самые важные типы schema.org:

| Тип | Применение | Rich Result |
|-----|------------|-------------|
| `Article` | Статьи, новости | Sitelinks, Top Stories |
| `Product` | Товары | Цена, рейтинг в выдаче |
| `FAQPage` | FAQ | Раскрываемые ответы |
| `HowTo` | Инструкции | Шаги в выдаче |
| `BreadcrumbList` | Хлебные крошки | Путь в URL |
| `Event` | Мероприятия | Дата, место |
| `Recipe` | Рецепты | Время, рейтинг, калории |
| `LocalBusiness` | Местный бизнес | Карточка компании |
| `Person` | Автор | Knowledge Panel |
| `WebSite` | Сайт | Sitelinks Search Box |

---

## Canonical и дублирующийся контент

Canonical — сигнал поисковику: «это главная версия страницы».

```html
<!-- На КАЖДОЙ странице: self-referencing canonical -->
<link rel="canonical" href="https://example.com/blog/html-semantics">

<!-- Пагинация: canonical на первую страницу или self-referencing -->
<!-- Страница /blog?page=2 -->
<link rel="canonical" href="https://example.com/blog?page=2"> <!-- или на /blog -->

<!-- Параметры UTM: canonical без параметров -->
<!-- URL: /product?utm_source=email&utm_campaign=promo -->
<link rel="canonical" href="https://example.com/product">

<!-- Версия с www vs без www: выбрать одну, везде canonical на неё -->
<link rel="canonical" href="https://www.example.com/page">
```

### Когда canonical критичен

- URL с параметрами (`?sort=price`, `?color=red`)
- Страницы с UTM-метками
- HTTP vs HTTPS версии
- www vs non-www
- Trailing slash (`/page` vs `/page/`)
- Print версии страниц

> ⚠️ **Ловушка:** Если canonical указывает на несуществующую страницу или циклически (`A → B → A`) — Google проигнорирует его. Canonical — это сигнал, не директива. Google может его проигнорировать если сигналы противоречивы.

---

## hreflang — мультиязычные сайты

Говорит Google: «эта страница для пользователей с таким языком/регионом».

```html
<head>
  <!-- На странице /ru/blog -->
  <link rel="alternate" hreflang="ru"    href="https://example.com/ru/blog">
  <link rel="alternate" hreflang="en"    href="https://example.com/en/blog">
  <link rel="alternate" hreflang="en-US" href="https://example.com/en-us/blog">
  <link rel="alternate" hreflang="en-GB" href="https://example.com/en-gb/blog">
  <!-- x-default: страница по умолчанию для неопределённых языков/регионов -->
  <link rel="alternate" hreflang="x-default" href="https://example.com/blog">
</head>
```

### Правила hreflang

1. **Взаимность**: если страница A указывает на B, то B должна указывать на A.
2. **Абсолютные URL**: только полные URL с протоколом.
3. **Self-referencing**: страница всегда включает саму себя в список.
4. **Коды**: ISO 639-1 для языка (`ru`, `en`), ISO 3166-1 Alpha-2 для региона (`RU`, `US`).

Альтернатива тегам: указать hreflang в `sitemap.xml` — масштабируется лучше для больших сайтов.

---

## robots: meta vs HTTP header

```html
<!-- meta robots: только для HTML-страниц -->
<meta name="robots" content="noindex, nofollow">
```

```
# HTTP заголовок: для любых ресурсов (PDF, изображения)
X-Robots-Tag: noindex, nofollow
X-Robots-Tag: googlebot: noindex
```

```
# robots.txt: директивы для краулера
User-agent: *
Disallow: /private/
Disallow: /admin/

User-agent: Googlebot
Allow: /
Sitemap: https://example.com/sitemap.xml
```

| Механизм | Применяется к | Приоритет |
|----------|--------------|-----------|
| `robots.txt` | Краулинг (доступ) | Первый — если запрещён доступ, остальное не читается |
| `meta robots` | Индексирование страницы | Читается только если доступ разрешён |
| `X-Robots-Tag` | Любой ресурс | Аналогично meta robots |

> ⚠️ **Ловушка:** `Disallow: /page` в robots.txt запрещает Google **краулить** страницу, но не **индексировать** её. Если на неё есть внешние ссылки, она может появиться в выдаче без содержимого (как «URL без snippeta»). Для полного исключения нужен `noindex` + доступ для краулера.

---

## Вопросы на интервью

1. **Является ли `meta description` фактором ранжирования Google?**
   > Нет. `meta description` не влияет на ранжирование напрямую. Но влияет на CTR: Google часто использует его как snippet в выдаче. Высокий CTR — косвенный сигнал качества.

2. **Чем canonical отличается от redirect?**
   > Redirect (301) физически перенаправляет пользователя и передаёт 100% link equity. Canonical — только сигнал для поисковика, не меняет URL для пользователя. Google может проигнорировать canonical, redirect — нет.

3. **Зачем `x-default` в hreflang?**
   > Для пользователей язык/регион которых не совпадает ни с одной версией. Например, пользователь из Бразилии на сайте с ru/en версиями — увидит `x-default` страницу.

4. **В чём разница `robots.txt` и `meta robots`?**
   > `robots.txt` контролирует **краулинг** (посещение). `meta robots` контролирует **индексирование** (занесение в поиск). Страница, запрещённая в robots.txt, может всё равно быть проиндексирована по внешним ссылкам.

5. **Как правильно обработать UTM-параметры с точки зрения SEO?**
   > Canonical без UTM-параметров на каждой версии URL. Либо настроить серверную rewrite-логику. Либо в Google Search Console пометить параметры как несущественные.

---

## Примеры кода

- [`examples/complete-head.html`](./examples/complete-head.html) — полный `<head>` с SEO-разметкой для статьи
- [`examples/complete-head-product.html`](./examples/complete-head-product.html) — `<head>` для страницы товара
