import { State, validateState } from "./domain";
const env = (import.meta as unknown as { env: Record<string, string> }).env;
export const API = (env.VITE_API_URL ?? "").replace(/\/$/, "");
export type Session = { token: string; username: string };
export async function request(
  path: string,
  session: Session | null,
  body?: unknown,
  method?: string,
) {
  const response = await fetch(API + "/api/" + path, {
    method: method ?? (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: "Bearer " + session.token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error(
      "The account server is unavailable. Start the backend or check the deployment URL.",
    );
  }
  if (!response.ok)
    throw Object.assign(Error(data.error ?? "Request failed."), {
      status: response.status,
    });
  return data;
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
