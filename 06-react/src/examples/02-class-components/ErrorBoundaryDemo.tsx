import { Component, type ErrorInfo, useState } from "react";

// ─── ErrorBoundary class component ───────────────
interface EBState { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }

class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  EBState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // Вызывается во время render при ошибке → обновить state
  static getDerivedStateFromError(error: Error): Partial<EBState> {
    return { hasError: true, error };
  }

  // Вызывается после render → логирование, Sentry
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
    // В production: Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ background: "#3d0f0f", border: "1px solid var(--red)", borderRadius: 8, padding: 16 }}>
          <div style={{ color: "var(--red)", fontWeight: "bold", marginBottom: 8 }}>
            💥 Что-то пошло не так
          </div>
          <div style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 12 }}>
            {this.state.error?.message}
          </div>
          <button className="btn red" style={{ fontSize: 12 }}
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}>
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Компонент который может бросить ошибку ──────
function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Намеренная ошибка для демонстрации ErrorBoundary");
  }
  return (
    <div style={{ background: "#1a4731", padding: 12, borderRadius: 6 }}>
      ✅ Компонент работает нормально
    </div>
  );
}

// ─── Демо ────────────────────────────────────────
export default function ErrorBoundaryDemo() {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [globalThrow, setGlobalThrow] = useState(false);

  return (
    <section style={{ marginTop: 16 }}>
      <h2>ErrorBoundary — единственный class в проекте</h2>

      <div className="card">
        <h3>Зачем ErrorBoundary?</h3>
        <div className="code-block">{`// Без ErrorBoundary:
// Ошибка в render → белый экран (весь app упал)

// С ErrorBoundary:
// Ошибка изолирована → только этот subtree показывает fallback
// Остальной UI продолжает работать

// Что перехватывает ErrorBoundary:
// ✅ Ошибки в render()
// ✅ Ошибки в lifecycle методах
// ✅ Ошибки в конструкторе дочерних компонентов

// Что НЕ перехватывает:
// ❌ Async ошибки (setTimeout, Promise, fetch)
// ❌ Event handlers (try/catch сам)
// ❌ Server-side rendering ошибки
// ❌ Ошибки в самом ErrorBoundary

// Hooks альтернатива для async:
// react-error-boundary: useErrorBoundary()`}</div>
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        {/* Изолированная ошибка */}
        <div className="card">
          <h3>Изолированная ошибка</h3>
          <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 10 }}>
            ErrorBoundary изолирует ошибку — соседние компоненты продолжают работать:
          </p>
          <button className="btn red" style={{ fontSize: 12, marginBottom: 10 }}
            onClick={() => setShouldThrow(v => !v)}>
            {shouldThrow ? "Исправить ошибку" : "Сломать компонент 💥"}
          </button>
          <div className="grid2">
            <ErrorBoundary>
              <BuggyComponent shouldThrow={shouldThrow} />
            </ErrorBoundary>
            <div style={{ background: "#21262d", padding: 12, borderRadius: 6, fontSize: 13 }}>
              ✅ Этот компонент не пострадал
            </div>
          </div>
        </div>

        {/* Вложенные границы */}
        <div className="card">
          <h3>Вложенные ErrorBoundary</h3>
          <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 10 }}>
            Гранулярная защита: разные fallback на разных уровнях:
          </p>
          <ErrorBoundary fallback={
            <div style={{ color: "var(--red)", fontSize: 12, padding: 8 }}>
              🔴 Внешняя граница сработала
            </div>
          }>
            <div style={{ border: "1px solid var(--border)", padding: 10, borderRadius: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Outer boundary</span>
              <ErrorBoundary fallback={
                <div style={{ color: "var(--amber)", fontSize: 12, padding: 8 }}>
                  🟡 Внутренняя граница (ближайшая)
                </div>
              }>
                <div style={{ margin: "8px 0" }}>
                  <BuggyComponent shouldThrow={globalThrow} />
                </div>
              </ErrorBoundary>
            </div>
          </ErrorBoundary>
          <button className="btn red" style={{ fontSize: 12, marginTop: 8 }}
            onClick={() => setGlobalThrow(v => !v)}>
            {globalThrow ? "Исправить" : "Сломать 💥"}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Паттерн: ErrorBoundary в реальных проектах</h3>
        <div className="code-block">{`// Типичная структура:
function App() {
  return (
    // Глобальная граница — последний рубеж
    <ErrorBoundary fallback={<GlobalErrorPage />}>
      <Router>
        {/* Граница на уровне роута — изолирует страницы */}
        <ErrorBoundary fallback={<PageError />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={
              <Dashboard>
                {/* Граница для виджетов — самая гранулярная */}
                <ErrorBoundary fallback={<WidgetError />}>
                  <RevenueWidget />
                </ErrorBoundary>
              </Dashboard>
            } />
          </Routes>
        </ErrorBoundary>
      </Router>
    </ErrorBoundary>
  );
}

// react-error-boundary для async:
import { useErrorBoundary } from "react-error-boundary";

function AsyncComponent() {
  const { showBoundary } = useErrorBoundary();
  
  const handleClick = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      showBoundary(error); // пробросить в ближайший ErrorBoundary
    }
  };
}`}</div>
      </div>
    </section>
  );
}
