import { Profiler, type ProfilerOnRenderCallback, useState, useRef } from "react";

interface ProfileEntry {
  id: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  timestamp: number;
}

export default function ProfilerDemo() {
  const [entries, setEntries] = useState<ProfileEntry[]>([]);
  const [renderCount, setRenderCount] = useState(0);

  const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration, startTime) => {
    setEntries(prev => [{
      id, phase, actualDuration, baseDuration, timestamp: startTime,
    }, ...prev.slice(0, 19)]);
  };

  return (
    <section>
      <h2>Profiler API</h2>

      <div className="card">
        <h3>React.Profiler</h3>
        <div className="code-block">{`import { Profiler, type ProfilerOnRenderCallback } from "react";

const onRender: ProfilerOnRenderCallback = (
  id,             // "id" prop переданный в Profiler
  phase,          // "mount" | "update" | "nested-update"
  actualDuration, // время рендера этого рендера (ms)
  baseDuration,   // время без мемоизации (наихудший случай)
  startTime,      // когда начался рендер
  commitTime,     // когда зафиксирован в DOM
) => {
  console.log({ id, phase, actualDuration });
  // Отправить в аналитику/мониторинг
};

<Profiler id="Navigation" onRender={onRender}>
  <Navigation />
</Profiler>

// ⚠️ Profiler добавляет небольшой overhead
// Только для профилирования, не для production
// Для production → React DevTools Profiler`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Живое демо</h3>
        <Profiler id="DemoTree" onRender={onRender}>
          <SlowComponent renderCount={renderCount} />
        </Profiler>
        <button className="btn" style={{ fontSize: 12, marginTop: 10 }}
          onClick={() => setRenderCount(c => c + 1)}>
          Trigger render #{renderCount + 1}
        </button>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>Profiler log:</div>
          <div className="log-box">
            {entries.length === 0
              ? <div className="log-entry" style={{ color: "var(--text-dim)" }}>Нажми кнопку выше...</div>
              : entries.map((e, i) => (
                <div key={i} className={`log-entry ${e.phase === "mount" ? "ok" : "info"}`}>
                  [{e.phase}] actual: {e.actualDuration.toFixed(2)}ms | base: {e.baseDuration.toFixed(2)}ms
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Стратегии оптимизации</h3>
        <div className="code-block">{`// 1. React DevTools Profiler → найти "причину" рендеров
//    "Why did this render?" — показывает изменившийся проп/state

// 2. Code splitting — не загружать весь bundle сразу
const HeavyPage = lazy(() => import("./HeavyPage"));
// → загрузить chunk только при навигации

// 3. Windowing / virtualization — рендерить только видимые строки
// react-window, react-virtual (tanstack)
// Для списков 1000+ элементов

// 4. Concurrent features (React 18)
startTransition(() => setFilter(value)); // non-urgent update
const deferred = useDeferredValue(searchQuery); // "отложенное" значение

// 5. Profiling в production:
// import { unstable_Profiler } from "react"
// Или React DevTools в production build

// Приоритет оптимизации:
// 1. Исправить алгоритм (O(n²) → O(n))
// 2. Уменьшить scope re-render (state вниз, разбить компоненты)
// 3. Мемоизация (memo, useMemo, useCallback)
// 4. Virtualization (виртуализация длинных списков)
// 5. Code splitting (lazy loading)`}</div>
      </div>
    </section>
  );
}

function SlowComponent({ renderCount }: { renderCount: number }) {
  // Симуляция тяжёлого рендера
  const start = performance.now();
  while (performance.now() - start < 10) { /* busy wait 10ms */ }

  const renderCountRef = useRef(0);
  renderCountRef.current++;

  return (
    <div style={{ background: "#21262d", padding: 10, borderRadius: 6 }}>
      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
        SlowComponent (10ms delay) | renders: {renderCountRef.current} | trigger: {renderCount}
      </div>
    </div>
  );
}
