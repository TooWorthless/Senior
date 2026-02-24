import { useState } from "react";
import { useFetch } from "./hooks";

interface Post { id: number; title: string; body: string; userId: number }

export default function UseFetchDemo() {
  const [postId, setPostId] = useState<number | null>(null);
  const url = postId ? `https://jsonplaceholder.typicode.com/posts/${postId}` : null;
  const { data, error, loading, refetch } = useFetch<Post>(url);

  return (
    <section style={{ marginTop: 16 }}>
      <h2>useFetch</h2>
      <div className="card">
        <h3>Реализация</h3>
        <div className="code-block">{`function useFetch<T>(url: string | null) {
  const [state, setState] = useState<FetchState<T>>(initial);
  const [refetchFlag, setRefetchFlag] = useState(0);

  useEffect(() => {
    if (!url) return;
    let ignore = false; // race condition prevention
    setState(s => ({ ...s, loading: true, error: null }));

    fetch(url)
      .then(res => { if (!res.ok) throw new Error(\`HTTP \${res.status}\`); return res.json(); })
      .then(data => { if (!ignore) setState({ data, error: null, loading: false }); })
      .catch(error => { if (!ignore) setState({ data: null, error, loading: false }); });

    return () => { ignore = true; }; // cleanup предыдущего запроса
  }, [url, refetchFlag]); // refetchFlag → ручное обновление

  const refetch = useCallback(() => setRefetchFlag(n => n + 1), []);
  return { ...state, refetch };
}`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Живое демо — JSONPlaceholder API</h3>
        <div className="btn-row">
          {[1, 2, 3, 4, 5].map(id => (
            <button key={id} className={`btn${postId === id ? "" : " ghost"}`}
              style={{ fontSize: 12 }} onClick={() => setPostId(id)}>
              Post #{id}
            </button>
          ))}
          {data && (
            <button className="btn ghost" style={{ fontSize: 12 }} onClick={refetch}>
              ↻ Refetch
            </button>
          )}
        </div>

        {!postId && (
          <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 10 }}>
            Выбери пост для загрузки...
          </p>
        )}
        {loading && (
          <div style={{ color: "var(--amber)", fontSize: 13, marginTop: 10 }}>
            ⏳ Загрузка...
          </div>
        )}
        {error && (
          <div style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>
            ❌ Ошибка: {error.message}
          </div>
        )}
        {data && !loading && (
          <div style={{ background: "#21262d", padding: 12, borderRadius: 6, marginTop: 10 }}>
            <div style={{ color: "var(--blue)", fontWeight: "bold", marginBottom: 4 }}>
              #{data.id} {data.title}
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: 13 }}>{data.body}</div>
          </div>
        )}
      </div>
    </section>
  );
}
