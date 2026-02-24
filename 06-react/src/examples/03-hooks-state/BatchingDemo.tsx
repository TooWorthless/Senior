import { useState, useRef } from "react";
import { flushSync } from "react-dom";

export default function BatchingDemo() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  const log = useRef<string[]>([]);
  const addLog = (msg: string) => {
    log.current = [msg, ...log.current.slice(0, 9)];
  };

  // React 18: автоматическое батчирование в ЛЮБОМ контексте
  const batchedUpdate = () => {
    addLog(`До: renders=${renderCountRef.current}`);
    setA(n => n + 1); // не рендерит сразу
    setB(n => n + 1); // не рендерит сразу
    // → один render с обоими обновлениями
    addLog("Оба setState в одном обработчике → 1 render");
  };

  // flushSync — принудительный синхронный рендер
  const flushSyncDemo = () => {
    addLog(`Начало flushSync: renders=${renderCountRef.current}`);
    flushSync(() => {
      setA(n => n + 1); // немедленный render!
    });
    // DOM уже обновлён здесь
    addLog(`После flushSync: renders=${renderCountRef.current}`);
    setB(n => n + 1); // ещё один render
    addLog("flushSync: 2 отдельных render");
  };

  // setTimeout (React 17 — не батчировало, React 18 — батчирует)
  const asyncUpdate = () => {
    setTimeout(() => {
      addLog(`Async (setTimeout): renders=${renderCountRef.current}`);
      setA(n => n + 1);
      setB(n => n + 1);
      addLog("React 18: батчирует даже в setTimeout → 1 render");
    }, 0);
  };

  return (
    <section>
      <h2>Batching — автоматическая группировка setState</h2>

      <div className="card">
        <h3>React 18: автоматическое батчирование</h3>
        <div className="code-block">{`// React 17: батчировал только в React event handlers
// React 18: батчирует ВСЕГДА (setTimeout, Promise, native events)

// Одна функция — один рендер:
function handleClick() {
  setCount(c => c + 1);  ─┐
  setLoading(false);      ├── React 18: 1 render
  setError(null);         ─┘
}

// Тот же эффект в setTimeout (React 18):
setTimeout(() => {
  setCount(c => c + 1);  ─┐
  setLoading(false);      ├── React 18: 1 render (React 17: 3 renders!)
  setError(null);         ─┘
}, 0);

// flushSync — отключить батчирование:
import { flushSync } from "react-dom";
flushSync(() => setCount(1)); // немедленный render
flushSync(() => setLoading(false)); // ещё один render
// Нужно крайне редко: при чтении DOM сразу после setState`}</div>
      </div>

      <div className="card">
        <h3>Живое демо</h3>
        <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
          {[
            { label: "A", value: a, color: "var(--blue)" },
            { label: "B", value: b, color: "var(--green)" },
            { label: "Renders", value: renderCountRef.current, color: "var(--amber)" },
          ].map(item => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{item.label}</div>
              <div style={{ fontSize: 32, fontWeight: "bold", color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div className="btn-row">
          <button className="btn" style={{ fontSize: 12 }} onClick={batchedUpdate}>
            Batched (+A+B)
          </button>
          <button className="btn ghost" style={{ fontSize: 12 }} onClick={asyncUpdate}>
            Async (setTimeout)
          </button>
          <button className="btn red" style={{ fontSize: 12 }} onClick={flushSyncDemo}>
            flushSync
          </button>
          <button className="btn ghost" style={{ fontSize: 12 }}
            onClick={() => { setA(0); setB(0); log.current = []; }}>
            Reset
          </button>
        </div>
        <LogBox entries={log.current} />
      </div>
    </section>
  );
}

function LogBox({ entries }: { entries: string[] }) {
  return (
    <div className="log-box" style={{ marginTop: 10 }}>
      {entries.length === 0
        ? <div className="log-entry" style={{ color: "var(--text-dim)" }}>Нажми кнопки...</div>
        : entries.map((e, i) => (
          <div key={i} className={`log-entry ${
            e.includes("✅") || e.includes("Batched") || e.includes("батчирует") ? "ok" :
            e.includes("flushSync") ? "warn" : "info"
          }`}>{e}</div>
        ))
      }
    </div>
  );
}
