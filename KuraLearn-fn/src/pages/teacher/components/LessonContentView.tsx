import { RichTextViewer } from "@/components/editor/RichTextEditor";
import { PremiumLessonView } from "./lesson-view/PremiumLessonView";

interface LessonContentViewProps {
  content: string;
}

export function LessonContentView({ content }: LessonContentViewProps) {
  if (!content || content.trim() === "") {
    return (
      <div className="py-12 text-center text-slate-500 font-medium italic bg-slate-50/50 rounded-2xl border border-slate-100">
        No lesson content available.
      </div>
    );
  }

  return (
    <div className="lesson-content-container">
      <RichTextViewer content={content} />
    </div>
  );
}

interface LessonDetailsProps {
  lesson: any;
}

export function LessonDetailsView({ lesson }: LessonDetailsProps) {
  if (!lesson) {
    return <div className="py-12 text-center text-slate-500">No lesson data found.</div>;
  }

  return <PremiumLessonView lesson={lesson} />;
}
