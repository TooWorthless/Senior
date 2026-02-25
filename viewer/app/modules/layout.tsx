import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect(
      "/auth/login?connection=google-oauth2&prompt=select_account&returnTo=/",
    );
  }
  return <>{children}</>;
}
