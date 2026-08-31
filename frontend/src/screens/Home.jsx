import React, { useEffect, useState } from "react";
import imagePower from "../../assets/free 1.jpg";
import imageDress from "../../assets/free 2.jpg";
import imageReport from "../../assets/free 3.jpg";
import imageTell from "../../assets/free 4.jpg";
import imageFists from "../../assets/free 5.jpg";
import imageChains from "../../assets/free 6.jpg";
import imageProfile from "../../assets/free 7.jpg";
import imageVoices from "../../assets/free 8.jpg";
import imageSilence from "../../assets/free 9.jpg";
import imageChoice from "../../assets/free 10.jpg";
import { apiRequest } from "../utils/api.js";
import { useLanguage } from "../utils/language.jsx";

const goals = [
  ["A secure space to speak", "Put an experience into words without pressure, exposure, or public judgment."],
  ["Less stigma, more empathy", "Stories are presented with care so people can listen without turning the space into a comment feed."],
  ["A path to real help", "Support resources stay close: medical, legal, counselling, shelter, crisis, and inclusive care."],
  ["Private documentation", "Journal entries and vault records help preserve details on the survivor's own schedule."],
  ["Moderated community safety", "Public stories are reviewed, content warnings are applied, and harmful replies are kept out."],
];

const features = [
  ["Anonymous story sharing", "Publish anonymously, use a chosen nickname, save a draft, or keep everything fully private.", "voice"],
  ["Identifier review", "Before anything is submitted, Harbor flags phone numbers, emails, handles, and possible names.", "scan"],
  ["Moderated story library", "Content warnings, broad tags, and supportive reactions replace public comments and ranking.", "book"],
  ["Private journal", "Daily reflections, moods, tags, and recovery milestones stay private on your device.", "journal"],
  ["Evidence vault", "Keep a private record of incident notes and restricted alleged-person details without making them public.", "shield"],
  ["Support directory", "Search for trusted hotlines, counselling, legal aid, shelter, and medical resources by region.", "pin"],
];

const privacy = [
  ["Anonymous by default", "No legal name is required to share or browse."],
  ["Consent before publication", "Nothing goes public unless the survivor explicitly chooses review for publication."],
  ["No public accused-person database", "Alleged-person details stay private and are never turned into a public naming page."],
  ["Delete anytime", "Stories, journal entries, and vault records can be removed by their owner."],
  ["Human moderation", "Safety decisions are designed around trained review, not automatic publishing."],
];

const imageStories = [
  ["Private writing", "A quiet space to draft, pause, and return later.", imageProfile],
  ["Support nearby", "Verified help is easier to scan when the page feels human.", imageVoices],
  ["Healing tools", "Grounding exercises are available when you need a steady moment.", imagePower],
];

const carouselSlides = [
  { image: imageSilence, label: "Break the silence" },
  { image: imageVoices, label: "Our voices matter" },
  { image: imageChains, label: "Break every chain" },
  { image: imageFists, label: "Power in community" },
  { image: imageTell, label: "Tell someone" },
  { image: imageReport, label: "Why people wait" },
  { image: imageDress, label: "Consent is clear" },
];

const flipWords = ["believed", "heard", "safe", "in control", "not alone"];

