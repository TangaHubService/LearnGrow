import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  CornerDownLeft,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { LocaleSwitcher } from "@/i18n/LocaleSwitcher";
import { apiRequest } from "@/lib/api";
import { hasAnyRole, ROLE_GROUPS } from "@/lib/roles";
import { useOffline, usePendingSyncCount } from "@/offline/use-offline";
import { AcademicYearSelector } from "./AcademicYearSelector";
import { ROLE_LABELS, workspaceFor, type NavLink } from "./navigation";

interface GlobalHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

type AppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};
type SearchEntry = { label: string; section?: string; path: string };

function isTyping(element: Element | null) {
  return (
    element instanceof HTMLElement && element.matches("input, textarea, select, [contenteditable]")
  );
}

/** Every page in the signed-in user's own menu, so search only offers places they can open. */
function searchablePages(items: ReturnType<typeof workspaceFor>["items"]) {
  const entries: Array<{ label: string; section?: string; path: string }> = [];
  let section: string | undefined;
  for (const item of items) {
    if ("section" in item) {
      section = item.section;
      continue;
    }
    const link = item as NavLink;
    entries.push({ label: link.label, section, path: link.path });
    for (const child of link.children ?? [])
      entries.push({ label: child.label, section: link.label, path: child.path });
  }
  return entries;
}

function useClickOutside(ref: React.RefObject<HTMLElement>, onOutside: () => void) {
  useEffect(() => {
    const handle = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onOutside]);
}

