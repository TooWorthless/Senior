import { notFound } from "next/navigation";
import Link from "next/link";
import { getModuleInfo, getSubmoduleInfo, readReadme, readExampleFile } from "@/lib/modules";
import { renderMarkdown } from "@/lib/markdown";
import MarkdownBody from "@/components/MarkdownBody";
import CodeConsole from "@/components/CodeConsole";

interface Props {
  params:       Promise<{ moduleId: string; submoduleId: string }>;
  searchParams: Promise<{ file?: string }>;
}

export default async function SubmodulePage({ params, searchParams }: Props) {
  const { moduleId, submoduleId } = await params;
  const { file }                  = await searchParams;

  const [mod, sub] = await Promise.all([
    getModuleInfo(moduleId),
    getSubmoduleInfo(moduleId, submoduleId),
  ]);

  if (!mod || !sub) notFound();

  // ── Tabs bar ────────────────────────────────────────────────────────────
  const TabsBar = () => (
    <div className="tabs-bar">
      {/* README tab */}
      <Link
        href={`/${moduleId}/${submoduleId}`}
        className={`tab-btn ${!file ? "active" : ""}`}
      >
        📄 README
      </Link>

      {/* Example file tabs */}
      {sub.examples.map((ex) => (
        <Link
          key={ex.name}
          href={`/${moduleId}/${submoduleId}?file=${encodeURIComponent(ex.name)}`}
          className={`tab-btn ${file === ex.name ? "active" : ""}`}
        >
          <span className={`tab-dot ${ex.extension}`} />
          {ex.label}
          <span style={{ fontSize: 10, color: "#8b949e" }}>.{ex.extension}</span>
        </Link>
      ))}
    </div>
  );

  // ── Show code console for a specific file ────────────────────────────────
  if (file) {
    const code = await readExampleFile(moduleId, submoduleId, file);
    if (code === null) notFound();

    const ext = file.split(".").pop() ?? "js";

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Mini breadcrumb */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px", background: "#161b22",
          borderBottom: "1px solid #30363d", fontSize: 12, color: "#8b949e",
          flexShrink: 0,
        }}>
          <Link href="/" style={{ color: "#8b949e", textDecoration: "none" }}>Главная</Link>
          <span>/</span>
          <Link href={`/${moduleId}`} style={{ color: "#8b949e", textDecoration: "none" }}>{mod.title}</Link>
          <span>/</span>
          <Link href={`/${moduleId}/${submoduleId}`} style={{ color: "#8b949e", textDecoration: "none" }}>{sub.title}</Link>
          <span>/</span>
          <span style={{ color: "#c9d1d9", fontFamily: "monospace" }}>{file}</span>
        </div>

        <TabsBar />

        {/* Full-height console — key={file} перемонтирует при смене файла */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <CodeConsole
            key={file}
            initialCode={code}
            filename={file}
            extension={ext}
          />
        </div>
      </div>
    );
  }

  // ── Show README ──────────────────────────────────────────────────────────
  const readme = await readReadme(moduleId, submoduleId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TabsBar />
      <div className="app-main" style={{ overflow: "auto" }}>
        <div className="content-page">
          {/* Breadcrumb */}
          <nav className="breadcrumb">
            <Link href="/">Главная</Link>
            <span className="sep">/</span>
            <Link href={`/${moduleId}`}>{mod.icon} {mod.title}</Link>
            <span className="sep">/</span>
            <span className="current">{sub.title}</span>
          </nav>

          {/* Quick-access examples */}
          {sub.examples.length > 0 && (
            <div style={{
              marginBottom: 24, padding: "14px 18px",
              background: "#161b22", border: "1px solid #30363d", borderRadius: 10,
              borderLeft: "3px solid #3fb950",
            }}>
              <div style={{ fontSize: 11, color: "#8b949e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                ▶ Примеры кода ({sub.examples.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {sub.examples.map((ex) => (
                  <Link
                    key={ex.name}
                    href={`/${moduleId}/${submoduleId}?file=${encodeURIComponent(ex.name)}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "5px 11px", borderRadius: 6,
                      background: "#1c2128", border: "1px solid #30363d",
                      color: "#c9d1d9", fontSize: 12, textDecoration: "none",
                      fontFamily: "monospace",
                    }}
                  >
                    <span className={`tab-dot ${ex.extension}`} />
                    {ex.label}
                    <span style={{ fontSize: 10, color: "#8b949e" }}>.{ex.extension}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Markdown */}
          {readme ? (
            <MarkdownBody html={renderMarkdown(readme)} />
          ) : (
            <div style={{ color: "#8b949e", fontSize: 13 }}>README не найден.</div>
          )}
        </div>
      </div>
    </div>
  );
}
