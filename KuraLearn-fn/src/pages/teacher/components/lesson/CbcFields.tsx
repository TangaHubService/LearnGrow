export function CbcFields({ formData, setFormData }: { formData: any; setFormData: any }) {
  return (
    <div className="sm:col-span-2">
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
        Rwanda CBC Alignment (Optional)
      </label>
      <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-bold text-slate-600">Topic</label>
          <input
            type="text"
            value={formData.topic || ""}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="e.g. Parts of a flower"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d3eeb]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Learning Objectives
          </label>
          <textarea
            value={formData.learningObjectives || ""}
            onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
            placeholder="What should learners achieve? (e.g. Identify parts of a flower)"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d3eeb]"
            rows={2}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Generic Competencies
          </label>
          <input
            type="text"
            value={formData.genericCompetencies?.join(", ") || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                genericCompetencies: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Critical thinking, Cooperation, etc."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d3eeb]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Cross-Cutting Issues
          </label>
          <input
            type="text"
            value={formData.crossCuttingIssues?.join(", ") || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                crossCuttingIssues: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Peace and values, Inclusive education, etc."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d3eeb]"
          />
        </div>
      </div>
    </div>
  );
}
