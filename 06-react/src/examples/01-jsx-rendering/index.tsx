import { useState, useRef } from "react";
import RenderCounter from "./RenderCounter";
import KeysDemo from "./KeysDemo";
import JsxTransformDemo from "./JsxTransformDemo";
import ReconciliationDemo from "./ReconciliationDemo";

export default function JsxRendering() {
  const [tab, setTab] = useState<"jsx" | "reconcile" | "keys" | "fiber">("jsx");

  return (
    <div className="example-page">
      <h1>01 · JSX & Rendering</h1>
      <p className="subtitle">JSX transform, Virtual DOM, Fiber, reconciliation, keys</p>

      <div className="btn-row">
        {(["jsx", "reconcile", "keys", "fiber"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "jsx"       && <JsxTransformDemo />}
      {tab === "reconcile" && <ReconciliationDemo />}
      {tab === "keys"      && <KeysDemo />}
      {tab === "fiber"     && <FiberExplained />}
    </div>
  );
}

// ─── Fiber Explained ─────────────────────────────
function FiberExplained() {
  return (
    <section>
      <h2>React Fiber — архитектура</h2>

      <div className="card">
        <h3>Зачем переписали (React 16, 2017)?</h3>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 12 }}>
          Старый Stack Reconciler — рекурсивный, синхронный. Глубокое дерево = долгий рендер,
          который нельзя прервать → dropped frames → UI фризы.
        </p>
        <div className="code-block">{`// Старый подход (Stack):
function reconcile(vdom) {
  mount(vdom);                  // синхронно до конца
  vdom.children.forEach(reconcile); // нельзя прервать!
}

// Fiber: linked list вместо стека рекурсии
// Каждый компонент = Fiber node (объект в heap)
// Рендеринг разбит на chunks → можно yield к браузеру
interface FiberNode {
  type: ComponentType | string;
  key: string | null;
  stateNode: Element | Instance | null;
  child: Fiber | null;      // первый дочерний
  sibling: Fiber | null;    // следующий брат
  return: Fiber | null;     // родитель
  pendingProps: Props;
  memoizedProps: Props;
  memoizedState: Hook | null;
  effectTag: number;        // Placement | Update | Deletion
  alternate: Fiber | null;  // "двойной буфер": work-in-progress vs current
}`}</div>
      </div>

      <div className="card">
        <h3>Две фазы рендеринга</h3>
        <div className="code-block">{`// Фаза 1: Render (Reconciliation) — ПРЕРЫВАЕМАЯ
// React строит work-in-progress fiber tree
// Находит что изменилось → создаёт список эффектов
// Может быть прервана, приоритезирована, переработана

// Фаза 2: Commit — СИНХРОННАЯ (нельзя прервать)
// BeforeMutation: snapshot DOM (getSnapshotBeforeUpdate)
// Mutation: реальные изменения в DOM (insertBefore, removeChild)
// Layout: useLayoutEffect, componentDidMount/Update`}</div>
        <div className="highlight">
          Поэтому <code>useEffect</code> запускается после paint (async),
          а <code>useLayoutEffect</code> — после DOM-мутации, но до paint (sync).
        </div>
      </div>

      <div className="card">
        <h3>Приоритеты (Lanes)</h3>
        <div className="code-block">{`// React 18 Concurrent Features
// Разные обновления имеют разный приоритет:

// Высокий: user input (typing, clicks)
setState(value); // ← urgent

// Низкий: переходы, тяжёлые обновления
startTransition(() => {
  setSearchResults(heavyFilter(data)); // ← non-urgent
});

// Deferred: ещё ниже
const deferred = useDeferredValue(value); // UI обновится когда idle`}</div>
      </div>

      <div className="card">
        <h3>StrictMode — двойной рендер</h3>
        <div className="code-block">{`// В development StrictMode:
// - render function вызывается ДВАЖДЫ
// - useEffect cleanup + re-run
// - Цель: найти побочные эффекты в render phase

// Render должен быть PURE (нет side effects):
// ✅ Нет: API calls, DOM mutations, subscriptions
// ✅ Только: вычисление JSX из props/state

// Если компонент нарушает это → StrictMode выявляет
function BadComponent() {
  counter++;          // ❌ side effect в render!
  fetch("/api/data"); // ❌ side effect в render!
  return <div>{counter}</div>;
}`}</div>
        <RenderCounter />
      </div>
    </section>
  );
}
