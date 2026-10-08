// src/domain.ts
var START = "2026-09-29";
var ZONE = "Asia/Kolkata";
var emptyState = () => ({
  schema: 1,
  versions: [],
  records: {},
  holidays: [],
  leaveDays: [],
  leaveSlots: [],
  actualTarget: 85,
  planTarget: 85
});
var today = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(/* @__PURE__ */ new Date());
var validDate = (x) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && !isNaN(Date.parse(x)) && new Date(x).toISOString().slice(0, 10) === x;
var key = (date, slotId) => date + "|" + slotId;
function validateSlots(slots) {
  if (!Array.isArray(slots) || slots.length > 200)
    throw Error("Timetable must contain up to 200 classes.");
  const ids = /* @__PURE__ */ new Set();
  return slots.map((x) => {
    if (!x || typeof x.subject !== "string" || !x.subject.trim() || x.subject.length > 100 || !Number.isInteger(x.day) || x.day < 0 || x.day > 6 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.end) || x.start >= x.end)
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
      room: String(x.room ?? "").slice(0, 100)
    };
  });
}
function validateState(value, now = today()) {
  const x = value;
  if (!x || x.schema !== 1 || !Array.isArray(x.versions) || !x.records || typeof x.records !== "object" || Array.isArray(x.records) || !Array.isArray(x.holidays) || !Array.isArray(x.leaveDays) || !Array.isArray(x.leaveSlots))
    throw Error("This is not an Attendly backup.");
  if (x.versions.length > 200 || Object.keys(x.records).length > 5e4 || x.holidays.length > 4e3)
    throw Error("This file is too large.");
  const effective = /* @__PURE__ */ new Set();
  const versions = x.versions.map((v) => {
    if (!validDate(v.effective) || v.effective < START || effective.has(v.effective) || typeof v.id !== "string")
      throw Error("Invalid timetable effective date.");
    effective.add(v.effective);
    return { ...v, slots: validateSlots(v.slots) };
  });
  for (const [k, r] of Object.entries(x.records)) {
    if (!validDate(r.date) || r.date < START || r.date > now || !["present", "absent", "cancelled"].includes(r.status) || typeof r.subject !== "string" || !r.subject.trim() || typeof r.slotId !== "string" || k !== key(r.date, r.slotId) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.start))
      throw Error(
        "History must have valid past or present dates, subjects, and statuses."
      );
  }
  for (const h of x.holidays)
    if (!validDate(h.date) || typeof h.name !== "string")
      throw Error("Invalid holiday.");
  for (const d of x.leaveDays)
    if (!validDate(d) || d < START) throw Error("Invalid leave date.");
  for (const k of x.leaveSlots)
    if (typeof k !== "string" || !validDate(k.split("|")[0]) || k.split("|").length !== 2)
      throw Error("Invalid planned class.");
  for (const t of [x.actualTarget, x.planTarget])
    if (!Number.isFinite(t) || t < 1 || t > 100)
      throw Error("Targets must be between 1 and 100.");
  return { ...x, versions };
}

