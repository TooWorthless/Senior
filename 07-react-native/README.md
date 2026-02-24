# 07 · React Native + Expo

[← На главную](../README.md)

---

## Запуск

```bash
cd 07-react-native
npm install
npx expo start
```

После запуска:
- **Expo Go** (телефон): сканируй QR-код камерой → откроется в Expo Go
- **iOS Simulator**: нажми `i` в терминале (нужен Xcode)
- **Android Emulator**: нажми `a` (нужен Android Studio)
- **Web**: нажми `w` (ограниченная поддержка RN компонентов)

---

## Стек

```
React Native 0.76  ·  Expo SDK 52  ·  TypeScript strict
Expo Router 4      ·  Reanimated 3  ·  GestureHandler 2
expo-sqlite 14     ·  AsyncStorage  ·  SecureStore
NetInfo            ·  Hermes (default)  ·  New Architecture
```

---

## Навигация по экранам

| # | Экран | Ключевые темы |
|---|-------|---------------|
| 01 | Core Components | View, Text, Image, FlatList, SectionList, Pressable, TextInput, Modal |
| 02 | Styling | StyleSheet, Flexbox (отличия от веба), Dimensions, Platform, dp/px |
| 03 | Navigation | Expo Router, Stack, Tabs, параметры, deep links, typed routes |
| 04 | Platform APIs | AppState, Keyboard, Haptics, Vibration, Linking, Clipboard, Sharing |
| 05 | Gestures & Animated | Animated API, PanResponder, Reanimated 3, GestureHandler |
| 06 | Networking | fetch + AbortController, retry, NetInfo, offline queue, TanStack Query |
| 07 | Storage | AsyncStorage, SecureStore (Keychain), expo-sqlite, File System |
| 08 | Performance | FlatList оптимизация, getItemLayout, memo, FlashList, Profiling |
| 09 | Architecture | Bridge, JSI, Fabric, TurboModules, Hermes, новая архитектура |

---

## Ключевые концепции

### React Native vs Web

| Веб | React Native |
|-----|--------------|
| `<div>` | `<View>` |
| `<p>`, `<span>` | `<Text>` (только для текста!) |
| `<img>` | `<Image>` (нужны размеры) |
| `<input>` | `<TextInput>` |
| `<button>` | `<Pressable>` / `<TouchableOpacity>` |
| CSS | StyleSheet.create |
| `flexDirection: row` | `flexDirection: column` (по умолчанию!) |
| `px`, `em`, `rem` | dp (density-independent pixels) |
| Event handlers | Same API (`onPress`, `onChangeText`) |

### Архитектура (кратко)

```
Старая (до 2022):    JS Thread ←[async JSON Bridge]→ Native Thread
Новая (Expo SDK 52): JS Thread ←[sync JSI C++]→ Native Thread

JSI = JavaScript Interface
Fabric = новый renderer (синхронный layout)
TurboModules = ленивые нативные модули
Hermes = AOT bytecode JS движок
```

### Expo Router vs React Navigation

| | Expo Router | React Navigation |
|--|-------------|-----------------|
| Подход | File-based (как Next.js) | Programmatic |
| Deep links | Автоматически | Настройка вручную |
| Typed routes | ✅ (TypeScript) | Частично |
| Гибкость | Меньше | Больше |
| Рекомендуется | Новые проекты | Legacy, сложные кейсы |

---

## Вопросы на интервью

- Что такое Bridge и почему его заменили JSI?
- Чем `Pressable` лучше `TouchableOpacity`?
- Почему `flexDirection: column` по умолчанию в RN?
- Как работает `getItemLayout` у `FlatList`?
- Зачем `useCallback` для `renderItem` и `keyExtractor`?
- Что такое worklets в Reanimated и почему они быстрее?
- `AsyncStorage` vs `SecureStore` — когда что?
- Как обработать offline режим?
- Что такое Hermes и чем отличается от V8?
- Как работает Expo Router и чем отличается от React Navigation?
