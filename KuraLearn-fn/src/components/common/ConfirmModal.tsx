import { useEffect, useRef } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
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

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useBodyLock(open);
  useEscape(open, onCancel);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
          />

          {/* Dialog Container */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md rounded-2xl border border-white/70 bg-white p-5 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                  danger ? "bg-red-50 text-red-650" : "bg-purple-50 text-[#6d3eeb]"
                }`}
              >
                {danger ? (
                  <AlertTriangle size={22} className="stroke-[2.5]" />
                ) : (
                  <Check size={22} className="stroke-[2.5]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
                {message ? (
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                    {message}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Close confirmation"
                onClick={onCancel}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4.5 text-xs font-bold text-slate-750 hover:border-slate-300 hover:bg-slate-50 hover:shadow-xs transition-all active:scale-97"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`h-10 rounded-xl px-4.5 text-xs font-bold text-white hover:shadow-md transition-all active:scale-97 ${
                  danger
                    ? "bg-red-600 hover:bg-red-700 hover:shadow-red-500/10"
                    : "bg-[#6d3eeb] hover:bg-[#5b31cb]"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
