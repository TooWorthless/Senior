import { useState, type ComponentType } from "react";

// ─── HOC (Higher-Order Component) ─────────────────
// Функция, принимающая компонент и возвращающая новый компонент

// 1. withLoading — добавляет состояние загрузки
function withLoading<P extends object>(
  WrappedComponent: ComponentType<P>,
  loadingMessage = "Loading..."
) {
  function WithLoading({ isLoading, ...props }: { isLoading: boolean } & P) {
    if (isLoading) {
      return (
        <div style={{ padding: 16, textAlign: "center", color: "var(--amber)", fontSize: 13 }}>
          ⏳ {loadingMessage}
        </div>
      );
    }
    return <WrappedComponent {...(props as P)} />;
  }
  WithLoading.displayName = `withLoading(${WrappedComponent.displayName ?? WrappedComponent.name})`;
  return WithLoading;
}

// 2. withErrorBoundary-like behavior
function withRetry<P extends object>(WrappedComponent: ComponentType<P>, maxRetries = 3) {
  function WithRetry(props: P) {
    const [retryCount, setRetryCount] = useState(0);
    const [failed, setFailed] = useState(false);

    if (failed) {
      return (
        <div style={{ background: "#3d0f0f", padding: 12, borderRadius: 6 }}>
          <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 8 }}>
            Компонент упал после {maxRetries} попыток
          </div>
          <button className="btn ghost" style={{ fontSize: 12 }}
            onClick={() => { setFailed(false); setRetryCount(0); }}>
            Сбросить
          </button>
        </div>
      );
    }

    return (
      <div>
        {retryCount > 0 && (
          <div style={{ fontSize: 11, color: "var(--amber)", marginBottom: 6 }}>
            Попытка {retryCount + 1}/{maxRetries}
          </div>
        )}
        <div onClick={() => {
          if (retryCount < maxRetries - 1) setRetryCount(c => c + 1);
          else setFailed(true);
        }}>
          <WrappedComponent {...props} />
        </div>
      </div>
    );
  }
  WithRetry.displayName = `withRetry(${WrappedComponent.displayName ?? WrappedComponent.name})`;
  return WithRetry;
}

// 3. withAuth — проверка прав
type Role = "admin" | "user";
function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredRole: Role = "user"
) {
  function WithAuth({ currentRole, ...props }: { currentRole: Role | null } & P) {
    if (!currentRole) {
      return <div style={{ color: "var(--text-dim)", fontSize: 13 }}>🔒 Требуется авторизация</div>;
    }
    if (requiredRole === "admin" && currentRole !== "admin") {
      return <div style={{ color: "var(--red)", fontSize: 13 }}>⛔ Недостаточно прав (требуется admin)</div>;
    }
    return <WrappedComponent {...(props as P)} />;
  }
  WithAuth.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name})`;
  return WithAuth;
}

// ─── Базовые компоненты ───────────────────────────
function UserCard({ name, email }: { name: string; email: string }) {
  return (
    <div style={{ background: "#21262d", padding: 12, borderRadius: 6, fontSize: 13 }}>
      <div style={{ color: "var(--blue)", fontWeight: "bold" }}>{name}</div>
      <div style={{ color: "var(--text-dim)" }}>{email}</div>
    </div>
  );
}

function AdminPanel() {
  return (
    <div style={{ background: "#2a1f00", padding: 12, borderRadius: 6, fontSize: 13, color: "var(--amber)" }}>
      🔐 Секретная панель администратора
    </div>
  );
}

// ─── Применяем HOC ────────────────────────────────
const UserCardWithLoading = withLoading(UserCard, "Загружаем профиль...");
const AdminPanelWithAuth = withAuth(AdminPanel, "admin");

export default function HOCDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  return (
    <section>
      <h2>Higher-Order Components</h2>

      <div className="card">
        <h3>HOC — концепция</h3>
        <div className="code-block">{`// HOC = функция Component → Component
// Добавляет поведение без изменения оригинального компонента

function withLoading<P>(Component: ComponentType<P>) {
  return function WithLoading({ isLoading, ...props }: { isLoading: boolean } & P) {
    if (isLoading) return <Spinner />;
    return <Component {...props as P} />;
  };
}

const UserCardWithLoading = withLoading(UserCard);
// Использование:
<UserCardWithLoading isLoading={loading} name="Alice" email="..." />

// Важно: displayName для DevTools
WithLoading.displayName = \`withLoading(\${Component.displayName})\`;

// HOC vs Custom Hook vs Render Prop:
// HOC     → добавить поведение к существующему компоненту (обёртка)
// Hook    → переиспользовать логику без изменения UI структуры
// Render Prop → когда нужен контроль над тем ЧТО рендерить

// В современном React (2023+):
// Hooks → предпочтительны для логики
// HOC → легаси, или когда нужна обёртка (forwardRef, ErrorBoundary)`}</div>
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="card">
          <h3>withLoading HOC</h3>
          <div className="btn-row" style={{ marginBottom: 8 }}>
            <button className="btn" style={{ fontSize: 12 }}
              onClick={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 1500); }}>
              Simulate fetch
            </button>
          </div>
          <UserCardWithLoading
            isLoading={isLoading}
            name="Alice Johnson"
            email="alice@example.com"
          />
        </div>

        <div className="card">
          <h3>withAuth HOC</h3>
          <div className="btn-row" style={{ marginBottom: 8 }}>
            <button className={`btn${!role ? "" : " ghost"}`} style={{ fontSize: 12 }}
              onClick={() => setRole(null)}>No auth</button>
            <button className={`btn${role === "user" ? "" : " ghost"}`} style={{ fontSize: 12 }}
              onClick={() => setRole("user")}>User</button>
            <button className={`btn${role === "admin" ? "" : " ghost"}`} style={{ fontSize: 12 }}
              onClick={() => setRole("admin")}>Admin</button>
          </div>
          <AdminPanelWithAuth currentRole={role} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>HOC композиция</h3>
        <div className="code-block">{`// Несколько HOC:
const EnhancedComponent = withAuth(withLoading(withRetry(UserCard)));

// Или через compose (как в Redux connect):
const enhance = compose(withAuth, withLoading, withRetry);
const EnhancedComponent = enhance(UserCard);

// ⚠️ Проблемы HOC:
// 1. Props collision — два HOC могут иметь одинаковые props
// 2. Props drilling — пропсы HOC "засоряют" компонент
// 3. Wrapper hell — глубокая вложенность в DevTools
// 4. Статические методы теряются — нужен hoist-non-react-statics

// ✅ Решение: Custom Hooks (2019+)
// Та же логика без обёрток:
function UserCardEnhanced({ userId }) {
  const auth = useAuth();
  const { data, loading } = useFetch(\`/users/\${userId}\`);
  if (!auth.isAuthorized) return <Unauthorized />;
  if (loading) return <Loading />;
  return <UserCard {...data} />;
}`}</div>
      </div>
    </section>
  );
}
