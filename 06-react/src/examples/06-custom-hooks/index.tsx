import { useState } from "react";
import UseFetchDemo from "./UseFetchDemo";
import UseLocalStorageDemo from "./UseLocalStorageDemo";
import UseDebounceDemo from "./UseDebounceDemo";
import UseIntersectionDemo from "./UseIntersectionDemo";

export default function CustomHooks() {
  const [tab, setTab] = useState<"fetch" | "storage" | "debounce" | "intersection">("fetch");

  return (
    <div className="example-page">
      <h1>06 · Custom Hooks</h1>
      <p className="subtitle">useFetch, useLocalStorage, useDebounce, useIntersectionObserver</p>

      <div className="card">
        <h3>Правила custom hooks</h3>
        <div className="code-block">{`// 1. Имя ДОЛЖНО начинаться с "use" → eslint находит нарушения правил хуков
// 2. Могут вызывать другие хуки (useState, useEffect, etc.)
// 3. Инкапсулируют ЛОГИКУ, не UI (возвращают данные/функции, не JSX)
// 4. Каждый вызов хука — независимый экземпляр состояния

// Паттерн: хук возвращает tuple или объект
const [data, error, loading] = useFetch(url);     // tuple
const { data, error, loading } = useFetch(url);   // object (гибче)

// Custom hook = composition хуков + бизнес-логика
function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size; // { w, h }
}`}</div>
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        {(["fetch", "storage", "debounce", "intersection"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "fetch"        && <UseFetchDemo />}
      {tab === "storage"      && <UseLocalStorageDemo />}
      {tab === "debounce"     && <UseDebounceDemo />}
      {tab === "intersection" && <UseIntersectionDemo />}
    </div>
  );
}
