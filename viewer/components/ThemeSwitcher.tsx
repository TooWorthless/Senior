"use client";

import { useState, useEffect, useRef } from "react";

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
  const [dropdownTop, setDropdownTop] = useState<number | null>(null);
  const [dropdownLeft, setDropdownLeft] = useState<number | null>(null);
  const [dropdownMinWidth, setDropdownMinWidth] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const vw = typeof window !== "undefined" ? window.innerWidth : 0;
        // 12px горизонтального отступа с каждой стороны
        const margin = 12;
        const maxLeft = Math.max(margin, vw - margin - rect.width);
        const left = Math.min(rect.left, maxLeft);

        setDropdownTop(rect.bottom + 6);
        setDropdownLeft(left);
        setDropdownMinWidth(rect.width);
      }
      return next;
    });
  };

  return (
    <div className="theme-switcher-wrap">
      {/* Dropdown */}
      {open && (
        <div
          className="theme-dropdown"
          style={{
            position: "fixed",
            top: dropdownTop ?? 64,
            left: dropdownLeft ?? 12,
            right: "auto",
            minWidth: dropdownMinWidth ?? undefined,
            width: "max-content",
            maxWidth: "min(260px, 100vw - 24px)",
          }}
        >
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

      {/* Trigger — компактная кнопка с текстом Theme */}
      <button
        className="theme-trigger"
        ref={triggerRef}
        onClick={toggleOpen}
        title="Сменить тему"
      >
        <span className="theme-trigger-label">Theme</span>
        <span className="theme-trigger-chevron">{open ? "▲" : "▼"}</span>
      </button>
    </div>
  );
}
