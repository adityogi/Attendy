import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  LockKeyhole,
  Palmtree,
  ChartNoAxesCombined,
} from "lucide-react";
import { State, Status, slotsOn, key, addDays, START } from "./domain";
export const COLORS = [
  "#7765d8",
  "#3886a1",
  "#c17a37",
  "#cc678c",
  "#5d9278",
  "#687cab",
];
export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const format = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Date(date + "T12:00:00").toLocaleDateString("en-IN", options);
export function subjectColor(s: string) {
  let n = 0;
  for (const c of s) n += c.charCodeAt(0);
  return COLORS[n % COLORS.length];
}
export default function Calendar({
  s,
  date,
  setDate,
  now,
  planning = false,
  onMark,
  onLeave,
  onPlan,
}: {
  s: State;
  date: string;
  setDate: (s: string) => void;
  now: string;
  planning?: boolean;
  onMark: (id: string, status: Status | null) => void;
  onLeave: (date: string, id?: string) => void;
  onPlan: () => void;
}) {
  const [view, setView] = useState("month");
  const classes = slotsOn(s, date),
    holiday = s.holidays.find((h) => h.date === date);
  function move(n: number) {
    const d = new Date(date + "T12:00:00");
    if (view === "day") {
      setDate(addDays(date, n));
      return;
    }
    d.setDate(1);
    if (view === "year") d.setFullYear(d.getFullYear() + n);
    else d.setMonth(d.getMonth() + n);
    setDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
    );
  }
  function monthDays(month: string) {
    const first = month + "-01";
    const start = addDays(first, -new Date(first + "T12:00:00Z").getUTCDay());
    const last = new Date(
      Number(month.slice(0, 4)),
      Number(month.slice(5)),
      0,
    ).getDate();
    const count =
      Math.ceil((new Date(first + "T12:00:00Z").getUTCDay() + last) / 7) * 7;
    return Array.from({ length: count }, (_, i) => addDays(start, i));
  }
  const dayContent = (
    <>
      <span className="tiny-label">
        {planning ? "PLAN YOUR TIME AWAY" : "YOUR DAY"}
      </span>
      <h2>
        {format(date, { weekday: "long", day: "numeric", month: "short" })}
      </h2>
      <p className="subtle">
        {holiday ? holiday.name : classes.length + " scheduled classes"}
      </p>
      {planning && date > now && classes.length > 0 && (
        <button
          className={
            s.leaveDays.includes(date) ? "leave-selected full" : "full"
          }
          onClick={() => onLeave(date)}
        >
          {s.leaveDays.includes(date)
            ? "Undo full day off"
            : "Plan a full day off"}
        </button>
      )}
      {!planning && date !== now && (
        <div className="locked">
          <LockKeyhole size={15} />
          {date > now
            ? "Future attendance is locked."
            : "Past attendance is read-only."}
        </div>
      )}
      {planning && date <= now && (
        <div className="locked">
          <LockKeyhole size={15} />
          Plan leave from tomorrow onward.
        </div>
      )}
      {classes.map((slot) => {
        const status = s.records[key(date, slot.id)]?.status;
        const leave =
          s.leaveDays.includes(date) ||
          s.leaveSlots.includes(key(date, slot.id));
        return (
          <div
            className="class-card"
            key={slot.id}
            style={{ borderLeftColor: subjectColor(slot.subject) }}
          >
            <small>
              {slot.start} – {slot.end}
            </small>
            <h3>{slot.subject}</h3>
            <p>{slot.room || "Scheduled class"}</p>
            {planning ? (
              <button
                className={"full " + (leave ? "leave-selected" : "")}
                disabled={date <= now || s.leaveDays.includes(date)}
                onClick={() => onLeave(date, slot.id)}
              >
                {date <= now
                  ? (status ?? "Not marked")
                  : leave
                    ? "Planned absence · undo"
                    : "Will attend · plan absence"}
              </button>
            ) : (
              <>
                <div className="mark-buttons">
                  {(["present", "absent"] as const).map((st) => (
                    <button
                      aria-label={`Mark ${slot.subject} ${st}`}
                      aria-pressed={status === st}
                      disabled={date !== now || date < START}
                      className={status === st ? "is-" + st : ""}
                      key={st}
                      onClick={() => onMark(slot.id, status === st ? null : st)}
                    >
                      {st === "present" ? <Check size={15} /> : <X size={15} />}{" "}
                      {st}
                    </button>
                  ))}
                </div>
                <button
                  className="cancel-button"
                  disabled={date !== now || date < START}
                  onClick={() =>
                    onMark(slot.id, status === "cancelled" ? null : "cancelled")
                  }
                >
                  {status === "cancelled"
                    ? "Class cancelled · undo"
                    : "Class was cancelled"}
                </button>
              </>
            )}
          </div>
        );
      })}
      {!classes.length && (
        <div className="empty">
          <Palmtree />
          <h3>
            {holiday
              ? "A well-earned break."
              : date < START
                ? "Before your fresh start."
                : "A little breathing room."}
          </h3>
          <p>
            {holiday
              ? "Holiday classes are excluded from attendance."
              : date < START
                ? "Tracking begins on 29 September 2026."
                : "No classes on this day."}
          </p>
        </div>
      )}
      {!planning && (
        <button className="day-tip" onClick={onPlan}>
          <ChartNoAxesCombined size={20} />
          <span>
            Thinking of taking a day off?<strong>Try the leave planner</strong>
          </span>
        </button>
      )}
    </>
  );
  return (
    <div className={"calendar-layout " + (view === "day" ? "day-view" : "")}>
      <section className="panel">
        <div className="calendar-toolbar">
          <div>
            <h2>
              {view === "year"
                ? date.slice(0, 4)
                : format(date, { month: "long", year: "numeric" })}
            </h2>
            <span className="subtle">
              {planning
                ? "What if you took a little time off?"
                : "Your month at a glance"}
            </span>
          </div>
          <div className="segmented" aria-label="Calendar view">
            {["day", "month", "year"].map((v) => (
              <button
                key={v}
                aria-pressed={v === view}
                className={v === view ? "selected" : ""}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="calendar-controls">
          <button className="text-button" onClick={() => setDate(now)}>
            Today
          </button>
          <div>
            <button
              className="icon-button"
              aria-label={`Previous ${view}`}
              onClick={() => move(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="icon-button"
              aria-label={`Next ${view}`}
              onClick={() => move(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        {view === "day" ? (
          <div className="day-panel day-inline">{dayContent}</div>
        ) : view === "year" ? (
          <div className="year-grid">
            {Array.from({ length: 12 }, (_, i) => {
              const m = date.slice(0, 4) + "-" + String(i + 1).padStart(2, "0");
              return (
                <button
                  key={m}
                  className="mini-month"
                  onClick={() => {
                    setDate(m + "-01");
                    setView("month");
                  }}
                >
                  <h3>{format(m + "-01", { month: "long" })}</h3>
                  <div>
                    {DAYS.map((d) => (
                      <b key={d}>{d[0]}</b>
                    ))}
                    {monthDays(m).map((d) => (
                      <span
                        key={d}
                        className={`${d.slice(0, 7) !== m ? "off-month" : ""} ${d === now ? "mini-today" : ""} ${s.holidays.some((h) => h.date === d) ? "mini-holiday" : ""} ${planning && s.leaveDays.includes(d) ? "mini-leave" : ""}`}
                      >
                        {Number(d.slice(-2))}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="weekdays">
              {DAYS.map((d) => (
                <span key={d}>{d.slice(0, 3)}</span>
              ))}
            </div>
            <div className="month-grid">
              {monthDays(date.slice(0, 7)).map((d) => {
                const holiday = s.holidays.find((h) => h.date === d);
                return (
                  <button
                    key={d}
                    aria-label={
                      format(d, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }) + (holiday ? " · " + holiday.name : "")
                    }
                    aria-pressed={d === date}
                    onClick={() => setDate(d)}
                    className={`day-cell ${d === date ? "chosen" : ""} ${d.slice(0, 7) !== date.slice(0, 7) ? "muted" : ""} ${planning && s.leaveDays.includes(d) ? "planned-day" : ""}`}
                  >
                    <span className={d === now ? "today-number" : ""}>
                      {Number(d.slice(-2))}
                    </span>
                    {holiday ? (
                      <i className="holiday-chip">{holiday.name}</i>
                    ) : (
                      slotsOn(s, d)
                        .slice(0, 3)
                        .map((c) => {
                          const r = s.records[key(d, c.id)]?.status,
                            leave =
                              planning &&
                              (s.leaveDays.includes(d) ||
                                s.leaveSlots.includes(key(d, c.id)));
                          return (
                            <i
                              key={c.id}
                              className={r ?? ""}
                              style={{
                                background: leave
                                  ? "#f6e7de"
                                  : subjectColor(c.subject) + "16",
                                color: leave
                                  ? "#b77b55"
                                  : subjectColor(c.subject),
                              }}
                            >
                              {r === "present"
                                ? "✓ "
                                : r === "absent"
                                  ? "× "
                                  : r === "cancelled"
                                    ? "− "
                                    : leave
                                      ? "− "
                                      : ""}
                              {c.subject}
                            </i>
                          );
                        })
                    )}
                    {slotsOn(s, d).length > 3 && (
                      <small className="more-classes">
                        +{slotsOn(s, d).length - 3} more
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="legend">
              <span>
                <b style={{ background: "#398469" }} />
                Present
              </span>
              <span>
                <b style={{ background: "#c76b64" }} />
                {planning ? "Planned absence" : "Absent"}
              </span>
              <span>
                <b style={{ background: "#b4b8c0" }} />
                Not marked
              </span>
              <span className="subtle">
                {planning
                  ? "Plans never change actual attendance"
                  : "Future attendance is locked"}
              </span>
            </div>
          </>
        )}
      </section>
      {view !== "day" && (
        <section className="panel day-panel">{dayContent}</section>
      )}
    </div>
  );
}
