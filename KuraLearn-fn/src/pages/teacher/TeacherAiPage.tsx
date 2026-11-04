import { AiApprovalBody } from "./TeacherAiContent";
import { TeacherGlobalUi } from "./TeacherGlobalUi";

export function TeacherAiPage() {
  return (
    <div className="flex flex-col h-full">
      <AiApprovalBody kind="ai-assistant" record={null} embedded />
      <TeacherGlobalUi />
    </div>
  );
}
