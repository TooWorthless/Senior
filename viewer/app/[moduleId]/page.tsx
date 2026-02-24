import { notFound } from "next/navigation";
import Link from "next/link";
import { getModuleInfo, readReadme } from "@/lib/modules";
import { renderMarkdown } from "@/lib/markdown";
import MarkdownBody from "@/components/MarkdownBody";

interface Props {
  params: Promise<{ moduleId: string }>;
}

export default async function ModulePage({ params }: Props) {
  const { moduleId } = await params;
  const mod = await getModuleInfo(moduleId);
  if (!mod) notFound();

  const readme = await readReadme(moduleId);

  return (
    <div className="content-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Главная</Link>
        <span className="sep">/</span>
        <span className="current">{mod.icon} {mod.title}</span>
      </nav>

      {/* Submodules list */}
      <div style={{
        marginBottom: 28, padding: "16px 20px",
        background: "#161b22", border: "1px solid #30363d", borderRadius: 10,
      }}>
        <div style={{ fontSize: 11, color: "#8b949e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Подмодули ({mod.submodules.length})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {mod.submodules.map((sub) => (
            <Link
              key={sub.id}
              href={`/${moduleId}/${sub.id}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 6,
                background: "#1c2128", border: "1px solid #30363d",
                color: "#c9d1d9", fontSize: 12, textDecoration: "none",
                transition: "border-color 0.15s",
              }}
            >
              <span style={{ color: "#8b949e", fontFamily: "monospace", fontSize: 10 }}>{sub.id.split("-")[0]}</span>
              <span>{sub.title}</span>
              {sub.examples.length > 0 && (
                <span style={{
                  fontSize: 10, padding: "1px 5px", borderRadius: 3,
                  background: "rgba(63,185,80,0.15)", color: "#3fb950",
                }}>
                  {sub.examples.length}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* README */}
      {readme ? (
        <MarkdownBody html={renderMarkdown(readme)} />
      ) : (
        <div style={{ color: "#8b949e", fontSize: 13 }}>README не найден.</div>
      )}
    </div>
  );
}
