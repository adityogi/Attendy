import type { Slot } from "./domain";
export type Word = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
const names = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function interval(text: string) {
  const m = text.match(
    /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\s*[-–—]\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i,
  );
  if (!m) return null;
  function time(h: string, min: string | undefined, ampm: string | undefined) {
    let n = Number(h);
    if (ampm) {
      n %= 12;
      if (ampm.toLowerCase() === "pm") n += 12;
    }
    return `${String(n).padStart(2, "0")}:${min ?? "00"}`;
  }
  const start = time(m[1], m[2], m[3]),
    end = time(m[4], m[5], m[6]);
  return start < end ? { start, end } : null;
}
// Layout heuristics deliberately return drafts: merged cells and OCR mistakes need human review.
export function gridSlots(words: Word[]): Slot[] {
  const days = words.filter((w) =>
    /^(sun(day)?|mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?)$/i.test(
      w.text,
    ),
  );
  if (days.length < 2) return [];
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
    .filter((x) => x.time);
  if (!ranges.length) {
    const lines = new Map<number, Word[]>();
    for (const w of timeWords) {
      const k = Math.round(w.y / 15);
      lines.set(k, [...(lines.get(k) ?? []), w]);
    }
    for (const line of lines.values()) {
      const sorted = line.sort((a, b) => a.x - b.x);
      for (let i = 0; i < sorted.length; i++) {
        for (let n = 1; n <= 4 && i + n <= sorted.length; n++) {
          const part = sorted.slice(i, i + n),
            text = part.map((w) => w.text).join(" "),
            time = interval(text);
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
    ...new Map(days.map((d) => [d.text.slice(0, 3).toLowerCase(), d])).values(),
  ].sort((a, b) => (rowDays ? a.y - b.y : a.x - b.x));
  const ts = [...new Map(ranges.map((r) => [r.time!.start, r])).values()].sort(
    (a, b) => (rowDays ? a.word.x - b.word.x : a.word.y - b.word.y),
  );
  if (!ts.length) return [];
  const center = (w: Word, axis: "x" | "y") =>
    w[axis] + (axis === "x" ? w.width : w.height) / 2;
  const bound = (a: Word[], i: number, axis: "x" | "y", before: boolean) => {
    const current = center(a[i], axis),
      other = a[i + (before ? -1 : 1)];
    if (other) return (current + center(other, axis)) / 2;
    const gap =
      a.length > 1
        ? Math.abs(current - center(a[i + (before ? 1 : -1)], axis))
        : 100;
    return current + ((before ? -1 : 1) * gap) / 2;
  };
  const result: Slot[] = [];
  for (let di = 0; di < ds.length; di++)
    for (let ti = 0; ti < ts.length; ti++) {
      const daxis = rowDays ? "y" : "x",
        taxis = rowDays ? "x" : "y",
        tw = ts.map((t) => t.word);
      const tokens = words
        .filter((w) => {
          if (days.includes(w) || timeWords.includes(w)) return false;
          const d = center(w, daxis),
            t = center(w, taxis);
          return (
            d >= bound(ds, di, daxis, true) &&
            d < bound(ds, di, daxis, false) &&
            t >= bound(tw, ti, taxis, true) &&
            t < bound(tw, ti, taxis, false)
          );
        })
        .sort((a, b) => (Math.abs(a.y - b.y) > 12 ? a.y - b.y : a.x - b.x));
      const subject = tokens
        .map((w) => w.text)
        .join(" ")
        .replace(/[|]/g, "")
        .trim();
      if (!subject || /^(break|lunch|free|recess|[-–—]+)$/i.test(subject))
        continue;
      result.push({
        id: crypto.randomUUID(),
        subject,
        day: names.indexOf(ds[di].text.slice(0, 3).toLowerCase()),
        start: ts[ti].time!.start,
        end: ts[ti].time!.end,
        room: "",
      });
    }
  return result;
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
