import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasAnyRole, ROLE_GROUPS } from "@/lib/roles";
import { AcademicYearSelector } from "./AcademicYearSelector";
import {
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Bell,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  History,
  CornerDownLeft,
  ChevronDown,
  Sparkles,
} from "lucide-react";

interface GlobalHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

interface MockNotification {
  id: number;
  category: "sync" | "alert";
  text: string;
  time: string;
  read: boolean;
}

interface SearchItem {
  category: "Students" | "Classes" | "Pages" | "Reports";
  label: string;
  path: string;
}

const mockSearchDatabase: SearchItem[] = [
  { category: "Students", label: "Kwizera Jean (P6 Blue)", path: "/teacher/learners" },
  { category: "Students", label: "Uwase Alice (S3 Physics)", path: "/teacher/learners" },
  { category: "Students", label: "Mugisha Eric (S1)", path: "/teacher/learners" },
  { category: "Classes", label: "P6 Blue - Mathematics", path: "/teacher/classes" },
  { category: "Classes", label: "S3 Physics - Science", path: "/teacher/classes" },
  { category: "Pages", label: "Remedial Settings", path: "/teacher/settings" },
  { category: "Pages", label: "Attendance Dashboard", path: "/teacher/attendance" },
  { category: "Pages", label: "Marks Sheet Entry", path: "/teacher/marks" },
  { category: "Reports", label: "Term 2 Syllabus Coverage", path: "/teacher/reports" },
  { category: "Reports", label: "REB Competency Analytics", path: "/teacher/reports" },
];

function isTyping(element: Element | null) {
  return (
    element instanceof HTMLElement && element.matches("input, textarea, select, [contenteditable]")
  );
}

