import React, { useState } from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import { makeId } from "../utils/browser.js";
import { readStored, storageKeys, writeStored } from "../utils/storage.js";
import { apiRequest } from "../utils/api.js";

export default function Journal({ notify }) {
  const [entries, setEntries] = useState(() => readStored(storageKeys.journal, []));
  const [form, setForm] = useState({ title: "", mood: "Steady", body: "", tags: "" });

  const save = (event) => {
    event.preventDefault();
    const nextEntries = [{ id: makeId(), ...form, date: new Date().toLocaleString() }, ...entries];
    setEntries(nextEntries);
    writeStored(storageKeys.journal, nextEntries);
    setForm({ title: "", mood: "Steady", body: "", tags: "" });
    apiRequest("/api/journal/entries", { method: "POST", body: JSON.stringify(form) })
      .then((data) => notify(data.message))
      .catch(() => notify("Journal entry saved privately in this browser."));
  };

  const remove = (id) => {
    const nextEntries = entries.filter((entry) => entry.id !== id);
    setEntries(nextEntries);
    writeStored(storageKeys.journal, nextEntries);
    apiRequest(`/api/journal/entries/${id}`, { method: "DELETE" }).catch(() => undefined);
    notify("Journal entry deleted.");
  };

  return (
    <section id="journal" className="app-section muted-band" aria-labelledby="journal-title">
      <SectionHeading eyebrow="Private journal" title="For feelings, reflection, and healing notes.">
        Use this space to write about your mood, triggers, memories, progress, and what support you need. It is for personal reflection, not formal evidence records.
      </SectionHeading>
      <div className="journal-layout">
        <form className="journal-form" onSubmit={save}>
          <label className="field"><span>Reflection title</span><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="How I feel today" /></label>
          <label className="field"><span>Mood</span><select value={form.mood} onChange={(event) => setForm({ ...form, mood: event.target.value })}><option>Steady</option><option>Tired</option><option>Angry</option><option>Numb</option><option>Hopeful</option></select></label>
          <label className="field"><span>Reflection</span><textarea rows="6" required value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Write feelings, thoughts, triggers, needs, or progress." /></label>
          <label className="field"><span>Tags <small>optional</small></span><input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="grounding, milestone" /></label>
          <button className="button primary" type="submit">Save journal entry</button>
        </form>
        <div className="journal-list" aria-live="polite">
          {entries.length ? entries.map((entry) => (
            <article className="journal-entry" key={entry.id}>
              <h3>{entry.title}</h3>
              <p className="entry-meta">{entry.mood} | {entry.date}{entry.tags ? ` | ${entry.tags}` : ""}</p>
              <p>{entry.body}</p>
              <button className="button secondary" type="button" onClick={() => remove(entry.id)}>Delete</button>
            </article>
          )) : <article className="journal-entry"><h3>No journal entries yet</h3><p className="muted">A saved entry will appear here.</p></article>}
        </div>
      </div>
    </section>
  );
}
