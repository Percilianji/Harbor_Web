import React, { useEffect, useState } from "react";
import { useLanguage } from "../utils/language.jsx";

const links = [
  ["#home", "Home"],
  ["#stories", "Stories"],
  ["#awareness", "Awareness"],
  ["#healing", "Healing"],
  ["#support", "Support"],
  ["#journal", "Journal"],
  ["#vault", "Vault"],
];

export default function Header({ currentPage, currentUser, onLogout }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, isFrench } = useLanguage();
  const officialRoles = ["government", "ngo"];
  const isOfficialUser = officialRoles.includes(currentUser?.role);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled || open ? "scrolled" : ""}`}>
      <nav className="nav-shell" aria-label="Main navigation">
        <a className="brand" href={currentUser ? "#home" : "#auth"} aria-label="Harbor home" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true" />
          <span>Harbor</span>
        </a>
        {currentUser && (
          <>
            <button
              className="menu-toggle icon-button"
              type="button"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
            <div className={`nav-links ${open ? "open" : ""}`}>
              {links.filter(([, label]) => !(isOfficialUser && label === "Journal")).map(([href, label]) => (
                <a
                  key={href}
                  className={currentPage === href.slice(1) ? "active" : ""}
                  href={href}
                  onClick={() => setOpen(false)}
                >
                  {isFrench ? translateNav(label) : label}
                </a>
              ))}
              {isOfficialUser && (
                <a
                  className={currentPage === "government" ? "active" : ""}
                  href="#government"
                  onClick={() => setOpen(false)}
                >
                  {isFrench ? "Impact" : "Impact"}
                </a>
              )}
              {currentUser?.role === "admin" && (
                <a
                  className={currentPage === "admin" ? "active" : ""}
                  href="#admin"
                  onClick={() => setOpen(false)}
                >
                  Admin
                </a>
              )}
            </div>
            <div className="nav-actions">
            <label className="language-select" aria-label="Language preference">
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="ENG">ENG</option>
                <option value="FR">FR</option>
              </select>
            </label>
            <button className="logout-button" type="button" onClick={() => {
              setOpen(false);
              onLogout?.();
            }}>
              {isFrench ? "Sortir" : "Sign out"}
            </button>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}

function translateNav(label) {
  return {
    Home: "Accueil",
    Stories: "Histoires",
    Awareness: "Sensibilisation",
    Healing: "Soutien",
    Support: "Aide",
    Journal: "Journal",
    Vault: "Coffre",
  }[label] || label;
}
