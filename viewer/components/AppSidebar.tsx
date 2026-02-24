"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { ModuleInfo } from "@/lib/types";

interface Props {
  modules: ModuleInfo[];
}

export default function AppSidebar({ modules }: Props) {
  const pathname     = useSearchParams === undefined ? "/" : usePathname();
  const searchParams = useSearchParams();

  // Парсим текущий путь
  const parts          = pathname.split("/").filter(Boolean);
  const currentModule  = parts[0] ?? "";
  const currentSub     = parts[1] ?? "";
  const currentFile    = searchParams.get("file") ?? "";

  // Авто-открываем текущий модуль и подмодуль
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentModule) setExpanded((p) => ({ ...p, [currentModule]: true }));
    if (currentModule && currentSub)
      setExpandedSub((p) => ({ ...p, [`${currentModule}/${currentSub}`]: true }));
  }, [currentModule, currentSub]);

  const toggleModule = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const toggleSub = (key: string) =>
    setExpandedSub((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="sidebar-scroll">
      {modules.map((mod) => {
        const isModActive = currentModule === mod.id;
        const isExpanded  = expanded[mod.id] ?? false;

        return (
          <div key={mod.id}>
            {/* Module header — click expands/collapses */}
            <div
              className={`nav-module-header ${isExpanded ? "expanded" : ""}`}
              onClick={() => toggleModule(mod.id)}
            >
              <span className="icon">{mod.icon}</span>
              <Link
                href={`/${mod.id}`}
                onClick={(e) => e.stopPropagation()}
                style={{ color: isModActive ? "#c9d1d9" : "inherit", textDecoration: "none", flex: 1 }}
              >
                {mod.title}
              </Link>
              <span className="chevron">▶</span>
            </div>

            {/* Submodule list */}
            {isExpanded && mod.submodules.map((sub) => {
              const isSubActive = isModActive && currentSub === sub.id && !currentFile;
              const subKey      = `${mod.id}/${sub.id}`;
              const isSubExpanded = expandedSub[subKey] ?? false;
              const hasExamples = sub.examples.length > 0;

              return (
                <div key={sub.id}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Link
                      href={`/${mod.id}/${sub.id}`}
                      className={`nav-submodule ${isSubActive ? "active" : ""}`}
                      style={{ flex: 1 }}
                    >
                      {sub.title}
                    </Link>
                    {hasExamples && (
                      <button
                        onClick={() => toggleSub(subKey)}
                        style={{
                          background: "none", border: "none",
                          color: "#8b949e", cursor: "pointer",
                          padding: "5px 8px 5px 0", fontSize: 9,
                          transition: "transform 0.2s",
                          transform: isSubExpanded ? "rotate(90deg)" : "none",
                        }}
                        title={isSubExpanded ? "Скрыть примеры" : "Показать примеры"}
                      >
                        ▶
                      </button>
                    )}
                  </div>

                  {/* Examples list */}
                  {isSubExpanded && sub.examples.map((ex) => {
                    const isExActive = isModActive && currentSub === sub.id && currentFile === ex.name;
                    const href = `/${mod.id}/${sub.id}?file=${encodeURIComponent(ex.name)}`;

                    return (
                      <Link
                        key={ex.name}
                        href={href}
                        className={`nav-example ${isExActive ? "active" : ""}`}
                      >
                        <span className={`ext-badge ${ex.extension}`}>{ex.extension}</span>
                        {ex.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Footer hint */}
      <div
        style={{
          padding: "16px 16px 8px",
          fontSize: 10,
          color: "var(--text-muted)",
          lineHeight: 1.6,
          borderTop: "1px solid var(--border)",
          marginTop: 8,
        }}
      >
        <div style={{ marginBottom: 2 }}>▶ — раскрыть примеры</div>
        <div>🟡 .js · 🔴 .html · 🔵 .css</div>
      </div>
    </div>
  );
}
