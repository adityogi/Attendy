import assert from "node:assert/strict";
const origin = "http://127.0.0.1:8787";
const suffix = crypto.randomUUID().slice(0, 8),
  username = "test_" + suffix,
  password = crypto.randomUUID() + "-password";
async function call(path, body, token, method) {
  const r = await fetch(origin + "/api/" + path, {
    method: method ?? (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, data: await r.json() };
}
const a = await call("register", { username, password });
assert.equal(a.status, 200);
assert.equal(a.data.state.versions.length, 0);
assert.ok(a.data.recoveryCode);
console.log("PASS account creation starts with empty real data");
assert.equal((await call("state")).status, 401);
assert.equal(
  (await call("login", { username, password: "incorrect-password" })).status,
  401,
);
console.log("PASS authentication required; incorrect password rejected");
const b = await call("login", { username, password });
assert.equal(b.status, 200);
assert.notEqual(a.data.token, b.data.token);
let state = a.data.state;
state.actualTarget = 90;
const saved = await call(
  "state",
  { state, revision: 0, intent: "edit" },
  a.data.token,
  "PUT",
);
assert.equal(saved.status, 200);
assert.equal(saved.data.revision, 1);
assert.equal(
  (await call("state", null, b.data.token)).data.state.actualTarget,
  90,
);
console.log("PASS cross-device sync");
assert.equal(
  (
    await call(
      "state",
      { state, revision: 0, intent: "edit" },
      b.data.token,
      "PUT",
    )
  ).status,
  409,
);
console.log("PASS concurrent update conflict cannot overwrite cloud data");
const c = await call("register", { username: username + "_other", password });
assert.equal(
  (await call("state", null, c.data.token)).data.state.actualTarget,
  85,
);
console.log("PASS account data isolation");
const bad = structuredClone(state);
bad.records["2099-01-01|m"] = {
  date: "2099-01-01",
  slotId: "m",
  subject: "Math",
  start: "09:00",
  status: "present",
};
assert.equal(
  (
    await call(
      "state",
      { state: bad, revision: 1, intent: "import" },
      a.data.token,
      "PUT",
    )
  ).status,
  400,
);
console.log("PASS future records rejected even through import");
const recovered = await call("recover", {
  username,
  password: "new-" + password,
  recoveryCode: a.data.recoveryCode,
});
assert.equal(recovered.status, 200);
assert.equal((await call("state", null, a.data.token)).status, 401);
assert.equal((await call("state", null, b.data.token)).status, 401);
console.log("PASS password recovery revokes old sessions");
assert.equal((await call("logout", {}, recovered.data.token)).status, 200);
assert.equal((await call("state", null, recovered.data.token)).status, 401);
console.log("PASS logout revokes session");
const cors = await fetch(origin + "/api/state", {
  headers: {
    Origin: "https://untrusted.example",
    Authorization: "Bearer " + c.data.token,
  },
});
assert.equal(cors.status, 403);
console.log("PASS unexpected browser origins blocked");
