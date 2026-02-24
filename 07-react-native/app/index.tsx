import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, SPACING, RADIUS } from "@/theme";

const MODULES = [
  {
    num: "01",
    title: "Core Components",
    desc: "View, Text, Image, FlatList, ScrollView, Pressable, TextInput",
    route: "/examples/01-core",
    color: COLORS.blue,
  },
  {
    num: "02",
    title: "Styling",
    desc: "StyleSheet, Flexbox в RN, Dimensions, useWindowDimensions, Platform",
    route: "/examples/02-styling",
    color: COLORS.green,
  },
  {
    num: "03",
    title: "Navigation",
    desc: "Expo Router: Stack, Tabs, Drawer, dynamic routes, deep links, params",
    route: "/examples/03-navigation",
    color: COLORS.purple,
  },
  {
    num: "04",
    title: "Platform APIs",
    desc: "AppState, Keyboard, Vibration, Linking, Share, Clipboard, Camera",
    route: "/examples/04-platform",
    color: COLORS.amber,
  },
  {
    num: "05",
    title: "Gestures & Animated",
    desc: "Animated API, PanResponder, GestureHandler, spring, decay",
    route: "/examples/05-gestures",
    color: COLORS.red,
  },
  {
    num: "06",
    title: "Networking",
    desc: "fetch в RN, NetInfo, offline detection, retry паттерны",
    route: "/examples/06-networking",
    color: COLORS.blue,
  },
  {
    num: "07",
    title: "Storage",
    desc: "AsyncStorage, SecureStore, expo-sqlite, File System",
    route: "/examples/07-storage",
    color: COLORS.green,
  },
  {
    num: "08",
    title: "Performance",
    desc: "FlatList оптимизация, getItemLayout, memo, FlashList, profiling",
    route: "/examples/08-performance",
    color: COLORS.amber,
  },
  {
    num: "09",
    title: "Architecture",
    desc: "Bridge vs JSI, New Architecture, TurboModules, Fabric, Hermes",
    route: "/examples/09-architecture",
    color: COLORS.purple,
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          React Native + Expo SDK 52 · TypeScript · Expo Router
        </Text>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            📱 Запуск: <Text style={styles.tipCode}>npm install && npx expo start</Text>
            {"\n"}• Expo Go: сканируй QR камерой телефона{"\n"}
            • iOS Simulator: нажми <Text style={styles.tipCode}>i</Text>
            {"\n"}• Android: нажми <Text style={styles.tipCode}>a</Text>
          </Text>
        </View>
      </View>

      {MODULES.map((mod) => (
        <Pressable
          key={mod.num}
          style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
          onPress={() => router.push(mod.route as never)}
        >
          <View style={[styles.numBadge, { backgroundColor: mod.color + "22" }]}>
            <Text style={[styles.num, { color: mod.color }]}>{mod.num}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={styles.cardDesc}>{mod.desc}</Text>
          </View>
          <Text style={[styles.arrow, { color: mod.color }]}>›</Text>
        </Pressable>
      ))}

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textDim,
    marginBottom: SPACING.sm,
  },
  tip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  tipText: {
    fontSize: 12,
    color: COLORS.textDim,
    lineHeight: 20,
  },
  tipCode: {
    fontFamily: "monospace",
    color: COLORS.blue,
    backgroundColor: COLORS.surface2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  numBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  num: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f0f6fc",
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 11,
    color: COLORS.textDim,
    lineHeight: 16,
  },
  arrow: {
    fontSize: 24,
    fontWeight: "300",
  },
});
