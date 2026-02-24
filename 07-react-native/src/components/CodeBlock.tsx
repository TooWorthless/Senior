import { ScrollView, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "@/theme";

export function CodeBlock({ children }: { children: string }) {
  return (
    <ScrollView
      horizontal
      style={styles.container}
      showsHorizontalScrollIndicator={false}
    >
      <Text style={styles.code}>{children}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#010409",
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 6,
    padding: 12,
  },
  code: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#a5d6ff",
    lineHeight: 18,
  },
});
