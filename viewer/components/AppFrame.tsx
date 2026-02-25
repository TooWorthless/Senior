"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import type { ModuleInfo } from "@/lib/types";

type UserProfileLite = {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  nickname?: string | null;
  sub?: string | null;
};

interface Props {
  modules: ModuleInfo[];
  children: React.ReactNode;
  user: UserProfileLite | null;
}

export default function AppFrame({ modules, children, user }: Props) {
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

  const displayName =
    user?.name || user?.nickname || user?.email || "Мой профиль";
  const initials = (() => {
    const source = user?.name || user?.nickname || user?.email || "?";
    const trimmed = source.trim();
    if (!trimmed) return "?";
    const [firstPart] = trimmed.split(/\s|@/);
    return firstPart.charAt(0).toUpperCase();
  })();

  return (
    <div className="app-layout">
      <div className="mobile-topbar">
        <button
          className="mobile-burger"
          onClick={toggleSidebar}
          aria-label="Открыть навигацию"
        >
          <span />
          <span />
          <span />
        </button>
        <Link
          href="/"
          className="mobile-title"
          style={{ textDecoration: "none" }}
        >
          <span className="mobile-title-mark">⚡</span>
          <span className="mobile-title-text">Senior Prep</span>
        </Link>
        <div className="mobile-topbar-theme">
          <ThemeSwitcher />
          {user ? (
            <Link
              href="/profile"
              className="profile-pill profile-pill-mobile"
              aria-label="Открыть профиль"
            >
              <span className="profile-avatar">{initials}</span>
            </Link>
          ) : (
            <Link
              href="/auth/login?connection=google-oauth2&prompt=select_account&returnTo=/"
              className="profile-pill profile-pill-mobile"
              aria-label="Войти в аккаун"
            >
              <span className="profile-avatar">G</span>
            </Link>
          )}
          <div></div>
        </div>
      </div>

      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />

      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header-container">
          <div className="sidebar-header-row">
            <Link
              href="/"
              className="sidebar-header"
              style={{ textDecoration: "none" }}
            >
              <div className="sidebar-logo">⚡</div>
              <div>
                <div className="sidebar-title">Senior Prep</div>
                <div className="sidebar-sub">Frontend Interview</div>
              </div>
            </Link>
            <div className="sidebar-header-theme">
              <ThemeSwitcher />
            </div>
          </div>
          {user ? (
            <div className="sidebar-header-controls">
              <Link
                href="/profile"
                className="profile-pill profile-pill-sidebar"
                title={displayName}
              >
                <span className="profile-avatar">{initials}</span>
                <span className="profile-name">{displayName}</span>
              </Link>
            </div>
          ) : (
            <div className="sidebar-header-controls">
              <Link
                href="/auth/login?connection=google-oauth2&prompt=select_account&returnTo=/"
                className="profile-pill profile-pill-sidebar"
                title={displayName}
              >
                <span className="profile-name">Войти с помощью Google</span>
              </Link>
            </div>
          )}
        </div>
        <Suspense
          fallback={
            <div style={{ padding: 16, color: "#8b949e", fontSize: 12 }}>
              Loading nav...
            </div>
          }
        >
          <AppSidebar modules={modules} />
        </Suspense>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}
