import { useState } from "react";

export default function UseStateDeep() {
  return (
    <section>
      <h2>useState — глубокое погружение</h2>

      <div className="card">
        <h3>Как работает useState под капотом</h3>
        <div className="code-block">{`// useState — это ссылка на ячейку в Fiber node
// Хуки хранятся как linked list в fiber.memoizedState

// При первом рендере:
const [count, setCount] = useState(0);
// → создаётся Hook { memoizedState: 0, queue: {...}, next: null }

// При обновлении:
setCount(1);
// → добавляет Update в queue → schedules re-render
// → следующий рендер читает накопленные updates и вычисляет новое значение

// ВАЖНО: setState НЕ мутирует текущий state
// Он создаёт новое значение, которое появится ПОСЛЕ рендера
function Broken() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // ❌ бесконечный рендер!
  return <div>{count}</div>;
}

// Правило: setState только в event handlers и effects, не в render`}</div>
      </div>

      <div className="grid2">
        <FunctionalUpdateDemo />
        <StateShapeDemo />
      </div>

      <div className="card">
        <h3>Ловушки useState</h3>
        <div className="code-block">{`// 1. Closure stale state
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setTimeout(() => {
      console.log(count); // ❌ всегда 0 — замкнуто на момент создания
      setCount(count + 1); // ❌ всегда 1 если кликнуть несколько раз
    }, 1000);
  };

  const handleClickFixed = () => {
    setTimeout(() => {
      setCount(c => c + 1); // ✅ functional update — всегда актуальный
    }, 1000);
  };
}

// 2. Object state и иммутабельность
const [user, setUser] = useState({ name: "Alice", age: 30 });

// ❌ Мутация:
user.age = 31;
setUser(user); // React не видит изменения — same reference!

// ✅ Новый объект:
setUser({ ...user, age: 31 });
setUser(prev => ({ ...prev, age: prev.age + 1 }));

// 3. Lazy initializer — тяжёлые вычисления
// ❌ Выполняется каждый рендер:
const [list, setList] = useState(heavyComputation());

// ✅ Только при mount:
const [list, setList] = useState(() => heavyComputation());`}</div>
      </div>
    </section>
  );
}

// Functional update vs direct update
function FunctionalUpdateDemo() {
  const [count, setCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLog(prev => [msg, ...prev.slice(0, 7)]);

  // Баг: 3 вызова но +1
  const trickyIncrement = () => {
    setCount(count + 1); // закрыт на текущий count
    setCount(count + 1); // тот же count!
    setCount(count + 1); // тот же count!
    addLog(`❌ трижды setCount(${count}+1) → +1`);
  };

  // Fix: functional update
  const correctIncrement = () => {
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
    addLog("✅ трижды setCount(c=>c+1) → +3");
  };

  return (
    <div className="card">
      <h3>Functional update</h3>
      <div className="counter-display" style={{ fontSize: 36 }}>{count}</div>
      <div className="btn-row" style={{ justifyContent: "center", marginBottom: 8 }}>
        <button className="btn red" style={{ fontSize: 12 }} onClick={trickyIncrement}>
          ❌ 3× direct
        </button>
        <button className="btn" style={{ fontSize: 12 }} onClick={correctIncrement}>
          ✅ 3× functional
        </button>
        <button className="btn ghost" style={{ fontSize: 12 }} onClick={() => setCount(0)}>
          Reset
        </button>
      </div>
      <div className="log-box" style={{ maxHeight: 130 }}>
        {log.map((e, i) => (
          <div key={i} className={`log-entry ${e.includes("✅") ? "ok" : "err"}`}>{e}</div>
        ))}
      </div>
    </div>
  );
}

// State shape — flat vs nested
function StateShapeDemo() {
  // Плохо — вложенный объект, мутация легко сделать случайно
  const [formFlat, setFormFlat] = useState({ name: "", email: "", age: "" });

  // Структурированный (но не глубоко вложенный)
  const updateField = (field: keyof typeof formFlat) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormFlat(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="card">
      <h3>State shape</h3>
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 10 }}>
        Shallow flat state — проще обновлять:
      </p>
      {(["name", "email", "age"] as const).map(field => (
        <div key={field} style={{ marginBottom: 6 }}>
          <label style={{ fontSize: 11, color: "var(--text-dim)", display: "block" }}>{field}</label>
          <input value={formFlat[field]} onChange={updateField(field)}
            style={{ width: "100%" }} placeholder={field} />
        </div>
      ))}
      <div className="code-block" style={{ marginTop: 8, fontSize: 11 }}>
        {JSON.stringify(formFlat, null, 2)}
      </div>
    </div>
  );
}
