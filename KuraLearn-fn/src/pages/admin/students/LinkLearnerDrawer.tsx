import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { AppDrawer } from "@/components/common/AppDrawer";
import { Button } from "@/components/common/Button";
import { CustomDropdown } from "@/components/common/CustomDropdown";
import { studentManagementApi } from "@/services/studentManagementService";
import { useAppDispatch } from "@/store/appStore";
import { pushToast } from "@/store/uiSlice";

export function LinkLearnerDrawer({
  open,
  classes,
  onClose,
  onLinked,
}: {
  open: boolean;
  classes: Array<{ id: string; name: string }>;
  onClose: () => void;
  onLinked: () => void;
}) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [classId, setClassId] = useState("");

  const close = () => {
    setEmail("");
    setClassId("");
    link.reset();
    onClose();
  };

  const link = useMutation({
    mutationFn: studentManagementApi.linkLearner,
    onSuccess: (result) => {
      dispatch(
        pushToast({
          tone: "success",
          message: `${result.data.name} was added to ${result.data.className}.`,
        }),
      );
      onLinked();
      close();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    link.mutate({ email: email.trim(), classId });
  };

  return (
    <AppDrawer
      open={open}
      onClose={close}
      title="Add a learner who signed up"
      subtitle="Ask the learner for the email they used to create their KuraLearn account."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="link-learner-form" disabled={link.isPending || !classId}>
            {link.isPending ? "Adding..." : "Add to class"}
          </Button>
        </div>
      }
    >
      <form id="link-learner-form" onSubmit={submit} className="space-y-4">
        {link.error ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            {(link.error as Error).message}
          </p>
        ) : null}
        <label className="block text-sm font-semibold text-slate-700">
          Learner's email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#6d3eeb]"
          />
        </label>
        <CustomDropdown
          label="Class"
          value={classId}
          options={classes.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setClassId(value ?? "")}
          clearable={false}
        />
      </form>
    </AppDrawer>
  );
}
