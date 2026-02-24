import { useRef, useState } from "react";
import {
  ScrollView, View, Text, StyleSheet, Animated,
  PanResponder, TouchableOpacity,
} from "react-native";
import {
  GestureDetector, Gesture,
} from "react-native-gesture-handler";
import Reanimated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, withRepeat, withSequence, interpolate,
  Easing, runOnJS,
} from "react-native-reanimated";
import { COLORS, SPACING, RADIUS } from "@/theme";
import { Section } from "@/components/Section";
import { CodeBlock } from "@/components/CodeBlock";
import { Btn } from "@/components/Btn";

export default function GesturesScreen() {
  const [tab, setTab] = useState<"animated" | "pan" | "reanimated" | "gestures">("animated");

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {(["animated", "pan", "reanimated", "gestures"] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]}
            onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tab === "animated"  && <AnimatedAPITab />}
      {tab === "pan"       && <PanResponderTab />}
      {tab === "reanimated" && <ReanimatedTab />}
      {tab === "gestures"  && <GestureHandlerTab />}
    </View>
  );
}

// ─── Animated API Tab ─────────────────────────────
function AnimatedAPITab() {
  const fade     = useRef(new Animated.Value(0)).current;
  const slide    = useRef(new Animated.Value(-100)).current;
  const scale    = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const [running, setRunning] = useState(false);

  const runSpring = () => Animated.spring(scale, {
    toValue: scale._value > 1 ? 1 : 1.4,
    friction: 3,
    tension: 100,
    useNativeDriver: true,
  }).start();

  const runFade = () => Animated.sequence([
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
    Animated.delay(500),
    Animated.timing(fade, { toValue: 0, duration: 400, useNativeDriver: true }),
  ]).start();

  const runSlide = () => Animated.timing(slide, {
    toValue: slide._value < 0 ? 0 : -100,
    duration: 300,
    useNativeDriver: true,
  }).start();

  const startLoop = () => {
    setRunning(true);
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Animated.timing ? undefined : undefined,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopLoop = () => {
    setRunning(false);
    rotation.stopAnimation();
    rotation.setValue(0);
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Animated API (React Native built-in)">
        <CodeBlock>{`// Animated.Value — отслеживаемое значение
const value = useRef(new Animated.Value(0)).current;

// Типы анимаций:
Animated.timing(value, {
  toValue: 1,       // целевое значение
  duration: 300,    // мс
  easing: Easing.ease,
  useNativeDriver: true, // ✅ ВСЕГДА true если возможно!
}).start();

Animated.spring(value, {
  toValue: 1,
  friction: 3,      // сопротивление (меньше = больше "прыгает")
  tension: 100,     // жёсткость (больше = быстрее)
  useNativeDriver: true,
}).start();

Animated.decay(value, {
  velocity: 5,      // начальная скорость
  deceleration: 0.997,
  useNativeDriver: true,
}).start();

// Комбинации:
Animated.sequence([anim1, anim2, anim3]).start();    // по очереди
Animated.parallel([anim1, anim2]).start();           // одновременно
Animated.stagger(100, [anim1, anim2, anim3]).start(); // с задержкой

// Interpolate — маппинг диапазонов:
const color = value.interpolate({
  inputRange: [0, 1],
  outputRange: ["#3b82f6", "#22c55e"],
});`}</CodeBlock>
      </Section>

      <View style={s.demoArea}>
        {/* Fade */}
        <Animated.View style={[s.box, { opacity: fade, backgroundColor: COLORS.blue + "cc" }]}>
          <Text style={{ color: "#fff", fontSize: 11 }}>Fade</Text>
        </Animated.View>

        {/* Slide */}
        <Animated.View style={[s.box, { transform: [{ translateX: slide }], backgroundColor: COLORS.green + "cc" }]}>
          <Text style={{ color: "#fff", fontSize: 11 }}>Slide</Text>
        </Animated.View>

        {/* Scale (spring) */}
        <Animated.View style={[s.box, { transform: [{ scale }], backgroundColor: COLORS.amber + "cc" }]}>
          <Text style={{ color: "#fff", fontSize: 11 }}>Spring</Text>
        </Animated.View>

        {/* Rotate */}
        <Animated.View style={[s.box, { transform: [{ rotate: spin }], backgroundColor: COLORS.purple + "cc" }]}>
          <Text style={{ color: "#fff", fontSize: 11 }}>Spin</Text>
        </Animated.View>
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Btn label="Fade" size="sm" onPress={runFade} />
          <Btn label="Slide" size="sm" variant="ghost" onPress={runSlide} />
          <Btn label="Spring" size="sm" variant="ghost" onPress={runSpring} />
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Btn label="▶ Loop Spin" size="sm" onPress={startLoop} />
          <Btn label="⏹ Stop" size="sm" variant="danger" onPress={stopLoop} />
        </View>
      </View>

      <Section title="useNativeDriver — критически важно">
        <CodeBlock>{`// useNativeDriver: true → анимация на UI thread (60-120fps)
// useNativeDriver: false → анимация на JS thread (может laggy)

// ✅ Работает с useNativeDriver:
// opacity, transform (translate, scale, rotate)

// ❌ НЕ работает с useNativeDriver:
// width, height, backgroundColor, borderRadius
// Для этих → react-native-reanimated!`}</CodeBlock>
      </Section>
    </ScrollView>
  );
}

// ─── PanResponder Tab ─────────────────────────────
function PanResponderTab() {
  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [dragging, setDragging] = useState(false);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setDragging(true),
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        setDragging(false);
        Animated.spring(pos, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <ScrollView contentContainerStyle={s.content} scrollEnabled={!dragging}>
      <Section title="PanResponder (legacy, но важно знать)">
        <CodeBlock>{`// PanResponder — низкоуровневый gesture API
const pan = useRef(PanResponder.create({
  onStartShouldSetPanResponder: () => true,
  onMoveShouldSetPanResponder: () => true,

  onPanResponderGrant: () => {
    // Начало жеста
    pos.setOffset({ x: pos.x._value, y: pos.y._value });
  },
  onPanResponderMove: Animated.event(
    [null, { dx: pos.x, dy: pos.y }], // null = event, { dx, dy } = gestureState
    { useNativeDriver: false }
  ),
  onPanResponderRelease: () => {
    pos.flattenOffset();
    // Snap back:
    Animated.spring(pos, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  },
})).current;

// Применение к элементу:
<Animated.View
  {...pan.panHandlers}
  style={{ transform: pos.getTranslateTransform() }}
/>`}</CodeBlock>
      </Section>

      <Text style={{ color: COLORS.textDim, fontSize: 12, textAlign: "center", marginBottom: 8 }}>
        Перетащи квадрат — вернётся на место
      </Text>

      <View style={s.dragArea}>
        <Animated.View
          {...pan.panHandlers}
          style={[
            s.draggable,
            { transform: pos.getTranslateTransform() },
            dragging && { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
          ]}
        >
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
            {dragging ? "🤏 Drag!" : "Drag me"}
          </Text>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

// ─── Reanimated Tab ───────────────────────────────
function ReanimatedTab() {
  const offset = useSharedValue(0);
  const scale  = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offset.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const runAnimation = () => {
    offset.value = withSequence(
      withTiming(80, { duration: 300 }),
      withSpring(-80, { damping: 4 }),
      withSpring(0, { damping: 8 }),
    );
    scale.value = withSequence(
      withTiming(1.3, { duration: 150 }),
      withSpring(1, { damping: 10 }),
    );
  };

  const pulse = () => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      4, true
    );
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="Reanimated 3 — production анимации">
        <CodeBlock>{`import Reanimated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence, withRepeat,
} from "react-native-reanimated";

// SharedValue — работает на UI thread:
const offset = useSharedValue(0);

// useAnimatedStyle — вычисляется на UI thread:
const style = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],
}));

// Анимировать:
offset.value = withSpring(100);    // spring physics
offset.value = withTiming(100, {  // easing
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
});
offset.value = withSequence(
  withTiming(100),
  withSpring(-100),
  withSpring(0),
);

// runOnJS — вызвать JS функцию из worklet:
offset.value = withTiming(0, {}, (finished) => {
  runOnJS(setDone)(true); // setState из анимации
});

// Применить к Reanimated.View (не обычный View!):
<Reanimated.View style={[styles.box, animStyle]} />`}</CodeBlock>

        <View style={s.demoArea}>
          <Reanimated.View style={[s.box, animStyle, { backgroundColor: COLORS.blue + "cc" }]}>
            <Text style={{ color: "#fff", fontSize: 11 }}>RN</Text>
          </Reanimated.View>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Btn label="Bounce" onPress={runAnimation} />
          <Btn label="Pulse" variant="ghost" onPress={pulse} />
        </View>
      </Section>
    </ScrollView>
  );
}

// ─── GestureHandler Tab ───────────────────────────
function GestureHandlerTab() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const pressed = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onBegin(() => { pressed.value = true; })
    .onUpdate(e => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
      pressed.value = false;
    });

  const tapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedX.value = 0;
      savedY.value = 0;
    });

  const composed = Gesture.Simultaneous(panGesture, tapGesture);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    backgroundColor: pressed.value ? COLORS.green + "cc" : COLORS.amber + "cc",
  }));

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Section title="GestureHandler — современный API">
        <CodeBlock>{`import { GestureDetector, Gesture } from "react-native-gesture-handler";

// Создание жестов:
const tap = Gesture.Tap()
  .numberOfTaps(2)        // двойной тап
  .onEnd(() => reset());

const pan = Gesture.Pan()
  .onUpdate(e => {
    x.value = savedX.value + e.translationX;
  })
  .onEnd(() => {
    savedX.value = x.value; // сохранить позицию
  });

// Комбинирование жестов:
const simultaneous = Gesture.Simultaneous(pan, pinch);
const exclusive    = Gesture.Exclusive(tap, longPress);
const race         = Gesture.Race(pan, swipe);

// Применить:
<GestureDetector gesture={simultaneous}>
  <Reanimated.View style={animStyle} />
</GestureDetector>

// ⚠️ GestureHandlerRootView обязателен в _layout.tsx!
// ⚠️ Reanimated.View (не обычный View) для анимированных жестов`}</CodeBlock>
      </Section>

      <Text style={{ color: COLORS.textDim, fontSize: 12, textAlign: "center", marginBottom: 8 }}>
        Перетащи • Двойной тап — вернуть на место
      </Text>

      <View style={s.gestureArea}>
        <GestureDetector gesture={composed}>
          <Reanimated.View style={[s.gestureBox, boxStyle]}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Pan + DoubleTap</Text>
          </Reanimated.View>
        </GestureDetector>
      </View>
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

  demoArea: {
    height: 100, flexDirection: "row", alignItems: "center",
    justifyContent: "space-around", marginVertical: 12,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
  },
  box: {
    width: 60, height: 60, borderRadius: RADIUS.sm,
    alignItems: "center", justifyContent: "center",
  },
  dragArea: {
    height: 200, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.border, marginVertical: 12,
  },
  draggable: {
    width: 80, height: 80, backgroundColor: COLORS.purple + "88",
    borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.purple,
    alignItems: "center", justifyContent: "center",
  },
  gestureArea: {
    height: 250, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, marginVertical: 12,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  gestureBox: {
    width: 120, height: 70, borderRadius: RADIUS.md,
    alignItems: "center", justifyContent: "center",
  },
});
