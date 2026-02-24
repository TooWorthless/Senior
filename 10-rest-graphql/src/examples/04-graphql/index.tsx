import { useState } from "react";

// ─── Простой GraphQL client поверх fetch ──────────────────────────────────
const GQL_URL = "https://rickandmortyapi.com/graphql";

interface GqlResponse<T> { data?: T; errors?: Array<{ message: string; locations?: Array<{ line: number; column: number }> }> }

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as GqlResponse<T>;

  if (json.errors?.length) {
    throw new Error(json.errors.map(e => e.message).join("; "));
  }

  return json.data as T;
}

// ─── Типы ──────────────────────────────────────────────────────────────────
interface Character {
  id: string; name: string; status: string; species: string;
  gender: string; origin: { name: string }; image: string;
}
interface CharactersResult {
  characters: { results: Character[]; info: { count: number; pages: number; next: number | null } };
}
interface Episode {
  id: string; name: string; episode: string; air_date: string;
  characters: Array<{ id: string; name: string; image: string }>;
}
interface EpisodeResult { episode: Episode }

// ─── Queries ───────────────────────────────────────────────────────────────
const CHARACTERS_QUERY = `
  query GetCharacters($page: Int, $filter: FilterCharacter) {
    characters(page: $page, filter: $filter) {
      info { count pages next }
      results {
        id name status species gender
        origin { name }
        image
      }
    }
  }
`;

const EPISODE_QUERY = `
  query GetEpisode($id: ID!) {
    episode(id: $id) {
      id name episode air_date
      characters { id name image }
    }
  }
`;

// Fragment:
const CHARACTER_FIELDS = `
  fragment CharacterFields on Character {
    id name status species image
    origin { name }
  }
`;

const WITH_FRAGMENT = `
  ${CHARACTER_FIELDS}
  query GetCharactersWithFragment($page: Int) {
    characters(page: $page) {
      results { ...CharacterFields }
    }
  }
`;

// ─── Компоненты ────────────────────────────────────────────────────────────
type Tab = "schema" | "queries" | "variables" | "fragments";

