import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/appStore";
import { dismissToast } from "@/store/uiSlice";

export function ToastViewport() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dispatch(dismissToast(toast.id)), 3600),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dispatch, toasts]);

  return (
    <div className="fixed left-4 right-4 top-4 z-[90] grid gap-2 sm:left-auto sm:w-[min(360px,calc(100vw-2rem))]">
      {toasts.map((toast) => (
        <button
          type="button"
          key={toast.id}
          onClick={() => dispatch(dismissToast(toast.id))}
          className={`rounded-lg px-4 py-3 text-left text-sm font-medium shadow-lg transition hover:-translate-x-1 ${
            toast.tone === "error"
              ? "bg-red-600 text-white"
              : toast.tone === "success"
                ? "bg-emerald-700 text-white"
                : "bg-slate-900 text-white"
          }`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
