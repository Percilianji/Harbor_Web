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

const blankSupportResource = {
  name: "",
  type: "",
  place: "",
  hours: "",
  languages: "",
  cost: "",
  contact: "",
  verified: "Admin added",
};

export default function AdminPanel({ currentUser, notify }) {
  const [officials, setOfficials] = useState([]);
  const [supportResources, setSupportResources] = useState([]);
  const [form, setForm] = useState(blankOfficial);
  const [supportForm, setSupportForm] = useState(blankSupportResource);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editingSupport, setEditingSupport] = useState(null);
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
    apiRequest("/api/admin/support-resources", { headers })
      .then((data) => setSupportResources(data.resources || []))
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

  const createSupportResource = (event) => {
    event.preventDefault();
    setBusy(true);
    apiRequest("/api/admin/support-resources", {
      method: "POST",
      headers,
      body: JSON.stringify(supportForm),
    })
      .then((data) => {
        setSupportResources((current) => [data.resource, ...current]);
        setSupportForm(blankSupportResource);
        notify(data.message);
      })
      .catch((error) => notify(error.message || "Could not add support contact."))
      .finally(() => setBusy(false));
  };

  const startSupportEdit = (resource) => {
    setEditingSupport({
      id: resource.id,
      name: resource.name || "",
      type: resource.type || "",
      place: resource.place || "",
      hours: resource.hours || "",
      languages: resource.languages || "",
      cost: resource.cost || "",
      contact: resource.contact || "",
      verified: resource.verified || "Admin added",
    });
  };

  const saveSupportEdit = (event) => {
    event.preventDefault();
    setBusy(true);
    apiRequest(`/api/admin/support-resources/${editingSupport.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(editingSupport),
    })
      .then((data) => {
        setSupportResources((current) => current.map((item) => item.id === data.resource.id ? data.resource : item));
        setEditingSupport(null);
        notify(data.message);
      })
      .catch((error) => notify(error.message || "Could not update support contact."))
      .finally(() => setBusy(false));
  };

  const deleteSupportResource = (resource) => {
    setBusy(true);
    apiRequest(`/api/admin/support-resources/${resource.id}`, { method: "DELETE", headers })
      .then((data) => {
        setSupportResources((current) => current.filter((item) => item.id !== resource.id));
        if (editingSupport?.id === resource.id) setEditingSupport(null);
        notify(data.message);
      })
      .catch((error) => notify(error.message || "Could not delete support contact."))
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

      <div className="section-title-row admin-subsection-title">
        <div>
          <p className="eyebrow">Support contacts</p>
          <h3>Add public support resources.</h3>
        </div>
      </div>

      <div className="admin-layout">
        <form className="admin-panel" onSubmit={createSupportResource}>
          <h3>New support contact</h3>
          <label className="field">
            <span>Name</span>
            <input required value={supportForm.name} onChange={(event) => setSupportForm({ ...supportForm, name: event.target.value })} placeholder="Counseling center or emergency line" />
          </label>
          <label className="field">
            <span>Type</span>
            <input required value={supportForm.type} onChange={(event) => setSupportForm({ ...supportForm, type: event.target.value })} placeholder="Counseling, legal aid, shelter, emergency" />
          </label>
          <label className="field">
            <span>Location</span>
            <input required value={supportForm.place} onChange={(event) => setSupportForm({ ...supportForm, place: event.target.value })} placeholder="Cameroon, Douala" />
          </label>
          <label className="field">
            <span>Contact</span>
            <input required value={supportForm.contact} onChange={(event) => setSupportForm({ ...supportForm, contact: event.target.value })} placeholder="Phone, website, email, or address" />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Hours</span>
              <input value={supportForm.hours} onChange={(event) => setSupportForm({ ...supportForm, hours: event.target.value })} placeholder="24/7 or business hours" />
            </label>
            <label className="field">
              <span>Cost</span>
              <input value={supportForm.cost} onChange={(event) => setSupportForm({ ...supportForm, cost: event.target.value })} placeholder="Free or verify first" />
            </label>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Languages</span>
              <input value={supportForm.languages} onChange={(event) => setSupportForm({ ...supportForm, languages: event.target.value })} placeholder="English, French" />
            </label>
            <label className="field">
              <span>Verified</span>
              <input value={supportForm.verified} onChange={(event) => setSupportForm({ ...supportForm, verified: event.target.value })} />
            </label>
          </div>
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Adding" : "Add support contact"}</button>
        </form>

        <div className="official-list">
          {supportResources.length ? supportResources.map((resource) => (
            <article className="official-card" key={resource.id || resource.name}>
              <h3>{resource.name}</h3>
              <p>{resource.contact}</p>
              <div className="pill-row">
                <span className="pill">{resource.type}</span>
                <span className="pill">{resource.place}</span>
                <span className="pill">{resource.hours}</span>
                <span className="pill">{resource.verified}</span>
              </div>
              {resource.id && (
                <div className="official-actions">
                  <button className="button secondary" type="button" onClick={() => startSupportEdit(resource)}>Edit</button>
                  <button className="delete-story-button" type="button" disabled={busy} onClick={() => deleteSupportResource(resource)}>Delete</button>
                </div>
              )}
            </article>
          )) : (
            <article className="official-card">
              <h3>No support contacts yet</h3>
              <p className="muted">Added support contacts will appear on the public Support page.</p>
            </article>
          )}
        </div>
      </div>

      {editingSupport && (
        <form className="admin-detail-panel" onSubmit={saveSupportEdit}>
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Edit support contact</p>
              <h3>{editingSupport.name || "Support contact"}</h3>
            </div>
            <button className="button ghost" type="button" onClick={() => setEditingSupport(null)}>Cancel</button>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Name</span>
              <input required value={editingSupport.name} onChange={(event) => setEditingSupport({ ...editingSupport, name: event.target.value })} />
            </label>
            <label className="field">
              <span>Type</span>
              <input required value={editingSupport.type} onChange={(event) => setEditingSupport({ ...editingSupport, type: event.target.value })} />
            </label>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Location</span>
              <input required value={editingSupport.place} onChange={(event) => setEditingSupport({ ...editingSupport, place: event.target.value })} />
            </label>
            <label className="field">
              <span>Contact</span>
              <input required value={editingSupport.contact} onChange={(event) => setEditingSupport({ ...editingSupport, contact: event.target.value })} />
            </label>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Hours</span>
              <input value={editingSupport.hours} onChange={(event) => setEditingSupport({ ...editingSupport, hours: event.target.value })} />
            </label>
            <label className="field">
              <span>Languages</span>
              <input value={editingSupport.languages} onChange={(event) => setEditingSupport({ ...editingSupport, languages: event.target.value })} />
            </label>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Cost</span>
              <input value={editingSupport.cost} onChange={(event) => setEditingSupport({ ...editingSupport, cost: event.target.value })} />
            </label>
            <label className="field">
              <span>Verified</span>
              <input value={editingSupport.verified} onChange={(event) => setEditingSupport({ ...editingSupport, verified: event.target.value })} />
            </label>
          </div>
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Saving" : "Save support contact"}</button>
        </form>
      )}
    </section>
  );
}
