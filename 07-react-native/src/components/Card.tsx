import { View, Text, StyleSheet, type ViewProps } from "react-native";
import { COLORS, SPACING, RADIUS } from "@/theme";

interface Props extends ViewProps {
  title?: string;
  children: React.ReactNode;
  accent?: string;
}

export function Card({ title, children, accent, style, ...props }: Props) {
  return (
    <View
      style={[
        styles.card,
        accent ? { borderLeftWidth: 3, borderLeftColor: accent } : undefined,
        style,
      ]}
      {...props}
    >
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.amber,
    marginBottom: 8,
  },
});
