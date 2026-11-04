import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { openDrawer, pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { lmsService } from "@/services/lmsService";
import { Button, Card, PageHeader, Skeleton } from "./teacherShared";

export function TeacherSettingsPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "HEAD_TEACHER";

  // Grading Scale Editor State
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [scales, setScales] = useState<any[]>([]);

  // Fetch current grading settings
  const gradingQuery = useQuery({
    queryKey: ["grading-settings"],
    queryFn: lmsService.getGradingSettings,
    enabled: showGradingModal,
  });

  useEffect(() => {
    if (gradingQuery.data?.scales) {
      // Sort scales descending by minPercentage
      const sorted = [...gradingQuery.data.scales].sort(
        (a: any, b: any) => b.minPercentage - a.minPercentage,
      );
      setScales(sorted);
    }
  }, [gradingQuery.data]);

  const saveScalesMutation = useMutation({
    mutationFn: (payload: any) => lmsService.saveGradingSettings(payload),
    onSuccess: () => {
      dispatch(pushToast({ tone: "success", message: "Grading scales updated successfully!" }));
      queryClient.invalidateQueries({ queryKey: ["grading-settings"] });
      setShowGradingModal(false);
    },
    onError: (err: any) => {
      dispatch(
        pushToast({ tone: "error", message: err.message || "Failed to update grading scales" }),
      );
    },
  });

  const handleScaleFieldChange = (idx: number, field: string, value: any) => {
    setScales((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSaveScales = () => {
    // Validate bounds
    for (const scale of scales) {
      if (
        scale.minPercentage < 0 ||
        scale.minPercentage > 100 ||
        scale.maxPercentage < 0 ||
        scale.maxPercentage > 100
      ) {
        dispatch(
          pushToast({
            tone: "error",
            message: `Percentage bounds for Grade ${scale.grade} must be between 0 and 100`,
          }),
        );
        return;
      }
      if (Number(scale.minPercentage) > Number(scale.maxPercentage)) {
        dispatch(
          pushToast({
            tone: "error",
            message: `Grade ${scale.grade} min percentage cannot exceed max percentage`,
          }),
        );
        return;
      }
    }

    saveScalesMutation.mutate({ scales });
  };

  const handleAddScaleRow = () => {
    setScales((prev) => [
      ...prev,
      { minPercentage: 0, maxPercentage: 100, grade: "New", points: 1, remarks: "" },
    ]);
  };

  const handleRemoveScaleRow = (idx: number) => {
    setScales((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans antialiased">
      <PageHeader
        title="Teacher & School Settings"
        subtitle="Manage personal preferences, account properties, and institutional configurations."
      />
      <div className="px-4 md:px-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6 bg-white shadow-md border border-slate-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-extrabold text-slate-800 text-base">
                Profile and Account Settings
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Update your email, password, and registration data.
              </p>
            </div>
            <Button
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border-none"
              onClick={() =>
                dispatch(
                  openDrawer({
                    kind: "profile-form",
                    title: "Edit My Profile",
                    record: { name: user?.name, email: user?.email },
                  }),
                )
              }
            >
              Configure
            </Button>
          </div>
        </Card>

        {isAdmin && (
          <Card className="p-6 bg-white shadow-md border border-slate-100 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-extrabold text-slate-800 text-base">Rwandan Grading Scales</p>
                <p className="text-xs text-slate-500 mt-1">
                  Configure letters, percentages, and grade points (A-F).
                </p>
              </div>
              <Button
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border-none"
                onClick={() => setShowGradingModal(true)}
              >
                Configure Scales
              </Button>
            </div>
          </Card>
        )}

        {[
          {
            title: "Notification Preferences",
            desc: "Choose when to receive homework and attendance alerts.",
          },
          {
            title: "Appearance & Dark Mode",
            desc: "Toggle interface themes and layout alignments.",
          },
          {
            title: "AI Dashboard Controls",
            desc: "Tune natural language generation and prompt guidelines.",
          },
          {
            title: "Offline Sync Settings",
            desc: "Manage low-data environments and offline marks caching.",
          },
        ].map((item) => (
          <Card
            key={item.title}
            className="p-6 bg-white shadow-md border border-slate-100 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-extrabold text-slate-800 text-base">{item.title}</p>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
              <Button className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border-none">
                Configure
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Grading Scale Settings Modal */}
      {showGradingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-lg border border-slate-100 transform transition-all scale-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                🎓 Edit School Grading Scale
              </h3>
              <button
                className="text-slate-500 hover:text-slate-600 text-lg font-extrabold focus:outline-none"
                onClick={() => setShowGradingModal(false)}
              >
                ✕
              </button>
            </div>

            {gradingQuery.isLoading ? (
              <Skeleton />
            ) : (
              <div className="space-y-4">
                <div className="max-h-[50vh] overflow-y-auto space-y-3">
                  <table className="w-full text-left text-sm text-slate-500">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wide">
                        <th className="px-4 py-3">Grade Letter</th>
                        <th className="px-4 py-3 text-center">Min %</th>
                        <th className="px-4 py-3 text-center">Max %</th>
                        <th className="px-4 py-3 text-center">Grade Points</th>
                        <th className="px-4 py-3">Remarks / Description</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scales.map((scale: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={scale.grade}
                              onChange={(e) => handleScaleFieldChange(idx, "grade", e.target.value)}
                              className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold text-slate-800"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={scale.minPercentage}
                              onChange={(e) =>
                                handleScaleFieldChange(idx, "minPercentage", Number(e.target.value))
                              }
                              className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={scale.maxPercentage}
                              onChange={(e) =>
                                handleScaleFieldChange(idx, "maxPercentage", Number(e.target.value))
                              }
                              className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={scale.points || ""}
                              onChange={(e) =>
                                handleScaleFieldChange(idx, "points", Number(e.target.value))
                              }
                              className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-semibold"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={scale.remarks || ""}
                              onChange={(e) =>
                                handleScaleFieldChange(idx, "remarks", e.target.value)
                              }
                              placeholder="Remarks"
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleRemoveScaleRow(idx)}
                              className="text-red-600 hover:text-red-700 text-sm font-bold"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                  <Button
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border-none"
                    onClick={handleAddScaleRow}
                  >
                    + Add Grade Scale Row
                  </Button>

                  <div className="flex items-center gap-3">
                    <Button
                      className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold"
                      onClick={() => setShowGradingModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                      disabled={saveScalesMutation.isPending}
                      onClick={handleSaveScales}
                    >
                      {saveScalesMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
