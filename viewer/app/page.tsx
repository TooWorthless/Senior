import Link from "next/link";
import { getAllModules } from "@/lib/modules";

export default async function HomePage() {
  const modules = await getAllModules();

  const totalExamples = modules.reduce(
    (acc, m) => acc + m.submodules.reduce((a, s) => a + s.examples.length, 0),
    0
  );
  const totalSubmodules = modules.reduce((acc, m) => acc + m.submodules.length, 0);

  return (
    <div className="content-page">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="hero">
        <div className="hero-label">
          <span className="hero-label-dot" />
          Interview Prep Kit
        </div>

        <h1 className="hero-title">
          Senior Frontend<br />Interview Prep
        </h1>

        <p className="hero-sub">
          Интерактивные материалы с теорией, примерами и встроенной консолью.
          Читай, запускай, экспериментируй — прямо в браузере.
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-num">{modules.length}</span>
            <span className="hero-stat-label">Модулей</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">{totalSubmodules}</span>
            <span className="hero-stat-label">Подмодулей</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-num">{totalExamples}</span>
            <span className="hero-stat-label">Примеров кода</span>
          </div>
        </div>
      </div>

      {/* ── Module cards ─────────────────────────────────────────────── */}
      <div className="module-cards">
        {modules.map((mod) => {
          const exCount = mod.submodules.reduce((a, s) => a + s.examples.length, 0);
          return (
            <Link key={mod.id} href={`/${mod.id}`} className="module-card">
              <div className="module-card-icon">{mod.icon}</div>
              <div className="module-card-num">{mod.id}</div>
              <div className="module-card-title">{mod.title}</div>
              <div className="module-card-desc">{mod.description}</div>
              <div className="module-card-meta">
                <span className="badge-ready">✓ Готов</span>
                <span>{mod.submodules.length} подмодулей</span>
                <span style={{ color: "var(--border-hover)" }}>·</span>
                <span>{exCount} примеров</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── How to use ───────────────────────────────────────────────── */}
      <div className="how-to-card">
        <div className="how-to-label">Как пользоваться</div>
        <div className="how-to-steps">
          {[
            ["📖", "Выбери модуль → подмодуль → читай теорию в README"],
            ["▶", "Нажми на файл примера в сайдбаре или вкладку сверху"],
            ["⌨", "Откроется Monaco Editor с кодом примера — можешь редактировать"],
            ["🚀", "Run (⌘↵) — JS запускается в sandbox, вывод справа"],
            ["🌐", "Для HTML/CSS — переключатель Preview показывает рендер"],
            ["↩", "Кнопка Reset восстанавливает оригинальный код файла"],
          ].map(([icon, text]) => (
            <div key={text as string} className="how-to-step">
              <span className="how-to-icon">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
