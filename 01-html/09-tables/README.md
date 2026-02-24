# 09 · Таблицы

[← HTML](../README.md)

---

## Содержание

1. [Структура доступной таблицы](#структура-доступной-таблицы)
2. [scope и headers](#scope-и-headers)
3. [Сложные таблицы](#сложные-таблицы)
4. [Responsive таблицы](#responsive-таблицы)
5. [Таблицы для layout — антипаттерн](#таблицы-для-layout--антипаттерн)
6. [Вопросы на интервью](#вопросы-на-интервью)
7. [Примеры кода](#примеры-кода)

---

## Структура доступной таблицы

```html
<table>
  <!--
    <caption>: заголовок таблицы.
    Первый дочерний элемент <table>.
    Screen reader читает его как название таблицы.
    Аналог alt для изображений.
  -->
  <caption>Сравнение тарифных планов</caption>

  <!--
    <colgroup> + <col>: применяет стили к колонкам.
    Не влияет на семантику — только CSS.
  -->
  <colgroup>
    <col style="width: 40%">
    <col style="width: 20%">
    <col style="width: 20%">
    <col style="width: 20%">
  </colgroup>

  <!--
    <thead>: шапка таблицы.
    Используется для sticky header и повторения на каждой печатной странице.
    Семантика: контейнер для заголовочных строк.
  -->
  <thead>
    <tr>
      <th scope="col">Функция</th>
      <th scope="col">Бесплатный</th>
      <th scope="col">Про</th>
      <th scope="col">Бизнес</th>
    </tr>
  </thead>

  <!--
    <tbody>: тело таблицы.
    Можно несколько <tbody> для группировки строк.
  -->
  <tbody>
    <tr>
      <th scope="row">Пользователи</th>
      <td>1</td>
      <td>10</td>
      <td>Неограничено</td>
    </tr>
    <tr>
      <th scope="row">Хранилище</th>
      <td>1 ГБ</td>
      <td>50 ГБ</td>
      <td>1 ТБ</td>
    </tr>
  </tbody>

  <!--
    <tfoot>: подвал таблицы.
    Отображается после tbody в браузере, но может быть объявлен до tbody.
    Повторяется при печати.
  -->
  <tfoot>
    <tr>
      <th scope="row">Цена / мес</th>
      <td>Бесплатно</td>
      <td>990 ₽</td>
      <td>4 990 ₽</td>
    </tr>
  </tfoot>
</table>
```

---

## scope и headers

`scope` — самый важный атрибут для доступности таблиц. Говорит screen reader: «этот `<th>` — заголовок для такого-то направления».

### Значения scope

| Значение | Описание |
|----------|----------|
| `scope="col"` | Заголовок для всей колонки |
| `scope="row"` | Заголовок для всей строки |
| `scope="colgroup"` | Заголовок для группы колонок |
| `scope="rowgroup"` | Заголовок для группы строк |

```html
<!-- Простая таблица: scope достаточно -->
<thead>
  <tr>
    <th scope="col">Имя</th>
    <th scope="col">Email</th>
    <th scope="col">Роль</th>
  </tr>
</thead>
<tbody>
  <tr>
    <th scope="row">Иван Петров</th>
    <td>ivan@example.com</td>
    <td>Admin</td>
  </tr>
</tbody>
```

### `headers` атрибут — для сложных таблиц

Когда таблица имеет нестандартную структуру, `scope` недостаточно. Используй явную связь через `id` + `headers`:

```html
<table>
  <caption>Расписание занятий</caption>
  <thead>
    <tr>
      <td></td>
      <th id="mon" scope="col">Пн</th>
      <th id="tue" scope="col">Вт</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th id="morning" scope="row">Утро</th>
      <td headers="mon morning">Математика</td>
      <td headers="tue morning">Физика</td>
    </tr>
    <tr>
      <th id="evening" scope="row">Вечер</th>
      <td headers="mon evening">История</td>
      <td headers="tue evening">Химия</td>
    </tr>
  </tbody>
</table>
```

Screen reader прочитает ячейку «Математика» как: «Пн, Утро: Математика».

---

## Сложные таблицы

### colspan и rowspan

```html
<table>
  <caption>Квартальные продажи по регионам</caption>
  <thead>
    <tr>
      <!--
        rowspan="2": ячейка занимает 2 строки
        Соответствует заголовкам обеих строк ниже
      -->
      <th scope="col" rowspan="2">Регион</th>
      <!--
        colspan="2": группа из 2 колонок
        scope="colgroup" для группового заголовка
      -->
      <th scope="colgroup" colspan="2">Q1</th>
      <th scope="colgroup" colspan="2">Q2</th>
    </tr>
    <tr>
      <!-- Детальные заголовки для Q1 -->
      <th scope="col" id="q1-plan">План</th>
      <th scope="col" id="q1-fact">Факт</th>
      <!-- Детальные заголовки для Q2 -->
      <th scope="col" id="q2-plan">План</th>
      <th scope="col" id="q2-fact">Факт</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row" id="north">Север</th>
      <td headers="north q1-plan">100</td>
      <td headers="north q1-fact">112</td>
      <td headers="north q2-plan">120</td>
      <td headers="north q2-fact">108</td>
    </tr>
    <tr>
      <th scope="row" id="south">Юг</th>
      <td headers="south q1-plan">80</td>
      <td headers="south q1-fact">95</td>
      <td headers="south q2-plan">90</td>
      <td headers="south q2-fact">87</td>
    </tr>
  </tbody>
</table>
```

---

## Responsive таблицы

Таблицы плохо масштабируются на мобильных. Паттерны:

### Паттерн 1: горизонтальный скролл

```html
<!-- Обёртка с overflow-x: auto -->
<div role="region" aria-label="Сравнение тарифов" tabindex="0">
  <table>
    <!-- ... -->
  </table>
</div>
```

```css
[role="region"][tabindex] {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
/* Фокусируемый контейнер — keyboard users могут скроллить таблицу */
```

> ⚠️ **Ловушка:** `overflow-x: auto` без `tabindex="0"` делает скролл недоступным для keyboard-only пользователей. `role="region"` с `aria-label` создаёт landmark для навигации.

### Паттерн 2: stacked на мобильном (через data-атрибуты)

```html
<table>
  <thead>
    <tr>
      <th>Имя</th>
      <th>Email</th>
      <th>Дата</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <!-- data-label для мобильного отображения -->
      <td data-label="Имя">Иван Петров</td>
      <td data-label="Email">ivan@example.com</td>
      <td data-label="Дата">2025-01-15</td>
    </tr>
  </tbody>
</table>
```

```css
@media (max-width: 600px) {
  table, thead, tbody, th, td, tr {
    display: block;
  }

  thead {
    position: absolute;
    left: -9999px; /* Скрыть визуально, но не от SR */
    top: -9999px;
  }

  td {
    position: relative;
    padding-left: 50%;
  }

  td::before {
    content: attr(data-label);
    position: absolute;
    left: 0;
    width: 45%;
    font-weight: bold;
  }
}
```

---

## Таблицы для layout — антипаттерн

```html
<!-- ❌ НИКОГДА: таблица для layout -->
<table>
  <tr>
    <td><nav>Навигация</nav></td>
    <td><main>Контент</main></td>
    <td><aside>Сайдбар</aside></td>
  </tr>
</table>

<!-- ✅ CSS Grid или Flexbox -->
<div class="layout">
  <nav>Навигация</nav>
  <main>Контент</main>
  <aside>Сайдбар</aside>
</div>
```

Если всё же нужна таблица для нетабличного контента (legacy email-вёрстка):

```html
<!-- role="presentation" убирает семантику таблицы -->
<table role="presentation">
  <tr>
    <td>Колонка 1</td>
    <td>Колонка 2</td>
  </tr>
</table>
```

---

## Вопросы на интервью

1. **Разница между `<th>` и `<td>`?**
   > `<th>` — заголовочная ячейка с semantic значением, bold по умолчанию. `<td>` — обычная ячейка данных. `<th>` без `scope` в сложных таблицах — неполная семантика.

2. **Когда нужен атрибут `headers` вместо `scope`?**
   > Когда ячейка относится к нескольким заголовкам одновременно (colspan/rowspan таблицы, перекрёстные таблицы). `scope` работает для простых таблиц, `headers` + `id` — для произвольных связей.

3. **Почему у скроллируемой таблицы должен быть `tabindex="0"` на обёртке?**
   > Keyboard-only пользователи не могут горизонтально скроллить элемент который не в фокусе. `tabindex="0"` добавляет обёртку в tab order, что позволяет управлять скроллом клавиатурой.

4. **Зачем несколько `<tbody>` в одной таблице?**
   > Семантическая группировка строк. Например: товары разных категорий. Каждая группа может иметь свой `<tr>` с заголовком и собственное визуальное оформление через CSS.

---

## Примеры кода

- [`examples/accessible-table.html`](./examples/accessible-table.html) — простая и сложная таблицы с полной a11y разметкой
- [`examples/responsive-table.html`](./examples/responsive-table.html) — responsive таблица: scroll + stacked паттерны
