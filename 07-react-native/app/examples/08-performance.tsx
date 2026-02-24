import { useState, useCallback, memo, useRef } from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable,
  InteractionManager, type ListRenderItemInfo,
} from "react-native";
import { COLORS, SPACING, RADIUS } from "@/theme";
import { Section } from "@/components/Section";
import { CodeBlock } from "@/components/CodeBlock";
import { Btn } from "@/components/Btn";

// ─── Данные ───────────────────────────────────────
interface Item {
  id: string;
  title: string;
  subtitle: string;
  value: number;
  color: string;
}

const COLORS_LIST = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple, COLORS.red];
const ITEMS: Item[] = Array.from({ length: 5000 }, (_, i) => ({
  id: String(i),
  title: `Item ${i + 1}`,
  subtitle: `Subtitle for item ${i + 1} — extra text here`,
  value: Math.floor(Math.random() * 1000),
  color: COLORS_LIST[i % 5]!,
}));

const ITEM_HEIGHT = 64;

// ─── Мемоизированный Item ─────────────────────────
const ListItem = memo(function ListItem({
  item,
  onPress,
}: {
  item: Item;
  onPress: (id: string) => void;
}) {
  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <Pressable
      style={({ pressed }) => [s.item, { opacity: pressed ? 0.8 : 1 }]}
      onPress={() => onPress(item.id)}
    >
      <View style={[s.dot, { backgroundColor: item.color + "44", borderColor: item.color }]}>
        <Text style={{ color: item.color, fontSize: 10 }}>{renderCount.current}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.itemTitle}>{item.title}</Text>
        <Text style={s.itemSub} numberOfLines={1}>{item.subtitle}</Text>
      </View>
      <Text style={{ color: COLORS.textDim, fontSize: 12, fontFamily: "monospace" }}>
        {item.value}
      </Text>
    </Pressable>
  );
}, (prev, next) => prev.item.id === next.item.id && prev.onPress === next.onPress);

export default function PerformanceScreen() {
  const [tab, setTab] = useState<"flatlist" | "tips" | "profiling">("flatlist");

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={s.tabBar}>
        {(["flatlist", "tips", "profiling"] as const).map(t => (
          <Pressable key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "flatlist"  && <FlatListTab />}
      {tab === "tips"      && <TipsTab />}
      {tab === "profiling" && <ProfilingTab />}
    </View>
  );
}

// ─── FlatList Tab ─────────────────────────────────
function FlatListTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  // useCallback критичен для memo() на ListItem
  const handlePress = useCallback((id: string) => {
    setSelectedId(id);
    setCount(c => c + 1);
  }, []);

  // keyExtractor вне render функции — стабильная ссылка
  const keyExtractor = useCallback((item: Item) => item.id, []);

  // getItemLayout — убирает необходимость измерять каждый элемент
  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<Item>) => (
    <ListItem item={item} onPress={handlePress} />
  ), [handlePress]);

  return (
    <View style={{ flex: 1 }}>
      <View style={s.header}>
        <Text style={{ color: COLORS.textDim, fontSize: 12 }}>
          {ITEMS.length.toLocaleString()} элементов · пресы: {count}
        </Text>
        {selectedId && (
          <Text style={{ color: COLORS.blue, fontSize: 12 }}>
            Выбрано: #{selectedId}
          </Text>
        )}
      </View>

      <FlatList
        data={ITEMS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}

        // Критичные настройки производительности:
        maxToRenderPerBatch={10}      // сколько новых элементов за один JS batch
        windowSize={5}                 // сколько экранов данных держать в памяти
        updateCellsBatchingPeriod={50} // мс между batch обновлениями
        removeClippedSubviews={true}   // unmount элементы вне viewport (Android)
        initialNumToRender={15}        // сколько рендерить при mount

        // Разделитель:
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 52 }} />
        )}
      />
    </View>
  );
}

