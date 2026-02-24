# 06 · Custom Hooks

[← Назад](../../../README.md)

---

## Содержание

- [Что такое custom hook](#что-такое-custom-hook)
- [Правила написания](#правила-написания)
- [useFetch](#usefetch)
- [useLocalStorage](#uselocalstorage)
- [useDebounce vs useThrottle](#usedebounce-vs-usethrottle)
- [useIntersectionObserver](#useintersectionobserver)
- [usePrevious & useEventListener](#useprevious--useeventlistener)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## Что такое custom hook

Custom hook — функция с именем начинающимся на `use`, которая вызывает другие хуки. Инкапсулирует **логику**, не UI.

```tsx
// ❌ Это не hook (нет вызовов хуков):
function useFormatDate(date: Date) {
  return date.toLocaleDateString(); // нет хуков → это просто утилита
}

// ✅ Custom hook — вызывает useState/useEffect:
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}
```

**Ключевое свойство:** каждый вызов hook — **независимый экземпляр** state.

```tsx
// Два отдельных state, не shared:
const widthA = useWindowWidth(); // свой state
const widthB = useWindowWidth(); // свой state (тот же, но независимый)
```

---

## Правила написания

```tsx
// 1. Имя ДОЛЖНО начинаться с "use"
//    → ESLint react-hooks/rules-of-hooks находит нарушения правил хуков
function useToggle() { ... }    // ✅
function toggle() {             // ❌ — если внутри хуки
  const [v, set] = useState(); // ESLint не проверит правила
}

// 2. Не условные хуки внутри custom hook
function useBad(enabled: boolean) {
  if (enabled) {
    const [x] = useState(); // ❌ нарушение rules of hooks
  }
}

// 3. Документируй возвращаемый тип через TypeScript
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  return {
    count,
    increment: () => setCount(c => c + 1),
    decrement: () => setCount(c => c - 1),
    reset: () => setCount(initial),
  }; // TypeScript автоматически инферит тип
}

// 4. Возвращай кортеж [value, setter] или объект — в зависимости от контекста
// Кортеж — когда пользователь переименует: const [x, setX] = useToggle()
// Объект — когда полей много: const { data, error, loading } = useFetch()
```

---

## useFetch

```tsx
interface FetchState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

function useFetch<T>(url: string | null) {
  const [state, setState] = useState<FetchState<T>>({
    data: null, error: null, loading: false,
  });
  const [refetchFlag, setRefetchFlag] = useState(0);

  useEffect(() => {
    if (!url) return; // null → не делать fetch

    let ignore = false; // race condition prevention
    setState(s => ({ ...s, loading: true, error: null }));

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then(data => { if (!ignore) setState({ data, error: null, loading: false }); })
      .catch(error => { if (!ignore) setState({ data: null, error, loading: false }); });

    return () => { ignore = true; }; // cleanup — отмена предыдущего запроса

  }, [url, refetchFlag]);

  const refetch = useCallback(() => setRefetchFlag(n => n + 1), []);

  return { ...state, refetch };
}

// Использование:
const { data, error, loading, refetch } = useFetch<User>("/api/user/1");
```

**Что решает этот хук:**
- ✅ Race condition (ignore flag)
- ✅ Error handling
- ✅ Loading state
- ✅ Ручной refetch
- ✅ Отмена при null URL (conditional fetch)

**Production альтернативы:** TanStack Query, SWR — дополнительно решают кеширование, deduplication, stale-while-revalidate, polling, optimistic updates.

---

## useLocalStorage

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Lazy initializer — читаем localStorage только при mount
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue; // localStorage недоступен (private mode, etc.)
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    const toStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(toStore);
    try {
      window.localStorage.setItem(key, JSON.stringify(toStore));
    } catch (e) {
      console.error("localStorage write failed:", e);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    localStorage.removeItem(key);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}
```

### SSR совместимость

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // ✅ Проверка что мы в браузере (не на сервере)
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  // ...
}
```

### Синхронизация между вкладками

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  // ...

  // Слушать изменения из других вкладок:
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key]);

  // ...
}
```

---

## useDebounce vs useThrottle

```
Scenario: пользователь быстро набирает текст
Input: A B C D E (за 300ms)

Debounce (delay=300ms):
Таймер сбрасывается при каждом новом вводе
A─┐          (отменён через 10ms)
  B─┐        (отменён через 10ms)
    C─┐      (отменён через 10ms)
      D─┐    (отменён через 10ms)
        E────── 300ms ──→ FIRED("ABCDE")
Результат: только финальное значение

Throttle (interval=300ms):
Выполняется не чаще чем раз в 300ms
A─── FIRED("A") ──── 300ms ──→ FIRED("ABCD") ──→ FIRED("E")
Результат: периодические обновления
```

```tsx
// Debounce — поиск, автосохранение:
const debouncedQuery = useDebounce(query, 400);
// API вызов только когда пользователь остановился

// Throttle — scroll события, mousemove, rate-limiting:
const throttledScrollY = useThrottle(scrollY, 100);
// Обновление не чаще раза в 100ms
```

---

## useIntersectionObserver

```tsx
function useIntersectionObserver<T extends Element>(
  options: IntersectionObserverInit & { triggerOnce?: boolean } = {}
) {
  const { triggerOnce = false, ...observerOptions } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || (triggerOnce && triggered)) return;

    const observer = new IntersectionObserver(([entry]) => {
      const intersecting = entry?.isIntersecting ?? false;
      setIsIntersecting(intersecting);
      if (intersecting && triggerOnce) {
        setTriggered(true);
        observer.disconnect();
      }
    }, observerOptions);

    observer.observe(el);
    return () => observer.disconnect();
  });

  return { ref, isIntersecting: triggerOnce ? (isIntersecting || triggered) : isIntersecting };
}

// Применения:
// 1. Lazy loading images
const { ref, isIntersecting } = useIntersectionObserver({ triggerOnce: true });
<img ref={ref} src={isIntersecting ? realSrc : placeholder} />

// 2. Animate on scroll
const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
<div ref={ref} className={isIntersecting ? "animate-in" : "opacity-0"} />

// 3. Infinite scroll sentinel
const { ref, isIntersecting } = useIntersectionObserver();
useEffect(() => {
  if (isIntersecting && hasMore) loadNextPage();
}, [isIntersecting]);
<div ref={ref} /> // пустой sentinel внизу списка
```

---

## usePrevious & useEventListener

```tsx
// usePrevious — предыдущее значение
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; }); // обновляется ПОСЛЕ render
  return ref.current; // возвращает значение ПРОШЛОГО рендера
}

