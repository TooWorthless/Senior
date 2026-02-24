import path from "path";
import fs from "fs/promises";
import type { ModuleInfo, SubmoduleInfo, ExampleFile } from "./types";

export const REPO_ROOT = path.join(process.cwd(), "..");

const SUPPORTED_MODULES = [
  "01-html",
  "02-css",
  "03-javascript",
  "04-javascript-dom",
];

const MODULE_META: Record<string, { title: string; icon: string; description: string }> = {
  "01-html":           { title: "HTML",             icon: "🌐", description: "Семантика, a11y, формы, Web Components, SEO" },
  "02-css":            { title: "CSS",              icon: "🎨", description: "Cascade, Flexbox, Grid, анимации, архитектура" },
  "03-javascript":     { title: "JavaScript",       icon: "⚡", description: "Типы, scope, алгоритмы, Event Loop, async" },
  "04-javascript-dom": { title: "JavaScript & DOM", icon: "🖥️", description: "DOM API, Events, Observers, Canvas, Web APIs" },
};

async function isDir(p: string): Promise<boolean> {
  try { return (await fs.stat(p)).isDirectory(); } catch { return false; }
}
async function isFile(p: string): Promise<boolean> {
  try { return (await fs.stat(p)).isFile(); } catch { return false; }
}

async function listDirs(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath);
    const results: string[] = [];
    for (const e of entries) {
      if (!e.startsWith(".") && e !== "node_modules" && await isDir(path.join(dirPath, e))) {
        results.push(e);
      }
    }
    return results.sort();
  } catch { return []; }
}

async function listFiles(dirPath: string, exts: string[]): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath);
    return entries
      .filter((e) => exts.some((x) => e.endsWith(`.${x}`)))
      .sort();
  } catch { return []; }
}

async function extractTitle(readmePath: string, fallback: string): Promise<string> {
  try {
    const content = await fs.readFile(readmePath, "utf-8");
    const match = content.match(/^#+\s+(.+)$/m);
    if (match) return match[1].replace(/^\d+\s*[·•.]\s*/, "").trim();
  } catch { /* ignore */ }
  return fallback;
}

function titleFromId(id: string): string {
  return id.split("-").slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export async function getAllModules(): Promise<ModuleInfo[]> {
  const modules: ModuleInfo[] = [];

  for (const moduleId of SUPPORTED_MODULES) {
    const modulePath = path.join(REPO_ROOT, moduleId);
    const meta = MODULE_META[moduleId];

    const subDirs = await listDirs(modulePath);
    const submodules: SubmoduleInfo[] = [];

    for (const subId of subDirs) {
      const subPath    = path.join(modulePath, subId);
      const readmePath = path.join(subPath, "README.md");
      const hasReadme  = await isFile(readmePath);

      // Примеры в examples/
      const examplesPath = path.join(subPath, "examples");
      const exFileNames  = await listFiles(examplesPath, ["js", "html", "css", "ts"]);
      const examples: ExampleFile[] = exFileNames.map((name) => ({
        name,
        extension: name.split(".").pop() ?? "txt",
        label: name.replace(/\.[^.]+$/, ""),
      }));

      const title = hasReadme ? await extractTitle(readmePath, titleFromId(subId)) : titleFromId(subId);
      submodules.push({ id: subId, title, moduleId, hasReadme, examples });
    }

    modules.push({ id: moduleId, submodules, ...meta });
  }

  return modules;
}

export async function getModuleInfo(moduleId: string): Promise<ModuleInfo | null> {
  const all = await getAllModules();
  return all.find((m) => m.id === moduleId) ?? null;
}

export async function getSubmoduleInfo(moduleId: string, submoduleId: string): Promise<SubmoduleInfo | null> {
  const mod = await getModuleInfo(moduleId);
  return mod?.submodules.find((s) => s.id === submoduleId) ?? null;
}

export async function readReadme(moduleId: string, submoduleId?: string): Promise<string | null> {
  const parts = [REPO_ROOT, moduleId, ...(submoduleId ? [submoduleId] : []), "README.md"];
  try { return await fs.readFile(path.join(...parts), "utf-8"); } catch { return null; }
}

export async function readExampleFile(moduleId: string, submoduleId: string, filename: string): Promise<string | null> {
  const primary  = path.join(REPO_ROOT, moduleId, submoduleId, "examples", filename);
  const fallback = path.join(REPO_ROOT, moduleId, submoduleId, filename);
  for (const p of [primary, fallback]) {
    try { return await fs.readFile(p, "utf-8"); } catch { /* try next */ }
  }
  return null;
}
