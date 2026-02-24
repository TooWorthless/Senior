import { useState } from "react";
import MemoDemo from "./MemoDemo";
import ProfilerDemo from "./ProfilerDemo";
import ReRenderDetector from "./ReRenderDetector";

export default function Performance() {
  const [tab, setTab] = useState<"memo" | "profiler" | "detector">("memo");

  return (
    <div className="example-page">
      <h1>07 · Performance</h1>
      <p className="subtitle">React.memo, Profiler API, re-render детектор, code splitting</p>

      <div className="btn-row">
        {(["memo", "profiler", "detector"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "memo"     && <MemoDemo />}
      {tab === "profiler" && <ProfilerDemo />}
      {tab === "detector" && <ReRenderDetector />}
    </div>
  );
}
