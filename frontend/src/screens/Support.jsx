import React, { useEffect, useMemo, useState } from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import { resources } from "../data/resources.js";
import { apiRequest } from "../utils/api.js";
import { useLanguage } from "../utils/language.jsx";

const blankSupportContact = {
  name: "",
  type: "",
  place: "",
  hours: "",
  languages: "",
  cost: "",
  contact: "",
  verified: "Admin added",
};

function formatContactParts(contact = "") {
  const cleaned = contact.replace(/\btoll[-\s]?free\b/gi, "").replace(/\s{2,}/g, " ").trim();
  const match = cleaned.match(/(?:\+?\d[\d\s().-]{1,}\d|\b\d{3}\b)/);
  if (!match) return { primary: cleaned, rest: "" };
  const phone = match[0].replace(/[^\d+]/g, "");
  return {
    primary: match[0].trim(),
    phone,
    rest: cleaned.replace(match[0], "").replace(/^[\s,;:-]+|[\s,;:-]+$/g, "").trim(),
  };
}

export default function Support({ notify, currentUser }) {
  const { isFrench } = useLanguage();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(resources);
  const [supportForm, setSupportForm] = useState(blankSupportContact);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [busy, setBusy] = useState(false);
  const isAdmin = currentUser?.role === "admin";
  const adminHeaders = {
    "X-Harbor-Role": currentUser?.role || "community",
    "X-Harbor-Admin-Email": currentUser?.officialEmail || currentUser?.recoveryEmail || "",
  };

  useEffect(() => {
    apiRequest("/api/support/resources")
      .then((data) => setItems(data.resources))
      .catch(() => undefined);
  }, [notify]);

  const addSupportContact = (event) => {
    event.preventDefault();
    setBusy(true);
    apiRequest("/api/admin/support-resources", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(supportForm),
    })
      .then((data) => {
        setItems((current) => [data.resource, ...current]);
        setSupportForm(blankSupportContact);
        notify(data.message);
      })
      .catch((error) => notify(error.message || "Could not add support contact."))
      .finally(() => setBusy(false));
  };

  const startEditContact = (resource) => {
    if (!resource.id) {
      notify("This contact can only be edited after the database is connected.");
      return;
    }
    setSelectedContact(null);
    setEditingContact({
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

  const saveContactEdit = (event) => {
    event.preventDefault();
    setBusy(true);
    apiRequest(`/api/admin/support-resources/${editingContact.id}`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify(editingContact),
    })
      .then((data) => {
        setItems((current) => current.map((item) => item.id === data.resource.id ? data.resource : item));
        setEditingContact(null);
        notify(data.message);
      })
      .catch((error) => notify(error.message || "Could not update support contact."))
      .finally(() => setBusy(false));
  };

  const deleteContact = (resource) => {
    if (!resource.id) {
      notify("This contact can only be deleted after the database is connected.");
      return;
    }
    setBusy(true);
    apiRequest(`/api/admin/support-resources/${resource.id}`, { method: "DELETE", headers: adminHeaders })
      .then((data) => {
        setItems((current) => current.filter((item) => item.id !== resource.id));
        if (selectedContact?.id === resource.id) setSelectedContact(null);
        if (editingContact?.id === resource.id) setEditingContact(null);
        notify(data.message);
      })
      .catch((error) => notify(error.message || "Could not delete support contact."))
      .finally(() => setBusy(false));
  };

  const visibleResources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((resource) => Object.values(resource).some((value) => String(value).toLowerCase().includes(normalized)));
  }, [items, query]);

  return (
    <section id="support" className="app-section support-section" aria-labelledby="support-title">
      <SectionHeading eyebrow={isFrench ? "Trouver de l'aide" : "Find support"} title={isFrench ? "Ressources par besoin et region." : "Resources by need and region."}>
        {isFrench ? "Les contacts d'urgence au Cameroun sont affiches en premier. Vous pouvez aussi chercher le conseil, l'aide juridique et l'aide medicale." : "Cameroon emergency contacts are shown first. You can also search for counseling, legal aid, medical support, and other services."}
      </SectionHeading>
      <div className="emergency-strip" aria-label="Cameroon emergency contacts">
        <a href="tel:116"><strong>116</strong><span>{isFrench ? "Aide famille MINPROFF" : "MINPROFF family help"}</span></a>
        <a href="tel:117"><strong>117</strong><span>{isFrench ? "Police nationale" : "National Police"}</span></a>
        <a href="tel:118"><strong>118</strong><span>Gendarmerie</span></a>
      </div>
      <div className="resource-filters">
        <label><span className="sr-only">{isFrench ? "Pays, ville ou service" : "Country, city, or service"}</span><input aria-label={isFrench ? "Chercher pays, ville ou service" : "Search country, city, or service"} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isFrench ? "Chercher pays, ville ou service" : "Search country, city, or service"} /></label>
      </div>
      <details className="mobile-filter-menu">
        <summary><span>{isFrench ? "Filtrer" : "Filter"}</span></summary>
        <div className="mobile-filter-panel">
          <label><span>{isFrench ? "Pays, ville ou service" : "Country, city, or service"}</span><input aria-label={isFrench ? "Chercher pays, ville ou service" : "Search country, city, or service"} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isFrench ? "Chercher" : "Search"} /></label>
        </div>
      </details>
      {isAdmin && (
        <form className="support-admin-form" onSubmit={addSupportContact}>
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Admin contact manager</p>
              <h3>Add support contact</h3>
            </div>
          </div>
          <div className="form-grid">
            <label className="field"><span>Name</span><input required value={supportForm.name} onChange={(event) => setSupportForm({ ...supportForm, name: event.target.value })} placeholder="Counseling center or emergency line" /></label>
            <label className="field"><span>Phone or contact</span><input required value={supportForm.contact} onChange={(event) => setSupportForm({ ...supportForm, contact: event.target.value })} placeholder="116, +237..., website, email, or address" /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Type</span><input required value={supportForm.type} onChange={(event) => setSupportForm({ ...supportForm, type: event.target.value })} placeholder="Counseling, legal aid, shelter, emergency" /></label>
            <label className="field"><span>Location</span><input required value={supportForm.place} onChange={(event) => setSupportForm({ ...supportForm, place: event.target.value })} placeholder="Cameroon, Douala" /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Hours</span><input value={supportForm.hours} onChange={(event) => setSupportForm({ ...supportForm, hours: event.target.value })} placeholder="24/7 or business hours" /></label>
            <label className="field"><span>Languages</span><input value={supportForm.languages} onChange={(event) => setSupportForm({ ...supportForm, languages: event.target.value })} placeholder="English, French" /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Cost</span><input value={supportForm.cost} onChange={(event) => setSupportForm({ ...supportForm, cost: event.target.value })} placeholder="Free or verify first" /></label>
            <label className="field"><span>Verified</span><input value={supportForm.verified} onChange={(event) => setSupportForm({ ...supportForm, verified: event.target.value })} /></label>
          </div>
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Adding" : "Add support contact"}</button>
        </form>
      )}
      {selectedContact && (
        <section className="support-detail-panel" aria-label="Support contact details">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Contact details</p>
              <h3>{selectedContact.name}</h3>
            </div>
            <button className="button ghost" type="button" onClick={() => setSelectedContact(null)}>Close</button>
          </div>
          <div className="detail-grid">
            <p><strong>Contact</strong><span>{selectedContact.contact}</span></p>
            <p><strong>Type</strong><span>{selectedContact.type}</span></p>
            <p><strong>Location</strong><span>{selectedContact.place}</span></p>
            <p><strong>Hours</strong><span>{selectedContact.hours || "Not added"}</span></p>
            <p><strong>Languages</strong><span>{selectedContact.languages || "Not added"}</span></p>
            <p><strong>Cost</strong><span>{selectedContact.cost || "Not added"}</span></p>
            <p><strong>Verified</strong><span>{selectedContact.verified || "Not added"}</span></p>
          </div>
        </section>
      )}
      {editingContact && (
        <form className="support-detail-panel" onSubmit={saveContactEdit}>
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Edit contact</p>
              <h3>{editingContact.name || "Support contact"}</h3>
            </div>
            <button className="button ghost" type="button" onClick={() => setEditingContact(null)}>Cancel</button>
          </div>
          <div className="form-grid">
            <label className="field"><span>Name</span><input required value={editingContact.name} onChange={(event) => setEditingContact({ ...editingContact, name: event.target.value })} /></label>
            <label className="field"><span>Phone or contact</span><input required value={editingContact.contact} onChange={(event) => setEditingContact({ ...editingContact, contact: event.target.value })} /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Type</span><input required value={editingContact.type} onChange={(event) => setEditingContact({ ...editingContact, type: event.target.value })} /></label>
            <label className="field"><span>Location</span><input required value={editingContact.place} onChange={(event) => setEditingContact({ ...editingContact, place: event.target.value })} /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Hours</span><input value={editingContact.hours} onChange={(event) => setEditingContact({ ...editingContact, hours: event.target.value })} /></label>
            <label className="field"><span>Languages</span><input value={editingContact.languages} onChange={(event) => setEditingContact({ ...editingContact, languages: event.target.value })} /></label>
          </div>
          <div className="form-grid">
            <label className="field"><span>Cost</span><input value={editingContact.cost} onChange={(event) => setEditingContact({ ...editingContact, cost: event.target.value })} /></label>
            <label className="field"><span>Verified</span><input value={editingContact.verified} onChange={(event) => setEditingContact({ ...editingContact, verified: event.target.value })} /></label>
          </div>
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Saving" : "Save contact"}</button>
        </form>
      )}
      <div className="support-grid">
        {visibleResources.map((resource) => {
          const contact = formatContactParts(resource.contact);

          return (
            <article className="support-card" key={resource.id || resource.name}>
              <div className="support-card-head">
                <h3>{resource.name}</h3>
                {isAdmin && (
                  <div className="contact-icon-actions" aria-label={`Admin actions for ${resource.name}`}>
                    <button type="button" onClick={() => setSelectedContact(resource)} aria-label={`View ${resource.name}`} title="View">◎</button>
                    <button type="button" onClick={() => startEditContact(resource)} aria-label={`Edit ${resource.name}`} title="Edit">✎</button>
                    <button type="button" disabled={busy} onClick={() => deleteContact(resource)} aria-label={`Delete ${resource.name}`} title="Delete">×</button>
                  </div>
                )}
              </div>
              <p><strong>{resource.type}</strong></p>
              <p>{resource.place}</p>
              <div className="pill-row">
                <span className="pill">{resource.hours}</span>
                <span className="pill">{resource.languages}</span>
                <span className="pill">{resource.cost}</span>
              </div>
              <p className="support-contact">
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} aria-label={`Call ${contact.primary}`}>
                    <strong>{contact.primary}</strong>
                  </a>
                ) : (
                  <strong>{contact.primary}</strong>
                )}
                {contact.rest && <span>{contact.rest}</span>}
              </p>
              <footer>
                <span>Verified: {resource.verified}</span>
                <button type="button" onClick={() => {
                  apiRequest(`/api/support/resources/${encodeURIComponent(resource.name)}/report`, { method: "POST" })
                    .then((data) => notify(data.message))
                    .catch(() => notify("Thanks. This resource was marked for review."));
                }}>Report incorrect info</button>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
