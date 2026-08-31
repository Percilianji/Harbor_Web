import React, { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Toast from "./components/Toast.jsx";
import ChatbotWidget from "./components/ChatbotWidget.jsx";
import Home from "./screens/Home.jsx";
import Auth from "./screens/Auth.jsx";
import ShareStory from "./screens/ShareStory.jsx";
import Stories from "./screens/Stories.jsx";
import AwarenessHub from "./screens/AwarenessHub.jsx";
import HealingHub from "./screens/HealingHub.jsx";
import Support from "./screens/Support.jsx";
import Journal from "./screens/Journal.jsx";
import Vault from "./screens/Vault.jsx";
import Campaign from "./screens/Campaign.jsx";
import GovernmentImpact from "./screens/GovernmentImpact.jsx";
import AdminPanel from "./screens/AdminPanel.jsx";
import SetPassword from "./screens/SetPassword.jsx";
import { LanguageProvider } from "./utils/language.jsx";
import { readStored, removeStored, storageKeys } from "./utils/storage.js";

const pages = {
  home: Home,
  share: ShareStory,
  stories: Stories,
  awareness: AwarenessHub,
  healing: HealingHub,
  support: Support,
  campaign: Campaign,
  government: GovernmentImpact,
  admin: AdminPanel,
  "set-password": SetPassword,
  journal: Journal,
  vault: Vault,
};

const pageTitles = {
  home: "Harbor",
  share: "Share your story | Harbor",
  stories: "Stories | Harbor",
  awareness: "Awareness Hub | Harbor",
  healing: "Healing hub | Harbor",
  support: "Find support | Harbor",
  campaign: "Break the Silence Cameroon | Harbor",
  government: "Government impact | Harbor",
  admin: "Admin panel | Harbor",
  "set-password": "Create password | Harbor",
  journal: "Journal | Harbor",
  vault: "Evidence vault | Harbor",
};

function getPageFromHash() {
  const page = (window.location.hash.replace("#", "") || "home").split("?")[0];
  return pages[page] ? page : "home";
}

export default function App() {
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(getPageFromHash);
  const [currentUser, setCurrentUser] = useState(() => readStored(storageKeys.currentUser, null));
  const notify = (message) => setToast(message);

  useEffect(() => {
    if (!currentUser) {
      if (getPageFromHash() === "set-password") {
        setPage("set-password");
        return undefined;
      }
      window.location.hash = "auth";
      setPage("home");
      return undefined;
    }

    const onHashChange = () => setPage(getPageFromHash());
    window.addEventListener("hashchange", onHashChange);
    onHashChange();
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [currentUser]);

  useEffect(() => {
    if (["government", "ngo"].includes(currentUser?.role) && page === "journal") {
      window.location.hash = "home";
      setPage("home");
    }
  }, [currentUser?.role, page]);

  useEffect(() => {
    document.title = currentUser ? pageTitles[page] : "Sign in | Harbor";
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }, [currentUser, page]);

  useEffect(() => {
    if (!currentUser) return undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = document.querySelectorAll(
      ".app-section, .trust-band, .carousel-section, .photo-strip, .feature-card, .story-card, .support-card, .journal-entry, .vault-panel"
    );

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return undefined;
    }

    targets.forEach((target) => target.classList.add("scroll-reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [currentUser, page]);

  const skipToMain = () => {
    document.getElementById("main")?.focus();
  };

  const handleAuthenticated = (user) => {
    setCurrentUser(user);
    const landingPage = user?.role === "admin" ? "admin" : "home";
    window.location.hash = landingPage;
    setPage(landingPage);
  };

  const handleLogout = () => {
    removeStored(storageKeys.currentUser);
    setCurrentUser(null);
    window.location.hash = "auth";
    notify("Signed out.");
  };

  const Page = pages[page];
  const LockedPage = Auth;
  const isBlockedGovernmentJournal = ["government", "ngo"].includes(currentUser?.role) && page === "journal";

  return (
    <LanguageProvider>
      <button className="skip-link" type="button" onClick={skipToMain}>Skip to main content</button>
      <Header currentPage={page} currentUser={currentUser} onLogout={handleLogout} />
      <main id="main" tabIndex="-1">
        {currentUser || page === "set-password" ? (
          isBlockedGovernmentJournal ? <Home notify={notify} currentUser={currentUser} /> : <Page notify={notify} currentUser={currentUser} onAuthenticated={handleAuthenticated} />
        ) : <LockedPage notify={notify} onAuthenticated={handleAuthenticated} />}
      </main>
      {currentUser && <Footer />}
      {currentUser && <ChatbotWidget />}
      <Toast message={toast} onDone={() => setToast("")} />
    </LanguageProvider>
  );
}
