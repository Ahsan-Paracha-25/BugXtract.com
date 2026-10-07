"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminEditor } from "./editor";
import "./portal.css";

type Status = { configured: boolean; authenticated: boolean; username: string | null };

export function AdminPortal() {
  const [status, setStatus] = useState<Status | null>(null);
  const [mode, setMode] = useState<"setup" | "login" | "recovery">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refreshStatus() {
    const response = await fetch("/api/admin/auth/status", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error("Admin login is temporarily unavailable.");
    const data = await response.json() as Status;
    setStatus(data);
    setMode(data.configured ? "login" : "setup");
  }

  useEffect(() => { refreshStatus().catch(() => setError("Could not connect to admin login. Refresh and try again.")); }, []);

  async function submit(event: FormEvent<HTMLFormElement>, endpoint: string, fields: string[]) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const values = new FormData(event.currentTarget);
    const body: Record<string, string> = {};
    for (const field of fields) body[field] = String(values.get(field) ?? "");
    if (body.password !== body.confirmPassword && body.confirmPassword !== undefined) { setError("Passwords do not match."); setBusy(false); return; }
    delete body.confirmPassword;
    try {
      const response = await fetch(endpoint, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Request failed.");
      if (endpoint.endsWith("/login")) setNotice("Signed in successfully.");
      if (endpoint.endsWith("/setup")) setNotice("Admin username and password are set.");
      if (endpoint.endsWith("/recovery")) setNotice("Login details have been reset. Your recovery code is now used.");
      await refreshStatus();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not complete the request."); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST", credentials: "same-origin" });
    await refreshStatus().catch(() => {});
    setNotice("You have signed out.");
  }

  if (status?.authenticated) return <AdminEditor onLogout={logout} username={status.username ?? ""} />;
  if (!status && !error) return <main className="admin-shell"><section className="admin-card"><p className="admin-kicker">BugXtract.com · Admin</p><h1>Checking sign-in…</h1></section></main>;

  const setup = mode === "setup" && !status?.configured;
  const recovery = mode === "recovery";
  const title = setup ? "Set up your admin login" : recovery ? "Recover admin login" : "Admin sign in";
  const endpoint = setup ? "/api/admin/auth/setup" : recovery ? "/api/admin/auth/recovery" : "/api/admin/auth/login";
  const fields = setup ? ["setupCode", "username", "password", "confirmPassword"] : recovery ? ["recoveryCode", "username", "password", "confirmPassword"] : ["username", "password"];
  return <main className="admin-shell"><section className="admin-card">
    <p className="admin-kicker">BugXtract.com · Secure admin</p><h1>{title}</h1>
    <p>{setup ? "Use the one-time setup code to choose the username and password you will use for future sign-ins." : recovery ? "Use your one-time recovery code to set a new username and password." : "Sign in with the username and password you set for this admin panel."}</p>
    {error && <p className="admin-message error" role="alert">{error}</p>}{notice && <p className="admin-message" role="status">{notice}</p>}
    <form className="admin-login-form" onSubmit={event => submit(event, endpoint, fields)}>
      {setup && <label>One-time setup code<input name="setupCode" type="password" autoComplete="one-time-code" required /></label>}
      {recovery && <label>One-time recovery code<input name="recoveryCode" type="password" autoComplete="one-time-code" required /></label>}
      <label>Username<input name="username" minLength={3} maxLength={40} autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" minLength={12} maxLength={128} autoComplete={setup || recovery ? "new-password" : "current-password"} required /></label>
      {(setup || recovery) && <label>Confirm password<input name="confirmPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>}
      <button className="admin-button" disabled={busy}>{busy ? "Please wait…" : setup ? "Create admin login" : recovery ? "Reset admin login" : "Sign in"}</button>
    </form>
    {status?.configured && <button className="admin-link-button" onClick={() => { setMode(recovery ? "login" : "recovery"); setError(""); setNotice(""); }}>{recovery ? "Back to sign in" : "Forgot your login? Use recovery code"}</button>}
    <a className="admin-back" href="/">Back to website</a>
    <p className="admin-security-note">Admin login is private. Use a unique password with at least 12 characters.</p>
  </section></main>;
}
