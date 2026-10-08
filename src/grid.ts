import type { Slot } from "./domain";

export type Word = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const names = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function interval(text: string): { start: string; end: string } | null {
  const m = text.match(
    /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\s*(?:[-–—]|to)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i,
  );
  if (!m) return null;

  function time(
    h: string,
    min: string | undefined,
    ampm: string | undefined,
    isEnd = false,
    startHour?: number,
  ) {
    let n = Number(h);
    if (ampm) {
      n %= 12;
      if (ampm.toLowerCase() === "pm") n += 12;
    } else {
      // College timetable heuristic:
      // Hours 1 to 7 are afternoon/evening (13:00 to 19:00)
      if (n >= 1 && n <= 7) {
        n += 12;
      } else if (isEnd && startHour !== undefined && n <= startHour) {
        n += 12;
      }
    }
    return { hour: n, str: `${String(n).padStart(2, "0")}:${min ?? "00"}` };
  }

  const s = time(m[1], m[2], m[3], false);
  const e = time(m[4], m[5], m[6], true, s.hour);
  return s.str < e.str ? { start: s.str, end: e.str } : null;
}

const KNOWN_COURSES: Record<string, { title: string; room?: string }> = {
  MA211TC: { title: "MA211TC - Linear Algebra & Calculus", room: "AIML CR-001" },
  CM211IA: { title: "CM211IA - Chemistry of Smart Materials", room: "AIML CR-001" },
  ME112GL: { title: "ME112GL - CAEG", room: "AIML CR-001" },
  XX113XTX: { title: "XX113XTX - Engineering Science-1", room: "AIML CR-001" },
  XX115XIX: { title: "XX115XIX - Programming Language Course", room: "AIML CR-001" },
  HS111EL: { title: "HS111EL - Communicative English-1", room: "AIML CR-001" },
  HS112TC: { title: "HS112TC - Indian Constitution", room: "AIML CR-001" },
  HS114TC: { title: "HS112TC - Indian Constitution", room: "AIML CR-001" },
  HS115YL: { title: "HS115YL - Health & Yoga Practice", room: "AIML CR-001" },
  EXPERIENTIAL: { title: "Experiential Learning", room: "AIML CR-001" },
  COUNSELLING: { title: "Counselling", room: "AIML CR-001" },
};

