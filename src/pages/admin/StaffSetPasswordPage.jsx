import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { acceptStaffInvite, getStaffInvite } from "../../lib/store";

function passwordChecks(password, confirmPassword) {
  const value = String(password || "");
  const confirm = String(confirmPassword || "");
  return {
    length: value.length >= 8,
    letter: /[A-Za-z]/.test(value),
    number: /\d/.test(value),
    match: confirm.length > 0 && value === confirm,
  };
}

export default function StaffSetPasswordPage() {
  const [params] = useSearchParams();
  const token = String(params.get("token") || "").trim();
  const invite = useMemo(() => getStaffInvite(token), [token]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const pwd = passwordChecks(password, confirm);

  function onSubmit(e) {
    e.preventDefault();
    if (!pwd.length || !pwd.letter || !pwd.number) {
      setError("Password needs 8+ characters, a letter, and a number.");
      return;
    }
    if (!pwd.match) {
      setError("Passwords do not match.");
      return;
    }
    const result = acceptStaffInvite({ token, password });
    if (!result.ok) {
      setError(
        result.error === "expired"
          ? "This invite link has expired. Ask sales to send a new invite."
          : result.error === "password"
            ? "Password needs 8+ characters, a letter, and a number."
            : "This invite link is not valid."
      );
      return;
    }
    window.location.assign("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-ink shadow-[0_24px_60px_rgba(16,21,19,0.25)]">
        <div className="flex items-center gap-2.5">
          <img src="/assets/mattex-logo.png" alt="" className="h-8 w-auto shrink-0" />
          <span className="text-[15px] sm:text-lg font-semibold leading-tight tracking-tight text-brand-900">
            Mattex Marketplace Admin Portal
          </span>
        </div>
        <h1 className="mt-5 font-display text-2xl text-brand-900">Set your password</h1>
        {!invite ? (
          <p className="mt-3 text-sm text-mute">This invite link is not valid. Ask a teammate to send a new invite.</p>
        ) : invite.expired ? (
          <p className="mt-3 text-sm text-mute">This invite link has expired. Ask a teammate to send a new invite.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-mute">
              {invite.name ? `${invite.name} · ` : ""}
              {invite.email}
            </p>
            <form className="mt-5 space-y-3" onSubmit={onSubmit}>
              <label className="block text-sm font-medium">
                New password
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-sm font-medium">
                Confirm password
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                  autoComplete="new-password"
                />
              </label>
              <ul className="rounded-lg border border-line bg-paper/60 px-3 py-2 text-xs text-mute space-y-1">
                <li>{pwd.length ? "✓" : "○"} At least 8 characters</li>
                <li>{pwd.letter ? "✓" : "○"} At least 1 letter</li>
                <li>{pwd.number ? "✓" : "○"} At least 1 number</li>
                <li>{pwd.match ? "✓" : "○"} Passwords match</li>
              </ul>
              {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
              <button type="submit" className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white">
                Save password and enter portal
              </button>
            </form>
          </>
        )}
        <p className="mt-4 text-xs text-mute">
          Already set a password? <Link to="/" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
