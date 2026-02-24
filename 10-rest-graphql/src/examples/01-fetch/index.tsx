import { useState, useEffect, useRef, useCallback } from "react";

// ─── Типы ──────────────────────────────────────────────────────────────────
interface Post  { id: number; title: string; body: string; userId: number }
interface User  { id: number; name: string; email: string; username: string }
interface Todo  { id: number; title: string; completed: boolean; userId: number }

// ─── HTTP-клиент поверх fetch ──────────────────────────────────────────────
interface FetchOptions extends RequestInit {
  timeout?: number;
}

class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message ?? `HTTP ${status}: ${statusText}`);
    this.name = "HttpError";
  }
}

async function request<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = 10_000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("Timeout")), timeout);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: fetchOptions.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new HttpError(res.status, res.statusText, body || undefined);
    }

    // 204 No Content
    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request was aborted or timed out");
    }
    throw err;
  }
}

const api = {
  get:    <T>(url: string, opts?: FetchOptions) => request<T>(url, { ...opts, method: "GET" }),
  post:   <T>(url: string, body: unknown, opts?: FetchOptions) =>
    request<T>(url, { ...opts, method: "POST", body: JSON.stringify(body) }),
  put:    <T>(url: string, body: unknown, opts?: FetchOptions) =>
    request<T>(url, { ...opts, method: "PUT", body: JSON.stringify(body) }),
  patch:  <T>(url: string, body: unknown, opts?: FetchOptions) =>
    request<T>(url, { ...opts, method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(url: string, opts?: FetchOptions) =>
    request<T>(url, { ...opts, method: "DELETE" }),
};

// ─── useFetch hook (общий) ────────────────────────────────────────────────
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: number | null;
}

function useFetch<T>(url: string | null) {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: false, error: null, status: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return;
    let ignore = false;
    setState(s => ({ ...s, loading: true, error: null }));

    fetch(url)
      .then(async res => {
        const data = await res.json() as T;
        if (!ignore) setState({ data, loading: false, error: null, status: res.status });
      })
      .catch(err => {
        if (!ignore) setState(s => ({ ...s, loading: false, error: err instanceof Error ? err.message : String(err) }));
      });

    return () => { ignore = true; };
  }, [url, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);
  return { ...state, refetch };
}

// ─── Компоненты ────────────────────────────────────────────────────────────

// Tab switcher
type Tab = "basics" | "abort" | "client" | "errors";

