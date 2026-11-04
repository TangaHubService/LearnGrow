import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/common/Button";
import { studentManagementApi } from "@/services/studentManagementService";
import { useAppDispatch } from "@/store/appStore";
import { pushToast } from "@/store/uiSlice";

const fieldClass =
  "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#6d3eeb]";

export function LinkParentForm({
  studentId,
  studentName,
  onLinked,
}: {
  studentId: string;
  studentName?: string;
  onLinked: () => void;
}) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("GUARDIAN");

  const link = useMutation({
    mutationFn: () =>
      studentManagementApi.linkParent(studentId, { email: email.trim(), relationship }),
    onSuccess: (result) => {
      dispatch(pushToast({ tone: "success", message: `${result.data.name} was linked.` }));
      setEmail("");
      setRelationship("GUARDIAN");
      onLinked();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    link.mutate();
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-900">Link a parent's account</h3>
      <p className="mt-1 text-xs text-slate-600">
        Confirm who they are first. They will be able to see
        {studentName ? ` ${studentName}'s` : " this learner's"} marks and attendance.
      </p>
      {link.error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 p-2 text-sm font-semibold text-red-700"
        >
          {(link.error as Error).message}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="min-w-[14rem] flex-1 text-xs font-semibold text-slate-700">
          Parent's email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`mt-1 w-full ${fieldClass}`}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Relationship
          <select
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            className={`custom-select mt-1 block pr-9 ${fieldClass}`}
          >
            <option value="MOTHER">Mother</option>
            <option value="FATHER">Father</option>
            <option value="GUARDIAN">Guardian</option>
          </select>
        </label>
        <Button type="submit" disabled={link.isPending}>
          {link.isPending ? "Linking..." : "Link parent"}
        </Button>
      </div>
    </form>
  );
}
