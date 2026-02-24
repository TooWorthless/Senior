import { useState, useRef } from "react";
import {
  ScrollView, View, Text, Image, TextInput, FlatList,
  SectionList, Pressable, TouchableOpacity, Switch,
  ActivityIndicator, Alert, Modal, StyleSheet,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { COLORS, SPACING, RADIUS } from "@/theme";
import { Card } from "@/components/Card";
import { Section } from "@/components/Section";
import { CodeBlock } from "@/components/CodeBlock";
import { Btn } from "@/components/Btn";

// ─── Данные для FlatList ──────────────────────────
interface Item { id: string; name: string; role: string; color: string }

const PEOPLE: Item[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  name: `User ${i + 1}`,
  role: ["Frontend", "Backend", "DevOps", "Design"][i % 4]!,
  color: [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple][i % 4]!,
}));

const SECTIONS = [
  { title: "Frontend", data: PEOPLE.filter(p => p.role === "Frontend") },
  { title: "Backend",  data: PEOPLE.filter(p => p.role === "Backend") },
  { title: "DevOps",   data: PEOPLE.filter(p => p.role === "DevOps") },
];

// ─── Item компонент для FlatList ──────────────────
function PersonItem({ item }: { item: Item }) {
  return (
    <View style={s.personItem}>
      <View style={[s.avatar, { backgroundColor: item.color + "33" }]}>
        <Text style={[s.avatarText, { color: item.color }]}>
          {item.name[0]}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.personName}>{item.name}</Text>
        <Text style={s.personRole}>{item.role}</Text>
      </View>
      <Text style={{ color: COLORS.textDim, fontSize: 11 }}>#{item.id}</Text>
    </View>
  );
}

