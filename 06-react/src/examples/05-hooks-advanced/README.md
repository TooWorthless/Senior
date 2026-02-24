# 05 · useReducer & useMemo

[← Назад](../../../README.md)

---

## Содержание

- [useReducer](#usereducer)
- [useMemo](#usememo)
- [useCallback](#usecallback)
- [useLayoutEffect](#uselayouteffect)
- [useId](#useid)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## useReducer

### Когда выбрать useReducer вместо useState

```tsx
// useState подходит для:
const [count, setCount] = useState(0);          // простое, независимое
const [name, setName] = useState("");            // не связаны друг с другом

// useReducer подходит когда:
// 1. Несколько связанных полей state
// 2. Следующий state зависит от предыдущего (complex transitions)
// 3. Обновления атомарны (несколько полей меняются вместе)
// 4. Логику хочется тестировать отдельно от UI
```

### Анатомия useReducer

```tsx
type Action =
  | { type: "INCREMENT" }
  | { type: "SET"; payload: number }
  | { type: "RESET" };

// Reducer — ЧИСТАЯ функция (нет side effects, нет async)
function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "INCREMENT": return state + 1;
    case "SET":       return action.payload;
    case "RESET":     return 0;
    default:          return state; // важно для TS exhaustiveness
  }
}

function Counter() {
  const [count, dispatch] = useReducer(reducer, 0);

  return (
    <>
      <span>{count}</span>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
      <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
    </>
  );
}
```

### dispatch стабилен

`dispatch` — стабильная ссылка между рендерами (как `setState`). **Не нужно в deps**.

```tsx
// ✅ dispatch в deps — нормально, но можно опустить (всегда стабилен)
const handleClick = useCallback(() => {
  dispatch({ type: "INCREMENT" });
}, []); // [] — OK, dispatch стабилен
```

### Тестируемость

Это главное преимущество useReducer — логика вне компонента:

```tsx
// reducer.test.ts
import { todoReducer } from "./reducer";

test("ADD создаёт todo", () => {
  const initial = { todos: [], nextId: 1 };
  const next = todoReducer(initial, { type: "ADD", text: "Test" });
  expect(next.todos).toHaveLength(1);
  expect(next.todos[0].text).toBe("Test");
  expect(next.todos[0].completed).toBe(false);
});

test("TOGGLE меняет completed", () => {
  const initial = { todos: [{ id: 1, text: "T", completed: false }], nextId: 2 };
  const next = todoReducer(initial, { type: "TOGGLE", id: 1 });
  expect(next.todos[0].completed).toBe(true);
});
// Без React, без mount, без render — чистые unit tests
```

### Lazy initializer

```tsx
function init(initialCount: number) {
  return { count: initialCount, history: [] };
}

// Функция init вызовется только при mount:
const [state, dispatch] = useReducer(reducer, initialCount, init);
```

---

## useMemo

**Мемоизация** = кеширование результата вычисления до изменения deps.

```tsx
const value = useMemo(() => expensiveCalc(a, b), [a, b]);
// Пересчитывается только когда a или b изменились
```

### Когда нужен useMemo

```tsx
// ✅ 1. Тяжёлые вычисления:
const sortedItems = useMemo(() =>
  [...items].sort((a, b) => b.score - a.score),
[items]);

// ✅ 2. Стабильность ссылки для memo() дочерних компонентов:
const config = useMemo(() => ({
  endpoint: `/api/${userId}`,
  headers: { Authorization: token },
}), [userId, token]);
// config — стабилен пока userId и token не изменились
// MemoChild не будет ре-рендериться из-за нового объекта

// ✅ 3. Стабильность для deps в useEffect:
const filter = useMemo(() => ({ category, minPrice, maxPrice }),
  [category, minPrice, maxPrice]);
useEffect(() => {
  fetchProducts(filter);
}, [filter]); // без useMemo — новый объект каждый рендер → бесконечный цикл
```

### Когда НЕ нужен useMemo

```tsx
// ❌ Простые вычисления (overhead больше пользы):
const fullName = useMemo(() => `${first} ${last}`, [first, last]); // лишнее
const fullName = `${first} ${last}`; // ✅

// ❌ Примитивные значения (и так стабильны):
const doubled = useMemo(() => count * 2, [count]); // лишнее
const doubled = count * 2; // ✅

// ❌ Компонент без React.memo (мемоизировать callback бессмысленно):
function Parent() {
  const handleClick = useCallback(() => {}, []); // бессмысленно
  return <ChildWithoutMemo onClick={handleClick} />; // всё равно ре-рендерится
}
```

---

## useCallback

`useCallback(fn, deps)` ≡ `useMemo(() => fn, deps)` — мемоизация **функции**.

```tsx
// ❌ Нестабильный callback — memo() на Child бесполезен:
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = () => setCount(c => c + 1); // новая функция каждый рендер!
  return <MemoChild onClick={handleClick} />; // Child всегда ре-рендерится
}

// ✅ Стабильный callback:
function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => setCount(c => c + 1), []);
  return <MemoChild onClick={handleClick} />; // Child рендерится только при count
}
```

### Правило: useCallback нужен только для memo() или deps

```tsx
// Три сценария где useCallback имеет смысл:

// 1. Передача в React.memo компонент:
const handler = useCallback(() => handleEvent(id), [id]);
<MemoChild onEvent={handler} />

// 2. В deps useEffect (чтобы не пересоздавать эффект):
const fetchData = useCallback(async () => {
  const data = await fetch(`/api/${userId}`);
  setData(await data.json());
}, [userId]);

useEffect(() => {
  fetchData();
}, [fetchData]); // стабилен пока userId не изменился

// 3. В custom hook который возвращает callback:
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle] as const;
  // Пользователи хука ожидают стабильный toggle
}
```

---

## useLayoutEffect

**Синхронный** эффект — запускается после DOM мутации, **до paint**.

```
useEffect    → async, после paint  (не блокирует браузер)
useLayoutEffect → sync, до paint   (блокирует paint)
```

### Когда использовать

```tsx
// 1. Чтение/изменение DOM до того как пользователь увидит (no flash):
function Tooltip({ anchor }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Читаем позицию якоря и позиционируем tooltip ДО paint
    const rect = anchor.getBoundingClientRect();
    const tooltipRect = tooltipRef.current!.getBoundingClientRect();
    setPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - tooltipRect.width - 8),
    });
  }); // без deps — каждый рендер (tooltip должен следовать за anchor)

  return <div ref={tooltipRef} style={pos}>...</div>;
}

// 2. Измерение элемента (getBoundingClientRect):
useLayoutEffect(() => {
  const { width, height } = ref.current!.getBoundingClientRect();
  setDimensions({ width, height }); // до paint → нет flash
}, []);

// 3. Анимации где нужен актуальный DOM
```

### SSR предупреждение

```tsx
// useLayoutEffect на сервере → предупреждение (нет DOM)
// Решение 1: isomorphic hook
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Решение 2: suppressHydrationWarning на элементе
// Решение 3: useEffect (если flash допустим)
```

---

## useId

Генерирует **стабильный уникальный ID** для инстанса компонента.

```tsx
function FormField({ label }: { label: string }) {
  const id = useId(); // ":r0:", ":r1:", ":r2:"...

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </div>
  );
}

// Два инстанса → два разных ID:
<FormField label="Name" />    // id = ":r0:"
<FormField label="Email" />   // id = ":r1:"
// Нет дублирования → нет a11y багов
```

### Почему не Math.random()

```tsx
// ❌ Math.random() — разные значения на сервере и клиенте → hydration mismatch
const id = `field-${Math.random()}`; // сервер: 0.123, клиент: 0.456 → ❌

// ✅ useId — одинаковый на сервере и клиенте (SSR safe)
const id = useId(); // всегда стабилен, SSR совместим
```

---

## Вопросы на интервью

### 1. Когда выбрать useReducer вместо useState?

Когда state имеет **связанные поля** которые меняются вместе, когда **логика обновления сложная** (несколько условий, вычисления из предыдущего state), когда хочется **тестировать логику** отдельно от компонента, или когда state похож на конечный автомат (loading/success/error).

### 2. В чём разница useMemo и useCallback?

`useMemo` мемоизирует **результат вычисления** (значение). `useCallback` мемоизирует **функцию**. Технически `useCallback(fn, deps)` === `useMemo(() => fn, deps)`.

Используй `useMemo` для дорогих вычислений и стабильных объектов. `useCallback` — для стабильных функций передаваемых в `memo()` или используемых в `useEffect` deps.

### 3. Почему преждевременная мемоизация — антипаттерн?

Мемоизация имеет **cost**: React должен хранить предыдущие deps, запускать сравнение, хранить результат в памяти. Для простых вычислений overhead > выгода. **Сначала измерь** (React DevTools Profiler), потом оптимизируй. Memo везде подряд — это засорение кода без реального ускорения.

### 4. Чем useLayoutEffect отличается от useEffect?

`useLayoutEffect` — **синхронный**, запускается после DOM мутации, **до** того как браузер нарисует. `useEffect` — **асинхронный**, после paint. Используй `useLayoutEffect` когда нужно читать/изменять DOM до отображения пользователю (позиционирование, измерение). Иначе — `useEffect` чтобы не блокировать браузер.

### 5. Зачем useId — почему нельзя Math.random()?

`Math.random()` даёт разные значения при SSR (сервер) и hydration (клиент) → hydration mismatch → React выбросит ошибку. `useId` детерминирован — одинаковый на сервере и клиенте для одной и той же позиции в дереве. Также стабилен между рендерами в отличие от Math.random().

---

## Ловушки

```tsx
// ❌ 1. Мутация в reducer → непредсказуемость
function reducer(state, action) {
  state.items.push(action.item); // ❌ мутация!
  return state; // та же ссылка → React не видит изменений
}

// ✅ Иммутабельно:
function reducer(state, action) {
  return { ...state, items: [...state.items, action.item] };
}

// ❌ 2. Async операции в reducer
function reducer(state, action) {
  fetch(...); // ❌ side effect в reducer!
  return state;
}
// ✅ Async в компоненте, dispatch результата:
const handleSubmit = async () => {
  dispatch({ type: "LOADING" });
  const data = await fetchData();
  dispatch({ type: "SUCCESS", payload: data });
};

// ❌ 3. useMemo/useCallback без реальной необходимости
// (засоряет код, добавляет complexity)
const handleClick = useCallback(() => {
  // однострочная функция в компоненте без memo-children
  setX(1);
}, []); // не нужен

// ❌ 4. useLayoutEffect для async операций
useLayoutEffect(() => {
  fetch("/api").then(setData); // ❌ блокирует paint до разрешения Promise
}, []);
// ✅ useEffect для async
```
