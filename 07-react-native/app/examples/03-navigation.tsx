import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { COLORS, SPACING, RADIUS } from "@/theme";
import { Section } from "@/components/Section";
import { CodeBlock } from "@/components/CodeBlock";
import { Card } from "@/components/Card";
import { Btn } from "@/components/Btn";

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Expo Router — файловая система">
        <CodeBlock>{`// Expo Router = Next.js App Router для RN
// Файловая структура → навигационная структура

app/
├── _layout.tsx          // Root Stack (обязательно)
├── index.tsx            // "/" — главный экран
├── (tabs)/              // () — группировка без URL
│   ├── _layout.tsx      //   Tab navigator
│   ├── home.tsx         //   "/home"
│   └── profile.tsx      //   "/profile"
├── products/
│   ├── index.tsx        // "/products"
│   ├── [id].tsx         // "/products/123" — динамический
│   └── [...rest].tsx    // "/products/a/b/c" — catch-all
└── (modal)/
    └── confirm.tsx      // модальный экран`}</CodeBlock>
      </Section>

      <Section title="Навигация (router)">
        <CodeBlock>{`import { useRouter, useLocalSearchParams, Link } from "expo-router";

function Screen() {
  const router = useRouter();

  // Переход:
  router.push("/products");
  router.push(\`/products/\${id}\`);
  router.push({ pathname: "/products/[id]", params: { id: "123" } });

  // Заменить в стеке (нет кнопки "Назад"):
  router.replace("/home");

  // Назад:
  router.back();
  router.canGoBack(); // boolean

  // Назад или на главную если нет истории:
  router.dismissAll();
}

// Params в компоненте:
function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // id = "123"
}

// Декларативный Link:
<Link href="/products">Products</Link>
<Link href={{ pathname: "/products/[id]", params: { id } }}>
  Product
</Link>
<Link href="/products" asChild>
  <Pressable><Text>Custom</Text></Pressable>
</Link>`}</CodeBlock>

        <View style={{ gap: 8 }}>
          <Btn label="router.push (добавит в стек)" onPress={() => router.push("/")} />
          <Btn label="router.replace (заменит стек)" variant="ghost" onPress={() => router.replace("/")} />
          <Btn label="router.back()" variant="ghost" onPress={() => router.back()} />
        </View>
      </Section>

      <Section title="Stack Navigator">
        <CodeBlock>{`// app/_layout.tsx — корневой Stack
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#161b22" },
        headerTintColor: "#f0f6fc",
        headerTitleStyle: { fontWeight: "600" },
        animation: "slide_from_right", // | "fade" | "slide_from_bottom"
      }}
    >
      {/* Кастомизация конкретного экрана: */}
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="index"  options={{ headerShown: false }} />
    </Stack>
  );
}

// В самом экране — override options:
import { useNavigation } from "expo-router";
function Screen() {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      title: "Dynamic Title",
      headerRight: () => <Button title="Save" onPress={save} />,
    });
  }, [navigation]);
}`}</CodeBlock>
      </Section>

      <Section title="Tab Navigator">
        <CodeBlock>{`// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3b82f6",
        tabBarStyle: { backgroundColor: "#161b22" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarBadge: 3, // уведомление
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}`}</CodeBlock>
      </Section>

      <Section title="Динамические маршруты">
        <CodeBlock>{`// app/products/[id].tsx
export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Text>Product: {id}</Text>;
}

// Catch-all: app/docs/[...slug].tsx
// /docs/a/b/c → slug = ["a", "b", "c"]
export default function Docs() {
  const { slug } = useLocalSearchParams<{ slug: string[] }>();
}

// Typed routes (app.json → experiments.typedRoutes: true):
router.push("/products/[id]", { id: "123" });
// TypeScript проверит что маршрут существует!

// generateStaticParams (для статичных страниц):
export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}`}</CodeBlock>
      </Section>

      <Section title="Deep Links">
        <CodeBlock>{`// app.json:
{
  "expo": {
    "scheme": "myapp", // myapp://...
    "web": { "bundler": "metro" }
  }
}

// Обработка deep link:
import * as Linking from "expo-linking";

// URL: myapp://products/123
// → автоматически открывает app/products/[id].tsx
// Expo Router делает это из коробки!

// Universal Links (iOS) / App Links (Android):
// Требуют AASA файл / assetlinks.json
// Настройка через expo-router + app config`}</CodeBlock>
      </Section>

      <Section title="Параметры и их передача">
        <CodeBlock>{`// ⚠️ Params в Expo Router — ВСЕГДА строки (URL-based)
const { count } = useLocalSearchParams<{ count: string }>();
const num = parseInt(count, 10); // нужен ручной парсинг

// Для сложных объектов — несколько вариантов:
// 1. JSON.stringify:
router.push({ pathname: "/detail", params: { data: JSON.stringify(obj) } });
const obj = JSON.parse(params.data);

// 2. State management (Zustand/Context):
useStore.setState({ selectedItem: item });
router.push("/detail");

// 3. URL-friendly ID:
router.push({ pathname: "/products/[id]", params: { id: product.id } });
// На экране загрузить по ID из API/store`}</CodeBlock>
      </Section>

      <Card title="Типичные вопросы на интервью" accent={COLORS.amber}>
        {[
          "Чем Expo Router отличается от React Navigation?",
          "Как передать сложный объект между экранами?",
          "Как реализовать deep links с Expo Router?",
          "Stack.replace vs Stack.push — разница?",
        ].map((q, i) => (
          <Text key={i} style={s.question}>▸ {q}</Text>
        ))}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: SPACING.md },
  question: { color: COLORS.text, fontSize: 13, lineHeight: 22, paddingVertical: 2 },
});
