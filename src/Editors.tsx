import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Plus,
  Trash2,
  FileDown,
  Image,
  Check,
  CalendarDays,
  Download,
} from "lucide-react";
import {
  Slot,
  State,
  validateSlots,
  validateState,
  today,
  START,
  addDays,
} from "./domain";
import { DAYS, format, subjectColor } from "./Calendar";
import {
  csv,
  download,
  extractText,
  extractTimetableImage,
  timetableFromText,
  timetableFromCSV,
  holidaysFromText,
  historyCSV,
  importHistory,
} from "./io";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Timetable({
  s,
  onSave,
  notify,
}: {
  s: State;
  onSave: (s: State) => void;
  notify: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false),
    [rows, setRows] = useState<Slot[]>([]),
    [effective, setEffective] = useState(today()),
    [raw, setRaw] = useState(""),
    [progress, setProgress] = useState(""),
    [preview, setPreview] = useState(""),
    [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const latest = [...s.versions].sort((a, b) =>
    b.effective.localeCompare(a.effective),
  )[0];
  const [selected, setSelected] = useState<string>("");
  const version = s.versions.find((v) => v.id === selected) ?? latest;
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const begin = () => {
    setRows((latest?.slots ?? []).map((x) => ({ ...x })));
    setEffective(latest ? addDays(today(), 1) : START);
    setEditing(true);
    setError("");
    setRaw("");
    setPreview("");
  };
  async function upload(f: File) {
    setProgress("Reading your timetable…");
    setError("");
    try {
      if (f.size > 20 * 1024 * 1024)
        throw Error("Choose a file smaller than 20 MB.");
      if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
      if (f.name.endsWith(".json")) {
        const data = JSON.parse(await f.text());
        setRows(
          validateSlots(
            Array.isArray(data)
              ? data
              : (data.slots ?? data.versions?.at(-1)?.slots),
          ),
        );
      } else if (f.name.endsWith(".csv"))
        setRows(timetableFromCSV(await f.text()));
      else {
        const imageResult = f.type.startsWith("image/")
          ? await extractTimetableImage(f, setProgress)
          : null;
        const text = imageResult?.text ?? (await extractText(f, setProgress));
        setRaw(text);
        const parsed = imageResult?.slots ?? timetableFromText(text);
        setRows(parsed);
        if (!parsed.length)
          setError(
            "Text was read, but the table layout needs your review. Use the reference and add the class rows below.",
          );
      }
      setEditing(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProgress("");
    }
  }
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Your weekly rhythm.</h2>
          <p className="subtle">
            Upload a timetable or add classes. Each update starts on a date you
            choose.
          </p>
        </div>
        <button className="primary" onClick={begin}>
          <Plus size={17} />
          Update timetable
        </button>
      </div>
      {s.versions.length > 0 && (
        <div className="version-controls">
          <label>
            Timetable version
            <select
              value={version?.id ?? ""}
              onChange={(e) => setSelected(e.target.value)}
            >
              {[...s.versions]
                .sort((a, b) => b.effective.localeCompare(a.effective))
                .map((v) => (
                  <option value={v.id} key={v.id}>
                    Effective {v.effective} · {v.slots.length} classes / week
                  </option>
                ))}
            </select>
          </label>
          <button
            onClick={() =>
              download(
                "attendly-timetable.json",
                JSON.stringify(version, null, 2),
              )
            }
          >
            <FileDown size={16} />
            Download JSON
          </button>
        </div>
      )}
      {!version ? (
        <div className="panel empty">
          <CalendarDays size={40} />
          <h2>Start with your timetable.</h2>
          <p>
            Upload a picture, PDF, CSV, or JSON file.
            <br />
            Review the classes once, then your calendar takes care of the rest.
          </p>
          <button className="primary" onClick={begin}>
            Add my timetable
          </button>
        </div>
      ) : (
        <div className="schedule-grid">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <section className="panel schedule-day" key={day}>
              <h3>{DAYS[day]}</h3>
              {version.slots
                .filter((x) => x.day === day)
                .sort((a, b) => a.start.localeCompare(b.start))
                .map((slot) => (
                  <div
                    className="class-card"
                    key={slot.id}
                    style={{ borderLeftColor: subjectColor(slot.subject) }}
                  >
                    <small>
                      {slot.start} – {slot.end}
                    </small>
                    <h3>{slot.subject}</h3>
                    <p>{slot.room || "No room specified"}</p>
                  </div>
                ))}
              {!version.slots.some((x) => x.day === day) && (
                <p className="subtle">No classes</p>
              )}
            </section>
          ))}
        </div>
      )}
      {editing && (
        <Modal title="Review your timetable" onClose={() => setEditing(false)}>
          <p className="subtle">
            Check every subject, weekday, and time before saving. Each row
            counts as one class.
          </p>
          <label className="upload-zone">
            <Upload size={25} />
            <strong>{progress || "Upload your timetable"}</strong>
            <span>Photo, PDF, CSV, or JSON · up to 20 MB</span>
            <input
              ref={file}
              type="file"
              accept="image/*,.pdf,.csv,.json"
              disabled={!!progress}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
          </label>
          {preview && (
            <img
              className="upload-preview"
              src={preview}
              alt="Your uploaded timetable for comparison"
            />
          )}
          {raw && (
            <details>
              <summary>Review extracted text</summary>
              <textarea
                rows={7}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
              />
              <p className="subtle">
                For text parsing, use one class per line: Tuesday 09:00–10:00
                Mathematics. Complex grids may need manual correction.
              </p>
              <button onClick={() => setRows(timetableFromText(raw))}>
                Parse corrected text
              </button>
            </details>
          )}
          <label>
            Effective from
            <input
              type="date"
              min={latest ? (today() < START ? START : today()) : START}
              value={effective}
              onChange={(e) => setEffective(e.target.value)}
            />
          </label>
          <p className="subtle">
            Earlier timetable versions stay in your history. Use the same
            subject name to continue its attendance count.
          </p>
          <div className="editor-rows">
            {rows.map((r, i) => (
              <div className="editor-row" key={r.id}>
                <label>
                  Subject
                  <input
                    list="subjects"
                    value={r.subject}
                    onChange={(e) =>
                      setRows(
                        rows.map((x, n) =>
                          n === i ? { ...x, subject: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Day
                  <select
                    value={r.day}
                    onChange={(e) =>
                      setRows(
                        rows.map((x, n) =>
                          n === i ? { ...x, day: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  >
                    {DAYS.map((d, j) => (
                      <option key={d} value={j}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Start
                  <input
                    type="time"
                    value={r.start}
                    onChange={(e) =>
                      setRows(
                        rows.map((x, n) =>
                          n === i ? { ...x, start: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  End
                  <input
                    type="time"
                    value={r.end}
                    onChange={(e) =>
                      setRows(
                        rows.map((x, n) =>
                          n === i ? { ...x, end: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Room
                  <input
                    value={r.room}
                    onChange={(e) =>
                      setRows(
                        rows.map((x, n) =>
                          n === i ? { ...x, room: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  className="icon-button"
                  aria-label={`Remove class ${i + 1}`}
                  onClick={() => setRows(rows.filter((_, n) => n !== i))}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <datalist id="subjects">
            {[
              ...new Set(
                s.versions.flatMap((v) => v.slots.map((x) => x.subject)),
              ),
            ].map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
          <button
            onClick={() =>
              setRows([
                ...rows,
                {
                  id: crypto.randomUUID(),
                  subject: "",
                  day: 1,
                  start: "09:00",
                  end: "10:00",
                  room: "",
                },
              ])
            }
          >
            <Plus size={16} />
            Add a class
          </button>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button onClick={() => setEditing(false)}>Cancel</button>
            <button
              className="primary"
              disabled={!!progress}
              onClick={() => {
                try {
                  const slots = validateSlots(rows);
                  if (
                    (latest && effective < today()) ||
                    effective < START ||
                    !effective
                  )
                    throw Error("Choose today or a future effective date.");
                  if (Object.values(s.records).some((r) => r.date >= effective))
                    throw Error(
                      "Attendance is already recorded on or after this date. Choose a later effective date to preserve your history.",
                    );
                  const subjects = [
                    ...new Set(
                      s.versions.flatMap((v) => v.slots.map((x) => x.subject)),
                    ),
                  ];
                  slots.forEach((x) => {
                    x.subject =
                      subjects.find(
                        (a) => a.toLowerCase() === x.subject.toLowerCase(),
                      ) ?? x.subject;
                  });
                  for (const a of slots)
                    for (const b of slots)
                      if (
                        a.id !== b.id &&
                        a.day === b.day &&
                        a.start < b.end &&
                        b.start < a.end
                      )
                        throw Error(
                          `Overlapping classes on ${DAYS[a.day]}. Check ${a.subject} and ${b.subject}.`,
                        );
                  onSave({
                    ...s,
                    versions: [
                      ...s.versions.filter((v) => v.effective !== effective),
                      { id: crypto.randomUUID(), effective, slots },
                    ],
                  });
                  setEditing(false);
                  notify("Timetable saved. Your calendar is ready.");
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              <Check size={16} />
              Save timetable
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Holidays({
  s,
  onSave,
  notify,
}: {
  s: State;
  onSave: (s: State) => void;
  notify: (s: string) => void;
}) {
  const [draft, setDraft] = useState<{ date: string; name: string }[] | null>(
      null,
    ),
    [progress, setProgress] = useState(""),
    [error, setError] = useState(""),
    [from, setFrom] = useState(today()),
    [to, setTo] = useState(today()),
    [name, setName] = useState("College holiday");
  async function read(f: File) {
    setProgress("Reading holiday calendar…");
    setError("");
    try {
      const text = await extractText(f, setProgress);
      let rows;
      if (f.name.endsWith(".json")) {
        const value = JSON.parse(text);
        rows = Array.isArray(value) ? value : value.holidays;
      } else rows = holidaysFromText(text);
      validateState({ ...s, holidays: rows });
      if (!rows.length)
        throw Error(
          "No complete dates found. Include the year, or add holidays using the date fields.",
        );
      setDraft(rows);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProgress("");
    }
  }
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Some days don’t count.</h2>
          <p className="subtle">
            College holidays exclude every class that day from both the tracker
            and planner.
          </p>
        </div>
      </div>
      <div className="two-columns">
        <section className="panel content-panel">
          <h3>Upload your holiday calendar</h3>
          <label className="upload-zone">
            <Upload size={28} />
            <strong>{progress || "Choose a file"}</strong>
            <span>Photo, PDF, CSV, ICS, JSON, or text</span>
            <input
              type="file"
              disabled={!!progress}
              accept="image/*,.pdf,.csv,.ics,.json,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void read(f);
                e.target.value = "";
              }}
            />
          </label>
          <p className="subtle">
            Dates use YYYY-MM-DD or DD/MM/YYYY. You’ll review them before
            they’re added.
          </p>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
        </section>
        <section className="panel content-panel">
          <h3>Add a day or holiday break</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                if (!from || !to || from > to)
                  throw Error("Choose a valid date range.");
                const rows = [];
                for (let d = from; d <= to; d = addDays(d, 1)) {
                  rows.push({ date: d, name });
                  if (rows.length > 366)
                    throw Error("Add up to one year at a time.");
                }
                setDraft(rows);
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            <label>
              Holiday name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
              />
            </label>
            <div className="form-pair">
              <label>
                From
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    if (e.target.value > to) setTo(e.target.value);
                  }}
                  required
                />
              </label>
              <label>
                Through
                <input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => setTo(e.target.value)}
                  required
                />
              </label>
            </div>
            <button className="primary">
              <Plus size={16} />
              Review dates
            </button>
          </form>
        </section>
      </div>
      <section className="panel content-panel holiday-list">
        <div className="section-intro">
          <h3>{s.holidays.length} holiday dates</h3>
          <button
            onClick={() =>
              download(
                "attendly-holidays.json",
                JSON.stringify(s.holidays, null, 2),
              )
            }
          >
            <Download size={16} />
            Export
          </button>
        </div>
        {!s.holidays.length && (
          <p className="subtle">
            No holidays yet. Your college calendar will appear here.
          </p>
        )}
        {[...s.holidays]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((h) => (
            <div className="list-row" key={h.date}>
              <CalendarDays size={18} />
              <div>
                <strong>{h.name}</strong>
                <span>
                  {format(h.date, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <button
                className="icon-button"
                aria-label={`Remove holiday ${h.date}`}
                onClick={() => setDraft([{ ...h, name: "__REMOVE__" }])}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
      </section>
      {draft && (
        <Modal
          title={
            draft[0]?.name === "__REMOVE__"
              ? "Remove this holiday?"
              : "Review holiday dates"
          }
          onClose={() => setDraft(null)}
        >
          {draft[0]?.name === "__REMOVE__" ? (
            <p>
              Classes on {draft[0].date} will be included in attendance again.
            </p>
          ) : (
            <>
              <p className="subtle">
                Confirm the dates against your college calendar. Existing dates
                will be updated.
              </p>
              {draft.map((h, i) => (
                <div className="holiday-edit" key={i}>
                  <input
                    aria-label={`Holiday date ${i + 1}`}
                    type="date"
                    value={h.date}
                    onChange={(e) =>
                      setDraft(
                        draft.map((x, n) =>
                          n === i ? { ...x, date: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <input
                    aria-label={`Holiday name ${i + 1}`}
                    value={h.name}
                    onChange={(e) =>
                      setDraft(
                        draft.map((x, n) =>
                          n === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <button
                    className="icon-button"
                    aria-label={`Remove draft holiday ${i + 1}`}
                    onClick={() => setDraft(draft.filter((_, n) => n !== i))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </>
          )}
          {draft.some((h) => h.date <= today()) && (
            <p className="notice">
              Past holiday changes recalculate attendance. Recorded entries are
              preserved in your exports.
            </p>
          )}
          {error && <p className="error-text">{error}</p>}
          <div className="modal-actions">
            <button onClick={() => setDraft(null)}>Cancel</button>
            <button
              className="primary"
              onClick={() => {
                try {
                  const holidays =
                    draft[0]?.name === "__REMOVE__"
                      ? s.holidays.filter((x) => x.date !== draft[0].date)
                      : [
                          ...new Map(
                            [...s.holidays, ...draft].map((x) => [x.date, x]),
                          ).values(),
                        ];
                  onSave(validateState({ ...s, holidays }));
                  setDraft(null);
                  setError("");
                  notify("Holiday calendar updated.");
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              Confirm dates
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function DataTools({
  s,
  onSave,
  notify,
}: {
  s: State;
  onSave: (s: State, mode?: string) => void;
  notify: (s: string) => void;
}) {
  const [pending, setPending] = useState<State | null>(null),
    [error, setError] = useState(""),
    [csvText, setCsvText] = useState(""),
    [mapping, setMapping] = useState({
      date: 0,
      subject: 1,
      start: 2,
      status: 3,
      slot: 4,
    });
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Your data goes with you.</h2>
          <p className="subtle">
            Download a complete backup, export attendance, or bring your history
            across.
          </p>
        </div>
      </div>
      <div className="two-columns">
        <section className="panel content-panel">
          <Download className="section-icon" />
          <h3>Keep a copy</h3>
          <p className="subtle">
            A full backup includes timetables, holidays, actual attendance,
            targets, and leave plans.
          </p>
          <button
            className="primary full"
            onClick={() =>
              download(
                `attendly-backup-${today()}.json`,
                JSON.stringify(s, null, 2),
              )
            }
          >
            Download full backup
          </button>
          <button
            className="full"
            onClick={() =>
              download(
                `attendly-history-${today()}.csv`,
                historyCSV(s),
                "text/csv",
              )
            }
          >
            Export attendance CSV
          </button>
          <button
            className="full"
            onClick={() =>
              download(
                "attendly-history-template.csv",
                "date,subject,start,status,slot_id\r\n" +
                  today() +
                  ",Mathematics,09:00,present,\r\n",
                "text/csv",
              )
            }
          >
            Download CSV template
          </button>
        </section>
        <section className="panel content-panel">
          <Upload className="section-icon" />
          <h3>Bring your history</h3>
          <p className="subtle">
            CSV merges attendance by class and date. A full backup replaces the
            entire workspace after review.
          </p>
          <label className="upload-zone">
            <Upload size={24} />
            <strong>Import CSV or JSON backup</strong>
            <input
              type="file"
              accept=".csv,.json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setError("");
                try {
                  if (f.size > 4_000_000)
                    throw Error("Choose a backup smaller than 4 MB.");
                  const text = await f.text();
                  if (f.name.endsWith(".json"))
                    setPending(validateState(JSON.parse(text)));
                  else {
                    setCsvText(text);
                    const head = csv(text)[0].map((x) =>
                      x.toLowerCase().replace(/[_\s-]/g, ""),
                    );
                    const find = (...names: string[]) =>
                      head.findIndex((x) => names.includes(x));
                    setMapping({
                      date: find("date", "classdate"),
                      subject: find("subject", "course", "coursename"),
                      start: find("start", "starttime", "time"),
                      status: find("status", "attendance"),
                      slot: find("slotid", "classid"),
                    });
                  }
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            />
          </label>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
        </section>
      </div>
      <div className="panel content-panel">
        <h3>Import rules</h3>
        <p className="subtle">
          Dates must be between 29 September 2026 and today. Use present /
          absent / cancelled (or P / A, 1 / 0). For two classes of the same
          subject on one day, include the start time or slot ID. Dates written
          with slashes use day/month/year.
        </p>
        <p className="subtle">
          Exports contain actual attendance only. Planned absences are included
          separately in full backups. Unmarked classes are not assumed present.
        </p>
      </div>
      {csvText && (
        <Modal title="Match your CSV columns" onClose={() => setCsvText("")}>
          <p className="subtle">
            Choose which columns describe each class. This also supports CSV
            exports with different header names.
          </p>
          {(Object.keys(mapping) as (keyof typeof mapping)[]).map((k) => (
            <label key={k}>
              {
                {
                  date: "Class date",
                  subject: "Subject name",
                  start: "Start time (optional)",
                  status: "Attendance status",
                  slot: "Slot ID (optional)",
                }[k]
              }
              <select
                value={mapping[k]}
                onChange={(e) =>
                  setMapping({ ...mapping, [k]: Number(e.target.value) })
                }
              >
                <option value={-1}>Not included</option>
                {csv(csvText)[0].map((x, i) => (
                  <option key={i} value={i}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {error && <p className="error-text">{error}</p>}
          <div className="modal-actions">
            <button onClick={() => setCsvText("")}>Cancel</button>
            <button
              className="primary"
              onClick={() => {
                try {
                  const next = importHistory(csvText, s, mapping);
                  setPending(next);
                  setCsvText("");
                  setError("");
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              Preview import
            </button>
          </div>
        </Modal>
      )}
      {pending && (
        <Modal title="Confirm your import" onClose={() => setPending(null)}>
          <p>
            This workspace will contain{" "}
            <strong>
              {Object.keys(pending.records).length} attendance records
            </strong>
            , {pending.versions.length} timetable versions, and{" "}
            {pending.holidays.length} holiday dates.
          </p>
          <p className="notice">
            Matching records will be replaced. Download your current backup
            before confirming if you want to keep a copy.
          </p>
          <button
            onClick={() =>
              download(
                `attendly-before-import-${today()}.json`,
                JSON.stringify(s, null, 2),
              )
            }
          >
            Back up current workspace
          </button>
          <div className="modal-actions">
            <button onClick={() => setPending(null)}>Cancel</button>
            <button
              className="primary"
              onClick={() => {
                onSave(pending, "import");
                setPending(null);
                notify("Import applied.");
              }}
            >
              Confirm import
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