export default function GlobalHeader({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
}: GlobalHeaderProps) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSuperAdmin = hasAnyRole(user, ROLE_GROUPS.superAdmin);
  // The school-year picker uses staff data; learners and parents do not need it.
  const isStaff = !isSuperAdmin && hasAnyRole(user, ROLE_GROUPS.staff);
  const { isOnline } = useOffline();
  const pendingSync = usePendingSyncCount();

  // ---------- Search over the user's own pages ----------
  const pages = useMemo(() => searchablePages(workspaceFor(user).items), [user]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useClickOutside(searchRef, () => setSearchOpen(false));

  const results: SearchEntry[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pages.filter((page) =>
      [page.label, t(page.label), page.section ?? "", page.section ? t(page.section) : ""].some(
        (text) => text.toLowerCase().includes(q),
      ),
    );
  }, [pages, query, t]);
  const quickLinks = pages.slice(0, 6);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        ((e.metaKey || e.ctrlKey) && e.key === "k") ||
        (e.key === "/" && !isTyping(document.activeElement))
      ) {
        e.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goTo = (path: string) => {
    setQuery("");
    setSearchOpen(false);
    setMobileSearchOpen(false);
    navigate(path);
  };

  // ---------- Notifications ----------
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  useClickOutside(notificationRef, () => setNotificationsOpen(false));

  const notificationsQuery = useQuery({
    queryKey: ["header-notifications"],
    queryFn: () => apiRequest<{ notifications: AppNotification[] }>("/notifications"),
    enabled: Boolean(user),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest(`/notifications/${id}/read`, { method: "PUT" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["header-notifications"] }),
  });
  const markAllRead = () =>
    notifications.filter((n) => !n.readAt).forEach((n) => markRead.mutate(n.id));

  const timeAgo = (iso: string) => {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
    if (minutes < 1) return t("Just now");
    if (minutes < 60) return t("{count} min ago", { count: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 24) return t("{count} h ago", { count: hours });
    return t("{count} d ago", { count: Math.round(hours / 24) });
  };

  // ---------- Profile menu ----------
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useClickOutside(profileRef, () => setProfileOpen(false));

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/login");
  };

  const displayName =
    user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "";
  const initials = (displayName || "U")
    .split(" ")
    .map((word: string) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = user?.role ? t(ROLE_LABELS[user.role] ?? user.role) : "";

  const searchPanel = (mobile: boolean) => (
    <div className={mobile ? "flex-1 overflow-y-auto" : ""}>
      {query.trim() === "" ? (
        <div>
          <p className="mb-1.5 px-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {t("Quick links")}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {quickLinks.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => goTo(item.path)}
                className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-left text-xs font-bold text-slate-600 transition hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <CornerDownLeft size={12} className="shrink-0 text-slate-500" aria-hidden />
                <span>{t(item.label)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-1">
          <p className="px-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {t("Matching pages ({count})", { count: results.length })}
          </p>
          {results.map((item) => (
            <button
              key={`${item.path}-${item.label}`}
              type="button"
              onClick={() => goTo(item.path)}
              className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-indigo-50"
            >
              <span className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-800">
                  {t(item.label)}
                </span>
                {item.section && (
                  <span className="text-[10px] font-semibold uppercase text-slate-500">
                    {t(item.section)}
                  </span>
                )}
              </span>
              <CornerDownLeft
                size={13}
                className="text-indigo-700 opacity-0 group-hover:opacity-100"
                aria-hidden
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-slate-500">
          <Search size={24} className="mx-auto mb-2" aria-hidden />
          <p className="text-xs font-medium">{t("No pages match “{query}”", { query })}</p>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 shadow-sm sm:px-6">
      {/* LEFT */}
      <div className="flex min-w-0 max-w-xl flex-1 items-center gap-2 sm:gap-4 lg:max-w-2xl">
        <button
          type="button"
          onClick={() =>
            window.innerWidth < 1024
              ? setSidebarOpen(!sidebarOpen)
              : setSidebarCollapsed(!sidebarCollapsed)
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label={t("Toggle navigation")}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div ref={searchRef} className="relative hidden flex-1 md:block">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
            <Search size={16} aria-hidden />
          </span>
          <input
            ref={searchInputRef}
            type="search"
            aria-label={t("Search pages")}
            placeholder={t("Search pages…")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) goTo(results[0].path);
            }}
            className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchOpen && (
            <div className="absolute left-0 top-12 z-50 max-h-[380px] w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              {searchPanel(false)}
            </div>
          )}
        </div>

        {isStaff ? <AcademicYearSelector /> : null}

        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label={t("Search pages")}
        >
          <Search size={18} />
        </button>
      </div>

      {mobileSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white p-4"
          role="dialog"
          aria-label={t("Search pages")}
        >
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 text-slate-500 hover:text-slate-800"
              aria-label={t("Close search")}
            >
              <X size={20} />
            </button>
            <input
              type="search"
              aria-label={t("Search pages")}
              placeholder={t("Search pages…")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) goTo(results[0].path);
              }}
              autoFocus
              className="h-10 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
          {searchPanel(true)}
        </div>
      )}

      {/* RIGHT */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <LocaleSwitcher compact className="hidden sm:inline-flex" />

        <div
          role="status"
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
            isOnline
              ? "border-emerald-100 bg-emerald-50/60 text-emerald-700"
              : "border-red-100 bg-red-50/60 text-red-700"
          }`}
          title={
            isOnline ? t("Connected") : t("You are offline. Changes are saved on this device.")
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`}
            aria-hidden
          />
          <span className="hidden sm:inline">{isOnline ? t("Online") : t("Offline")}</span>
          <span className="sr-only sm:hidden">{isOnline ? t("Online") : t("Offline")}</span>
        </div>

        {!isSuperAdmin && (
          <div
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium md:flex ${
              pendingSync === 0
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : isOnline
                  ? "border-blue-100 bg-blue-50 text-blue-700"
                  : "border-amber-100 bg-amber-50 text-amber-700"
            }`}
          >
            {pendingSync === 0 ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-700" aria-hidden />
                <span>{t("Synced")}</span>
              </>
            ) : isOnline ? (
              <>
                <RefreshCw size={13} className="animate-spin text-blue-600" aria-hidden />
                <span>{t("Syncing {count}…", { count: pendingSync })}</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} className="text-amber-700" aria-hidden />
                <span className="font-bold">
                  {t("{count} waiting to sync", { count: pendingSync })}
                </span>
              </>
            )}
          </div>
        )}

        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label={
              unreadCount
                ? t("Notifications, {count} unread", { count: unreadCount })
                : t("Notifications")
            }
            aria-expanded={notificationsOpen}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[360px]">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  {t("Notifications")}
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    {t("Mark all read")}
                  </button>
                )}
              </div>
              <ul className="max-h-[320px] divide-y divide-slate-100 overflow-y-auto">
                {notificationsQuery.isLoading ? (
                  <li className="py-10 text-center text-xs text-slate-500">{t("Loading…")}</li>
                ) : notifications.length === 0 ? (
                  <li className="py-10 text-center text-xs text-slate-500">
                    {t("You're all caught up")}
                  </li>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => !n.readAt && markRead.mutate(n.id)}
                        className={`flex w-full items-start gap-2.5 p-3.5 text-left transition hover:bg-slate-50 ${n.readAt ? "" : "bg-indigo-50/40"}`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-indigo-600"}`}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-xs text-slate-800 ${n.readAt ? "" : "font-bold"}`}
                          >
                            {n.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-normal text-slate-600">
                            {n.body}
                          </span>
                          <span className="mt-1 block text-[10px] font-medium text-slate-500">
                            {timeAgo(n.createdAt)}
                          </span>
                        </span>
                        {!n.readAt && <span className="sr-only">{t("Unread")}</span>}
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  {t("View all notifications")}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 transition hover:border-slate-300 hover:bg-slate-100"
            aria-label={t("Account menu")}
            aria-expanded={profileOpen}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold uppercase text-white">
              {initials}
            </span>
            <span className="hidden flex-col pr-1.5 text-left lg:flex">
              <span className="text-xs font-bold leading-tight text-slate-800">{displayName}</span>
              <span className="mt-0.5 text-[10px] font-extrabold uppercase leading-none tracking-wide text-indigo-600">
                {roleLabel}
              </span>
            </span>
            <ChevronDown
              size={12}
              className="mr-0.5 hidden shrink-0 text-slate-500 lg:block"
              aria-hidden
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="mb-1 border-b border-slate-100 px-3 py-2">
                <p className="truncate text-xs font-bold text-slate-900">{displayName}</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold leading-tight text-slate-500">
                  {user?.email}
                </p>
              </div>
              <div className="px-3 py-2 sm:hidden">
                <LocaleSwitcher className="w-full justify-start" />
              </div>
              <Link
                to={isSuperAdmin ? "/super-admin/profile" : "/profile"}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <User size={14} className="text-slate-500" aria-hidden />
                <span>{t("View profile")}</span>
              </Link>
              {!isSuperAdmin && (
                <Link
                  to={user?.role === "TEACHER" ? "/teacher/settings" : "/settings"}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Settings size={14} className="text-slate-500" aria-hidden />
                  <span>{t("Settings")}</span>
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut size={14} aria-hidden />
                <span>{t("Log out")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
