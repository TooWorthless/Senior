# 12 · React Server Components

[← Назад](../../../README.md)

---

## Содержание

- [Server vs Client Components](#server-vs-client-components)
- [RSC Payload](#rsc-payload)
- [Client/Server Boundary](#clientserver-boundary)
- [Donut Pattern](#donut-pattern)
- [Что сериализуется](#что-сериализуется)
- [Server Actions](#server-actions)
- [Fetching в RSC](#fetching-в-rsc)
- [React 19 новые хуки](#react-19-новые-хуки)
- [RSC vs SSR](#rsc-vs-ssr)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## Server vs Client Components

```tsx
// Server Component (default в Next.js App Router):
// Файл без "use client" → Server Component

async function ProductPage({ params }: { params: { id: string } }) {
  // ✅ Прямой доступ к БД (no API layer!)
  const product = await db.products.findById(params.id);
  // ✅ Переменные окружения (без NEXT_PUBLIC_ префикса)
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  // ✅ Файловая система
  const config = await fs.readFile("./config.json", "utf-8");
  // ✅ Нет bundle size — этот код не идёт клиенту!

  return (
    <div>
      <h1>{product.name}</h1>
      <AddToCart productId={product.id} /> {/* Client Component */}
    </div>
  );
}

// Client Component — добавь директиву в начало файла:
"use client";

import { useState } from "react";

function AddToCart({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false); // ✅ state
  return (
    <button onClick={() => setAdded(true)}> {/* ✅ events */}
      {added ? "Added!" : "Add to Cart"}
    </button>
  );
}
```

### Что доступно где

| Возможность | Server | Client |
|-------------|--------|--------|
| `async/await` в компоненте | ✅ | ❌ |
| Прямой доступ к БД | ✅ | ❌ |
| Секретные env переменные | ✅ | ❌ |
| `useState`, `useEffect` | ❌ | ✅ |
| Event handlers | ❌ | ✅ |
| Browser API | ❌ | ✅ |
| Идёт в bundle клиента | ❌ | ✅ |
| `use client` директива | Нет | Нужна |

---

## RSC Payload

RSC Payload — специальный формат (не HTML, не JSON) который сервер отправляет клиенту.

```
Содержит:
- Rendered output server компонентов (как виртуальный DOM)
- Placeholders для client компонентов (ссылки на chunk)
- Данные для гидрации client компонентов

Формат (упрощённо):
0:["$","div",null,{"children":[
  ["$","h1",null,{"children":"Product Name"}],
  ["$","$L1",null,{"productId":"123"}]  ← placeholder для AddToCart
]}]
1:I["(app)/components/AddToCart","AddToCart"]  ← chunk reference
```

**При навигации (SPA):**
- Браузер запрашивает RSC Payload (не полную страницу)
- React diff-ит старое дерево с новым
- State клиентских компонентов **сохраняется** при навигации

---

## Client/Server Boundary

Граница распространяется **вниз** по дереву:

```tsx
// "use client" помечает компонент и ВСЁ ниже него как клиентское
"use client";
function ClientComponent() {
  // Всё что рендерится здесь — клиентское!
  return <DeepChild />; // DeepChild тоже клиентский, даже без "use client"
}

// Граница НЕ распространяется вверх:
// Если ClientComponent импортирован в Server Component — это ОК
```

**Дерево компонентов:**
```
Page (Server)
  ├── Header (Server) — нет boundary
  ├── SearchBar (Client) ← "use client"
  │   └── Dropdown (Client) — наследует, нет "use client"
  ├── ProductList (Server) ← можно вернуться в Server!
  │   ├── ProductCard (Server)
  │   │   └── LikeButton (Client) ← "use client"
  │   └── ProductCard (Server)
  └── Footer (Server)
```

---

## Donut Pattern

Проблема: client компонент не может **импортировать** server компонент.

```tsx
// ❌ Импорт server компонента в client → server становится клиентским
"use client";
import ServerComponent from "./ServerComponent"; // ← ServerComponent теперь клиентский!

function ClientWrapper() {
  return (
    <div>
      <ServerComponent /> {/* Будет исполняться на клиенте */}
    </div>
  );
}
```

**Решение — children (donut pattern):**

```tsx
// app/page.tsx (Server)
import ClientWrapper from "./ClientWrapper";
import ServerComponent from "./ServerComponent";

export default function Page() {
  return (
    <ClientWrapper>
      {/* ServerComponent передаётся как уже отрендеренный children */}
      <ServerComponent />
    </ClientWrapper>
  );
}

// ClientWrapper.tsx (Client)
"use client";
function ClientWrapper({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(v => !v)}>Toggle</button>
      {open && children} {/* children — уже Server RSC payload, не импорт */}
    </div>
  );
}
```

**Почему это работает:** `children` prop — это уже готовый RSC output от сервера. Client компонент не "знает" что это server component — он просто рендерит переданный children.

---

## Что сериализуется

Через Server → Client границу можно передавать только **сериализуемые** данные (как JSON, плюс некоторые расширения):

```tsx
// ✅ Сериализуется:
<ClientComp
  count={42}                    // number
  name="Alice"                  // string
  active={true}                 // boolean
  items={[1, 2, 3]}             // Array
  user={{ id: 1, name: "A" }}   // plain object
  date={new Date()}             // Date (серилизуется как ISO строка)
  action={serverAction}         // Server Action (специальный тип)
/>

// ❌ НЕ сериализуется:
<ClientComp
  onClick={() => {}}            // ❌ Function!
  handler={handleEvent}         // ❌ Function!
  data={new Map()}              // ❌ Map
  ids={new Set([1, 2])}         // ❌ Set
  instance={new MyClass()}      // ❌ Class instance
  symbol={Symbol("id")}         // ❌ Symbol
/>

// Решение для функций — Server Actions:
async function handleAction(data: FormData) {
  "use server"; // директива — эта функция Server Action
  await db.save(Object.fromEntries(data));
}
<ClientComp action={handleAction} /> // ✅ Server Action сериализуется
```

---

## Server Actions

Server Actions — async функции выполняемые на сервере, вызываемые с клиента как обычные функции.

```tsx
// actions/products.ts
"use server";

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const price = Number(formData.get("price"));

  // Прямой доступ к БД на сервере
  const product = await db.products.create({ name, price });

  // Инвалидировать кеш (Next.js):
  revalidatePath("/products");
  revalidateTag("products-list");

  return { success: true, id: product.id };
}

// В Client Component:
"use client";
import { createProduct } from "@/actions/products";

function CreateProductForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await createProduct(formData); // вызов на сервере!
    if (result.success) router.push(`/products/${result.id}`);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

// Или через form action (без JS — Progressive Enhancement):
function CreateProductForm() {
  return (
    <form action={createProduct}> {/* ✅ работает без JS! */}
      <input name="name" />
      <input name="price" type="number" />
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## Fetching в RSC

```tsx
// ✅ Параллельный fetch без waterfall:
async function DashboardPage() {
  // Начинаем все запросы одновременно:
  const [user, stats, notifications] = await Promise.all([
    fetchUser(),
    fetchStats(),
    fetchNotifications(),
  ]);
  // Результат: 1 roundtrip вместо 3!

  return (
    <Dashboard user={user} stats={stats} notifications={notifications} />
  );
}

// ❌ Waterfall (sequential):
async function Bad() {
  const user = await fetchUser();          // 100ms
  const stats = await fetchStats(user.id); // 100ms (ждёт user)
  const posts = await fetchPosts(user.id); // 100ms (ждёт stats)
  // Итого: 300ms вместо 100ms
}

// Fetch deduplication (Next.js):
// Одинаковые fetch запросы автоматически дедуплицируются
async function ComponentA() {
  const user = await fetch("/api/user"); // запрос 1
}
async function ComponentB() {
  const user = await fetch("/api/user"); // дедуплицируется! Один реальный запрос
}

// Кеширование fetch (Next.js):
fetch(url, { cache: "force-cache" }); // кешировать (статический контент)
fetch(url, { cache: "no-store" });    // не кешировать (динамический)
fetch(url, { next: { revalidate: 60 } }); // ISR — перевалидировать каждые 60s
```

---

## React 19 новые хуки

```tsx
// useActionState — async actions с pending state
import { useActionState } from "react";

function ContactForm() {
  const [state, action, isPending] = useActionState(
    async (prevState: State, formData: FormData) => {
      try {
        await sendEmail(formData);
        return { success: true, error: null };
      } catch (e) {
        return { success: false, error: "Failed to send" };
      }
    },
    { success: false, error: null }
  );

  return (
    <form action={action}>
      <input name="email" />
      <button disabled={isPending}>
        {isPending ? "Sending..." : "Send"}
      </button>
      {state.error && <p style={{ color: "red" }}>{state.error}</p>}
      {state.success && <p>Sent!</p>}
    </form>
  );
}

// useFormStatus — статус родительской формы
import { useFormStatus } from "react-dom";
function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  return <button disabled={pending}>{pending ? "..." : "Submit"}</button>;
}

// useOptimistic — оптимистичное обновление
import { useOptimistic } from "react";
function MessageList({ messages, sendMessage }) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMsg) => [...state, { ...newMsg, pending: true }]
  );

  const handleSend = async (text: string) => {
    addOptimistic({ id: "temp", text }); // немедленно показываем в UI
    await sendMessage(text);             // реальная отправка
    // После resolve — сервер вернёт реальное сообщение с id
  };

  return (
    <ul>
      {optimisticMessages.map(msg => (
        <li key={msg.id} style={{ opacity: msg.pending ? 0.5 : 1 }}>
          {msg.text}
        </li>
      ))}
    </ul>
  );
}

// ref как обычный prop (React 19 — forwardRef не нужен!)
function Input({ ref, ...props }: React.ComponentProps<"input">) {
  return <input ref={ref} {...props} />;
}
```

---

## RSC vs SSR

| | SSR | RSC |
|--|-----|-----|
| Что рендерится на сервере | Весь React tree → HTML | Только Server Components |
| Hydration | Весь tree | Только Client Components |
| Bundle size | Всё идёт клиенту | Server code = 0 bundle |
| Прямой доступ к БД | Через getServerSideProps | В самом компоненте |
| State в компонентах | После hydration | Только в Client |
| Совместимость | Могут быть вместе | RSC + SSR = Next.js App Router |

```
SSR: Сервер → HTML (всего дерева) → клиент → hydration всего дерева
RSC: Сервер → RSC Payload → клиент → hydration только Client компонентов

RSC + SSR в Next.js App Router:
Сервер: render RSC → HTML (для first paint) + RSC payload (для SPA navigation)
Клиент: hydration client components + RSC payload для последующих навигаций
```

---

## Вопросы на интервью

### 1. В чём разница RSC и SSR?

SSR рендерит **весь** React tree в HTML на сервере, затем на клиенте происходит hydration всего tree. RSC — архитектурное разделение: **Server Components** выполняются только на сервере (нет bundle, прямой доступ к БД), **Client Components** — только на клиенте (hooks, events). Они могут работать вместе: SSR рендерит HTML для first paint, RSC Payload для последующей навигации.

### 2. Почему нельзя передать функцию из Server в Client?

Server Actions — исключение. Обычные функции не сериализуются (не имеют JSON представления). RSC Payload передаётся как сериализованные данные. Функции нельзя сериализовать в JSON → нельзя передать. Решение: Server Actions — специально обработанные async функции с серверным endpoint под капотом.

### 3. Как работает "donut" паттерн?

Нельзя **импортировать** Server Component в Client (он станет клиентским). Можно передавать как `children`. Parent (Server) рендерит Server Component → RSC payload. Client Component получает children как уже готовый RSC output, не импорт. Children "проходит через" client component не становясь клиентским.

### 4. Что такое Server Actions?

Функции с директивой `"use server"` — выполняются только на сервере, но могут вызываться с клиента. React автоматически создаёт network endpoint. Поддерживают Progressive Enhancement (form action работает без JS). В React 19: `useActionState` для удобной работы с pending state и ошибками.

### 5. Зачем useOptimistic?

Показать пользователю **немедленный feedback** при долгих операциях (отправка сообщения, лайк). Обновляет UI оптимистично (как будто операция уже выполнена), пока реальный server response в процессе. При success — заменить optimistic state реальным. При failure — откатить к предыдущему.

---

## Ловушки

```tsx
// ❌ 1. useState/useEffect в Server Component
async function ServerComp() {
  const [count, setCount] = useState(0); // ❌ Error: React Hooks cannot be called in Server Components
}

// ❌ 2. Импорт Server Component в Client Component
"use client";
import ServerComp from "./ServerComp"; // ❌ ServerComp становится Client!

// ❌ 3. Передача функции как prop из Server в Client
<ClientComp onAction={() => doSomething()} /> // ❌ нельзя сериализовать
// ✅ Server Action:
async function doAction() { "use server"; doSomething(); }
<ClientComp onAction={doAction} /> // ✅

// ❌ 4. Секретные данные в Client Component props
<ClientComp apiKey={process.env.SECRET_KEY} />
// ❌ apiKey пойдёт в RSC Payload → клиент → открытый доступ!
// ✅ Использовать только в Server Components

// ❌ 5. Мутация в Server Action без revalidation
async function updateUser(data: FormData) {
  "use server";
  await db.users.update(id, data);
  // Без revalidatePath/revalidateTag — страница покажет старые данные
}
// ✅:
revalidatePath("/users/" + id);
// или:
redirect("/users/" + id);
```
