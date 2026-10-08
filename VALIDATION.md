# Validation record

Completed 30 September 2026.

- Production website and account Worker build: passed.
- Automated attendance/import checks: **22 passed**.
- Local API integration checks: **9 groups passed** (account creation, required authentication, cross-device sync, stale-write conflicts, user isolation, future-record rejection, password recovery/session revocation, logout, and origin restrictions).
- Browser: actual marking updated Mathematics alone; tomorrow’s controls were disabled; adding a planned day off changed the forecast without changing recorded attendance.
- Mobile: 390-pixel layout checked; document width matched viewport width, with no horizontal overflow.
- Timetable photo: bundled local Tesseract engine read all **15 classes** from `examples/sample-timetable.png`, including correct weekdays and time ranges. Results appeared in the editable review dialog.
- Optional browser summary tool: valid input returned visible per-subject data; unexpected parameters were rejected.
- Android: project creation and final Capacitor sync passed; current web assets and native file/share plugins copied successfully. Android resource XML parsed successfully.

Not verified: an APK build, emulator/device behavior, public hosting, the user's actual timetable or holiday image (not yet supplied), and a specific RVC utility export. Those limitations are described in the setup guide. No app was publicly deployed.
