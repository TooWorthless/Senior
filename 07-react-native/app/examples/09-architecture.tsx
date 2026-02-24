import { View, Text, FlatList, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS } from "@/theme";

interface Section {
  id: string;
  title: string;
  content: string;
  code?: string;
  accent?: string;
}

const SECTIONS: Section[] = [
  {
    id: "bridge",
    title: "Старая архитектура: Bridge",
    accent: COLORS.red,
    content: `React Native с 2015 по 2022 использовал Bridge-архитектуру:

JS Thread ←→ Bridge (сериализация JSON) ←→ UI/Native Thread

Как это работало:
1. JS вычисляет что нужно нарисовать
2. Сериализует команды в JSON
3. Отправляет через асинхронный Bridge
4. Native Thread десериализует JSON
5. Выполняет нативные операции

Проблемы Bridge:
- Асинхронность: всё через JSON → задержки
- Сериализация дорогая: большие объекты = lag
- Нельзя синхронно читать native значения
- Layout происходит ПОСЛЕ JS → "jump" при mount
- Жесты → JS → Bridge → Native → слишком долго для 60fps`,
    code: `// Псевдокод Bridge:
// JS Thread:
sendMessage("UIManager.createView", {
  reactTag: 1, viewName: "RCTView",
  props: { style: { width: 100, height: 100 } }
}); // JSON сериализация!

// Native Thread:
// receive message → deserialize → create native view`,
  },
  {
    id: "jsi",
    title: "JSI — JavaScript Interface",
    accent: COLORS.green,
    content: `JSI (2021+) — прямая привязка JS к C++ без сериализации.

JS → JSI → C++ Native → UIKit/Android

Ключевые изменения:
1. Синхронные вызовы — JS может синхронно читать/писать нативные объекты
2. Нет JSON сериализации — передача объектов по ссылке
3. Shared memory — одна область памяти для JS и Native
4. Worklets (Reanimated) — JS код на UI thread

Что это даёт:
✅ Жесты без задержки (UI thread worklets)
✅ Layout синхронно
✅ Быстрая работа с нативными API
✅ Основа для TurboModules и Fabric`,
    code: `// JSI Host Object (C++):
class NativeCalculator: public jsi::HostObject {
  jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& name) {
    if (name.utf8(rt) == "add") {
      return jsi::Function::createFromHostFunction(rt, name, 2,
        [](jsi::Runtime& rt, const jsi::Value& thisVal,
           const jsi::Value* args, size_t count) {
          return jsi::Value(args[0].getNumber() + args[1].getNumber());
        });
    }
    return jsi::Value::undefined();
  }
};

// В JS — синхронный вызов без Promise!
const result = global.NativeCalculator.add(2, 3); // 5 — мгновенно`,
  },
  {
    id: "fabric",
    title: "Fabric — новый Renderer",
    accent: COLORS.blue,
    content: `Fabric заменяет UIManager (старый Shadow Thread).

Старая архитектура:
JS → Bridge → Shadow Thread (Yoga layout) → UI Thread

Fabric:
JS → C++ Renderer (синхронно) → Native Views

Преимущества:
✅ Синхронное измерение и layout
✅ Concurrent Mode поддержка (React 18 features)
✅ Priority-based rendering
✅ Нет отдельного Shadow Thread
✅ Меньше копирований данных`,
    code: `// Fabric Shadow Tree — в C++, не JS:
// React создаёт виртуальный Shadow Tree в C++
// Yoga (layout engine) работает прямо в C++
// Нет async bridge для layout операций

// ShadowNode в C++:
class ViewShadowNode : public ConcreteViewShadowNode<...> {
  // layout happens here in C++, not via Bridge
};`,
  },
  {
    id: "turbomodules",
    title: "TurboModules — ленивые нативные модули",
    accent: COLORS.purple,
    content: `Старая архитектура: ALL нативные модули загружались при старте приложения (даже если не используются). Startup был медленный.

TurboModules:
- Загружаются ЛЕНИВО — только когда первый раз используются
- Синхронный вызов через JSI (не Bridge)
- TypeScript Codegen — типы автогенерируются из spec файлов
- Нет JSON сериализации

Результат:
✅ Быстрый startup (не грузить GPS при старте если не нужен)
✅ Синхронный вызов
✅ Строгая типизация через Codegen`,
    code: `// Native Module Spec (TypeScript):
// NativeCalculatorSpec.ts
import { TurboModule, TurboModuleRegistry } from "react-native";

interface Spec extends TurboModule {
  add(a: number, b: number): number; // синхронный!
  fetchUser(id: string): Promise<User>; // или async
}

export default TurboModuleRegistry.getEnforcing<Spec>("Calculator");

// Codegen автоматически создаёт C++ биндинги из этого файла!
// Использование:
import Calculator from "./NativeCalculatorSpec";
const sum = Calculator.add(2, 3); // синхронно, без Promise!`,
  },
  {
    id: "hermes",
    title: "Hermes — оптимизированный JS движок",
    accent: COLORS.amber,
    content: `Hermes (2019, Meta) — JS движок специально для RN мобильных приложений.

Отличия от V8/JavaScriptCore:
- AOT Bytecode компиляция — JS → bytecode при сборке
- Нет JIT компилятора (меньше памяти!)
- Оптимизирован для startup time, не peak performance
- Меньше памяти → меньше OOM kills на слабых телефонах

Результаты (Meta):
- TTI (Time To Interactive): -43%
- Память: -18%
- Bundle размер: меньше (байткод)

Включён по умолчанию с Expo SDK 48+

Hermes Profiler:
- Flamechart в Chrome DevTools
- Отслеживает JS execution, GC, native calls`,
    code: `// app.json — включить Hermes:
{
  "expo": {
    "jsEngine": "hermes" // default в Expo 48+
  }
}

// AOT компиляция при npx expo build:
// main.jsbundle → main.jsbundle.hbc (Hermes bytecode)
// Браузер не может запустить .hbc!
// Именно поэтому Expo Go на Android загружает иначе`,
  },
  {
    id: "new-arch",
    title: "Новая архитектура (2022+)",
    accent: COLORS.green,
    content: `Новая архитектура = JSI + Fabric + TurboModules вместе.

Включена по умолчанию с React Native 0.74 и Expo SDK 52.

До (Bridge): JS ←[async JSON]→ Native
После (JSI): JS ←[sync C++ reference]→ Native

Полная схема новой архитектуры:
┌──────────────────────────────────┐
│         JS Thread                │
│   React + JS Bundle              │
│   JSI ↕ (C++ binding)           │
├──────────────────────────────────┤
│         C++ Core                 │
│   TurboModules (lazy native)     │
│   Fabric Renderer                │
│   Yoga Layout Engine             │
│   Event Emitter                  │
├──────────────────────────────────┤
│         UI Thread                │
│   Native Views (iOS/Android)     │
│   Reanimated Worklets            │
└──────────────────────────────────┘`,
    code: `// Проверить что новая архитектура включена:
import { TurboModuleRegistry } from "react-native";
const isNewArch = global.__turboModuleProxy != null;

// Expo SDK 52 — включить (или уже включена):
// app.json:
{
  "expo": {
    "newArchEnabled": true
  }
}`,
  },
  {
    id: "interview",
    title: "Вопросы на интервью",
    accent: COLORS.amber,
    content: `1. Что такое Bridge в React Native и почему его заменяют?
Bridge — асинхронный JSON сериализатор между JS и Native threads. Проблемы: задержки, дорогая сериализация, невозможность синхронных вызовов. Заменяется JSI — прямая C++ привязка без сериализации.

2. Чем JSI лучше Bridge?
Синхронные вызовы, нет JSON сериализации, shared memory, поддержка worklets (Reanimated). JSI — основа новой архитектуры.

3. Что такое TurboModules?
Ленивая загрузка нативных модулей через JSI. В старой архитектуре все модули грузились при старте. TurboModules грузятся при первом использовании. TypeScript Codegen автогенерирует типобезопасные биндинги.

4. Зачем Hermes, если есть V8/JSC?
Hermes оптимизирован для mobile: AOT bytecode (нет JIT), меньше памяти, быстрый startup. V8/JSC для peak performance (Node.js, браузер). На слабых Android устройствах Hermes критически важен.

5. Как работает Reanimated на UI thread?
Worklets — JS функции скомпилированные в bytecode и выполняемые на UI thread через JSI. Нет Bridge, нет задержек. Состояние shared values доступно синхронно с обоих threads через JSI.`,
    code: null,
  },
];

export default function ArchitectureScreen() {
  return (
    <FlatList
      data={SECTIONS}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <ArchCard section={item} />}
      contentContainerStyle={{ padding: SPACING.md, gap: SPACING.md }}
    />
  );
}

function ArchCard({ section }: { section: Section }) {
  return (
    <View style={[s.card, section.accent ? { borderLeftColor: section.accent, borderLeftWidth: 3 } : {}]}>
      <Text style={[s.title, { color: section.accent ?? COLORS.text }]}>
        {section.title}
      </Text>
      <Text style={s.content}>{section.content}</Text>
      {section.code && (
        <View style={s.codeBlock}>
          <Text style={s.code}>{section.code}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    lineHeight: 20,
  },
  content: {
    fontSize: 12,
    color: COLORS.textDim,
    lineHeight: 19,
  },
  codeBlock: {
    marginTop: 10,
    backgroundColor: "#010409",
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },
  code: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#a5d6ff",
    lineHeight: 16,
  },
});
