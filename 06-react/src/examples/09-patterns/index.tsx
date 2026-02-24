import { useState } from "react";
import CompoundComponentsDemo from "./CompoundComponents";
import RenderPropsDemo from "./RenderProps";
import HOCDemo from "./HOC";

export default function Patterns() {
  const [tab, setTab] = useState<"compound" | "renderprop" | "hoc">("compound");

  return (
    <div className="example-page">
      <h1>09 · Patterns</h1>
      <p className="subtitle">Compound components, Render props, HOC, composition</p>

      <div className="btn-row">
        {(["compound", "renderprop", "hoc"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "compound"   && <CompoundComponentsDemo />}
      {tab === "renderprop" && <RenderPropsDemo />}
      {tab === "hoc"        && <HOCDemo />}
    </div>
  );
}
