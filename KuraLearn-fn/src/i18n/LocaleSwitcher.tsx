import { useI18n } from "./I18nContext";

const localeNames: Record<string, string> = {
  en: "English",
  rw: "Kinyarwanda",
  fr: "Français",
};

export function LocaleSwitcher() {
  const { locale, setLocale, availableLocales } = useI18n();

  return (
    <div className="flex items-center gap-1">
      {availableLocales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
            locale === l ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {localeNames[l] ?? l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
