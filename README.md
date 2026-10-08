# Attendly

A React + TypeScript attendance website and Capacitor Android app, with a shared account backend. Built for separate, per-subject attendance tracking and leave forecasting. Kept local at your request; no public deployment or external account was created.

## Start here

Use Node.js 22 or newer and pnpm. From this folder:

```sh
pnpm install
pnpm build
pnpm db:local
pnpm preview
```

Open **http://localhost:8787**. This serves the production website and its local account backend together. Create an account in the app and save its recovery code. Real accounts start empty; the initial sample workspace is clearly labelled and does not become your actual history.

For development, keep two terminals running:

```sh
pnpm dev:api
```

```sh
pnpm dev
```

The development website is **http://127.0.0.1:5173** and forwards account requests to port 8787. Use a consistent URL; different browser origins have separate session caches. Local account data is stored in `.wrangler/state/`; keep that directory to preserve local accounts. It is deliberately excluded from the downloadable source archive.

## What is included

- **Actual attendance:** present, absent, cancelled, or unmarked for each scheduled class. Ordinary marking is restricted to today, enforced in both the UI and the account API. Past history is read-only except through the explicit import workflow. Future records are rejected even during import.
- **Separate leave planner:** choose a forecast start/end date, whole days or date ranges off, or individual classes. It assumes attendance at all other future classes. Planning never writes actual attendance.
- **Per-subject percentages:** no overall aggregate substitutes for a subject's requirement. Separate 1–100% sliders default to 85% for the tracker and planner.
- **Calendar:** day, month, and year views, touch-friendly attendance controls and mobile navigation.
- **Timetables:** image recognition, PDF/text extraction, CSV and JSON imports, editable review, manual entry, JSON export, and dated schedule versions. An initial timetable can start on 29 September 2026; subsequent updates preserve earlier schedules.
- **Holidays:** image/PDF, CSV, JSON, text and ICS calendar imports with review, plus manual date ranges. Holiday classes are excluded from both calculations.
- **History:** CSV column mapping, quoted-field handling, duplicate checks, CSV export and full JSON backup/restore. Repeated classes of one subject on a day are distinguished by slot ID or start time.
- **Accounts:** username/password sign-in, recovery codes, separate user data, hashed passwords and session tokens, expiring sessions, and basic login throttling.
- **Sync:** saves through a shared server, refreshes every 30 seconds and on focus, caches data locally, and detects conflicting edits. Pending changes remain on the device for retry or export.
- **Android:** generated Android Studio project; built-in file selection and native export sharing.
- **Installable web app:** manifest, icons, and production service worker. Once its assets are cached over HTTPS, the app can reopen offline. Image recognition files are bundled locally.

## Attendance rules

Tracking begins **2026-09-29** and dates use **Asia/Kolkata**. “Today” follows the real clock rather than being frozen at the start date. Keep your device clock correct; the server also checks its own date when accepting attendance changes.

For a subject, attendance is `present / (present + absent) × 100`. Cancelled classes and holidays are excluded. Unmarked past/current classes are **not** assumed present or absent; the app shows a warning and treats percentages as provisional.

Each timetable row is one class. A two-period lab can be entered as two rows if your college counts those periods separately. Use distinct subject names or codes for separate courses/labs, and reuse a name when its count should continue through a timetable update.

Forecast percentages cover the selected window. To include all attendance since tracking began, leave **From** at 29 September 2026. For an October-only prediction, set it to 1 October. Future classes use whichever timetable version applies on that date. Holiday overrides apply to all versions.

The tracker’s “can miss” number means additional future classes can be missed while keeping the target. The planner’s allowance means how many currently assumed-present classes **inside its fixed forecast window** can be changed to absences. Recovery counts assume consecutive attended classes after the measured period. A 100% target is unreachable once the period includes an absence.

## Uploads and examples

Try `examples/sample-timetable.png` to see image recognition. The complete 5-day / 15-class example was checked in the browser. Photo recognition uses Tesseract locally; no image is sent to an OCR API. English printed tables with weekday rows or columns and explicit time ranges work best. Merged cells, rotated/blurred photos, abbreviations, and unusual table layouts need manual review. Do not accept guessed rows without checking the reference image.

