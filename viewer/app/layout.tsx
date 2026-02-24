import type { Metadata } from "next";
import "./globals.css";
import "@/styles/themes/midnight.css";
import "@/styles/themes/aurora.css";
import "@/styles/themes/light.css";
import "@/styles/themes/rose.css";
import "@/styles/base.css";
import { getAllModules } from "@/lib/modules";
import AppFrame from "@/components/AppFrame";

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
        <AppFrame modules={modules}>{children}</AppFrame>
      </body>
    </html>
  );
}
