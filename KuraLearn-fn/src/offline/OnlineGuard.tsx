import { useOffline } from "./use-offline";

interface OnlineGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function OnlineGuard({ children, fallback }: OnlineGuardProps) {
  const { isOnline } = useOffline();

  if (!isOnline) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-amber-100 p-4">
          <svg
            className="h-8 w-8 text-amber-700"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414M3 3l18 18"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800">You are offline</h3>
        <p className="mt-1 text-sm text-slate-500">This feature requires an internet connection.</p>
      </div>
    );
  }

  return <>{children}</>;
}
