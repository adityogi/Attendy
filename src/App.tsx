import { useEffect, useState } from "react";
import {
  SUBJECTS,
  TIMETABLE,
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayIST = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(),
  );
const weekday = (d: string) => new Date(d + "T12:00:00Z").getUTCDay();
const addDay = (d: string, n: number) => {
  const a = new Date(d + "T12:00:00Z");
  a.setUTCDate(a.getUTCDate() + n);
  return a.toISOString().slice(0, 10);
};
const nowMinutes = () => {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  return Number(p.slice(0, 2)) * 60 + Number(p.slice(3, 5));
};
const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

type Row = { code: string; attended: number; held: number };

export default function App() {
  const [tab, setTab] = useState("attendance");
  const [taps, setTaps] = useState<Tap[]>(loadTaps);
  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify(taps));
  }, [taps]);
  const rows: Row[] = SUBJECTS.map((s) => {
    const mine = taps.filter((t) => t.code === s.code);
    const base = totals(s);
    return {
      code: s.code,
      attended: base.attended + mine.filter((t) => t.attended).length,
      held: base.held + mine.length,
    };
  });

  const add = (code: string, attended: boolean) =>
    setTaps([...taps, { code, attended }]);
  const undo = (code: string) => {
    const i = taps.map((t) => t.code).lastIndexOf(code);
    if (i >= 0) setTaps(taps.filter((_, j) => j !== i));
  };

  return (
    <main>
      <h1>Attendy</h1>
      <p className="sub">Target {TARGET}% per subject</p>
      <nav className="tabs">
        {[
          ["attendance", "Attendance"],
          ["today", "Timetable"],
          ["leave", "Leave"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "on" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "today" && <Day />}
      {tab === "leave" && <Leave rows={rows} />}
      {tab === "attendance" &&
        SUBJECTS.map((s) => {
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

function Day() {
  const today = todayIST();
  const [day, setDay] = useState(weekday(today));
  const slots = TIMETABLE.filter((t) => t.day === day);
  const isToday = day === weekday(today);
  const now = nowMinutes();
  return (
    <>
      <div className="tabs days">
        {[1, 2, 3, 4, 5].map((d) => (
          <button
            key={d}
            className={day === d ? "on" : ""}
            onClick={() => setDay(d)}
          >
            {DAYS[d]}
          </button>
        ))}
      </div>
      <p className="sub">
        {isToday ? "Today" : DAYS[day]}
        {isToday && " · " + today}
      </p>
      {!slots.length && <section className="card">No classes today.</section>}
      {slots.map((t) => {
        const live = isToday && now >= mins(t.start) && now < mins(t.end);
        const done = isToday && now >= mins(t.end);
        return (
          <section
            key={t.start}
            className={"card slot" + (live ? " live" : "") + (done ? " done" : "")}
          >
            <div className="time">
              {t.start}
              <br />
              {t.end}
            </div>
            <div className="name">
              <strong>{t.title}</strong>
              <span>
                {t.code ? t.code + " · " : ""}
                {t.room}
              </span>
            </div>
            {live && <b className="badge">Now</b>}
          </section>
        );
      })}
    </>
  );
}

function Leave({ rows }: { rows: Row[] }) {
  const tomorrow = addDay(todayIST(), 1);
  const [from, setFrom] = useState(tomorrow);
  const [to, setTo] = useState(tomorrow);
  const valid = from <= to && addDay(from, 366) > to;
  const missed: Record<string, number> = {};
  let days = 0;
  if (valid)
    for (let d = from; d <= to; d = addDay(d, 1)) {
      const slots = TIMETABLE.filter((t) => t.day === weekday(d));
      if (slots.length) days++;
      for (const t of slots) if (t.code) missed[t.code] = (missed[t.code] ?? 0) + 1;
    }
  return (
    <>
      <section className="card">
        <strong>Plan a leave</strong>
        <div className="dates">
          <label>
            From
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                if (e.target.value > to) setTo(e.target.value);
              }}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        <small>
          {valid
            ? `${days} class ${days === 1 ? "day" : "days"} in this range. Missed classes are counted from the timetable; the rest of your attendance stays as it is now.`
            : "Pick a valid date range."}
        </small>
      </section>
      {SUBJECTS.map((s) => {
        const r = rows.find((x) => x.code === s.code)!;
        const m = missed[s.code] ?? 0;
        const now = percent(r.attended, r.held);
        const after = percent(r.attended, r.held + m);
        const low = after !== null && after + 1e-9 < TARGET;
        return (
          <section key={s.code} className="card">
            <div className="name">
              <strong>{s.code}</strong>
              <span>{s.title}</span>
            </div>
            <div className="row">
              <span className={"pct " + (low ? "low" : "ok")}>
                {after === null ? "—" : after.toFixed(1) + "%"}
              </span>
              <span className="count">
                now {now === null ? "—" : now.toFixed(1) + "%"} · skipping {m}
              </span>
            </div>
            <small className={low ? "low" : ""}>
              {after === null
                ? "No classes recorded yet"
                : low
                  ? `Below ${TARGET}% after this leave`
                  : `Safe. You could skip ${canMiss(r.attended, r.held)} classes in total and stay at ${TARGET}%`}
            </small>
          </section>
        );
      })}
    </>
  );
}
