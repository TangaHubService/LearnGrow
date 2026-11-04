import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { CustomDropdown } from "@/components/common/CustomDropdown";
import { StudentCard } from "@/components/student/StudentShared";

const languageOptions = [
  { value: "en", label: "English" },
  { value: "rw", label: "Kinyarwanda" },
  { value: "fr", label: "French" },
];

export function SettingsPage() {
  const [language, setLanguage] = useState("en");
  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="Settings"
        subtitle="Language, notifications, theme, sound, privacy, security and offline downloads."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <StudentCard>
          <h2 className="font-bold">Language</h2>
          <div className="mt-3">
            <CustomDropdown
              value={language}
              options={languageOptions}
              clearable={false}
              onChange={(value) => setLanguage(value ?? "en")}
            />
          </div>
        </StudentCard>
        {["Notifications", "Theme", "Sound", "Privacy and security", "Offline downloads"].map(
          (item) => (
            <StudentCard key={item}>
              <div className="flex items-center justify-between">
                <p className="font-bold">{item}</p>
                <input type="checkbox" defaultChecked aria-label={item} className="h-5 w-5" />
              </div>
            </StudentCard>
          ),
        )}
      </div>
    </div>
  );
}
