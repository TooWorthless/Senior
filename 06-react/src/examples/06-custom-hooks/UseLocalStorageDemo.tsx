import { useLocalStorage } from "./hooks";

interface Settings { theme: "dark" | "light"; fontSize: number; notifications: boolean }

export default function UseLocalStorageDemo() {
  const [settings, setSettings, removeSettings] = useLocalStorage<Settings>(
    "app-settings",
    { theme: "dark", fontSize: 14, notifications: true }
  );

  const [notes, setNotes, removeNotes] = useLocalStorage<string>("notes", "");

  return (
    <section style={{ marginTop: 16 }}>
      <h2>useLocalStorage</h2>

      <div className="card">
        <h3>Реализация</h3>
        <div className="code-block">{`function useLocalStorage<T>(key: string, initialValue: T) {
  // Lazy initializer — читаем localStorage только при mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    const toStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(toStore);
    localStorage.setItem(key, JSON.stringify(toStore));
  }, [key, storedValue]);

  return [storedValue, setValue, removeValue] as const;
}`}</div>
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        {/* Settings */}
        <div className="card">
          <h3>Settings (persist)</h3>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: "var(--text-dim)" }}>Theme</label>
            <div className="btn-row" style={{ marginTop: 4 }}>
              {(["dark", "light"] as const).map(theme => (
                <button key={theme}
                  className={`btn${settings.theme === theme ? "" : " ghost"}`}
                  style={{ fontSize: 12 }}
                  onClick={() => setSettings(s => ({ ...s, theme }))}>
                  {theme}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: "var(--text-dim)" }}>
              Font size: {settings.fontSize}px
            </label>
            <input type="range" min={10} max={24} value={settings.fontSize}
              onChange={e => setSettings(s => ({ ...s, fontSize: +e.target.value }))}
              style={{ width: "100%", marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" id="notif" checked={settings.notifications}
              onChange={e => setSettings(s => ({ ...s, notifications: e.target.checked }))} />
            <label htmlFor="notif" style={{ fontSize: 12, cursor: "pointer" }}>
              Notifications
            </label>
          </div>
          <button className="btn red" style={{ fontSize: 12 }} onClick={removeSettings}>
            Reset settings
          </button>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-dim)" }}>
            Обнови страницу — настройки сохранятся в localStorage
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h3>Notes (persist)</h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Напиши заметку — она сохранится..."
            style={{ width: "100%", height: 120, resize: "vertical", marginBottom: 8, fontSize: settings.fontSize }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
              {notes.length} chars
            </span>
            <button className="btn red" style={{ fontSize: 12, marginLeft: "auto" }}
              onClick={removeNotes}>
              Clear
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-dim)" }}>
            Также сохраняется при обновлении страницы
          </div>
        </div>
      </div>
    </section>
  );
}
