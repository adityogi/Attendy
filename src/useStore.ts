import { useCallback, useEffect, useRef, useState } from "react";
import { State, today, autoHealState } from "./domain";
import { cached, readSession, request, Session } from "./api";
export function useStore(initial: () => State) {
  const [session, setSession] = useState<Session | null>(readSession);
  const [state, setState] = useState<State>(() => {
    const u = readSession();
    let s = initial();
    if (u) s = cached(u)?.state ?? initial();
    else {
      try {
        const guest = localStorage.getItem("attendly-guest-state");
        if (guest) s = JSON.parse(guest);
      } catch {}
    }
    return autoHealState(s);
  });
  const [status, setStatus] = useState("Sample workspace");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(!session);
  const [clock, setClock] = useState(today());
  const [tick, setTick] = useState(0);
  const current = useRef(state),
    revision = useRef(0),
    pending = useRef(false),
    intent = useRef("edit"),
    busy = useRef(false),
    identity = useRef(session?.token);
  const cache = useCallback(
    (s: State, p: boolean) => {
      try {
        if (session) {
          localStorage.setItem(
            "attendly-cache-" + session.username,
            JSON.stringify({
              state: s,
              revision: revision.current,
              pending: p,
              intent: intent.current,
            }),
          );
        } else {
          localStorage.setItem("attendly-guest-state", JSON.stringify(s));
        }
      } catch {
        setError(
          "Device storage is full. Keep this tab open and export a backup.",
        );
      }
    },
    [session],
  );
  const refresh = useCallback(
    async (force = false) => {
      if (!session || busy.current || (pending.current && !force)) return;
      const token = session.token;
      try {
        const result = await request("state", session);
        if (identity.current !== token || (pending.current && !force)) return;
        const healed = autoHealState(result.state);
        const wasHealed = JSON.stringify(healed) !== JSON.stringify(result.state);
        revision.current = result.revision;
        pending.current = wasHealed;
        current.current = healed;
        setState(healed);
        cache(healed, wasHealed);
        if (wasHealed) {
          setTick((t) => t + 1);
        }
        setStatus(session.token.startsWith("local_") ? "All changes saved locally" : "All changes synced");
        setError("");
        setReady(true);
      } catch (e: any) {
        setError(e.message);
        setStatus("Offline · cached copy");
        if (cached(session)) setReady(true);
      }
    },
    [session, cache],
  );
  useEffect(() => {
    identity.current = session?.token;
    if (!session) {
      setReady(true);
      return;
    }
    const c = cached(session);
    if (c) {
      const healed = autoHealState(c.state);
      const wasHealed = JSON.stringify(healed) !== JSON.stringify(c.state);
      revision.current = c.revision;
      pending.current = c.pending || wasHealed;
      intent.current = c.intent;
      current.current = healed;
      setState(healed);
      if (wasHealed) {
        cache(healed, pending.current);
      }
      setReady(true);
      if (c.pending || wasHealed) {
        setStatus(session.token.startsWith("local_") ? "All changes saved locally" : "Changes waiting to sync");
        setTick((t) => t + 1);
        return;
      }
    }
    void refresh();
  }, [session]);
  useEffect(() => {
    const id = setInterval(() => {
      setClock(today());
      void refresh();
    }, 30000);
    const focus = () => {
      setClock(today());
      setTick((t) => t + 1);
      void refresh();
    };
    window.addEventListener("focus", focus);
    window.addEventListener("online", focus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", focus);
      window.removeEventListener("online", focus);
    };
  }, [refresh]);
  useEffect(() => {
    if (!session || !pending.current || busy.current) return;
    const timer = setTimeout(async () => {
      busy.current = true;
      const snapshot = current.current,
        token = session.token;
      setStatus("Saving changes…");
      try {
        const result = await request(
          "state",
          session,
          {
            state: snapshot,
            revision: revision.current,
            intent: intent.current,
          },
          "PUT",
        );
        if (identity.current !== token) return;
        revision.current = result.revision;
        if (current.current === snapshot) {
          pending.current = false;
          intent.current = "edit";
          cache(snapshot, false);
          setStatus("All changes synced");
          setError("");
        } else {
          cache(current.current, true);
          setTick((t) => t + 1);
        }
      } catch (e: any) {
        if (identity.current === token) {
          setStatus(
            e.status === 409
              ? "Sync conflict · changes kept locally"
              : "Changes waiting to sync",
          );
          setError(e.message);
          cache(current.current, true);
        }
      } finally {
        busy.current = false;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [state, session, tick, cache]);
  const update = (next: State | ((s: State) => State), mode = "edit") => {
    if (!ready)
      throw Error("Wait for your account to load before making changes.");
    const rawValue = typeof next === "function" ? next(current.current) : next;
    const value = autoHealState(rawValue);
    current.current = value;
    setState(value);
    if (session) {
      pending.current = !session.token.startsWith("local_");
      if (mode === "import") intent.current = "import";
      cache(value, pending.current);
      setStatus(session.token.startsWith("local_") ? "All changes saved locally" : "Changes waiting to sync");
    } else {
      cache(value, false);
      setStatus("Saved on device (Guest mode)");
    }
  };
  const login = (result: any) => {
    const u = { token: result.token, username: result.username };
    const pendingCopy = cached(u);
    if (pending.current && session && session.username !== u.username)
      throw Error(
        "Export your pending changes and load the cloud copy before switching accounts.",
      );
    const keepPending = pendingCopy?.pending === true;
    const value = keepPending ? pendingCopy.state : (result.state ?? current.current);
    identity.current = u.token;
    revision.current = keepPending ? pendingCopy.revision : result.revision;
    current.current = value;
    pending.current = keepPending;
    intent.current = keepPending ? pendingCopy.intent : "edit";
    setState(value);
    localStorage.setItem("attendly-session", JSON.stringify(u));
    localStorage.setItem(
      "attendly-cache-" + u.username,
      JSON.stringify({
        state: value,
        revision: revision.current,
        pending: keepPending,
        intent: intent.current,
      }),
    );
    setSession(u);
    setReady(true);
    setError("");
    setStatus(keepPending ? "Changes waiting to sync" : "All changes synced");
  };
  const logout = async () => {
    if (pending.current)
      throw Error(
        "Sync your pending changes, or export them and load the cloud copy before signing out.",
      );
    if (session) {
      await request("logout", session, {});
      localStorage.removeItem("attendly-cache-" + session.username);
    }
    localStorage.removeItem("attendly-session");
    identity.current = undefined;
    setSession(null);
    const fresh = initial();
    current.current = fresh;
    setState(fresh);
    setStatus("Sample workspace");
    setError("");
  };
  return {
    state,
    session,
    status,
    error,
    setError,
    update,
    login,
    logout,
    refresh,
    ready,
    clock,
    retry: () => setTick((t) => t + 1),
  };
}
