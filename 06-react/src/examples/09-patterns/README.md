# 09 · Patterns

[← Назад](../../../README.md)

---

## Содержание

- [Compound Components](#compound-components)
- [Render Props](#render-props)
- [HOC (Higher-Order Components)](#hoc)
- [Сравнение паттернов](#сравнение-паттернов)
- [Composition vs Inheritance](#composition-vs-inheritance)
- [Вопросы на интервью](#вопросы-на-интервью)
- [Ловушки](#ловушки)

---

## Compound Components

Несколько компонентов которые работают **вместе через неявный shared state** (Context).

### Проблема которую решает

```tsx
// ❌ Props-based API — жёсткий, трудно кастомизировать:
<Tabs
  items={[
    { label: "Tab A", content: <div>A</div> },
    { label: "Tab B", content: <div>B</div>, disabled: true },
    { label: "Tab C", icon: <Icon />, content: <div>C</div> },
  ]}
  defaultActive="Tab A"
  onTabChange={fn}
  tabClassName="..."
  contentClassName="..."
  // Для каждого кейса — новый prop
/>

// ✅ Compound Components — гибко, пользователь контролирует структуру:
<Tabs defaultTab="a">
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <Tabs.List>
      <Tabs.Tab id="a">Tab A</Tabs.Tab>
      <Tabs.Tab id="b" disabled>Tab B</Tabs.Tab>
      <Tabs.Tab id="c"><Icon /> Tab C</Tabs.Tab>
    </Tabs.List>
    <ExtraButton /> {/* Можно добавить что угодно рядом */}
  </div>
  <Tabs.Panel id="a">Content A</Tabs.Panel>
  <Tabs.Panel id="b">Content B</Tabs.Panel>
  <Tabs.Panel id="c">Content C</Tabs.Panel>
</Tabs>
```

### Реализация

```tsx
// 1. Context для shared state
interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}
const TabsContext = createContext<TabsContextType | null>(null);

// 2. Root component держит state
function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

// 3. Sub-components читают из Context
function TabItem({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)!;
  return (
    <button
      className={activeTab === id ? "active" : ""}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
}

function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab } = useContext(TabsContext)!;
  return activeTab === id ? <div>{children}</div> : null;
}

// 4. Attach sub-components (namespace pattern)
Tabs.List  = TabList;
Tabs.Tab   = TabItem;
Tabs.Panel = TabPanel;

// Или через static properties в TypeScript:
const Tabs = Object.assign(TabsRoot, {
  List: TabList,
  Tab: TabItem,
  Panel: TabPanel,
});
```

### Примеры использования в экосистеме

```tsx
// Radix UI — Compound Components:
<Dialog.Root>
  <Dialog.Trigger asChild>
    <Button>Open</Button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

// React Router:
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/users/:id" element={<User />} />
</Routes>
```

---

## Render Props

Компонент принимает **функцию как prop** и вызывает её с данными.

```tsx
// Render prop = функция → JSX
type RenderProp<T> = (data: T) => ReactNode;

function DataLoader<T>({ url, children }: { url: string; children: RenderProp<T> }) {
  const { data, loading, error } = useFetch<T>(url);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  if (!data) return null;

  return <>{children(data)}</>;
}

// Использование — пользователь контролирует рендер:
<DataLoader<User[]> url="/api/users">
  {(users) => (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  )}
</DataLoader>

// То же самое но другой рендер:
<DataLoader<User[]> url="/api/users">
  {(users) => (
    <Table columns={columns} data={users} />
  )}
</DataLoader>
```

### Children as function vs render prop

```tsx
// Children as function (наиболее распространённый):
<Toggle>
  {({ isOn, toggle }) => <Switch checked={isOn} onChange={toggle} />}
</Toggle>

// Именованный prop:
<DataProvider
  render={(data) => <Chart data={data} />}
/>

// Несколько slots:
<Layout
  header={(data) => <Header title={data.title} />}
  sidebar={(data) => <Nav items={data.navItems} />}
  content={(data) => <Article body={data.body} />}
/>
```

### Современная замена — Custom Hook + Render

```tsx
// Render Prop паттерн часто можно заменить custom hook:

// ❌ Render Prop (громоздко):
<MouseTracker>
  {({ x, y }) => <div>Mouse: {x}, {y}</div>}
</MouseTracker>

// ✅ Custom Hook (чище):
const { x, y } = useMousePosition();
return <div>Mouse: {x}, {y}</div>;
```

**Render Props остаются актуальными** для: виртуализации (react-window), анимаций (react-spring), drag & drop — там компонент контролирует что и когда рендерить.

---

## HOC

HOC = `ComponentType → ComponentType`. Оборачивает компонент добавляя поведение.

```tsx
function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredRole: "admin" | "user" = "user"
) {
  function WithAuth(props: P) {
    const { user } = useAuth();

    if (!user) return <Redirect to="/login" />;
    if (requiredRole === "admin" && user.role !== "admin") {
      return <Forbidden />;
    }

    return <WrappedComponent {...props} />;
  }

  // Важно для React DevTools:
  WithAuth.displayName = `withAuth(${
    WrappedComponent.displayName ?? WrappedComponent.name
  })`;

  return WithAuth;
}

// Использование:
const AdminDashboard = withAuth(Dashboard, "admin");
const UserProfile = withAuth(Profile, "user");
```

### HOC compose

```tsx
// Несколько HOC:
const EnhancedComponent = withAuth(withLogging(withTheme(BaseComponent)));
// Читается справа-налево: сначала withTheme, затем withLogging, затем withAuth

// compose helper (как в Redux):
const enhance = compose(withAuth, withLogging, withTheme);
const EnhancedComponent = enhance(BaseComponent);
```

### Проблемы HOC

```tsx
// 1. Props collision — два HOC с одинаковым prop
const WithUser = withUser(Component);    // добавляет prop "user"
const WithAdmin = withAdmin(Component);  // тоже добавляет prop "user" → конфликт!

// 2. Static methods теряются
Component.staticMethod = () => {};
const Enhanced = withHOC(Component);
Enhanced.staticMethod; // undefined! Нужно hoist-non-react-statics

// 3. ref не пробрасывается (до React 19)
const Enhanced = withHOC(Component);
<Enhanced ref={ref} /> // ref идёт на HOC обёртку, не на Component
// Решение: forwardRef

// 4. Wrapper hell в DevTools:
// withAuth(withLogging(withTheme(withData(Component))))
// → 4 уровня вложенности в DevTools
```

---

## Сравнение паттернов

| Паттерн | Переиспользует | Гибкость структуры | Сложность | Когда использовать |
|---------|----------------|-------------------|-----------|-------------------|
| **HOC** | Логику + UI wrap | Средняя | Высокая | Обёртки, legacy код |
| **Render Props** | Логику | Высокая | Средняя | Когда нужен контроль рендера |
| **Custom Hook** | Только логику | — | Низкая | Современный React (предпочтителен) |
| **Compound Components** | Структуру | Очень высокая | Средняя | UI kit компоненты |

**Рекомендация 2024:**
1. **Custom Hook** — для переиспользования логики
2. **Compound Components** — для UI kit с гибкой структурой
3. **Render Props** — для специфических случаев (виртуализация, анимации)
4. **HOC** — только для legacy или когда нужна обёртка на уровне компонента

---

## Composition vs Inheritance

React изначально использует **composition, не inheritance**.

```tsx
// ❌ Inheritance (антипаттерн в React):
class SpecialButton extends Button {
  render() {
    return super.render(); // хрупко, сложно поддерживать
  }
}

// ✅ Composition через children:
function SpecialButton({ children, ...props }) {
  return (
    <Button {...props} className={`special ${props.className ?? ""}`}>
      <Icon /> {children}
    </Button>
  );
}

// ✅ Composition через render prop:
<Button renderIcon={() => <StarIcon />}>
  Favorite
</Button>

// ✅ Composition через slots:
<Card
  header={<CardHeader title="Title" />}
  footer={<CardFooter actions={[...]} />}
>
  Card content
</Card>
```

---

## Вопросы на интервью

### 1. В чём разница Compound Components, Render Props и HOC?

**HOC** — функция `Component → Component`, оборачивает компонент и добавляет поведение (auth, logging). **Render Props** — компонент принимает функцию-prop, вызывает её с данными, пользователь контролирует что рендерить. **Compound Components** — группа компонентов с неявным shared state через Context, пользователь контролирует структуру.

### 2. Почему HOC заменяются Custom Hooks?

Custom hooks решают ту же задачу (переиспользование логики) без проблем HOC: нет props collision, нет wrapper hell, нет потери static methods, нет сложности с ref. Хуки композируются линейно, HOC — иерархически.

### 3. Какие проблемы у HOC?

Props collision (два HOC добавляют одинаковый prop), wrapper hell (глубокая вложенность в DevTools), потеря static methods (`hoist-non-react-statics` нужен), сложности с ref (до React 19 нужен `forwardRef`), читаемость (порядок справа-налево).

### 4. Как реализовать Tabs через Compound Components?

Root component (`<Tabs>`) держит `activeTab` state, предоставляет через Context. `<Tabs.Tab id="...">` читает из Context, вызывает `setActiveTab` при клике. `<Tabs.Panel id="...">` читает `activeTab`, рендерит только если `id === activeTab`.

---

## Ловушки

```tsx
// ❌ 1. Context в Compound Component без Provider
function TabItem({ id }) {
  const ctx = useContext(TabsContext); // null если нет Provider!
  ctx.setActiveTab(id); // TypeError: Cannot read property of null
}
// ✅ Кидать понятную ошибку:
const ctx = useContext(TabsContext);
if (!ctx) throw new Error("<Tabs.Tab> must be used inside <Tabs>");

// ❌ 2. Render Prop с inline функцией → новая функция каждый рендер
<DataProvider>
  {(data) => <ExpensiveChild data={data} />} {/* ExpensiveChild ре-рендерится всегда */}
</DataProvider>
// ✅ useCallback или вынести функцию:
const renderContent = useCallback((data) => <ExpensiveChild data={data} />, []);
<DataProvider>{renderContent}</DataProvider>

// ❌ 3. HOC без displayName → нечитаемые DevTools
const Enhanced = withAuth(Component); // DevTools: "WithAuth" или "Component"
// ✅ Добавлять displayName:
WithAuth.displayName = `withAuth(${Component.displayName ?? Component.name})`;
```
