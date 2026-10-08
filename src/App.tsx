import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChartNoAxesCombined,
  BookOpen,
  Palmtree,
  Download,
  Check,
  Plus,
  Cloud,
  LogOut,
  SlidersHorizontal,
  Info,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import {
  today,
  START,
  emptyState,
  slotsOn,
  mark,
  statistics,
  State,
  key,
  addDays,
  dates,
  Stat,
  autoHealState,
} from "./domain";
import Calendar, { format, subjectColor } from "./Calendar";
import { Modal, Timetable, Holidays, DataTools } from "./Editors";
import Account from "./Account";
import { useStore } from "./useStore";
import { download } from "./io";
export function demoState(): State {
  const s = emptyState();
  s.versions = [
    {
      id: "sample",
      effective: START,
      slots: [1, 2, 3, 4, 5].flatMap((day) =>
        ["Mathematics", "Physics", "Computer Science"].map((subject, i) => ({
          id: `sample-${day}-${i}`,
          subject,
          day,
          start: ["09:00", "10:30", "13:30"][i],
          end: ["10:00", "11:30", "14:30"][i],
          room: ["Room 204", "Lab 02", "Room 301"][i],
        })),
      ),
    },
  ];
  return s;
}
const NAV = [
  { id: "attendance", icon: CalendarDays, label: "Attendance" },
  { id: "planner", icon: ChartNoAxesCombined, label: "Leave planner" },
  { id: "timetable", icon: BookOpen, label: "Timetable" },
  { id: "holidays", icon: Palmtree, label: "Holidays" },
  { id: "data", icon: Download, label: "Import & export" },
];
export default function App() {
  const store = useStore(demoState),
    s = autoHealState(store.state),
    now = store.clock;
  const [tab, setTab] = useState("attendance"),
    [date, setDate] = useState(today()),
    [planDate, setPlanDate] = useState(addDays(today(), 1)),
    [from, setFrom] = useState(START),
    [to, setTo] = useState(() => {
      const d = new Date(today() + "T12:00:00");
      d.setMonth(d.getMonth() + 2, 0);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }),
    [leaveFrom, setLeaveFrom] = useState(addDays(today(), 1)),
    [leaveTo, setLeaveTo] = useState(addDays(today(), 1)),
    [auth, setAuth] = useState(false),
    [recovery, setRecovery] = useState(""),
    [toast, setToast] = useState(""),
    [confirm, setConfirm] = useState(""),
    [targetOpen, setTargetOpen] = useState(false),
    [install, setInstall] = useState<any>(null);
  const notify = (x: string) => setToast(x);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const fn = (e: Event) => {
      e.preventDefault();
      setInstall(e);
    };
    window.addEventListener("beforeinstallprompt", fn);
    return () => window.removeEventListener("beforeinstallprompt", fn);
  }, []);
  useEffect(() => {
    if (JSON.stringify(s) !== JSON.stringify(store.state)) {
      try {
        store.update(s);
      } catch {}
    }
  }, [s, store]);
  const save = (v: State, mode = "edit") => {
    try {
      store.update(v, mode);
    } catch (e: any) {
      notify(e.message);
    }
  };
  const actual = statistics(s, START, now < START ? START : now, false, now);
  let projected: Stat[] = [],
    rangeError = "";
  try {
    if (to <= now) throw Error("Choose an end date after today.");
    projected = statistics(s, from, to, true, now);
  } catch (e: any) {
    rangeError = e.message;
  }
  const planning = tab === "planner";
  const rows = planning ? projected : actual;
  const target = planning ? s.planTarget : s.actualTarget;
  const incomplete = rows.reduce((a, b) => a + b.pending, 0);
  const atRisk = rows.filter(
    (r) => r.percent !== null && r.percent + 1e-9 < target,
  ).length;
  const countToday = slotsOn(s, now).length,
    markedToday = slotsOn(s, now).filter(
      (x) => s.records[key(now, x.id)],
    ).length;
  const onLeave = (d: string, id?: string) => {
    try {
      if (d <= now) throw Error("Plan leave from tomorrow onward.");
      if (id) {
        const k = key(d, id);
        save({
          ...s,
          leaveSlots: s.leaveSlots.includes(k)
            ? s.leaveSlots.filter((x) => x !== k)
            : [...s.leaveSlots, k],
        });
      } else
        save({
          ...s,
          leaveDays: s.leaveDays.includes(d)
            ? s.leaveDays.filter((x) => x !== d)
            : [...s.leaveDays, d],
        });
    } catch (e: any) {
      notify(e.message);
    }
  };
  useEffect(() => {
    const ctx = (document as any).modelContext;
    if (!ctx?.registerTool) return;
    const abort = new AbortController();
    Promise.resolve(
      ctx.registerTool(
        {
          name: "read_attendance_summary",
          title: "Read per-subject attendance",
          description:
            "Read recorded per-subject attendance through today. Does not include planned leave or change any records.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: (input: any) => {
            if (!input || Object.keys(input).length)
              throw Error("No parameters are accepted.");
            return {
              asOf: now,
              start: START,
              demo: !store.session,
              subjects: actual,
            };
          },
        },
        { signal: abort.signal },
      ),
    ).catch(() => {});
    return () => abort.abort();
  }, [s, now, store.session]);
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("attendance");
          }}
          className="brand"
        >
          <span className="brandmark">
            <Check />
          </span>
          attendly<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <div className="avatar">
            {store.session?.username[0].toUpperCase() ?? "Y"}
          </div>
          <div>
            <strong>{store.session?.username ?? "Your semester"}</strong>
            <small>One class at a time.</small>
          </div>
        </div>
        <span className="nav-label">YOUR WORKSPACE</span>
        <nav>
          {NAV.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setTargetOpen(false);
              }}
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "active" : ""}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-label">A LITTLE EVERY DAY</span>
          <p>
            Make room for life.
            <br />
            Keep your attendance on track.
          </p>
          <div className="mini-lines">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="sync">
          <Cloud size={17} />
          <span>{store.status}</span>
        </div>
      </aside>
      <main>
        <header>
          <span>YOUR ATTENDANCE, IN FOCUS</span>
          <div className="header-date">
            {format(now, { day: "numeric", month: "long", year: "numeric" })}
            <span className="timezone">IST</span>
            {store.session ? (
              <button
                className="icon-button"
                aria-label="Sign out"
                onClick={() => setConfirm("logout")}
              >
                <LogOut size={16} />
              </button>
            ) : (
              <button className="text-button" onClick={() => setAuth(true)}>
                Sign in
              </button>
            )}
            {install && (
              <button
                className="icon-button"
                aria-label="Install Attendly"
                onClick={async () => {
                  await install.prompt();
                  setInstall(null);
                }}
              >
                <Smartphone size={19} />
              </button>
            )}
          </div>
        </header>
        <div className="page-heading">
          <div>
            <h1>
              {
                (
                  {
                    attendance: "A little every day.",
                    planner: "Make room for life.",
                    timetable: "Your week, in order.",
                    holidays: "Take a proper break.",
                    data: "Every class, accounted for.",
                  } as Record<string, string>
                )[tab]
              }
            </h1>
            <p>
              {
                (
                  {
                    attendance:
                      "Your classes, your progress. All in one place.",
                    planner: "See the impact before you take a day off.",
                    timetable: "A schedule that grows with your semester.",
                    holidays: "The days your college takes off, too.",
                    data: "Back it up. Bring it over. Keep it yours.",
                  } as Record<string, string>
                )[tab]
              }
            </p>
          </div>
          {tab === "attendance" && (
            <button className="primary" onClick={() => setTab("timetable")}>
              <Plus size={17} />
              Add timetable
            </button>
          )}
          {planning && (
            <span className="plan-badge">
              <ChartNoAxesCombined size={16} />
              Forecast workspace
            </span>
          )}
        </div>
        {!store.session && (
          <div className="notice demo-notice">
            <span>
              <strong>Sample workspace.</strong> Explore freely. These classes
              aren’t your real attendance.
            </span>
            <button onClick={() => setAuth(true)}>Create your account</button>
          </div>
        )}
        {store.error && (
          <div className="notice sync-error" role="alert">
            <span>{store.error} Your local changes are preserved.</span>
            <div>
              <button onClick={store.retry}>Retry sync</button>
              <button onClick={() => setAuth(true)}>Sign in again</button>
              <button
                onClick={() =>
                  download(
                    `attendly-unsynced-${now}.json`,
                    JSON.stringify(s, null, 2),
                  )
                }
              >
                Export local copy
              </button>
              <button onClick={() => setConfirm("cloud")}>
                Load cloud copy
              </button>
            </div>
          </div>
        )}
        {!store.ready && <div className="notice">Loading your account…</div>}
        {(tab === "attendance" || planning) && (
          <>
            <div className="overview">
              <div className="overview-main">
                <span className="tiny-label">
                  {planning ? "YOUR FORECAST" : "TODAY’S LINEUP"}
                </span>
                <div>
                  <strong>{planning ? atRisk : countToday}</strong>
                  <span>
                    {planning ? "subjects below target" : "classes scheduled"}
                    <br />
                    <small>
                      {planning
                        ? "With your planned time off."
                        : `${markedToday} marked · ${countToday - markedToday} to go`}
                    </small>
                  </span>
                  <div className="decor-calendar">
                    {planning ? (
                      <ChartNoAxesCombined size={42} />
                    ) : (
                      <CalendarDays size={42} />
                    )}
                  </div>
                </div>
              </div>
              <button
                className="metric metric-button"
                aria-expanded={targetOpen}
                onClick={() => setTargetOpen(!targetOpen)}
              >
                <span>
                  {planning ? "Planning target" : "Attendance target"}
                  <SlidersHorizontal size={14} />
                </span>
                <strong>
                  {target}
                  <span>%</span>
                </strong>
                <small>For every subject · adjust target</small>
              </button>
              <div className="metric">
                <span>{planning ? "Forecast through" : "Tracking since"}</span>
                <strong className="date-metric">
                  {format(planning && to ? to : START, {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  <span>{(planning && to ? to : START).slice(0, 4)}</span>
                </strong>
                <small>
                  {planning
                    ? "Assumes you attend other future classes"
                    : "Current through today · India time"}
                </small>
              </div>
            </div>
            {targetOpen && (
              <section className="panel target-panel">
                <label htmlFor="target">
                  {planning ? "Planning" : "Actual attendance"} target{" "}
                  <strong>{target}%</strong>
                </label>
                <input
                  id="target"
                  type="range"
                  min="1"
                  max="100"
                  value={target}
                  onChange={(e) =>
                    save({
                      ...s,
                      [planning ? "planTarget" : "actualTarget"]: Number(
                        e.target.value,
                      ),
                    })
                  }
                />
                <p className="subtle">
                  This target is independent of the{" "}
                  {planning ? "attendance tracker" : "leave planner"}. Every
                  subject is assessed separately.
                </p>
              </section>
            )}
            {planning && (
              <>
                <section className="panel planner-controls">
                  <div>
                    <span className="tiny-label">PREDICTION WINDOW</span>
                    <div className="form-pair">
                      <label>
                        From
                        <input
                          type="date"
                          value={from}
                          min={START}
                          max={to}
                          onChange={(e) => setFrom(e.target.value)}
                        />
                      </label>
                      <label>
                        Through
                        <input
                          type="date"
                          value={to}
                          min={addDays(now, 1)}
                          onChange={(e) => setTo(e.target.value)}
                        />
                      </label>
                    </div>
                    <p className="subtle">
                      Includes recorded classes in this window. Future classes
                      are assumed present, except your planned absences and
                      holidays.
                    </p>
                  </div>
                  <div>
                    <span className="tiny-label">PLAN A BREAK</span>
                    <div className="form-pair">
                      <label>
                        First day off
                        <input
                          type="date"
                          min={addDays(now, 1)}
                          value={leaveFrom}
                          onChange={(e) => {
                            setLeaveFrom(e.target.value);
                            if (e.target.value > leaveTo)
                              setLeaveTo(e.target.value);
                          }}
                        />
                      </label>
                      <label>
                        Last day off
                        <input
                          type="date"
                          min={leaveFrom}
                          value={leaveTo}
                          onChange={(e) => setLeaveTo(e.target.value)}
                        />
                      </label>
                    </div>
                    <button
                      onClick={() => {
                        try {
                          if (leaveFrom <= now)
                            throw Error("Leave must start after today.");
                          const ds = dates(leaveFrom, leaveTo).filter(
                            (d) => slotsOn(s, d).length,
                          );
                          save({
                            ...s,
                            leaveDays: [...new Set([...s.leaveDays, ...ds])],
                          });
                          setPlanDate(leaveFrom);
                          notify(`${ds.length} class days added to your plan.`);
                        } catch (e: any) {
                          notify(e.message);
                        }
                      }}
                    >
                      <Plus size={16} />
                      Add days off
                    </button>
                    <button
                      className="link-button"
                      onClick={() => setConfirm("clear-plan")}
                    >
                      Clear plan
                    </button>
                  </div>
                </section>
                {rangeError && (
                  <p className="error-text" role="alert">
                    {rangeError}
                  </p>
                )}
                <div className="notice plan-notice">
                  <Info size={17} />
                  <span>
                    Planning is separate. Nothing here marks you absent in your
                    actual attendance.
                  </span>
                </div>
                {(s.leaveDays.length > 0 || s.leaveSlots.length > 0) && (
                  <div className="leave-chips">
                    {s.leaveDays
                      .filter((d) => d > now)
                      .sort()
                      .map((d) => (
                        <button
                          key={d}
                          onClick={() => onLeave(d)}
                          aria-label={`Remove planned leave ${d}`}
                        >
                          {format(d, { day: "numeric", month: "short" })} · full
                          day ×
                        </button>
                      ))}
                    {s.leaveSlots
                      .filter((k) => k.split("|")[0] > now)
                      .sort()
                      .map((k) => (
                        <button
                          key={k}
                          onClick={() =>
                            onLeave(k.split("|")[0], k.split("|")[1])
                          }
                        >
                          {format(k.split("|")[0], {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          ·{" "}
                          {s.versions
                            .flatMap((v) => v.slots)
                            .find((x) => x.id === k.split("|")[1])?.subject ??
                            "Class"}{" "}
                          ×
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
            {planning && (
              <SubjectCards
                rows={projected}
                target={s.planTarget}
                planning
                pending={incomplete}
              />
            )}
            <Calendar
              s={s}
              date={planning ? planDate : date}
              setDate={planning ? setPlanDate : setDate}
              now={now}
              planning={planning}
              onMark={(id, status) => {
                try {
                  save(mark(s, date, id, status, now));
                } catch (e: any) {
                  notify(e.message);
                }
              }}
              onLeave={onLeave}
              onPlan={() => setTab("planner")}
            />
            {!planning && (
              <SubjectCards
                rows={actual}
                target={s.actualTarget}
                pending={incomplete}
              />
            )}
          </>
        )}
        {tab === "timetable" && (
          <Timetable s={s} onSave={save} notify={notify} />
        )}{" "}
        {tab === "holidays" && <Holidays s={s} onSave={save} notify={notify} />}{" "}
        {tab === "data" && <DataTools s={s} onSave={save} notify={notify} />}
        <footer>
          Built around your time.
          <span>Attendance and planning, kept separate.</span>
        </footer>
      </main>
      {auth && (
        <Modal title="Your Attendly account" onClose={() => setAuth(false)}>
          <Account
            onClose={() => setAuth(false)}
            onLogin={(data) => {
              store.login(data);
              setAuth(false);
              setTab("attendance");
              setDate(now);
              if (data.recoveryCode) setRecovery(data.recoveryCode);
            }}
          />
        </Modal>
      )}
      {recovery && (
        <Modal title="Save your recovery code" onClose={() => setRecovery("")}>
          <p>
            This code resets your password if you forget it. Keep it somewhere
            private; it won’t be shown again.
          </p>
          <code className="recovery-code">{recovery}</code>
          <div className="modal-actions">
            <button
              onClick={() =>
                download(
                  "attendly-recovery.txt",
                  `Attendly account: ${store.session?.username}\nRecovery code: ${recovery}\nKeep this file private.\n`,
                  "text/plain",
                )
              }
            >
              Download recovery code
            </button>
            <button className="primary" onClick={() => setRecovery("")}>
              I’ve saved it
            </button>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={
            confirm === "logout"
              ? "Sign out?"
              : confirm === "cloud"
                ? "Load the cloud copy?"
                : "Clear planned leave?"
          }
          onClose={() => setConfirm("")}
        >
          <p>
            {confirm === "logout"
              ? "Your synced records stay in your account. The cached copy on this device will be removed."
              : confirm === "cloud"
                ? "This replaces the local workspace with the server copy. Export any unsynced work first."
                : "Remove all planned days and classes off. Your actual attendance will stay as it is."}
          </p>
          {confirm === "cloud" && (
            <button
              onClick={() =>
                download(
                  `attendly-local-${now}.json`,
                  JSON.stringify(s, null, 2),
                )
              }
            >
              Export local copy
            </button>
          )}
          <div className="modal-actions">
            <button onClick={() => setConfirm("")}>Cancel</button>
            <button
              className="primary"
              onClick={async () => {
                try {
                  if (confirm === "logout") await store.logout();
                  else if (confirm === "cloud") await store.refresh(true);
                  else save({ ...s, leaveDays: [], leaveSlots: [] });
                  setConfirm("");
                } catch (e: any) {
                  notify(e.message);
                }
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
function SubjectCards({
  rows,
  target,
  planning = false,
  pending,
}: {
  rows: Stat[];
  target: number;
  planning?: boolean;
  pending: number;
}) {
  return (
    <section className={"subjects " + (planning ? "forecast-subjects" : "")}>
      <h2>
        {planning
          ? "The forecast, subject by subject."
          : "Every subject matters."}
      </h2>
      <p className="subtle">
        {planning
          ? "Your selected window, with planned leave included."
          : "Your target applies to each class, never an overall average."}
      </p>
      {pending > 0 && (
        <div className="notice pending-notice">
          {pending} past or present {pending === 1 ? "class is" : "classes are"}{" "}
          unmarked and excluded from percentages. Results are provisional until
          your history is complete.
        </div>
      )}
      {!rows.length ? (
        <div className="panel empty">
          <BookOpen />
          <h3>No classes in this window yet.</h3>
          <p>Add your timetable to start seeing per-subject attendance.</p>
        </div>
      ) : (
        <div className="subject-grid">
          {rows.map((r) => {
            const risk = r.percent !== null && r.percent + 1e-9 < target;
            return (
              <div className="panel subject-card" key={r.subject}>
                <span style={{ color: subjectColor(r.subject) }}>
                  <BookOpen size={18} />
                  {r.subject}
                </span>
                <strong>
                  {r.percent === null ? "—" : r.percent.toFixed(1) + "%"}
                  <small>
                    {r.present} / {r.total}{" "}
                    {planning ? "expected present" : "attended"}
                  </small>
                </strong>
                <div
                  className="progress"
                  role="meter"
                  aria-label={`${r.subject} attendance`}
                  aria-valuenow={r.percent ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <i
                    style={{
                      width: (r.percent ?? 0) + "%",
                      background: risk ? "#c57660" : subjectColor(r.subject),
                    }}
                  />
                  <b style={{ left: target + "%" }} />
                </div>
                <small className={risk ? "at-risk" : ""}>
                  {r.percent === null
                    ? "No attendance recorded yet"
                    : risk
                      ? r.needed === Infinity
                        ? "100% is no longer reachable with existing absences"
                        : `${planning ? "After this window, attend" : "Attend"} the next ${r.needed} classes to reach ${target}%`
                      : `Can miss ${r.safe} more ${r.safe === 1 ? "class" : "classes"}${planning ? " in this window" : ""} at ${target}%`}
                </small>
                {planning && (
                  <small className="forecast-detail">
                    {r.projected} future classes · {r.missed} total absences in
                    window
                  </small>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
