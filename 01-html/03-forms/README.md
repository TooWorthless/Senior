# 03 · Формы

[← HTML](../README.md)

---

## Содержание

1. [Input types и их нативное поведение](#input-types-и-их-нативное-поведение)
2. [Constraint Validation API](#constraint-validation-api)
3. [Кастомная валидация](#кастомная-валидация)
4. [autocomplete: UX и безопасность](#autocomplete-ux-и-безопасность)
5. [FormData API](#formdata-api)
6. [Доступность форм](#доступность-форм)
7. [File Upload](#file-upload)
8. [Вопросы на интервью](#вопросы-на-интервью)
9. [Примеры кода](#примеры-кода)

---

## Input types и их нативное поведение

Нативные input types дают бесплатно: мобильную клавиатуру, нативный UI, встроенную валидацию, семантику.

| Type | Мобильная клавиатура | Нативная валидация | Примечание |
|------|---------------------|-------------------|------------|
| `text` | Стандартная | Нет | — |
| `email` | С @, .com | Формат email | Не проверяет существование |
| `tel` | Цифровая | Нет | Формат зависит от страны |
| `number` | Цифровая | min, max, step | Плохо для номеров карт — используй `text inputmode="numeric"` |
| `url` | С .com, / | Формат URL | — |
| `search` | С кнопкой поиска | Нет | Добавляет кнопку очистки |
| `password` | Стандартная | minlength | Браузер предлагает password manager |
| `date` | Date picker | min, max | UI различается в браузерах |
| `time` | Time picker | min, max, step | — |
| `datetime-local` | Combined | min, max | Нет timezone — только local |
| `month` | Month picker | min, max | — |
| `week` | Week picker | min, max | — |
| `color` | — | — | Нативный color picker |
| `range` | — | min, max, step | Slider |
| `checkbox` | — | required | — |
| `radio` | — | required (группа) | Группируется по name |
| `file` | — | accept, multiple | — |
| `hidden` | — | — | Не показывается, не валидируется |

### `inputmode` vs `type`

`inputmode` управляет **только клавиатурой**, не меняет семантику и валидацию:

```html
<!-- Цифровой ввод без стрелок и ограничений числового поля -->
<input type="text" inputmode="numeric" pattern="[0-9]*">

<!-- Номер карты: 16 цифр, не нужна валидация number -->
<input
  type="text"
  inputmode="numeric"
  autocomplete="cc-number"
  pattern="[0-9\s]{13,19}"
  maxlength="19"
>

<!-- Телефон -->
<input type="tel" inputmode="tel">

<!-- Поиск с "Go" на клавиатуре -->
<input type="search" inputmode="search">

<!-- Email клавиатура на обычном text поле -->
<input type="text" inputmode="email">
```

> 💬 **Вопрос на интервью:** «Почему для номера банковской карты лучше `type="text"` чем `type="number"`?»

**Ответ:** `type="number"` добавляет стрелки для инкремента, не поддерживает пробелы как разделители, может срезать ведущие нули (важно для некоторых форматов), и на iOS вызывает числовую клавиатуру без пробела. `type="text" inputmode="numeric"` даёт числовую клавиатуру без этих проблем.

---

## Constraint Validation API

Встроенный API браузера для валидации форм. Работает без JavaScript.

### Атрибуты валидации

| Атрибут | Применяется к | Описание |
|---------|--------------|----------|
| `required` | Почти все | Поле обязательно |
| `minlength` / `maxlength` | text, search, url, tel, email, password | Длина строки |
| `min` / `max` | number, date, time, datetime-local, month, week, range | Числовой/временной диапазон |
| `step` | number, date, time, range | Шаг значений |
| `pattern` | text, search, url, tel, email, password | RegEx (без `/`, без `^$` — они добавляются автоматически) |
| `type` | input | Тип определяет допустимый формат |

### ValidityState

```javascript
const input = document.querySelector('input[type="email"]');
input.value = 'not-an-email';

console.log(input.validity);
// ValidityState {
//   badInput: false,      // введено не то что ожидается
//   customError: false,   // setCustomValidity() был вызван
//   patternMismatch: false,
//   rangeOverflow: false, // > max
//   rangeUnderflow: false, // < min
//   stepMismatch: false,
//   tooLong: false,
//   tooShort: false,
//   typeMismatch: true,   // ← email не соответствует формату
//   valid: false,         // false если любое из выше true
//   valueMissing: false
// }

console.log(input.validationMessage); // "Please enter an email address."
console.log(input.checkValidity()); // false — не активирует UI

// reportValidity() = checkValidity() + показывает нативный UI
input.reportValidity(); // false + показывает тултип ошибки
```

### Методы

```javascript
// Программно задать ошибку
input.setCustomValidity('Этот email уже зарегистрирован');
input.reportValidity(); // покажет кастомное сообщение

// Сбросить кастомную ошибку
input.setCustomValidity('');

// На форме
const form = document.querySelector('form');
form.checkValidity(); // true/false, без UI
form.reportValidity(); // true/false + фокус на первом невалидном поле
```

> ⚠️ **Ловушка:** `setCustomValidity('')` сбрасывает кастомную ошибку, но нужно сделать это **до** `checkValidity()`, иначе поле останется невалидным.

---

## Кастомная валидация

### Паттерн: отключить нативный UI, полностью управлять своим

```html
<form id="signup-form" novalidate>
  <div class="field">
    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      name="email"
      required
      aria-required="true"
      aria-describedby="email-error"
      autocomplete="email"
    >
    <span
      id="email-error"
      role="alert"
      aria-live="polite"
      hidden
    ></span>
  </div>
  <button type="submit">Зарегистрироваться</button>
</form>
```

> ⚠️ **Ловушка:** `novalidate` отключает нативную браузерную валидацию, но **НЕ** отключает Constraint Validation API — `validity`, `checkValidity()`, `setCustomValidity()` продолжают работать. Это именно то, что нужно для кастомного UI при сохранении логики.

---

## autocomplete: UX и безопасность

`autocomplete` — один из наиболее игнорируемых атрибутов, хотя критически важен для UX.

### Токены для payment форм

```html
<!-- Форма оплаты — каждое поле должно иметь правильный autocomplete -->
<input type="text"   autocomplete="cc-name"        placeholder="Имя на карте">
<input type="text"   autocomplete="cc-number"      inputmode="numeric" placeholder="Номер карты">
<input type="text"   autocomplete="cc-exp-month"   placeholder="MM">
<input type="text"   autocomplete="cc-exp-year"    placeholder="YY">
<input type="text"   autocomplete="cc-csc"         placeholder="CVV">
```

### Токены для адресов

```html
<input autocomplete="given-name">
<input autocomplete="family-name">
<input autocomplete="street-address">
<input autocomplete="address-level2">  <!-- город -->
<input autocomplete="postal-code">
<input autocomplete="country">
<input autocomplete="tel">
<input autocomplete="email">
```

### Безопасность: когда выключать autocomplete

```html
<!-- Выключать autocomplete разумно только для security-sensitive полей -->
<!-- НЕ для password — это нарушает password manager UX -->
<input type="text" name="otp" autocomplete="one-time-code">
<input type="text" name="captcha" autocomplete="off">

<!-- ❌ Антипаттерн: отключать для обычных полей -->
<!-- Ломает UX, нарушает WCAG 1.3.5 (Identify Input Purpose) -->
<input type="email" autocomplete="off">
```

> ⚠️ **Ловушка:** `autocomplete="off"` на `<form>` или `<input type="password">` — распространённый антипаттерн. Браузеры и password managers часто **игнорируют** этот атрибут для password полей, а WCAG 1.3.5 (AA) требует корректного `autocomplete` для личных данных.

---

## FormData API

```javascript
const form = document.querySelector('#my-form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Создать из формы — автоматически подхватывает все поля
  const formData = new FormData(form);

  // Получить значение
  console.log(formData.get('email'));

  // Итерировать
  for (const [name, value] of formData.entries()) {
    console.log(name, value);
  }

  // Преобразовать в объект
  const data = Object.fromEntries(formData.entries());
  // ⚠️ Object.fromEntries теряет multiple значения (чекбоксы, множественные поля)

  // Для multiple значений:
  const multiData = {};
  for (const [key, value] of formData.entries()) {
    if (multiData[key] !== undefined) {
      multiData[key] = [].concat(multiData[key], value);
    } else {
      multiData[key] = value;
    }
  }

  // Отправить как multipart/form-data (для файлов)
  await fetch('/api/submit', {
    method: 'POST',
    body: formData, // НЕ JSON.stringify — FormData сам ставит Content-Type
  });

  // Отправить как JSON
  await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(formData)),
  });
});
```

---

## Доступность форм

### label: три паттерна

```html
<!-- 1. Явная связь через for/id — предпочтительно -->
<label for="username">Имя пользователя</label>
<input type="text" id="username" name="username">

<!-- 2. Обёртка — тоже корректно -->
<label>
  Имя пользователя
  <input type="text" name="username">
</label>

<!-- 3. aria-label — когда нет видимого текста -->
<input type="search" aria-label="Поиск по сайту">

<!-- ❌ Только placeholder — не достаточно -->
<input type="text" placeholder="Имя пользователя">
```

### Группировка полей

```html
<!-- fieldset + legend для радиокнопок и чекбоксов -->
<fieldset>
  <legend>Предпочтительный способ связи</legend>

  <label>
    <input type="radio" name="contact" value="email">
    Email
  </label>
  <label>
    <input type="radio" name="contact" value="phone">
    Телефон
  </label>
</fieldset>
```

### Ошибки валидации

```html
<!-- aria-describedby — связывает поле с описанием ошибки -->
<div>
  <label for="email">Email</label>
  <input
    type="email"
    id="email"
    aria-describedby="email-hint email-error"
    aria-invalid="true"
  >
  <span id="email-hint">Пример: user@example.com</span>
  <span id="email-error" role="alert">
    Введите корректный email адрес
  </span>
</div>
```

---

## File Upload

```html
<label for="avatar">Загрузить аватар</label>
<input
  type="file"
  id="avatar"
  name="avatar"
  accept="image/jpeg,image/png,image/webp"
  aria-describedby="avatar-hint"
>
<span id="avatar-hint">JPEG, PNG или WebP, до 5 МБ</span>

<!-- Multiple files -->
<input
  type="file"
  multiple
  accept=".pdf,.doc,.docx"
  aria-label="Загрузить документы (PDF, DOC)"
>
```

```javascript
const input = document.querySelector('input[type="file"]');

input.addEventListener('change', (event) => {
  const files = [...event.target.files];

  files.forEach(file => {
    console.log(file.name, file.size, file.type);

    // Валидация на клиенте
    if (file.size > 5 * 1024 * 1024) {
      console.error('Файл слишком большой');
      return;
    }

    // Preview для изображений
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      // Освобождать после использования!
      // URL.revokeObjectURL(url);
    }
  });
});
```

---

## Вопросы на интервью

1. **Разница между `checkValidity()` и `reportValidity()`?**
   > `checkValidity()` — проверяет и возвращает boolean, без UI. `reportValidity()` — проверяет, показывает нативный UI (tooltip), фокусирует первое невалидное поле.

2. **Что делает `novalidate` на форме?**
   > Отключает нативный UI браузерной валидации при submit. НЕ отключает сам Constraint Validation API — `validity` и `checkValidity()` продолжают работать. Используется для реализации кастомного UI валидации.

3. **Почему `autocomplete="off"` — антипаттерн для полей с личными данными?**
   > Нарушает WCAG 1.3.5 (Identify Input Purpose, AA). Ломает password managers. Браузеры часто игнорируют для password полей. Ухудшает UX для пользователей с ограниченными возможностями.

4. **Как правильно сделать group валидацию (например, "хотя бы одно поле заполнено")?**
   > `setCustomValidity()` на каждом поле группы. Очищать при вводе в любое из полей. `required` не подходит для такого паттерна.

5. **Как связать ошибку с полем для screen reader?**
   > `aria-describedby` на input + `role="alert"` или `aria-live="polite"` на элементе ошибки. `aria-invalid="true"` на input сигнализирует что поле невалидно.

---

## Примеры кода

- [`examples/constraint-validation.html`](./examples/constraint-validation.html) — Constraint Validation API в деталях
- [`examples/custom-validation-ui.html`](./examples/custom-validation-ui.html) — кастомный UI + novalidate + aria
- [`examples/formdata-patterns.html`](./examples/formdata-patterns.html) — FormData: от базового до файлов
