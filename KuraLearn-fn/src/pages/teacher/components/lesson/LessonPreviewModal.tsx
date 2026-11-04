import { X } from "lucide-react";
import { LessonDetailsView } from "../LessonContentView";

export function LessonPreviewModal({
  show,
  onClose,
  formData,
  reference,
}: {
  show: boolean;
  onClose: () => void;
  formData: any;
  reference: any;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-950">Lesson Preview</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-0" style={{ maxHeight: "calc(90vh - 140px)" }}>
          <LessonDetailsView
            lesson={{
              ...formData,
              subjectName: reference.data.subjects.find((s: any) => s.id === formData.subjectId)
                ?.name,
              className: reference.data.classes.find((c: any) => c.id === formData.classId)?.name,
              teacherName: "Current Teacher",
              updatedAt: new Date().toISOString(),
            }}
          />
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#6d3eeb] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#5b31cb]"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
