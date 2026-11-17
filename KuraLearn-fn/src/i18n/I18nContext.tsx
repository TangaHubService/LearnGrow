import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LOCALES,
  LOCALE_TAGS,
  isLocale,
  translate,
  type Locale,
  type TranslateVars,
} from "./index";

const STORAGE_KEY = "kuralearn_locale";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate English UI text. Use {name} placeholders for values. */
  t: (text: string, vars?: TranslateVars) => string;
  availableLocales: Locale[];
  /** Locale tag for Intl date and number formatting. */
  localeTag: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Storage can be blocked (private mode); fall back to English.
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Keep the choice for this visit only.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (text: string, vars?: TranslateVars) => translate(locale, text, vars),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, availableLocales: LOCALES, localeTag: LOCALE_TAGS[locale] }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}

/** Shorthand for components that only need `t`. */
export function useT() {
  return useI18n().t;
}
