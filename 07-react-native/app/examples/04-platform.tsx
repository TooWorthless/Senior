import { useState, useEffect, useRef } from "react";
import {
  ScrollView, View, Text, StyleSheet, AppState, Keyboard,
  Vibration, Platform, Alert,
} from "react-native";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { COLORS, SPACING, RADIUS } from "@/theme";
import { Section } from "@/components/Section";
import { CodeBlock } from "@/components/CodeBlock";
import { Card } from "@/components/Card";
import { Btn } from "@/components/Btn";

// ─── AppState Monitor ─────────────────────────────
function useAppState() {
  const [appState, setAppState] = useState(AppState.currentState);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", nextState => {
      setAppState(nextState);
      setHistory(h => [`${nextState} @ ${new Date().toLocaleTimeString()}`, ...h.slice(0, 4)]);
    });
    return () => sub.remove();
  }, []);

  return { appState, history };
}

export default function PlatformScreen() {
  const [tab, setTab] = useState<"appstate" | "keyboard" | "haptics" | "system">("appstate");

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {(["appstate", "keyboard", "haptics", "system"] as const).map(t => (
          <View key={t} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}
              onPress={() => setTab(t)}>{t}</Text>
          </View>
        ))}
      </ScrollView>

      {tab === "appstate" && <AppStateTab />}
      {tab === "keyboard" && <KeyboardTab />}
      {tab === "haptics"  && <HapticsTab />}
      {tab === "system"   && <SystemTab />}
    </View>
  );
}

// ─── AppState Tab ─────────────────────────────────
function AppStateTab() {
  const { appState, history } = useAppState();

  const stateColor = appState === "active" ? COLORS.green : appState === "background" ? COLORS.amber : COLORS.red;

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="AppState — жизненный цикл приложения">
        <CodeBlock>{`// "active"     → приложение на переднем плане
// "background" → свёрнуто (Home / переключение задач)
// "inactive"   → iOS: звонок, Control Center, переход

import { AppState } from "react-native";

// Текущий state:
const current = AppState.currentState;

// Подписка на изменения:
const subscription = AppState.addEventListener("change", nextState => {
  if (nextState === "background") {
    // сохранить данные, поставить на паузу
    saveToStorage();
  }
  if (nextState === "active") {
    // обновить данные, возобновить
    refreshData();
  }
});

return () => subscription.remove(); // cleanup!

// Типичные кейсы:
// - Пауза видео при сворачивании
// - Обновить данные при возвращении
// - Сохранить черновик формы
// - Остановить геолокацию`}</CodeBlock>

        <View style={[s.stateCard, { borderColor: stateColor }]}>
          <Text style={{ color: stateColor, fontSize: 28, fontWeight: "bold" }}>
            {appState.toUpperCase()}
          </Text>
          <Text style={{ color: COLORS.textDim, fontSize: 12, marginTop: 4 }}>
            Сверни приложение и вернись — увидишь изменения
          </Text>
        </View>

        {history.length > 0 && (
          <View>
            <Text style={s.histLabel}>История переходов:</Text>
            {history.map((h, i) => (
              <Text key={i} style={s.histItem}>• {h}</Text>
            ))}
          </View>
        )}
      </Section>
    </ScrollView>
  );
}

// ─── Keyboard Tab ─────────────────────────────────
function KeyboardTab() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [coordsLog, setCoordsLog] = useState<string[]>([]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", e => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
      setCoordsLog(l => [`shown: ${e.endCoordinates.height.toFixed(0)}dp`, ...l.slice(0, 4)]);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      setCoordsLog(l => ["hidden", ...l.slice(0, 4)]);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Keyboard API">
        <CodeBlock>{`import { Keyboard } from "react-native";

// Убрать клавиатуру:
Keyboard.dismiss();

// Листенеры:
const show = Keyboard.addListener("keyboardWillShow", e => {
  // iOS: will, Android: did
  console.log(e.endCoordinates.height); // высота клавиатуры
});
const hide = Keyboard.addListener("keyboardDidHide", () => {});
// Cleanup:
return () => { show.remove(); hide.remove(); };

// KeyboardAvoidingView автоматически поднимает контент:
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={headerHeight}
>

// Нажатие вне input = dismiss:
<ScrollView keyboardShouldPersistTaps="handled">
  {/* "handled" — нажатие на Pressable внутри закрывает клавиатуру */}
</ScrollView>`}</CodeBlock>

        <View style={[s.stateCard, { borderColor: keyboardVisible ? COLORS.green : COLORS.border }]}>
          <Text style={{ color: keyboardVisible ? COLORS.green : COLORS.textDim, fontSize: 18, fontWeight: "600" }}>
            {keyboardVisible ? "⌨️ Visible" : "⌨️ Hidden"}
          </Text>
          {keyboardHeight > 0 && (
            <Text style={{ color: COLORS.amber, fontSize: 13, marginTop: 4 }}>
              Height: {keyboardHeight.toFixed(0)}dp
            </Text>
          )}
        </View>

        <Btn label="Keyboard.dismiss()" variant="ghost" onPress={() => Keyboard.dismiss()} />

        {coordsLog.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={s.histLabel}>Log:</Text>
            {coordsLog.map((l, i) => <Text key={i} style={s.histItem}>• {l}</Text>)}
          </View>
        )}
      </Section>
    </ScrollView>
  );
}

