import { useState, type ReactNode } from "react";

// ─── Render Props паттерн ─────────────────────────
// Компонент принимает функцию как prop (или children)
// Функция получает данные и возвращает JSX

// DataProvider — предоставляет данные через render prop
function MouseTracker({ children }: { children: (pos: { x: number; y: number }) => ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div
      style={{ position: "relative", height: 150, background: "#21262d", borderRadius: 6, cursor: "crosshair", overflow: "hidden" }}
      onMouseMove={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) });
      }}
    >
      {children(pos)}
    </div>
  );
}

// Toggle — абстрагирует boolean toggle логику
function Toggle({ children }: {
  children: (props: { isOn: boolean; toggle: () => void }) => ReactNode
}) {
  const [isOn, setIsOn] = useState(false);
  return <>{children({ isOn, toggle: () => setIsOn(v => !v) })}</>;
}

// List с фильтрацией
function FilteredList<T extends { id: number; name: string }>({
  items,
  renderItem,
  renderEmpty,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  renderEmpty?: () => ReactNode;
}) {
  const [filter, setFilter] = useState("");
  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)}
        placeholder="Filter..." style={{ width: "100%", marginBottom: 8 }} />
      {filtered.length > 0
        ? filtered.map((item, i) => renderItem(item, i))
        : (renderEmpty ? renderEmpty() : <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Ничего не найдено</p>)
      }
    </div>
  );
}

export default function RenderPropsDemo() {
  const users = [
    { id: 1, name: "Alice Johnson", role: "Frontend" },
    { id: 2, name: "Bob Smith", role: "Backend" },
    { id: 3, name: "Carol Williams", role: "DevOps" },
    { id: 4, name: "Dave Brown", role: "Design" },
  ];

  return (
    <section>
      <h2>Render Props</h2>

      <div className="card">
        <h3>Суть паттерна</h3>
        <div className="code-block">{`// Render prop = функция, которую передаём как prop
// Компонент вызывает эту функцию с данными → ты рендеришь что хочешь

// Три варианта синтаксиса:
// 1. Через prop "render":
<DataProvider render={(data) => <Display data={data} />} />

// 2. Через children (наиболее распространённый):
<DataProvider>
  {(data) => <Display data={data} />}
</DataProvider>

// 3. Через именованный children prop:
<DataProvider>
  {{ header: (d) => <h1>{d.title}</h1>, body: (d) => <p>{d.body}</p> }}
</DataProvider>

// Когда использовать:
// - Нужно переиспользовать логику (state, handlers) с разным UI
// - Compound Components слишком жёсткий (нельзя изменить структуру)
// - В 2023+ обычно заменяется Custom Hooks, но render props всё ещё актуальны
//   для компонентов которые ЯВНО контролируют рендеринг (виртуализация, анимации)`}</div>
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="card">
          <h3>MouseTracker</h3>
          <MouseTracker>
            {({ x, y }) => (
              <div style={{ height: "100%", position: "relative" }}>
                <div style={{
                  position: "absolute", left: x - 8, top: y - 8,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "var(--blue)", opacity: 0.8, pointerEvents: "none",
                }} />
                <div style={{ position: "absolute", bottom: 8, left: 8, fontSize: 12, color: "var(--text-dim)" }}>
                  x: {x}, y: {y}
                </div>
              </div>
            )}
          </MouseTracker>
        </div>

        <div className="card">
          <h3>Toggle</h3>
          <Toggle>
            {({ isOn, toggle }) => (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div
                    onClick={toggle}
                    style={{
                      width: 48, height: 26, borderRadius: 13,
                      background: isOn ? "var(--green)" : "var(--border)",
                      position: "relative", cursor: "pointer", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3, left: isOn ? 25 : 3,
                      width: 20, height: 20, borderRadius: "50%",
                      background: "white", transition: "left 0.2s",
                    }} />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 6, display: "block" }}>
                    {isOn ? "ON ✅" : "OFF ⭕"}
                  </span>
                </div>
                {isOn && (
                  <div style={{ background: "#1a4731", padding: 8, borderRadius: 6, fontSize: 13 }}>
                    Контент при isOn=true
                  </div>
                )}
              </div>
            )}
          </Toggle>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>FilteredList — render prop для кастомного отображения</h3>
        <FilteredList
          items={users}
          renderItem={(user) => (
            <div key={user.id} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 10px", background: "#21262d", borderRadius: 4, marginBottom: 4, fontSize: 13
            }}>
              <span>{user.name}</span>
              <span className="badge blue">{user.role}</span>
            </div>
          )}
          renderEmpty={() => (
            <div style={{ textAlign: "center", padding: 16, color: "var(--text-dim)", fontSize: 13 }}>
              😔 Пользователи не найдены
            </div>
          )}
        />
      </div>
    </section>
  );
}
