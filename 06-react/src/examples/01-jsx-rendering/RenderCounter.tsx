import { useRef, useState } from "react";

export default function RenderCounter() {
  const renderCount = useRef(0);
  renderCount.current++;
  const [, forceUpdate] = useState(0);

  return (
    <div style={{ background: "#21262d", padding: 12, borderRadius: 6, marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 13 }}>Этот компонент отрендерился: </span>
        <strong style={{ color: "var(--amber)", fontSize: 18 }}>{renderCount.current}</strong>
        <span style={{ fontSize: 13, color: "var(--text-dim)" }}>раз</span>
        <button className="btn ghost" style={{ fontSize: 12, marginLeft: "auto" }}
          onClick={() => forceUpdate(n => n + 1)}>
          Force Re-render
        </button>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-dim)" }}>
        В StrictMode (dev) начальный рендер происходит дважды — именно поэтому видишь 2, а не 1.
        React делает это чтобы найти побочные эффекты в render phase.
        В production счётчик будет 1.
      </p>
    </div>
  );
}