export default function GraphqlDemo() {
  const [tab, setTab] = useState<Tab>("schema");

  return (
    <div className="example-page">
      <h1>04 · GraphQL</h1>
      <p className="subtitle">
        Schema, types, queries, mutations, fragments, variables · Rick & Morty API
      </p>

      <div className="btn-row">
        {(["schema", "queries", "variables", "fragments"] as Tab[]).map(t => (
          <button key={t} className={`btn ${tab === t ? "btn-active" : "btn-ghost"}`}
            onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "schema"    && <SchemaTab />}
      {tab === "queries"   && <QueriesTab />}
      {tab === "variables" && <VariablesTab />}
      {tab === "fragments" && <FragmentsTab />}
    </div>
  );
}

// ─── Schema Tab ───────────────────────────────────────────────────────────
function SchemaTab() {
  return (
    <div>
      <div className="card">
        <div className="card-title">GraphQL Schema — основы</div>
        <pre className="code-block">{`# GraphQL — типизированный язык запросов к API
# Один endpoint (обычно /graphql) vs REST (множество endpoint)

# ── Scalar Types ──────────────────────────────────────────
scalar String   # строка
scalar Int      # 32-bit целое
scalar Float    # 64-bit дробное
scalar Boolean
scalar ID       # уникальный идентификатор (строка или число)

# ── Object Types ──────────────────────────────────────────
type Character {
  id: ID!            # ! = non-nullable (обязательное поле)
  name: String!
  status: String     # nullable (может быть null)
  species: String!
  image: String!
  origin: Location!  # вложенный тип
  episodes: [Episode!]! # массив non-null, само поле non-null
}

type Location { id: ID!; name: String!; type: String }

# ── Root Types ─────────────────────────────────────────────
type Query {            # точки входа для чтения
  character(id: ID!): Character
  characters(page: Int, filter: FilterCharacter): Characters
}

type Mutation {         # точки входа для изменений
  createCharacter(input: CharacterInput!): Character!
  updateCharacter(id: ID!, input: CharacterInput!): Character!
  deleteCharacter(id: ID!): Boolean!
}

type Subscription {     # real-time
  characterUpdated(id: ID!): Character!
}

# ── Input Types (для аргументов mutation) ─────────────────
input CharacterInput { name: String!; status: String; species: String! }

# ── Enum ──────────────────────────────────────────────────
enum CharacterStatus { ALIVE DEAD UNKNOWN }

# ── Interface ─────────────────────────────────────────────
interface Node { id: ID! }
type Character implements Node { id: ID!; name: String! }

# ── Union ─────────────────────────────────────────────────
union SearchResult = Character | Location | Episode`}</pre>
      </div>

      <div className="card">
        <div className="card-title">REST vs GraphQL — сравнение</div>
        <pre className="code-block">{`// ┌─────────────────┬──────────────────┬──────────────────┐
// │                 │      REST        │    GraphQL       │
// ├─────────────────┼──────────────────┼──────────────────┤
// │ Endpoints       │ Множество        │ Один (/graphql)  │
// │ Over-fetching   │ Да (лишние поля) │ Нет (только что надо) │
// │ Under-fetching  │ N+1 запросов     │ Вложенные запросы │
// │ Типизация       │ Доп. инструменты │ Встроена в схему │
// │ Версионирование │ v1, v2, v3...    │ Deprecated fields │
// │ Кеширование     │ HTTP кеш         │ Нормализованный кеш │
// │ Batch запросы   │ Вручную          │ Из коробки       │
// │ Real-time       │ Polling/SSE/WS   │ Subscriptions    │
// │ Upload files    │ multipart/form   │ Через upload scalar │
// └─────────────────┴──────────────────┴──────────────────┘

// N+1 проблема в REST:
GET /posts           → 10 постов
GET /users/1         → автор поста 1
GET /users/2         → автор поста 2
... ещё 8 запросов   → 11 запросов итого!

// GraphQL решает в один запрос:
query {
  posts {
    id title
    author { id name } // вложенный запрос, один HTTP запрос
  }
}`}</pre>
      </div>
    </div>
  );
}

// ─── Queries Tab ──────────────────────────────────────────────────────────
function QueriesTab() {
  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChars = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gql<CharactersResult>(CHARACTERS_QUERY, { page: 1 });
      setChars(data.characters.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Query — чтение данных</div>
        <pre className="code-block">{`# Query — операция чтения (аналог GET в REST)
query GetCharacters($page: Int) {    # имя опционально, $page — переменная
  characters(page: $page) {
    info { count pages next }        # выбираем только нужные поля!
    results {
      id name status species image
      origin { name }                # вложенные объекты
    }
  }
}

# Краткий синтаксис (без имени и ключевого слова query):
{ characters { results { id name } } }  # только для чтения

# Alias — переименовать поле в ответе:
query {
  alive: characters(filter: { status: "Alive" }) {
    info { count }
  }
  dead: characters(filter: { status: "Dead" }) {
    info { count }
  }
}

# __typename — узнать тип объекта (важно для union/interface):
query {
  search(text: "Rick") {
    __typename      # "Character" | "Location" | "Episode"
    ... on Character { name }
    ... on Location { name type }
  }
}`}</pre>
      </div>

      <button className="btn btn-primary" onClick={fetchChars} disabled={loading} style={{ marginBottom: 12 }}>
        {loading ? "⏳ Querying..." : "Run Query (Rick & Morty API)"}
      </button>

      {error && <div className="badge badge-error" style={{ marginBottom: 8 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
        {chars.map(c => (
          <div key={c.id} className="card" style={{ padding: 8, textAlign: "center" }}>
            <img src={c.image} alt={c.name} style={{ width: "100%", borderRadius: 6, marginBottom: 6 }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{c.name}</div>
            <div style={{ fontSize: 10, color: getStatusColor(c.status) }}>{c.status} · {c.species}</div>
            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{c.origin.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variables Tab ────────────────────────────────────────────────────────
function VariablesTab() {
  const [status, setStatus] = useState<"Alive" | "Dead" | "unknown">("Alive");
  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const data = await gql<CharactersResult>(CHARACTERS_QUERY, {
        page: 1,
        filter: { status },
      });
      setChars(data.characters.results.slice(0, 6));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Variables — параметры запросов</div>
        <pre className="code-block">{`# ❌ Никогда не интерполируй данные в строку запроса:
const query = \`query { character(id: "\${userInput}") { name } }\`;
# SQL injection аналог — GraphQL injection!

# ✅ Всегда используй Variables:
const QUERY = \`
  query GetCharacters($page: Int, $filter: FilterCharacter) {
    characters(page: $page, filter: $filter) {
      results { id name status }
    }
  }
\`;

# HTTP запрос:
POST /graphql
{
  "query": "...",
  "variables": { "page": 1, "filter": { "status": "Alive" } }
}

# Дефолтные значения:
query GetChars($page: Int = 1, $status: String = "Alive") { ... }

# Директивы @skip и @include:
query GetChar($withEpisodes: Boolean!) {
  character(id: 1) {
    name
    episodes @include(if: $withEpisodes) { name }
    origin   @skip(if: false) { name }
  }
}`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ color: "var(--text-dim)", fontSize: 13 }}>Status filter:</span>
        {(["Alive", "Dead", "unknown"] as const).map(s => (
          <button key={s} className={`btn ${status === s ? "btn-active" : "btn-ghost"}`}
            onClick={() => setStatus(s)}>{s}</button>
        ))}
        <button className="btn btn-primary" onClick={search} disabled={loading}>
          {loading ? "⏳" : "Query"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
        {chars.map(c => (
          <div key={c.id} className="card" style={{ padding: 8, textAlign: "center" }}>
            <img src={c.image} alt={c.name} style={{ width: "100%", borderRadius: 6, marginBottom: 4 }} />
            <div style={{ fontSize: 11, fontWeight: 600 }}>{c.name}</div>
            <span style={{ color: getStatusColor(c.status), fontSize: 10 }}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fragments Tab ────────────────────────────────────────────────────────
function FragmentsTab() {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(false);
  const [episodeId, setEpisodeId] = useState(1);

  const fetchEpisode = async () => {
    setLoading(true);
    try {
      const data = await gql<EpisodeResult>(EPISODE_QUERY, { id: episodeId });
      setEpisode(data.episode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Fragments — переиспользование полей</div>
        <pre className="code-block">{`# Fragment — именованный набор полей для переиспользования
fragment CharacterFields on Character {
  id name status species image
  origin { name }
}

# Использование в запросах (spread синтаксис ...):
query GetChars($page: Int) {
  characters(page: $page) {
    results { ...CharacterFields }  # вставить все поля фрагмента
  }
}

query GetEpisode($id: ID!) {
  episode(id: $id) {
    name episode
    characters { ...CharacterFields }  # тот же фрагмент в другом месте
  }
}

# Inline fragment — для union/interface:
query Search($text: String!) {
  search(text: $text) {
    ... on Character { id name status }   # если Character
    ... on Location  { id name type }     # если Location
    ... on Episode   { id name episode }  # если Episode
    __typename                            # узнать тип
  }
}

# Fragments в Apollo Client — нормализованный кеш:
// Идентификация объектов: { __typename: "Character", id: "1" }
// Автоматическое обновление всех компонентов использующих Character #1!`}</pre>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ color: "var(--text-dim)", fontSize: 13 }}>Episode:</span>
        {[1, 2, 3, 5].map(id => (
          <button key={id} className={`btn ${episodeId === id ? "btn-active" : "btn-ghost"}`}
            onClick={() => setEpisodeId(id)}>#{id}</button>
        ))}
        <button className="btn btn-primary" onClick={fetchEpisode} disabled={loading}>
          {loading ? "⏳" : "Fetch"}
        </button>
      </div>

      {episode && (
        <div className="card">
          <div style={{ marginBottom: 10 }}>
            <span style={{ color: "var(--amber)", fontFamily: "monospace", fontSize: 12 }}>
              {episode.episode}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, marginLeft: 10 }}>{episode.name}</span>
            <span style={{ color: "var(--text-dim)", fontSize: 12, marginLeft: 10 }}>{episode.air_date}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 6 }}>
            {episode.characters.slice(0, 12).map(c => (
              <div key={c.id} style={{ textAlign: "center" }}>
                <img src={c.image} alt={c.name} style={{ width: "100%", borderRadius: 4 }} />
                <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 2 }}>{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  return status === "Alive" ? "var(--green)" : status === "Dead" ? "var(--red)" : "var(--text-dim)";
}
