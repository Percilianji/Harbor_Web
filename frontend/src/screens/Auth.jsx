import React, { useState } from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import { apiRequest } from "../utils/api.js";
import { storageKeys, writeStored } from "../utils/storage.js";

const emptySignup = {
  privateName: "",
  password: "",
  confirmPassword: "",
  recoveryEmail: "",
};

const emptyLogin = {
  privateName: "",
  password: "",
};

export default function Auth({ notify, onAuthenticated }) {
  const [mode, setMode] = useState("signup");
  const [signup, setSignup] = useState(emptySignup);
  const [login, setLogin] = useState(emptyLogin);
  const [currentUser, setCurrentUser] = useState(null);
  const [formStatus, setFormStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const showStatus = (type, message) => {
    setFormStatus({ type, message });
    notify(message);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFormStatus(null);
  };

  const handleSignup = (event) => {
    event.preventDefault();
    setFormStatus(null);

    if (signup.password !== signup.confirmPassword) {
      showStatus("error", "Passwords do not match.");
      return;
    }

    setBusy(true);
    apiRequest("/api/auth/signup", { method: "POST", body: JSON.stringify(signup) })
      .then((data) => {
        setCurrentUser(data.user);
        writeStored(storageKeys.currentUser, data.user);
        setSignup(emptySignup);
        onAuthenticated?.(data.user);
        showStatus("success", data.message);
      })
      .catch((error) => showStatus("error", error.message || "Signup failed. Try another private name."))
      .finally(() => setBusy(false));
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setFormStatus(null);
    setBusy(true);
    apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(login) })
      .then((data) => {
        setCurrentUser(data.user);
        writeStored(storageKeys.currentUser, data.user);
        setLogin(emptyLogin);
        onAuthenticated?.(data.user);
        showStatus("success", data.message);
      })
      .catch((error) => {
        showStatus("error", error.message || "Private name or password is incorrect.");
        if (error.status === 404) setMode("signup");
      })
      .finally(() => setBusy(false));
  };

  return (
    <section id="auth" className="app-section auth-section" aria-labelledby="auth-title">
      <SectionHeading eyebrow="Private access" title="Use a private name, not your legal name.">
        Create a private account so drafts, journal entries, and vault records can stay connected to you when you return.
      </SectionHeading>

      <div className="auth-layout">
        <aside className="auth-info" aria-label="Private account details">
          <h3>What this means</h3>
          <p>Community users can create a private account. Government accounts are created by a Harbor admin before login.</p>
          <ul className="lesson-points">
            <li>No legal name required.</li>
            <li>Use a strong password.</li>
            <li>Government officials log in with the account created for them.</li>
            <li>Super admins log in with the configured admin email and password.</li>
          </ul>
          {currentUser && (
            <div className="auth-success">
              <strong>Signed in as {currentUser.privateName}</strong>
              <span>Your private account is ready.</span>
            </div>
          )}
        </aside>

        <div className="auth-panel">
          <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
            <button className={mode === "signup" ? "active" : ""} type="button" role="tab" aria-selected={mode === "signup"} onClick={() => switchMode("signup")}>Sign up</button>
            <button className={mode === "login" ? "active" : ""} type="button" role="tab" aria-selected={mode === "login"} onClick={() => switchMode("login")}>Log in</button>
          </div>

          {formStatus && (
            <div className={`form-signal ${formStatus.type}`} role={formStatus.type === "error" ? "alert" : "status"}>
              {formStatus.message}
            </div>
          )}

          {mode === "signup" ? (
            <form className="auth-form" onSubmit={handleSignup}>
              <label className="field">
                <span>Choose a private name</span>
                <input required minLength="3" value={signup.privateName} onChange={(event) => setSignup({ ...signup, privateName: event.target.value })} placeholder="QuietRiver" />
              </label>
              <label className="field">
                <span>Create password</span>
                <input required minLength="8" type="password" value={signup.password} onChange={(event) => setSignup({ ...signup, password: event.target.value })} />
              </label>
              <label className="field">
                <span>Confirm password</span>
                <input required minLength="8" type="password" value={signup.confirmPassword} onChange={(event) => setSignup({ ...signup, confirmPassword: event.target.value })} />
              </label>
              <label className="field">
                <span>Recovery email <small>optional</small></span>
                <input type="email" value={signup.recoveryEmail} onChange={(event) => setSignup({ ...signup, recoveryEmail: event.target.value })} placeholder="Only if you want password recovery" />
              </label>
              <button className="button primary" type="submit" disabled={busy}>{busy ? "Creating" : "Create private account"}</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleLogin}>
              <label className="field">
                <span>Private name or official email</span>
                <input required value={login.privateName} onChange={(event) => setLogin({ ...login, privateName: event.target.value })} placeholder="Private name or admin@harbor.cm" />
              </label>
              <label className="field">
                <span>Password</span>
                <input required type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} />
              </label>
              <button className="button primary" type="submit" disabled={busy}>{busy ? "Checking" : "Log in"}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
