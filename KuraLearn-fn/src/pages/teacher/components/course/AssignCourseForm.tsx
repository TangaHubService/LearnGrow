import { useState } from "react";
import { Button } from "@/components/common/Button";
import { useTeacherReferenceData } from "../../teacherReference";
import { Loader2 } from "lucide-react";
import { CustomDropdown } from "@/components/ModernUi";

interface AssignCourseFormProps {
  courseId: string;
  isSubmitting: boolean;
  onSubmit: (data: { classId?: string; studentIds?: string[] }) => void;
  onCancel?: () => void;
}

export function AssignCourseForm({
  courseId,
  isSubmitting,
  onSubmit,
  onCancel,
}: AssignCourseFormProps) {
  const [assignMode, setAssignMode] = useState<"CLASS" | "STUDENTS">("CLASS");
  const [selectedClassId, setSelectedClassId] = useState("");
  // Assuming we might have student selection in the future, for now, we focus on Class selection.

  const refData = useTeacherReferenceData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignMode === "CLASS" && selectedClassId) {
      onSubmit({ classId: selectedClassId });
    }
  };

  if (refData.isLoading) {
    return (
      <div className="flex justify-center p-6 text-slate-500">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="radio"
            name="assignMode"
            checked={assignMode === "CLASS"}
            onChange={() => setAssignMode("CLASS")}
            className="text-emerald-700 focus:ring-emerald-500"
          />
          Assign to Class
        </label>
        {/* Placeholder for individual student assignment mode */}
        {/*
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input 
            type="radio" 
            name="assignMode" 
            checked={assignMode === "STUDENTS"} 
            onChange={() => setAssignMode("STUDENTS")}
            className="text-emerald-700 focus:ring-emerald-500"
          />
          Assign to specific students
        </label>
        */}
      </div>

      {assignMode === "CLASS" && (
        <div>
          <CustomDropdown
            label="Select Class"
            value={selectedClassId}
            options={(refData.data?.classes || []).map((cls: any) => ({
              value: cls.id,
              label: cls.name,
              description: cls.levelName || "No level specified",
            }))}
            onChange={(val) => setSelectedClassId(val || "")}
            placeholder="-- Choose a class --"
          />
        </div>
      )}

      {/* When student mode is selected we would fetch and show a list of students */}

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || (assignMode === "CLASS" && !selectedClassId)}
        >
          {isSubmitting ? "Assigning..." : "Assign Course"}
        </Button>
      </div>
    </form>
  );
}