// ─── Haptics Tab ──────────────────────────────────
function HapticsTab() {
  const [lastAction, setLastAction] = useState("");

  const run = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
      setLastAction(label);
    } catch {
      setLastAction(`${label} (недоступно на симуляторе)`);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Haptics (тактильный отклик)">
        <CodeBlock>{`import * as Haptics from "expo-haptics";

// Impact — физический удар:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Notification — системные нотификации:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Selection changed — при выборе (пагинация, picker):
Haptics.selectionAsync();

// ⚠️ Haptics работают только на реальном устройстве!
// На симуляторе iOS — кидает ошибку
// Android — поддержка зависит от устройства`}</CodeBlock>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Btn label="Light" size="sm" onPress={() => run("Light", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))} />
            <Btn label="Medium" size="sm" onPress={() => run("Medium", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium))} />
            <Btn label="Heavy" size="sm" onPress={() => run("Heavy", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy))} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Btn label="✅ Success" size="sm" variant="primary" onPress={() => run("Success", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))} />
            <Btn label="⚠️ Warning" size="sm" variant="ghost" onPress={() => run("Warning", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning))} />
            <Btn label="❌ Error" size="sm" variant="danger" onPress={() => run("Error", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error))} />
          </View>
          <Btn label="Selection Changed" variant="ghost" onPress={() => run("Selection", () => Haptics.selectionAsync())} />
        </View>

        {lastAction ? (
          <View style={[s.highlight, { marginTop: 8 }]}>
            <Text style={{ color: COLORS.text, fontSize: 12 }}>Последнее: {lastAction}</Text>
          </View>
        ) : null}
      </Section>

      <Section title="Vibration (низкоуровневый)">
        <CodeBlock>{`import { Vibration } from "react-native";

// Простая вибрация:
Vibration.vibrate(); // 1 раз, ≈400ms

// Паттерн [wait, vibrate, wait, vibrate...]:
Vibration.vibrate([0, 200, 100, 200]); // iOS: 0ms ожидание, 200ms вибрация, ...

// Зациклить паттерн:
Vibration.vibrate([200, 100], true); // повторять бесконечно

// Остановить:
Vibration.cancel();

// ⚠️ Haptics предпочтительнее Vibration для UX
// Vibration — для специфических паттернов`}</CodeBlock>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Btn label="Vibrate" size="sm" variant="ghost" onPress={() => Vibration.vibrate()} />
          <Btn label="Pattern" size="sm" variant="ghost" onPress={() => Vibration.vibrate([0, 200, 100, 200, 100, 400])} />
          <Btn label="Cancel" size="sm" variant="danger" onPress={() => Vibration.cancel()} />
        </View>
      </Section>
    </ScrollView>
  );
}

