export const TARGET = 85;

export type Adjustment = { date: string; note: string; attended: boolean };
export type Subject = {
  code: string;
  title: string;
  attended: number;
  held: number;
  asOn: string | null;
  after: Adjustment[];
};

// Baseline numbers come from the RVCE progress report. Entries in `after` are
// classes that happened after the report's "as on" date for that subject.
export const SUBJECTS: Subject[] = [
  {
    code: "MA211TC",
    title: "Fundamentals of Linear Algebra, Calculus and Statistics",
    attended: 18,
    held: 23,
    asOn: "2026-10-30",
    after: [],
  },
  {
    code: "CM211IA",
    title: "Chemistry of Smart Materials and Devices",
    attended: 12,
    held: 17,
    asOn: "2026-10-23",
    after: [
      { date: "2026-10-28", note: "Wed class", attended: true },
      { date: "2026-10-30", note: "Fri morning class (skipped)", attended: false },
      { date: "2026-10-30", note: "Fri chemistry lab", attended: true },
    ],
  },
  {
    code: "ME112GL",
    title: "Computer Aided Engineering Graphics",
    attended: 7,
    held: 11,
    asOn: "2026-10-22",
    after: [
      { date: "2026-10-28", note: "Wed theory", attended: true },
      { date: "2026-10-29", note: "Thu lab", attended: true },
    ],
  },
  {
    code: "EC113ATC",
    title: "Principles of Electronics Engineering",
    attended: 17,
    held: 17,
    asOn: "2026-10-29",
    after: [],
  },
  {
    code: "CS115AID",
    title: "Introduction to C++ Programming (Theory & Practice)",
    attended: 0,
    held: 0,
    asOn: null,
    after: [
      { date: "2026-10-27", note: "Tue class", attended: true },
      { date: "2026-10-28", note: "Wed class", attended: true },
    ],
  },
  {
    code: "HS111EL",
    title: "Communicative English-I",
    attended: 0,
    held: 0,
    asOn: null,
    after: [{ date: "2026-10-30", note: "Fri class", attended: true }],
  },
  {
    code: "HS114TC",
    title: "Fundamentals of Indian Constitution",
    attended: 0,
    held: 0,
    asOn: null,
    after: [{ date: "2026-10-27", note: "Tue class", attended: true }],
  },
  {
    code: "HS115YL",
    title: "Scientific Foundations of Health - Yoga Practice",
    attended: 0,
    held: 0,
    asOn: null,
    after: [],
  },
];

export const totals = (s: Subject) => {
  const attended = s.attended + s.after.filter((a) => a.attended).length;
  const held = s.held + s.after.length;
  return { attended, held };
};

export const percent = (attended: number, held: number) =>
  held ? (100 * attended) / held : null;

export const canMiss = (attended: number, held: number) =>
  Math.max(0, Math.floor((100 * attended - TARGET * held) / TARGET + 1e-9));

export const needToAttend = (attended: number, held: number) =>
  Math.max(
    0,
    Math.ceil((TARGET * held - 100 * attended) / (100 - TARGET) - 1e-9),
  );
