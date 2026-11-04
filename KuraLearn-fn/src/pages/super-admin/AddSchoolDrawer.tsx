import { type FormEvent, useState } from "react";
import { Button } from "@/components/common/Button";
import { AppDrawer } from "@/components/common/AppDrawer";
import { superAdminApi } from "@/services/superAdminApi";
import { useSuperAdminAction } from "./useSuperAdminAction";

const EMPTY_FORM = {
  name: "",
  type: "PUBLIC",
  district: "",
  phone: "",
  email: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#6d3eeb]";

function createTemporaryPassword() {
  const values = crypto.getRandomValues(new Uint32Array(3));
  return `Kura-${Array.from(values, (value) => value.toString(36)).join("")}`;
}

export function AddSchoolDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const close = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const create = useSuperAdminAction(
    superAdminApi.createSchool,
    (input) => `${input.name} was added. Share the temporary password with ${input.adminName}.`,
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      {
        name: form.name.trim(),
        type: form.type,
        district: form.district.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword,
      },
      { onSuccess: close },
    );
  };

  const field = (
    key: keyof typeof EMPTY_FORM,
    label: string,
    options: { type?: string; required?: boolean; minLength?: number } = {},
  ) => (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type={options.type ?? "text"}
        required={options.required}
        minLength={options.minLength}
        value={form[key]}
        onChange={(event) => set(key, event.target.value)}
        className={inputClass}
      />
    </label>
  );

  return (
    <AppDrawer
      open={open}
      onClose={close}
      title="Add a school"
      subtitle="The school starts on a trial, with its first administrator."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="add-school-form" disabled={create.isPending}>
            {create.isPending ? "Adding..." : "Add school"}
          </Button>
        </div>
      }
    >
      <form id="add-school-form" onSubmit={submit} className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold text-slate-900">School</legend>
          {field("name", "School name", { required: true, minLength: 2 })}
          <label className="block text-sm font-semibold text-slate-700">
            Type
            <select
              value={form.type}
              onChange={(event) => set("type", event.target.value)}
              className={`custom-select ${inputClass}`}
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
              <option value="COMMUNITY">Community</option>
            </select>
          </label>
          {field("district", "District")}
          {field("phone", "Phone")}
          {field("email", "School email", { type: "email" })}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-bold text-slate-900">First administrator</legend>
          {field("adminName", "Full name", { required: true, minLength: 2 })}
          {field("adminEmail", "Email", { type: "email", required: true })}
          <div>
            {field("adminPassword", "Temporary password", { required: true, minLength: 8 })}
            <button
              type="button"
              onClick={() => set("adminPassword", createTemporaryPassword())}
              className="mt-1 text-xs font-bold text-[#6d3eeb]"
            >
              Create one for me
            </button>
            <p className="mt-1 text-xs text-slate-500">
              Copy it before saving. It is not shown again, and it is not sent by email.
            </p>
          </div>
        </fieldset>
      </form>
    </AppDrawer>
  );
}
