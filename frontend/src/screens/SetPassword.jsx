import React, { useMemo, useState } from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import { apiRequest } from "../utils/api.js";
import { storageKeys, writeSession } from "../utils/storage.js";

export default function SetPassword({ notify, onAuthenticated }) {
  const token = useMemo(() => {
    const hash = window.location.hash.replace("#set-password", "");
    return new URLSearchParams(hash.startsWith("?") ? hash : `?${hash}`).get("token") || "";
  }, []);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    setBusy(true);
    apiRequest("/api/auth/setup-password", {
      method: "POST",
      body: JSON.stringify({ token, ...form }),
    })
      .then((data) => {
        writeSession(storageKeys.currentUser, data.user);
        notify(data.message);
        onAuthenticated?.(data.user);
      })
      .catch((error) => notify(error.message || "Could not create password."))
      .finally(() => setBusy(false));
  };

  return (
    <section id="set-password" className="app-section auth-section" aria-labelledby="set-password-title">
      <SectionHeading eyebrow="Official account" title="Create your password.">
        Use the invite link from your email to create a password before logging in as a government official.
      </SectionHeading>
      <form className="auth-panel setup-panel" onSubmit={submit}>
        <label className="field">
          <span>New password</span>
          <input required minLength="8" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        <label className="field">
          <span>Confirm password</span>
          <input required minLength="8" type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
        </label>
        <button className="button primary" type="submit" disabled={busy || !token}>{busy ? "Saving" : "Create password"}</button>
        {!token && <p className="form-signal error">Invite token is missing. Open the link from your email again.</p>}
      </form>
    </section>
  );
}
