import { useState } from "react";

export default function ServerComponents() {
  const [tab, setTab] = useState<"concept" | "boundary" | "patterns">("concept");

  return (
    <div className="example-page">
      <h1>12 · React Server Components</h1>
      <p className="subtitle">RSC концепция, Client/Server boundary, serialization</p>

      <div className="highlight">
        RSC — это архитектурная концепция. Живой demo требует Next.js App Router или
        аналогичный RSC-поддерживающий фреймворк. Здесь — теория + интерактивные схемы.
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        {(["concept", "boundary", "patterns"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "concept"  && <ConceptSection />}
      {tab === "boundary" && <BoundarySection />}
      {tab === "patterns" && <PatternsSection />}
    </div>
  );
}

function ConceptSection() {
  const [showRSC, setShowRSC] = useState(false);
  return (
    <section style={{ marginTop: 16 }}>
      <h2>Что такое RSC</h2>

      <div className="card">
        <h3>Server Components vs Client Components</h3>
        <div className="code-block">{`// Server Component (по умолчанию в Next.js App Router):
// app/page.tsx
async function UserPage({ params }) {
  // Выполняется НА СЕРВЕРЕ
  const user = await db.users.findOne(params.id); // прямой доступ к БД!
  const posts = await fetch("...", { cache: "no-store" });

  return (
    <div>
      <h1>{user.name}</h1>
      <PostList posts={posts} />   {/* тоже server компонент */}
      <LikeButton postId={...} />  {/* client компонент */}
    </div>
  );
}
// ✅ Нет bundle size (код не идёт в браузер)
// ✅ Прямой доступ к БД, файловой системе, секретам
// ✅ Автоматическое кеширование fetch
// ❌ Нет хуков (useState, useEffect, etc.)
// ❌ Нет event handlers
// ❌ Нет browser API (window, localStorage)

// Client Component:
"use client"; // директива — всё ниже = клиентский код
import { useState } from "react";

function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);
  return (
    <button onClick={() => setLiked(v => !v)}>
      {liked ? "❤️" : "🤍"}
    </button>
  );
}`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Как работает под капотом</h3>
        <div className="code-block">{`// 1. Сервер выполняет Server Components
//    → генерирует RSC Payload (специальный формат, не HTML)
//    → RSC Payload = дерево компонентов + данные + ссылки на client chunks

// 2. Браузер получает RSC Payload
//    → React hydrates (оживляет) client компоненты
//    → Server компоненты уже "встроены" в payload

// 3. При навигации (SPA):
//    → Fetch нового RSC Payload (не полная перезагрузка)
//    → React diff-ит старое дерево с новым
//    → Сохраняет state клиентских компонентов!

// RSC vs SSR:
// SSR = рендер всего дерева на сервере в HTML → hydration
// RSC = часть дерева всегда на сервере, часть на клиенте
//       RSC можно использовать вместе с SSR (и Next.js так делает)`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Что НЕ сериализуется через Server → Client границу</h3>
        <button className="btn ghost" style={{ fontSize: 12, marginBottom: 10 }}
          onClick={() => setShowRSC(v => !v)}>
          {showRSC ? "Скрыть" : "Показать таблицу"}
        </button>
        {showRSC && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#21262d" }}>
                <th style={{ padding: "6px 10px", border: "1px solid var(--border)", textAlign: "left" }}>Тип</th>
                <th style={{ padding: "6px 10px", border: "1px solid var(--border)", textAlign: "left" }}>Передаётся?</th>
                <th style={{ padding: "6px 10px", border: "1px solid var(--border)", textAlign: "left" }}>Альтернатива</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["string, number, boolean", "✅", "—"],
                ["null, undefined", "✅", "—"],
                ["Array, plain object", "✅", "—"],
                ["Date", "✅ (ISO string)", "—"],
                ["Function", "❌", "Только Server Actions (async fn)"],
                ["Symbol", "❌", "—"],
                ["Map, Set", "❌", "Конвертировать в Array"],
                ["класс инстанс", "❌", "plain object"],
                ["Promise", "✅ (unwrapped)", "Suspense"],
                ["JSX / React element", "✅ (если Server)", "—"],
              ].map(([type, ok, alt]) => (
                <tr key={type}>
                  <td style={{ padding: "5px 10px", border: "1px solid var(--border)", color: "var(--blue)", fontFamily: "monospace" }}>{type}</td>
                  <td style={{ padding: "5px 10px", border: "1px solid var(--border)", color: ok === "✅" ? "var(--green)" : "var(--red)" }}>{ok}</td>
                  <td style={{ padding: "5px 10px", border: "1px solid var(--border)", color: "var(--text-dim)", fontSize: 11 }}>{alt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function BoundarySection() {
  const [example, setExample] = useState<"donut" | "lifting" | "interleaving">("donut");
  return (
    <section style={{ marginTop: 16 }}>
      <h2>Client/Server Boundary</h2>

      <div className="btn-row">
        {(["donut", "lifting", "interleaving"] as const).map(e => (
          <button key={e} className={`btn${example === e ? "" : " ghost"}`}
            style={{ fontSize: 12 }} onClick={() => setExample(e)}>{e}</button>
        ))}
      </div>

      {example === "donut" && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>"Donut" паттерн — RSC внутри Client</h3>
          <div className="code-block">{`// ⚠️ Проблема: клиентский компонент импортирует серверный
"use client";
import ServerComponent from "./ServerComponent"; // ❌ ServerComponent становится клиентским!

// ✅ Решение: children prop (donut pattern)
// ServerComponent передаётся как children извне:

// app/page.tsx (Server)
import ClientWrapper from "./ClientWrapper";
import ServerComponent from "./ServerComponent";

export default function Page() {
  return (
    <ClientWrapper>
      <ServerComponent /> {/* ✅ RSC внутри клиентского через children */}
    </ClientWrapper>
  );
}

// ClientWrapper.tsx
"use client";
function ClientWrapper({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(v => !v)}>Toggle</button>
      {open && children} {/* ServerComponent не становится клиентским! */}
    </div>
  );
}`}</div>
          <div style={{ background: "#21262d", padding: 12, borderRadius: 6, marginTop: 10, fontSize: 12 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <span style={{ background: "#1e3a5f", padding: "4px 12px", borderRadius: 4, color: "var(--blue)" }}>
                🖥️ Server Component (Page)
              </span>
            </div>
            <div style={{ border: "2px dashed var(--amber)", padding: 12, borderRadius: 6 }}>
              <div style={{ textAlign: "center", color: "var(--amber)", fontSize: 11, marginBottom: 8 }}>
                💻 ClientWrapper ("use client")
              </div>
              <div style={{ background: "#1e3a5f", padding: 8, borderRadius: 4, textAlign: "center", fontSize: 12, color: "var(--blue)" }}>
                🖥️ ServerComponent (children — остаётся Server!)
              </div>
            </div>
          </div>
        </div>
      )}

      {example === "lifting" && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Lifting state up — Server как "оркестратор"</h3>
          <div className="code-block">{`// Серверный компонент — оркестратор:
// Получает данные, передаёт в клиентские через props

// app/dashboard/page.tsx (Server)
async function DashboardPage() {
  // Параллельный fetch на сервере (нет waterfall!)
  const [user, stats, notifications] = await Promise.all([
    fetchUser(),
    fetchStats(),
    fetchNotifications(),
  ]);

  return (
    <Dashboard>
      {/* Передаём serialize-able данные в клиентские компоненты */}
      <UserHeader user={user} />           {/* Server */}
      <StatsChart data={stats} />          {/* Client — нужны animations */}
      <NotificationBell count={notifications.length} /> {/* Client */}
    </Dashboard>
  );
}

// Waterfall проблема:
// Client-only: fetch user → fetch stats → fetch notifications (3 roundtrips)
// RSC: все 3 fetch параллельно на сервере → 1 roundtrip клиент-сервер`}</div>
        </div>
      )}

      {example === "interleaving" && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Interleaving — чередование Server и Client</h3>
          <div className="code-block">{`// Корректное чередование:
// Page (Server)
//   ├── Header (Server)
//   ├── SearchBar (Client) ← "use client"
//   │   └── SearchSuggestions (Client) ← наследует client
//   ├── ProductList (Server) ← можно вернуться в server!
//   │   └── ProductCard (Server)
//   │       └── LikeButton (Client) ← "use client"
//   └── Footer (Server)

// ПРАВИЛО: Граница идёт вниз
// Раз "use client" — всё дерево ниже становится клиентским
// Кроме children/slots которые пришли сверху (donut pattern)

// Нельзя:
"use client";
async function ClientAsync() {   // ❌ async не работает в клиентских
  const data = await fetch(...); // ❌
}

// Можно (Server Action):
"use client";
import { submitForm } from "@/actions/form"; // server action
function Form() {
  return <form action={submitForm}>...</form>; // ✅`}</div>
        </div>
      )}
    </section>
  );
}

function PatternsSection() {
  return (
    <section style={{ marginTop: 16 }}>
      <h2>Паттерны RSC</h2>

      <div className="card">
        <h3>Server Actions</h3>
        <div className="code-block">{`// Server Actions — async функции выполняемые на сервере
// Вызываются с клиента как обычные функции
// Встроенный RPC механизм

// actions/user.ts
"use server";
export async function updateUser(id: string, data: FormData) {
  await db.users.update(id, {
    name: data.get("name") as string,
  });
  revalidatePath("/users"); // инвалидировать кеш
}

// Использование в Client Component:
"use client";
import { updateUser } from "@/actions/user";
import { useActionState } from "react"; // React 19

function UserForm({ userId }) {
  const [state, action, isPending] = useActionState(
    async (prev, formData) => {
      await updateUser(userId, formData);
      return { success: true };
    },
    null
  );

  return (
    <form action={action}>
      <input name="name" />
      <button disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </button>
      {state?.success && <p>Saved!</p>}
    </form>
  );
}`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>React 19 Новые хуки</h3>
        <div className="code-block">{`// useActionState — замена useReducer для async actions
const [state, dispatch, isPending] = useActionState(action, initialState);

// useFormStatus — статус ближайшей родительской формы
import { useFormStatus } from "react-dom";
function SubmitButton() {
  const { pending } = useFormStatus(); // знает о родительской form
  return <button disabled={pending}>{pending ? "..." : "Submit"}</button>;
}

// useOptimistic — оптимистичное обновление UI
const [optimisticTodos, addOptimisticTodo] = useOptimistic(
  serverTodos,
  (state, newTodo) => [...state, { ...newTodo, sending: true }]
);

// use() — await Promise/Context в render
import { use } from "react";
function UserName({ userPromise }) {
  const user = use(userPromise); // suspend если Promise не resolved
  return <span>{user.name}</span>;
}

// ref как обычный prop (React 19):
function Input({ ref, ...props }) { // ← нет forwardRef!
  return <input ref={ref} {...props} />;
}`}</div>
      </div>
    </section>
  );
}
