import { useState } from "react";
import { Check, Cloud, LockKeyhole } from "lucide-react";
import { request } from "./api";
export default function Account({
  onLogin,
  onClose,
}: {
  onLogin: (data: any) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState("register"),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [recovery, setRecovery] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="auth">
      <span className="brandmark">
        <Check />
      </span>
      <h2>
        {mode === "register"
          ? "Your semester starts here."
          : mode === "recover"
            ? "Get back to your classes."
            : "Welcome back."}
      </h2>
      <p className="subtle">One account for your phone and your browser.</p>
      <div className="segmented">
        <button
          className={mode === "register" ? "selected" : ""}
          onClick={() => setMode("register")}
        >
          Create account
        </button>
        <button
          className={mode === "login" ? "selected" : ""}
          onClick={() => setMode("login")}
        >
          Sign in
        </button>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const data = await request(mode, null, {
              username,
              password,
              recoveryCode: recovery,
            });
            onLogin(data);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Username
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={40}
            pattern="[a-zA-Z0-9_.\-]{3,40}"
            placeholder="your.name"
          />
        </label>
        <label>
          {mode === "recover" ? "New password" : "Password"}
          <input
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={12}
            maxLength={256}
            placeholder="At least 12 characters"
          />
        </label>
        {mode === "recover" && (
          <label>
            Recovery code
            <input
              value={recovery}
              onChange={(e) => setRecovery(e.target.value)}
              required
              placeholder="The code saved when you signed up"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button className="primary full" disabled={busy}>
          {busy
            ? "Connecting…"
            : mode === "register"
              ? "Create my account"
              : mode === "recover"
                ? "Reset password"
                : "Sign in"}
        </button>
      </form>
      <button className="link-button" onClick={() => setMode("recover")}>
        Forgot your password?
      </button>
      <p className="auth-note">
        <LockKeyhole size={15} /> Your attendance belongs to you. Save your
        recovery code when you sign up.
      </p>
      <button className="text-button" onClick={onClose}>
        Continue exploring the sample
      </button>
    </div>
  );
}