export default function CoreScreen() {
  const [tab, setTab] = useState<"views" | "lists" | "input" | "feedback">("views");

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {(["views", "lists", "input", "feedback"] as const).map(t => (
          <Pressable key={t} style={[s.tab, tab === t && s.tabActive]}
            onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab === "views"    && <ViewsTab />}
      {tab === "lists"    && <ListsTab />}
      {tab === "input"    && <InputTab />}
      {tab === "feedback" && <FeedbackTab />}
    </View>
  );
}

// ─── Views Tab ────────────────────────────────────
function ViewsTab() {
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="View — базовый контейнер">
        <CodeBlock>{`// View = <div> в вебе
// Поддерживает flexbox, padding, margin, border, shadow
<View style={{ flexDirection: "row", gap: 8 }}>
  <View style={{ flex: 1, height: 60, backgroundColor: "#3b82f6", borderRadius: 8 }} />
  <View style={{ flex: 2, height: 60, backgroundColor: "#22c55e", borderRadius: 8 }} />
</View>

// ⚠️ В RN View не скроллится — нужен ScrollView
// ⚠️ View не принимает onClick — нужен Pressable / TouchableOpacity`}</CodeBlock>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, height: 60, backgroundColor: COLORS.blue + "44", borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: COLORS.blue, fontSize: 12 }}>flex: 1</Text>
          </View>
          <View style={{ flex: 2, height: 60, backgroundColor: COLORS.green + "44", borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: COLORS.green, fontSize: 12 }}>flex: 2</Text>
          </View>
        </View>
      </Section>

      <Section title="Text">
        <CodeBlock>{`// Text — единственный компонент для текста
// ⚠️ Нельзя рендерить строки вне Text
// Text поддерживает вложение для styling:
<Text style={{ color: "white" }}>
  Обычный <Text style={{ color: "blue", fontWeight: "bold" }}>жирный синий</Text> текст
</Text>

// numberOfLines + ellipsizeMode — обрезка:
<Text numberOfLines={2} ellipsizeMode="tail">
  Длинный текст который обрежется...
</Text>`}</CodeBlock>
        <Text style={{ color: COLORS.text, fontSize: 14, lineHeight: 22 }}>
          Обычный{" "}
          <Text style={{ color: COLORS.blue, fontWeight: "bold" }}>жирный синий</Text>{" "}
          и{" "}
          <Text style={{ color: COLORS.amber, fontStyle: "italic" }}>курсивный</Text>{" "}
          текст вложением
        </Text>
        <Text numberOfLines={2} ellipsizeMode="tail"
          style={{ color: COLORS.textDim, fontSize: 12, marginTop: 8 }}>
          Очень длинный текст который обрезается через numberOfLines={"{2}"} и ellipsizeMode={"\"tail\""} — всё лишнее заменяется на три точки в конце строки.
        </Text>
      </Section>

      <Section title="Image">
        <CodeBlock>{`// Обязательно указывать размеры (нет авто-размера как в вебе)
<Image
  source={{ uri: "https://..." }}
  style={{ width: 100, height: 100, borderRadius: 50 }}
  resizeMode="cover" // cover | contain | stretch | center
/>

// Локальный файл:
<Image source={require("./assets/icon.png")} style={{ width: 50, height: 50 }} />

// expo-image (быстрее + blur placeholder):
import { Image } from "expo-image";
<Image
  source={uri}
  placeholder={blurHash}
  contentFit="cover"
  transition={300}
/>`}</CodeBlock>
        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          {[COLORS.blue, COLORS.green, COLORS.amber].map((color, i) => (
            <View key={i} style={[s.imagePlaceholder, { backgroundColor: color + "33" }]}>
              <Text style={{ color, fontSize: 10 }}>Image {i + 1}</Text>
              <Text style={{ color: COLORS.textDim, fontSize: 9 }}>100×100</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Pressable vs TouchableOpacity">
        <CodeBlock>{`// Pressable — современный (рекомендуется):
<Pressable
  onPress={handlePress}
  onLongPress={handleLongPress}
  style={({ pressed }) => ({
    opacity: pressed ? 0.7 : 1, // стиль при нажатии
    backgroundColor: pressed ? "#1d4ed8" : "#3b82f6",
  })}
>
  <Text>Press me</Text>
</Pressable>

// TouchableOpacity — legacy, проще:
<TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
  <Text>Press me</Text>
</TouchableOpacity>

// TouchableHighlight — подсвечивает при нажатии
// TouchableWithoutFeedback — без визуальной реакции (Keyboard.dismiss)`}</CodeBlock>
        <PressableDemo />
      </Section>
    </ScrollView>
  );
}

function PressableDemo() {
  const [pressCount, setPressCount] = useState(0);
  const [longPressCount, setLongPressCount] = useState(0);
  return (
    <View style={{ flexDirection: "row", gap: SPACING.sm }}>
      <Pressable
        style={({ pressed }) => [s.pressBtn, { backgroundColor: pressed ? "#1d4ed8" : COLORS.blue }]}
        onPress={() => setPressCount(c => c + 1)}
        onLongPress={() => setLongPressCount(c => c + 1)}
      >
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
          Press ({pressCount})
        </Text>
        <Text style={{ color: "#ffffffaa", fontSize: 10 }}>Long: {longPressCount}</Text>
      </Pressable>
      <TouchableOpacity style={[s.pressBtn, { backgroundColor: COLORS.green }]}
        activeOpacity={0.5} onPress={() => setPressCount(c => c + 1)}>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>TouchableOpacity</Text>
        <Text style={{ color: "#ffffffaa", fontSize: 10 }}>activeOpacity=0.5</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Lists Tab ────────────────────────────────────
function ListsTab() {
  const [listType, setListType] = useState<"flat" | "section">("flat");

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", gap: 8, padding: SPACING.md }}>
        <Btn label="FlatList" variant={listType === "flat" ? "primary" : "ghost"}
          onPress={() => setListType("flat")} />
        <Btn label="SectionList" variant={listType === "section" ? "primary" : "ghost"}
          onPress={() => setListType("section")} />
      </View>

      {listType === "flat" ? (
        <FlatList
          data={PEOPLE}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PersonItem item={item} />}
          // Оптимизации:
          getItemLayout={(_, index) => ({
            length: 56, offset: 56 * index, index,
          })}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.border }} />}
          ListHeaderComponent={() => (
            <View style={s.listHeader}>
              <Text style={{ color: COLORS.textDim, fontSize: 12 }}>
                {PEOPLE.length} пользователей · FlatList
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={{ color: COLORS.textDim, textAlign: "center", padding: 20 }}>
              Пусто
            </Text>
          )}
        />
      ) : (
        <SectionList
          sections={SECTIONS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PersonItem item={item} />}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={{ color: COLORS.amber, fontSize: 12, fontWeight: "600" }}>
                {section.title} ({section.data.length})
              </Text>
            </View>
          )}
          stickySectionHeadersEnabled
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.border }} />}
        />
      )}
    </View>
  );
}

