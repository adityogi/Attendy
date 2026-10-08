export const START = "2026-09-29";
export const ZONE = "Asia/Kolkata";
export type Status = "present" | "absent" | "cancelled";
export type Slot = {
  id: string;
  subject: string;
  day: number;
  start: string;
  end: string;
  room: string;
};
export type Version = { id: string; effective: string; slots: Slot[] };
export type RecordEntry = {
  date: string;
  slotId: string;
  subject: string;
  start: string;
  status: Status;
};
export type State = {
  schema: 1;
  versions: Version[];
  records: Record<string, RecordEntry>;
  holidays: { date: string; name: string }[];
  leaveDays: string[];
  leaveSlots: string[];
  actualTarget: number;
  planTarget: number;
};
export const emptyState = (): State => ({
  schema: 1,
  versions: [],
  records: {},
  holidays: [],
  leaveDays: [],
  leaveSlots: [],
  actualTarget: 85,
  planTarget: 85,
});
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const validDate = (x: unknown): boolean =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  !isNaN(Date.parse(x)) &&
  new Date(x).toISOString().slice(0, 10) === x;
export const addDays = (d: string, n: number) => {
  const a = new Date(d + "T12:00:00Z");
  a.setUTCDate(a.getUTCDate() + n);
  return a.toISOString().slice(0, 10);
};
export function dates(from: string, to: string) {
  if (!validDate(from) || !validDate(to) || from > to)
    throw Error("Choose a valid date range.");
  const a = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    a.push(d);
    if (a.length > 3660) throw Error("Choose a timeline of ten years or less.");
  }
  return a;
}
export const key = (date: string, slotId: string) => date + "|" + slotId;
export function slotsOn(s: State, date: string) {
  if (date < START || s.holidays.some((h) => h.date === date)) return [];
  const v = [...s.versions]
    .filter((v) => v.effective <= date)
    .sort((a, b) => b.effective.localeCompare(a.effective))[0];
  return (v?.slots ?? [])
    .filter((a) => a.day === new Date(date + "T12:00:00Z").getUTCDay())
    .sort((a, b) => a.start.localeCompare(b.start));
}
export function mark(
  s: State,
  date: string,
  slotId: string,
  status: Status | null,
  now = today(),
): State {
  if (date !== now || date < START)
    throw Error(
      "Attendance can only be marked for today. Use the leave planner for future dates.",
    );
  const slot = slotsOn(s, date).find((x) => x.id === slotId);
  if (!slot) throw Error("This class is not scheduled today.");
  const records = { ...s.records };
  if (status === null) delete records[key(date, slotId)];
  else if (["present", "absent", "cancelled"].includes(status))
    records[key(date, slotId)] = {
      date,
      slotId,
      subject: slot.subject,
      start: slot.start,
      status,
    };
  else throw Error("Invalid attendance status.");
  return { ...s, records };
}
export type Stat = {
  subject: string;
  present: number;
  total: number;
  pending: number;
  missed: number;
  projected: number;
  projectedPresent: number;
  percent: number | null;
  safe: number;
  needed: number;
};
export function statistics(
  s: State,
  from = START,
  to = today(),
  project = false,
  now = today(),
  target = project ? s.planTarget : s.actualTarget,
): Stat[] {
  const recordsByDate = new Map<string, [string, RecordEntry][]>();
  for (const entry of Object.entries(s.records)) {
    recordsByDate.set(entry[1].date, [
      ...(recordsByDate.get(entry[1].date) ?? []),
      entry,
    ]);
  }
  const rows = new Map<string, Stat>();
  const row = (subject: string) => {
    if (!rows.has(subject))
      rows.set(subject, {
        subject,
        present: 0,
        total: 0,
        pending: 0,
        missed: 0,
        projected: 0,
        projectedPresent: 0,
        percent: null,
        safe: 0,
        needed: 0,
      });
    return rows.get(subject)!;
  };
  for (const d of dates(from < START ? START : from, to)) {
    const slots = slotsOn(s, d);
    const seen = new Set<string>();
    for (const slot of slots) {
      const k = key(d, slot.id),
        r = s.records[k],
        x = row(slot.subject);
      seen.add(k);
      if (d <= now) {
        if (!r) x.pending++;
        else if (r.status !== "cancelled") {
          x.total++;
          if (r.status === "present") x.present++;
          else x.missed++;
        }
      } else if (project) {
        x.total++;
        x.projected++;
        if (s.leaveDays.includes(d) || s.leaveSlots.includes(k)) x.missed++;
        else {
          x.present++;
          x.projectedPresent++;
        }
      }
    }
    // Retain explicitly imported history even when its original timetable no longer exists.
    for (const [k, r] of recordsByDate.get(d) ?? []) {
      if (
        d > now ||
        seen.has(k) ||
        s.holidays.some((h) => h.date === d) ||
        r.status === "cancelled"
      )
        continue;
      const x = row(r.subject);
      x.total++;
      if (r.status === "present") x.present++;
      else x.missed++;
    }
  }
  for (const x of rows.values()) {
    x.percent = x.total ? (100 * x.present) / x.total : null;
    x.safe = project
      ? Math.max(
          0,
          Math.min(
            x.projectedPresent,
            Math.floor(x.present - (target * x.total) / 100 + 1e-9),
          ),
        )
      : Math.max(
          0,
          Math.floor((100 * x.present - target * x.total) / target + 1e-9),
        );
    x.needed =
      target === 100
        ? x.present === x.total
          ? 0
          : Infinity
        : Math.max(
            0,
            Math.ceil(
              (target * x.total - 100 * x.present) / (100 - target) - 1e-9,
            ),
          );
  }
  return [...rows.values()].sort((a, b) => a.subject.localeCompare(b.subject));
}
export function validateSlots(slots: unknown): Slot[] {
  if (!Array.isArray(slots) || slots.length > 200)
    throw Error("Timetable must contain up to 200 classes.");
  const ids = new Set<string>();
  return slots.map((x: any) => {
    if (
      !x ||
      typeof x.subject !== "string" ||
      !x.subject.trim() ||
      x.subject.length > 100 ||
      !Number.isInteger(x.day) ||
      x.day < 0 ||
      x.day > 6 ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.start) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.end) ||
      x.start >= x.end
    )
      throw Error("Check every subject, weekday, and start/end time.");
    const id = typeof x.id === "string" ? x.id : crypto.randomUUID();
    if (!id || id.includes("|") || ids.has(id))
      throw Error("Duplicate or invalid class identifier.");
    ids.add(id);
    return {
      id,
      subject: x.subject.trim(),
      day: x.day,
      start: x.start,
      end: x.end,
      room: String(x.room ?? "").slice(0, 100),
    };
  });
}
export function validateState(value: unknown, now = today()): State {
  const x = value as State;
  if (
    !x ||
    x.schema !== 1 ||
    !Array.isArray(x.versions) ||
    !x.records ||
    typeof x.records !== "object" ||
    Array.isArray(x.records) ||
    !Array.isArray(x.holidays) ||
    !Array.isArray(x.leaveDays) ||
    !Array.isArray(x.leaveSlots)
  )
    throw Error("This is not an Attendly backup.");
  if (
    x.versions.length > 200 ||
    Object.keys(x.records).length > 50000 ||
    x.holidays.length > 4000
  )
    throw Error("This file is too large.");
  const effective = new Set<string>();
  const versions = x.versions.map((v) => {
    if (
      !validDate(v.effective) ||
      v.effective < START ||
      effective.has(v.effective) ||
      typeof v.id !== "string"
    )
      throw Error("Invalid timetable effective date.");
    effective.add(v.effective);
    return { ...v, slots: validateSlots(v.slots) };
  });
  for (const [k, r] of Object.entries(x.records)) {
    if (
      !validDate(r.date) ||
      r.date < START ||
      r.date > now ||
      !["present", "absent", "cancelled"].includes(r.status) ||
      typeof r.subject !== "string" ||
      !r.subject.trim() ||
      typeof r.slotId !== "string" ||
      k !== key(r.date, r.slotId) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.start)
    )
      throw Error(
        "History must have valid past or present dates, subjects, and statuses.",
      );
  }
  for (const h of x.holidays)
    if (!validDate(h.date) || typeof h.name !== "string")
      throw Error("Invalid holiday.");
  for (const d of x.leaveDays)
    if (!validDate(d) || d < START) throw Error("Invalid leave date.");
  for (const k of x.leaveSlots)
    if (
      typeof k !== "string" ||
      !validDate(k.split("|")[0]) ||
      k.split("|").length !== 2
    )
      throw Error("Invalid planned class.");
  for (const t of [x.actualTarget, x.planTarget])
    if (!Number.isFinite(t) || t < 1 || t > 100)
      throw Error("Targets must be between 1 and 100.");
  return { ...x, versions };
}
