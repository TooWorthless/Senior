# 11 · Suspense & Errors

[← Назад](../../../README.md)

---

## Содержание

- [Suspense](#suspense)
- [lazy() — Code Splitting](#lazy--code-splitting)
- [ErrorBoundary + Suspense](#errorboundary--suspense)
- [useTransition](#usetransition)
- [useDeferredValue](#usedeferredvalue)
- [React 19: use()](#react-19-use)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## Suspense

`<Suspense>` показывает `fallback` пока дочерние компоненты "ожидают" загрузки.

**Как это работает:**

```
Компонент "приостанавливается" (suspends) бросая Promise в render.
React перехватывает Promise, показывает fallback.
Когда Promise resolve → React повторяет рендер компонента.
```

```tsx
<Suspense fallback={<Loading />}>
  <LazyComponent />   {/* Suspends пока chunk не загружен */}
  <DataComponent />   {/* Suspends пока данные не загружены */}
</Suspense>
```

### Вложенные Suspense — гранулярный контроль

```tsx
// Каждый Suspense — независимая "граница ожидания"
function Dashboard() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {/* Если Header быстрый, а Chart медленный — Header не ждёт Chart */}
      <Header />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />  {/* Свой fallback, не блокирует другие */}
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <OrdersTable />   {/* Независимо */}
        </Suspense>
      </div>
    </Suspense>
  );
}
// Преимущество: RevenueChart и OrdersTable загружаются параллельно
// Пользователь видит каждый блок как только он готов (не ждёт самый медленный)
```

---

## lazy() — Code Splitting

`lazy()` — динамический import с поддержкой Suspense.

```tsx
// Без code splitting — всё в одном bundle:
import Dashboard from "./Dashboard";  // загружается при старте

// С lazy — отдельный chunk, загружается при первом рендере:
const Dashboard = lazy(() => import("./Dashboard"));
// Vite/webpack создаёт dashboard.chunk.js

// С Suspense:
function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Dashboard chunk загрузится только при переходе */}
        </Routes>
      </Suspense>
    </Router>
  );
}
```

### Preloading

```tsx
// Предзагрузка chunk при hover — пользователь ещё не кликнул
const Dashboard = lazy(() => import("./Dashboard"));

// Начать загрузку chunk:
const preloadDashboard = () => import("./Dashboard");

function NavLink() {
  return (
    <Link
      to="/dashboard"
      onMouseEnter={preloadDashboard} // предзагрузка при hover
    >
      Dashboard
    </Link>
  );
}
```

### Named exports с lazy

```tsx
// lazy() требует default export
// Для named exports — wrapper:
const { Chart } = lazy(async () => ({
  default: (await import("./Charts")).Chart
}));

// Или через re-export:
// Chart.lazy.ts
export { Chart as default } from "./Charts";
const Chart = lazy(() => import("./Chart.lazy"));
```

---

## ErrorBoundary + Suspense

Правильная комбинация для production:

```tsx
// ❌ Только Suspense — если fetch упадёт, приложение упадёт целиком
<Suspense fallback={<Loading />}>
  <DataComponent />
</Suspense>

// ✅ ErrorBoundary + Suspense — изоляция ошибок
<ErrorBoundary fallback={<ErrorUI />}>
  <Suspense fallback={<Loading />}>
    <DataComponent />
  </Suspense>
</ErrorBoundary>

// Порядок: ErrorBoundary СНАРУЖИ Suspense
// Иначе: ошибка в Suspense не будет поймана

// Паттерн для каждого роута:
function SafeRoute({ component: Component }: { component: ComponentType }) {
  return (
    <ErrorBoundary
      fallback={<RouteError />}
      onError={(error) => Sentry.captureException(error)}
    >
      <Suspense fallback={<RouteSkeleton />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## useTransition

Помечает обновление как **несрочное** — React может прервать его при появлении более срочного.

```tsx
const [isPending, startTransition] = useTransition();

function handleChange(value: string) {
  // СРОЧНОЕ — обновляется немедленно (пользователь видит typing)
  setInputValue(value);

  // НЕСРОЧНОЕ — может подождать
  startTransition(() => {
    setFilterResults(heavyFilter(data, value));
    setCurrentPage(1);
    // Все setState внутри startTransition — несрочные
  });
}

// isPending = true пока transition в процессе
{isPending && <LoadingIndicator />}
<Results style={{ opacity: isPending ? 0.6 : 1 }} />
```

### Как работает под капотом

```
Срочные обновления: Синхронные lanes (высокий приоритет)
Transition обновления: Concurrent lanes (низкий приоритет)

React может:
1. Начать transition render
2. Прервать если придёт срочное обновление (новый keystroke)
3. Отбросить прерванный render
4. Начать новый transition с актуальным значением
```

### Когда использовать

```tsx
// ✅ Тяжёлая фильтрация/сортировка:
startTransition(() => setFilter(value));

// ✅ Навигация (следующая страница грузится не мгновенно):
startTransition(() => navigate("/dashboard"));

// ✅ Тяжёлый re-render при изменении tab:
startTransition(() => setActiveTab(tab));

// ❌ Не для непосредственного user input:
// input.onChange должен быть срочным (пользователь видит typing мгновенно)
// ❌ startTransition(() => setInputValue(e.target.value));
```

---

## useDeferredValue

"Отложенная" версия значения — React обновляет её **после более срочных обновлений**.

```tsx
function SearchPage() {
  const [query, setQuery] = useState("");

  // deferredQuery "отстаёт" от query при высокой нагрузке
  const deferredQuery = useDeferredValue(query);

  // Индикатор stale состояния:
  const isStale = deferredQuery !== query;

  return (
    <>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)} // срочное
      />
      <div style={{ opacity: isStale ? 0.7 : 1, transition: "opacity 0.2s" }}>
        {/* Рендерит с deferred значением — не блокирует ввод */}
        <HeavySearchResults query={deferredQuery} />
      </div>
    </>
  );
}
```

### useTransition vs useDeferredValue

| | `useTransition` | `useDeferredValue` |
|--|-----------------|-------------------|
| Когда использовать | Есть доступ к setState | Значение приходит извне (props) |
| Контроль | Оборачиваешь setState | Оборачиваешь значение |
| isPending | ✅ | ❌ (проверяй `deferred !== value`) |

```tsx
// useTransition — когда ты вызываешь setState:
startTransition(() => setFilter(value));

// useDeferredValue — когда значение приходит как prop:
function Results({ filter }: { filter: string }) {
  const deferredFilter = useDeferredValue(filter);
  // Нет доступа к setFilter → не можешь обернуть в startTransition
}
```

---

## React 19: use()

`use()` — universal hook для await Promise и Context в render.

```tsx
import { use } from "react";

// Await Promise в render (suspend пока не resolve):
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // suspend если pending
  return <div>{user.name}</div>;
}

// Использование:
async function Page({ params }: { params: { id: string } }) {
  const userPromise = fetchUser(params.id); // начинаем fetch СРАЗУ
  return (
    <Suspense fallback={<UserSkeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
// Преимущество: fetch начинается на уровне Page, не внутри UserProfile
// → нет waterfall!

// use() для Context (альтернатива useContext):
const theme = use(ThemeContext);
// Разница: use() можно вызывать условно и в циклах!
if (condition) {
  const value = use(SomeContext); // ✅ — в отличие от useContext
}
```

---

## Вопросы на интервью

### 1. Как Suspense знает когда показывать fallback?

Компонент бросает **Promise** во время render (это внутренний механизм React). Suspense перехватывает этот "throw", показывает fallback, подписывается на Promise. Когда Promise resolve → React заново рендерит поддерево. `lazy()` автоматически реализует этот механизм. `use(promise)` в React 19 делает то же явно.

### 2. В чём разница useTransition и useDeferredValue?

`useTransition` — контролируешь какой setState несрочный, получаешь `isPending`. Использовать когда есть доступ к сеттеру. `useDeferredValue` — создаёт отложенную копию значения из props, без `isPending` (проверяй `deferred !== value`). Использовать когда получаешь значение извне.

### 3. Что происходит при ошибке fetch внутри Suspense?

Если Promise reject — React бросит ошибку наверх. Если есть `<ErrorBoundary>` выше `<Suspense>` — она поймает. Без ErrorBoundary — ошибка пойдёт дальше и может уронить приложение. **Всегда** оборачивай Suspense в ErrorBoundary.

### 4. Как организовать вложенные Suspense?

Каждый `<Suspense>` — независимая граница. Вложенные позволяют разным частям страницы загружаться независимо. Принцип: чем ближе Suspense к "медленному" компоненту — тем меньше UI блокируется. Показывай только часть skeleton, не всю страницу.

---

## Ловушки

```tsx
// ❌ 1. ErrorBoundary ВНУТРИ Suspense — ошибка не поймается
<Suspense fallback={<Loading />}>
  <ErrorBoundary fallback={<Error />}> {/* ❌ не поймает Suspense ошибки */}
    <Component />
  </ErrorBoundary>
</Suspense>

// ✅ ErrorBoundary СНАРУЖИ:
<ErrorBoundary fallback={<Error />}>
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
</ErrorBoundary>

// ❌ 2. lazy() без Suspense → ошибка
const Comp = lazy(() => import("./Comp"));
<Comp /> // ❌ нет Suspense выше → React throws

// ❌ 3. startTransition для срочного ввода
onChange={e => startTransition(() => setInput(e.target.value))}
// Input будет "лагать" — ввод несрочный → React откладывает → плохой UX

// ❌ 4. useDeferredValue без visual feedback
const deferred = useDeferredValue(query);
return <HeavyResults query={deferred} />;
// Пользователь не видит что список "не обновлён" → путаница
// ✅ Добавляй opacity индикатор stale:
const isStale = deferred !== query;
<div style={{ opacity: isStale ? 0.6 : 1 }}>
  <HeavyResults query={deferred} />
</div>

// ❌ 5. Suspense на сервере (Next.js pages router) без оборачивания
// Streaming Suspense работает только в App Router (RSC)
// В Pages Router нужно другое решение
```
