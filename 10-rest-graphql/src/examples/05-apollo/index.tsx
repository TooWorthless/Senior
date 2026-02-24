import { useState } from "react";
import {
  useQuery, useMutation, useLazyQuery, useApolloClient,
  gql, type ApolloError,
} from "@apollo/client";

// ─── GraphQL Queries / Mutations ───────────────────────────────────────────
const GET_CHARACTERS = gql`
  query GetCharacters($page: Int, $filter: FilterCharacter) {
    characters(page: $page, filter: $filter) {
      info { count pages next }
      results {
        id name status species gender image
        origin { name }
      }
    }
  }
`;

const GET_CHARACTER = gql`
  query GetCharacter($id: ID!) {
    character(id: $id) {
      id name status species gender image
      origin { name }
      episode { id name episode }
    }
  }
`;

const GET_EPISODES = gql`
  query GetEpisodes($page: Int) {
    episodes(page: $page) {
      info { count pages }
      results { id name episode air_date }
    }
  }
`;

// ─── Типы ──────────────────────────────────────────────────────────────────
interface Character {
  id: string; name: string; status: string; species: string;
  gender: string; image: string; origin: { name: string };
  episode?: Array<{ id: string; name: string; episode: string }>;
}
interface CharactersData {
  characters: {
    info: { count: number; pages: number; next: number | null };
    results: Character[];
  };
}
interface CharacterData { character: Character }
interface EpisodesData {
  episodes: {
    info: { count: number; pages: number };
    results: Array<{ id: string; name: string; episode: string; air_date: string }>;
  };
}

// ─── Компоненты ────────────────────────────────────────────────────────────
type Tab = "usequery" | "lazy" | "cache" | "concepts";

export default function ApolloDemo() {
  const [tab, setTab] = useState<Tab>("usequery");

  return (
    <div className="example-page">
      <h1>05 · Apollo Client</h1>
      <p className="subtitle">
        useQuery, useLazyQuery, useMutation, нормализованный кеш, fetch policies
      </p>

      <div className="btn-row">
        {(["usequery", "lazy", "cache", "concepts"] as Tab[]).map(t => (
          <button key={t} className={`btn ${tab === t ? "btn-active" : "btn-ghost"}`}
            onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "usequery" && <UseQueryTab />}
      {tab === "lazy"     && <LazyQueryTab />}
      {tab === "cache"    && <CacheTab />}
      {tab === "concepts" && <ConceptsTab />}
    </div>
  );
}

// ─── useQuery Tab ─────────────────────────────────────────────────────────
function UseQueryTab() {
  const [status, setStatus] = useState<"" | "Alive" | "Dead">("Alive");
  const [page, setPage] = useState(1);

  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery<CharactersData>(
    GET_CHARACTERS,
    {
      variables: { page, filter: status ? { status } : undefined },
      fetchPolicy: "cache-first",     // cache-first | cache-and-network | network-only | no-cache | cache-only
      notifyOnNetworkStatusChange: true, // networkStatus включает состояния
    }
  );

  const loadMore = () => {
    if (!data?.characters.info.next) return;
    void fetchMore({
      variables: { page: data.characters.info.next, filter: status ? { status } : undefined },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          characters: {
            ...fetchMoreResult.characters,
            results: [...prev.characters.results, ...fetchMoreResult.characters.results],
          },
        };
      },
    });
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">useQuery — основной хук для запросов</div>
        <pre className="code-block">{`const { data, loading, error, refetch, fetchMore, networkStatus } = useQuery(
  GET_CHARACTERS,
  {
    variables: { page: 1, filter: { status: "Alive" } },

    // fetchPolicy:
    // "cache-first"       → кеш если есть, иначе сеть (default)
    // "cache-and-network" → кеш сразу + фоновый запрос (stale-while-revalidate)
    // "network-only"      → всегда сеть, кешировать ответ
    // "no-cache"          → всегда сеть, НЕ кешировать
    // "cache-only"        → только кеш, ошибка если нет

    skip: !userId,          // пропустить запрос (условный)
    pollInterval: 5000,     // polling каждые 5 секунд
    notifyOnNetworkStatusChange: true, // для детальных статусов

    onCompleted: (data) => { /* данные получены */ },
    onError: (error) => { /* обработка ошибки */ },
  }
);

// networkStatus (requires notifyOnNetworkStatusChange: true):
// 1 = loading, 2 = setVariables, 3 = fetchMore, 4 = refetch
// 6 = polling, 7 = ready, 8 = error`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "var(--text-dim)", fontSize: 13 }}>Filter:</span>
        {(["", "Alive", "Dead"] as const).map(s => (
          <button key={s || "all"} className={`btn ${status === s ? "btn-active" : "btn-ghost"}`}
            onClick={() => { setStatus(s); setPage(1); }}>
            {s || "All"}
          </button>
        ))}
        <button className="btn btn-ghost" onClick={() => void refetch()}>Refetch</button>
        {loading && <span style={{ color: "var(--text-dim)", fontSize: 12 }}>⏳ NS:{networkStatus}</span>}
      </div>

      {error && <ErrorDisplay error={error} />}

      {data && (
        <div style={{ marginBottom: 8, fontSize: 12, color: "var(--text-dim)" }}>
          {data.characters.info.count} персонажей · Страница {page}/{data.characters.info.pages}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 12 }}>
        {data?.characters.results.map(c => (
          <CharacterCard key={c.id} char={c} />
        ))}
      </div>

      {data?.characters.info.next && (
        <button className="btn btn-ghost" onClick={loadMore} disabled={loading}>
          {loading ? "⏳" : "Load More (fetchMore)"}
        </button>
      )}
    </div>
  );
}

