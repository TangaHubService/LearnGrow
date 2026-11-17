import { PageHeader } from "@/components/common/PageHeader";
import { CustomDropdown } from "@/components/common/CustomDropdown";
import { StudentCard } from "@/components/student/StudentShared";
import { LOCALE_NAMES, isLocale } from "@/i18n";
import { useI18n } from "@/i18n/I18nContext";

export function SettingsPage() {
  const { t, locale, setLocale, availableLocales } = useI18n();
  const languageOptions = availableLocales.map((code) => ({
    value: code,
    label: LOCALE_NAMES[code],
  }));

  return (
    <div>
      <PageHeader
        brand={t("KuraLearn Learning")}
        title={t("Settings")}
        subtitle={t("Choose the language KuraLearn uses on this device.")}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <StudentCard>
          <h2 className="font-bold">{t("Language")}</h2>
          <div className="mt-3">
            <CustomDropdown
              label={t("Language")}
              value={locale}
              options={languageOptions}
              clearable={false}
              onChange={(value) => isLocale(value) && setLocale(value)}
            />
          </div>
        </StudentCard>
      </div>
    </div>
  );
}
