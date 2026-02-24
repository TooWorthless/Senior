import { marked, Renderer } from "marked";
import hljs from "highlight.js";

const RUNNABLE = new Set(["javascript", "js", "html", "css"]);

const renderer = new Renderer();

renderer.code = function (code: string, language: string | undefined) {
  const lang      = language ?? "";
  const validLang = lang && hljs.getLanguage(lang) ? lang : "plaintext";
  const highlighted = hljs.highlight(code, { language: validLang }).value;

  // Нормализуем "js" → "javascript"
  const normLang = lang === "js" ? "javascript" : lang;
  // data-code не нужен — читаем textContent на клиенте (нет проблем с кодировкой)
  const dataAttrs = RUNNABLE.has(normLang)
    ? ` data-runnable="true" data-lang="${normLang}"`
    : "";

  return `<pre class="hljs-block"${dataAttrs}><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
};

renderer.codespan = function (code: string) {
  return `<code class="inline-code">${code}</code>`;
};

// Только #anchor и https:// ссылки кликабельны;
// относительные ссылки на другие .md файлы дают 404 в Next.js → span
renderer.link = function (href: string | null, title: string | null | undefined, text: string) {
  if (!href) return text;
  const t = title ? ` title="${title}"` : "";

  if (href.startsWith("#"))
    return `<a href="${href}"${t}>${text}</a>`;

  if (href.startsWith("http://") || href.startsWith("https://"))
    return `<a href="${href}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;

  // Относительная ссылка — деактивируем
  return `<span class="dead-link" title="Недоступно в viewer: ${href}">${text}</span>`;
};

marked.use({ renderer, mangle: false, headerIds: true });

export function renderMarkdown(content: string): string {
  return marked(content) as string;
}
