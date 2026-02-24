import { useState } from "react";
import {
  ScrollView, View, Text, Pressable, StyleSheet,
  Dimensions, useWindowDimensions, Platform, PixelRatio,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS } from "@/theme";
import { Section } from "@/components/Section";
import { CodeBlock } from "@/components/CodeBlock";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function StylingScreen() {
  const [tab, setTab] = useState<"stylesheet" | "flexbox" | "dimensions" | "platform">("stylesheet");
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {(["stylesheet", "flexbox", "dimensions", "platform"] as const).map(t => (
          <Pressable key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab === "stylesheet"  && <StyleSheetTab />}
      {tab === "flexbox"     && <FlexboxTab />}
      {tab === "dimensions"  && <DimensionsTab width={width} height={height} fontScale={fontScale} insets={insets} />}
      {tab === "platform"    && <PlatformTab />}
    </View>
  );
}

// ─── StyleSheet Tab ───────────────────────────────
function StyleSheetTab() {
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="StyleSheet.create vs inline">
        <CodeBlock>{`// ✅ StyleSheet.create — регистрирует стили один раз
// Объекты создаются НЕ при каждом рендере → меньше GC pressure
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  text: { color: "#fff", fontSize: 14 },
});

// ❌ Inline объекты — создаются каждый рендер:
<View style={{ flex: 1, padding: 16 }}>
  <Text style={{ color: "#fff" }}>Text</Text>
</View>
// Но для динамических стилей inline обязателен:
<View style={[styles.box, { backgroundColor: color }]} />`}</CodeBlock>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {["#3b82f6", "#22c55e", "#f59e0b", "#f87171", "#a78bfa"].map((color, i) => (
            <View key={i} style={[s.colorBox, { backgroundColor: color + "44", borderColor: color }]}>
              <Text style={{ color, fontSize: 10, textAlign: "center" }}>{color}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Shadow & Elevation">
        <CodeBlock>{`// iOS — shadow* props:
const iosShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
};

// Android — elevation:
const androidShadow = { elevation: 8 };

// Cross-platform:
const shadow = Platform.select({
  ios: iosShadow,
  android: androidShadow,
});`}</CodeBlock>
        <View style={s.shadowDemo}>
          <View style={s.shadowBox}>
            <Text style={{ color: COLORS.text, fontSize: 12 }}>elevation: 10</Text>
            <Text style={{ color: COLORS.textDim, fontSize: 10 }}>Android</Text>
          </View>
          <View style={s.shadowBoxiOS}>
            <Text style={{ color: COLORS.text, fontSize: 12 }}>shadowRadius: 8</Text>
            <Text style={{ color: COLORS.textDim, fontSize: 10 }}>iOS</Text>
          </View>
        </View>
      </Section>

      <Section title="Transforms">
        <CodeBlock>{`// RN поддерживает transform как массив:
style={{ transform: [
  { rotate: "45deg" },
  { scale: 1.2 },
  { translateX: 10 },
  { skewX: "15deg" },
] }}

// ⚠️ Нет transform: "rotate(45deg)" — только массив объектов`}</CodeBlock>
        <View style={{ flexDirection: "row", gap: 20, alignItems: "center", padding: 20 }}>
          <View style={[s.transformBox, { transform: [{ rotate: "0deg" }] }]}>
            <Text style={{ color: COLORS.blue, fontSize: 11 }}>0°</Text>
          </View>
          <View style={[s.transformBox, { transform: [{ rotate: "30deg" }] }]}>
            <Text style={{ color: COLORS.green, fontSize: 11 }}>30°</Text>
          </View>
          <View style={[s.transformBox, { transform: [{ rotate: "45deg" }, { scale: 1.2 }] }]}>
            <Text style={{ color: COLORS.amber, fontSize: 11 }}>45° ×1.2</Text>
          </View>
        </View>
      </Section>
    </ScrollView>
  );
}

// ─── Flexbox Tab ──────────────────────────────────
function FlexboxTab() {
  const [justify, setJustify] = useState<"flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly">("flex-start");
  const [align, setAlign] = useState<"flex-start" | "center" | "flex-end" | "stretch">("flex-start");
  const [direction, setDirection] = useState<"row" | "column">("row");

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Flexbox — отличия от веба">
        <CodeBlock>{`// В RN Flexbox работает иначе:
// ✅ flexDirection: "column" по умолчанию (в вебе — row!)
// ✅ flex: 1 — занять всё доступное пространство
// ✅ alignItems: "stretch" — по умолчанию
// ⚠️ gap поддерживается (RN 0.71+)
// ⚠️ Нет grid, float, display: none (используй conditional render)

// Числовые значения (не строки!):
style={{ borderWidth: 1 }} // ✅ 1 (dp units)
style={{ borderWidth: "1px" }} // ❌ строка не работает!`}</CodeBlock>
      </Section>

      <Section title="Интерактивный Flexbox">
        <Text style={s.label}>flexDirection</Text>
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
          {(["row", "column"] as const).map(d => (
            <Pressable key={d} style={[s.optBtn, direction === d && s.optBtnActive]} onPress={() => setDirection(d)}>
              <Text style={{ color: direction === d ? "#fff" : COLORS.textDim, fontSize: 11 }}>{d}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>justifyContent</Text>
        <View style={{ flexDirection: "row", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          {(["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"] as const).map(j => (
            <Pressable key={j} style={[s.optBtn, justify === j && s.optBtnActive]} onPress={() => setJustify(j)}>
              <Text style={{ color: justify === j ? "#fff" : COLORS.textDim, fontSize: 10 }}>{j}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>alignItems</Text>
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
          {(["flex-start", "center", "flex-end", "stretch"] as const).map(a => (
            <Pressable key={a} style={[s.optBtn, align === a && s.optBtnActive]} onPress={() => setAlign(a)}>
              <Text style={{ color: align === a ? "#fff" : COLORS.textDim, fontSize: 11 }}>{a}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[s.flexDemo, { flexDirection: direction, justifyContent: justify, alignItems: align }]}>
          {["A", "B", "C"].map((l, i) => (
            <View key={l} style={[s.flexBox, { height: 30 + i * 15 }]}>
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>{l}</Text>
            </View>
          ))}
        </View>

        <Text style={s.codeLabel}>
          {`flexDirection: "${direction}"\njustifyContent: "${justify}"\nalignItems: "${align}"`}
        </Text>
      </Section>

      <Section title="flex vs width/height">
        <CodeBlock>{`// flex: 1 — занять оставшееся пространство
// flex: 2 рядом с flex: 1 → 2/3 vs 1/3

<View style={{ flexDirection: "row", height: 60 }}>
  <View style={{ flex: 1, backgroundColor: "blue" }} />   // 33%
  <View style={{ flex: 2, backgroundColor: "green" }} />  // 66%
</View>

// Абсолютное позиционирование:
<View style={{ position: "absolute", top: 0, right: 0 }}>
  <Text>Badge</Text>
</View>

// ⚠️ position: "fixed" не существует в RN!
// Используй position: "absolute" внутри SafeAreaView`}</CodeBlock>
      </Section>
    </ScrollView>
  );
}

// ─── Dimensions Tab ───────────────────────────────
function DimensionsTab({ width, height, fontScale, insets }: {
  width: number; height: number; fontScale: number;
  insets: { top: number; bottom: number; left: number; right: number };
}) {
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Текущие размеры">
        {[
          { label: "Window Width",   value: `${width.toFixed(0)} dp`,   color: COLORS.blue },
          { label: "Window Height",  value: `${height.toFixed(0)} dp`,  color: COLORS.green },
          { label: "Pixel Ratio",    value: String(PixelRatio.get()),    color: COLORS.amber },
          { label: "Font Scale",     value: String(fontScale),           color: COLORS.purple },
          { label: "Status Bar",     value: `${StatusBar.currentHeight ?? "N/A"} dp`, color: COLORS.red },
          { label: "Inset Top",      value: `${insets.top} dp`,          color: COLORS.blue },
          { label: "Inset Bottom",   value: `${insets.bottom} dp`,       color: COLORS.green },
        ].map(({ label, value, color }) => (
          <View key={label} style={s.metricRow}>
            <Text style={{ color: COLORS.textDim, fontSize: 13 }}>{label}</Text>
            <Text style={{ color, fontFamily: "monospace", fontSize: 13, fontWeight: "600" }}>{value}</Text>
          </View>
        ))}
      </Section>

      <Section title="Dimensions API">
        <CodeBlock>{`import { Dimensions, useWindowDimensions, PixelRatio } from "react-native";

// Static (не реагирует на поворот):
const { width, height } = Dimensions.get("window"); // экран за вычетом status bar
const { width: sw, height: sh } = Dimensions.get("screen"); // весь экран

// ✅ useWindowDimensions — реагирует на поворот:
const { width, height, fontScale, scale } = useWindowDimensions();

// Pixel ratio — физических пикселей на 1 dp:
PixelRatio.get(); // 2 = @2x, 3 = @3x
// 1 dp на @3x устройстве = 3 физических пикселя

// Адаптивная сетка:
const numColumns = Math.floor(width / 120); // 120dp на колонку
const itemWidth = width / numColumns - 8;   // с учётом gap`}</CodeBlock>
      </Section>

      <Section title="SafeAreaInsets (notch, home bar)">
        <CodeBlock>{`import { useSafeAreaInsets } from "react-native-safe-area-context";

function Screen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ 
      flex: 1,
      paddingTop: insets.top,      // под notch/status bar
      paddingBottom: insets.bottom, // над home indicator
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}>
      {/* контент */}
    </View>
  );
}`}</CodeBlock>
        <View style={{ backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, overflow: "hidden" }}>
          <View style={{ height: insets.top, backgroundColor: COLORS.purple + "44", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: COLORS.purple, fontSize: 11 }}>inset.top = {insets.top}dp</Text>
          </View>
          <View style={{ height: 60, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: COLORS.textDim, fontSize: 12 }}>Safe area content</Text>
          </View>
          <View style={{ height: Math.max(insets.bottom, 20), backgroundColor: COLORS.green + "44", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: COLORS.green, fontSize: 11 }}>inset.bottom = {insets.bottom}dp</Text>
          </View>
        </View>
      </Section>
    </ScrollView>
  );
}

// ─── Platform Tab ─────────────────────────────────
function PlatformTab() {
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Platform.OS и Platform.select">
        <CodeBlock>{`import { Platform } from "react-native";

Platform.OS; // "ios" | "android" | "web" | "windows" | "macos"

// Стили с Platform.select:
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    android: { elevation: 8 },
    default: {}, // web
  }),
});

// Версия ОС:
Platform.Version; // Android: число (API level), iOS: строка "17.0"

// Platform.isTV — Apple TV / Android TV
// Platform.isPad — iPad (iOS)`}</CodeBlock>

        <View style={s.platformCard}>
          <Text style={s.platformOS}>{Platform.OS.toUpperCase()}</Text>
          <Text style={{ color: COLORS.textDim, fontSize: 12 }}>Version: {String(Platform.Version)}</Text>
        </View>
      </Section>

      <Section title="Единицы измерения: dp vs px">
        <CodeBlock>{`// RN использует dp (density-independent pixels)
// 1 dp = 1px на @1x устройстве
//         2px на @2x (большинство современных)
//         3px на @3x (Plus/Pro/Max)

// Абсолютный размер в dp:
style={{ width: 100, height: 100 }}
// На @3x: реально 300×300 физических пикселей

// Переводы:
PixelRatio.getPixelSizeForLayoutSize(100); // dp → px
// На @3x → 300

// Для точных 1px линий:
const hairline = StyleSheet.hairlineWidth; // 1/PixelRatio (≈0.33 на @3x)
<View style={{ borderWidth: StyleSheet.hairlineWidth }} />`}</CodeBlock>
        <View style={s.metricRow}>
          <Text style={{ color: COLORS.textDim, fontSize: 13 }}>hairlineWidth</Text>
          <Text style={{ color: COLORS.blue, fontFamily: "monospace", fontSize: 13 }}>
            {StyleSheet.hairlineWidth}px
          </Text>
        </View>
      </Section>

      <Section title="Платформенные файлы">
        <CodeBlock>{`// Автоматический выбор по расширению:
// Button.ios.tsx   → используется на iOS
// Button.android.tsx → на Android
// Button.tsx       → fallback

// В коде:
import Button from "./Button";
// Metro выберет нужный файл автоматически

// Полезно для:
// - Разного UI (DatePicker, ActionSheet)
// - Нативных жестов
// - Платформо-специфичных animations`}</CodeBlock>
      </Section>
    </ScrollView>
  );
}

// ─── Стили ────────────────────────────────────────
const s = StyleSheet.create({
  content: { padding: SPACING.md },
  tabBar: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBarContent: { paddingHorizontal: SPACING.sm, gap: SPACING.xs },
  tab: { paddingHorizontal: 14, paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.blue },
  tabText: { fontSize: 13, color: COLORS.textDim },
  tabTextActive: { color: COLORS.blue },
  label: { fontSize: 11, color: COLORS.textDim, marginBottom: 4 },
  codeLabel: { fontFamily: "monospace", fontSize: 11, color: COLORS.textDim, marginTop: 8, lineHeight: 18 },

  colorBox: { width: 60, height: 60, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: "center", justifyContent: "center", padding: 4 },

  shadowDemo: { flexDirection: "row", gap: 16, padding: 16, justifyContent: "center" },
  shadowBox: {
    width: 100, height: 70, backgroundColor: COLORS.surface2, borderRadius: RADIUS.md,
    alignItems: "center", justifyContent: "center",
    elevation: 10,
  },
  shadowBoxiOS: {
    width: 100, height: 70, backgroundColor: COLORS.surface2, borderRadius: RADIUS.md,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8,
  },

  transformBox: {
    width: 60, height: 60, backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },

  flexDemo: { height: 120, backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, padding: 8, gap: 4 },
  flexBox: { width: 50, backgroundColor: COLORS.blue + "66", borderRadius: 4, alignItems: "center", justifyContent: "center" },

  optBtn: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
    backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border,
  },
  optBtnActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },

  metricRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  platformCard: {
    backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, padding: 20,
    alignItems: "center", gap: 4,
  },
  platformOS: { fontSize: 32, fontWeight: "bold", color: COLORS.blue },
});
