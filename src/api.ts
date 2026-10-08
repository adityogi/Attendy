import { emptyState, State, validateState } from "./domain";
const env = (import.meta as unknown as { env: Record<string, string> }).env;
export const API = (env.VITE_API_URL ?? "").replace(/\/$/, "");
export type Session = { token: string; username: string };

function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const parts: string[] = [];
  for (let i = 0; i < 4; i++) {
    let p = "";
    for (let j = 0; j < 4; j++) {
      p += chars[Math.floor(Math.random() * chars.length)];
    }
    parts.push(p);
  }
  return parts.join("-");
}

function handleLocalRequest(
  path: string,
  session: Session | null,
  body?: any,
  method?: string,
) {
  if (path === "register") {
    const username = String(body?.username ?? "").toLowerCase().trim();
    if (!username) throw Error("Username is required.");
    const recoveryCode = body?.recoveryCode?.trim() || generateRecoveryCode();
    const token = "local_" + crypto.randomUUID();
    const existing = localStorage.getItem("attendly-user-" + username);
    if (existing) {
      throw Error("This username already exists on this device. Sign in instead.");
    }
    localStorage.setItem(
      "attendly-user-" + username,
      JSON.stringify({
        username,
        recoveryCode,
        createdAt: new Date().toISOString(),
      }),
    );
    let state = null;
    try {
      const guest = localStorage.getItem("attendly-guest-state");
      if (guest) state = validateState(JSON.parse(guest));
    } catch {}
    return {
      token,
      username,
      recoveryCode,
      revision: 1,
      state: state ?? emptyState(),
    };
  }

  if (path === "login") {
    const username = String(body?.username ?? "").toLowerCase().trim();
    const token = "local_" + crypto.randomUUID();
    let state = null;
    try {
      const cachedData = JSON.parse(
        localStorage.getItem("attendly-cache-" + username) ?? "null",
      );
      if (cachedData?.state) state = validateState(cachedData.state);
    } catch {}
    return {
      token,
      username,
      revision: 1,
      state,
    };
  }

  if (path === "recover") {
    const username = String(body?.username ?? "").toLowerCase().trim();
    const existingStr = localStorage.getItem("attendly-user-" + username);
    if (!existingStr) {
      throw Error("No local account found for this username.");
    }
    const existing = JSON.parse(existingStr);
    if (
      body?.recoveryCode?.trim().toUpperCase() !==
      existing.recoveryCode?.toUpperCase()
    ) {
      throw Error("Invalid recovery code.");
    }
    return {
      token: "local_" + crypto.randomUUID(),
      username,
      revision: 1,
    };
  }

  if (path === "state") {
    const username = session?.username ?? "guest";
    if (method === "PUT") {
      const nextRev = (body?.revision ?? 0) + 1;
      return { revision: nextRev };
    }
    let state = null;
    try {
      const cachedData = JSON.parse(
        localStorage.getItem("attendly-cache-" + username) ?? "null",
      );
      if (cachedData?.state) state = validateState(cachedData.state);
    } catch {}
    return {
      revision: 1,
      state: state ?? emptyState(),
    };
  }

  if (path === "logout") {
    return { ok: true };
  }

  return { ok: true };
}

export async function request(
  path: string,
  session: Session | null,
  body?: unknown,
  method?: string,
) {
  // If session is a local device session, process locally without network:
  if (session?.token?.startsWith("local_")) {
    return handleLocalRequest(path, session, body, method);
  }

  // If remote backend API is configured, attempt remote fetch:
  if (API) {
    try {
      const response = await fetch(API + "/api/" + path, {
        method: method ?? (body ? "POST" : "GET"),
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: "Bearer " + session.token } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(10000),
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw Error("The account server response was not valid JSON.");
      }
      if (!response.ok)
        throw Object.assign(Error(data.error ?? "Request failed."), {
          status: response.status,
        });
      return data;
    } catch (err: any) {
      // If remote backend is unreachable and user is registering/logging in, fall back gracefully to local account:
      if (["register", "login", "recover"].includes(path)) {
        return handleLocalRequest(path, session, body, method);
      }
      throw Error(
        "The account server is unavailable. Start the backend or check the deployment URL.",
      );
    }
  }

  // If no remote API is configured (e.g. standalone Vercel hosting):
  return handleLocalRequest(path, session, body, method);
}

export const readSession = (): Session | null => {
  try {
    return JSON.parse(localStorage.getItem("attendly-session") ?? "null");
  } catch {
    return null;
  }
};

export function cached(
  session: Session,
): { state: State; revision: number; pending: boolean; intent: string } | null {
  try {
    const value = JSON.parse(
      localStorage.getItem("attendly-cache-" + session.username) ?? "null",
    );
    if (!value) return null;
    return { ...value, state: validateState(value.state) };
  } catch {
    return null;
  }
}
