import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { COLORS } from "@/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: "#f0f6fc",
          headerTitleStyle: { fontWeight: "600", fontSize: 15 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.bg },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "⚛️ RN Senior Prep", headerLargeTitle: true }}
        />
        <Stack.Screen name="examples/01-core"         options={{ title: "01 · Core Components" }} />
        <Stack.Screen name="examples/02-styling"      options={{ title: "02 · Styling" }} />
        <Stack.Screen name="examples/03-navigation"   options={{ title: "03 · Navigation" }} />
        <Stack.Screen name="examples/04-platform"     options={{ title: "04 · Platform APIs" }} />
        <Stack.Screen name="examples/05-gestures"     options={{ title: "05 · Gestures & Animated" }} />
        <Stack.Screen name="examples/06-networking"   options={{ title: "06 · Networking" }} />
        <Stack.Screen name="examples/07-storage"      options={{ title: "07 · Storage" }} />
        <Stack.Screen name="examples/08-performance"  options={{ title: "08 · Performance" }} />
        <Stack.Screen name="examples/09-architecture" options={{ title: "09 · Architecture" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
