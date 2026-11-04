import { TeacherGlobalUi } from "./TeacherGlobalUi";
import { MarksApprovalDashboard } from "@/components/marks/MarksApprovalDashboard";

export function TeacherMarksApprovalPage() {
  return (
    <>
      <MarksApprovalDashboard title="Marks Approval" />
      <TeacherGlobalUi />
    </>
  );
}

export default TeacherMarksApprovalPage;
