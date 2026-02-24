import { useState, useRef, useEffect, useCallback } from "react";

export default function UseRefDeep() {
  return (
    <section>
      <h2>useRef — два применения</h2>

      <div className="card">
        <h3>useRef vs useState</h3>
        <div className="code-block">{`// useRef — mutable контейнер, НЕ вызывает re-render при изменении
// { current: initialValue }

// Применение 1: DOM reference
const inputRef = useRef<HTMLInputElement>(null);
// → inputRef.current === DOM элемент после mount

// Применение 2: Mutable value без re-render
const timerRef = useRef<ReturnType<typeof setInterval>>();
const prevValueRef = useRef(value); // запомнить предыдущее значение

// Когда ref, когда state?
// state → нужен re-render при изменении (UI должен обновиться)
// ref   → НЕ нужен re-render (ID таймера, WebSocket, предыдущее значение)

// ⚠️ НЕ читай ref во время render (может быть stale):
function Bad() {
  const countRef = useRef(0);
  countRef.current++;           // изменение во время render
  return <div>{countRef.current}</div>; // ненадёжно в StrictMode
}

// ✅ Читай/пиши ref в effects и event handlers:
function Good() {
  const countRef = useRef(0);
  const handleClick = () => {
    countRef.current++;         // ✅ в event handler
    console.log(countRef.current);
  };
}`}</div>
      </div>

      <div className="grid2">
        <DomRefDemo />
        <MutableRefDemo />
      </div>

      <div className="card">
        <h3>Forwarding refs (React 19: ref как prop)</h3>
        <div className="code-block">{`// React 19: ref как обычный prop, forwardRef не нужен!
function Input({ ref, ...props }: React.ComponentProps<"input">) {
  return <input ref={ref} {...props} />;
}

// React 18 и ниже: forwardRef нужен
const Input = React.forwardRef<HTMLInputElement, Props>((props, ref) => (
  <input ref={ref} {...props} />
));

// useImperativeHandle — ограничить публичный API ref:
const Input = React.forwardRef<InputHandle, Props>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { if (inputRef.current) inputRef.current.value = ""; },
    // НЕ экспонируем весь DOM элемент — только нужные методы
  }));

  return <input ref={inputRef} {...props} />;
});`}</div>
      </div>
    </section>
  );
}

// DOM ref
function DomRefDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handleFocus = () => {
    inputRef.current?.focus();
    setFocused(true);
  };

  const handleSelect = () => {
    inputRef.current?.select();
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className="card">
      <h3>DOM Reference</h3>
      <input ref={inputRef} placeholder="Нажми кнопки ниже..."
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", marginBottom: 8 }} />
      <div className="btn-row">
        <button className="btn ghost" style={{ fontSize: 12 }} onClick={handleFocus}>
          Focus {focused ? "🟢" : "⚪"}
        </button>
        <button className="btn ghost" style={{ fontSize: 12 }} onClick={handleSelect}>
          Select all
        </button>
      </div>
      <div ref={scrollRef} style={{ height: 80, overflow: "auto", background: "#21262d", borderRadius: 4, padding: 8, marginTop: 8, fontSize: 11 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} style={{ color: "var(--text-dim)" }}>Строка {i + 1}</div>
        ))}
      </div>
      <button className="btn ghost" style={{ fontSize: 12, marginTop: 6, width: "100%" }} onClick={scrollToBottom}>
        Scroll to bottom ↓
      </button>
    </div>
  );
}

// Mutable ref без re-render
function MutableRefDemo() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef(0);
  const renderCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [running, setRunning] = useState(false);

  renderCountRef.current++;

  // Сохранить предыдущее значение
  useEffect(() => {
    prevCountRef.current = count;
  });

  const startTimer = useCallback(() => {
    if (intervalRef.current) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setCount(c => c + 1);
    }, 500);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  useEffect(() => () => { stopTimer(); }, [stopTimer]);

  return (
    <div className="card">
      <h3>Mutable ref (без re-render)</h3>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Current</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--blue)" }}>{count}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Previous (ref)</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--text-dim)" }}>{prevCountRef.current}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Renders (ref)</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "var(--amber)" }}>{renderCountRef.current}</div>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn" style={{ fontSize: 12 }} onClick={startTimer} disabled={running}>▶ Start</button>
        <button className="btn red" style={{ fontSize: 12 }} onClick={stopTimer} disabled={!running}>⏹ Stop</button>
        <button className="btn ghost" style={{ fontSize: 12 }} onClick={() => setCount(0)}>Reset</button>
      </div>
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 8 }}>
        intervalRef хранит ID таймера — изменение не вызывает re-render.
        prevCountRef сохраняет предыдущее значение.
      </p>
    </div>
  );
}
