import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Edit3,
  Eye,
  Library,
  Plus,
  Folder,
  Grid as GridIcon,
  FolderOpen,
  ChevronRight,
  Search,
  Tag,
  Filter,
  FileText,
  Video,
  Music,
  Image,
  Globe,
} from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { closeModal, openDrawer, openModal, pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { Button, Card, EmptyState, PageHeader, Skeleton } from "./teacherShared";
import { TeacherGlobalUi } from "./TeacherGlobalUi";
import { FolderNode, ResourceItem } from "@/services/resourcesApi";

const fileTypes = [
  "PDF",
  "WORD",
  "EXCEL",
  "POWERPOINT",
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "LINK",
  "OTHER",
];

export function TeacherResourcesPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  // Custom filters state
  const [viewMode, setViewMode] = useState<"GRID" | "FOLDERS">("FOLDERS");
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  // Folder navigation path
  const [currentPath, setCurrentPath] = useState<FolderNode[]>([]);

  // Fetch flat resources (for Grid View or Folder contents view)
  const { data: flatResourcesData, isLoading: loadingFlat } = useQuery({
    queryKey: ["teacher-resources", searchText, selectedType, selectedTag],
    queryFn: () =>
      lmsService.resources.list({
        search: searchText || undefined,
        type: selectedType || undefined,
      }),
  });
  const allResources = flatResourcesData?.items ?? [];

  // Extract all unique tags across all resources
  const allTags = Array.from(new Set(allResources.flatMap((r) => r.tags || []))).filter(Boolean);

  // Apply local tag filtering if set
  const displayedFlatResources = selectedTag
    ? allResources.filter((r) => r.tags?.includes(selectedTag))
    : allResources;

  // Fetch structural folder tree
  const { data: folders, isLoading: loadingFolders } = useQuery({
    queryKey: ["teacher-resource-folders"],
    queryFn: () => lmsService.resources.getFolders(),
    enabled: viewMode === "FOLDERS",
  });

  // Query folder scope resources specifically
  const folderParams = {
    classId: currentPath.find((n) => n.type === "class")?.id,
    subjectId: currentPath.find((n) => n.type === "subject")?.id,
    courseId: currentPath.find((n) => n.type === "course")?.id,
    lessonId: currentPath.find((n) => n.type === "lesson")?.id,
    type: selectedType || undefined,
    search: searchText || undefined,
  };

  const { data: folderResourcesData, isLoading: loadingFolderFiles } = useQuery({
    queryKey: ["teacher-resources-in-folder", folderParams],
    queryFn: () => lmsService.resources.list(folderParams),
    enabled: viewMode === "FOLDERS",
  });
  const folderFiles = folderResourcesData?.items ?? [];

  const displayedFolderFiles = selectedTag
    ? folderFiles.filter((r) => r.tags?.includes(selectedTag))
    : folderFiles;

  const isSearchingOrFiltering = !!(searchText || selectedType || selectedTag);

  const archive = useMutation({
    mutationFn: (id: string) => lmsService.resources.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-resources"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-resource-folders"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-resources-in-folder"] });
      dispatch(closeModal());
      dispatch(pushToast({ tone: "success", message: "Resource unlinked and deleted" }));
    },
    onError: (err: any) => {
      dispatch(pushToast({ tone: "error", message: err.message || "Failed to delete resource" }));
    },
  });

  // Traverse folder tree based on navigation path
  let activeFoldersList: FolderNode[] = [];
  if (folders) {
    if (currentPath.length === 0) {
      activeFoldersList = folders;
    } else {
      let current = folders;
      for (const step of currentPath) {
        const found = current.find((f) => f.id === step.id);
        if (found && found.children) {
          current = found.children;
        } else {
          current = [];
          break;
        }
      }
      activeFoldersList = current;
    }
  }

  const navigateToFolder = (node: FolderNode) => {
    setCurrentPath((prev) => [...prev, node]);
  };

  const popToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath((prev) => prev.slice(0, index + 1));
    }
  };

  const getFileIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t === "VIDEO") return <Video className="h-6 w-6 text-sky-700" />;
    if (t === "AUDIO") return <Music className="h-6 w-6 text-amber-700" />;
    if (t === "IMAGE") return <Image className="h-6 w-6 text-emerald-700" />;
    if (t === "LINK") return <Globe className="h-6 w-6 text-purple-700" />;
    return <FileText className="h-6 w-6 text-indigo-700" />;
  };

  const getFolderColor = (type: string) => {
    if (type === "class") return "text-sky-700 bg-sky-50 border-sky-100";
    if (type === "subject") return "text-emerald-700 bg-emerald-50 border-emerald-100";
    if (type === "course") return "text-purple-700 bg-purple-50 border-purple-100";
    return "text-indigo-700 bg-indigo-50 border-indigo-100";
  };

  const getFolderColors = (type: string) => {
    const t = String(type || "").toLowerCase();
    if (t === "class") {
      return {
        backStart: "#1E88E5",
        backEnd: "#1565C0",
        frontStart: "#42A5F5",
        frontEnd: "#1E88E5",
      };
    }
    if (t === "subject") {
      return {
        backStart: "#43A047",
        backEnd: "#2E7D32",
        frontStart: "#66BB6A",
        frontEnd: "#43A047",
      };
    }
    if (t === "course") {
      return {
        backStart: "#FB8C00",
        backEnd: "#EF6C00",
        frontStart: "#FFA726",
        frontEnd: "#FB8C00",
      };
    }
    return {
      backStart: "#8E24AA",
      backEnd: "#6A1B9A",
      frontStart: "#AB47BC",
      frontEnd: "#8E24AA",
    };
  };

  const getBadgeColor = (type: string) => {
    const t = String(type || "").toLowerCase();
    if (t === "class") return "bg-blue-600/95";
    if (t === "subject") return "bg-green-600/95";
    if (t === "course") return "bg-orange-600/95";
    return "bg-purple-600/95";
  };

  return (
    <div className="space-y-6 p-4">
      <PageHeader
        title="Resources"
        subtitle="Upload, organize, preview, attach and share curriculum lesson materials."
        actions={
          <Button
            className="flex items-center gap-2 bg-[#6d3eeb] hover:bg-purple-700 text-white font-bold"
            onClick={() =>
              dispatch(
                openDrawer({ kind: "resource-form", title: "Upload resource", mode: "create" }),
              )
            }
          >
            <Plus size={16} /> Upload Resource
          </Button>
        }
      />

      {/* Modern Filter Toolbar */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 transition-colors focus-within:border-[#6d3eeb] focus-within:ring-4 focus-within:ring-purple-100">
            <Search size={16} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("FOLDERS")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold border transition-all ${
                viewMode === "FOLDERS"
                  ? "bg-purple-50 border-purple-100 text-[#6d3eeb]"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Folder size={14} /> Folders View
            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold border transition-all ${
                viewMode === "GRID"
                  ? "bg-purple-50 border-purple-100 text-[#6d3eeb]"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <GridIcon size={14} /> Flat Grid View
            </button>
          </div>
        </div>

        {/* Secondary Filter Badges */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
          {/* Type Filters */}
          <span className="text-xs font-bold text-slate-500 uppercase self-center mr-2">Type:</span>
          <button
            onClick={() => setSelectedType("")}
            className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
              !selectedType
                ? "bg-[#6d3eeb] text-white border-[#6d3eeb]"
                : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
            }`}
          >
            All
          </button>
          {fileTypes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                selectedType === t
                  ? "bg-[#6d3eeb] text-white border-[#6d3eeb]"
                  : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
            <span className="text-xs font-bold text-slate-500 uppercase self-center mr-2">
              Tags:
            </span>
            <button
              onClick={() => setSelectedTag("")}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                !selectedTag
                  ? "bg-[#6d3eeb] text-white border-[#6d3eeb]"
                  : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all flex items-center gap-1 ${
                  selectedTag === tag
                    ? "bg-[#6d3eeb] text-white border-[#6d3eeb]"
                    : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                }`}
              >
                <Tag size={10} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View Rendering */}
      {viewMode === "FOLDERS" ? (
        <div className="space-y-6">
          {/* Breadcrumbs trail */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-50 px-3.5 py-2.5 border border-slate-100 text-sm font-semibold text-slate-700">
            <button
              onClick={() => popToBreadcrumb(-1)}
              className="text-slate-500 hover:text-[#6d3eeb] transition-colors flex items-center gap-1"
            >
              <Library size={15} /> Library
            </button>
            {currentPath.map((step, idx) => (
              <span key={step.id} className="flex items-center gap-1.5 text-slate-500">
                <ChevronRight size={14} />
                <button
                  onClick={() => popToBreadcrumb(idx)}
                  className={`hover:text-[#6d3eeb] transition-colors ${
                    idx === currentPath.length - 1
                      ? "text-slate-800 font-bold cursor-default"
                      : "text-slate-500"
                  }`}
                  disabled={idx === currentPath.length - 1}
                >
                  {step.name}
                </button>
              </span>
            ))}
          </div>

          {loadingFolders ? (
            <Skeleton />
          ) : (
            <div className="space-y-6">
              {activeFoldersList.length > 0 && (
                /* ONLY show Folders Grid */
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Folders ({activeFoldersList.length})
                  </h3>
                  <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                    {activeFoldersList.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => navigateToFolder(folder)}
                        className="group flex flex-col items-center text-center p-4 rounded-2xl cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 hover:shadow-sm transition-all"
                      >
                        {/* macOS Folder SVG Icon */}
                        <div className="relative mb-3 flex items-center justify-center">
                          <svg
                            className="w-16 h-16 drop-shadow-md transition-transform group-hover:scale-105"
                            viewBox="0 0 64 64"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M4 14C4 10.6863 6.68629 8 10 8H24L30 14H54C57.3137 14 60 16.6863 60 20V50C60 53.3137 57.3137 56 54 56H10C6.68629 56 4 53.3137 4 50V14Z"
                              fill={`url(#folderBackGradient-${folder.id})`}
                            />
                            <rect
                              x="12"
                              y="16"
                              width="40"
                              height="24"
                              rx="3"
                              fill="#FFFFFF"
                              opacity="0.85"
                            />
                            <path
                              d="M4 22C4 18.6863 6.68629 16 10 16H54C57.3137 16 60 18.6863 60 22V50C60 53.3137 57.3137 56 54 56H10C6.68629 56 4 53.3137 4 50V22Z"
                              fill={`url(#folderFrontGradient-${folder.id})`}
                            />
                            <path
                              d="M10 17H54C55.6569 17 57 18.3431 57 20V20.5C57 18.8431 55.6569 17.5 54 17.5H10C8.34315 17.5 7 18.8431 7 20.5V20C7 18.3431 8.34315 17 10 17Z"
                              fill="#FFFFFF"
                              opacity="0.25"
                            />
                            <defs>
                              <linearGradient
                                id={`folderBackGradient-${folder.id}`}
                                x1="4"
                                y1="8"
                                x2="60"
                                y2="56"
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={getFolderColors(folder.type).backStart}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={getFolderColors(folder.type).backEnd}
                                />
                              </linearGradient>
                              <linearGradient
                                id={`folderFrontGradient-${folder.id}`}
                                x1="4"
                                y1="16"
                                x2="60"
                                y2="56"
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={getFolderColors(folder.type).frontStart}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={getFolderColors(folder.type).frontEnd}
                                />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span
                            className={`absolute bottom-2 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase text-white shadow-sm ${getBadgeColor(folder.type)}`}
                          >
                            {folder.type}
                          </span>
                        </div>
                        <div className="w-full">
                          <p className="text-sm font-semibold text-slate-800 truncate px-1 group-hover:text-[#6d3eeb] transition-colors leading-tight">
                            {folder.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                            {folder.resourceCount} {folder.resourceCount === 1 ? "file" : "files"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Files if no subfolders exist OR if searching/filtering */}
              {(!activeFoldersList.length || isSearchingOrFiltering) && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Resources {isSearchingOrFiltering ? "(Filtered)" : ""} (
                    {displayedFolderFiles.length})
                  </h3>

                  {loadingFolderFiles ? (
                    <Skeleton />
                  ) : displayedFolderFiles.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {displayedFolderFiles.map((resource: ResourceItem) => (
                        <Card
                          key={resource.id}
                          className="border border-slate-100 shadow-sm rounded-xl p-4 bg-white flex flex-col justify-between hover:shadow-md transition-all hover:scale-[1.01]"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 uppercase">
                                {resource.type}
                              </span>
                              {resource.fileSize && (
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  {(resource.fileSize / 1024 / 1024).toFixed(2)} MB
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-start gap-2.5">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                                {getFileIcon(resource.type)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="truncate text-base font-bold text-slate-800 leading-tight">
                                  {resource.title}
                                </h4>
                                <p className="text-[11px] font-bold text-slate-500 uppercase mt-0.5">
                                  {resource.subjectName || "General"}
                                </p>
                              </div>
                            </div>

                            {resource.description && (
                              <p className="mt-2 text-xs font-medium text-slate-500 line-clamp-2">
                                {resource.description}
                              </p>
                            )}

                            {resource.tags && resource.tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {resource.tags.slice(0, 3).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-0.5 rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-100"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 flex gap-2 border-t border-slate-50 pt-3">
                            <Button
                              variant="secondary"
                              className="flex-1 text-xs py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1"
                              onClick={() =>
                                dispatch(
                                  openDrawer({
                                    kind: "resource-details",
                                    title: resource.title,
                                    record: resource,
                                  }),
                                )
                              }
                            >
                              <Eye size={13} /> Preview
                            </Button>
                            <Button
                              aria-label="Edit"
                              variant="secondary"
                              className="text-xs py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100"
                              onClick={() =>
                                dispatch(
                                  openDrawer({
                                    kind: "resource-form",
                                    title: "Edit resource",
                                    mode: "edit",
                                    record: resource,
                                  }),
                                )
                              }
                            >
                              <Edit3 size={13} />
                            </Button>
                            <Button
                              aria-label="Archive"
                              variant="secondary"
                              className="text-xs py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-none"
                              onClick={() =>
                                dispatch(
                                  openModal({
                                    kind: "archive-resource",
                                    danger: true,
                                    title: "Delete resource?",
                                    description:
                                      "This unlinks the file and permanently deletes it from the database.",
                                    confirmLabel: "Delete",
                                    record: resource,
                                  }),
                                )
                              }
                            >
                              <Archive size={13} />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 bg-slate-50/50">
                      <p className="text-sm font-semibold text-slate-500">
                        No resources aligned to this folder path matching search criteria.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* FLAT GRID VIEW */
        <div>
          {loadingFlat ? (
            <Skeleton />
          ) : displayedFlatResources.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {displayedFlatResources.map((resource: any) => (
                <Card
                  key={resource.id}
                  className="border border-slate-100 shadow-sm rounded-xl p-4 bg-white flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 uppercase">
                        {resource.type}
                      </span>
                      {resource.fileSize && (
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {(resource.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-start gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                        {getFileIcon(resource.type)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-base font-bold text-slate-800 leading-tight">
                          {resource.title}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-500 uppercase mt-0.5">
                          {resource.subjectName || "General"}
                        </p>
                      </div>
                    </div>

                    {resource.description && (
                      <p className="mt-2 text-xs font-medium text-slate-500 line-clamp-2">
                        {resource.description}
                      </p>
                    )}

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {resource.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-100"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-50 pt-3">
                    <Button
                      variant="secondary"
                      className="flex-1 text-xs py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1"
                      onClick={() =>
                        dispatch(
                          openDrawer({
                            kind: "resource-details",
                            title: resource.title,
                            record: resource,
                          }),
                        )
                      }
                    >
                      <Eye size={13} /> Preview
                    </Button>
                    <Button
                      aria-label="Edit"
                      variant="secondary"
                      className="text-xs py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      onClick={() =>
                        dispatch(
                          openDrawer({
                            kind: "resource-form",
                            title: "Edit resource",
                            mode: "edit",
                            record: resource,
                          }),
                        )
                      }
                    >
                      <Edit3 size={13} />
                    </Button>
                    <Button
                      aria-label="Archive"
                      variant="secondary"
                      className="text-xs py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-none"
                      onClick={() =>
                        dispatch(
                          openModal({
                            kind: "archive-resource",
                            danger: true,
                            title: "Delete resource?",
                            description:
                              "This unlinks the file and permanently deletes it from the database.",
                            confirmLabel: "Delete",
                            record: resource,
                          }),
                        )
                      }
                    >
                      <Archive size={13} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No resources found"
              message="Upload a resource to reuse in lessons and quizzes."
              action={
                <Button
                  className="bg-[#6d3eeb] hover:bg-purple-700 text-white font-bold"
                  onClick={() =>
                    dispatch(
                      openDrawer({
                        kind: "resource-form",
                        title: "Upload resource",
                        mode: "create",
                      }),
                    )
                  }
                >
                  Upload Resource
                </Button>
              }
            />
          )}
        </div>
      )}

      <TeacherGlobalUi
        onConfirm={(modal: any) =>
          modal.kind === "archive-resource" && archive.mutate((modal.record as any).id)
        }
      />
    </div>
  );
}
