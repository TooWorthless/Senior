"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

// Monaco — lazy load (нет SSR)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      background: "#1e1e1e", color: "#8b949e", fontSize: 13,
    }}>
      ⏳ Loading editor...
    </div>
  ),
});

type Mode = "js" | "html" | "preview";

interface LogEntry {
  type: "log" | "error" | "warn" | "info" | "table";
  text: string;
  id: number;
}

interface Props {
  initialCode: string;
  filename:    string;
  extension:   string;
}

let logCounter = 0;

// Генерирует sandbox HTML для JS выполнения
function buildJSSandbox(code: string): string {
  // Кодируем код в base64 чтобы избежать проблем с </script> внутри кода
  const encoded = btoa(unescape(encodeURIComponent(code)));

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
(function() {
  var _send = function(type, args) {
    try {
      window.parent.postMessage({ type: type, args: args }, '*');
    } catch(e) {}
  };

  var _fmt = function(v) {
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (typeof v === 'object') {
      try { return JSON.stringify(v, null, 2); } catch(e) { return String(v); }
    }
    return String(v);
  };

  // Подменяем console
  var _console = {
    log:   function() { _send('log',   Array.prototype.map.call(arguments, _fmt)); },
    error: function() { _send('error', Array.prototype.map.call(arguments, _fmt)); },
    warn:  function() { _send('warn',  Array.prototype.map.call(arguments, _fmt)); },
    info:  function() { _send('info',  Array.prototype.map.call(arguments, _fmt)); },
    table: function(d) { _send('table', [typeof d === 'object' ? JSON.stringify(d, null, 2) : String(d)]); },
    dir:   function(d) { _send('log',  [typeof d === 'object' ? JSON.stringify(d, null, 2) : String(d)]); },
    time:   function() {},
    timeEnd:function() {},
    group:  function() {},
    groupEnd: function() {},
  };
  Object.defineProperty(window, 'console', { value: _console });

  // Мокаем Node.js API (наши .js примеры написаны для Node)
  window.process = { exit: function() {}, env: {}, argv: [], versions: {}, stdout: { write: function(s) { _send('log', [s]); } } };
  window.module = { exports: {} };
  window.exports = window.module.exports;
  window.require = function(mod) {
    _send('warn', ['require("' + mod + '") not available in browser sandbox']);
    return {};
  };

  // Перехват ошибок
  window.onerror = function(msg, src, line, col, err) {
    _send('error', [err ? (err.stack || err.message) : (msg + (line ? ' (line ' + line + ')' : ''))]);
    return true;
  };
  window.addEventListener('unhandledrejection', function(e) {
    var reason = e.reason;
    _send('error', ['UnhandledPromiseRejection: ' + (reason && reason.message ? reason.message : String(reason))]);
  });

  // Выполняем код
  try {
    var code = decodeURIComponent(escape(atob('${encoded}')));
    eval(code);
  } catch(e) {
    _send('error', [e.stack || e.message || String(e)]);
  }
})();
<\/script>
</body>
</html>`;
}

export default function CodeConsole({ initialCode, filename, extension }: Props) {
  const [code, setCode]       = useState(initialCode);
  const [mode, setMode]       = useState<Mode>(
    extension === "html" || extension === "css" ? "html" : "js"
  );
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [sandboxSrc, setSandboxSrc] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const outputRef  = useRef<HTMLDivElement>(null);
  const editorLang = extension === "html" ? "html" : extension === "css" ? "css" : "javascript";
  const isDirty    = code !== initialCode;

  const reset = useCallback(() => {
    setCode(initialCode);
    setLogs([]);
    setSandboxSrc(null);
    setPreviewSrc(null);
    setRunning(false);
    setMode(extension === "html" || extension === "css" ? "html" : "js");
  }, [initialCode, extension]);

  // Слушаем сообщения из sandbox iframe
  useEffect(() => {
    const handler = (e: MessageEvent<{ type?: string; args?: string[] }>) => {
      if (!e.data?.type || !["log", "error", "warn", "info", "table"].includes(e.data.type)) return;
      const text = (e.data.args ?? []).join(" ");
      setLogs((prev) => [...prev, { type: e.data.type as LogEntry["type"], text, id: logCounter++ }]);
      setRunning(false);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Скроллить output вниз при новых логах
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  const run = useCallback(() => {
    setLogs([]);
    setRunning(true);

    if (mode === "preview" || (mode === "html" && (extension === "html" || extension === "css"))) {
      // HTML / CSS preview
      let src = code;
      // Если это CSS файл — оборачиваем в HTML страницу
      if (extension === "css") {
        src = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${code}</style></head><body><div class="demo">CSS Preview — добавь HTML в редакторе</div></body></html>`;
      }
      setPreviewSrc(src);
      setMode("preview");
      setRunning(false);
    } else {
      // JavaScript execution via sandbox iframe
      setMode("js");
      setSandboxSrc(buildJSSandbox(code));
    }
  }, [code, mode, extension]);

  // Клавиша Ctrl+Enter или Cmd+Enter → Run
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      }
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [run]);

  const clear = () => setLogs([]);

  // Цвет строки лога
  const logColor: Record<LogEntry["type"], string> = {
    log:   "#c9d1d9",
    error: "#f85149",
    warn:  "#f59e0b",
    info:  "#60a5fa",
    table: "#a5f3fc",
  };
  const logPrefix: Record<LogEntry["type"], string> = {
    log: ">", error: "✖", warn: "⚠", info: "ℹ", table: "⊞",
  };

  const outputLabel = mode === "preview" ? "Preview" : "Console";

  return (
    <div className="console-layout" style={{ height: "100%" }}>
      {/* Header */}
      <div className="console-header">
        {/* Mode switcher — только для HTML/JS переключения */}
        <div className="mode-switch">
          <button
            className={`mode-btn ${mode !== "preview" ? "active" : ""}`}
            onClick={() => setMode(extension === "html" ? "html" : "js")}
          >
            {extension === "html" ? "HTML" : extension === "css" ? "CSS" : "JS"}
          </button>
          {(extension === "html" || extension === "css") && (
            <button
              className={`mode-btn ${mode === "preview" ? "active" : ""}`}
              onClick={() => {
                setMode("preview");
                setPreviewSrc(extension === "css"
                  ? `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${code}</style></head><body><p style="font-family:sans-serif;color:#888;padding:20px">CSS Preview</p></body></html>`
                  : code
                );
              }}
            >
              Preview
            </button>
          )}
        </div>

        {/* File name + dirty indicator */}
        <span style={{
          fontFamily: "monospace", fontSize: 12,
          color: "#8b949e", marginRight: "auto",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          {filename}
          {isDirty && (
            <span title="Есть несохранённые изменения" style={{ color: "#f59e0b", fontSize: 10 }}>
              ●
            </span>
          )}
        </span>

        {/* Reset — только когда есть изменения */}
        {isDirty && (
          <button
            className="btn-clear"
            onClick={reset}
            title="Сбросить к оригинальному коду"
            style={{ marginRight: 4 }}
          >
            ↺ Reset
          </button>
        )}

        {/* Run */}
        <button
          className={`btn-run ${running ? "running" : ""}`}
          onClick={run}
          disabled={running}
        >
          ▶ Run <span style={{ opacity: 0.6, fontSize: 10 }}>⌘↵</span>
        </button>
      </div>

      {/* Body */}
      <div className="console-body">
        {/* Editor */}
        <div className="console-editor">
          <MonacoEditor
            height="100%"
            language={editorLang}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'Cascadia Code', 'Fira Code', Menlo, Monaco, monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              tabSize: 2,
              wordWrap: "on",
              padding: { top: 12, bottom: 12 },
              automaticLayout: true,
              scrollbar: {
                verticalScrollbarSize: 5,
                horizontalScrollbarSize: 5,
              },
            }}
          />
        </div>

        {/* Output / Preview */}
        <div className="console-output">
          <div className="output-header">
            <span className="output-header-title">{outputLabel}</span>
            {mode !== "preview" && (
              <button className="btn-clear" onClick={clear}>Clear</button>
            )}
            {mode === "preview" && (
              <button className="btn-clear" onClick={() => setMode(extension === "html" ? "html" : "js")}>
                ← Editor
              </button>
            )}
          </div>

          {/* Console logs */}
          {mode !== "preview" && (
            <div className="output-scroll" ref={outputRef}>
              {logs.length === 0 ? (
                <div className="output-empty">
                  {running ? "⏳ Running..." : "Нажми ▶ Run чтобы выполнить код"}
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="log-line"
                    style={{ color: logColor[log.type] }}
                  >
                    <span className="log-prefix" style={{ color: logColor[log.type], opacity: 0.6 }}>
                      {logPrefix[log.type]}
                    </span>
                    <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* HTML/CSS Preview */}
          {mode === "preview" && previewSrc && (
            <iframe
              className="preview-frame"
              srcDoc={previewSrc}
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
              style={{ flex: 1, border: "none", width: "100%", background: "#fff" }}
            />
          )}
          {mode === "preview" && !previewSrc && (
            <div className="output-empty">Нажми ▶ Run для предпросмотра</div>
          )}
        </div>
      </div>

      {/* Hidden execution iframe для JS */}
      {sandboxSrc && mode === "js" && (
        <iframe
          key={sandboxSrc.length} // force remount on each run
          srcDoc={sandboxSrc}
          sandbox="allow-scripts"
          style={{ display: "none" }}
          title="JS Sandbox"
          onLoad={() => setTimeout(() => setRunning(false), 1500)}
        />
      )}
    </div>
  );
}
