import { Component, PureComponent } from "react";

interface State {
  count: number;
  mounted: boolean;
  log: string[];
}

export default class LifecycleDemo extends Component<Record<string, never>, State> {
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(props: Record<string, never>) {
    super(props);
    this.state = { count: 0, mounted: true, log: [] };
    this.addLog("constructor()");
  }

  addLog(msg: string) {
    const ts = new Date().toISOString().slice(11, 19);
    this.setState(prev => ({
      log: [`[${ts}] ${msg}`, ...prev.log.slice(0, 14)],
    }));
  }

  componentDidMount() {
    this.addLog("componentDidMount() — DOM готов, можно fetch/subscribe");
    this.interval = setInterval(() => {
      // Намеренно не вызываем addLog чтобы не засорять
    }, 5000);
  }

  componentDidUpdate(prevProps: Record<string, never>, prevState: State) {
    if (prevState.count !== this.state.count) {
      this.addLog(`componentDidUpdate() — count: ${prevState.count} → ${this.state.count}`);
    }
  }

  componentWillUnmount() {
    this.addLog("componentWillUnmount() — cleanup subscriptions!");
    if (this.interval) clearInterval(this.interval);
  }

  shouldComponentUpdate(nextProps: Record<string, never>, nextState: State) {
    // Оптимизация: не перерендеривать если count не изменился
    if (nextState.count === this.state.count && nextState.log === this.state.log) {
      return false;
    }
    return true;
  }

  render() {
    return (
      <section style={{ marginTop: 16 }}>
        <h2>Class Component Lifecycle</h2>

        <div className="grid2">
          {/* Демо */}
          <div className="card">
            <h3>Живой пример</h3>
            <div className="counter-display" style={{ fontSize: 36 }}>{this.state.count}</div>
            <div className="btn-row" style={{ justifyContent: "center" }}>
              <button className="btn" onClick={() => this.setState(s => ({ count: s.count + 1 }))}>+1</button>
              <button className="btn red" onClick={() => this.setState(s => ({ count: s.count - 1 }))}>-1</button>
              <button className="btn ghost" onClick={() => this.setState({ log: [] })}>Clear log</button>
            </div>
          </div>

          {/* Log */}
          <div className="card">
            <h3>Lifecycle log</h3>
            <div className="log-box">
              {this.state.log.map((entry, i) => (
                <div key={i} className={`log-entry ${
                  entry.includes("Mount") ? "ok" :
                  entry.includes("Unmount") ? "err" :
                  entry.includes("Update") ? "info" : ""
                }`}>{entry}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Схема */}
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Полная схема жизненного цикла</h3>
          <div className="code-block">{`// ══════════════ MOUNTING ═══════════════
constructor(props)
  → Инициализация state, bind методов

static getDerivedStateFromProps(props, state)
  → Синхронное обновление state из props (редко)

render()
  → Чистая функция, возвращает JSX

componentDidMount()
  → DOM готов: fetch, subscribe, setInterval

// ══════════════ UPDATING ════════════════
static getDerivedStateFromProps(props, state)

shouldComponentUpdate(nextProps, nextState) → boolean
  → Оптимизация: false = пропустить рендер
  → PureComponent делает shallow compare автоматически

render()

getSnapshotBeforeUpdate(prevProps, prevState)
  → Читаем DOM ДО обновления (напр. позицию скролла)
  → Возвращает snapshot → передаётся в componentDidUpdate

componentDidUpdate(prevProps, prevState, snapshot)
  → DOM обновлён: синхронизация, дополнительные запросы

// ══════════════ UNMOUNTING ══════════════
componentWillUnmount()
  → Cleanup: clearInterval, unsubscribe, cancel fetch

// ══════════════ ERROR HANDLING ══════════
static getDerivedStateFromError(error)
  → Вернуть fallback state при ошибке в потомке

componentDidCatch(error, info)
  → Логирование ошибки (Sentry и т.д.)`}</div>
        </div>

        <PureComponentDemo />
      </section>
    );
  }
}

// PureComponent демо
interface PCState { count: number; obj: { value: number } }
class PureComponentDemo extends PureComponent<Record<string, never>, PCState> {
  renderCount = 0;

  constructor(props: Record<string, never>) {
    super(props);
    this.state = { count: 0, obj: { value: 0 } };
  }

  render() {
    this.renderCount++;
    return (
      <div className="card" style={{ marginTop: 12 }}>
        <h3>PureComponent vs Component</h3>
        <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 10 }}>
          PureComponent делает shallow compare в shouldComponentUpdate.
          Рендеров: <strong style={{ color: "var(--amber)" }}>{this.renderCount}</strong>
        </p>
        <div className="btn-row">
          <button className="btn" style={{ fontSize: 12 }}
            onClick={() => this.setState(s => ({ count: s.count + 1 }))}>
            Изменить count (re-render)
          </button>
          <button className="btn ghost" style={{ fontSize: 12 }}
            onClick={() => this.setState(s => ({ count: s.count }))}>
            Тот же count (нет re-render)
          </button>
          <button className="btn ghost" style={{ fontSize: 12 }}
            onClick={() => this.setState(s => ({ obj: s.obj }))}>
            Тот же obj (нет re-render)
          </button>
          <button className="btn red" style={{ fontSize: 12 }}
            onClick={() => this.setState({ obj: { value: 1 } })}>
            Новый obj (re-render!)
          </button>
        </div>
        <div className="highlight warn" style={{ marginTop: 8 }}>
          PureComponent использует <strong>shallow compare</strong> — мутация объекта НЕ вызовет re-render!
          Всегда создавай новый объект при обновлении.
        </div>
      </div>
    );
  }
}
