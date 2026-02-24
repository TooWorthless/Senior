import { useState } from "react";
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";

// ─── Типы ──────────────────────────────────────────────────────────────────
interface Post { id: number; title: string; body: string; userId: number }
interface ApiError { message: string; code?: string; details?: Record<string, string[]> }

// ─── Production-ready axios instance ──────────────────────────────────────
const BASE_URL = "https://jsonplaceholder.typicode.com";

function createApiClient(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 10_000,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  // ── Request Interceptor ──────────────────────────────────────────────────
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Добавить Authorization header:
      const token = localStorage.getItem("auth_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;

      // Добавить request ID для tracing:
      config.headers["X-Request-ID"] = crypto.randomUUID();

      // Лог (dev only):
      if (import.meta.env.DEV) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error: unknown) => Promise.reject(error)
  );

  // ── Response Interceptor ─────────────────────────────────────────────────
  instance.interceptors.response.use(
    response => {
      // Лог успешного ответа (dev only):
      if (import.meta.env.DEV) {
        console.log(`[API] ✅ ${response.config.url} → ${response.status}`);
      }
      return response;
    },
    async (error: AxiosError<ApiError>) => {
      const { response, config } = error;

      // 401 → рефреш токена:
      if (response?.status === 401 && config && !(config as AxiosRequestConfig & { _retry?: boolean })._retry) {
        (config as AxiosRequestConfig & { _retry?: boolean })._retry = true;
        try {
          // const { token } = await refreshToken();
          // localStorage.setItem("auth_token", token);
          // return instance(config);
        } catch {
          // logout();
        }
      }

      // Нормализовать ошибку:
      const normalized = normalizeAxiosError(error);
      return Promise.reject(normalized);
    }
  );

  return instance;
}

function normalizeAxiosError(error: AxiosError<ApiError>): Error {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message ?? error.message;
    const err = new Error(`[${status}] ${message}`) as Error & { status: number; data: unknown };
    err.status = status;
    err.data = error.response.data;
    return err;
  }
  if (error.request) {
    return new Error("Network error: no response received");
  }
  return new Error(error.message);
}

// ── Retry logic ─────────────────────────────────────────────────────────
function withRetry(
  instance: AxiosInstance,
  maxRetries = 3,
  retryableStatuses = [408, 429, 500, 502, 503, 504]
) {
  instance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };
    if (!config) return Promise.reject(error);

    const shouldRetry =
      (error.code === "ECONNABORTED" || (error.response && retryableStatuses.includes(error.response.status))) &&
      (config._retryCount ?? 0) < maxRetries;

    if (!shouldRetry) return Promise.reject(error);

    config._retryCount = (config._retryCount ?? 0) + 1;
    const delay = 1000 * 2 ** (config._retryCount - 1); // exponential: 1s, 2s, 4s

    // Retry-After header (429):
    const retryAfter = error.response?.headers["retry-after"] as string | undefined;
    const actualDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;

    await new Promise(r => setTimeout(r, actualDelay));
    return instance(config);
  });

  return instance;
}

// Создаём клиент с retry
const apiClient = withRetry(createApiClient(BASE_URL));

// ─── Компоненты ────────────────────────────────────────────────────────────
type Tab = "instance" | "interceptors" | "cancel" | "tips";

