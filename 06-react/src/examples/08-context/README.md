# 08 · Context API

[← Назад](../../../README.md)

---

## Содержание

- [Когда использовать Context](#когда-использовать-context)
- [Анатомия Context](#анатомия-context)
- [Split Context паттерн](#split-context-паттерн)
- [Мемоизация value](#мемоизация-value)
- [Custom hooks как API](#custom-hooks-как-api)
- [Context vs State Manager](#context-vs-state-manager)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## Когда использовать Context

```
✅ Context для:
- Auth (текущий пользователь, роль, токен)
- Theme (темная/светлая тема, accent цвет)
- Locale (язык, форматы дат, переводы)
- Глобальные конфигурации (feature flags)
- Корзина покупок (несколько уровней компонентов)

❌ Context НЕ для:
- Данных которые меняются часто (mousemove, scroll, real-time)
- Локального state компонента (нет смысла поднимать)
- Данных для 1-2 уровней дерева (используй props)
- Кеша запросов (используй React Query / SWR)
```

**Правило:** если нужно передать данные через 2+ уровня и они нужны многим компонентам — Context. Если 1-2 уровня — props drilling нормален.

---

## Анатомия Context

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

// 1. Создание контекста с типом и дефолтным значением
interface ThemeContextType {
  mode: "dark" | "light";
  setMode: (mode: "dark" | "light") => void;
}

// Дефолтное значение используется только если нет Provider выше
const ThemeContext = createContext<ThemeContextType>({
  mode: "dark",
  setMode: () => {}, // no-op — не ошибка, но предупреждает что Provider нет
});

// 2. Provider — предоставляет значение
function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"dark" | "light">("dark");

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Consumer через useContext
function ThemeButton() {
  const { mode, setMode } = useContext(ThemeContext);
  return (
    <button onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
      {mode === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
```

---

## Split Context паттерн

**Проблема:** один большой Context → все подписчики ре-рендерятся при любом изменении.

```tsx
// ❌ Монолитный Context:
const AppContext = createContext<{
  user: User;
  theme: Theme;
  cart: CartItem[];
  notifications: Notification[];
}>(/* ... */);

// Изменился cart → ре-рендерятся ВСЕ: Header, ThemeButton, UserAvatar, etc.
```

```tsx
// ✅ Split Context:

// Data (state)
const AuthContext = createContext<User | null>(null);
// Actions (dispatch) — отдельно!
const AuthDispatchContext = createContext<{
  login: (user: User) => void;
  logout: () => void;
} | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // dispatch мемоизирован отдельно → не зависит от user
  const dispatch = useMemo(() => ({
    login: (u: User) => setUser(u),
    logout: () => setUser(null),
  }), []); // setUser стабилен → [] OK

  return (
    <AuthContext.Provider value={user}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
}

// Теперь:
// Компонент только читающий user:
const user = useContext(AuthContext); // ре-рендерится только при смене user

// Компонент только вызывающий login/logout:
const { login } = useContext(AuthDispatchContext); // НЕ ре-рендерится при смене user!
```

---

## Мемоизация value

```tsx
// ❌ Нестабильный value — новый объект каждый рендер
function Provider({ children }) {
  const [count, setCount] = useState(0);
  return (
    <MyContext.Provider value={{ count, setCount }}>
      {/* Каждый рендер Provider → новый value объект → все потребители ре-рендерятся */}
      {children}
    </MyContext.Provider>
  );
}

// ✅ Мемоизировать value:
function Provider({ children }) {
  const [count, setCount] = useState(0);
  const value = useMemo(() => ({ count, setCount }), [count]);
  // setCount стабилен → value меняется только при изменении count
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

// ✅ Или split: Data + Dispatch отдельно (см. выше)
```

---

## Custom hooks как API

Оборачивать `useContext` в custom hook — best practice:

```tsx
// ✅ Инкапсуляция + валидация + типы:
export function useAuth(): User | null {
  return useContext(AuthContext);
}

export function useAuthActions() {
  const ctx = useContext(AuthDispatchContext);
  if (!ctx) {
    throw new Error("useAuthActions must be used within AuthProvider");
    // Понятная ошибка вместо "Cannot read property 'login' of undefined"
  }
  return ctx;
}

// Использование:
function Header() {
  const user = useAuth(); // null → не авторизован
  const { logout } = useAuthActions();
  // ...
}

// Можно добавлять производные:
export function useIsAdmin() {
  const user = useAuth();
  return user?.role === "admin";
}

export function usePermissions() {
  const user = useAuth();
  return {
    canEdit: user?.role === "admin" || user?.role === "editor",
    canDelete: user?.role === "admin",
    canView: user !== null,
  };
}
```

---

## Context vs State Manager

| Критерий | Context | Zustand / Jotai | Redux |
|----------|---------|-----------------|-------|
| Сложность setup | Низкая | Средняя | Высокая |
| Performance | ⚠️ Без оптимизации | ✅ Selector-based | ✅ Selector-based |
| DevTools | ❌ | ✅ | ✅ Отличные |
| Middleware | ❌ | ✅ | ✅ |
| Серверное состояние | ❌ | ❌ | Частично |
| Лучше для | Auth, Theme, Config | Клиентский UI state | Сложные приложения |

```tsx
// Context достаточен для:
// - Простой auth (login/logout)
// - Темы приложения
// - Локализации

// Zustand/Jotai когда:
// - Много глобального state меняется часто
// - Нужны селекторы (подписка на часть state)
// - Несколько не связанных куска state

// Redux когда:
// - Большая команда (строгие конвенции)
// - Нужен time-travel debugging
// - Сложная логика middleware (analytics, saga, thunk)
// - Много связанных переходов state

// TanStack Query вместо Context для серверного state:
// НЕ храни данные с сервера в Context/Redux — это работа для Query Cache
```

---

## Вопросы на интервью

### 1. Почему нужно разделять Data и Dispatch на разные контексты?

Если `data` и `dispatch` в одном контексте — при изменении данных (user, theme) ре-рендерятся и компоненты которые только вызывают `dispatch` (кнопка logout). Разделение: компонент подписывается **только на нужный** контекст. `dispatch` функции стабильны (или мемоизированы через `useMemo`) → не вызывают лишних ре-рендеров.

### 2. Как мемоизировать Context value?

Два способа: `useMemo(() => ({ data, handler }), [data])` — мемоизировать объект value. Или split контекст: Data (меняется) и Dispatch (стабильный `useMemo(() => ({login, logout}), [])`) в отдельных провайдерах.

### 3. Почему memo не спасает от Context?

`React.memo` делает shallow compare **props**. При изменении Context → React перерендеривает все компоненты подписанные через `useContext(MyContext)` независимо от memo. Это не props — это подписка. Решение: split Context или selector-based подписки (Zustand/Jotai).

### 4. Когда Context vs Zustand/Redux?

**Context:** простое глобальное состояние с низкой частотой обновлений (auth, theme, locale). **Zustand/Jotai:** UI state который меняется часто, нужны селекторы для производительности. **Redux:** большие команды, строгие конвенции, сложная логика, time-travel debugging.

---

## Ловушки

```tsx
// ❌ 1. Один большой Context
const AppContext = createContext({ user, theme, cart, ui, ... });
// Любое изменение → все ре-рендерятся

// ❌ 2. Нестабильный value
<Context.Provider value={{ count, onIncrement: () => setCount(c => c + 1) }}>
// Новая функция каждый рендер → все потребители ре-рендерятся

// ❌ 3. Context для часто меняющихся данных
const MouseContext = createContext({ x: 0, y: 0 });
// mousemove → десятки обновлений в секунду → весь tree ре-рендерится

// ❌ 4. useContext вне Provider (получишь дефолтное значение вместо ошибки)
function Component() {
  const { login } = useContext(AuthContext); // получит дефолтный no-op!
}
// ✅ Кидать ошибку в custom hook:
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("Must be inside AuthProvider");
  return ctx;
}

// ❌ 5. Хранить серверные данные в Context
const UserContext = createContext(null);
// При рефетче — нужно вручную инвалидировать, кешировать, обрабатывать loading
// ✅ TanStack Query / SWR для серверного state
```
