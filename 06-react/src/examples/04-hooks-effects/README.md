# 04 · useEffect

[← Назад](../../../README.md)

---

## Содержание

- [Ментальная модель](#ментальная-модель)
- [Три формы deps](#три-формы-deps)
- [Порядок выполнения](#порядок-выполнения)
- [Cleanup](#cleanup)
- [Race Condition](#race-condition)
- [Stale Closure](#stale-closure)
- [Бесконечный цикл](#бесконечный-цикл)
- [Когда НЕ нужен useEffect](#когда-не-нужен-useeffect)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## Ментальная модель

> `useEffect` — это **синхронизация компонента с внешней системой**.

Не думай о нём как о "lifecycle hook". Думай: "Мне нужно, чтобы X (внешняя система) синхронизировалась с Y (state/props)".

```
Внешние системы:
- DOM (document.title, focus, scroll)
- Browser APIs (localStorage, geolocation)
- Network (fetch, WebSocket)
- Subscriptions (EventEmitter, Redux store)
- Timers (setInterval, setTimeout)
- Third-party libraries (D3, maps, animation libs)
```

---

## Три формы deps

```tsx
// 1. Нет deps → запускается ПОСЛЕ КАЖДОГО рендера
useEffect(() => {
  document.title = `${count} уведомлений`;
});
// ⚠️ Осторожно: если внутри setState → бесконечный цикл

// 2. Пустой массив → только при mount
useEffect(() => {
  const subscription = store.subscribe(handler);
  return () => subscription.unsubscribe();
}, []);

// 3. Массив зависимостей → mount + при изменении deps
useEffect(() => {
  fetchUser(userId);
}, [userId]); // перезапускается при изменении userId
```

### Правило exhaustive-deps

**Все reactive values должны быть в deps.**

Reactive value = props, state, context value, переменные и функции объявленные внутри компонента.

```tsx
function Component({ userId, onLoad }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(data => {
      setData(data);
      onLoad(data); // onLoad — reactive, должен быть в deps!
    });
  }, [userId, onLoad]); // ✅ все reactive values в deps
}

// Не reactive (можно не добавлять в deps):
// - setData, dispatch (стабильны, React гарантирует)
// - ref.current (мутация не вызывает re-render)
// - константы вне компонента
```

---

## Порядок выполнения

```
1. React вызывает render function (JSX)
2. React обновляет DOM (Commit: BeforeMutation → Mutation → Layout)
3. Браузер рисует (paint)
4. React запускает useEffect CLEANUP предыдущего рендера
5. React запускает useEffect CALLBACK текущего рендера

При unmount:
1. React удаляет компонент из DOM
2. Запускает все useEffect cleanup в обратном порядке
```

**StrictMode (development):**
```
mount → cleanup → mount
```
Это специально — проверяет корректность cleanup. Если что-то сломалось после двойного mount — cleanup написан неправильно.

---

## Cleanup

Функция возвращаемая из `useEffect` — cleanup. Вызывается:
- Перед следующим запуском эффекта (при изменении deps)
- При unmount

```tsx
// Паттерны cleanup:

// 1. Event listener
useEffect(() => {
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}, []);

// 2. Interval
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);

// 3. WebSocket
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  return () => {
    ws.close();
    ws.onmessage = null;
  };
}, [url]);

// 4. IntersectionObserver
useEffect(() => {
  if (!ref.current) return;
  const observer = new IntersectionObserver(callback, options);
  observer.observe(ref.current);
  return () => observer.disconnect();
}, []);

// 5. AbortController для fetch
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal }).then(...);
  return () => controller.abort();
}, [url]);
```

---

## Race Condition

**Проблема:** при быстрой смене deps (например, userId) ответы приходят не по порядку.

```tsx
// ❌ Race condition:
useEffect(() => {
  fetch(`/api/user/${userId}`)
    .then(r => r.json())
    .then(setUser); // нет защиты!
}, [userId]);

// userId: 1 → fetch (200ms)
// userId: 2 → fetch (50ms)
// Ответ userId=2 приходит: setUser(user2) ✅
// Ответ userId=1 приходит: setUser(user1) ← БАГИ! Показывает user1 при userId=2
```

**Решение 1: ignore flag (самое простое)**
```tsx
useEffect(() => {
  let ignore = false;

  fetch(`/api/user/${userId}`)
    .then(r => r.json())
    .then(data => {
      if (!ignore) setUser(data);
    });

  return () => { ignore = true; }; // cleanup устаревшего запроса
}, [userId]);
```

**Решение 2: AbortController**
```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/user/${userId}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(err => {
      if (err.name !== "AbortError") setError(err);
    });

  return () => controller.abort();
}, [userId]);
```

**Решение 3: React Query / SWR / TanStack Query** — решают всё это автоматически.

---

## Stale Closure

**Проблема:** эффект захватывает переменные из closure момента создания, а не текущего рендера.

```tsx
// ❌ Stale closure в interval:
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1); // count захвачен при создании (= 0)
    // всегда будет 0 + 1 = 1, независимо от реального count
  }, 1000);
  return () => clearInterval(id);
}, []); // пустой deps = создаётся один раз = count = 0 навсегда
```

**Решения:**

```tsx
// ✅ 1. Functional update — не читаем count из closure
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1); // c = всегда актуальное
  }, 1000);
  return () => clearInterval(id);
}, []);

// ✅ 2. Добавить в deps (interval будет пересоздаваться)
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearInterval(id);
}, [count]); // перезапуск при изменении count

// ✅ 3. useRef для "живой" переменной
const countRef = useRef(count);
useEffect(() => { countRef.current = count; }); // синхронизировать

useEffect(() => {
  const id = setInterval(() => {
    setCount(countRef.current + 1); // всегда актуальный через ref
  }, 1000);
  return () => clearInterval(id);
}, []);
```

---

## Бесконечный цикл

```tsx
// ❌ 1. Объект/массив в deps — новая ссылка каждый рендер
function Bad() {
  const [data, setData] = useState(null);
  const options = { method: "GET" }; // новый объект каждый рендер

  useEffect(() => {
    fetch("/api", options).then(r => r.json()).then(setData);
  }, [options]); // options всегда "новый" → бесконечно
}

// ✅ Вынести константы за компонент:
const OPTIONS = { method: "GET" }; // один раз

// ✅ Или useMemo:
const options = useMemo(() => ({ method: "GET", headers: authHeader }), [authHeader]);

// ❌ 2. setState без условия внутри эффекта с этим state в deps
useEffect(() => {
  setCount(count + 1); // изменяет count → эффект запускается → count меняется → ...
}, [count]);

// ✅ Functional update если нужно обновить на основе предыдущего:
useEffect(() => {
  setCount(c => c + 1);
}, [trigger]); // зависим от trigger, не от count
```

---

## Когда НЕ нужен useEffect

```tsx
// ❌ Производные данные — вычисляй в render:
const [items, setItems] = useState([...]);
const [filtered, setFiltered] = useState([]);
useEffect(() => {
  setFiltered(items.filter(i => i.active)); // лишний рендер!
}, [items]);

// ✅ Просто вычисли:
const filtered = items.filter(i => i.active); // нет effect, нет лишнего рендера

// ❌ Обработка событий — обрабатывай в handler:
useEffect(() => {
  if (formSubmitted) {
    submitForm(data);
    setFormSubmitted(false);
  }
}, [formSubmitted]);

// ✅ Прямо в обработчике:
const handleSubmit = () => {
  submitForm(data); // без useEffect
};

// ❌ Уведомления/toast при изменении state:
useEffect(() => {
  if (error) showToast(error.message);
}, [error]);

// ✅ В event handler где изменяется state:
const handleSubmit = async () => {
  try {
    await submit();
  } catch (err) {
    setError(err);
    showToast(err.message); // прямо здесь
  }
};
```

---

## Вопросы на интервью

### 1. Чем отличается useEffect без deps, с [], и с [value]?

- Без deps → после каждого рендера
- `[]` → только при mount (один раз)
- `[value]` → при mount + при каждом изменении `value`

Cleanup аналогично: без deps — перед каждым следующим запуском; `[]` — при unmount; `[value]` — перед следующим запуском + при unmount.

### 2. Как предотвратить race condition при fetch?

Два подхода: **ignore flag** — переменная `let ignore = false`, в cleanup `ignore = true`, в then проверить `if (!ignore)`. Или **AbortController** — в cleanup вызвать `controller.abort()`, обработать `AbortError` отдельно. В production — использовать React Query / TanStack Query, они решают это автоматически.

### 3. Почему объект в deps вызывает бесконечный цикл?

React сравнивает deps через `Object.is`. Объект `{}` создаётся заново каждый рендер → новая ссылка → `{} !== {}` → React думает deps изменились → запускает effect → effect вызывает setState → рендер → новый объект → ... Решение: вынести за компонент или `useMemo`.

### 4. Что такое stale closure?

Функция в useEffect "закрывается" над переменными на момент **создания эффекта**. При `deps: []` — переменные зафиксированы на момент mount. Решения: functional update (`setState(prev => ...)`) чтобы не читать из closure, useRef для "живого" значения, или добавить переменную в deps.

### 5. Когда НЕ нужно использовать useEffect?

Для **производных данных** (вычисляй в render), для **обработки событий** (делай в handler), для **синхронизации родитель→потомок через state** (можно через props). useEffect нужен только для синхронизации с **внешними системами** (DOM, network, timers, subscriptions).

---

## Ловушки

```tsx
// ❌ 1. setState внутри effect без deps → бесконечный цикл
useEffect(() => {
  setCount(c => c + 1); // бесконечно если нет deps!
}); // нет deps = каждый рендер

// ❌ 2. Async функция напрямую в useEffect
useEffect(async () => {        // ❌ возвращает Promise, не cleanup функцию!
  const data = await fetch();
}, []);

// ✅ Оборачивай в async IIFE:
useEffect(() => {
  (async () => {
    const data = await fetch();
    setData(data);
  })();
}, []);

// ✅ Или выносить async функцию:
useEffect(() => {
  const load = async () => {
    const data = await fetch();
    setData(data);
  };
  void load();
}, []);

// ❌ 3. Отсутствие cleanup → утечка памяти
useEffect(() => {
  const sub = eventEmitter.on("data", handler);
  // забыл return () => sub.off()
}, []);

// ❌ 4. Объект в deps создаваемый при render
function Component({ config }) {
  // config = { url: "...", headers: {...} } — новый объект каждый раз
  useEffect(() => { ... }, [config]); // бесконечный цикл!
}
// ✅ Примитивные deps или useMemo:
useEffect(() => { ... }, [config.url]); // только примитив
```
