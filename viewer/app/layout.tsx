import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
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
    <html lang="ru">
      <body>
        <div className="app-layout">
          <aside className="app-sidebar">
            <div className="sidebar-header">
              <span className="sidebar-logo">📚</span>
              <div>
                <div className="sidebar-title">Senior Prep</div>
                <div className="sidebar-sub">Frontend Interview</div>
              </div>
            </div>
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
