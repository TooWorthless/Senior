import { useState, useEffect } from "react";
import { useDebounce, useThrottle } from "./hooks";

interface User { id: number; name: string; email: string }

export default function UseDebounceDemo() {
  const [query, setQuery] = useState("");
  const [throttleInput, setThrottleInput] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [callCount, setCallCount] = useState(0);
  const [debouncedCount, setDebouncedCount] = useState(0);

  const debounced = useDebounce(query, 400);
  const throttled = useThrottle(throttleInput, 500);

  // Simulate search API call
  useEffect(() => {
    if (!debounced.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setDebouncedCount(c => c + 1);
    const timer = setTimeout(() => {
      const allUsers: User[] = [
        { id: 1, name: "Alice Johnson", email: "alice@example.com" },
        { id: 2, name: "Bob Smith", email: "bob@example.com" },
        { id: 3, name: "Carol Williams", email: "carol@example.com" },
        { id: 4, name: "Dave Brown", email: "dave@example.com" },
        { id: 5, name: "Eve Davis", email: "eve@example.com" },
      ];
      const results = allUsers.filter(u =>
        u.name.toLowerCase().includes(debounced.toLowerCase()) ||
        u.email.toLowerCase().includes(debounced.toLowerCase())
      );
      setSearchResults(results);
      setSearching(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [debounced]);

  return (
    <section style={{ marginTop: 16 }}>
      <h2>useDebounce & useThrottle</h2>

      <div className="card">
        <h3>Разница debounce vs throttle</h3>
        <div className="code-block">{`// Debounce: задерживает выполнение до тех пор пока не прекратится ввод
// Каждый новый ввод СБРАСЫВАЕТ таймер
// Применение: поиск, автосохранение, resize handler

// Throttle: гарантирует не чаще чем раз в N ms
// Таймер НЕ сбрасывается при новых вызовах
// Применение: scroll events, mousemove, rate limiting API calls

input: A → B → C → D → E (быстро)
debounce (300ms): ......................E  (только финальное)
throttle (300ms): A....D....E           (каждые 300ms)`}</div>
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        {/* Debounce search */}
        <div className="card">
          <h3>useDebounce — поиск</h3>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setCallCount(c => c + 1); }}
            placeholder="Поиск пользователей..."
            style={{ width: "100%", marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-dim)", marginBottom: 8 }}>
            <span>Нажатий: <strong style={{ color: "var(--amber)" }}>{callCount}</strong></span>
            <span>API вызовов: <strong style={{ color: "var(--green)" }}>{debouncedCount}</strong></span>
            <span>Debounced: <strong style={{ color: "var(--blue)" }}>"{debounced}"</strong></span>
          </div>
          {searching && <div style={{ color: "var(--amber)", fontSize: 12 }}>⏳ Поиск...</div>}
          {searchResults.map(user => (
            <div key={user.id} style={{ padding: "6px 8px", background: "#21262d", borderRadius: 4, marginBottom: 4, fontSize: 12 }}>
              <div style={{ color: "var(--text)" }}>{user.name}</div>
              <div style={{ color: "var(--text-dim)" }}>{user.email}</div>
            </div>
          ))}
          {debounced && !searching && searchResults.length === 0 && (
            <div style={{ color: "var(--text-dim)", fontSize: 12 }}>Не найдено</div>
          )}
        </div>

        {/* Throttle */}
        <div className="card">
          <h3>useThrottle — rate limiting</h3>
          <input
            value={throttleInput}
            onChange={e => setThrottleInput(e.target.value)}
            placeholder="Быстро пиши здесь..."
            style={{ width: "100%", marginBottom: 8 }}
          />
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            <div style={{ color: "var(--text-dim)" }}>Raw: <strong style={{ color: "var(--text)" }}>{throttleInput}</strong></div>
            <div style={{ color: "var(--text-dim)", marginTop: 4 }}>Throttled (500ms): <strong style={{ color: "var(--blue)" }}>{throttled}</strong></div>
          </div>
          <div className="code-block" style={{ fontSize: 11, marginTop: 8 }}>{`// useThrottle реализация:
const lastUpdated = useRef<number>(0);

useEffect(() => {
  const now = Date.now();
  if (now - lastUpdated.current >= interval) {
    lastUpdated.current = now;
    setThrottled(value);
  } else {
    const timer = setTimeout(() => {
      lastUpdated.current = Date.now();
      setThrottled(value);
    }, interval - (now - lastUpdated.current));
    return () => clearTimeout(timer);
  }
}, [value, interval]);`}</div>
        </div>
      </div>
    </section>
  );
}
