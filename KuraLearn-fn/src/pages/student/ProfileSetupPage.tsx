import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomDropdown } from "@/components/common/CustomDropdown";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard } from "@/components/student/StudentShared";
import { useLevels, useSaveStudentProfile, useStudentProfile } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw } from "lucide-react";

const languageOptions = [
  { value: "en", label: "English" },
  { value: "rw", label: "Kinyarwanda" },
  { value: "fr", label: "French" },
];
const avatarOptions = [
  { value: "star", label: "Star", description: "Bright learner profile" },
  { value: "book", label: "Book", description: "Reading-focused profile" },
  { value: "rocket", label: "Rocket", description: "Fast progress profile" },
];

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { data: profileData, isLoading: profileLoading, error: profileError } = useStudentProfile();
  const levels = useLevels();
  // No profile yet is the normal state for someone who has just signed up.
  const isNewProfile = (profileError as Error | null)?.message?.includes("not set up") ?? false;
  const saveMutation = useSaveStudentProfile(isNewProfile);

  const [fullName, setFullName] = useState("");
  const [levelId, setLevelId] = useState("");
  const [language, setLanguage] = useState("en");
  const [avatar, setAvatar] = useState("star");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [interests, setInterests] = useState("");

  useEffect(() => {
    if (profileData?.student) {
      const s = profileData.student;
      setFullName(s.user?.name || "");
      setLevelId(s.levelId || "");
      setLanguage(s.language || "en");
      setAvatar(s.avatar || "star");
      setDateOfBirth(s.dateOfBirth ? String(s.dateOfBirth).slice(0, 10) : "");
      setInterests((s.interests ?? []).join(", "));
    }
  }, [profileData]);

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader brand="KuraLearn" title="Student profile setup" subtitle="Loading profile..." />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  if (profileError && !isNewProfile) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader brand="KuraLearn" title="Student profile setup" subtitle="Error" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw size={48} className="mb-4 text-red-600" />
          <h3 className="text-xl font-bold">Failed to load profile</h3>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-indigo-600 font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    saveMutation.mutate(
      {
        fullName,
        levelId,
        language,
        avatar,
        ...(dateOfBirth ? { dateOfBirth } : {}),
        interests: interests
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
      { onSuccess: () => navigate("/") },
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        brand="KuraLearn"
        title="Student profile setup"
        subtitle="Choose the level, language, avatar and interests that shape the learner dashboard."
      />
      <StudentCard>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 font-bold">
            Full name
            <input
              className="h-12 rounded-lg border border-slate-200 px-4 font-bold outline-none focus:border-emerald-500"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 font-bold">
              Date of birth
              <input
                type="date"
                className="h-12 rounded-lg border border-slate-200 px-4 font-bold outline-none focus:border-emerald-500"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
              />
            </label>
            <CustomDropdown
              label="Level"
              value={levelId}
              options={(levels.data ?? []).map((level) => ({ value: level.id, label: level.name }))}
              loading={levels.isLoading}
              onChange={(value) => setLevelId(value ?? "")}
              clearable={false}
            />
          </div>
          <label className="grid gap-2 font-bold">
            Interests
            <input
              className="h-12 rounded-lg border border-slate-200 px-4 font-bold outline-none focus:border-emerald-500"
              placeholder="e.g. math games, stories, science"
              value={interests}
              onChange={(event) => setInterests(event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <CustomDropdown
              label="Avatar"
              value={avatar}
              options={avatarOptions}
              onChange={(value) => setAvatar(value ?? "star")}
              clearable={false}
            />
            <CustomDropdown
              label="Language"
              value={language}
              options={languageOptions}
              onChange={(value) => setLanguage(value ?? "en")}
              clearable={false}
            />
          </div>

          {saveMutation.error ? (
            <p role="alert" className="font-semibold text-red-700">
              {(saveMutation.error as Error).message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={saveMutation.isPending || !levelId}
            className="h-12 rounded-lg bg-emerald-700 font-bold text-white mt-4 hover:bg-emerald-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {saveMutation.isPending && <RefreshCw size={18} className="animate-spin" />}
            {saveMutation.isPending ? "Saving..." : "Save and continue"}
          </button>
        </form>
      </StudentCard>
    </div>
  );
}
