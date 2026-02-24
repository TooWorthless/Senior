import { useState, lazy, Suspense } from "react";

const FetchDemo      = lazy(() => import("./examples/01-fetch"));
const AxiosDemo      = lazy(() => import("./examples/02-axios"));
const TanstackDemo   = lazy(() => import("./examples/03-tanstack-query"));
const GraphqlDemo    = lazy(() => import("./examples/04-graphql"));
const ApolloDemo     = lazy(() => import("./examples/05-apollo"));
const PatternsDemo   = lazy(() => import("./examples/06-patterns"));

const SECTIONS = [
  {
    title: "REST",
    items: [
      { id: "fetch",   num: "01", label: "fetch API",         component: FetchDemo },
      { id: "axios",   num: "02", label: "axios",             component: AxiosDemo },
      { id: "tanstack",num: "03", label: "TanStack Query",    component: TanstackDemo },
    ],
  },
  {
    title: "GraphQL",
    items: [
      { id: "graphql", num: "04", label: "GraphQL basics",    component: GraphqlDemo },
      { id: "apollo",  num: "05", label: "Apollo Client",     component: ApolloDemo },
    ],
  },
  {
    title: "Паттерны",
    items: [
      { id: "patterns",num: "06", label: "Pagination & Optimistic UI", component: PatternsDemo },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap(s => s.items);

function Spinner() {
  return (
    <div style={{ padding: 32, color: "var(--text-dim)", textAlign: "center" }}>
      ⏳ Загрузка примера...
    </div>
  );
}

export default function App() {
  const [activeId, setActiveId] = useState("fetch");
  const active = ALL_ITEMS.find(i => i.id === activeId)!;
  const Component = active.component;

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">🌐</span>
          <div>
            <div className="sidebar-title">REST & GraphQL</div>
            <div className="sidebar-sub">Senior Prep · Module 10</div>
          </div>
        </div>

        {SECTIONS.map(section => (
          <div key={section.title} className="nav-section">
            <div className="nav-section-title">{section.title}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeId === item.id ? "active" : ""}`}
                onClick={() => setActiveId(item.id)}
              >
                <span className="nav-num">{item.num}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <div style={{ fontSize: 10, color: "var(--text-dim)" }}>
            APIs: JSONPlaceholder · Rick&Morty GraphQL
          </div>
        </div>
      </nav>

      <main className="main">
        <Suspense fallback={<Spinner />}>
          <Component />
        </Suspense>
      </main>
    </div>
  );
}
