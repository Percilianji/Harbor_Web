import React, { useEffect, useMemo, useState } from "react";
import Notice from "../components/Notice.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { makeId } from "../utils/browser.js";
import { readStored, storageKeys, writeStored } from "../utils/storage.js";
import { apiRequest } from "../utils/api.js";

const demoOfficialCases = [
  {
    id: "demo-vault-1",
    createdAt: "2026-08-22 10:15:00",
    userName: "Anonymous user",
    label: "Report from Douala",
    incidentDateTime: "August 2026",
    location: "Douala, Littoral",
    recordType: "Police or legal note",
    status: "new",
    notes: "Survivor described domestic violence and asked what help is available.",
    privateDetails: "Shared for official review: alleged partner details, safe calling window, and nearby trusted contact.",
    safetyNotes: "Needs safe contact before follow-up.",
  },
  {
    id: "demo-vault-2",
    createdAt: "2026-08-24 15:40:00",
    userName: "Anonymous user",
    label: "School harassment note",
    incidentDateTime: "2025",
    location: "Yaounde, Centre",
    recordType: "Witness note",
    status: "review",
    notes: "A student recorded repeated harassment and wants guidance before reporting.",
    privateDetails: "Shared for official review: school context, possible witness name, and safer contact through guardian.",
    safetyNotes: "Needs trusted adult support.",
  },
];

