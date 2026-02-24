import Link from "next/link";
import { getAllModules } from "@/lib/modules";

export default async function HomePage() {
  const modules = await getAllModules();

  return (
    <div className="content-page">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#e6edf3", marginBottom: 8 }}>
          Senior Frontend Interview Prep
        </h1>
        <p style={{ color: "#8b949e", fontSize: 14, lineHeight: 1.6 }}>
          Интерактивные материалы с теорией, примерами кода и встроенной консолью для их запуска.
          Доступны первые 4 основополагающих модуля.
        </p>
      </div>

      <div className="module-cards">
        {modules.map((mod) => (
          <Link key={mod.id} href={`/${mod.id}`} className="module-card">
            <div className="module-card-icon">{mod.icon}</div>
            <div className="module-card-num">{mod.id}</div>
            <div className="module-card-title">{mod.title}</div>
            <div className="module-card-desc">{mod.description}</div>
            <div className="module-card-meta">
              <span className="badge-ready">✅ Готов</span>
              <span>{mod.submodules.length} подмодулей</span>
              <span>·</span>
              <span>
                {mod.submodules.reduce((acc, s) => acc + s.examples.length, 0)} примеров
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div style={{
        marginTop: 40, padding: "16px 20px",
        background: "#161b22", border: "1px solid #30363d", borderRadius: 10,
        borderLeft: "3px solid #3b82f6",
      }}>
        <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 8, fontWeight: 600 }}>
          КАК ПОЛЬЗОВАТЬСЯ
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {[
            ["📖", "Выбери модуль → подмодуль → читай теорию в README"],
            ["▶", "Нажми на файл примера в сайдбаре или вкладку в верхней панели"],
            ["⌨️", "Открывается редактор (Monaco) с кодом примера — можешь его изменять"],
            ["🚀", "Нажми Run → JS выполняется в sandbox, результат в правой панели"],
            ["🌐", "Для HTML/CSS файлов — переключатель Preview показывает рендер"],
          ].map(([icon, text]) => (
            <div key={text as string} style={{ display: "flex", gap: 10, fontSize: 13, color: "#c9d1d9" }}>
              <span style={{ width: 20, flexShrink: 0 }}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
