import { createContext, useContext, useState, type ReactNode } from "react";

// ─── Паттерн: Compound Components ─────────────────
// Несколько компонентов, которые работают вместе
// через общий неявный state (через Context)

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabs must be used within Tabs");
  return ctx;
}

// ─── Compound component API ───────────────────────
function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabList({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useTabs();
  return (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: "10px 16px",
        background: "none",
        border: "none",
        color: activeTab === id ? "var(--blue)" : "var(--text-dim)",
        borderBottom: activeTab === id ? "2px solid var(--blue)" : "2px solid transparent",
        cursor: "pointer",
        fontFamily: "var(--font)",
        fontSize: 13,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab } = useTabs();
  if (activeTab !== id) return null;
  return <div style={{ padding: 16 }}>{children}</div>;
}

// ─── Attach sub-components ────────────────────────
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// ─── Accordioн ────────────────────────────────────
interface AccordionContextType { openIds: Set<string>; toggle: (id: string) => void }
const AccordionContext = createContext<AccordionContextType | null>(null);

function Accordion({ multiple = false, children }: { multiple?: boolean; children: ReactNode }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(multiple ? prev : new Set<string>());
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  return (
    <AccordionContext.Provider value={{ openIds, toggle }}>
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be inside Accordion");
  const { openIds, toggle } = ctx;
  const isOpen = openIds.has(id);

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={() => toggle(id)}
        style={{
          width: "100%", padding: "12px 16px", background: "var(--surface)",
          border: "none", color: "var(--text)", cursor: "pointer",
          fontFamily: "var(--font)", fontSize: 13, textAlign: "left",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        {title}
        <span style={{ color: "var(--text-dim)", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      <div style={{
        maxHeight: isOpen ? "200px" : "0",
        overflow: "hidden",
        transition: "max-height 0.3s ease",
      }}>
        <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-dim)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Demo ─────────────────────────────────────────
export default function CompoundComponentsDemo() {
  return (
    <section>
      <h2>Compound Components</h2>

      <div className="card">
        <h3>Зачем?</h3>
        <div className="code-block">{`// ❌ Props drilling — конфигурация через пропсы
<Tabs
  tabs={[
    { id: "a", label: "Tab A", content: <div>A</div> },
  ]}
  defaultTab="a"
  onTabChange={...}
/>
// Неудобно, ограниченная кастомизация

// ✅ Compound Components — гибкая композиция
<Tabs defaultTab="a">
  <Tabs.List>
    <Tabs.Tab id="a">Tab A</Tabs.Tab>
    <Tabs.Tab id="b">Tab B</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="a">Content A</Tabs.Panel>
  <Tabs.Panel id="b">Content B</Tabs.Panel>
</Tabs>
// Пользователь контролирует структуру, расположение, добавляет свои элементы

// Имплементация: Context для неявного state
// Parent держит state, children получают через useContext`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Tabs компонент</h3>
        <Tabs defaultTab="overview">
          <Tabs.List>
            <Tabs.Tab id="overview">Overview</Tabs.Tab>
            <Tabs.Tab id="code">Code</Tabs.Tab>
            <Tabs.Tab id="settings">Settings</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="overview">
            <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
              Compound Components паттерн — Tabs, Accordion, Select, Dropdown.
              Реализован через Context + Children API.
            </p>
          </Tabs.Panel>
          <Tabs.Panel id="code">
            <div style={{ background: "#010409", padding: 10, borderRadius: 4, fontSize: 12, color: "#a5d6ff" }}>
              {`<Tabs defaultTab="overview">\n  <Tabs.List>\n    <Tabs.Tab id="overview">Overview</Tabs.Tab>\n  </Tabs.List>\n  <Tabs.Panel id="overview">Content</Tabs.Panel>\n</Tabs>`}
            </div>
          </Tabs.Panel>
          <Tabs.Panel id="settings">
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
              Настройки компонента — добавь свой UI сюда
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Accordion (multiple selection)</h3>
        <Accordion multiple>
          <AccordionItem id="fiber" title="Что такое React Fiber?">
            Fiber — это новая reconciliation архитектура в React 16. Рендеринг разбит на
            прерываемые chunks, что позволяет React работать в Concurrent режиме.
          </AccordionItem>
          <AccordionItem id="memo" title="Когда использовать React.memo?">
            Когда компонент часто рендерится, пропсы стабильны (мемоизированы),
            и рендер занимает заметное время. Сначала измерь — не оптимизируй вслепую.
          </AccordionItem>
          <AccordionItem id="keys" title="Почему нельзя использовать index как key?">
            При добавлении/удалении/сортировке элементов индексы смещаются.
            React думает, что первый элемент — тот же, что и раньше, и не пересоздаёт state.
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