PDF uploads extract text, or OCR scanned pages. Image-grid recognition is strongest for image uploads; complex PDF grids may require corrected text or manual rows. Files are limited to 20 MB; PDFs to 12 pages. Photos and source PDFs are not stored in your account—only the reviewed structured data is synced.

Holiday dates accept ISO `YYYY-MM-DD`, `DD/MM/YYYY`, and dates such as `2 October 2026`. Include a year. ICS events with multi-day, all-day ranges use an exclusive end date. Review extracted holidays; the app is not a complete recurring-event ICS engine.

`examples/timetable.csv`, `examples/holidays.csv`, and `examples/history.csv` illustrate the import formats. These are examples, not your actual college calendar. The CSV mapper supports alternate column names; exact compatibility with the unspecified “RVC utility” format has not been verified against an original RVC export.

## Offline work and conflicts

A signed-in device keeps a local cache, while the server remains authoritative. Edits are queued if it is unavailable. A competing save causes a visible conflict rather than silently overwriting data: export the local copy, load the cloud copy, then selectively reapply or import the intended changes.

If a session expires, use **Sign in again**. Pending work for that username is preserved and retried against its original revision, so an intervening change on another device still produces a conflict.

An attendance mark queued offline on one date and uploaded after midnight can be rejected by the strict today-only server rule. Export it and use the explicit history import to restore that date. This preserves the separation between ordinary marking and historical corrections.

Local caches and backups contain attendance information. Sign out on a shared device once all work is synced. Full backups do not include passwords, authentication tokens, or recovery codes.

## Android

The `android/` folder is a real Capacitor Android Studio project sharing the React UI and calculation logic. It targets SDK 35, requires Android 8+ (API 26), and checks for Android System WebView 124+. An older WebView gets an update screen.

The Android app needs a reachable **HTTPS account backend** for cross-device sync. `localhost` in an installed app is its local asset host, not this computer. Follow `DEPLOYMENT.md`, then set the backend origin in a local `.env` file:

```dotenv
VITE_API_URL=https://YOUR-BACKEND-ORIGIN
```

Then:

```sh
pnpm android:sync
pnpm android:open
```

In Android Studio, install the requested SDK/build tools, select JDK 21 for Gradle, sync the project, then run on an emulator/device. Build an APK using the Build menu; use a signed release build for distribution. No release signing key is bundled. Native exports use Android’s share sheet; you can choose a file manager or other destination.

After any web source change, run `pnpm android:sync` again. For a website and backend deployed together, build the web version with `VITE_API_URL` empty; for Android or a separately hosted frontend, set it to the backend origin before building.

**Validation limit:** Android sources were generated and synchronized successfully. No APK was compiled and no Android emulator/device test was run because Java, Android Studio and the Android SDK were unavailable on this computer.

## Checks

```sh
pnpm test
pnpm build
# With the local backend running:
pnpm test:api
```

Tests cover subject isolation, date locks, forecast assumptions, holidays, cancelled/unmarked classes, timetable versions, rounding, 100% targets, CSV mapping/round trips, duplicates, ICS dates, and grid parsing. API integration checks create temporary local test accounts and verify authentication, sync, conflicts, user isolation, future-record rejection, recovery, logout, and CORS. Use a local test database for these tests.

Browser checks exercised marking today, future locking, independent planning, the image review workflow, and a 390-pixel mobile layout without horizontal overflow. The optional read-only WebMCP summary tool was checked with valid and invalid inputs.

## Project map

- `src/domain.ts`: dates, validation, class occurrences, recorded and forecast calculations.
- `src/App.tsx`, `Calendar.tsx`, `Editors.tsx`: product UI.
- `src/io.ts`, `grid.ts`: imports, exports, local OCR and table mapping.
- `src/useStore.ts`, `api.ts`: account sessions, synchronization and offline cache.
- `server/worker.ts`: account API and storage access.
- `db/schema.ts`, `drizzle/`: database schema and generated migration.
- `scripts/`: build, local OCR assets and service worker generation.
- `android/`: Android project.

Deployment options and configuration are in `DEPLOYMENT.md`.
