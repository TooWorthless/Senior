import { useState } from "react";
import {
  useQuery, useMutation, useQueryClient, useInfiniteQuery,
  keepPreviousData, type QueryKey,
} from "@tanstack/react-query";

// ─── Типы ──────────────────────────────────────────────────────────────────
interface Post  { id: number; title: string; body: string; userId: number }
interface Comment { id: number; postId: number; name: string; email: string; body: string }

// ─── API функции (queryFn) ────────────────────────────────────────────────
const BASE = "https://jsonplaceholder.typicode.com";

async function fetchPost(id: number): Promise<Post> {
  const res = await fetch(`${BASE}/posts/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Post>;
}

async function fetchComments(postId: number): Promise<Comment[]> {
  const res = await fetch(`${BASE}/posts/${postId}/comments`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Comment[]>;
}

async function fetchPosts(page: number): Promise<{ posts: Post[]; nextPage: number | null }> {
  const res = await fetch(`${BASE}/posts?_page=${page}&_limit=5`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const posts = await res.json() as Post[];
  return { posts, nextPage: posts.length === 5 ? page + 1 : null };
}

async function createPost(data: Omit<Post, "id">): Promise<Post> {
  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Post>;
}

async function updatePost(id: number, data: Partial<Post>): Promise<Post> {
  const res = await fetch(`${BASE}/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Post>;
}

async function deletePost(id: number): Promise<void> {
  const res = await fetch(`${BASE}/posts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ─── Query Keys factory ───────────────────────────────────────────────────
// Best practice: хранить query keys централизованно
export const postKeys = {
  all:      () => ["posts"]               as const,
  lists:    () => [...postKeys.all(), "list"] as const,
  list:     (filters: object) => [...postKeys.lists(), filters] as const,
  details:  () => [...postKeys.all(), "detail"] as const,
  detail:   (id: number) => [...postKeys.details(), id] as const,
  comments: (id: number) => [...postKeys.detail(id), "comments"] as const,
};

// ─── Компоненты ────────────────────────────────────────────────────────────
type Tab = "queries" | "mutations" | "infinite" | "cache";

export default function TanstackDemo() {
  const [tab, setTab] = useState<Tab>("queries");

  return (
    <div className="example-page">
      <h1>03 · TanStack Query</h1>
      <p className="subtitle">
        useQuery, useMutation, cache, staleTime, infinite scroll, optimistic updates
      </p>
      <p style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 12 }}>
        💡 Открой React Query DevTools (кнопка снизу) — видно кеш в реальном времени
      </p>

      <div className="btn-row">
        {(["queries", "mutations", "infinite", "cache"] as Tab[]).map(t => (
          <button key={t} className={`btn ${tab === t ? "btn-active" : "btn-ghost"}`}
            onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "queries"   && <QueriesTab />}
      {tab === "mutations" && <MutationsTab />}
      {tab === "infinite"  && <InfiniteTab />}
      {tab === "cache"     && <CacheTab />}
    </div>
  );
}

// ─── Queries Tab ──────────────────────────────────────────────────────────
function QueriesTab() {
  const [postId, setPostId] = useState(1);
  const [showComments, setShowComments] = useState(false);

  // Основной запрос
  const postQuery = useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => fetchPost(postId),
    staleTime: 60_000,     // 1 мин — данные "свежие", не будет фонового рефетча
    gcTime: 5 * 60_000,   // 5 мин — держать в кеше после unmount
    retry: 2,              // 2 попытки при ошибке
    // placeholderData: keepPreviousData,  // показывать предыдущие данные пока грузятся новые
  });

  // Зависимый запрос — только когда showComments=true
  const commentsQuery = useQuery({
    queryKey: postKeys.comments(postId),
    queryFn: () => fetchComments(postId),
    enabled: showComments, // не запускать пока false
    staleTime: 30_000,
  });

  return (
    <div>
      <div className="card">
        <div className="card-title">useQuery — основы</div>
        <pre className="code-block">{`const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
  queryKey: ["posts", id],     // уникальный ключ — массив (можно объекты)
  queryFn: () => fetchPost(id), // async функция возвращающая данные

  // Конфигурация:
  staleTime: 60_000,  // мс — данные "свежие" (нет фонового рефетча)
  gcTime: 5 * 60_000, // мс — хранить в кеше после unmount (бывший cacheTime)
  retry: 3,           // кол-во retry при ошибке
  enabled: !!id,      // false → запрос не запускается

  // Состояния:
  // isLoading   → нет кеша + идёт запрос (первая загрузка)
  // isFetching  → идёт запрос (включая background refetch)
  // isSuccess   → данные получены
  // isError     → ошибка
  // isPending   → нет данных (loading | disabled)
});

// isLoading vs isFetching:
// isLoading = true ТОЛЬКО при первой загрузке (нет кеша)
// isFetching = true при ЛЮБОМ запросе (включая background refetch)
// → для skeleton: isLoading, для spinner: isFetching`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ color: "var(--text-dim)", fontSize: 13 }}>Post ID:</span>
        {[1, 2, 3, 5, 10].map(id => (
          <button key={id} className={`btn ${postId === id ? "btn-active" : "btn-ghost"}`}
            onClick={() => setPostId(id)}>{id}</button>
        ))}
        <button className="btn btn-ghost" onClick={() => void postQuery.refetch()}>Refetch</button>
      </div>

      {/* Status badges */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {postQuery.isLoading   && <span className="badge badge-warning">isLoading</span>}
        {postQuery.isFetching  && <span className="badge badge-info">isFetching</span>}
        {postQuery.isSuccess   && <span className="badge badge-success">isSuccess</span>}
        {postQuery.isError     && <span className="badge badge-error">isError</span>}
        {postQuery.isStale     && <span className="badge badge-warning">isStale</span>}
      </div>

      {postQuery.isError && (
        <div className="badge badge-error" style={{ marginBottom: 8 }}>
          {postQuery.error instanceof Error ? postQuery.error.message : "Error"}
        </div>
      )}

      {postQuery.data && (
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "var(--text-dim)", fontFamily: "monospace", fontSize: 11 }}>
              #{postQuery.data.id}
            </span>
            <span style={{ color: "var(--text-dim)", fontSize: 11 }}>
              userId: {postQuery.data.userId}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{postQuery.data.title}</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>{postQuery.data.body}</div>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-ghost" onClick={() => setShowComments(v => !v)}>
          {showComments ? "Hide" : "Show"} Comments (enabled={String(showComments)})
        </button>
        {showComments && commentsQuery.isFetching && (
          <span style={{ marginLeft: 8, color: "var(--text-dim)", fontSize: 13 }}>⏳</span>
        )}
        {showComments && commentsQuery.data && (
          <span style={{ marginLeft: 8, color: "var(--green)", fontSize: 12 }}>
            {commentsQuery.data.length} comments
          </span>
        )}
      </div>

      {showComments && commentsQuery.data?.slice(0, 3).map(c => (
        <div key={c.id} className="card" style={{ padding: "8px 12px", marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: "var(--blue)" }}>{c.email}</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{c.body.slice(0, 80)}...</div>
        </div>
      ))}
    </div>
  );
}

