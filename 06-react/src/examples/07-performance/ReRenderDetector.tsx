import { useState, memo, useCallback, useRef, createContext, useContext } from "react";

// ─── Хук-детектор ре-рендеров ─────────────────────
function useRenderHighlight(label: string) {
  const renderCount = useRef(0);
  renderCount.current++;
  const highlightRef = useRef<HTMLDivElement>(null);

  // Flash эффект
  if (highlightRef.current) {
    highlightRef.current.animate(
      [{ background: "rgba(245,158,11,0.4)" }, { background: "transparent" }],
      { duration: 300 }
    );
  }

  return { renderCount: renderCount.current, highlightRef, label };
}

// ─── Примеры компонентов ──────────────────────────
const CounterContext = createContext<{ count: number; name: string }>({ count: 0, name: "" });

function ComponentA() {
  const { renderCount, highlightRef } = useRenderHighlight("A");
  const { count } = useContext(CounterContext);
  return (
    <div ref={highlightRef} style={{ padding: "6px 10px", background: "var(--surface)", borderRadius: 4, marginBottom: 4, fontSize: 12, border: "1px solid var(--border)" }}>
      <strong style={{ color: "var(--blue)" }}>A</strong> count={count} | renders: <strong style={{ color: "var(--amber)" }}>{renderCount}</strong>
    </div>
  );
}

const ComponentB = memo(function ComponentB() {
  const { renderCount, highlightRef } = useRenderHighlight("B (memo)");
  const { count } = useContext(CounterContext);
  return (
    <div ref={highlightRef} style={{ padding: "6px 10px", background: "var(--surface)", borderRadius: 4, marginBottom: 4, fontSize: 12, border: "1px solid var(--green)", opacity: 0.8 }}>
      <strong style={{ color: "var(--green)" }}>B (memo)</strong> count={count} | renders: <strong style={{ color: "var(--amber)" }}>{renderCount}</strong>
      <span style={{ color: "var(--text-dim)", fontSize: 10, marginLeft: 6 }}>
        memo не помогает при Context!
      </span>
    </div>
  );
});

function ComponentC({ value }: { value: number }) {
  const { renderCount, highlightRef } = useRenderHighlight("C (no context)");
  return (
    <div ref={highlightRef} style={{ padding: "6px 10px", background: "var(--surface)", borderRadius: 4, marginBottom: 4, fontSize: 12, border: "1px solid var(--border)" }}>
      <strong style={{ color: "var(--purple)" }}>C</strong> value={value} | renders: <strong style={{ color: "var(--amber)" }}>{renderCount}</strong>
    </div>
  );
}

const ComponentD = memo(function ComponentD({ value }: { value: number }) {
  const { renderCount, highlightRef } = useRenderHighlight("D (memo + stable prop)");
  return (
    <div ref={highlightRef} style={{ padding: "6px 10px", background: "#1a4731", borderRadius: 4, marginBottom: 4, fontSize: 12, border: "1px solid var(--green)" }}>
      <strong style={{ color: "var(--green)" }}>D (memo)</strong> value={value} | renders: <strong style={{ color: "var(--amber)" }}>{renderCount}</strong>
    </div>
  );
});

export default function ReRenderDetector() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("Alice");
  const [unrelated, setUnrelated] = useState(0);

  const stableValue = 42; // константа — не меняется

  return (
    <section>
      <h2>Re-render детектор — кто и когда рендерится</h2>

      <div className="card">
        <h3>Причины re-render</h3>
        <div className="code-block">{`// Компонент ре-рендерится когда:
// 1. Его собственный state изменился (setState)
// 2. Его props изменились (или родитель ре-рендерится)
// 3. Context, которым он подписан, изменился
// 4. forceUpdate() (устаревший API)

// React.memo предотвращает 2 (изменение props)
// НО НЕ предотвращает 3 (изменение Context)!
// Поэтому split context — критично для производительности`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Живой детектор (желтая вспышка = ре-рендер)</h3>
        <CounterContext.Provider value={{ count, name }}>
          <div className="btn-row" style={{ marginBottom: 12 }}>
            <button className="btn" style={{ fontSize: 12 }}
              onClick={() => setCount(c => c + 1)}>count++ ({count})</button>
            <button className="btn ghost" style={{ fontSize: 12 }}
              onClick={() => setName(n => n === "Alice" ? "Bob" : "Alice")}>name: {name}</button>
            <button className="btn ghost" style={{ fontSize: 12 }}
              onClick={() => setUnrelated(n => n + 1)}>unrelated ({unrelated})</button>
          </div>

          <ComponentA />
          <ComponentB />
          <ComponentC value={stableValue} />
          <ComponentD value={stableValue} />

          <div style={{ background: "#21262d", padding: 10, borderRadius: 6, marginTop: 8, fontSize: 11, color: "var(--text-dim)" }}>
            <strong>Наблюдения:</strong><br />
            • A — рендерится при любом изменении count/name (Context)<br />
            • B — memo НЕ помогает против Context изменений<br />
            • C — рендерится когда родитель ре-рендерится (нет memo)<br />
            • D — memo + стабильный проп = не рендерится при нажатии "unrelated"<br />
            • При нажатии "count++" или "name" — A и B всегда рендерятся (Context изменился)
          </div>
        </CounterContext.Provider>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Split Context — решение проблемы лишних рендеров</h3>
        <div className="code-block">{`// ❌ Один большой Context → все подписчики рендерятся при любом изменении
const AppContext = createContext({ count: 0, name: "", theme: "dark" });

// ✅ Split Context → рендерится только тот, чьи данные изменились
const CountContext  = createContext({ count: 0 });
const ThemeContext  = createContext({ theme: "dark" });
const UserContext   = createContext({ name: "" });

// Компонент подписан только на нужный контекст
function CountDisplay() {
  const { count } = useContext(CountContext); // только count
  // НЕ ре-рендерится при изменении theme или name
}

// Или мемоизировать провайдер value:
function CountProvider({ children }) {
  const [count, setCount] = useState(0);
  const value = useMemo(() => ({ count, setCount }), [count]);
  return <CountContext.Provider value={value}>{children}</CountContext.Provider>;
}`}</div>
      </div>
    </section>
  );
}