// ─── Input Tab ────────────────────────────────────
function InputTab() {
  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const [number, setNumber] = useState("");
  const [multiline, setMultiline] = useState("");
  const passwordRef = useRef<TextInput>(null);
  const [switchValue, setSwitchValue] = useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={s.content}>
        <Section title="TextInput">
          <CodeBlock>{`// Контролируемый input (как в React web):
<TextInput
  value={text}
  onChangeText={setText}
  placeholder="Введите текст"
  placeholderTextColor="#8b949e"
  style={{ borderWidth: 1, borderColor: "#30363d", padding: 10 }}
/>

// Важные props:
// keyboardType: "default" | "numeric" | "email-address" | "phone-pad"
// returnKeyType: "done" | "next" | "search" | "send"
// secureTextEntry: true — пароль
// autoCapitalize: "none" | "words" | "sentences"
// multiline: true — многострочный
// blurOnSubmit: false — не убирать фокус при Enter (multiline)

// KeyboardAvoidingView — поднимает контент при клавиатуре:
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}`}</CodeBlock>

          <View style={s.inputGroup}>
            <Text style={s.label}>Default</Text>
            <TextInput style={s.input} value={text} onChangeText={setText}
              placeholder="Введите текст" placeholderTextColor={COLORS.textDim}
              returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Password</Text>
            <TextInput ref={passwordRef} style={s.input} value={password}
              onChangeText={setPassword} placeholder="Пароль" secureTextEntry
              placeholderTextColor={COLORS.textDim} autoCapitalize="none" />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Numeric</Text>
            <TextInput style={s.input} value={number} onChangeText={setNumber}
              keyboardType="numeric" placeholder="Только цифры"
              placeholderTextColor={COLORS.textDim} />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Multiline</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: "top" }]}
              value={multiline} onChangeText={setMultiline}
              placeholder="Многострочный..." placeholderTextColor={COLORS.textDim}
              multiline numberOfLines={4} blurOnSubmit={false} />
          </View>
        </Section>

        <Section title="Switch">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: COLORS.text, fontSize: 14 }}>
              {switchValue ? "Включено" : "Выключено"}
            </Text>
            <Switch
              value={switchValue}
              onValueChange={setSwitchValue}
              trackColor={{ false: COLORS.border, true: COLORS.blue }}
              thumbColor={switchValue ? "#fff" : COLORS.textDim}
            />
          </View>
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Feedback Tab ─────────────────────────────────
function FeedbackTab() {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const simulate = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="ActivityIndicator">
        <View style={{ flexDirection: "row", gap: 20, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.blue} />
          <ActivityIndicator size="large" color={COLORS.green} />
          <ActivityIndicator size="large" color={COLORS.amber} animating={loading} />
          <Btn label={loading ? "Loading..." : "Animate"} onPress={simulate} />
        </View>
      </Section>

      <Section title="Alert">
        <CodeBlock>{`// Нативный alert — один API на iOS и Android
Alert.alert(
  "Подтверждение",         // title
  "Удалить пользователя?", // message
  [
    { text: "Отмена", style: "cancel" },
    { text: "Удалить", style: "destructive", onPress: () => deleteUser() },
  ]
);

// prompt (только iOS — для ввода текста в alert):
Alert.prompt("Введите имя", "", (name) => console.log(name));`}</CodeBlock>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Btn label="Simple Alert" onPress={() =>
            Alert.alert("Заголовок", "Это Alert компонент")} />
          <Btn label="Confirm" variant="danger" onPress={() =>
            Alert.alert("Подтверждение", "Удалить?", [
              { text: "Отмена", style: "cancel" },
              { text: "Удалить", style: "destructive", onPress: () => Alert.alert("Удалено!") },
            ])} />
        </View>
      </Section>

      <Section title="Modal">
        <Btn label="Открыть Modal" onPress={() => setModalVisible(true)} />
        <Modal visible={modalVisible} animationType="slide" transparent
          onRequestClose={() => setModalVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={{ color: "#f0f6fc", fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
                Modal
              </Text>
              <Text style={{ color: COLORS.textDim, fontSize: 13, marginBottom: 16 }}>
                animationType: "slide" | "fade" | "none"{"\n"}
                transparent: true → видно контент за модалом
              </Text>
              <Btn label="Закрыть" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>
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

  personItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: SPACING.md, height: 56,
    backgroundColor: COLORS.bg,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "bold" },
  personName: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  personRole: { fontSize: 11, color: COLORS.textDim },
  listHeader: { padding: SPACING.md, backgroundColor: COLORS.surface },
  sectionHeader: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    backgroundColor: COLORS.surface2,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },

  input: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm,
    color: COLORS.text, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
  },
  inputGroup: { marginBottom: SPACING.sm },
  label: { fontSize: 11, color: COLORS.textDim, marginBottom: 4 },

  pressBtn: {
    flex: 1, padding: SPACING.sm, borderRadius: RADIUS.sm,
    alignItems: "center", justifyContent: "center",
  },
  imagePlaceholder: {
    width: 100, height: 100, borderRadius: RADIUS.md,
    alignItems: "center", justifyContent: "center", gap: 4,
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg,
    padding: SPACING.xl, paddingBottom: SPACING.xl + 20,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
});
