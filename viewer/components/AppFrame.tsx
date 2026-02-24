"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import type { ModuleInfo } from "@/lib/types";

interface Props {
  modules: ModuleInfo[];
  children: React.ReactNode;
}

export default function AppFrame({ modules, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  // ESC closes sidebar on mobile
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeSidebar]);

  // Close sidebar on route change (best-effort) — when user navigates via links
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      closeSidebar();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [closeSidebar]);

  return (
    <div className="app-layout">
      <div className="mobile-topbar">
        <button className="mobile-burger" onClick={toggleSidebar} aria-label="Открыть навигацию">
          <span />
          <span />
          <span />
        </button>
        <Link href="/" className="mobile-title" style={{ textDecoration: "none" }}>
          <span className="mobile-title-mark">⚡</span>
          <span className="mobile-title-text">Senior Prep</span>
        </Link>
      </div>

      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />

      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Link href="/" className="sidebar-header" style={{ textDecoration: "none" }}>
          <div className="sidebar-logo">⚡</div>
          <div>
            <div className="sidebar-title">Senior Prep</div>
            <div className="sidebar-sub">Frontend Interview</div>
          </div>
        </Link>
        <Suspense fallback={<div style={{ padding: 16, color: "#8b949e", fontSize: 12 }}>Loading nav...</div>}>
          <AppSidebar modules={modules} />
        </Suspense>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}