export default function FetchDemo() {
  const [tab, setTab] = useState<Tab>("basics");

  return (
    <div className="example-page">
      <h1>01 · fetch API</h1>
      <p className="subtitle">
        AbortController, timeout, error hierarchy, типобезопасный HTTP-клиент
      </p>

      <div className="btn-row">
        {(["basics", "abort", "client", "errors"] as Tab[]).map(t => (
          <button key={t} className={`btn ${tab === t ? "btn-active" : "btn-ghost"}`}
            onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "basics" && <BasicsTab />}
      {tab === "abort"  && <AbortTab />}
      {tab === "client" && <ClientTab />}
      {tab === "errors" && <ErrorsTab />}
    </div>
  );
}

// ─── Basics ───────────────────────────────────────────────────────────────
function BasicsTab() {
  const { data: posts, loading, error, refetch } = useFetch<Post[]>(
    "https://jsonplaceholder.typicode.com/posts?_limit=5"
  );

  return (
    <div>
      <div className="card">
        <div className="card-title">fetch API — основы</div>
        <pre className="code-block">{`// Полная типобезопасная обёртка:
async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new HttpError(res.status, res.statusText);
  return res.json() as Promise<T>;
}

// useFetch hook с race condition prevention:
function useFetch<T>(url: string | null) {
  const [state, setState] = useState({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!url) return;
    let ignore = false; // ← race condition guard

    fetch(url)
      .then(res => res.json())
      .then(data => { if (!ignore) setState({ data, loading: false, error: null }); })
      .catch(err => { if (!ignore) setState(s => ({ ...s, error: err.message })); });

    return () => { ignore = true; }; // ← cleanup
  }, [url]);
}

// Все HTTP методы:
fetch(url, { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } })
fetch(url, { method: "PUT",   body: JSON.stringify(data), headers: { "Content-Type": "application/json" } })
fetch(url, { method: "PATCH", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } })
fetch(url, { method: "DELETE" })`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={refetch}>Refetch</button>
        <span style={{ color: "var(--text-dim)", fontSize: 13, alignSelf: "center" }}>
          JSONPlaceholder · /posts?_limit=5
        </span>
      </div>

      {loading && <div className="badge badge-warning">⏳ Loading...</div>}
      {error   && <div className="badge badge-error">❌ {error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {posts?.map(post => (
          <div key={post.id} className="card" style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: "var(--text-dim)", fontFamily: "monospace", fontSize: 11, minWidth: 28 }}>
                #{post.id}
              </span>
              <span style={{ fontSize: 13, color: "var(--text)" }}>{post.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Abort ────────────────────────────────────────────────────────────────
function AbortTab() {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const addLog = (msg: string) => setLog(l => [`${new Date().toLocaleTimeString()} — ${msg}`, ...l]);

  const startSlow = async () => {
    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setLoading(true);
    addLog("Запрос начат (JSONPlaceholder /posts)");
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
        signal: ctrl.signal,
      });
      const data = await res.json() as Post[];
      addLog(`✅ Получено ${data.length} постов`);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") addLog("🛑 Запрос отменён (AbortError)");
        else addLog(`❌ Ошибка: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const abort = () => {
    controllerRef.current?.abort();
    addLog("🛑 abort() вызван");
  };

  const timeoutDemo = async () => {
    addLog("Запрос с timeout 1мс (должен прерваться)");
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(new Error("Timeout after 1ms")), 1);
    try {
      await fetch("https://jsonplaceholder.typicode.com/posts", { signal: ctrl.signal });
      addLog("✅ Успех (неожиданно)");
    } catch (err) {
      clearTimeout(id);
      addLog(`🛑 ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">AbortController — отмена запросов</div>
        <pre className="code-block">{`// AbortController — Web API, работает в браузере и Node 18+
const controller = new AbortController();

fetch(url, { signal: controller.signal })
  .then(res => res.json())
  .catch(err => {
    if (err.name === "AbortError") {
      console.log("Запрос отменён");
    }
  });

// Отменить:
controller.abort();
controller.abort(new Error("User navigated away")); // с причиной

// Timeout через AbortSignal.timeout (современный):
fetch(url, { signal: AbortSignal.timeout(5000) });

// Timeout + manual abort (совмещение):
const ctrl = new AbortController();
const id = setTimeout(() => ctrl.abort(new Error("Timeout")), 5000);
fetch(url, { signal: ctrl.signal })
  .finally(() => clearTimeout(id));

// В useEffect — cleanup:
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then(...);
  return () => ctrl.abort(); // ← cleanup при unmount или deps change
}, [url]);`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={startSlow} disabled={loading}>
          {loading ? "⏳ Fetching..." : "Начать запрос"}
        </button>
        <button className="btn btn-danger" onClick={abort} disabled={!loading}>
          Abort
        </button>
        <button className="btn btn-ghost" onClick={timeoutDemo}>
          Timeout demo
        </button>
        <button className="btn btn-ghost" onClick={() => setLog([])}>
          Clear
        </button>
      </div>

      <div className="card" style={{ fontFamily: "monospace", fontSize: 12, minHeight: 120 }}>
        {log.length === 0
          ? <span style={{ color: "var(--text-dim)" }}>Лог будет здесь...</span>
          : log.map((l, i) => <div key={i} style={{ color: "var(--text)", lineHeight: 1.8 }}>{l}</div>)
        }
      </div>
    </div>
  );
}

// ─── Client ───────────────────────────────────────────────────────────────
function ClientTab() {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<"GET" | "POST" | "PATCH" | "DELETE">("GET");

  const demo = async () => {
    setLoading(true);
    setResponse("");
    try {
      let result: unknown;
      const base = "https://jsonplaceholder.typicode.com";

      if (method === "GET") {
        result = await api.get<Post>(`${base}/posts/1`);
      } else if (method === "POST") {
        result = await api.post<Post>(`${base}/posts`, {
          title: "New Post",
          body: "Content",
          userId: 1,
        });
      } else if (method === "PATCH") {
        result = await api.patch<Post>(`${base}/posts/1`, { title: "Updated Title" });
      } else {
        result = await api.delete<undefined>(`${base}/posts/1`);
      }
      setResponse(JSON.stringify(result, null, 2));
    } catch (err) {
      setResponse(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Типобезопасный HTTP-клиент поверх fetch</div>
        <pre className="code-block">{`class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) { super(message ?? \`HTTP \${status}: \${statusText}\`); }
}

async function request<T>(url: string, opts: RequestInit & { timeout?: number } = {}): Promise<T> {
  const { timeout = 10_000, ...fetchOptions } = opts;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { ...fetchOptions, signal: controller.signal,
      headers: { "Content-Type": "application/json", ...fetchOptions.headers } });
    clearTimeout(id);
    if (!res.ok) throw new HttpError(res.status, res.statusText);
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(id);
    if (err instanceof DOMException && err.name === "AbortError")
      throw new Error("Request timed out");
    throw err;
  }
}

const api = {
  get:    <T>(url: string)                => request<T>(url),
  post:   <T>(url: string, body: unknown) => request<T>(url, { method: "POST",  body: JSON.stringify(body) }),
  patch:  <T>(url: string, body: unknown) => request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(url: string)               => request<T>(url, { method: "DELETE" }),
};`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        {(["GET", "POST", "PATCH", "DELETE"] as const).map(m => (
          <button key={m} className={`btn ${method === m ? "btn-active" : "btn-ghost"}`}
            onClick={() => setMethod(m)}>{m}</button>
        ))}
        <button className="btn btn-primary" onClick={demo} disabled={loading}>
          {loading ? "⏳" : "Run"}
        </button>
      </div>

      {response && (
        <pre className="code-block" style={{ maxHeight: 200, overflow: "auto" }}>
          {response}
        </pre>
      )}
    </div>
  );
}

// ─── Errors ───────────────────────────────────────────────────────────────
function ErrorsTab() {
  const [result, setResult] = useState("");

  const testError = async (status: number) => {
    try {
      const res = await fetch(`https://httpstat.us/${status}`);
      if (!res.ok) throw new HttpError(res.status, res.statusText);
      setResult(`✅ OK (${res.status})`);
    } catch (err) {
      if (err instanceof HttpError) {
        setResult(`HttpError ${err.status}: ${err.statusText}`);
      } else if (err instanceof TypeError) {
        setResult(`NetworkError (TypeError): ${err.message}`);
      } else {
        setResult(`Unknown: ${String(err)}`);
      }
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Иерархия ошибок</div>
        <pre className="code-block">{`// Виды ошибок при fetch:

// 1. NetworkError (TypeError) — нет сети, CORS, DNS failure
//    fetch(url).catch(err => err instanceof TypeError)

// 2. AbortError (DOMException) — AbortController.abort()
//    err.name === "AbortError"

// 3. HTTP Error — res.ok === false (4xx, 5xx)
//    Fetch НЕ кидает ошибку на 4xx/5xx — нужно проверять res.ok!

// 4. Timeout — кастомный через AbortController + setTimeout

// Полная обработка:
try {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new HttpError(res.status, res.statusText);
  const data = await res.json();
} catch (err) {
  if (err instanceof HttpError) {
    // 4xx → UI error message
    // 401 → redirect to login
    // 429 → retry after
    // 503 → server unavailable
    handleHttpError(err);
  } else if (err instanceof DOMException && err.name === "AbortError") {
    // Запрос отменён — обычно игнорировать
  } else if (err instanceof TypeError) {
    // Нет сети
    showOfflineMessage();
  }
}

// ⚠️ КРИТИЧЕСКАЯ ЛОВУШКА:
// fetch("https://...") — НЕ кидает на 404/500!
// Нужно явно: if (!res.ok) throw new Error(...)
const res = await fetch(url);
// res.ok = false при 404 — но exception НЕТ!`}</pre>
      </div>

      <div style={{ marginBottom: 12 }}>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 8 }}>
          Тест с httpstat.us (возвращает нужный статус):
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[200, 400, 401, 403, 404, 500, 503].map(s => (
            <button key={s} className={`btn ${s >= 500 ? "btn-danger" : s >= 400 ? "btn-warning" : "btn-primary"}`}
              onClick={() => testError(s)}>{s}</button>
          ))}
        </div>
      </div>

      {result && (
        <div className={`badge ${result.startsWith("✅") ? "badge-success" : "badge-error"}`}
          style={{ fontSize: 13, padding: "8px 12px" }}>
          {result}
        </div>
      )}

      <div className="card" style={{ marginTop: 12, borderLeftColor: "var(--amber)", borderLeftWidth: 3 }}>
        <div className="card-title" style={{ color: "var(--amber)" }}>Коды ответов — шпаргалка</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 12 }}>
          {[
            ["200 OK",                "GET, PUT, PATCH успех"],
            ["201 Created",           "POST — создан ресурс"],
            ["204 No Content",        "DELETE — нет тела ответа"],
            ["400 Bad Request",       "Невалидные данные"],
            ["401 Unauthorized",      "Нет или неверный токен"],
            ["403 Forbidden",         "Токен верный, нет прав"],
            ["404 Not Found",         "Ресурс не найден"],
            ["409 Conflict",          "Дублирование, race condition"],
            ["422 Unprocessable",     "Ошибки валидации (REST API)"],
            ["429 Too Many Requests", "Rate limit — Retry-After header"],
            ["500 Internal Error",    "Баг на сервере"],
            ["503 Service Unavail",   "Сервер перегружен/на обслуживании"],
          ].map(([code, desc]) => (
            <div key={code} style={{ color: "var(--text)", lineHeight: 1.6 }}>
              <span style={{ color: "var(--blue)", fontFamily: "monospace" }}>{code}</span>
              <span style={{ color: "var(--text-dim)" }}> — {desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
