import React from "react";
import { useLanguage } from "../utils/language.jsx";

export default function EmergencyButton() {
  const { isFrench } = useLanguage();

  return (
    <div className="emergency-stack" aria-label={isFrench ? "Contacts d'urgence" : "Emergency contacts"}>
      <a className="emergency-main" href="tel:117">
        {isFrench ? "Urgence" : "Emergency"}
      </a>
      <div className="emergency-menu">
        <a href="tel:116">116 <span>{isFrench ? "MINPROFF aide famille" : "MINPROFF family help"}</span></a>
        <a href="tel:117">117 <span>{isFrench ? "Police nationale" : "National Police"}</span></a>
        <a href="tel:118">118 <span>{isFrench ? "Gendarmerie" : "Gendarmerie"}</span></a>
      </div>
    </div>
  );
}
