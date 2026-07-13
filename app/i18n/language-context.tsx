"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DICTIONARY, LOCALES, type Locale } from "./dictionary";

const STORAGE_KEY = "reeljolt:locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof DICTIONARY)[Locale];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    // English is the default for every visitor. We only ever switch away
    // from it if the user explicitly picked another language before
    // (persisted below) — never from browser/OS locale auto-detection,
    // which used to silently flip French/German browsers to that language.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null && isLocale(stored)) {
      setLocaleState(stored);
    }
  }, []);

  function setLocale(next: Locale): void {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const value = useMemo(() => ({ locale, setLocale, t: DICTIONARY[locale] }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === null) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
