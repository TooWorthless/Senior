import type { Metadata } from "next";
import "./globals.css";
import "@/styles/themes/midnight.css";
import "@/styles/themes/aurora.css";
import "@/styles/themes/light.css";
import "@/styles/themes/rose.css";
import "@/styles/base.css";
import { getAllModules } from "@/lib/modules";
import AppFrame from "@/components/AppFrame";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { SessionData } from "@auth0/nextjs-auth0/types";

export const metadata: Metadata = {
  title: "Senior Prep Viewer",
  description:
    "Интерактивный просмотрщик материалов для подготовки к Senior Frontend интервью",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await auth0.getSession()) as SessionData;

  const modules = await getAllModules();

  return (
    <html lang="ru" data-theme="midnight" suppressHydrationWarning>
      <Auth0Provider>
        <head>
          {/* Prevent Flash of Wrong Theme */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme')||'midnight';document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`,
            }}
          />
        </head>
        <body suppressHydrationWarning>
          <AppFrame modules={modules} user={session?.user}>
            {children}
          </AppFrame>
        </body>
      </Auth0Provider>
    </html>
  );
}
