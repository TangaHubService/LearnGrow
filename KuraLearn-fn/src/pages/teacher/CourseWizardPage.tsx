import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { useTeacherReferenceData } from "@/pages/teacher/teacherReference";
import { pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";

// --- Sub-components ---
import { WizardProgress } from "./components/wizard/WizardProgress";
import { WizardStepInfo } from "./components/wizard/WizardStepInfo";
import { WizardStepAiOutline } from "./components/wizard/WizardStepAiOutline";
import { WizardStepReview } from "./components/wizard/WizardStepReview";

type Step = "info" | "ai-outline" | "review";
interface OutlineUnit {
  heading: string;
  content: string;
  items: string[];
}

export default function CourseWizardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: refData, isLoading: refLoading } = useTeacherReferenceData();
  const [step, setStep] = useState<Step>("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [info, setInfo] = useState({ title: "", subjectId: "", levelId: "", description: "" });
  const [outline, setOutline] = useState<OutlineUnit[]>([]);

  const generateOutline = async () => {
    setIsGenerating(true);
    try {
      const subject = refData?.subjects.find((s: any) => s.id === info.subjectId)?.name;
      const level = refData?.levels.find((l: any) => l.id === info.levelId)?.name;
      const res = await lmsService.aiComprehensive({
        taskType: "course_outline",
        subjectName: subject || "General",
        gradeLevel: level || "Primary",
        teacherRequest: `Create outline for: ${info.title}. ${info.description}`,
      });
      if (res.sections) {
        setOutline(res.sections);
        setStep("review");
      } else throw new Error("Empty outline");
    } catch (err: any) {
      dispatch(pushToast({ tone: "error", message: err.message || "Failed to generate" }));
    } finally {
      setIsGenerating(false);
    }
  };

  const finalizeCourse = async () => {
    setIsSubmitting(true);
    try {
      const courseRes = await lmsService.createCourse({ ...info, status: "DRAFT" });
      const courseId = courseRes.course.id;
      for (const section of outline) {
        const unitRes = await lmsService.createUnit(courseId, {
          title: section.heading,
          description: section.content,
          keyCompetence: section.content,
        });
        for (const item of section.items || []) {
          await lmsService.createCourseLesson(courseId, {
            unitId: unitRes.unit.id,
            title: item,
            description: "AI Generated",
          });
        }
      }
      navigate(`/teacher/courses/${courseId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6d3eeb]/10 text-[#6d3eeb]">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">Power Creator Wizard</h1>
              <p className="text-sm font-medium text-slate-500">
                Build course structure in minutes with AI.
              </p>
            </div>
          </div>
          <WizardProgress step={step} />
        </div>
      </div>
      <main className="mx-auto mt-8 max-w-4xl px-4">
        {step === "info" && (
          <WizardStepInfo
            info={info}
            setInfo={setInfo}
            refData={refData}
            refLoading={refLoading}
            onSubmit={(e) => {
              e.preventDefault();
              setStep("ai-outline");
            }}
          />
        )}
        {step === "ai-outline" && (
          <WizardStepAiOutline
            outline={outline}
            isGenerating={isGenerating}
            onGenerate={generateOutline}
            onSkip={() => setStep("review")}
          />
        )}
        {step === "review" && (
          <WizardStepReview
            info={info}
            refData={refData}
            isSubmitting={isSubmitting}
            onBack={() => setStep("info")}
            onFinalize={finalizeCourse}
          />
        )}
      </main>
    </div>
  );
}
