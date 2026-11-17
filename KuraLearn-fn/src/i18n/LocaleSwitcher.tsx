import { Globe } from "lucide-react";
import { LOCALE_NAMES, type Locale } from "./index";
import { useI18n } from "./I18nContext";

/** Compact language picker. Uses a native select so it works with keyboards and screen readers on every phone. */
export function LocaleSwitcher({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, availableLocales, t } = useI18n();

  return (
    <label
      className={`relative inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-slate-300 ${className}`}
    >
      <Globe size={14} aria-hidden className="shrink-0 text-slate-500" />
      <span className="sr-only">{t("Language")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="cursor-pointer appearance-none bg-transparent pr-1 font-bold outline-none"
      >
        {availableLocales.map((code) => (
          <option key={code} value={code}>
            {compact ? code.toUpperCase() : LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