// server/worker.ts
var enc = new TextEncoder();
var hex = (a) => [...new Uint8Array(a)].map((b) => b.toString(16).padStart(2, "0")).join("");
var random = () => hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
var hash = async (s) => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
async function passwordHash(p, salt) {
  const key2 = await crypto.subtle.importKey(
    "raw",
    enc.encode(p),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return hex(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: 1e5,
        hash: "SHA-256"
      },
      key2,
      256
    )
  );
}
function equal(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
var fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
var worker_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(req);
    const origin = req.headers.get("Origin");
    const allowed = !origin || origin === url.origin || (env.ALLOWED_ORIGINS ?? "").split(",").includes(origin);
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin"
    };
    if (origin && allowed) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers.Vary = "Origin";
      headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
      headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, OPTIONS";
    }
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
    try {
      if (!allowed)
        return json({ error: "This app origin is not allowed." }, 403);
      if (req.method === "OPTIONS")
        return new Response(null, { status: 204, headers });
      if (req.method === "GET" && url.pathname === "/api/health")
        return json({ ok: true, today: today(), start: START });
      let body = {};
      if (["POST", "PUT"].includes(req.method)) {
        if (!req.headers.get("Content-Type")?.includes("application/json"))
          fail("JSON is required.", 415);
        const raw = await req.text();
        if (raw.length > 4e6) fail("The import is too large.", 413);
        try {
          body = JSON.parse(raw);
        } catch {
          fail("Invalid JSON.");
        }
      }
      if (["/api/register", "/api/login", "/api/recover"].includes(
        url.pathname
      ) && req.method === "POST") {
        const username = String(body.username ?? "").toLowerCase().trim(), password = String(body.password ?? "");
        if (!/^[a-z0-9_.-]{3,40}$/.test(username))
          fail(
            "Use 3\u201340 letters, numbers, dots, dashes, or underscores for your username."
          );
        if (password.length < 12 || password.length > 256)
          fail("Choose a password with 12\u2013256 characters.");
        const now = Date.now(), ip = req.headers.get("CF-Connecting-IP") ?? "local";
        const attemptKey = await hash(ip + "|" + username);
        const attempt = await env.DB.prepare(
          "INSERT INTO attempts (key,count,reset) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset<? THEN 1 ELSE count+1 END, reset=CASE WHEN reset<? THEN ? ELSE reset END RETURNING count"
        ).bind(attemptKey, now + 9e5, now, now, now + 9e5).first();
        if (attempt.count > 10)
          fail("Too many attempts. Try again in 15 minutes.", 429);
        let user = await env.DB.prepare("SELECT * FROM users WHERE username=?").bind(username).first();
        let recoveryCode;
        if (url.pathname === "/api/register") {
          if (user) fail("That username is unavailable.");
          const id = crypto.randomUUID(), salt = random();
          recoveryCode = random();
          user = {
            id,
            username,
            salt,
            password: await passwordHash(password, salt)
          };
          try {
            await env.DB.batch([
              env.DB.prepare(
                "INSERT INTO users (id,username,salt,password,recovery,created) VALUES (?,?,?,?,?,?)"
              ).bind(
                id,
                username,
                salt,
                user.password,
                await hash(recoveryCode),
                now
              ),
              env.DB.prepare(
                "INSERT INTO states (user_id,data,revision) VALUES (?,?,0)"
              ).bind(id, JSON.stringify(emptyState()))
            ]);
          } catch {
            fail(
              "Unable to create this account. Choose another username or try again."
            );
          }
        } else if (url.pathname === "/api/recover") {
          if (!user || !equal(user.recovery, await hash(String(body.recoveryCode ?? ""))))
            fail("Username or recovery code is incorrect.", 401);
          const salt = random();
          recoveryCode = random();
          await env.DB.batch([
            env.DB.prepare(
              "UPDATE users SET salt=?,password=?,recovery=? WHERE id=?"
            ).bind(
              salt,
              await passwordHash(password, salt),
              await hash(recoveryCode),
              user.id
            ),
            env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(
              user.id
            )
          ]);
        } else {
          const computed = await passwordHash(
            password,
            user?.salt ?? "invalid-account"
          );
          if (!user || !equal(user.password, computed))
            fail("Username or password is incorrect.", 401);
        }
        const token2 = random();
        await env.DB.prepare(
          "INSERT INTO sessions (token,user_id,expires) VALUES (?,?,?)"
        ).bind(await hash(token2), user.id, now + 30 * 864e5).run();
        await env.DB.prepare("DELETE FROM sessions WHERE expires<?").bind(now).run();
        await env.DB.prepare("DELETE FROM attempts WHERE reset<?").bind(now).run();
        const state = await env.DB.prepare(
          "SELECT data,revision FROM states WHERE user_id=?"
        ).bind(user.id).first();
        return json({
          token: token2,
          username,
          state: JSON.parse(state.data),
          revision: state.revision,
          recoveryCode
        });
      }
      const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
      if (!token) fail("Please sign in.", 401);
      const tokenHash = await hash(token);
      const session = await env.DB.prepare(
        "SELECT user_id FROM sessions WHERE token=? AND expires>?"
      ).bind(tokenHash, Date.now()).first();
      if (!session) fail("Your session expired. Please sign in again.", 401);
      if (url.pathname === "/api/logout" && req.method === "POST") {
        await env.DB.prepare("DELETE FROM sessions WHERE token=?").bind(tokenHash).run();
        return json({ ok: true });
      }
      if (url.pathname === "/api/state" && req.method === "GET") {
        const row = await env.DB.prepare(
          "SELECT data,revision FROM states WHERE user_id=?"
        ).bind(session.user_id).first();
        return json({ state: JSON.parse(row.data), revision: row.revision });
      }
      if (url.pathname === "/api/state" && req.method === "PUT") {
        const state = validateState(body.state);
        if (!Number.isInteger(body.revision) || body.revision < 0)
          fail("Invalid revision.");
        const old = await env.DB.prepare(
          "SELECT data,revision FROM states WHERE user_id=?"
        ).bind(session.user_id).first();
        if (old.revision !== body.revision)
          fail(
            "Another device saved changes. Export your pending changes, then reload the cloud copy.",
            409
          );
        if (body.intent !== "import") {
          const prev = JSON.parse(old.data);
          for (const k of /* @__PURE__ */ new Set([
            ...Object.keys(prev.records),
            ...Object.keys(state.records)
          ])) {
            if (JSON.stringify(prev.records[k]) !== JSON.stringify(state.records[k]) && (state.records[k]?.date ?? prev.records[k]?.date) !== today())
              fail(
                "Only today\u2019s attendance can be changed. Use the history import to restore past records."
              );
          }
        }
        const result = await env.DB.prepare(
          "UPDATE states SET data=?,revision=revision+1 WHERE user_id=? AND revision=? RETURNING revision"
        ).bind(JSON.stringify(state), session.user_id, body.revision).first();
        if (!result)
          fail(
            "Another device updated this account. Reload the cloud copy before saving.",
            409
          );
        return json({ revision: result.revision });
      }
      return json({ error: "Not found." }, 404);
    } catch (e) {
      if (!e.status && !(e instanceof Error))
        console.error("Unexpected API failure");
      const status = e.status ?? (e.message?.includes("D1") ? 503 : 400);
      return json(
        {
          error: status === 503 ? "Account storage is unavailable. Your pending changes are still on this device." : e.message ?? "The request failed."
        },
        status
      );
    }
  }
};
export {
  worker_default as default
};
