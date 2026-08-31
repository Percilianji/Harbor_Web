import React, { useEffect, useState } from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import { stories } from "../data/stories.js";
import { apiRequest } from "../utils/api.js";
import { useLanguage } from "../utils/language.jsx";

const reactions = ["I hear you", "You are not alone", "Sending strength", "Thank you"];

export default function Stories({ notify, currentUser }) {
  const { isFrench } = useLanguage();
  const [items, setItems] = useState(stories);
  const [counts, setCounts] = useState(() => stories.map((story) => story.reactions));
  const [view, setView] = useState("all");

  useEffect(() => {
    apiRequest("/api/stories")
      .then((data) => {
        setItems(data.stories);
        setCounts(data.stories.map((story) => story.reactions));
      })
      .catch(() => undefined);
  }, [notify]);

  const react = (index) => {
    setCounts((current) => current.map((count, itemIndex) => (itemIndex === index ? count + 1 : count)));
    apiRequest(`/api/stories/${index}/reactions`, { method: "POST" }).catch(() => undefined);
    notify("Supportive reaction sent.");
  };

  const currentUserId = currentUser?.id || currentUser?.privateName || "";
  const visibleItems = view === "mine" ? items.filter((story) => story.ownerId === currentUserId) : items;

  const deleteStory = (story) => {
    if (!story.id) {
      notify("Only stories shared from your account can be deleted here.");
      return;
    }

    apiRequest(`/api/stories/${story.id}`, {
      method: "DELETE",
      body: JSON.stringify({ userId: currentUserId }),
    })
      .then((data) => {
        if (!data.deleted) {
          notify(data.message || "This story could not be deleted.");
          return;
        }
        setItems((current) => {
          const nextItems = current.filter((item) => item.id !== story.id);
          setCounts(nextItems.map((item) => item.reactions));
          return nextItems;
        });
        notify("Story deleted.");
      })
      .catch(() => notify("Could not delete story right now."));
  };

  return (
    <section id="stories" className="app-section muted-band" aria-labelledby="stories-title">
      <div className="section-title-row">
        <SectionHeading eyebrow={isFrench ? "Lire les histoires" : "Read stories"} title={isFrench ? "Une bibliotheque controlee et moderee." : "A controlled library, moderated for safety."}>
          {isFrench ? "Lisez les experiences partagees a votre rythme. Chaque histoire est simple, protegee et orientee vers le soutien." : "Read shared experiences at your own pace. Each story is kept simple, labeled with care, and designed for support rather than debate."}
        </SectionHeading>
        <a className="button primary" href="#share">{isFrench ? "Partager" : "Share story"}</a>
      </div>
      <div className="filter-bar" aria-label="Story filters">
        <label><span className="sr-only">{isFrench ? "Langue" : "Language"}</span><select aria-label={isFrench ? "Langue" : "Language"}><option>{isFrench ? "Toutes les langues" : "Any language"}</option><option>English</option><option>French</option><option>Pidgin English</option></select></label>
        <label><span className="sr-only">{isFrench ? "Sujet" : "Topic"}</span><select aria-label={isFrench ? "Sujet" : "Topic"}><option>{isFrench ? "Tous les sujets" : "Any topic"}</option><option>{isFrench ? "Soutien et guerison" : "Support and recovery"}</option><option>{isFrench ? "Experience de signalement" : "Reporting experience"}</option></select></label>
        <label><span className="sr-only">{isFrench ? "Etape" : "Healing stage"}</span><select aria-label={isFrench ? "Etape" : "Healing stage"}><option>{isFrench ? "Toutes les etapes" : "Any stage"}</option><option>{isFrench ? "Trouver les mots" : "Finding words"}</option><option>{isFrench ? "Se reconstruire" : "Rebuilding"}</option></select></label>
      </div>
      <div className="content-tabs" aria-label="Story views">
        <button className={view === "all" ? "active" : ""} type="button" onClick={() => setView("all")}>{isFrench ? "Toutes" : "All stories"}</button>
        <button className={view === "mine" ? "active" : ""} type="button" onClick={() => setView("mine")}>{isFrench ? "Mes histoires" : "My stories"}</button>
      </div>
      <div className="story-grid">
        {visibleItems.map((story) => {
          const storyIndex = items.indexOf(story);
          const isMine = story.ownerId === currentUserId;

          return (
          <article className="story-card" key={story.id || `${story.title}-${storyIndex}`}>
            <div className="story-card-body">
              <h3>{story.title}</h3>
              <p className="story-excerpt">{story.excerpt}</p>
            </div>

            <div className="story-meta-block">
              <div className="pill-row warning-row">
                {story.warnings.map((warning) => <span className="pill warning-pill" key={warning}>CW: {warning}</span>)}
              </div>
              <div className="story-details">
                <span>{story.readTime}</span>
                <span>{story.language}</span>
                <span>{story.region}</span>
                <span>{story.tags.join(", ")}</span>
              </div>
            </div>

            <div className="story-card-footer">
              <div className="reaction-row" aria-label="Supportive reactions">
                {reactions.map((reaction) => <button type="button" key={reaction} onClick={() => react(storyIndex)}>{reaction}</button>)}
              </div>
              <p className="reaction-count"><strong>{counts[storyIndex]}</strong> {isFrench ? "reactions de soutien" : "supportive reactions"}</p>
              {isMine && (
                <button className="delete-story-button" type="button" onClick={() => deleteStory(story)}>
                  {isFrench ? "Supprimer" : "Delete story"}
                </button>
              )}
            </div>
          </article>
          );
        })}
      </div>
      {view === "mine" && !visibleItems.length && (
        <p className="empty-state">{isFrench ? "Vous n'avez pas encore ajoute d'histoire publique." : "You have not added any public stories yet. Stories you share anonymously or with a nickname will appear here."}</p>
      )}
    </section>
  );
}
