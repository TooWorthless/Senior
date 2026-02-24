import { StyleSheet } from "react-native";

export const COLORS = {
  bg:       "#0d1117",
  surface:  "#161b22",
  surface2: "#21262d",
  border:   "#30363d",
  text:     "#c9d1d9",
  textDim:  "#8b949e",
  blue:     "#3b82f6",
  green:    "#22c55e",
  amber:    "#f59e0b",
  red:      "#f87171",
  purple:   "#a78bfa",
} as const;

export const FONTS = {
  mono: "monospace" as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  full: 999,
} as const;

// Общие стили компонентов
export const common = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  h1: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f0f6fc",
    marginBottom: 4,
  },
  h2: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f0f6fc",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  h3: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.amber,
    marginBottom: 6,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textDim,
    marginBottom: 16,
  },
  code: {
    backgroundColor: "#010409",
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontFamily: "monospace",
    fontSize: 11,
    color: "#a5d6ff",
    marginVertical: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    fontSize: 11,
    fontWeight: "600",
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  highlight: {
    backgroundColor: "rgba(59,130,246,0.1)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,
    padding: 10,
    borderRadius: 4,
    marginVertical: 6,
  },
});

// Кнопки
export const btnStyles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: "#238636" },
  danger:  { backgroundColor: "#b91c1c" },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  textGhost: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
});
