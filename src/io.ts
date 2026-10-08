import {
  Slot,
  State,
  RecordEntry,
  validDate,
  key,
  validateSlots,
  validateState,
  today,
  START,
} from "./domain";
import { Capacitor } from "@capacitor/core";
export async function download(
  name: string,
  text: string,
  type = "application/json",
) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } =
      await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const file = await Filesystem.writeFile({
      path: name,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: name, url: file.uri });
    return;
  }
  const u = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 3000);
}
export function csv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("The CSV contains an unclosed quote.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
const q = (s: string) => '"' + s.replaceAll('"', '""') + '"';
export const historyCSV = (s: State) =>
  [
    "date,subject,start,status,slot_id",
    ...Object.values(s.records)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
      .map((r) =>
        [r.date, r.subject, r.start, r.status, r.slotId].map(q).join(","),
      ),
  ].join("\r\n");
export function importHistory(
  text: string,
  s: State,
  columns?: {
    date: number;
    subject: number;
    start: number;
    status: number;
    slot: number;
  },
): State {
  const rows = csv(text.replace(/^\uFEFF/, ""));
  const head = rows.shift()!.map((x) => x.toLowerCase().replace(/[ _-]/g, ""));
  const index = (...names: string[]) =>
    head.findIndex((h) => names.includes(h));
  const c = columns ?? {
    date: index("date", "classdate"),
    subject: index("subject", "course", "coursename", "class"),
    start: index("start", "time", "starttime"),
    status: index("status", "attendance"),
    slot: index("slotid", "classid"),
  };
  if (c.date < 0 || c.subject < 0 || c.status < 0)
    throw Error("CSV needs date, subject and status columns.");
  const records = { ...s.records };
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    const date = parseDate(r[c.date]),
      subject = r[c.subject]?.trim(),
      start = r[c.start] || "09:00";
    const raw = r[c.status]?.toLowerCase();
    const status = (
      {
        p: "present",
        a: "absent",
        "1": "present",
        "0": "absent",
        present: "present",
        absent: "absent",
        cancelled: "cancelled",
        canceled: "cancelled",
      } as Record<string, RecordEntry["status"]>
    )[raw];
    if (
      !date ||
      date < START ||
      date > today() ||
      !subject ||
      !status ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(start)
    )
      throw Error(
        `Row ${i + 2}: check date, subject, time and status. Future attendance cannot be imported.`,
      );
    const active = [...s.versions]
      .filter((v) => v.effective <= date)
      .sort((a, b) => b.effective.localeCompare(a.effective))[0];
    const matches =
      active?.slots.filter(
        (x) =>
          x.day === new Date(date + "T12:00:00Z").getUTCDay() &&
          x.subject.toLowerCase() === subject.toLowerCase() &&
          (c.start < 0 || x.start === start),
      ) ?? [];
    if (c.slot < 0 && matches.length > 1)
      throw Error(
        `Row ${i + 2}: this subject meets more than once. Include start or slot_id.`,
      );
    const slotId = r[c.slot] || matches[0]?.id || `import-${subject}-${start}`;
    const k = key(date, slotId);
    if (seen.has(k))
      throw Error(`Row ${i + 2}: duplicate class on the same date.`);
    seen.add(k);
    records[k] = {
      date,
      subject: matches[0]?.subject ?? subject,
      start: matches[0]?.start ?? start,
      status,
      slotId,
    };
  });
  return validateState({ ...s, records });
}
export function parseDate(s: string): string | null {
  if (!s) return null;
  const x = s.trim();
  if (validDate(x)) return x;
  const d = x.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (d) {
    const iso = `${d[3]}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}`;
    return validDate(iso) ? iso : null;
  }
  const m = x.match(/^(\d{1,2})\s+([A-Za-z]+)[,\s]+(\d{4})$/);
  if (m) {
    const n =
      [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ].indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
    const iso = `${m[3]}-${String(n).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return validDate(iso) ? iso : null;
  }
  return null;
}
export function holidaysFromText(text: string) {
  const result: { date: string; name: string }[] = [];
  if (text.includes("BEGIN:VCALENDAR")) {
    for (const event of text.split("BEGIN:VEVENT").slice(1)) {
      const from = event.match(/DTSTART(?:;[^:]*)?:(\d{8})/),
        end = event.match(/DTEND(?:;[^:]*)?:(\d{8})/);
      if (!from) continue;
      const iso = (x: string) =>
        `${x.slice(0, 4)}-${x.slice(4, 6)}-${x.slice(6, 8)}`;
      const start = iso(from[1]),
        stop = end ? iso(end[1]) : null;
      let d = start;
      let limit = 0;
      do {
        if (validDate(d))
          result.push({
            date: d,
            name: event.match(/SUMMARY:(.*)/)?.[1]?.trim() ?? "College holiday",
          });
        const next = new Date(d + "T12:00:00Z");
        next.setUTCDate(next.getUTCDate() + 1);
        d = next.toISOString().slice(0, 10);
        limit++;
      } while (stop && d < stop && limit < 366);
    }
    return result;
  }
  for (const line of text.split("\n")) {
    const match = line.match(
      /\d{4}-\d{2}-\d{2}|\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4}|\d{1,2}\s+[A-Za-z]+[,\s]+\d{4}/,
    );
    if (match) {
      const date = parseDate(match[0]);
      if (date)
        result.push({
          date,
          name:
            line
              .replace(match[0], "")
              .replace(/^[\s,;|"-]+|[\s,;|"-]+$/g, "") || "College holiday",
        });
    }
  }
  return [...new Map(result.map((h) => [h.date, h])).values()];
}
const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
export function timetableFromCSV(text: string) {
  const rows = csv(text);
  const head = rows.shift()!.map((x) => x.toLowerCase());
  const idx = (name: string) => head.indexOf(name);
  return validateSlots(
    rows.map((r) => ({
      id: crypto.randomUUID(),
      subject: r[idx("subject")],
      day: weekdays.findIndex((d) =>
        d.startsWith((r[idx("day")] ?? "").toLowerCase().slice(0, 3)),
      ),
      start: r[idx("start")],
      end: r[idx("end")],
      room: r[idx("room")] ?? "",
    })),
  );
}
export function timetableFromText(text: string): Slot[] {
  const result: Slot[] = [];
  let day = -1;
  for (const line of text.split("\n")) {
    const lower = line.toLowerCase();
    const d = weekdays.findIndex((x) =>
      new RegExp(
        "\\b" + x.slice(0, 3) + "(?:" + x.slice(3) + ")?\\b",
        "i",
      ).test(lower),
    );
    if (d >= 0) day = d;
    const times = [...line.matchAll(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?/gi)];
    if (day < 0 || times.length < 2) continue;
    const time = (m: RegExpMatchArray) => {
      let hour = Number(m[1]);
      if (m[3]) {
        hour %= 12;
        if (m[3].toLowerCase() === "pm") hour += 12;
      }
      return `${String(hour).padStart(2, "0")}:${m[2]}`;
    };
    const subject = line
      .replace(
        /\b(sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b/gi,
        "",
      )
      .replace(/\b\d{1,2}[:.]\d{2}\s*(am|pm)?/gi, "")
      .replace(/^[\s|,:–—-]+|[\s|,:–—-]+$/g, "");
    if (subject)
      result.push({
        id: crypto.randomUUID(),
        day,
        subject,
        start: time(times[0]),
        end: time(times[1]),
        room: "",
      });
  }
  return result;
}
export async function extractText(
  file: File,
  onProgress: (s: string) => void,
): Promise<string> {
  if (file.size > 20 * 1024 * 1024)
    throw Error("Please choose a file smaller than 20 MB.");
  if (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    const pdf = await import("pdfjs-dist");
    pdf.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).href;
    const doc = await pdf.getDocument({ data: await file.arrayBuffer() })
      .promise;
    if (doc.numPages > 12)
      throw Error(
        "Please upload a calendar or timetable with 12 pages or fewer.",
      );
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      onProgress(`Reading page ${i} of ${doc.numPages}…`);
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const lines = new Map<number, string[]>();
      for (const item of content.items) {
        if ("str" in item) {
          const y = Math.round(item.transform[5] / 4) * 4;
          lines.set(y, [...(lines.get(y) ?? []), item.str]);
        }
      }
      const t = [...lines.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([, v]) => v.join(" "))
        .join("\n");
      if (t.trim().length > 30) text += t + "\n";
      else {
        const viewport = page.getViewport({ scale: 1.5 }),
          canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({
          canvas,
          canvasContext: canvas.getContext("2d")!,
          viewport,
        }).promise;
        text += (await ocr(canvas.toDataURL(), onProgress)) + "\n";
      }
    }
    return text;
  }
  if (file.type.startsWith("image/")) return ocr(file, onProgress);
  return file.text();
}
async function ocr(image: File | string, progress: (s: string) => void) {
  progress("Loading the image reader…");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: new URL("./ocr/worker.min.js", document.baseURI).href,
    corePath: new URL("./ocr/", document.baseURI).href,
    langPath: new URL("./ocr/", document.baseURI).href,
    logger: (m) => {
      if (m.status === "recognizing text")
        progress(`Reading your image… ${Math.round(m.progress * 100)}%`);
    },
  });
  try {
    const result = await worker.recognize(image);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}
export async function extractTimetableImage(
  file: File,
  onProgress: (s: string) => void,
) {
  if (file.size > 20 * 1024 * 1024)
    throw Error("Please choose a file smaller than 20 MB.");
  const { createWorker } = await import("tesseract.js");
  const { gridSlots, wordsFromTSV } = await import("./grid");
  const worker = await createWorker("eng", 1, {
    workerPath: new URL("./ocr/worker.min.js", document.baseURI).href,
    corePath: new URL("./ocr/", document.baseURI).href,
    langPath: new URL("./ocr/", document.baseURI).href,
    logger: (m) => {
      if (m.status === "recognizing text")
        onProgress(`Reading your timetable… ${Math.round(m.progress * 100)}%`);
    },
  });
  try {
    const { data } = await worker.recognize(
      file,
      {},
      { text: true, tsv: true },
    );
    const grid = gridSlots(wordsFromTSV(data.tsv ?? ""));
    return {
      text: data.text,
      slots: grid.length ? grid : timetableFromText(data.text),
    };
  } finally {
    await worker.terminate();
  }
}
