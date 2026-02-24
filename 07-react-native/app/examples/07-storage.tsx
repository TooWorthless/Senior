import { useState, useEffect } from "react";
import { ScrollView, View, Text, TextInput, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import { COLORS, SPACING, RADIUS } from "@/theme";
import { Section } from "@/components/Section";
import { CodeBlock } from "@/components/CodeBlock";
import { Card } from "@/components/Card";
import { Btn } from "@/components/Btn";

// ─── AsyncStorage Hook ────────────────────────────
function useAsyncStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then(item => {
        if (item !== null) setValue(JSON.parse(item) as T);
      })
      .finally(() => setLoaded(true));
  }, [key]);

  const set = async (newValue: T) => {
    setValue(newValue);
    await AsyncStorage.setItem(key, JSON.stringify(newValue));
  };

  const remove = async () => {
    setValue(initialValue);
    await AsyncStorage.removeItem(key);
  };

  return { value, set, remove, loaded };
}

export default function StorageScreen() {
  const [tab, setTab] = useState<"async" | "secure" | "sqlite" | "filesystem">("async");

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {(["async", "secure", "sqlite", "filesystem"] as const).map(t => (
          <View key={t} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}
              onPress={() => setTab(t)}>{t}</Text>
          </View>
        ))}
      </ScrollView>

      {tab === "async"      && <AsyncStorageTab />}
      {tab === "secure"     && <SecureStoreTab />}
      {tab === "sqlite"     && <SQLiteTab />}
      {tab === "filesystem" && <FileSystemTab />}
    </View>
  );
}

// ─── AsyncStorage Tab ─────────────────────────────
interface Note { id: string; text: string; createdAt: number }

