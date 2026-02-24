import { useState, memo, useCallback, useRef } from "react";

// ─── Child без memo ───────────────────────────────
function ChildNoMemo({ label, onClick }: { label: string; onClick: () => void }) {
  const renderCount = useRef(0);
  renderCount.current++;
  return (
    <div style={{ background: "#21262d", padding: 10, borderRadius: 6, marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span>{label}</span>
        <span style={{ color: "var(--amber)" }}>renders: {renderCount.current}</span>
      </div>
      <button className="btn ghost" style={{ fontSize: 11, marginTop: 4 }} onClick={onClick}>
        Click me
      </button>
    </div>
  );
}

// ─── Child с memo ─────────────────────────────────
const ChildWithMemo = memo(function ChildWithMemo({ label, onClick }: { label: string; onClick: () => void }) {
  const renderCount = useRef(0);
  renderCount.current++;
  return (
    <div style={{ background: "#1a4731", padding: 10, borderRadius: 6, marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span>{label}</span>
        <span style={{ color: "var(--green)" }}>renders: {renderCount.current}</span>
      </div>
      <button className="btn ghost" style={{ fontSize: 11, marginTop: 4 }} onClick={onClick}>
        Click me
      </button>
    </div>
  );
});

// ─── memo с custom comparator ─────────────────────
const ChildCustomMemo = memo(
  function ChildCustomMemo({ user }: { user: { id: number; name: string; lastSeen: number } }) {
    const renderCount = useRef(0);
    renderCount.current++;
    return (
      <div style={{ background: "#1e3a5f", padding: 10, borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{user.name} (id: {user.id})</span>
          <span style={{ color: "var(--blue)" }}>renders: {renderCount.current}</span>
        </div>
      </div>
    );
  },
  // Custom comparator: игнорируем изменение lastSeen
  (prevProps, nextProps) => prevProps.user.id === nextProps.user.id &&
    prevProps.user.name === nextProps.user.name
);

export default function MemoDemo() {
  const [count, setCount] = useState(0);
  const [, setTick] = useState(0);

  // ❌ Новая функция при каждом рендере
  const handleClickBad = () => console.log("bad click");

  // ✅ Стабильная функция
  const handleClickGood = useCallback(() => console.log("good click"), []);

  const user = { id: 1, name: "Alice", lastSeen: count };

  return (
    <section>
      <h2>React.memo</h2>

      <div className="card">
        <h3>React.memo — как работает</h3>
        <div className="code-block">{`// memo оборачивает компонент в HOC
// Перед рендером: shallow compare prevProps vs nextProps
// Если пропсы не изменились (===) → пропустить рендер

const Child = memo(function Child({ value }) {
  return <div>{value}</div>;
});

// Shallow compare:
// Примитивы: === (number, string, boolean)
// Объекты:   сравниваются по ССЫЛКЕ (не по содержимому!)
// Функции:   новая функция каждый рендер → "изменилась"

// Поэтому memo + unstable callback = БЕСПОЛЕЗНО:
// ❌ Проп onClick — новая функция → Child всегда рендерится
const Parent = () => {
  const handleClick = () => {}; // новая каждый рендер!
  return <MemoChild onClick={handleClick} />;
};

// ✅ Нужен useCallback для стабильности:
const handleClick = useCallback(() => {}, []);`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Живое демо</h3>
        <div className="btn-row">
          <button className="btn" style={{ fontSize: 12 }}
            onClick={() => { setCount(c => c + 1); setTick(t => t + 1); }}>
            Re-render parent (count: {count})
          </button>
        </div>
        <div className="grid2" style={{ marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 4 }}>❌ Без memo</div>
            <ChildNoMemo label="ChildNoMemo" onClick={handleClickBad} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--amber)", marginBottom: 4 }}>
              ⚠️ memo + нестабильный callback
            </div>
            <ChildWithMemo label="memo + bad callback" onClick={handleClickBad} />
          </div>
        </div>
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 12, color: "var(--green)", marginBottom: 4 }}>
            ✅ memo + useCallback (стабильный)
          </div>
          <ChildWithMemo label="memo + useCallback" onClick={handleClickGood} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>memo с custom comparator</h3>
        <ChildCustomMemo user={user} />
        <div className="code-block" style={{ marginTop: 8 }}>{`// Кастомный comparator — игнорируем lastSeen:
const ChildCustomMemo = memo(
  ({ user }) => <div>{user.name}</div>,
  (prev, next) => prev.user.id === next.user.id && prev.user.name === next.user.name
  // lastSeen изменяется каждый рендер родителя, но мы его игнорируем
);
// Нажимай "Re-render parent" — ChildCustomMemo НЕ ре-рендерится`}</div>
      </div>
    </section>
  );
}
