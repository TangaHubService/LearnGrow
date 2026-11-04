import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppDrawer, ConfirmModal } from "@/components/ModernUi";
import { closeDrawer, closeModal, pushToast } from "@/store/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store/appStore";
import { Button } from "./teacherShared";
import { RecordDetails } from "./teacherReference";
import { TeacherForm } from "./TeacherAiContent";
import { LessonForm } from "./CreateLessonPage";
import { LessonDetailsView } from "./components/LessonContentView";
import { ProfileForm } from "@/components/ProfileForm";
import { SchoolSetupForm } from "@/components/SchoolSetupForm";

export function TeacherGlobalUi({ onConfirm }: { onConfirm?: (modal: any) => void }) {
  const dispatch = useAppDispatch();
  const modal = useAppSelector((state) => state.ui.modal);

  const handleCancelModal = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const handleConfirmModal = useCallback(() => {
    onConfirm?.(modal);
  }, [onConfirm, modal]);

  const modalConfig = useMemo(
    () => ({
      open: !!modal.kind,
      title: modal.title,
      message: modal.description,
      danger: modal.danger,
      confirmLabel: modal.confirmLabel,
    }),
    [modal.kind, modal.title, modal.description, modal.danger, modal.confirmLabel],
  );

  return (
    <>
      <TeacherDrawer />
      <ConfirmModal {...modalConfig} onCancel={handleCancelModal} onConfirm={handleConfirmModal} />
    </>
  );
}

function TeacherDrawer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const drawer = useAppSelector((state) => state.ui.drawer);

  const handleCloseDrawer = useCallback(() => {
    dispatch(closeDrawer());
  }, [dispatch]);

  const isForm = !!drawer.kind?.includes("form");
  const isLessonForm = drawer.kind === "lesson-form";
  const isLessonDetails = drawer.kind === "lesson-details";
  const isProfileForm = drawer.kind === "profile-form";
  const isSchoolForm = drawer.kind === "school-form";
  const isAi = !!drawer.kind?.startsWith("ai");

  const subtitle = useMemo(() => {
    if (isForm) return "Complete the required fields, then save your changes.";
    if (isLessonDetails) return "View lesson details and content";
    if (isAi) return "Review generated content before applying it.";
    return "Readable record details grouped for quick review.";
  }, [isForm, isLessonDetails, isAi]);

  const drawerOpen = useMemo(() => !!drawer.kind, [drawer.kind]);

  useEffect(() => {
    if (drawer.kind?.startsWith("ai")) {
      dispatch(closeDrawer());
      navigate("/teacher/ai");
    }
  }, [drawer.kind, dispatch, navigate]);

  const drawerSize = useMemo(() => {
    if (isLessonForm || isLessonDetails || isProfileForm || isSchoolForm) return "3xl";
    return "xl";
  }, [isLessonForm, isLessonDetails, isProfileForm, isSchoolForm]);

  const drawerConfig = useMemo(
    () => ({
      open: drawerOpen,
      title: drawer.title,
      size: drawerSize as any,
    }),
    [drawerOpen, drawer.title, drawerSize],
  );

  const footerContent = useMemo(() => {
    if (isLessonDetails) {
      return (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleCloseDrawer}>
            Close
          </Button>
        </div>
      );
    }
    return (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={handleCloseDrawer} disabled={drawer.isUploading}>
          {isForm ? "Cancel" : "Close"}
        </Button>
        {isForm ? (
          <Button type="submit" form="teacher-drawer-form" disabled={drawer.isUploading}>
            {drawer.isUploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {drawer.mode === "edit" ? "Updating..." : "Saving..."}
              </span>
            ) : (
              <>
                <CheckCircle2 size={16} /> {drawer.mode === "edit" ? "Update" : "Save"}
              </>
            )}
          </Button>
        ) : null}
      </div>
    );
  }, [handleCloseDrawer, isForm, isLessonDetails, drawer.mode, drawer.isUploading]);

  const drawerChildren = useMemo(() => {
    if (isProfileForm) {
      return (
        <ProfileForm
          initialData={drawer.record as any}
          onSubmit={async (data) => {
            console.log("Profile update:", data);
            dispatch(pushToast({ tone: "success", message: "Profile updated successfully" }));
            dispatch(closeDrawer());
          }}
        />
      );
    }
    if (isSchoolForm) {
      return (
        <SchoolSetupForm
          initialData={drawer.record as any}
          onSubmit={async (data) => {
            console.log("School update:", data);
            dispatch(pushToast({ tone: "success", message: "School settings updated" }));
            dispatch(closeDrawer());
          }}
        />
      );
    }
    if (drawer.kind?.includes("form")) {
      return <TeacherForm kind={drawer.kind} record={drawer.record} />;
    }
    return <RecordDetails record={drawer.record} />;
  }, [drawer.kind, drawer.record, isProfileForm, isSchoolForm, dispatch]);

  if (isLessonForm) {
    return (
      <AppDrawer
        {...drawerConfig}
        subtitle="Create or edit a lesson plan for your class"
        onClose={handleCloseDrawer}
      >
        <LessonForm
          record={drawer.record}
          mode={drawer.mode === "edit" ? "edit" : drawer.mode === "create" ? "create" : undefined}
          onClose={handleCloseDrawer}
        />
      </AppDrawer>
    );
  }

  if (isLessonDetails) {
    return (
      <AppDrawer
        {...drawerConfig}
        subtitle="View lesson details and content"
        onClose={handleCloseDrawer}
        footer={footerContent}
      >
        <LessonDetailsView lesson={drawer.record as any} />
      </AppDrawer>
    );
  }

  return (
    <AppDrawer
      {...drawerConfig}
      subtitle={subtitle}
      onClose={handleCloseDrawer}
      footer={footerContent}
    >
      {drawerChildren}
    </AppDrawer>
  );
}
