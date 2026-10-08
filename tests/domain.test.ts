import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyState,
  mark,
  slotsOn,
  statistics,
  validateState,
  validateSlots,
  key,
  START,
  addDays,
  dates,
} from "../src/domain.ts";
import {
  csv,
  historyCSV,
  importHistory,
  holidaysFromText,
  timetableFromCSV,
} from "../src/io.ts";
import { gridSlots } from "../src/grid.ts";
function state() {
  const s = emptyState();
  s.versions = [
    {
      id: "v1",
      effective: START,
      slots: [
        {
          id: "math",
          subject: "Math",
          day: 2,
          start: "09:00",
          end: "10:00",
          room: "",
        },
        {
          id: "chem",
          subject: "Chemistry",
          day: 2,
          start: "10:00",
          end: "11:00",
          room: "",
        },
      ],
    },
  ];
  return s;
}
test("attendance is per subject, never aggregated", () => {
  let s = mark(state(), START, "math", "present", START);
  s = mark(s, START, "chem", "absent", START);
  const a = statistics(s, START, START, false, START);
  assert.equal(a.find((x) => x.subject === "Math")!.percent, 100);
  assert.equal(a.find((x) => x.subject === "Chemistry")!.percent, 0);
});
test("past and future marking are locked", () => {
  for (const d of ["2026-09-28", "2026-09-30"])
    assert.throws(
      () => mark(state(), d, "math", "present", START),
      /only be marked for today/,
    );
});
test("a future month assumes attendance except specified leave", () => {
  const s = state();
  s.leaveDays = ["2026-10-27"];
  const a = statistics(s, "2026-10-01", "2026-10-31", true, START);
  assert.equal(a[0].total, 4);
  assert.equal(a[0].present, 3);
  assert.equal(a[0].percent, 75);
  assert.deepEqual(s.records, {});
});
test("individual class leave does not affect other subjects", () => {
  const s = state();
  s.leaveSlots = [key("2026-10-06", "math")];
  const a = statistics(s, "2026-10-01", "2026-10-31", true, START);
  assert.equal(a.find((x) => x.subject === "Math")!.percent, 75);
  assert.equal(a.find((x) => x.subject === "Chemistry")!.percent, 100);
});
test("holidays remove denominator and planned absences", () => {
  const s = state();
  s.leaveDays = ["2026-10-27"];
  s.holidays = [{ date: "2026-10-27", name: "Holiday" }];
  const a = statistics(s, "2026-10-01", "2026-10-31", true, START);
  assert.equal(a[0].total, 3);
  assert.equal(a[0].percent, 100);
});
test("unmarked classes are visible and not assumed present", () => {
  const a = statistics(state(), START, START, false, START);
  assert.equal(a[0].pending, 1);
  assert.equal(a[0].total, 0);
  assert.equal(a[0].percent, null);
});
test("cancelled classes do not enter denominator", () => {
  const s = mark(state(), START, "math", "cancelled", START);
  assert.equal(
    statistics(s, START, START, false, START).find((x) => x.subject === "Math")!
      .total,
    0,
  );
});
test("effective schedule versions retain historical classes", () => {
  const s = state();
  s.versions.push({
    id: "v2",
    effective: "2026-10-01",
    slots: [{ ...s.versions[0].slots[0], day: 3 }],
  });
  assert.equal(slotsOn(s, START).length, 2);
  assert.equal(slotsOn(s, "2026-10-06").length, 0);
  assert.equal(slotsOn(s, "2026-10-07").length, 1);
});
test("100 percent target handles existing absence without division by zero", () => {
  const s = mark(state(), START, "math", "absent", START);
  const a = statistics(s, START, START, false, START, 100);
  assert.equal(a.find((x) => x.subject === "Math")!.needed, Infinity);
});
test("recovery count uses ceiling and future miss count uses floor", () => {
  const s = state();
  for (let i = 0; i < 20; i++) {
    const d = addDays(START, i);
    s.records[key(d, "m")] = {
      date: d,
      slotId: "m",
      subject: "Example",
      start: "09:00",
      status: i < 17 ? "present" : "absent",
    };
  }
  const x = statistics(s, START, "2026-10-18", false, "2026-10-18", 85).find(
    (x) => x.subject === "Example",
  )!;
  assert.equal(x.percent, 85);
  assert.equal(x.safe, 0);
  assert.equal(x.needed, 0);
  const y = statistics(s, START, "2026-10-18", false, "2026-10-18", 90).find(
    (x) => x.subject === "Example",
  )!;
  assert.equal(y.needed, 10);
});
test("restoring future attendance is rejected", () => {
  const s = state();
  s.records[key("2026-10-01", "math")] = {
    date: "2026-10-01",
    slotId: "math",
    subject: "Math",
    start: "09:00",
    status: "present",
  };
  assert.throws(() => validateState(s, START), /past or present/);
});
test("malformed dates and reversed ranges fail", () => {
  assert.throws(() => dates("2026-02-30", "2026-03-01"));
  assert.throws(() => dates("2026-10-02", "2026-10-01"));
});
test("CSV round trip preserves quoted subjects and cancelled classes", () => {
  const s = mark(state(), START, "math", "cancelled", START);
  s.records[key(START, "math")].subject = 'Math, "Advanced"';
  const r = importHistory(historyCSV(s), emptyState());
  assert.equal(Object.values(r.records)[0].subject, 'Math, "Advanced"');
  assert.equal(Object.values(r.records)[0].status, "cancelled");
});
test("CSV parser supports escaped quotes and embedded newlines", () =>
  assert.deepEqual(csv('a,b\r\n"x,y","hello\nworld"'), [
    ["a", "b"],
    ["x,y", "hello\nworld"],
  ]));
