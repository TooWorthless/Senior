import { useState } from "react";
import LifecycleDemo from "./LifecycleDemo";
import ErrorBoundaryDemo from "./ErrorBoundaryDemo";

export default function ClassComponents() {
  const [tab, setTab] = useState<"lifecycle" | "errors" | "migration">("lifecycle");

  return (
    <div className="example-page">
      <h1>02 · Class Components</h1>
      <p className="subtitle">Lifecycle, getDerivedState, shouldComponentUpdate, ErrorBoundary</p>

      <div className="highlight warn">
        Class компоненты — <strong>legacy</strong>. Единственное что нельзя сделать хуками —
        это <code>getSnapshotBeforeUpdate</code> и <code>componentDidCatch</code>.
        ErrorBoundary до сих пор только class компонент.
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        {(["lifecycle", "errors", "migration"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "lifecycle"  && <LifecycleDemo />}
      {tab === "errors"     && <ErrorBoundaryDemo />}
      {tab === "migration"  && <MigrationGuide />}
    </div>
  );
}

function MigrationGuide() {
  return (
    <section style={{ marginTop: 16 }}>
      <h2>Class → Hooks: шпаргалка</h2>

      <div className="card">
        <h3>Таблица соответствий</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#21262d" }}>
              <th style={{ padding: "6px 10px", border: "1px solid var(--border)", textAlign: "left" }}>Class Component</th>
              <th style={{ padding: "6px 10px", border: "1px solid var(--border)", textAlign: "left" }}>Hooks эквивалент</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["this.state / this.setState", "useState / useReducer"],
              ["componentDidMount", "useEffect(() => {...}, [])"],
              ["componentDidUpdate(prevProps)", "useEffect(() => {...}, [dep])"],
              ["componentWillUnmount", "useEffect cleanup: return () => {...}"],
              ["shouldComponentUpdate", "React.memo / useMemo"],
              ["getDerivedStateFromProps", "Render-time calculation или useEffect"],
              ["getSnapshotBeforeUpdate", "useLayoutEffect (приближение)"],
              ["componentDidCatch", "ErrorBoundary (только class!)"],
              ["this.forceUpdate()", "useReducer dispatch / useState"],
              ["createRef / this.myRef", "useRef"],
              ["PureComponent", "React.memo"],
            ].map(([cls, hook]) => (
              <tr key={cls}>
                <td style={{ padding: "5px 10px", border: "1px solid var(--border)", color: "var(--amber)", fontFamily: "monospace" }}>{cls}</td>
                <td style={{ padding: "5px 10px", border: "1px solid var(--border)", color: "var(--green)", fontFamily: "monospace" }}>{hook}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>getDerivedStateFromProps — антипаттерн</h3>
        <div className="code-block">{`// ❌ Часто неправильно используется:
static getDerivedStateFromProps(props, state) {
  // Синхронизировать email из props в state
  return { email: props.email };
}
// Проблема: полностью управляемый компонент — нельзя редактировать!

// ✅ Правильно: полностью контролируемый компонент
// Просто использовать props.email напрямую

// ✅ Или полностью неуправляемый с key для сброса:
<EmailField key={userId} defaultEmail={user.email} />

// getDerivedStateFromProps нужен в ОЧЕНЬ редких случаях:
// — списки с сортировкой (lastSortedItems)
// — анимации на основе предыдущего значения`}</div>
      </div>
    </section>
  );
}
