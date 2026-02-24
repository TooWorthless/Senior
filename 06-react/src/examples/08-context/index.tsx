import { useState, createContext, useContext, useMemo, useCallback, useRef, type ReactNode } from "react";

// ─── Правильный паттерн: разделённые контексты ────
interface AuthUser { id: number; name: string; role: "admin" | "user" }
interface Theme { mode: "dark" | "light"; accent: string }

// 1. Data context
const AuthContext = createContext<AuthUser | null>(null);
// 2. Dispatch/actions context (ОТДЕЛЬНО от данных!)
const AuthDispatchContext = createContext<{
  login: (user: AuthUser) => void;
  logout: () => void;
} | null>(null);
// 3. Theme отдельно
const ThemeContext = createContext<Theme>({ mode: "dark", accent: "#3b82f6" });
const ThemeDispatchContext = createContext<(t: Partial<Theme>) => void>(() => {});

// ─── Custom hooks для доступа к context ───────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  // Можно не бросать ошибку, null = не авторизован
  return ctx;
}

export function useAuthDispatch() {
  const ctx = useContext(AuthDispatchContext);
  if (!ctx) throw new Error("useAuthDispatch requires AuthProvider");
  return ctx;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeDispatch() {
  return useContext(ThemeDispatchContext);
}

// ─── Провайдеры ───────────────────────────────────
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // ✅ Стабильный dispatch объект (useMemo)
  const dispatch = useMemo(() => ({
    login: (u: AuthUser) => setUser(u),
    logout: () => setUser(null),
  }), []); // setUser стабилен → пустой deps OK

  return (
    <AuthContext.Provider value={user}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>({ mode: "dark", accent: "#3b82f6" });
  const update = useCallback((t: Partial<Theme>) => setTheme(prev => ({ ...prev, ...t })), []);

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeDispatchContext.Provider value={update}>
        {children}
      </ThemeDispatchContext.Provider>
    </ThemeContext.Provider>
  );
}

// ─── Компоненты демонстрации ──────────────────────
function UserStatus() {
  const user = useAuth();
  const { login, logout } = useAuthDispatch();
  const renderCount = useRef(0);
  renderCount.current++;

  const mockUsers: AuthUser[] = [
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob", role: "user" },
  ];

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <strong>UserStatus</strong>
        <span style={{ fontSize: 11, color: "var(--amber)" }}>renders: {renderCount.current}</span>
      </div>
      {user ? (
        <div>
          <div style={{ marginBottom: 8 }}>
            <span className={`badge ${user.role === "admin" ? "purple" : "blue"}`}>{user.role}</span>
            <span style={{ marginLeft: 8, fontSize: 13 }}>{user.name}</span>
          </div>
          <button className="btn red" style={{ fontSize: 12 }} onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 8 }}>Не авторизован</div>
          <div className="btn-row">
            {mockUsers.map(u => (
              <button key={u.id} className="btn" style={{ fontSize: 12 }} onClick={() => login(u)}>
                Login as {u.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeControls() {
  const theme = useTheme();
  const updateTheme = useThemeDispatch();
  const renderCount = useRef(0);
  renderCount.current++;

  const ACCENTS = ["#3b82f6", "#22c55e", "#f59e0b", "#a78bfa", "#f87171"];

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <strong>ThemeControls</strong>
        <span style={{ fontSize: 11, color: "var(--amber)" }}>renders: {renderCount.current}</span>
      </div>
      <div className="btn-row" style={{ marginBottom: 8 }}>
        {(["dark", "light"] as const).map(mode => (
          <button key={mode}
            className={`btn${theme.mode === mode ? "" : " ghost"}`}
            style={{ fontSize: 12 }}
            onClick={() => updateTheme({ mode })}>
            {mode}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {ACCENTS.map(color => (
          <div key={color}
            onClick={() => updateTheme({ accent: color })}
            style={{
              width: 24, height: 24, borderRadius: "50%", background: color,
              cursor: "pointer", border: theme.accent === color ? "3px solid white" : "2px solid transparent",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ContentArea() {
  const user = useAuth();
  const theme = useTheme();
  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <div className="card" style={{ borderColor: theme.accent }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <strong>ContentArea</strong>
        <span style={{ fontSize: 11, color: "var(--amber)" }}>renders: {renderCount.current}</span>
      </div>
      <div style={{ fontSize: 13, color: theme.accent }}>
        {user ? `Привет, ${user.name}!` : "Пожалуйста, войдите"}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
        Theme: {theme.mode} | Accent: {theme.accent}
      </div>
    </div>
  );
}

export default function ContextApi() {
  return (
    <div className="example-page">
      <h1>08 · Context API</h1>
      <p className="subtitle">Правильный Context, split context, анти-паттерны</p>

      <div className="card">
        <h3>Анти-паттерны Context</h3>
        <div className="code-block">{`// ❌ 1. Один большой context для всего
const AppContext = createContext({ user, theme, cart, notifications, ... });
// → любое изменение → все подписчики ре-рендерятся

// ❌ 2. Нестабильный value объект
<MyContext.Provider value={{ count, setCount }}>
// Новый объект каждый рендер → все подписчики ре-рендерятся!

// ✅ Мемоизировать:
const value = useMemo(() => ({ count, setCount }), [count]);

// ❌ 3. Context вместо props для локальных данных
// Context для ГЛОБАЛЬНОГО состояния: auth, theme, locale
// Props для ЛОКАЛЬНОГО: кнопка, форма, список

// ❌ 4. Данные и dispatch в одном context
// При setUser → все читатели dispatch тоже ре-рендерятся
// ✅ Разделить: DataContext + DispatchContext

// ❌ 5. Использовать Context для часто меняющихся данных
// (mousemove, scroll) → постоянные ре-рендеры всех подписчиков
// ✅ useRef для мутации без ре-рендеров, или Zustand/Jotai`}</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 12 }}>
          Auth и Theme разделены — смена одного НЕ вызывает ре-рендер подписчиков другого:
        </p>
        <AuthProvider>
          <ThemeProvider>
            <div className="grid2">
              <UserStatus />
              <ThemeControls />
            </div>
            <div style={{ marginTop: 12 }}>
              <ContentArea />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </div>
    </div>
  );
}