test("CSV column mapping imports alternative headers", () => {
  const s = importHistory(`Course,Result,When\nMath,P,${START}`, state(), {
    subject: 0,
    status: 1,
    date: 2,
    start: -1,
    slot: -1,
  });
  assert.equal(s.records[key(START, "math")].status, "present");
});
test("duplicate CSV records rejected, repeated subject requires a time", () => {
  assert.throws(
    () =>
      importHistory(
        `date,subject,status\n${START},Math,P\n${START},Math,A`,
        state(),
      ),
    /duplicate/,
  );
  const s = state();
  s.versions[0].slots.push({
    ...s.versions[0].slots[0],
    id: "math2",
    start: "12:00",
    end: "13:00",
  });
  assert.throws(
    () => importHistory(`date,subject,status\n${START},Math,P`, s),
    /more than once/,
  );
});
test("ICS multi-day holidays use exclusive end date", () => {
  const a = holidaysFromText(
    "BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;VALUE=DATE:20261001\nDTEND;VALUE=DATE:20261004\nSUMMARY:Break\nEND:VEVENT\nEND:VCALENDAR",
  );
  assert.deepEqual(
    a.map((x) => x.date),
    ["2026-10-01", "2026-10-02", "2026-10-03"],
  );
});
test("holiday text supports Indian date format and rejects invalid days", () =>
  assert.deepEqual(
    holidaysFromText("02/10/2026,Gandhi Jayanti\n31/02/2026,Invalid").map(
      (x) => x.date,
    ),
    ["2026-10-02"],
  ));
test("timetable CSV keeps separate periods for same subject", () => {
  const a = timetableFromCSV(
    "day,subject,start,end,room\nTuesday,Math,09:00,10:00,204\nTuesday,Math,13:00,14:00,204",
  );
  assert.equal(a.length, 2);
  assert.notEqual(a[0].id, a[1].id);
});
test("grid recognition maps weekday rows and time columns", () => {
  const w = (text: string, x: number, y: number, width = 90) => ({
    text,
    x,
    y,
    width,
    height: 20,
  });
  const slots = gridSlots([
    w("09:00-10:00", 200, 20, 120),
    w("10:00-11:00", 400, 20, 120),
    w("Monday", 10, 100),
    w("Tuesday", 10, 200),
    w("Math", 210, 100),
    w("Physics", 410, 100),
    w("Chemistry", 210, 200),
    w("Lunch", 410, 200),
  ]);
  assert.equal(slots.length, 3);
  assert.equal(slots.find((s) => s.subject === "Chemistry")!.day, 2);
  assert.equal(slots.find((s) => s.subject === "Physics")!.start, "10:00");
});
test("invalid timetable times and duplicate IDs are rejected", () => {
  assert.throws(() =>
    validateSlots([
      { id: "a", subject: "Math", day: 2, start: "25:00", end: "26:00" },
    ]),
  );
  const slot = state().versions[0].slots[0];
  assert.throws(() => validateSlots([slot, slot]), /Duplicate/);
});
test("planner miss allowance keeps the forecast denominator fixed", () => {
  const s = state();
  const a = statistics(s, "2026-10-01", "2026-10-31", true, START, 85);
  assert.equal(a[0].total, 4);
  assert.equal(a[0].safe, 0);
  const b = statistics(s, "2026-10-01", "2026-10-31", true, START, 75);
  assert.equal(b[0].safe, 1);
});
