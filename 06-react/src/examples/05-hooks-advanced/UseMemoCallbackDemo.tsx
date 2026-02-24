import { useState, useMemo, useCallback, memo, useRef } from "react";

// ─── Child компонент с memo ───────────────────────
const ExpensiveChild = memo(function ExpensiveChild({
  items,
  onSelect,
}: {
  items: string[];
  onSelect: (item: string) => void;
}) {
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  return (
    <div style={{ background: "#21262d", padding: 10, borderRadius: 6 }}>
      <div style={{ fontSize: 11, color: "var(--amber)", marginBottom: 6 }}>
        Renders: {renderCountRef.current}
      </div>
      {items.map(item => (
        <button key={item} className="btn ghost"
          style={{ fontSize: 12, margin: "2px" }}
          onClick={() => onSelect(item)}>
          {item}
        </button>
      ))}
    </div>
  );
});

export default function UseMemoCallbackDemo() {
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const allItems = ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"];

  // ❌ Без useMemo — новый массив каждый рендер → Child всегда ре-рендерится
  const filteredBad = allItems.filter(item =>
    item.toLowerCase().includes(filter.toLowerCase())
  );

  // ✅ С useMemo — пересчитывается только при изменении filter
  const filteredGood = useMemo(() =>
    allItems.filter(item => item.toLowerCase().includes(filter.toLowerCase())),
  [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ❌ Без useCallback — новая функция каждый рендер → Child всегда ре-рендерится
  const handleSelectBad = (item: string) => setSelected(item);

  // ✅ С useCallback — стабильная функция пока нет изменений в deps
  const handleSelectGood = useCallback((item: string) => {
    setSelected(item);
  }, []); // setSelected стабилен → пустой deps OK

  return (
    <section>
      <h2>useMemo & useCallback</h2>

      <div className="card">
        <h3>Ментальная модель</h3>
        <div className="code-block">{`// useMemo — мемоизация ЗНАЧЕНИЯ
const value = useMemo(() => expensiveCalc(a, b), [a, b]);
// Пересчитывается только когда a или b изменились

// useCallback — мемоизация ФУНКЦИИ
const fn = useCallback(() => doSomething(id), [id]);
// Эквивалентно: useMemo(() => () => doSomething(id), [id])

// Когда НЕ нужна мемоизация:
// ❌ Простые вычисления (сложение, concat) — overhead мемоизации больше
// ❌ Примитивные значения (string, number) — и так стабильны
// ❌ Компоненты без memo() — бессмысленно мемоизировать callback для них

// Когда НУЖНА:
// ✅ Тяжёлые вычисления (sort, filter больших массивов)
// ✅ Стабильность ссылки для React.memo дочерних компонентов
// ✅ Стабильность для deps в useEffect другого хука

// ПРАВИЛО: сначала измерь, потом оптимизируй
// Preemptive мемоизация — антипаттерн`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Живое демо</h3>
        <div style={{ marginBottom: 10, display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn" style={{ fontSize: 12 }} onClick={() => setCount(c => c + 1)}>
            Re-render parent ({count})
          </button>
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Filter items..." style={{ flex: 1 }} />
        </div>
        {selected && (
          <div className="highlight ok" style={{ marginBottom: 10 }}>
            Выбрано: <strong>{selected}</strong>
          </div>
        )}
        <div className="grid2">
          <div>
            <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 4 }}>❌ Без мемоизации</div>
            <ExpensiveChild items={filteredBad} onSelect={handleSelectBad} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--green)", marginBottom: 4 }}>✅ useMemo + useCallback</div>
            <ExpensiveChild items={filteredGood} onSelect={handleSelectGood} />
          </div>
        </div>
        <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 10 }}>
          Нажимай "Re-render parent" — левый Child ре-рендерится (новый массив/функция каждый раз),
          правый — нет (стабильные ссылки).
        </p>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Тяжёлые вычисления</h3>
        <HeavyCalcDemo />
      </div>
    </section>
  );
}

function HeavyCalcDemo() {
  const [size, setSize] = useState(10_000);
  const [multiplier, setMultiplier] = useState(2);
  const [, forceUpdate] = useState(0);
  const withMemo = useRef(true);

  // Симуляция тяжёлого вычисления
  const expensiveCalc = (n: number, m: number): number => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += i * m;
    return sum;
  };

  const t0Bad = performance.now();
  const resultBad = expensiveCalc(size, multiplier);
  const timeBad = (performance.now() - t0Bad).toFixed(2);

  const resultGood = useMemo(() => {
    const t = performance.now();
    const r = expensiveCalc(size, multiplier);
    return { value: r, time: (performance.now() - t).toFixed(2) };
  }, [size, multiplier]);

  void withMemo;
  void resultBad;

  return (
    <div>
      <div className="btn-row">
        <button className="btn ghost" style={{ fontSize: 12 }}
          onClick={() => setSize(s => s === 10_000 ? 1_000_000 : 10_000)}>
          Size: {size.toLocaleString()}
        </button>
        <button className="btn ghost" style={{ fontSize: 12 }}
          onClick={() => setMultiplier(m => m + 1)}>
          Multiplier: {multiplier}
        </button>
        <button className="btn" style={{ fontSize: 12 }}
          onClick={() => forceUpdate(n => n + 1)}>
          Force re-render (без изменений)
        </button>
      </div>
      <div className="grid2" style={{ marginTop: 10 }}>
        <div style={{ background: "#3d0f0f", padding: 10, borderRadius: 6 }}>
          <div style={{ color: "var(--red)", fontSize: 12 }}>❌ Без useMemo</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Каждый рендер: {timeBad}ms</div>
        </div>
        <div style={{ background: "#1a4731", padding: 10, borderRadius: 6 }}>
          <div style={{ color: "var(--green)", fontSize: 12 }}>✅ useMemo (кэш)</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Вычислено за: {resultGood.time}ms</div>
        </div>
      </div>
    </div>
  );
}
