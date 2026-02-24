import { useState, useEffect, useRef } from "react";

export default function EffectCleanup() {
  const [show, setShow] = useState(true);

  return (
    <section>
      <h2>Cleanup — предотвращение утечек</h2>

      <div className="card">
        <h3>Race condition при fetch</h3>
        <div className="code-block">{`// ❌ Race condition: быстро меняешь userId → ответы приходят в другом порядке
useEffect(() => {
  fetch(\`/api/user/\${userId}\`).then(r => r.json()).then(setUser);
}, [userId]);
// userId: 1 → запрос 1 (200ms)
// userId: 2 → запрос 2 (50ms)
// ответ 2 приходит первым → setUser(user2)
// ответ 1 приходит → setUser(user1) ← БАГИ

// ✅ Решение 1: флаг ignore
useEffect(() => {
  let ignore = false;
  fetch(\`/api/user/\${userId}\`)
    .then(r => r.json())
    .then(data => {
      if (!ignore) setUser(data); // отмена устаревшего
    });
  return () => { ignore = true; }; // cleanup — следующий эффект запустится
}, [userId]);

// ✅ Решение 2: AbortController (более современное)
useEffect(() => {
  const controller = new AbortController();
  fetch(\`/api/user/\${userId}\`, { signal: controller.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(e => { if (e.name !== "AbortError") setError(e); });
  return () => controller.abort();
}, [userId]);`}</div>
        <RaceConditionDemo />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Cleanup примеры</h3>
        <div className="code-block">{`// 1. EventListener
useEffect(() => {
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}, []);

// 2. Interval / Timeout
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);

// 3. WebSocket / subscription
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handler;
  return () => ws.close();
}, [url]);

// 4. IntersectionObserver
useEffect(() => {
  const observer = new IntersectionObserver(callback);
  observer.observe(ref.current);
  return () => observer.disconnect();
}, []);`}</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="btn ghost" style={{ marginBottom: 12 }}
          onClick={() => setShow(v => !v)}>
          {show ? "Unmount компонент" : "Mount компонент"}
        </button>
        {show && <SubscriptionDemo />}
      </div>
    </section>
  );
}

// Race condition demo
function RaceConditionDemo() {
  const [userId, setUserId] = useState(1);
  const [userBad, setUserBad] = useState<string>("—");
  const [userGood, setUserGood] = useState<string>("—");

  const fakeDelay = (id: number) =>
    new Promise<string>(resolve =>
      setTimeout(() => resolve(`User #${id} data`), id === 1 ? 800 : 100)
    );

  // ❌ Без cleanup — race condition
  useEffect(() => {
    let active = true;
    fakeDelay(userId).then(data => {
      setUserBad(data); // нет защиты от stale response
    });
    return () => { active = false; void active; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ✅ С cleanup флагом
  useEffect(() => {
    let ignore = false;
    setUserGood("loading...");
    fakeDelay(userId).then(data => {
      if (!ignore) setUserGood(data);
    });
    return () => { ignore = true; };
  }, [userId]);

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 8 }}>
        Нажимай быстро 1 → 2 → 1 → увидишь race condition в "Bad":
      </p>
      <div className="btn-row">
        <button className={`btn${userId === 1 ? "" : " ghost"}`} style={{ fontSize: 12 }}
          onClick={() => setUserId(1)}>User 1 (slow 800ms)</button>
        <button className={`btn${userId === 2 ? "" : " ghost"}`} style={{ fontSize: 12 }}
          onClick={() => setUserId(2)}>User 2 (fast 100ms)</button>
      </div>
      <div className="grid2" style={{ marginTop: 8 }}>
        <div style={{ background: "#3d0f0f", padding: 10, borderRadius: 6, fontSize: 12 }}>
          <div style={{ color: "var(--red)" }}>❌ Without cleanup</div>
          <div>{userBad}</div>
        </div>
        <div style={{ background: "#1a4731", padding: 10, borderRadius: 6, fontSize: 12 }}>
          <div style={{ color: "var(--green)" }}>✅ With ignore flag</div>
          <div>{userGood}</div>
        </div>
      </div>
    </div>
  );
}

// Subscription demo
function SubscriptionDemo() {
  const [events, setEvents] = useState<string[]>([]);
  const addEvent = (msg: string) => setEvents(prev => [msg, ...prev.slice(0, 9)]);

  useEffect(() => {
    const ts = new Date().toISOString().slice(11, 19);
    addEvent(`[${ts}] ✅ Subscribed (mount)`);

    const handler = () => {
      const t = new Date().toISOString().slice(11, 19);
      setEvents(prev => [`[${t}] resize: ${window.innerWidth}×${window.innerHeight}`, ...prev.slice(0, 9)]);
    };
    window.addEventListener("resize", handler);

    return () => {
      const t = new Date().toISOString().slice(11, 19);
      addEvent(`[${t}] 🔴 Unsubscribed (cleanup)`);
      window.removeEventListener("resize", handler);
    };
  }, []);

  return (
    <div className="card">
      <h3>Subscription с cleanup (resize listener)</h3>
      <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 8 }}>
        Измени размер окна — увидишь события. Unmount — увидишь cleanup.
      </p>
      <div className="log-box">
        {events.map((e, i) => (
          <div key={i} className={`log-entry ${
            e.includes("✅") ? "ok" : e.includes("🔴") ? "err" : "info"
          }`}>{e}</div>
        ))}
      </div>
    </div>
  );
}
