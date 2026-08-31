import React, { useEffect, useMemo, useState } from "react";
import Notice from "../components/Notice.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { scanForIdentifiers } from "../utils/privacyScan.js";
import { readStored, removeStored, storageKeys, writeStored } from "../utils/storage.js";
import { apiRequest } from "../utils/api.js";

const blankStory = {
  privatePlace: false,
  draftName: "",
  publishing: "anonymous",
  nickname: "",
  storyTitle: "",
  language: "English",
  storyBody: "",
  approxDate: "",
  region: "",
  warnings: [],
  understandPrivacy: false,
  reviewedIds: false,
  deletion: false,
  rules: false,
};

const stepLabels = ["Are you safe?", "Who can see it?", "What happened?", "Check names", "Finish"];

export default function ShareStory({ notify, currentUser }) {
  const [step, setStep] = useState(0);
  const [story, setStory] = useState(() => readStored(storageKeys.story, blankStory));
  const [confirmed, setConfirmed] = useState(false);
  const reviewText = [story.draftName, story.nickname, story.storyTitle, story.storyBody, story.approxDate, story.region].join(" ");
  const findings = useMemo(() => scanForIdentifiers(reviewText), [reviewText]);
  const isPrivateChoice = story.publishing === "private" || story.publishing === "draft";

  useEffect(() => {
    writeStored(storageKeys.story, { ...story, savedAt: new Date().toISOString() });
  }, [story]);

  const setField = (field, value) => setStory((current) => ({ ...current, [field]: value }));
  const storyPayload = {
    ...story,
    userId: currentUser?.id || currentUser?.privateName || "",
    userName: currentUser?.privateName || "",
  };
  const nextStep = () => {
    if (step === 4) {
      setConfirmed(true);
      apiRequest("/api/share/submissions", { method: "POST", body: JSON.stringify(storyPayload) })
        .then((data) => {
          notify(data.message);
          removeStored(storageKeys.story);
          setStory(blankStory);
          setStep(0);
          if (data.story) window.location.hash = "stories";
        })
        .catch(() => notify("Submission saved locally."));
      return;
    }
    setStep((value) => Math.min(4, value + 1));
  };

  return (
    <section id="share" className="app-section" aria-labelledby="share-title">
      <div className="page-back-row">
        <a className="back-icon-button" href="#stories" aria-label="Back to stories">
          <span aria-hidden="true">‹</span>
        </a>
        <SectionHeading eyebrow="Share your story" title="Share only what feels safe.">
          You can add your story to the library anonymously, use a nickname, or keep it private for yourself.
        </SectionHeading>
      </div>

      <div className="workspace">
        <aside className="progress-panel" aria-label="Story steps">
          {stepLabels.map((label, index) => (
            <button key={label} className={`step-button ${step === index ? "active" : ""}`} type="button" onClick={() => setStep(index)}>
              {label}
            </button>
          ))}
        </aside>

        <form className="story-form" onSubmit={(event) => event.preventDefault()}>
          {step === 0 && (
            <div>
              <h3>Step 1 of 5: Are you safe now?</h3>
              <Notice tone="amber" title="Look around first.">
                Continue only if no one unsafe can see your screen.
              </Notice>
              <label className="checkbox-row">
                <input type="checkbox" checked={story.privatePlace} onChange={(event) => setField("privatePlace", event.target.checked)} />
                <span>Yes, I can use this page safely right now.</span>
              </label>
              <label className="field"><span>Private draft name <small>optional</small></span><input value={story.draftName} onChange={(event) => setField("draftName", event.target.value)} placeholder="My private note" /></label>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3>Step 2 of 5: Who can see it?</h3>
              <fieldset className="choice-grid">
                <legend>Choose one simple option.</legend>
                {["private", "anonymous", "nickname", "draft"].map((value) => (
                  <label key={value}>
                    <input type="radio" name="publishing" checked={story.publishing === value} onChange={() => setField("publishing", value)} />
                    <span>{labelPublishing(value)}</span>
                  </label>
                ))}
              </fieldset>
              <label className="field"><span>Nickname <small>only if you want</small></span><input value={story.nickname} onChange={(event) => setField("nickname", event.target.value)} placeholder="Only if you choose" /></label>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3>Step 3 of 5: What happened?</h3>
              <div className="form-grid">
                <label className="field"><span>Title</span><input value={story.storyTitle} onChange={(event) => setField("storyTitle", event.target.value)} required placeholder="A short title" /></label>
                <label className="field"><span>Language</span><select value={story.language} onChange={(event) => setField("language", event.target.value)}><option>English</option><option>French</option><option>Pidgin English</option><option>Local language</option></select></label>
              </div>
              <label className="field"><span>Write only what you want to share</span><textarea rows="8" value={story.storyBody} onChange={(event) => setField("storyBody", event.target.value)} placeholder="You can write a little or a lot." /></label>
              <div className="form-grid">
                <label className="field"><span>When did it happen? <small>optional</small></span><input value={story.approxDate} onChange={(event) => setField("approxDate", event.target.value)} placeholder="Example: 2022 or last month" /></label>
                <label className="field"><span>Where? <small>optional, keep it broad</small></span><input value={story.region} onChange={(event) => setField("region", event.target.value)} placeholder="Example: Douala, Yaounde, South-West" /></label>
              </div>
              <fieldset className="tag-fieldset">
                <legend>What is this about? <small>optional</small></legend>
                {["Beating", "Sexual abuse", "Emotional abuse", "Family", "Workplace", "Online threat"].map((warning) => (
                  <label key={warning}>
                    <input
                      type="checkbox"
                      checked={story.warnings.includes(warning)}
                      onChange={(event) => setField("warnings", toggleWarning(story.warnings, warning, event.target.checked))}
                    />
                    {warning}
                  </label>
                ))}
              </fieldset>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>Step 4 of 5: Check names and contacts</h3>
              <Notice title="Harbor checks for details that may identify you.">
                {isPrivateChoice
                  ? "These checks are only to help you notice personal details in your private draft. Nothing is published from this choice."
                  : "These checks help you review personal details before your story is added to the story library."}
              </Notice>
              <div className="scan-results" aria-live="polite">
                {findings.length ? findings.map((finding) => (
                  <div className="scan-item" key={finding}>
                    {isPrivateChoice ? `${finding} It will remain private unless you choose to share later.` : `${finding} Review before adding to stories.`}
                  </div>
                )) : <div className="scan-item clear">No common identifiers detected in the current draft.</div>}
              </div>
              <article className="story-preview">
                <h4>{story.storyTitle || "Untitled private draft"}</h4>
                <p>{story.storyBody || "Your preview will appear here after you add story details."}</p>
              </article>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3>Step 5 of 5: Finish</h3>
              {["understandPrivacy", "reviewedIds", "deletion", "rules"].map((field) => (
                <label className="checkbox-row" key={field}>
                  <input type="checkbox" checked={story[field]} onChange={(event) => setField(field, event.target.checked)} />
                  <span>{consentLabel(field)}</span>
                </label>
              ))}
              {confirmed && <Notice tone="success" title="Thank you for trusting this space.">Your story has been saved. Shared stories appear in the story library.</Notice>}
            </div>
          )}

          <div className="form-actions">
            <button className="button secondary" type="button" onClick={() => {
              apiRequest("/api/share/drafts", { method: "POST", body: JSON.stringify(storyPayload) })
                .then((data) => notify(data.message))
                .catch(() => notify("Private draft saved in this browser."));
            }}>Save privately</button>
            <div>
              <button className="button ghost" type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</button>
              <button className="button primary" type="button" onClick={nextStep}>{step === 4 ? (isPrivateChoice ? "Save privately" : "Share anonymously") : "Continue"}</button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

function labelPublishing(value) {
  return {
    private: "Only me",
    anonymous: "Share without my name",
    nickname: "Share with a nickname",
    draft: "Save and finish later",
  }[value];
}

function consentLabel(field) {
  return {
    understandPrivacy: "I know who can see this story.",
    reviewedIds: "I checked for names, phone numbers, and exact addresses.",
    deletion: "I know I can ask to delete it.",
    rules: "I agree to keep this space safe.",
  }[field];
}

function toggleWarning(warnings, warning, checked) {
  return checked ? [...warnings, warning] : warnings.filter((item) => item !== warning);
}
