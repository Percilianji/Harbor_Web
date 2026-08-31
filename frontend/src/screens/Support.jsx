import React, { useEffect, useMemo, useState } from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import { resources } from "../data/resources.js";
import { apiRequest } from "../utils/api.js";
import { useLanguage } from "../utils/language.jsx";

export default function Support({ notify }) {
  const { isFrench } = useLanguage();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(resources);

  useEffect(() => {
    apiRequest("/api/support/resources")
      .then((data) => setItems(data.resources))
      .catch(() => undefined);
  }, [notify]);

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
      <div className="support-grid">
        {visibleResources.map((resource) => (
          <article className="support-card" key={resource.name}>
            <h3>{resource.name}</h3>
            <p><strong>{resource.type}</strong></p>
            <p>{resource.place}</p>
            <div className="pill-row">
              <span className="pill">{resource.hours}</span>
              <span className="pill">{resource.languages}</span>
              <span className="pill">{resource.cost}</span>
            </div>
            <p>{resource.contact}</p>
            <footer>
              <span>Verified: {resource.verified}</span>
              <button type="button" onClick={() => {
                apiRequest(`/api/support/resources/${encodeURIComponent(resource.name)}/report`, { method: "POST" })
                  .then((data) => notify(data.message))
                  .catch(() => notify("Thanks. This resource was marked for review."));
              }}>Report incorrect info</button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
