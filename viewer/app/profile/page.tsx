import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";

type Auth0User = {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  nickname?: string | null;
  sub?: string | null;
  email_verified?: boolean;
  updated_at?: string;
};

export const metadata: Metadata = {
  title: "Профиль — Senior Prep Viewer",
};

export default async function ProfilePage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login?connection=google-oauth2&returnTo=/profile");
  }

  const user = session.user as Auth0User;

  const displayName = user.name || user.nickname || user.email || "Без имени";
  const email = user.email ?? "—";
  const provider = user.sub?.split("|")[0] ?? "unknown";
  const userId = user.sub ?? "—";
  const emailVerified =
    typeof user.email_verified === "boolean"
      ? user.email_verified
        ? "Подтверждена"
        : "Не подтверждена"
      : "Нет данных";
  const updatedAt = user.updated_at
    ? new Date(user.updated_at).toLocaleString("ru-RU")
    : "Нет данных";

  const initials = (() => {
    const source = displayName || email;
    const trimmed = source.trim();
    if (!trimmed) return "?";
    const [firstPart] = trimmed.split(/\s|@/);
    return firstPart.charAt(0).toUpperCase();
  })();

  return (
    <div className="content-page">
      <div className="profile-header">
        <div className="profile-avatar-lg">{initials}</div>
        <div className="profile-header-text">
          <h1 className="profile-title">{displayName}</h1>
          <p className="profile-subtitle">
            Аккаунт, привязанный к Auth0. Здесь отображается базовая информация
            из вашего профиля и параметры текущей сессии.
          </p>
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-card-title">Основная информация</div>
          <dl className="profile-list">
            <div className="profile-list-row">
              <dt>Имя</dt>
              <dd>{displayName}</dd>
            </div>
            <div className="profile-list-row">
              <dt>Email</dt>
              <dd>{email}</dd>
            </div>
            <div className="profile-list-row">
              <dt>Провайдер</dt>
              <dd>{provider}</dd>
            </div>
            <div className="profile-list-row">
              <dt>Status email</dt>
              <dd>{emailVerified}</dd>
            </div>
          </dl>
        </section>

        <section className="profile-card">
          <div className="profile-card-title">Детали сессии</div>
          <dl className="profile-list">
            <div className="profile-list-row">
              <dt>User ID (sub)</dt>
              <dd className="profile-mono">{userId}</dd>
            </div>
            <div className="profile-list-row">
              <dt>Обновлён</dt>
              <dd>{updatedAt}</dd>
            </div>
          </dl>
          <p className="profile-hint">
            Эти данные приходят из Auth0 и используются только для
            аутентификации и персонализации опыта в Viewer.
          </p>
        </section>
      </div>

      <div className="profile-actions">
        <a
          href={`/auth/logout?returnTo=${encodeURIComponent(process.env.AUTH0_BASE_URL ?? "")}`}
          className="profile-logout-button"
        >
          Выйти из аккаунта
        </a>
      </div>
    </div>
  );
}