// ─── Lazy Query Tab ───────────────────────────────────────────────────────
function LazyQueryTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // useLazyQuery — не запускается при mount, вызывается вручную
  const [loadCharacter, { data, loading, error, called }] = useLazyQuery<CharacterData>(
    GET_CHARACTER,
    {
      fetchPolicy: "cache-first",
      onCompleted: (data) => {
        console.log("Loaded:", data.character.name);
      },
    }
  );

  // Предзагрузка через ImperativeAPI
  const client = useApolloClient();
  const prefetch = async (id: string) => {
    await client.query({
      query: GET_CHARACTER,
      variables: { id },
    });
  };

  const ids = ["1", "2", "3", "4", "5", "6"];

  return (
    <div>
      <div className="card">
        <div className="card-title">useLazyQuery — запрос по требованию</div>
        <pre className="code-block">{`// useQuery запускается СРАЗУ при render
// useLazyQuery запускается КОГДА МЫ ВЫЗЫВАЕМ его

const [loadUser, { data, loading, error, called }] = useLazyQuery(GET_USER, {
  fetchPolicy: "cache-first",
  onCompleted: (data) => setUser(data.user),
});

// Вызов:
<button onClick={() => loadUser({ variables: { id } })}>
  Load User
</button>

// called = false до первого вызова
// Повторный вызов с теми же variables → из кеша (cache-first)

// Императивный API (вне компонента):
const client = useApolloClient();
await client.query({ query: GET_USER, variables: { id } });
await client.mutate({ mutation: UPDATE_USER, variables: { id, input } });

// Prefetch при hover:
<Link
  onMouseEnter={() => client.query({ query: GET_ITEM, variables: { id } })}
  to={\`/items/\${id}\`}
>
  Item
</Link>`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {ids.map(id => (
          <button
            key={id}
            className={`btn ${selectedId === id ? "btn-active" : "btn-ghost"}`}
            onClick={() => {
              setSelectedId(id);
              loadCharacter({ variables: { id } });
            }}
            onMouseEnter={() => void prefetch(id)}
          >
            #{id}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 12 }}>
        💡 Hover на кнопки — prefetch через useApolloClient(). Повторные клики загружаются из кеша мгновенно.
      </p>

      {!called && (
        <div style={{ color: "var(--text-dim)", fontSize: 13 }}>Нажми на ID персонажа...</div>
      )}
      {loading && <div className="badge badge-warning">⏳ Loading...</div>}
      {error && <ErrorDisplay error={error} />}

      {data?.character && (
        <div className="card" style={{ display: "flex", gap: 16 }}>
          <img src={data.character.image} alt={data.character.name}
            style={{ width: 120, height: 120, borderRadius: 8, objectFit: "cover" }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{data.character.name}</div>
            <div style={{ color: getStatusColor(data.character.status), fontSize: 13, marginBottom: 2 }}>
              {data.character.status} · {data.character.species}
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: 12 }}>Origin: {data.character.origin.name}</div>
            {data.character.episode && (
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6 }}>
                Episodes: {data.character.episode.map(e => e.episode).join(", ")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cache Tab ────────────────────────────────────────────────────────────
function CacheTab() {
  const client = useApolloClient();
  const [cacheLog, setCacheLog] = useState<string[]>([]);
  const addLog = (msg: string) => setCacheLog(l => [msg, ...l.slice(0, 9)]);

  const readFromCache = () => {
    const cached = client.readQuery<CharactersData>({
      query: GET_CHARACTERS,
      variables: { page: 1, filter: { status: "Alive" } },
    });
    if (cached) {
      addLog(`📦 Cache hit: ${cached.characters.results.length} chars (page 1, Alive)`);
    } else {
      addLog("❌ Cache miss — данные не загружены");
    }
  };

  const writeToCache = () => {
    client.writeQuery<CharactersData>({
      query: GET_CHARACTERS,
      variables: { page: 1, filter: { status: "Alive" } },
      data: {
        characters: {
          info: { count: 1, pages: 1, next: null },
          results: [{
            id: "mock-1", name: "Manual Rick", status: "Alive",
            species: "Human", gender: "Male",
            image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
            origin: { name: "Earth" },
          }],
        },
      },
    });
    addLog("✏️ writeQuery: записан mock персонаж в кеш");
  };

  const clearCache = async () => {
    await client.clearStore();
    addLog("🗑️ clearStore: кеш полностью очищен");
  };

  const resetStore = async () => {
    await client.resetStore();
    addLog("🔄 resetStore: кеш очищен + все queries рефетчились");
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">InMemoryCache — нормализованный кеш</div>
        <pre className="code-block">{`// Apollo нормализует данные по { __typename + id }
// Character с id "1" хранится ОДИН РАЗ в кеше
// независимо от того через какой запрос пришёл

// Нормализованный кеш:
// {
//   "Character:1": { id: "1", name: "Rick", status: "Alive", ... },
//   "Character:2": { id: "2", name: "Morty", ... },
//   "ROOT_QUERY": {
//     "characters({page: 1})": { results: [REF(Character:1), REF(Character:2), ...] }
//   }
// }

// Когда UPDATE_CHARACTER обновляет Character:1 →
// АВТОМАТИЧЕСКИ обновляются ВСЕ компоненты использующие Character:1!

// Чтение из кеша:
const data = client.readQuery({ query: GET_USERS, variables: { page: 1 } });

// Запись в кеш (без сетевого запроса):
client.writeQuery({ query: GET_USERS, data: newData });

// Фрагмент (конкретный объект):
const char = client.readFragment({
  id: "Character:1",
  fragment: gql\`fragment F on Character { id name status }\`,
});

// Очистка:
client.clearStore();  // очистить, queries НЕ рефетчатся
client.resetStore();  // очистить + все active queries рефетчатся

// Cache policies:
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        characters: {
          keyArgs: ["filter"],  // только filter влияет на ключ кеша
          merge(existing, incoming, { args }) {
            // pagination merge:
            if (args?.page === 1) return incoming;
            return {
              ...incoming,
              results: [...(existing?.results ?? []), ...incoming.results],
            };
          },
        },
      },
    },
  },
});`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button className="btn btn-ghost" onClick={readFromCache}>Read Cache</button>
        <button className="btn btn-ghost" onClick={writeToCache}>Write Cache</button>
        <button className="btn btn-danger" onClick={() => void clearCache()}>clearStore</button>
        <button className="btn btn-warning" onClick={() => void resetStore()}>resetStore</button>
      </div>

      <div className="card" style={{ fontFamily: "monospace", fontSize: 12, minHeight: 100 }}>
        {cacheLog.length === 0
          ? <span style={{ color: "var(--text-dim)" }}>Cache log...</span>
          : cacheLog.map((l, i) => <div key={i} style={{ lineHeight: 1.8 }}>{l}</div>)
        }
      </div>
    </div>
  );
}

// ─── Concepts Tab ─────────────────────────────────────────────────────────
function ConceptsTab() {
  return (
    <div>
      <div className="card">
        <div className="card-title">Apollo vs TanStack Query — когда что</div>
        <pre className="code-block">{`// ┌───────────────────┬──────────────────┬─────────────────────┐
// │                   │  TanStack Query  │  Apollo Client      │
// ├───────────────────┼──────────────────┼─────────────────────┤
// │ Протокол          │ REST/любой       │ GraphQL             │
// │ Нормализация      │ Нет              │ ✅ по __typename+id │
// │ Авто-обновление   │ Invalidation     │ ✅ автоматически    │
// │ Subscriptions     │ Нет (polling)    │ ✅ встроены         │
// │ Типогенерация     │ Вручную          │ graphql-codegen     │
// │ Bundle size       │ ~14KB            │ ~37KB               │
// │ Сложность setup   │ Низкая           │ Средняя             │
// │ REST support      │ ✅               │ Возможно (apollo-link) │
// └───────────────────┴──────────────────┴─────────────────────┘

// Использовать Apollo когда:
// ✅ GraphQL API
// ✅ Нормализация кеша важна (много перекрёстных данных)
// ✅ GraphQL Subscriptions
// ✅ Codegen для типов

// Использовать TanStack Query когда:
// ✅ REST API
// ✅ Простое требование к кешу
// ✅ Минимальный bundle`}</pre>
      </div>

      <div className="card">
        <div className="card-title">Optimistic UI в Apollo</div>
        <pre className="code-block">{`// useMutation с optimisticResponse:
const [likePost] = useMutation(LIKE_POST, {
  optimisticResponse: {
    likePost: {
      __typename: "Post",
      id: postId,
      likes: post.likes + 1, // предположительный результат
    },
  },
  // Если mutation успешна → optimistic заменяется реальным ответом
  // Если ошибка → откат к предыдущему состоянию (автоматически!)
});

// Apollo откатывает optimistic при ошибке автоматически —
// не нужен ручной rollback как в TanStack Query!`}</pre>
      </div>

      <div className="card">
        <div className="card-title">graphql-codegen — типогенерация</div>
        <pre className="code-block">{`# codegen.ts:
import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://rickandmortyapi.com/graphql",
  documents: ["src/**/*.tsx"],       // сканирует gql\`...\` в коде
  generates: {
    "./src/__generated__/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",  // генерирует хуки!
      ],
    },
  },
};

# Запуск:
npx graphql-codegen --config codegen.ts

# Результат — сгенерированные типы И хуки:
import { useGetCharactersQuery } from "./__generated__/graphql";

function Characters() {
  const { data } = useGetCharactersQuery({ variables: { page: 1 } });
  // data: GetCharactersQuery — ПОЛНОСТЬЮ типизировано!
  data?.characters.results[0].name; // TypeScript знает тип!
}`}</pre>
      </div>

      <div className="card" style={{ borderLeftColor: "var(--amber)", borderLeftWidth: 3 }}>
        <div className="card-title" style={{ color: "var(--amber)" }}>Вопросы на интервью</div>
        {[
          "Что такое нормализованный кеш Apollo и почему это важно?",
          "fetchPolicy: cache-first vs cache-and-network — разница?",
          "Как работает optimistic UI в Apollo (без ручного rollback)?",
          "Чем useLazyQuery отличается от useQuery?",
          "Когда использовать Apollo, когда TanStack Query?",
          "Что такое __typename и зачем он в Apollo Cache?",
        ].map((q, i) => (
          <div key={i} style={{ color: "var(--text)", fontSize: 13, lineHeight: 2 }}>▸ {q}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Вспомогательные компоненты ────────────────────────────────────────────
function CharacterCard({ char }: { char: Character }) {
  return (
    <div className="card" style={{ padding: 8, textAlign: "center" }}>
      <img src={char.image} alt={char.name} style={{ width: "100%", borderRadius: 6, marginBottom: 6 }} />
      <div style={{ fontSize: 11, fontWeight: 600 }}>{char.name}</div>
      <div style={{ fontSize: 10, color: getStatusColor(char.status) }}>{char.status}</div>
    </div>
  );
}

function ErrorDisplay({ error }: { error: ApolloError }) {
  return (
    <div className="badge badge-error" style={{ marginBottom: 8 }}>
      {error.networkError
        ? `Network: ${error.networkError.message}`
        : error.graphQLErrors.map(e => e.message).join("; ")
      }
    </div>
  );
}

function getStatusColor(status: string) {
  return status === "Alive" ? "var(--green)" : status === "Dead" ? "var(--red)" : "var(--text-dim)";
}
