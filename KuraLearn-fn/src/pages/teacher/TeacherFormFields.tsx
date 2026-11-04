import { EntitySelect } from "@/components/ModernUi";
import { useTeacherReferenceData } from "./teacherReference";

type Reference = ReturnType<typeof useTeacherReferenceData>;

export function LevelSelect({
  value,
  onChange,
  reference,
}: {
  value: string;
  onChange: (value: string) => void;
  reference: Reference;
}) {
  return (
    <EntitySelect
      label="Level"
      name="levelId"
      value={value}
      options={reference.data.levels}
      loading={reference.isLoading}
      error={reference.error instanceof Error ? reference.error.message : undefined}
      placeholder="Select level"
      emptyMessage="No levels found. Please create levels before assigning a class."
      getOptionValue={(level: any) => level.id}
      getOptionLabel={(level: any) => level.name}
      getOptionDescription={(level: any) => level.category}
      searchKeys={[(level: any) => level.name, (level: any) => level.category]}
      onChange={(next) => onChange(next ?? "")}
    />
  );
}

export function ClassSelect({
  value,
  onChange,
  reference,
}: {
  value: string;
  onChange: (value: string) => void;
  reference: Reference;
}) {
  return (
    <EntitySelect
      label="Class"
      name="classId"
      value={value}
      options={reference.data.classes}
      loading={reference.isLoading}
      error={reference.error instanceof Error ? reference.error.message : undefined}
      placeholder="Select class"
      emptyMessage="No classes available. Please create a class first."
      getOptionValue={(classRecord: any) => classRecord.id}
      getOptionLabel={(classRecord: any) =>
        `${classRecord.name}${classRecord.levelName ? ` - ${classRecord.levelName}` : ""}`
      }
      getOptionDescription={(classRecord: any) =>
        `${classRecord.subjectName ? `${classRecord.subjectName} - ` : ""}${classRecord.students ?? 0} students`
      }
      searchKeys={[
        (classRecord: any) => classRecord.name,
        (classRecord: any) => classRecord.levelName,
        (classRecord: any) => classRecord.subjectName,
      ]}
      onChange={(next) => onChange(next ?? "")}
    />
  );
}

export function SubjectSelect({
  value,
  onChange,
  reference,
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  reference: Reference;
  required?: boolean;
}) {
  return (
    <EntitySelect
      label="Subject"
      name="subjectName"
      value={value}
      options={reference.data.subjects}
      loading={reference.isLoading}
      placeholder={required ? "Select subject" : "Select subject if relevant"}
      emptyMessage="No subjects found. Please create subjects before assigning work."
      getOptionValue={(subject: any) => subject.name}
      getOptionLabel={(subject: any) => subject.name}
      getOptionDescription={(subject: any) => subject.levelName ?? subject.category}
      searchKeys={[
        (subject: any) => subject.name,
        (subject: any) => subject.levelName,
        (subject: any) => subject.category,
      ]}
      onChange={(next) => onChange(next ?? "")}
    />
  );
}

export function RecipientSelect({
  value,
  onChange,
  reference,
}: {
  value: string;
  onChange: (value: string) => void;
  reference: Reference;
}) {
  return (
    <EntitySelect
      label="Recipient"
      name="recipientId"
      value={value}
      options={reference.data.recipients}
      loading={reference.isLoading}
      error={reference.error instanceof Error ? reference.error.message : undefined}
      placeholder="Select recipient"
      emptyMessage="No recipients found. Please create students, parents, or staff first."
      getOptionValue={(recipient: any) => recipient.recipientId}
      getOptionLabel={(recipient: any) => `${recipient.name} - ${recipient.roleLabel}`}
      getOptionDescription={(recipient: any) =>
        [recipient.email, recipient.className, recipient.status].filter(Boolean).join(" - ")
      }
      searchKeys={[
        (recipient: any) => recipient.name,
        (recipient: any) => recipient.email,
        (recipient: any) => recipient.className,
        (recipient: any) => recipient.roleLabel,
      ]}
      onChange={(next) => onChange(next ?? "")}
    />
  );
}

export function Input({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 font-medium text-slate-700">
      {label}
      {required ? <span className="sr-only">required</span> : null}
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="h-11 rounded-lg border border-slate-200 px-3 font-normal text-slate-900 outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
      />
    </label>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 font-medium text-slate-700">
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue}
        className="min-h-28 rounded-lg border border-slate-200 p-3 font-normal text-slate-900 outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
      />
    </label>
  );
}
