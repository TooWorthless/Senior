import { useState, useRef } from "react";
import UseStateDeep from "./UseStateDeep";
import UseRefDeep from "./UseRefDeep";
import BatchingDemo from "./BatchingDemo";

export default function HooksState() {
  const [tab, setTab] = useState<"state" | "ref" | "batching">("state");

  return (
    <div className="example-page">
      <h1>03 · useState & useRef</h1>
      <p className="subtitle">State shape, functional updates, batching, ref vs state</p>

      <div className="btn-row">
        {(["state", "ref", "batching"] as const).map(t => (
          <button key={t} className={`btn${tab === t ? "" : " ghost"}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "state"    && <UseStateDeep />}
      {tab === "ref"      && <UseRefDeep />}
      {tab === "batching" && <BatchingDemo />}
    </div>
  );
}
