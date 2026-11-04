import { useState } from "react";
import { lmsService } from "@/services/lmsService";
import { useAppDispatch } from "@/store/appStore";
import { pushToast } from "@/store/uiSlice";
import { aiResponseToHtml } from "../utils/teacher.utils";

interface UseLessonAiProps {
  classId: string;
  subjectId: string;
  currentContent: string;
  classes: any[];
  subjects: any[];
  onGenerated: (data: {
    html: string;
    title: string;
    topic?: string;
    learningObjectives?: string;
    genericCompetencies?: string[];
    crossCuttingIssues?: string[];
    teacherActivities?: string;
    learnerActivities?: string;
    assessmentCriteria?: string;
  }) => void;
}

export function useLessonAi({
  classId,
  subjectId,
  currentContent,
  classes,
  subjects,
  onGenerated,
}: UseLessonAiProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const dispatch = useAppDispatch();

  const generate = async () => {
    if (!classId || !subjectId) {
      dispatch(pushToast({ tone: "warning", message: "Please select a Class and Subject first." }));
      return;
    }

    const className = classes.find((c) => c.id === classId)?.name;
    const subjectName = subjects.find((s) => s.id === subjectId)?.name;
    const levelName = classes.find((c) => c.id === classId)?.levelName;

    setIsGenerating(true);
    try {
      const res = await lmsService.aiComprehensive({
        taskType: "lesson_preparation",
        subjectName: subjectName || "General",
        gradeLevel: levelName || "Primary",
        teacherRequest: `Create a professional lesson plan for ${subjectName} in ${className}. The topic is ${currentContent ? "already partially written" : "related to the current curriculum"}.`,
        duration: 40,
      });

      if (res) {
        const html = aiResponseToHtml(res);
        onGenerated({
          html,
          title: res.title || "",
          topic: res.topic || "",
          learningObjectives: res.learningObjectives || "",
          genericCompetencies: res.genericCompetencies || [],
          crossCuttingIssues: res.crossCuttingIssues || [],
          teacherActivities: res.teacherActivities || "",
          learnerActivities: res.learnerActivities || "",
          assessmentCriteria: res.assessmentCriteria || "",
        });
        dispatch(pushToast({ tone: "success", message: "AI Lesson Plan generated successfully!" }));
      }
    } catch (error: any) {
      console.error("AI Generation failed", error);
      dispatch(
        pushToast({ tone: "error", message: error.message || "AI failed to generate content." }),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating };
}
