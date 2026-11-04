import { ReactNode, useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function useBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}

function useEscape(active: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active]);
}

export function AppDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "max-w-2xl",
  size,
}: {
  open: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
}) {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    "2xl": "max-w-4xl",
    "3xl": "max-w-5xl",
    "4xl": "max-w-6xl",
    "5xl": "max-w-7xl",
    full: "max-w-full",
  };

  const resolvedWidth = size ? sizeClasses[size] : width;
  useBodyLock(open);
  useEscape(open, onClose);

  // Responsive checking (sm breakpoint: 640px)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
          />

          {/* Drawer Content */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`relative flex w-full flex-col bg-white shadow-lg border-white/70 ${resolvedWidth} ${
              isMobile
                ? "max-h-[92vh] min-h-[50vh] rounded-t-2xl border-t"
                : "h-full border-l rounded-l-2xl"
            }`}
          >
            {/* Header */}
            <header className="shrink-0 border-b border-slate-100 px-5 py-4.5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 id="drawer-title" className="text-lg font-bold text-slate-900 tracking-tight">
                    {title}
                  </h2>
                  {subtitle ? (
                    <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close drawer"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-150 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                >
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>
            </header>

            {/* Scrollable Content Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-10 sm:px-6 custom-scrollbar">
              {children}
            </div>

            {/* Footer */}
            {footer ? (
              <footer className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
                {footer}
              </footer>
            ) : null}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
