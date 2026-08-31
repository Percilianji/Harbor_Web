import React, { createContext, useContext, useMemo, useState } from "react";
import { readStored, storageKeys, writeStored } from "./storage.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => readStored(storageKeys.language, "ENG"));

  const value = useMemo(() => ({
    language,
    setLanguage(nextLanguage) {
      setLanguageState(nextLanguage);
      writeStored(storageKeys.language, nextLanguage);
    },
    isFrench: language === "FR",
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return { language: "ENG", setLanguage: () => undefined, isFrench: false };
  }
  return context;
}
