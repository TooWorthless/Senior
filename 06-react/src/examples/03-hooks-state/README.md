# 03 · useState & useRef

[← Назад](../../../README.md)

---

## Содержание

- [useState под капотом](#usestate-под-капотом)
- [Functional Update](#functional-update)
- [State Shape](#state-shape)
- [useRef](#useref)
- [Batching (React 18)](#batching-react-18)
- [flushSync](#flushsync)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## useState под капотом

Хуки хранятся как **linked list** в `fiber.memoizedState`. Порядок вызовов хуков должен быть постоянным — поэтому нельзя вызывать хуки в условиях/циклах.

```
Fiber node
  └─ memoizedState: Hook₁ → Hook₂ → Hook₃ → null
                    (useState) (useEffect) (useRef)
```

**Каждый Hook объект:**
```ts
interface Hook {
  memoizedState: unknown;   // текущее значение
  baseState: unknown;
  queue: UpdateQueue;       // очередь pending updates
  next: Hook | null;        // следующий хук
}
```

**При `setState(newValue)`:**
1. Создаётся `Update` объект и добавляется в `queue`
2. React schedules re-render
3. При следующем рендере — React "прогоняет" все pending updates через reducer
4. `memoizedState` обновляется, компонент рендерится с новым значением

**Важно:** `setState` **не мутирует текущий state** — state нового рендера.

```tsx
function Example() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log(count); // 0 — текущий рендер
    setCount(1);
    console.log(count); // всё ещё 0! setState async
  };
}
```

---

## Functional Update

Когда новое значение зависит от предыдущего — **всегда используй functional update**.

```tsx
// ❌ Закрыта на стале value
const handleClick = () => {
  setCount(count + 1); // count = 0
  setCount(count + 1); // count = 0 (тот же closure!)
  setCount(count + 1); // count = 0
  // Результат: 1, не 3!
};

// ✅ Functional update — получает актуальное значение
const handleClick = () => {
  setCount(c => c + 1); // c = 0 → 1
  setCount(c => c + 1); // c = 1 → 2
  setCount(c => c + 1); // c = 2 → 3
  // Результат: 3 ✅
};

// ✅ Критично в async контексте (setTimeout, Promise):
const handleDelayedIncrement = () => {
  setTimeout(() => {
    setCount(c => c + 1); // всегда актуальное значение
  }, 1000);
};
```

---

## State Shape

### Принципы организации state

```tsx
// 1. Flat лучше вложенного — проще обновлять
// ❌ Вложенный state:
const [user, setUser] = useState({
  profile: { name: "Alice", avatar: "..." },
  settings: { theme: "dark", notifications: true },
  stats: { posts: 5, followers: 100 }
});
// Обновить имя: setUser(u => ({ ...u, profile: { ...u.profile, name: "Bob" } }))
// Болезненно и error-prone

// ✅ Разделить на независимые куски:
const [profile, setProfile] = useState({ name: "Alice", avatar: "..." });
const [settings, setSettings] = useState({ theme: "dark", notifications: true });
// Обновить имя: setProfile(p => ({ ...p, name: "Bob" })) — чисто

// 2. Не дублировать данные в state
// ❌ Производное state:
const [items, setItems] = useState([...]);
const [filteredItems, setFilteredItems] = useState([]);
// При обновлении items нужно синхронизировать filteredItems — баги!

// ✅ Вычислять на лету:
const [items, setItems] = useState([...]);
const [filter, setFilter] = useState("");
const filteredItems = items.filter(item => item.includes(filter)); // производное

// 3. Иммутабельность для объектов и массивов
// ❌ Мутация → React не видит изменение:
state.push(item);       // мутация массива
state.name = "Bob";     // мутация объекта

// ✅ Новые структуры:
setState([...state, item]);
setState({ ...state, name: "Bob" });
setState(state.map(i => i.id === id ? { ...i, done: true } : i));
```

### Lazy Initializer

```tsx
// ❌ heavyCalc() вызывается КАЖДЫЙ рендер:
const [data, setData] = useState(heavyCalc());

// ✅ Функция-инициализатор — только при mount:
const [data, setData] = useState(() => heavyCalc());

// Примеры применения:
const [stored] = useState(() => localStorage.getItem("key") ?? "default");
const [id] = useState(() => crypto.randomUUID());
```

---

## useRef

`useRef` возвращает **mutable объект** `{ current: initialValue }`. Изменение `.current` **не вызывает re-render**.

### Применение 1: DOM Reference

```tsx
const inputRef = useRef<HTMLInputElement>(null);

// После mount: inputRef.current === DOM элемент
// До mount: inputRef.current === null

useEffect(() => {
  inputRef.current?.focus(); // ✅ безопасно в effect
}, []);

return <input ref={inputRef} />;

// React 19: ref как обычный prop (forwardRef не нужен!)
function Input({ ref, ...props }: React.ComponentProps<"input">) {
  return <input ref={ref} {...props} />;
}
```

### Применение 2: Mutable Value без re-render

```tsx
// ID таймера — не нужен re-render
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

// Предыдущее значение
const prevValueRef = useRef(value);
useEffect(() => { prevValueRef.current = value; }); // обновить после каждого рендера

// Счётчик рендеров
const renderCount = useRef(0);
renderCount.current++; // в render phase — нормально

// Флаг первого рендера
const isFirstRender = useRef(true);
```

### ref vs state — когда что

| Критерий | `useRef` | `useState` |
|----------|----------|------------|
| Re-render при изменении | ❌ Нет | ✅ Да |
| Персистентность между рендерами | ✅ Да | ✅ Да |
| Применение | DOM, таймеры, prev значения | UI данные |

> **Правило:** если изменение значения должно **обновить UI** — useState. Если нет — useRef.

---

## Batching (React 18)

**Batching** = группировка нескольких `setState` в один re-render.

```tsx
// React 17: батчировал только в React event handlers
button.onclick = () => {
  setA(1); // React 17: 1 рендер (батчит)
  setB(2);
};

setTimeout(() => {
  setA(1); // React 17: 2 отдельных рендера!
  setB(2);
}, 0);

// React 18: автоматическое батчирование ВЕЗДЕ
setTimeout(() => {
  setA(1); // React 18: 1 рендер (батчирует!)
  setB(2);
}, 0);

// Аналогично в Promise:
fetch("/api").then(() => {
  setA(1); // React 18: 1 рендер
  setB(2);
});
```

---

## flushSync

`flushSync` — принудительный **синхронный рендер**, отключает батчирование.

```tsx
import { flushSync } from "react-dom";

// Нужен когда нужно прочитать DOM сразу после setState:
const handleClick = () => {
  flushSync(() => setCount(1)); // немедленный render + DOM обновлён
  // Здесь DOM уже отражает count=1
  console.log(listRef.current.scrollHeight); // актуальное значение
};

// Другой пример: принудительный рендер перед анимацией
flushSync(() => setVisible(true));
element.animate(...); // элемент уже в DOM
```

**Когда нужен:** очень редко. Обычно — когда нужно читать DOM сразу после setState (позиция элемента, размеры). В большинстве случаев лучше `useLayoutEffect`.

---

## Вопросы на интервью

### 1. Почему setCount(count + 1) три раза подряд даёт +1, а не +3?

При вызове `setCount(count + 1)` — `count` берётся из **closure текущего рендера** (допустим, 0). Все три вызова используют то же значение `0`. React батчит их в один рендер, последнее присваивание выигрывает: `count = 0 + 1 = 1`.

Решение — functional update: `setCount(c => c + 1)`. React применяет обновления последовательно к актуальному значению.

### 2. В чём разница useRef и useState?

Главное: `useRef` **не вызывает re-render** при изменении `.current`. Оба хранят значение между рендерами. `useState` — для данных которые должны влиять на UI. `useRef` — для данных которые не должны (ID таймера, DOM элемент, счётчик рендеров, предыдущее значение).

### 3. Что изменилось в batching между React 17 и 18?

React 17 батчировал только в React event handlers (onClick, onChange и т.д.). В `setTimeout`, `Promise.then`, нативных событиях — каждый `setState` вызывал отдельный рендер. React 18 ввёл **Automatic Batching** — батчирует везде, независимо от контекста.

### 4. Когда использовать flushSync?

Крайне редко. Когда нужно прочитать обновлённый DOM **сразу после setState**, до следующего события. Например: установить state → прочитать scrollHeight элемента. В большинстве случаев правильное решение — `useLayoutEffect`.

### 5. Почему нельзя мутировать объект в state напрямую?

React использует **referential equality** (`Object.is`) для определения изменений. При мутации объекта ссылка остаётся той же → React считает что ничего не изменилось → bail out → нет re-render. Всегда создавай новый объект: `setState(prev => ({ ...prev, field: value }))`.

---

## Ловушки

```tsx
// ❌ 1. Чтение state сразу после setState — значение не обновилось
setCount(5);
console.log(count); // всё ещё 0! Обновление только после re-render

// ❌ 2. setState в render phase → бесконечный цикл
function Bad() {
  const [x, setX] = useState(0);
  setX(1); // ❌ рендер → setX → рендер → ...
  return <div>{x}</div>;
}

// ❌ 3. Читать ref.current во время render (ненадёжно в StrictMode)
function Bad() {
  const countRef = useRef(0);
  countRef.current++; // изменение в render → в StrictMode вызовется дважды
  return <div>{countRef.current}</div>; // нестабильно
}

// ❌ 4. Ref для данных которые должны вызывать re-render
function Bad() {
  const nameRef = useRef(""); // ❌ UI не обновится при изменении
  return (
    <input onChange={e => { nameRef.current = e.target.value; }}
           value={nameRef.current} /> // контролируемый input не обновится!
  );
}

// ❌ 5. Тяжёлая инициализация без lazy initializer
const [data] = useState(JSON.parse(localStorage.getItem("huge")!)); // каждый рендер!
const [data] = useState(() => JSON.parse(localStorage.getItem("huge")!)); // ✅
```