export default function AxiosDemo() {
  const [tab, setTab] = useState<Tab>("instance");

  return (
    <div className="example-page">
      <h1>02 · axios</h1>
      <p className="subtitle">
        Axios instance, interceptors, retry, cancel token, vs fetch
      </p>

      <div className="btn-row">
        {(["instance", "interceptors", "cancel", "tips"] as Tab[]).map(t => (
          <button key={t} className={`btn ${tab === t ? "btn-active" : "btn-ghost"}`}
            onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "instance"     && <InstanceTab />}
      {tab === "interceptors" && <InterceptorsTab />}
      {tab === "cancel"       && <CancelTab />}
      {tab === "tips"         && <TipsTab />}
    </div>
  );
}

// ─── Instance Tab ─────────────────────────────────────────────────────────
function InstanceTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(l => [`${new Date().toLocaleTimeString()} ${msg}`, ...l.slice(0, 7)]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      addLog("GET /posts?_limit=3");
      const { data } = await apiClient.get<Post[]>("/posts?_limit=3");
      setPosts(data);
      addLog(`✅ ${data.length} posts`);
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    try {
      addLog("POST /posts");
      const { data, status } = await apiClient.post<Post>("/posts", {
        title: "New Post",
        body: "Content...",
        userId: 1,
      });
      addLog(`✅ Created: id=${data.id}, status=${status}`);
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">axios.create — production instance</div>
        <pre className="code-block">{`import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://api.example.com",
  timeout: 10_000,                        // 10 секунд
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// GET с типом:
const { data } = await apiClient.get<User[]>("/users");
// data: User[] — типизировано!

// POST:
const { data: created } = await apiClient.post<User>("/users", newUser);

// PATCH / PUT:
const { data: updated } = await apiClient.patch<User>(\`/users/\${id}\`, changes);

// DELETE:
await apiClient.delete(\`/users/\${id}\`); // 204 — data = ""

// Параметры (query string):
await apiClient.get("/users", { params: { role: "admin", page: 2 } });
// → GET /users?role=admin&page=2

// Ответ содержит:
// { data, status, statusText, headers, config, request }

// ⚠️ axios КИДАЕТ ошибку на 4xx/5xx (в отличие от fetch!)
// isAxiosError(error) → проверка типа
// error.response.status, error.response.data — детали`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={fetchPosts} disabled={loading}>
          {loading ? "⏳" : "GET /posts"}
        </button>
        <button className="btn btn-ghost" onClick={createPost}>POST /posts</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          {posts.map(p => (
            <div key={p.id} className="card" style={{ padding: "8px 12px", marginBottom: 6 }}>
              <span style={{ color: "var(--text-dim)", fontSize: 11, fontFamily: "monospace" }}>#{p.id}</span>
              {" "}
              <span style={{ fontSize: 12 }}>{p.title}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ fontFamily: "monospace", fontSize: 11 }}>
          {log.length === 0
            ? <span style={{ color: "var(--text-dim)" }}>Log...</span>
            : log.map((l, i) => <div key={i} style={{ lineHeight: 1.8 }}>{l}</div>)
          }
        </div>
      </div>
    </div>
  );
}

// ─── Interceptors Tab ─────────────────────────────────────────────────────
function InterceptorsTab() {
  return (
    <div>
      <div className="card">
        <div className="card-title">Interceptors — request & response</div>
        <pre className="code-block">{`// ── Request Interceptor ──────────────────────────────────
instance.interceptors.request.use(
  (config) => {
    // 1. Добавить токен:
    const token = getToken();
    if (token) config.headers.Authorization = \`Bearer \${token}\`;

    // 2. Request ID для distributed tracing:
    config.headers["X-Request-ID"] = crypto.randomUUID();

    // 3. Логирование (dev):
    if (DEV) console.log(\`[API] \${config.method} \${config.url}\`);

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────
instance.interceptors.response.use(
  (response) => response, // успех — пропускаем

  async (error: AxiosError) => {
    const { response, config } = error;

    // 401 → автоматический рефреш:
    if (response?.status === 401 && !config._retry) {
      config._retry = true;
      const newToken = await refreshToken();
      config.headers.Authorization = \`Bearer \${newToken}\`;
      return instance(config); // повторить запрос!
    }

    // 429 → retry after:
    if (response?.status === 429) {
      const delay = response.headers["retry-after"] * 1000;
      await sleep(delay);
      return instance(config);
    }

    return Promise.reject(error);
  }
);

// Удалить interceptor:
const id = instance.interceptors.request.use(...);
instance.interceptors.request.eject(id);`}</pre>
      </div>

      <div className="card">
        <div className="card-title">Retry interceptor с exponential backoff</div>
        <pre className="code-block">{`function withRetry(instance, maxRetries = 3, retryStatuses = [408, 429, 500, 502, 503]) {
  instance.interceptors.response.use(undefined, async (error) => {
    const config = error.config;
    config._retryCount = (config._retryCount ?? 0) + 1;

    if (config._retryCount > maxRetries) return Promise.reject(error);
    if (!retryStatuses.includes(error.response?.status)) return Promise.reject(error);

    // Exponential backoff: 1s → 2s → 4s
    const delay = 1000 * 2 ** (config._retryCount - 1);
    const retryAfterHeader = error.response?.headers["retry-after"];
    const wait = retryAfterHeader ? parseInt(retryAfterHeader) * 1000 : delay;

    await new Promise(r => setTimeout(r, wait));
    return instance(config); // повторить
  });
  return instance;
}

const client = withRetry(axios.create({ baseURL }));`}</pre>
      </div>
    </div>
  );
}

// ─── Cancel Tab ───────────────────────────────────────────────────────────
function CancelTab() {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const abortCtrlRef = reactUseRef<AbortController | null>(null);

  const addLog = (msg: string) => setLog(l => [`${new Date().toLocaleTimeString()} ${msg}`, ...l.slice(0, 7)]);

  const startRequest = async () => {
    abortCtrlRef.current?.abort();
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;
    setLoading(true);
    addLog("GET /posts (axios + AbortController)");

    try {
      const { data } = await apiClient.get<Post[]>("/posts", {
        signal: ctrl.signal, // axios принимает AbortController.signal!
      });
      addLog(`✅ ${data.length} posts`);
    } catch (err) {
      if (isAxiosError(err) && err.code === "ERR_CANCELED") {
        addLog("🛑 Отменён (ERR_CANCELED)");
      } else {
        addLog(`❌ ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    abortCtrlRef.current?.abort();
    addLog("abort() вызван");
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Отмена запросов в axios</div>
        <pre className="code-block">{`// Axios поддерживает AbortController (рекомендуется, axios >= 0.22):
const controller = new AbortController();

const { data } = await axios.get(url, { signal: controller.signal });

// Отменить:
controller.abort();
// error.code === "ERR_CANCELED"
// isAxiosError(error) && error.code === "ERR_CANCELED"

// В useEffect:
useEffect(() => {
  const ctrl = new AbortController();

  apiClient.get("/users", { signal: ctrl.signal })
    .then(res => setData(res.data))
    .catch(err => {
      if (!isAxiosError(err) || err.code !== "ERR_CANCELED") {
        setError(err.message);
      }
    });

  return () => ctrl.abort();
}, [userId]);

// ⚠️ CancelToken (legacy axios API) — deprecated!
// Используй AbortController вместо CancelToken`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={startRequest} disabled={loading}>
          {loading ? "⏳ Fetching..." : "Начать запрос"}
        </button>
        <button className="btn btn-danger" onClick={cancel} disabled={!loading}>Abort</button>
        <button className="btn btn-ghost" onClick={() => setLog([])}>Clear</button>
      </div>

      <div className="card" style={{ fontFamily: "monospace", fontSize: 12, minHeight: 100 }}>
        {log.length === 0
          ? <span style={{ color: "var(--text-dim)" }}>Log...</span>
          : log.map((l, i) => <div key={i} style={{ lineHeight: 1.8 }}>{l}</div>)
        }
      </div>
    </div>
  );
}

import { useRef as reactUseRef } from "react";

// ─── Tips Tab ─────────────────────────────────────────────────────────────
function TipsTab() {
  return (
    <div>
      <div className="card">
        <div className="card-title">axios vs fetch — сравнение</div>
        <pre className="code-block">{`// ┌──────────────────┬───────────────────┬───────────────────┐
// │                  │      fetch        │       axios       │
// ├──────────────────┼───────────────────┼───────────────────┤
// │ Ошибки 4xx/5xx   │ НЕ кидает!        │ Кидает ошибку     │
// │ JSON автоparse   │ res.json() вручную │ data автоматически │
// │ Timeout          │ AbortController   │ timeout: 10000    │
// │ Interceptors     │ Нет               │ ✅ Встроены       │
// │ Upload progress  │ Нет               │ onUploadProgress  │
// │ Base URL         │ Нет               │ baseURL           │
// │ Retry            │ Вручную           │ Interceptor/retry │
// │ Bundle size      │ 0 (встроен)       │ ~13KB gzip        │
// │ AbortController  │ ✅                │ ✅ (>= 0.22)      │
// │ Node.js          │ >= 18             │ ✅ (все версии)   │
// └──────────────────┴───────────────────┴───────────────────┘

// Когда axios:
// ✅ Нужны interceptors (auth, logging, retry)
// ✅ Upload progress
// ✅ Сложные timeout / retry сценарии
// ✅ Поддержка старого Node.js

// Когда fetch:
// ✅ Простые запросы
// ✅ Браузер-only, нет зависимостей
// ✅ Service Workers (fetch API обязателен)`}</pre>
      </div>

      <div className="card">
        <div className="card-title">isAxiosError — type guard</div>
        <pre className="code-block">{`import { isAxiosError } from "axios";

try {
  await apiClient.post("/users", data);
} catch (err) {
  if (isAxiosError(err)) {
    // TypeScript знает что это AxiosError:
    err.response?.status;      // number
    err.response?.data;        // unknown → кастуем к своему типу
    err.code;                  // "ECONNABORTED" | "ERR_CANCELED" | ...
    err.config?.url;           // URL который упал

    // Типизированная ошибка от сервера:
    const apiErr = err.response?.data as ApiError;
    showValidationErrors(apiErr?.details);
  } else {
    // Неожиданная ошибка
    console.error("Unexpected:", err);
  }
}`}</pre>
      </div>
    </div>
  );
}
