"use client";

import { useState, useEffect } from "react";

const THEMES = [
  {
    id:    "midnight",
    label: "Midnight",
    desc:  "Deep space indigo",
    color: "linear-gradient(135deg, #6366f1, #a78bfa)",
  },
  {
    id:    "aurora",
    label: "Aurora",
    desc:  "Dark teal & emerald",
    color: "linear-gradient(135deg, #00c07f, #00b8d9)",
  },
  {
    id:    "rose",
    label: "Rose",
    desc:  "Dark rose & magenta",
    color: "linear-gradient(135deg, #e11d74, #c026d3)",
  },
  {
    id:    "light",
    label: "Light",
    desc:  "Clean & minimal",
    color: "linear-gradient(135deg, #e2e8f0, #94a3b8)",
  },
] as const;

type ThemeId = typeof THEMES[number]["id"];

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("midnight");
  const [open, setOpen]   = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("theme") ?? "midnight") as ThemeId;
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const apply = (id: ThemeId) => {
    setTheme(id);
    setOpen(false);
    localStorage.setItem("theme", id);
    document.documentElement.setAttribute("data-theme", id);
  };

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="theme-switcher-wrap">
      {/* Dropdown */}
      {open && (
        <div className="theme-dropdown">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-option ${theme === t.id ? "active" : ""}`}
              onClick={() => apply(t.id)}
            >
              <span
                className="theme-swatch"
                style={{ background: t.color }}
              />
              <span className="theme-option-info">
                <span className="theme-option-name">{t.label}</span>
                <span className="theme-option-desc">{t.desc}</span>
              </span>
              {theme === t.id && <span className="theme-check">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        className="theme-trigger"
        onClick={() => setOpen((v) => !v)}
        title="Сменить тему"
      >
        <span
          className="theme-swatch-sm"
          style={{ background: current.color }}
        />
        <span className="theme-trigger-label">{current.label}</span>
        <span className="theme-trigger-chevron">{open ? "▲" : "▼"}</span>
      </button>
    </div>
  );
}
