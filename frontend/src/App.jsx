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
import { readSession, removeSession, storageKeys } from "./utils/storage.js";

const pages = {
  home: Home,
  auth: Auth,
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
  auth: "Sign in | Harbor",
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

const protectedPages = new Set(["share", "journal", "vault"]);

const authReasons = {
  share: "Sign in so your story draft can stay connected to your private name.",
  journal: "Sign in so your journal stays private to this visit.",
  vault: "Sign in before using the vault so records are connected to your private name.",
};

function getPageFromHash() {
  const page = (window.location.hash.replace("#", "") || "home").split("?")[0];
  return pages[page] ? page : "home";
}

export default function App() {
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(getPageFromHash);
  const [currentUser, setCurrentUser] = useState(() => readSession(storageKeys.currentUser, null));
  const notify = (message) => setToast(message);

  useEffect(() => {
    const onHashChange = () => {
      const nextPage = getPageFromHash();
      if (!currentUser && protectedPages.has(nextPage)) {
        window.location.hash = `auth?returnTo=${nextPage}`;
        setPage("auth");
        return;
      }
      setPage(nextPage);
    };
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
    document.title = page === "auth" ? "Sign in | Harbor" : pageTitles[page];
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }, [page]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = document.querySelectorAll(
      ".app-section:not(#awareness), .trust-band, .carousel-section, .photo-strip, .feature-card, .story-card, .support-card:not(.awareness-card), .journal-entry, .vault-panel"
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
  }, [page]);

  const skipToMain = () => {
    document.getElementById("main")?.focus();
  };

  const handleAuthenticated = (user) => {
    setCurrentUser(user);
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const returnTo = params.get("returnTo");
    const landingPage = returnTo && pages[returnTo] ? returnTo : user?.role === "admin" ? "admin" : "home";
    window.location.hash = landingPage;
    setPage(landingPage);
  };

  const handleLogout = () => {
    removeSession(storageKeys.currentUser);
    setCurrentUser(null);
    window.location.hash = "home";
    notify("Signed out.");
  };

  const Page = pages[page];
  const isBlockedGovernmentJournal = ["government", "ngo"].includes(currentUser?.role) && page === "journal";
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const authReturnTo = params.get("returnTo");
  const authReason = authReasons[authReturnTo] || "Sign in only when you want to save private information.";

  return (
    <LanguageProvider>
      <button className="skip-link" type="button" onClick={skipToMain}>Skip to main content</button>
      <Header currentPage={page} currentUser={currentUser} onLogout={handleLogout} />
      <main id="main" tabIndex="-1">
        {page === "auth" ? (
          <Auth notify={notify} onAuthenticated={handleAuthenticated} reason={authReason} />
        ) : isBlockedGovernmentJournal ? (
          <Home notify={notify} currentUser={currentUser} />
        ) : (
          <Page notify={notify} currentUser={currentUser} onAuthenticated={handleAuthenticated} />
        )}
      </main>
      <Footer />
      <ChatbotWidget />
      <Toast message={toast} onDone={() => setToast("")} />
    </LanguageProvider>
  );
}
