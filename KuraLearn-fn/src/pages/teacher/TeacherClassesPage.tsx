import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Edit3, Eye, Plus } from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { invalidateTeacherDashboard } from "@/hooks/useTeacherDashboard";
import { closeModal, openDrawer, openModal, pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import {
  Button,
  ErrorState,
  PageHeader,
  ProgressBar,
  SearchToolbar,
  Skeleton,
  useListParams,
  EmptyState,
} from "./teacherShared";
import { TeacherGlobalUi } from "./TeacherGlobalUi";
import { ModernTable, StatusBadge } from "@/components/ModernUi";
import { useT } from "@/i18n/I18nContext";

export function TeacherClassesPage() {
  const t = useT();
  const [params, setParams] = useListParams();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["teacher-classes", params],
    queryFn: () => lmsService.classes(params),
  });

  const archive = useMutation({
    mutationFn: (id: string) => lmsService.archiveClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-classes"] });
      invalidateTeacherDashboard(queryClient);
      dispatch(pushToast({ tone: "success", message: t("Class archived") }));
      dispatch(closeModal());
    },
  });

  async function openClassDetails(item: any) {
    try {
      const details = await queryClient.fetchQuery({
        queryKey: ["teacher-class-details", item.id],
        queryFn: () => lmsService.classDetails(item.id),
      });
      dispatch(
        openDrawer({ kind: "class-details", mode: "view", title: item.name, record: details }),
      );
    } catch (detailError) {
      dispatch(
        pushToast({
          tone: "error",
          message:
            detailError instanceof Error ? detailError.message : "Could not load class details",
        }),
      );
    }
  }

  return (
    <div>
      <PageHeader
        title={t("My Classes")}
        subtitle={t("Search, filter, sort and manage class assignments.")}
        actions={
          <Button
            onClick={() =>
              dispatch(openDrawer({ kind: "class-form", mode: "create", title: "Create class" }))
            }
          >
            <Plus size={16} /> {t("Create class")}
          </Button>
        }
      />
      <SearchToolbar
        params={params}
        setParams={setParams}
        placeholder={t("Search classes or subjects")}
      />
      {isLoading ? (
        <Skeleton />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : data?.items?.length ? (
        <ModernTable
          data={data.items}
          columns={[
            {
              header: t("Class"),
              accessor: (row: any) => (
                <div>
                  <span className="block font-bold text-slate-950">{row.name}</span>
                  <span className="text-[11px] font-semibold text-slate-500">{row.level}</span>
                </div>
              ),
            },
            { header: t("Subject"), accessor: "subjectName" },
            { header: t("Students"), accessor: "students" },
            {
              header: t("Performance"),
              className: "min-w-[180px]",
              accessor: (row: any) => <ProgressBar value={row.performance} />,
            },
            {
              header: t("Status"),
              accessor: (row: any) => <StatusBadge value={row.status} />,
            },
            {
              header: t("Actions"),
              align: "right",
              accessor: (row: any) => (
                <div className="flex justify-end gap-1.5">
                  <Button
                    aria-label={t("View details")}
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => openClassDetails(row)}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    aria-label={t("Edit")}
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      dispatch(
                        openDrawer({
                          kind: "class-form",
                          mode: "edit",
                          title: "Edit class",
                          record: row,
                        }),
                      )
                    }
                  >
                    <Edit3 size={14} />
                  </Button>
                  <Button
                    aria-label={t("Archive")}
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      dispatch(
                        openModal({
                          kind: "archive-class",
                          danger: true,
                          title: "Archive class?",
                          description: "This hides the class assignment from active operations.",
                          confirmLabel: t("Archive"),
                          record: row,
                        }),
                      )
                    }
                  >
                    <Archive size={14} />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState
          title={t("No classes found")}
          message={t("Create a class to get started.")}
          action={
            <Button
              onClick={() =>
                dispatch(openDrawer({ kind: "class-form", mode: "create", title: "Create class" }))
              }
            >
              {t("Create class")}
            </Button>
          }
        />
      )}
      <TeacherGlobalUi
        onConfirm={(modal: any) =>
          modal.kind === "archive-class" && archive.mutate((modal.record as any).id)
        }
      />
    </div>
  );
}
