import React from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import { emergencyContacts } from "../data/cameroon.js";
import { useLanguage } from "../utils/language.jsx";
import { readStored, storageKeys, writeStored } from "../utils/storage.js";
import flyerImage from "../../assets/violence.jpg";

const pledgeItems = {
  ENG: [
    "I will not blame survivors.",
    "I will call for help when someone is in danger.",
    "I will teach that love does not hurt.",
    "I will protect children, women, and vulnerable people.",
  ],
  FR: [
    "Je ne blamerai pas les survivant(e)s.",
    "J'appellerai a l'aide quand quelqu'un est en danger.",
    "J'enseignerai que l'amour ne fait pas mal.",
    "Je protegerai les enfants, les femmes et les personnes vulnerables.",
  ],
};

export default function Campaign({ currentUser, notify }) {
  const { language, isFrench } = useLanguage();
  const savedFlyer = readStored(storageKeys.campaignFlyer, "");
  const activeFlyer = savedFlyer || flyerImage;
  const officialRoles = ["government", "ngo"];
  const isOfficialUser = officialRoles.includes(currentUser?.role);
  const canSeeGovernmentSpace = isOfficialUser || currentUser?.role === "admin";

  const shareFlyer = async () => {
    const shareData = {
      title: isFrench ? "Briser le silence au Cameroun" : "Break the Silence Cameroon",
      text: isFrench ? "La violence domestique est un crime. Appelez 116, 117 ou 118 en cas d'urgence." : "Domestic violence is a crime. Call 116, 117, or 118 in an emergency.",
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }

    await navigator.clipboard?.writeText(window.location.href);
    notify?.(isFrench ? "Lien de la campagne copie." : "Campaign link copied.");
  };

  const updateFlyer = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      writeStored(storageKeys.campaignFlyer, reader.result);
      notify?.(isFrench ? "Flyer mis a jour pour cette session." : "Flyer updated for this browser.");
      window.location.reload();
    };
    reader.readAsDataURL(file);
  };

  return (
    <section id="campaign" className="campaign-page">
      <div className="campaign-hero">
        <div>
          <a className="back-link" href="#home" aria-label={isFrench ? "Retour a l'accueil" : "Back to home"} />
          <p className="eyebrow">{isFrench ? "Campagne nationale" : "National campaign"}</p>
          <h1>{isFrench ? "Briser le silence au Cameroun" : "Break the Silence Cameroon"}</h1>
          <p>
            {isFrench
              ? "Une campagne communautaire pour prevenir les violences, orienter les survivant(e)s vers l'aide, et donner aux decideurs des donnees anonymes utiles."
              : "A community campaign to prevent abuse, guide survivors to help, and give decision-makers useful anonymous insight."}
          </p>
          <div className="hero-actions">
            <a className="button primary campaign-red" href="#support">{isFrench ? "Trouver de l'aide" : "Find help"}</a>
            {canSeeGovernmentSpace && (
              <a className="button primary" href="#government">{isFrench ? "Espace gouvernement" : "Government space"}</a>
            )}
          </div>
        </div>
        <aside className="campaign-flyer-panel">
          <div className="flyer-frame">
            <img src={activeFlyer} alt={isFrench ? "Flyer camerounais contre la violence domestique" : "Cameroon flyer against domestic violence"} />
            <button className="button primary flyer-share" type="button" onClick={shareFlyer}>{isFrench ? "Partager le flyer" : "Share flyer"}</button>
          </div>
          {canSeeGovernmentSpace && (
            <label className="button secondary flyer-upload">
              {isFrench ? "Changer le flyer" : "Update flyer"}
              <input type="file" accept="image/*" onChange={updateFlyer} />
            </label>
          )}
          <div className="campaign-alert">
            <strong>{isFrench ? "La violence domestique est un crime." : "Domestic violence is a crime."}</strong>
            <span>{isFrench ? "L'amour ne fait pas mal. Signalez. Protegez. Sauvez des vies." : "Love does not hurt. Report. Protect. Save lives."}</span>
          </div>
        </aside>
      </div>

      <section className="app-section campaign-section">
        <SectionHeading eyebrow={isFrench ? "Aide au Cameroun" : "Help in Cameroon"} title={isFrench ? "Trois numeros faciles a retenir." : "Three simple numbers to remember."}>
          {isFrench ? "Les contacts ci-dessous viennent du flyer partage et doivent etre verifies avec les autorites avant un lancement public." : "These contacts come from the shared flyer and should be verified with authorities before public launch."}
        </SectionHeading>
        <div className="support-grid">
          {emergencyContacts.map((item) => (
            <article className="support-card emergency-card" key={item.name}>
              <h3>{item.contact}</h3>
              <p><strong>{item.name}</strong></p>
              <p>{item.type}</p>
              <a className="button primary campaign-red" href={`tel:${item.contact.slice(0, 3)}`}>{isFrench ? "Appeler" : "Call"}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="campaign-band">
        <div>
          <p className="eyebrow">{isFrench ? "Message public" : "Public message"}</p>
          <h2>{isFrench ? "Nos femmes et filles ne sont pas des objets." : "Women and girls are not objects."}</h2>
          <p>{isFrench ? "Elles ont des droits, une dignite et le droit de vivre en securite." : "They have rights, dignity, and the right to live safely."}</p>
        </div>
      </section>

      <section className="app-section campaign-section">
        <SectionHeading eyebrow={isFrench ? "Engagement" : "Pledge"} title={isFrench ? "Des phrases simples que tout le monde peut comprendre." : "Simple promises everyone can understand."}>
          {isFrench ? "La campagne doit fonctionner dans les ecoles, les eglises, les mosquee, les marches, les universites et les quartiers." : "The campaign should work in schools, churches, mosques, markets, universities, and neighborhoods."}
        </SectionHeading>
        <div className="pledge-list">
          {pledgeItems[language].map((item) => (
            <label key={item}>
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>
    </section>
  );
}
