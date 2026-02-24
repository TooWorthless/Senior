import { useState, useOptimistic, useTransition, useCallback, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

// ─── API ───────────────────────────────────────────────────────────────────
const BASE = "https://jsonplaceholder.typicode.com";

interface Post  { id: number; title: string; body: string; userId: number }
interface Todo  { id: number; title: string; completed: boolean; userId: number }

async function fetchTodos(page: number): Promise<Todo[]> {
  await new Promise(r => setTimeout(r, 300)); // Симуляция задержки
  const res = await fetch(`${BASE}/todos?_page=${page}&_limit=10`);
  return res.json() as Promise<Todo[]>;
}

async function toggleTodo(id: number, completed: boolean): Promise<Todo> {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
    headers: { "Content-Type": "application/json" },
  });
  return res.json() as Promise<Todo>;
}

async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(`${BASE}/todos`, {
    method: "POST",
    body: JSON.stringify({ title, completed: false, userId: 1 }),
    headers: { "Content-Type": "application/json" },
  });
  return res.json() as Promise<Todo>;
}

// ─── Компоненты ────────────────────────────────────────────────────────────
type Tab = "optimistic" | "pagination" | "error" | "swr";

export default function PatternsDemo() {
  const [tab, setTab] = useState<Tab>("optimistic");

  return (
    <div className="example-page">
      <h1>06 · Паттерны</h1>
      <p className="subtitle">
        Optimistic UI, Pagination, Error handling, SWR / stale-while-revalidate
      </p>

      <div className="btn-row">
        {(["optimistic", "pagination", "error", "swr"] as Tab[]).map(t => (
          <button key={t} className={`btn ${tab === t ? "btn-active" : "btn-ghost"}`}
            onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "optimistic" && <OptimisticTab />}
      {tab === "pagination" && <PaginationTab />}
      {tab === "error"      && <ErrorTab />}
      {tab === "swr"        && <SWRTab />}
    </div>
  );
}

// ─── Optimistic Tab ───────────────────────────────────────────────────────
function OptimisticTab() {
  const queryClient = useQueryClient();
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos", 1],
    queryFn: () => fetchTodos(1),
  });

  // React 19 useOptimistic
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (state: Todo[], update: { id: number; completed: boolean } | { id: number; title: string; optimistic: true }) => {
      if ("optimistic" in update) {
        // Добавление нового
        return [{ id: update.id, title: update.title, completed: false, userId: 1 }, ...state];
      }
      // Обновление существующего
      return state.map(t => t.id === update.id ? { ...t, completed: update.completed } : t);
    }
  );

  const [, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      toggleTodo(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["todos", 1] });
      const previous = queryClient.getQueryData<Todo[]>(["todos", 1]);
      queryClient.setQueryData<Todo[]>(["todos", 1], old =>
        old?.map(t => t.id === id ? { ...t, completed } : t)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["todos", 1], ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["todos", 1] });
    },
  });

  const handleToggle = (todo: Todo) => {
    startTransition(() => {
      addOptimistic({ id: todo.id, completed: !todo.completed });
    });
    toggleMutation.mutate({ id: todo.id, completed: !todo.completed });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const tempId = -Date.now();
    startTransition(() => {
      addOptimistic({ id: tempId, title: newTitle, optimistic: true });
    });
    setNewTitle("");
    // В реальном приложении — вызвать mutation и инвалидировать кеш
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Optimistic UI — три подхода</div>
        <pre className="code-block">{`// 1. React 19 useOptimistic (самый современный):
const [optimisticItems, addOptimistic] = useOptimistic(
  serverItems,
  (state, update) => applyUpdate(state, update) // reducer
);

const handleToggle = (item) => {
  startTransition(() => {
    addOptimistic({ id: item.id, done: !item.done }); // немедленно
  });
  toggleMutation.mutate(item); // асинхронно
};
// При успехе → serverItems обновляются → optimistic исчезает
// При ошибке → откат к serverItems автоматически!

// 2. TanStack Query onMutate:
const mutation = useMutation({
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    const previous = queryClient.getQueryData(["todos"]);
    queryClient.setQueryData(["todos"], applyOptimisticUpdate);
    return { previous }; // контекст для rollback
  },
  onError: (_err, _vars, ctx) => {
    queryClient.setQueryData(["todos"], ctx.previous); // rollback
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
});

// 3. Apollo optimisticResponse (только GraphQL):
const [updatePost] = useMutation(UPDATE_POST, {
  optimisticResponse: { updatePost: { ...post, likes: post.likes + 1 } },
  // Apollo автоматически откатывает при ошибке!
});`}</pre>
      </div>

      <form style={{ display: "flex", gap: 8, marginBottom: 12 }} onSubmit={handleAdd}>
        <input
          className="input"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Новое задание..."
          style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--border)",
            borderRadius: 6, color: "var(--text)", padding: "6px 10px", fontSize: 13 }}
        />
        <button type="submit" className="btn btn-primary">Add (Optimistic)</button>
      </form>

      {isLoading && <div className="badge badge-warning">⏳ Loading todos...</div>}

      <div style={{ maxHeight: 350, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
        {optimisticTodos.map(todo => (
          <div
            key={todo.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px", borderBottom: "1px solid var(--border)",
              opacity: todo.id < 0 ? 0.5 : 1, // pending = id < 0
              cursor: "pointer",
            }}
            onClick={() => todo.id > 0 && handleToggle(todo)}
          >
            <span style={{ fontSize: 16 }}>
              {todo.completed ? "✅" : "⬜"}
            </span>
            <span style={{
              fontSize: 13,
              textDecoration: todo.completed ? "line-through" : "none",
              color: todo.completed ? "var(--text-dim)" : "var(--text)",
              flex: 1,
            }}>
              {todo.title}
            </span>
            {todo.id < 0 && <span className="badge badge-warning" style={{ fontSize: 10 }}>pending</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pagination Tab ───────────────────────────────────────────────────────
function PaginationTab() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: todos, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["todos-page", page],
    queryFn: () => fetchTodos(page),
    placeholderData: keepPreviousData, // показывает предыдущие данные при переходе
  });

  // Prefetch следующей страницы при hover на кнопку
  const prefetchNext = useCallback(() => {
    void queryClient.prefetchQuery({
      queryKey: ["todos-page", page + 1],
      queryFn: () => fetchTodos(page + 1),
    });
  }, [queryClient, page]);

  return (
    <div>
      <div className="card">
        <div className="card-title">Pagination паттерны</div>
        <pre className="code-block">{`// 1. Offset-based (страницы):
fetch(\`/api/posts?page=\${page}&limit=10\`)
// ⚠️ Проблема: вставка/удаление смещает страницы (duplicate/skip items)

// 2. Cursor-based (для real-time данных):
fetch(\`/api/posts?after=\${lastId}&limit=10\`)
// ✅ Стабильно при изменении данных

// 3. Offset-based с keepPreviousData (TanStack Query):
const { data, isPlaceholderData } = useQuery({
  queryKey: ["posts", page],
  queryFn: () => fetchPosts(page),
  placeholderData: keepPreviousData, // ← показывает пред. страницу
});
// isPlaceholderData = true пока грузится новая
// Предотвращает мигание/blank state при навигации

// 4. Prefetch следующей страницы:
onMouseEnter={() => queryClient.prefetchQuery({
  queryKey: ["posts", page + 1],
  queryFn: () => fetchPosts(page + 1),
})}

// 5. Infinite scroll → useInfiniteQuery (см. модуль 03)`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
          ← Prev
        </button>
        {[1, 2, 3, 4, 5].map(p => (
          <button key={p}
            className={`btn ${page === p ? "btn-active" : "btn-ghost"}`}
            onClick={() => setPage(p)}
            onMouseEnter={() => void queryClient.prefetchQuery({ queryKey: ["todos-page", p], queryFn: () => fetchTodos(p) })}
          >
            {p}
          </button>
        ))}
        <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)} onMouseEnter={prefetchNext}>
          Next →
        </button>
        {isFetching && <span style={{ color: "var(--text-dim)", fontSize: 12 }}>⏳ fetching...</span>}
        {isPlaceholderData && <span className="badge badge-warning" style={{ fontSize: 10 }}>placeholder data</span>}
      </div>

      <div style={{
        opacity: isPlaceholderData ? 0.6 : 1,
        transition: "opacity 0.2s",
        border: "1px solid var(--border)", borderRadius: 8,
      }}>
        {isLoading && <div style={{ padding: 20, color: "var(--text-dim)" }}>⏳ Loading...</div>}
        {todos?.map(todo => (
          <div key={todo.id} style={{
            display: "flex", gap: 10, padding: "8px 14px",
            borderBottom: "1px solid var(--border)", fontSize: 13,
          }}>
            <span>{todo.completed ? "✅" : "⬜"}</span>
            <span style={{ color: todo.completed ? "var(--text-dim)" : "var(--text)" }}>
              {todo.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// keepPreviousData для TanStack Query v5
function keepPreviousData<T>(prev: T | undefined): T | undefined { return prev; }

// ─── Error Tab ────────────────────────────────────────────────────────────
function ErrorTab() {
  const [scenario, setScenario] = useState<"network" | "http" | "parse" | "retry">("network");
  const [result, setResult] = useState("");

  const runScenario = async () => {
    setResult("⏳ Running...");
    try {
      if (scenario === "network") {
        await fetch("https://this-domain-does-not-exist.xyz/api");
        setResult("✅ OK (unexpected)");
      } else if (scenario === "http") {
        const res = await fetch("https://httpstat.us/500");
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        setResult("✅ OK");
      } else if (scenario === "parse") {
        const res = await fetch("https://httpstat.us/200");
        const text = await res.text();
        JSON.parse(text); // не JSON!
        setResult("✅ OK");
      } else {
        // retry simulation
        let attempt = 0;
        while (attempt < 3) {
          attempt++;
          try {
            const res = await fetch(`https://httpstat.us/${attempt < 3 ? 503 : 200}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setResult(`✅ Success on attempt ${attempt}`);
            break;
          } catch (err) {
            if (attempt === 3) throw err;
            setResult(`⏳ Attempt ${attempt} failed, retrying...`);
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setResult(`TypeError (NetworkError): ${err.message}`);
      } else if (err instanceof SyntaxError) {
        setResult(`SyntaxError (ParseError): ${err.message.slice(0, 80)}`);
      } else if (err instanceof Error) {
        setResult(`Error: ${err.message}`);
      }
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Error handling — полная иерархия</div>
        <pre className="code-block">{`// 3 уровня обработки ошибок:

// 1. Network-level (инфраструктура):
try {
  const res = await fetch(url);
} catch (err) {
  if (err instanceof TypeError) {
    // Нет сети, CORS, DNS failure, SSL
    showOfflineBanner();
  }
}

// 2. HTTP-level (сервер вернул ответ):
if (!res.ok) {
  const body = await res.text().catch(() => "");
  if (res.status === 401) return redirectToLogin();
  if (res.status === 403) return showForbidden();
  if (res.status === 404) return show404();
  if (res.status === 422) return showValidationErrors(parseBody(body));
  if (res.status >= 500) return showServerError();
  throw new HttpError(res.status, res.statusText, body);
}

// 3. Application-level (данные не те):
const data = await res.json();
if (!isValidUser(data)) throw new ParseError("Invalid response shape");

// TanStack Query — централизованная обработка:
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => {
        // Не retry 4xx — только 5xx и сетевые ошибки
        if (error instanceof HttpError && error.status < 500) return false;
        return count < 3;
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      // Глобальный handler для всех query errors:
      if (error instanceof HttpError && error.status === 401) {
        redirectToLogin();
      }
    },
  }),
});`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {(["network", "http", "parse", "retry"] as const).map(s => (
          <button key={s} className={`btn ${scenario === s ? "btn-active" : "btn-ghost"}`}
            onClick={() => setScenario(s)}>{s}</button>
        ))}
        <button className="btn btn-primary" onClick={runScenario}>Run</button>
      </div>

      {result && (
        <div className={`badge ${result.startsWith("✅") ? "badge-success" : result.startsWith("⏳") ? "badge-warning" : "badge-error"}`}
          style={{ fontSize: 13, padding: "8px 12px" }}>
          {result}
        </div>
      )}
    </div>
  );
}

// ─── SWR Tab ──────────────────────────────────────────────────────────────
function SWRTab() {
  const [simulateStale, setSimulateStale] = useState(false);

  // Демонстрация stale-while-revalidate через TanStack Query
  const { data: todos, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["todos-swr"],
    queryFn: () => fetchTodos(1),
    staleTime: simulateStale ? 0 : 30_000, // 0 = сразу stale
    refetchOnWindowFocus: true,             // рефетч при возврате на вкладку
    refetchOnMount: true,                   // рефетч при mount если stale
  });

  return (
    <div>
      <div className="card">
        <div className="card-title">SWR / stale-while-revalidate</div>
        <pre className="code-block">{`// stale-while-revalidate (HTTP RFC 5861) — стратегия кеша:
// 1. Показать кешированные (stale) данные НЕМЕДЛЕННО
// 2. Одновременно запросить свежие данные в фоне
// 3. Обновить UI когда придут новые данные

// Пользователь всегда видит что-то (нет loading spinner для повторных загрузок)
// Данные всегда актуализируются

// TanStack Query — staleTime:
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  staleTime: 30_000,        // 30 сек — данные "свежие"
  refetchOnWindowFocus: true, // рефетч при возврате на вкладку (SWR!)
  refetchOnMount: "always",   // всегда при mount
});
// При staleTime = 0: КАЖДЫЙ mount → фоновый рефетч
// Данные из кеша (stale) + фоновый запрос = SWR!

// SWR библиотека (Vercel):
import useSWR from "swr";
const { data, error, isValidating } = useSWR("/api/users", fetcher, {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 30_000,    // polling
  dedupingInterval: 2000,     // дедупликация запросов
});

// Apollo fetchPolicy: "cache-and-network":
const { data } = useQuery(GET_USERS, {
  fetchPolicy: "cache-and-network", // кеш + фоновый запрос (SWR!)
});`}</pre>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={simulateStale} onChange={e => setSimulateStale(e.target.checked)} />
          <span style={{ color: "var(--text)", fontSize: 13 }}>
            staleTime = 0 (всегда stale → фоновый рефетч при mount/focus)
          </span>
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {isFetching && <span className="badge badge-info">🔄 Background revalidating...</span>}
        {!isFetching && todos && <span className="badge badge-success">✅ Data fresh</span>}
      </div>

      {dataUpdatedAt > 0 && (
        <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 8 }}>
          Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
        </p>
      )}

      <div style={{ border: "1px solid var(--border)", borderRadius: 8, maxHeight: 250, overflowY: "auto" }}>
        {todos?.slice(0, 8).map(todo => (
          <div key={todo.id} style={{
            display: "flex", gap: 10, padding: "8px 14px",
            borderBottom: "1px solid var(--border)", fontSize: 13,
          }}>
            <span>{todo.completed ? "✅" : "⬜"}</span>
            <span style={{ color: "var(--text)" }}>{todo.title}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 12, borderLeftColor: "var(--amber)", borderLeftWidth: 3 }}>
        <div className="card-title" style={{ color: "var(--amber)" }}>Вопросы на интервью</div>
        {[
          "Что такое stale-while-revalidate и зачем?",
          "Как реализовать optimistic UI с rollback при ошибке?",
          "Offset pagination vs cursor-based — разница и когда что?",
          "keepPreviousData / placeholderData — зачем при пагинации?",
          "Как централизованно обрабатывать 401 во всём приложении?",
          "Как TanStack Query решает N+1 проблему через deduplication?",
        ].map((q, i) => (
          <div key={i} style={{ color: "var(--text)", fontSize: 13, lineHeight: 2 }}>▸ {q}</div>
        ))}
      </div>
    </div>
  );
}
