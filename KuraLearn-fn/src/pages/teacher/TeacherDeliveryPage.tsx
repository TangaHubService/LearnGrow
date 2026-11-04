import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Bot } from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { invalidateTeacherDashboard } from "@/hooks/useTeacherDashboard";
import { closeModal, openDrawer, openModal, pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { Button, Card, PageHeader } from "./teacherShared";
import { TeacherGlobalUi } from "./TeacherGlobalUi";
import { StatusBadge } from "@/components/ModernUi";

export function TeacherDeliveryPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["delivery-lesson", lessonId],
    queryFn: () => lmsService.lessons({ pageSize: 100 }),
  });
  const lesson = data?.items?.find((item: any) => item.id === lessonId) ?? data?.items?.[0];
  const [slide, setSlide] = useState(0);
  const [notes, setNotes] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deliveryAttempted, setDeliveryAttempted] = useState(false);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const startDelivery = useMutation({
    mutationFn: (payload: any) => lmsService.startDelivery(payload),
    onSuccess: (data) => {
      setSessionId(data.session.id);
      dispatch(pushToast({ tone: "success", message: "Lesson delivery started" }));
    },
    onError: (error) =>
      dispatch(
        pushToast({
          tone: "error",
          message: error instanceof Error ? error.message : "Could not start lesson delivery",
        }),
      ),
  });

  const updateDelivery = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      lmsService.updateDelivery(id, payload),
  });

  const endDelivery = useMutation({
    mutationFn: ({ id, summary }: { id: string; summary: string }) =>
      lmsService.endDelivery(id, summary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-lessons"] });
      invalidateTeacherDashboard(queryClient);
      dispatch(closeModal());
      dispatch(pushToast({ tone: "success", message: "Lesson ended and summary saved" }));
      navigate("/teacher/lessons");
    },
    onError: (error) =>
      dispatch(
        pushToast({
          tone: "error",
          message: error instanceof Error ? error.message : "Could not end lesson",
        }),
      ),
  });

  useEffect(() => {
    if (!lesson?.id || sessionId || deliveryAttempted) return;
    setDeliveryAttempted(true);
    startDelivery.mutate({ lessonPlanId: lesson.id, classId: lesson.classId, slideIndex: slide });
  }, [lesson?.id, lesson?.classId, sessionId, deliveryAttempted, slide, startDelivery]);

  function persistDelivery(nextSlide = slide, nextNotes = notes) {
    if (!sessionId) return;
    updateDelivery.mutate({ id: sessionId, payload: { slideIndex: nextSlide, notes: nextNotes } });
  }

  function changeSlide(nextSlide: number) {
    const bounded = Math.max(0, nextSlide);
    setSlide(bounded);
    persistDelivery(bounded, notes);
  }

  function handleEndLesson() {
    if (!sessionId) {
      dispatch(closeModal());
      navigate("/teacher/lessons");
      return;
    }
    endDelivery.mutate({
      id: sessionId,
      summary: notes || `Completed ${lesson?.title ?? "lesson"} through slide ${slide + 1}.`,
    });
  }

  return (
    <div>
      <PageHeader
        title="Lesson Delivery"
        subtitle="Interactive teaching tools, participation, notes, formative checks and recap summary."
        actions={
          <Button
            variant="danger"
            onClick={() =>
              dispatch(
                openModal({
                  kind: "end-lesson",
                  title: "End lesson?",
                  description: "Generate and save the lesson delivery summary.",
                  confirmLabel: "End lesson",
                  record: lesson,
                }),
              )
            }
          >
            End lesson
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card className="min-h-[520px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-[#6d3eeb]">{lesson?.subjectName}</p>
              <h2 className="text-2xl font-bold">{lesson?.title ?? "Loading lesson"}</h2>
            </div>
            <StatusBadge value={`Slide ${slide + 1}`} />
          </div>
          <div className="mt-5 grid min-h-[300px] place-items-center rounded-lg bg-slate-950 text-white">
            <div className="text-center">
              <BookOpen className="mx-auto h-14 w-14" />
              <p className="mt-3 text-xl font-bold">
                {slide === 0 ? lesson?.objective : "Activity and formative check"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => changeSlide(slide - 1)}>
              Previous
            </Button>
            <Button onClick={() => changeSlide(slide + 1)}>Next</Button>
            <Button
              variant="secondary"
              onClick={() =>
                dispatch(
                  openDrawer({
                    kind: "ai-delivery",
                    title: "AI teaching hints",
                    mode: "ai",
                    record: lesson,
                  }),
                )
              }
            >
              <Bot size={16} /> Hint
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                dispatch(
                  openDrawer({ kind: "participation", title: "Participation", record: lesson }),
                )
              }
            >
              Participation
            </Button>
          </div>
        </Card>
        <aside className="space-y-4">
          <Card>
            <h2 className="font-bold">Teacher tools</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["Pen", "Eraser", "Text", "Shape", "Timer", "Undo"].map((tool) => (
                <Button key={tool} variant="secondary">
                  {tool}
                </Button>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="font-bold">Notes</h2>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-3 min-h-32 w-full rounded-lg border border-slate-200 p-3 font-bold outline-none"
              placeholder="Add teacher notes"
            />
            <Button
              variant="secondary"
              onClick={() => {
                persistDelivery(slide, notes);
                dispatch(
                  pushToast({
                    tone: "success",
                    message: sessionId
                      ? "Notes saved"
                      : "Notes ready to save once the session starts",
                  }),
                );
              }}
            >
              Save notes
            </Button>
          </Card>
        </aside>
      </div>
      <TeacherGlobalUi onConfirm={handleEndLesson} />
    </div>
  );
}