// ─── Tips Tab ─────────────────────────────────────
function TipsTab() {
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={TIPS}
        keyExtractor={item => item.title}
        renderItem={({ item }) => (
          <View style={s.tipCard}>
            <Text style={[s.tipStatus, { color: item.critical ? COLORS.red : COLORS.green }]}>
              {item.critical ? "❗ Critical" : "✅ Best Practice"}
            </Text>
            <Text style={s.tipTitle}>{item.title}</Text>
            <Text style={s.tipCode}>{item.code}</Text>
            <Text style={s.tipDesc}>{item.desc}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: SPACING.md, gap: SPACING.sm }}
      />
    </View>
  );
}

const TIPS = [
  {
    title: "getItemLayout — обязателен для scrollToIndex и производительности",
    critical: true,
    code: `getItemLayout={(_, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
})}`,
    desc: "Без getItemLayout FlatList должен измерять каждый элемент при скролле. С ним — O(1) вычисление позиции. Обязателен если элементы фиксированной высоты.",
  },
  {
    title: "keyExtractor — вне render, стабильная ссылка",
    critical: true,
    code: `// ❌ Нестабильная (новая функция каждый рендер):
keyExtractor={(item) => item.id}

// ✅ useCallback или константа:
const keyExtractor = useCallback((item) => item.id, []);`,
    desc: "Новый keyExtractor каждый рендер → FlatList не может кешировать ключи → лишние обновления.",
  },
  {
    title: "renderItem + memo — предотвратить лишние рендеры",
    critical: true,
    code: `// renderItem должен быть useCallback:
const renderItem = useCallback(({ item }) => (
  <MemoItem item={item} onPress={handlePress} />
), [handlePress]);

// MemoItem — React.memo с кастомным сравнением:
const MemoItem = memo(Item, (prev, next) =>
  prev.item.id === next.item.id);`,
    desc: "Без memo каждый renderItem вызов создаёт новый компонент. handlePress тоже должен быть useCallback иначе memo бесполезен.",
  },
  {
    title: "windowSize и removeClippedSubviews",
    critical: false,
    code: `<FlatList
  windowSize={5}             // 5 * viewport height в памяти
  maxToRenderPerBatch={10}   // batch size
  removeClippedSubviews     // Android: unmount вне viewport
  initialNumToRender={15}   // первый render
/>`,
    desc: "windowSize: 5 = 2 экрана выше + текущий + 2 экрана ниже. Меньше = меньше памяти но больше blank flashes при быстром скролле.",
  },
  {
    title: "Избегай inline styles в renderItem",
    critical: false,
    code: `// ❌ Новый объект каждый render:
<View style={{ flex: 1, padding: 16 }}>

// ✅ StyleSheet:
const s = StyleSheet.create({ container: { flex: 1, padding: 16 } });
<View style={s.container}>`,
    desc: "В renderItem это критично — вызывается тысячи раз при скролле. StyleSheet.create регистрирует стили один раз.",
  },
  {
    title: "InteractionManager — отложить тяжёлые операции",
    critical: false,
    code: `// Дождаться завершения анимации/жеста:
InteractionManager.runAfterInteractions(() => {
  loadHeavyData(); // запустится после анимации перехода
});`,
    desc: "Тяжёлые операции после mount могут задержать анимацию навигации. InteractionManager откладывает их до завершения жестов.",
  },
  {
    title: "FlashList (Shopify) — замена FlatList",
    critical: false,
    code: `import { FlashList } from "@shopify/flash-list";

<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={64} // вместо getItemLayout
/>
// 5-10x быстрее FlatList на больших списках`,
    desc: "FlashList переиспользует ячейки как RecyclerView (Android) / UITableView (iOS). Нет проблем с getItemLayout и variableHeight.",
  },
];

