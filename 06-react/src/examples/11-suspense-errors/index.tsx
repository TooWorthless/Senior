import { useState, Suspense, lazy, useTransition, useDeferredValue, Component, type ErrorInfo, type ReactNode } from "react";

// ─── ErrorBoundary ────────────────────────────────
class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { error: Error | null }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info); }
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

// ─── Lazy компонент ───────────────────────────────
const HeavyChart = lazy(() =>
  new Promise<{ default: () => JSX.Element }>(resolve =>
    setTimeout(() => resolve({
      default: function HeavyChart() {
        return (
          <div style={{ background: "#1e3a5f", padding: 20, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
            <div style={{ color: "var(--blue)" }}>HeavyChart — загружен lazy!</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
              Симуляция chunk загрузки (800ms)
            </div>
          </div>
        );
      }
    }), 800)
  )
);

// ─── useTransition demo ───────────────────────────
const ITEMS = Array.from({ length: 5000 }, (_, i) => ({ id: i, text: `Item ${i + 1}` }));

function FilteredItems({ filter }: { filter: string }) {
  const filtered = ITEMS.filter(item =>
    item.text.toLowerCase().includes(filter.toLowerCase())
  );
  return (
    <div style={{ maxHeight: 200, overflowY: "auto", fontSize: 12 }}>
      {filtered.slice(0, 100).map(item => (
        <div key={item.id} style={{ padding: "2px 4px", borderBottom: "1px solid #21262d" }}>
          {item.text}
        </div>
      ))}
      {filtered.length > 100 && (
        <div style={{ color: "var(--text-dim)", padding: 4 }}>
          ...и ещё {filtered.length - 100} элементов
        </div>
      )}
    </div>
  );
}

export default function SuspenseErrors() {
  const [tab, setTab] = useState<"suspense" | "transition" | "deferred">("suspense");
  const [showChart, setShowChart] = useState(false);

  const [inputBad, setInputBad] = useState("");
  const [inputGood, setInputGood] = useState("");
  const [filterGood, setFilterGood] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredFilter = useDeferredValue(inputBad);

  return (
    <div className="example-page">
      <h1>11 · Suspense & Errors</h1>
      <p className="subtitle">Suspense, ErrorBoundary, lazy, useTransition, useDeferredValue</p>

      <div className="btn-row">
        {(["suspense", "transition", "deferred"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "suspense" && (
        <section style={{ marginTop: 16 }}>
          <h2>Suspense & lazy()</h2>

          <div className="card">
            <h3>Как работает Suspense</h3>
            <div className="code-block">{`// Suspense перехватывает Promise из потомка
// Показывает fallback пока Promise не resolve

// 1. lazy() — code splitting по умолчанию
const HeavyChart = lazy(() => import("./HeavyChart"));
// → Vite/Webpack создаёт отдельный chunk
// → Загружается только при первом рендере

// 2. Вложенные Suspense — гранулярный контроль
<Suspense fallback={<PageSkeleton />}>
  <ErrorBoundary fallback={<ErrorPage />}>
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart />    {/* Свой fallback */}
    </Suspense>
    <Table />           {/* Не блокирует Chart */}
  </ErrorBoundary>
</Suspense>

// 3. Suspense + fetch (React 19 use()):
function UserProfile({ id }) {
  const user = use(fetchUser(id)); // suspend while loading
  return <div>{user.name}</div>;
}

// 4. На уровне роута (React Router / Next.js)
<Route path="/dashboard" element={
  <Suspense fallback={<DashboardSkeleton />}>
    <Dashboard />
  </Suspense>
} />`}</div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <h3>Lazy loading + Suspense</h3>
            <button className="btn" style={{ marginBottom: 10 }}
              onClick={() => setShowChart(v => !v)}>
              {showChart ? "Скрыть" : "Загрузить HeavyChart"}
            </button>
            {showChart && (
              <ErrorBoundary fallback={
                <div style={{ color: "var(--red)", padding: 12 }}>
                  ❌ Не удалось загрузить компонент
                </div>
              }>
                <Suspense fallback={
                  <div style={{ padding: 20, textAlign: "center", color: "var(--amber)" }}>
                    ⏳ Загружаем chart chunk...
                  </div>
                }>
                  <HeavyChart />
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
        </section>
      )}

      {tab === "transition" && (
        <section style={{ marginTop: 16 }}>
          <h2>useTransition — приоритизация обновлений</h2>
          <div className="card">
            <h3>Срочные vs несрочные обновления</h3>
            <div className="code-block">{`// useTransition: пометить обновление как "несрочное"
// React может прервать его если появится срочное (typing)
const [isPending, startTransition] = useTransition();

const handleInput = (value) => {
  setInputValue(value);  // СРОЧНОЕ — обновить input немедленно
  startTransition(() => {
    setFilteredList(filterItems(value)); // НЕСРОЧНОЕ — можно подождать
  });
};

// Пока transition pending → isPending = true → показать индикатор
{isPending && <Spinner />}`}</div>
          </div>
          <div className="grid2" style={{ marginTop: 12 }}>
            <div className="card">
              <h3>❌ Без transition (блокирует ввод)</h3>
              <input value={inputBad} onChange={e => setInputBad(e.target.value)}
                placeholder="Пиши — input может тормозить..." style={{ width: "100%", marginBottom: 8 }} />
              <FilteredItems filter={inputBad} />
            </div>
            <div className="card">
              <h3>✅ С useTransition</h3>
              <input value={inputGood}
                onChange={e => {
                  setInputGood(e.target.value);
                  startTransition(() => setFilterGood(e.target.value));
                }}
                placeholder="Пиши — input отзывчивый..." style={{ width: "100%", marginBottom: 8 }} />
              {isPending && <div style={{ fontSize: 11, color: "var(--amber)", marginBottom: 4 }}>⏳ фильтрация...</div>}
              <FilteredItems filter={filterGood} />
            </div>
          </div>
        </section>
      )}

      {tab === "deferred" && (
        <section style={{ marginTop: 16 }}>
          <h2>useDeferredValue</h2>
          <div className="card">
            <h3>useDeferredValue vs useTransition</h3>
            <div className="code-block">{`// useTransition: у тебя есть доступ к setter
startTransition(() => setFilter(value));

// useDeferredValue: value приходит извне (props), сеттера нет
const DeferredList = ({ filter }) => {
  const deferredFilter = useDeferredValue(filter);
  // deferredFilter отстаёт когда React занят обновлением UI
  return <FilteredItems filter={deferredFilter} />;
};

// Визуализация с помощью opacity:
const isStale = deferredFilter !== filter;
<div style={{ opacity: isStale ? 0.7 : 1, transition: "opacity 0.2s" }}>
  <FilteredItems filter={deferredFilter} />
</div>`}</div>
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <h3>Демо</h3>
            <input value={inputBad} onChange={e => setInputBad(e.target.value)}
              placeholder="Пиши — deferred отстаёт при нагрузке..." style={{ width: "100%", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-dim)", marginBottom: 8 }}>
              <span>Input: <strong style={{ color: "var(--text)" }}>"{inputBad}"</strong></span>
              <span>Deferred: <strong style={{ color: deferredFilter !== inputBad ? "var(--amber)" : "var(--green)" }}>
                "{deferredFilter}" {deferredFilter !== inputBad ? "⏳" : "✅"}
              </strong></span>
            </div>
            <div style={{ opacity: deferredFilter !== inputBad ? 0.7 : 1, transition: "opacity 0.2s" }}>
              <FilteredItems filter={deferredFilter} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
