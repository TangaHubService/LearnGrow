import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { t as translate, type Locale } from "./index";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
  availableLocales: Locale[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem("kuralearn_locale") as Locale | null;
    if (stored && ["en", "rw", "fr"].includes(stored)) return stored;
    return "en";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("kuralearn_locale", newLocale);
  }, []);

  const t = useCallback((path: string) => translate(locale, path), [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, availableLocales: ["en", "rw", "fr"] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
