# 06 · Медиа

[← HTML](../README.md)

---

## Содержание

1. [Responsive Images: srcset и sizes](#responsive-images-srcset-и-sizes)
2. [`<picture>`: art direction vs format switching](#picture-art-direction-vs-format-switching)
3. [Форматы изображений: WebP, AVIF, SVG](#форматы-изображений-webp-avif-svg)
4. [`<video>` и `<audio>`](#video-и-audio)
5. [SVG: inline vs `<img>`](#svg-inline-vs-img)
6. [Вопросы на интервью](#вопросы-на-интервью)
7. [Примеры кода](#примеры-кода)

---

## Responsive Images: srcset и sizes

### `srcset` — набор кандидатов

```html
<!--
  srcset с дескриптором ширины (w):
  Браузер выбирает изображение исходя из viewport + DPR + sizes.
  НЕ означает "показывай при такой ширине" — это размер файла.
-->
<img
  src="/image-800.jpg"
  srcset="
    /image-400.jpg   400w,
    /image-800.jpg   800w,
    /image-1200.jpg 1200w,
    /image-1600.jpg 1600w
  "
  sizes="
    (max-width: 480px)  100vw,
    (max-width: 768px)  50vw,
    33vw
  "
  alt="Описание"
  width="800"
  height="600"
>

<!--
  srcset с дескриптором плотности (x):
  Проще, но менее гибко. Для фиксированных размеров.
-->
<img
  src="/icon.png"
  srcset="/icon@2x.png 2x, /icon@3x.png 3x"
  alt="Иконка"
  width="32"
  height="32"
>
```

### Как браузер выбирает изображение

1. Парсит `sizes` — находит первое совпадение с текущим viewport.
2. Получает **display width** в CSS пикселях.
3. Умножает на **DPR** (Device Pixel Ratio) — реальная нужная ширина.
4. Ищет в `srcset` ближайший кандидат **не меньше** нужного.
5. Кэширует решение — не меняет при изменении размера окна.

```
Пример:
- Viewport: 768px
- sizes: "(max-width: 768px) 100vw, 50vw" → 100vw = 768px
- DPR: 2 → нужно 1536px
- srcset: 400w, 800w, 1200w, 1600w → выбирает 1600w (ближайший >= 1536)
```

> ⚠️ **Ловушка:** Если не указать `sizes`, браузер считает что изображение занимает 100vw. Это приведёт к загрузке слишком большого изображения для маленьких слотов.

> ⚠️ **Ловушка:** Браузер **не обязан** выбирать «правильное» изображение — он может учитывать условия сети, кэш, Save-Data заголовок. `srcset` — это hints, не директивы.

---

## `<picture>`: art direction vs format switching

`<picture>` — контейнер для нескольких `<source>`. Отличается от `srcset` тем, что можно полностью менять изображение (кропать, другая композиция).

### Format switching (современные форматы с fallback)

```html
<picture>
  <!--
    AVIF: наилучшее сжатие, но поддержка хуже
    Браузер проверяет source по порядку, берёт первый поддерживаемый
  -->
  <source
    type="image/avif"
    srcset="/hero.avif 1x, /hero@2x.avif 2x"
  >
  <!-- WebP: хорошее сжатие, широкая поддержка -->
  <source
    type="image/webp"
    srcset="/hero.webp 1x, /hero@2x.webp 2x"
  >
  <!-- fallback img: обязателен, для браузеров без <picture> и как LCP target -->
  <img
    src="/hero.jpg"
    srcset="/hero@2x.jpg 2x"
    alt="Главный баннер"
    width="1200"
    height="600"
    fetchpriority="high"
    loading="eager"
  >
</picture>
```

### Art direction (разная композиция для разных экранов)

```html
<picture>
  <!-- Mobile: обрезанная версия, вертикальная ориентация -->
  <source
    media="(max-width: 767px)"
    srcset="/hero-mobile.webp"
    type="image/webp"
    width="390"
    height="520"
  >
  <!-- Tablet: средняя версия -->
  <source
    media="(max-width: 1199px)"
    srcset="/hero-tablet.webp"
    type="image/webp"
    width="768"
    height="432"
  >
  <!-- Desktop: полная версия -->
  <img
    src="/hero-desktop.jpg"
    alt="Наша команда работает над проектом"
    width="1440"
    height="810"
    fetchpriority="high"
    loading="eager"
  >
</picture>
```

> ⚠️ **Ловушка:** Атрибуты `alt`, `width`, `height`, `loading`, `fetchpriority` ставятся на `<img>`, а не на `<source>`. `<source>` не имеет этих атрибутов.

---

## Форматы изображений: WebP, AVIF, SVG

### Сравнение форматов

| Формат | Сжатие | Поддержка | Alpha | Animation | Когда использовать |
|--------|--------|-----------|-------|-----------|-------------------|
| JPEG | Хорошее | 100% | ❌ | ❌ | Фотографии (fallback) |
| PNG | Среднее | 100% | ✅ | ❌ | PNG нужен редко в 2025 |
| WebP | Лучше JPEG на 25-35% | 97%+ | ✅ | ✅ | Основной формат |
| AVIF | Лучше WebP на 20-50% | ~90% | ✅ | ✅ | Первый источник в `<picture>` |
| SVG | Векторный | 100% | ✅ | ✅ | Иконки, логотипы, иллюстрации |
| GIF | Плохое | 100% | Частично | ✅ | Заменить на WebP/AVIF |

### Когда какой формат

```html
<!-- Фотографии: AVIF > WebP > JPEG -->
<picture>
  <source type="image/avif" srcset="/photo.avif">
  <source type="image/webp" srcset="/photo.webp">
  <img src="/photo.jpg" alt="...">
</picture>

<!-- Иконки с прозрачностью: SVG предпочтительно -->
<img src="/icon.svg" alt="Загрузить файл" width="24" height="24">

<!-- Логотип: SVG для чёткости на любом DPR -->
<img src="/logo.svg" alt="Название компании" width="120" height="40">

<!-- Анимация: WebP или AVIF вместо GIF -->
<picture>
  <source type="image/avif" srcset="/animation.avif">
  <source type="image/webp" srcset="/animation.webp">
  <img src="/animation.gif" alt="Анимация загрузки">
</picture>
```

---

## `<video>` и `<audio>`

### Video: полная разметка

```html
<video
  width="1280"
  height="720"
  controls
  muted
  autoplay        <!-- autoplay работает только с muted в большинстве браузеров -->
  loop
  playsinline     <!-- обязательно для iOS: не открывает fullscreen -->
  preload="metadata" <!-- none | metadata | auto -->
  poster="/video-poster.jpg"
>
  <!-- Несколько источников для совместимости -->
  <source src="/video.mp4"  type="video/mp4">
  <source src="/video.webm" type="video/webm">

  <!-- Субтитры — обязательны для доступности (WCAG 1.2.2) -->
  <track
    kind="subtitles"
    src="/subtitles-ru.vtt"
    srclang="ru"
    label="Русский"
    default
  >
  <track
    kind="subtitles"
    src="/subtitles-en.vtt"
    srclang="en"
    label="English"
  >
  <!-- captions vs subtitles: captions включают описание звуков для глухих -->
  <track
    kind="captions"
    src="/captions-ru.vtt"
    srclang="ru"
    label="Русский (с описанием звуков)"
  >

  <!-- Fallback для браузеров без поддержки video -->
  <p>
    Ваш браузер не поддерживает видео.
    <a href="/video.mp4">Скачать видео</a>
  </p>
</video>
```

### `preload` значения

| Значение | Поведение | Когда |
|----------|-----------|-------|
| `none` | Ничего не загружать | Видео не в viewport, мобильные |
| `metadata` | Загрузить метаданные (размер, длительность, poster) | Рекомендуется по умолчанию |
| `auto` | Загрузить всё видео | Только если воспроизведение вероятно |

### Video как фоновое (без controls)

```html
<!--
  autoplay + muted + loop + playsinline — комбинация для фоновых видео.
  Без muted: браузеры блокируют autoplay.
  Без playsinline: iOS открывает fullscreen player.
  aria-hidden: декоративное видео — скрыть от AT.
-->
<video
  autoplay
  muted
  loop
  playsinline
  aria-hidden="true"
  preload="auto"
  width="1920"
  height="1080"
>
  <source src="/bg-video.mp4" type="video/mp4">
</video>
```

### Audio

```html
<audio controls preload="metadata">
  <source src="/podcast.mp3"  type="audio/mpeg">
  <source src="/podcast.ogg"  type="audio/ogg">
  <!-- Текстовая альтернатива для доступности -->
  <p>
    <a href="/podcast-transcript.html">Текстовая расшифровка подкаста</a>
  </p>
</audio>
```

---

## SVG: inline vs `<img>`

| | `<img src="*.svg">` | Inline SVG | CSS `background-image` |
|---|---------------------|------------|------------------------|
| Производительность | Кэшируется | Увеличивает DOM | Кэшируется |
| CSS анимация | ❌ | ✅ | ❌ |
| JS доступ | ❌ | ✅ | ❌ |
| Изменение цвета через currentColor | ❌ | ✅ | ❌ |
| Accessibility | alt атрибут | Нужен title/aria | ❌ (декоративное) |
| Повторное использование | ✅ | Дублирование | ✅ |

### Доступный inline SVG

```html
<!-- Декоративная иконка -->
<svg aria-hidden="true" focusable="false" width="24" height="24">
  <use href="/icons.svg#icon-arrow">
</svg>

<!-- Семантическая иконка с текстом рядом — текст уже описывает кнопку -->
<button>
  <svg aria-hidden="true" focusable="false" width="24" height="24">
    <path d="..."/>
  </svg>
  Сохранить
</button>

<!-- Standalone иконка без текста — нужен accessible name -->
<button aria-label="Сохранить документ">
  <svg aria-hidden="true" focusable="false" width="24" height="24">
    <path d="..."/>
  </svg>
</button>

<!-- SVG с title (альтернатива aria-label) -->
<svg role="img" aria-labelledby="svg-title" width="200" height="100">
  <title id="svg-title">График продаж за 2025 год</title>
  <!-- ... -->
</svg>
```

> ⚠️ **Ловушка:** IE11 устанавливал `focusable="true"` на SVG по умолчанию — нужно явно `focusable="false"` для inline SVG внутри ссылок/кнопок, иначе Tab попадёт и на кнопку, и на SVG внутри неё.

---

## Вопросы на интервью

1. **Разница между `srcset` с `w` дескриптором и `x` дескриптором?**
   > `w` — ширина файла в пикселях. Браузер использует `sizes` и DPR для выбора. Гибче. `x` — кратность DPR (1x, 2x, 3x). Для фиксированных элементов без изменения размера.

2. **Когда `<picture>` вместо `srcset` на `<img>`?**
   > `<picture>` нужен для: разных форматов (AVIF/WebP/JPEG), art direction (разная компоновка на мобильном), разных соотношений сторон. `srcset` — только для resolution switching одного изображения.

3. **Почему `autoplay` видео требует `muted`?**
   > Браузеры блокируют autoplay со звуком — пользователи жаловались на неожиданный звук. Chrome Autoplay Policy: видео с muted или без звука может autoplay. Видео со звуком — только после user gesture.

4. **Как обеспечить доступность видеоконтента (WCAG)?**
   > WCAG 1.2.2 (A): субтитры для записанного видео. 1.2.3 (A): аудио-описание или текстовая альтернатива. 1.2.5 (AA): аудио-описание для записанного. Для автоплей видео с аудио — обязателен механизм паузы.

5. **Когда использовать inline SVG vs `<img>`?**
   > Inline SVG: иконки с изменением цвета (currentColor), анимация, JS-интерактивность. `<img>`: крупные иллюстрации, логотипы без интерактивности — лучше для производительности (кэш, не раздувает DOM).

---

## Примеры кода

- [`examples/responsive-images.html`](./examples/responsive-images.html) — srcset + sizes + picture в реальных сценариях
- [`examples/video-patterns.html`](./examples/video-patterns.html) — видео: фоновое, с субтитрами, lazy
