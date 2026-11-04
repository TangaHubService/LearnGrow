import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import kuraLogo from "@/assets/kuraLogo.png";
import { ConfirmModal } from "@/components/ModernUi";
import { useAuth } from "@/contexts/AuthContext";
import { hasAnyRole, ROLE_GROUPS } from "@/lib/roles";
import { SkipToContent } from "@/components/common/SkipToContent";
import GlobalHeader from "./GlobalHeader";
import { workspaceFor } from "./navigation";

function CollapsedTooltip({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-16 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 origin-left flex items-center pointer-events-none">
      <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 absolute left-1"></div>
      <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap ml-2">
        {children}
      </div>
    </div>
  );
}

/** Home links that would otherwise stay highlighted on every page beneath them. */
const EXACT_MATCH_PATHS = new Set(["/", "/teacher", "/school-admin", "/super-admin"]);

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Expanded states for submenus (e.g. Marks)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "/teacher/marks": true,
  });

  // Collapse state for desktop sidebar with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    try {
      localStorage.setItem("sidebar_collapsed", String(nextState));
    } catch (e) {
      console.error(e);
    }
  };

  const isAdminWorkspace = hasAnyRole(user, ROLE_GROUPS.schoolAdmin);
  const isTeacherWorkspace = hasAnyRole(user, ROLE_GROUPS.staff);
  const { items: navItems, brandLine, activeClass } = workspaceFor(user);
  const brandName = "KuraLearn";

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
    navigate("/login");
  };

  const initial = (user?.name || user?.firstName || user?.email || "U")[0].toUpperCase();

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className="min-h-screen text-slate-900 lg:flex bg-slate-50">
      <SkipToContent />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen border-r border-slate-200 bg-white ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "w-72 lg:w-20" : "w-72 lg:w-72"}`}
      >
        <div className="relative border-b border-slate-100 p-5">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <img src={kuraLogo} alt="" className="h-9 w-9 object-contain" />
            </div>
            <div
              className={`transition-all duration-300 flex flex-col ${sidebarCollapsed ? "lg:opacity-0 lg:w-0 lg:pointer-events-none lg:absolute" : "opacity-100 w-auto"}`}
            >
              <p className="text-base font-bold whitespace-nowrap">{brandName}</p>
              <p className="text-[10px] font-semibold tracking-wide uppercase text-slate-400 whitespace-nowrap">
                {brandLine}
              </p>
            </div>
          </Link>

          {/* Collapse toggle button visible only on desktop */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:scale-110 active:scale-95 transition-all duration-200"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item, idx) => {
            // Section header
            if ("section" in item) {
              return (
                <div key={`section-${idx}`} className={`pt-4 pb-1 px-3 ${idx === 0 ? "pt-1" : ""}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {item.section}
                  </p>
                </div>
              );
            }
            const hasChildren = "children" in item && !!item.children;
            const childrenList = hasChildren ? (item as any).children : [];
            const [path, hash] = item.path.split("#");

            // Check if any subchild is active
            const isAnyChildActive =
              hasChildren && childrenList.some((child: any) => location.pathname === child.path);

            const isActive =
              isAnyChildActive ||
              (hash
                ? location.pathname === path && location.hash === `#${hash}`
                : EXACT_MATCH_PATHS.has(item.path)
                  ? location.pathname === item.path
                  : location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`));

            return (
              <div key={item.path} className="flex flex-col">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpanded(item.path)}
                    className={`group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      sidebarCollapsed ? "lg:justify-center" : "gap-3"
                    } ${
                      isActive
                        ? activeClass
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className="shrink-0" />
                      <span
                        className={`transition-all duration-300 whitespace-nowrap ${sidebarCollapsed ? "lg:opacity-0 lg:w-0 lg:pointer-events-none lg:absolute" : "opacity-100 w-auto"}`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {!sidebarCollapsed && (
                      <span className="text-slate-400 ml-auto transform transition-transform">
                        {expandedItems[item.path] ? "▾" : "▸"}
                      </span>
                    )}

                    {sidebarCollapsed && <CollapsedTooltip>{item.label}</CollapsedTooltip>}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      sidebarCollapsed ? "lg:justify-center" : "gap-3"
                    } ${
                      isActive
                        ? activeClass
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <item.icon size={18} className="shrink-0" />
                    <span
                      className={`transition-all duration-300 whitespace-nowrap ${sidebarCollapsed ? "lg:opacity-0 lg:w-0 lg:pointer-events-none lg:absolute" : "opacity-100 w-auto"}`}
                    >
                      {item.label}
                    </span>

                    {sidebarCollapsed && <CollapsedTooltip>{item.label}</CollapsedTooltip>}
                  </Link>
                )}

                {/* Sub-menu rendering */}
                {hasChildren && expandedItems[item.path] && !sidebarCollapsed && (
                  <div className="mt-1 ml-4 pl-3.5 border-l border-slate-200/60 flex flex-col gap-1.5">
                    {childrenList.map((child: any) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-150 ${
                            isChildActive
                              ? activeClass
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div
            className={`mb-3 rounded-xl p-3 bg-slate-50 transition-all duration-300 ${sidebarCollapsed ? "lg:flex lg:justify-center lg:items-center" : ""}`}
          >
            {sidebarCollapsed ? (
              <div
                className="hidden lg:grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold text-white uppercase relative group cursor-default"
                style={{
                  backgroundColor: isAdminWorkspace
                    ? "#1d4ed8"
                    : isTeacherWorkspace
                      ? "#6d3eeb"
                      : "#047857",
                }}
              >
                {initial}

                {/* Profile Details Tooltip on Hover in Collapsed State */}
                <div className="absolute left-16 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 origin-left flex items-center pointer-events-none text-left">
                  <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 absolute left-1"></div>
                  <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-md shadow-lg whitespace-nowrap ml-2 flex flex-col gap-0.5">
                    <p className="font-bold text-slate-100">
                      {user?.name ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isAdminWorkspace ? "School Administrator" : user?.email}
                    </p>
                    <p className="text-[10px] text-slate-300 font-extrabold uppercase mt-0.5 tracking-wide">
                      {user?.role}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className={`transition-all duration-300 flex flex-col ${sidebarCollapsed ? "lg:opacity-0 lg:w-0 lg:pointer-events-none lg:absolute" : "opacity-100 w-auto"}`}
            >
              <p className="truncate text-sm font-bold">
                {user?.name ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
              </p>
              <p className="truncate text-xs font-medium text-slate-500">
                {isAdminWorkspace ? "School Administrator" : user?.email}
              </p>
              <p
                className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${isAdminWorkspace ? "text-blue-700" : isTeacherWorkspace ? "text-[#6d3eeb]" : "text-emerald-700"}`}
              >
                {user?.role}
              </p>
            </div>
          </div>

          <button
            onClick={() => setLogoutOpen(true)}
            className={`group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors text-red-600 hover:bg-red-50 ${sidebarCollapsed ? "lg:justify-center lg:w-10 lg:mx-auto" : "w-full gap-3"}`}
          >
            <LogOut size={18} className="shrink-0" />
            <span
              className={`transition-all duration-300 whitespace-nowrap ${sidebarCollapsed ? "lg:opacity-0 lg:w-0 lg:pointer-events-none lg:absolute" : "opacity-100 w-auto"}`}
            >
              Log Out
            </span>

            {sidebarCollapsed && <CollapsedTooltip>Log Out</CollapsedTooltip>}
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <div className="flex-1 flex flex-col min-w-0">
        <GlobalHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 overflow-x-hidden px-4 py-6 outline-none sm:px-6 lg:px-8"
        >
          <div className="h-full w-full">{children}</div>
        </main>
      </div>

      <ConfirmModal
        open={logoutOpen}
        title="Log out?"
        message="Your current session will close on this device."
        confirmLabel="Log out"
        danger
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