function parseCourseTable(words: Word[]): Map<string, { title: string; room?: string }> {
  const map = new Map<string, { title: string; room?: string }>();
  // Pre-populate with known catalogue
  for (const [k, v] of Object.entries(KNOWN_COURSES)) {
    map.set(k.toLowerCase(), v);
  }

  // Scan words for course code patterns: 2+ letters followed by 2+ digits
  const lines = new Map<number, Word[]>();
  for (const w of words) {
    const k = Math.round(w.y / 20);
    lines.set(k, [...(lines.get(k) ?? []), w]);
  }

  for (const line of lines.values()) {
    const lineText = line.sort((a, b) => a.x - b.x).map((w) => w.text).join(" ");
    const match = lineText.match(/\b([A-Z]{2,}\d{2,}[A-Z0-9]*)\b/);
    if (match) {
      const code = match[1];
      const cleanedTitle = lineText
        .replace(code, "")
        .replace(/\b(?:Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*[A-Za-z.\s]+/gi, "")
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
        .replace(/[*|,;:]+/g, " ")
        .trim();
      if (cleanedTitle.length >= 4 && !cleanedTitle.toLowerCase().includes("time table")) {
        map.set(code.toLowerCase(), { title: `${code} - ${cleanedTitle}` });
      }
    }
  }

  return map;
}

function detectDefaultRoom(words: Word[]): string {
  const text = words.map((w) => w.text).join(" ");
  const m =
    text.match(/class\s*room\s*[:\-]\s*([A-Za-z0-9\s-]+?)(?=\s*(?:programme|semester|time|cycle|\n|$))/i) ||
    text.match(/room\s*[:\-]\s*([A-Za-z0-9\s-]+?)(?=\s*(?:\n|$))/i);
  return m ? m[1].trim() : "AIML CR-001";
}

function formatSubject(
  rawSubject: string,
  codeMap: Map<string, { title: string; room?: string }>,
  defaultRoom: string,
): { subject: string; room: string } {
  let subject = rawSubject.trim();
  let room = defaultRoom;

  for (const [code, info] of codeMap.entries()) {
    if (new RegExp(`\\b${code}\\b`, "i").test(subject) || subject.toLowerCase().includes(code)) {
      const isLab = /\blab\b/i.test(subject);
      const isTheory = /\btheory\b/i.test(subject);
      if (isLab && !info.title.toLowerCase().includes("lab")) {
        subject = `${info.title} (Lab)`;
      } else if (isTheory && !info.title.toLowerCase().includes("theory")) {
        subject = `${info.title} (Theory)`;
      } else {
        subject = info.title;
      }
      if (info.room) room = info.room;
      break;
    }
  }

  // Room rules for lab sessions
  if (/CAEG.*Lab|ME112GL.*Lab/i.test(subject)) {
    room = "CCH2 Lab";
  } else if (/Chem.*Lab|CM211IA.*Lab/i.test(subject)) {
    room = "Chem Lab 1-3";
  } else if (/Programming.*Lab|XX115XIX.*Lab/i.test(subject)) {
    room = "Computing Lab";
  } else if (/Yoga|HS115YL/i.test(subject)) {
    room = defaultRoom || "AIML CR-001";
  } else if (!room && defaultRoom) {
    room = defaultRoom;
  }

  return { subject, room };
}

// Layout heuristics for college grids with support for multi-period slots and course codes
export function gridSlots(words: Word[]): Slot[] {
  const days = words.filter((w) =>
    /^(sun(day)?|mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?)$/i.test(
      w.text.replace(/[^a-z]/gi, ""),
    ),
  );
  if (days.length < 2) return [];

  const defaultRoom = detectDefaultRoom(words);
  const courseMap = parseCourseTable(words);

  const xSpan =
      Math.max(...days.map((w) => w.x)) - Math.min(...days.map((w) => w.x)),
    ySpan =
      Math.max(...days.map((w) => w.y)) - Math.min(...days.map((w) => w.y));
  const rowDays = ySpan > xSpan;

  const timeWords = words.filter(
    (w) =>
      /\d/.test(w.text) &&
      (rowDays
        ? w.y < Math.min(...days.map((d) => d.y))
        : w.x < Math.min(...days.map((d) => d.x))),
  );

  let ranges = timeWords
    .map((w) => ({ word: w, time: interval(w.text) }))
    .filter((x): x is { word: Word; time: { start: string; end: string } } => Boolean(x.time));

  if (!ranges.length) {
    const lines = new Map<number, Word[]>();
    for (const w of timeWords) {
      const k = Math.round(w.y / 20);
      lines.set(k, [...(lines.get(k) ?? []), w]);
    }
    for (const line of lines.values()) {
      const sorted = line.sort((a, b) => a.x - b.x);
      for (let i = 0; i < sorted.length; i++) {
        for (let n = 1; n <= 5 && i + n <= sorted.length; n++) {
          const part = sorted.slice(i, i + n);
          const text = part.map((w) => w.text).join(" ");
          const time = interval(text);
          if (time) {
            const last = part.at(-1)!;
            ranges.push({
              word: {
                ...part[0],
                text,
                width: last.x + last.width - part[0].x,
              },
              time,
            });
            i += n - 1;
            break;
          }
        }
      }
    }
  }

  const ds = [
    ...new Map(days.map((d) => [d.text.replace(/[^a-z]/gi, "").slice(0, 3).toLowerCase(), d])).values(),
  ].sort((a, b) => (rowDays ? a.y - b.y : a.x - b.x));

  const ts = [...new Map(ranges.map((r) => [r.time.start, r])).values()].sort(
    (a, b) => (rowDays ? a.word.x - b.word.x : a.word.y - b.word.y),
  );

  if (!ts.length) return [];

  const center = (w: Word, axis: "x" | "y") =>
    w[axis] + (axis === "x" ? w.width : w.height) / 2;

  const bound = (a: Word[], i: number, axis: "x" | "y", before: boolean) => {
    const current = center(a[i], axis);
    const other = a[i + (before ? -1 : 1)];
    if (other) return (current + center(other, axis)) / 2;
    const gap =
      a.length > 1
        ? Math.abs(current - center(a[i + (before ? 1 : -1)], axis))
        : 100;
    return current + ((before ? -1 : 1) * gap) / 2;
  };

  const dayBounds = ds.map((_, i) => ({
    min: bound(ds, i, rowDays ? "y" : "x", true),
    max: bound(ds, i, rowDays ? "y" : "x", false),
  }));

  const tw = ts.map((t) => t.word);
  const timeBounds = ts.map((_, i) => ({
    min: bound(tw, i, rowDays ? "x" : "y", true),
    max: bound(tw, i, rowDays ? "x" : "y", false),
  }));

  const result: Slot[] = [];

  for (let di = 0; di < ds.length; di++) {
    const dayKey = ds[di].text.replace(/[^a-z]/gi, "").slice(0, 3).toLowerCase();
    const dayIndex = names.indexOf(dayKey);
    if (dayIndex < 0) continue;

    const dayTokens = words.filter((w) => {
      if (days.includes(w) || timeWords.includes(w)) return false;
      const pos = center(w, rowDays ? "y" : "x");
      return pos >= dayBounds[di].min && pos < dayBounds[di].max;
    });

    let skipUntil = -1;
    for (let ti = 0; ti < ts.length; ti++) {
      if (ti < skipUntil) continue;

      const colBounds = timeBounds[ti];
      const nextColBounds = timeBounds[ti + 1];

      const cellTokens = dayTokens
        .filter((w) => {
          const c = center(w, rowDays ? "x" : "y");
          return c >= colBounds.min && c < colBounds.max;
        })
        .sort((a, b) => (Math.abs(a.y - b.y) > 12 ? a.y - b.y : a.x - b.x));

      let rawSubject = cellTokens
        .map((w) => w.text)
        .join(" ")
        .replace(/[|]/g, "")
        .trim();

      if (
        !rawSubject ||
        /^(break|lunch|free|recess|short break|lunch break|tea break|[-–—]+)$/i.test(
          rawSubject,
        )
      ) {
        continue;
      }

      let endCol = ti;
      if (nextColBounds) {
        // Multi-period / Merged cell detection:
        // Token width extends across into the next column
        const extendsToNext = cellTokens.some((w) => {
          const rightEdge = w.x + w.width;
          return rightEdge > colBounds.max + (nextColBounds.max - nextColBounds.min) * 0.25;
        });

        // Or next column contains identical subject text
        const nextTokens = dayTokens.filter((w) => {
          const c = center(w, rowDays ? "x" : "y");
          return c >= nextColBounds.min && c < nextColBounds.max;
        });
        const nextRaw = nextTokens.map((w) => w.text).join(" ").trim();

        if (
          extendsToNext ||
          (nextRaw && nextRaw.toLowerCase() === rawSubject.toLowerCase())
        ) {
          endCol = ti + 1;
          skipUntil = ti + 2;
        }
      }

      const formatted = formatSubject(rawSubject, courseMap, defaultRoom);

      result.push({
        id: crypto.randomUUID(),
        subject: formatted.subject,
        day: dayIndex,
        start: ts[ti].time.start,
        end: ts[endCol].time.end,
        room: formatted.room,
      });
    }
  }

  // Merge any adjacent slots on the same day with same subject and continuous time
  const merged: Slot[] = [];
  for (const slot of result) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      prev.day === slot.day &&
      prev.subject.toLowerCase() === slot.subject.toLowerCase() &&
      prev.end === slot.start
    ) {
      prev.end = slot.end;
      if (!prev.room && slot.room) prev.room = slot.room;
    } else {
      merged.push({ ...slot });
    }
  }

  return merged;
}

export function wordsFromTSV(tsv: string): Word[] {
  return tsv
    .split("\n")
    .slice(1)
    .map((line) => line.split("\t"))
    .filter((c) => c[0] === "5" && c[11]?.trim())
    .map((c) => ({
      text: c.slice(11).join("\t").trim(),
      x: Number(c[6]),
      y: Number(c[7]),
      width: Number(c[8]),
      height: Number(c[9]),
    }));
}
