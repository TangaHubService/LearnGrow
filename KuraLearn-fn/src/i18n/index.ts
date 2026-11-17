import { fr } from "./messages/fr";
import { rw } from "./messages/rw";

export type Locale = "en" | "rw" | "fr";

export const LOCALES: Locale[] = ["en", "rw", "fr"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  rw: "Kinyarwanda",
  fr: "Français",
};

/** BCP 47 tags for <html lang> and Intl formatting. */
export const LOCALE_TAGS: Record<Locale, string> = { en: "en-RW", rw: "rw-RW", fr: "fr-RW" };

/**
 * Messages are keyed by their English text, so English needs no dictionary and any
 * string without a translation still shows in English. `src/i18n/coverage.test.ts`
 * fails when a wrapped string has no Kinyarwanda or French entry.
 */
export const MESSAGES: Record<Exclude<Locale, "en">, Record<string, string>> = { rw, fr };

export type TranslateVars = Record<string, string | number | null | undefined>;

export function interpolate(template: string, vars?: TranslateVars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] === undefined || vars[name] === null ? match : String(vars[name]),
  );
}

export function translate(locale: Locale, text: string, vars?: TranslateVars) {
  const message = locale === "en" ? text : (MESSAGES[locale][text] ?? text);
  return interpolate(message, vars);
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}

/**
 * Marks English text kept as data (menu labels, option lists) for translation.
 * It returns the text unchanged; translate it with `t(label)` where it is shown.
 */
export const msg = (text: string) => text;