export default function Home() {
  const [homeContent, setHomeContent] = useState(null);
  const { isFrench } = useLanguage();

  useEffect(() => {
    apiRequest("/api/home")
      .then(setHomeContent)
      .catch(() => undefined);
  }, []);

  const hero = homeContent?.hero;
  const trustItems = homeContent?.trust || ["Anonymous by default", "Private vault", "Delete anytime", "Moderated for safety"];

  return (
    <>
      <section id="home" className="hero-section">
        <div className="wrap hero-grid">
          <div className="hero-copy-block">
            <p className="eyebrow">{isFrench ? "Un espace prive pour les survivant(e)s" : (hero?.eyebrow || "A private space, built for survivors")}</p>
            <h1>{isFrench ? <>Votre histoire vous appartient <em>a votre rythme.</em></> : (hero?.title || <>Your story is yours <em>told in your own time.</em></>)}</h1>
            <p className="hero-copy">
              {isFrench ? "Harbor aide a raconter ce qui s'est passe, garder une trace privee, et trouver de l'aide tout en gardant le controle." : (hero?.copy || "Harbor is a trauma-informed place to share what happened, keep a private record, and find support while staying in control of who sees what.")}
            </p>
            <div className="hero-actions" aria-label="Primary actions">
              <a className="button primary" href="#stories">{isFrench ? "Lire ou partager une histoire" : "Read or share a story"}</a>
              <a className="button secondary" href="#support">{isFrench ? "Trouver de l'aide" : "Find support"}</a>
              <a className="button ghost" href="#campaign">{isFrench ? "Briser le silence" : "Break the Silence"}</a>
            </div>
            <p className="fine-note">{isFrench ? "Votre compte prive garde vos brouillons, votre journal et vos dossiers pour votre retour." : "Your private account keeps your drafts, journal, and vault records connected to you when you return."}</p>
          </div>

          <div className="hero-visual" aria-label="Break the silence artwork">
            <img src={imageSilence} alt="" />
          </div>
        </div>
      </section>

      <section className="trust-band" aria-label="Trust indicators">
        {trustItems.map((item) => <div key={item}><strong>{item}</strong><span>{trustCopy(item)}</span></div>)}
      </section>

      <section id="goals" className="app-section alt-section" aria-labelledby="goals-title">
        <div className="split-section">
          <figure className="image-card circle-image">
            <img src={imageChoice} alt="A large public march with signs about bodily choice and equality" />
          </figure>
          <div className="section-heading compact goals-heading">
            <p className="eyebrow">What you can expect</p>
            <h2 id="goals-title">A calmer way to write, save, and seek support.</h2>
            <p>Use only the tools that feel right for you.</p>
          </div>
        </div>
        <div className="goals-list">
          {goals.map(([title, copy]) => (
            <article className="goal" key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="app-section" aria-labelledby="features-title">
        <div className="section-heading compact">
          <p className="eyebrow">Tools</p>
          <h2 id="features-title">Private story, journal, vault, and support tools in one place.</h2>
          <p>You decide what to write, what to save, what to publish, and when to stop.</p>
        </div>
        <div className="feature-grid">
          {features.map(([title, copy, icon]) => (
            <article className="feature-card" key={title}>
              <span className="feature-icon" aria-hidden="true"><FeatureIcon name={icon} /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="carousel-section" aria-labelledby="carousel-title">
        <div className="carousel-copy">
          <p className="eyebrow">A reminder</p>
          <h2 id="carousel-title">You deserve to be <span className="word-flip" aria-hidden="true">{flipWords.map((word) => <b key={word}>{word}</b>)}</span><span className="sr-only">believed, heard, safe, in control, and not alone</span>.</h2>
        </div>
        <div className="picture-carousel" aria-label="Advocacy artwork carousel">
          <div className="carousel-track">
            {[...carouselSlides, ...carouselSlides].map((slide, index) => (
              <figure className="carousel-card" key={`${slide.label}-${index}`}>
                <img src={slide.image} alt="" />
                <figcaption>{slide.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="visual-band" aria-label="Safe to Tell experience preview">
        <div className="visual-grid">
          {imageStories.map(([title, copy, image]) => (
            <article className="visual-card image-backed" key={title}>
              <img src={image} alt="" />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-section privacy-intro" aria-labelledby="privacy-intro-title">
        <div className="section-heading compact">
          <p className="eyebrow">Safety and privacy</p>
          <h2 id="privacy-intro-title">Built so you stay in control.</h2>
          <p>Privacy is not a hidden setting. It is the default behavior of the experience.</p>
        </div>
        <ul className="check-list">
          {privacy.map(([title, copy]) => (
            <li key={title}>
              <span aria-hidden="true" />
              <p><strong>{title}</strong>{copy}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="photo-strip" aria-label="Calm safety imagery">
        <img src={imageFists} alt="Raised fists representing solidarity and collective support" />
        <div className="photo-strip-copy">
          <p className="eyebrow">You are not alone</p>
          <h2>Support can start with one private note or one trusted resource.</h2>
          <p>Move at your own pace. You can write, pause, save, delete, or leave at any time.</p>
        </div>
      </section>
    </>
  );
}

function trustCopy(item) {
  return {
    "Anonymous by default": "No legal name required.",
    "Private vault": "Records are for you, not the public.",
    "Delete anytime": "Your story belongs to you.",
    "Moderated for safety": "Supportive reactions only.",
  }[item] || "Built around survivor control.";
}

function FeatureIcon({ name }) {
  const paths = {
    voice: <><path d="M12 3a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4Z" /><path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v2M9 21h6" /></>,
    scan: <><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /><path d="M8 12h8M10 8h4M10 16h4" /></>,
    book: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v19H7.5A2.5 2.5 0 0 0 5 23V4.5Z" /><path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H20" /></>,
    journal: <><path d="M6 3h11a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M8 7h7M8 11h7M8 15h4" /></>,
    shield: <><path d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4Z" /><path d="m9 12 2 2 4-4" /></>,
    pin: <><path d="M12 21c4.5-3 7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 2.5 8 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
