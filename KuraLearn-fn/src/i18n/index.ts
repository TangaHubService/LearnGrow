import { en, type Translations } from "./locales/en";
import { rw } from "./locales/rw";
import { fr } from "./locales/fr";

export type Locale = "en" | "rw" | "fr";

const translations: Record<Locale, Translations> = { en, rw, fr };

export function t(locale: Locale, path: string): string {
  const keys = path.split(".");
  let value: any = translations[locale];
  for (const key of keys) {
    value = value?.[key];
  }
  return (value as string) ?? path;
}

export { en, rw, fr };
export type { Translations };
