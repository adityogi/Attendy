# Attendy

A minimal, offline attendance tracker. No login, no backend.

Attendance numbers are hard-coded in `src/data.ts` from the RVCE progress report
plus the classes attended or skipped after each subject's "as on" date.
Use the buttons on each card to log further classes (stored on the device).

## Web
    npm install
    npm run dev

## Android
    npm install
    npm run android:sync
    npm run android:open   # opens Android Studio; press Run
