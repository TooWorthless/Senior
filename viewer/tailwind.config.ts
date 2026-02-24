import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       "#0d1117",
        surface:  "#161b22",
        surface2: "#1c2128",
        border:   "#30363d",
        text:     "#c9d1d9",
        dim:      "#8b949e",
        blue:     "#3b82f6",
        green:    "#3fb950",
        amber:    "#f59e0b",
        red:      "#f85149",
        purple:   "#a855f7",
      },
      fontFamily: {
        mono: ["'Cascadia Code'", "'Fira Code'", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      typography: {
        invert: {
          css: {
            "--tw-prose-body": "#c9d1d9",
            "--tw-prose-headings": "#e6edf3",
            "--tw-prose-code": "#c9d1d9",
            "--tw-prose-pre-bg": "#1c2128",
            "--tw-prose-pre-code": "#c9d1d9",
            "--tw-prose-quotes": "#8b949e",
            "--tw-prose-links": "#3b82f6",
            "--tw-prose-bold": "#e6edf3",
            "--tw-prose-counters": "#8b949e",
            "--tw-prose-bullets": "#8b949e",
            "--tw-prose-hr": "#30363d",
            "--tw-prose-th-borders": "#30363d",
            "--tw-prose-td-borders": "#30363d",
          },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
