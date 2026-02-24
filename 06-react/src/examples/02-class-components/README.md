# 02 · Class Components

[← Назад](../../../README.md)

---

## Содержание

- [Lifecycle полностью](#lifecycle-полностью)
- [PureComponent](#purecomponent)
- [getDerivedStateFromProps](#getderivedstatefromprops)
- [getSnapshotBeforeUpdate](#getsnapshotbeforeupdate)
- [ErrorBoundary](#errorboundary)
- [Class → Hooks шпаргалка](#class--hooks-шпаргалка)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## Lifecycle полностью

```
╔══════════════════════════════════════════════════════╗
║                    MOUNTING                          ║
╠══════════════════════════════════════════════════════╣
║  constructor(props)                                  ║
║    → super(props) ОБЯЗАТЕЛЬНО первым                 ║
║    → this.state = { ... }                            ║
║    → bind методов (или class fields)                 ║
║                                                      ║
║  static getDerivedStateFromProps(props, state)       ║
║    → pure, возвращает partial state или null         ║
║                                                      ║
║  render()                                            ║
║    → должна быть чистой функцией                     ║
║    → возвращает JSX | null | array | string          ║
║                                                      ║
║  [DOM обновлён]                                      ║
║                                                      ║
║  componentDidMount()                                 ║
║    → DOM готов: fetch, subscribe, setInterval        ║
╠══════════════════════════════════════════════════════╣
║                    UPDATING                          ║
╠══════════════════════════════════════════════════════╣
║  static getDerivedStateFromProps(props, state)       ║
║                                                      ║
║  shouldComponentUpdate(nextProps, nextState) → bool  ║
║    → false = пропустить рендер (оптимизация)         ║
║    → PureComponent реализует автоматически           ║
║                                                      ║
║  render()                                            ║
║                                                      ║
║  getSnapshotBeforeUpdate(prevProps, prevState)       ║
║    → читаем DOM ДО изменений (e.g. scrollTop)        ║
║    → возвращаемое значение → snapshot                ║
║                                                      ║
║  [DOM обновлён]                                      ║
║                                                      ║
║  componentDidUpdate(prevProps, prevState, snapshot)  ║
║    → сравниваем с prev*, делаем доп. действия        ║
╠══════════════════════════════════════════════════════╣
║                   UNMOUNTING                         ║
╠══════════════════════════════════════════════════════╣
║  componentWillUnmount()                              ║
║    → clearInterval, unsubscribe, cancel fetch        ║
╠══════════════════════════════════════════════════════╣
║                  ERROR HANDLING                      ║
╠══════════════════════════════════════════════════════╣
║  static getDerivedStateFromError(error)              ║
║    → вернуть fallback state (render phase)           ║
║                                                      ║
║  componentDidCatch(error, info)                      ║
║    → логирование (commit phase)                      ║
╚══════════════════════════════════════════════════════╝
```

### componentDidUpdate — правильный паттерн

```tsx
componentDidUpdate(prevProps: Props, prevState: State) {
  // ✅ Всегда сравниваем с previous!
  if (prevProps.userId !== this.props.userId) {
    this.fetchUser(this.props.userId);
  }

  // ❌ Без сравнения → бесконечный цикл
  this.setState({ ... }); // → update → componentDidUpdate → setState → ...
}
```

---

## PureComponent

`PureComponent` = `Component` + автоматический `shouldComponentUpdate` с **shallow compare**.

```tsx
// Shallow compare логика:
function shallowEqual(obj1: object, obj2: object): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  return keys1.every(key => obj1[key] === obj2[key]); // === по ссылке
}
```

**Когда работает:**
```tsx
// Примитивы — сравнение по значению
<PureChild count={42} name="Alice" />
// 42 === 42 → нет re-render ✅

// Новый объект — всегда re-render
<PureChild user={{ name: "Alice" }} />
// {} !== {} (разные ссылки) → всегда re-render ❌
```

**Главная ловушка — мутация:**
```tsx
class Parent extends Component {
  state = { items: [1, 2, 3] };

  addItem() {
    // ❌ Мутация — та же ссылка → PureChild не увидит изменение!
    this.state.items.push(4);
    this.setState({ items: this.state.items });
  }

  addItemCorrect() {
    // ✅ Новый массив → PureChild обновится
    this.setState(prev => ({ items: [...prev.items, 4] }));
  }
}
```

---

## getDerivedStateFromProps

Статический метод — вызывается перед каждым render (mount + update). Возвращает partial state или `null`.

### Когда НУЖЕН (редко)

```tsx
// Анимация числа — запомнить предыдущее для направления анимации
static getDerivedStateFromProps(props, state) {
  if (props.value !== state.prevValue) {
    return {
      prevValue: props.value,
      direction: props.value > state.prevValue ? "up" : "down",
    };
  }
  return null;
}
```

### Когда НЕ НУЖЕН (часто неправильно используют)

```tsx
// ❌ Антипаттерн: "синхронизировать" props в state
static getDerivedStateFromProps(props, state) {
  return { email: props.email }; // полностью управляемый — нельзя редактировать!
}

// ✅ Вместо этого: полностью контролируемый компонент
<Input value={this.props.email} onChange={this.props.onEmailChange} />

// ✅ Или полностью неуправляемый с key для сброса:
<Input key={userId} defaultEmail={user.email} />
```

---

## getSnapshotBeforeUpdate

Вызывается после render, **до** применения изменений в DOM. Читаем DOM до изменения.

```tsx
class ChatWindow extends Component {
  private listRef = React.createRef<HTMLDivElement>();

  getSnapshotBeforeUpdate(prevProps, prevState) {
    // Было ли сообщение внизу ДО обновления?
    const list = this.listRef.current!;
    const isAtBottom =
      list.scrollHeight - list.scrollTop === list.clientHeight;
    return isAtBottom; // передаётся в componentDidUpdate
  }

  componentDidUpdate(prevProps, prevState, snapshot: boolean) {
    // Если был внизу — прокрутить вниз после добавления сообщений
    if (snapshot) {
      const list = this.listRef.current!;
      list.scrollTop = list.scrollHeight;
    }
  }
}
```

> Хуковый аналог — `useLayoutEffect` (приближение, но без snapshot API).

---

## ErrorBoundary

**Единственное применение class компонентов в современном React** — потому что `getDerivedStateFromError` и `componentDidCatch` не имеют хуков-аналогов.

```tsx
class ErrorBoundary extends Component<
  { fallback: ReactNode; onError?: (error: Error) => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  // Фаза Render: обновить state → показать fallback
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  // Фаза Commit: логирование, отправка в Sentry
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error);
    // Sentry.captureException(error, { extra: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

**Что перехватывает ErrorBoundary:**
- ✅ Ошибки в `render()`
- ✅ Ошибки в lifecycle методах дочерних компонентов
- ✅ Ошибки в конструкторах дочерних компонентов

**Что НЕ перехватывает:**
- ❌ Async ошибки (`setTimeout`, `Promise`, `fetch`)
- ❌ Event handlers (обрабатывай сам через try/catch)
- ❌ Ошибки в самом ErrorBoundary
- ❌ SSR ошибки

**Для async ошибок — `react-error-boundary`:**
```tsx
import { useErrorBoundary } from "react-error-boundary";

function DataFetcher() {
  const { showBoundary } = useErrorBoundary();

  const handleFetch = async () => {
    try {
      await fetchData();
    } catch (error) {
      showBoundary(error); // пробросить в ближайший ErrorBoundary
    }
  };
}
```

---

## Class → Hooks шпаргалка

| Class Component | Hooks эквивалент |
|-----------------|------------------|
| `this.state` / `setState` | `useState` / `useReducer` |
| `componentDidMount` | `useEffect(() => {}, [])` |
| `componentDidUpdate(prevProps)` | `useEffect(() => {}, [dep])` |
| `componentWillUnmount` | `useEffect` cleanup: `return () => {}` |
| `shouldComponentUpdate` | `React.memo` / `useMemo` |
| `getDerivedStateFromProps` | Вычисление в render или `useEffect` |
| `getSnapshotBeforeUpdate` | `useLayoutEffect` (приближение) |
| `componentDidCatch` | ❌ Только class! |
| `createRef` | `useRef` |
| `PureComponent` | `React.memo` |
| `forceUpdate()` | `useReducer` dispatch |
| `this.myMethod = this.myMethod.bind(this)` | Arrow function или `useCallback` |

---

## Вопросы на интервью

### 1. Чем PureComponent отличается от Component?

`PureComponent` автоматически реализует `shouldComponentUpdate` с **shallow compare** пропсов и стейта. `Component` всегда ре-рендерится. Ловушка: shallow compare не работает с мутацией — нужно всегда создавать новые объекты. Хуковый аналог — `React.memo`.

### 2. getDerivedStateFromProps — когда нужен?

Очень редко. Нужен когда следующий state зависит от **изменения props относительно предыдущего state** (не просто от текущих props). Классический пример — направление анимации. В 99% случаев используется неправильно для "синхронизации" props → state, что создаёт полуконтролируемый компонент.

### 3. Почему ErrorBoundary только class?

`getDerivedStateFromError` вызывается в **render phase** — нужно синхронно вернуть новый state. Хуки не могут изменять state в render phase. `componentDidCatch` вызывается в **commit phase** — логирование. React команда обещала хуковый аналог, но пока (React 19) его нет. Используй `react-error-boundary` для удобной работы.

### 4. componentDidCatch vs getDerivedStateFromError

`getDerivedStateFromError` — статический, вызывается в render phase, возвращает новый state (чтобы показать fallback). `componentDidCatch` — вызывается в commit phase, может иметь side effects (логирование, Sentry). Оба нужны: первый для UI, второй для observability.

### 5. Аналог componentDidUpdate на хуках

```tsx
// Запуск при mount И при изменении dep:
useEffect(() => {
  // аналог componentDidUpdate(prevProps) + componentDidMount
}, [dep]);

// Только при изменении (пропустить mount):
const isFirstRender = useRef(true);
useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }
  // только updates
}, [dep]);
```

---

## Ловушки

```tsx
// ❌ 1. Забыть super(props) — this.props undefined в constructor
constructor(props) {
  // super(); // ← не передал props!
  super(props); // ✅
  console.log(this.props.name); // undefined без super(props)
}

// ❌ 2. setState в componentDidMount без условия → лишний рендер
componentDidMount() {
  this.setState({ data: fetchedData }); // лучше: инициализируй state сразу
}

// ❌ 3. Подписка без отписки → утечка памяти
componentDidMount() {
  window.addEventListener("resize", this.handler);
  // забыли componentWillUnmount!
}

// ❌ 4. this.setState в componentDidUpdate без сравнения → бесконечный цикл
componentDidUpdate() {
  this.setState({ count: this.state.count + 1 }); // ❌ бесконечно
}
componentDidUpdate(prevProps) {
  if (prevProps.x !== this.props.x) { // ✅ с условием
    this.setState({ derived: compute(this.props.x) });
  }
}
```
