"use client";

import { useEffect, useRef } from "react";

interface Props { html: string }

let execId = 0;

const LOG_ICON: Record<string, string> = { log: ">", error: "✖", warn: "⚠", info: "ℹ", table: "⊞" };
const LOG_COLOR: Record<string, string> = {
  log: "#c9d1d9", error: "#f85149", warn: "#f59e0b", info: "#60a5fa", table: "#a5f3fc",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Строит srcdoc для JS sandbox iframe
function buildSandbox(code: string, id: number): string {
  // btoa/atob — безопасно для любых символов включая </script> и кавычки
  const encoded = btoa(unescape(encodeURIComponent(code)));
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>
(function(){
  var ID=${id};
  var send=function(t,a){try{window.parent.postMessage({_eid:ID,type:t,args:a},'*');}catch(e){}};
  var fmt=function(v){
    if(v===null)return'null';if(v===undefined)return'undefined';
    if(typeof v==='object'){try{return JSON.stringify(v,null,2);}catch(e){return String(v);}}
    return String(v);
  };
  var con={
    log:function(){send('log',Array.from(arguments).map(fmt));},
    error:function(){send('error',Array.from(arguments).map(fmt));},
    warn:function(){send('warn',Array.from(arguments).map(fmt));},
    info:function(){send('info',Array.from(arguments).map(fmt));},
    table:function(d){send('table',[fmt(d)]);},
    dir:function(d){send('log',[fmt(d)]);},
    time:function(){},timeEnd:function(){},group:function(){},groupEnd:function(){},
  };
  try{Object.defineProperty(window,'console',{value:con,writable:false,configurable:false});}catch(e){}
  window.process={exit:function(){},env:{},argv:[],versions:{},stdout:{write:function(s){send('log',[String(s)]);}}};
  window.module={exports:{}};window.exports=window.module.exports;
  window.require=function(m){send('warn',['require("'+m+'") not available in browser']);return{};};
  window.onerror=function(msg,src,line,col,err){
    send('error',[err?(err.stack||err.message):(msg+(line?' (line '+line+')':''))]);return true;
  };
  window.addEventListener('unhandledrejection',function(e){
    var r=e.reason;send('error',['UnhandledRejection: '+(r&&r.message?r.message:String(r))]);
  });
  // (0,eval) = indirect eval — выполняет код в глобальном scope (window),
  // поэтому объявленные функции доступны из onclick/event handlers
  try{
    var _c=decodeURIComponent(escape(atob('${encoded}')));
    (0,eval)(_c);
  }catch(e){send('error',[e&&(e.stack||e.message)||String(e)]);}
})();
<\/script></body></html>`;
}

// Открыть/закрыть inline консоль для блока кода
function toggleBlock(preEl: HTMLPreElement, btn: HTMLButtonElement, wrapper: HTMLElement) {
  const code = preEl.querySelector("code")?.textContent ?? "";
  const lang = preEl.getAttribute("data-lang") ?? "javascript";
  const originalLabel = btn.getAttribute("data-original-label") ?? "▶ Run JS";

  // Toggle: если консоль уже открыта — закрыть
  const existing = wrapper.nextElementSibling;
  if (existing?.classList.contains("inline-console")) {
    existing.remove();
    btn.classList.remove("active");
    btn.textContent = originalLabel;
    return;
  }

  btn.classList.add("active");
  btn.textContent = "✕ Close";

  // ── Построить панель ───────────────────────────────────────────────────
  const panel = document.createElement("div");
  panel.className = "inline-console";

  // Header
  const header = document.createElement("div");
  header.className = "inline-console-header";
  const titleEl = document.createElement("span");
  titleEl.className = "inline-console-title";
  const closeBtn = document.createElement("button");
  closeBtn.className = "inline-console-close";
  closeBtn.textContent = "✕ Close";
  closeBtn.onclick = () => {
    panel.remove();
    btn.classList.remove("active");
    btn.textContent = originalLabel;
  };
  header.appendChild(titleEl);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Output area
  const output = document.createElement("div");
  output.className = "inline-console-output";
  panel.appendChild(output);

  // Вставить сразу после wrapper
  wrapper.insertAdjacentElement("afterend", panel);

  // ── HTML / CSS preview ────────────────────────────────────────────────
  if (lang === "html" || lang === "css") {
    titleEl.innerHTML = `<span class="inline-console-dot"></span>Preview · ${lang.toUpperCase()}`;
    output.style.padding = "0";
    output.style.minHeight = "200px";
    const iframe = document.createElement("iframe");
    iframe.className = "inline-console-preview";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    iframe.style.cssText = "width:100%;min-height:240px;border:none;display:block;background:#fff;";
    output.appendChild(iframe);
    iframe.srcdoc = lang === "css"
      ? `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;padding:16px;}</style><style>${code}</style></head><body></body></html>`
      : code;
    return;
  }

  // ── JavaScript sandbox ─────────────────────────────────────────────────
  titleEl.innerHTML = `<span class="inline-console-dot"></span>Console output`;
  output.innerHTML = `<div style="color:#8b949e;padding:4px 0;font-size:12px">⏳ Running...</div>`;

  const id = ++execId;
  let done = false;

  const handler = (e: MessageEvent<{ _eid?: number; type?: string; args?: string[] }>) => {
    if (e.data?._eid !== id) return;
    const type = e.data.type as string;
    if (!LOG_ICON[type]) return;
    done = true;

    // Убрать placeholder
    const placeholder = output.querySelector<HTMLElement>("div");
    if (placeholder?.textContent?.includes("Running")) placeholder.remove();

    const line = document.createElement("div");
    line.className = "inline-log-line";
    line.style.cssText = `display:flex;gap:8px;color:${LOG_COLOR[type] ?? "#c9d1d9"};`;
    line.innerHTML = `<span style="opacity:.5;flex-shrink:0;width:14px">${LOG_ICON[type]}</span>`
      + `<span style="white-space:pre-wrap;word-break:break-all">${esc((e.data.args ?? []).join(" "))}</span>`;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  };

  window.addEventListener("message", handler);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  // Fallback через 5с — если код вообще ничего не печатает
  const timer = setTimeout(() => {
    iframe.remove();
    window.removeEventListener("message", handler);
    if (!done) {
      const placeholder = output.querySelector<HTMLElement>("div");
      if (placeholder?.textContent?.includes("Running")) {
        placeholder.textContent = "(Нет вывода)";
      }
    }
  }, 5000);

  // После установки srcdoc iframe загружается и выполняет код
  iframe.srcdoc = buildSandbox(code, id);

  // Cleanup при закрытии панели
  const prevClose = closeBtn.onclick;
  closeBtn.onclick = () => {
    clearTimeout(timer);
    window.removeEventListener("message", handler);
    iframe.remove();
    if (prevClose) (prevClose as () => void)();
  };
}

export default function MarkdownBody({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // ── Wrap code blocks (идемпотентно) ──────────────────────────────────
    const blocks = container.querySelectorAll<HTMLPreElement>("pre[data-runnable]");
    blocks.forEach((pre) => {
      if (pre.parentElement?.classList.contains("code-block-wrapper")) return;

      const lang = pre.getAttribute("data-lang") ?? "javascript";

      // CSS без HTML — смысла нет, просто оборачиваем без кнопки
      const isRunnable = lang !== "css";
      const label = lang === "html" ? "▶ Preview HTML" : "▶ Run JS";

      // Wrapper
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      // Header bar — macOS-style dots
      const bar = document.createElement("div");
      bar.className = "code-block-bar";
      bar.innerHTML = `
        <span class="code-block-dots">
          <span class="code-block-dot red"></span>
          <span class="code-block-dot yellow"></span>
          <span class="code-block-dot green"></span>
        </span>
        <span class="code-block-lang" data-lang="${lang}">${lang}</span>
      `;
      wrapper.insertBefore(bar, pre);

      // Run button — только для JS и HTML
      if (isRunnable) {
        const btn = document.createElement("button");
        btn.className = "code-run-btn";
        btn.textContent = label;
        btn.setAttribute("data-for-pre", "true");
        btn.setAttribute("data-original-label", label);
        bar.appendChild(btn);
      }
    });

    // ── Event delegation (один listener на весь контейнер) ───────────────
    // Это критично: переживает StrictMode double-invoke, навигацию, etc.
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        "button.code-run-btn[data-for-pre]"
      );
      if (!btn) return;

      const wrapper = btn.closest<HTMLElement>(".code-block-wrapper");
      const pre     = wrapper?.querySelector<HTMLPreElement>("pre[data-runnable]");
      if (!wrapper || !pre) return;

      toggleBlock(pre, btn, wrapper);
    };

    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [html]);

  return (
    <div
      ref={ref}
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
