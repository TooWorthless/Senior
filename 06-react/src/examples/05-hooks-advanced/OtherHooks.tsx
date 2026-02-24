import { useState, useLayoutEffect, useId, useRef, useEffect } from "react";

export default function OtherHooks() {
  return (
    <section>
      <h2>useLayoutEffect, useId, useImperativeHandle</h2>

      <div className="grid2">
        <LayoutEffectDemo />
        <UseIdDemo />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>useLayoutEffect vs useEffect</h3>
        <div className="code-block">{`// useEffect:    async, после paint → не блокирует браузер
// useLayoutEffect: sync, после DOM мутации, ДО paint → блокирует

// Когда useLayoutEffect:
// 1. Нужно прочитать/изменить DOM ДО того как пользователь увидит
//    (позиция элемента, размеры, скролл-позиция)
// 2. Анимации, где flash of incorrect content нежелателен
// 3. Tooltips / поповеры — позиционирование относительно якоря

// Пример: tooltip позиционирование
const Tooltip = () => {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Читаем позицию ДО paint — пользователь не видит "прыжка"
    const rect = ref.current!.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left });
  });

  return <div ref={ref}>...</div>;
};

// SSR: useLayoutEffect не работает на сервере!
// → используй useEffect на сервере, или suppressHydrationWarning
// → или условно: typeof window !== "undefined" && useLayoutEffect`}</div>
      </div>
    </section>
  );
}

// useLayoutEffect — flash demo
function LayoutEffectDemo() {
  const [showBad, setShowBad] = useState(false);
  const [showGood, setShowGood] = useState(false);

  return (
    <div className="card">
      <h3>useLayoutEffect — без flash</h3>
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 10 }}>
        useEffect может вызвать "прыжок" при изменении DOM после paint:
      </p>
      <div className="btn-row">
        <button className="btn red" style={{ fontSize: 12 }}
          onClick={() => { setShowBad(false); setTimeout(() => setShowBad(true), 50); }}>
          useEffect (flash)
        </button>
        <button className="btn" style={{ fontSize: 12 }}
          onClick={() => { setShowGood(false); setTimeout(() => setShowGood(true), 50); }}>
          useLayoutEffect
        </button>
      </div>
      {showBad && <FlashyBox useLayout={false} />}
      {showGood && <FlashyBox useLayout={true} />}
    </div>
  );
}

function FlashyBox({ useLayout }: { useLayout: boolean }) {
  const [color, setColor] = useState("#3b82f6");
  const boxRef = useRef<HTMLDivElement>(null);

  const hook = useLayout ? useLayoutEffect : useEffect;
  hook(() => {
    // Изменение сразу при появлении
    setColor("#22c55e");
    if (boxRef.current) {
      boxRef.current.style.transform = "scale(1)";
    }
  }, []);

  return (
    <div ref={boxRef}
      style={{
        background: color, padding: 12, borderRadius: 6, marginTop: 8, textAlign: "center",
        fontSize: 12, transform: "scale(0.9)", transition: "all 0.2s",
      }}>
      {useLayout ? "✅ useLayoutEffect: нет flash" : "⚠️ useEffect: возможен flash"}
    </div>
  );
}

// useId demo
function UseIdDemo() {
  return (
    <div className="card">
      <h3>useId — уникальные accessibility ID</h3>
      <div className="code-block" style={{ fontSize: 11 }}>{`// Проблема без useId:
// Компонент используется несколько раз → одинаковые id!
<label htmlFor="email">Email</label>
<input id="email" />
// Если два таких компонента на странице → id дублируется!

// useId генерирует уникальный ID для инстанса:
function FormField({ label }) {
  const id = useId(); // :r0:, :r1:, :r2:...
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
}`}</div>
      <MultipleFormFields />
    </div>
  );
}

function FormField({ label, type = "text" }: { label: string; type?: string }) {
  const id = useId();
  return (
    <div style={{ marginBottom: 8 }}>
      <label htmlFor={id} style={{ fontSize: 12, color: "var(--text-dim)", display: "block" }}>
        {label} <span style={{ color: "var(--amber)", fontSize: 10 }}>id="{id}"</span>
      </label>
      <input id={id} type={type} placeholder={label} style={{ width: "100%" }} />
    </div>
  );
}

function MultipleFormFields() {
  return (
    <div style={{ marginTop: 10 }}>
      <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>
        Один и тот же компонент — уникальные ID:
      </p>
      <FormField label="Name" />
      <FormField label="Email" type="email" />
      <FormField label="Password" type="password" />
    </div>
  );
}
