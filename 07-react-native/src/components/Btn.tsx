import { Pressable, Text, StyleSheet, type PressableProps } from "react-native";
import { COLORS, RADIUS } from "@/theme";

interface Props extends PressableProps {
  label: string;
  variant?: "primary" | "danger" | "ghost" | "blue";
  size?: "sm" | "md";
}

export function Btn({ label, variant = "primary", size = "md", ...props }: Props) {
  const bg =
    variant === "danger" ? "#b91c1c" :
    variant === "ghost"  ? "transparent" :
    variant === "blue"   ? "#1d4ed8" :
    "#238636";

  const textColor = variant === "ghost" ? COLORS.text : "#fff";
  const borderColor = variant === "ghost" ? COLORS.border : "transparent";
  const padding = size === "sm" ? { paddingHorizontal: 10, paddingVertical: 4 } : { paddingHorizontal: 14, paddingVertical: 7 };
  const fontSize = size === "sm" ? 11 : 13;

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor, borderWidth: variant === "ghost" ? 1 : 0, opacity: pressed ? 0.7 : 1 },
        padding,
        props.disabled && styles.disabled,
      ]}
    >
      <Text style={{ color: textColor, fontSize, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