// ─── Mutations Tab ────────────────────────────────────────────────────────
function MutationsTab() {
  const queryClient = useQueryClient();
  const [log, setLog] = useState<string[]>([]);
  const addLog = (msg: string) => setLog(l => [msg, ...l.slice(0, 8)]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Post, "id">) => createPost(data),
    onMutate: async (newPost) => {
      // Optimistic update:
      await queryClient.cancelQueries({ queryKey: postKeys.lists() });
      const previous = queryClient.getQueryData<Post[]>(postKeys.lists());
      queryClient.setQueryData<Post[]>(postKeys.lists(), old => [
        { ...newPost, id: Date.now() }, // временный ID
        ...(old ?? []),
      ]);
      addLog("⚡ Optimistic: добавлен временный пост");
      return { previous }; // context для onError
    },
    onError: (_err, _vars, context) => {
      // Откатить при ошибке:
      if (context?.previous) {
        queryClient.setQueryData(postKeys.lists(), context.previous);
        addLog("🔄 Rollback: откат optimistic update");
      }
    },
    onSuccess: (data) => {
      // Инвалидировать кеш — следующий useQuery перезагрузит:
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      addLog(`✅ Created: id=${data.id} (JSONPlaceholder симулирует — id=101)`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Post> }) => updatePost(id, data),
    onSuccess: (updatedPost) => {
      // Обновить конкретный элемент в кеше напрямую:
      queryClient.setQueryData<Post>(postKeys.detail(updatedPost.id), updatedPost);
      addLog(`✅ Updated post #${updatedPost.id}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: (_, id) => {
      // Удалить из кеша:
      queryClient.removeQueries({ queryKey: postKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      addLog(`✅ Deleted post #${id}`);
    },
  });

  return (
    <div>
      <div className="card">
        <div className="card-title">useMutation — создание/изменение/удаление</div>
        <pre className="code-block">{`const mutation = useMutation({
  mutationFn: (data: NewPost) => createPost(data),

  // Optimistic update:
  onMutate: async (newData) => {
    // 1. Отменить исходящие запросы (чтобы не перезаписали):
    await queryClient.cancelQueries({ queryKey: ["posts"] });
    // 2. Сохранить текущее состояние:
    const previous = queryClient.getQueryData(["posts"]);
    // 3. Применить optimistic update:
    queryClient.setQueryData(["posts"], old => [newData, ...old]);
    // 4. Вернуть context для rollback:
    return { previous };
  },
  onError: (err, vars, context) => {
    // Откатить при ошибке:
    queryClient.setQueryData(["posts"], context.previous);
  },
  onSuccess: (data) => {
    // Инвалидировать → перезагрузить реальные данные:
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  },
});

// Вызов:
mutation.mutate({ title: "New", body: "...", userId: 1 });
// Или с async/await:
await mutation.mutateAsync(data);

// Состояния:
mutation.isPending   // идёт запрос
mutation.isSuccess
mutation.isError
mutation.error`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button className="btn btn-primary"
          disabled={createMutation.isPending}
          onClick={() => createMutation.mutate({ title: "New Post " + Date.now(), body: "Body...", userId: 1 })}>
          {createMutation.isPending ? "⏳" : "POST Create"}
        </button>
        <button className="btn btn-ghost"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ id: 1, data: { title: "Updated " + Date.now() } })}>
          {updateMutation.isPending ? "⏳" : "PATCH #1"}
        </button>
        <button className="btn btn-danger"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate(1)}>
          {deleteMutation.isPending ? "⏳" : "DELETE #1"}
        </button>
      </div>

      <div className="card" style={{ fontFamily: "monospace", fontSize: 12, minHeight: 100 }}>
        {log.length === 0
          ? <span style={{ color: "var(--text-dim)" }}>Log mutations...</span>
          : log.map((l, i) => <div key={i} style={{ lineHeight: 1.8 }}>{l}</div>)
        }
      </div>
    </div>
  );
}

