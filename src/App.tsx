import { useEffect, useState } from "react";
import {
  SUBJECTS,
  TARGET,
  canMiss,
  needToAttend,
  percent,
  totals,
} from "./data";

type Tap = { code: string; attended: boolean };
const STORE = "attendy-taps";

function loadTaps(): Tap[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [taps, setTaps] = useState<Tap[]>(loadTaps);
  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify(taps));
  }, [taps]);

  const add = (code: string, attended: boolean) =>
    setTaps([...taps, { code, attended }]);
  const undo = (code: string) => {
    const i = taps.map((t) => t.code).lastIndexOf(code);
    if (i >= 0) setTaps(taps.filter((_, j) => j !== i));
  };

  return (
    <main>
      <h1>Attendy</h1>
      <p className="sub">
        Attendance as of 30 Oct 2026 · target {TARGET}% per subject
      </p>
      {SUBJECTS.map((s) => {
        const mine = taps.filter((t) => t.code === s.code);
        const base = totals(s);
        const attended = base.attended + mine.filter((t) => t.attended).length;
        const held = base.held + mine.length;
        const pct = percent(attended, held);
        const low = pct !== null && pct + 1e-9 < TARGET;
        return (
          <section key={s.code} className="card">
            <div className="name">
              <strong>{s.code}</strong>
              <span>{s.title}</span>
            </div>
            <div className="row">
              <span className={"pct " + (low ? "low" : "ok")}>
                {pct === null ? "—" : pct.toFixed(1) + "%"}
              </span>
              <span className="count">
                {attended} / {held} classes
              </span>
            </div>
            <div className="bar">
              <i
                className={low ? "low" : "ok"}
                style={{ width: (pct ?? 0) + "%" }}
              />
              <b style={{ left: TARGET + "%" }} />
            </div>
            <small className={low ? "low" : ""}>
              {pct === null
                ? "No classes yet"
                : low
                  ? `Attend the next ${needToAttend(attended, held)} classes to reach ${TARGET}%`
                  : `Can miss ${canMiss(attended, held)} more at ${TARGET}%`}
            </small>
            <div className="actions">
              <button onClick={() => add(s.code, true)}>+ Attended</button>
              <button onClick={() => add(s.code, false)}>+ Missed</button>
              <button onClick={() => undo(s.code)} disabled={!mine.length}>
                Undo
              </button>
            </div>
          </section>
        );
      })}
    </main>
  );
}
