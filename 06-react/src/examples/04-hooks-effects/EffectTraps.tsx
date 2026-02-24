import { useState, useEffect, useCallback, useRef } from "react";

export default function EffectTraps() {
  return (
    <section>
      <h2>Ловушки useEffect</h2>

      <div className="card">
        <h3>1. Бесконечный цикл</h3>
        <div className="code-block">{`// ❌ Объект в deps — новый объект каждый рендер → бесконечный цикл
function Bad() {
  const [data, setData] = useState(null);
  const options = { method: "GET" }; // новый объект каждый рендер!

  useEffect(() => {
    fetch("/api", options).then(r => r.json()).then(setData);
  }, [options]); // ← options всегда "новый" → бесконечно
}

// ✅ Выносить объект за пределы компонента (если не зависит от props/state)
const OPTIONS = { method: "GET" }; // создаётся один раз

// ✅ Или useMemo:
const options = useMemo(() => ({ method: "GET" }), []);

// ✅ Или примитивные deps:
useEffect(() => {
  fetch(\`/api?id=\${id}\`); // зависит только от id (primitive)
}, [id]);

// ❌ setState в effect без deps → бесконечный цикл:
useEffect(() => {
  setCount(count + 1); // изменяет count → эффект снова → бесконечно
});`}</div>
      </div>

      <div className="card">
        <h3>2. Stale closure</h3>
        <StaleClosureDemo />
        <div className="code-block">{`// ❌ Проблема: callback захватывает count на момент создания эффекта
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1); // count всегда 0 (stale!)
  }, 1000);
  return () => clearInterval(id);
}, []); // пустой deps → эффект запускается один раз → count зафиксирован

// ✅ Решение 1: functional update (не читаем count из closure)
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1); // c — всегда актуальное значение
  }, 1000);
  return () => clearInterval(id);
}, []);

// ✅ Решение 2: добавить count в deps (но тогда interval пересоздаётся)
// ✅ Решение 3: useRef для "живого" значения
const countRef = useRef(count);
useEffect(() => { countRef.current = count; }); // синхронизировать
useEffect(() => {
  const id = setInterval(() => {
    setCount(countRef.current + 1); // читаем из ref
  }, 1000);
  return () => clearInterval(id);
}, []);`}</div>
      </div>

      <div className="card">
        <h3>3. Missing deps — eslint-plugin-react-hooks</h3>
        <div className="code-block">{`// ESLint правило: react-hooks/exhaustive-deps
// Предупреждает о пропущенных зависимостях

// ❌ Пропущен userId:
useEffect(() => {
  fetchUser(userId); // userId используется но не в deps
}, []); // ESLint: React Hook useEffect has a missing dependency: 'userId'

// Исключение: функции — можно завернуть в useCallback или вынести за компонент
const fetchData = useCallback(() => {
  fetchUser(userId);
}, [userId]);

useEffect(() => {
  fetchData();
}, [fetchData]); // ✅ fetchData стабилен пока userId не меняется

// ⚠️ НЕ игнорируй ESLint useEffect предупреждения без понимания!
// eslint-disable-next-line react-hooks/exhaustive-deps  ← последнее средство`}</div>
      </div>

      <div className="card">
        <h3>4. Не нужный useEffect</h3>
        <div className="code-block">{`// Частая ошибка: использовать useEffect там где он не нужен

// ❌ Производное state — не нужен useEffect:
const [firstName, setFirstName] = useState("John");
const [lastName, setLastName] = useState("Doe");
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(firstName + " " + lastName); // лишний рендер!
}, [firstName, lastName]);

// ✅ Просто вычислить во время render:
const fullName = firstName + " " + lastName; // нет лишнего рендера

// ❌ Запрос без условия при изменении пропса — антипаттерн:
useEffect(() => {
  fetch(\`/api/\${props.id}\`).then(setData);
}, [props.id]);
// ✅ Лучше использовать React Query / SWR / TanStack Query

// Правило: useEffect нужен для СИНХРОНИЗАЦИИ с внешней системой
// (DOM, WebSocket, localStorage, браузерные API, сторонние библиотеки)
// Не для производных данных и не для обработки событий`}</div>
      </div>
    </section>
  );
}

// Stale closure demo
function StaleClosureDemo() {
  const [count, setCount] = useState(0);
  const [staleLogs, setStaleLogs] = useState<number[]>([]);
  const [goodLogs, setGoodLogs] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const countRef = useRef(count);

  useEffect(() => {
    countRef.current = count;
  });

  const start = () => {
    setCount(0);
    setStaleLogs([]);
    setGoodLogs([]);
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    // Stale: count зафиксирован на 0
    const staleId = setInterval(() => {
      setStaleLogs(prev => [...prev.slice(-4), count]); // всегда 0!
    }, 400);

    // Good: functional update
    const goodId = setInterval(() => {
      setCount(c => {
        setGoodLogs(prev => [...prev.slice(-4), c + 1]);
        return c + 1;
      });
    }, 400);

    const stopId = setTimeout(() => {
      clearInterval(staleId);
      clearInterval(goodId);
      setRunning(false);
    }, 2500);

    return () => {
      clearInterval(staleId);
      clearInterval(goodId);
      clearTimeout(stopId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div style={{ marginTop: 12 }}>
      <div className="btn-row">
        <button className="btn" style={{ fontSize: 12 }} onClick={start} disabled={running}>
          {running ? "Running..." : "▶ Запустить демо (2.5s)"}
        </button>
        <div style={{ marginLeft: "auto", fontSize: 24, fontWeight: "bold", color: "var(--blue)" }}>
          count: {count}
        </div>
      </div>
      {(staleLogs.length > 0 || goodLogs.length > 0) && (
        <div className="grid2" style={{ marginTop: 8 }}>
          <div>
            <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 4 }}>❌ Stale (всегда 0)</div>
            <div style={{ display: "flex", gap: 4 }}>
              {staleLogs.map((v, i) => (
                <div key={i} style={{ background: "#3d0f0f", padding: "4px 8px", borderRadius: 4, fontSize: 13, color: "var(--red)" }}>{v}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: "var(--green)", fontSize: 12, marginBottom: 4 }}>✅ Functional update</div>
            <div style={{ display: "flex", gap: 4 }}>
              {goodLogs.map((v, i) => (
                <div key={i} style={{ background: "#1a4731", padding: "4px 8px", borderRadius: 4, fontSize: 13, color: "var(--green)" }}>{v}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
