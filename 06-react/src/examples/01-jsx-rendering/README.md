# 01 · JSX & Rendering

[← Назад](../../../README.md)

---

## Содержание

- [JSX Transform](#jsx-transform)
- [Virtual DOM](#virtual-dom)
- [React Fiber](#react-fiber)
- [Reconciliation](#reconciliation)
- [Keys](#keys)
- [StrictMode](#strictmode)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## JSX Transform

JSX — это синтаксический сахар над `React.createElement`. Браузер его не понимает — нужен компилятор (Babel, SWC, esbuild).

```tsx
// Исходный JSX:
const el = (
  <button className="btn" onClick={handleClick}>
    Click
  </button>
);

// React 17+ (new JSX transform — import React не нужен):
import { jsx as _jsx } from "react/jsx-runtime";
const el = _jsx("button", {
  className: "btn",
  onClick: handleClick,
  children: "Click",
});

// React 16 и ниже (classic transform):
const el = React.createElement(
  "button",
  { className: "btn", onClick: handleClick },
  "Click"
);
```

**React element — это просто объект:**

```js
{
  $$typeof: Symbol(react.element), // защита от XSS через JSON
  type: "button",
  key: null,
  ref: null,
  props: { className: "btn", onClick: fn, children: "Click" },
}
```

`$$typeof: Symbol(react.element)` — защита: JSON не может содержать Symbol, поэтому строка из API не может подделать React element.

---

## Virtual DOM

Virtual DOM — это **in-memory представление UI** в виде дерева JavaScript объектов. React не работает напрямую с реальным DOM при каждом изменении.

**Почему это быстрее?**

- DOM операции дорогие (reflow, repaint)
- Работа с JS объектами дешёвая
- React батчит изменения и делает **минимальный набор DOM мутаций**

```
setState() / dispatch()
       ↓
React вычисляет новое Virtual DOM дерево
       ↓
Diff с предыдущим Virtual DOM (reconciliation)
       ↓
Минимальный набор реальных DOM изменений
       ↓
Браузер рисует (paint)
```

> ⚠️ **Ловушка:** Virtual DOM — не серебряная пуля. Для простых случаев прямой DOM может быть быстрее. Преимущество React — в **предсказуемости** и **developer experience**, а не в чистой скорости.

---

## React Fiber

**Fiber** — архитектура рендеринга React (React 16+). До Fiber был Stack Reconciler — рекурсивный синхронный.

**Проблема Stack Reconciler:**
```
Глубокое дерево → долгий рендер → нельзя прервать → dropped frames → UI фризы
```

**Решение Fiber:** каждый компонент = Fiber node (объект), обход — linked list вместо стека.

```ts
interface FiberNode {
  type: ComponentType | string;    // "div" | MyComponent
  key: string | null;
  stateNode: Element | null;       // реальный DOM элемент или class instance
  child: Fiber | null;             // первый дочерний
  sibling: Fiber | null;           // следующий брат
  return: Fiber | null;            // родитель
  pendingProps: Props;
  memoizedProps: Props;
  memoizedState: Hook | null;      // linked list хуков
  effectTag: number;               // Placement | Update | Deletion
  alternate: Fiber | null;         // "двойной буфер": current ↔ work-in-progress
}
```

**Двойной буфер (double buffering):**
- `current` — дерево которое сейчас в DOM
- `work-in-progress` — дерево которое строится
- После commit: `work-in-progress` становится `current`

**Две фазы рендеринга:**

| Фаза | Прерываема? | Что происходит |
|------|-------------|----------------|
| **Render** (Reconciliation) | ✅ Да | Строит WIP Fiber tree, diff, список эффектов |
| **Commit** | ❌ Нет | Применяет изменения в DOM, запускает effects |

**Commit фаза состоит из трёх подфаз:**
1. `BeforeMutation` — `getSnapshotBeforeUpdate`, `useLayoutEffect` cleanup
2. `Mutation` — реальные DOM операции (`insertBefore`, `removeChild`, etc.)
3. `Layout` — `useLayoutEffect`, `componentDidMount/Update`

После paint (async):
- `useEffect` cleanup предыдущего рендера
- `useEffect` callback текущего рендера

---

## Reconciliation

React использует **эвристический diff алгоритм O(n)** вместо теоретически оптимального O(n³).

### Правило 1: разный тип → полная замена

```tsx
// До:
<div><Counter /></div>
// После:
<p><Counter /></p>
// → div unmount + p mount + Counter УНИЧТОЖАЕТСЯ И СОЗДАЁТСЯ ЗАНОВО
// State Counter потерян!
```

### Правило 2: одинаковый тип → обновление

```tsx
// До:
<Counter count={1} color="blue" />
// После:
<Counter count={2} color="blue" />
// → Counter ОБНОВЛЯЕТСЯ. State сохранён. Только props обновлены.
```

### Правило 3: позиция определяет идентичность

```tsx
// Одна позиция + одинаковый тип = тот же компонент (state сохраняется)
{isAlice ? <Counter person="Alice" /> : <Counter person="Bob" />}
// Смена isAlice → React видит Counter на той же позиции → state НЕ сбрасывается!

// Принудительный сброс через key:
{isAlice ? <Counter key="alice" /> : <Counter key="bob" />}
// key изменился → unmount + mount → state сброшен
```

---

## Keys

Keys помогают React связать элементы списка между рендерами.

**Без keys** — React diff по позиции:

```
Было:  [A, B, C]
Стало: [X, A, B, C]  (добавили в начало)
React думает: 0: A→X, 1: B→A, 2: C→B, +new C
→ обновляет ВСЕ элементы (неэффективно!)
```

**С keys** — React diff по идентификатору:

```
key=A: A сдвинулся → переместить
key=B: B сдвинулся → переместить
key=C: C сдвинулся → переместить
key=X: новый → создать
→ минимум DOM операций
```

### Правила выбора key

```tsx
// ✅ Стабильный уникальный ID из данных
items.map(item => <Item key={item.id} {...item} />)

// ✅ Для статичных списков без изменений — index допустим
STATIC_TABS.map((tab, i) => <Tab key={i} {...tab} />)

// ❌ index для динамических списков — state съедет при добавлении/удалении
items.map((item, i) => <Item key={i} {...item} />)

// ❌ Math.random() — новый key каждый рендер = unmount + mount каждый раз
items.map(item => <Item key={Math.random()} {...item} />)
```

### Key как механизм принудительного сброса state

```tsx
// Вместо useEffect для сброса формы при смене пользователя:
// ❌
useEffect(() => {
  resetForm(user);
}, [user.id]);

// ✅ Элегантнее — key сбрасывает весь state автоматически:
<UserForm key={user.id} user={user} />
```

---

## StrictMode

`StrictMode` — инструмент разработки для поиска проблем.

**Что делает в development:**
- Рендерит компонент **дважды** (render function)
- Запускает `useEffect` cleanup + повторно (mount → cleanup → mount)
- Предупреждает об устаревших API

**Зачем двойной рендер?** Render phase должна быть **чистой функцией** (pure). Двойной вызов помогает найти побочные эффекты в render.

```tsx
let callCount = 0;

function BadComponent() {
  callCount++; // ❌ side effect в render!
  return <div>Count: {callCount}</div>; // в StrictMode: 2, не 1
}

function GoodComponent() {
  const [count, setCount] = useState(0); // ✅ state через React
  return <div>{count}</div>;
}
```

**StrictMode в production — нет overhead.** Только в development.

---

## Вопросы на интервью

### 1. Что такое JSX и во что он компилируется?

**Коротко:** JSX — синтаксический сахар над `React.createElement` / `jsx`. Компилятор (Babel/SWC) превращает JSX в вызовы функций, которые создают plain JS объекты (React elements).

**Важно упомянуть:** В React 17+ новый transform — не нужен `import React`. До 17 — нужен (компилируется в `React.createElement`).

### 2. Объясни алгоритм reconciliation

**Коротко:** React использует эвристический O(n) diff вместо O(n³).

Два правила:
1. Разный тип элемента → unmount + mount (state теряется)
2. Одинаковый тип → обновление props (state сохраняется)
3. Для списков — keys помогают связать элементы

### 3. Зачем нужны keys?

Keys дают React способ **отслеживать идентичность** элементов при изменении списка. Без keys React diff-ит по позиции — при добавлении в начало "все изменились". С keys — React видит какие элементы переместились, добавились, удалились.

### 4. Что делает StrictMode и зачем двойной рендер?

StrictMode — инструмент разработки. Двойной рендер обнаруживает нечистые функции рендера (side effects в render phase). В production StrictMode не активен и overhead нет.

### 5. Что такое React Fiber и зачем переписали?

Fiber — новая архитектура reconciliation (React 16). Stack Reconciler был синхронным рекурсивным — долгий рендер нельзя прервать → UI фризы. Fiber разбивает рендеринг на chunks, работает с linked list вместо стека, может приостановить и возобновить работу. Это основа Concurrent Features (useTransition, Suspense, Lanes).

---

## Ловушки

```tsx
// ❌ 1. Модификация объекта не триггерит re-render
const [user, setUser] = useState({ name: "Alice" });
user.name = "Bob"; // мутация — React не видит изменения
setUser(user);     // та же ссылка → bail out → нет re-render!

// ✅ Всегда новый объект:
setUser({ ...user, name: "Bob" });

// ❌ 2. Контекст теряется при re-assign:
const { Component } = React; // OK
// После:
const Component = undefined; // Если кто-то переназначит React.Component → ошибка

// ❌ 3. Short-circuit с числом:
{0 && <Component />}  // рендерит "0"!
// ✅:
{count > 0 && <Component />}
{Boolean(count) && <Component />}

// ❌ 4. Fragment key:
// Нельзя: <> ... </>
// Нужен ключ → используй длинную форму:
items.map(item => (
  <React.Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.description}</dd>
  </React.Fragment>
))
```
