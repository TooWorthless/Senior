import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import "./globals.css";
import "@/styles/themes/midnight.css";
import "@/styles/themes/aurora.css";
import "@/styles/themes/light.css";
import "@/styles/themes/rose.css";
import "@/styles/base.css";
import { getAllModules } from "@/lib/modules";
import AppSidebar from "@/components/AppSidebar";

export const metadata: Metadata = {
  title: "Senior Prep Viewer",
  description: "Интерактивный просмотрщик материалов для подготовки к Senior Frontend интервью",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const modules = await getAllModules();

  return (
    <html lang="ru" data-theme="midnight" suppressHydrationWarning>
      <head>
        {/* Prevent Flash of Wrong Theme */}
        <script dangerouslySetInnerHTML={{ __html:
          `(function(){try{var t=localStorage.getItem('theme')||'midnight';document.documentElement.setAttribute('data-theme',t);}catch(e){}})()` 
        }} />
      </head>
      <body suppressHydrationWarning>
        <div className="app-layout">
          <aside className="app-sidebar">
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
          <main className="app-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