export default function GlobalHeader({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
}: GlobalHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = hasAnyRole(user, ROLE_GROUPS.superAdmin);

  // 1. Online / Offline Status
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  // 2. Synchronization Status (Synced, Syncing..., Pending Changes)
  const [syncStatus, setSyncStatus] = useState<"Synced" | "Syncing..." | "Pending Changes">(
    isOnline ? "Synced" : "Pending Changes",
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus("Syncing...");
      const timer = setTimeout(() => {
        setSyncStatus("Synced");
      }, 2000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("Pending Changes");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 3. Search State
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("kuralearn_recent_searches");
      return saved ? JSON.parse(saved) : ["Kwizera Jean", "S3 Physics Marks", "P6 Attendance"];
    } catch {
      return ["Kwizera Jean", "S3 Physics Marks", "P6 Attendance"];
    }
  });

  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard focus shortcut (⌘K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchFocused(true);
        searchInputRef.current?.focus();
      } else if (e.key === "/" && !isTyping(document.activeElement)) {
        e.preventDefault();
        setSearchFocused(true);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = mockSearchDatabase.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setSearchResults(filtered);
  }, [searchQuery]);

  // Click outside listener for search & dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (queryText: string, path?: string) => {
    if (!queryText.trim()) return;

    const updated = [queryText, ...recentSearches.filter((q) => q !== queryText)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("kuralearn_recent_searches", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setSearchQuery("");
    setSearchFocused(false);
    setMobileSearchOpen(false);

    if (path) {
      navigate(path);
    } else {
      navigate(`/teacher/learners?search=${encodeURIComponent(queryText)}`);
    }
  };

  // 4. Notifications Bell State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState<"all" | "sync" | "alert">(
    "all",
  );
  const [notifications, setNotifications] = useState<MockNotification[]>([
    {
      id: 1,
      category: "sync",
      text: "Sync Complete: P5 Mathematics Term 2 marks uploaded successfully",
      time: "2 mins ago",
      read: false,
    },
    {
      id: 2,
      category: "alert",
      text: "Remedial action plan needed: 4 learners in S3 Physics require catch-up worksheets",
      time: "10 mins ago",
      read: false,
    },
    {
      id: 3,
      category: "sync",
      text: "Offline Saved: Attendance sheet for P6 Blue saved locally (awaiting connection)",
      time: "1 hour ago",
      read: true,
    },
    {
      id: 4,
      category: "alert",
      text: "REB Competency standard updated for Secondary Level STEM courses",
      time: "4 hours ago",
      read: false,
    },
  ]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifications.filter((n) => {
    if (activeNotificationTab === "all") return true;
    return n.category === activeNotificationTab;
  });

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const toggleNotificationRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  // 5. User Profile Dropdown State
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/login");
  };

  const initials = (user?.name || user?.firstName || user?.email || "U")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const userRole = user?.role || "Staff";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-4 flex-1 max-w-xl lg:max-w-2xl">
        {/* Sidebar toggler (drawer on mobile / collapse toggle on desktop) */}
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              setSidebarOpen(!sidebarOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
          aria-label="Toggle Navigation Sidebar"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Global Search Bar (Focus Area) */}
        <div className={`relative flex-1 ${isSuperAdmin ? "hidden" : "hidden md:block"}`}>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
              <Search size={16} />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search anything (students, reports, attendance)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="w-full h-10 rounded-full border border-slate-200 pl-11 pr-14 text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
            />
            {/* Keyboard shortcut badges */}
            <div className="absolute inset-y-0 right-3 flex items-center gap-1 pointer-events-none text-[10px] font-bold text-slate-500">
              <kbd className="h-5 px-1.5 grid place-items-center rounded bg-slate-200/70 border border-slate-300">
                ⌘
              </kbd>
              <kbd className="h-5 px-1.5 grid place-items-center rounded bg-slate-200/70 border border-slate-300">
                K
              </kbd>
            </div>
          </div>

          {/* Autocomplete Suggestions Panel */}
          {searchFocused && (
            <div
              ref={searchDropdownRef}
              className="absolute left-0 top-12 z-50 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-xl max-h-[380px] overflow-y-auto"
            >
              {searchQuery.trim() === "" ? (
                <div>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 px-2.5 mb-1.5">
                        Recent Searches
                      </p>
                      <div className="space-y-0.5">
                        {recentSearches.map((term, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchQuery(term);
                              handleSearchSubmit(term);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left transition-colors"
                          >
                            <History size={13} className="text-slate-500 shrink-0" />
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick System Links */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 px-2.5 mb-1.5">
                      Quick Links
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Marks Entry", path: "/teacher/marks" },
                        { label: "Attendance Sheet", path: "/teacher/attendance" },
                        { label: "REB Reports", path: "/teacher/reports" },
                        { label: "Remedial Center", path: "/teacher/settings" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchFocused(false);
                            navigate(item.path);
                          }}
                          className="flex items-center gap-2 px-3 py-2 border border-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-100 text-left transition-all duration-150"
                        >
                          <CornerDownLeft size={12} className="shrink-0 text-slate-500" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {searchResults.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 px-2.5">
                        Matching Results ({searchResults.length})
                      </p>
                      <div className="space-y-0.5">
                        {searchResults.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearchSubmit(item.label, item.path)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-indigo-50 text-left transition-colors group"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-800">
                                {item.label}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase">
                                {item.category}
                              </span>
                            </div>
                            <CornerDownLeft
                              size={13}
                              className="opacity-0 group-hover:opacity-100 text-indigo-700 transition-opacity"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-500">
                      <Search size={24} className="mx-auto mb-2 text-slate-500" />
                      <p className="text-xs font-medium">No results found for "{searchQuery}"</p>
                      <p className="text-[10px] mt-0.5 text-slate-500">
                        Try searching classes, students or pages
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {isSuperAdmin ? null : <AcademicYearSelector />}

        {/* Mobile Search Button (visible only on mobile) */}
        <button
          ref={searchButtonRef}
          onClick={() => setMobileSearchOpen(true)}
          className={`${isSuperAdmin ? "hidden" : "md:hidden flex"} h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus:outline-none`}
          aria-label="Search"
        >
          <Search size={18} />
        </button>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white p-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 text-slate-500 hover:text-slate-800"
            >
              <X size={20} />
            </button>
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-10 rounded-full border border-slate-200 pl-10 pr-4 text-sm bg-slate-50 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchQuery.trim() === "" ? (
              <div className="space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">
                      Recent Searches
                    </p>
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchQuery(term);
                          handleSearchSubmit(term);
                        }}
                        className="w-full flex items-center gap-2.5 py-2.5 border-b border-slate-50 text-xs font-semibold text-slate-700"
                      >
                        <History size={14} className="text-slate-500" />
                        {term}
                      </button>
                    ))}
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">
                    Quick Navigation
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Marks Entry", path: "/teacher/marks" },
                      { label: "Attendance", path: "/teacher/attendance" },
                      { label: "Reports", path: "/teacher/reports" },
                      { label: "Remedial", path: "/teacher/settings" },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setMobileSearchOpen(false);
                          navigate(item.path);
                        }}
                        className="p-3 border border-slate-100 rounded-lg text-center text-xs font-bold text-slate-700 hover:bg-indigo-50"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchSubmit(item.label, item.path)}
                        className="w-full flex flex-col py-2.5 border-b border-slate-50 text-left"
                      >
                        <span className="text-sm font-bold text-slate-800">{item.label}</span>
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase">
                          {item.category}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    <p className="text-sm">No matching results.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* 1. Online / Offline Indicator */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-200 border ${
            isOnline
              ? "bg-emerald-50/60 border-emerald-100 text-emerald-700"
              : "bg-red-50/60 border-red-100 text-red-700 animate-pulse"
          }`}
          title={
            isOnline
              ? "You are connected to KuraLearn Cloud Servers"
              : "You are working offline. Edits are saved on this device."
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500 animate-ping"}`}
          />
          <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
        </div>

        {/* 2. Synchronization Status Indicator */}
        <div
          className={`${isSuperAdmin ? "hidden" : "hidden md:flex"} items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
            syncStatus === "Synced"
              ? "bg-slate-50 border-slate-200 text-slate-600"
              : syncStatus === "Syncing..."
                ? "bg-blue-50 border-blue-100 text-blue-700"
                : "bg-amber-50 border-amber-100 text-amber-700"
          }`}
        >
          {syncStatus === "Synced" && (
            <>
              <CheckCircle2 size={13} className="text-emerald-700" />
              <span>Synced</span>
            </>
          )}
          {syncStatus === "Syncing..." && (
            <>
              <RefreshCw size={13} className="animate-spin text-blue-600" />
              <span>Syncing...</span>
            </>
          )}
          {syncStatus === "Pending Changes" && (
            <>
              <AlertTriangle size={13} className="text-amber-700" />
              <span className="font-bold">Pending Changes</span>
            </>
          )}
        </div>

        {/* 3. Notification Bell with Dropdown */}
        {isSuperAdmin ? (
          <Link
            to="/notifications"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label="View notifications"
          >
            <Bell size={18} />
          </Link>
        ) : (
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
              aria-label="View notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {notificationsOpen && (
              <div className="absolute right-0 top-12 z-50 w-[320px] sm:w-[360px] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Categorization Tabs */}
                <div className="flex border-b border-slate-100 px-3 bg-white">
                  {(["all", "alert", "sync"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveNotificationTab(tab)}
                      className={`flex-1 py-2 text-center text-xs font-bold capitalize transition-colors border-b-2 ${
                        activeNotificationTab === tab
                          ? "border-indigo-600 text-indigo-700"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Notification Items */}
                <div className="max-h-[280px] overflow-y-auto bg-white divide-y divide-slate-100">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => toggleNotificationRead(notif.id)}
                        className={`group flex items-start gap-2.5 p-3.5 hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          !notif.read ? "bg-indigo-50/20" : ""
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.category === "sync" ? (
                            <RefreshCw
                              size={13}
                              className={`text-blue-600 ${!notif.read ? "animate-pulse" : ""}`}
                            />
                          ) : (
                            <AlertTriangle size={13} className="text-amber-700" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs text-slate-700 leading-normal ${!notif.read ? "font-semibold" : ""}`}
                          >
                            {notif.text}
                          </p>
                          <span className="text-[10px] text-slate-500 font-medium block mt-1">
                            {notif.time}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notif.id);
                          }}
                          className="text-slate-500 hover:text-slate-500 opacity-0 group-hover:opacity-100 shrink-0 p-0.5 transition-all"
                          title="Remove notification"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-slate-500">
                      <p className="text-xs">No notifications here</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    View all activity
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 hover:bg-slate-100 hover:border-slate-300 focus:outline-none transition-all duration-200"
            aria-label="User profile menu"
          >
            {/* Small Avatar badge */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white uppercase shrink-0">
              {initials}
            </div>

            {/* Small screen role name details */}
            <div className="hidden lg:flex flex-col text-left pr-1.5">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || user?.firstName || "Staff Member"}
              </span>
              <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wide leading-none mt-0.5">
                {userRole}
              </span>
            </div>

            <ChevronDown size={12} className="text-slate-500 shrink-0 mr-0.5 hidden lg:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {/* User overview inside dropdown */}
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || user?.firstName || "Staff Member"}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold truncate leading-tight mt-0.5">
                  {user?.email}
                </p>
              </div>

              <div className="space-y-0.5">
                <Link
                  to={isSuperAdmin ? "/super-admin/profile" : "/profile"}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <User size={14} className="text-slate-500" />
                  <span>View Profile</span>
                </Link>

                {isSuperAdmin ? null : (
                  <Link
                    to={userRole === "TEACHER" ? "/teacher/settings" : "/settings"}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Settings size={14} className="text-slate-500" />
                    <span>Account Settings</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={14} className="text-red-600" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
