# 02 · Доступность (a11y)

[← HTML](../README.md)

---

## Содержание

1. [Почему a11y на Senior-уровне](#почему-a11y-на-senior-уровне)
2. [Accessibility Tree и AOM](#accessibility-tree-и-aom)
3. [ARIA: роли, состояния, свойства](#aria-роли-состояния-свойства)
4. [Правило первое: не используй ARIA без необходимости](#правило-первое-не-используй-aria-без-необходимости)
5. [Landmarks](#landmarks)
6. [Управление фокусом](#управление-фокусом)
7. [WCAG 2.2: ключевые критерии](#wcag-22-ключевые-критерии)
8. [Паттерны интерактивных компонентов](#паттерны-интерактивных-компонентов)
9. [Вопросы на интервью](#вопросы-на-интервью)
10. [Примеры кода](#примеры-кода)

---

## Почему a11y на Senior-уровне

На Senior-интервью доступность — не факультатив. Это признак системного мышления:

- **Юридические риски**: ADA (США), EN 301 549 (EU), WCAG — требования законодательства.
- **Бизнес**: ~15% населения имеют те или иные ограничения. Это рынок.
- **SEO**: поисковые боты — это тоже «screen reader».
- **Качество кода**: доступный компонент обычно правильно структурирован.

> 💬 **Вопрос на интервью:** «Как вы обеспечиваете доступность в своих компонентах?»

---

## Accessibility Tree и AOM

Браузер строит два дерева: **DOM Tree** и **Accessibility Tree (AT)**. AT — это то, что видит screen reader.

```
DOM:                         Accessibility Tree:
<button class="btn">   →     role: button
  <span>Сохранить</span>       name: "Сохранить"
</button>                      state: enabled, focusable
```

**Accessible Name Computation** — алгоритм, которым браузер вычисляет имя элемента:

1. `aria-labelledby` (самый высокий приоритет)
2. `aria-label`
3. Нативный label (for/id или обёртка `<label>`)
4. `title` атрибут
5. Текстовый контент элемента (для кнопок, ссылок)
6. `alt` для изображений
7. `placeholder` (самый низкий приоритет, не рекомендуется как единственное имя)

> ⚠️ **Ловушка:** `placeholder` не является доступным именем в полном смысле — он исчезает при вводе, и некоторые screen readers не читают его как label.

---

## ARIA: роли, состояния, свойства

ARIA (Accessible Rich Internet Applications) — набор атрибутов для дополнения семантики.

### Три категории ARIA-атрибутов

**Roles** — что это за элемент:
```html
<div role="button">Кнопка</div>
<div role="dialog" aria-modal="true">Диалог</div>
<div role="tablist">...</div>
```

**States** — текущее состояние (меняется динамически):
```html
<button aria-expanded="false">Меню</button>
<input aria-invalid="true" aria-describedby="error-msg">
<li role="option" aria-selected="true">Опция 1</li>
```

**Properties** — стабильные характеристики:
```html
<input aria-required="true" aria-label="Email адрес">
<section aria-labelledby="section-heading">
<div aria-live="polite" aria-atomic="true">Статус</div>
```

### aria-live regions

Критически важны для динамического контента (уведомления, ошибки, счётчики):

| Значение | Поведение | Когда использовать |
|----------|-----------|-------------------|
| `polite` | Объявляет после текущей фразы | Статусные сообщения, уведомления |
| `assertive` | Прерывает текущее чтение | Критические ошибки |
| `off` | Не объявляет | Отключить |

```html
<!-- Правильно: статусное сообщение -->
<div role="status" aria-live="polite" aria-atomic="true">
  <!-- JS вставляет сюда текст -->
</div>

<!-- Правильно: критическая ошибка -->
<div role="alert" aria-live="assertive">
  <!-- Автоматически assertive — role="alert" подразумевает это -->
</div>
```

> ⚠️ **Ловушка:** `aria-live` region должен существовать в DOM **до** того, как в него вставляется контент. Динамически созданный элемент с `aria-live` screen reader проигнорирует.

---

## Правило первое: не используй ARIA без необходимости

Пять правил использования ARIA (W3C):

1. **Используй нативные HTML-элементы** — они имеют встроенные роли и поведение.
2. **Не меняй семантику без необходимости** — `<h2 role="button">` ломает структуру заголовков.
3. **Все интерактивные ARIA-элементы должны быть управляемы с клавиатуры**.
4. **Не скрывай focusable элементы** — `aria-hidden="true"` на focusable элементе — баг.
5. **Все интерактивные элементы должны иметь accessible name**.

```html
<!-- ❌ Плохо: дублирование семантики -->
<button role="button">Сохранить</button>

<!-- ❌ Плохо: ARIA на неинтерактивном элементе без keyboard support -->
<div role="button" onclick="save()">Сохранить</div>

<!-- ✅ Хорошо: нативный элемент -->
<button type="button" onclick="save()">Сохранить</button>

<!-- ✅ Допустимо: когда нативный элемент не подходит -->
<div
  role="button"
  tabindex="0"
  onclick="save()"
  onkeydown="handleKey(event)"
>
  Сохранить
</div>
```

---

## Landmarks

Landmarks — регионы страницы, по которым screen reader пользователь перемещается нажатием горячих клавиш.

| HTML элемент | ARIA role | Условие получения роли |
|---|---|---|
| `<header>` (в body) | `banner` | Не вложен в sectioning element |
| `<footer>` (в body) | `contentinfo` | Не вложен в sectioning element |
| `<main>` | `main` | — |
| `<nav>` | `navigation` | — |
| `<aside>` | `complementary` | — |
| `<form>` | `form` | Только если есть accessible name |
| `<section>` | `region` | Только если есть accessible name |
| `<search>` | `search` | Новый элемент HTML, аналог `<div role="search">` |

### Несколько одинаковых landmarks

Если на странице несколько `<nav>`, `<aside>` и т.д., каждый **должен** быть помечен:

```html
<!-- ❌ Плохо: screen reader скажет "navigation, navigation, navigation" -->
<nav>...</nav>
<nav>...</nav>

<!-- ✅ Хорошо: уникальные имена -->
<nav aria-label="Основная навигация">...</nav>
<nav aria-label="Хлебные крошки">...</nav>
<nav aria-label="Навигация по странице">...</nav>
```

---

## Управление фокусом

### tabindex

| Значение | Поведение |
|----------|-----------|
| `tabindex="0"` | Добавить в natural tab order |
| `tabindex="-1"` | Убрать из tab order, но программный фокус доступен (`.focus()`) |
| `tabindex="1+"` | **Антипаттерн** — ломает natural tab order |

### Skip Links

Обязательный паттерн для клавиатурной навигации (WCAG 2.4.1 — уровень A):

```html
<!-- Первый элемент в body — виден только при фокусе -->
<a href="#main-content" class="skip-link">Перейти к основному контенту</a>

<header>...</header>
<main id="main-content" tabindex="-1">
  <!-- tabindex="-1" чтобы <main> можно было програмно сфокусировать -->
</main>
```

```css
.skip-link {
  position: absolute;
  transform: translateY(-100%);
  /* Показываем только при фокусе */
}
.skip-link:focus {
  transform: translateY(0);
}
```

### Focus Trap (Modal)

При открытии модального окна фокус должен быть заперт внутри:

```javascript
// Получить все focusable элементы внутри контейнера
function getFocusableElements(container) {
  return [...container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"]), details > summary'
  )];
}

function trapFocus(dialog) {
  const focusable = getFocusableElements(dialog);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
```

> ⚠️ **Ловушка:** Нативный `<dialog>.showModal()` уже содержит focus trap — не нужно реализовывать вручную.

### Focus Management при навигации (SPA)

После перехода между страницами в SPA фокус остаётся на элементе, который был кликнут. Нужно вручную управлять:

```javascript
// После смены маршрута
router.afterEach(() => {
  // Вариант 1: переместить на skip link
  document.querySelector('.skip-link')?.focus();

  // Вариант 2: объявить заголовок страницы
  const h1 = document.querySelector('h1');
  h1.tabIndex = -1;
  h1.focus();
});
```

---

## WCAG 2.2: ключевые критерии

WCAG структурированы по 4 принципам: **POUR** (Perceivable, Operable, Understandable, Robust).

### Критичные для Senior

| Критерий | Уровень | Суть |
|----------|---------|------|
| 1.1.1 Non-text Content | A | `alt` для изображений |
| 1.3.1 Info and Relationships | A | Структура передаётся программно (семантика, ARIA) |
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 для обычного текста, 3:1 для крупного |
| 1.4.4 Resize Text | AA | Масштаб до 200% без потери функциональности |
| 1.4.11 Non-text Contrast | AA | 3:1 для UI компонентов и графики |
| 2.1.1 Keyboard | A | Всё доступно с клавиатуры |
| 2.1.2 No Keyboard Trap | A | Фокус можно убрать с любого компонента |
| 2.4.1 Bypass Blocks | A | Skip links |
| 2.4.3 Focus Order | A | Логический порядок фокуса |
| 2.4.7 Focus Visible | AA | Видимый индикатор фокуса |
| **2.4.11 Focus Appearance** | **AA (новый в 2.2)** | Минимальный размер и контраст focus indicator |
| **2.5.3 Label in Name** | A | Accessible name содержит видимый текст |
| **3.2.6 Consistent Help** | A (новый в 2.2) | Помощь в одинаковом месте на всех страницах |
| 4.1.2 Name, Role, Value | A | Все компоненты имеют имя, роль, состояние |
| 4.1.3 Status Messages | AA | Статусные сообщения через aria-live |

---

## Паттерны интерактивных компонентов

### Accordion

```html
<div class="accordion">
  <h3>
    <button
      aria-expanded="false"
      aria-controls="panel-1"
      id="btn-1"
    >
      Раздел 1
    </button>
  </h3>
  <div
    id="panel-1"
    role="region"
    aria-labelledby="btn-1"
    hidden
  >
    <p>Контент раздела</p>
  </div>
</div>
```

### Tab Panel

```html
<div role="tablist" aria-label="Настройки">
  <button role="tab" aria-selected="true"  aria-controls="panel-general" id="tab-general">Основные</button>
  <button role="tab" aria-selected="false" aria-controls="panel-privacy"  id="tab-privacy" tabindex="-1">Приватность</button>
</div>

<div role="tabpanel" id="panel-general" aria-labelledby="tab-general">
  <p>Настройки...</p>
</div>
<div role="tabpanel" id="panel-privacy" aria-labelledby="tab-privacy" hidden>
  <p>Настройки приватности...</p>
</div>
```

> ⚠️ **Ловушка:** В tab pattern используется **roving tabindex**: активный tab — `tabindex="0"`, остальные — `tabindex="-1"`. Стрелки Left/Right переключают между вкладками, Tab — переходит в panel.

### Combobox / Autocomplete

Один из самых сложных ARIA-паттернов. Полная спецификация: [APG Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

---

## Вопросы на интервью

1. **Разница между `aria-label`, `aria-labelledby` и `aria-describedby`?**
   > `aria-label` — строка-имя. `aria-labelledby` — ссылка на элемент, текст которого станет именем (приоритет выше). `aria-describedby` — дополнительное описание, читается после имени и роли.

2. **Когда `aria-hidden="true"` опасен?**
   > Когда применяется к элементу, который содержит или является focusable элементом. Screen reader не прочитает элемент, но фокус туда попадёт — пользователь окажется на «немом» элементе.

3. **Зачем `role="presentation"` или `role="none"`?**
   > Убирает семантику элемента. Типично для `<table>` используемой для layout: `<table role="presentation">`. Не убирает focusability.

4. **Что такое WCAG и какие уровни соответствия существуют?**
   > A (минимум), AA (стандарт, большинство законодательств требует), AAA (максимум, редко достижим полностью). WCAG 2.2 — актуальная версия.

5. **Как протестировать доступность без screen reader?**
   > Клавиатурная навигация (Tab, Shift+Tab, Enter, Space, стрелки). axe DevTools / Lighthouse audit. Chrome Accessibility Tree (DevTools → Accessibility). Проверка контрастности (Colour Contrast Analyser).

---

## Примеры кода

- [`examples/aria-live-notifications.html`](./examples/aria-live-notifications.html) — паттерн уведомлений через aria-live
- [`examples/accessible-modal.html`](./examples/accessible-modal.html) — модальное окно с focus trap и правильными ARIA
- [`examples/accessible-tabs.html`](./examples/accessible-tabs.html) — tab panel с roving tabindex
- [`examples/skip-links.html`](./examples/skip-links.html) — skip links и focus management
