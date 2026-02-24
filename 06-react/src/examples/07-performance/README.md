# 07 · Performance

[← Назад](../../../README.md)

---

## Содержание

- [Причины re-render](#причины-re-render)
- [React.memo](#reactmemo)
- [Profiler API](#profiler-api)
- [Re-render детектор](#re-render-детектор)
- [Стратегии оптимизации](#стратегии-оптимизации)
- [Concurrent Features](#concurrent-features)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## Причины re-render

Компонент ре-рендерится в **четырёх случаях:**

```
1. Его собственный state изменился (useState / useReducer dispatch)
2. Его props изменились (или родитель ре-рендерится → новые пропсы)
3. Context значение которым он подписан изменилось (useContext)
4. forceUpdate() (устаревший class API)
```

**React.memo предотвращает только случай 2** (изменение props). Не помогает при 1, 3, 4.

```tsx
// Цепочка ре-рендеров:
function Parent() {
  const [count, setCount] = useState(0); // изменился state Parent
  return <Child />; // ← Child ре-рендерится (случай 2: родитель обновился)
}

// Даже если Child не принимает props:
const Child = memo(function Child() {
  return <div>Static</div>;
});
// memo защищает: Child не ре-рендерится при изменении Parent
```

---

## React.memo

`memo` — HOC обёртка, делает **shallow compare** props перед рендером.

```tsx
// Синтаксис:
const MemoChild = memo(ChildComponent);
// Или:
const MemoChild = memo(ChildComponent, (prevProps, nextProps) => {
  // true → пропустить рендер (props "равны")
  // false → ре-рендерить
  return prevProps.id === nextProps.id && prevProps.name === nextProps.name;
});
```

### Shallow compare

```tsx
// Примитивы — сравнение по значению ✅
memo(Child) // number 42 === 42 → bail out
memo(Child) // string "alice" === "alice" → bail out

// Объекты — сравнение по ССЫЛКЕ ❌
// ❌ Новый объект каждый рендер родителя → memo бесполезен:
function Parent() {
  return <MemoChild config={{ size: "large" }} />; // {} !== {} → всегда рендер
}

// ✅ Стабильная ссылка через useMemo:
function Parent() {
  const config = useMemo(() => ({ size: "large" }), []);
  return <MemoChild config={config} />;
}

// Функции — новая функция каждый рендер ❌
function Parent() {
  const handleClick = () => {}; // новая функция → memo бесполезен
  return <MemoChild onClick={handleClick} />;
}

// ✅ useCallback для стабильной функции:
const handleClick = useCallback(() => {}, []);
```

### memo + Context — ловушка

```tsx
const MemoChild = memo(function MemoChild() {
  const value = useContext(MyContext); // ← подписан на Context
  return <div>{value}</div>;
});

// ⚠️ memo НЕ помогает при изменении Context!
// При каждом изменении MyContext → MemoChild ре-рендерится
// memo защищает только от изменения props, не Context
```

---

## Profiler API

`<Profiler>` — инструмент измерения production-like производительности.

```tsx
import { Profiler, type ProfilerOnRenderCallback } from "react";

const onRender: ProfilerOnRenderCallback = (
  id,              // "id" prop переданный Profiler
  phase,           // "mount" | "update" | "nested-update"
  actualDuration,  // Время этого рендера (ms) — с мемоизацией
  baseDuration,    // Время без мемоизации (наихудший случай)
  startTime,       // Когда React начал рендер
  commitTime,      // Когда React зафиксировал в DOM
) => {
  // Отправить в аналитику / мониторинг
  analytics.track("render", { id, phase, actualDuration });
};

// Оборачивай проблемные части, не всё приложение:
<Profiler id="Navigation" onRender={onRender}>
  <Navigation />
</Profiler>
```

**`actualDuration` vs `baseDuration`:**
- `actualDuration` — реальное время этого рендера (учитывает React.memo bail out)
- `baseDuration` — время если бы все дочерние компоненты ре-рендерились (без мемоизации)
- `actualDuration << baseDuration` → мемоизация работает эффективно

---

## Re-render детектор

Паттерн для визуальной отладки:

```tsx
function useRenderCount(label?: string) {
  const renderCount = useRef(0);
  renderCount.current++;

  // Опционально: flash эффект
  const ref = useRef<HTMLElement>(null);
  if (ref.current) {
    ref.current.animate(
      [{ outline: "2px solid orange" }, { outline: "none" }],
      { duration: 300 }
    );
  }

  if (label) {
    console.count(`[render] ${label}`);
  }

  return { renderCount: renderCount.current, ref };
}

// Применение в компоненте:
function ExpensiveWidget() {
  const { renderCount, ref } = useRenderCount("ExpensiveWidget");
  return (
    <div ref={ref}>
      Widget (renders: {renderCount})
    </div>
  );
}
```

**React DevTools Profiler** — основной инструмент в production:
- Запись сессии → Flamegraph
- "Why did this render?" — показывает что изменилось (props/state/context)
- Ranked chart — сортировка по времени рендера

---

## Стратегии оптимизации

Применяй **в порядке приоритета:**

### 1. Оптимизировать алгоритм

```tsx
// ❌ O(n²) — для каждого элемента проходить весь массив
const result = items.filter(item =>
  bigList.includes(item.id) // O(n) для каждого → O(n²)
);

// ✅ O(n) — предварительно создать Set
const bigListSet = new Set(bigList);
const result = items.filter(item => bigListSet.has(item.id)); // O(1) lookup
```

### 2. Уменьшить scope re-render

```tsx
// ❌ State в родителе → все дочерние ре-рендерятся
function App() {
  const [count, setCount] = useState(0); // любое изменение → весь App
  return (
    <>
      <Header />    {/* ре-рендерится при изменении count */}
      <Main />      {/* ре-рендерится */}
      <Counter count={count} onChange={setCount} />
    </>
  );
}

// ✅ Вынести state в отдельный компонент:
function Counter() {
  const [count, setCount] = useState(0); // только Counter ре-рендерится
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
function App() {
  return (
    <>
      <Header />   {/* никогда не ре-рендерится */}
      <Main />
      <Counter />
    </>
  );
}
```

### 3. Мемоизация

```tsx
// React.memo — для компонентов
// useMemo — для значений
// useCallback — для функций
// Применять только после измерения!
```

### 4. Виртуализация

```tsx
// Для списков > 100 элементов:
import { FixedSizeList } from "react-window";

<FixedSizeList
  height={600}
  width={400}
  itemCount={items.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  )}
</FixedSizeList>
```

### 5. Code splitting

```tsx
// Lazy loading тяжёлых компонентов/роутов:
const HeavyPage = lazy(() => import("./HeavyPage"));
const Chart = lazy(() => import("./Chart"));

// Динамический import в event handler:
const handleClick = async () => {
  const { processData } = await import("./heavy-lib");
  processData(data);
};
```

---

## Concurrent Features

React 18 — управление приоритетами обновлений:

```tsx
// useTransition — пометить обновление как "несрочное"
const [isPending, startTransition] = useTransition();

const handleChange = (value: string) => {
  setInput(value);           // СРОЧНОЕ — немедленно (typing)
  startTransition(() => {
    setSearchResults(filter(value)); // НЕСРОЧНОЕ — можно подождать
  });
};

// useDeferredValue — "отложенная" копия значения
const deferred = useDeferredValue(searchQuery);
// deferred "отстаёт" от searchQuery при высокой нагрузке
// → визуальный индикатор stale: opacity: isStale ? 0.7 : 1

// React Compiler (experimental, React 19+)
// Автоматически добавляет мемоизацию — не нужны useMemo/useCallback вручную
```

---

## Вопросы на интервью

### 1. React.memo не помогает — почему?

Три причины:
1. **Нестабильный prop** — объект `{}` или функция `() => {}` создаются заново каждый рендер → shallow compare всегда fails. Решение: `useMemo`/`useCallback`.
2. **Context изменился** — `memo` не защищает от `useContext`, только от props.
3. **Родитель ре-рендерится без изменения props** — memo защищает только если props действительно стабильны.

### 2. Чем actualDuration отличается от baseDuration?

`actualDuration` — реальное время рендера **с учётом мемоизации** (React.memo bail out). `baseDuration` — теоретическое время если бы **все** дочерние компоненты ре-рендерились без мемоизации. Если `actual << base` → мемоизация работает эффективно.

### 3. Как Context вызывает лишние рендеры?

Все компоненты вызывающие `useContext(MyContext)` ре-рендерятся при **любом** изменении value. Решения: Split Context (разделить на Data + Dispatch), мемоизировать value через `useMemo`, использовать селекторы (как в Zustand/Jotai).

### 4. В каком порядке применять оптимизации?

1. **Измерить** (Profiler, React DevTools) — убедиться что проблема реальная
2. **Алгоритм** — O(n²) → O(n)
3. **Scope** — вынести state ниже по дереву
4. **Мемоизация** — React.memo + useMemo + useCallback
5. **Виртуализация** — для длинных списков
6. **Code splitting** — lazy загрузка тяжёлых частей

---

## Ловушки

```tsx
// ❌ 1. Преждевременная мемоизация везде
const value = useMemo(() => a + b, [a, b]); // a + b занимает микросекунды
// Overhead useMemo > выгода

// ❌ 2. memo без useCallback → бесполезно
const MemoChild = memo(Child);
function Parent() {
  const onClick = () => {}; // новая каждый рендер → memo бесполезен!
  return <MemoChild onClick={onClick} />;
}

// ❌ 3. useMemo для JSX (React уже это оптимизирует)
const element = useMemo(() => <ExpensiveUI />, []); // не нужно
// React.memo на самом компоненте — правильный подход

// ❌ 4. Оптимизировать до профилирования
// Сначала: измерь, найди bottleneck
// Потом: оптимизируй конкретное место

// ❌ 5. Игнорировать размер bundle
// Code splitting важен не меньше runtime performance
// Большой bundle → медленная загрузка → poor FCP/LCP
```
