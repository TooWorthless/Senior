import { useState, useEffect, useRef } from "react";

export default function EffectBasics() {
  return (
    <section>
      <h2>useEffect — основы и deps array</h2>

      <div className="card">
        <h3>Три формы deps array</h3>
        <div className="code-block">{`// 1. Нет deps → запускается после КАЖДОГО рендера
useEffect(() => {
  document.title = \`Count: \${count}\`;
}); // ⚠️ Опасно: легко получить бесконечный цикл

// 2. Пустой массив → только при mount (componentDidMount аналог)
useEffect(() => {
  const sub = store.subscribe(handler);
  return () => sub.unsubscribe(); // cleanup при unmount
}, []); // ✅ один раз

// 3. Массив с зависимостями → при mount + при изменении dep
useEffect(() => {
  fetchUser(userId);
}, [userId]); // ✅ при mount и каждый раз когда userId меняется

// ПРАВИЛО: все reactive values из компонента → в deps
// reactive values = props, state, context, переменные из компонента
// НЕ reactive: setCount, dispatch, ref.current, константы вне компонента`}</div>
      </div>

      <DepsDemo />

      <div className="card" style={{ marginTop: 12 }}>
        <h3>useEffect — порядок выполнения</h3>
        <div className="code-block">{`// Последовательность при рендере:

// 1. React вызывает render function (вычисляет JSX)
// 2. React обновляет DOM (Commit phase)
// 3. Браузер рисует (paint)
// 4. useEffect cleanup предыдущего эффекта
// 5. useEffect callback текущего рендера

// При unmount:
// 1. React удаляет компонент из DOM
// 2. Запускает cleanup всех useEffect этого компонента

// В StrictMode (development):
// mount → cleanup → mount (проверяет что cleanup корректен)
// Поэтому API вызовы могут выполняться дважды в dev!`}</div>
      </div>
    </section>
  );
}

function DepsDemo() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("Alice");
  const log = useRef<{ type: string; msg: string }[]>([]);
  const [, forceUpdate] = useState(0);

  const addLog = (type: string, msg: string) => {
    log.current = [{ type, msg }, ...log.current.slice(0, 19)];
    forceUpdate(n => n + 1);
  };

  // Каждый рендер
  useEffect(() => {
    addLog("every", `Каждый рендер: count=${count}, name=${name}`);
  });

  // Только mount
  useEffect(() => {
    addLog("mount", "Mount: только один раз");
    return () => addLog("mount", "Cleanup mount (unmount)");
  }, []);

  // При изменении count
  useEffect(() => {
    addLog("count", `count изменился: ${count}`);
    return () => addLog("count", `Cleanup count: было ${count}`);
  }, [count]);

  // При изменении name
  useEffect(() => {
    addLog("name", `name изменился: ${name}`);
  }, [name]);

  return (
    <div className="card">
      <h3>Живое демо deps array</h3>
      <div className="btn-row">
        <button className="btn" style={{ fontSize: 12 }} onClick={() => setCount(c => c + 1)}>
          count++ ({count})
        </button>
        <button className="btn ghost" style={{ fontSize: 12 }}
          onClick={() => setName(n => n === "Alice" ? "Bob" : "Alice")}>
          name: {name}
        </button>
      </div>
      <div className="log-box">
        {log.current.map((entry, i) => (
          <div key={i} className={`log-entry ${
            entry.type === "mount"  ? "ok"   :
            entry.type === "count" ? "info" :
            entry.type === "name"  ? "warn" : ""
          }`}>
            <span style={{ fontSize: 10, opacity: 0.6 }}>[{entry.type}] </span>
            {entry.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