function AsyncStorageTab() {
  const { value: notes, set: setNotes, loaded } = useAsyncStorage<Note[]>("notes", []);
  const [input, setInput] = useState("");
  const [allKeys, setAllKeys] = useState<string[]>([]);

  const addNote = async () => {
    if (!input.trim()) return;
    const newNotes = [...notes, { id: Date.now().toString(), text: input.trim(), createdAt: Date.now() }];
    await setNotes(newNotes);
    setInput("");
  };

  const deleteNote = async (id: string) => {
    await setNotes(notes.filter(n => n.id !== id));
  };

  const showAllKeys = async () => {
    const keys = await AsyncStorage.getAllKeys();
    setAllKeys([...keys]);
  };

  const clearAll = async () => {
    await AsyncStorage.clear();
    await setNotes([]);
    setAllKeys([]);
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="AsyncStorage — простое хранилище">
        <CodeBlock>{`import AsyncStorage from "@react-native-async-storage/async-storage";

// Все методы — async/await:

// Записать:
await AsyncStorage.setItem("key", JSON.stringify(value));

// Прочитать:
const raw = await AsyncStorage.getItem("key");
const value = raw !== null ? JSON.parse(raw) : null;

// Удалить:
await AsyncStorage.removeItem("key");

// Мультиоперации (batch — быстрее):
await AsyncStorage.multiSet([["k1", "v1"], ["k2", "v2"]]);
const [[,v1], [,v2]] = await AsyncStorage.multiGet(["k1", "k2"]);

// Все ключи:
const keys = await AsyncStorage.getAllKeys();

// ⚠️ AsyncStorage — строки только!
// JSON.stringify / JSON.parse для объектов обязателен
// ⚠️ Лимит: ~6MB на iOS, ~2-10MB на Android
// ⚠️ Не для конфиденциальных данных → SecureStore
// ⚠️ Не для реляционных данных → SQLite`}</CodeBlock>
      </Section>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: SPACING.sm }}>
        <TextInput style={[s.input, { flex: 1 }]} value={input} onChangeText={setInput}
          placeholder="Заметка..." placeholderTextColor={COLORS.textDim}
          onSubmitEditing={addNote} returnKeyType="done" />
        <Btn label="Add" onPress={addNote} />
      </View>

      {!loaded ? (
        <Text style={{ color: COLORS.textDim, fontSize: 13 }}>⏳ Loading...</Text>
      ) : notes.length === 0 ? (
        <Text style={{ color: COLORS.textDim, fontSize: 13 }}>Нет заметок</Text>
      ) : (
        notes.map(note => (
          <View key={note.id} style={s.noteItem}>
            <Text style={{ color: COLORS.text, fontSize: 13, flex: 1 }}>{note.text}</Text>
            <Btn label="✕" size="sm" variant="danger" onPress={() => deleteNote(note.id)} />
          </View>
        ))
      )}

      <View style={{ flexDirection: "row", gap: 8, marginTop: SPACING.sm }}>
        <Btn label="Все ключи" size="sm" variant="ghost" onPress={showAllKeys} />
        <Btn label="Clear All" size="sm" variant="danger" onPress={clearAll} />
      </View>
      {allKeys.length > 0 && (
        <View style={s.codeBox}>
          <Text style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "monospace" }}>
            [{allKeys.map(k => `"${k}"`).join(", ")}]
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── SecureStore Tab ──────────────────────────────
function SecureStoreTab() {
  const [key, setKey] = useState("auth_token");
  const [val, setVal] = useState("");
  const [readResult, setReadResult] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.isAvailableAsync().then(setAvailable);
  }, []);

  const writeSecure = async () => {
    if (!val.trim()) return;
    try {
      await SecureStore.setItemAsync(key, val, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
      setReadResult("✅ Сохранено в Keychain/Keystore");
      setVal("");
    } catch (e) {
      setReadResult(`❌ ${e instanceof Error ? e.message : "Error"}`);
    }
  };

  const readSecure = async () => {
    try {
      const result = await SecureStore.getItemAsync(key);
      setReadResult(result ?? "(пусто)");
    } catch (e) {
      setReadResult(`❌ ${e instanceof Error ? e.message : "Error"}`);
    }
  };

  const deleteSecure = async () => {
    await SecureStore.deleteItemAsync(key);
    setReadResult("Удалено");
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="SecureStore — зашифрованное хранилище">
        <CodeBlock>{`import * as SecureStore from "expo-secure-store";

// iOS: Keychain Services (шифрование AES-256)
// Android: Android Keystore (аппаратное шифрование)

// Запись:
await SecureStore.setItemAsync("token", value, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
  // WHEN_UNLOCKED — доступно пока экран разблокирован
  // ALWAYS — всегда, даже с заблокированным экраном
  // AFTER_FIRST_UNLOCK — после первой разблокировки
});

// Чтение:
const token = await SecureStore.getItemAsync("token");

// Удаление:
await SecureStore.deleteItemAsync("token");

// Проверка доступности (эмулятор может не поддерживать):
const ok = await SecureStore.isAvailableAsync();

// ⚠️ Лимит значения: 2048 байт
// ✅ Для: JWT токены, refresh tokens, PIN коды
// ✅ GDPR compliant — данные в аппаратном хранилище`}</CodeBlock>
      </Section>

      <View style={[s.statusBox, {
        borderColor: available === null ? COLORS.border : available ? COLORS.green : COLORS.red
      }]}>
        <Text style={{ color: available ? COLORS.green : COLORS.red, fontSize: 13 }}>
          {available === null ? "Проверка..." : available ? "✅ SecureStore доступен" : "❌ Недоступен (эмулятор?)"}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <TextInput style={s.input} value={key} onChangeText={setKey}
          placeholder="Key" placeholderTextColor={COLORS.textDim} />
        <TextInput style={s.input} value={val} onChangeText={setVal}
          placeholder="Value (секретное)" placeholderTextColor={COLORS.textDim}
          secureTextEntry />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Btn label="Save" onPress={writeSecure} />
          <Btn label="Read" variant="ghost" onPress={readSecure} />
          <Btn label="Delete" variant="danger" onPress={deleteSecure} />
        </View>
      </View>

      {readResult && (
        <View style={[s.codeBox, { marginTop: 8 }]}>
          <Text style={{ color: COLORS.blue, fontFamily: "monospace", fontSize: 13 }}>
            {readResult}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── SQLite Tab ───────────────────────────────────
interface UserRow { id: number; name: string; email: string }

function SQLiteTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const db = SQLite.useSQLiteContext();

  const appendLog = (msg: string) => setLog(l => [msg, ...l.slice(0, 4)]);

  const loadUsers = async () => {
    const result = await db.getAllAsync<UserRow>("SELECT * FROM users ORDER BY id DESC");
    setUsers(result);
  };

  const addUser = async () => {
    if (!name.trim()) return;
    const result = await db.runAsync(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name.trim(), email.trim() || `${name.toLowerCase()}@example.com`]
    );
    appendLog(`INSERT id=${result.lastInsertRowId}`);
    setName(""); setEmail("");
    await loadUsers();
  };

  const deleteUser = async (id: number) => {
    await db.runAsync("DELETE FROM users WHERE id = ?", [id]);
    appendLog(`DELETE id=${id}`);
    await loadUsers();
  };

  useEffect(() => {
    (async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT
        );
      `);
      appendLog("Table created (if not exists)");
      await loadUsers();
    })();
  }, [db]);

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="expo-sqlite — реляционная БД">
        <CodeBlock>{`import * as SQLite from "expo-sqlite";

// Открыть/создать БД (Expo SDK 50+):
const db = SQLite.openDatabaseSync("mydb.db");

// Или через хук (рекомендуется с SQLiteProvider):
function App() {
  return (
    <SQLite.SQLiteProvider
      databaseName="mydb.db"
      onInit={async (db) => {
        await db.execAsync(\`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
          );\`);
      }}
    >
      <MyComponent />
    </SQLite.SQLiteProvider>
  );
}

function MyComponent() {
  const db = SQLite.useSQLiteContext(); // hook

  // Запросы:
  const rows = await db.getAllAsync<User>("SELECT * FROM users");
  const one  = await db.getFirstAsync<User>("SELECT * FROM users WHERE id = ?", [id]);
  const result = await db.runAsync("INSERT INTO users (name) VALUES (?)", ["Alice"]);
  result.lastInsertRowId; // ID вставленной записи
  result.changes;         // кол-во изменённых строк

  // Транзакция:
  await db.withTransactionAsync(async () => {
    await db.runAsync("INSERT INTO ...");
    await db.runAsync("UPDATE ...");
  });
}`}</CodeBlock>
      </Section>

      <View style={{ gap: 8, marginBottom: SPACING.sm }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput style={[s.input, { flex: 1 }]} value={name} onChangeText={setName}
            placeholder="Name" placeholderTextColor={COLORS.textDim} />
          <TextInput style={[s.input, { flex: 1 }]} value={email} onChangeText={setEmail}
            placeholder="Email" placeholderTextColor={COLORS.textDim} />
        </View>
        <Btn label="INSERT User" onPress={addUser} />
      </View>

      {users.map(user => (
        <View key={user.id} style={s.noteItem}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontSize: 13 }}>{user.name}</Text>
            <Text style={{ color: COLORS.textDim, fontSize: 11 }}>{user.email}</Text>
          </View>
          <Text style={{ color: COLORS.textDim, fontSize: 11, marginRight: 8 }}>#{user.id}</Text>
          <Btn label="✕" size="sm" variant="danger" onPress={() => deleteUser(user.id)} />
        </View>
      ))}

      {log.length > 0 && (
        <View style={[s.codeBox, { marginTop: 8 }]}>
          {log.map((l, i) => (
            <Text key={i} style={{ color: COLORS.textDim, fontSize: 11, fontFamily: "monospace" }}>
              {l}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// SQLiteTab нужно обернуть в Provider
function SQLiteTabWrapped() {
  return (
    <SQLite.SQLiteProvider
      databaseName="senior-prep.db"
      onInit={async (db) => {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT
          );
        `);
      }}
    >
      <SQLiteTab />
    </SQLite.SQLiteProvider>
  );
}

// ─── FileSystem Tab ───────────────────────────────
function FileSystemTab() {
  const [info, setInfo] = useState<string[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const explore = async () => {
    const logs: string[] = [];
    logs.push(`documentDirectory: ${FileSystem.documentDirectory}`);
    logs.push(`cacheDirectory: ${FileSystem.cacheDirectory}`);

    const docInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory!);
    logs.push(`exists: ${String(docInfo.exists)}`);

    const dirContent = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
    logs.push(`files: [${dirContent.join(", ")}]`);

    setInfo(logs);
  };

  const writeFile = async () => {
    const path = FileSystem.documentDirectory + "test.txt";
    await FileSystem.writeAsStringAsync(path, "Hello from expo-file-system!\n" + new Date().toISOString());
    setFileContent("✅ Файл записан: test.txt");
  };

  const readFile = async () => {
    try {
      const path = FileSystem.documentDirectory + "test.txt";
      const content = await FileSystem.readAsStringAsync(path);
      setFileContent(content);
    } catch {
      setFileContent("❌ Файл не найден — сначала запиши");
    }
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="expo-file-system">
        <CodeBlock>{`import * as FileSystem from "expo-file-system";

// Пути:
FileSystem.documentDirectory  // постоянное хранилище (~Documents)
FileSystem.cacheDirectory     // временный кеш (может быть очищен OS)

// Читать текст:
const text = await FileSystem.readAsStringAsync(path);
// Или base64:
const b64  = await FileSystem.readAsStringAsync(path, { encoding: "base64" });

// Писать:
await FileSystem.writeAsStringAsync(path, content);

// Инфо о файле:
const info = await FileSystem.getInfoAsync(path);
info.exists; info.size; info.modificationTime;

// Скачать файл:
const { uri } = await FileSystem.downloadAsync(
  "https://example.com/file.pdf",
  FileSystem.documentDirectory + "file.pdf",
  { md5: true }
);

// Директории:
await FileSystem.makeDirectoryAsync(path, { intermediates: true });
const files = await FileSystem.readDirectoryAsync(dirPath);
await FileSystem.deleteAsync(path, { idempotent: true });
await FileSystem.copyAsync({ from: src, to: dst });
await FileSystem.moveAsync({ from: src, to: dst });`}</CodeBlock>
      </Section>

      <View style={{ gap: 8 }}>
        <Btn label="Explore FS" variant="ghost" onPress={explore} />
        <Btn label="Write test.txt" onPress={writeFile} />
        <Btn label="Read test.txt" variant="ghost" onPress={readFile} />
      </View>

      {info.length > 0 && (
        <View style={[s.codeBox, { marginTop: 8 }]}>
          {info.map((l, i) => (
            <Text key={i} style={{ color: COLORS.textDim, fontSize: 10, fontFamily: "monospace", lineHeight: 18 }}>
              {l}
            </Text>
          ))}
        </View>
      )}
      {fileContent && (
        <View style={[s.codeBox, { marginTop: 4, borderColor: COLORS.blue }]}>
          <Text style={{ color: COLORS.blue, fontSize: 12, fontFamily: "monospace" }}>
            {fileContent}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// Экспортируем с SQLiteProvider обёрткой
export { SQLiteTabWrapped as SQLiteTab };

export default function StorageScreenWithProvider() {
  const [tab, setTab] = useState<"async" | "secure" | "sqlite" | "filesystem">("async");

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {(["async", "secure", "sqlite", "filesystem"] as const).map(t => (
          <View key={t} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}
              onPress={() => setTab(t)}>{t}</Text>
          </View>
        ))}
      </ScrollView>

      {tab === "async"      && <AsyncStorageTab />}
      {tab === "secure"     && <SecureStoreTab />}
      {tab === "sqlite"     && <SQLiteTabWrapped />}
      {tab === "filesystem" && <FileSystemTab />}
    </View>
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
  input: {
    backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.sm, color: COLORS.text, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
  },
  noteItem: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  statusBox: {
    borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  codeBox: {
    backgroundColor: "#010409", borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border, padding: 10,
  },
});
