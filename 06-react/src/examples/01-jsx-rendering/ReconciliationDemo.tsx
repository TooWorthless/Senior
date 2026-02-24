import { useState } from "react";

export default function ReconciliationDemo() {
  return (
    <section>
      <h2>Reconciliation — алгоритм сравнения</h2>

      <div className="card">
        <h3>Правила diff алгоритма (O(n), не O(n³))</h3>
        <div className="code-block">{`// React использует два эвристических правила:

// 1. Разный тип → полная замена (unmount + mount)
// До:  <div><Counter /></div>
// После: <p><Counter /></p>
// → Counter УНИЧТОЖАЕТСЯ и создаётся заново (state теряется!)

// 2. Одинаковый тип → обновление props (state сохраняется)
// До:  <Counter count={1} />
// После: <Counter count={2} />
// → Counter ОБНОВЛЯЕТСЯ, state сохранён

// 3. Одинаковый тип, HTML элемент → обновление атрибутов
// <div className="old" /> → <div className="new" />
// → только изменённые атрибуты патчатся`}</div>
      </div>

      <div className="grid2">
        <TypeChangeDemo />
        <SameTypeDemo />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Условный рендер и state</h3>
        <ConditionalStateDemo />
        <div className="code-block">{`// Позиция в дереве определяет идентичность компонента
// Одна и та же позиция + одинаковый тип → state сохраняется

{isPlayerA ? <Counter person="Alice" /> : <Counter person="Bob" />}
// Смена isPlayerA → state Counter сбрасывается!
// Потому что React видит: Counter на той же позиции, но...
// wait — тип тот же (Counter), значит React ОБНОВЛЯЕТ, НЕ пересоздаёт
// → state НЕ сбрасывается!

// Для принудительного сброса state: использовать key
{isPlayerA
  ? <Counter key="alice" person="Alice" />
  : <Counter key="bob" person="Bob" />
}
// key изменился → React unmount + mount`}</div>
      </div>
    </section>
  );
}

// Счётчик с видимым state
function StatefulCounter({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  return (
    <div style={{ background: "#21262d", padding: "8px 12px", borderRadius: 4, marginBottom: 6 }}>
      <span style={{ color: "var(--text-dim)", fontSize: 12 }}>{label}: </span>
      <strong style={{ color: "var(--blue)" }}>{count}</strong>
      <button className="btn" style={{ marginLeft: 8, padding: "2px 8px", fontSize: 11 }}
        onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}

// Демо смены типа
function TypeChangeDemo() {
  const [useDiv, setUseDiv] = useState(true);
  return (
    <div className="card">
      <h3>Смена типа → state теряется</h3>
      <button className="btn ghost" style={{ marginBottom: 8, fontSize: 12 }}
        onClick={() => setUseDiv(v => !v)}>
        Переключить {useDiv ? "<div>" : "<span>"}
      </button>
      {useDiv
        ? <div style={{ border: "2px solid var(--blue)", padding: 8, borderRadius: 4 }}>
            <StatefulCounter label="div > Counter" />
          </div>
        : <span style={{ display: "block", border: "2px solid var(--amber)", padding: 8, borderRadius: 4 }}>
            <StatefulCounter label="span > Counter" />
          </span>
      }
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 8 }}>
        Сначала нажми «+» несколько раз, потом переключи обёртку — Counter state сбрасывается!
      </p>
    </div>
  );
}

// Демо одинакового типа
function SameTypeDemo() {
  const [primary, setPrimary] = useState(true);
  return (
    <div className="card">
      <h3>Одинаковый тип → state сохраняется</h3>
      <button className="btn ghost" style={{ marginBottom: 8, fontSize: 12 }}
        onClick={() => setPrimary(v => !v)}>
        Сменить label: {primary ? "Primary" : "Secondary"}
      </button>
      <StatefulCounter label={primary ? "Primary" : "Secondary"} />
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 8 }}>
        Label меняется, но Counter — тот же компонент на той же позиции → state сохранён.
      </p>
    </div>
  );
}

// Демо условного рендера + key
function ConditionalStateDemo() {
  const [isAlice, setIsAlice] = useState(true);
  const [useKey, setUseKey] = useState(false);

  return (
    <div>
      <div className="btn-row" style={{ marginBottom: 8 }}>
        <button className="btn ghost" style={{ fontSize: 12 }} onClick={() => setIsAlice(v => !v)}>
          Переключить: {isAlice ? "Alice" : "Bob"}
        </button>
        <button className={`btn${useKey ? "" : " ghost"}`} style={{ fontSize: 12 }}
          onClick={() => setUseKey(v => !v)}>
          key={useKey ? "✅ включён" : "❌ выключен"}
        </button>
      </div>
      {useKey
        ? isAlice
          ? <StatefulCounter key="alice" label="Alice (с key)" />
          : <StatefulCounter key="bob" label="Bob (с key)" />
        : <StatefulCounter label={isAlice ? "Alice (без key)" : "Bob (без key)"} />
      }
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 6 }}>
        {useKey
          ? "✅ key изменился → React unmount + mount → state сброшен"
          : "⚠️ Без key: state сохраняется при смене Alice↔Bob (одинаковый тип, одна позиция)"}
      </p>
    </div>
  );
}