// ─── Profiling Tab ────────────────────────────────
function ProfilingTab() {
  return (
    <FlatList
      data={PROFILING_ITEMS}
      keyExtractor={item => item.title}
      renderItem={({ item }) => (
        <View style={s.tipCard}>
          <Text style={s.tipTitle}>{item.title}</Text>
          <Text style={s.tipDesc}>{item.desc}</Text>
          {item.code && <Text style={s.tipCode}>{item.code}</Text>}
        </View>
      )}
      contentContainerStyle={{ padding: SPACING.md, gap: SPACING.sm }}
    />
  );
}

const PROFILING_ITEMS = [
  {
    title: "Flipper — основной инструмент отладки",
    desc: "Flipper: Network Inspector (HTTP), Layout Inspector (компонентное дерево), React DevTools (hooks, state), Hermes Debugger, Performance Monitor.",
    code: null,
  },
  {
    title: "React DevTools Profiler",
    desc: "В браузерном devtools при Metro: Profiler записывает все рендеры, flamegraph компонентов, \"Why did this render?\" — для каждого обновления.",
    code: null,
  },
  {
    title: "Performance Monitor (встроен в RN)",
    desc: `Shake телефон → Perf Monitor:
• RAM: потребление памяти
• JS FPS: частота JS thread (должна быть 60)
• UI FPS: частота UI thread (главное для анимаций)
• Views: кол-во активных View`,
    code: null,
  },
  {
    title: "JS Thread vs UI Thread",
    code: `// JS Thread: React, бизнес-логика, JS анимации
// UI Thread: нативный рендеринг, Reanimated worklets

// Если JS thread занят → UI thread работает нормально
// → Reanimated/GestureHandler не лагают!
// Именно поэтому они выполняются на UI thread (worklets)`,
    desc: "FlatList скролл = UI thread. Данные и рендер = JS thread. Если JS завис на 100мс, скролл всё равно плавный.",
  },
  {
    title: "Hermes Profiler",
    code: `// Включён по умолчанию с Expo SDK 48+
// Flamechart в Chrome DevTools:
// 1. Запустить приложение в режиме profiling
// 2. chrome://inspect → профиль
// Показывает: hot paths, microtasks, GC pauses`,
    desc: "Hermes — JS движок от Meta, оптимизированный для RN. Bytecode компиляция → быстрый startup. AOT-compiled → меньше памяти.",
  },
  {
    title: "Вопросы на интервью",
    desc: `▸ Почему getItemLayout критичен для производительности FlatList?
▸ Чем FlashList лучше FlatList?
▸ Как работает removeClippedSubviews и когда включать?
▸ В чём разница JS thread и UI thread в RN?
▸ Как предотвратить re-renders в FlatList?
▸ Что такое windowSize у FlatList?`,
    code: null,
  },
];

const s = StyleSheet.create({
  tabBar: {
    flexDirection: "row", backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.blue },
  tabText: { fontSize: 13, color: COLORS.textDim },
  tabTextActive: { color: COLORS.blue, fontWeight: "600" },

  header: {
    flexDirection: "row", justifyContent: "space-between",
    padding: SPACING.sm, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  item: {
    flexDirection: "row", alignItems: "center",
    height: ITEM_HEIGHT, paddingHorizontal: SPACING.md, gap: 12,
    backgroundColor: COLORS.bg,
  },
  dot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  itemTitle: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  itemSub:   { fontSize: 11, color: COLORS.textDim },

  tipCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  tipStatus: { fontSize: 10, fontWeight: "600", marginBottom: 4 },
  tipTitle:  { fontSize: 14, fontWeight: "600", color: "#f0f6fc", marginBottom: 6 },
  tipDesc:   { fontSize: 12, color: COLORS.textDim, lineHeight: 18 },
  tipCode: {
    backgroundColor: "#010409", borderRadius: 4,
    padding: 8, fontFamily: "monospace", fontSize: 10,
    color: "#a5d6ff", marginVertical: 6, lineHeight: 16,
  },
});