// ─── System Tab ───────────────────────────────────
function SystemTab() {
  const [clipboardContent, setClipboardContent] = useState("");

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync("Hello from RN Senior Prep!");
    setClipboardContent("Скопировано!");
  };

  const readClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    setClipboardContent(text || "(пусто)");
  };

  const openUrl = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Ошибка", `Нельзя открыть: ${url}`);
    }
  };

  const shareContent = async () => {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync("https://github.com/expo/expo", {
        dialogTitle: "Поделиться",
      });
    } else {
      Alert.alert("Sharing недоступен");
    }
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Linking — открытие URL и deep links">
        <CodeBlock>{`import * as Linking from "expo-linking";

// Открыть URL в браузере:
Linking.openURL("https://example.com");

// Проверить поддержку перед открытием:
const ok = await Linking.canOpenURL("tel:+79001234567");
if (ok) Linking.openURL("tel:+79001234567");

// Схемы:
"mailto:user@example.com?subject=Hi&body=Hello"
"tel:+79001234567"
"sms:+79001234567"
"maps://?q=Moscow"       // iOS
"geo:55.7558,37.6176"    // Android

// Создать deep link для своего приложения:
const url = Linking.createURL("/products/123");
// → "myapp://products/123"

// Получить начальный URL (если запустили через deep link):
const url = await Linking.getInitialURL();`}</CodeBlock>
        <View style={{ gap: 8 }}>
          <Btn label="Открыть expo.dev" onPress={() => openUrl("https://expo.dev")} />
          <Btn label="Позвонить" variant="ghost" onPress={() => openUrl("tel:+79001234567")} />
          <Btn label="Email" variant="ghost" onPress={() => openUrl("mailto:test@example.com")} />
        </View>
      </Section>

      <Section title="Clipboard">
        <CodeBlock>{`import * as Clipboard from "expo-clipboard";

// Скопировать:
await Clipboard.setStringAsync("текст");

// Прочитать:
const text = await Clipboard.getStringAsync();

// Изображение:
await Clipboard.setImageAsync(base64);
const img = await Clipboard.getImageAsync({ format: "png" });`}</CodeBlock>
        <View style={{ gap: 8 }}>
          <Btn label="Скопировать текст" onPress={copyToClipboard} />
          <Btn label="Прочитать буфер" variant="ghost" onPress={readClipboard} />
          {clipboardContent ? (
            <View style={s.highlight}>
              <Text style={{ color: COLORS.text, fontSize: 12 }}>
                {clipboardContent}
              </Text>
            </View>
          ) : null}
        </View>
      </Section>

      <Section title="App Info">
        <CodeBlock>{`import Constants from "expo-constants";
import * as Application from "expo-application";

Constants.expoConfig?.version    // из app.json
Constants.expoConfig?.name
Constants.deviceName             // "iPhone 15 Pro"
Constants.sessionId              // уникальный ID сессии

Application.applicationId       // bundle identifier
Application.nativeApplicationVersion // "1.0.0"
Application.nativeBuildVersion      // "1" (build number)

// Для аналитики:
const deviceId = await Application.getAndroidId();      // Android
const idfa = await Application.getIosIdForVendor();     // iOS`}</CodeBlock>
        {[
          { label: "App Name",    value: Constants.expoConfig?.name ?? "N/A" },
          { label: "Version",     value: Constants.expoConfig?.version ?? "N/A" },
          { label: "SDK Version", value: Constants.expoConfig?.sdkVersion ?? "N/A" },
          { label: "Platform",    value: Platform.OS },
        ].map(({ label, value }) => (
          <View key={label} style={s.metricRow}>
            <Text style={{ color: COLORS.textDim, fontSize: 13 }}>{label}</Text>
            <Text style={{ color: COLORS.blue, fontFamily: "monospace", fontSize: 13 }}>{value}</Text>
          </View>
        ))}
      </Section>

      <Section title="Share">
        <Btn label="Share..." onPress={shareContent} />
        <CodeBlock>{`import * as Sharing from "expo-sharing";

// Поделиться файлом/URL:
await Sharing.shareAsync(fileUri, {
  mimeType: "application/pdf",
  dialogTitle: "Поделиться документом",
  UTI: "public.url", // iOS
});

// Нативный share sheet (iOS/Android):
import { Share } from "react-native";
await Share.share({
  title: "Поделиться",
  message: "Посмотри это: https://...",
  url: "https://...", // только iOS
});`}</CodeBlock>
      </Section>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: SPACING.md },
  tabBar: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBarContent: { paddingHorizontal: SPACING.sm, gap: SPACING.xs },
  tab: { paddingHorizontal: 14, paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.blue },
  tabText: { fontSize: 13, color: COLORS.textDim },
  tabTextActive: { color: COLORS.blue },

  stateCard: {
    borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.lg,
    alignItems: "center", marginBottom: SPACING.md, backgroundColor: COLORS.surface,
  },
  histLabel: { color: COLORS.textDim, fontSize: 11, marginBottom: 4 },
  histItem: { color: COLORS.text, fontSize: 12, lineHeight: 20, fontFamily: "monospace" },
  highlight: {
    backgroundColor: "rgba(59,130,246,0.1)", borderLeftWidth: 3,
    borderLeftColor: COLORS.blue, padding: 10, borderRadius: 4,
  },
  metricRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
});
