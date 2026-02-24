import { useState } from "react";
import UseReducerDemo from "./UseReducerDemo";
import UseMemoCallbackDemo from "./UseMemoCallbackDemo";
import OtherHooks from "./OtherHooks";

export default function HooksAdvanced() {
  const [tab, setTab] = useState<"reducer" | "memo" | "other">("reducer");

  return (
    <div className="example-page">
      <h1>05 · useReducer & useMemo</h1>
      <p className="subtitle">useReducer, useMemo, useCallback, useLayoutEffect, useId</p>

      <div className="btn-row">
        {(["reducer", "memo", "other"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "reducer" && <UseReducerDemo />}
      {tab === "memo"    && <UseMemoCallbackDemo />}
      {tab === "other"   && <OtherHooks />}
    </div>
  );
}
