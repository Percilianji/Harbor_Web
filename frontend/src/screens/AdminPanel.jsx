import React, { useEffect, useState } from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import { apiRequest } from "../utils/api.js";

const blankOfficial = {
  privateName: "",
  officialEmail: "",
  agencyName: "",
  positionTitle: "",
  role: "government",
};

export default function AdminPanel({ currentUser, notify }) {
  const [officials, setOfficials] = useState([]);
  const [form, setForm] = useState(blankOfficial);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [setupLink, setSetupLink] = useState("");

  const headers = {
    "X-Harbor-Role": currentUser?.role || "community",
    "X-Harbor-Admin-Email": currentUser?.officialEmail || currentUser?.recoveryEmail || "",
  };

  useEffect(() => {
    if (currentUser?.role !== "admin") return undefined;
    apiRequest("/api/admin/officials", { headers })
      .then((data) => setOfficials(data.officials || []))
      .catch(() => undefined);
  }, [currentUser?.role]);

  if (currentUser?.role !== "admin") {
    return (
      <section id="admin" className="app-section" aria-labelledby="admin-title">
        <SectionHeading eyebrow="Admin" title="Admin access required.">
          This page is only for Harbor super admins.
        </SectionHeading>
      </section>
    );
  }

  const createOfficial = (event) => {
    event.preventDefault();
    setBusy(true);
    apiRequest("/api/admin/officials", {
      method: "POST",
      headers,
      body: JSON.stringify(form),
    })
      .then((data) => {
        setOfficials((current) => [data.official, ...current]);
        setForm(blankOfficial);
        setSetupLink(data.setupLink || "");
        notify(data.message);
      })
      .catch((error) => notify(error.message || "Could not create official account."))
      .finally(() => setBusy(false));
  };

  const viewOfficial = (official) => {
    setSelected(official);
    setEditing(null);
  };

  const startEdit = (official) => {
    setSelected(null);
    setEditing({
      id: official.id,
      privateName: official.privateName || "",
      officialEmail: official.officialEmail || "",
      agencyName: official.agencyName || "",
      positionTitle: official.positionTitle || "",
      role: official.role || "government",
      verificationStatus: official.verificationStatus || "verified",
    });
  };

  const saveEdit = (event) => {
    event.preventDefault();
    setBusy(true);
    apiRequest(`/api/admin/officials/${editing.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(editing),
    })
      .then((data) => {
        setOfficials((current) => current.map((item) => item.id === data.official.id ? data.official : item));
        setEditing(null);
        notify(data.message);
      })
      .catch((error) => notify(error.message || "Could not update official account."))
      .finally(() => setBusy(false));
  };

  const deleteOfficial = (official) => {
    setBusy(true);
    apiRequest(`/api/admin/officials/${official.id}`, { method: "DELETE", headers })
      .then((data) => {
        setOfficials((current) => current.filter((item) => item.id !== official.id));
        if (selected?.id === official.id) setSelected(null);
        if (editing?.id === official.id) setEditing(null);
        notify(data.message);
      })
      .catch((error) => notify(error.message || "Could not delete official account."))
      .finally(() => setBusy(false));
  };

  return (
    <section id="admin" className="app-section" aria-labelledby="admin-title">
      <SectionHeading eyebrow="Super admin" title="Add approved authorities.">
        Create approved government and NGO accounts here. They should log in only after their account has been created by the super admin.
      </SectionHeading>

      <div className="admin-layout">
        <form className="admin-panel" onSubmit={createOfficial}>
          <h3>New official account</h3>
          <label className="field">
            <span>Official name</span>
            <input required value={form.privateName} onChange={(event) => setForm({ ...form, privateName: event.target.value })} placeholder="MINPROFF Officer" />
          </label>
          <label className="field">
            <span>Official email</span>
            <input required type="email" value={form.officialEmail} onChange={(event) => setForm({ ...form, officialEmail: event.target.value })} placeholder="officer@agency.gov.cm" />
          </label>
          <label className="field">
            <span>Agency or ministry</span>
            <input required value={form.agencyName} onChange={(event) => setForm({ ...form, agencyName: event.target.value })} placeholder="MINPROFF" />
          </label>
          <label className="field">
            <span>Authority type</span>
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="government">Government official</option>
              <option value="ngo">NGO partner</option>
            </select>
          </label>
          <label className="field">
            <span>Position <small>optional</small></span>
            <input value={form.positionTitle} onChange={(event) => setForm({ ...form, positionTitle: event.target.value })} placeholder="Regional focal point" />
          </label>
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Creating" : "Create and email invite"}</button>
          {setupLink && (
            <div className="invite-link-box">
              <strong>Email is not configured locally.</strong>
              <span>Use this setup link for testing:</span>
              <input readOnly value={setupLink} onFocus={(event) => event.target.select()} />
            </div>
          )}
        </form>

        <div className="official-list">
          {officials.length ? officials.map((official) => (
            <article className="official-card" key={official.id}>
              <h3>{official.privateName}</h3>
              <p>{official.officialEmail}</p>
              <div className="pill-row">
                <span className="pill">{official.agencyName}</span>
                <span className="pill">{official.role === "ngo" ? "NGO partner" : "Government official"}</span>
                <span className="pill">{official.verificationStatus}</span>
                {official.positionTitle && <span className="pill">{official.positionTitle}</span>}
              </div>
              <div className="official-actions">
                <button className="button ghost" type="button" onClick={() => viewOfficial(official)}>View</button>
                <button className="button secondary" type="button" onClick={() => startEdit(official)}>Edit</button>
                <button className="delete-story-button" type="button" disabled={busy} onClick={() => deleteOfficial(official)}>Delete</button>
              </div>
            </article>
          )) : (
            <article className="official-card">
              <h3>No officials yet</h3>
              <p className="muted">Created authority accounts will appear here.</p>
            </article>
          )}
        </div>
      </div>

      {selected && (
        <section className="admin-detail-panel" aria-label="Official details">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Official details</p>
              <h3>{selected.privateName}</h3>
            </div>
            <button className="button ghost" type="button" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div className="detail-grid">
            <p><strong>Email</strong><span>{selected.officialEmail}</span></p>
            <p><strong>Agency</strong><span>{selected.agencyName}</span></p>
            <p><strong>Type</strong><span>{selected.role === "ngo" ? "NGO partner" : "Government official"}</span></p>
            <p><strong>Position</strong><span>{selected.positionTitle || "Not added"}</span></p>
            <p><strong>Status</strong><span>{selected.verificationStatus}</span></p>
          </div>
        </section>
      )}

      {editing && (
        <form className="admin-detail-panel" onSubmit={saveEdit}>
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Edit official</p>
              <h3>{editing.privateName || "Official account"}</h3>
            </div>
            <button className="button ghost" type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Official name</span>
              <input required value={editing.privateName} onChange={(event) => setEditing({ ...editing, privateName: event.target.value })} />
            </label>
            <label className="field">
              <span>Official email</span>
              <input required type="email" value={editing.officialEmail} onChange={(event) => setEditing({ ...editing, officialEmail: event.target.value })} />
            </label>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Agency or ministry</span>
              <input required value={editing.agencyName} onChange={(event) => setEditing({ ...editing, agencyName: event.target.value })} />
            </label>
            <label className="field">
              <span>Status</span>
              <select value={editing.verificationStatus} onChange={(event) => setEditing({ ...editing, verificationStatus: event.target.value })}>
                <option>verified</option>
                <option>suspended</option>
                <option>pending</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Authority type</span>
            <select value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value })}>
              <option value="government">Government official</option>
              <option value="ngo">NGO partner</option>
            </select>
          </label>
          <label className="field">
            <span>Position</span>
            <input value={editing.positionTitle} onChange={(event) => setEditing({ ...editing, positionTitle: event.target.value })} />
          </label>
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Saving" : "Save changes"}</button>
        </form>
      )}
    </section>
  );
}