// ─── Infinite Tab ─────────────────────────────────────────────────────────
function InfiniteTab() {
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError,
  } = useInfiniteQuery({
    queryKey: ["posts", "infinite"],
    queryFn: ({ pageParam }) => fetchPosts(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const allPosts = data?.pages.flatMap(p => p.posts) ?? [];

  return (
    <div>
      <div className="card">
        <div className="card-title">useInfiniteQuery — infinite scroll</div>
        <pre className="code-block">{`const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ["posts", "infinite"],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),

  initialPageParam: 1,                          // начальная страница

  // Как получить следующую страницу:
  getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  // undefined → нет следующей страницы (hasNextPage = false)

  // Предыдущая страница (bi-directional):
  // getPreviousPageParam: (firstPage) => firstPage.prevPage,
});

// data.pages — массив ответов [page1, page2, page3, ...]
// Все посты:
const allPosts = data?.pages.flatMap(page => page.posts) ?? [];

// Загрузить следующую:
fetchNextPage();
// Статусы:
hasNextPage       // есть ли следующая страница
isFetchingNextPage // загружается следующая

// Infinite scroll паттерн с IntersectionObserver:
const sentinelRef = useRef(null);
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && hasNextPage) fetchNextPage();
  });
  if (sentinelRef.current) observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasNextPage, fetchNextPage]);`}</pre>
      </div>

      {isLoading && <div className="badge badge-warning">⏳ Loading...</div>}
      {isError   && <div className="badge badge-error">❌ Error</div>}

      <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
        {allPosts.map(post => (
          <div key={post.id} style={{
            padding: "10px 14px", borderBottom: "1px solid var(--border)",
            fontSize: 13,
          }}>
            <span style={{ color: "var(--text-dim)", fontFamily: "monospace", fontSize: 11, marginRight: 8 }}>
              #{post.id}
            </span>
            {post.title}
          </div>
        ))}
        {hasNextPage && (
          <div style={{ padding: 12, textAlign: "center" }}>
            <button className="btn btn-ghost" onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "⏳ Loading..." : "Load More"}
            </button>
          </div>
        )}
        {!hasNextPage && allPosts.length > 0 && (
          <div style={{ padding: 12, textAlign: "center", color: "var(--text-dim)", fontSize: 12 }}>
            Все посты загружены ({allPosts.length})
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cache Tab ────────────────────────────────────────────────────────────
function CacheTab() {
  const queryClient = useQueryClient();
  const [postId, setPostId] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const addLog = (msg: string) => setLog(l => [msg, ...l.slice(0, 9)]);

  const postQuery = useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => fetchPost(postId),
    staleTime: 5000, // 5 секунд для демо
  });

  return (
    <div>
      <div className="card">
        <div className="card-title">Кеш TanStack Query — lifecycle</div>
        <pre className="code-block">{`// staleTime vs gcTime (cacheTime):
//
// staleTime (default: 0):
//   Как долго данные считаются "свежими" → нет background refetch
//   0 = сразу устарели (всегда рефетч при mount/focus)
//
// gcTime / cacheTime (default: 5 минут):
//   Как долго держать в памяти ПОСЛЕ unmount всех подписчиков
//   Данные удаляются из памяти через gcTime после последнего unmount

// Инвалидация — пометить как stale и перезагрузить:
queryClient.invalidateQueries({ queryKey: ["posts"] });         // все посты
queryClient.invalidateQueries({ queryKey: ["posts", "list"] }); // только списки
queryClient.invalidateQueries({ queryKey: postKeys.detail(id) }); // конкретный

// Прямое обновление кеша (без сетевого запроса):
queryClient.setQueryData<Post>(["posts", 1], updatedPost);

// Прочитать из кеша:
const cached = queryClient.getQueryData<Post>(["posts", 1]);

// Сбросить (удалить из кеша):
queryClient.removeQueries({ queryKey: ["posts", 1] });

// Prefetch (загрузить заранее):
await queryClient.prefetchQuery({
  queryKey: ["posts", nextId],
  queryFn: () => fetchPost(nextId),
  staleTime: 30_000,
});`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[1, 2, 3].map(id => (
          <button key={id} className={`btn ${postId === id ? "btn-active" : "btn-ghost"}`}
            onClick={() => setPostId(id)}>Post #{id}</button>
        ))}
        <button className="btn btn-ghost" onClick={() => {
          void queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
          addLog(`invalidate: posts.detail(${postId})`);
        }}>Invalidate</button>
        <button className="btn btn-ghost" onClick={() => {
          queryClient.setQueryData<Post>(postKeys.detail(postId), old =>
            old ? { ...old, title: "✏️ Manually updated " + Date.now() } : old
          );
          addLog(`setQueryData: posts.detail(${postId})`);
        }}>Manual Update</button>
        <button className="btn btn-ghost" onClick={async () => {
          const nextId = postId + 1;
          addLog(`prefetch: posts.detail(${nextId})`);
          await queryClient.prefetchQuery({
            queryKey: postKeys.detail(nextId),
            queryFn: () => fetchPost(nextId),
          });
          addLog(`prefetch done: posts.detail(${nextId})`);
        }}>Prefetch Next</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {postQuery.isLoading   && <span className="badge badge-warning">isLoading</span>}
        {postQuery.isFetching  && <span className="badge badge-info">isFetching</span>}
        {postQuery.isStale     && <span className="badge badge-warning">isStale (staleTime=5s)</span>}
        {postQuery.isSuccess   && !postQuery.isStale && <span className="badge badge-success">fresh</span>}
      </div>

      {postQuery.data && (
        <div className="card" style={{ marginBottom: 10, fontSize: 13 }}>
          <strong>#{postQuery.data.id}</strong>: {postQuery.data.title}
        </div>
      )}

      <div className="card" style={{ fontFamily: "monospace", fontSize: 11, minHeight: 80 }}>
        {log.length === 0
          ? <span style={{ color: "var(--text-dim)" }}>Cache operations log...</span>
          : log.map((l, i) => <div key={i} style={{ lineHeight: 1.8, color: "var(--text)" }}>{l}</div>)
        }
      </div>
    </div>
  );
}
