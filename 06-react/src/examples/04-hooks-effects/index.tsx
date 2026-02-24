import { useState } from "react";
import EffectBasics from "./EffectBasics";
import EffectTraps from "./EffectTraps";
import EffectCleanup from "./EffectCleanup";

export default function HooksEffects() {
  const [tab, setTab] = useState<"basics" | "cleanup" | "traps">("basics");

  return (
    <div className="example-page">
      <h1>04 · useEffect</h1>
      <p className="subtitle">Deps array, cleanup, race conditions, распространённые ловушки</p>

      <div className="btn-row">
        {(["basics", "cleanup", "traps"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "basics"  && <EffectBasics />}
      {tab === "cleanup" && <EffectCleanup />}
      {tab === "traps"   && <EffectTraps />}
    </div>
  );
}