// Применение:
const prevCount = usePrevious(count);
// prevCount → значение count прошлого рендера

// useEventListener — типобезопасный addEventListener
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: EventTarget = window,
) {
  // Сохраняем актуальный handler в ref
  // → не нужно пересоздавать listener при изменении handler
  const savedHandler = useRef(handler);
  useEffect(() => { savedHandler.current = handler; });

  useEffect(() => {
    const listener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);
    element.addEventListener(eventName, listener);
    return () => element.removeEventListener(eventName, listener);
  }, [eventName, element]); // listener пересоздаётся только при смене event/element
}

// Применение:
useEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
useEventListener("click", handleClick, buttonRef.current!);
```

---

## Вопросы на интервью

### 1. Как предотвратить race condition в useFetch?

Два способа: **ignore flag** — `let ignore = false` в начале effect, `if (!ignore) setState(...)` в then, `return () => { ignore = true }` как cleanup. Или **AbortController** — `fetch(url, { signal: controller.signal })`, `return () => controller.abort()`, обработать `AbortError`. В production — TanStack Query / SWR.

### 2. В чём разница debounce и throttle?

**Debounce** — откладывает выполнение до тех пор пока вызовы не прекратятся. Каждый новый вызов сбрасывает таймер. Применение: поиск (ждём пока пользователь остановится), автосохранение.

**Throttle** — гарантирует выполнение **не чаще чем раз в N ms**. Выполняет первый вызов, следующие блокирует до истечения интервала. Применение: scroll, mousemove, rate-limiting API.

### 3. Почему useEventListener использует useRef для handler?

Если передавать `handler` напрямую в deps `useEffect`, то при каждом рендере (если handler — inline функция) listener пересоздаётся. `useRef` позволяет хранить актуальный handler без пересоздания самого listener. Паттерн: сохранить callback в ref, подписаться один раз с оберткой которая вызывает `ref.current`.

### 4. Как сделать useLocalStorage SSR-совместимым?

Проверить `typeof window !== "undefined"` перед обращением к `localStorage`. Lazy initializer в `useState` для этой проверки. Возвращать `initialValue` на сервере. Можно также использовать `useEffect` для синхронизации из localStorage после mount.

---

## Ловушки

```tsx
// ❌ 1. Бесконечный цикл в useFetch — объект в deps
function Component() {
  const config = { headers: { Auth: token } }; // новый объект каждый рендер!
  const { data } = useFetch("/api", config); // если config в deps → цикл
}
// ✅ useMemo или вынести константу

// ❌ 2. Мутация ref в render phase (ненадёжно в StrictMode)
function useBadCounter() {
  const count = useRef(0);
  count.current++; // в render — StrictMode вызовет дважды
  return count.current;
}

// ❌ 3. Нарушение правила хуков в custom hook
function useConditionalData(enabled: boolean) {
  if (!enabled) return null; // ❌ ранний return перед хуками!
  const [data] = useState([]); // порядок хуков нарушен
}
// ✅:
function useConditionalData(enabled: boolean) {
  const [data, setData] = useState<string[]>([]);
  useEffect(() => {
    if (!enabled) return; // условие ВНУТРИ effect, не перед хуком
    fetchData().then(setData);
  }, [enabled]);
  return enabled ? data : null;
}

// ❌ 4. Не стабильный возврат вызывает бесконечные циклы у потребителей
function useTags() {
  const [tags] = useState(["a", "b"]);
  return { tags }; // новый объект каждый рендер!
}
// useEffect(() => {}, [useTags().tags]) → цикл
// ✅ Возвращать напрямую массив или мемоизировать объект
```
