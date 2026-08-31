import React, { useEffect, useState } from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import { apiRequest } from "../utils/api.js";
import { useLanguage } from "../utils/language.jsx";

const fallbackMetrics = [
  { label: "Anonymous stories", value: "42", copy: "Stories submitted without public identity." },
  { label: "Support searches", value: "318", copy: "People looked for help by city, region, or service." },
  { label: "Emergency taps", value: "79", copy: "People opened 116, 117, or 118 from Harbor." },
  { label: "Awareness lessons", value: "506", copy: "Short lessons opened by students, caregivers, or educators." },
  { label: "Top needs", value: "Counselling, police help, legal guidance", copy: "Aggregated only, never survivor-identifying." },
  { label: "Priority regions", value: "Centre, Littoral, North-West", copy: "Example trend for planning outreach." },
];

export default function GovernmentImpact({ currentUser }) {
  const { isFrench } = useLanguage();
  const isGovernment = currentUser?.role === "government";
  const [metrics, setMetrics] = useState(fallbackMetrics);

  useEffect(() => {
    if (!isGovernment) return undefined;
    apiRequest("/api/impact/government", { headers: { "X-Harbor-Role": currentUser.role } })
      .then((data) => setMetrics(data.metrics || fallbackMetrics))
      .catch(() => setMetrics(fallbackMetrics));
  }, [currentUser?.role, isGovernment]);

  if (!isGovernment) {
    return (
      <section id="government" className="app-section" aria-labelledby="government-title">
        <SectionHeading eyebrow={isFrench ? "Acces limite" : "Restricted access"} title={isFrench ? "Espace reserve aux partenaires gouvernementaux." : "Government and approved partner access only."}>
          {isFrench ? "Connectez-vous avec un compte gouvernemental verifie pour voir les donnees d'impact anonymes." : "Sign in with a verified government account to view anonymous impact data."}
        </SectionHeading>
        <article className="restricted-panel">
          <h3>{isFrench ? "Pourquoi c'est protege" : "Why this is protected"}</h3>
          <p>{isFrench ? "Les tendances peuvent aider la planification nationale, mais les details des survivant(e)s doivent rester prives." : "Trends can help national planning, but survivor details must stay private."}</p>
          <a className="button primary" href="#auth">{isFrench ? "Se connecter" : "Sign in"}</a>
        </article>
      </section>
    );
  }

  return (
    <section id="government" className="app-section" aria-labelledby="government-title">
      <SectionHeading eyebrow={isFrench ? "Impact anonyme" : "Anonymous impact"} title={isFrench ? "Tableau de bord pour l'action publique." : "A dashboard for public action."}>
        {isFrench ? "Ces chiffres sont des exemples de prototype. En production, ils doivent venir de donnees agregees et anonymisees." : "These prototype figures show what government partners could monitor. Production data should be aggregated and anonymized."}
      </SectionHeading>

      <div className="impact-grid">
        {metrics.map((metric) => (
          <article className="impact-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.copy}</p>
          </article>
        ))}
      </div>

      <section className="policy-note">
        <h3>{isFrench ? "Ce que le gouvernement peut faire" : "What government can do next"}</h3>
        <ul className="lesson-points">
          <li>{isFrench ? "Verifier et publier les contacts officiels d'aide." : "Verify and publish official support contacts."}</li>
          <li>{isFrench ? "Prioriser les regions ou les demandes d'aide augmentent." : "Prioritize regions where help-seeking rises."}</li>
          <li>{isFrench ? "Soutenir des campagnes dans les ecoles et communautes." : "Support school and community campaigns."}</li>
          <li>{isFrench ? "Financer des services de conseil, medical, police et juridique." : "Fund counselling, medical, police, and legal response services."}</li>
        </ul>
      </section>
    </section>
  );
}
