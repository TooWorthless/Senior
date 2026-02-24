export interface ExampleFile {
  name: string;       // "closures.js"
  extension: string;  // "js" | "html" | "css"
  label: string;      // "closures" (без расширения)
}

export interface SubmoduleInfo {
  id: string;         // "03-functions"
  title: string;      // "Functions" (из README первого заголовка)
  moduleId: string;   // "03-javascript"
  hasReadme: boolean;
  examples: ExampleFile[];
}

export interface ModuleInfo {
  id: string;          // "03-javascript"
  title: string;       // "JavaScript"
  icon: string;        // "⚡"
  description: string; // "Типы, scope, Event Loop, алгоритмы"
  submodules: SubmoduleInfo[];
}
