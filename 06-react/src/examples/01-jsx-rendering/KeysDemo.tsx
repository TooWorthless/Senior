import { useState } from "react";

interface Item { id: number; name: string; color: string }

let nextId = 4;
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a78bfa", "#f87171", "#0ea5e9"];

export default function KeysDemo() {
  return (
    <section>
      <h2>Keys — идентификаторы элементов</h2>

      <div className="card">
        <h3>Зачем нужны keys?</h3>
        <div className="code-block">{`// Без key React сравнивает по ПОЗИЦИИ
// Вставка в начало → React думает что изменились ВСЕ элементы

// С key React сравнивает по ИДЕНТИФИКАТОРУ
// Вставка "Alice" в начало → Bob и Carol просто сдвигаются

// ❌ Плохо: index как key (при сортировке/удалении ломает state)
{items.map((item, i) => <Item key={i} {...item} />)}

// ✅ Хорошо: стабильный уникальный id
{items.map(item => <Item key={item.id} {...item} />)}

// ✅ Для статичных списков без изменений — index допустим
// ❌ Для динамических (добавление/удаление/сортировка) — НИКОГДА index`}</div>
      </div>

      <div className="grid2">
        <IndexKeyDemo />
        <IdKeyDemo />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Key как "reset" механизм</h3>
        <KeyResetDemo />
      </div>
    </section>
  );
}

// Компонент с внутренним state (имитирует форму)
function ListItem({ name, color }: { name: string; color: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
      background: "#21262d", borderRadius: 4, marginBottom: 4,
      borderLeft: `3px solid ${color}`
    }}>
      <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
      <span style={{ flex: 1, fontSize: 13 }}>{name}</span>
      <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
        {checked ? "✅" : "☐"}
      </span>
    </div>
  );
}

function IndexKeyDemo() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "Alice", color: COLORS[0] },
    { id: 2, name: "Bob", color: COLORS[1] },
    { id: 3, name: "Carol", color: COLORS[2] },
  ]);

  const addToFront = () => {
    const id = nextId++;
    setItems(prev => [{ id, name: `User-${id}`, color: COLORS[id % COLORS.length] }, ...prev]);
  };

  const remove = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div className="card">
      <h3>❌ key=index</h3>
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 8 }}>
        Отметь чекбоксы, потом добавь в начало — state съедет:
      </p>
      <button className="btn red" style={{ fontSize: 12, marginBottom: 8 }} onClick={addToFront}>
        + Добавить в начало
      </button>
      {items.map((item, index) => (
        <div key={index} style={{ position: "relative" }}>
          <ListItem name={`${item.name} (key=${index})`} color={item.color} />
          <button
            onClick={() => remove(item.id)}
            style={{ position: "absolute", right: 4, top: 6, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 12 }}
          >✕</button>
        </div>
      ))}
      <p style={{ color: "var(--red)", fontSize: 11, marginTop: 4 }}>
        State привязан к позиции, не к элементу → баг!
      </p>
    </div>
  );
}

function IdKeyDemo() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "Alice", color: COLORS[0] },
    { id: 2, name: "Bob", color: COLORS[1] },
    { id: 3, name: "Carol", color: COLORS[2] },
  ]);

  const addToFront = () => {
    const id = nextId++;
    setItems(prev => [{ id, name: `User-${id}`, color: COLORS[id % COLORS.length] }, ...prev]);
  };

  const remove = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div className="card">
      <h3>✅ key=id</h3>
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 8 }}>
        Отметь чекбоксы, потом добавь в начало — state сохранится:
      </p>
      <button className="btn" style={{ fontSize: 12, marginBottom: 8 }} onClick={addToFront}>
        + Добавить в начало
      </button>
      {items.map(item => (
        <div key={item.id} style={{ position: "relative" }}>
          <ListItem name={`${item.name} (key=${item.id})`} color={item.color} />
          <button
            onClick={() => remove(item.id)}
            style={{ position: "absolute", right: 4, top: 6, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 12 }}
          >✕</button>
        </div>
      ))}
      <p style={{ color: "var(--green)", fontSize: 11, marginTop: 4 }}>
        State привязан к id → корректное поведение
      </p>
    </div>
  );
}

// Key как механизм сброса state
function KeyResetDemo() {
  const [userId, setUserId] = useState(1);
  const users = [
    { id: 1, name: "Alice", bio: "Frontend Engineer" },
    { id: 2, name: "Bob", bio: "Backend Engineer" },
    { id: 3, name: "Carol", bio: "Designer" },
  ];

  return (
    <div>
      <div className="btn-row" style={{ marginBottom: 8 }}>
        {users.map(u => (
          <button key={u.id} className={`btn${userId === u.id ? "" : " ghost"}`}
            style={{ fontSize: 12 }} onClick={() => setUserId(u.id)}>
            {u.name}
          </button>
        ))}
      </div>
      <UserProfileForm key={userId} user={users.find(u => u.id === userId)!} />
      <div className="code-block" style={{ marginTop: 10 }}>{`// key={userId} — при смене пользователя React полностью пересоздаёт форму
// Альтернатива useEffect для сброса: <UserForm key={userId} />
// Вместо: useEffect(() => { reset(user); }, [user.id]);`}</div>
    </div>
  );
}

function UserProfileForm({ user }: { user: { name: string; bio: string } }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ background: "#21262d", padding: 12, borderRadius: 6 }}>
      <div style={{ marginBottom: 6 }}>
        <label style={{ fontSize: 12, color: "var(--text-dim)" }}>Name</label>
        <input value={name} onChange={e => { setName(e.target.value); setSaved(false); }}
          style={{ display: "block", width: "100%", marginTop: 2 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: "var(--text-dim)" }}>Bio</label>
        <input value={bio} onChange={e => { setBio(e.target.value); setSaved(false); }}
          style={{ display: "block", width: "100%", marginTop: 2 }} />
      </div>
      <button className="btn" style={{ fontSize: 12 }} onClick={() => setSaved(true)}>
        Save
      </button>
      {saved && <span style={{ color: "var(--green)", fontSize: 12, marginLeft: 8 }}>✅ Saved</span>}
    </div>
  );
}