export default function Vault({ notify, currentUser }) {
  const isOfficialReviewer = ["government", "ngo", "admin"].includes(currentUser?.role);
  const [cases, setCases] = useState(() => readStored(storageKeys.vault, []));
  const [officialCases, setOfficialCases] = useState(demoOfficialCases);
  const [filters, setFilters] = useState({ query: "", type: "All types", status: "All status", region: "All regions" });
  const [form, setForm] = useState({
    label: "",
    incidentDateTime: "",
    location: "",
    recordType: "Incident note",
    peopleInvolved: "",
    witnesses: "",
    evidenceFileName: "",
    screenshotReference: "",
    medicalLegalFollowUp: "",
    safetyNotes: "",
    notes: "",
    privateDetails: "",
    consentToOfficialReview: false,
  });

  const resetForm = () => setForm({
    label: "",
    incidentDateTime: "",
    location: "",
    recordType: "Incident note",
    peopleInvolved: "",
    witnesses: "",
    evidenceFileName: "",
    screenshotReference: "",
    medicalLegalFollowUp: "",
    safetyNotes: "",
    notes: "",
    privateDetails: "",
    consentToOfficialReview: false,
  });

  const save = (event) => {
    event.preventDefault();
    const nextCases = [{
      id: makeId(),
      userId: currentUser?.id || currentUser?.privateName || "",
      userName: currentUser?.privateName || "Anonymous user",
      label: form.label,
      incidentDateTime: form.incidentDateTime,
      location: form.location,
      recordType: form.recordType,
      evidenceFileName: form.evidenceFileName,
      consentToOfficialReview: form.consentToOfficialReview,
      createdAt: new Date().toLocaleString(),
      notesLength: form.notes.length,
      privateDetailsLength: form.privateDetails.length,
    }, ...cases];
    setCases(nextCases);
    writeStored(storageKeys.vault, nextCases);
    resetForm();
    apiRequest("/api/vault/cases", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        userId: currentUser?.id || currentUser?.privateName || "",
        userName: currentUser?.privateName || "",
      }),
    })
      .then((data) => notify(data.message))
      .catch(() => undefined);
  };

  useEffect(() => {
    if (!isOfficialReviewer) return undefined;
    apiRequest("/api/vault/cases", { headers: { "X-Harbor-Role": currentUser.role } })
      .then((data) => setOfficialCases(Array.isArray(data.cases) && data.cases.length ? data.cases : demoOfficialCases))
      .catch(() => setOfficialCases(demoOfficialCases));
  }, [currentUser?.role, isOfficialReviewer]);

  const filteredOfficialCases = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return officialCases.filter((item) => {
      const text = [item.label, item.location, item.recordType, item.status, item.notes, item.privateDetails, item.private_details, item.safetyNotes, item.userName].join(" ").toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesType = filters.type === "All types" || item.recordType === filters.type;
      const matchesStatus = filters.status === "All status" || item.status === filters.status;
      const matchesRegion = filters.region === "All regions" || String(item.location || "").toLowerCase().includes(filters.region.toLowerCase());
      return matchesQuery && matchesType && matchesStatus && matchesRegion;
    });
  }, [filters, officialCases]);

  const types = ["All types", ...Array.from(new Set(officialCases.map((item) => item.recordType).filter(Boolean)))];
  const statuses = ["All status", ...Array.from(new Set(officialCases.map((item) => item.status).filter(Boolean)))];
  const regions = ["All regions", "Centre", "Littoral", "North-West", "South-West", "West", "Far North"];

  if (isOfficialReviewer) {
    return (
      <section id="vault" className="app-section" aria-labelledby="vault-title">
        <SectionHeading eyebrow="Official vault review" title="Submitted vault messages by region and need.">
          Review survivor-submitted vault records with filters. This view only shows records survivors consented to share with official support teams.
        </SectionHeading>

        <div className="official-filter-bar" aria-label="Official vault filters">
          <input type="search" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Search message, region, user, or note" aria-label="Search vault messages" />
          <select value={filters.region} onChange={(event) => setFilters({ ...filters, region: event.target.value })} aria-label="Filter by region">
            {regions.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })} aria-label="Filter by record type">
            {types.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} aria-label="Filter by status">
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        <div className="official-vault-list">
          {filteredOfficialCases.map((item) => (
            <article className="official-vault-card" key={item.id}>
              <div>
                <p className="eyebrow">{item.status || "new"} | {item.recordType}</p>
                <h3>{item.label}</h3>
                <p className="entry-meta">{item.userName || "Anonymous user"} | {item.location || "No location"} | {item.incidentDateTime || "No date"}</p>
              </div>
              <p>{item.notes || "No message text saved."}</p>
              {(item.privateDetails || item.private_details) && (
                <p><strong>Private details shared for review:</strong> {item.privateDetails || item.private_details}</p>
              )}
              {item.safetyNotes && <p><strong>Safety note:</strong> {item.safetyNotes}</p>}
              <div className="tool-row">
                <button className="button secondary" type="button">Mark for follow-up</button>
                <button className="button primary" type="button">Assign response</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  const exportReport = () => {
    const blob = new Blob([JSON.stringify(cases, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "harbor-evidence-report.json";
    link.click();
    URL.revokeObjectURL(url);
    notify("Evidence report exported.");
  };

  return (
    <section id="vault" className="app-section" aria-labelledby="vault-title">
      <SectionHeading eyebrow="Evidence vault" title="For factual incident records and evidence details.">
        Save simple facts you may need later: dates, places, witnesses, messages, screenshots, medical notes, or police/legal follow-up.
      </SectionHeading>
      <div className="vault-panel">
        <Notice title="This stays private.">
          Vault records are not shown in stories and are not public.
        </Notice>
        <form className="vault-form" onSubmit={save}>
          <div className="form-grid">
            <label className="field"><span>What should we call this?</span><input required value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="My note from today" /></label>
            <label className="field"><span>When did it happen? <small>optional</small></span><input value={form.incidentDateTime} onChange={(event) => setForm({ ...form, incidentDateTime: event.target.value })} placeholder="Example: yesterday, March 2025, or 8pm" /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Where did it happen? <small>optional</small></span><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Example: Douala, school, workplace, WhatsApp" /></label>
            <label className="field"><span>What kind of note is this?</span><select value={form.recordType} onChange={(event) => setForm({ ...form, recordType: event.target.value })}><option>What happened</option><option>Message or screenshot</option><option>Hospital or medical note</option><option>Police or legal note</option><option>Witness note</option><option>Other evidence</option></select></label>
          </div>
          <label className="field"><span>Who was involved? <small>optional</small></span><textarea rows="3" value={form.peopleInvolved} onChange={(event) => setForm({ ...form, peopleInvolved: event.target.value })} placeholder="Names, nicknames, descriptions, phone numbers, workplace, or profile names. This stays private." /></label>
          <label className="field"><span>Did anyone see or hear it? <small>optional</small></span><textarea rows="3" value={form.witnesses} onChange={(event) => setForm({ ...form, witnesses: event.target.value })} placeholder="Anyone who saw, heard, received messages, or can help confirm what happened." /></label>
          <label className="field"><span>Add a file <small>optional</small></span><input type="file" onChange={(event) => setForm({ ...form, evidenceFileName: event.target.files?.[0]?.name || "" })} /></label>
          {form.evidenceFileName && <p className="entry-meta">Selected file: {form.evidenceFileName}</p>}
          <label className="field"><span>Where is the message or screenshot? <small>optional</small></span><textarea rows="3" value={form.screenshotReference} onChange={(event) => setForm({ ...form, screenshotReference: event.target.value })} placeholder="Example: WhatsApp chat with X, phone gallery, email inbox." /></label>
          <label className="field"><span>Did you get help already? <small>optional</small></span><textarea rows="3" value={form.medicalLegalFollowUp} onChange={(event) => setForm({ ...form, medicalLegalFollowUp: event.target.value })} placeholder="Hospital, counselor, police, lawyer, case number, or someone you told." /></label>
          <label className="field"><span>What helps you stay safe? <small>optional</small></span><textarea rows="3" value={form.safetyNotes} onChange={(event) => setForm({ ...form, safetyNotes: event.target.value })} placeholder="Safe contacts, places to avoid, or steps that help you stay safer." /></label>
          <label className="field"><span>Write the facts you remember</span><textarea rows="4" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="What happened first? What happened next? Write only what you remember." /></label>
          <label className="field"><span>Private details for official review <small>optional</small></span><textarea rows="4" value={form.privateDetails} onChange={(event) => setForm({ ...form, privateDetails: event.target.value })} placeholder="Only add details you want an official or NGO support team to see if you choose review." /></label>
          <label className="checkbox-row official-consent">
            <input type="checkbox" checked={form.consentToOfficialReview} onChange={(event) => setForm({ ...form, consentToOfficialReview: event.target.checked })} />
            <span>I want an official support team to review this record.</span>
          </label>
          <div className="tool-row">
            <button className="button primary" type="submit">Save private record</button>
            <button className="button secondary" type="button" onClick={exportReport}>Download my records</button>
          </div>
        </form>
        <div className="vault-log" aria-live="polite">
          {cases.length ? cases.map((item) => (
            <article key={item.id}>
              <h3>{item.label}</h3>
              <p className="entry-meta">Created {item.createdAt}{item.incidentDateTime ? ` | ${item.incidentDateTime}` : ""}{item.recordType ? ` | ${item.recordType}` : ""}</p>
              <p>Saved factual incident details{item.location ? ` for ${item.location}` : ""}{item.evidenceFileName ? ` with file reference: ${item.evidenceFileName}` : ""}.</p>
            </article>
          )) : <article><h3>No evidence records yet</h3><p className="muted">Saved evidence records will appear here.</p></article>}
        </div>
      </div>
    </section>
  );
}
