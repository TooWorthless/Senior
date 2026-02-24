import { useState, lazy, Suspense } from "react";

// Lazy imports — каждый пример загружается только при переходе
const JsxRendering     = lazy(() => import("./examples/01-jsx-rendering"));
const ClassComponents  = lazy(() => import("./examples/02-class-components"));
const HooksState       = lazy(() => import("./examples/03-hooks-state"));
const HooksEffects     = lazy(() => import("./examples/04-hooks-effects"));
const HooksAdvanced    = lazy(() => import("./examples/05-hooks-advanced"));
const CustomHooks      = lazy(() => import("./examples/06-custom-hooks"));
const Performance      = lazy(() => import("./examples/07-performance"));
const ContextApi       = lazy(() => import("./examples/08-context"));
const Patterns         = lazy(() => import("./examples/09-patterns"));
const ListsMedia       = lazy(() => import("./examples/10-lists-media"));
const SuspenseErrors   = lazy(() => import("./examples/11-suspense-errors"));
const ServerComponents = lazy(() => import("./examples/12-server-components"));

const SECTIONS = [
  {
    title: "Основы",
    items: [
      { id: "jsx",     num: "01", label: "JSX & Rendering",      component: JsxRendering },
      { id: "class",   num: "02", label: "Class Components",      component: ClassComponents },
    ],
  },
  {
    title: "Hooks",
    items: [
      { id: "state",   num: "03", label: "useState & useRef",     component: HooksState },
      { id: "effects", num: "04", label: "useEffect",             component: HooksEffects },
      { id: "adv",     num: "05", label: "useReducer & useMemo",  component: HooksAdvanced },
      { id: "custom",  num: "06", label: "Custom Hooks",          component: CustomHooks },
    ],
  },
  {
    title: "Архитектура",
    items: [
      { id: "perf",    num: "07", label: "Performance",           component: Performance },
      { id: "ctx",     num: "08", label: "Context API",           component: ContextApi },
      { id: "pat",     num: "09", label: "Patterns",              component: Patterns },
    ],
  },
  {
    title: "Продвинутое",
    items: [
      { id: "lists",   num: "10", label: "Lists & Media",         component: ListsMedia },
      { id: "sus",     num: "11", label: "Suspense & Errors",     component: SuspenseErrors },
      { id: "rsc",     num: "12", label: "Server Components",     component: ServerComponents },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap(s => s.items);

function LoadingFallback() {
  return (
    <div style={{ padding: 32, color: "var(--text-dim)", textAlign: "center" }}>
      ⏳ Загрузка примера...
    </div>
  );
}

export default function App() {
  const [activeId, setActiveId] = useState("jsx");
  const active = ALL_ITEMS.find(i => i.id === activeId)!;
  const Component = active.component;

  return (
    <div className="layout">
      {/* Sidebar */}
      <nav className="sidebar">
        <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#f0f6fc" }}>⚛️ React</div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Senior Interview Prep</div>
        </div>
        {SECTIONS.map(section => (
          <div key={section.title}>
            <div className="sidebar-title">{section.title}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`nav-item${activeId === item.id ? " active" : ""}`}
                onClick={() => setActiveId(item.id)}
              >
                <span className="num">{item.num}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Main */}
      <main className="main">
        <Suspense fallback={<LoadingFallback />}>
          <Component />
        </Suspense>
      </main>
    </div>
  );
}
